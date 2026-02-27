import { getToken } from '@/modules/core/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type ArticleCategory = 'MATH' | 'SCIENCE' | 'LITERATURE' | 'HISTORY' | 'COMPUTER_SCIENCE' | 'ARTS' | 'LANGUAGES' | 'GENERAL';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: ArticleCategory;
  authorId: string;
  author?: {
    id: string;
    email: string;
    isTeacher: boolean;
  };
  coverImage?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category: ArticleCategory;
  authorId: string;
  author?: {
    id: string;
    email: string;
    isTeacher: boolean;
  };
  coverImage?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  viewCount?: number;
}

export interface CreateArticleData {
  title: string;
  content: string;
  excerpt?: string;
  category: ArticleCategory;
  coverImage?: string;
  tags?: string[];
  isPublished?: boolean;
}

export interface UpdateArticleData extends Partial<CreateArticleData> {
  id: string;
}

export const categoryLabels: Record<ArticleCategory, string> = {
  MATH: 'Matematică',
  SCIENCE: 'Științe',
  LITERATURE: 'Literatură',
  HISTORY: 'Istorie',
  COMPUTER_SCIENCE: 'Informatică',
  ARTS: 'Arte',
  LANGUAGES: 'Limbi Străine',
  GENERAL: 'General',
};

export const categoryColors: Record<ArticleCategory, string> = {
  MATH: 'bg-blue-500',
  SCIENCE: 'bg-green-500',
  LITERATURE: 'bg-purple-500',
  HISTORY: 'bg-amber-500',
  COMPUTER_SCIENCE: 'bg-cyan-500',
  ARTS: 'bg-pink-500',
  LANGUAGES: 'bg-orange-500',
  GENERAL: 'bg-gray-500',
};

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function getArticles(page: number = 1, limit: number = 10, category?: ArticleCategory): Promise<{ articles: ArticleListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  let url = `${API_BASE_URL}/articles?page=${page}&limit=${limit}`;
  if (category) {
    url += `&category=${category}`;
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch articles');
  }

  return data;
}

export async function getArticleBySlug(slug: string): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles/${slug}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch article');
  }

  return data.article || data;
}

export async function getTeacherArticles(teacherId?: string): Promise<ArticleListItem[]> {
  let url = `${API_BASE_URL}/articles/teacher`;
  if (teacherId) {
    url += `?teacherId=${teacherId}`;
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch teacher articles');
  }

  return data.articles || data;
}

export async function createArticle(data: CreateArticleData): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create article');
  }

  return result.article || result;
}

export async function updateArticle(id: string, data: Partial<CreateArticleData>): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update article');
  }

  return result.article || result;
}

export async function deleteArticle(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete article');
  }
}

export async function uploadArticleFile(articleId: string, file: File): Promise<{ url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/articles/${articleId}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload file');
  }

  return data;
}
