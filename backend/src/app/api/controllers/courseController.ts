import { FastifyRequest, FastifyReply } from 'fastify';
import { courseService } from '../../services/courseService.js';
import { prisma } from '../../models/prisma.js';
import { JwtPayload } from '../../core/middleware/authMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const courseIdSchema = z.object({ id: z.string().min(1) });
const slugSchema = z.object({ slug: z.string().min(1) });

export const courseController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const courses = await prisma.course.findMany({
      where: { published: true },
      include: {
        teacher: {
          select: {
            id: true,
            email: true,
            teacherProfile: { select: { id: true, bio: true, pictureUrl: true } }
          }
        },
        _count: { select: { lessons: true, enrollments: true } },
        lessons: {
          orderBy: { order: 'asc' },
          take: 3,
          select: { id: true, title: true, description: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { courses };
  },

  async getStudentCourses(request: FastifyRequest, reply: FastifyReply) {
    const studentId = getCurrentUser(request).id;
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                id: true,
                email: true,
                teacherProfile: { select: { bio: true, pictureUrl: true } }
              }
            },
            _count: { select: { lessons: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return {
      courses: enrollments.map(e => ({
        id: e.id,
        progress: e.progress,
        completedLessonsCount: e.completedLessonsCount,
        lastAccessedLessonId: e.lastAccessedLessonId,
        completedAt: e.completedAt,
        enrolledAt: e.createdAt,
        course: e.course
      }))
    };
  },

  async getBySlug(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const { slug } = slugSchema.parse(request.params);
    let currentUser = null;
    try {
      currentUser = getCurrentUser(request);
    } catch {}

    const course = await courseService.getCourseBySlug(slug);
    if (!course) return reply.status(404).send({ error: 'Course not found' });

    let enrollment = null;
    let isTeacher = false;
    let completions: string[] = [];

    if (currentUser) {
      isTeacher = course.teacherId === currentUser.id || currentUser.role === 'ADMIN';
      enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: currentUser.id, courseId: course.id } }
      });

      if (enrollment) {
        const userCompletions = await prisma.lessonCompletion.findMany({
          where: { studentId: currentUser.id, lesson: { courseId: course.id } },
          select: { lessonId: true }
        });
        completions = userCompletions.map(c => c.lessonId);
      }
    }

    if (!isTeacher) {
      // In a real app we might want to check if they are enrolled to see PRIVATE lessons,
      // but for "preview" usually we only show PUBLISHED.
      course.lessons = course.lessons.filter((l: any) => l.status === 'PUBLISHED' || l.status === 'PUBLIC');
    }

    return { course, enrollment, isTeacher, completions };
  },

  async markLessonComplete(request: FastifyRequest<{ Params: { lessonId: string } }>, reply: FastifyReply) {
    const user = getCurrentUser(request);
    const { lessonId } = request.params as any;
    const result = await courseService.markLessonComplete(user.id, lessonId);
    return result.data;
  },

  async enroll(request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) {
    const user = getCurrentUser(request);
    const courseId = request.params.courseId;

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return reply.status(404).send({ error: 'Course not found' });
    }

    if (!course.published) {
      return reply.status(403).send({ error: 'Course not available for enrollment' });
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'COMPLETED') {
        return reply.status(403).send({
          error: 'Course already completed. Use re-enroll action to enroll again.'
        });
      }
      if (existingEnrollment.status === 'ACTIVE') {
        return reply.status(409).send({ error: 'Already enrolled in this course' });
      }
      if (existingEnrollment.status === 'DROPPED') {
        const updated = await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: 'ACTIVE', enrolledAt: new Date() }
        });
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'RE_ENROLL',
            resource: 'enrollment',
            resourceId: updated.id,
            metadata: { courseId }
          }
        });
        return { enrollment: updated };
      }
    }

    const activeEnrollments = await prisma.enrollment.count({
      where: { studentId: user.id, status: 'ACTIVE' }
    });

    if (activeEnrollments >= 50) {
      return reply.status(400).send({ error: 'Maximum 50 active courses allowed' });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: user.id,
        courseId
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ENROLL',
        resource: 'enrollment',
        resourceId: enrollment.id,
        metadata: { courseId }
      }
    });

    return reply.status(201).send({ enrollment });
  },

  async unenroll(request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) {
    const user = getCurrentUser(request);
    const courseId = request.params.courseId;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId
        }
      }
    });

    if (!enrollment) {
      return reply.status(404).send({ error: 'Not enrolled in this course' });
    }

    if (enrollment.status !== 'ACTIVE') {
      return reply.status(400).send({ error: 'Enrollment is not active' });
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'DROPPED' }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DROP_COURSE',
        resource: 'enrollment',
        resourceId: updated.id,
        metadata: { courseId }
      }
    });

    return { enrollment: updated };
  },

  async getStudents(request: FastifyRequest, reply: FastifyReply) {
    const courseId = (request.params as any).courseId;

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      include: {
        student: {
          select: { id: true, email: true, studentProfile: true }
        }
      }
    });

    const students = enrollments.map(e => ({
      id: e.id,
      studentId: e.studentId,
      email: e.student.email,
      enrolledAt: e.createdAt,
      progress: e.progress,
      completedAt: e.completedAt,
      avatarUrl: e.student.studentProfile?.avatarUrl ?? null,
      bio: e.student.studentProfile?.bio ?? null
    }));

    return { students };
  }
};
