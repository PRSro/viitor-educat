import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../middleware/authMiddleware.js';
import { requireRole, teacherOnly, anyRole } from '../middleware/permissionMiddleware.js';

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
   * GET /api/profile
   * Accessible by any authenticated user (student or teacher)
   * Returns the current user's info from JWT
   */
  server.get('/profile', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // request.user is set by authMiddleware
    return {
      message: 'Profile accessed successfully',
      user: request.user
    };
  });

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

  /**
   * GET /api/teacher/dashboard-data
   * Accessible by TEACHER role only
   * Example: teacher-specific data like grades management
   */
  server.get('/teacher/dashboard-data', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      message: 'Teacher-only data accessed',
      accessibleBy: ['TEACHER'],
      data: {
        // Example teacher-specific data
        classCount: 5,
        studentCount: 120,
        pendingAssignments: 15
      }
    };
  });

  /**
   * POST /api/teacher/grades
   * Accessible by TEACHER role only
   * Example: posting grades (teacher action)
   */
  server.post('/teacher/grades', {
    preHandler: [authMiddleware, requireRole('TEACHER')]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      message: 'Grade posted successfully (mock)',
      postedBy: getCurrentUser(request)?.email
    };
  });

  /**
   * GET /api/student/my-grades
   * Accessible by STUDENT role only
   * Example: student viewing their own grades
   */
  server.get('/student/my-grades', {
    preHandler: [authMiddleware, requireRole('STUDENT')]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      message: 'Student grades accessed',
      accessibleBy: ['STUDENT'],
      grades: [
        { subject: 'Math', grade: 9 },
        { subject: 'Physics', grade: 8 }
      ]
    };
  });
}
