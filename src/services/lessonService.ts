/**
 * Lesson Service
 * Handles API calls to backend lesson endpoints
 */

import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content: string;
  teacherId: string;
  courseId?: string | null;
  order: number;
  teacher: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonData {
  title: string;
  description?: string;
  content: string;
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
}

/**
 * Get authorization headers with JWT token
 */
function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/**
 * Fetch all lessons
 */
export async function getLessons(): Promise<Lesson[]> {
  const response = await fetch(`${API_BASE_URL}/lessons`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lessons');
  }

  return data.lessons;
}

/**
 * Fetch a single lesson by ID
 */
export async function getLesson(id: string): Promise<Lesson> {
  const response = await fetch(`${API_BASE_URL}/lessons/${id}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lesson');
  }

  return data.lesson;
}

/**
 * Create a new lesson (Teacher only)
 */
export async function createLesson(lessonData: CreateLessonData): Promise<Lesson> {
  const response = await fetch(`${API_BASE_URL}/lessons`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(lessonData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to create lesson');
  }

  return data.lesson;
}

/**
 * Update a lesson (Teacher only, own lessons)
 */
export async function updateLesson(id: string, lessonData: UpdateLessonData): Promise<Lesson> {
  const response = await fetch(`${API_BASE_URL}/lessons/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(lessonData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to update lesson');
  }

  return data.lesson;
}

/**
 * Delete a lesson (Teacher only, own lessons)
 */
export async function deleteLesson(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/lessons/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to delete lesson');
  }
}

export interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  progress: number;
  completedAt: string | null;
  isCompleted: boolean;
}

export interface LessonCompleteResponse {
  message: string;
  progress: number;
  completedAt: string | null;
}

/**
 * Mark a lesson as complete (Student enrolled in course)
 */
export async function completeLesson(lessonId: string): Promise<LessonCompleteResponse> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to complete lesson');
  }

  return data;
}

/**
 * Get lesson progress for current user (Student enrolled in course)
 */
export async function getLessonProgress(lessonId: string): Promise<LessonProgress> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/progress`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch lesson progress');
  }

  return data;
}
