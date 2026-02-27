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
  const forbiddenPatterns = ['../', '~', '\\0', '%00'];
  const hasForbidden = forbiddenPatterns.some(pattern => filename.includes(pattern));
  return !hasForbidden;
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
