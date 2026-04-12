import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { teacherOnly, anyRole } from '../../core/middleware/permissionMiddleware.js';
import { lessonController } from '../controllers/lessonController.js';

import { prisma } from '../../models/prisma.js';
import { JwtPayload } from '../../core/middleware/authMiddleware.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CYBERLAB_CHALLENGES_DIR = path.join(__dirname, '../../../../../lessons/free/cyberlab');

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

export async function lessonRoutes(server: FastifyInstance) {
  // GET /lessons/private — teacher's own private lessons
  server.get('/private', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    const user = getCurrentUser(request);
    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId: user.id,
        status: 'PRIVATE'
      },
      include: {
        _count: { select: { completions: true } }
      },
      orderBy: { order: 'asc' }
    });
    return { lessons };
  });

  // GET /lessons/cyberlab - Returns CyberLab challenges as training modules
  server.get('/cyberlab', {
    preHandler: [authMiddleware, anyRole]
  }, async (request, reply) => {
    try {
      server.log.info(`CyberLab lessons dir: ${CYBERLAB_CHALLENGES_DIR}`);
      
      // Get available challenges from cyberlab directory
      const files = fs.existsSync(CYBERLAB_CHALLENGES_DIR) 
        ? fs.readdirSync(CYBERLAB_CHALLENGES_DIR).filter(f => f.endsWith('.json'))
        : [];
      
      const ctfLessons = files.map(file => {
        const data = JSON.parse(fs.readFileSync(path.join(CYBERLAB_CHALLENGES_DIR, file), 'utf8'));
        const { flagHash, ...publicData } = data;
        return {
          id: publicData.id,
          title: publicData.title,
          description: publicData.description,
          category: publicData.category,
          type: 'challenge' as const,
          points: publicData.points,
          difficulty: publicData.difficulty,
          challengeUrl: `/student/cyberlab_challenges`
        };
      });

      return {
        ctfLessons,
        totalChallenges: ctfLessons.length
      };
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ error: 'Failed to load CyberLab lessons' });
    }
  });

  server.get('/', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.getAll(request, reply));
  server.get('/:id', (request: FastifyRequest, reply: FastifyReply) => lessonController.getById(request as any, reply));
  server.get('/teacher/:teacherId', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.getTeacherLessons(request as any, reply));
  server.get('/:id/view', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.view(request as any, reply));
  server.post('/:id/complete', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.complete(request as any, reply));
  server.post('/', { preHandler: [authMiddleware, teacherOnly] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.create(request, reply));
  server.delete('/:id', { preHandler: [authMiddleware, teacherOnly] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.remove(request as any, reply));
  server.patch('/:id', { preHandler: [authMiddleware, teacherOnly] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.update(request as any, reply));
  server.post('/:id/questions/:questionId/answer', { preHandler: [authMiddleware, anyRole] }, (request: FastifyRequest, reply: FastifyReply) => lessonController.submitAnswer(request as any, reply));
}
