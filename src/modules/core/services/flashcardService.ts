/**
 * Flashcard Service
 * Handles API calls to backend flashcard endpoints
 */

import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
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
  const url = `${API_BASE_URL}/flashcards${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch flashcards');
  }

  return data;
}

/**
 * Get flashcards for a specific course (organized as deck)
 */
export async function getFlashcardsByCourse(courseId: string): Promise<FlashcardDeck> {
  const response = await fetch(`${API_BASE_URL}/flashcards/course/${courseId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch course flashcards');
  }

  return data;
}

/**
 * Get flashcards for a specific lesson
 */
export async function getFlashcardsByLesson(lessonId: string): Promise<FlashcardListItem[]> {
  const response = await fetch(`${API_BASE_URL}/flashcards/lesson/${lessonId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lesson flashcards');
  }

  return data.flashcards;
}

/**
 * Get flashcard by ID
 */
export async function getFlashcardById(id: string): Promise<Flashcard> {
  const response = await fetch(`${API_BASE_URL}/flashcards/${id}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch flashcard');
  }

  return data.flashcard;
}

/**
 * Create a new flashcard (Teacher/Admin only)
 */
export async function createFlashcard(flashcardData: CreateFlashcardData): Promise<Flashcard> {
  const response = await fetch(`${API_BASE_URL}/flashcards`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(flashcardData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to create flashcard');
  }

  return data.flashcard;
}

/**
 * Create multiple flashcards at once (Teacher/Admin only)
 */
export async function createBulkFlashcards(flashcards: CreateFlashcardData[]): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/flashcards/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ flashcards }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to create flashcards');
  }

  return data.count;
}

/**
 * Update a flashcard (Teacher/Admin only)
 */
export async function updateFlashcard(id: string, flashcardData: Partial<CreateFlashcardData>): Promise<Flashcard> {
  const response = await fetch(`${API_BASE_URL}/flashcards/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(flashcardData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to update flashcard');
  }

  return data.flashcard;
}

/**
 * Delete a flashcard (Teacher/Admin only)
 */
export async function deleteFlashcard(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/flashcards/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to delete flashcard');
  }
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
  const response = await fetch(`${API_BASE_URL}/flashcards/study/prompts/${lessonId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch study prompts');
  }

  return data;
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
  const response = await fetch(`${API_BASE_URL}/flashcards/study/prompts/article/${articleId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch study prompts');
  }

  return data;
}
