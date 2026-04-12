/**
 * Frontend Validation Schemas
 * 
 * Mirrors backend validation for consistent user experience.
 * These are enforced client-side for UX, but security is enforced server-side.
 */

import { z } from 'zod';

// ============================================
// Auth Validation
// ============================================

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email este obligatoriu')
  .email('Adresă de email invalidă')
  .max(255, 'Email prea lung');

export const passwordSchema = z
  .string()
  .min(8, 'Parola trebuie să aibă cel puțin 8 caractere')
  .max(128, 'Parola este prea lungă')
  .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
  .regex(/[a-z]/, 'Parola trebuie să conțină cel puțin o literă mică')
  .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Parola este obligatorie'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['STUDENT', 'TEACHER'], {
    errorMap: () => ({ message: 'Selectează un rol' }),
  }),
});

// ============================================
// Lesson Validation
// ============================================

export const lessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Titlul este obligatoriu')
    .max(200, 'Titlul este prea lung (max 200 caractere)'),
  description: z
    .string()
    .trim()
    .max(500, 'Descrierea este prea lungă (max 500 caractere)')
    .optional(),
  content: z
    .string()
    .trim()
    .min(1, 'Conținutul este obligatoriu')
    .max(50000, 'Conținutul este prea lung'),
});

// ============================================
// Validation Helper Functions
// ============================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(e => e.message),
  };
}

/**
 * Get first validation error message
 */
export function getFirstError<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): string | null {
  const parsed = schema.safeParse(data);
  if (parsed.success) return null;
  return parsed.error.errors[0]?.message || 'Validation failed';
}
