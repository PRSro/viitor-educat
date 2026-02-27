import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, JwtPayload } from '../../core/middleware/authMiddleware.js';
import { requireRole } from '../../core/middleware/permissionMiddleware.js';
import { 
  getComments, 
  addComment, 
  editComment, 
  deleteComment 
} from '../../services/commentService.js';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

export async function commentRoutes(server: FastifyInstance) {

  /**
   * GET /lessons/:lessonId/comments
   * Get paginated comments for a lesson with one level of replies
   */
  server.get('/lessons/:lessonId/comments', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    try {
      const lessonId = (request.params as any).lessonId;
      const page = parseInt((request.query as any).page || '1');
      const limit = Math.min(parseInt((request.query as any).limit || '20'), 50);

      const result = await getComments(lessonId, page, limit);
      return result;
    } catch (error) {
      server.log.error(error, 'Error fetching comments');
      throw error;
    }
  });

  /**
   * POST /lessons/:lessonId/comments
   * Post a comment or reply to a lesson
   */
  server.post('/lessons/:lessonId/comments', {
    preHandler: [authMiddleware, requireRole(['STUDENT', 'TEACHER', 'ADMIN'])]
  }, async (request, reply) => {
    try {
      const user = getCurrentUser(request);
      const lessonId = (request.params as any).lessonId;
      const { content, parentId } = (request.body as any) || {};

      if (!content || typeof content !== 'string') {
        return reply.status(400).send({ error: 'Comment content is required' });
      }

      const comment = await addComment(lessonId, user.id, content, parentId);
      return reply.status(201).send({ comment });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create comment';
      if (message.includes('Rate limit')) {
        return reply.status(429).send({ error: message });
      }
      if (message.includes('not found') || message.includes('Invalid') || message.includes('nested') || message.includes('empty') || message.includes('exceed')) {
        return reply.status(400).send({ error: message });
      }
      server.log.error(error, 'Error creating comment');
      throw error;
    }
  });

  /**
   * PATCH /comments/:commentId
   * Edit own comment within 15-minute window
   */
  server.patch('/comments/:commentId', {
    preHandler: [authMiddleware, requireRole(['STUDENT', 'TEACHER', 'ADMIN'])]
  }, async (request, reply) => {
    try {
      const user = getCurrentUser(request);
      const commentId = (request.params as any).commentId;
      const { content } = (request.body as any) || {};

      if (!content || typeof content !== 'string') {
        return reply.status(400).send({ error: 'Comment content is required' });
      }

      const comment = await editComment(commentId, user.id, content);
      return { comment };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to edit comment';
      if (message.includes('only edit') || message.includes('expired') || message.includes('not found') || message.includes('empty') || message.includes('exceed')) {
        return reply.status(400).send({ error: message });
      }
      server.log.error(error, 'Error editing comment');
      throw error;
    }
  });

  /**
   * DELETE /comments/:commentId
   * Soft-delete own comment or admin hard-delete
   */
  server.delete('/comments/:commentId', {
    preHandler: [authMiddleware, requireRole(['STUDENT', 'TEACHER', 'ADMIN'])]
  }, async (request, reply) => {
    try {
      const user = getCurrentUser(request);
      const commentId = (request.params as any).commentId;

      const result = await deleteComment(commentId, user.id, user.role);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete comment';
      if (message.includes('only delete') || message.includes('not found')) {
        return reply.status(403).send({ error: message });
      }
      server.log.error(error, 'Error deleting comment');
      throw error;
    }
  });
}
