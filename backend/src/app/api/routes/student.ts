import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { requireRole } from '../../core/middleware/permissionMiddleware.js';
import { prisma } from '../../models/prisma.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

export async function studentRoutes(server: FastifyInstance) {

  /**
   * GET /student/enrollments
   * Get all courses the current student is enrolled in
   */
  server.get('/enrollments', {
    preHandler: [authMiddleware, requireRole(['STUDENT'])]
  }, async (request, reply) => {
    try {
      const user = getCurrentUser(request);
      const { status, page, limit } = (request.query as any) || {};
      const pageNum = parseInt(page || '1');
      const limitNum = Math.min(parseInt(limit || '20'), 50);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        studentId: user.id,
        status: status || 'ACTIVE'
      };

      if (!status) {
        delete where.status;
        where.OR = [
          { status: 'ACTIVE' },
          { status: 'COMPLETED' }
        ];
      }

      const [enrollments, total] = await Promise.all([
        prisma.enrollment.findMany({
          where,
          include: {
            course: {
              include: {
                teacher: {
                  select: { id: true, email: true }
                },
                _count: {
                  select: { lessons: true }
                }
              }
            }
          },
          orderBy: { enrolledAt: 'desc' },
          take: limitNum,
          skip
        }),
        prisma.enrollment.count({ where })
      ]);

      const courses = enrollments.map(enrollment => ({
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          completedLessonsCount: enrollment.completedLessonsCount
        },
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          description: enrollment.course.description,
          imageUrl: enrollment.course.imageUrl,
          level: enrollment.course.level,
          teacher: enrollment.course.teacher,
          totalLessons: enrollment.course._count.lessons
        }
      }));

      return {
        courses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      server.log.error(error, 'Error fetching student enrollments');
      throw error;
    }
  });
}
