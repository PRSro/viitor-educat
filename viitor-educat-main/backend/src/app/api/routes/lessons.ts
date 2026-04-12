import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole } from '../../core/middleware/permissionMiddleware.js';
import { lessonController } from '../controllers/lessonController.js';

import { prisma } from '../../models/prisma.js';
import { JwtPayload } from '../../core/middleware/authMiddleware.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

export async function lessonRoutes(server: FastifyInstance) {
  // GET /lessons/private — teacher's own private lessons
  server.get('/private', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const user = getCurrentUser(request);
    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId: user.id,
        status: 'PRIVATE'
      },
      include: {
        _count: { select: { completions: true } }
      },
      orderBy: { order: 'asc' }
    });
    return { lessons };
  });

  // GET /lessons/cyberlab - Returns CyberLab challenges as training modules
  server.get('/cyberlab', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    try {
      const challenges = await prisma.cyberChallenge.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          points: true
        },
        orderBy: { createdAt: 'asc' }
      });

      const ctfLessons = challenges.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        type: 'challenge' as const,
        points: c.points,
        difficulty: c.difficulty,
        challengeUrl: `/student/cyberlab_challenges#${c.id}`
      }));

      return {
        ctfLessons,
        totalChallenges: ctfLessons.length
      };
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ error: 'Failed to load CyberLab lessons' });
    }
  });

  server.get('/', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.getAll(request, reply));
  server.get('/:id', (request: FastifyRequest, reply: FastifyReply) => lessonController.getById(request as any, reply));
  server.get('/teacher/:teacherId', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.getTeacherLessons(request as any, reply));
  server.get('/:id/view', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.view(request as any, reply));
  server.post('/:id/complete', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.complete(request as any, reply));
  server.post('/', { preHandler: [authMiddleware, teacherOnly] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.create(request, reply));
  server.delete('/:id', { preHandler: [authMiddleware, teacherOnly] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.remove(request as any, reply));
  server.patch('/:id', { preHandler: [authMiddleware, teacherOnly] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.update(request as any, reply));
  server.post('/:id/questions/:questionId/answer', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.submitAnswer(request as any, reply));
}