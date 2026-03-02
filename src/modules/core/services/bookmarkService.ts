/**
 * Bookmark Service
 * Handles API calls for bookmark functionality
 */

import { api } from '@/lib/apiClient';

export interface Bookmark {
  id: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  title: string;
  url?: string;
  createdAt: string;
}

export interface BookmarkResponse {
  bookmarks: Bookmark[];
  total: number;
}

export interface CreateBookmarkData {
  resourceType: string;
  resourceId: string;
  title: string;
  url?: string;
}

/**
 * Get all bookmarks for current user
 */
export async function getBookmarks(options?: {
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<BookmarkResponse> {
  const params = new URLSearchParams();
  if (options?.type) params.append('type', options.type);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const queryString = params.toString();
  return api.get<BookmarkResponse>(`/bookmarks${queryString ? '?' + queryString : ''}`);
}

/**
 * Get a single bookmark by ID
 */
export async function getBookmarkById(id: string): Promise<Bookmark> {
  const data = await api.get<{ bookmark: Bookmark }>(`/bookmarks/${id}`);
  return data.bookmark;
}

/**
 * Create a new bookmark
 */
export async function createBookmark(bookmarkData: CreateBookmarkData): Promise<Bookmark> {
  const data = await api.post<{ bookmark: Bookmark }>('/bookmarks', bookmarkData);
  return data.bookmark;
}

/**
 * Update a bookmark
 */
export async function updateBookmark(id: string, bookmarkData: Partial<CreateBookmarkData>): Promise<Bookmark> {
  const data = await api.put<{ bookmark: Bookmark }>(`/bookmarks/${id}`, bookmarkData);
  return data.bookmark;
}

/**
 * Delete a bookmark
 */
export async function deleteBookmark(id: string): Promise<void> {
  await api.delete(`/bookmarks/${id}`);
}

/**
 * Delete a bookmark by resource
 */
export async function deleteBookmarkByResource(resourceType: string, resourceId: string): Promise<void> {
  await api.delete(`/bookmarks/by-resource/${resourceType}/${resourceId}`);
}

/**
 * Check if a resource is bookmarked
 */
export async function checkBookmark(resourceType: string, resourceId: string): Promise<{
  isBookmarked: boolean;
  bookmarkId: string | null;
}> {
  return api.get(`/bookmarks/check/${resourceType}/${resourceId}`);
}

/**
 * Toggle bookmark status for a resource
 */
export async function toggleBookmark(bookmarkData: CreateBookmarkData): Promise<{
  isBookmarked: boolean;
  bookmark?: Bookmark;
}> {
  return api.post('/bookmarks/toggle', bookmarkData);
}
