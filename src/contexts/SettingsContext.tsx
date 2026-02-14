/**
 * Settings Context
 * Global settings state management
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserSettings, 
  getSettings, 
  updateSettings, 
  resetSettings,
  UpdateSettingsData,
  defaultSettings,
  Theme 
} from '@/services/settingsService';

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  theme: Theme;
  refreshSettings: () => Promise<void>;
  updateUserSettings: (data: UpdateSettingsData) => Promise<void>;
  resetUserSettings: () => Promise<void>;
  isSettingsLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // Calculate effective theme
  const theme = settings?.theme || 'system';

  useEffect(() => {
    // Apply theme on mount and when settings change
    const applyTheme = () => {
      const effectiveTheme = theme;
      
      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else if (effectiveTheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    applyTheme();

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  const refreshSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSettings();
      setSettings(data);
      setIsSettingsLoaded(true);
    } catch (err) {
      // If settings don't exist yet, use defaults
      setSettings(defaultSettings);
      setIsSettingsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const updateUserSettings = async (data: UpdateSettingsData) => {
    try {
      setError(null);
      const updated = await updateSettings(data);
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  };

  const resetUserSettings = async () => {
    try {
      setError(null);
      const reset = await resetSettings();
      setSettings(reset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      throw err;
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        theme,
        refreshSettings,
        updateUserSettings,
        resetUserSettings,
        isSettingsLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Hook to check if a feature should be shown based on settings
export function useFeatureEnabled(feature: 'showArticles' | 'showFlashcards' | 'showResources') {
  const { settings } = useSettings();
  return settings?.[feature] ?? true;
}

// Hook to get default dashboard view
export function useDefaultDashboardView() {
  const { settings } = useSettings();
  return settings?.defaultDashboardView ?? 'courses';
}

// Hook to get content priority
export function useContentPriority() {
  const { settings } = useSettings();
  return settings?.contentPriority ?? 'courses';
}
