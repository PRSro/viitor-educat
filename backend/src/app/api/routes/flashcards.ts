import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole, requireRole } from '../../core/middleware/permissionMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';
import { prisma } from '../../models/prisma.js';
import { AiService } from '../../services/aiService.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const createFlashcardSchema = z.object({
  question: z.string().min(1, 'Question is required').max(1000),
  answer: z.string().min(1, 'Answer is required').max(2000),
  courseId: z.string().optional().nullable(),
});

const updateFlashcardSchema = createFlashcardSchema.partial();

const flashcardQuerySchema = z.object({
  courseId: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

/**
 * Flashcard Routes
 * 
 * Permissions:
 * - GET /flashcards - All authenticated users can view flashcards
 * - GET /flashcards/:id - View flashcard details
 * - POST /flashcards - Teacher/Admin can create flashcards
 * - PUT /flashcards/:id - Teacher/Admin can update their flashcards
 * - DELETE /flashcards/:id - Teacher/Admin can delete their flashcards
 * - GET /flashcards/course/:courseId - Get flashcards by course
 * - GET /flashcards/lesson/:lessonId - Get flashcards by lesson
 */

// TODO: Implement spaced repetition algorithm for optimal learning
// TODO: Add flashcard usage analytics for recommendations
// TODO: Add study streak tracking per user

export async function flashcardRoutes(server: FastifyInstance) {

  /**
   * GET /flashcards
   * List all flashcards with filtering and pagination
   */
  server.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = flashcardQuerySchema.parse(request.query);
      const { courseId, page, limit } = query;

      const where: any = {};

      if (courseId) {
        where.courseId = courseId;
      }

      const [flashcards, total] = await Promise.all([
        prisma.flashcard.findMany({
          where,
          select: {
            id: true,
            question: true,
            answer: true,
            courseId: true,
            createdAt: true,
            course: { select: { id: true, title: true, slug: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.flashcard.count({ where })
      ]);

      return {
        flashcards,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
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
   * GET /flashcards/course/:courseId
   * Get all flashcards for a specific course (organized as deck)
   */
  server.get<{ Params: { courseId: string } }>('/course/:courseId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { courseId } = request.params;

    const flashcards = await prisma.flashcard.findMany({
      where: { courseId },
      select: {
        id: true,
        question: true,
        answer: true,
        courseId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      flashcards,
      totalCount: flashcards.length
    };
  });

  /**
   * GET /flashcards/lesson/:lessonId
   * Get all flashcards for a specific lesson
   */
  server.get<{ Params: { lessonId: string } }>('/lesson/:lessonId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { lessonId } = request.params;

    const flashcards = await prisma.flashcard.findMany({
      where: { lessonId },
      select: {
        id: true,
        question: true,
        answer: true,
        lessonId: true,
        courseId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      flashcards,
      totalCount: flashcards.length
    };
  });

  /**
   * GET /flashcards/:id
   * Get flashcard details by ID
   */
  server.get<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const flashcard = await prisma.flashcard.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true } }
      }
    });

    if (!flashcard) {
      return reply.status(404).send({ error: 'Flashcard not found' });
    }

    return { flashcard };
  });

  /**
   * POST /flashcards
   * Create a new flashcard (Teacher/Admin only)
   */
  server.post('/', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = createFlashcardSchema.parse(request.body);
      const teacherId = getCurrentUser(request).id;

      const flashcard = await prisma.flashcard.create({
        data: {
          ...validated,
          teacherId
        },
        include: {
          course: { select: { id: true, title: true, slug: true } }
        }
      });

      return reply.status(201).send({
        message: 'Flashcard created successfully',
        flashcard
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
   * POST /flashcards/bulk
   * Create multiple flashcards at once (Teacher/Admin only)
   */
  server.post('/bulk', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const schema = z.object({
        flashcards: z.array(createFlashcardSchema).min(1).max(50),
      });

      const { flashcards: flashcardsData } = schema.parse(request.body);
      const teacherId = getCurrentUser(request).id;

      const processedData = flashcardsData.map(card => ({
        ...card,
        teacherId
      }));

      const flashcards = await prisma.flashcard.createMany({
        data: processedData,
      });

      return reply.status(201).send({
        message: `${flashcards.count} flashcards created successfully`,
        count: flashcards.count
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
   * PUT /flashcards/:id
   * Update a flashcard (Teacher/Admin only)
   */
  server.put<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const validated = updateFlashcardSchema.parse(request.body);

      const existing = await prisma.flashcard.findUnique({ where: { id } });

      if (!existing) {
        return reply.status(404).send({ error: 'Flashcard not found' });
      }

      const flashcard = await prisma.flashcard.update({
        where: { id },
        data: validated,
        include: {
          course: { select: { id: true, title: true, slug: true } }
        }
      });

      return { message: 'Flashcard updated successfully', flashcard };
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
   * DELETE /flashcards/:id
   * Delete a flashcard (Teacher/Admin only)
   */
  server.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const existing = await prisma.flashcard.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({ error: 'Flashcard not found' });
    }

    await prisma.flashcard.delete({ where: { id } });

    return { message: 'Flashcard deleted successfully' };
  });

  /**
   * GET /flashcards/study/prompts/:lessonId
   * Generate study prompts from lesson content (placeholder logic)
   * TODO: Implement AI-powered prompt generation
   */
  server.get<{ Params: { lessonId: string } }>('/study/prompts/:lessonId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { lessonId } = request.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: { select: { id: true, title: true } }
      }
    });

    if (!lesson) {
      return reply.status(404).send({ error: 'Lesson not found' });
    }

    const contentText = lesson.content.replace(/<[^>]+>/g, '').slice(0, 500);
    const sentences = contentText.split(/[.!?]+/).filter(s => s.trim().length > 10);

    const prompts = sentences.slice(0, 5).map((sentence, index) => ({
      id: `prompt-${index}`,
      question: `What is the main concept in: "${sentence.trim().substring(0, 100)}..."?`,
      topic: lesson.title,
      lessonId: lesson.id,
      courseId: lesson.courseId,
      courseTitle: lesson.course?.title || 'Course Content'
    }));

    return {
      prompts,
      lesson: { id: lesson.id, title: lesson.title },
      message: 'AI-powered prompt generation coming soon. These are basic prompts based on lesson content.'
    };
  });

  /**
   * GET /flashcards/study/prompts/article/:articleId
   * Generate study prompts from article content (placeholder logic)
   * TODO: Implement AI-powered prompt generation
   */
  server.get<{ Params: { articleId: string } }>('/study/prompts/article/:articleId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { articleId } = request.params;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return reply.status(404).send({ error: 'Article not found' });
    }

    // Placeholder: Generate simple prompts from article content
    // TODO: Replace with AI-powered prompt generation
    const contentText = article.content.replace(/<[^>]+>/g, '').slice(0, 500);
    const sentences = contentText.split(/[.!?]+/).filter(s => s.trim().length > 10);

    const prompts = sentences.slice(0, 5).map((sentence, index) => ({
      id: `prompt-${index}`,
      question: `Explain the significance of: "${sentence.trim().substring(0, 100)}..."`,
      topic: article.title,
      articleId: article.id,
      category: article.category
    }));

    return {
      prompts,
      article: { id: article.id, title: article.title, category: article.category },
      message: 'AI-powered prompt generation coming soon. These are basic prompts based on article content.'
    };
  });

  /**
   * POST /flashcards/generate/lesson/:lessonId
   * Generate flashcards using AI from lesson content
   */
  server.post<{ Params: { lessonId: string } }>('/generate/lesson/:lessonId', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request, reply) => {
    const { lessonId } = request.params;
    const { count = 5 } = (request.body as any) || {};

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return reply.status(404).send({ error: 'Lesson not found' });
    }

    try {
      const generatedCards = await AiService.generateFlashcards(lesson.content, count);
      const teacherId = getCurrentUser(request).id;

      // Optionally save to DB immediately
      const createdCards = await prisma.flashcard.createMany({
        data: generatedCards.map(card => ({
          ...card,
          lessonId,
          courseId: lesson.courseId,
          teacherId
        }))
      });

      return {
        message: `Successfully generated and saved ${createdCards.count} flashcards`,
        cards: generatedCards
      };
    } catch (error: any) {
      return reply.status(500).send({
        error: 'Failed to generate flashcards',
        message: error.message
      });
    }
  });

  /**
   * POST /flashcards/generate/article/:articleId
   * Generate flashcards using AI from article content
   */
  server.post<{ Params: { articleId: string } }>('/generate/article/:articleId', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request, reply) => {
    const { articleId } = request.params;
    const { count = 5 } = (request.body as any) || {};

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return reply.status(404).send({ error: 'Article not found' });
    }

    try {
      const generatedCards = await AiService.generateFlashcards(article.content, count);
      const teacherId = getCurrentUser(request).id;

      const createdCards = await prisma.flashcard.createMany({
        data: generatedCards.map(card => ({
          ...card,
          teacherId
        }))
      });

      return {
        message: `Successfully generated and saved ${createdCards.count} flashcards`,
        cards: generatedCards
      };
    } catch (error: any) {
      return reply.status(500).send({
        error: 'Failed to generate flashcards',
        message: error.message
      });
    }
  });
}
