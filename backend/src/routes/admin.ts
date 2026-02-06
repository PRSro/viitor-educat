/**
 * Admin Routes
 * 
 * Admin-only endpoints for system management.
 * All routes require ADMIN role.
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/permissionMiddleware.js';

const prisma = new PrismaClient();

// Admin-only middleware
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

      return users;
    } catch (error) {
      console.error('Failed to fetch users:', error);
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
      const [userCount, lessonCount] = await Promise.all([
        prisma.user.count(),
        prisma.lesson.count(),
      ]);

      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
      });

      return {
        totalUsers: userCount,
        totalLessons: lessonCount,
        usersByRole: usersByRole.map(r => ({ 
          role: r.role, 
          count: r._count 
        })),
      };
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch statistics' 
      });
    }
  });
}
