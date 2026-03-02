import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { courseRoutes } from '../courses.js';

// Mock dependencies
vi.mock('../../../services/coursePreviewService.js', () => ({
    coursePreviewService: {
        findPreview: vi.fn(),
    },
}));

vi.mock('../../../services/courseService.js', () => ({
    courseService: {
        getCourseById: vi.fn(),
    },
}));

vi.mock('../../../models/prisma.js', () => ({
    prisma: {
        course: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
        enrollment: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('../../../core/middleware/authMiddleware.js', () => ({
    authMiddleware: (req: any, reply: any, done: any) => {
        (req as any).user = { id: 'test-user', role: 'STUDENT' };
        done();
    },
}));

describe('Course Preview Route', () => {
    let server: any;

    beforeEach(async () => {
        server = Fastify();
        await server.register(courseRoutes);
        vi.clearAllMocks();
    });

    it('should return 200 and paginated results for GET /', async () => {
        const { coursePreviewService } = await import('../../../services/coursePreviewService.js');
        (coursePreviewService.findPreview as any).mockResolvedValue({
            success: true,
            data: {
                items: [],
                meta: { total: 0, page: 1, pageSize: 12, hasNextPage: false },
            },
        });

        const response = await server.inject({
            method: 'GET',
            url: '/',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.items).toEqual([]);
    });

    it('should return 400 for invalid query parameters', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/?page=0', // page must be >= 1
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.errorCode).toBe('BAD_REQUEST');
    });

    it('should pass query parameters to the service', async () => {
        const { coursePreviewService } = await import('../../../services/coursePreviewService.js');
        (coursePreviewService.findPreview as any).mockResolvedValue({
            success: true,
            data: { items: [], meta: { total: 0, page: 1, pageSize: 10, hasNextPage: false } },
        });

        await server.inject({
            method: 'GET',
            url: '/?search=react&pageSize=10&sort=popular',
        });

        expect(coursePreviewService.findPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                search: 'react',
                sort: 'popular',
            }),
            expect.objectContaining({
                pageSize: 10,
            })
        );
    });
});
