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

export const teacherCyberlabRoutes = async (server: FastifyInstance) => {

  const requireTeacher = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as { user?: { role?: string } }).user;
    if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Teacher or Admin access required' });
    }
  };

  /**
   * GET /api/teacher/cyberlab/challenges
   * Get all challenges with submission stats
   */
  server.get('/challenges', {
    preHandler: [authMiddleware, requireTeacher]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const files = fs.existsSync(CHALLENGES_DIR) ? fs.readdirSync(CHALLENGES_DIR).filter(f => f.endsWith('.json')) : [];
      const challenges = [];

      for (const file of files) {
        const filePath = path.join(CHALLENGES_DIR, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        const { flagHash, ...publicData } = parsed;

        const solveCount = await prisma.pointEvent.count({
          where: { 
            type: 'CYBERLAB_SOLVE',
            metadata: { path: ['challengeId'], equals: parsed.id }
          }
        });

        challenges.push({
          ...publicData,
          solveCount,
          flagHash: undefined
        });
      }

      return { challenges };
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
    preHandler: [authMiddleware, requireTeacher]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const filepath = path.join(CHALLENGES_DIR, `${id}.json`);
      
      if (!fs.existsSync(filepath)) {
        return reply.status(404).send({ error: 'Challenge not found' });
      }

      const fileData = fs.readFileSync(filepath, 'utf8');
      const data = JSON.parse(fileData);
      
      const solveCount = await prisma.pointEvent.count({
        where: { 
          type: 'CYBERLAB_SOLVE',
          metadata: { path: ['challengeId'], equals: id }
        }
      });

      const recentSolves = await prisma.pointEvent.findMany({
        where: { 
          type: 'CYBERLAB_SOLVE',
          metadata: { path: ['challengeId'], equals: id }
        },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return { 
        ...data,
        flagHash: undefined,
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
    preHandler: [authMiddleware, requireTeacher]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id, title, category, difficulty, points, description, hints, flag } = request.body as {
        id?: string;
        title?: string;
        category?: string;
        difficulty?: string;
        points?: number;
        description?: string;
        hints?: string[];
        flag?: string;
      };

      if (!id || !title || !category || !difficulty || !points || !description || !flag) {
        return reply.status(400).send({ error: 'Missing required fields: id, title, category, difficulty, points, description, flag' });
      }

      const filepath = path.join(CHALLENGES_DIR, `${id}.json`);
      
      if (fs.existsSync(filepath)) {
        return reply.status(409).send({ error: 'Challenge ID already exists' });
      }

      const saltRounds = 10;
      const flagHash = await bcrypt.hash(flag, saltRounds);

      const challenge = {
        id,
        title,
        category,
        difficulty,
        points,
        description,
        hints: hints || [],
        flagHash,
        createdAt: new Date().toISOString()
      };

      fs.writeFileSync(filepath, JSON.stringify(challenge, null, 2));

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
    preHandler: [authMiddleware, requireTeacher]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { title, category, difficulty, points, description, hints, flag } = request.body as {
        title?: string;
        category?: string;
        difficulty?: string;
        points?: number;
        description?: string;
        hints?: string[];
        flag?: string;
      };

      const filepath = path.join(CHALLENGES_DIR, `${id}.json`);
      
      if (!fs.existsSync(filepath)) {
        return reply.status(404).send({ error: 'Challenge not found' });
      }

      const existingData = fs.readFileSync(filepath, 'utf8');
      const existing = JSON.parse(existingData);

      const updated = {
        ...existing,
        ...(title && { title }),
        ...(category && { category }),
        ...(difficulty && { difficulty }),
        ...(points !== undefined && { points }),
        ...(description && { description }),
        ...(hints && { hints }),
        ...(flag && { flagHash: await bcrypt.hash(flag, 10) }),
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(filepath, JSON.stringify(updated, null, 2));

      const { flagHash: _, ...publicChallenge } = updated;
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
    preHandler: [authMiddleware, requireTeacher]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const filepath = path.join(CHALLENGES_DIR, `${id}.json`);
      
      if (!fs.existsSync(filepath)) {
        return reply.status(404).send({ error: 'Challenge not found' });
      }

      fs.unlinkSync(filepath);

      return { success: true, message: 'Challenge deleted' };
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
    preHandler: [authMiddleware, requireTeacher]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const files = fs.existsSync(CHALLENGES_DIR) ? fs.readdirSync(CHALLENGES_DIR).filter(f => f.endsWith('.json')) : [];
      
      const totalChallenges = files.length;
      const totalSolves = await prisma.pointEvent.count({
        where: { type: 'CYBERLAB_SOLVE' }
      });

      const topSolvers = await prisma.pointEvent.groupBy({
        by: ['userId'],
        where: { type: 'CYBERLAB_SOLVE' },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      });

      const solverDetails = await Promise.all(
        topSolvers.map(async (solver) => {
          const user = await prisma.user.findUnique({
            where: { id: solver.userId },
            select: { email: true }
          });
          const totalPoints = await prisma.pointEvent.aggregate({
            where: { userId: solver.userId, type: 'CYBERLAB_SOLVE' },
            _sum: { points: true }
          });
          return {
            userId: solver.userId,
            email: user?.email,
            solveCount: solver._count,
            totalPoints: totalPoints._sum.points || 0
          };
        })
      );

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
    preHandler: [authMiddleware, requireTeacher]
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
