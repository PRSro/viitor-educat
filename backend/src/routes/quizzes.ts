/**
 * Quiz Routes
 * Full quiz functionality including questions and attempts
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, JwtPayload } from '../middleware/authMiddleware.js';
import { teacherOnly, anyRole, adminOnly, requireRole } from '../middleware/permissionMiddleware.js';
import { z } from 'zod';

const prisma = new PrismaClient();

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  lessonId: z.string().optional(),
  courseId: z.string().optional(),
  published: z.boolean().optional(),
  timeLimit: z.number().int().positive().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
});

const updateQuizSchema = createQuizSchema.partial();

const createQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']).optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().optional(),
  order: z.number().int().optional(),
  points: z.number().int().positive().optional(),
});

const submitAnswerSchema = z.record(z.string(), z.string());

interface QuizParams {
  id: string;
}

interface CourseParams {
  courseId: string;
}

interface LessonParams {
  lessonId: string;
}

interface QuizQuestionParams {
  quizId: string;
  questionId: string;
}

export async function quizRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /quizzes
   * List all quizzes (published for students, all for teachers)
   */
  fastify.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = getCurrentUser(request);
      const { courseId, lessonId, published } = request.query as { 
        courseId?: string; 
        lessonId?: string; 
        published?: string 
      };

      const where: any = {};

      if (user.role === 'STUDENT') {
        where.published = true;
      }

      if (courseId) where.courseId = courseId;
      if (lessonId) where.lessonId = lessonId;
      if (published) where.published = published === 'true';

      const quizzes = await prisma.quiz.findMany({
        where,
        include: {
          teacher: { select: { id: true, email: true } },
          course: { select: { id: true, title: true, slug: true } },
          _count: { select: { questions: true, attempts: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return { quizzes };
    } catch (error) {
      fastify.log.error(error, 'Error fetching quizzes');
      throw error;
    }
  });

  /**
   * GET /quizzes/teacher/my-quizzes
   * Get all quizzes created by current teacher
   */
  fastify.get('/teacher/my-quizzes', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const teacherId = getCurrentUser(request).id;

      const quizzes = await prisma.quiz.findMany({
        where: { teacherId },
        include: {
          course: { select: { id: true, title: true, slug: true } },
          _count: { select: { questions: true, attempts: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return { quizzes };
    } catch (error) {
      fastify.log.error(error, 'Error fetching teacher quizzes');
      throw error;
    }
  });

  /**
   * GET /quizzes/:id
   * Get quiz details (with questions if teacher/owner, without if student)
   */
  fastify.get<{ Params: QuizParams }>('/:id', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: QuizParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = getCurrentUser(request);

      const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
          teacher: { select: { id: true, email: true } },
          course: { select: { id: true, title: true, slug: true } }
        }
      });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      // Fetch questions separately
      const questions = await prisma.quizQuestion.findMany({
        where: { quizId: id },
        orderBy: { order: 'asc' }
      });

      // Students can only see published quizzes
      if (user.role === 'STUDENT' && !quiz.published) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      // Hide correct answers for students
      const safeQuestions = questions.map(q => ({
        ...q,
        correctAnswer: user.role === 'STUDENT' ? '' : q.correctAnswer,
        explanation: user.role === 'STUDENT' ? '' : q.explanation
      }));

      return { quiz: { ...quiz, questions: safeQuestions } };
    } catch (error) {
      fastify.log.error(error, 'Error fetching quiz');
      throw error;
    }
  });

  /**
   * POST /quizzes
   * Create a new quiz
   */
  fastify.post('/', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = createQuizSchema.parse(request.body);
      const teacherId = getCurrentUser(request).id;

      // Verify course ownership if provided
      if (validated.courseId) {
        const course = await prisma.course.findUnique({
          where: { id: validated.courseId }
        });
        if (!course || course.teacherId !== teacherId) {
          return reply.status(403).send({ 
            error: 'Forbidden',
            message: 'You can only create quizzes for your own courses'
          });
        }
      }

      const quiz = await prisma.quiz.create({
        data: {
          ...validated,
          teacherId
        },
        include: {
          teacher: { select: { id: true, email: true } }
        }
      });

      return reply.status(201).send({ 
        message: 'Quiz created successfully',
        quiz 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      fastify.log.error(error, 'Error creating quiz');
      throw error;
    }
  });

  /**
   * PUT /quizzes/:id
   * Update a quiz
   */
  fastify.put<{ Params: QuizParams }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest<{ Params: QuizParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const validated = updateQuizSchema.parse(request.body);
      const teacherId = getCurrentUser(request).id;

      const existing = await prisma.quiz.findUnique({ where: { id } });

      if (!existing) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      if (existing.teacherId !== teacherId && getCurrentUser(request).role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only update your own quizzes'
        });
      }

      const quiz = await prisma.quiz.update({
        where: { id },
        data: validated,
        include: {
          teacher: { select: { id: true, email: true } }
        }
      });

      return { message: 'Quiz updated successfully', quiz };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      fastify.log.error(error, 'Error updating quiz');
      throw error;
    }
  });

  /**
   * DELETE /quizzes/:id
   * Delete a quiz
   */
  fastify.delete<{ Params: QuizParams }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest<{ Params: QuizParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const teacherId = getCurrentUser(request).id;

      const existing = await prisma.quiz.findUnique({ where: { id } });

      if (!existing) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      if (existing.teacherId !== teacherId && getCurrentUser(request).role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only delete your own quizzes'
        });
      }

      await prisma.quiz.delete({ where: { id } });

      return { message: 'Quiz deleted successfully' };
    } catch (error) {
      fastify.log.error(error, 'Error deleting quiz');
      throw error;
    }
  });

  /**
   * POST /quizzes/:id/questions
   * Add a question to a quiz
   */
  fastify.post<{ Params: QuizParams }>('/:id/questions', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest<{ Params: QuizParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const validated = createQuestionSchema.parse(request.body);
      const teacherId = getCurrentUser(request).id;

      const quiz = await prisma.quiz.findUnique({ where: { id } });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      if (quiz.teacherId !== teacherId && getCurrentUser(request).role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only add questions to your own quizzes'
        });
      }

      const question = await prisma.quizQuestion.create({
        data: {
          quizId: id,
          ...validated,
          options: validated.options || []
        }
      });

      return reply.status(201).send({ 
        message: 'Question added successfully',
        question 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      fastify.log.error(error, 'Error adding question');
      throw error;
    }
  });

  /**
   * PUT /quizzes/:quizId/questions/:questionId
   * Update a question
   */
  fastify.put<{ Params: QuizQuestionParams }>('/:quizId/questions/:questionId', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest<{ Params: QuizQuestionParams }>, reply: FastifyReply) => {
    try {
      const { quizId, questionId } = request.params;
      const validated = createQuestionSchema.parse(request.body);
      const teacherId = getCurrentUser(request).id;

      const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      if (quiz.teacherId !== teacherId && getCurrentUser(request).role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only update questions in your own quizzes'
        });
      }

      const question = await prisma.quizQuestion.update({
        where: { id: questionId },
        data: { ...validated, options: validated.options || [] }
      });

      return { message: 'Question updated successfully', question };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          details: error.errors
        });
      }
      fastify.log.error(error, 'Error updating question');
      throw error;
    }
  });

  /**
   * DELETE /quizzes/:quizId/questions/:questionId
   * Delete a question
   */
  fastify.delete<{ Params: QuizQuestionParams }>('/:quizId/questions/:questionId', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest<{ Params: QuizQuestionParams }>, reply: FastifyReply) => {
    try {
      const { quizId, questionId } = request.params;
      const teacherId = getCurrentUser(request).id;

      const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      if (quiz.teacherId !== teacherId && getCurrentUser(request).role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only delete questions from your own quizzes'
        });
      }

      await prisma.quizQuestion.delete({ where: { id: questionId } });

      return { message: 'Question deleted successfully' };
    } catch (error) {
      fastify.log.error(error, 'Error deleting question');
      throw error;
    }
  });

  /**
   * POST /quizzes/:id/attempt
   * Submit a quiz attempt (student)
   */
  fastify.post<{ Params: QuizParams }>('/:id/attempt', {
    preHandler: [authMiddleware, requireRole(['STUDENT', 'ADMIN'])]
  }, async (request: FastifyRequest<{ Params: QuizParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const studentId = getCurrentUser(request).id;
      const { answers, timeSpent } = request.body as { answers: Record<string, string>; timeSpent: number };

      const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: { questions: true }
      });

      if (!quiz || !quiz.published) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      // Verify student is enrolled in the course if quiz is tied to a course
      if (quiz.courseId) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId,
              courseId: quiz.courseId
            }
          }
        });

        if (!enrollment) {
          return reply.status(403).send({ 
            error: 'Forbidden',
            message: 'You must be enrolled in this course to take the quiz'
          });
        }
      }

      // Calculate score
      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      quiz.questions.forEach(question => {
        totalPoints += question.points;
        const studentAnswer = answers[question.id];
        if (studentAnswer && studentAnswer.toLowerCase() === question.correctAnswer.toLowerCase()) {
          correctCount++;
          earnedPoints += question.points;
        }
      });

      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const passed = score >= quiz.passingScore;

      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: id,
          studentId,
          score,
          maxScore: 100,
          passed,
          answers: JSON.stringify(answers),
          timeSpent: timeSpent || 0
        }
      });

      return {
        message: passed ? 'Quiz passed!' : 'Quiz completed',
        attempt: {
          id: attempt.id,
          score: attempt.score,
          passed: attempt.passed,
          correctCount,
          totalQuestions: quiz.questions.length,
          timeSpent: attempt.timeSpent
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Error submitting quiz attempt');
      throw error;
    }
  });

  /**
   * GET /quizzes/:id/attempts
   * Get quiz attempts for current user or all attempts (teacher)
   */
  fastify.get<{ Params: QuizParams }>('/:id/attempts', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: QuizParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = getCurrentUser(request);

      const quiz = await prisma.quiz.findUnique({ where: { id } });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      const where: any = { quizId: id };

      // Students can only see their own attempts
      if (user.role === 'STUDENT') {
        where.studentId = user.id;
      } 
      // Teachers can only see attempts for their quizzes
      else if (user.role === 'TEACHER' && quiz.teacherId !== user.id) {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only view attempts for your own quizzes'
        });
      }

      const attempts = await prisma.quizAttempt.findMany({
        where,
        include: {
          student: {
            select: { id: true, email: true, studentProfile: true }
          }
        },
        orderBy: { completedAt: 'desc' }
      });

      return { attempts };
    } catch (error) {
      fastify.log.error(error, 'Error fetching quiz attempts');
      throw error;
    }
  });

  /**
   * GET /quizzes/student/my-attempts
   * Get all quiz attempts for current student
   */
  fastify.get('/student/my-attempts', {
    preHandler: [authMiddleware, requireRole(['STUDENT', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const studentId = getCurrentUser(request).id;

      const attempts = await prisma.quizAttempt.findMany({
        where: { studentId },
        include: {
          quiz: {
            select: { id: true, title: true, courseId: true, course: { select: { title: true } } }
          }
        },
        orderBy: { completedAt: 'desc' }
      });

      return { attempts };
    } catch (error) {
      fastify.log.error(error, 'Error fetching student attempts');
      throw error;
    }
  });
}
