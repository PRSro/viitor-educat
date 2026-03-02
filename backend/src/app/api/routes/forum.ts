import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { forumController } from '../controllers/forumController.js';

export async function forumRoutes(server: FastifyInstance) {
    server.get('/threads', { preHandler: [authMiddleware] }, (request: FastifyRequest, reply: FastifyReply) => forumController.getThreads(request, reply));
    server.get('/threads/:id', { preHandler: [authMiddleware] }, (request: FastifyRequest, reply: FastifyReply) => forumController.getThread(request as any, reply));
    server.post('/threads', { preHandler: [authMiddleware] }, (request: FastifyRequest, reply: FastifyReply) => forumController.createThread(request, reply));
    server.post('/threads/:id/posts', { preHandler: [authMiddleware] }, (request: FastifyRequest, reply: FastifyReply) => forumController.createPost(request as any, reply));
    server.delete('/posts/:id', { preHandler: [authMiddleware] }, (request: FastifyRequest, reply: FastifyReply) => forumController.deletePost(request as any, reply));
}
