/**
 * Course Preview Service
 *
 * Powers the public course listing endpoint.
 * - Lean DB select (no heavy relations)
 * - Pagination + filtering + sort
 * - In-memory TTL cache (60 s) keyed on serialised params
 */

import { Prisma, Status } from '@prisma/client';
import { prisma } from '../models/prisma.js';
import { BaseService } from '../core/services/BaseService.js';
import { ServiceResponse } from '../core/types/service.js';

// ─── Shared types (exported so controller + frontend can import) ─────────────

export interface CoursePreview {
    id: string;
    title: string;
    slug: string;
    shortDescription: string | null;
    thumbnail: string | null;
    teacherName: string;
    status: string;
    level: string;
    category: string | null;
    enrolledCount: number;
    lessonCount: number;
}

export interface CoursePreviewPage {
    items: CoursePreview[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        hasNextPage: boolean;
    };
}

export type PreviewSort = 'newest' | 'popular';

export interface PreviewFilters {
    status?: Status;
    search?: string;
    teacherId?: string;
    sort?: PreviewSort;
}

export interface PreviewPagination {
    page: number;
    pageSize: number;
}

// ─── In-memory cache ─────────────────────────────────────────────────────────

interface CacheEntry {
    data: CoursePreviewPage;
    expiresAt: number;
}

const TTL_MS = 60_000; // 60 seconds
const cache = new Map<string, CacheEntry>();

function cacheKey(filters: PreviewFilters, pagination: PreviewPagination): string {
    return JSON.stringify({ ...filters, ...pagination });
}

function cacheGet(key: string): CoursePreviewPage | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function cacheSet(key: string, data: CoursePreviewPage): void {
    cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
    // Evict old entries to prevent unbounded growth
    if (cache.size > 200) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
    }
}

/** Invalidate the entire preview cache (call after course mutations). */
export function invalidatePreviewCache(): void {
    cache.clear();
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class CoursePreviewService extends BaseService {

    /**
     * Retrieve a paginated, filterable list of course previews.
     *
     * @example
     * // GET /courses?status=PUBLISHED&page=2&pageSize=12&search=react&sort=popular
     * const result = await coursePreviewService.findPreview(
     *   { status: Status.PUBLISHED, search: 'react', sort: 'popular' },
     *   { page: 2, pageSize: 12 }
     * );
     */
    async findPreview(
        filters: PreviewFilters,
        pagination: PreviewPagination
    ): Promise<ServiceResponse<CoursePreviewPage>> {
        try {
            const key = cacheKey(filters, pagination);
            const cached = cacheGet(key);
            if (cached) return this.success(cached);

            const { status = Status.PUBLISHED, search, teacherId, sort = 'newest' } = filters;
            const { page, pageSize } = pagination;
            const skip = (page - 1) * pageSize;

            // Build where clause
            const where: Prisma.CourseWhereInput = { status };
            if (teacherId) where.teacherId = teacherId;
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                ];
            }

            // Build orderBy
            const orderBy: Prisma.CourseOrderByWithRelationInput =
                sort === 'popular'
                    ? { enrollments: { _count: 'desc' } }
                    : { createdAt: 'desc' };

            const [rows, total] = await Promise.all([
                prisma.course.findMany({
                    where,
                    orderBy,
                    skip,
                    take: pageSize,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        description: true,
                        imageUrl: true,
                        level: true,
                        category: true,
                        status: true,
                        teacher: {
                            select: {
                                email: true,
                                teacherProfile: { select: { bio: true, pictureUrl: true } },
                            },
                        },
                        _count: { select: { enrollments: true, lessons: true } },
                    },
                }),
                prisma.course.count({ where }),
            ]);

            const items: CoursePreview[] = rows.map((row) => {
                const teacherName = row.teacher?.email?.split('@')[0] ?? 'Unknown';

                return {
                    id: row.id,
                    title: row.title,
                    slug: row.slug,
                    shortDescription: row.description ?? null,
                    thumbnail: row.imageUrl ?? null,
                    teacherName,
                    status: row.status,
                    level: row.level,
                    category: row.category ?? 'Uncategorized',
                    enrolledCount: row._count.enrollments,
                    lessonCount: row._count.lessons,
                };
            });

            const result: CoursePreviewPage = {
                items,
                meta: {
                    total,
                    page,
                    pageSize,
                    hasNextPage: skip + items.length < total,
                },
            };

            cacheSet(key, result);
            return this.success(result);
        } catch (err) {
            return this.error(err);
        }
    }
}

export const coursePreviewService = new CoursePreviewService();
