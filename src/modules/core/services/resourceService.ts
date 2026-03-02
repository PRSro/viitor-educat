/**
 * External Resource Service
 * Handles API calls to backend resource endpoints
 */

import { api } from '@/lib/apiClient';

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
  return api.get(`/resources${queryString ? `?${queryString}` : ''}`);
}

/**
 * Get resources for a specific course
 */
export async function getResourcesByCourse(courseId: string): Promise<ResourceListItem[]> {
  const data = await api.get<{ resources: ResourceListItem[] }>(`/resources/course/${courseId}`);
  return data.resources;
}

/**
 * Get resources for a specific lesson
 */
export async function getResourcesByLesson(lessonId: string): Promise<ResourceListItem[]> {
  const data = await api.get<{ resources: ResourceListItem[] }>(`/resources/lesson/${lessonId}`);
  return data.resources;
}

/**
 * Get resources by a specific teacher
 */
export async function getResourcesByTeacher(teacherId: string): Promise<ResourceListItem[]> {
  const data = await api.get<{ resources: ResourceListItem[] }>(`/resources/teacher/${teacherId}`);
  return data.resources;
}

/**
 * Get resource by ID
 */
export async function getResourceById(id: string): Promise<ExternalResource> {
  const data = await api.get<{ resource: ExternalResource }>(`/resources/${id}`);
  return data.resource;
}

/**
 * Get available resource types
 */
export async function getResourceTypes(): Promise<ResourceType[]> {
  const data = await api.get<{ types: ResourceType[] }>('/resources/types');
  return data.types;
}

/**
 * Create a new resource (Teacher/Admin only)
 */
export async function createResource(resourceData: CreateResourceData): Promise<ExternalResource> {
  const data = await api.post<{ resource: ExternalResource }>('/resources', resourceData);
  return data.resource;
}

/**
 * Update a resource (Teacher/Admin only)
 */
export async function updateResource(id: string, resourceData: Partial<CreateResourceData>): Promise<ExternalResource> {
  const data = await api.put<{ resource: ExternalResource }>(`/resources/${id}`, resourceData);
  return data.resource;
}

/**
 * Delete a resource (Teacher/Admin only)
 */
export async function deleteResource(id: string): Promise<void> {
  await api.delete(`/resources/${id}`);
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
