import { Prisma, CourseLevel, Status } from '@prisma/client';
import { prisma } from '../models/prisma.js';
import { BaseService } from '../core/services/BaseService.js';
import { ServiceResponse, PaginationMeta } from '../core/types/service.js';
import { AppError } from '../core/errors/AppError.js';
import { auditService } from './auditService.js';

export interface CreateCourseData {
    title: string;
    description?: string;
    imageUrl?: string | null;
    level?: CourseLevel;
    category?: string;
    tags?: string[];
    teacherId: string;
    status?: Status;
    enrollmentLimit?: number | null;
    waitlistEnabled?: boolean;
    lessons?: {
        title: string;
        content: string;
        description?: string;
        status?: Status;
        order?: number;
    }[];
}

export interface UpdateCourseData {
    title?: string;
    description?: string;
    imageUrl?: string | null;
    level?: CourseLevel;
    category?: string;
    tags?: string[];
    status?: Status;
    enrollmentLimit?: number | null;
    waitlistEnabled?: boolean;
}

export interface CourseFilters {
    category?: string;
    level?: CourseLevel;
    teacherId?: string;
    status?: Status;
    published?: boolean;
    search?: string;
}

export class CourseService extends BaseService {
    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 100) + '-' + Date.now().toString(36);
    }

    async create(data: CreateCourseData, userRole: string): Promise<ServiceResponse> {
        try {
            if (userRole === 'STUDENT') {
                throw AppError.Forbidden('Students cannot create courses');
            }

            const slug = this.generateSlug(data.title);

            const course = await prisma.course.create({
                data: {
                    title: data.title,
                    description: data.description,
                    imageUrl: data.imageUrl,
                    level: data.level || CourseLevel.BEGINNER,
                    category: data.category || 'GENERAL',
                    tags: data.tags || [],
                    teacherId: data.teacherId,
                    slug,
                    status: data.status || Status.DRAFT,
                    enrollmentLimit: data.enrollmentLimit,
                    waitlistEnabled: data.waitlistEnabled || false,
                    lessons: {
                        create: data.lessons?.map((l, i) => ({
                            title: l.title,
                            content: l.content,
                            description: l.description,
                            status: l.status || Status.PRIVATE,
                            order: l.order ?? i,
                            teacherId: data.teacherId
                        }))
                    }
                },
                include: {
                    teacher: { select: { id: true, email: true } },
                    lessons: { orderBy: { order: 'asc' } }
                }
            });

            await auditService.log(data.teacherId, 'CREATE_COURSE', 'Course', course.id);

            return this.success(course);
        } catch (err) {
            return this.error(err);
        }
    }

    async update(id: string, data: UpdateCourseData, teacherId: string, userRole: string, lessonsInput?: { id?: string; title: string; content: string; description?: string; order: number; status?: Status }[]): Promise<ServiceResponse> {
        try {
            const existing = await prisma.course.findUnique({ where: { id } });

            if (!existing) {
                throw AppError.NotFound('Course not found');
            }

            if (existing.teacherId !== teacherId && userRole !== 'ADMIN') {
                throw AppError.Forbidden('Access denied');
            }

            const updated = await prisma.$transaction(async (tx) => {
                const course = await tx.course.update({
                    where: { id },
                    data: {
                        ...data,
                        ...(data.title && { slug: this.generateSlug(data.title) })
                    }
                });

                if (lessonsInput) {
                    const existingLessons = await tx.lesson.findMany({
                        where: { courseId: id },
                        select: { id: true }
                    });
                    const existingIds = new Set(existingLessons.map(l => l.id));
                    const inputIds = new Set(lessonsInput.map(l => l.id).filter(Boolean) as string[]);

                    const toDelete = existingLessons.filter(l => !inputIds.has(l.id));
                    if (toDelete.length > 0) {
                        await tx.lesson.deleteMany({
                            where: { id: { in: toDelete.map(l => l.id) } }
                        });
                    }

                    for (const l of lessonsInput) {
                        if (l.id && existingIds.has(l.id)) {
                            await tx.lesson.update({
                                where: { id: l.id },
                                data: {
                                    title: l.title,
                                    content: l.content,
                                    description: l.description,
                                    order: l.order,
                                    status: l.status
                                }
                            });
                        } else {
                            await tx.lesson.create({
                                data: {
                                    courseId: id,
                                    teacherId: course.teacherId,
                                    title: l.title,
                                    content: l.content,
                                    description: l.description,
                                    order: l.order,
                                    status: l.status || Status.PRIVATE
                                }
                            });
                        }
                    }
                } else if (data.status === Status.PUBLISHED) {
                    const count = await tx.lesson.count({ where: { courseId: id } });
                    if (count === 0) throw AppError.BadRequest('Cannot publish a course without lessons');
                }

                return tx.course.findUnique({
                    where: { id },
                    include: {
                        teacher: { select: { id: true, email: true } },
                        lessons: { orderBy: { order: 'asc' } }
                    }
                });
            });

            await auditService.log(teacherId, 'UPDATE_COURSE', 'Course', id);

            return this.success(updated);
        } catch (err) {
            return this.error(err);
        }
    }

    async delete(id: string, teacherId: string, userRole: string): Promise<ServiceResponse> {
        try {
            const existing = await prisma.course.findUnique({ where: { id } });

            if (!existing) {
                throw AppError.NotFound('Course not found');
            }

            if (existing.teacherId !== teacherId && userRole !== 'ADMIN') {
                throw AppError.Forbidden('Access denied');
            }

            await prisma.course.delete({ where: { id } });
            await auditService.log(teacherId, 'DELETE_COURSE', 'Course', id);

            return this.success({ deleted: true });
        } catch (err) {
            return this.error(err);
        }
    }

    async findById(id: string): Promise<ServiceResponse> {
        try {
            const course = await prisma.course.findUnique({
                where: { id },
                include: {
                    teacher: { select: { id: true, email: true } },
                    lessons: { orderBy: { order: 'asc' } },
                    _count: { select: { enrollments: true, lessons: true } }
                }
            });

            if (!course) throw AppError.NotFound('Course not found');

            return this.success(course);
        } catch (err) {
            return this.error(err);
        }
    }

    async findBySlug(slug: string): Promise<ServiceResponse> {
        try {
            const course = await prisma.course.findUnique({
                where: { slug },
                include: {
                    teacher: {
                        select: { id: true, email: true },
                        include: { teacherProfile: true }
                    },
                    lessons: { orderBy: { order: 'asc' } },
                    _count: { select: { enrollments: true, lessons: true } }
                }
            });

            if (!course) throw AppError.NotFound('Course not found');

            return this.success(course);
        } catch (err) {
            return this.error(err);
        }
    }

    async findAll(filters: CourseFilters, pagination: { page: number; limit: number }): Promise<ServiceResponse> {
        try {
            const where: Prisma.CourseWhereInput = {};

            if (filters.category) where.category = filters.category;
            if (filters.level) where.level = filters.level;
            if (filters.teacherId) where.teacherId = filters.teacherId;

            if (filters.search) {
                where.OR = [
                    { title: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } }
                ];
            }

            if (filters.published !== undefined) where.published = filters.published;

            where.status = filters.status !== undefined ? filters.status : Status.PUBLISHED;

            const [courses, total] = await Promise.all([
                prisma.course.findMany({
                    where,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        description: true,
                        imageUrl: true,
                        level: true,
                        category: true,
                        tags: true,
                        status: true,
                        createdAt: true,
                        teacher: { select: { id: true, email: true } },
                        _count: { select: { lessons: true, enrollments: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (pagination.page - 1) * pagination.limit,
                    take: pagination.limit
                }),
                prisma.course.count({ where })
            ]);

            const meta: PaginationMeta = {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit)
            };

            return this.success(courses, meta);
        } catch (err) {
            return this.error(err);
        }
    }

    async checkOwnership(id: string, userId: string): Promise<boolean> {
        const course = await prisma.course.findUnique({
            where: { id },
            select: { teacherId: true }
        });
        return course?.teacherId === userId;
    }

    // Aliases for route compatibility
    async getCourseById(id: string) {
        const res = await this.findById(id);
        return res.data;
    }

    async getCourseBySlug(slug: string) {
        const res = await this.findBySlug(slug);
        return res.data;
    }
}

export const courseService = new CourseService();
