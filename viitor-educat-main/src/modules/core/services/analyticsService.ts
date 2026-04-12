/**
 * Analytics Service
 * Handles API calls for analytics functionality
 */

import { api } from '@/lib/apiClient';
import { API_PATHS } from '@/lib/apiPaths';

export interface OverviewAnalytics {
  users: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
  };
  content: {
    lessons: number;
    articles: number;
    flashcards: number;
  };
  recentActivity: {
    lessonsCreatedLast90Days: number;
    articlesCreatedLast90Days: number;
  };
}

export interface TrendData {
  date: string;
  lessonsCompleted: number;
  usersCreated: number;
}

export interface TeacherAnalytics {
  id: string;
  email: string;
  profile: {
    id: string;
    bio: string | null;
    pictureUrl: string | null;
  } | null;
  totalLessons: number;
}

export interface StudentAnalytics {
  id: string;
  email: string;
  profile: {
    id: string;
    bio: string | null;
    avatarUrl: string | null;
  } | null;
  quizAttempts: number;
  bookmarks: number;
  joinedAt: string;
}

export interface TeacherOverview {
  lessons: number;
  students: number;
  completionRate: number;
}

/**
 * Get platform-wide overview analytics (Admin only)
 */
export async function getOverviewAnalytics(period?: 'week' | 'month' | 'quarter'): Promise<OverviewAnalytics> {
  const params = period ? `?period=${period}` : '';
  return api.get(`${API_PATHS.ANALYTICS_OVERVIEW}${params}`);
}

/**
 * Get activity trends (Admin only)
 */
export async function getAnalyticsTrends(days?: number): Promise<TrendData[]> {
  const params = days ? `?days=${days}` : '';
  const data = await api.get<{ trends: TrendData[] }>(`${API_PATHS.ANALYTICS_TRENDS}${params}`);
  return data.trends;
}

/**
 * Get teacher performance metrics (Admin only)
 */
export async function getTeacherAnalytics(): Promise<TeacherAnalytics[]> {
  const data = await api.get<{ teachers: TeacherAnalytics[] }>(API_PATHS.ANALYTICS_TEACHERS);
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
  return api.get(`${API_PATHS.ANALYTICS_STUDENTS}${queryString ? '?' + queryString : ''}`);
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
  return api.get(API_PATHS.ANALYTICS_CONTENT);
}

/**
 * Get analytics for current teacher (Teacher only)
 */
export async function getTeacherOverview(): Promise<TeacherOverview> {
  return api.get(API_PATHS.ANALYTICS_TEACHER_OVERVIEW);
}

export interface LessonCompletionData {
  lessonId: string;
  title: string;
  completions: number;
}

export interface LessonCompletionResponse {
  lessons: LessonCompletionData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getLessonCompletionRates(page: number = 1, limit: number = 20): Promise<LessonCompletionResponse> {
  return api.get(`${API_PATHS.ANALYTICS_LESSONS}?page=${page}&limit=${limit}`);
}

export interface DropoffDistribution {
  range: string;
  count: number;
}

export interface LessonDropoffResponse {
  lessonId: string;
  title: string;
  totalStudents: number;
  completedCount: number;
  completionRate: number;
  distribution: DropoffDistribution[];
}

export async function getLessonDropoff(lessonId: string): Promise<LessonDropoffResponse> {
  return api.get(`${API_PATHS.ANALYTICS_LESSONS}/${lessonId}/dropoff`);
}

export interface WeeklyActiveData {
  weekStart: string;
  weekEnd: string;
  activeStudents: number;
}

export interface WeeklyActiveResponse {
  weeklyActive: WeeklyActiveData[];
}

export async function getWeeklyActiveStudents(weeks: number = 8): Promise<WeeklyActiveResponse> {
  return api.get(`${API_PATHS.ANALYTICS_STUDENTS_ACTIVE}?weeks=${weeks}`);
}

export interface QuizPerformanceData {
  quizId: string;
  title: string;
  totalAttempts: number;
  averageScore: number;
  hasAttempts: boolean;
}

export interface QuizPerformanceResponse {
  quizzes: QuizPerformanceData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getQuizPerformance(page: number = 1, limit: number = 20): Promise<QuizPerformanceResponse> {
  return api.get(`${API_PATHS.ANALYTICS_QUIZZES}?page=${page}&limit=${limit}`);
}
