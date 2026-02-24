import { writeFile, readFile, mkdir, access, readdir, unlink, stat } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync, renameSync } from 'fs';
import { redisService } from '../core/services/redisService.js';
import { Mutex } from 'async-mutex';

const ARTICLES_DIR = join(process.cwd(), 'articles');
const HISTORY_DIR = join(ARTICLES_DIR, 'history');

const CACHE_TTL = 60000; // 1 minute
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  sourceUrl?: string;
  category?: string;
  tags?: string[];
  authorId: string;
  published: boolean;
  status: 'draft' | 'published' | 'archived';
  paths: ArticlePath[];
  metadata?: {
    wordCount: number;
    readingTime: number;
    lastModified: string;
    version: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ArticlePath {
  path: string;
  type: 'heading' | 'paragraph' | 'image' | 'link' | 'list' | 'code' | 'quote';
  level?: number;
  text?: string;
  href?: string;
  src?: string;
  items?: string[];
}

export interface ArticleVersion {
  version: number;
  createdAt: string;
  content: string;
  title: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errorCode?: string;
  message?: string;
}

export interface SearchFilters {
  authorId?: string;
  published?: boolean;
  status?: string;
  category?: string;
  search?: string;
}

// File locking utilities
const fileLocks = new Map<string, Promise<void>>();

async function acquireLock(slug: string): Promise<() => Promise<void>> {
  const lockKey = `${slug}.lock`;

  while (fileLocks.has(lockKey)) {
    await fileLocks.get(lockKey);
  }

  let releaseLock: (() => Promise<void>) | undefined;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = async () => {
      fileLocks.delete(lockKey);
      resolve();
    };
  });

  fileLocks.set(lockKey, lockPromise);

  return releaseLock!;
}

// Atomic write: write to temp file, then rename
async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tempPath = `${filePath}.${Date.now()}.tmp`;
  await writeFile(tempPath, data, 'utf-8');
  renameSync(tempPath, filePath);
}

async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

function extractPaths(html: string): ArticlePath[] {
  const paths: ArticlePath[] = [];

  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    const path = `/heading-${level}/${text.toLowerCase().replace(/\s+/g, '-')}`;
    paths.push({ path, type: 'heading', level, text });
  }

  const paraRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let paraIndex = 0;
  while ((match = paraRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 0) {
      paths.push({ path: `/paragraph/${paraIndex}`, type: 'paragraph', text: text.substring(0, 100) });
      paraIndex++;
    }
  }

  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    paths.push({ path: `/link/${paths.length}`, type: 'link', href: match[1], text: match[2].trim() });
  }

  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    paths.push({ path: `/image/${paths.length}`, type: 'image', src: match[1], text: match[2] });
  }

  const codeRegex = /<code[^>]*>([\s\S]*?)<\/code>/gi;
  while ((match = codeRegex.exec(html)) !== null) {
    paths.push({ path: `/code/${paths.length}`, type: 'code', text: match[1].trim() });
  }

  const quoteRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
  while ((match = quoteRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    paths.push({ path: `/quote/${paths.length}`, type: 'quote', text });
  }

  const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
  while ((match = ulRegex.exec(html)) !== null) {
    const items: string[] = [];
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(match[1])) !== null) {
      items.push(liMatch[1].replace(/<[^>]+>/g, '').trim());
    }
    if (items.length > 0) {
      paths.push({ path: `/list/${paths.length}`, type: 'list', items });
    }
  }

  return paths;
}

function calculateWordCount(content: string): number {
  return content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
}

function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

// Schema validation
function validateArticle(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = ['id', 'title', 'slug', 'content', 'authorId', 'createdAt'];
  const requiredTypes: Record<string, string> = {
    id: 'string',
    title: 'string',
    slug: 'string',
    content: 'string',
    authorId: 'string',
    createdAt: 'string'
  };

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  for (const [field, expectedType] of Object.entries(requiredTypes)) {
    if (data[field] !== undefined && typeof data[field] !== expectedType) {
      errors.push(`Field ${field} must be of type ${expectedType}`);
    }
  }

  if (data.title && (data.title.length < 1 || data.title.length > 300)) {
    errors.push('Title must be between 1 and 300 characters');
  }

  if (data.content && data.content.length > MAX_FILE_SIZE) {
    errors.push(`Content exceeds maximum size of ${MAX_FILE_SIZE} bytes`);
  }

  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
  }

  if (data.authorId && !/^[^/]+$/.test(data.authorId)) {
    errors.push('Invalid authorId format');
  }

  return { valid: errors.length === 0, errors };
}

// In-memory / Redis cache
class ArticleCache {
  async getIndex(): Promise<FileArticle[] | null> {
    return redisService.get<FileArticle[]>('article:index');
  }

  async setIndex(data: FileArticle[]): Promise<void> {
    await redisService.set('article:index', data, CACHE_TTL / 1000); // converting ms to seconds
  }

  async invalidateIndex(): Promise<void> {
    await redisService.del('article:index');
  }

  async getSlug(slug: string): Promise<FileArticle | null> {
    return redisService.get<FileArticle>(`article:${slug}`);
  }

  async setSlug(slug: string, data: FileArticle): Promise<void> {
    await redisService.set(`article:${slug}`, data, CACHE_TTL / 1000);
  }

  async invalidateSlug(slug: string): Promise<void> {
    await redisService.del(`article:${slug}`);
  }

  async clear(): Promise<void> {
    const keys = await redisService.keys('article:*');
    for (const key of keys) {
      await redisService.del(key);
    }
  }
}

const articleCache = new ArticleCache();


// History management
async function saveVersion(slug: string, article: FileArticle): Promise<void> {
  const versionDir = join(HISTORY_DIR, slug);
  await ensureDir(versionDir);

  const versionFile = join(versionDir, `v${article.metadata?.version || 1}.json`);
  const versionData: ArticleVersion = {
    version: article.metadata?.version || 1,
    createdAt: article.updatedAt,
    content: article.content,
    title: article.title
  };

  await atomicWrite(versionFile, JSON.stringify(versionData, null, 2));
}

async function getVersions(slug: string): Promise<ArticleVersion[]> {
  try {
    const versionDir = join(HISTORY_DIR, slug);
    await ensureDir(versionDir);
    const files = await readdir(versionDir);

    const versions: ArticleVersion[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await readFile(join(versionDir, file), 'utf-8');
        versions.push(JSON.parse(content));
      }
    }

    return versions.sort((a, b) => b.version - a.version);
  } catch {
    return [];
  }
}

async function getVersion(slug: string, version: number): Promise<ArticleVersion | null> {
  try {
    const versionFile = join(HISTORY_DIR, slug, `v${version}.json`);
    const content = await readFile(versionFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export const fileArticleService = {
  async init(): Promise<void> {
    await ensureDir(ARTICLES_DIR);
    await ensureDir(HISTORY_DIR);
  },

  async save(article: Omit<FileArticle, 'paths' | 'metadata' | 'updatedAt'>): Promise<ApiResponse<FileArticle>> {
    const releaseLock = await acquireLock(article.slug);

    try {
      const paths = extractPaths(article.content);
      const wordCount = calculateWordCount(article.content);
      const now = new Date().toISOString();

      const fileArticle: FileArticle = {
        ...article,
        paths,
        metadata: {
          wordCount,
          readingTime: calculateReadingTime(wordCount),
          lastModified: now,
          version: 1
        },
        updatedAt: now
      };

      const validation = validateArticle(fileArticle);
      if (!validation.valid) {
        return { success: false, errorCode: 'VALIDATION_ERROR', message: validation.errors.join('; ') };
      }

      await saveVersion(article.slug, fileArticle);

      const filePath = join(ARTICLES_DIR, `${article.slug}.json`);
      await atomicWrite(filePath, JSON.stringify(fileArticle, null, 2));

      await articleCache.invalidateIndex();
      await articleCache.setSlug(article.slug, fileArticle);

      return { success: true, data: fileArticle };
    } catch (error: any) {
      return { success: false, errorCode: 'WRITE_ERROR', message: error.message };
    } finally {
      await releaseLock();
    }
  },

  async update(slug: string, data: Partial<FileArticle>): Promise<ApiResponse<FileArticle>> {
    const releaseLock = await acquireLock(slug);

    try {
      const existing = await this.findBySlug(slug);
      if (!existing) {
        return { success: false, errorCode: 'NOT_FOUND', message: 'Article not found' };
      }

      const paths = data.content ? extractPaths(data.content) : existing.paths;
      const wordCount = data.content ? calculateWordCount(data.content) : existing.metadata?.wordCount || 0;
      const now = new Date().toISOString();

      const updated: FileArticle = {
        ...existing,
        ...data,
        paths,
        metadata: {
          ...existing.metadata,
          wordCount,
          readingTime: calculateReadingTime(wordCount),
          lastModified: now,
          version: (existing.metadata?.version || 0) + 1
        },
        updatedAt: now
      };

      const validation = validateArticle(updated);
      if (!validation.valid) {
        return { success: false, errorCode: 'VALIDATION_ERROR', message: validation.errors.join('; ') };
      }

      await saveVersion(slug, updated);

      const filePath = join(ARTICLES_DIR, `${slug}.json`);
      await atomicWrite(filePath, JSON.stringify(updated, null, 2));

      await articleCache.invalidateIndex();
      await articleCache.setSlug(slug, updated);

      return { success: true, data: updated };
    } catch (error: any) {
      return { success: false, errorCode: 'UPDATE_ERROR', message: error.message };
    } finally {
      await releaseLock();
    }
  },

  async findBySlug(slug: string): Promise<FileArticle | null> {
    const cached = await articleCache.getSlug(slug);
    if (cached) return cached;

    try {
      const filePath = join(ARTICLES_DIR, `${slug}.json`);
      const content = await readFile(filePath, 'utf-8');
      const article = JSON.parse(content) as FileArticle;
      await articleCache.setSlug(slug, article);
      return article;
    } catch {
      return null;
    }
  },

  async findById(id: string): Promise<FileArticle | null> {
    const articles = await this.findAll();
    return articles.data.find(a => a.id === id) || null;
  },

  async findAll(filters?: SearchFilters, pagination?: { page: number; limit: number }): Promise<PaginatedResponse<FileArticle>> {
    if (!filters && !pagination) {
      const cached = await articleCache.getIndex();
      if (cached) {
        return {
          data: cached,
          pagination: { page: 1, limit: cached.length, total: cached.length, totalPages: 1 }
        };
      }
    }

    try {
      await ensureDir(ARTICLES_DIR);
      const files = await readdir(ARTICLES_DIR);
      let articles: FileArticle[] = [];

      for (const file of files) {
        if (extname(file) === '.json') {
          try {
            const content = await readFile(join(ARTICLES_DIR, file), 'utf-8');
            const article = JSON.parse(content) as FileArticle;
            articles.push(article);
          } catch {
            // Skip invalid files
          }
        }
      }

      if (filters) {
        if (filters.authorId) {
          articles = articles.filter(a => a.authorId === filters.authorId);
        }
        if (filters.published !== undefined) {
          articles = articles.filter(a => a.published === filters.published);
        }
        if (filters.status) {
          articles = articles.filter(a => a.status === filters.status);
        }
        if (filters.category) {
          articles = articles.filter(a => a.category === filters.category);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          articles = articles.filter(a =>
            a.title.toLowerCase().includes(searchLower) ||
            a.content.toLowerCase().includes(searchLower) ||
            a.paths.some(p => p.text?.toLowerCase().includes(searchLower))
          );
        }
      }

      articles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      if (!filters && !pagination) {
        await articleCache.setIndex(articles);
      }

      const page = pagination?.page || 1;
      const limit = pagination?.limit || articles.length;
      const total = articles.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedData = articles.slice((page - 1) * limit, page * limit);

      return {
        data: paginatedData,
        pagination: { page, limit, total, totalPages }
      };
    } catch (error) {
      return {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };
    }
  },

  async findByAuthor(authorId: string): Promise<FileArticle[]> {
    const result = await this.findAll({ authorId });
    return result.data;
  },

  async delete(slug: string): Promise<ApiResponse<null>> {
    const releaseLock = await acquireLock(slug);

    try {
      const existing = await this.findBySlug(slug);
      if (!existing) {
        return { success: false, errorCode: 'NOT_FOUND', message: 'Article not found' };
      }

      const filePath = join(ARTICLES_DIR, `${slug}.json`);
      await unlink(filePath);

      try {
        const historyDir = join(HISTORY_DIR, slug);
        const historyFiles = await readdir(historyDir);
        for (const file of historyFiles) {
          await unlink(join(historyDir, file));
        }
      } catch {
        // History may not exist
      }

      await articleCache.invalidateIndex();
      await articleCache.invalidateSlug(slug);

      return { success: true, data: null };
    } catch (error: any) {
      return { success: false, errorCode: 'DELETE_ERROR', message: error.message };
    } finally {
      await releaseLock();
    }
  },

  async exists(slug: string): Promise<boolean> {
    try {
      const filePath = join(ARTICLES_DIR, `${slug}.json`);
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  },

  async getHistory(slug: string): Promise<ApiResponse<ArticleVersion[]>> {
    const versions = await getVersions(slug);
    return { success: true, data: versions };
  },

  async restoreVersion(slug: string, version: number): Promise<ApiResponse<FileArticle>> {
    const versionData = await getVersion(slug, version);
    if (!versionData) {
      return { success: false, errorCode: 'NOT_FOUND', message: 'Version not found' };
    }

    return this.update(slug, {
      content: versionData.content,
      title: versionData.title
    });
  },

  getArticlesDir(): string {
    return ARTICLES_DIR;
  },

  clearCache(): void {
    articleCache.clear();
  }
};
