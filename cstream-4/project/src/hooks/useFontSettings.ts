import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting';
  googleFont?: boolean;
}

export const availableFonts: FontOption[] = [
  { id: 'system', name: 'Système', family: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif', category: 'sans-serif' },
  { id: 'inter', name: 'Inter', family: '"Inter", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'roboto', name: 'Roboto', family: '"Roboto", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'open-sans', name: 'Open Sans', family: '"Open Sans", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'poppins', name: 'Poppins', family: '"Poppins", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'montserrat', name: 'Montserrat', family: '"Montserrat", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'lato', name: 'Lato', family: '"Lato", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'nunito', name: 'Nunito', family: '"Nunito", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'raleway', name: 'Raleway', family: '"Raleway", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'ubuntu', name: 'Ubuntu', family: '"Ubuntu", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'quicksand', name: 'Quicksand', family: '"Quicksand", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'space-grotesk', name: 'Space Grotesk', family: '"Space Grotesk", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'dm-sans', name: 'DM Sans', family: '"DM Sans", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'outfit', name: 'Outfit', family: '"Outfit", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'plus-jakarta', name: 'Plus Jakarta Sans', family: '"Plus Jakarta Sans", sans-serif', category: 'sans-serif', googleFont: true },
  { id: 'playfair', name: 'Playfair Display', family: '"Playfair Display", serif', category: 'serif', googleFont: true },
  { id: 'merriweather', name: 'Merriweather', family: '"Merriweather", serif', category: 'serif', googleFont: true },
  { id: 'lora', name: 'Lora', family: '"Lora", serif', category: 'serif', googleFont: true },
  { id: 'source-serif', name: 'Source Serif Pro', family: '"Source Serif Pro", serif', category: 'serif', googleFont: true },
  { id: 'fira-code', name: 'Fira Code', family: '"Fira Code", monospace', category: 'monospace', googleFont: true },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', family: '"JetBrains Mono", monospace', category: 'monospace', googleFont: true },
  { id: 'source-code', name: 'Source Code Pro', family: '"Source Code Pro", monospace', category: 'monospace', googleFont: true },
  { id: 'bebas', name: 'Bebas Neue', family: '"Bebas Neue", cursive', category: 'display', googleFont: true },
  { id: 'oswald', name: 'Oswald', family: '"Oswald", sans-serif', category: 'display', googleFont: true },
  { id: 'righteous', name: 'Righteous', family: '"Righteous", cursive', category: 'display', googleFont: true },
  { id: 'pacifico', name: 'Pacifico', family: '"Pacifico", cursive', category: 'handwriting', googleFont: true },
  { id: 'dancing-script', name: 'Dancing Script', family: '"Dancing Script", cursive', category: 'handwriting', googleFont: true },
  { id: 'caveat', name: 'Caveat', family: '"Caveat", cursive', category: 'handwriting', googleFont: true },
];

interface FontSettingsStore {
  selectedFontId: string;
  fontSize: number;
  loadedFonts: Set<string>;
  setFont: (fontId: string) => void;
  setFontSize: (size: number) => void;
  loadFont: (fontId: string) => Promise<void>;
  getCurrentFont: () => FontOption;
  applyFont: () => void;
}

const loadGoogleFont = async (fontName: string): Promise<void> => {
  const formattedName = fontName.replace(/\s+/g, '+');
  const linkId = `google-font-${formattedName}`;
  
  if (document.getElementById(linkId)) {
    return;
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@300;400;500;600;700&display=swap`;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load font: ${fontName}`));
    document.head.appendChild(link);
  });
};

export const useFontSettings = create<FontSettingsStore>()(
  persist(
    (set, get) => ({
      selectedFontId: 'system',
      fontSize: 16,
      loadedFonts: new Set<string>(),

      setFont: async (fontId: string) => {
        const font = availableFonts.find(f => f.id === fontId);
        set({ selectedFontId: fontId });
        
        // Guard against non-browser environments (SSR/tests)
        if (typeof document === 'undefined') return;
        
        // Apply font immediately for instant visual feedback
        if (font) {
          document.documentElement.style.fontFamily = font.family;
          document.body.style.fontFamily = font.family;
        }
        
        // Load Google Font if needed and re-apply with reflow
        if (font?.googleFont) {
          await get().loadFont(fontId);
          get().applyFont();
        }
      },

      setFontSize: (size: number) => {
        const clampedSize = Math.max(12, Math.min(24, size));
        set({ fontSize: clampedSize });
        document.documentElement.style.fontSize = `${clampedSize}px`;
      },

      loadFont: async (fontId: string) => {
        const font = availableFonts.find(f => f.id === fontId);
        if (!font || !font.googleFont) return;

        const { loadedFonts } = get();
        if (loadedFonts.has(fontId)) return;

        try {
          await loadGoogleFont(font.name);
          set(state => ({
            loadedFonts: new Set([...state.loadedFonts, fontId])
          }));
        } catch (error) {
          console.error('Error loading font:', error);
        }
      },

      getCurrentFont: () => {
        const { selectedFontId } = get();
        return availableFonts.find(f => f.id === selectedFontId) || availableFonts[0];
      },

      applyFont: () => {
        // Guard against non-browser environments (SSR/tests)
        if (typeof document === 'undefined') return;
        
        const font = get().getCurrentFont();
        document.documentElement.style.fontFamily = font.family;
        document.body.style.fontFamily = font.family;
        // Force reflow to ensure immediate visual update
        void document.body.offsetHeight;
      },
    }),
    {
      name: 'cstream-font-settings',
      partialize: (state) => ({
        selectedFontId: state.selectedFontId,
        fontSize: state.fontSize,
      }),
    }
  )
);

export const initializeFontSettings = async () => {
  if (typeof document === 'undefined') return;
  
  const { selectedFontId, loadFont, applyFont, fontSize, getCurrentFont } = useFontSettings.getState();
  
  // Apply font immediately for instant visual
  const font = getCurrentFont();
  document.documentElement.style.fontFamily = font.family;
  document.body.style.fontFamily = font.family;
  document.documentElement.style.fontSize = `${fontSize}px`;
  
  // Load Google Font in background if needed
  if (selectedFontId !== 'system' && font.googleFont) {
    await loadFont(selectedFontId);
    applyFont();
  }
};
