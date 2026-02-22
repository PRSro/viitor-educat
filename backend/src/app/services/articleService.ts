import { Prisma, ArticleCategory } from '@prisma/client';
import { prisma } from '../models/prisma.js';

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
  published?: boolean;
  status?: string;
}

export interface ArticleFilters {
  category?: ArticleCategory;
  teacherId?: string;
  tags?: string[];
  search?: string;
  published?: boolean;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100) + '-' + Date.now().toString(36);
}

export const articleService = {
  async create(data: CreateArticleData) {
    const slug = generateSlug(data.title);
    
    return prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        category: data.category || ArticleCategory.GENERAL,
        tags: data.tags || [],
        sourceUrl: data.sourceUrl,
        slug,
        authorId: data.authorId,
        status: 'draft',
        published: false,
      },
      include: {
        author: {
          select: { id: true, email: true }
        }
      }
    });
  },

  async update(id: string, data: UpdateArticleData, authorId: string, userRole: string) {
    const existing = await prisma.article.findUnique({ where: { id } });
    
    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    if (existing.authorId !== authorId && userRole !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    return prisma.article.update({
      where: { id },
      data: {
        ...data,
        ...(data.title && { slug: generateSlug(data.title) })
      },
      include: {
        author: {
          select: { id: true, email: true }
        }
      }
    });
  },

  async delete(id: string, authorId: string, userRole: string) {
    const existing = await prisma.article.findUnique({ where: { id } });
    
    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    if (existing.authorId !== authorId && userRole !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    return prisma.article.delete({ where: { id } });
  },

  async findById(id: string) {
    return prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, email: true }
        }
      }
    });
  },

  async findBySlug(slug: string) {
    return prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, email: true }
        }
      }
    });
  },

  async findAll(filters: ArticleFilters, pagination: { page: number; limit: number }) {
    const where: Prisma.ArticleWhereInput = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.teacherId) {
      where.authorId = filters.teacherId;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.published !== undefined) {
      where.published = filters.published;
    } else {
      where.published = true;
    }

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
          createdAt: true,
          author: { select: { id: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.article.count({ where })
    ]);

    return {
      articles,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  },

  async findByTeacher(teacherId: string, pagination: { page: number; limit: number }, includeUnpublished = false) {
    const where: Prisma.ArticleWhereInput = {
      authorId: teacherId
    };

    if (!includeUnpublished) {
      where.published = true;
    }

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
          published: true,
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

    return {
      articles,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  },

  async checkOwnership(id: string, userId: string): Promise<boolean> {
    const article = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true }
    });
    return article?.authorId === userId;
  }
};
