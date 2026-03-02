import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole } from '../../core/middleware/permissionMiddleware.js';
import { lessonController } from '../controllers/lessonController.js';

export async function lessonRoutes(server: FastifyInstance) {
  server.get('/', (request: FastifyRequest, reply: FastifyReply) => lessonController.getAll(request, reply));
  server.get('/:id', (request: FastifyRequest, reply: FastifyReply) => lessonController.getById(request as any, reply));
  server.get('/teacher/:teacherId', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.getTeacherLessons(request as any, reply));
  server.get('/:id/view', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.view(request as any, reply));
  server.post('/:id/complete', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.complete(request as any, reply));
  server.post('/', { preHandler: [authMiddleware, teacherOnly] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.create(request, reply));
  server.put('/:id', { preHandler: [authMiddleware, teacherOnly] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.update(request as any, reply));
  server.delete('/:id', { preHandler: [authMiddleware, teacherOnly] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.remove(request as any, reply));
}
