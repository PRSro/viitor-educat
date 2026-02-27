import { getToken } from '@/modules/core/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type Theme = 'light' | 'dark' | 'system';
export type DashboardView = 'grid' | 'list';
export type ContentPriority = 'lessons_first' | 'articles_first' | 'resources_first';
export type ResourceType = 'YOUTUBE' | 'LINK' | 'PDF' | 'DOCUMENT';

export const themeLabels: Record<Theme, string> = {
  light: 'Luminos',
  dark: 'Întunecat',
  system: 'Sistem',
};

export const dashboardViewLabels: Record<DashboardView, string> = {
  grid: 'Grilă',
  list: 'Listă',
};

export const categoryLabels: Record<string, string> = {
  MATH: 'Matematică',
  SCIENCE: 'Științe',
  LITERATURE: 'Literatură',
  HISTORY: 'Istorie',
  COMPUTER_SCIENCE: 'Informatică',
  ARTS: 'Arte',
  LANGUAGES: 'Limbi Străine',
  GENERAL: 'General',
};

export interface UserSettings {
  theme: Theme;
  dashboardView: DashboardView;
  contentPriority: ContentPriority;
  showNotifications: boolean;
  emailNotifications: boolean;
  preferredCategories: string[];
  preferredResourceTypes: ResourceType[];
  language: string;
  timezone: string;
}

export interface UpdateSettingsData {
  theme?: Theme;
  dashboardView?: DashboardView;
  contentPriority?: ContentPriority;
  showNotifications?: boolean;
  emailNotifications?: boolean;
  preferredCategories?: string[];
  preferredResourceTypes?: ResourceType[];
  language?: string;
  timezone?: string;
}

export const defaultSettings: UserSettings = {
  theme: 'system',
  dashboardView: 'grid',
  contentPriority: 'lessons_first',
  showNotifications: true,
  emailNotifications: true,
  preferredCategories: [],
  preferredResourceTypes: ['YOUTUBE', 'LINK', 'PDF', 'DOCUMENT'],
  language: 'ro',
  timezone: 'Europe/Bucharest',
};

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function getUserSettings(): Promise<UserSettings> {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch settings');
  }

  return { ...defaultSettings, ...data.settings };
}

export async function updateUserSettings(settings: UpdateSettingsData): Promise<UserSettings> {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update settings');
  }

  return { ...defaultSettings, ...result.settings };
}

export async function resetUserSettings(): Promise<UserSettings> {
  const response = await fetch(`${API_BASE_URL}/settings/reset`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to reset settings');
  }

  return defaultSettings;
}
