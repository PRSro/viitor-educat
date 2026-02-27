/**
 * Search Routes
 * Full-text search with PostgreSQL to_tsvector and to_tsquery
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { prisma } from '../../models/prisma.js';
import { redisService } from '../../core/services/redisService.js';

interface SearchQuery {
  q?: string;
  type?: string;
  limit?: string;
  category?: string;
  level?: string;
  tags?: string;
  teacherId?: string;
}

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const SUGGESTIONS_CACHE_TTL = 60;
const SUGGESTIONS_RATE_LIMIT = 30;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function sanitizeSearchQuery(input: string): string {
  return input.replace(/[&|!():*\\]/g, ' ').trim().replace(/\s+/g, ' ');
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (record.count >= SUGGESTIONS_RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function searchRoutes(fastify: FastifyInstance) {

  /**
   * GET /search
   * Full-text search with filters
   */
  fastify.get('/', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { q, type, limit, category, level, tags, teacherId } = request.query as SearchQuery;

    const limitNum = Math.min(parseInt(limit || '20'), 50);

    if (!q && !category && !level && !tags && !teacherId) {
      return reply.status(400).send({ error: 'At least one search parameter is required' });
    }

    if (q && (q.length < MIN_QUERY_LENGTH || q.length > MAX_QUERY_LENGTH)) {
      return reply.status(400).send({ 
        error: `Query must be between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters` 
      });
    }

    const sanitizedQuery = q ? sanitizeSearchQuery(q) : '';
    const searchType = type || 'all';

    const results: {
      courses: any[];
      articles: any[];
      lessons: any[];
      resources: any[];
      teachers: any[];
    } = {
      courses: [],
      articles: [],
      lessons: [],
      resources: [],
      teachers: []
    };

    try {
      // Build category filter for courses
      const categoryFilter = category ? true : false;

      // Search courses
      if (searchType === 'all' || searchType === 'courses') {
        let courseQuery = '';
        const courseParams: any[] = [];
        let paramIndex = 1;

        if (sanitizedQuery) {
          courseQuery = `
            SELECT c.id, c.title, c.description, c.image_url as "imageUrl", c.level, c.category, c.tags,
                   ts_rank(c.search_vector, to_tsquery('romanian', $1)) as rank,
                   u.id as "teacherId", u.email as "teacherEmail"
            FROM "Course" c
            JOIN "User" u ON c."teacherId" = u.id
            WHERE c.published = true 
              AND c.search_vector @@ to_tsquery('romanian', $${paramIndex})
          `;
          courseParams.push(sanitizedQuery);
          paramIndex++;
        } else {
          courseQuery = `
            SELECT c.id, c.title, c.description, c.image_url as "imageUrl", c.level, c.category, c.tags,
                   0 as rank,
                   u.id as "teacherId", u.email as "teacherEmail"
            FROM "Course" c
            JOIN "User" u ON c."teacherId" = u.id
            WHERE c.published = true
          `;
        }

        if (category) {
          courseQuery += ` AND c.category = $${paramIndex}`;
          courseParams.push(category);
          paramIndex++;
        }

        if (level) {
          courseQuery += ` AND c.level = $${paramIndex}`;
          courseParams.push(level);
          paramIndex++;
        }

        if (teacherId) {
          courseQuery += ` AND c."teacherId" = $${paramIndex}`;
          courseParams.push(teacherId);
          paramIndex++;
        }

        courseQuery += sanitizedQuery 
          ? ` ORDER BY rank DESC NULLS LAST, c."createdAt" DESC LIMIT $${paramIndex}`
          : ` ORDER BY c."createdAt" DESC LIMIT $${paramIndex}`;
        courseParams.push(limitNum);

        const courses = await prisma.$queryRawUnsafe<any[]>(courseQuery, ...courseParams);
        results.courses = courses;
      }

      // Search lessons
      if (searchType === 'all' || searchType === 'lessons') {
        let lessonQuery = '';
        const lessonParams: any[] = [];
        let paramIndex = 1;

        if (sanitizedQuery) {
          lessonQuery = `
            SELECT l.id, l.title, l.description, l.order,
                   ts_rank(l.search_vector, to_tsquery('romanian', $1)) as rank,
                   u.id as "teacherId", u.email as "teacherEmail"
            FROM "Lesson" l
            JOIN "User" u ON l."teacherId" = u.id
            WHERE l.status = 'PUBLIC'
              AND l.search_vector @@ to_tsquery('romanian', $${paramIndex})
          `;
          lessonParams.push(sanitizedQuery);
          paramIndex++;
        } else {
          lessonQuery = `
            SELECT l.id, l.title, l.description, l.order,
                   0 as rank,
                   u.id as "teacherId", u.email as "teacherEmail"
            FROM "Lesson" l
            JOIN "User" u ON l."teacherId" = u.id
            WHERE l.status = 'PUBLIC'
          `;
        }

        if (teacherId) {
          lessonQuery += ` AND l."teacherId" = $${paramIndex}`;
          lessonParams.push(teacherId);
          paramIndex++;
        }

        lessonQuery += sanitizedQuery 
          ? ` ORDER BY rank DESC NULLS LAST, l."createdAt" DESC LIMIT $${paramIndex}`
          : ` ORDER BY l."createdAt" DESC LIMIT $${paramIndex}`;
        lessonParams.push(limitNum);

        const lessons = await prisma.$queryRawUnsafe<any[]>(lessonQuery, ...lessonParams);
        results.lessons = lessons;
      }

      // Search articles
      if (searchType === 'all' || searchType === 'articles') {
        let articleQuery = '';
        const articleParams: any[] = [];
        let paramIndex = 1;

        if (sanitizedQuery) {
          articleQuery = `
            SELECT a.id, a.title, a.slug, a.excerpt, a.category,
                   ts_rank(a.search_vector, to_tsquery('romanian', $1)) as rank,
                   u.id as "authorId", u.email as "authorEmail"
            FROM "Article" a
            JOIN "User" u ON a."authorId" = u.id
            WHERE a.published = true
              AND a.search_vector @@ to_tsquery('romanian', $${paramIndex})
          `;
          articleParams.push(sanitizedQuery);
          paramIndex++;
        } else {
          articleQuery = `
            SELECT a.id, a.title, a.slug, a.excerpt, a.category,
                   0 as rank,
                   u.id as "authorId", u.email as "authorEmail"
            FROM "Article" a
            JOIN "User" u ON a."authorId" = u.id
            WHERE a.published = true
          `;
        }

        if (category && searchType === 'articles') {
          articleQuery += ` AND a.category = $${paramIndex}`;
          articleParams.push(category);
          paramIndex++;
        }

        articleQuery += sanitizedQuery 
          ? ` ORDER BY rank DESC NULLS LAST, a."createdAt" DESC LIMIT $${paramIndex}`
          : ` ORDER BY a."createdAt" DESC LIMIT $${paramIndex}`;
        articleParams.push(limitNum);

        const articles = await prisma.$queryRawUnsafe<any[]>(articleQuery, ...articleParams);
        results.articles = articles;
      }

      // Search teachers
      if (searchType === 'all' || searchType === 'teachers') {
        const teachersWhere: any = { role: 'TEACHER' };

        if (sanitizedQuery) {
          teachersWhere.AND = {
            OR: [
              { email: { contains: sanitizedQuery, mode: 'insensitive' } },
              { teacherProfile: { bio: { contains: sanitizedQuery, mode: 'insensitive' } } }
            ]
          };
        }

        const teachers = await prisma.user.findMany({
          where: teachersWhere,
          select: {
            id: true,
            email: true,
            teacherProfile: true,
            courses: {
              where: { published: true },
              select: {
                id: true,
                title: true,
                slug: true,
                _count: { select: { lessons: true, enrollments: true } }
              }
            }
          },
          take: limitNum
        });
        results.teachers = teachers;
      }

      return {
        success: true,
        query: q,
        filters: { category, level, tags, teacherId },
        results
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Search failed' });
    }
  });

  /**
   * GET /search/suggestions
   * Autocomplete with caching and rate limiting
   */
  fastify.get('/suggestions', async (request, reply) => {
    const { q, limit: limitParam } = request.query as { q?: string; limit?: string };
    const clientIp = request.ip || 'unknown';

    if (!checkRateLimit(`suggestions:${clientIp}`)) {
      return reply.status(429).send({ error: 'Too many requests. Please try again later.' });
    }

    if (!q) {
      return reply.status(400).send({ error: 'Query parameter q is required' });
    }

    const sanitized = sanitizeSearchQuery(q);
    if (sanitized.length < MIN_QUERY_LENGTH) {
      return { suggestions: { courses: [], lessons: [], articles: [] } };
    }

    const limit = Math.min(parseInt(limitParam || '5'), 10);
    const cacheKey = `search:suggestions:${sanitized}`;

    try {
      const cached = await redisService.get<any>(cacheKey);
      if (cached) {
        return cached;
      }

      const [courses, lessons, articles] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`
          SELECT id, title, slug
          FROM "Course"
          WHERE published = true 
            AND search_vector @@ to_tsquery('romanian', $1)
          ORDER BY ts_rank(search_vector, to_tsquery('romanian', $1)) DESC
          LIMIT $2
        `, sanitized, limit),
        
        prisma.$queryRawUnsafe<any[]>(`
          SELECT id, title
          FROM "Lesson"
          WHERE status = 'PUBLIC'
            AND search_vector @@ to_tsquery('romanian', $1)
          ORDER BY ts_rank(search_vector, to_tsquery('romanian', $1)) DESC
          LIMIT $2
        `, sanitized, limit),

        prisma.$queryRawUnsafe<any[]>(`
          SELECT id, title, slug
          FROM "Article"
          WHERE published = true
            AND search_vector @@ to_tsquery('romanian', $1)
          ORDER BY ts_rank(search_vector, to_tsquery('romanian', $1)) DESC
          LIMIT $2
        `, sanitized, limit)
      ]);

      const result = {
        suggestions: {
          courses: courses.map(c => ({ type: 'course', id: c.id, title: c.title, slug: c.slug })),
          lessons: lessons.map(l => ({ type: 'lesson', id: l.id, title: l.title })),
          articles: articles.map(a => ({ type: 'article', id: a.id, title: a.title, slug: a.slug }))
        }
      };

      await redisService.set(cacheKey, result, SUGGESTIONS_CACHE_TTL);

      return result;
    } catch (error) {
      request.log.error(error);
      return { suggestions: { courses: [], lessons: [], articles: [] } };
    }
  });

  /**
   * GET /search/filters
   * Get available filter options
   */
  fastify.get('/filters', async (request, reply) => {
    try {
      const [courseCategories, courseLevels, articleCategories] = await Promise.all([
        prisma.course.findMany({
          where: { published: true },
          select: { category: true },
          distinct: ['category']
        }),
        prisma.course.findMany({
          where: { published: true },
          select: { level: true },
          distinct: ['level']
        }),
        prisma.article.findMany({
          where: { published: true },
          select: { category: true },
          distinct: ['category']
        })
      ]);

      return {
        success: true,
        filters: {
          courseCategories: courseCategories.map(c => c.category).filter(Boolean),
          courseLevels: courseLevels.map(l => l.level),
          articleCategories: articleCategories.map(a => a.category)
        }
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to get filters' });
    }
  });
}
