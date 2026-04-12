import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { prisma } from '../../models/prisma.js';

export const cyberlabRoutes = async (server: FastifyInstance) => {
  server.get('/challenges', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user as { id: string };
      const userId = user.id;

      const challenges = await prisma.cyberChallenge.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
          points: true,
          description: true,
          hints: true,
          terminalCommands: true
        }
      });

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

      const user = (request as any).user as { id: string };
      const userId = user.id;

      const challenge = await prisma.cyberChallenge.findUnique({ 
        where: { id } 
      });

      if (!challenge) {
        return reply.status(404).send({ error: 'Challenge not found' });
      }

      if (!challenge.flagHash) {
        return reply.status(500).send({ error: 'Challenge configuration error' });
      }
      
      const correct = await bcrypt.compare(flag, challenge.flagHash);
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
            total: { increment: challenge.points }, 
            weekly: { increment: challenge.points }, 
            monthly: { increment: challenge.points }
          },
          create: { 
            userId, 
            total: challenge.points, 
            weekly: challenge.points, 
            monthly: challenge.points 
          }
        });
        
        await tx.pointEvent.create({
          data: { 
            userId, 
            type: 'CYBERLAB_SOLVE', 
            points: challenge.points, 
            metadata: { challengeId: id } 
          }
        });
      });
      
      return { correct: true, pointsAwarded: challenge.points, alreadySolved: false };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to submit flag' });
    }
  });
};