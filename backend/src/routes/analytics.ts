/**
 * Analytics Routes
 * Platform-wide analytics for Admin and Teacher dashboards
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, JwtPayload } from '../middleware/authMiddleware.js';
import { teacherOnly, anyRole, adminOnly, requireRole } from '../middleware/permissionMiddleware.js';

const prisma = new PrismaClient();

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
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
        totalCourses,
        publishedCourses,
        draftCourses,
        totalEnrollments,
        totalLessons,
        totalArticles,
        totalFlashcards,
        recentEnrollments,
        recentCourses
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'TEACHER' } }),
        prisma.course.count(),
        prisma.course.count({ where: { published: true } }),
        prisma.course.count({ where: { published: false } }),
        prisma.enrollment.count(),
        prisma.lesson.count(),
        prisma.article.count(),
        prisma.flashcard.count(),
        prisma.enrollment.count({ 
          where: { createdAt: { gte: startDate } } 
        }),
        prisma.course.count({ 
          where: { createdAt: { gte: startDate } } 
        })
      ]);

      const completedEnrollments = await prisma.enrollment.count({
        where: { completedAt: { not: null } }
      });

      const completionRate = totalEnrollments > 0 
        ? (completedEnrollments / totalEnrollments) * 100 
        : 0;

      return {
        users: {
          total: totalUsers,
          students: totalStudents,
          teachers: totalTeachers,
          admins: await prisma.user.count({ where: { role: 'ADMIN' } })
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          drafts: draftCourses,
          totalEnrollments,
          completionRate: Math.round(completionRate * 10) / 10
        },
        content: {
          lessons: totalLessons,
          articles: totalArticles,
          flashcards: totalFlashcards
        },
        recentActivity: {
          enrollmentsLast90Days: recentEnrollments,
          coursesCreatedLast90Days: recentCourses
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching analytics overview');
      throw error;
    }
  });

  /**
   * GET /analytics/trends
   * Get enrollment and activity trends (Admin only)
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

        const [enrollments, lessonsCompleted, usersCreated] = await Promise.all([
          prisma.enrollment.count({
            where: {
              createdAt: { gte: date, lt: nextDate }
            }
          }),
          prisma.enrollment.count({
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
          enrollments,
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
   * GET /analytics/courses
   * Get course analytics (Admin/Teacher)
   */
  fastify.get('/courses', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = getCurrentUser(request);
      const { limit } = request.query as { limit?: string };
      const take = limit ? parseInt(limit) : 10;

      const where = user.role === 'TEACHER' ? { teacherId: user.id } : {};

      const courses = await prisma.course.findMany({
        where,
        include: {
          teacher: { select: { id: true, email: true } },
          _count: { select: { enrollments: true, lessons: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const coursesWithStats = await Promise.all(
        courses.map(async (course) => {
          const enrollments = await prisma.enrollment.findMany({
            where: { courseId: course.id },
            select: { progress: true, completedAt: true }
          });

          const avgProgress = enrollments.length > 0
            ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
            : 0;

          const completed = enrollments.filter(e => e.completedAt !== null).length;

          return {
            id: course.id,
            title: course.title,
            published: course.published,
            teacher: course.teacher,
            totalEnrollments: course._count.enrollments,
            totalLessons: course._count.lessons,
            averageProgress: Math.round(avgProgress * 10) / 10,
            completionRate: course._count.enrollments > 0 
              ? Math.round((completed / course._count.enrollments) * 100) 
              : 0
          };
        })
      );

      return { courses: coursesWithStats };
    } catch (error) {
      fastify.log.error(error, 'Error fetching course analytics');
      throw error;
    }
  });

  /**
   * GET /analytics/popular-courses
   * Get most popular courses by enrollment (Admin)
   */
  fastify.get('/popular-courses', {
    preHandler: [authMiddleware, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit } = request.query as { limit?: string };
      const take = limit ? parseInt(limit) : 10;

      const courses = await prisma.course.findMany({
        where: { published: true },
        include: {
          teacher: { select: { id: true, email: true } },
          _count: { select: { enrollments: true, lessons: true } }
        },
        orderBy: {
          enrollments: { _count: 'desc' }
        },
        take
      });

      return { courses };
    } catch (error) {
      fastify.log.error(error, 'Error fetching popular courses');
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
              courses: true, 
              lessons: true,
              enrollments: true
            } 
          }
        }
      });

      const teacherStats = await Promise.all(
        teachers.map(async (teacher) => {
          const courses = await prisma.course.findMany({
            where: { teacherId: teacher.id }
          });
          const courseIds = courses.map(c => c.id);

          const totalEnrollments = await prisma.enrollment.count({
            where: { courseId: { in: courseIds } }
          });

          return {
            id: teacher.id,
            email: teacher.email,
            profile: teacher.teacherProfile,
            totalCourses: teacher._count.courses,
            totalLessons: teacher._count.lessons,
            totalEnrollments
          };
        })
      );

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
          enrollments: {
            include: {
              course: { select: { title: true } }
            }
          },
          _count: { select: { quizAttempts: true, bookmarks: true } }
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      });

      const total = await prisma.user.count({ where: { role: 'STUDENT' } });

      const studentStats = students.map(student => {
        const totalProgress = student.enrollments.length > 0
          ? student.enrollments.reduce((sum, e) => sum + e.progress, 0) / student.enrollments.length
          : 0;

        return {
          id: student.id,
          email: student.email,
          profile: student.studentProfile,
          enrolledCourses: student.enrollments.length,
          averageProgress: Math.round(totalProgress * 10) / 10,
          completedCourses: student.enrollments.filter(e => e.completedAt !== null).length,
          quizAttempts: student._count.quizAttempts,
          bookmarks: student._count.bookmarks,
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
        lessonsByCourse,
        articlesByCategory,
        resourcesByType
      ] = await Promise.all([
        prisma.lesson.count(),
        prisma.article.count(),
        prisma.flashcard.count(),
        prisma.externalResource.count(),
        prisma.quiz.count(),
        prisma.lesson.groupBy({
          by: ['courseId'],
          _count: { id: true }
        }),
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
        lessonsByCourse: lessonsByCourse.filter(l => l.courseId !== null),
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
   * Get analytics for current teacher's courses
   */
  fastify.get('/teacher/overview', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const teacherId = getCurrentUser(request).id;

      const [totalCourses, publishedCourses, totalLessons, totalStudents] = await Promise.all([
        prisma.course.count({ where: { teacherId } }),
        prisma.course.count({ where: { teacherId, published: true } }),
        prisma.lesson.count({ where: { teacherId } }),
        prisma.enrollment.count({
          where: {
            course: { teacherId }
          }
        })
      ]);

      const courses = await prisma.course.findMany({
        where: { teacherId },
        select: { id: true }
      });
      const courseIds = courses.map(c => c.id);

      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: { in: courseIds } },
        select: { progress: true, completedAt: true }
      });

      const avgProgress = enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
        : 0;

      const completedEnrollments = enrollments.filter(e => e.completedAt !== null).length;

      return {
        courses: {
          total: totalCourses,
          published: publishedCourses,
          drafts: totalCourses - publishedCourses
        },
        lessons: totalLessons,
        students: totalStudents,
        averageProgress: Math.round(avgProgress * 10) / 10,
        completionRate: enrollments.length > 0
          ? Math.round((completedEnrollments / enrollments.length) * 100)
          : 0
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching teacher analytics');
      throw error;
    }
  });
}
