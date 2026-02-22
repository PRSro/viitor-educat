import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ResourceType } from '@prisma/client';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole, requireRole } from '../../core/middleware/permissionMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';
import { prisma } from '../../models/prisma.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const resourceTypeEnum = z.enum(['YOUTUBE', 'LINK', 'PDF', 'DOCUMENT']);

const createResourceSchema = z.object({
  type: resourceTypeEnum,
  url: z.string().url('Invalid URL format'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  courseIds: z.array(z.string()).optional(),
});

const updateResourceSchema = createResourceSchema.partial();

const resourceQuerySchema = z.object({
  type: resourceTypeEnum.optional(),
  courseId: z.string().optional(),
  teacherId: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

/**
 * External Resource Routes
 * 
 * Permissions:
 * - GET /resources - All authenticated users can view resources
 * - GET /resources/:id - View resource details
 * - POST /resources - Teacher/Admin can create resources
 * - PUT /resources/:id - Teacher/Admin can update their resources
 * - DELETE /resources/:id - Teacher/Admin can delete their resources
 * - GET /resources/types - Get available resource types
 */

export async function resourceRoutes(server: FastifyInstance) {

  /**
   * GET /resources/types
   * Get all available resource types
   */
  server.get('/types', {
    preHandler: [authMiddleware, anyRole]
  }, async () => {
    return {
      types: Object.values(ResourceType)
    };
  });

  /**
   * GET /resources
   * List all external resources with filtering and pagination
   */
  server.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = resourceQuerySchema.parse(request.query);
      const { type, courseId, teacherId, page, limit } = query;

      const where: any = {};

      if (type) {
        where.type = type;
      }

      if (courseId) {
        where.courses = { some: { id: courseId } };
      }

      if (teacherId) {
        where.teacherId = teacherId;
      }

      const [resources, total] = await Promise.all([
        prisma.externalResource.findMany({
          where,
          select: {
            id: true,
            type: true,
            url: true,
            title: true,
            description: true,
            teacherId: true,
            createdAt: true,
            courses: { select: { id: true, title: true, slug: true } },
            teacher: { select: { id: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.externalResource.count({ where })
      ]);

      return {
        resources,
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
   * GET /resources/course/:courseId
   * Get all resources for a specific course
   */
  server.get<{ Params: { courseId: string } }>('/course/:courseId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { courseId } = request.params;

    const resources = await prisma.externalResource.findMany({
      where: { courses: { some: { id: courseId } } },
      select: {
        id: true,
        type: true,
        url: true,
        title: true,
        description: true,
        teacherId: true,
        createdAt: true,
        teacher: { select: { id: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { resources };
  });

  /**
   * GET /resources/teacher/:teacherId
   * Get all resources created by a specific teacher
   */
  server.get<{ Params: { teacherId: string } }>('/teacher/:teacherId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { teacherId } = request.params;

    const resources = await prisma.externalResource.findMany({
      where: { teacherId },
      select: {
        id: true,
        type: true,
        url: true,
        title: true,
        description: true,
        teacherId: true,
        createdAt: true,
        courses: { select: { id: true, title: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { resources };
  });

  /**
   * GET /resources/:id
   * Get resource details by ID
   */
  server.get<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const resource = await prisma.externalResource.findUnique({
      where: { id },
      include: {
        courses: { select: { id: true, title: true, slug: true } },
        teacher: { select: { id: true, email: true } }
      }
    });

    if (!resource) {
      return reply.status(404).send({ error: 'Resource not found' });
    }

    return { resource };
  });

  /**
   * POST /resources
   * Create a new external resource (Teacher/Admin only)
   */
  server.post('/', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = createResourceSchema.parse(request.body);
      const teacherId = getCurrentUser(request).id;

      const { courseIds, ...resourceData } = validated;
      const resource = await prisma.externalResource.create({
        data: {
          ...resourceData,
          teacherId,
          ...(courseIds && courseIds.length > 0 ? {
            courses: { connect: courseIds.map(id => ({ id })) }
          } : {})
        },
        include: {
          courses: { select: { id: true, title: true, slug: true } },
          teacher: { select: { id: true, email: true } }
        }
      });

      return reply.status(201).send({
        message: 'Resource created successfully',
        resource
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
   * PUT /resources/:id
   * Update an external resource (Author/Admin only)
   */
  server.put<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const validated = updateResourceSchema.parse(request.body);
      const userId = getCurrentUser(request).id;
      const userRole = getCurrentUser(request).role;

      const existing = await prisma.externalResource.findUnique({ where: { id } });

      if (!existing) {
        return reply.status(404).send({ error: 'Resource not found' });
      }

      if (existing.teacherId !== userId && userRole !== 'ADMIN') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You can only update your own resources'
        });
      }

      const resource = await prisma.externalResource.update({
        where: { id },
        data: validated,
        include: {
          courses: { select: { id: true, title: true, slug: true } },
          teacher: { select: { id: true, email: true } }
        }
      });

      return { message: 'Resource updated successfully', resource };
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
   * DELETE /resources/:id
   * Delete an external resource (Author/Admin only)
   */
  server.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const userId = getCurrentUser(request).id;
    const userRole = getCurrentUser(request).role;

    const existing = await prisma.externalResource.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({ error: 'Resource not found' });
    }

    if (existing.teacherId !== userId && userRole !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only delete your own resources'
      });
    }

    await prisma.externalResource.delete({ where: { id } });

    return { message: 'Resource deleted successfully' };
  });
}
