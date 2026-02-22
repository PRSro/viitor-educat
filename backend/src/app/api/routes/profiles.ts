/**
 * Student Profile Routes
 * Handles student profile, progress tracking, and enrolled courses
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { anyRole, teacherOnly } from '../../core/middleware/permissionMiddleware.js';
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
   * Get current student's profile with enrolled courses and progress
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

      // Get enrolled courses with progress
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId },
        include: {
          course: {
            include: {
              teacher: {
                select: { id: true, email: true, teacherProfile: true }
              },
              _count: { select: { lessons: true } }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Get completed lessons count for learning history
      const completedLessons = await prisma.lessonCompletion.findMany({
        where: { studentId },
        include: {
          lesson: {
            include: {
              course: {
                select: { id: true, title: true, slug: true }
              }
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 20
      });

      const totalLessonsCompleted = await prisma.lessonCompletion.count({
        where: { studentId }
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
        enrollments: enrollments.map(e => ({
          id: e.id,
          progress: e.progress,
          completedLessonsCount: e.completedLessonsCount,
          lastAccessedLessonId: e.lastAccessedLessonId,
          completedAt: e.completedAt,
          enrolledAt: e.createdAt,
          course: {
            id: e.course.id,
            title: e.course.title,
            slug: e.course.slug,
            description: e.course.description,
            imageUrl: e.course.imageUrl,
            level: e.course.level,
            category: e.course.category,
            totalLessons: e.course._count.lessons,
            teacher: e.course.teacher
          }
        })),
        learningHistory: completedLessons.map(l => ({
          id: l.id,
          completedAt: l.completedAt,
          lesson: {
            id: l.lesson.id,
            title: l.lesson.title,
            courseId: l.lesson.courseId,
            courseTitle: l.lesson.course.title
          }
        })),
        stats: {
          totalCoursesEnrolled: enrollments.length,
          totalLessonsCompleted,
          coursesCompleted: enrollments.filter(e => e.completedAt !== null).length
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
        profile = await prisma.studentProfile.create({
          data: {
            userId: studentId,
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

  /**
   * GET /profiles/student/progress/:courseId
   * Get detailed progress for a specific course
   */
  server.get<{ Params: { courseId: string } }>('/student/progress/:courseId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
    try {
      const { courseId } = request.params;
      const studentId = getCurrentUser(request).id;

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: { studentId, courseId }
        },
        include: {
          course: {
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  order: true
                }
              }
            }
          }
        }
      });

      if (!enrollment) {
        return reply.status(404).send({ error: 'Not enrolled in this course' });
      }

      // Get completed lessons for this course
      const completedLessons = await prisma.lessonCompletion.findMany({
        where: {
          studentId,
          lesson: { courseId }
        },
        select: { lessonId: true }
      });

      const completedSet = new Set(completedLessons.map(c => c.lessonId));

      const lessons = enrollment.course.lessons.map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        order: l.order,
        completed: completedSet.has(l.id)
      }));

      return {
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        progress: enrollment.progress,
        completedLessonsCount: enrollment.completedLessonsCount,
        lastAccessedLessonId: enrollment.lastAccessedLessonId,
        completedAt: enrollment.completedAt,
        lessons
      };
    } catch (error) {
      server.log.error(error, 'Error fetching course progress');
      throw error;
    }
  });

  /**
   * POST /profiles/student/progress/:courseId/resume
   * Get the last accessed lesson to resume
   */
  server.post<{ Params: { courseId: string } }>('/student/progress/:courseId/resume', {
    preHandler: [authMiddleware, anyRole]
  }, async (request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
    try {
      const { courseId } = request.params;
      const studentId = getCurrentUser(request).id;

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: { studentId, courseId }
        },
        include: {
          course: {
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  order: true
                }
              }
            }
          }
        }
      });

      if (!enrollment) {
        return reply.status(404).send({ error: 'Not enrolled in this course' });
      }

      let lessonToResume = null;
      const lessons = enrollment.course.lessons;

      // If there's a last accessed lesson, try to find the next incomplete one
      if (enrollment.lastAccessedLessonId) {
        const lastLessonIndex = lessons.findIndex(
          l => l.id === enrollment.lastAccessedLessonId
        );

        if (lastLessonIndex !== -1) {
          // Look for next incomplete lesson
          for (let i = lastLessonIndex; i < lessons.length; i++) {
            const l = lessons[i];
            const isCompleted = await prisma.lessonCompletion.findUnique({
              where: {
                lessonId_studentId: { lessonId: l.id, studentId }
              }
            });
            if (!isCompleted) {
              lessonToResume = { ...l, lessonId: l.id };
              break;
            }
          }
        }
      }

      // If no lesson to resume found, start from beginning
      if (!lessonToResume && lessons.length > 0) {
        for (const l of lessons) {
          const isCompleted = await prisma.lessonCompletion.findUnique({
            where: {
              lessonId_studentId: { lessonId: l.id, studentId }
            }
          });
          if (!isCompleted) {
            lessonToResume = { ...l, lessonId: l.id };
            break;
          }
        }
      }

      // If all completed, return the last lesson
      if (!lessonToResume && lessons.length > 0) {
        const lastL = lessons[lessons.length - 1];
        lessonToResume = { ...lastL, lessonId: lastL.id };
      }

      return {
        lesson: lessonToResume,
        progress: enrollment.progress,
        courseSlug: enrollment.course.slug
      };
    } catch (error) {
      server.log.error(error, 'Error resuming course');
      throw error;
    }
  });
}
