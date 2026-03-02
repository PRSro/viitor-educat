/**
 * Flashcard Service
 * Handles API calls to backend flashcard endpoints
 */

import { api } from '@/lib/apiClient';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  lessonId?: string;
  courseId?: string;
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
}

export interface FlashcardListItem {
  id: string;
  question: string;
  answer: string;
  lessonId?: string;
  courseId?: string;
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
}

export interface FlashcardsResponse {
  flashcards: FlashcardListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FlashcardDeck {
  flashcards: FlashcardListItem[];
  groupedByLesson: Record<string, FlashcardListItem[]>;
  totalCount: number;
}

export interface FlashcardFilters {
  courseId?: string;
  lessonId?: string;
  page?: number;
  limit?: number;
}

export interface CreateFlashcardData {
  question: string;
  answer: string;
  lessonId?: string;
  courseId?: string;
}

export interface StudyPrompt {
  id: string;
  question: string;
  topic: string;
  lessonId?: string;
  courseId?: string;
  courseTitle?: string;
  articleId?: string;
  category?: string;
}

/**
 * Fetch flashcards with optional filters
 */
export async function getFlashcards(filters?: FlashcardFilters): Promise<FlashcardsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.courseId) params.set('courseId', filters.courseId);
  if (filters?.lessonId) params.set('lessonId', filters.lessonId);
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.limit) params.set('limit', filters.limit.toString());
  
  const queryString = params.toString();
  return api.get(`/flashcards${queryString ? `?${queryString}` : ''}`);
}

/**
 * Get flashcards for a specific course (organized as deck)
 */
export async function getFlashcardsByCourse(courseId: string): Promise<FlashcardDeck> {
  return api.get(`/flashcards/course/${courseId}`);
}

/**
 * Get flashcards for a specific lesson
 */
export async function getFlashcardsByLesson(lessonId: string): Promise<FlashcardListItem[]> {
  const data = await api.get<{ flashcards: FlashcardListItem[] }>(`/flashcards/lesson/${lessonId}`);
  return data.flashcards;
}

/**
 * Get flashcard by ID
 */
export async function getFlashcardById(id: string): Promise<Flashcard> {
  const data = await api.get<{ flashcard: Flashcard }>(`/flashcards/${id}`);
  return data.flashcard;
}

/**
 * Create a new flashcard (Teacher/Admin only)
 */
export async function createFlashcard(flashcardData: CreateFlashcardData): Promise<Flashcard> {
  const data = await api.post<{ flashcard: Flashcard }>('/flashcards', flashcardData);
  return data.flashcard;
}

/**
 * Create multiple flashcards at once (Teacher/Admin only)
 */
export async function createBulkFlashcards(flashcards: CreateFlashcardData[]): Promise<number> {
  const data = await api.post<{ count: number }>('/flashcards/bulk', { flashcards });
  return data.count;
}

/**
 * Update a flashcard (Teacher/Admin only)
 */
export async function updateFlashcard(id: string, flashcardData: Partial<CreateFlashcardData>): Promise<Flashcard> {
  const data = await api.put<{ flashcard: Flashcard }>(`/flashcards/${id}`, flashcardData);
  return data.flashcard;
}

/**
 * Delete a flashcard (Teacher/Admin only)
 */
export async function deleteFlashcard(id: string): Promise<void> {
  await api.delete(`/flashcards/${id}`);
}

/**
 * Get study prompts for a lesson (placeholder logic)
 * TODO: Implement AI-powered prompt generation
 */
export async function getStudyPromptsByLesson(lessonId: string): Promise<{
  prompts: StudyPrompt[];
  lesson: { id: string; title: string };
  message: string;
}> {
  return api.get(`/flashcards/study/prompts/${lessonId}`);
}

/**
 * Get study prompts for an article (placeholder logic)
 * TODO: Implement AI-powered prompt generation
 */
export async function getStudyPromptsByArticle(articleId: string): Promise<{
  prompts: StudyPrompt[];
  article: { id: string; title: string; category: string };
  message: string;
}> {
  return api.get(`/flashcards/study/prompts/article/${articleId}`);
}
