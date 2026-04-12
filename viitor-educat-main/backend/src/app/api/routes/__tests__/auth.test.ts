import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../../schemas/validation/schemas.js';

// Tests target backend schemas directly — no HTTP layer involved.
// Note: backend registerSchema enforces email format and min-length 8,
// but does NOT enforce uppercase/digit (that's a frontend-only rule).
describe('Backend auth schemas', () => {
  describe('registerSchema', () => {
    it('accepts valid STUDENT registration', () => {
      const r = registerSchema.safeParse({ email: 'test@vianu.ro', password: 'Parola123', role: 'STUDENT' });
      expect(r.success).toBe(true);
    });

    it('accepts valid TEACHER registration', () => {
      const r = registerSchema.safeParse({ email: 'prof@vianu.ro', password: 'Parola123', role: 'TEACHER' });
      expect(r.success).toBe(true);
    });

    it('defaults role to STUDENT when omitted', () => {
      const r = registerSchema.safeParse({ email: 'test@vianu.ro', password: 'ValidPass1' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.role).toBe('STUDENT');
    });

    it('rejects ADMIN self-registration', () => {
      const r = registerSchema.safeParse({ email: 'admin@vianu.ro', password: 'Parola123', role: 'ADMIN' });
      expect(r.success).toBe(false);
    });

    it('rejects password shorter than 8 characters', () => {
      const r = registerSchema.safeParse({ email: 'test@x.com', password: 'Abc1', role: 'STUDENT' });
      expect(r.success).toBe(false);
    });

    it('rejects SQL injection in email (invalid format)', () => {
      const r = registerSchema.safeParse({ email: "' OR 1=1 --", password: 'Parola123', role: 'STUDENT' });
      expect(r.success).toBe(false);
    });

    it('rejects XSS payload in email (invalid format)', () => {
      const r = registerSchema.safeParse({ email: '<script>alert(1)</script>@x.com', password: 'Parola123', role: 'STUDENT' });
      expect(r.success).toBe(false);
    });

    it('rejects empty email', () => {
      const r = registerSchema.safeParse({ email: '', password: 'Parola123', role: 'STUDENT' });
      expect(r.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login', () => {
      const r = loginSchema.safeParse({ email: 'test@x.com', password: 'anything' });
      expect(r.success).toBe(true);
    });

    it('rejects empty email', () => {
      const r = loginSchema.safeParse({ email: '', password: 'pass' });
      expect(r.success).toBe(false);
    });

    it('rejects missing password', () => {
      const r = loginSchema.safeParse({ email: 'test@x.com', password: '' });
      expect(r.success).toBe(false);
    });

    it('rejects invalid email format', () => {
      const r = loginSchema.safeParse({ email: 'not-an-email', password: 'pass' });
      expect(r.success).toBe(false);
    });
  });
});
