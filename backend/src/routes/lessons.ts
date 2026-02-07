import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { teacherOnly, anyRole } from '../middleware/permissionMiddleware.js';
import { 
  createLessonSchema, 
  updateLessonSchema, 
  lessonIdSchema, 
  formatZodError 
} from '../validation/schemas.js';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Lessons CRUD Routes
 * 
 * Permissions:
 * - GET /lessons - Both STUDENT and TEACHER can view all lessons
 * - GET /lessons/:id - Both STUDENT and TEACHER can view a lesson
 * - POST /lessons - TEACHER only can create lessons
 * - PUT /lessons/:id - TEACHER only can update lessons (their own)
 * - DELETE /lessons/:id - TEACHER only can delete lessons (their own)
 */

interface LessonParams {
  id: string;
}

export async function lessonRoutes(server: FastifyInstance) {
  
  /**
   * GET /lessons
   * List all lessons
   * Accessible by: STUDENT, TEACHER, ADMIN
   */
  server.get('/', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const lessons = await prisma.lesson.findMany({
      include: {
        teacher: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { lessons };
  });

  /**
   * GET /lessons/:id
   * Get a single lesson by ID
   * Accessible by: STUDENT, TEACHER, ADMIN
   */
  server.get<{ Params: LessonParams }>('/:id', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: LessonParams }>, reply: FastifyReply) => {
    try {
      // Validate ID format
      const { id } = lessonIdSchema.parse(request.params);
      
      const lesson = await prisma.lesson.findUnique({
        where: { id },
        include: {
          teacher: {
            select: { id: true, email: true }
          }
        }
      });
      
      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }
      
      return { lesson };
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
   * POST /lessons
   * Create a new lesson
   * Accessible by: TEACHER only
   */
  server.post('/', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate input with Zod
      const validated = createLessonSchema.parse(request.body);
      const { title, description, content } = validated;
      const teacherId = request.user!.id;
      
      const lesson = await prisma.lesson.create({
        data: {
          title,
          description,
          content,
          teacherId
        },
        include: {
          teacher: {
            select: { id: true, email: true }
          }
        }
      });
      
      return reply.status(201).send({ 
        message: 'Lesson created successfully',
        lesson 
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
   * PUT /lessons/:id
   * Update a lesson
   * Accessible by: TEACHER only (must be the lesson owner)
   */
  server.put<{ Params: LessonParams }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest<{ Params: LessonParams }>, reply: FastifyReply) => {
    try {
      // Validate ID and body
      const { id } = lessonIdSchema.parse(request.params);
      const validated = updateLessonSchema.parse(request.body);
      const teacherId = request.user!.id;
      
      // Check if lesson exists and belongs to this teacher
      const existingLesson = await prisma.lesson.findUnique({
        where: { id }
      });
      
      if (!existingLesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }
      
      if (existingLesson.teacherId !== teacherId) {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only update your own lessons'
        });
      }
      
      const lesson = await prisma.lesson.update({
        where: { id },
        data: validated,
        include: {
          teacher: {
            select: { id: true, email: true }
          }
        }
      });
      
      return { 
        message: 'Lesson updated successfully',
        lesson 
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
   * DELETE /lessons/:id
   * Delete a lesson
   * Accessible by: TEACHER only (must be the lesson owner)
   */
  server.delete<{ Params: LessonParams }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest<{ Params: LessonParams }>, reply: FastifyReply) => {
    try {
      // Validate ID format
      const { id } = lessonIdSchema.parse(request.params);
      const teacherId = request.user!.id;
      
      // Check if lesson exists and belongs to this teacher
      const existingLesson = await prisma.lesson.findUnique({
        where: { id }
      });
      
      if (!existingLesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }
      
      if (existingLesson.teacherId !== teacherId) {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only delete your own lessons'
        });
      }
      
      await prisma.lesson.delete({
        where: { id }
      });
      
      return { message: 'Lesson deleted successfully' };
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
