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

  // GET /lessons - Public lessons from published courses
  server.get('/', async (request, reply) => {
    try {
      const lessons = await prisma.lesson.findMany({
        where: {
          status: 'PUBLIC',
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
        where: { teacherId, status: 'PUBLIC', course: { published: true } },
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

  // GET /lessons/:id - Public for viewing public lessons
  server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = lessonIdSchema.parse(request.params);

    const lesson = await lessonService.getLessonById(id);

    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const isPublic = lesson.status === 'PUBLIC';
    const coursePublished = lesson.course?.published;

    // Check if lesson is accessible without auth
    if (!coursePublished && !isPublic) {
      // Try to get user for enrollment check
      try {
        const currentUser = getCurrentUser(request);
        const isTeacher = lesson.teacherId === currentUser.id;
        
        if (!isTeacher && currentUser.role !== 'ADMIN') {
          if (lesson.course) {
            const enrollment = await prisma.enrollment.findUnique({
              where: { studentId_courseId: { studentId: currentUser.id, courseId: lesson.course.id } }
            });
            if (!enrollment) {
              return reply.status(403).send({ error: 'Enrollment required' });
            }
          } else if (!isPublic) {
            return reply.status(403).send({ error: 'Lesson not public' });
          }
        }
      } catch {
        // Not authenticated - only allow public lessons from published courses
        if (!coursePublished || !isPublic) {
          return reply.status(404).send({ error: 'Lesson not found' });
        }
      }
    }

    return { lesson };
  });

  // GET /lessons/:id/view - Full lesson view with progress and navigation
  // Public for PUBLIC lessons, authenticated for progress tracking
  server.get<{ Params: { id: string } }>('/:id/view', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { id } = request.params;
    const user = getCurrentUser(request);

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true, published: true, teacherId: true } },
        teacher: { select: { id: true, email: true } }
      }
    });

    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const progress = await prisma.lessonCompletion.findUnique({
      where: { lessonId_studentId: { lessonId: id, studentId: user.id } }
    });

    const siblings = lesson.courseId ? await prisma.lesson.findMany({
      where: { courseId: lesson.courseId },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true }
    }) : [];

    const idx = siblings.findIndex(l => l.id === id);

    return {
      lesson,
      isCompleted: !!progress?.completedAt,
      completedAt: progress?.completedAt ?? null,
      enrollmentProgress: null,
      navigation: {
        previousLesson: siblings[idx - 1] ?? null,
        nextLesson: siblings[idx + 1] ?? null,
      }
    };
  });

  // POST /lessons/:id/complete - Mark lesson as complete
  server.post<{ Params: { id: string } }>('/:id/complete', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { id } = request.params;
    const user = getCurrentUser(request);

    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const progress = await prisma.lessonCompletion.upsert({
      where: { lessonId_studentId: { lessonId: id, studentId: user.id } },
      update: { completedAt: new Date() },
      create: { lessonId: id, studentId: user.id, completedAt: new Date() }
    });

    const siblings = lesson.courseId ? await prisma.lesson.findMany({
      where: { courseId: lesson.courseId },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true }
    }) : [];

    const idx = siblings.findIndex(l => l.id === id);

    return {
      lessonId: id,
      completed: true,
      nextLesson: siblings[idx + 1] ?? null,
    };
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
