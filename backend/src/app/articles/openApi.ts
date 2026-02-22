/**
 * File Articles API - OpenAPI Documentation
 * 
 * Base URL: /file-articles
 * 
 * ## Overview
 * This API provides CRUD operations for file-based articles with versioning,
 * audit trails, and role-based access control.
 * 
 * ## Authentication
 * All endpoints require JWT authentication via Authorization header:
 * ```
 * Authorization: Bearer <token>
 * ```
 * 
 * ## Role-Based Access
 * | Role    | Permissions |
 * |---------|-------------|
 * | STUDENT | Read published articles |
 * | TEACHER | CRUD own articles |
 * | ADMIN   | Full CRUD access |
 * 
 * ## Rate Limiting
 * - Read endpoints: 100 requests/minute
 * - Write endpoints: 10 requests/minute
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     FileArticle:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "article_1700000000000"
 *         title:
 *           type: string
 *           example: "Introduction to React"
 *         slug:
 *           type: string
 *           example: "introduction-to-react-abc123"
 *         content:
 *           type: string
 *           example: "<h1>React Basics</h1><p>React is a JavaScript library...</p>"
 *         excerpt:
 *           type: string
 *           example: "Learn the fundamentals of React"
 *         category:
 *           type: string
 *           enum: [MATH, SCIENCE, LITERATURE, HISTORY, COMPUTER_SCIENCE, ARTS, LANGUAGES, GENERAL]
 *           example: "COMPUTER_SCIENCE"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["react", "javascript", "frontend"]
 *         authorId:
 *           type: string
 *           example: "user_abc123"
 *         published:
 *           type: boolean
 *           example: true
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           example: "published"
 *         paths:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               path:
 *                 type: string
 *               type:
 *                 type: string
 *               text:
 *                 type: string
 *         metadata:
 *           type: object
 *           properties:
 *             wordCount:
 *               type: number
 *             readingTime:
 *               type: number
 *             version:
 *               type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     ArticleVersion:
 *       type: object
 *       properties:
 *         version:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         content:
 *           type: string
 *         title:
 *           type: string
 * 
 *     AuditEntry:
 *       type: object
 *       properties:
 *         timestamp:
 *           type: string
 *           format: date-time
 *         action:
 *           type: string
 *         userId:
 *           type: string
 *         changes:
 *           type: object
 * 
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *         errorCode:
 *           type: string
 *         message:
 *           type: string
 * 
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FileArticle'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *             total:
 *               type: number
 *             totalPages:
 *               type: number
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         errorCode:
 *           type: string
 *         message:
 *           type: string
 */

export const openApiDocs = {
  openapi: '3.0.0',
  info: {
    title: 'File Articles API',
    version: '1.0.0',
    description: 'REST API for managing file-based articles with versioning and audit trails'
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    }
  ],
  paths: {
    '/file-articles': {
      get: {
        summary: 'List all articles',
        description: 'Returns a paginated list of articles. Students only see published articles.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'authorId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { enum: ['draft', 'published', 'archived'] } }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedResponse' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new article',
        description: 'Create a new file-based article. Requires TEACHER or ADMIN role.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content', 'authorId'],
                properties: {
                  title: { type: 'string', maxLength: 300 },
                  content: { type: 'string' },
                  excerpt: { type: 'string', maxLength: 500 },
                  category: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  sourceUrl: { type: 'string', format: 'uri' },
                  published: { type: 'boolean' }
                }
              },
              example: {
                title: 'Introduction to React',
                content: '<h1>React Basics</h1><p>React is a JavaScript library for building user interfaces.</p>',
                excerpt: 'Learn the fundamentals of React',
                category: 'COMPUTER_SCIENCE',
                tags: ['react', 'javascript'],
                published: true
              }
            }
          }
        },
        responses: {
          '201': { description: 'Article created' },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden - insufficient permissions' }
        }
      }
    },
    '/file-articles/{slug}': {
      get: {
        summary: 'Get article by slug',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Successful response' },
          '404': { description: 'Article not found' }
        }
      },
      put: {
        summary: 'Update article',
        description: 'Update an existing article. Only the author or ADMIN can update.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Article updated' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' }
        }
      },
      delete: {
        summary: 'Delete article',
        description: 'Delete an article. Only the author or ADMIN can delete.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Article deleted' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' }
        }
      }
    },
    '/file-articles/{slug}/history': {
      get: {
        summary: 'Get article version history',
        description: 'Get all versions of an article. Requires TEACHER or ADMIN role.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Version history' },
          '403': { description: 'Forbidden' }
        }
      }
    },
    '/file-articles/{slug}/restore/{version}': {
      post: {
        summary: 'Restore article to version',
        description: 'Restore an article to a previous version.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'version', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Article restored' },
          '404': { description: 'Version not found' }
        }
      }
    },
    '/file-articles/{slug}/audit': {
      get: {
        summary: 'Get article audit log',
        description: 'Get audit trail for an article.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Audit log' }
        }
      }
    }
  }
};

export default openApiDocs;
