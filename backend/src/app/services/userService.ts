import { Prisma } from '@prisma/client';
import { prisma } from '../models/prisma.js';
import { BaseService } from '../core/services/BaseService.js';
import { ServiceResponse, PaginationMeta } from '../core/types/service.js';
import { AppError } from '../core/errors/AppError.js';
import { auditService } from './auditService.js';

export class UserService extends BaseService {
    async getProfile(userId: string): Promise<ServiceResponse> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    settings: true,
                    studentProfile: true,
                    teacherProfile: true
                }
            });

            if (!user) throw AppError.NotFound('User not found');

            return this.success(user);
        } catch (err) {
            return this.error(err);
        }
    }

    async updateRole(adminId: string, targetUserId: string, newRole: 'STUDENT' | 'TEACHER' | 'ADMIN'): Promise<ServiceResponse> {
        try {
            const user = await prisma.user.update({
                where: { id: targetUserId },
                data: { role: newRole }
            });

            await auditService.log(adminId, 'UPDATE_ROLE', 'User', targetUserId, { newRole });

            return this.success(user);
        } catch (err) {
            return this.error(err);
        }
    }

    async getAllUsers(pagination: { page: number; limit: number }): Promise<ServiceResponse> {
        try {
            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (pagination.page - 1) * pagination.limit,
                    take: pagination.limit
                }),
                prisma.user.count()
            ]);

            const meta: PaginationMeta = {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit)
            };

            return this.success(users, meta);
        } catch (err) {
            return this.error(err);
        }
    }
}

export const userService = new UserService();
