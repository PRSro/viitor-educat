import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../models/prisma.js';
import { requireRole, teacherOnly } from '../../core/middleware/permissionMiddleware.js';

function getCurrentUser(request: FastifyRequest) {
  return (request as any).user;
}

export const classroomRoutes = async (server: FastifyInstance) => {
  server.addHook('preValidation', requireRole(['STUDENT', 'TEACHER', 'ADMIN']));

  server.post('/', { preValidation: teacherOnly }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request);
    const bodySchema = z.object({
      name: z.string().min(3),
      description: z.string().optional()
    });

    const data = bodySchema.parse(request.body);
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const classroom = await prisma.classroom.create({
      data: {
        ...data,
        joinCode,
        teacherId: user.id
      }
    });

    return reply.status(201).send(classroom);
  });

  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request);

    if (user.role === 'TEACHER') {
      const classes = await prisma.classroom.findMany({
        where: { teacherId: user.id },
        include: { _count: { select: { students: true, classroomLessons: true } } }
      });
      return classes;
    }

    const classes = await prisma.classroomStudent.findMany({
      where: { studentId: user.id },
      include: { classroom: { include: { teacher: { select: { email: true } }, _count: { select: { classroomLessons: true } } } } }
    });
    return classes.map(c => c.classroom);
  });

  server.post('/join', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request);
    if (user.role !== 'STUDENT') {
      return reply.code(403).send({ error: 'Only students can join classrooms' });
    }

    const { joinCode } = z.object({ joinCode: z.string() }).parse(request.body);

    const classroom = await prisma.classroom.findUnique({ where: { joinCode } });
    if (!classroom) {
      return reply.code(404).send({ error: 'Classroom not found' });
    }

    const existing = await prisma.classroomStudent.findUnique({
      where: { classroomId_studentId: { classroomId: classroom.id, studentId: user.id } }
    });

    if (existing) {
      return reply.code(400).send({ error: 'Already joined this classroom' });
    }

    await prisma.classroomStudent.create({
      data: { classroomId: classroom.id, studentId: user.id }
    });

    return { success: true, classroom };
  });

  server.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request);
    const { id } = z.object({ id: z.string() }).parse((request.params as any));

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teacher: { select: { email: true, id: true } },
        classroomLessons: {
          orderBy: { order: 'asc' },
          include: { lesson: { select: { id: true, title: true, status: true, order: true, description: true } } }
        }
      }
    });

    if (!classroom) return reply.code(404).send({ error: 'Not found' });

    if (user.role === 'STUDENT') {
      const membership = await prisma.classroomStudent.findUnique({ where: { classroomId_studentId: { classroomId: id, studentId: user.id } } });
      if (!membership) return reply.code(403).send({ error: 'Not a member' });
    } else if (user.role === 'TEACHER' && classroom.teacherId !== user.id) {
      return reply.code(403).send({ error: 'Not your classroom' });
    }

    return classroom;
  });

  // POST /:id/lessons — teacher assigns a lesson to the classroom
  server.post('/:id/lessons', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request);
    if (user.role !== 'TEACHER') return reply.code(403).send({ error: 'Teachers only' });
    const { id } = request.params as { id: string };
    const { lessonId } = z.object({ lessonId: z.string() }).parse(request.body);
    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom || classroom.teacherId !== user.id) return reply.code(403).send({ error: 'Not your classroom' });
    const count = await prisma.classroomLesson.count({ where: { classroomId: id } });
    const entry = await prisma.classroomLesson.create({
      data: { classroomId: id, lessonId, order: count },
    });
    return reply.status(201).send(entry);
  });

  // DELETE /:id/lessons/:lessonId — teacher removes a lesson from the classroom
  server.delete('/:id/lessons/:lessonId', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request);
    const { id, lessonId } = request.params as { id: string; lessonId: string };
    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom || classroom.teacherId !== user.id) return reply.code(403).send({ error: 'Not your classroom' });
    await prisma.classroomLesson.deleteMany({ where: { classroomId: id, lessonId } });
    return reply.send({ success: true });
  });
};
