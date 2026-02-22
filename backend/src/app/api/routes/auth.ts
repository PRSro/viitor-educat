import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema, formatZodError } from '../../schemas/validation/schemas.js';
import { prisma } from '../../models/prisma.js';
import { z } from 'zod';

export async function authRoutes(server: FastifyInstance) {
  /**
   * POST /auth/register
   * Creates new user with validated input
   * Role is limited to STUDENT or TEACHER (ADMIN cannot be self-registered)
   * Returns user data and JWT token
   */
  server.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate input with Zod
      const validated = registerSchema.parse(request.body);
      const { email, password, role } = validated;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(409).send({ error: 'User already exists' });
      }

      // Hash password with strong salt rounds
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user with validated role (STUDENT or TEACHER only)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role as Role,
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate token with role included
      const token = server.jwt.sign({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      });

      return reply.status(201).send({ user, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error; // Let global error handler deal with unexpected errors
    }
  });

  /**
   * POST /auth/login
   * Authenticates user with validated input
   * Returns JWT token with role
   */
  server.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate input with Zod
      const validated = loginSchema.parse(request.body);
      const { email, password } = validated;

      // Find user (don't reveal if email exists or not)
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Generate token with role included
      const token = server.jwt.sign({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      });

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation failed',
          message: formatZodError(error)
        });
      }
      throw error;
    }
  });
}
