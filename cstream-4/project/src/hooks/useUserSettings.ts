import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SupportedLanguage } from '@/lib/i18n';
import { applyTheme } from '@/lib/themes';

let tableUnavailable = false;

export interface CustomGradient {
  enabled: boolean;
  primaryColor: string;
  backgroundColor: string;
}

export type DisplayDensity = 'compact' | 'normal' | 'spacious';
export type BadgeStyle = 'default' | 'shimmer' | 'glow' | 'neon' | 'minimal';

export interface UserSettings {
  theme: string;
  language: SupportedLanguage;
  notifications: {
    newContent: boolean;
    updates: boolean;
    recommendations: boolean;
  };
  autoplay: boolean;
  brightness: number;
  customGradient: CustomGradient;
  displayDensity: DisplayDensity;
  badgeStyle: BadgeStyle;
  enableSeasonalThemes?: boolean;
  applyThemeToAll?: boolean;
  snowflakesEnabled?: boolean;
  snowflakeSpeed?: number;
  snowflakeOpacity?: number;
  particlesEnabled?: boolean;
}

const defaultSettings: UserSettings = {
  theme: 'dark',
  language: 'en',
  notifications: {
    newContent: true,
    updates: true,
    recommendations: false,
  },
  autoplay: true,
  brightness: 100,
  customGradient: {
    enabled: false,
    primaryColor: '#A855F7',
    backgroundColor: '#0C0A1A',
  },
  displayDensity: 'normal',
  badgeStyle: 'default',
  enableSeasonalThemes: true,
  applyThemeToAll: false,
  snowflakesEnabled: false,
  snowflakeSpeed: 1,
  snowflakeOpacity: 0.8,
  particlesEnabled: true,
};

interface SettingsState extends UserSettings {
  setTheme: (theme: string) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setNotifications: (notifications: UserSettings['notifications']) => void;
  setAutoplay: (autoplay: boolean) => void;
  setBrightness: (brightness: number) => void;
  setCustomGradient: (customGradient: CustomGradient) => void;
  setDisplayDensity: (displayDensity: DisplayDensity) => void;
  setBadgeStyle: (badgeStyle: BadgeStyle) => void;
  setSnowflakesEnabled: (enabled: boolean) => void;
  setSnowflakeSpeed: (speed: number) => void;
  setSnowflakeOpacity: (opacity: number) => void;
  setParticlesEnabled: (enabled: boolean) => void;
  setAllSettings: (settings: UserSettings) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setTheme: (theme) => {
        localStorage.setItem('cstream-theme-backup', theme);
        applyTheme(theme);
        set({ theme });
        // Force refresh theme variables after change
        setTimeout(() => applyTheme(theme), 50);
        // Dispatch event for components to react to theme change
        window.dispatchEvent(new Event('theme-changed'));
      },
      setLanguage: (language) => set({ language }),
      setNotifications: (notifications) => set({ notifications }),
      setAutoplay: (autoplay) => set({ autoplay }),
      setBrightness: (brightness) => set({ brightness }),
      setCustomGradient: (customGradient) => set({ customGradient }),
      setDisplayDensity: (displayDensity) => set({ displayDensity }),
      setBadgeStyle: (badgeStyle) => set({ badgeStyle }),
      setSnowflakesEnabled: (snowflakesEnabled) => set({ snowflakesEnabled }),
      setSnowflakeSpeed: (snowflakeSpeed) => set({ snowflakeSpeed }),
      setSnowflakeOpacity: (snowflakeOpacity) => set({ snowflakeOpacity }),
      setParticlesEnabled: (particlesEnabled) => set({ particlesEnabled }),
      setAllSettings: (settings) => set(settings),
    }),
    {
      name: 'cstream-settings',
    }
  )
);

export const useUserSettings = () => {
  const { user } = useAuth();
  const store = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const initRef = useRef(false);

  const fetchSettings = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;
    setLoading(true);

    // First try to restore from localStorage backup
    if (typeof window !== 'undefined') {
      const backupSettings = localStorage.getItem('cstream-user-settings-backup');
      if (backupSettings) {
        try {
          const parsed = JSON.parse(backupSettings);
          store.setAllSettings(parsed);
          console.log('Settings restored from localStorage');
        } catch (e) {
          console.log('Error parsing backup settings');
        }
      }
    }

    if (!user) {
      setLoading(false);
      return;
    }

    if (tableUnavailable) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST205') {
          tableUnavailable = true;
          console.log('user_settings table not available, using local storage only');
        }
        setLoading(false);
        return;
      }

      if (data) {
        const settingsData = data as any;
        const newSettings = {
          theme: settingsData.theme || defaultSettings.theme,
          language: (settingsData.language as SupportedLanguage) || defaultSettings.language,
          notifications: settingsData.notifications || defaultSettings.notifications,
          autoplay: settingsData.autoplay ?? defaultSettings.autoplay,
          brightness: settingsData.brightness ?? defaultSettings.brightness,
          customGradient: settingsData.customGradient || defaultSettings.customGradient,
          displayDensity: settingsData.displayDensity || defaultSettings.displayDensity,
          badgeStyle: settingsData.badgeStyle || defaultSettings.badgeStyle,
          snowflakesEnabled: settingsData.snowflakesEnabled ?? defaultSettings.snowflakesEnabled,
          snowflakeSpeed: settingsData.snowflakeSpeed ?? defaultSettings.snowflakeSpeed,
          snowflakeOpacity: settingsData.snowflakeOpacity ?? defaultSettings.snowflakeOpacity,
          particlesEnabled: settingsData.particlesEnabled ?? defaultSettings.particlesEnabled,
        };
        
        // Also backup to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('cstream-user-settings-backup', JSON.stringify(newSettings));
        }
        
        store.setAllSettings(newSettings);
        console.log('Settings synced from database');
      }
    } catch (error) {
      console.log('Settings sync unavailable, using local storage');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveSettings = useCallback(async (settings: Partial<UserSettings>) => {
    setSaving(true);

    const newSettings = {
      theme: settings.theme ?? store.theme,
      language: settings.language ?? store.language,
      notifications: settings.notifications ?? store.notifications,
      autoplay: settings.autoplay ?? store.autoplay,
      brightness: settings.brightness ?? store.brightness,
      customGradient: settings.customGradient ?? store.customGradient,
      displayDensity: settings.displayDensity ?? store.displayDensity,
      badgeStyle: settings.badgeStyle ?? store.badgeStyle,
      snowflakesEnabled: settings.snowflakesEnabled ?? store.snowflakesEnabled,
      snowflakeSpeed: settings.snowflakeSpeed ?? store.snowflakeSpeed,
      snowflakeOpacity: settings.snowflakeOpacity ?? store.snowflakeOpacity,
      particlesEnabled: settings.particlesEnabled ?? store.particlesEnabled,
    };

    // Always save to localStorage first (not dependent on user/database)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cstream-user-settings-backup', JSON.stringify(newSettings));
        // Deep persistence for the whole state to ensure it reloads on reconnect
        const persistData = {
          state: { ...newSettings },
          version: 0
        };
        localStorage.setItem('cstream-settings', JSON.stringify(persistData));
      } catch (e) {
        console.log('Error saving to localStorage');
      }
    }

    store.setAllSettings(newSettings);

    if (!user || tableUnavailable) {
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings' as any)
        .upsert({
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        if (error.code === 'PGRST205') {
          tableUnavailable = true;
        }
        console.log('Settings saved locally (database sync unavailable)');
      }
    } catch (error) {
      console.log('Settings saved locally only');
    } finally {
      setSaving(false);
    }
  }, [user]);

  useEffect(() => {
    if (!initRef.current) {
      fetchSettings();
    }
  }, []);

  useEffect(() => {
    // Apply theme via CSS variables and data-attribute
    applyTheme(store.theme);
    // Persist theme to localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.setItem('cstream-theme-backup', store.theme);
    }
  }, [store.theme]);

  return {
    settings: {
      theme: store.theme,
      language: store.language,
      notifications: store.notifications,
      autoplay: store.autoplay,
      brightness: store.brightness,
      customGradient: store.customGradient,
      displayDensity: store.displayDensity,
      badgeStyle: store.badgeStyle,
      snowflakesEnabled: store.snowflakesEnabled,
      snowflakeSpeed: store.snowflakeSpeed,
      snowflakeOpacity: store.snowflakeOpacity,
      particlesEnabled: store.particlesEnabled,
    },
    loading,
    saving,
    setTheme: (theme: string) => {
      store.setTheme(theme);
      saveSettings({ theme });
    },
    setLanguage: (language: SupportedLanguage) => {
      store.setLanguage(language);
      saveSettings({ language });
    },
    setNotifications: (notifications: UserSettings['notifications']) => {
      store.setNotifications(notifications);
      saveSettings({ notifications });
    },
    setAutoplay: (autoplay: boolean) => {
      store.setAutoplay(autoplay);
      saveSettings({ autoplay });
    },
    setBrightness: (brightness: number) => {
      store.setBrightness(brightness);
      saveSettings({ brightness });
    },
    setCustomGradient: (customGradient: CustomGradient) => {
      store.setCustomGradient(customGradient);
      saveSettings({ customGradient });
    },
    setDisplayDensity: (displayDensity: DisplayDensity) => {
      store.setDisplayDensity(displayDensity);
      saveSettings({ displayDensity });
    },
    setBadgeStyle: (badgeStyle: BadgeStyle) => {
      store.setBadgeStyle(badgeStyle);
      saveSettings({ badgeStyle });
    },
    setSnowflakesEnabled: (snowflakesEnabled: boolean) => {
      store.setSnowflakesEnabled(snowflakesEnabled);
      saveSettings({ snowflakesEnabled });
    },
    setSnowflakeSpeed: (snowflakeSpeed: number) => {
      store.setSnowflakeSpeed(snowflakeSpeed);
      saveSettings({ snowflakeSpeed });
    },
    setSnowflakeOpacity: (snowflakeOpacity: number) => {
      store.setSnowflakeOpacity(snowflakeOpacity);
      saveSettings({ snowflakeOpacity });
    },
    setParticlesEnabled: (particlesEnabled: boolean) => {
      store.setParticlesEnabled(particlesEnabled);
      saveSettings({ particlesEnabled });
    },
    updateSettings: (partialSettings: Partial<UserSettings>) => saveSettings(partialSettings),
    refetch: fetchSettings,
  };
};
