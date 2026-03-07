/**
 * Course Service
 * Handles API calls to backend course endpoints
 */

import { api } from '@/lib/apiClient';
import { Lesson } from '@/modules/lessons/services/lessonService';

export interface CoursePreview {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnail: string | null;
  teacherName: string;
  teacherId: string;
  teacher: {
    id: string;
    email: string;
    teacherProfile?: {
      bio: string | null;
      pictureUrl: string | null;
    } | null;
  };
  published: boolean;
  status: string;
  level: string;
  category: string | null;
  enrolledCount: number;
  lessonCount: number;
}

export interface CoursePreviewPage {
  items: CoursePreview[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
  };
}

export interface CourseLesson {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: string;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  level: string;
  category?: string;
  tags: string[];
  teacherId: string;
  teacher: {
    id: string;
    email: string;
    teacherProfile?: {
      id: string;
      bio: string | null;
      pictureUrl: string | null;
    } | null;
  };
  published: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    lessons: number;
    enrollments: number;
  };
  lessons?: CourseLesson[];
}

export interface EnrolledCourseItem {
  enrollment: {
    id: string;
    status: string;
    progress: number;
    enrolledAt: string;
    completedAt: string | null;
    completedLessonsCount: number;
  };
  course: {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    level: string;
    teacher: { id: string; email: string };
    totalLessons: number;
  };
}

export type Enrollment = EnrolledCourseItem;

export interface CreateCourseData {
  title: string;
  description?: string;
  imageUrl?: string;
  level?: string;
  category?: string;
  tags?: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'PRIVATE' | 'PUBLIC' | 'ARCHIVED';
}

/**
 * Get all published courses (backward compatibility wrapper)
 */
export async function getCourses(): Promise<CoursePreview[]> {
  const data = await getCoursesPaginated();
  return data.items;
}

/**
 * Get courses with pagination and filters
 */
export async function getCoursesPaginated(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  teacherId?: string;
  status?: string;
  sort?: 'newest' | 'popular';
} = {}): Promise<CoursePreviewPage> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params.search) query.append('search', params.search);
  if (params.teacherId) query.append('teacherId', params.teacherId);
  if (params.status) query.append('status', params.status);
  if (params.sort) query.append('sort', params.sort);

  const queryString = query.toString();
  const url = `/courses${queryString ? `?${queryString}` : ''}`;

  // The backend returns { success: true, items: [...], meta: {...} }
  const response = await api.get<{ success: boolean } & CoursePreviewPage>(url);
  return {
    items: response.items,
    meta: response.meta
  };
}

/**
 * Get teacher's courses (including drafts)
 */
export async function getTeacherCourses(): Promise<Course[]> {
  const data = await api.get<{ courses: Course[] }>('/courses/teacher/my-courses');
  return data.courses;
}

/**
 * Get published courses for a specific teacher
 */
export async function getTeacherPublishedCourses(teacherId: string): Promise<Course[]> {
  const data = await api.get<{ courses: Course[] }>(`/courses/teacher/${teacherId}`);
  return data.courses;
}

/**
 * Get enrolled courses for current student
 */
export async function getEnrolledCourses(): Promise<EnrolledCourseItem[]> {
  const data = await api.get<{ courses: EnrolledCourseItem[] }>('/student/enrollments');
  return data.courses;
}

/**
 * Drop enrollment in a course
 */
export async function dropEnrollment(courseId: string): Promise<void> {
  await api.delete(`/courses/${courseId}/enroll`);
}

/**
 * Check enrollment status for a course
 */
export async function checkEnrollmentStatus(courseId: string): Promise<{
  enrolled: boolean;
  enrollment: { status: string; progress: number; id: string; enrolledAt: string; completedAt: string | null } | null;
}> {
  return api.get(`/courses/${courseId}/enrollment`);
}

/**
 * Get course by slug
 */
export async function getCourseBySlug(slug: string): Promise<{
  course: Course;
  enrollment: { progress: number; status?: string } | null;
  isTeacher: boolean;
}> {
  return api.get(`/courses/${slug}`);
}

/**
 * Enroll in a course
 */
export async function enrollInCourse(courseId: string): Promise<void> {
  await api.post(`/courses/${courseId}/enroll`, {});
}

/**
 * Get course by ID (Internal/Editor)
 */
export async function getCourseById(id: string): Promise<{ course: Course; isTeacher: boolean }> {
  return api.get(`/courses/id/${id}`);
}

/**
 * Create a new course
 */
export async function createCourse(courseData: CreateCourseData): Promise<Course> {
  const data = await api.post<{ course: Course }>('/courses', courseData);
  return data.course;
}

/**
 * Update a course
 */
export async function updateCourse(
  id: string,
  courseData: Partial<CreateCourseData & { published: boolean }>
): Promise<Course> {
  const data = await api.put<{ course: Course }>(`/courses/${id}`, courseData);
  return data.course;
}

/**
 * Delete a course
 */
export async function deleteCourse(id: string): Promise<void> {
  await api.delete(`/courses/${id}`);
}

/**
 * Get course lessons
 */
export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
  const data = await api.get<{ lessons: Lesson[] }>(`/courses/${courseId}/lessons`);
  return data.lessons;
}

export interface CourseStudent {
  id: string;
  studentId: string;
  email: string;
  enrolledAt: string;
  progress: number;
  completedAt: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export interface CourseAnalytics {
  course: {
    id: string;
    title: string;
    totalLessons: number;
    totalEnrollments: number;
  };
  enrollment: {
    total: number;
    completed: number;
    inProgress: number;
    averageProgress: number;
  };
  lessons: {
    id: string;
    title: string;
    order: number;
  }[];
}

/**
 * Get students enrolled in a course
 */
export async function getCourseStudents(courseId: string): Promise<CourseStudent[]> {
  const data = await api.get<{ students: CourseStudent[] }>(`/courses/${courseId}/students`);
  return data.students;
}

/**
 * Get course analytics
 */
export async function getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
  return api.get(`/courses/${courseId}/analytics`);
}

/**
 * Export course as JSON
 */
export async function exportCourse(courseId: string): Promise<unknown> {
  const data = await api.get<{ course: unknown }>(`/courses/${courseId}/export`);
  return data.course;
}
