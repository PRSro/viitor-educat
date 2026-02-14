/**
 * Student Profile Routes
 * Placeholder for student profile functionality
 */

import { FastifyInstance } from 'fastify';

export async function profileRoutes(fastify: FastifyInstance) {
  // Placeholder - profile functionality not yet implemented
  fastify.get('/', async () => {
    return { message: 'Profile routes placeholder' };
  });
}
