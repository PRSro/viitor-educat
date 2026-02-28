/**
 * External Resource Service
 * Handles API calls to backend resource endpoints
 */

import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type ResourceType = 'YOUTUBE' | 'LINK' | 'PDF' | 'DOCUMENT';

export interface ExternalResource {
  id: string;
  type: ResourceType;
  url: string;
  title: string;
  description?: string;
  lessonId?: string;
  courseId?: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  lesson?: {
    id: string;
    title: string;
  };
  teacher?: {
    id: string;
    email: string;
  };
}

export interface ResourceListItem {
  id: string;
  type: ResourceType;
  url: string;
  title: string;
  description?: string;
  lessonId?: string;
  courseId?: string;
  teacherId: string;
  createdAt: string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  lesson?: {
    id: string;
    title: string;
  };
  teacher?: {
    id: string;
    email: string;
  };
}

export interface ResourcesResponse {
  resources: ResourceListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ResourceFilters {
  type?: ResourceType;
  courseId?: string;
  lessonId?: string;
  teacherId?: string;
  page?: number;
  limit?: number;
}

export interface CreateResourceData {
  type: ResourceType;
  url: string;
  title: string;
  description?: string;
  lessonId?: string;
  courseId?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'ngrok-skip-browser-warning': 'true',
  };
}

/**
 * Fetch resources with optional filters
 */
export async function getResources(filters?: ResourceFilters): Promise<ResourcesResponse> {
  const params = new URLSearchParams();
  
  if (filters?.type) params.set('type', filters.type);
  if (filters?.courseId) params.set('courseId', filters.courseId);
  if (filters?.lessonId) params.set('lessonId', filters.lessonId);
  if (filters?.teacherId) params.set('teacherId', filters.teacherId);
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.limit) params.set('limit', filters.limit.toString());
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/resources${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch resources');
  }

  return data;
}

/**
 * Get resources for a specific course
 */
export async function getResourcesByCourse(courseId: string): Promise<ResourceListItem[]> {
  const response = await fetch(`${API_BASE_URL}/resources/course/${courseId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch course resources');
  }

  return data.resources;
}

/**
 * Get resources for a specific lesson
 */
export async function getResourcesByLesson(lessonId: string): Promise<ResourceListItem[]> {
  const response = await fetch(`${API_BASE_URL}/resources/lesson/${lessonId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lesson resources');
  }

  return data.resources;
}

/**
 * Get resources by a specific teacher
 */
export async function getResourcesByTeacher(teacherId: string): Promise<ResourceListItem[]> {
  const response = await fetch(`${API_BASE_URL}/resources/teacher/${teacherId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch teacher resources');
  }

  return data.resources;
}

/**
 * Get resource by ID
 */
export async function getResourceById(id: string): Promise<ExternalResource> {
  const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch resource');
  }

  return data.resource;
}

/**
 * Get available resource types
 */
export async function getResourceTypes(): Promise<ResourceType[]> {
  const response = await fetch(`${API_BASE_URL}/resources/types`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch resource types');
  }

  return data.types;
}

/**
 * Create a new resource (Teacher/Admin only)
 */
export async function createResource(resourceData: CreateResourceData): Promise<ExternalResource> {
  const response = await fetch(`${API_BASE_URL}/resources`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(resourceData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to create resource');
  }

  return data.resource;
}

/**
 * Update a resource (Teacher/Admin only)
 */
export async function updateResource(id: string, resourceData: Partial<CreateResourceData>): Promise<ExternalResource> {
  const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(resourceData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to update resource');
  }

  return data.resource;
}

/**
 * Delete a resource (Teacher/Admin only)
 */
export async function deleteResource(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to delete resource');
  }
}

// Helper functions
export const resourceTypeLabels: Record<ResourceType, string> = {
  YOUTUBE: 'YouTube Video',
  LINK: 'External Link',
  PDF: 'PDF Document',
  DOCUMENT: 'Document',
};

export const resourceTypeIcons: Record<ResourceType, string> = {
  YOUTUBE: 'youtube',
  LINK: 'link',
  PDF: 'file-text',
  DOCUMENT: 'file',
};

export const resourceTypeColors: Record<ResourceType, string> = {
  YOUTUBE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  LINK: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  PDF: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  DOCUMENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};
