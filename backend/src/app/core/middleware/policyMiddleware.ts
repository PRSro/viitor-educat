import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from './authMiddleware.js';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface Resource {
  id: string;
  authorId?: string;
  teacherId?: string;
  published?: boolean;
  status?: string;
  ownerId?: string;
}

export interface PolicyContext {
  user: JwtPayload;
  resource?: Resource;
  ownershipField?: string;
}

export type Action = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'enroll';

class AccessPolicy {
  private policies: Map<string, (ctx: PolicyContext) => boolean> = new Map();

  constructor() {
    this.initializePolicies();
  }

  private initializePolicies() {
    // Course policies
    this.register('course:create', (ctx) => {
      return ['TEACHER', 'ADMIN'].includes(ctx.user.role);
    });

    this.register('course:read', (ctx) => {
      if (!ctx.resource) return true;
      const { published, authorId } = ctx.resource;
      if (published) return true;
      return ctx.user.id === authorId || ctx.user.role === 'ADMIN';
    });

    this.register('course:update', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.user.id === ctx.resource.authorId || ctx.user.role === 'ADMIN';
    });

    this.register('course:delete', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.user.id === ctx.resource.authorId || ctx.user.role === 'ADMIN';
    });

    this.register('course:publish', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.user.id === ctx.resource.authorId || ctx.user.role === 'ADMIN';
    });

    this.register('course:enroll', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.resource.published && ctx.user.role === 'STUDENT';
    });

    // Lesson policies
    this.register('lesson:create', (ctx) => {
      return ['TEACHER', 'ADMIN'].includes(ctx.user.role);
    });

    this.register('lesson:read', (ctx) => {
      if (!ctx.resource) return true;
      const { published, authorId } = ctx.resource;
      if (published) return true;
      return ctx.user.id === authorId || ctx.user.role === 'ADMIN';
    });

    this.register('lesson:update', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.user.id === ctx.resource.authorId || ctx.user.role === 'ADMIN';
    });

    this.register('lesson:delete', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.user.id === ctx.resource.authorId || ctx.user.role === 'ADMIN';
    });

    // Article policies
    this.register('article:create', (ctx) => {
      return ['TEACHER', 'ADMIN'].includes(ctx.user.role);
    });

    this.register('article:read', (ctx) => {
      if (!ctx.resource) return true;
      const { published, authorId } = ctx.resource;
      if (published) return true;
      return ctx.user.id === authorId || ctx.user.role === 'ADMIN';
    });

    this.register('article:update', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.user.id === ctx.resource.authorId || ctx.user.role === 'ADMIN';
    });

    this.register('article:delete', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.user.id === ctx.resource.authorId || ctx.user.role === 'ADMIN';
    });

    this.register('article:publish', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.user.id === ctx.resource.authorId || ctx.user.role === 'ADMIN';
    });

    // File article policies
    this.register('fileArticle:create', (ctx) => {
      return ['TEACHER', 'ADMIN'].includes(ctx.user.role);
    });

    this.register('fileArticle:read', (ctx) => {
      if (!ctx.resource) return true;
      const { published, authorId } = ctx.resource;
      if (published) return true;
      return ctx.user.id === authorId || ctx.user.role === 'ADMIN';
    });

    this.register('fileArticle:update', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.user.id === ctx.resource.authorId || ctx.user.role === 'ADMIN';
    });

    this.register('fileArticle:delete', (ctx) => {
      if (!ctx.resource) return false;
      return ctx.user.id === ctx.resource.authorId || ctx.user.role === 'ADMIN';
    });

    // Admin policies
    this.register('admin:*', (ctx) => {
      return ctx.user.role === 'ADMIN';
    });

    // Enrollment policies
    this.register('enrollment:create', (ctx) => {
      return ctx.user.role === 'STUDENT';
    });

    this.register('enrollment:read', (ctx) => {
      if (!ctx.resource) return true;
      return ctx.user.id === ctx.resource.ownerId || ctx.user.role === 'ADMIN';
    });
  }

  register(policy: string, fn: (ctx: PolicyContext) => boolean): void {
    this.policies.set(policy, fn);
  }

  can(action: string, ctx: PolicyContext): boolean {
    const policy = this.policies.get(action);
    if (policy) {
      return policy(ctx);
    }

    // Check wildcard policies
    const [resource] = action.split(':');
    const wildcardPolicy = this.policies.get(`${resource}:*`);
    if (wildcardPolicy) {
      return wildcardPolicy(ctx);
    }

    // Default deny
    return false;
  }

  assert(action: string, ctx: PolicyContext): void {
    if (!this.can(action, ctx)) {
      throw new Error(`Access denied: ${action}`);
    }
  }
}

export const accessPolicy = new AccessPolicy();

export function createPolicyMiddleware(
  action: string,
  getResource: (request: FastifyRequest) => Promise<Resource | undefined>
) {
  return async function policyMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const user = (request as any).user as JwtPayload | undefined;
    
    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const resource = await getResource(request);
    const ctx: PolicyContext = { user, resource };

    if (!accessPolicy.can(action, ctx)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `You don't have permission to ${action} this resource`
      });
    }
  };
}

export function requireAction(action: string) {
  return async function(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const user = (request as any).user as JwtPayload | undefined;
    
    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const ctx: PolicyContext = { user };

    if (!accessPolicy.can(action, ctx)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Action '${action}' not permitted for role '${user.role}'`
      });
    }
  };
}
