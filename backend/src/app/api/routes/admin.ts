/**
 * Admin Routes
 * 
 * Admin-only endpoints for system management.
 * All routes require ADMIN role.
 */

import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { requireRole } from '../../core/middleware/permissionMiddleware.js';
import { prisma } from '../../models/prisma.js';

const adminOnly = requireRole('ADMIN');

export async function adminRoutes(server: FastifyInstance) {
  /**
   * GET /admin/users
   * Get list of all users (without password)
   * Admin only
   */
  server.get('/users', {
    preHandler: [authMiddleware, adminOnly],
  }, async (request, reply) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return { users };
    } catch (error) {
      // Log error server-side only (no sensitive details to client)
      server.log.error(error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch users' 
      });
    }
  });

  /**
   * GET /admin/stats
   * Get system statistics
   * Admin only
   */
  server.get('/stats', {
    preHandler: [authMiddleware, adminOnly],
  }, async (request, reply) => {
    try {
      const [userCount, lessonCount, courseCount, enrollmentCount, completionCount] = await Promise.all([
        prisma.user.count(),
        prisma.lesson.count(),
        prisma.course.count({ where: { published: true } }),
        prisma.enrollment.count(),
        prisma.lessonCompletion.count(),
      ]);

      const activeStudents = await prisma.user.count({
        where: {
          role: 'STUDENT',
          enrollments: { some: {} }
        }
      });

      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
      });

      return {
        totalUsers: userCount,
        totalLessons: lessonCount,
        totalCourses: courseCount,
        totalEnrollments: enrollmentCount,
        totalCompletions: completionCount,
        activeStudents,
        usersByRole: usersByRole.map(r => ({ 
          role: r.role, 
          count: r._count 
        })),
      };
    } catch (error) {
      // Log error server-side only
      server.log.error(error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch statistics' 
      });
    }
  });
}
