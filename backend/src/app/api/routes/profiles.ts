/**
 * Student Profile Routes
 * Handles student profile and progress tracking
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { anyRole } from '../../core/middleware/permissionMiddleware.js';
import { z } from 'zod';
import { prisma } from '../../models/prisma.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const updateStudentProfileSchema = z.object({
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().max(2000).optional(),
  learningGoals: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  preferredLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
});

export async function studentProfileRoutes(server: FastifyInstance) {

  /**
   * GET /profiles/student
   * Get current student's profile and progress
   */
  server.get('/student', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const studentId = getCurrentUser(request).id;

      const user = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
          studentProfile: true,
          settings: true
        }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Get completed lessons for learning history
      const completedLessons = await prisma.lessonCompletion.findMany({
        where: { studentId },
        include: {
          lesson: {
            select: { id: true, title: true }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 20
      });

      const totalLessonsCompleted = await prisma.lessonCompletion.count({
        where: { studentId }
      });

      const quizAttemptsCount = await prisma.quizAttempt.count({
        where: { userId: studentId }
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        profile: user.studentProfile,
        settings: user.settings,
        learningHistory: completedLessons.map(l => ({
          id: l.id,
          completedAt: l.completedAt,
          lesson: l.lesson
        })),
        stats: {
          totalLessonsCompleted,
          totalQuizAttempts: quizAttemptsCount
        }
      };
    } catch (error) {
      server.log.error(error, 'Error fetching student profile');
      throw error;
    }
  });

  /**
   * PUT /profiles/student
   * Update current student's profile
   */
  server.put('/student', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = updateStudentProfileSchema.parse(request.body);
      const studentId = getCurrentUser(request).id;

      // Ensure student profile exists
      let profile = await prisma.studentProfile.findUnique({
        where: { userId: studentId }
      });

      if (!profile) {
        // Get default school if applicable
        const school = await prisma.school.findFirst();
        profile = await prisma.studentProfile.create({
          data: {
            userId: studentId,
            schoolId: school?.id || '',
            ...validated
          }
        });
      } else {
        profile = await prisma.studentProfile.update({
          where: { id: profile.id },
          data: validated
        });
      }

      return { message: 'Profile updated successfully', profile };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          message: error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
        });
      }
      server.log.error(error, 'Error updating student profile');
      throw error;
    }
  });
}
