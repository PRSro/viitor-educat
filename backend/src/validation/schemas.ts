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
});

export const lessonIdSchema = z.object({
  id: z.string().uuid({ message: 'Invalid lesson ID format' }),
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
