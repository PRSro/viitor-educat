/**
 * Upload Routes
 * File upload with validation and metadata tracking
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { teacherOnly } from '../../core/middleware/permissionMiddleware.js';
import { prisma } from '../../models/prisma.js';
import { 
  saveFile, 
  deleteFile, 
  validateMimeType, 
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE 
} from '../../services/storageService.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

interface FileParams {
  fileId: string;
}

interface UploadBody {
  file?: File;
  files?: File[];
}

const UPLOAD_DIR = './uploads';

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

export async function uploadRoutes(server: FastifyInstance) {
  
  /**
   * POST * General file upload /upload
   - accessible by teachers
   */
  server.post<{ Body: UploadBody }>('/', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest<{ Body: UploadBody }>, reply: FastifyReply) => {
    try {
      const user = getCurrentUser(request);
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file provided' });
      }

      const mimeType = data.mimetype;
      if (!validateMimeType(mimeType)) {
        return reply.status(415).send({ 
          error: 'Unsupported file type',
          allowedTypes: ALLOWED_MIME_TYPES
        });
      }

      const buffer = await data.toBuffer();
      
      if (buffer.byteLength > MAX_FILE_SIZE) {
        return reply.status(413).send({ 
          error: 'File too large',
          maxSize: MAX_FILE_SIZE
        });
      }

      const saveResult = await saveFile(buffer, data.filename);
      
      if (!saveResult.success) {
        return reply.status(500).send({ error: saveResult.error });
      }

      const file = await prisma.file.create({
        data: {
          url: saveResult.url!,
          filename: saveResult.filename!,
          mimeType,
          size: buffer.byteLength,
          uploadedBy: user.id
        }
      });

      return {
        fileId: file.id,
        url: file.url,
        mimeType: file.mimeType,
        size: file.size
      };
    } catch (error) {
      server.log.error(error, 'Upload failed');
      return reply.status(500).send({ error: 'Upload failed' });
    }
  });

  /**
   * DELETE /upload/:fileId
   * Delete a file (owner or admin only)
   */
  server.delete<{ Params: FileParams }>('/{fileId}', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request, reply) => {
    try {
      const user = getCurrentUser(request);
      const { fileId } = request.params;

      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        return reply.status(404).send({ error: 'File not found' });
      }

      const isOwner = file.uploadedBy === user.id;
      const isAdmin = user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return reply.status(403).send({ error: 'Not authorized to delete this file' });
      }

      const filename = file.filename;
      await deleteFile(filename);

      await prisma.file.delete({
        where: { id: fileId }
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: isAdmin && !isOwner ? 'ADMIN_DELETE_FILE' : 'DELETE_FILE',
          resource: 'file',
          resourceId: fileId,
          metadata: { filename, url: file.url }
        }
      });

      return { success: true };
    } catch (error) {
      server.log.error(error, 'Delete failed');
      return reply.status(500).send({ error: 'Delete failed' });
    }
  });

  /**
   * GET /upload/:fileId/meta
   * Get file metadata without serving the file
   */
  server.get<{ Params: FileParams }>('/{fileId}/meta', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    try {
      const { fileId } = request.params;

      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: {
          user: {
            select: { id: true, email: true }
          }
        }
      });

      if (!file) {
        return reply.status(404).send({ error: 'File not found' });
      }

      return {
        id: file.id,
        url: file.url,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        uploadedBy: file.user.email,
        createdAt: file.createdAt
      };
    } catch (error) {
      server.log.error(error, 'Failed to get file metadata');
      return reply.status(500).send({ error: 'Failed to get file metadata' });
    }
  });

  /**
   * POST /upload/profile-picture
   * Upload a profile picture
   */
  server.post('/profile-picture', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = getCurrentUser(request);
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(415).send({ 
          error: 'Invalid file type',
          message: 'Only JPEG, PNG, GIF, and WebP images are allowed'
        });
      }

      const buffer = await data.toBuffer();
      const saveResult = await saveFile(buffer, data.filename);
      
      if (!saveResult.success) {
        return reply.status(500).send({ error: saveResult.error });
      }

      return { 
        message: 'File uploaded successfully',
        url: saveResult.url,
        filename: saveResult.filename
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Upload failed' });
    }
  });

  /**
   * POST /upload/article
   * Upload and parse a .docx file for article creation
   */
  server.post('/article', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const ext = data.filename.split('.').pop()?.toLowerCase();
      if (ext !== 'docx') {
        return reply.status(415).send({ 
          error: 'Invalid file type',
          message: 'Articles can only be created from .docx files'
        });
      }

      const buffer = await data.toBuffer();
      const saveResult = await saveFile(buffer, data.filename);
      
      if (!saveResult.success) {
        return reply.status(500).send({ error: saveResult.error });
      }

      let content = '';
      let title = '';
      
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ path: join(UPLOAD_DIR, saveResult.filename!) });
        content = result.value;
        
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          title = lines[0].substring(0, 200);
          content = lines.slice(1).join('\n');
        } else {
          title = data.filename.replace('.docx', '');
        }
      } catch (parseError) {
        server.log.warn('Failed to parse .docx, using raw content');
        title = data.filename.replace('.docx', '');
        content = buffer.toString('utf-8').substring(0, 50000);
      }

      await deleteFile(saveResult.filename!);
      
      return { 
        message: 'Article file processed successfully',
        title,
        content: content.substring(0, 100000)
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Upload failed' });
    }
  });

  /**
   * POST /upload/lesson-material
   * Upload and parse a .md file for lesson content
   */
  server.post('/lesson-material', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const ext = data.filename.split('.').pop()?.toLowerCase();
      if (ext !== 'md' && ext !== 'markdown') {
        return reply.status(415).send({ 
          error: 'Invalid file type',
          message: 'Lesson materials can only be uploaded as .md (Markdown) files'
        });
      }

      const content = await data.toBuffer();
      const textContent = content.toString('utf-8');
      
      return { 
        message: 'Lesson material processed successfully',
        content: textContent.substring(0, 100000)
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Upload failed' });
    }
  });

  /**
   * Serve uploaded files
   */
  server.get('/files/:filename', async (request: FastifyRequest<{ Params: { filename: string } }>, reply: FastifyReply) => {
    const { filename } = request.params;
    const filepath = join(UPLOAD_DIR, filename);
    
    try {
      const buffer = await readFile(filepath);
      const ext = filename.split('.').pop()?.toLowerCase();
      
      const contentTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        pdf: 'application/pdf'
      };
      
      reply.header('Content-Type', contentTypes[ext || 'jpg'] || 'application/octet-stream');
      return reply.send(buffer);
    } catch {
      return reply.status(404).send({ error: 'File not found' });
    }
  });
}
