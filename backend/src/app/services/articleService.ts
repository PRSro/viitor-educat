import { Prisma, ArticleCategory, Status } from '@prisma/client';
import { prisma } from '../models/prisma.js';
import { BaseService } from '../core/services/BaseService.js';
import { ServiceResponse, PaginationMeta } from '../core/types/service.js';
import { AppError } from '../core/errors/AppError.js';
import { auditService } from './auditService.js';

export interface CreateArticleData {
  title: string;
  content: string;
  excerpt?: string;
  category?: ArticleCategory;
  tags?: string[];
  sourceUrl?: string | null;
  authorId: string;
}

export interface UpdateArticleData {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: ArticleCategory;
  tags?: string[];
  sourceUrl?: string | null;
  status?: Status;
}

export interface ArticleFilters {
  category?: ArticleCategory;
  teacherId?: string;
  tags?: string[];
  search?: string;
  status?: Status;
  published?: boolean;
}

export class ArticleService extends BaseService {
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 100) + '-' + Date.now().toString(36);
  }

  async create(data: CreateArticleData, userRole: string): Promise<ServiceResponse> {
    try {
      if (userRole === 'STUDENT') {
        throw AppError.Forbidden('Students cannot create articles');
      }

      const slug = this.generateSlug(data.title);

      const article = await prisma.article.create({
        data: {
          title: data.title,
          content: data.content,
          excerpt: data.excerpt,
          category: data.category || ArticleCategory.GENERAL,
          tags: data.tags || [],
          sourceUrl: data.sourceUrl,
          slug,
          authorId: data.authorId,
          status: Status.DRAFT,
        },
        include: {
          author: { select: { id: true, email: true } }
        }
      });

      await auditService.log(data.authorId, 'CREATE_ARTICLE', 'Article', article.id);

      return this.success(article);
    } catch (err) {
      return this.error(err);
    }
  }

  async update(id: string, data: UpdateArticleData, authorId: string, userRole: string): Promise<ServiceResponse> {
    try {
      const existing = await prisma.article.findUnique({ where: { id } });

      if (!existing) {
        throw AppError.NotFound('Article not found');
      }

      if (existing.authorId !== authorId && userRole !== 'ADMIN') {
        throw AppError.Forbidden('Access denied');
      }

      const article = await prisma.article.update({
        where: { id },
        data: {
          ...data,
          ...(data.title && { slug: this.generateSlug(data.title) })
        },
        include: {
          author: { select: { id: true, email: true } }
        }
      });

      await auditService.log(authorId, 'UPDATE_ARTICLE', 'Article', article.id);

      return this.success(article);
    } catch (err) {
      return this.error(err);
    }
  }

  async delete(id: string, authorId: string, userRole: string): Promise<ServiceResponse> {
    try {
      const existing = await prisma.article.findUnique({ where: { id } });

      if (!existing) {
        throw AppError.NotFound('Article not found');
      }

      if (existing.authorId !== authorId && userRole !== 'ADMIN') {
        throw AppError.Forbidden('Access denied');
      }

      await prisma.article.delete({ where: { id } });
      await auditService.log(authorId, 'DELETE_ARTICLE', 'Article', id);

      return this.success({ deleted: true });
    } catch (err) {
      return this.error(err);
    }
  }

  async findById(id: string): Promise<ServiceResponse> {
    try {
      const article = await prisma.article.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, email: true } }
        }
      });

      if (!article) throw AppError.NotFound('Article not found');
      return this.success(article);
    } catch (err) {
      return this.error(err);
    }
  }

  async findBySlug(slug: string): Promise<ServiceResponse> {
    try {
      const article = await prisma.article.findUnique({
        where: { slug },
        include: {
          author: { select: { id: true, email: true } }
        }
      });

      if (!article) throw AppError.NotFound('Article not found');
      return this.success(article);
    } catch (err) {
      return this.error(err);
    }
  }

  async findAll(filters: ArticleFilters, pagination: { page: number; limit: number }): Promise<ServiceResponse> {
    try {
      const where: Prisma.ArticleWhereInput = {};

      if (filters.category) where.category = filters.category;
      if (filters.teacherId) where.authorId = filters.teacherId;
      if (filters.tags && filters.tags.length > 0) where.tags = { hasSome: filters.tags };

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.published !== undefined) where.published = filters.published;

      where.status = filters.status !== undefined ? filters.status : Status.PUBLISHED;

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            category: true,
            tags: true,
            sourceUrl: true,
            status: true,
            createdAt: true,
            author: { select: { id: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        }),
        prisma.article.count({ where })
      ]);

      const meta: PaginationMeta = {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      };

      return this.success(articles, meta);
    } catch (err) {
      return this.error(err);
    }
  }

  async checkOwnership(id: string, userId: string): Promise<boolean> {
    const article = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true }
    });
    return article?.authorId === userId;
  }

  // Aliases for route compatibility
  async getArticleById(id: string) {
    const res = await this.findById(id);
    return res.data;
  }

  async getArticleBySlug(slug: string) {
    const res = await this.findBySlug(slug);
    return res.data;
  }
}

export const articleService = new ArticleService();
