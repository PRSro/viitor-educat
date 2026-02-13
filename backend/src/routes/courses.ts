import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, JwtPayload } from '../middleware/authMiddleware.js';
import { teacherOnly, anyRole, adminOnly } from '../middleware/permissionMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../validation/schemas.js';

const prisma = new PrismaClient();

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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100) + '-' + Date.now().toString(36);
}

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

export async function courseRoutes(server: FastifyInstance) {
  
  /**
   * GET /courses
   * List all published courses - accessible by all authenticated users
   */
  server.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = getCurrentUser(request);
      const courses = await prisma.course.findMany({
        where: { published: true },
        include: {
          teacher: { 
            select: { id: true, email: true },
            include: { teacherProfile: true }
          },
          _count: { select: { lessons: true, enrollments: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return { courses };
    } catch (error) {
      server.log.error(error, 'Error fetching courses');
      throw error;
    }
  });

  /**
   * GET /courses/teacher/:teacherId
   * Get all published courses for a specific teacher - for student visibility
   */
  server.get<{ Params: { teacherId: string } }>('/teacher/:teacherId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { teacherId: string } }>, reply: FastifyReply) => {
    try {
      const { teacherId } = request.params;
      
      const courses = await prisma.course.findMany({
        where: { 
          teacherId,
          published: true 
        },
        include: {
          teacher: { 
            select: { id: true, email: true },
            include: { teacherProfile: true }
          },
          _count: { select: { lessons: true, enrollments: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return { courses };
    } catch (error) {
      server.log.error(error, 'Error fetching teacher courses');
      throw error;
    }
  });

  /**
   * GET /courses/student
   * Get enrolled courses for current student with progress
   */
  server.get('/student', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const studentId = getCurrentUser(request).id;
    
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            teacher: { 
              select: { id: true, email: true },
              include: { teacherProfile: true }
            },
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
   * Get course details with lessons - for enrolled students or course owner
   */
  server.get<{ Params: { slug: string } }>('/:slug', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const { slug } = slugSchema.parse(request.params);
      
      const course = await prisma.course.findUnique({
        where: { slug },
        include: {
          teacher: { 
            select: { id: true, email: true },
            include: { teacherProfile: true }
          },
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, description: true, order: true }
          }
        }
      });
      
      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }
      
      // Check if user is enrolled or is the teacher
      const isTeacher = course.teacherId === getCurrentUser(request).id;
      
      // Only show course if published OR user is the teacher
      if (!course.published && !isTeacher && getCurrentUser(request).role !== 'ADMIN') {
        return reply.status(404).send({ error: 'Course not found' });
      }
      
      // Check enrollment for progress
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: getCurrentUser(request).id,
            courseId: course.id
          }
        }
      });
      
      return { 
        course,
        enrollment: enrollment ? { progress: enrollment.progress } : null,
        isTeacher
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      server.log.error(error, 'Error fetching course by slug');
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
      const teacherId = getCurrentUser(request).id;
      
      server.log.info({ teacherId, title: validated.title }, 'Creating new course');
      
      const course = await prisma.course.create({
        data: {
          title: validated.title,
          description: validated.description,
          imageUrl: validated.imageUrl,
          slug: generateSlug(validated.title),
          teacherId
        },
        include: {
          teacher: { select: { id: true, email: true } }
        }
      });
      
      server.log.info({ courseId: course.id }, 'Course created successfully');
      
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
      server.log.error(error, 'Error creating course');
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to create course'
      });
    }
  });

  /**
   * GET /courses/teacher/my-courses
   * Get all courses for the current teacher (including drafts)
   */
  server.get('/teacher/my-courses', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const teacherId = getCurrentUser(request).id;
      
      const courses = await prisma.course.findMany({
        where: { teacherId },
        include: {
          teacher: { 
            select: { id: true, email: true }
          },
          _count: { select: { lessons: true, enrollments: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return { courses };
    } catch (error) {
      server.log.error(error, 'Error fetching teacher courses');
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
      const teacherId = getCurrentUser(request).id;
      
      const existing = await prisma.course.findUnique({ where: { id } });
      
      if (!existing) {
        return reply.status(404).send({ error: 'Course not found' });
      }
      
      if (existing.teacherId !== teacherId && getCurrentUser(request).role !== 'ADMIN') {
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
      server.log.error(error, 'Error updating course');
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
      const studentId = getCurrentUser(request).id;
      
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
      server.log.error(error, 'Error enrolling in course');
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
      const teacherId = getCurrentUser(request).id;
      
      const existing = await prisma.course.findUnique({ where: { id } });
      
      if (!existing) {
        return reply.status(404).send({ error: 'Course not found' });
      }
      
      if (existing.teacherId !== teacherId && getCurrentUser(request).role !== 'ADMIN') {
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
      server.log.error(error, 'Error deleting course');
      throw error;
    }
  });
}
