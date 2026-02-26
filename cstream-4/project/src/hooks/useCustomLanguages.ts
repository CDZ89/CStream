import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomLanguage {
  id: string;
  code: string;
  label: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

const defaultLanguages: CustomLanguage[] = [
  { id: 'vostfr', code: 'VOSTFR', label: 'Version Originale Sous-Titrée Français', color: '#71717a', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'vf', code: 'VF', label: 'Version Française', color: '#22C55E', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'vf2', code: 'VF2', label: 'Version Française 2', color: '#10B981', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'vo', code: 'VO', label: 'Version Originale', color: '#3B82F6', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'vostfr-multi', code: 'MULTI', label: 'Multi-Langues', color: '#F59E0B', isDefault: true, createdAt: new Date().toISOString() },
];

interface CustomLanguagesStore {
  languages: CustomLanguage[];
  addLanguage: (code: string, label: string, color?: string) => CustomLanguage | null;
  removeLanguage: (id: string) => boolean;
  updateLanguage: (id: string, updates: Partial<CustomLanguage>) => boolean;
  getLanguageByCode: (code: string) => CustomLanguage | undefined;
  getAllLanguageCodes: () => string[];
  resetToDefaults: () => void;
}

export const useCustomLanguages = create<CustomLanguagesStore>()(
  persist(
    (set, get) => ({
      languages: defaultLanguages,

      addLanguage: (code: string, label: string, color?: string) => {
        const trimmedCode = code.trim().toUpperCase();
        const trimmedLabel = label.trim();

        if (!trimmedCode || trimmedCode.length < 2) {
          return null;
        }

        const existing = get().languages.find(l => l.code.toUpperCase() === trimmedCode);
        if (existing) {
          return null;
        }

        const newLang: CustomLanguage = {
          id: `custom-${Date.now()}`,
          code: trimmedCode,
          label: trimmedLabel || trimmedCode,
          color: color || '#71717a',
          isDefault: false,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          languages: [...state.languages, newLang]
        }));

        return newLang;
      },

      removeLanguage: (id: string) => {
        const lang = get().languages.find(l => l.id === id);
        if (!lang || lang.isDefault) {
          return false;
        }

        set(state => ({
          languages: state.languages.filter(l => l.id !== id)
        }));

        return true;
      },

      updateLanguage: (id: string, updates: Partial<CustomLanguage>) => {
        const lang = get().languages.find(l => l.id === id);
        if (!lang) {
          return false;
        }

        if (updates.code) {
          const codeExists = get().languages.some(
            l => l.id !== id && l.code.toUpperCase() === updates.code!.toUpperCase()
          );
          if (codeExists) {
            return false;
          }
        }

        set(state => ({
          languages: state.languages.map(l =>
            l.id === id
              ? { ...l, ...updates, code: updates.code?.toUpperCase() || l.code }
              : l
          )
        }));

        return true;
      },

      getLanguageByCode: (code: string) => {
        return get().languages.find(l => l.code.toUpperCase() === code.toUpperCase());
      },

      getAllLanguageCodes: () => {
        return get().languages.map(l => l.code);
      },

      resetToDefaults: () => {
        set({ languages: defaultLanguages });
      },
    }),
    {
      name: 'cstream-custom-languages',
    }
  )
);

export const getLanguageColor = (code: string): string => {
  const languages = useCustomLanguages.getState().languages;
  const lang = languages.find(l => l.code.toUpperCase() === code.toUpperCase());
  return lang?.color || '#71717a';
};

export const getLanguageLabel = (code: string): string => {
  const languages = useCustomLanguages.getState().languages;
  const lang = languages.find(l => l.code.toUpperCase() === code.toUpperCase());
  return lang?.label || code;
};
