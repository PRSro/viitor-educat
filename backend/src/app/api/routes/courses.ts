import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole, requireRole } from '../../core/middleware/permissionMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';
import { courseService } from '../../services/courseService.js';
import { prisma } from '../../models/prisma.js';
import { courseController } from '../controllers/courseController.js';
import { coursePreviewController } from '../controllers/coursePreviewController.js';
import { ServiceResponse } from '../../core/types/service.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const lessonInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  description: z.string().optional(),
  order: z.number().default(0),
  status: z.enum(['PRIVATE', 'PUBLIC', 'DRAFT']).optional()
});

const createCourseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PRIVATE', 'PUBLIC']).optional(),
  lessons: z.array(lessonInputSchema).optional()
});

const updateCourseSchema = createCourseSchema.partial().extend({
  published: z.boolean().optional(),
});

const courseIdSchema = z.object({ id: z.string().min(1) });

/**
 * Maps a failed ServiceResponse to an HTTP error and sends it.
 * Returns true so the caller can `return` immediately.
 */
function sendServiceError(result: ServiceResponse, reply: FastifyReply): boolean {
  if (!result.success) {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      UNAUTHORIZED: 401,
      BAD_REQUEST: 400,
      COURSE_EMPTY: 400,
      INTERNAL_ERROR: 500,
    };
    const status = statusMap[result.errorCode ?? ''] ?? 500;
    reply.status(status).send({ error: result.errorCode, message: result.message });
    return true;
  }
  return false;
}

export async function courseRoutes(server: FastifyInstance) {

  // ─── Public listing ────────────────────────────────────────────────────
  /** GET /courses — all published courses (preview shape) */
  server.get('/', coursePreviewController.list);

  // ─── Authenticated fixed-path routes (registered BEFORE /:slug wildcard) ─

  /** GET /courses/student — enrolled courses for current student */
  server.get('/student', {
    preHandler: [authMiddleware, anyRole]
  }, courseController.getStudentCourses);

  /** GET /courses/teacher/my-courses — courses owned by current teacher */
  server.get('/teacher/my-courses', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const teacherId = getCurrentUser(request).id;
    const courses = await prisma.course.findMany({
      where: { teacherId },
      include: {
        teacher: { select: { id: true, email: true } },
        _count: { select: { lessons: true, enrollments: true } },
        lessons: { orderBy: { order: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { courses };
  });

  // ─── Prefixed-ID  routes (before /:slug wildcard) ─────────────────────

  /** GET /courses/id/:id — get a course by database ID (editor/internal) */
  server.get<{ Params: { id: string } }>('/id/:id', async (request, reply) => {
    const { id } = courseIdSchema.parse(request.params);

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, email: true, teacherProfile: true } },
        _count: { select: { lessons: true, enrollments: true } },
        lessons: {
          orderBy: { order: 'asc' },
          select: { id: true, title: true, description: true, status: true, order: true, slug: true }
        }
      }
    });

    if (!course) return reply.status(404).send({ error: 'Course not found' });

    let isTeacher = false;
    try {
      const currentUser = getCurrentUser(request);
      isTeacher = currentUser.id === course.teacherId || currentUser.role === 'ADMIN';
    } catch {
      // Not authenticated — isTeacher stays false
    }

    if (!isTeacher && !course.published) {
      return reply.status(404).send({ error: 'Course not found' });
    }

    const visibleLessons = (isTeacher
      ? course.lessons
      : course.lessons.filter((l: any) => l.status !== 'PRIVATE')) as typeof course.lessons;

    return { course: { ...course, lessons: visibleLessons }, isTeacher };
  });

  /** GET /courses/teacher/:teacherId — published courses for a specific teacher */
  server.get<{ Params: { teacherId: string } }>('/teacher/:teacherId', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { teacherId } = request.params;
    const courses = await prisma.course.findMany({
      where: { teacherId, status: 'PUBLISHED' },
      include: {
        teacher: { select: { id: true, email: true } },
        _count: { select: { lessons: true, enrollments: true } },
        lessons: { orderBy: { order: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { courses };
  });

  // ─── Write routes ────────────────────────────────────────────────────────

  /** POST /courses — create a new course */
  server.post('/', { preHandler: [authMiddleware, teacherOnly] }, async (request, reply) => {
    try {
      const validated = createCourseSchema.parse(request.body);
      const currentUser = getCurrentUser(request);

      const result = await courseService.create({
        title: validated.title,
        description: validated.description,
        imageUrl: validated.imageUrl,
        level: validated.level as any,
        category: validated.category,
        tags: validated.tags,
        teacherId: currentUser.id,
        lessons: validated.lessons as any
      }, currentUser.role);

      if (sendServiceError(result, reply)) return;

      return reply.status(201).send({ message: 'Course created', course: result.data });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation failed', message: formatZodError(error) });
      }
      throw error;
    }
  });

  /** PUT /courses/:id — update a course */
  server.put<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    try {
      const { id } = courseIdSchema.parse(request.params);
      const validated = updateCourseSchema.parse(request.body);
      const currentUser = getCurrentUser(request);
      const { lessons, ...courseData } = validated;

      const result = await courseService.update(
        id,
        courseData as any,
        currentUser.id,
        currentUser.role,
        lessons as any
      );

      if (sendServiceError(result, reply)) return;

      return { message: 'Course updated', course: result.data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation failed', message: formatZodError(error) });
      }
      throw error;
    }
  });

  /** DELETE /courses/:id — delete a course */
  server.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    try {
      const { id } = courseIdSchema.parse(request.params);
      const currentUser = getCurrentUser(request);

      const result = await courseService.delete(id, currentUser.id, currentUser.role);
      if (sendServiceError(result, reply)) return;

      return { message: 'Course deleted' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation failed', message: formatZodError(error) });
      }
      throw error;
    }
  });

  // ─── Course-scoped sub-resource routes (before /:slug wildcard) ────────

  /** GET /courses/:courseId/lessons — all lessons for a course */
  server.get<{ Params: { courseId: string } }>('/:courseId/lessons', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    const { courseId } = request.params;
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' }
    });
    return { lessons };
  });

  /** GET /courses/:courseId/students — students enrolled in a course */
  server.get<{ Params: { courseId: string } }>('/:courseId/students', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const { courseId } = request.params;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    const user = getCurrentUser(request);
    if (course.teacherId !== user.id && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            studentProfile: { select: { avatarUrl: true, bio: true } }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });
    return {
      students: enrollments.map(e => ({
        id: e.id,
        studentId: e.studentId,
        email: e.student.email,
        progress: e.progress,
        status: e.status,
        enrolledAt: e.enrolledAt,
        completedLessonsCount: e.completedLessonsCount,
        avatarUrl: e.student.studentProfile?.avatarUrl ?? null,
      }))
    };
  });

  /** GET /courses/:courseId/analytics — analytics for a course */
  server.get<{ Params: { courseId: string } }>('/:courseId/analytics', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const { courseId } = request.params;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    const user = getCurrentUser(request);
    if (course.teacherId !== user.id && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    const [enrollmentCount, lessonCount, completions] = await Promise.all([
      prisma.enrollment.count({ where: { courseId, status: 'ACTIVE' } }),
      prisma.lesson.count({ where: { courseId } }),
      prisma.lessonCompletion.count({ where: { lesson: { courseId } } }),
    ]);
    const avgProgress = await prisma.enrollment.aggregate({
      where: { courseId, status: 'ACTIVE' },
      _avg: { progress: true }
    });
    return {
      enrollmentCount,
      lessonCount,
      completions,
      averageProgress: Math.round(avgProgress._avg.progress ?? 0),
      completionRate: enrollmentCount > 0 && lessonCount > 0
        ? Math.round((completions / (enrollmentCount * lessonCount)) * 100)
        : 0,
    };
  });

  /** GET /courses/:courseId/enrollment — check current student's enrollment */
  server.get<{ Params: { courseId: string } }>('/:courseId/enrollment', {
    preHandler: [authMiddleware, requireRole(['STUDENT'])]
  }, async (request, reply) => {
    const user = getCurrentUser(request);
    const { courseId } = request.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: user.id, courseId } }
    });

    if (!enrollment) return { enrolled: false, enrollment: null };

    return {
      enrolled: enrollment.status === 'ACTIVE',
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt
      }
    };
  });

  /** POST /courses/:courseId/enroll — enroll in a course */
  server.post<{ Params: { courseId: string } }>('/:courseId/enroll', {
    preHandler: [authMiddleware, requireRole(['STUDENT'])]
  }, (request: FastifyRequest, reply: FastifyReply) =>
    courseController.enroll(request as any, reply));

  /** DELETE /courses/:courseId/enroll — drop enrollment */
  server.delete<{ Params: { courseId: string } }>('/:courseId/enroll', {
    preHandler: [authMiddleware, requireRole(['STUDENT'])]
  }, (request: FastifyRequest, reply: FastifyReply) =>
    courseController.unenroll(request as any, reply));

  /** GET /courses/:id/export — export course as JSON */
  server.get<{ Params: { id: string } }>('/:id/export', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const { id } = courseIdSchema.parse(request.params);
    const currentUser = getCurrentUser(request);

    const course = await courseService.getCourseById(id);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    if (course.teacherId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    reply.header('Content-Disposition', `attachment; filename="${course.slug}.json"`);
    return {
      course: {
        title: course.title,
        description: course.description,
        status: 'DRAFT',
        lessons: course.lessons.map((l: any) => ({
          title: l.title,
          content: l.content,
          status: 'DRAFT'
        }))
      }
    };
  });

  // ─── Wildcard slug route — MUST be registered last ───────────────────────
  /** GET /courses/:slug — get a published course by slug */
  server.get('/:slug', courseController.getBySlug);
}
