import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { anyRole } from '../../core/middleware/permissionMiddleware.js';
import { getLeaderboard, getUserRank, getCyberLeaderboard } from '../../services/pointsService.js';

function getCurrentUser(r: FastifyRequest): JwtPayload { return (r as any).user; }

export async function leaderboardRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: [authMiddleware, anyRole] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { scope = 'total' } = request.query as { scope?: string };
      
      if (scope === 'cyberlab') {
        const leaderboard = await getCyberLeaderboard(25);
        return reply.send({ leaderboard, scope: 'cyberlab' });
      }

      const valid = ['total', 'weekly', 'monthly'].includes(scope)
        ? scope as 'total' | 'weekly' | 'monthly' : 'total';
      const leaderboard = await getLeaderboard(valid, 25);
      return reply.send({ leaderboard, scope: valid });
    }
  );

  server.get('/me', { preHandler: [authMiddleware, anyRole] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getCurrentUser(request);
      const { scope = 'total' } = request.query as { scope?: string };
      const valid = ['total', 'weekly', 'monthly'].includes(scope)
        ? scope as 'total' | 'weekly' | 'monthly' : 'total';
      const rank = await getUserRank(user.id, valid);
      return reply.send(rank);
    }
  );
}
