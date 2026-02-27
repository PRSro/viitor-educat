import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../../schemas/validation/schemas.js';
import { 
  getAllTracks, 
  getTrackById, 
  getUserPreference, 
  upsertUserPreference,
  isValidFrequency,
  seedTracks
} from '../../services/musicService.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

const updatePreferenceSchema = z.object({
  trackId: z.string().optional().nullable(),
  volume: z.number().min(0).max(1).optional(),
});

export async function musicRoutes(server: FastifyInstance) {
  
  server.get('/tracks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await seedTracks();
      const tracks = await getAllTracks();
      return { tracks };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch tracks'
      });
    }
  });

  server.get('/tracks/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const track = await getTrackById(id);
      
      if (!track) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Track not found'
        });
      }
      
      return { track };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch track'
      });
    }
  });

  server.get('/preferences', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getCurrentUser(request).id;
      const preference = await getUserPreference(userId);
      return { preference };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch preference'
      });
    }
  });

  server.patch('/preferences', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getCurrentUser(request).id;
      const body = updatePreferenceSchema.parse(request.body);
      
      if (body.trackId) {
        const track = await getTrackById(body.trackId);
        if (!track) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid trackId: track not found'
          });
        }
        if (!isValidFrequency(track.frequencyHz)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid frequencyHz: not a recognized Solfeggio frequency'
          });
        }
      }
      
      const preference = await upsertUserPreference(
        userId, 
        body.trackId ?? null, 
        body.volume ?? 0.5
      );
      
      return { preference };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      server.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update preference'
      });
    }
  });
}
