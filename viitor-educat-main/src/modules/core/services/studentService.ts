/**
 * Student Service
 * Handles API calls to backend student profile and progress endpoints
 */

import { api, API_BASE_URL } from '@/lib/apiClient';
import { API_PATHS } from '@/lib/apiPaths';
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

export interface LessonWithProgress {
  id: string;
  progress: number;
  completedAt: string | null;
  enrolledAt: string;
  lesson: {
    id: string;
    title: string;
    description: string | null;
    category: string;
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
  };
}

export interface StudentStats {
  totalLessonsCompleted: number;
}

export interface StudentProfileResponse {
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  };
  profile: StudentProfile | null;
  learningHistory: LearningHistoryItem[];
  stats: StudentStats;
}

export interface UpdateStudentProfileData {
  avatarUrl?: string | null;
  bio?: string;
  learningGoals?: string[];
  interests?: string[];
  preferredLevel?: string;
}

/**
 * Get student progress stats
 */
export async function getStudentProgress(): Promise<{
  totalCompleted: number;
  percentComplete: number;
}> {
  return api.get(API_PATHS.STUDENT_PROGRESS);
}

/**
 * Get current student's profile
 */
export async function getStudentProfile(): Promise<StudentProfileResponse> {
  return api.get(API_PATHS.PROFILE_STUDENT);
}

/**
 * Update current student's profile
 */
export async function updateStudentProfile(data: UpdateStudentProfileData): Promise<{ message: string; profile: StudentProfile }> {
  return api.put(API_PATHS.PROFILE_STUDENT, data);
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
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to upload profile picture');
  }

  return { url: data.url };
}
