import { getToken } from '@/modules/core/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface StudentProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  school?: string;
  grade?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseWithProgress {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  teacherId: string;
  teacher?: {
    id: string;
    email: string;
  };
  category: string;
  isPublished: boolean;
  createdAt: string;
  enrollment?: {
    enrolledAt: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
  };
}

export interface LearningHistoryItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  completedAt: string;
  timeSpent: number;
}

export interface StudentStats {
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  achievements: number;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function getStudentProfile(studentId?: string): Promise<StudentProfile> {
  let url = `${API_BASE_URL}/students/profile`;
  if (studentId) {
    url += `?studentId=${studentId}`;
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch student profile');
  }

  return data.profile || data;
}

export async function updateStudentProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
  const response = await fetch(`${API_BASE_URL}/students/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update student profile');
  }

  return result.profile || result;
}

export async function uploadStudentProfilePicture(file: File): Promise<{ url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/students/profile/picture`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload profile picture');
  }

  return data;
}

export async function getStudentEnrollments(studentId?: string): Promise<CourseWithProgress[]> {
  let url = `${API_BASE_URL}/students/enrollments`;
  if (studentId) {
    url += `?studentId=${studentId}`;
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch enrollments');
  }

  return data.enrollments || data;
}

export async function getLearningHistory(studentId?: string, page: number = 1, limit: number = 20): Promise<{
  history: LearningHistoryItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  let url = `${API_BASE_URL}/students/history?page=${page}&limit=${limit}`;
  if (studentId) {
    url += `&studentId=${studentId}`;
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch learning history');
  }

  return data;
}

export async function getStudentStats(studentId?: string): Promise<StudentStats> {
  let url = `${API_BASE_URL}/students/stats`;
  if (studentId) {
    url += `?studentId=${studentId}`;
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch student stats');
  }

  return data.stats || data;
}
