import Redis from 'ioredis';
import { isDevelopment } from '../config/env.js';

class RedisService {
    private client: Redis | null = null;
    private isConnected: boolean = false;

    constructor() {
        this.init();
    }

    private init() {
        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || '127.0.0.1',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD || undefined,
                retryStrategy: (times) => {
                    if (times > 5) return null; // Stop retrying after 5 attempts
                    return Math.min(times * 100, 3000);
                },
                lazyConnect: true
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                if (isDevelopment) console.log('Redis connected successfully');
            });

            this.client.on('error', (err) => {
                this.isConnected = false;
                if (isDevelopment) console.error('Redis connection error:', err);
            });

            // Attempt immediate connect silently
            this.client.connect().catch(() => { });
        } catch (error) {
            this.isConnected = false;
        }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        if (!this.isConnected || !this.client) return;
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

        if (ttlSeconds) {
            await this.client.set(key, stringValue, 'EX', ttlSeconds);
        } else {
            await this.client.set(key, stringValue);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected || !this.client) return null;

        const value = await this.client.get(key);
        if (!value) return null;

        try {
            return JSON.parse(value) as T;
        } catch {
            return value as unknown as T;
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isConnected || !this.client) return;
        await this.client.del(key);
    }

    async keys(pattern: string): Promise<string[]> {
        if (!this.isConnected || !this.client) return [];
        return this.client.keys(pattern);
    }
}

export const redisService = new RedisService();
