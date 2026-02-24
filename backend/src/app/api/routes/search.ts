/**
 * Search Routes
 * Global search across courses, articles, and resources with server-side filtering
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { prisma } from '../../models/prisma.js';

interface SearchQuery {
  q?: string;
  type?: string;
  limit?: string;
  category?: string;
  level?: string;
  tags?: string;
  teacherId?: string;
}

export async function searchRoutes(fastify: FastifyInstance) {

  /**
   * GET /search
   * Global search with server-side filtering
   */
  fastify.get<{ Querystring: SearchQuery }>('/', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest<{ Querystring: SearchQuery }>, reply: FastifyReply) => {
    const { q, type, limit, category, level, tags, teacherId } = request.query;

    if (!q && !category && !level && !tags && !teacherId) {
      return reply.status(400).send({ error: 'At least one search parameter is required' });
    }

    const limitNum = Math.min(parseInt(limit || '20'), 50);
    const searchTerm = q?.toLowerCase() || '';
    const searchType = type || 'all';

    const results: {
      courses: any[];
      articles: any[];
      resources: any[];
      teachers: any[];
    } = {
      courses: [],
      articles: [],
      resources: [],
      teachers: []
    };

    try {
      // Build category filter
      const categoryFilter = category ? { category } : undefined;

      // Build level filter
      const levelFilter = level ? { level: level as any } : undefined;

      // Build tags filter
      const tagsFilter = tags ? { hasSome: tags.split(',') } : undefined;

      // Build teacher filter
      const teacherFilter = teacherId ? { teacherId } : undefined;

      // Search courses (only published)
      if (searchType === 'all' || searchType === 'courses') {
        const coursesWhere: any = {
          published: true,
          AND: []
        };

        if (searchTerm) {
          coursesWhere.AND.push({
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } }
            ]
          });
        }

        if (categoryFilter) {
          coursesWhere.AND.push(categoryFilter);
        }

        if (levelFilter) {
          coursesWhere.AND.push(levelFilter);
        }

        if (tagsFilter) {
          coursesWhere.AND.push({ tags: tagsFilter });
        }

        if (teacherFilter) {
          coursesWhere.AND.push(teacherFilter);
        }

        // If no AND conditions, remove the AND array
        if (coursesWhere.AND.length === 0) {
          delete coursesWhere.AND;
        }

        const courses = await prisma.course.findMany({
          where: coursesWhere,
          include: {
            teacher: {
              include: {
                teacherProfile: true
              }
            },
            _count: {
              select: { lessons: true, enrollments: true }
            }
          },
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        });
        results.courses = courses;
      }

      // Search teachers
      if (searchType === 'all' || searchType === 'teachers') {
        const teachersWhere: any = {
          role: 'TEACHER'
        };

        if (searchTerm) {
          teachersWhere.AND = {
            OR: [
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { teacherProfile: { bio: { contains: searchTerm, mode: 'insensitive' } } }
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

      // Search articles
      if (searchType === 'all' || searchType === 'articles') {
        const articlesWhere: any = {
          published: true
        };

        if (searchTerm) {
          articlesWhere.AND = {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { content: { contains: searchTerm, mode: 'insensitive' } },
              { excerpt: { contains: searchTerm, mode: 'insensitive' } }
            ]
          };
        }

        if (categoryFilter) {
          articlesWhere.AND = articlesWhere.AND
            ? { AND: [articlesWhere.AND, categoryFilter] }
            : categoryFilter;
        }

        const articles = await prisma.article.findMany({
          where: articlesWhere,
          include: {
            author: true
          },
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        });
        results.articles = articles;
      }

      // Search resources
      if (searchType === 'all' || searchType === 'resources') {
        const resourcesWhere: any = {};

        if (searchTerm) {
          resourcesWhere.AND = {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } }
            ]
          };
        }

        const resources = await prisma.externalResource.findMany({
          where: resourcesWhere,
          include: {
            courses: true,
            teacher: true
          },
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        });
        results.resources = resources;
      }

      return {
        success: true,
        query: q,
        filters: {
          category,
          level,
          tags,
          teacherId
        },
        results
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Search failed' });
    }
  });

  /**
   * GET /search/suggestions
   * Get search suggestions (autocomplete)
   */
  fastify.get('/suggestions', async (request, reply) => {
    const { q } = request.query as { q?: string };

    if (!q) {
      return reply.status(400).send({ error: 'Query parameter q is required' });
    }

    const searchTerm = q.toLowerCase();

    try {
      const [courses, teachers, articles] = await Promise.all([
        prisma.course.findMany({
          where: {
            AND: [
              { published: true },
              { title: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          select: { id: true, title: true, slug: true },
          take: 5
        }),
        prisma.user.findMany({
          where: {
            role: 'TEACHER',
            OR: [
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { teacherProfile: { bio: { contains: searchTerm, mode: 'insensitive' } } }
            ]
          },
          select: { id: true, email: true },
          take: 5
        }),
        prisma.article.findMany({
          where: {
            published: true,
            title: { contains: searchTerm, mode: 'insensitive' }
          },
          select: { id: true, title: true, slug: true },
          take: 5
        })
      ]);

      return {
        success: true,
        suggestions: {
          courses: courses.map(c => ({ type: 'course', id: c.id, title: c.title, slug: c.slug })),
          teachers: teachers.map(t => ({ type: 'teacher', id: t.id, name: t.email.split('@')[0] })),
          articles: articles.map(a => ({ type: 'article', id: a.id, title: a.title, slug: a.slug }))
        }
      };
    } catch (error) {
      request.log.error(error);
      return { error: 'Failed to get suggestions' };
    }
  });

  /**
   * GET /search/filters
   * Get available filter options
   */
  fastify.get('/filters', async (request, reply) => {
    try {
      // Get unique categories from courses
      const courseCategories = await prisma.course.findMany({
        where: { published: true },
        select: { category: true },
        distinct: ['category']
      });

      // Get unique tags from courses
      const coursesWithTags = await prisma.course.findMany({
        where: {
          published: true,
          tags: { isEmpty: false }
        },
        select: { tags: true }
      });

      const allTags = new Set<string>();
      coursesWithTags.forEach(c => c.tags.forEach(t => allTags.add(t)));

      // Get unique levels from courses
      const courseLevels = await prisma.course.findMany({
        where: { published: true },
        select: { level: true },
        distinct: ['level']
      });

      return {
        success: true,
        filters: {
          categories: courseCategories.map(c => c.category).filter(Boolean),
          tags: Array.from(allTags),
          levels: courseLevels.map(l => l.level)
        }
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to get filters' });
    }
  });
}
