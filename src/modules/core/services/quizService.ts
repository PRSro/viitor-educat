/**
 * Quiz Service
 * Handles API calls for quiz functionality
 */

import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  lessonId?: string;
  courseId?: string;
  published: boolean;
  timeLimit?: number;
  passingScore: number;
  teacher: {
    id: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
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
    courseId?: string;
    course?: {
      title: string;
    };
  };
}

export interface CreateQuizData {
  title: string;
  description?: string;
  lessonId?: string;
  courseId?: string;
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

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'ngrok-skip-browser-warning': 'true',
  };
}

/**
 * Get all quizzes (published for students, all for teachers)
 */
export async function getQuizzes(options?: {
  courseId?: string;
  lessonId?: string;
  published?: boolean;
}): Promise<Quiz[]> {
  const params = new URLSearchParams();
  if (options?.courseId) params.append('courseId', options.courseId);
  if (options?.lessonId) params.append('lessonId', options.lessonId);
  if (options?.published !== undefined) params.append('published', String(options.published));

  const queryString = params.toString();
  const url = `${API_BASE_URL}/quizzes${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch quizzes');
  }

  return data.quizzes;
}

/**
 * Get quizzes created by current teacher
 */
export async function getTeacherQuizzes(): Promise<Quiz[]> {
  const response = await fetch(`${API_BASE_URL}/quizzes/teacher/my-quizzes`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch teacher quizzes');
  }

  return data.quizzes;
}

/**
 * Get quiz by ID
 */
export async function getQuizById(id: string): Promise<Quiz> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch quiz');
  }

  return data.quiz;
}

/**
 * Create a new quiz
 */
export async function createQuiz(quizData: CreateQuizData): Promise<Quiz> {
  const response = await fetch(`${API_BASE_URL}/quizzes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(quizData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create quiz');
  }

  return data.quiz;
}

/**
 * Update a quiz
 */
export async function updateQuiz(id: string, quizData: Partial<CreateQuizData>): Promise<Quiz> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(quizData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update quiz');
  }

  return data.quiz;
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete quiz');
  }
}

/**
 * Add a question to a quiz
 */
export async function addQuizQuestion(quizId: string, questionData: CreateQuestionData): Promise<QuizQuestion> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(questionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to add question');
  }

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
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions/${questionId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(questionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update question');
  }

  return data.question;
}

/**
 * Delete a question
 */
export async function deleteQuizQuestion(quizId: string, questionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions/${questionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete question');
  }
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
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/attempt`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(attemptData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit quiz attempt');
  }

  return data;
}

/**
 * Get quiz attempts
 */
export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/attempts`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch quiz attempts');
  }

  return data.attempts;
}

/**
 * Get current student's quiz attempts
 */
export async function getStudentQuizAttempts(): Promise<QuizAttempt[]> {
  const response = await fetch(`${API_BASE_URL}/quizzes/student/my-attempts`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch student quiz attempts');
  }

  return data.attempts;
}
