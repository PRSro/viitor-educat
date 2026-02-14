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

  /**
   * POST /lessons/:id/complete
   * Mark a lesson as completed and update enrollment progress
   * Accessible by: STUDENT (enrolled in the course)
   */
  server.post<{ Params: { id: string } }>('/:id/complete', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const studentId = getCurrentUser(request).id;

      const lesson = await prisma.lesson.findUnique({
        where: { id },
        include: { course: true }
      });

      if (!lesson || !lesson.course) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      // Check if student is enrolled in the course
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId: lesson.courseId!
          }
        }
      });

      if (!enrollment) {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You must be enrolled in this course to mark lessons as complete'
        });
      }

      // Get total lessons in the course
      const totalLessons = await prisma.lesson.count({
        where: { courseId: lesson.courseId }
      });

      // Calculate new progress
      const progressIncrement = totalLessons > 0 ? 100 / totalLessons : 0;
      let newProgress = Math.min(100, enrollment.progress + progressIncrement);
      
      // Mark as completed if progress reaches 100%
      const completedAt = newProgress >= 100 ? new Date() : null;

      // Update enrollment
      const updatedEnrollment = await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progress: newProgress,
          completedAt
        }
      });

      return { 
        message: 'Lesson marked as complete',
        progress: updatedEnrollment.progress,
        completedAt: updatedEnrollment.completedAt
      };
    } catch (error) {
      server.log.error(error, 'Error marking lesson complete');
      throw error;
    }
  });

  /**
   * GET /lessons/:id/progress
   * Get lesson completion status for current user
   * Accessible by: STUDENT (enrolled in the course)
   */
  server.get<{ Params: { id: string } }>('/:id/progress', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const studentId = getCurrentUser(request).id;

      const lesson = await prisma.lesson.findUnique({
        where: { id },
        include: { course: true }
      });

      if (!lesson || !lesson.course) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      // Check if student is enrolled in the course
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId: lesson.courseId!
          }
        }
      });

      if (!enrollment) {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You must be enrolled in this course to view progress'
        });
      }

      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        courseId: lesson.courseId,
        progress: enrollment.progress,
        completedAt: enrollment.completedAt,
        isCompleted: enrollment.progress >= 100
      };
    } catch (error) {
      server.log.error(error, 'Error fetching lesson progress');
      throw error;
    }
  });
}
