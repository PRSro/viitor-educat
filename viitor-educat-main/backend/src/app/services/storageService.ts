/**
 * Storage Service
 * Handles file storage with configurable backends
 */

import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join, extname } from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export interface SaveResult {
  success: boolean;
  filepath?: string;
  url?: string;
  filename?: string;
  error?: string;
}

export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export function validateFilename(filename: string): boolean {
  // Decode URL encoding first — catches %2e%2e%2f, ..%2f, etc.
  let decoded = filename;
  try {
    decoded = decodeURIComponent(filename);
  } catch {
    // Malformed percent-encoding is also invalid
    return false;
  }

  const forbiddenPatterns = ['../', '..\\', '~', '\0', '%00', '\x00'];
  if (forbiddenPatterns.some(p => decoded.includes(p))) return false;

  // Only allow safe characters: alphanumeric, dots, dashes, underscores, spaces
  const safeFilenameRegex = /^[a-zA-Z0-9._\- ]+$/;
  return safeFilenameRegex.test(decoded);
}

// Magic byte signatures for allowed MIME types
const MAGIC_BYTES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: 'image/jpeg',  bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',   bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif',   bytes: [0x47, 0x49, 0x46] },
  { mime: 'image/webp',  bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  // DOCX (and XLSX/PPTX) are ZIP-based — PK header
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', bytes: [0x50, 0x4B, 0x03, 0x04] },
  // Legacy DOC — Compound Document
  { mime: 'application/msword', bytes: [0xD0, 0xCF, 0x11, 0xE0] },
];

/**
 * Detect MIME type from actual file bytes, not from the client-supplied header.
 * Returns null if the buffer doesn't match any known safe type.
 */
export function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const sig of MAGIC_BYTES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;
    const matches = sig.bytes.every((b, i) => buffer[offset + i] === b);
    if (matches) return sig.mime;
  }
  return null;
}

export function getFileExtension(filename: string): string {
  return extname(filename).toLowerCase().slice(1);
}

export function generateStoredFilename(originalFilename: string): string {
  const ext = getFileExtension(originalFilename) || 'bin';
  return `${randomUUID()}.${ext}`;
}

export async function saveFile(buffer: Buffer, originalFilename: string): Promise<SaveResult> {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    if (!validateFilename(originalFilename)) {
      return { success: false, error: 'Invalid filename: path traversal detected' };
    }

    if (buffer.byteLength > MAX_FILE_SIZE) {
      return { success: false, error: `File too large: max ${MAX_FILE_SIZE / 1024 / 1024}MB allowed` };
    }

    const storedFilename = generateStoredFilename(originalFilename);
    const filepath = join(UPLOAD_DIR, storedFilename);
    
    writeFileSync(filepath, buffer);
    
    const url = `/api/upload/files/${storedFilename}`;
    
    return {
      success: true,
      filepath,
      url,
      filename: storedFilename
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save file'
    };
  }
}

export async function deleteFile(filename: string): Promise<SaveResult> {
  try {
    const filepath = join(UPLOAD_DIR, filename);
    
    if (!existsSync(filepath)) {
      return { success: false, error: 'File not found' };
    }
    
    unlinkSync(filepath);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    };
  }
}

export function getFilePath(filename: string): string {
  return join(UPLOAD_DIR, filename);
}

export { UPLOAD_DIR, MAX_FILE_SIZE };
