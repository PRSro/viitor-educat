/**
 * Auth Service
 * Handles API calls to backend auth endpoints
 */

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
