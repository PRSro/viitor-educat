import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from './authMiddleware.js';

type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

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
    const user = (request as any).user as JwtPayload | undefined;
    
    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required. Please login.',
      });
    }

    const userRole = user.role;

    if (!roles.includes(userRole)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Access denied. Required role(s): ${roles.join(' or ')}. Your role: ${userRole}`,
      });
    }
  };
}

/**
 * Check if user is the owner of a resource or is an admin
 */
export function isOwnerOrAdmin(ownerId: string, user: JwtPayload): boolean {
  return user.id === ownerId || user.role === 'ADMIN';
}

/**
 * Require ownership or admin role
 */
export function requireOwnership(getOwnerId: (request: FastifyRequest) => string | Promise<string>) {
  return async function ownershipMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const user = (request as any).user as JwtPayload | undefined;
    
    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required. Please login.',
      });
    }

    const ownerId = await getOwnerId(request);
    
    if (user.id !== ownerId && user.role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.',
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
