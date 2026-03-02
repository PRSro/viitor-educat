import { Status } from '@prisma/client';
import { prisma } from '../models/prisma.js';

function generateLessonSlug(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) result += chars[byte % 64];
  return result;
}

export const lessonService = {
    async createLesson(teacherId: string, data: { title: string; content: string; description?: string; order?: number; courseId?: string; status?: Status }) {
        let order = data.order;
        if (order === undefined && data.courseId) {
            const count = await prisma.lesson.count({ where: { courseId: data.courseId } });
            order = count;
        }

        let slug = generateLessonSlug();
        while (await prisma.lesson.findUnique({ where: { slug } })) {
            slug = generateLessonSlug();
        }

        return prisma.lesson.create({
            data: {
                title: data.title,
                content: data.content,
                description: data.description,
                order: order ?? 0,
                courseId: data.courseId,
                teacherId,
                slug,
                status: data.status || Status.PRIVATE,
            },
        });
    },

    async updateLesson(id: string, data: { title?: string; content?: string; description?: string; status?: Status; order?: number }) {
        return prisma.lesson.update({
            where: { id },
            data,
        });
    },

    async deleteLesson(id: string) {
        return prisma.lesson.delete({
            where: { id },
        });
    },

    async getLessonById(id: string) {
        return prisma.lesson.findUnique({
            where: { id },
            include: { course: true }
        });
    },

    async getLessonBySlug(slug: string) {
        return prisma.lesson.findUnique({
            where: { slug },
            include: { course: true }
        });
    }
};
