import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../core/middleware/authMiddleware.js';
import { teacherOnly } from '../../core/middleware/permissionMiddleware.js';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = './uploads';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

function getCurrentUser(request: FastifyRequest): JwtPayload {
  return (request as any).user as JwtPayload;
}

export async function uploadRoutes(server: FastifyInstance) {
  
  await server.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
  });

  /**
   * POST /upload/profile-picture
   * Upload a profile picture
   * Accessible by: TEACHER only
   */
  server.post('/profile-picture', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ 
          error: 'Invalid file type',
          message: 'Only JPEG, PNG, GIF, and WebP images are allowed'
        });
      }

      // Generate unique filename
      const ext = data.filename.split('.').pop();
      const filename = `${randomUUID()}.${ext}`;
      const filepath = join(UPLOAD_DIR, filename);

      // Save file
      const buffer = await data.toBuffer();
      const { writeFileSync, mkdirSync, existsSync } = await import('fs');
      
      if (!existsSync(UPLOAD_DIR)) {
        mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      
      writeFileSync(filepath, buffer);

      // Return the URL
      const url = `/uploads/${filename}`;
      
      return { 
        message: 'File uploaded successfully',
        url,
        filename
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ 
        error: 'Upload failed',
        message: 'Failed to upload file'
      });
    }
  });

  /**
   * POST /upload/article
   * Upload and parse a .docx file for article creation
   * Accessible by: TEACHER only
   * Rule: Only .docx files are accepted
   */
  server.post('/article', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // RULE: Only .docx files are accepted for articles
      const ext = data.filename.split('.').pop()?.toLowerCase();
      if (ext !== 'docx') {
        return reply.status(400).send({ 
          error: 'Invalid file type',
          message: 'Articles can only be created from .docx files'
        });
      }

      // Save the file temporarily
      const filename = `${randomUUID()}.${ext}`;
      const filepath = join(UPLOAD_DIR, filename);
      
      const { writeFileSync, mkdirSync, existsSync } = await import('fs');
      
      if (!existsSync(UPLOAD_DIR)) {
        mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      
      const buffer = await data.toBuffer();
      writeFileSync(filepath, buffer);

      // Extract content from .docx (basic implementation)
      // In production, you'd use a library like 'mammoth' to extract text
      let content = '';
      let title = '';
      
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ path: filepath });
        content = result.value;
        
        // Extract title from first line or use filename
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

      // Clean up temp file
      try {
        const { unlinkSync } = await import('fs');
        unlinkSync(filepath);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      return { 
        message: 'Article file processed successfully',
        title,
        content: content.substring(0, 100000) // Limit content size
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ 
        error: 'Upload failed',
        message: 'Failed to process article file'
      });
    }
  });

  /**
   * POST /upload/lesson-material
   * Upload and parse a .md file for lesson content
   * Accessible by: TEACHER only
   * Rule: Only .md files are accepted
   */
  server.post('/lesson-material', {
    preHandler: [authMiddleware, teacherOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // RULE: Only .md files are accepted for lesson materials
      const ext = data.filename.split('.').pop()?.toLowerCase();
      if (ext !== 'md' && ext !== 'markdown') {
        return reply.status(400).send({ 
          error: 'Invalid file type',
          message: 'Lesson materials can only be uploaded as .md (Markdown) files'
        });
      }

      // Read and return the markdown content
      const content = await data.toBuffer();
      const textContent = content.toString('utf-8');
      
      return { 
        message: 'Lesson material processed successfully',
        content: textContent.substring(0, 100000) // Limit content size
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ 
        error: 'Upload failed',
        message: 'Failed to process lesson material'
      });
    }
  });

  /**
   * Serve uploaded files
   */
  server.get('/uploads/:filename', async (request: FastifyRequest<{ Params: { filename: string } }>, reply: FastifyReply) => {
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
        webp: 'image/webp'
      };
      
      reply.header('Content-Type', contentTypes[ext || 'jpg'] || 'image/jpeg');
      return reply.send(buffer);
    } catch {
      return reply.status(404).send({ error: 'File not found' });
    }
  });
}
