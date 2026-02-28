/**
 * Settings Service
 * Handles API calls to backend settings endpoints
 */

import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type Theme = 'light' | 'dark' | 'system';
export type DashboardView = 'courses' | 'articles' | 'resources' | 'flashcards';
export type ContentPriority = 'courses' | 'teacher_profiles';
export type ResourceType = 'YOUTUBE' | 'LINK' | 'PDF' | 'DOCUMENT';

export interface UserSettings {
  id: string;
  userId: string;

  // Appearance
  theme: Theme;
  language: string;

  // Dashboard preferences
  defaultDashboardView: DashboardView;
  contentPriority: ContentPriority;
  showArticles: boolean;
  showFlashcards: boolean;
  showResources: boolean;

  // Study preferences
  preferredCategories: string[];
  preferredTeachers: string[];
  studyReminderEnabled: boolean;
  studyReminderTime: string | null;

  // Notification preferences
  emailNotifications: boolean;
  courseUpdates: boolean;
  newArticles: boolean;
  newResources: boolean;
  flashcardReminders: boolean;

  // Privacy options
  showProfile: boolean;
  showProgress: boolean;
  allowAnalytics: boolean;

  // Content filters
  hiddenCategories: string[];
  hiddenTags: string[];

  // Teacher-specific settings
  teacherToolsExpanded: boolean;
  defaultResourceType: ResourceType | null;

  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsData {
  theme?: Theme;
  language?: string;
  defaultDashboardView?: DashboardView;
  contentPriority?: ContentPriority;
  showArticles?: boolean;
  showFlashcards?: boolean;
  showResources?: boolean;
  preferredCategories?: string[];
  preferredTeachers?: string[];
  studyReminderEnabled?: boolean;
  studyReminderTime?: string | null;
  emailNotifications?: boolean;
  courseUpdates?: boolean;
  newArticles?: boolean;
  newResources?: boolean;
  flashcardReminders?: boolean;
  showProfile?: boolean;
  showProgress?: boolean;
  allowAnalytics?: boolean;
  hiddenCategories?: string[];
  hiddenTags?: string[];
  teacherToolsExpanded?: boolean;
  defaultResourceType?: ResourceType;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'ngrok-skip-browser-warning': 'true',
  };
}

/**
 * Get current user's settings
 */
export async function getSettings(): Promise<UserSettings> {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch settings');
  }

  return data.settings;
}

/**
 * Update user settings
 */
export async function updateSettings(settings: UpdateSettingsData): Promise<UserSettings> {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to update settings');
  }

  return data.settings;
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<UserSettings> {
  const response = await fetch(`${API_BASE_URL}/settings/reset`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to reset settings');
  }

  return data.settings;
}

/**
 * Get available categories for preferences
 */
export async function getAvailableCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/settings/categories`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch categories');
  }

  return data.categories;
}

// Default settings fallback
export const defaultSettings: UserSettings = {
  id: '',
  userId: '',
  theme: 'system',
  language: 'en',
  defaultDashboardView: 'courses',
  contentPriority: 'courses',
  showArticles: true,
  showFlashcards: true,
  showResources: true,
  preferredCategories: [],
  preferredTeachers: [],
  studyReminderEnabled: false,
  studyReminderTime: null,
  emailNotifications: true,
  courseUpdates: true,
  newArticles: true,
  newResources: true,
  flashcardReminders: false,
  showProfile: true,
  showProgress: true,
  allowAnalytics: true,
  hiddenCategories: [],
  hiddenTags: [],
  teacherToolsExpanded: false,
  defaultResourceType: 'LINK',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Theme helpers
export const themeLabels: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export const themeIcons: Record<Theme, string> = {
  light: 'sun',
  dark: 'moon',
  system: 'monitor',
};

// Dashboard view helpers
export const dashboardViewLabels: Record<DashboardView, string> = {
  courses: 'Courses',
  articles: 'Articles',
  resources: 'Resources',
  flashcards: 'Flashcards',
};

// Category helpers
export const categoryLabels: Record<string, string> = {
  MATH: 'Mathematics',
  SCIENCE: 'Science',
  LITERATURE: 'Literature',
  HISTORY: 'History',
  COMPUTER_SCIENCE: 'Computer Science',
  ARTS: 'Arts',
  LANGUAGES: 'Languages',
  GENERAL: 'General',
};
