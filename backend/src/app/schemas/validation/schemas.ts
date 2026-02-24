/**
 * Validation Schemas
 * 
 * Centralized validation using Zod for all input validation.
 * These schemas ensure proper data validation and sanitization.
 */

import { z } from 'zod';

// ============================================
// Auth Schemas
// ============================================

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must be less than 128 characters' }),
  role: z
    .enum(['STUDENT', 'TEACHER'], {
      errorMap: () => ({ message: 'Role must be STUDENT or TEACHER' })
    })
    .optional()
    .default('STUDENT'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .max(128, { message: 'Password must be less than 128 characters' }),
});

// ============================================
// Lesson Schemas
// ============================================

export const createLessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(200, { message: 'Title must be less than 200 characters' }),
  description: z
    .string()
    .trim()
    .max(500, { message: 'Description must be less than 500 characters' })
    .optional(),
  content: z
    .string()
    .trim()
    .min(1, { message: 'Content is required' })
    .max(50000, { message: 'Content must be less than 50000 characters' }),
  courseId: z
    .string()
    .uuid({ message: 'Invalid course ID format' })
    .min(1, { message: 'Course ID is required' }),
  order: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
});

export const updateLessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(200, { message: 'Title must be less than 200 characters' })
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, { message: 'Description must be less than 500 characters' })
    .optional(),
  content: z
    .string()
    .trim()
    .min(1, { message: 'Content cannot be empty' })
    .max(50000, { message: 'Content must be less than 50000 characters' })
    .optional(),
  courseId: z
    .string()
    .uuid({ message: 'Invalid course ID format' })
    .optional(),
  order: z
    .number()
    .int()
    .min(0)
    .optional(),
  status: z.string().optional(),
});

export const lessonIdSchema = z.object({
  id: z.string().uuid({ message: 'Invalid lesson ID format' }),
});

// ============================================
// Challenge Schemas (for future implementation)
// ============================================

export const challengeDifficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT'], {
  errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, HARD, or EXPERT' })
});

export const challengeVisibilityEnum = z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED'], {
  errorMap: () => ({ message: 'Visibility must be PUBLIC, PRIVATE, or UNLISTED' })
});

const dockerConfigSchema = z.object({
  image: z
    .string()
    .min(1, { message: 'Docker image is required' })
    .max(500, { message: 'Docker image must be less than 500 characters' })
    .regex(new RegExp('^[a-z0-9/.:-]+$', 'i'), { message: 'Invalid Docker image format' }),
  tag: z
    .string()
    .max(100, { message: 'Docker tag must be less than 100 characters' })
    .default('latest'),
  port: z
    .number()
    .int()
    .min(1)
    .max(65535)
    .optional(),
  environment: z.record(z.string()).optional(),
  memoryLimit: z
    .string()
    .regex(/^\d+[kmg]$/i, { message: 'Memory limit must be in format: 512m, 1g, etc.' })
    .optional(),
  cpuLimit: z
    .number()
    .min(0.1)
    .max(8)
    .optional(),
  timeout: z
    .number()
    .int()
    .min(10)
    .max(3600)
    .default(300),
});

export const createChallengeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(200, { message: 'Title must be less than 200 characters' }),
  description: z
    .string()
    .trim()
    .max(2000, { message: 'Description must be less than 2000 characters' })
    .optional(),
  difficulty: challengeDifficultyEnum,
  visibility: challengeVisibilityEnum.default('PRIVATE'),
  content: z
    .string()
    .trim()
    .min(1, { message: 'Content is required' })
    .max(50000, { message: 'Content must be less than 50000 characters' }),
  dockerConfig: dockerConfigSchema.optional(),
  points: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .default(100),
  timeLimit: z
    .number()
    .int()
    .min(0)
    .max(3600)
    .optional(),
  tags: z.array(z.string()).optional(),
  courseId: z
    .string()
    .uuid({ message: 'Invalid course ID format' })
    .optional(),
});

export const updateChallengeSchema = createChallengeSchema.partial().extend({
  visibility: challengeVisibilityEnum.optional(),
  difficulty: challengeDifficultyEnum.optional(),
});

// ============================================
// Helper function for validation errors
// ============================================

export function formatZodError(error: z.ZodError): string {
  return error.errors.map(e => e.message).join(', ');
}

// Type exports for use in routes
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
export type DockerConfigInput = z.infer<typeof dockerConfigSchema>;
