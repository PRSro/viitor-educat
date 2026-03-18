/**
 * Lesson Service
 * Handles API calls to backend lesson endpoints
 */

import { api } from '@/lib/apiClient';

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content: string;
  status: 'DRAFT' | 'PRIVATE' | 'PUBLIC';
  order?: number;
  teacherId: string;
  teacher: {
    id: string;
    email: string;
  };
  attachmentUrl?: string;
  externalResources?: {
    id: string;
    type: string;
    url: string;
    title: string;
    description: string | null;
  }[];
  flashcards?: {
    id: string;
    question: string;
    answer: string;
  }[];
  questions?: {
    id: string;
    prompt: string;
    questionType: 'SHORT_ANSWER' | 'MULTIPLE_CHOICE';
    correctAnswer?: string;
    hint?: string;
    order: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonData {
  title: string;
  description?: string;
  content: string;
  order?: number;
  status?: 'DRAFT' | 'PRIVATE' | 'PUBLIC';
  attachmentUrl?: string;
  questions?: { prompt: string; type: 'SHORT_ANSWER' | 'MULTIPLE_CHOICE'; correctAnswer?: string; hint?: string }[];
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  attachmentUrl?: string;
  status?: 'DRAFT' | 'PRIVATE' | 'PUBLIC';
  order?: number;
}

/**
 * Get public lessons
 */
export async function getLessons(): Promise<Lesson[]> {
  const data = await api.get<{ lessons: Lesson[] }>('/lessons');
  return data.lessons;
}

/**
 * Get teacher's private lessons
 */
export async function getPrivateLessons(): Promise<Lesson[]> {
  const data = await api.get<{ lessons: Lesson[] }>('/lessons/private');
  return data.lessons;
}

/**
 * Get lessons for a specific teacher
 */
export async function getTeacherLessons(teacherId: string): Promise<Lesson[]> {
  const data = await api.get<{ lessons: Lesson[] }>(`/lessons/teacher/${teacherId}`);
  return data.lessons;
}

/**
 * Get a single lesson by ID
 */
export async function getLesson(id: string): Promise<{ lesson: Lesson; isTeacher: boolean }> {
  return api.get(`/lessons/${id}`);
}

/**
 * Create a new standalone lesson
 */
export async function createLesson(lessonData: CreateLessonData): Promise<Lesson> {
  const data = await api.post<{ lesson: Lesson }>('/lessons', lessonData);
  return data.lesson;
}

/**
 * Update a lesson
 */
export async function updateLesson(id: string, lessonData: UpdateLessonData): Promise<Lesson> {
  const data = await api.put<{ lesson: Lesson }>(`/lessons/${id}`, lessonData);
  return data.lesson;
}

/**
 * Delete a lesson
 */
export async function deleteLesson(id: string): Promise<void> {
  await api.delete(`/lessons/${id}`);
}

export interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  progress: number;
  completedAt: string | null;
  isCompleted: boolean;
}

export interface LessonCompleteResponse {
  lessonId: string;
  completed: boolean;
  nextLesson: { id: string; title: string; order: number } | null;
}

export interface LessonViewResponse {
  lesson: Lesson;
  isCompleted: boolean;
  completedAt: string | null;
  isAuthenticated: boolean;
  navigation: {
    nextLesson: { id: string; title: string; order: number } | null;
    previousLesson: { id: string; title: string; order: number } | null;
  };
}

export async function completeLesson(lessonId: string): Promise<LessonCompleteResponse> {
  return api.post(`/lessons/${lessonId}/complete`, {});
}


export async function viewLesson(lessonId: string): Promise<LessonViewResponse> {
  return api.get(`/lessons/${lessonId}/view`);
}

export async function submitAnswer(lessonId: string, questionId: string, answer: string): Promise<{ success: boolean; correct: boolean | null; correctAnswer?: string; hint?: string }> {
  return api.post(`/lessons/${lessonId}/questions/${questionId}/answer`, { answer });
}
