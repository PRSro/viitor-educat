/**
 * Admin Routes
 *
 * Admin-only endpoints for system management.
 * Most routes require ADMIN role. The client-error endpoint is auth-optional
 * (accepts anonymous reports) and has its own per-IP rate limit.
 */

import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { requireRole } from '../../core/middleware/permissionMiddleware.js';
import { prisma } from '../../models/prisma.js';

const adminOnly = requireRole('ADMIN');

// Per-IP in-memory rate limiter for the client-error endpoint (10 req / 60 s)
const CLIENT_ERROR_WINDOW = 60_000;
const CLIENT_ERROR_MAX = 10;
const clientErrorBucket = new Map<string, { count: number; resetAt: number }>();

function clientErrorAllowed(ip: string): boolean {
  const now = Date.now();
  let entry = clientErrorBucket.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + CLIENT_ERROR_WINDOW };
    clientErrorBucket.set(ip, entry);
    return true;
  }
  entry.count++;
  return entry.count <= CLIENT_ERROR_MAX;
}

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
      const [userCount, lessonCount, articleCount, quizCount, completionCount] = await Promise.all([
        prisma.user.count(),
        prisma.lesson.count(),
        prisma.article.count(),
        prisma.quiz.count(),
        prisma.lessonCompletion.count(),
      ]);

      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
      });

      return {
        totalUsers: userCount,
        totalLessons: lessonCount,
        totalArticles: articleCount,
        totalQuizzes: quizCount,
        totalCompletions: completionCount,
        usersByRole: usersByRole.map(r => ({ 
          role: r.role, 
          count: r._count 
        })),
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch statistics' 
      });
    }
  });

  /**
   * POST /admin/client-error
   * Receives frontend error telemetry from ErrorBoundary.
   * Auth-optional: attaches userId when a valid JWT is present.
   * Rate-limited to 10 requests per minute per IP (independent of global limiter).
   */
  server.post('/client-error', async (request, reply) => {
    // Per-IP rate limit
    if (!clientErrorAllowed(request.ip)) {
      return reply.status(429).send({ error: 'Too Many Requests' });
    }

    // Attempt to extract userId from JWT if provided — never block on failure
    let userId: string | undefined;
    try {
      const payload = await request.jwtVerify<{ id: string }>();
      userId = payload?.id;
    } catch {
      // No valid token — anonymous report
    }

    const { message, stack, componentStack, userAgent, url } = request.body as {
      message?: string;
      stack?: string;
      componentStack?: string;
      userAgent?: string;
      url?: string;
    };

    if (!message) {
      return reply.status(400).send({ error: 'message is required' });
    }

    try {
      await prisma.clientError.create({
        data: {
          message: String(message).slice(0, 1000),
          stack: stack ? String(stack).slice(0, 5000) : null,
          componentStack: componentStack ? String(componentStack).slice(0, 5000) : null,
          userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
          url: url ? String(url).slice(0, 2000) : null,
          userId: userId ?? null,
        },
      });
      return reply.status(204).send();
    } catch (error) {
      server.log.error({ err: error }, 'Failed to store client error');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
