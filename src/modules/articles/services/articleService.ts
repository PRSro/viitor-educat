/**
 * Article Service
 * Handles API calls to backend article endpoints
 */

import { api } from '@/lib/apiClient';

export type ArticleCategory =
  | 'MATH'
  | 'SCIENCE'
  | 'LITERATURE'
  | 'HISTORY'
  | 'COMPUTER_SCIENCE'
  | 'ARTS'
  | 'LANGUAGES'
  | 'GENERAL';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  sourceUrl?: string;
  category: ArticleCategory;
  tags: string[];
  author?: {
    id: string;
    email: string;
  };
  published: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category: ArticleCategory;
  tags: string[];
  sourceUrl?: string;
  createdAt: string;
  author?: {
    id: string;
    email: string;
  };
}

export interface ArticlesResponse {
  articles: ArticleListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ArticleFilters {
  category?: ArticleCategory;
  teacherId?: string;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateArticleData {
  title: string;
  content: string;
  excerpt?: string;
  category?: ArticleCategory;
  tags?: string[];
  sourceUrl?: string;
  published?: boolean;
}

/**
 * Fetch articles with optional filters
 */
export async function getArticles(filters?: ArticleFilters): Promise<ArticlesResponse> {
  const params = new URLSearchParams();

  if (filters?.category) params.set('category', filters.category);
  if (filters?.teacherId) params.set('teacherId', filters.teacherId);
  if (filters?.tags) params.set('tags', filters.tags);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.limit) params.set('limit', filters.limit.toString());

  const queryString = params.toString();
  return api.get(`/articles${queryString ? `?${queryString}` : ''}`);
}

/**
 * Get latest articles for news feed
 */
export async function getLatestArticles(): Promise<ArticleListItem[]> {
  const data = await api.get<{ articles: ArticleListItem[] }>('/articles/latest');
  return data.articles;
}

/**
 * Get articles by a specific teacher
 */
export async function getArticlesByTeacher(teacherId: string, page = 1, limit = 10): Promise<ArticlesResponse> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());

  return api.get(`/articles/teacher/${teacherId}?${params}`);
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(slug: string): Promise<Article> {
  const data = await api.get<{ article: Article }>(`/articles/${slug}`);
  return data.article;
}

/**
 * Get all article categories
 */
export async function getCategories(): Promise<ArticleCategory[]> {
  const data = await api.get<{ categories: ArticleCategory[] }>('/articles/categories');
  return data.categories;
}

/**
 * Create a new article (Teacher/Admin only)
 */
export async function createArticle(articleData: CreateArticleData): Promise<Article> {
  const data = await api.post<{ article: Article }>('/articles', articleData);
  return data.article;
}

/**
 * Import article from external URL (Teacher/Admin only)
 */
export async function importArticle(url: string): Promise<Article> {
  const data = await api.post<{ article: Article }>('/articles/import', { url });
  return data.article;
}

/**
 * Update an article (Author/Admin only)
 */
export async function updateArticle(id: string, articleData: Partial<CreateArticleData & { published: boolean }>): Promise<Article> {
  const data = await api.put<{ article: Article }>(`/articles/${id}`, articleData);
  return data.article;
}

/**
 * Delete an article (Author/Admin only)
 */
export async function deleteArticle(id: string): Promise<void> {
  await api.delete(`/articles/${id}`);
}

// Category display helpers
export const categoryLabels: Record<ArticleCategory, string> = {
  MATH: 'Mathematics',
  SCIENCE: 'Science',
  LITERATURE: 'Literature',
  HISTORY: 'History',
  COMPUTER_SCIENCE: 'Computer Science',
  ARTS: 'Arts',
  LANGUAGES: 'Languages',
  GENERAL: 'General',
};

export const categoryColors: Record<ArticleCategory, string> = {
  MATH: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  SCIENCE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  LITERATURE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  HISTORY: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  COMPUTER_SCIENCE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  ARTS: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  LANGUAGES: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  GENERAL: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};
