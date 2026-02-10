import { useMemo, useEffect } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { ThemeBackground } from '@/components/ThemeBackground';

export const FestiveThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useUserSettings();

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  return (
    <>
      {children}
    </>
  );
};
