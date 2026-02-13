import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from './authMiddleware.js';

type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

/**
 * Permission Middleware Factory
 * 
 * Creates middleware that checks if authenticated user has required role(s).
 * Must be used AFTER authMiddleware (requires request.user).
 * 
 * Usage:
 *   // Single role:
 *   server.get('/teachers-only', { 
 *     preHandler: [authMiddleware, requireRole('TEACHER')] 
 *   }, handler);
 * 
 *   // Multiple roles (any match):
 *   server.get('/shared', { 
 *     preHandler: [authMiddleware, requireRole(['STUDENT', 'TEACHER'])] 
 *   }, handler);
 */
export function requireRole(allowedRoles: Role | Role[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async function permissionMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // Ensure authMiddleware ran first
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required before permission check',
      });
    }

    const userRole = user.role;

    // Check if user's role is in allowed roles
    if (!roles.includes(userRole)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Access denied. Required role(s): ${roles.join(' or ')}. Your role: ${userRole}`,
      });
    }
  };
}

/**
 * Convenience middleware: Teacher-only access
 */
export const teacherOnly = requireRole('TEACHER');

/**
 * Convenience middleware: Student-only access
 */
export const studentOnly = requireRole('STUDENT');

/**
 * Convenience middleware: Admin-only access
 */
export const adminOnly = requireRole('ADMIN');

/**
 * Convenience middleware: Any authenticated user (student or teacher)
 */
export const anyRole = requireRole(['STUDENT', 'TEACHER', 'ADMIN']);
