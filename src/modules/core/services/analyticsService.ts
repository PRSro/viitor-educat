/**
 * Analytics Service
 * Handles API calls for analytics functionality
 */

import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface OverviewAnalytics {
  users: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
  };
  courses: {
    total: number;
    published: number;
    drafts: number;
    totalEnrollments: number;
    completionRate: number;
  };
  content: {
    lessons: number;
    articles: number;
    flashcards: number;
  };
  recentActivity: {
    enrollmentsLast90Days: number;
    coursesCreatedLast90Days: number;
  };
}

export interface TrendData {
  date: string;
  enrollments: number;
  lessonsCompleted: number;
  usersCreated: number;
}

export interface CourseAnalytics {
  id: string;
  title: string;
  published: boolean;
  teacher: {
    id: string;
    email: string;
  };
  totalEnrollments: number;
  totalLessons: number;
  averageProgress: number;
  completionRate: number;
}

export interface TeacherAnalytics {
  id: string;
  email: string;
  profile: {
    id: string;
    bio: string | null;
    pictureUrl: string | null;
  } | null;
  totalCourses: number;
  totalLessons: number;
  totalEnrollments: number;
}

export interface StudentAnalytics {
  id: string;
  email: string;
  profile: {
    id: string;
    bio: string | null;
    avatarUrl: string | null;
  } | null;
  enrolledCourses: number;
  averageProgress: number;
  completedCourses: number;
  quizAttempts: number;
  bookmarks: number;
  joinedAt: string;
}

export interface TeacherOverview {
  courses: {
    total: number;
    published: number;
    drafts: number;
  };
  lessons: number;
  students: number;
  averageProgress: number;
  completionRate: number;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/**
 * Get platform-wide overview analytics (Admin only)
 */
export async function getOverviewAnalytics(period?: 'week' | 'month' | 'quarter'): Promise<OverviewAnalytics> {
  const params = period ? `?period=${period}` : '';
  const response = await fetch(`${API_BASE_URL}/analytics/overview${params}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch analytics overview');
  }

  return data;
}

/**
 * Get enrollment and activity trends (Admin only)
 */
export async function getAnalyticsTrends(days?: number): Promise<TrendData[]> {
  const params = days ? `?days=${days}` : '';
  const response = await fetch(`${API_BASE_URL}/analytics/trends${params}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch analytics trends');
  }

  return data.trends;
}

/**
 * Get course analytics (Admin/Teacher)
 */
export async function getCourseAnalytics(limit?: number): Promise<CourseAnalytics[]> {
  const params = limit ? `?limit=${limit}` : '';
  const response = await fetch(`${API_BASE_URL}/analytics/courses${params}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch course analytics');
  }

  return data.courses;
}

/**
 * Get most popular courses (Admin only)
 */
export interface PopularCourse {
  id: string;
  title: string;
  teacher: {
    id: string;
    email: string;
  };
  _count: {
    enrollments: number;
    lessons: number;
  };
}

export async function getPopularCourses(limit?: number): Promise<PopularCourse[]> {
  const params = limit ? `?limit=${limit}` : '';
  const response = await fetch(`${API_BASE_URL}/analytics/popular-courses${params}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch popular courses');
  }

  return data.courses;
}

/**
 * Get teacher performance metrics (Admin only)
 */
export async function getTeacherAnalytics(): Promise<TeacherAnalytics[]> {
  const response = await fetch(`${API_BASE_URL}/analytics/teachers`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch teacher analytics');
  }

  return data.teachers;
}

/**
 * Get student activity and progress (Admin only)
 */
export async function getStudentAnalytics(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ students: StudentAnalytics[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/analytics/students${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch student analytics');
  }

  return data;
}

/**
 * Content analytics response structure
 */
export interface ContentAnalytics {
  lessons: number;
  articles: number;
  flashcards: number;
  resources: number;
  quizzes: number;
  lessonsByCourse: Array<{
    courseId: string;
    _count: { id: number };
  }>;
  articlesByCategory: Array<{
    category: string;
    count: number;
  }>;
  resourcesByType: Array<{
    type: string;
    count: number;
  }>;
}

/**
 * Get content statistics (Admin only)
 */
export async function getContentAnalytics(): Promise<ContentAnalytics> {
  const response = await fetch(`${API_BASE_URL}/analytics/content`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch content analytics');
  }

  return data;
}

/**
 * Get analytics for current teacher's courses (Teacher only)
 */
export async function getTeacherOverview(): Promise<TeacherOverview> {
  const response = await fetch(`${API_BASE_URL}/analytics/teacher/overview`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch teacher analytics');
  }

  return data;
}
