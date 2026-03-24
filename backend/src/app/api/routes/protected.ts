import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { requireRole, teacherOnly, anyRole } from '../../core/middleware/permissionMiddleware.js';

function getCurrentUser(request: FastifyRequest): JwtPayload | undefined {
  return (request as any).user as JwtPayload | undefined;
}

/**
 * Protected Routes Examples
 * 
 * Demonstrates how to use auth and permission middleware:
 * 
 * 1. authMiddleware - Requires valid JWT token
 * 2. requireRole('TEACHER') - Requires specific role
 * 3. teacherOnly - Shorthand for teacher role
 * 4. anyRole - Any authenticated user (STUDENT or TEACHER)
 */
export async function protectedRoutes(server: FastifyInstance) {
  
  /**
   * GET /api/shared
   * Accessible by both STUDENT and TEACHER roles
   * Example: viewing shared resources
   */
  server.get('/shared', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      message: 'Shared resource accessed',
      accessibleBy: ['STUDENT', 'TEACHER'],
      user: request.user
    };
  });
}
