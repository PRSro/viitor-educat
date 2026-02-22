import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ArticleCategory } from '@prisma/client';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole, adminOnly, requireRole } from '../../core/middleware/permissionMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';
import { prisma } from '../../models/prisma.js';
import { articleService } from '../../services/articleService.js';
import DOMPurify from 'isomorphic-dompurify';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

// Rate limiting for import endpoint
const importRateLimits = new Map<string, { count: number; resetAt: number }>();
const IMPORT_RATE_LIMIT = 5; // 5 imports per minute
const IMPORT_RATE_WINDOW = 60 * 1000;

// Validation schemas
const articleCategoryEnum = z.enum([
  'MATH', 'SCIENCE', 'LITERATURE', 'HISTORY', 
  'COMPUTER_SCIENCE', 'ARTS', 'LANGUAGES', 'GENERAL'
]);

const createArticleSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  content: z.string().trim().min(1, 'Content is required').max(50000),
  excerpt: z.string().trim().max(500).optional(),
  category: articleCategoryEnum.optional().default('GENERAL'),
  tags: z.array(z.string()).optional().default([]),
  sourceUrl: z.string().url().optional().nullable(),
});

const updateArticleSchema = createArticleSchema.partial().extend({
  published: z.boolean().optional(),
});

const importArticleSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

const articleQuerySchema = z.object({
  category: articleCategoryEnum.optional(),
  teacherId: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

/**
 * Article Routes
 * 
 * Permissions:
 * - GET /articles - All authenticated users can view published articles
 * - GET /articles/:slug - View article details
 * - POST /articles - Teacher/Admin can create articles
 * - POST /articles/import - Teacher/Admin can import from whitelisted URLs
 * - PUT /articles/:id - Author/Admin can update
 * - DELETE /articles/:id - Author/Admin can delete
 */

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100) + '-' + Date.now().toString(36);
}

// Sanitize HTML content to prevent XSS
function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 
                   'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img',
                   'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'id', 'width', 'height', 
                   'border', 'cellpadding', 'cellspacing', 'style'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'], // Allow target attribute
  });
}

// URL validation for hyperlinks
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http, https, and internal app links
    return ['http:', 'https:'].includes(parsed.protocol) || url.startsWith('/');
  } catch {
    // Allow relative paths
    return url.startsWith('/') || url.startsWith('#');
  }
}

// Check if URL is from a whitelisted domain
async function isWhitelistedDomain(url: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    
    const whitelisted = await prisma.whitelistedDomain.findFirst({
      where: {
        OR: [
          { domain: hostname },
          { domain: `www.${hostname}` },
          { domain: parsedUrl.hostname }
        ]
      }
    });
    
    return !!whitelisted;
  } catch {
    return false;
  }
}

// Simple HTML to text extraction
function extractTextFromHtml(html: string): string {
  // Remove scripts and styles
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Replace tags with spaces
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"');
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// Extract title from HTML
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();
  
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();
  
  return 'Imported Article';
}

// Extract main content (simplified - looks for article, main, or body)
function extractMainContent(html: string): string {
  // Try to find article content
  let contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (contentMatch) return sanitizeContent(contentMatch[1]);
  
  // Try main tag
  contentMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (contentMatch) return sanitizeContent(contentMatch[1]);
  
  // Try div with content class
  contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (contentMatch) return sanitizeContent(contentMatch[1]);
  
  // Fallback to body
  contentMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (contentMatch) return sanitizeContent(contentMatch[1]);
  
  return sanitizeContent(html);
}

export async function articleRoutes(server: FastifyInstance) {
  
  /**
   * GET /articles
   * List all published articles with filtering and pagination
   */
  server.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = articleQuerySchema.parse(request.query);
      const { category, teacherId, tags, search, page, limit } = query;
      
      const where: any = { published: true };
      
      if (category) {
        where.category = category;
      }
      
      if (teacherId) {
        where.authorId = teacherId;
      }
      
      if (tags) {
        const tagArray = tags.split(',').map(t => t.trim());
        where.tags = { hasSome: tagArray };
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            category: true,
            tags: true,
            sourceUrl: true,
            createdAt: true,
            author: { select: { id: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.article.count({ where })
      ]);
      
      return { 
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error;
    }
  });

  /**
   * GET /articles/latest
   * Get latest articles for news feed (max 10)
   */
  server.get('/latest', {
    preHandler: [authMiddleware, anyRole]
  }, async () => {
    const articles = await prisma.article.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        tags: true,
        sourceUrl: true,
        createdAt: true,
        author: { select: { id: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    return { articles };
  });

  /**
   * GET /articles/teacher/:teacherId
   * Get articles by a specific teacher
   */
  server.get<{ Params: { teacherId: string }; Querystring: { page?: string; limit?: string } }>('/teacher/:teacherId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    try {
      const { teacherId } = request.params;
      const page = request.query.page ? parseInt(request.query.page) : 1;
      const limit = request.query.limit ? parseInt(request.query.limit) : 10;
        
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: { published: true, authorId: teacherId },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            category: true,
            tags: true,
            sourceUrl: true,
            createdAt: true,
            author: { select: { id: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.article.count({ where: { published: true, authorId: teacherId } })
      ]);
      
      return { 
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  });

  /**
   * GET /articles/categories
   * Get all available categories
   */
  server.get('/categories', {
    preHandler: [authMiddleware, anyRole]
  }, async () => {
    return { 
      categories: Object.values(ArticleCategory) 
    };
  });

  /**
   * GET /articles/:slug
   * Get article details by slug
   */
  server.get<{ Params: { slug: string } }>('/:slug', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    const { slug } = request.params;
    
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, email: true } }
      }
    });
    
    if (!article || !article.published) {
      return reply.status(404).send({ error: 'Article not found' });
    }
    
    return { article };
  });

  /**
   * POST /articles
   * Create a new article (Teacher/Admin)
   */
  server.post('/', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = createArticleSchema.parse(request.body);
      const user = getCurrentUser(request);
      
      const sanitizedContent = sanitizeContent(validated.content);
      
      const article = await articleService.create({
        title: validated.title,
        content: sanitizedContent,
        excerpt: validated.excerpt,
        category: validated.category,
        tags: validated.tags,
        sourceUrl: validated.sourceUrl,
        authorId: user.id
      });
      
      return reply.status(201).send({ 
        message: 'Article created successfully',
        article 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error;
    }
  });

  /**
   * POST /articles/import
   * Import article from external URL (Teacher/Admin only)
   * Rate limited and restricted to whitelisted domains
   */
  server.post('/import', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getCurrentUser(request).id;
      
      // Rate limiting
      const now = Date.now();
      const userLimit = importRateLimits.get(userId);
      
      if (userLimit) {
        if (now < userLimit.resetAt) {
          if (userLimit.count >= IMPORT_RATE_LIMIT) {
            return reply.status(429).send({ 
              error: 'Rate limit exceeded',
              message: `Maximum ${IMPORT_RATE_LIMIT} imports per minute. Try again later.`
            });
          }
          userLimit.count++;
        } else {
          importRateLimits.set(userId, { count: 1, resetAt: now + IMPORT_RATE_WINDOW });
        }
      } else {
        importRateLimits.set(userId, { count: 1, resetAt: now + IMPORT_RATE_WINDOW });
      }
      
      const validated = importArticleSchema.parse(request.body);
      const { url } = validated;
      
      // Validate URL is from whitelisted domain
      const isWhitelisted = await isWhitelistedDomain(url);
      if (!isWhitelisted) {
        return reply.status(403).send({ 
          error: 'Domain not whitelisted',
          message: 'Articles can only be imported from approved educational domains'
        });
      }
      
      // Fetch the page with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      let html: string;
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'EducationalPlatform/1.0 (Article Import Bot)'
          }
        });
        
        if (!response.ok) {
          return reply.status(400).send({ 
            error: 'Failed to fetch URL',
            message: `Server returned ${response.status}`
          });
        }
        
        html = await response.text();
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          return reply.status(408).send({ 
            error: 'Request timeout',
            message: 'The URL took too long to respond'
          });
        }
        throw fetchError;
      } finally {
        clearTimeout(timeout);
      }
      
      // Extract and sanitize content
      const title = extractTitle(html);
      const content = extractMainContent(html);
      const excerpt = extractTextFromHtml(content).slice(0, 300);
      
      // Create article
      const article = await prisma.article.create({
        data: {
          title: sanitizeContent(title),
          slug: generateSlug(title),
          content,
          excerpt,
          sourceUrl: url,
          category: 'GENERAL',
          authorId: userId
        },
        include: {
          author: { select: { id: true, email: true } }
        }
      });
      
      return reply.status(201).send({ 
        message: 'Article imported successfully',
        article 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error;
    }
  });

  /**
   * PUT /articles/:id
   * Update an article (Author/Admin only)
   */
  server.put<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const validated = updateArticleSchema.parse(request.body);
      const user = getCurrentUser(request);
      
      const data: any = { ...validated };
      if (validated.content) {
        data.content = sanitizeContent(validated.content);
      }
      
      const article = await articleService.update(id, data, user.id, user.role);
      
      return { message: 'Article updated successfully', article };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      if (error.message === 'NOT_FOUND') {
        return reply.status(404).send({ error: 'Article not found' });
      }
      if (error.message === 'FORBIDDEN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only update your own articles'
        });
      }
      throw error;
    }
  });

  /**
   * DELETE /articles/:id
   * Delete an article (Author/Admin only)
   */
  server.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = getCurrentUser(request);
      
      await articleService.delete(id, user.id, user.role);
      
      return { message: 'Article deleted successfully' };
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        return reply.status(404).send({ error: 'Article not found' });
      }
      if (error.message === 'FORBIDDEN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only delete your own articles'
        });
      }
      throw error;
    }
  });

  /**
   * GET /articles/admin/whitelist
   * Get whitelisted domains (Admin only)
   */
  server.get('/admin/whitelist', {
    preHandler: [authMiddleware, adminOnly]
  }, async () => {
    const domains = await prisma.whitelistedDomain.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { domains };
  });

  /**
   * POST /articles/admin/whitelist
   * Add domain to whitelist (Admin only)
   */
  server.post('/admin/whitelist', {
    preHandler: [authMiddleware, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      domain: z.string().min(1).max(255),
      name: z.string().max(255).optional()
    });
    
    try {
      const { domain, name } = schema.parse(request.body);
      
      const whitelisted = await prisma.whitelistedDomain.create({
        data: { domain: domain.toLowerCase(), name }
      });
      
      return reply.status(201).send({ 
        message: 'Domain added to whitelist',
        domain: whitelisted 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error;
    }
  });
}
