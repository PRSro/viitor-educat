import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface RegisterBody {
  email: string;
  password: string;
  role?: 'STUDENT' | 'TEACHER'; // Optional, defaults to STUDENT
}

interface LoginBody {
  email: string;
  password: string;
}

export async function authRoutes(server: FastifyInstance) {
  /**
   * POST /auth/register
   * Creates new user with optional role (defaults to STUDENT)
   * Returns user data and JWT token
   */
  server.post('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const { email, password, role } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    // Validate role if provided
    const userRole: Role = role === 'TEACHER' ? 'TEACHER' : 'STUDENT';

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
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
  });

  /**
   * POST /auth/login
   * Authenticates user and returns JWT token with role
   */
  server.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    // Find user
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
  });
}
