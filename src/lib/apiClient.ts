/**
 * API Client with Error Handling
 * 
 * Centralized HTTP client that handles:
 * - Network errors (offline/timeout)
 * - Authentication errors (401/403)
 * - Server errors (5xx)
 * - Request logging for debugging
 */

import { getToken, logout } from '@/modules/core/services/authService';

export type ApiErrorType = 'offline' | 'unauthorized' | 'forbidden' | 'server' | 'unknown';

export class ApiError extends Error {
  type: ApiErrorType;
  status?: number;
  
  constructor(type: ApiErrorType, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Determine error type from status code or error
 */
function getErrorType(error: unknown, status?: number): ApiErrorType {
  // Network error (no response)
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'offline';
  }
  
  // Timeout
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'offline';
  }
  
  // HTTP status codes
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status && status >= 500) return 'server';
  
  return 'unknown';
}

/**
 * Create an AbortController with timeout
 */
function createTimeoutController(timeout: number = REQUEST_TIMEOUT): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

/**
 * Make an authenticated API request with error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  const controller = createTimeoutController();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    if (import.meta.env.DEV) {
      console.log(`[API] ${options.method || 'GET'} ${endpoint}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
      const errorType = getErrorType(null, response.status);
      const message = data?.error || data?.message || `Request failed with status ${response.status}`;
      
      if (import.meta.env.DEV) {
        console.error(`[API Error] ${response.status}: ${message}`);
      }
      
      // Auto-logout on 401
      if (response.status === 401) {
        logout();
      }
      
      throw new ApiError(errorType, message, response.status);
    }
    
    return data as T;
  } catch (error) {
    // Already an ApiError, rethrow
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or timeout error
    const errorType = getErrorType(error);
    const message = errorType === 'offline' 
      ? 'Unable to connect to server. Please check your connection.'
      : (error instanceof Error ? error.message : 'An unexpected error occurred');
    
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${errorType}: ${message}`);
    }
    throw new ApiError(errorType, message);
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, body: unknown) => 
    apiRequest<T>(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
  
  put: <T>(endpoint: string, body: unknown) => 
    apiRequest<T>(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }),
  
  delete: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

/**
 * Health check - test if API is reachable
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiRequest<{ status: string }>('/health');
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify session - validates token with server
 * Returns user data if valid, throws if invalid
 */
export interface VerifySessionResponse {
  user: {
    id: string;
    email: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  };
}

export async function verifySession(): Promise<VerifySessionResponse['user'] | null> {
  try {
    const response = await apiRequest<VerifySessionResponse>('/profile');
    return response.user;
  } catch (error) {
    if (error instanceof ApiError && error.type === 'unauthorized') {
      return null;
    }
    throw error;
  }
}
