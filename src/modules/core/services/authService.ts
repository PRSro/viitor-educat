/**
 * Auth Service
 * Handles API calls to backend auth endpoints
 */

import type { ArticleListItem } from '@/modules/articles/services/articleService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthError {
  error: string;
  message?: string;
}

/**
 * Register a new user
 * Note: ADMIN role cannot be self-registered for security reasons.
 * Admin users must be created directly in the database.
 */
export async function register(
  email: string,
  password: string,
  role: 'STUDENT' | 'TEACHER'
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ email, password, role }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  return data;
}

/**
 * Login user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data;
}

/**
 * Store auth token in localStorage
 */
export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Get stored auth token
 */
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Remove auth token
 */
export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

/**
 * Store user data in localStorage
 */
export function setUser(user: User): void {
  localStorage.setItem('auth_user', JSON.stringify(user));
}

/**
 * Get stored user data
 */
export function getUser(): User | null {
  const userData = localStorage.getItem('auth_user');
  return userData ? JSON.parse(userData) : null;
}

/**
 * Remove user data
 */
export function removeUser(): void {
  localStorage.removeItem('auth_user');
}

/**
 * Logout - clears all auth data
 */
export function logout(): void {
  removeToken();
  removeUser();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

export interface TeacherProfile {
  id: string;
  bio: string | null;
  pictureUrl: string | null;
  phone: string | null;
  office: string | null;
  officeHours: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileResponse {
  user: User;
  profile: TeacherProfile | null;
}

/**
 * Get current user profile from backend
 */
export async function getProfile(): Promise<ProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch profile');
  }

  return data;
}

/**
 * Get teacher profile by ID (public for students)
 */
export interface TeacherCourses {
  id: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  level?: string;
  status?: string;
  createdAt: string;
  lessons?: {
    id: string;
    title: string;
    description?: string | null;
    order: number;
    status: string;
  }[];
  _count?: {
    lessons: number;
    enrollments: number;
  };
}

export async function getTeacherProfile(teacherId: string): Promise<{ teacher: User; profile: TeacherProfile | null; courses: TeacherCourses[] }> {
  const response = await fetch(`${API_BASE_URL}/profile/${teacherId}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch teacher profile');
  }

  return data;
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/profile-picture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to upload profile picture');
  }

  return { url: data.url };
}

export interface TeacherWithProfile {
  id: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  teacherProfile: TeacherProfile | null;
  courses?: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    _count?: {
      lessons: number;
      enrollments: number;
    };
  }[];
}

/**
 * Get all teachers with their profiles (for student discovery)
 */
export async function getAllTeachers(): Promise<TeacherWithProfile[]> {
  const response = await fetch(`${API_BASE_URL}/profile/teachers`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch teachers');
  }

  return data.teachers;
}

/**
 * Get teacher's published articles (for public profile)
 */
export async function getTeacherArticles(teacherId: string): Promise<ArticleListItem[]> {
  const response = await fetch(`${API_BASE_URL}/profile/${teacherId}/articles`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch teacher articles');
  }

  return data.articles;
}

/**
 * Get teacher's published lessons (for public profile)
 */
export interface TeacherLesson {
  id: string;
  title: string;
  description: string | null;
  courseId: string | null;
  course?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  order: number;
  createdAt: string;
}

export async function getTeacherLessons(teacherId: string): Promise<TeacherLesson[]> {
  const response = await fetch(`${API_BASE_URL}/profile/${teacherId}/lessons`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch teacher lessons');
  }

  return data.lessons;
}

/**
 * Upload article file (.docx only)
 */
export async function uploadArticleFile(file: File): Promise<{ content: string; title: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/article`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to upload article file');
  }

  return data;
}

/**
 * Upload lesson material (.md only)
 */
export async function uploadLessonMaterial(file: File): Promise<{ content: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/lesson-material`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to upload lesson material');
  }

  return data;
}
