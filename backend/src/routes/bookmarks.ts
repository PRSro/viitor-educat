/**
 * Bookmark Routes
 * Full bookmark functionality for all users
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, JwtPayload } from '../middleware/authMiddleware.js';
import { anyRole, adminOnly } from '../middleware/permissionMiddleware.js';
import { z } from 'zod';

const prisma = new PrismaClient();

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const createBookmarkSchema = z.object({
  resourceType: z.string().min(1, 'Resource type is required'),
  resourceId: z.string().min(1, 'Resource ID is required'),
  title: z.string().min(1, 'Title is required'),
  url: z.string().url().optional(),
});

const updateBookmarkSchema = createBookmarkSchema.partial().extend({
  title: z.string().min(1, 'Title is required').optional(),
});

interface BookmarkParams {
  id: string;
}

export async function bookmarkRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /bookmarks
   * Get all bookmarks for current user
   */
  fastify.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = getCurrentUser(request);
      const { type, limit, offset } = request.query as { 
        type?: string; 
        limit?: string; 
        offset?: string 
      };

      const where: any = { userId: user.id };
      if (type) {
        where.resourceType = type;
      }

      const bookmarks = await prisma.bookmark.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit) : 50,
        skip: offset ? parseInt(offset) : 0,
      });

      const total = await prisma.bookmark.count({ where });

      return { 
        bookmarks,
        total
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching bookmarks');
      throw error;
    }
  });

  /**
   * GET /bookmarks/:id
   * Get a single bookmark
   */
  fastify.get<{ Params: BookmarkParams }>('/:id', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: BookmarkParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = getCurrentUser(request);

      const bookmark = await prisma.bookmark.findUnique({
        where: { id }
      });

      if (!bookmark) {
        return reply.status(404).send({ error: 'Bookmark not found' });
      }

      if (bookmark.userId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only view your own bookmarks'
        });
      }

      return { bookmark };
    } catch (error) {
      fastify.log.error(error, 'Error fetching bookmark');
      throw error;
    }
  });

  /**
   * POST /bookmarks
   * Create a new bookmark
   */
  fastify.post('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = createBookmarkSchema.parse(request.body);
      const user = getCurrentUser(request);

      // Check for duplicate bookmark
      const existing = await prisma.bookmark.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: user.id,
            resourceType: validated.resourceType,
            resourceId: validated.resourceId
          }
        }
      });

      if (existing) {
        return reply.status(400).send({ 
          error: 'Bad Request',
          message: 'This resource is already bookmarked'
        });
      }

      const bookmark = await prisma.bookmark.create({
        data: {
          userId: user.id,
          resourceType: validated.resourceType,
          resourceId: validated.resourceId,
          title: validated.title,
          url: validated.url || null
        }
      });

      return reply.status(201).send({ 
        message: 'Bookmark created successfully',
        bookmark 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      fastify.log.error(error, 'Error creating bookmark');
      throw error;
    }
  });

  /**
   * PUT /bookmarks/:id
   * Update a bookmark
   */
  fastify.put<{ Params: BookmarkParams }>('/:id', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: BookmarkParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const validated = updateBookmarkSchema.parse(request.body);
      const user = getCurrentUser(request);

      const existing = await prisma.bookmark.findUnique({ where: { id } });

      if (!existing) {
        return reply.status(404).send({ error: 'Bookmark not found' });
      }

      if (existing.userId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only update your own bookmarks'
        });
      }

      const bookmark = await prisma.bookmark.update({
        where: { id },
        data: validated
      });

      return { 
        message: 'Bookmark updated successfully',
        bookmark 
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      fastify.log.error(error, 'Error updating bookmark');
      throw error;
    }
  });

  /**
   * DELETE /bookmarks/:id
   * Delete a bookmark
   */
  fastify.delete<{ Params: BookmarkParams }>('/:id', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: BookmarkParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = getCurrentUser(request);

      const existing = await prisma.bookmark.findUnique({ where: { id } });

      if (!existing) {
        return reply.status(404).send({ error: 'Bookmark not found' });
      }

      if (existing.userId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only delete your own bookmarks'
        });
      }

      await prisma.bookmark.delete({ where: { id } });

      return { message: 'Bookmark deleted successfully' };
    } catch (error) {
      fastify.log.error(error, 'Error deleting bookmark');
      throw error;
    }
  });

  /**
   * GET /bookmarks/check/:resourceType/:resourceId
   * Check if a resource is bookmarked by current user
   */
  fastify.get<{ Params: { resourceType: string; resourceId: string } }>('/check/:resourceType/:resourceId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { resourceType: string; resourceId: string } }>, reply: FastifyReply) => {
    try {
      const { resourceType, resourceId } = request.params;
      const user = getCurrentUser(request);

      const bookmark = await prisma.bookmark.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: user.id,
            resourceType,
            resourceId
          }
        }
      });

      return { isBookmarked: !!bookmark, bookmarkId: bookmark?.id || null };
    } catch (error) {
      fastify.log.error(error, 'Error checking bookmark');
      throw error;
    }
  });

  /**
   * POST /bookmarks/toggle
   * Toggle bookmark status for a resource
   */
  fastify.post('/toggle', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = createBookmarkSchema.parse(request.body);
      const user = getCurrentUser(request);

      const existing = await prisma.bookmark.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: user.id,
            resourceType: validated.resourceType,
            resourceId: validated.resourceId
          }
        }
      });

      if (existing) {
        await prisma.bookmark.delete({ where: { id: existing.id } });
        return { isBookmarked: false, message: 'Bookmark removed' };
      }

      const bookmark = await prisma.bookmark.create({
        data: {
          userId: user.id,
          resourceType: validated.resourceType,
          resourceId: validated.resourceId,
          title: validated.title,
          url: validated.url || null
        }
      });

      return { isBookmarked: true, bookmark };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      fastify.log.error(error, 'Error toggling bookmark');
      throw error;
    }
  });
}
