import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { teacherOnly, anyRole, adminOnly } from '../middleware/permissionMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../validation/schemas.js';

const prisma = new PrismaClient();

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().url().optional().nullable(),
});

const updateCourseSchema = createCourseSchema.partial().extend({
  published: z.boolean().optional(),
});

const courseIdSchema = z.object({
  id: z.string().min(1, 'Course ID is required'),
});

const slugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

/**
 * Course Routes
 * 
 * Permissions:
 * - GET /courses - All authenticated users can view published courses
 * - GET /courses/:slug - View course details with lessons
 * - GET /student/courses - Students see their enrolled courses with progress
 * - POST /courses - Teacher/Admin can create courses
 * - PUT /courses/:id - Teacher can update their own courses
 * - DELETE /courses/:id - Teacher can delete their own courses
 * - POST /courses/:id/enroll - Students can enroll in courses
 */

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100) + '-' + Date.now().toString(36);
}

export async function courseRoutes(server: FastifyInstance) {
  
  /**
   * GET /courses
   * List all published courses
   */
  server.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const courses = await prisma.course.findMany({
      where: { published: true },
      include: {
        teacher: { select: { id: true, email: true } },
        _count: { select: { lessons: true, enrollments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { courses };
  });

  /**
   * GET /courses/student
   * Get enrolled courses for current student with progress
   */
  server.get('/student', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const studentId = request.user!.id;
    
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            teacher: { select: { id: true, email: true } },
            _count: { select: { lessons: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    return { 
      enrollments: enrollments.map(e => ({
        id: e.id,
        progress: e.progress,
        enrolledAt: e.createdAt,
        course: e.course
      }))
    };
  });

  /**
   * GET /courses/:slug
   * Get course details with lessons
   */
  server.get<{ Params: { slug: string } }>('/:slug', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const { slug } = slugSchema.parse(request.params);
      
      const course = await prisma.course.findUnique({
        where: { slug },
        include: {
          teacher: { select: { id: true, email: true } },
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, description: true, order: true }
          }
        }
      });
      
      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }
      
      // Check enrollment for progress
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: request.user!.id,
            courseId: course.id
          }
        }
      });
      
      return { 
        course,
        enrollment: enrollment ? { progress: enrollment.progress } : null
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error;
    }
  });

  /**
   * POST /courses
   * Create a new course (Teacher/Admin)
   */
  server.post('/', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = createCourseSchema.parse(request.body);
      const teacherId = request.user!.id;
      
      const course = await prisma.course.create({
        data: {
          ...validated,
          slug: generateSlug(validated.title),
          teacherId
        },
        include: {
          teacher: { select: { id: true, email: true } }
        }
      });
      
      return reply.status(201).send({ 
        message: 'Course created successfully',
        course 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error;
    }
  });

  /**
   * PUT /courses/:id
   * Update a course (Owner only)
   */
  server.put<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = courseIdSchema.parse(request.params);
      const validated = updateCourseSchema.parse(request.body);
      const teacherId = request.user!.id;
      
      const existing = await prisma.course.findUnique({ where: { id } });
      
      if (!existing) {
        return reply.status(404).send({ error: 'Course not found' });
      }
      
      if (existing.teacherId !== teacherId && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only update your own courses'
        });
      }
      
      const course = await prisma.course.update({
        where: { id },
        data: validated,
        include: {
          teacher: { select: { id: true, email: true } }
        }
      });
      
      return { message: 'Course updated successfully', course };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error;
    }
  });

  /**
   * POST /courses/:id/enroll
   * Enroll current user in a course
   */
  server.post<{ Params: { id: string } }>('/:id/enroll', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = courseIdSchema.parse(request.params);
      const studentId = request.user!.id;
      
      const course = await prisma.course.findUnique({ where: { id } });
      
      if (!course || !course.published) {
        return reply.status(404).send({ error: 'Course not found' });
      }
      
      // Check if already enrolled
      const existing = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId: id } }
      });
      
      if (existing) {
        return reply.status(400).send({ error: 'Already enrolled in this course' });
      }
      
      const enrollment = await prisma.enrollment.create({
        data: { studentId, courseId: id }
      });
      
      return reply.status(201).send({ 
        message: 'Enrolled successfully',
        enrollment 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error;
    }
  });

  /**
   * DELETE /courses/:id
   * Delete a course (Owner/Admin)
   */
  server.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = courseIdSchema.parse(request.params);
      const teacherId = request.user!.id;
      
      const existing = await prisma.course.findUnique({ where: { id } });
      
      if (!existing) {
        return reply.status(404).send({ error: 'Course not found' });
      }
      
      if (existing.teacherId !== teacherId && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only delete your own courses'
        });
      }
      
      await prisma.course.delete({ where: { id } });
      
      return { message: 'Course deleted successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error;
    }
  });
}
