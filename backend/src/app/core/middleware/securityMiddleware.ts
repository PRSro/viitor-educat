/**
 * Security Middleware Plugin for Fastify
 * 
 * Adds security headers and request sanitization.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { isDevelopment, REDIS_URL } from '../config/env.js';
import Redis from 'ioredis';

/**
 * Security Headers Plugin
 * Adds essential security headers to all responses
 */
export async function securityHeadersPlugin(server: FastifyInstance) {
  server.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    // Prevent clickjacking
    reply.header('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    reply.header('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS filter in older browsers
    reply.header('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy (restrict browser features)
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy (adjust as needed for your app)
    if (!isDevelopment) {
      reply.header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
      );
    }
    
    // Strict Transport Security (only in production with HTTPS)
    if (!isDevelopment) {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  });
}

/**
 * Request Sanitization Hook
 * Validates and sanitizes incoming request data
 */
export async function requestSanitizationPlugin(server: FastifyInstance) {
  server.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Check for suspiciously large payloads (DoS prevention)
    const contentLength = request.headers['content-length'];
    if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) { // 1MB limit
      return reply.status(413).send({
        error: 'Payload Too Large',
        message: 'Request body exceeds maximum allowed size',
      });
    }
    
    // Check for common attack patterns in query strings
    const url = request.url;
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /\.\.\/\.\.\//,  // Path traversal
      /\0/,            // Null byte injection
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(url))) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Request contains invalid characters',
      });
    }
  });
}

/**
 * Rate Limiting
 * Uses Redis in production for distributed rate limiting.
 * Falls back to in-memory Map only in development.
 */
let redis: Redis | null = null;
let useRedis = false;

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window
const AUTH_RATE_LIMIT_MAX = 10; // stricter limit for auth endpoints

// In-memory fallback (development only)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(
  key: string,
  maxRequests: number
): Promise<{ allowed: boolean; count: number; resetTime: number }> {
  const now = Date.now();

  if (useRedis && redis) {
    const current = await redis.get(key);
    if (current) {
      const { count, resetTime } = JSON.parse(current);
      if (now > resetTime) {
        await redis.set(key, JSON.stringify({ count: 1, resetTime: now + RATE_LIMIT_WINDOW }), 'EX', 60);
        return { allowed: true, count: 1, resetTime: now + RATE_LIMIT_WINDOW };
      }
      if (count > maxRequests) {
        return { allowed: false, count, resetTime };
      }
      await redis.set(key, JSON.stringify({ count: count + 1, resetTime }), 'EX', 60);
      return { allowed: true, count: count + 1, resetTime };
    }
    await redis.set(key, JSON.stringify({ count: 1, resetTime: now + RATE_LIMIT_WINDOW }), 'EX', 60);
    return { allowed: true, count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  // In-memory fallback (development only)
  let entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(key, entry);
  } else {
    entry.count++;
  }
  return { allowed: entry.count <= maxRequests, count: entry.count, resetTime: entry.resetTime };
}

export async function rateLimitPlugin(server: FastifyInstance) {
  // Initialize Redis in production
  if (!isDevelopment) {
    if (!REDIS_URL) {
      throw new Error('REDIS_URL is required in production for distributed rate limiting');
    }
    redis = new Redis(REDIS_URL);
    useRedis = true;
    console.log('[RateLimit] Using Redis for distributed rate limiting');
  } else {
    console.log('[RateLimit] Using in-memory rate limiting (development only)');
  }

  server.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip;
    const isAuthEndpoint = request.url.startsWith('/auth/');
    const maxRequests = isAuthEndpoint ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX;
    
    const key = `ratelimit:${ip}:${isAuthEndpoint ? 'auth' : 'general'}`;
    const result = await checkRateLimit(key, maxRequests);
    
    // Set rate limit headers
    reply.header('X-RateLimit-Limit', maxRequests.toString());
    reply.header('X-RateLimit-Remaining', Math.max(0, maxRequests - result.count).toString());
    reply.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
    
    if (!result.allowed) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
    }
  });
  
  // Clean up old entries periodically (in-memory only)
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, RATE_LIMIT_WINDOW);
}
