/**
 * Auth Service
 * Handles API calls to backend auth endpoints
 */

import { api, API_BASE_URL } from '@/lib/apiClient';
import { API_PATHS } from '@/lib/apiPaths';
import type { ArticleListItem } from '@/modules/articles/services/articleService';

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
 */
export async function register(
  email: string,
  password: string,
  role: 'STUDENT' | 'TEACHER'
): Promise<AuthResponse> {
  return api.post<AuthResponse>(API_PATHS.AUTH_REGISTER, { email, password, role });
}

/**
 * Login user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>(API_PATHS.AUTH_LOGIN, { email, password });
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
  school?: { name: string } | null;
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
  return api.get(API_PATHS.PROFILE);
}

/**
 * Get teacher profile by ID (public for students)
 */
export interface TeacherLesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: string;
}

export async function getTeacherProfile(teacherId: string): Promise<{ 
  teacher: User; 
  profile: TeacherProfile | null; 
}> {
  return api.get(API_PATHS.PROFILE_TEACHER(teacherId));
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
  _count?: {
    articles: number;
    lessons: number;
  };
}

/**
 * Get all teachers with their profiles
 */
export async function getAllTeachers(): Promise<TeacherWithProfile[]> {
  const data = await api.get<{ teachers: TeacherWithProfile[] }>(API_PATHS.PROFILE_TEACHERS);
  return data.teachers;
}

/**
 * Get teacher's published articles
 */
export async function getTeacherArticles(teacherId: string): Promise<ArticleListItem[]> {
  const data = await api.get<{ articles: ArticleListItem[] }>(API_PATHS.PROFILE_TEACHER_ARTICLES(teacherId));
  return data.articles;
}

/**
 * Get teacher's published lessons
 */
export async function getTeacherLessons(teacherId: string): Promise<TeacherLesson[]> {
  const data = await api.get<{ lessons: TeacherLesson[] }>(API_PATHS.PROFILE_TEACHER_LESSONS(teacherId));
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
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to upload lesson material');
  }

  return data;
}
