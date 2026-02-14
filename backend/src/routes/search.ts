/**
 * Search Routes
 * Global search across courses, articles, and resources
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function searchRoutes(fastify: FastifyInstance) {
  // Global search endpoint
  fastify.get('/', async (request, reply) => {
    const { q, type, limit } = request.query as { q?: string; type?: string; limit?: string };
    
    if (!q) {
      return reply.status(400).send({ error: 'Query parameter q is required' });
    }

    const searchTerm = q.toLowerCase();
    const limitNum = Math.min(parseInt(limit || '20'), 50);
    const searchType = type || 'all';
    
    const results: {
      courses: any[];
      articles: any[];
      resources: any[];
    } = {
      courses: [],
      articles: [],
      resources: []
    };

    try {
      // Search courses (only published)
      if (searchType === 'all' || searchType === 'courses') {
        const courses = await prisma.course.findMany({
          where: {
            AND: [
              { published: true },
              {
                OR: [
                  { title: { contains: searchTerm, mode: 'insensitive' } },
                  { description: { contains: searchTerm, mode: 'insensitive' } }
                ]
              }
            ]
          },
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
          take: limitNum
        });
        results.courses = courses;
      }

      // Search articles
      if (searchType === 'all' || searchType === 'articles') {
        const articles = await prisma.article.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { content: { contains: searchTerm, mode: 'insensitive' } },
              { excerpt: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          include: {
            author: true
          },
          take: limitNum
        });
        results.articles = articles;
      }

      // Search resources
      if (searchType === 'all' || searchType === 'resources') {
        const resources = await prisma.externalResource.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          include: {
            course: true,
            teacher: true
          },
          take: limitNum
        });
        results.resources = resources;
      }

      return {
        success: true,
        query: q,
        results
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Search failed' });
    }
  });

  // Get search suggestions (autocomplete)
  fastify.get('/suggestions', async (request, reply) => {
    const { q } = request.query as { q?: string };

    if (!q) {
      return reply.status(400).send({ error: 'Query parameter q is required' });
    }

    const searchTerm = q.toLowerCase();

    try {
      const [courses, articles] = await Promise.all([
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
        prisma.article.findMany({
          where: {
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
          articles: articles.map(a => ({ type: 'article', id: a.id, title: a.title, slug: a.slug }))
        }
      };
    } catch (error) {
      request.log.error(error);
      return { error: 'Failed to get suggestions' };
    }
  });
}
