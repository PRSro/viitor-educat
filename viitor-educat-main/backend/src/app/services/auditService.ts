import { prisma } from '../models/prisma.js';
import { BaseService } from '../core/services/BaseService.js';
import { ServiceResponse } from '../core/types/service.js';

export class AuditService extends BaseService {
    async log(userId: string | null, action: string, resource: string, resourceId?: string, metadata?: any): Promise<ServiceResponse> {
        try {
            const entry = await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    resource,
                    resourceId,
                    metadata: metadata || {},
                },
            });
            return this.success(entry);
        } catch (err) {
            return this.error(err);
        }
    }

    async getLogs(filters: { resource?: string; resourceId?: string; userId?: string }): Promise<ServiceResponse> {
        try {
            const logs = await prisma.auditLog.findMany({
                where: {
                    ...(filters.resource && { resource: filters.resource }),
                    ...(filters.resourceId && { resourceId: filters.resourceId }),
                    ...(filters.userId && { userId: filters.userId }),
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true, role: true }
                    }
                }
            });
            return this.success(logs);
        } catch (err) {
            return this.error(err);
        }
    }
}

export const auditService = new AuditService();
