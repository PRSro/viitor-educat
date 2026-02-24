import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole, requireRole } from '../../core/middleware/permissionMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';
import { courseService } from '../../services/courseService.js';
import { prisma } from '../../models/prisma.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

// Updated z schemas to match new hierarchy
const lessonInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  description: z.string().optional(),
  order: z.number().default(0),
  status: z.enum(['PRIVATE', 'PUBLIC', 'DRAFT']).optional()
});

const createCourseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PRIVATE', 'PUBLIC']).optional(),
  lessons: z.array(lessonInputSchema).optional()
});

const updateCourseSchema = createCourseSchema.partial().extend({
  published: z.boolean().optional(),
});

const courseIdSchema = z.object({ id: z.string().min(1) });
const slugSchema = z.object({ slug: z.string().min(1) });

export async function courseRoutes(server: FastifyInstance) {

  // GET /courses - Public endpoint for published courses
  server.get('/', async (request, reply) => {
    try {
      const courses = await prisma.course.findMany({
        where: { published: true },
        include: {
          teacher: {
            select: {
              id: true,
              email: true,
              teacherProfile: true
            }
          },
          _count: { select: { lessons: true, enrollments: true } },
          lessons: {
            orderBy: { order: 'asc' },
            take: 3,
            select: { id: true, title: true, description: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return { courses };
    } catch (error) {
      server.log.error(error);
      throw error;
    }
  });

  // GET /courses/student (Enrolled)
  server.get('/student', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const studentId = getCurrentUser(request).id;
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

  // GET /courses/teacher/my-courses (Current teacher's courses)
  server.get('/teacher/my-courses', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const teacherId = getCurrentUser(request).id;
    const courses = await prisma.course.findMany({
      where: { teacherId },
      include: {
        teacher: { select: { id: true, email: true } },
        _count: { select: { lessons: true, enrollments: true } },
        lessons: { orderBy: { order: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { courses };
  });

  // GET /courses/teacher/:teacherId
  server.get<{ Params: { teacherId: string } }>('/teacher/:teacherId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { teacherId } = request.params;
    const courses = await prisma.course.findMany({
      where: { teacherId },
      include: {
        teacher: { select: { id: true, email: true } },
        _count: { select: { lessons: true, enrollments: true } },
        lessons: { orderBy: { order: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { courses };
  });

  // GET /courses/id/:id - Public for viewing published courses
  server.get<{ Params: { id: string } }>('/id/:id', async (request, reply) => {
    const { id } = courseIdSchema.parse(request.params);

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, email: true, teacherProfile: true } },
        _count: { select: { lessons: true, enrollments: true } },
        lessons: { 
          orderBy: { order: 'asc' },
          select: { id: true, title: true, description: true, status: true }
        }
      }
    });

    if (!course) return reply.status(404).send({ error: 'Course not found' });

    // Allow access to published courses without auth
    if (!course.published) {
      return reply.status(404).send({ error: 'Course not found' });
    }

    // Filter private lessons for guests
    course.lessons = course.lessons.filter((l: any) => l.status !== 'PRIVATE');

    return { course };
  });

  // GET /courses/:id/lessons
  server.get<{ Params: { id: string } }>('/:id/lessons', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { id } = courseIdSchema.parse(request.params);
    const lessons = await prisma.lesson.findMany({
      where: { courseId: id },
      orderBy: { order: 'asc' }
    });
    return { lessons };
  });

  // GET /courses/:slug - Public endpoint for viewing published courses
  server.get<{ Params: { slug: string } }>('/:slug', async (request, reply) => {
    const { slug } = slugSchema.parse(request.params);

    const course = await courseService.getCourseBySlug(slug);

    if (!course) return reply.status(404).send({ error: 'Course not found' });

    // Allow access to published courses without auth
    if (!course.published) {
      return reply.status(404).send({ error: 'Course not found' });
    }

    // Try to get user info if authenticated
    let enrollment = null;
    let isTeacher = false;
    let currentUser = null;
    
    try {
      currentUser = getCurrentUser(request);
      if (currentUser) {
        isTeacher = course.teacherId === currentUser.id;
        if (currentUser.role === 'STUDENT') {
          enrollment = await prisma.enrollment.findUnique({
            where: { studentId_courseId: { studentId: currentUser.id, courseId: course.id } }
          });
        }
      }
    } catch {
      // Not authenticated - that's fine, user is guest
    }

    // Filter out private lessons for non-teachers
    if (!isTeacher && (!currentUser || currentUser.role !== 'ADMIN')) {
      (course as any).lessons = course.lessons.filter((l: any) => l.status !== 'PRIVATE');
    }

    return { course, enrollment, isTeacher };
  });

  // POST /courses (Create)
  server.post('/', { preHandler: [authMiddleware, teacherOnly] }, async (request, reply) => {
    try {
      const validated = createCourseSchema.parse(request.body);
      const currentUser = getCurrentUser(request);

      const newCourse = await courseService.create({
        title: validated.title,
        description: validated.description,
        imageUrl: validated.imageUrl,
        level: validated.level,
        category: validated.category,
        tags: validated.tags,
        teacherId: currentUser.id,
        lessons: validated.lessons
      }, currentUser.role);

      return reply.status(201).send({ message: 'Course created', course: newCourse });
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Validation failed', message: formatZodError(error) });
      throw error;
    }
  });

  // PUT /courses/:id (Update)
  server.put<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    try {
      const { id } = courseIdSchema.parse(request.params);
      const validated = updateCourseSchema.parse(request.body);
      const currentUser = getCurrentUser(request);

      const { lessons, ...courseData } = validated;

      const updated = await courseService.update(
        id,
        courseData,
        currentUser.id,
        currentUser.role,
        lessons
      );
      return { message: 'Course updated', course: updated };
    } catch (error: any) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Validation failed', message: formatZodError(error) });
      if (error.message === 'NOT_FOUND') return reply.status(404).send({ error: 'Course not found' });
      if (error.message === 'FORBIDDEN') return reply.status(403).send({ error: 'Forbidden' });
      if (error.message === 'COURSE_EMPTY') return reply.status(400).send({ error: 'Course must have at least one lesson to publish' });
      throw error;
    }
  });

  // DELETE /courses/:id
  server.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    try {
      const { id } = courseIdSchema.parse(request.params);
      const currentUser = getCurrentUser(request);

      await courseService.delete(id, currentUser.id, currentUser.role);
      return { message: 'Course deleted' };
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') return reply.status(404).send({ error: 'Course not found' });
      if (error.message === 'FORBIDDEN') return reply.status(403).send({ error: 'Forbidden' });
      throw error;
    }
  });

  // POST /courses/:id/enroll
  server.post<{ Params: { id: string } }>('/:id/enroll', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { id } = courseIdSchema.parse(request.params);
    const studentId = getCurrentUser(request).id;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course || !course.published) return reply.status(404).send({ error: 'Course not found' });

    const existing = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId: id } } });
    if (existing) return reply.status(400).send({ error: 'Already enrolled' });

    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId: id }
    });
    return reply.status(201).send({ message: 'Enrolled', enrollment });
  });

  // GET /courses/:id/export (JSON Draft)
  server.get<{ Params: { id: string } }>('/:id/export', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const { id } = courseIdSchema.parse(request.params);
    const currentUser = getCurrentUser(request);

    const course = await courseService.getCourseById(id);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    if (course.teacherId !== currentUser.id && currentUser.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

    // Format for export
    const exportData = {
      course: {
        title: course.title,
        description: course.description,
        status: 'DRAFT', // Always export as draft for safety when re-importing? Or keep status.
        lessons: course.lessons.map((l: any) => ({
          title: l.title,
          content: l.content,
          status: 'DRAFT' // Reset to draft
        }))
      }
    };

    reply.header('Content-Disposition', `attachment; filename="${course.slug}.json"`);
    return exportData;
  });
}
