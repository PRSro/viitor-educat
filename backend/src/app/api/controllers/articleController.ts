import { FastifyRequest, FastifyReply } from 'fastify';
import { articleService } from '../../services/articleService.js';
import { z } from 'zod';

export class ArticleController {
    async create(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user;
        const result = await articleService.create(request.body as any, user.role);
        return reply.status(201).send(result);
    }

    async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const user = (request as any).user;
        const result = await articleService.update(request.params.id, request.body as any, user.id, user.role);
        return result;
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const user = (request as any).user;
        await articleService.delete(request.params.id, user.id, user.role);
        return reply.status(204).send();
    }

    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const result = await articleService.findById(request.params.id);
        if (!result) return reply.status(404).send({ error: 'Article not found' });
        return result;
    }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const { page, limit, category, teacherId, tags, search, published, status } = request.query as any;
        return articleService.findAll(
            { category, teacherId, tags: tags ? tags.split(',') : [], search, published, status },
            {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 10
            }
        );
    }

    async import(request: FastifyRequest, reply: FastifyReply) {
        const { url } = request.body as { url: string };
        const user = (request as any).user;
        const result = await articleService.import(url, user.id, user.role);
        return reply.status(201).send(result);
    }
}

export const articleController = new ArticleController();
