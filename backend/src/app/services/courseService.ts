import { Prisma, CourseLevel } from '@prisma/client';
import { prisma } from '../models/prisma.js';

export interface CreateCourseData {
    title: string;
    description?: string;
    imageUrl?: string | null;
    level?: CourseLevel;
    category?: string;
    tags?: string[];
    teacherId: string;
    lessonIds?: string[];
    lessons?: {
        title: string;
        content: string;
        description?: string;
        status?: 'private' | 'public' | 'draft';
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
    status?: string;
    published?: boolean;
    lessonIds?: string[];
}

export interface CourseFilters {
    category?: string;
    level?: CourseLevel;
    teacherId?: string;
    published?: boolean;
    search?: string;
}

export const courseService = {
    async create(data: CreateCourseData) {
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
                status: data.status || 'DRAFT',
                published: data.status === 'PUBLIC',
                lessons: {
                    create: data.lessons?.map((l, i) => ({
                        title: l.title,
                        content: l.content,
                        description: l.description,
                        status: l.status || 'PRIVATE',
                        order: l.order ?? i,
                        teacherId: data.teacherId
                    })),
                    connect: data.lessonIds?.map((id) => ({ id }))
                }
            },
            include: {
                teacher: { select: { id: true, email: true } },
                lessons: { orderBy: { order: 'asc' } }
            }
        });
        
        return course;
    },

    async update(id: string, data: UpdateCourseData, teacherId: string, userRole: string, lessonsInput?: { id?: string; title: string; content: string; description?: string; order: number; status?: string }[]) {
        const existing = await prisma.course.findUnique({ where: { id } });
        
        if (!existing) {
            throw new Error('NOT_FOUND');
        }

        if (existing.teacherId !== teacherId && userRole !== 'ADMIN') {
            throw new Error('FORBIDDEN');
        }

        const { lessonIds, ...courseFields } = data;
        const updateData: Prisma.CourseUpdateInput = { ...courseFields };

        if (courseFields.status) {
            (updateData as any).published = courseFields.status === 'PUBLIC';
        }

        if (lessonIds) {
            (updateData as any).lessons = {
                set: lessonIds.map(id => ({ id }))
            };
        }

        return prisma.$transaction(async (tx) => {
            const course = await tx.course.update({
                where: { id },
                data: updateData
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
                                status: l.status || 'private'
                            }
                        });
                    }
                }
            } else if (data.published) {
                const count = await tx.lesson.count({ where: { courseId: id } });
                if (count === 0) throw new Error('COURSE_EMPTY');
            }

            return tx.course.findUnique({
                where: { id },
                include: { 
                    teacher: { select: { id: true, email: true } },
                    lessons: { orderBy: { order: 'asc' } } 
                }
            });
        });
    },

    async delete(id: string, teacherId: string, userRole: string) {
        const existing = await prisma.course.findUnique({ where: { id } });
        
        if (!existing) {
            throw new Error('NOT_FOUND');
        }

        if (existing.teacherId !== teacherId && userRole !== 'ADMIN') {
            throw new Error('FORBIDDEN');
        }

        return prisma.course.delete({ where: { id } });
    },

    async findById(id: string) {
        return prisma.course.findUnique({
            where: { id },
            include: {
                teacher: { select: { id: true, email: true } },
                lessons: { orderBy: { order: 'asc' } },
                _count: { select: { enrollments: true, lessons: true } }
            }
        });
    },

    async findBySlug(slug: string) {
        return prisma.course.findUnique({
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
    },

    async findAll(filters: CourseFilters, pagination: { page: number; limit: number }) {
        const where: Prisma.CourseWhereInput = {};

        if (filters.category) {
            where.category = filters.category;
        }

        if (filters.level) {
            where.level = filters.level;
        }

        if (filters.teacherId) {
            where.teacherId = filters.teacherId;
        }

        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        if (filters.published !== undefined) {
            where.published = filters.published;
        } else {
            where.published = true;
        }

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
                    published: true,
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

        return {
            courses,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit)
            }
        };
    },

    async findByTeacher(teacherId: string, pagination: { page: number; limit: number }, includeUnpublished = false) {
        const where: Prisma.CourseWhereInput = { teacherId };

        if (!includeUnpublished) {
            where.published = true;
        }

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
                    published: true,
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

        return {
            courses,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit)
            }
        };
    },

    async checkOwnership(id: string, userId: string): Promise<boolean> {
        const course = await prisma.course.findUnique({
            where: { id },
            select: { teacherId: true }
        });
        return course?.teacherId === userId;
    },

    generateSlug(title: string): string {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100) + '-' + Date.now().toString(36);
    },

    getCourseById(id: string) {
        return this.findById(id);
    },

    getCourseBySlug(slug: string) {
        return this.findBySlug(slug);
    },

    createCourse(data: CreateCourseData) {
        return this.create(data);
    },

    updateCourse(id: string, data: UpdateCourseData, lessonsInput?: any[]) {
        return this.update(id, data, '', 'TEACHER', lessonsInput);
    }
};
