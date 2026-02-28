import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { prisma } from '../../models/prisma.js';
import { z } from 'zod';

function getUser(req: FastifyRequest): JwtPayload {
    return (req as any).user as JwtPayload;
}

const createThreadSchema = z.object({
    title: z.string().min(3).max(200),
    body: z.string().min(10).max(10000),
    forumType: z.enum(['GENERAL', 'TEACHERS']).default('GENERAL'),
});

const createPostSchema = z.object({
    content: z.string().min(1).max(5000),
    parentId: z.string().optional().nullable(),
});

export async function forumRoutes(server: FastifyInstance) {

    // GET /forum/threads?type=GENERAL|TEACHERS
    server.get('/threads', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const user = getUser(request);
        const { type = 'GENERAL', page = '1', limit = '20' } = request.query as any;

        // TEACHERS forum only accessible by TEACHER or ADMIN
        if (type === 'TEACHERS' && user.role === 'STUDENT') {
            return reply.status(403).send({ error: 'Teacher forum is restricted to staff only.' });
        }

        const threads = await prisma.forumThread.findMany({
            where: { forumType: type },
            include: {
                author: { select: { id: true, email: true, role: true } },
                _count: { select: { posts: true } }
            },
            orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit),
        });

        const total = await prisma.forumThread.count({ where: { forumType: type } });

        return { threads, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
    });

    // GET /forum/threads/:id — full thread with posts
    server.get<{ Params: { id: string } }>('/threads/:id', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const user = getUser(request);
        const { id } = request.params;

        const thread = await prisma.forumThread.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, email: true, role: true } },
                posts: {
                    where: { parentId: null }, // top-level posts only
                    include: {
                        author: { select: { id: true, email: true, role: true } },
                        replies: {
                            where: { isDeleted: false },
                            include: {
                                author: { select: { id: true, email: true, role: true } }
                            },
                            orderBy: { createdAt: 'asc' }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!thread) return reply.status(404).send({ error: 'Thread not found' });

        // Block students from teacher forum
        if (thread.forumType === 'TEACHERS' && user.role === 'STUDENT') {
            return reply.status(403).send({ error: 'Access denied.' });
        }

        return { thread };
    });

    // POST /forum/threads — create a thread
    server.post('/threads', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const user = getUser(request);
        const body = createThreadSchema.parse(request.body);

        // Students can't post in TEACHERS forum
        if (body.forumType === 'TEACHERS' && user.role === 'STUDENT') {
            return reply.status(403).send({ error: 'Only teachers can post in the teacher forum.' });
        }

        const thread = await prisma.forumThread.create({
            data: {
                title: body.title,
                body: body.body,
                forumType: body.forumType,
                authorId: user.id,
            },
            include: { author: { select: { id: true, email: true, role: true } } }
        });

        return reply.status(201).send({ thread });
    });

    // POST /forum/threads/:id/posts — reply to a thread
    server.post<{ Params: { id: string } }>('/threads/:id/posts', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const user = getUser(request);
        const { id } = request.params;
        const body = createPostSchema.parse(request.body);

        const thread = await prisma.forumThread.findUnique({ where: { id } });
        if (!thread) return reply.status(404).send({ error: 'Thread not found' });
        if (thread.locked) return reply.status(403).send({ error: 'Thread is locked.' });
        if (thread.forumType === 'TEACHERS' && user.role === 'STUDENT') {
            return reply.status(403).send({ error: 'Access denied.' });
        }

        const post = await prisma.forumPost.create({
            data: {
                content: body.content,
                authorId: user.id,
                threadId: id,
                parentId: body.parentId || null,
            },
            include: { author: { select: { id: true, email: true, role: true } } }
        });

        // Bump thread updatedAt so it rises to top
        await prisma.forumThread.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        return reply.status(201).send({ post });
    });

    // DELETE /forum/posts/:id — soft delete own post or admin hard delete
    server.delete<{ Params: { id: string } }>('/posts/:id', {
        preHandler: [authMiddleware]
    }, async (request, reply) => {
        const user = getUser(request);
        const { id } = request.params;

        const post = await prisma.forumPost.findUnique({ where: { id } });
        if (!post) return reply.status(404).send({ error: 'Post not found' });
        if (post.authorId !== user.id && user.role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Cannot delete another user\'s post.' });
        }

        await prisma.forumPost.update({
            where: { id },
            data: { isDeleted: true, content: '[deleted]' }
        });

        return { success: true };
    });
}
