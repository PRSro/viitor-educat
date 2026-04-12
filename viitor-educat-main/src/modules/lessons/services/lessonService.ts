/**
 * Lesson Service
 * Handles API calls to backend lesson endpoints
 */

import { api } from '@/lib/apiClient';
import { API_PATHS } from '@/lib/apiPaths';

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
  questions?: { prompt: string; type: 'SHORT_ANSWER' | 'MULTIPLE_CHOICE'; correctAnswer?: string; hint?: string }[];
}

/**
 * Get public lessons
 */
export async function getLessons(): Promise<Lesson[]> {
  const data = await api.get<{ lessons: Lesson[] }>(API_PATHS.LESSONS);
  return data.lessons || [];
}

/**
 * Get teacher's private lessons
 */
export async function getPrivateLessons(): Promise<Lesson[]> {
  const data = await api.get<{ lessons: Lesson[] }>(API_PATHS.LESSONS_PRIVATE);
  return data.lessons || [];
}

/**
 * Get lessons for a specific teacher
 */
export async function getTeacherLessons(teacherId: string): Promise<Lesson[]> {
  const data = await api.get<{ lessons: Lesson[] }>(API_PATHS.LESSONS_TEACHER(teacherId));
  return data.lessons || [];
}

/**
 * Get a single lesson by ID
 */
export async function getLesson(id: string): Promise<{ lesson: Lesson; isTeacher: boolean }> {
  return api.get(API_PATHS.LESSON(id));
}

/**
 * Create a new standalone lesson
 */
export async function createLesson(lessonData: CreateLessonData): Promise<Lesson> {
  const data = await api.post<{ lesson: Lesson }>(API_PATHS.LESSONS, lessonData);
  return data.lesson;
}

/**
 * Update a lesson
 */
export async function updateLesson(id: string, lessonData: UpdateLessonData): Promise<Lesson> {
  const data = await api.patch<{ lesson: Lesson }>(API_PATHS.LESSON(id), lessonData);
  return data.lesson;
}

/**
 * Delete a lesson
 */
export async function deleteLesson(id: string): Promise<void> {
  await api.delete(API_PATHS.LESSON(id));
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
  return api.post(API_PATHS.LESSON_COMPLETE(lessonId), {});
}

export async function viewLesson(lessonId: string): Promise<LessonViewResponse> {
  return api.get(API_PATHS.LESSON_VIEW(lessonId));
}

export async function submitAnswer(lessonId: string, questionId: string, answer: string): Promise<{ success: boolean; correct: boolean | null; correctAnswer?: string; hint?: string }> {
  return api.post(API_PATHS.LESSON_ANSWER(lessonId, questionId), { answer });
}

/**
 * Get enrolled lessons for student dashboard
 */
export async function getEnrolledLessons(): Promise<Lesson[]> {
  try {
    const data = await api.get<{ lessons: Lesson[] }>(API_PATHS.LESSONS);
    return data.lessons || [];
  } catch {
    return [];
  }
}

export type LessonListItem = Pick<Lesson, 'id' | 'title' | 'description' | 'status' | 'createdAt'>;
