import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { prisma } from '../../models/prisma.js';
import { z } from 'zod';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  userId: z.string().optional(), // If provided, send to specific user
  type: z.enum(['SYSTEM', 'ANNOUNCEMENT', 'FEEDBACK']).default('SYSTEM'),
});

export async function notificationRoutes(server: FastifyInstance) {
  /**
   * GET /notifications
   */
  server.get('/', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getCurrentUser(request).id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return { notifications };
  });

  /**
   * POST /notifications/read/:id
   */
  server.post('/read/:id', {
    preHandler: [authMiddleware]
  }, async (request: any, reply: FastifyReply) => {
    const { id } = request.params;
    const userId = getCurrentUser(request).id;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true }
    });

    return { success: true };
  });

  /**
   * POST /notifications/read-all
   */
  server.post('/read-all', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getCurrentUser(request).id;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });

    return { success: true };
  });

  /**
   * DELETE /notifications/:id
   */
  server.delete('/:id', {
    preHandler: [authMiddleware]
  }, async (request: any, reply: FastifyReply) => {
    const { id } = request.params;
    const userId = getCurrentUser(request).id;

    await prisma.notification.deleteMany({
      where: { id, userId }
    });

    return { success: true };
  });
}
