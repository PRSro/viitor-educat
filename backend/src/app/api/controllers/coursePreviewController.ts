/**
 * Course Preview Controller
 *
 * Handles GET /courses with full query-param support.
 * Validates all input with Zod before hitting the service.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Status } from '@prisma/client';
import { coursePreviewService } from '../../services/coursePreviewService.js';
import { ServiceResponse } from '../../core/types/service.js';

// ─── Query-param schema ───────────────────────────────────────────────────────

const querySchema = z.object({
    /** Only show courses with this status. Defaults to PUBLISHED. */
    status: z
        .enum(['PUBLISHED', 'DRAFT', 'PRIVATE'])
        .optional()
        .default('PUBLISHED'),

    /** Free-text search against title, description, and slug. */
    search: z.string().trim().max(200).optional(),

    /** Filter to a specific teacher's courses. */
    teacherId: z.string().trim().optional(),

    /** Sort order: newest (default) or popular (by enrolment count). */
    sort: z.enum(['newest', 'popular']).optional().default('newest'),

    /** Page number (1-indexed). */
    page: z
        .string()
        .optional()
        .default('1')
        .transform(Number)
        .pipe(z.number().int().min(1, 'page must be ≥ 1')),

    /** Items per page, capped at 50. */
    pageSize: z
        .string()
        .optional()
        .default('12')
        .transform(Number)
        .pipe(z.number().int().min(1).max(50, 'pageSize must be ≤ 50')),
});

export type PreviewQuery = z.infer<typeof querySchema>;

// ─── Error helper (mirrors the one in routes/courses.ts) ─────────────────────

function sendServiceError(result: ServiceResponse, reply: FastifyReply): boolean {
    if (!result.success) {
        const statusMap: Record<string, number> = {
            NOT_FOUND: 404,
            FORBIDDEN: 403,
            UNAUTHORIZED: 401,
            BAD_REQUEST: 400,
            INTERNAL_ERROR: 500,
        };
        const httpStatus = statusMap[result.errorCode ?? ''] ?? 500;
        reply.status(httpStatus).send({
            success: false,
            errorCode: result.errorCode ?? 'UNKNOWN_ERROR',
            message: result.message ?? 'An unexpected error occurred',
        });
        return true;
    }
    return false;
}

// ─── Controller ───────────────────────────────────────────────────────────────

export const coursePreviewController = {
    /**
     * GET /courses
     *
     * @openapi
     * /courses:
     *   get:
     *     summary: List published courses (preview shape)
     *     tags: [Courses]
     *     parameters:
     *       - in: query
     *         name: status
     *         schema: { type: string, enum: [PUBLISHED, DRAFT, PRIVATE] }
     *       - in: query
     *         name: search
     *         schema: { type: string }
     *       - in: query
     *         name: teacherId
     *         schema: { type: string }
     *       - in: query
     *         name: sort
     *         schema: { type: string, enum: [newest, popular] }
     *       - in: query
     *         name: page
     *         schema: { type: integer, minimum: 1 }
     *       - in: query
     *         name: pageSize
     *         schema: { type: integer, minimum: 1, maximum: 50 }
     *     responses:
     *       200:
     *         description: Paginated course preview list
     *       400:
     *         description: Invalid query parameters
     */
    async list(request: FastifyRequest, reply: FastifyReply) {
        // Validate query params
        const parsed = querySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                errorCode: 'BAD_REQUEST',
                message: parsed.error.errors.map((e) => e.message).join('; '),
            });
        }

        const { status, search, teacherId, sort, page, pageSize } = parsed.data;

        const result = await coursePreviewService.findPreview(
            { status: status as any, search, teacherId, sort },
            { page, pageSize }
        );

        if (sendServiceError(result, reply)) return;

        return reply.send({ success: true, ...result.data });
    },
};
