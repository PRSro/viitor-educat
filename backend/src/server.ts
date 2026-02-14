import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';
import { protectedRoutes } from './routes/protected.js';
import { lessonRoutes } from './routes/lessons.js';
import { adminRoutes } from './routes/admin.js';
import { courseRoutes } from './routes/courses.js';
import { articleRoutes } from './routes/articles.js';
import { profileRoutes } from './routes/profile.js';
import { uploadRoutes } from './routes/upload.js';
import { resourceRoutes } from './routes/resources.js';
import { flashcardRoutes } from './routes/flashcards.js';
import { settingsRoutes } from './routes/settings.js';
import { searchRoutes } from './routes/search.js';
import { quizRoutes } from './routes/quizzes.js';
import { notificationRoutes } from './routes/notifications.js';
import { bookmarkRoutes } from './routes/bookmarks.js';
import { analyticsRoutes } from './routes/analytics.js';
import { profileRoutes as studentProfileRoutes } from './routes/profiles.js';
import { JWT_SECRET, PORT, ALLOWED_ORIGINS, isDevelopment, logConfig } from './config/env.js';
import { 
  securityHeadersPlugin, 
  requestSanitizationPlugin, 
  rateLimitPlugin 
} from './middleware/securityMiddleware.js';

// Log configuration on startup
logConfig();

// Initialize Fastify with environment-aware logging
const server = Fastify({ 
  logger: isDevelopment ? true : {
    level: 'warn',
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
        };
      },
    },
  },
  // Security: limit body size
  bodyLimit: 1024 * 1024, // 1MB
});

// Register security plugins FIRST
await server.register(securityHeadersPlugin);
await server.register(requestSanitizationPlugin);
await server.register(rateLimitPlugin);

// Register CORS with restricted origins
await server.register(cors, {
  origin: isDevelopment && ALLOWED_ORIGINS.length === 0 
    ? true
    : ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Register JWT with secure secret
await server.register(jwt, {
  secret: JWT_SECRET,
});

// Global error handler - sanitizes errors in production
server.setErrorHandler((error: any, request, reply) => {
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
await server.register(courseRoutes, { prefix: '/courses' });
await server.register(articleRoutes, { prefix: '/articles' });
await server.register(profileRoutes, { prefix: '/profile' });
await server.register(uploadRoutes);
await server.register(resourceRoutes, { prefix: '/resources' });
await server.register(flashcardRoutes, { prefix: '/flashcards' });
await server.register(settingsRoutes, { prefix: '/settings' });
await server.register(searchRoutes, { prefix: '/search' });
await server.register(quizRoutes, { prefix: '/quizzes' });
await server.register(notificationRoutes, { prefix: '/notifications' });
await server.register(bookmarkRoutes, { prefix: '/bookmarks' });
await server.register(analyticsRoutes, { prefix: '/analytics' });
await server.register(studentProfileRoutes, { prefix: '/profiles' });

// Health check (public, but rate limited)
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
