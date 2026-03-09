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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
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
  lessonId?: string;
  page?: number;
  limit?: number;
}

export interface CreateFlashcardData {
  question: string;
  answer: string;
  lessonId?: string;
}

export interface StudyPrompt {
  id: string;
  question: string;
  topic: string;
  lessonId?: string;
  articleId?: string;
  category?: string;
}

/**
 * Fetch flashcards with optional filters
 */
export async function getFlashcards(filters?: FlashcardFilters): Promise<FlashcardsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.lessonId) params.set('lessonId', filters.lessonId);
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.limit) params.set('limit', filters.limit.toString());
  
  const queryString = params.toString();
  return api.get(`/flashcards${queryString ? `?${queryString}` : ''}`);
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
 * Get study prompts for a lesson
 */
export async function getStudyPromptsByLesson(lessonId: string): Promise<{
  prompts: StudyPrompt[];
  lesson: { id: string; title: string };
  message: string;
}> {
  return api.get(`/flashcards/study/prompts/${lessonId}`);
}

/**
 * Get study prompts for an article
 */
export async function getStudyPromptsByArticle(articleId: string): Promise<{
  prompts: StudyPrompt[];
  article: { id: string; title: string; category: string };
  message: string;
}> {
  return api.get(`/flashcards/study/prompts/article/${articleId}`);
}
