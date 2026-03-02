/**
 * Student Service
 * Handles API calls to backend student profile and progress endpoints
 */

import { api, API_BASE_URL } from '@/lib/apiClient';
import { getToken } from './authService';

export interface StudentProfile {
  id: string;
  userId: string;
  avatarUrl: string | null;
  bio: string | null;
  learningGoals: string[];
  interests: string[];
  preferredLevel: string;
}

export interface CourseWithProgress {
  id: string;
  progress: number;
  completedLessonsCount: number;
  lastAccessedLessonId: string | null;
  completedAt: string | null;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    level: string;
    category: string;
    totalLessons: number;
    teacher: {
      id: string;
      email: string;
      teacherProfile: {
        bio: string | null;
        pictureUrl: string | null;
      } | null;
    };
  };
}

export interface LearningHistoryItem {
  id: string;
  completedAt: string;
  lesson: {
    id: string;
    title: string;
    courseId: string | null;
    courseTitle: string | null;
  };
}

export interface StudentStats {
  totalCoursesEnrolled: number;
  totalLessonsCompleted: number;
  coursesCompleted: number;
}

export interface StudentProfileResponse {
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  };
  profile: StudentProfile | null;
  enrollments: CourseWithProgress[];
  learningHistory: LearningHistoryItem[];
  stats: StudentStats;
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  progress: number;
  completedLessonsCount: number;
  lastAccessedLessonId: string | null;
  completedAt: string | null;
  lessons: {
    id: string;
    title: string;
    description: string | null;
    order: number;
    completed: boolean;
  }[];
}

export interface ResumeCourseResponse {
  lesson: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    order: number;
  } | null;
  progress: number;
  courseSlug: string;
}

export interface UpdateStudentProfileData {
  avatarUrl?: string | null;
  bio?: string;
  learningGoals?: string[];
  interests?: string[];
  preferredLevel?: string;
}

/**
 * Get enrolled courses for current student (with progress)
 */
export async function getStudentCourses(): Promise<CourseWithProgress[]> {
  const data = await api.get<{ courses: CourseWithProgress[] }>('/courses/student');
  return data.courses;
}

/**
 * Get student progress stats (completion stats)
 */
export async function getStudentProgress(): Promise<{
  totalEnrolled: number;
  totalCompleted: number;
  totalInProgress: number;
  percentComplete: number;
}> {
  return api.get('/student/progress');
}

/**
 * Get current student's profile with enrolled courses and progress
 */
export async function getStudentProfile(): Promise<StudentProfileResponse> {
  return api.get('/profiles/student');
}

/**
 * Update current student's profile
 */
export async function updateStudentProfile(data: UpdateStudentProfileData): Promise<{ message: string; profile: StudentProfile }> {
  return api.put('/profiles/student', data);
}

/**
 * Get detailed progress for a specific course
 */
export async function getCourseProgress(courseId: string): Promise<CourseProgress> {
  return api.get(`/profiles/student/progress/${courseId}`);
}

/**
 * Get the last accessed lesson to resume for a specific course
 */
export async function resumeCourse(courseId: string): Promise<ResumeCourseResponse> {
  return api.post(`/profiles/student/progress/${courseId}/resume`, {});
}

/**
 * Upload student profile picture
 */
export async function uploadStudentProfilePicture(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/profile-picture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to upload profile picture');
  }

  return { url: data.url };
}
