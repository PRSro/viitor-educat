/**
 * Course Service
 * Handles API calls to backend course endpoints
 */

import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  teacherId: string;
  teacher: {
    id: string;
    email: string;
  };
  published: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    lessons: number;
    enrollments: number;
  };
  lessons?: {
    id: string;
    title: string;
    description?: string;
    order: number;
  }[];
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
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/**
 * Fetch all published courses
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
 * Fetch enrolled courses for current student
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
 * Get course details by slug
 */
export async function getCourseBySlug(slug: string): Promise<{ course: Course; enrollment: { progress: number } | null }> {
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
 * Create a new course (Teacher only)
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
 * Update a course (Owner only)
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
 * Delete a course (Owner only)
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
