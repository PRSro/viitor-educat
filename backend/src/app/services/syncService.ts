import { Queue, Worker } from 'bullmq';
import { BaseService } from '../core/services/BaseService.js';
import { ServiceResponse } from '../core/types/service.js';
import { articleService } from './articleService.js';
import { auditService } from './auditService.js';
import { isDevelopment } from '../core/config/env.js';

// Setup Redis connection for BullMQ
const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined
};

// Queue for article background sync
export const syncQueue = new Queue('article-sync', { connection });

export class SyncService extends BaseService {
    async queueSync(articleId: string, authorId: string): Promise<ServiceResponse> {
        try {
            const job = await syncQueue.add('sync-article', { articleId, authorId }, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 }
            });

            await auditService.log(authorId, 'QUEUE_SYNC', 'Article', articleId, { jobId: job.id });

            return this.success({ jobId: job.id, message: 'Sync background job queued' });
        } catch (err) {
            return this.error(err);
        }
    }

    async getSyncStatus(jobId: string): Promise<ServiceResponse> {
        try {
            const job = await syncQueue.getJob(jobId);
            if (!job) {
                return this.error(new Error('Job not found'));
            }

            const state = await job.getState();
            const progress = job.progress;

            return this.success({ id: job.id, state, progress, returnvalue: job.returnvalue });
        } catch (err) {
            return this.error(err);
        }
    }
}

export const syncService = new SyncService();

// Worker logic (ideally run in a separate process, but instantiated here for the example)
export const syncWorker = new Worker('article-sync', async (job) => {
    const { articleId, authorId } = job.data;

    // Here we would implement the logic to sync DB and File
    // e.g. read file content, update DB, full-text index update

    // Mock processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    await job.updateProgress(50);

    // Example dummy logic
    const response = await articleService.findById(articleId);
    if (response.success) {
        // Simulate sync
        // await fileManager.write(articleId, response.data.content);
    }

    await job.updateProgress(100);
    return { synced: true, articleId };
}, { connection });

syncWorker.on('completed', job => {
    if (isDevelopment) {
        console.log(`Sync job ${job.id} completed!`);
    }
});

syncWorker.on('failed', (job, err) => {
    if (isDevelopment) {
        console.error(`Sync job ${job?.id} failed with ${err.message}`);
    }
});
