import { useState, useEffect, useCallback, useRef } from 'react';
import { THEMES, getThemeById, applyTheme, initializeTheme, DEFAULT_THEME } from '@/lib/themes';

export interface Theme {
  id: string;
  name: string;
  label: string;
  isDark: boolean;
  isSpecial?: boolean;
  description: string;
  colors: {
    primary: string;
    background: string;
  };
}

const THEME_STORAGE_KEY = 'cstream_active_theme';

// Initialize theme immediately on module load
initializeTheme();

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>(THEMES);
  const [isLoading, setIsLoading] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initRef.current) return;
    initRef.current = true;

    try {
      // Load active theme from storage or user settings
      const userSettingsSaved = localStorage.getItem('user-settings');
      let storedThemeId: string | null = null;
      
      if (userSettingsSaved) {
        try {
          const parsed = JSON.parse(userSettingsSaved);
          if (parsed.state?.themeId) {
            storedThemeId = parsed.state.themeId;
          }
        } catch (e) {
          console.error('Failed to parse user settings theme', e);
        }
      }
      
      if (!storedThemeId) {
        storedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
      }

      let themeToLoad: Theme | undefined;
      
      if (storedThemeId) {
        themeToLoad = getThemeById(storedThemeId);
      }
      
      const selectedTheme = themeToLoad || THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
      setCurrentTheme(selectedTheme);
      applyTheme(selectedTheme.id);
    } catch (error) {
      console.error('Theme loading error:', error);
      const defaultTheme = THEMES[0];
      setCurrentTheme(defaultTheme);
      applyTheme(defaultTheme.id);
    }
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    setCurrentTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    } catch (e) {
      console.error('Theme storage error:', e);
    }
    applyTheme(theme.id);
  }, []);

  const getActiveSpecialTheme = useCallback(() => {
    // Placeholder for special themes
    return undefined;
  }, []);

  return {
    currentTheme: currentTheme || THEMES[0],
    availableThemes: THEMES,
    setTheme,
    isLoading,
    getActiveSpecialTheme,
  };
};
