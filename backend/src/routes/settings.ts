import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, JwtPayload } from '../middleware/authMiddleware.js';
import { z } from 'zod';
import { formatZodError } from '../validation/schemas.js';

const prisma = new PrismaClient();

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

// Default settings for new users
const defaultSettings = {
  theme: 'system',
  language: 'en',
  defaultDashboardView: 'courses',
  contentPriority: 'courses',
  showArticles: true,
  showFlashcards: true,
  showResources: true,
  preferredCategories: [],
  preferredTeachers: [],
  studyReminderEnabled: false,
  studyReminderTime: null,
  emailNotifications: true,
  courseUpdates: true,
  newArticles: true,
  newResources: true,
  flashcardReminders: false,
  showProfile: true,
  showProgress: true,
  allowAnalytics: true,
  hiddenCategories: [],
  hiddenTags: [],
  teacherToolsExpanded: false,
  defaultResourceType: 'LINK',
};

const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().max(10).optional(),
  defaultDashboardView: z.enum(['courses', 'articles', 'resources', 'flashcards']).optional(),
  contentPriority: z.enum(['courses', 'teacher_profiles']).optional(),
  showArticles: z.boolean().optional(),
  showFlashcards: z.boolean().optional(),
  showResources: z.boolean().optional(),
  preferredCategories: z.array(z.string()).optional(),
  preferredTeachers: z.array(z.string()).optional(),
  studyReminderEnabled: z.boolean().optional(),
  studyReminderTime: z.string().optional().nullable(),
  emailNotifications: z.boolean().optional(),
  courseUpdates: z.boolean().optional(),
  newArticles: z.boolean().optional(),
  newResources: z.boolean().optional(),
  flashcardReminders: z.boolean().optional(),
  showProfile: z.boolean().optional(),
  showProgress: z.boolean().optional(),
  allowAnalytics: z.boolean().optional(),
  hiddenCategories: z.array(z.string()).optional(),
  hiddenTags: z.array(z.string()).optional(),
  teacherToolsExpanded: z.boolean().optional(),
  defaultResourceType: z.enum(['YOUTUBE', 'LINK', 'PDF', 'DOCUMENT']).optional(),
});

/**
 * Settings Routes
 * 
 * Permissions:
 * - GET /settings - Get current user's settings (authenticated)
 * - PUT /settings - Update current user's settings (authenticated)
 * - POST /settings/reset - Reset settings to defaults (authenticated)
 */

export async function settingsRoutes(server: FastifyInstance) {
  
  /**
   * GET /settings
   * Get current user's settings (creates default if not exists)
   */
  server.get('/', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getCurrentUser(request).id;
      
      let settings = await prisma.userSettings.findUnique({
        where: { userId }
      });
      
      // Create default settings if not exists
      if (!settings) {
        settings = await prisma.userSettings.create({
          data: {
            userId,
            ...defaultSettings
          }
        });
      }
      
      return { settings };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch settings'
      });
    }
  });

  /**
   * PUT /settings
   * Update current user's settings
   */
  server.put('/', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getCurrentUser(request).id;
      const validated = updateSettingsSchema.parse(request.body);
      
      // Get existing settings or create default
      let existing = await prisma.userSettings.findUnique({
        where: { userId }
      });
      
      if (!existing) {
        existing = await prisma.userSettings.create({
          data: {
            userId,
            ...defaultSettings
          }
        });
      }
      
      const settings = await prisma.userSettings.update({
        where: { userId },
        data: validated
      });
      
      return { 
        message: 'Settings updated successfully',
        settings 
      };
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
        message: 'Failed to update settings'
      });
    }
  });

  /**
   * POST /settings/reset
   * Reset settings to defaults
   */
  server.post('/reset', {
    preHandler: [authMiddleware]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getCurrentUser(request).id;
      
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: defaultSettings,
        create: {
          userId,
          ...defaultSettings
        }
      });
      
      return { 
        message: 'Settings reset to defaults',
        settings 
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to reset settings'
      });
    }
  });

  /**
   * GET /settings/categories
   * Get available categories for preferences
   */
  server.get('/categories', {
    preHandler: [authMiddleware]
  }, async () => {
    const { PrismaClient } = await import('@prisma/client');
    return { 
      categories: ['MATH', 'SCIENCE', 'LITERATURE', 'HISTORY', 'COMPUTER_SCIENCE', 'ARTS', 'LANGUAGES', 'GENERAL']
    };
  });
}
