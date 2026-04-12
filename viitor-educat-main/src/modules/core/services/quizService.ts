/**
 * Quiz Service
 * Handles API calls for quiz functionality
 */

import { api } from '@/lib/apiClient';
import { API_PATHS } from '@/lib/apiPaths';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  lessonId?: string;
  published: boolean;
  timeLimit?: number;
  passingScore: number;
  teacher: {
    id: string;
    email: string;
  };
  lesson?: {
    id: string;
    title: string;
  };
  questions: QuizQuestion[];
  _count?: {
    questions: number;
    attempts: number;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options: string[];
  correctAnswer?: string;
  explanation?: string;
  order: number;
  points: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  answers: string;
  timeSpent: number;
  completedAt: string;
  student?: {
    id: string;
    email: string;
  };
  quiz?: {
    id: string;
    title: string;
  };
}

export interface CreateQuizData {
  title: string;
  description?: string;
  lessonId?: string;
  published?: boolean;
  timeLimit?: number;
  passingScore?: number;
}

export interface CreateQuestionData {
  question: string;
  type?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  order?: number;
  points?: number;
}

export interface SubmitAttemptData {
  answers: Record<string, string>;
  timeSpent: number;
}

/**
 * Get all quizzes
 */
export async function getQuizzes(options?: {
  lessonId?: string;
  published?: boolean;
}): Promise<Quiz[]> {
  const params = new URLSearchParams();
  if (options?.lessonId) params.append('lessonId', options.lessonId);
  if (options?.published !== undefined) params.append('published', String(options.published));

  const queryString = params.toString();
  const data = await api.get<{ quizzes: Quiz[] }>(`${API_PATHS.QUIZZES}${queryString ? '?' + queryString : ''}`);
  return data.quizzes;
}

/**
 * Get quizzes created by current teacher
 */
export async function getTeacherQuizzes(): Promise<Quiz[]> {
  const data = await api.get<{ quizzes: Quiz[] }>(API_PATHS.QUIZZES_TEACHER);
  return data.quizzes;
}

/**
 * Get quiz by ID
 */
export async function getQuizById(id: string): Promise<Quiz> {
  const data = await api.get<{ quiz: Quiz }>(API_PATHS.QUIZ(id));
  return data.quiz;
}

/**
 * Create a new quiz
 */
export async function createQuiz(quizData: CreateQuizData): Promise<Quiz> {
  const data = await api.post<{ quiz: Quiz }>(API_PATHS.QUIZZES, quizData);
  return data.quiz;
}

/**
 * Update a quiz
 */
export async function updateQuiz(id: string, quizData: Partial<CreateQuizData>): Promise<Quiz> {
  const data = await api.put<{ quiz: Quiz }>(API_PATHS.QUIZ(id), quizData);
  return data.quiz;
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(id: string): Promise<void> {
  await api.delete(API_PATHS.QUIZ(id));
}

/**
 * Add a question to a quiz
 */
export async function addQuizQuestion(quizId: string, questionData: CreateQuestionData): Promise<QuizQuestion> {
  const data = await api.post<{ question: QuizQuestion }>(`${API_PATHS.QUIZ(quizId)}/questions`, questionData);
  return data.question;
}

/**
 * Update a question
 */
export async function updateQuizQuestion(
  quizId: string,
  questionId: string,
  questionData: Partial<CreateQuestionData>
): Promise<QuizQuestion> {
  const data = await api.put<{ question: QuizQuestion }>(`${API_PATHS.QUIZ(quizId)}/questions/${questionId}`, questionData);
  return data.question;
}

/**
 * Delete a question
 */
export async function deleteQuizQuestion(quizId: string, questionId: string): Promise<void> {
  await api.delete(`${API_PATHS.QUIZ(quizId)}/questions/${questionId}`);
}

/**
 * Submit a quiz attempt
 */
export async function submitQuizAttempt(quizId: string, attemptData: SubmitAttemptData): Promise<{
  message: string;
  attempt: {
    id: string;
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    timeSpent: number;
  };
}> {
  return api.post(API_PATHS.QUIZ_ATTEMPT(quizId), attemptData);
}

/**
 * Get quiz attempts
 */
export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const data = await api.get<{ attempts: QuizAttempt[] }>(`${API_PATHS.QUIZ(quizId)}/attempts`);
  return data.attempts;
}

/**
 * Get current student's quiz attempts
 */
export async function getStudentQuizAttempts(): Promise<QuizAttempt[]> {
  const data = await api.get<{ attempts: QuizAttempt[] }>(API_PATHS.QUIZ_ATTEMPTS_STUDENT);
  return data.attempts;
}
