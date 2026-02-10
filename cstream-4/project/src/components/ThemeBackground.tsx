import { useUserSettings } from '@/hooks/useUserSettings';
import { useEffect, useState } from 'react';

export const ThemeBackground = () => {
  const { settings } = useUserSettings();
  const [theme, setTheme] = useState(settings.theme);

  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme]);

  const getThemeStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none' as const,
      zIndex: 0,
    };

    return {
      ...baseStyles,
      background: `linear-gradient(135deg, 
        #0a0a0f 0%, 
        #1a0f2e 25%, 
        #0f1a2e 50%, 
        #1a0f2e 75%, 
        #0a0a0f 100%),
        radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)`,
    };
  };

  return (
    <div
      style={getThemeStyles()}
      className="theme-background"
    />
  );
};
