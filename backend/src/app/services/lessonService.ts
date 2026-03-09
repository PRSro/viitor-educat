import { Status } from '@prisma/client';
import { prisma } from '../models/prisma.js';

export const lessonService = {
    async createLesson(teacherId: string, data: { title: string; content: string; description?: string; order?: number; status?: Status }) {
        let order = data.order;
        if (order === undefined) {
            order = 0;
        }

        return prisma.lesson.create({
            data: {
                title: data.title,
                content: data.content,
                description: data.description,
                order: order,
                teacherId,
                status: data.status || Status.PUBLIC,
                questions: (data as any).questions ? {
                    create: (data as any).questions.map((q: any, i: number) => ({
                        prompt: q.prompt,
                        questionType: q.type || 'SHORT_ANSWER',
                        order: i
                    }))
                } : undefined
            },
        });
    },

    async updateLesson(id: string, data: { title?: string; content?: string; description?: string; status?: Status; order?: number; questions?: any[] }) {
        const { questions, ...updateData } = data;
        
        return prisma.$transaction(async (tx) => {
            const lesson = await tx.lesson.update({
                where: { id },
                data: updateData as any,
            });

            if (questions) {
                // For simplicity, replace all questions
                await tx.lessonQuestion.deleteMany({ where: { lessonId: id } });
                await tx.lessonQuestion.createMany({
                    data: questions.map((q: any, i: number) => ({
                        lessonId: id,
                        prompt: q.prompt,
                        questionType: q.type || 'SHORT_ANSWER',
                        order: i
                    }))
                });
            }

            return tx.lesson.findUnique({
                where: { id },
                include: { questions: { orderBy: { order: 'asc' } } }
            });
        });
    },

    async deleteLesson(id: string) {
        return prisma.lesson.delete({
            where: { id },
        });
    },

    async getLessonById(id: string) {
        return prisma.lesson.findUnique({
            where: { id }
        });
    }
};
