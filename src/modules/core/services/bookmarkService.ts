/**
 * Bookmark Service
 * Handles API calls for bookmark functionality
 */

import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
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
  const url = `${API_BASE_URL}/bookmarks${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch bookmarks');
  }

  return data;
}

/**
 * Get a single bookmark by ID
 */
export async function getBookmarkById(id: string): Promise<Bookmark> {
  const response = await fetch(`${API_BASE_URL}/bookmarks/${id}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch bookmark');
  }

  return data.bookmark;
}

/**
 * Create a new bookmark
 */
export async function createBookmark(bookmarkData: CreateBookmarkData): Promise<Bookmark> {
  const response = await fetch(`${API_BASE_URL}/bookmarks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(bookmarkData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create bookmark');
  }

  return data.bookmark;
}

/**
 * Update a bookmark
 */
export async function updateBookmark(id: string, bookmarkData: Partial<CreateBookmarkData>): Promise<Bookmark> {
  const response = await fetch(`${API_BASE_URL}/bookmarks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(bookmarkData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update bookmark');
  }

  return data.bookmark;
}

/**
 * Delete a bookmark
 */
export async function deleteBookmark(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/bookmarks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete bookmark');
  }
}

/**
 * Check if a resource is bookmarked
 */
export async function checkBookmark(resourceType: string, resourceId: string): Promise<{
  isBookmarked: boolean;
  bookmarkId: string | null;
}> {
  const response = await fetch(
    `${API_BASE_URL}/bookmarks/check/${resourceType}/${resourceId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to check bookmark');
  }

  return data;
}

/**
 * Toggle bookmark status for a resource
 */
export async function toggleBookmark(bookmarkData: CreateBookmarkData): Promise<{
  isBookmarked: boolean;
  bookmark?: Bookmark;
}> {
  const response = await fetch(`${API_BASE_URL}/bookmarks/toggle`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(bookmarkData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to toggle bookmark');
  }

  return data;
}
