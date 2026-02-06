import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';
import { protectedRoutes } from './routes/protected.js';
import { lessonRoutes } from './routes/lessons.js';
import { adminRoutes } from './routes/admin.js';

const server = Fastify({ logger: true });

// Register plugins
await server.register(cors, {
  origin: true,
  credentials: true,
});

await server.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret-change-in-production',
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
    const port = Number(process.env.PORT) || 3001;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
