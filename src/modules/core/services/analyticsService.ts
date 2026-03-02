/**
 * Analytics Service
 * Handles API calls for analytics functionality
 */

import { api } from '@/lib/apiClient';

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

/**
 * Get platform-wide overview analytics (Admin only)
 */
export async function getOverviewAnalytics(period?: 'week' | 'month' | 'quarter'): Promise<OverviewAnalytics> {
  const params = period ? `?period=${period}` : '';
  return api.get(`/analytics/overview${params}`);
}

/**
 * Get enrollment and activity trends (Admin only)
 */
export async function getAnalyticsTrends(days?: number): Promise<TrendData[]> {
  const params = days ? `?days=${days}` : '';
  const data = await api.get<{ trends: TrendData[] }>(`/analytics/trends${params}`);
  return data.trends;
}

/**
 * Get course analytics (Admin/Teacher)
 */
export async function getCourseAnalytics(limit?: number): Promise<CourseAnalytics[]> {
  const params = limit ? `?limit=${limit}` : '';
  const data = await api.get<{ courses: CourseAnalytics[] }>(`/analytics/courses${params}`);
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
  const data = await api.get<{ courses: PopularCourse[] }>(`/analytics/popular-courses${params}`);
  return data.courses;
}

/**
 * Get teacher performance metrics (Admin only)
 */
export async function getTeacherAnalytics(): Promise<TeacherAnalytics[]> {
  const data = await api.get<{ teachers: TeacherAnalytics[] }>('/analytics/teachers');
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
  return api.get(`/analytics/students${queryString ? '?' + queryString : ''}`);
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
  return api.get('/analytics/content');
}

/**
 * Get analytics for current teacher's courses (Teacher only)
 */
export async function getTeacherOverview(): Promise<TeacherOverview> {
  return api.get('/analytics/teacher/overview');
}

export interface LessonCompletionData {
  lessonId: string;
  title: string;
  courseTitle: string;
  completions: number;
  enrolledStudents: number;
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
  return api.get(`/analytics/lessons?page=${page}&limit=${limit}`);
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
  return api.get(`/analytics/lessons/${lessonId}/dropoff`);
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
  return api.get(`/analytics/students/active?weeks=${weeks}`);
}

export interface QuizPerformanceData {
  quizId: string;
  title: string;
  courseTitle: string;
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
  return api.get(`/analytics/quizzes?page=${page}&limit=${limit}`);
}
