import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';

const THEME_MODE_KEY = 'cstream-theme-mode';

/**
 * Hook pour gérer le mode light/dark (séparé du système de thème couleur)
 * - Détecte automatiquement prefers-color-scheme au premier chargement
 * - Mémorise le choix dans localStorage
 * - Pas de flash au chargement
 */
export const useThemeMode = () => {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [isMounted, setIsMounted] = useState(false);

  // Initialiser immédiatement pour éviter le flash
  useEffect(() => {
    const initializeMode = () => {
      try {
        // Essayer de charger depuis localStorage
        const saved = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
        
        if (saved && ['light', 'dark'].includes(saved)) {
          applyMode(saved);
          setMode(saved);
        } else {
          // Sinon, détecter prefers-color-scheme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const detectedMode: ThemeMode = prefersDark ? 'dark' : 'light';
          applyMode(detectedMode);
          setMode(detectedMode);
        }
      } catch (error) {
        console.error('Error initializing theme mode:', error);
        applyMode('dark');
      }
      setIsMounted(true);
    };

    initializeMode();

    // Écouter les changements du système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(THEME_MODE_KEY)) {
        const newMode: ThemeMode = e.matches ? 'dark' : 'light';
        applyMode(newMode);
        setMode(newMode);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyMode = useCallback((newMode: ThemeMode) => {
    const root = document.documentElement;
    const body = document.body;

    if (newMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
      body.style.colorScheme = 'dark';
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      body.style.colorScheme = 'light';
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }

    // Force reflow pour que les styles s'appliquent immédiatement
    void document.documentElement.offsetHeight;

    // Dispatcher un événement pour que les composants puissent réagir
    window.dispatchEvent(
      new CustomEvent('theme-mode-change', {
        detail: { mode: newMode },
      })
    );
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    applyMode(newMode);
    setMode(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
  }, [mode, applyMode]);

  return {
    mode,
    isMounted,
    toggleMode,
    setMode: (newMode: ThemeMode) => {
      applyMode(newMode);
      setMode(newMode);
      localStorage.setItem(THEME_MODE_KEY, newMode);
    },
  };
};
