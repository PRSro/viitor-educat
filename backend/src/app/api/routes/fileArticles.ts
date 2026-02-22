import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { anyRole, requireRole } from '../../core/middleware/permissionMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';
import { fileArticleService } from '../../articles/articleService.js';
import { 
  validateArticleInput, 
  sanitizeSlug, 
  isValidSlug, 
  checkRateLimit 
} from '../../articles/security.js';
import { auditLogger, logArticleAction } from '../../articles/auditLogger.js';
import { articleSyncService } from '../../articles/syncService.js';
import { jobs } from '../../articles/backgroundJobs.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const createFileArticleSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  published: z.boolean().optional(),
});

const updateFileArticleSchema = createFileArticleSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  authorId: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  published: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
});

interface ArticleParams {
  slug: string;
}

interface VersionParams extends ArticleParams {
  version: string;
}

function generateSlug(title: string): string {
  const baseSlug = sanitizeSlug(title);
  return `${baseSlug}-${Date.now().toString(36)}`;
}

function sendResponse(reply: FastifyReply, result: any): FastifyReply {
  if (result.success) {
    return reply.send({ success: true, data: result.data });
  }
  
  const statusCodes: Record<string, number> = {
    VALIDATION_ERROR: 400,
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    RATE_LIMIT_EXCEEDED: 429,
    WRITE_ERROR: 500,
    UPDATE_ERROR: 500,
    DELETE_ERROR: 500,
  };
  
  const statusCode = statusCodes[result.errorCode] || 500;
  return reply.status(statusCode).send({
    success: false,
    errorCode: result.errorCode,
    message: result.message
  });
}

export async function fileArticleRoutes(server: FastifyInstance) {
  await fileArticleService.init();

  /**
   * GET /file-articles
   * List all file-based articles with filtering and pagination
   */
  server.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listQuerySchema.parse(request.query);
      const user = getCurrentUser(request);
      
      const filters: any = {};
      
      // STUDENT: can only see published
      if (user.role === 'STUDENT') {
        filters.published = true;
      }
      
      if (query.authorId) filters.authorId = query.authorId;
      if (query.category) filters.category = query.category;
      if (query.status) filters.status = query.status;
      if (query.published !== undefined) filters.published = query.published;
      if (query.search) filters.search = query.search;
      
      const result = await fileArticleService.findAll(filters, {
        page: query.page,
        limit: query.limit
      });
      
      auditLogger.info('LIST', 'Articles listed', { 
        userId: user.id, 
        filters: Object.keys(filters),
        count: result.data.length 
      });
      
      return { success: true, data: result.data, pagination: result.pagination };
    } catch (error) {
      auditLogger.error('LIST_ERROR', 'Failed to list articles', { error: String(error) });
      return reply.status(500).send({ success: false, errorCode: 'INTERNAL_ERROR', message: 'Failed to fetch articles' });
    }
  });

  /**
   * GET /file-articles/:slug
   * Get article by slug
   */
  server.get<{ Params: ArticleParams }>('/:slug', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: ArticleParams }>, reply: FastifyReply) => {
    const { slug } = request.params;
    const user = getCurrentUser(request);
    
    // Validate slug to prevent path traversal
    if (!isValidSlug(slug)) {
      auditLogger.warn('INVALID_SLUG', `Invalid slug attempted: ${slug}`, { userId: user.id });
      return reply.status(400).send({ success: false, errorCode: 'VALIDATION_ERROR', message: 'Invalid slug format' });
    }
    
    const result = await fileArticleService.findBySlug(slug);
    
    if (!result) {
      return reply.status(404).send({ success: false, errorCode: 'NOT_FOUND', message: 'Article not found' });
    }
    
    const isOwner = result.authorId === user.id;
    const isAdmin = user.role === 'ADMIN';
    const isPublished = result.published;
    
    if (!isPublished && !isOwner && !isAdmin) {
      return reply.status(404).send({ success: false, errorCode: 'NOT_FOUND', message: 'Article not found' });
    }
    
    return { success: true, data: result };
  });

  /**
   * POST /file-articles
   * Create a new file-based article
   */
  server.post('/', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Rate limiting for write operations
      const user = getCurrentUser(request);
      const rateLimit = checkRateLimit(`write_${user.id}`, 10, 60000);
      
      if (!rateLimit.allowed) {
        auditLogger.warn('RATE_LIMIT', 'Rate limit exceeded', { userId: user.id, action: 'CREATE' });
        return reply.status(429).send({ 
          success: false, 
          errorCode: 'RATE_LIMIT_EXCEEDED', 
          message: `Too many requests. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds` 
        });
      }
      
      const validated = createFileArticleSchema.parse(request.body);
      
      // Validate using security helper
      const validation = validateArticleInput({
        title: validated.title,
        content: validated.content,
        excerpt: validated.excerpt,
        authorId: user.id,
        sourceUrl: validated.sourceUrl
      });
      
      if (!validation.valid) {
        logArticleAction('VALIDATION_ERROR', user.id, 'new', { errors: validation.errors });
        return reply.status(400).send({ 
          success: false, 
          errorCode: 'VALIDATION_ERROR', 
          message: validation.errors.join('; ') 
        });
      }
      
      const slug = generateSlug(validation.sanitized.title);
      
      const exists = await fileArticleService.exists(slug);
      if (exists) {
        return reply.status(409).send({ success: false, errorCode: 'CONFLICT', message: 'Article with this title already exists' });
      }
      
      const saveResult = await fileArticleService.save({
        id: `article_${Date.now()}`,
        title: validation.sanitized.title,
        slug,
        content: validation.sanitized.content,
        excerpt: validation.sanitized.excerpt,
        category: validated.category,
        tags: validated.tags || [],
        sourceUrl: validation.sanitized.sourceUrl,
        authorId: user.id,
        published: validated.published || false,
        status: (validated.published || false) ? 'published' : 'draft',
        createdAt: new Date().toISOString()
      });
      
      if (saveResult.success) {
        logArticleAction('CREATE', user.id, slug, { 
          title: validation.sanitized.title,
          published: validated.published 
        });
        
        // Sync to database in background
        if (saveResult.data) {
          jobs.syncDatabase().catch(console.error);
        }
      }
      
      return sendResponse(reply, saveResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          success: false,
          errorCode: 'VALIDATION_ERROR',
          message: formatZodError(error)
        });
      }
      auditLogger.error('CREATE_ERROR', 'Failed to create article', { error: String(error) });
      return reply.status(500).send({ success: false, errorCode: 'INTERNAL_ERROR', message: 'Failed to create article' });
    }
  });

  /**
   * PUT /file-articles/:slug
   * Update a file-based article
   */
  server.put<{ Params: ArticleParams }>('/:slug', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: ArticleParams }>, reply: FastifyReply) => {
    try {
      const { slug } = request.params;
      const user = getCurrentUser(request);
      
      // Rate limiting
      const rateLimit = checkRateLimit(`write_${user.id}`, 10, 60000);
      if (!rateLimit.allowed) {
        return reply.status(429).send({ success: false, errorCode: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' });
      }
      
      // Validate slug
      if (!isValidSlug(slug)) {
        return reply.status(400).send({ success: false, errorCode: 'VALIDATION_ERROR', message: 'Invalid slug' });
      }
      
      const validated = updateFileArticleSchema.parse(request.body);
      
      const existing = await fileArticleService.findBySlug(slug);
      if (!existing) {
        return reply.status(404).send({ success: false, errorCode: 'NOT_FOUND', message: 'Article not found' });
      }
      
      // RBAC check
      if (existing.authorId !== user.id && user.role !== 'ADMIN') {
        logArticleAction('PERMISSION_DENIED', user.id, slug, { action: 'UPDATE', reason: 'not_owner' });
        return reply.status(403).send({ success: false, errorCode: 'FORBIDDEN', message: 'You can only update your own articles' });
      }
      
      // Validate content if provided
      let validation;
      if (validated.content) {
        validation = validateArticleInput({
          title: validated.title || existing.title,
          content: validated.content,
          authorId: user.id
        });
        
        if (!validation.valid) {
          return reply.status(400).send({ 
            success: false, 
            errorCode: 'VALIDATION_ERROR', 
            message: validation.errors.join('; ') 
          });
        }
      }
      
      const data: any = { ...validated };
      if (validation?.sanitized) {
        data.content = validation.sanitized.content;
        if (validation.sanitized.title !== existing.title) {
          data.title = validation.sanitized.title;
        }
      }
      
      const result = await fileArticleService.update(slug, data);
      
      if (result.success) {
        logArticleAction('UPDATE', user.id, slug, { 
          oldVersion: existing.metadata?.version,
          newVersion: result.data?.metadata?.version 
        });
      }
      
      return sendResponse(reply, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, errorCode: 'VALIDATION_ERROR', message: formatZodError(error) });
      }
      auditLogger.error('UPDATE_ERROR', 'Failed to update article', { error: String(error) });
      return reply.status(500).send({ success: false, errorCode: 'INTERNAL_ERROR', message: 'Failed to update article' });
    }
  });

  /**
   * DELETE /file-articles/:slug
   * Delete a file-based article
   */
  server.delete<{ Params: ArticleParams }>('/:slug', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: ArticleParams }>, reply: FastifyReply) => {
    const { slug } = request.params;
    const user = getCurrentUser(request);
    
    // Rate limiting
    const rateLimit = checkRateLimit(`write_${user.id}`, 10, 60000);
    if (!rateLimit.allowed) {
      return reply.status(429).send({ success: false, errorCode: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' });
    }
    
    if (!isValidSlug(slug)) {
      return reply.status(400).send({ success: false, errorCode: 'VALIDATION_ERROR', message: 'Invalid slug' });
    }
    
    const existing = await fileArticleService.findBySlug(slug);
    if (!existing) {
      return reply.status(404).send({ success: false, errorCode: 'NOT_FOUND', message: 'Article not found' });
    }
    
    if (existing.authorId !== user.id && user.role !== 'ADMIN') {
      logArticleAction('PERMISSION_DENIED', user.id, slug, { action: 'DELETE' });
      return reply.status(403).send({ success: false, errorCode: 'FORBIDDEN', message: 'You can only delete your own articles' });
    }
    
    const result = await fileArticleService.delete(slug);
    
    if (result.success) {
      logArticleAction('DELETE', user.id, slug, { title: existing.title });
    }
    
    return sendResponse(reply, result);
  });

  /**
   * GET /file-articles/:slug/paths
   * Get article paths
   */
  server.get<{ Params: ArticleParams }>('/:slug/paths', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: ArticleParams }>, reply: FastifyReply) => {
    const { slug } = request.params;
    const user = getCurrentUser(request);
    
    if (!isValidSlug(slug)) {
      return reply.status(400).send({ success: false, errorCode: 'VALIDATION_ERROR', message: 'Invalid slug' });
    }
    
    const article = await fileArticleService.findBySlug(slug);
    
    if (!article) {
      return reply.status(404).send({ success: false, errorCode: 'NOT_FOUND', message: 'Article not found' });
    }
    
    const isOwner = article.authorId === user.id;
    const isAdmin = user.role === 'ADMIN';
    
    if (!article.published && !isOwner && !isAdmin) {
      return reply.status(404).send({ success: false, errorCode: 'NOT_FOUND', message: 'Article not found' });
    }
    
    return { success: true, data: article.paths };
  });

  /**
   * GET /file-articles/:slug/history
   * Get article version history
   */
  server.get<{ Params: ArticleParams }>('/:slug/history', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: ArticleParams }>, reply: FastifyReply) => {
    const { slug } = request.params;
    const user = getCurrentUser(request);
    
    if (!isValidSlug(slug)) {
      return reply.status(400).send({ success: false, errorCode: 'VALIDATION_ERROR', message: 'Invalid slug' });
    }
    
    const existing = await fileArticleService.findBySlug(slug);
    if (!existing) {
      return reply.status(404).send({ success: false, errorCode: 'NOT_FOUND', message: 'Article not found' });
    }
    
    if (existing.authorId !== user.id && user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, errorCode: 'FORBIDDEN', message: 'Access denied' });
    }
    
    const result = await fileArticleService.getHistory(slug);
    return sendResponse(reply, result);
  });

  /**
   * POST /file-articles/:slug/restore/:version
   * Restore article to a previous version
   */
  server.post<{ Params: VersionParams }>('/:slug/restore/:version', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: VersionParams }>, reply: FastifyReply) => {
    const { slug, version } = request.params;
    const user = getCurrentUser(request);
    
    if (!isValidSlug(slug)) {
      return reply.status(400).send({ success: false, errorCode: 'VALIDATION_ERROR', message: 'Invalid slug' });
    }
    
    const existing = await fileArticleService.findBySlug(slug);
    if (!existing) {
      return reply.status(404).send({ success: false, errorCode: 'NOT_FOUND', message: 'Article not found' });
    }
    
    if (existing.authorId !== user.id && user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, errorCode: 'FORBIDDEN', message: 'Access denied' });
    }
    
    const versionNum = parseInt(version, 10);
    if (isNaN(versionNum)) {
      return reply.status(400).send({ success: false, errorCode: 'VALIDATION_ERROR', message: 'Invalid version number' });
    }
    
    const result = await fileArticleService.restoreVersion(slug, versionNum);
    
    if (result.success) {
      logArticleAction('RESTORE', user.id, slug, { version: versionNum });
    }
    
    return sendResponse(reply, result);
  });

  /**
   * GET /file-articles/:slug/audit
   * Get article audit log
   */
  server.get<{ Params: ArticleParams }>('/:slug/audit', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: ArticleParams }>, reply: FastifyReply) => {
    const { slug } = request.params;
    const user = getCurrentUser(request);
    
    if (!isValidSlug(slug)) {
      return reply.status(400).send({ success: false, errorCode: 'VALIDATION_ERROR', message: 'Invalid slug' });
    }
    
    const existing = await fileArticleService.findBySlug(slug);
    if (!existing) {
      return reply.status(404).send({ success: false, errorCode: 'NOT_FOUND', message: 'Article not found' });
    }
    
    if (existing.authorId !== user.id && user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, errorCode: 'FORBIDDEN', message: 'Access denied' });
    }
    
    // Get audit logs for this article
    const logs = auditLogger.getLogs({ action: slug });
    
    return { success: true, data: logs };
  });
}
