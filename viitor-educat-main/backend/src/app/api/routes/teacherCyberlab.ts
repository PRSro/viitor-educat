import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { requireRole } from '../../core/middleware/permissionMiddleware.js';
import { prisma } from '../../models/prisma.js';

function sanitizeChallengeId(id: string): string {
  return id.replace(/[^a-z0-9_-]/gi, '').slice(0, 64);
}

export const teacherCyberlabRoutes = async (server: FastifyInstance) => {

  /**
   * GET /api/teacher/cyberlab/challenges
   * Get all challenges with submission stats
   */
  server.get('/challenges', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const challenges = await prisma.cyberChallenge.findMany({
        orderBy: { createdAt: 'asc' }
      });

      const challengesWithStats = await Promise.all(
        challenges.map(async (challenge) => {
          const solveCount = await prisma.pointEvent.count({
            where: { 
              type: 'CYBERLAB_SOLVE',
              metadata: { path: ['challengeId'], equals: challenge.id }
            }
          });

          return {
            id: challenge.id,
            title: challenge.title,
            category: challenge.category,
            difficulty: challenge.difficulty,
            points: challenge.points,
            description: challenge.description,
            hints: challenge.hints,
            terminalCommands: challenge.terminalCommands as any,
            solveCount
          };
        })
      );

      return { challenges: challengesWithStats };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to load challenges' });
    }
  });

  /**
   * GET /api/teacher/cyberlab/challenges/:id
   * Get a single challenge with full details
   */
  server.get('/challenges/:id', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const safeId = sanitizeChallengeId(id);
      
      if (!safeId || safeId !== id) {
        return reply.status(400).send({ error: 'Invalid challenge ID format' });
      }
      
      const challenge = await prisma.cyberChallenge.findUnique({
        where: { id: safeId }
      });

      if (!challenge) {
        return reply.status(404).send({ error: 'Challenge not found' });
      }

      const solveCount = await prisma.pointEvent.count({
        where: { 
          type: 'CYBERLAB_SOLVE',
          metadata: { path: ['challengeId'], equals: safeId }
        }
      });

      const recentSolves = await prisma.pointEvent.findMany({
        where: { 
          type: 'CYBERLAB_SOLVE',
          metadata: { path: ['challengeId'], equals: safeId }
        },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return { 
        id: challenge.id,
        title: challenge.title,
        category: challenge.category,
        difficulty: challenge.difficulty,
        points: challenge.points,
        description: challenge.description,
        hints: challenge.hints,
        terminalCommands: challenge.terminalCommands as any,
        solveCount,
        recentSolves: recentSolves.map(s => ({
          email: s.user.email,
          solvedAt: s.createdAt
        }))
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to load challenge' });
    }
  });

  /**
   * POST /api/teacher/cyberlab/challenges
   * Create a new challenge
   */
  server.post('/challenges', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id, title, category, difficulty, points, description, hints, flag, terminalCommands } = request.body as {
        id?: string;
        title?: string;
        category?: string;
        difficulty?: string;
        points?: number;
        description?: string;
        hints?: string[];
        flag?: string;
        terminalCommands?: Array<{
          name: string;
          description: string;
          steps: Array<{ match: string; output: string; revealsFlag: boolean }>;
        }>;
      };

      if (!id || !title || !category || !difficulty || !points || !description || !flag) {
        return reply.status(400).send({ error: 'Missing required fields: id, title, category, difficulty, points, description, flag' });
      }

      if (!Number.isInteger(points) || points < 1 || points > 10000) {
        return reply.status(400).send({ error: 'Points must be an integer between 1 and 10000' });
      }

      const safeId = sanitizeChallengeId(id);
      if (!safeId || safeId !== id) {
        return reply.status(400).send({ error: 'Invalid challenge ID format' });
      }

      const existing = await prisma.cyberChallenge.findUnique({
        where: { id: safeId }
      });

      if (existing) {
        return reply.status(409).send({ error: 'Challenge ID already exists' });
      }

      const saltRounds = 10;
      const flagHash = await bcrypt.hash(flag, saltRounds);

      const challenge = await prisma.cyberChallenge.create({
        data: {
          id: safeId,
          title,
          category,
          difficulty,
          points,
          description,
          hints: hints || [],
          terminalCommands: terminalCommands || [],
          flagHash
        }
      });

      const { flagHash: _, ...publicChallenge } = challenge;
      return { success: true, challenge: publicChallenge };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to create challenge' });
    }
  });

  /**
   * PUT /api/teacher/cyberlab/challenges/:id
   * Update an existing challenge
   */
  server.put('/challenges/:id', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const safeId = sanitizeChallengeId(id);
      
      if (!safeId || safeId !== id) {
        return reply.status(400).send({ error: 'Invalid challenge ID format' });
      }

      const { title, category, difficulty, points, description, hints, flag, terminalCommands } = request.body as {
        title?: string;
        category?: string;
        difficulty?: string;
        points?: number;
        description?: string;
        hints?: string[];
        flag?: string;
        terminalCommands?: Array<{
          name: string;
          description: string;
          steps: Array<{ match: string; output: string; revealsFlag: boolean }>;
        }>;
      };

      const existing = await prisma.cyberChallenge.findUnique({
        where: { id: safeId }
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Challenge not found' });
      }

      if (points !== undefined && (!Number.isInteger(points) || points < 1 || points > 10000)) {
        return reply.status(400).send({ error: 'Points must be an integer between 1 and 10000' });
      }

      const updateData: any = {
        ...(title && { title }),
        ...(category && { category }),
        ...(difficulty && { difficulty }),
        ...(points !== undefined && { points }),
        ...(description && { description }),
        ...(hints && { hints }),
        ...(terminalCommands !== undefined && { terminalCommands })
      };

      if (flag) {
        updateData.flagHash = await bcrypt.hash(flag, 10);
      }

      const challenge = await prisma.cyberChallenge.update({
        where: { id: safeId },
        data: updateData
      });

      const { flagHash: _, ...publicChallenge } = challenge;
      return { success: true, challenge: publicChallenge };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to update challenge' });
    }
  });

  /**
   * DELETE /api/teacher/cyberlab/challenges/:id
   * Delete a challenge
   */
  server.delete('/challenges/:id', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const safeId = sanitizeChallengeId(id);
      
      if (!safeId || safeId !== id) {
        return reply.status(400).send({ error: 'Invalid challenge ID format' });
      }
      
      const existing = await prisma.cyberChallenge.findUnique({
        where: { id: safeId }
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Challenge not found' });
      }

      const solveCount = await prisma.pointEvent.count({
        where: { 
          type: 'CYBERLAB_SOLVE',
          metadata: { path: ['challengeId'], equals: safeId }
        }
      });

      await prisma.cyberChallenge.delete({
        where: { id: safeId }
      });

      return { 
        success: true, 
        message: 'Challenge deleted',
        warning: solveCount > 0 ? `${solveCount} student solve records remain in the database` : null
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete challenge' });
    }
  });

  /**
   * GET /api/teacher/cyberlab/analytics
   * Get overall CyberLab analytics
   */
  server.get('/analytics', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const totalChallenges = await prisma.cyberChallenge.count();
      const totalSolves = await prisma.pointEvent.count({
        where: { type: 'CYBERLAB_SOLVE' }
      });

      const topSolvers = await prisma.pointEvent.groupBy({
        by: ['userId'],
        where: { type: 'CYBERLAB_SOLVE' },
        _sum: { points: true },
        _count: { id: true },
        orderBy: { _sum: { points: 'desc' } },
        take: 10
      });

      const userIds = topSolvers.map(s => s.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true }
      });

      const solverDetails = topSolvers.map(s => ({
        userId: s.userId,
        email: users.find(u => u.id === s.userId)?.email,
        solveCount: s._count.id,
        totalPoints: s._sum.points || 0
      }));

      return {
        totalChallenges,
        totalSolves,
        avgSolvesPerChallenge: totalChallenges > 0 ? (totalSolves / totalChallenges).toFixed(1) : 0,
        topSolvers: solverDetails
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to load analytics' });
    }
  });

  /**
   * GET /api/teacher/cyberlab/solves
   * Get all solves with user details
   */
  server.get('/solves', {
    preHandler: [authMiddleware, requireRole(['TEACHER', 'ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const solves = await prisma.pointEvent.findMany({
        where: { type: 'CYBERLAB_SOLVE' },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      return { 
        solves: solves.map(s => ({
          id: s.id,
          userId: s.userId,
          email: s.user.email,
          challengeId: (s.metadata as { challengeId?: string })?.challengeId,
          points: s.points,
          solvedAt: s.createdAt
        }))
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to load solves' });
    }
  });
};