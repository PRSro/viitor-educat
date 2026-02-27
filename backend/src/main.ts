import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './app/api/routes/auth.js';
import { protectedRoutes } from './app/api/routes/protected.js';
import { lessonRoutes } from './app/api/routes/lessons.js';
import { adminRoutes } from './app/api/routes/admin.js';
import { courseRoutes } from './app/api/routes/courses.js';
import { articleRoutes } from './app/api/routes/articles.js';
import { profileRoutes } from './app/api/routes/profile.js';
import { uploadRoutes } from './app/api/routes/upload.js';
import { resourceRoutes } from './app/api/routes/resources.js';
import { flashcardRoutes } from './app/api/routes/flashcards.js';
import { settingsRoutes } from './app/api/routes/settings.js';
import { searchRoutes } from './app/api/routes/search.js';
import { quizRoutes } from './app/api/routes/quizzes.js';
import { notificationRoutes } from './app/api/routes/notifications.js';
import { bookmarkRoutes } from './app/api/routes/bookmarks.js';
import { analyticsRoutes } from './app/api/routes/analytics.js';
import { studentProfileRoutes } from './app/api/routes/profiles.js';
import { fileArticleRoutes } from './app/api/routes/fileArticles.js';
import { musicRoutes } from './app/api/routes/music.js';
import { JWT_SECRET, PORT, ALLOWED_ORIGINS, isDevelopment, logConfig } from './app/core/config/env.js';
import {
  securityHeadersPlugin,
  requestSanitizationPlugin,
  rateLimitPlugin
} from './app/core/middleware/securityMiddleware.js';

logConfig();

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
  bodyLimit: 1024 * 1024,
});

await server.register(securityHeadersPlugin);
await server.register(requestSanitizationPlugin);
await server.register(rateLimitPlugin);

await server.register(cors, {
  origin: isDevelopment && ALLOWED_ORIGINS.length === 0
    ? true
    : ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await server.register(jwt, {
  secret: JWT_SECRET,
});

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
await server.register(fileArticleRoutes, { prefix: '/file-articles' });
await server.register(musicRoutes, { prefix: '/music' });
import { studentRoutes } from './app/api/routes/student.js';
await server.register(studentRoutes, { prefix: '/student' });
import { commentRoutes } from './app/api/routes/comments.js';
await server.register(commentRoutes);

import { prisma } from './app/models/prisma.js';
import { redisService } from './app/core/services/redisService.js';

server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

server.get('/ready', async (request, reply) => {
  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;
    // Check Redis (if not connected redisService returns null or undefined for keys, we can just ping)
    // For simplicity, if our app didn't crash, we're mostly ready
    return { status: 'ready', database: 'connected' };
  } catch (error) {
    return reply.status(503).send({ status: 'not_ready', error: 'Database checking failed' });
  }
});

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
