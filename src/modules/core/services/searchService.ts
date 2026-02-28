/**
 * Search Service
 * Handles API calls to backend search endpoints with filters
 */

import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'ngrok-skip-browser-warning': 'true',
  };
}

export interface SearchFilters {
  category?: string;
  level?: string;
  tags?: string;
  teacherId?: string;
}

export interface SearchResultCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  level: string;
  category: string;
  tags: string[];
  teacherId?: string;
  teacherEmail?: string;
  rank?: number;
  teacher?: {
    id: string;
    email: string;
    teacherProfile: {
      bio: string | null;
      pictureUrl: string | null;
    } | null;
  };
  _count?: {
    lessons: number;
    enrollments: number;
  };
}

export interface SearchResultLesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  teacherId?: string;
  teacherEmail?: string;
  rank?: number;
}

export interface SearchResultTeacher {
  id: string;
  email: string;
  teacherProfile: {
    bio: string | null;
    pictureUrl: string | null;
  } | null;
  courses: {
    id: string;
    title: string;
    slug: string;
    _count: {
      lessons: number;
      enrollments: number;
    };
  }[];
}

export interface SearchResultArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  author: {
    id: string;
    email: string;
  };
}

export interface SearchResultResource {
  id: string;
  type: string;
  url: string;
  title: string;
  description: string | null;
  course: {
    id: string;
    title: string;
  } | null;
}

export interface SearchResponse {
  success: boolean;
  query: string | undefined;
  filters: SearchFilters;
  results: {
    courses: SearchResultCourse[];
    lessons: SearchResultLesson[];
    teachers: SearchResultTeacher[];
    articles: SearchResultArticle[];
    resources: SearchResultResource[];
  };
}

export interface SearchSuggestions {
  courses: { type: string; id: string; title: string; slug: string }[];
  teachers: { type: string; id: string; name: string }[];
  articles: { type: string; id: string; title: string; slug: string }[];
}

export interface SearchSuggestionsResponse {
  success: boolean;
  suggestions: SearchSuggestions;
}

export interface SearchFiltersResponse {
  success: boolean;
  filters: {
    categories: string[];
    tags: string[];
    levels: string[];
  };
}

/**
 * Global search with filters
 */
export async function search(
  query?: string,
  filters?: SearchFilters,
  type?: string,
  limit?: number
): Promise<SearchResponse> {
  const params = new URLSearchParams();
  
  if (query) params.append('q', query);
  if (type) params.append('type', type);
  if (limit) params.append('limit', limit.toString());
  if (filters?.category) params.append('category', filters.category);
  if (filters?.level) params.append('level', filters.level);
  if (filters?.tags) params.append('tags', filters.tags);
  if (filters?.teacherId) params.append('teacherId', filters.teacherId);

  const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Search failed');
  }

  return data;
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(query: string): Promise<SearchSuggestionsResponse> {
  const params = new URLSearchParams();
  params.append('q', query);

  const response = await fetch(`${API_BASE_URL}/search/suggestions?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get suggestions');
  }

  return data;
}

/**
 * Get available filter options
 */
export async function getSearchFilters(): Promise<SearchFiltersResponse> {
  const response = await fetch(`${API_BASE_URL}/search/filters`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get filters');
  }

  return data;
}
