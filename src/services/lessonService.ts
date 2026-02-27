import { getToken } from '@/modules/core/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type LessonType = 'VIDEO' | 'TEXT' | 'MARKDOWN' | 'EXTERNAL_LINK' | 'QUIZ';

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: LessonType;
  courseId: string;
  course?: {
    id: string;
    title: string;
  };
  order: number;
  duration?: number;
  videoUrl?: string;
  externalUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonData {
  title: string;
  description?: string;
  content?: string;
  type: LessonType;
  courseId: string;
  order?: number;
  duration?: number;
  videoUrl?: string;
  externalUrl?: string;
  isPublished?: boolean;
}

export interface UpdateLessonData extends Partial<CreateLessonData> {
  id: string;
}

export interface LessonViewResponse {
  lesson: Lesson;
  nextLesson?: Lesson;
  previousLesson?: Lesson;
  isCompleted?: boolean;
}

export interface LessonCompleteResponse {
  lessonId: string;
  completed: boolean;
  nextLesson?: Lesson;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function getLesson(lessonId: string): Promise<Lesson> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lesson');
  }

  return data.lesson || data;
}

export async function getLessons(courseId: string): Promise<Lesson[]> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lessons');
  }

  return data.lessons || data;
}

export async function createLesson(data: CreateLessonData): Promise<Lesson> {
  const response = await fetch(`${API_BASE_URL}/lessons`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create lesson');
  }

  return result.lesson || result;
}

export async function updateLesson(id: string, data: Partial<CreateLessonData>): Promise<Lesson> {
  const response = await fetch(`${API_BASE_URL}/lessons/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update lesson');
  }

  return result.lesson || result;
}

export async function deleteLesson(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/lessons/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete lesson');
  }
}

export async function viewLesson(lessonId: string): Promise<LessonViewResponse> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/view`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to view lesson');
  }

  return data;
}

export async function completeLesson(lessonId: string): Promise<LessonCompleteResponse> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to complete lesson');
  }

  return data;
}
