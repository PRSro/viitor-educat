import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Authentication Middleware
 * 
 * Verifies JWT token from Authorization header.
 * Attaches decoded user payload to request.user
 * 
 * Usage:
 *   server.addHook('preHandler', authMiddleware);
 *   // or on specific route:
 *   server.get('/protected', { preHandler: authMiddleware }, handler);
 */

export interface JwtPayload {
  id: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
}

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ 
        error: 'Unauthorized', 
        message: 'Missing or invalid Authorization header. Use: Bearer <token>' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify and decode JWT token
    const decoded = await request.server.jwt.verify<JwtPayload>(token);
    
    // Attach user to request for downstream handlers
    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
}
