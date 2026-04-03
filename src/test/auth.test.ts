import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '@/lib/validation';

// Test the exact data shapes the register and login forms submit.
// Note: frontend validation enforces uppercase + digit requirements;
// backend only enforces min-length (tested separately in backend/src/.../auth.test.ts).
describe('Auth form validation — matches backend schema', () => {
  describe('registerSchema', () => {
    it('accepts STUDENT with valid email and password', () => {
      const r = registerSchema.safeParse({ email: 'elev@vianu.ro', password: 'Parola123', role: 'STUDENT' });
      expect(r.success).toBe(true);
    });

    it('accepts TEACHER with valid email and password', () => {
      const r = registerSchema.safeParse({ email: 'prof@vianu.ro', password: 'Parola123', role: 'TEACHER' });
      expect(r.success).toBe(true);
    });

    it('rejects ADMIN role (cannot self-register)', () => {
      const r = registerSchema.safeParse({ email: 'x@x.com', password: 'Parola123', role: 'ADMIN' });
      expect(r.success).toBe(false);
    });

    it('rejects password without uppercase', () => {
      const r = registerSchema.safeParse({ email: 'x@x.com', password: 'parola123', role: 'STUDENT' });
      expect(r.success).toBe(false);
    });

    it('rejects password without digit', () => {
      const r = registerSchema.safeParse({ email: 'x@x.com', password: 'ParolaFaraDigit', role: 'STUDENT' });
      expect(r.success).toBe(false);
    });

    it('rejects invalid email format', () => {
      const r = registerSchema.safeParse({ email: 'not-an-email', password: 'Parola123', role: 'STUDENT' });
      expect(r.success).toBe(false);
    });

    it('rejects empty email', () => {
      const r = registerSchema.safeParse({ email: '', password: 'Parola123', role: 'STUDENT' });
      expect(r.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid credentials shape', () => {
      const r = loginSchema.safeParse({ email: 'prof@vianu.ro', password: 'orice' });
      expect(r.success).toBe(true);
    });

    it('rejects empty password', () => {
      const r = loginSchema.safeParse({ email: 'x@x.com', password: '' });
      expect(r.success).toBe(false);
    });

    it('rejects empty email', () => {
      const r = loginSchema.safeParse({ email: '', password: 'password' });
      expect(r.success).toBe(false);
    });

    it('rejects invalid email format', () => {
      const r = loginSchema.safeParse({ email: 'bad', password: 'password' });
      expect(r.success).toBe(false);
    });
  });
});
