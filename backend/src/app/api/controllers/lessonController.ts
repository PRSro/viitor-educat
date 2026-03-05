import { FastifyRequest, FastifyReply } from 'fastify';
import { lessonService } from '../../services/lessonService.js';
import { prisma } from '../../models/prisma.js';
import { JwtPayload } from '../../core/middleware/authMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const createLessonSchema = z.object({
  courseId: z.string().min(1).optional(),
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

export const lessonController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const lessons = await prisma.lesson.findMany({
      where: {
        status: 'PUBLIC',
        OR: [
          { courseId: null },
          { course: { published: true } }
        ]
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        content: true,
        status: true,
        order: true,
        courseId: true,
        teacherId: true,
        createdAt: true,
        updatedAt: true,
        teacher: { select: { id: true, email: true } },
        course: { select: { id: true, title: true, slug: true, published: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return { lessons };
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = lessonIdSchema.parse(request.params);

    const lesson = await lessonService.getLessonById(id);

    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const isPublic = lesson.status === 'PUBLIC';
    const coursePublished = lesson.course?.published;

    if (!coursePublished && !isPublic) {
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
        if (!coursePublished || !isPublic) {
          return reply.status(404).send({ error: 'Lesson not found' });
        }
      }
    }

    return { lesson };
  },

  async getTeacherLessons(request: FastifyRequest<{ Params: { teacherId: string } }>, reply: FastifyReply) {
    const { teacherId } = request.params;
    const currentUser = getCurrentUser(request);

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
  },

  async view(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const user = getCurrentUser(request);

    const lesson = await prisma.lesson.findFirst({
      where: {
        OR: [
          { slug: id },
          { id: id }
        ]
      },
      include: {
        course: { select: { id: true, title: true, slug: true, published: true, teacherId: true } },
        teacher: { select: { id: true, email: true, teacherProfile: true } },
        externalResources: true,
        flashcards: true
      }
    });

    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const isTeacher = lesson.teacherId === user.id || user.role === 'ADMIN';

    if (!isTeacher && lesson.courseId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: user.id, courseId: lesson.courseId } }
      });
      if (!enrollment || enrollment.status !== 'ACTIVE') {
        return reply.status(403).send({
          error: 'Enrollment required',
          message: 'You must be enrolled in this course to view this lesson',
          courseSlug: lesson.course?.slug
        });
      }

      await prisma.enrollment.update({
        where: { studentId_courseId: { studentId: user.id, courseId: lesson.courseId } },
        data: { lastAccessedLessonId: lesson.id }
      });
    }

    const progress = await prisma.lessonCompletion.findUnique({
      where: { lessonId_studentId: { lessonId: lesson.id, studentId: user.id } }
    });

    const siblings = lesson.courseId ? await prisma.lesson.findMany({
      where: { courseId: lesson.courseId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, slug: true, title: true, order: true }
    }) : [];

    const idx = siblings.findIndex(l => l.id === lesson.id);

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
  },

  async complete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const user = getCurrentUser(request);

    const lesson = await prisma.lesson.findFirst({
      where: { OR: [{ slug: id }, { id }] }
    });
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    await prisma.lessonCompletion.upsert({
      where: { lessonId_studentId: { lessonId: lesson.id, studentId: user.id } },
      update: { completedAt: new Date() },
      create: { lessonId: lesson.id, studentId: user.id, completedAt: new Date() }
    });

    if (lesson.courseId) {
      const [totalLessons, completedCount] = await Promise.all([
        prisma.lesson.count({ where: { courseId: lesson.courseId } }),
        prisma.lessonCompletion.count({
          where: { studentId: user.id, lesson: { courseId: lesson.courseId } }
        })
      ]);
      const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      await prisma.enrollment.updateMany({
        where: { studentId: user.id, courseId: lesson.courseId },
        data: {
          completedLessonsCount: completedCount,
          progress,
          status: progress === 100 ? 'COMPLETED' : 'ACTIVE'
        }
      });
    }

    const siblings = lesson.courseId ? await prisma.lesson.findMany({
      where: { courseId: lesson.courseId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, slug: true, title: true, order: true }
    }) : [];

    const idx = siblings.findIndex(l => l.id === lesson.id);

    return {
      lessonId: lesson.id,
      lessonSlug: lesson.slug,
      completed: true,
      nextLesson: siblings[idx + 1] ?? null,
    };
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = createLessonSchema.parse(request.body);
      const teacherId = getCurrentUser(request).id;

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
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = lessonIdSchema.parse(request.params);
    const validated = updateLessonSchema.parse(request.body);
    const currentUser = getCurrentUser(request);

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Lesson not found' });
    if (existing.teacherId !== currentUser.id && currentUser.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

    const updated = await lessonService.updateLesson(id, validated);
    return { message: 'Lesson updated', lesson: updated };
  },

  async remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = lessonIdSchema.parse(request.params);
    const currentUser = getCurrentUser(request);

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Lesson not found' });
    if (existing.teacherId !== currentUser.id && currentUser.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

    await lessonService.deleteLesson(id);
    return { message: 'Lesson deleted' };
  }
};
