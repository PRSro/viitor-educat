import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole } from '../../core/middleware/permissionMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';
import { lessonService } from '../../services/lessonService.js';
import { prisma } from '../../models/prisma.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const createLessonSchema = z.object({
  courseId: z.string().min(1).optional(), // Optional: allows independent lessons
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1, 'Content is required').max(50000),
  order: z.number().optional(),
  status: z.enum(['DRAFT', 'PRIVATE', 'PUBLIC']).optional()
});

const updateLessonSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1).max(50000).optional(),
  order: z.number().optional(),
  status: z.enum(['DRAFT', 'PRIVATE', 'PUBLIC']).optional()
});

const lessonIdSchema = z.object({
  id: z.string().min(1, 'Lesson ID is required'),
});

export async function lessonRoutes(server: FastifyInstance) {

  // GET /lessons (Public lessons from published courses)
  server.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    try {
      const lessons = await prisma.lesson.findMany({
        where: {
          status: 'public',
          OR: [
            { courseId: null },
            { course: { published: true } }
          ]
        },
        include: {
          teacher: { select: { id: true, email: true } },
          course: { select: { id: true, title: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20 // Limit for safety
      });
      return { lessons };
    } catch (error) {
      server.log.error(error);
      throw error;
    }
  });

  // GET /lessons/teacher/:teacherId (All lessons for a teacher)
  server.get<{ Params: { teacherId: string } }>('/teacher/:teacherId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { teacherId } = request.params;
    const currentUser = getCurrentUser(request);

    // Only allow teacher to see their own private lessons, or admin
    // If viewing another teacher, only show public/published-course lessons?
    // For simplicity, let's enforce: you can only see granular lessons list for yourself or if Admin.
    // Front-end likely uses this for "My Lessons".

    if (teacherId !== currentUser.id && currentUser.role !== 'ADMIN') {
      const publicLessons = await prisma.lesson.findMany({
        where: { teacherId, status: 'public', course: { published: true } },
        include: { course: { select: { id: true, title: true } } }
      });
      return { lessons: publicLessons };
    }

    const lessons = await prisma.lesson.findMany({
      where: { teacherId },
      include: {
        course: { select: { id: true, title: true, published: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { lessons };
  });

  // GET /lessons/:id
  server.get<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { id } = lessonIdSchema.parse(request.params);
    const currentUser = getCurrentUser(request);

    const lesson = await lessonService.getLessonById(id);

    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const isTeacher = lesson.teacherId === currentUser.id;
    const isPublic = lesson.status === 'public';

    // Access Control:
    // Teacher/Admin can always view any lesson.
    if (!isTeacher && currentUser.role !== 'ADMIN') {
      if (lesson.course) {
        // Course-bound lesson: check if course is published and student is enrolled
        if (!lesson.course.published) {
          return reply.status(404).send({ error: 'Lesson not found' });
        }

        const enrollment = await prisma.enrollment.findUnique({
          where: { studentId_courseId: { studentId: currentUser.id, courseId: lesson.course.id } }
        });

        if (!enrollment && !isPublic) {
          return reply.status(403).send({ error: 'Enrollment required' });
        }
      } else {
        // Independent lesson: only accessible if public
        if (!isPublic) {
          return reply.status(403).send({ error: 'This lesson is private' });
        }
      }
    }

    return { lesson, isTeacher };
  });

  // POST /lessons
  server.post('/', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    try {
      const validated = createLessonSchema.parse(request.body);
      const teacherId = getCurrentUser(request).id;

      // If courseId provided, verify course ownership
      if (validated.courseId) {
        const course = await prisma.course.findUnique({ where: { id: validated.courseId } });
        if (!course) return reply.status(404).send({ error: 'Course not found' });
        if (course.teacherId !== teacherId && getCurrentUser(request).role !== 'ADMIN') {
          return reply.status(403).send({ error: 'Forbidden: You do not own this course' });
        }
      }

      const lesson = await lessonService.createLesson(teacherId, {
        title: validated.title,
        content: validated.content,
        description: validated.description,
        order: validated.order,
        courseId: validated.courseId
      });

      return reply.status(201).send({ message: 'Lesson created', lesson });
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Validation failed', message: formatZodError(error) });
      throw error;
    }
  });

  // PUT /lessons/:id
  server.put<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const { id } = lessonIdSchema.parse(request.params);
    const validated = updateLessonSchema.parse(request.body);
    const currentUser = getCurrentUser(request);

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Lesson not found' });
    if (existing.teacherId !== currentUser.id && currentUser.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

    const updated = await lessonService.updateLesson(id, validated);
    return { message: 'Lesson updated', lesson: updated };
  });

  // DELETE /lessons/:id
  server.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const { id } = lessonIdSchema.parse(request.params);
    const currentUser = getCurrentUser(request);

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Lesson not found' });
    if (existing.teacherId !== currentUser.id && currentUser.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

    await lessonService.deleteLesson(id);
    return { message: 'Lesson deleted' };
  });
}
