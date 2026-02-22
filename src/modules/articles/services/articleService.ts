/**
 * Article Service
 * Handles API calls to backend article endpoints
 */

import { getToken } from '@/modules/core/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
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
  const url = `${API_BASE_URL}/articles${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch articles');
  }

  return data;
}

/**
 * Get latest articles for news feed
 */
export async function getLatestArticles(): Promise<ArticleListItem[]> {
  const response = await fetch(`${API_BASE_URL}/articles/latest`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch latest articles');
  }

  return data.articles;
}

/**
 * Get articles by a specific teacher
 */
export async function getArticlesByTeacher(teacherId: string, page = 1, limit = 10): Promise<ArticlesResponse> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/articles/teacher/${teacherId}?${params}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch teacher articles');
  }

  return data;
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(slug: string): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles/${slug}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch article');
  }

  return data.article;
}

/**
 * Get all article categories
 */
export async function getCategories(): Promise<ArticleCategory[]> {
  const response = await fetch(`${API_BASE_URL}/articles/categories`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch categories');
  }

  return data.categories;
}

/**
 * Create a new article (Teacher/Admin only)
 */
export async function createArticle(articleData: CreateArticleData): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(articleData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to create article');
  }

  return data.article;
}

/**
 * Import article from external URL (Teacher/Admin only)
 */
export async function importArticle(url: string): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles/import`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to import article');
  }

  return data.article;
}

/**
 * Update an article (Author/Admin only)
 */
export async function updateArticle(id: string, articleData: Partial<CreateArticleData & { published: boolean }>): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(articleData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to update article');
  }

  return data.article;
}

/**
 * Delete an article (Author/Admin only)
 */
export async function deleteArticle(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to delete article');
  }
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
