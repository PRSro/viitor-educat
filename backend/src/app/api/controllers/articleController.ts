import { FastifyRequest, FastifyReply } from 'fastify';
import { articleService } from '../../services/articleService.js';
import { AppError } from '../../core/errors/AppError.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';

// Schemas are kept in the controller or moved to a shared place
const articleCategoryEnum = z.enum([
    'MATH', 'SCIENCE', 'LITERATURE', 'HISTORY',
    'COMPUTER_SCIENCE', 'ARTS', 'LANGUAGES', 'GENERAL'
]);

const articleQuerySchema = z.object({
    category: articleCategoryEnum.optional(),
    teacherId: z.string().optional(),
    tags: z.string().optional(),
    search: z.string().max(100).optional(),
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(50).optional().default(10),
});

export const articleController = {
    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = articleQuerySchema.parse(request.query);
            const result = await articleService.findAll(query as any, { page: query.page, limit: query.limit });

            if (!result.success) {
                return reply.status(400).send(result);
            }

            return reply.send({ articles: result.data, pagination: result.meta });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Validation failed',
                    message: formatZodError(error)
                });
            }
            throw error;
        }
    },

    async getBySlug(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
        const result = await articleService.findBySlug(request.params.slug);

        if (!result.success) {
            return reply.status(404).send(result);
        }

        return reply.send({ article: result.data });
    },

    // other methods (create, import, update, delete) will be routed here similarly
    // I will refactor `articles.ts` to use these soon.
};
