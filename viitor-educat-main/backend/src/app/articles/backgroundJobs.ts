export interface BackgroundJob {
  id: string;
  type: 'INDEX_REBUILD' | 'CACHE_WARMUP' | 'SEARCH_INDEX' | 'SYNC_DB' | 'CLEANUP';
  status: 'pending' | 'running' | 'completed' | 'failed';
  data?: any;
  result?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

type JobHandler = (job: BackgroundJob) => Promise<void>;

class BackgroundJobManager {
  private jobs: Map<string, BackgroundJob> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing = false;
  private processInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start processing queue
    this.start();
  }

  registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  async enqueue(type: BackgroundJob['type'], data?: any): Promise<string> {
    const job: BackgroundJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'pending',
      data,
      createdAt: new Date().toISOString()
    };

    this.jobs.set(job.id, job);
    console.log(`[Jobs] Enqueued job ${job.id} of type ${type}`);
    
    return job.id;
  }

  async processJob(job: BackgroundJob): Promise<void> {
    const handler = this.handlers.get(job.type);
    
    if (!handler) {
      job.status = 'failed';
      job.error = `No handler registered for type: ${job.type}`;
      return;
    }

    job.status = 'running';
    job.startedAt = new Date().toISOString();
    this.jobs.set(job.id, job);

    try {
      console.log(`[Jobs] Processing job ${job.id} of type ${job.type}`);
      await handler(job);
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date().toISOString();
      console.error(`[Jobs] Job ${job.id} failed:`, error);
    }

    this.jobs.set(job.id, job);
  }

  async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const pendingJobs = Array.from(this.jobs.values())
        .filter(j => j.status === 'pending')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      for (const job of pendingJobs) {
        await this.processJob(job);
      }
    } finally {
      this.processing = false;
    }
  }

  start(intervalMs: number = 5000): void {
    if (this.processInterval) return;
    
    this.processInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);
    
    console.log(`[Jobs] Background job processor started (interval: ${intervalMs}ms)`);
  }

  stop(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
      console.log('[Jobs] Background job processor stopped');
    }
  }

  getJob(id: string): BackgroundJob | undefined {
    return this.jobs.get(id);
  }

  getJobs(filter?: { status?: BackgroundJob['status']; type?: BackgroundJob['type'] }): BackgroundJob[] {
    let jobs = Array.from(this.jobs.values());
    
    if (filter?.status) {
      jobs = jobs.filter(j => j.status === filter.status);
    }
    if (filter?.type) {
      jobs = jobs.filter(j => j.type === filter.type);
    }
    
    return jobs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getStats(): { pending: number; running: number; completed: number; failed: number } {
    const jobs = Array.from(this.jobs.values());
    return {
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };
  }

  clearCompleted(): void {
    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.jobs.delete(id);
      }
    }
  }
}

export const jobManager = new BackgroundJobManager();

// Predefined job handlers
export function registerJobHandlers(
  indexRebuildHandler: (articles: any[]) => Promise<void>,
  cacheWarmupHandler: () => Promise<void>,
  syncDbHandler: () => Promise<void>
): void {
  jobManager.registerHandler('INDEX_REBUILD', async (job) => {
    console.log('[Jobs] Running index rebuild...');
    await indexRebuildHandler(job.data?.articles || []);
    console.log('[Jobs] Index rebuild completed');
  });

  jobManager.registerHandler('CACHE_WARMUP', async (job) => {
    console.log('[Jobs] Running cache warmup...');
    await cacheWarmupHandler();
    console.log('[Jobs] Cache warmup completed');
  });

  jobManager.registerHandler('SYNC_DB', async (job) => {
    console.log('[Jobs] Running database sync...');
    await syncDbHandler();
    console.log('[Jobs] Database sync completed');
  });

  jobManager.registerHandler('CLEANUP', async (job) => {
    console.log('[Jobs] Running cleanup...');
    jobManager.clearCompleted();
    console.log('[Jobs] Cleanup completed');
  });
}

// Utility to schedule jobs
export const jobs = {
  async rebuildIndex(articles: any[]): Promise<string> {
    return jobManager.enqueue('INDEX_REBUILD', { articles });
  },

  async warmupCache(): Promise<string> {
    return jobManager.enqueue('CACHE_WARMUP');
  },

  async syncDatabase(): Promise<string> {
    return jobManager.enqueue('SYNC_DB');
  },

  async scheduleCleanup(): Promise<string> {
    return jobManager.enqueue('CLEANUP');
  },

  getStats() {
    return jobManager.getStats();
  },

  getJob(id: string) {
    return jobManager.getJob(id);
  },

  getJobs(filter?: { status?: BackgroundJob['status']; type?: BackgroundJob['type'] }) {
    return jobManager.getJobs(filter);
  }
};
