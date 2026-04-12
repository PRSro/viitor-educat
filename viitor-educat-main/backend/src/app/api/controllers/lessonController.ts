import { FastifyRequest, FastifyReply } from 'fastify';
import { lessonService } from '../../services/lessonService.js';
import { prisma } from '../../models/prisma.js';
import { JwtPayload } from '../../core/middleware/authMiddleware.js';
import { z } from 'zod';
import { formatZodError, createLessonSchema, updateLessonSchema } from '../../schemas/validation/schemas.js';
import { awardPoints } from '../../services/pointsService.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const lessonIdSchema = z.object({
  id: z.string().min(1, 'Lesson ID is required'),
});

export const lessonController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { page?: string; limit?: string };
    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20')));
    const skip = (page - 1) * limit;

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where: { status: 'PUBLIC' },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          order: true,
          teacherId: true,
          createdAt: true,
          updatedAt: true,
          teacher: { select: { id: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.lesson.count({ where: { status: 'PUBLIC' } })
    ]);

    return {
      lessons,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = lessonIdSchema.parse(request.params);

    const lesson = await lessonService.getLessonById(id);

    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const isPublic = lesson.status === 'PUBLIC';

    if (!isPublic) {
      try {
        const currentUser = getCurrentUser(request);
        const isTeacher = lesson.teacherId === currentUser.id;

        if (!isTeacher && currentUser.role !== 'ADMIN') {
          return reply.status(403).send({ error: 'Lesson not public' });
        }
      } catch {
        return reply.status(404).send({ error: 'Lesson not found' });
      }
    }

    return { lesson };
  },

  async getTeacherLessons(request: FastifyRequest<{ Params: { teacherId: string } }>, reply: FastifyReply) {
    const { teacherId } = request.params;
    const currentUser = getCurrentUser(request);

    if (teacherId !== currentUser.id && currentUser.role !== 'ADMIN') {
      const publicLessons = await prisma.lesson.findMany({
        where: { teacherId, status: 'PUBLIC' }
      });
      return { lessons: publicLessons };
    }

    const lessons = await prisma.lesson.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' }
    });
    return { lessons };
  },

  async view(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const user = getCurrentUser(request);

    const lesson = await prisma.lesson.findUnique({
      where: { id: id },
      include: {
        teacher: { select: { id: true, email: true, teacherProfile: true } },
        externalResources: true,
        flashcards: true,
        questions: { orderBy: { order: 'asc' } }
      }
    });

    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const isTeacher = lesson.teacherId === user.id || user.role === 'ADMIN';

    if (!isTeacher && lesson.status !== 'PUBLIC') {
        return reply.status(403).send({ error: 'Lesson not public' });
    }

    const progress = await prisma.lessonCompletion.findUnique({
      where: { lessonId_studentId: { lessonId: lesson.id, studentId: user.id } }
    });

    // FIX 7: Query adjacent PUBLIC lessons by same teacher for navigation
    const [previousLesson, nextLesson] = await Promise.all([
      prisma.lesson.findFirst({
        where: {
          teacherId: lesson.teacherId,
          status: 'PUBLIC',
          order: { lt: lesson.order }
        },
        select: { id: true, title: true, order: true },
        orderBy: { order: 'desc' }
      }),
      prisma.lesson.findFirst({
        where: {
          teacherId: lesson.teacherId,
          status: 'PUBLIC',
          order: { gt: lesson.order }
        },
        select: { id: true, title: true, order: true },
        orderBy: { order: 'asc' }
      })
    ]);

    return {
      lesson,
      isCompleted: !!progress?.completedAt,
      completedAt: progress?.completedAt ?? null,
      enrollmentProgress: null,
      navigation: {
        previousLesson,
        nextLesson,
      }
    };
  },

  async complete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const user = getCurrentUser(request);

    const lesson = await prisma.lesson.findUnique({
      where: { id }
    });
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    await prisma.lessonCompletion.upsert({
      where: { lessonId_studentId: { lessonId: lesson.id, studentId: user.id } },
      update: { completedAt: new Date() },
      create: { lessonId: lesson.id, studentId: user.id, completedAt: new Date() }
    });

    await awardPoints(user.id, 'LESSON_COMPLETE', { lessonId: lesson.id });

    return {
      lessonId: lesson.id,
      completed: true,
      nextLesson: null,
    };
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = createLessonSchema.parse(request.body);
      const teacherId = getCurrentUser(request).id;

      const lesson = await lessonService.createLesson(teacherId, {
        title: validated.title,
        content: validated.content,
        description: validated.description,
        order: validated.order,
        status: validated.status as any,
        questions: validated.questions
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
  },

  async submitAnswer(request: FastifyRequest<{ Params: { id: string; questionId: string }; Body: { answer: string } }>, reply: FastifyReply) {
    const { id: lessonId, questionId } = request.params;
    const { answer } = request.body;
    const user = getCurrentUser(request);

    // Ensure lesson exists
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId }
    });
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    // FIX 20: Students can only submit answers to PUBLIC lessons
    if (user.role === 'STUDENT' && lesson.status !== 'PUBLIC') {
      return reply.status(403).send({ error: 'Lesson not accessible' });
    }

    // Ensure question exists
    const question = await prisma.lessonQuestion.findUnique({
        where: { id: questionId }
    });
    if (!question || question.lessonId !== lesson.id) {
        return reply.status(404).send({ error: 'Question not found' });
    }

    // Upsert response
    const response = await prisma.lessonResponse.upsert({
        where: { userId_questionId: { userId: user.id, questionId } },
        create: {
            id: `${user.id}_${questionId}`,
            userId: user.id,
            lessonId: lesson.id,
            questionId,
            answer
        },
        update: {
            answer,
            updatedAt: new Date()
        }
    });

    // Check answer — case-insensitive, trim whitespace
    const correct = question.correctAnswer
      ? answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
      : null; // open-ended question, no correct answer stored

    if (correct) {
      await awardPoints(user.id, 'CORRECT_ANSWER', { questionId });
    }

    return { 
      success: true, 
      correct,
      correctAnswer: correct === false ? question.correctAnswer : undefined, // reveal on wrong
      hint: correct === false ? question.hint ?? null : null,
    };
  }
};
