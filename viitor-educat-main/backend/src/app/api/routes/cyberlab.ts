import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { prisma } from '../../models/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHALLENGES_DIR = path.join(__dirname, '../../../../../lessons/free/cyberlab');

export const cyberlabRoutes = async (server: FastifyInstance) => {
  server.get('/challenges', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    server.log.info(`CyberLab challenges dir: ${CHALLENGES_DIR}`);
    try {
      const token = request.headers.authorization?.split(' ')[1];
      const decoded: any = server.jwt.decode(token as string);
      const userId: string = decoded?.sub;

      const files = fs.existsSync(CHALLENGES_DIR) ? fs.readdirSync(CHALLENGES_DIR).filter(f => f.endsWith('.json')) : [];
      const challenges = [];

      for (const file of files) {
        const filePath = path.join(CHALLENGES_DIR, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        const { flagHash, ...publicData } = parsed;
        challenges.push(publicData);
      }

      const events = await prisma.pointEvent.findMany({
        where: { userId, type: 'CYBERLAB_SOLVE' }
      });
      const solvedIds = events
        .map((e) => {
          const meta = e.metadata as { challengeId?: string } | null;
          return meta?.challengeId;
        })
        .filter((id): id is string => Boolean(id));

      const userPoints = await prisma.userPoints.findUnique({ where: { userId } });

      return { 
        challenges, 
        solvedIds, 
        userPoints: userPoints?.total || 0 
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to load challenges' });
    }
  });

  server.post('/challenges/:id/submit', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { flag } = request.body as { flag: string };

      if (!flag) {
        return reply.status(400).send({ error: 'Flag is required' });
      }

      const token = request.headers.authorization?.split(' ')[1];
      const decoded: any = server.jwt.decode(token as string);
      const userId: string = decoded?.sub;

      const filepath = path.join(CHALLENGES_DIR, `${id}.json`);
      if (!fs.existsSync(filepath)) {
        return reply.status(404).send({ error: 'Challenge not found' });
      }

      const fileData = fs.readFileSync(filepath, 'utf8');
      const data = JSON.parse(fileData);
      
      if (!data.flagHash) {
        return reply.status(500).send({ error: 'Challenge configuration error' });
      }
      
      const correct = await bcrypt.compare(flag, data.flagHash);
      if (!correct) {
        return { correct: false };
      }

      const existing = await prisma.pointEvent.findFirst({
        where: { 
          userId, 
          type: 'CYBERLAB_SOLVE',
          metadata: { path: ['challengeId'], equals: id }
        }
      });

      if (existing) {
        return { correct: true, pointsAwarded: 0, alreadySolved: true };
      }

      await prisma.$transaction(async (tx) => {
        await tx.userPoints.upsert({
          where: { userId },
          update: { 
            total: { increment: data.points }, 
            weekly: { increment: data.points }, 
            monthly: { increment: data.points }
          },
          create: { 
            userId, 
            total: data.points, 
            weekly: data.points, 
            monthly: data.points 
          }
        });
        
        await tx.pointEvent.create({
          data: { 
            userId, 
            type: 'CYBERLAB_SOLVE', 
            points: data.points, 
            metadata: { challengeId: id } 
          }
        });
      });
      
      return { correct: true, pointsAwarded: data.points, alreadySolved: false };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to submit flag' });
    }
  });
};
