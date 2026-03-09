/**
 * Search Service
 * Handles API calls to backend search endpoints with filters
 */

import { api } from '@/lib/apiClient';

export interface SearchFilters {
  category?: string;
  level?: string;
  tags?: string;
  teacherId?: string;
}

export interface SearchResultLesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
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
}

export interface SearchResultTeacher {
  id: string;
  email: string;
  teacherProfile: {
    bio: string | null;
    pictureUrl: string | null;
  } | null;
}

export interface SearchResultArticle {
  id: string;
  title: string;
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
}

export interface SearchResponse {
  success: boolean;
  query: string | undefined;
  filters: SearchFilters;
  results: {
    lessons: SearchResultLesson[];
    teachers: SearchResultTeacher[];
    articles: SearchResultArticle[];
    resources: SearchResultResource[];
  };
}

export interface SearchSuggestions {
  teachers: { type: string; id: string; name: string }[];
  articles: { type: string; id: string; title: string }[];
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

  return api.get(`/search?${params.toString()}`);
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(query: string): Promise<SearchSuggestionsResponse> {
  const params = new URLSearchParams();
  params.append('q', query);

  return api.get(`/search/suggestions?${params.toString()}`);
}

/**
 * Get available filter options
 */
export async function getSearchFilters(): Promise<SearchFiltersResponse> {
  return api.get('/search/filters');
}
