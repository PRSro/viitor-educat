import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole, requireRole } from '../../core/middleware/permissionMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';
import { courseService } from '../../services/courseService.js';
import { prisma } from '../../models/prisma.js';
import { courseController } from '../controllers/courseController.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

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

  server.get('/', courseController.getAll);

  server.get('/student', {
    preHandler: [authMiddleware, anyRole]
  }, courseController.getStudentCourses);

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

    if (!course.published) {
      return reply.status(404).send({ error: 'Course not found' });
    }

    course.lessons = course.lessons.filter((l: any) => l.status !== 'PRIVATE');

    return { course };
  });

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

  server.get('/:slug', courseController.getBySlug);

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

  server.delete('/:id', {
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

  server.get<{ Params: { id: string } }>('/:id/export', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const { id } = courseIdSchema.parse(request.params);
    const currentUser = getCurrentUser(request);

    const course = await courseService.getCourseById(id);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    if (course.teacherId !== currentUser.id && currentUser.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

    const exportData = {
      course: {
        title: course.title,
        description: course.description,
        status: 'DRAFT',
        lessons: course.lessons.map((l: any) => ({
          title: l.title,
          content: l.content,
          status: 'DRAFT'
        }))
      }
    };

    reply.header('Content-Disposition', `attachment; filename="${course.slug}.json"`);
    return exportData;
  });

  server.post('/:courseId/enroll', {
    preHandler: [authMiddleware, requireRole(['STUDENT'])]
  }, (request: FastifyRequest, reply: FastifyReply) => courseController.enroll(request as any, reply));

  server.delete('/:courseId/enroll', {
    preHandler: [authMiddleware, requireRole(['STUDENT'])]
  }, (request: FastifyRequest, reply: FastifyReply) => courseController.unenroll(request as any, reply));

  server.get('/:courseId/enrollment', {
    preHandler: [authMiddleware, requireRole(['STUDENT'])]
  }, async (request, reply) => {
    try {
      const user = getCurrentUser(request);
      const courseId = (request.params as any).courseId;

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: user.id,
            courseId
          }
        }
      });

      if (!enrollment) {
        return { enrolled: false, enrollment: null };
      }

      return { 
        enrolled: enrollment.status === 'ACTIVE', 
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt
        }
      };
    } catch (error) {
      throw error;
    }
  });
}
