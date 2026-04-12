import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../models/prisma.js';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';

export const learningPathsRoutes = async (server: FastifyInstance) => {
  server.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const paths = await prisma.learningPath.findMany({
        orderBy: { createdAt: 'asc' }
      });
      return { success: true, data: paths };
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ success: false, error: 'Failed to fetch learning paths' });
    }
  });

  server.get('/:id/progress', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const learningPath = await prisma.learningPath.findUnique({
        where: { id }
      });

      if (!learningPath) {
        return reply.code(404).send({ success: false, error: 'Learning path not found' });
      }

      // Find user's progress for lessons inside this path
      const progress = await prisma.lessonProgress.findMany({
        where: {
          userId: user.id,
          lessonId: { in: learningPath.lessonIds }
        }
      });

      const completedIds = progress.filter(p => p.status === 'COMPLETED').map(p => p.lessonId);
      const percentage = learningPath.lessonIds.length > 0 
        ? Math.round((completedIds.length / learningPath.lessonIds.length) * 100) 
        : 0;

      return {
        success: true,
        data: {
          completedIds,
          percentage,
          total: learningPath.lessonIds.length,
          completed: completedIds.length
        }
      };
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ success: false, error: 'Failed to fetch progress' });
    }
  });
};
