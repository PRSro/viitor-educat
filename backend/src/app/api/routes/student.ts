import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { requireRole } from '../../core/middleware/permissionMiddleware.js';
import { prisma } from '../../models/prisma.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

export async function studentRoutes(server: FastifyInstance) {

  /**
   * GET /student/completions
   * Get all lessons completed by the current student
   */
  server.get('/completions', {
    preHandler: [authMiddleware, requireRole(['STUDENT'])]
  }, async (request, reply) => {
    try {
      const user = getCurrentUser(request);
      const { page, limit } = (request.query as any) || {};
      const pageNum = parseInt(page || '1');
      const limitNum = Math.min(parseInt(limit || '20'), 50);
      const skip = (pageNum - 1) * limitNum;

      const [completions, total] = await Promise.all([
        prisma.lessonCompletion.findMany({
          where: { studentId: user.id },
          include: {
            lesson: {
              include: {
                teacher: { select: { id: true, email: true } }
              }
            }
          },
          orderBy: { completedAt: 'desc' },
          take: limitNum,
          skip
        }),
        prisma.lessonCompletion.count({ where: { studentId: user.id } })
      ]);

      return {
        completions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      server.log.error(error, 'Error fetching student completions');
      throw error;
    }
  });

  /**
   * GET /student/stats
   * Get overall learning stats for the student
   */
  server.get('/stats', {
    preHandler: [authMiddleware, requireRole(['STUDENT'])]
  }, async (request, reply) => {
    const user = getCurrentUser(request);
    const [completionsCount, quizAttemptsCount] = await Promise.all([
      prisma.lessonCompletion.count({ where: { studentId: user.id } }),
      prisma.quizAttempt.count({ where: { userId: user.id } })
    ]);

    return {
      totalLessonsCompleted: completionsCount,
      totalQuizzesAttempted: quizAttemptsCount
    };
  });

  /**
   * GET /student/progress
   * Returns overall lesson completion progress for the student
   */
  server.get('/progress', {
    preHandler: [authMiddleware, requireRole(['STUDENT'])]
  }, async (request, reply) => {
    const user = getCurrentUser(request);
    const [totalCompleted, totalLessons] = await Promise.all([
      prisma.lessonCompletion.count({ where: { studentId: user.id } }),
      prisma.lesson.count({ where: { status: 'PUBLIC' } })
    ]);
    const percentComplete = totalLessons > 0
      ? Math.round((totalCompleted / totalLessons) * 100)
      : 0;
    return { totalCompleted, percentComplete };
  });
}
