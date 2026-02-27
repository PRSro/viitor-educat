import { getToken } from '@/modules/core/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type ResourceType = 'YOUTUBE' | 'LINK' | 'PDF' | 'DOCUMENT';

export interface ResourceListItem {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  courseId?: string;
  course?: {
    id: string;
    title: string;
  };
  lessonId?: string;
  lesson?: {
    id: string;
    title: string;
  };
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceData {
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  courseId?: string;
  lessonId?: string;
  thumbnailUrl?: string;
}

export interface UpdateResourceData extends Partial<CreateResourceData> {
  id: string;
}

export const resourceTypeLabels: Record<ResourceType, string> = {
  YOUTUBE: 'YouTube',
  LINK: 'Link',
  PDF: 'PDF',
  DOCUMENT: 'Document',
};

export const resourceTypeColors: Record<ResourceType, string> = {
  YOUTUBE: 'bg-red-500',
  LINK: 'bg-blue-500',
  PDF: 'bg-orange-500',
  DOCUMENT: 'bg-gray-500',
};

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function getResources(courseId?: string, lessonId?: string): Promise<ResourceListItem[]> {
  let url = `${API_BASE_URL}/resources`;
  const params = new URLSearchParams();
  
  if (courseId) params.append('courseId', courseId);
  if (lessonId) params.append('lessonId', lessonId);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch resources');
  }

  return data.resources || data;
}

export async function getResource(id: string): Promise<ResourceListItem> {
  const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch resource');
  }

  return data.resource || data;
}

export async function createResource(data: CreateResourceData): Promise<ResourceListItem> {
  const response = await fetch(`${API_BASE_URL}/resources`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create resource');
  }

  return result.resource || result;
}

export async function updateResource(id: string, data: Partial<CreateResourceData>): Promise<ResourceListItem> {
  const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update resource');
  }

  return result.resource || result;
}

export async function deleteResource(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete resource');
  }
}
