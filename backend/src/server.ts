import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';
import { protectedRoutes } from './routes/protected.js';
import { lessonRoutes } from './routes/lessons.js';
import { adminRoutes } from './routes/admin.js';
import { JWT_SECRET, PORT, ALLOWED_ORIGINS, isDevelopment, logConfig } from './config/env.js';

// Log configuration on startup
logConfig();

// Initialize Fastify with environment-aware logging
const server = Fastify({ 
  logger: isDevelopment ? true : {
    level: 'warn',
    // In production, use structured logging and avoid logging sensitive data
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
        };
      },
    },
  }
});

// Register CORS with restricted origins
await server.register(cors, {
  origin: isDevelopment && ALLOWED_ORIGINS.length === 0 
    ? true // Allow all in development if no origins specified
    : ALLOWED_ORIGINS,
  credentials: true,
});

// Register JWT with secure secret
await server.register(jwt, {
  secret: JWT_SECRET,
});

// Global error handler - sanitizes errors in production
server.setErrorHandler((error, request, reply) => {
  server.log.error(error);
  
  const statusCode = error.statusCode || 500;
  const message = isDevelopment 
    ? error.message 
    : 'An unexpected error occurred';
  
  reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Error',
    message: statusCode >= 500 ? message : error.message,
  });
});

// Register routes
await server.register(authRoutes, { prefix: '/auth' });
await server.register(protectedRoutes, { prefix: '/api' });
await server.register(lessonRoutes, { prefix: '/lessons' });
await server.register(adminRoutes, { prefix: '/admin' });

// Health check
server.get('/health', async () => ({ status: 'ok' }));

// Start server
const start = async () => {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
