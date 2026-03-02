/**
 * Course Service
 * Handles API calls to backend course endpoints
 */

import { api } from '@/lib/apiClient';
import { Lesson } from '@/modules/lessons/services/lessonService';

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

export interface Enrollment {
  id: string;
  progress: number;
  enrolledAt: string;
  course: Course;
}

export interface CreateCourseData {
  title: string;
  description?: string;
  imageUrl?: string;
  level?: string;
  category?: string;
  tags?: string[];
  lessonIds?: string[];
  status?: 'DRAFT' | 'PRIVATE' | 'PUBLIC';
}

/**
 * Get all published courses
 */
export async function getCourses(): Promise<Course[]> {
  const data = await api.get<{ courses: Course[] }>('/courses');
  return data.courses;
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
export async function getEnrolledCourses(): Promise<Enrollment[]> {
  const data = await api.get<{ courses: Enrollment[] }>('/student/enrollments');
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
export async function checkEnrollmentStatus(courseId: string): Promise<{ enrolled: boolean; enrollment: { status: string; progress: number } | null }> {
  return api.get(`/courses/${courseId}/enrollment`);
}

/**
 * Get course by slug
 */
export async function getCourseBySlug(slug: string): Promise<{ course: Course; enrollment: { progress: number } | null; isTeacher: boolean }> {
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
export async function updateCourse(id: string, courseData: Partial<CreateCourseData & { published: boolean }>): Promise<Course> {
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
 * Get course students
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
  const data = await api.get<{ draft: unknown }>(`/courses/${courseId}/export`);
  return data.draft;
}
