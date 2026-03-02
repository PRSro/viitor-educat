/**
 * Lesson Service
 * Handles API calls to backend lesson endpoints
 */

import { api } from '@/lib/apiClient';

export interface Lesson {
  id: string;
  slug: string;
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
  attachmentUrl?: string;
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  attachmentUrl?: string;
}

/**
 * Get public lessons (part of published courses)
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
 * Create a new standalone lesson (private by default)
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

/**
 * Get courses containing a lesson
 */
export async function getLessonCourses(lessonId: string): Promise<unknown[]> {
  const data = await api.get<{ courses: unknown[] }>(`/lessons/${lessonId}/courses`);
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
  lessonId: string;
  lessonSlug: string;
  completed: boolean;
  nextLesson: { id: string; slug: string; title: string; order: number } | null;
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
  isAuthenticated: boolean;
  navigation: {
    nextLesson: { id: string; slug: string; title: string; order: number } | null;
    previousLesson: { id: string; slug: string; title: string; order: number } | null;
  };
}

export async function completeLesson(lessonId: string): Promise<LessonCompleteResponse> {
  return api.post(`/lessons/${lessonId}/complete`, {});
}

export async function getLessonProgress(lessonId: string): Promise<LessonProgress> {
  return api.get(`/lessons/${lessonId}/progress`);
}

export async function viewLesson(lessonId: string): Promise<LessonViewResponse> {
  return api.get(`/lessons/${lessonId}/view`);
}
