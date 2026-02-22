/**
 * Notification Routes
 * Full notification functionality for all roles
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole, adminOnly, requireRole } from '../../core/middleware/permissionMiddleware.js';
import { z } from 'zod';
import { prisma } from '../../models/prisma.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const createNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  link: z.string().optional(),
});

const broadcastSchema = z.object({
  userIds: z.array(z.string()).optional(),
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  link: z.string().optional(),
  courseId: z.string().optional(),
});

interface NotificationParams {
  id: string;
}

export async function notificationRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /notifications
   * Get all notifications for current user
   */
  fastify.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = getCurrentUser(request);
      const { limit, offset, unread } = request.query as { 
        limit?: string; 
        offset?: string; 
        unread?: string 
      };

      const where: any = { userId: user.id };
      if (unread === 'true') {
        where.read = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit) : 50,
        skip: offset ? parseInt(offset) : 0,
      });

      const total = await prisma.notification.count({ where });

      return { 
        notifications,
        total,
        unreadCount: await prisma.notification.count({ 
          where: { userId: user.id, read: false } 
        })
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching notifications');
      throw error;
    }
  });

  /**
   * GET /notifications/unread-count
   * Get unread notification count
   */
  fastify.get('/unread-count', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request);
    
    const count = await prisma.notification.count({
      where: { userId: user.id, read: false }
    });

    return { unreadCount: count };
  });

  /**
   * POST /notifications
   * Create a notification (internal use or self-notification)
   */
  fastify.post('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = createNotificationSchema.parse(request.body);
      const currentUser = getCurrentUser(request);

      // Users can only create notifications for themselves
      // unless they are admin
      if (validated.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only create notifications for yourself'
        });
      }

      const notification = await prisma.notification.create({
        data: validated
      });

      return reply.status(201).send({ notification });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      fastify.log.error(error, 'Error creating notification');
      throw error;
    }
  });

  /**
   * PUT /notifications/:id/read
   * Mark a notification as read
   */
  fastify.put<{ Params: NotificationParams }>('/:id/read', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: NotificationParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = getCurrentUser(request);

      const notification = await prisma.notification.findUnique({ where: { id } });

      if (!notification) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      // Users can only mark their own notifications
      if (notification.userId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only mark your own notifications as read'
        });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { read: true }
      });

      return { notification: updated };
    } catch (error) {
      fastify.log.error(error, 'Error marking notification as read');
      throw error;
    }
  });

  /**
   * PUT /notifications/read-all
   * Mark all notifications as read
   */
  fastify.put('/read-all', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request);

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true }
    });

    return { message: 'All notifications marked as read' };
  });

  /**
   * DELETE /notifications/:id
   * Delete a notification
   */
  fastify.delete<{ Params: NotificationParams }>('/:id', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: NotificationParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = getCurrentUser(request);

      const notification = await prisma.notification.findUnique({ where: { id } });

      if (!notification) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      if (notification.userId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only delete your own notifications'
        });
      }

      await prisma.notification.delete({ where: { id } });

      return { message: 'Notification deleted successfully' };
    } catch (error) {
      fastify.log.error(error, 'Error deleting notification');
      throw error;
    }
  });

  /**
   * POST /notifications/broadcast
   * Teacher broadcasts to enrolled students
   * Admin broadcasts to all users or specific users
   */
  fastify.post('/broadcast', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = broadcastSchema.parse(request.body);
      const currentUser = getCurrentUser(request);

      let userIds: string[] = [];

      if (currentUser.role === 'ADMIN') {
        if (validated.userIds && validated.userIds.length > 0) {
          userIds = validated.userIds;
        } else if (validated.courseId) {
          const enrollments = await prisma.enrollment.findMany({
            where: { courseId: validated.courseId },
            select: { studentId: true }
          });
          userIds = enrollments.map(e => e.studentId);
        } else {
          const allUsers = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: { id: true }
          });
          userIds = allUsers.map(u => u.id);
        }
      } else {
        // Teacher can only broadcast to students in their courses
        if (validated.courseId) {
          const course = await prisma.course.findUnique({
            where: { id: validated.courseId }
          });
          
          if (!course || course.teacherId !== currentUser.id) {
            return reply.status(403).send({ 
              error: 'Forbidden',
              message: 'You can only broadcast to students in your own courses'
            });
          }

          const enrollments = await prisma.enrollment.findMany({
            where: { courseId: validated.courseId },
            select: { studentId: true }
          });
          userIds = enrollments.map(e => e.studentId);
        } else {
          return reply.status(400).send({ 
            error: 'Bad Request',
            message: 'Course ID required for teacher broadcasts'
          });
        }
      }

      if (userIds.length === 0) {
        return { message: 'No recipients found', created: 0 };
      }

      const notifications = await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          type: validated.type,
          title: validated.title,
          message: validated.message,
          link: validated.link || null
        }))
      });

      return { 
        message: 'Broadcast sent successfully',
        created: notifications.count
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      fastify.log.error(error, 'Error broadcasting notification');
      throw error;
    }
  });
}
