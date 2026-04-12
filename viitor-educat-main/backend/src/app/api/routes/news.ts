import { FastifyInstance } from 'fastify';
import { prisma } from '../../models/prisma.js';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';

export async function newsRoutes(server: FastifyInstance) {
  
  /**
   * GET /feed
   * Returns published articles as RSS-like XML
   * Used by the frontend news page
   */
  server.get('/feed', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    try {
      const articles = await prisma.article.findMany({
        where: { 
          status: 'PUBLISHED',
          published: true
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          content: true,
          category: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              email: true,
              teacherProfile: {
                select: { office: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Obscuron HQ News</title>
    <link>https://obscuron.io/news</link>
    <description>Latest news and updates from Obscuron HQ</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://obscuron.io/api/news/feed" rel="self" type="application/rss+xml"/>
    ${articles.map(article => `
    <item>
      <guid isPermaLink="true">https://obscuron.io/news/${article.id}</guid>
      <title><![CDATA[${article.title}]]></title>
      <link>https://obscuron.io/news/${article.id}</link>
      <description><![CDATA[${article.excerpt || article.content.slice(0, 300).replace(/<[^>]+>/g, '') + '...' || 'No description available'}]]></description>
      <pubDate>${new Date(article.createdAt).toUTCString()}</pubDate>
      <category>${article.category}</category>
      ${article.tags.map(tag => `<category>${tag}</category>`).join('\n      ')}
      <author>${article.author.email}</author>
    </item>`).join('')}
  </channel>
</rss>`;

      reply.header('Content-Type', 'application/xml; charset=utf-8');
      reply.header('Cache-Control', 'public, max-age=300');
      return reply.send(xml);
    } catch (error) {
      server.log.error(error, 'Failed to fetch news feed');
      return reply.status(502).send({ error: 'Failed to fetch news feed' });
    }
  });

  /**
   * GET /latest
   * Returns latest 10 published articles as JSON
   */
  server.get('/latest', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    try {
      const articles = await prisma.article.findMany({
        where: { 
          status: 'PUBLISHED',
          published: true
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          category: true,
          tags: true,
          createdAt: true,
          author: {
            select: {
              email: true,
              teacherProfile: {
                select: { office: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return { articles, count: articles.length };
    } catch (error) {
      server.log.error(error, 'Failed to fetch latest news');
      throw error;
    }
  });
}
