import { Status } from '@prisma/client';
import { prisma } from '../models/prisma.js';


export const lessonService = {
    async createLesson(teacherId: string, data: { title: string; content: string; description?: string; order?: number; courseId?: string; status?: Status }) {
        return prisma.lesson.create({
            data: {
                title: data.title,
                content: data.content,
                description: data.description,
                order: data.order,
                courseId: data.courseId,
                teacherId,
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
    }
};
