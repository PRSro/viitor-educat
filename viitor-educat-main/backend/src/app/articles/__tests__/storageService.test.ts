import { describe, it, expect } from 'vitest';
import { validateFilename, detectMimeFromBuffer, validateMimeType } from '../../services/storageService.js';

describe('storageService security', () => {
  describe('validateFilename', () => {
    it('accepts a normal filename', () => {
      expect(validateFilename('document.pdf')).toBe(true);
    });

    it('accepts filename with spaces and dashes', () => {
      expect(validateFilename('my-file 2024.png')).toBe(true);
    });

    it('rejects ../ path traversal', () => {
      expect(validateFilename('../etc/passwd')).toBe(false);
    });

    it('rejects ..\\\ Windows path traversal', () => {
      expect(validateFilename('..\\windows\\system32')).toBe(false);
    });

    it('rejects URL-encoded path traversal %2e%2e%2f', () => {
      expect(validateFilename('%2e%2e%2fpasswd')).toBe(false);
    });

    it('rejects mixed encoding ..%2f', () => {
      expect(validateFilename('..%2fetc')).toBe(false);
    });

    it('rejects null byte %00', () => {
      expect(validateFilename('file%00.txt')).toBe(false);
    });

    it('rejects malformed percent-encoding', () => {
      expect(validateFilename('file%GG.txt')).toBe(false);
    });

    it('rejects filenames with special shell characters', () => {
      expect(validateFilename('file;rm -rf /')).toBe(false);
    });
  });

  describe('detectMimeFromBuffer', () => {
    it('detects image/png from PNG magic bytes', () => {
      const png = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(detectMimeFromBuffer(png)).toBe('image/png');
    });

    it('detects image/jpeg from JPEG magic bytes', () => {
      const jpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      expect(detectMimeFromBuffer(jpeg)).toBe('image/jpeg');
    });

    it('detects application/pdf from PDF magic bytes', () => {
      const pdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]); // %PDF-
      expect(detectMimeFromBuffer(pdf)).toBe('application/pdf');
    });

    it('detects image/gif from GIF magic bytes', () => {
      const gif = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF89a
      expect(detectMimeFromBuffer(gif)).toBe('image/gif');
    });

    it('detects DOCX from ZIP magic bytes', () => {
      const docx = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00]);
      expect(detectMimeFromBuffer(docx)).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('returns null for unknown/random bytes', () => {
      const random = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
      expect(detectMimeFromBuffer(random)).toBeNull();
    });

    it('returns null for empty buffer', () => {
      expect(detectMimeFromBuffer(Buffer.alloc(0))).toBeNull();
    });

    it('returns null for a text file (not in allowed types)', () => {
      const text = Buffer.from('Hello, world!', 'utf-8');
      expect(detectMimeFromBuffer(text)).toBeNull();
    });
  });

  describe('validateMimeType', () => {
    it('accepts all allowed MIME types', () => {
      const allowed = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      for (const mime of allowed) {
        expect(validateMimeType(mime)).toBe(true);
      }
    });

    it('rejects text/plain', () => {
      expect(validateMimeType('text/plain')).toBe(false);
    });

    it('rejects application/javascript', () => {
      expect(validateMimeType('application/javascript')).toBe(false);
    });
  });
});
