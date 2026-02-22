/**
 * Course Service
 * Handles API calls to backend course endpoints
 */

import { getToken } from '@/modules/core/services/authService';
import { Lesson } from '@/modules/lessons/services/lessonService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface CourseLesson {
  id: string;
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

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/**
 * Get all published courses
 */
export async function getCourses(): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch courses');
  }

  return data.courses;
}

/**
 * Get teacher's courses (including drafts)
 */
export async function getTeacherCourses(): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses/teacher/my-courses`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch teacher courses');
  }

  return data.courses;
}

/**
 * Get published courses for a specific teacher
 */
export async function getTeacherPublishedCourses(teacherId: string): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses/teacher/${teacherId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch teacher courses');
  }

  return data.courses;
}

/**
 * Get enrolled courses for current student
 */
export async function getEnrolledCourses(): Promise<Enrollment[]> {
  const response = await fetch(`${API_BASE_URL}/courses/student`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch enrolled courses');
  }

  return data.enrollments;
}

/**
 * Get course by slug
 */
export async function getCourseBySlug(slug: string): Promise<{ course: Course; enrollment: { progress: number } | null; isTeacher: boolean }> {
  const response = await fetch(`${API_BASE_URL}/courses/${slug}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch course');
  }

  return data;
}

/**
 * Enroll in a course
 */
export async function enrollInCourse(courseId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to enroll in course');
  }
}

/**
 * Get course by ID (Internal/Editor)
 */
export async function getCourseById(id: string): Promise<{ course: Course; isTeacher: boolean }> {
  const response = await fetch(`${API_BASE_URL}/courses/id/${id}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch course');
  }

  return data;
}

/**
 * Create a new course
 */
export async function createCourse(courseData: CreateCourseData): Promise<Course> {
  const response = await fetch(`${API_BASE_URL}/courses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(courseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to create course');
  }

  return data.course;
}

/**
 * Update a course
 */
export async function updateCourse(id: string, courseData: Partial<CreateCourseData & { published: boolean }>): Promise<Course> {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(courseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to update course');
  }

  return data.course;
}

/**
 * Delete a course
 */
export async function deleteCourse(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to delete course');
  }
}

/**
 * Get course lessons
 */
export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch course lessons');
  }

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
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/students`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch course students');
  }

  return data.students;
}

/**
 * Get course analytics
 */
export async function getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/analytics`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch course analytics');
  }

  return data;
}

/**
 * Export course as JSON
 */
export async function exportCourse(courseId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/export`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to export course');
  }

  return data.draft;
}
