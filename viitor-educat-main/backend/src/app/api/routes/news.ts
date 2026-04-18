import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';

const GLOBAL_LAUNCH_ARTICLE = {
  id: 'global-launch',
  title: 'Global Launch',
  excerpt: 'Obscuron Cyber Educational is now live worldwide. Start your learning journey today!',
  category: 'ANNOUNCEMENT',
  tags: ['launch', 'announcement'],
  createdAt: new Date().toISOString()
};

export async function newsRoutes(server: FastifyInstance) {
  
  /**
   * GET /feed
   * Returns RSS-like XML with global launch announcement
   */
  server.get('/feed', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const article = GLOBAL_LAUNCH_ARTICLE;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Obscuron HQ News</title>
    <link>https://obscuron.io/news</link>
    <description>Latest news and updates from Obscuron HQ</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://obscuron.io/api/news/feed" rel="self" type="application/rss+xml"/>
    <item>
      <guid isPermaLink="true">https://obscuron.io/news/${article.id}</guid>
      <title><![CDATA[${article.title}]]></title>
      <link>https://obscuron.io/news/${article.id}</link>
      <description><![CDATA[${article.excerpt}]]></description>
      <pubDate>${new Date(article.createdAt).toUTCString()}</pubDate>
      <category>${article.category}</category>
      <author>admin@obscuron.io</author>
    </item>
  </channel>
</rss>`;

    reply.header('Content-Type', 'application/xml; charset=utf-8');
    reply.header('Cache-Control', 'public, max-age=300');
    return reply.send(xml);
  });

  /**
   * GET /latest
   * Returns global launch article as JSON
   */
  server.get('/latest', {
    preHandler: [authMiddleware]
  }, async () => {
    return { articles: [GLOBAL_LAUNCH_ARTICLE], count: 1 };
  });
}
