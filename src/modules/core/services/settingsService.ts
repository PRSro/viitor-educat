/**
 * Settings Service
 * Handles API calls to backend settings endpoints
 */

import { api } from '@/lib/apiClient';

export type Theme = 'light' | 'dark' | 'system';
export type DashboardView = 'lessons' | 'articles' | 'resources' | 'flashcards'; // Changed courses to lessons
export type ContentPriority = 'lessons' | 'teacher_profiles'; // Changed courses to lessons
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
  lessonUpdates: boolean; // Changed courseUpdates to lessonUpdates
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
  lessonUpdates?: boolean; // Changed courseUpdates to lessonUpdates
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

/**
 * Get current user's settings
 */
export async function getSettings(): Promise<UserSettings> {
  const data = await api.get<{ settings: UserSettings }>('/settings');
  return data.settings;
}

/**
 * Update user settings
 */
export async function updateSettings(settings: UpdateSettingsData): Promise<UserSettings> {
  const data = await api.put<{ settings: UserSettings }>('/settings', settings);
  return data.settings;
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<UserSettings> {
  const data = await api.post<{ settings: UserSettings }>('/settings/reset', {});
  return data.settings;
}

/**
 * Get available categories for preferences
 */
export async function getAvailableCategories(): Promise<string[]> {
  const data = await api.get<{ categories: string[] }>('/settings/categories');
  return data.categories;
}

// Default settings fallback
export const defaultSettings: UserSettings = {
  id: '',
  userId: '',
  theme: 'system',
  language: 'en',
  defaultDashboardView: 'lessons', // Changed courses to lessons
  contentPriority: 'lessons', // Changed courses to lessons
  showArticles: true,
  showFlashcards: true,
  showResources: true,
  preferredCategories: [],
  preferredTeachers: [],
  studyReminderEnabled: false,
  studyReminderTime: null,
  emailNotifications: true,
  lessonUpdates: true, // Changed courseUpdates to lessonUpdates
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
  lessons: 'Lessons', // Changed courses to lessons
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
