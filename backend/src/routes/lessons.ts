import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, JwtPayload } from '../middleware/authMiddleware.js';
import { teacherOnly, anyRole } from '../middleware/permissionMiddleware.js';
import { 
  createLessonSchema, 
  updateLessonSchema, 
  lessonIdSchema, 
  formatZodError 
} from '../validation/schemas.js';
import { z } from 'zod';

const prisma = new PrismaClient();

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

/**
 * Lessons CRUD Routes
 * 
 * Permissions:
 * - GET /lessons - Both STUDENT and TEACHER can view all lessons
 * - GET /lessons/:id - Both STUDENT and TEACHER can view a lesson
 * - GET /lessons/course/:courseId - Get lessons for a specific course
 * - POST /lessons - TEACHER only can create lessons
 * - PUT /lessons/:id - TEACHER only can update lessons (their own)
 * - DELETE /lessons/:id - TEACHER only can delete lessons (their own)
 */

interface LessonParams {
  id: string;
}

interface CourseParams {
  courseId: string;
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
   * GET /lessons/course/:courseId
   * Get all lessons for a specific course
   * Accessible by: STUDENT, TEACHER, ADMIN
   */
  server.get<{ Params: CourseParams }>('/course/:courseId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: CourseParams }>, reply: FastifyReply) => {
    const { courseId } = request.params;
    
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      include: {
        teacher: {
          select: { id: true, email: true }
        }
      },
      orderBy: { order: 'asc' }
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
      const { title, description, content, courseId, order } = validated;
      const teacherId = getCurrentUser(request).id;

      // If courseId provided, verify teacher owns the course
      if (courseId) {
        const course = await prisma.course.findUnique({
          where: { id: courseId }
        });
        if (!course || course.teacherId !== teacherId) {
          return reply.status(403).send({ 
            error: 'Forbidden',
            message: 'You can only add lessons to your own courses'
          });
        }
      }
      
      const lesson = await prisma.lesson.create({
        data: {
          title,
          description,
          content,
          teacherId,
          courseId: courseId || null,
          order: order || 0
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
      const teacherId = getCurrentUser(request).id;
      
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
      const teacherId = getCurrentUser(request).id;
      
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
