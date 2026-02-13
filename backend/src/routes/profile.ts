import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, JwtPayload } from '../middleware/authMiddleware.js';
import { teacherOnly, anyRole, adminOnly } from '../middleware/permissionMiddleware.js';
import { z } from 'zod';

const prisma = new PrismaClient();

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const updateProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  pictureUrl: z.string().url().optional().nullable(),
  phone: z.string().max(20).optional(),
  office: z.string().max(100).optional(),
  officeHours: z.string().max(200).optional(),
  website: z.string().url().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
  twitter: z.string().max(100).optional(),
});

export async function profileRoutes(server: FastifyInstance) {
  
  /**
   * GET /profile
   * Get current user's profile including teacher profile if exists
   */
  server.get('/', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getCurrentUser(request).id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacherProfile: true
      }
    });
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      profile: user.teacherProfile || null
    };
  });

  /**
   * PUT /profile
   * Update current user's teacher profile
   */
  server.put('/', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = updateProfileSchema.parse(request.body);
      const userId = getCurrentUser(request).id;
      
      const profile = await prisma.teacherProfile.upsert({
        where: { userId },
        update: validated,
        create: {
          userId,
          ...validated
        }
      });
      
      return { message: 'Profile updated successfully', profile };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
        });
      }
      server.log.error(error, 'Error updating profile');
      throw error;
    }
  });

  /**
   * GET /profile/teachers
   * Get all teachers with their profiles (for student discovery)
   */
  server.get('/teachers', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER' },
        select: {
          id: true,
          email: true,
          teacherProfile: true,
          courses: {
            where: { published: true },
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              imageUrl: true,
              _count: { select: { lessons: true, enrollments: true } }
            }
          }
        }
      });
      
      return { teachers };
    } catch (error) {
      server.log.error(error, 'Error fetching teachers');
      throw error;
    }
  });

  /**
   * GET /profile/:teacherId
   * Get teacher profile by teacher ID (public for students)
   */
  server.get<{ Params: { teacherId: string } }>('/:teacherId', {
    preHandler: [anyRole]
  }, async (request: FastifyRequest<{ Params: { teacherId: string } }>, reply: FastifyReply) => {
    try {
      const { teacherId } = request.params;
      
      const user = await prisma.user.findUnique({
        where: { id: teacherId },
        include: {
          teacherProfile: true
        }
      });
      
      if (!user || user.role !== 'TEACHER') {
        return reply.status(404).send({ error: 'Teacher not found' });
      }
      
      // Get published courses for this teacher
      const courses = await prisma.course.findMany({
        where: { 
          teacherId,
          published: true 
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          imageUrl: true,
          createdAt: true,
          _count: { select: { lessons: true, enrollments: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return {
        teacher: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        profile: user.teacherProfile,
        courses
      };
    } catch (error) {
      server.log.error(error, 'Error fetching teacher profile');
      throw error;
    }
  });

  /**
   * GET /profile/:teacherId/articles
   * Get published articles for a specific teacher
   */
  server.get<{ Params: { teacherId: string } }>('/:teacherId/articles', {
    preHandler: [anyRole]
  }, async (request: FastifyRequest<{ Params: { teacherId: string } }>, reply: FastifyReply) => {
    try {
      const { teacherId } = request.params;
      
      const articles = await prisma.article.findMany({
        where: { 
          authorId: teacherId,
          published: true 
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: true,
          sourceUrl: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return { articles };
    } catch (error) {
      server.log.error(error, 'Error fetching teacher articles');
      throw error;
    }
  });

  /**
   * GET /profile/:teacherId/lessons
   * Get published lessons for a specific teacher
   */
  server.get<{ Params: { teacherId: string } }>('/:teacherId/lessons', {
    preHandler: [anyRole]
  }, async (request: FastifyRequest<{ Params: { teacherId: string } }>, reply: FastifyReply) => {
    try {
      const { teacherId } = request.params;
      
      const lessons = await prisma.lesson.findMany({
        where: { 
          teacherId,
          course: { published: true }
        },
        select: {
          id: true,
          title: true,
          description: true,
          courseId: true,
          order: true,
          createdAt: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        },
        orderBy: { order: 'asc' }
      });
      
      return { lessons };
    } catch (error) {
      server.log.error(error, 'Error fetching teacher lessons');
      throw error;
    }
  });
}
