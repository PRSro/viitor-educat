/**
 * Analytics Routes
 * Platform-wide analytics for Admin and Teacher dashboards
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole, adminOnly, requireRole } from '../../core/middleware/permissionMiddleware.js';
import { prisma } from '../../models/prisma.js';
import { 
  getLessonCompletionRates, 
  getWeeklyActiveStudents, 
  getQuizPerformance 
} from '../../services/analyticsService.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

async function logAnalyticsRequest(teacherId: string, endpoint: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'VIEW_ANALYTICS',
        resource: endpoint,
        metadata: { timestamp: new Date().toISOString() }
      }
    });
  } catch (error) {
    console.error('Failed to log analytics request:', error);
  }
}

export async function analyticsRoutes(fastify: FastifyInstance) {

  /**
   * GET /analytics/overview
   * Get platform-wide analytics (Admin only)
   */
  fastify.get('/overview', {
    preHandler: [authMiddleware, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { period } = request.query as { period?: string };
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        totalUsers,
        totalStudents,
        totalTeachers,
        totalLessons,
        totalArticles,
        totalFlashcards
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'TEACHER' } }),
        prisma.lesson.count(),
        prisma.article.count(),
        prisma.flashcard.count()
      ]);

      return {
        users: {
          total: totalUsers,
          students: totalStudents,
          teachers: totalTeachers,
          admins: await prisma.user.count({ where: { role: 'ADMIN' } })
        },
        content: {
          lessons: totalLessons,
          articles: totalArticles,
          flashcards: totalFlashcards
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching analytics overview');
      throw error;
    }
  });

  /**
   * GET /analytics/trends
   * Get activity trends (Admin only)
   */
  fastify.get('/trends', {
    preHandler: [authMiddleware, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { days } = request.query as { days?: string };
      const numDays = parseInt(days || '30');

      const trends = [];
      for (let i = numDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const [lessonsCompleted, usersCreated] = await Promise.all([
          prisma.lessonCompletion.count({
            where: {
              completedAt: { gte: date, lt: nextDate }
            }
          }),
          prisma.user.count({
            where: {
              createdAt: { gte: date, lt: nextDate }
            }
          })
        ]);

        trends.push({
          date: date.toISOString().split('T')[0],
          lessonsCompleted,
          usersCreated
        });
      }

      return { trends };
    } catch (error) {
      fastify.log.error(error, 'Error fetching analytics trends');
      throw error;
    }
  });

  /**
   * GET /analytics/teachers
   * Get teacher performance metrics (Admin)
   */
  fastify.get('/teachers', {
    preHandler: [authMiddleware, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER' },
        include: {
          teacherProfile: true,
          _count: {
            select: {
              lessons: true,
              articles: true
            }
          }
        }
      });

      const teacherStats = teachers.map(teacher => ({
        id: teacher.id,
        email: teacher.email,
        profile: teacher.teacherProfile,
        totalLessons: teacher._count.lessons,
        totalArticles: teacher._count.articles
      }));

      return { teachers: teacherStats };
    } catch (error) {
      fastify.log.error(error, 'Error fetching teacher analytics');
      throw error;
    }
  });

  /**
   * GET /analytics/students
   * Get student activity and progress (Admin)
   */
  fastify.get('/students', {
    preHandler: [authMiddleware, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit, offset } = request.query as { limit?: string; offset?: string };
      const take = limit ? parseInt(limit) : 20;
      const skip = offset ? parseInt(offset) : 0;

      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: {
          studentProfile: true,
          _count: { select: { quizAttempts: true, lessonCompletions: true } }
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      });

      const total = await prisma.user.count({ where: { role: 'STUDENT' } });

      const studentStats = students.map(student => {
        return {
          id: student.id,
          email: student.email,
          profile: student.studentProfile,
          completedLessons: student._count.lessonCompletions,
          quizAttempts: student._count.quizAttempts,
          joinedAt: student.createdAt
        };
      });

      return { students: studentStats, total };
    } catch (error) {
      fastify.log.error(error, 'Error fetching student analytics');
      throw error;
    }
  });

  /**
   * GET /analytics/content
   * Get content statistics (Admin)
   */
  fastify.get('/content', {
    preHandler: [authMiddleware, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [
        totalLessons,
        totalArticles,
        totalFlashcards,
        totalResources,
        totalQuizzes,
        articlesByCategory,
        resourcesByType
      ] = await Promise.all([
        prisma.lesson.count(),
        prisma.article.count(),
        prisma.flashcard.count(),
        prisma.externalResource.count(),
        prisma.quiz.count(),
        prisma.article.groupBy({
          by: ['category'],
          _count: { id: true }
        }),
        prisma.externalResource.groupBy({
          by: ['type'],
          _count: { id: true }
        })
      ]);

      return {
        lessons: totalLessons,
        articles: totalArticles,
        flashcards: totalFlashcards,
        resources: totalResources,
        quizzes: totalQuizzes,
        articlesByCategory: articlesByCategory.map(a => ({
          category: a.category,
          count: a._count.id
        })),
        resourcesByType: resourcesByType.map(r => ({
          type: r.type,
          count: r._count.id
        }))
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching content analytics');
      throw error;
    }
  });

  /**
   * GET /analytics/teacher/overview
   * Get analytics for current teacher
   */
  fastify.get('/teacher/overview', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const teacherId = getCurrentUser(request).id;

      const [totalLessons, totalArticles, totalStudents] = await Promise.all([
        prisma.lesson.count({ where: { teacherId } }),
        prisma.article.count({ where: { authorId: teacherId } }),
        prisma.lessonCompletion.count({
          where: {
            lesson: { teacherId }
          }
        })
      ]);

      return {
        lessons: totalLessons,
        articles: totalArticles,
        students: totalStudents
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching teacher analytics');
      throw error;
    }
  });

  /**
   * GET /analytics/lessons
   * Get completion rates per lesson for authenticated teacher (paginated)
   */
  fastify.get('/lessons', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = getCurrentUser(request);
      const teacherId = user.id;
      const page = parseInt((request.query as any).page || '1');
      const limit = Math.min(parseInt((request.query as any).limit || '20'), 100);

      await logAnalyticsRequest(teacherId, 'GET /analytics/lessons');
      const result = await getLessonCompletionRates(teacherId, page, limit);
      return result;
    } catch (error) {
      fastify.log.error(error, 'Error fetching lesson completion rates');
      throw error;
    }
  });

  /**
   * GET /analytics/students/active
   * Get weekly active student count
   */
  fastify.get('/students/active', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = getCurrentUser(request);
      const weeks = parseInt((request.query as any).weeks || '8');

      await logAnalyticsRequest(user.id, 'GET /analytics/students/active');
      const result = await getWeeklyActiveStudents(user.id, weeks);
      return result;
    } catch (error) {
      fastify.log.error(error, 'Error fetching active students');
      throw error;
    }
  });

  /**
   * GET /analytics/quizzes
   * Get average score per quiz (paginated)
   */
  fastify.get('/quizzes', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = getCurrentUser(request);
      const page = parseInt((request.query as any).page || '1');
      const limit = Math.min(parseInt((request.query as any).limit || '20'), 100);

      await logAnalyticsRequest(user.id, 'GET /analytics/quizzes');
      const result = await getQuizPerformance(user.id, page, limit);
      return result;
    } catch (error) {
      fastify.log.error(error, 'Error fetching quiz performance');
      throw error;
    }
  });
}
