/**
 * Security Middleware Plugin for Fastify
 * 
 * Adds security headers and request sanitization.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { isDevelopment } from '../config/env.js';

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
 * Rate Limiting State (simple in-memory implementation)
 * In production, use Redis or similar for distributed rate limiting
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window
const AUTH_RATE_LIMIT_MAX = 10; // stricter limit for auth endpoints

export async function rateLimitPlugin(server: FastifyInstance) {
  server.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip;
    const now = Date.now();
    const isAuthEndpoint = request.url.startsWith('/auth/');
    const maxRequests = isAuthEndpoint ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX;
    
    const key = `${ip}:${isAuthEndpoint ? 'auth' : 'general'}`;
    let entry = rateLimitMap.get(key);
    
    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
      rateLimitMap.set(key, entry);
    } else {
      entry.count++;
    }
    
    // Set rate limit headers
    reply.header('X-RateLimit-Limit', maxRequests.toString());
    reply.header('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
    reply.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    
    if (entry.count > maxRequests) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
    }
  });
  
  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, RATE_LIMIT_WINDOW);
}
