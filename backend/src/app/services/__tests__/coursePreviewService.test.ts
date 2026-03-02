import { describe, it, expect, vi, beforeEach } from 'vitest';
import { coursePreviewService } from '../coursePreviewService.js';
import { prisma } from '../../models/prisma.js';
import { Status } from '@prisma/client';

// Mock Prisma
vi.mock('../../models/prisma.js', () => ({
    prisma: {
        course: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
    },
    default: {
        course: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

describe('CoursePreviewService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return paginated course previews', async () => {
        const mockCourses = [
            {
                id: '1',
                title: 'Course 1',
                slug: 'course-1',
                description: 'Desc 1',
                imageUrl: 'img1.jpg',
                level: 'BEGINNER',
                category: 'IT',
                status: Status.PUBLISHED,
                teacher: {
                    email: 'teacher@example.com',
                    teacherProfile: { bio: 'Bio 1', pictureUrl: 'p1.jpg' },
                },
                _count: { enrollments: 10, lessons: 5 },
            },
        ];

        (prisma.course.findMany as any).mockResolvedValue(mockCourses);
        (prisma.course.count as any).mockResolvedValue(1);

        const result = await coursePreviewService.findPreview(
            { status: Status.PUBLISHED },
            { page: 1, pageSize: 10 }
        );

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.items).toHaveLength(1);
            expect(result.data.items[0].title).toBe('Course 1');
            expect(result.data.items[0].teacherName).toBe('teacher');
            expect(result.data.meta.total).toBe(1);
            expect(result.data.meta.hasNextPage).toBe(false);
        }
    });

    it('should handle search filters', async () => {
        (prisma.course.findMany as any).mockResolvedValue([]);
        (prisma.course.count as any).mockResolvedValue(0);

        await coursePreviewService.findPreview(
            { search: 'react' },
            { page: 1, pageSize: 12 }
        );

        expect(prisma.course.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    OR: [
                        { title: { contains: 'react', mode: 'insensitive' } },
                        { description: { contains: 'react', mode: 'insensitive' } },
                        { slug: { contains: 'react', mode: 'insensitive' } },
                    ],
                }),
            })
        );
    });

    it('should handle pagination correctly', async () => {
        (prisma.course.findMany as any).mockResolvedValue([]);
        (prisma.course.count as any).mockResolvedValue(25);

        const result = await coursePreviewService.findPreview(
            {},
            { page: 2, pageSize: 10 }
        );

        expect(prisma.course.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 10,
                take: 10,
            })
        );

        if (result.success && result.data) {
            expect(result.data.meta.hasNextPage).toBe(true);
        }
    });

    it('should use cache for subsequent requests', async () => {
        (prisma.course.findMany as any).mockResolvedValue([]);
        (prisma.course.count as any).mockResolvedValue(0);

        // First call
        await coursePreviewService.findPreview({}, { page: 1, pageSize: 10 });
        // Second call (should hit cache)
        await coursePreviewService.findPreview({}, { page: 1, pageSize: 10 });

        expect(prisma.course.findMany).toHaveBeenCalledTimes(1);
    });
});
