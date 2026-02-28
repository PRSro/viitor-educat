import { FastifyInstance } from 'fastify';

export async function newsRoutes(server: FastifyInstance) {
  server.get('/feed', async (request, reply) => {
    try {
      const response = await fetch('http://portal.lbi.ro/category/stiri/feed/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ViitorEducat/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        return reply.status(502).send({ error: 'Feed unavailable', status: response.status });
      }

      const text = await response.text();
      reply.header('Content-Type', 'application/xml; charset=utf-8');
      reply.header('Cache-Control', 'public, max-age=300');
      return reply.send(text);
    } catch (error) {
      server.log.error(error, 'Failed to fetch news feed');
      return reply.status(502).send({ error: 'Failed to fetch news feed' });
    }
  });
}
