import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './app/api/routes/auth.js';
import { protectedRoutes } from './app/api/routes/protected.js';
import { lessonRoutes } from './app/api/routes/lessons.js';
import { adminRoutes } from './app/api/routes/admin.js';
import { articleRoutes } from './app/api/routes/articles.js';
import { profileRoutes } from './app/api/routes/profile.js';
import { uploadRoutes } from './app/api/routes/upload.js';
import { resourceRoutes } from './app/api/routes/resources.js';
import { flashcardRoutes } from './app/api/routes/flashcards.js';
import { settingsRoutes } from './app/api/routes/settings.js';
import { searchRoutes } from './app/api/routes/search.js';
import { leaderboardRoutes } from './app/api/routes/leaderboard.js';
import { classroomRoutes } from './app/api/routes/classrooms.js';
import { quizRoutes } from './app/api/routes/quizzes.js';
import { notificationRoutes } from './app/api/routes/notifications.js';
import { bookmarkRoutes } from './app/api/routes/bookmarks.js';
import { analyticsRoutes } from './app/api/routes/analytics.js';
import { studentProfileRoutes } from './app/api/routes/profiles.js';
import { fileArticleRoutes } from './app/api/routes/fileArticles.js';
import { musicRoutes } from './app/api/routes/music.js';
import { commentRoutes } from './app/api/routes/comments.js';
import { newsRoutes } from './app/api/routes/news.js';
import { studentRoutes } from './app/api/routes/student.js';
import { portalTeachersRoutes } from './app/api/routes/portalTeachers.js';
import { forumRoutes } from './app/api/routes/forum.js';
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
  origin: isDevelopment && Array.isArray(ALLOWED_ORIGINS) && ALLOWED_ORIGINS.length === 0
    ? true
    : ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await server.register(import('@fastify/multipart'), {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
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
await server.register(lessonRoutes, { prefix: '/api/lessons' });
await server.register(adminRoutes, { prefix: '/api/admin' });
await server.register(articleRoutes, { prefix: '/api/articles' });
await server.register(profileRoutes, { prefix: '/api/profile' });
await server.register(uploadRoutes, { prefix: '/api/upload' });
await server.register(resourceRoutes, { prefix: '/api/resources' });
await server.register(flashcardRoutes, { prefix: '/api/flashcards' });
await server.register(settingsRoutes, { prefix: '/api/settings' });
await server.register(searchRoutes, { prefix: '/api/search' });
await server.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
await server.register(classroomRoutes, { prefix: '/api/classrooms' });
await server.register(quizRoutes, { prefix: '/api/quizzes' });
await server.register(notificationRoutes, { prefix: '/api/notifications' });
await server.register(bookmarkRoutes, { prefix: '/api/bookmarks' });
await server.register(analyticsRoutes, { prefix: '/api/analytics' });
await server.register(studentProfileRoutes, { prefix: '/api/profiles' });
await server.register(fileArticleRoutes, { prefix: '/api/file-articles' });
await server.register(musicRoutes, { prefix: '/api/music' });
await server.register(newsRoutes, { prefix: '/api/news' });
await server.register(portalTeachersRoutes, { prefix: '/api/portalTeachers' });
await server.register(studentRoutes, { prefix: '/api/student' });
await server.register(commentRoutes, { prefix: '/api/comments' });
await server.register(forumRoutes, { prefix: '/api/forum' });

import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the frontend build directory
// In development, this might not exist yet, so we handle it gracefully
const distPath = path.join(__dirname, '../../dist');

await server.register(fastifyStatic, {
  root: distPath,
  prefix: '/',
  constraints: {},
  wildcard: false, // Don't match everything, let the router handle it
});

// For any other route not handled by the API, serve index.html (SPA support)
server.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith('/api') || request.url.startsWith('/auth')) {
    return reply.status(404).send({
      message: `Route ${request.method}:${request.url} not found`,
      error: 'Not Found',
      statusCode: 404
    });
  }

  try {
    return await reply.sendFile('index.html');
  } catch (err) {
    return reply.status(404).send({
      message: 'Resource not found and frontend not available',
      error: 'Not Found',
      statusCode: 404
    });
  }
});

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
    await server.listen({
      port: Number(process.env.PORT) || 3001,
      host: '0.0.0.0'
    });
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
