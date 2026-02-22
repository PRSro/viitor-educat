/**
 * Lesson Service
 * Handles API calls to backend lesson endpoints
 */

import { getToken } from '@/modules/core/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content: string;
  status: 'DRAFT' | 'PRIVATE' | 'PUBLIC';
  order?: number;
  courseId?: string | null;
  course?: {
    id: string;
    title: string;
    slug: string;
    published: boolean;
  } | null;
  teacherId: string;
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
  courseId?: string;
  order?: number;
  status?: 'DRAFT' | 'PRIVATE' | 'PUBLIC';
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/**
 * Get public lessons (part of published courses)
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
 * Get teacher's private lessons
 */
export async function getPrivateLessons(): Promise<Lesson[]> {
  const response = await fetch(`${API_BASE_URL}/lessons/private`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch private lessons');
  }

  return data.lessons;
}

/**
 * Get lessons for a specific teacher
 */
export async function getTeacherLessons(teacherId: string): Promise<Lesson[]> {
  const response = await fetch(`${API_BASE_URL}/lessons/teacher/${teacherId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch teacher lessons');
  }

  return data.lessons;
}

/**
 * Get a single lesson by ID
 */
export async function getLesson(id: string): Promise<{ lesson: Lesson; isTeacher: boolean }> {
  const response = await fetch(`${API_BASE_URL}/lessons/${id}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lesson');
  }

  return data;
}

/**
 * Create a new standalone lesson (private by default)
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
 * Update a lesson
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
 * Delete a lesson
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

/**
 * Get courses containing a lesson
 */
export async function getLessonCourses(lessonId: string): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/courses`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lesson courses');
  }

  return data.courses;
}

export interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  progress: number;
  completedLessonsCount: number;
  completedAt: string | null;
  isCompleted: boolean;
}

export interface LessonCompleteResponse {
  message: string;
  progress: number;
  completedLessonsCount: number;
  completedAt: string | null;
  isCourseCompleted: boolean;
}

export interface LessonViewResponse {
  lesson: Lesson & {
    course: {
      id: string;
      title: string;
      slug: string;
      published: boolean;
      teacherId: string;
    } | null;
  };
  isCompleted: boolean;
  completedAt: string | null;
  navigation: {
    nextLesson: { id: string; title: string; order: number } | null;
    previousLesson: { id: string; title: string; order: number } | null;
  };
}

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

export async function viewLesson(lessonId: string): Promise<LessonViewResponse> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/view`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to view lesson');
  }

  return data;
}
