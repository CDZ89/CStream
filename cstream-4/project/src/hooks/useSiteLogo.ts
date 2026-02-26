import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

interface SiteLogoState {
  logoUrl: string;
  localLogo: string | null;
  isLoading: boolean;
  setLogoUrl: (url: string) => void;
  setLocalLogo: (dataUrl: string | null) => void;
  fetchLogo: () => Promise<void>;
  uploadLogo: (file: File) => Promise<string | null>;
  removeLogo: () => Promise<void>;
}

const LOGO_BUCKET = 'avatars';
const LOGO_PATH = 'site-logo.png';
const DEFAULT_LOGO = '/logo.svg';

export const useSiteLogo = create<SiteLogoState>()(
  persist(
    (set, get) => ({
      logoUrl: DEFAULT_LOGO,
      localLogo: null,
      isLoading: false,
      setLogoUrl: (url) => set({ logoUrl: url }),
      setLocalLogo: (dataUrl) => set({ localLogo: dataUrl }),
  
      fetchLogo: async () => {
        set({ isLoading: true });
        const { localLogo } = get();
    
        if (localLogo) {
          set({ logoUrl: localLogo, isLoading: false });
          return;
        }
    
        try {
          const { data } = supabase.storage
            .from(LOGO_BUCKET)
            .getPublicUrl(LOGO_PATH);
      
          if (data?.publicUrl) {
            try {
              const response = await fetch(data.publicUrl, { method: 'HEAD' });
              if (response.ok) {
                const supabaseUrl = `${data.publicUrl}?t=${Date.now()}`;
                set({ logoUrl: supabaseUrl, isLoading: false });
                return;
              }
            } catch {
              // Use default logo if fetch fails
            }
          }
          set({ logoUrl: DEFAULT_LOGO, isLoading: false });
        } catch {
          set({ logoUrl: DEFAULT_LOGO, isLoading: false });
        }
      },
  
      uploadLogo: async (file: File) => {
        try {
          // Always save to local storage first for persistence
          const reader = new FileReader();
          const localDataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });
          
          // Save to local state immediately
          set({ logoUrl: localDataUrl, localLogo: localDataUrl });
          
          // Try to upload to Supabase as well
          try {
            const { error: uploadError } = await supabase.storage
              .from(LOGO_BUCKET)
              .upload(LOGO_PATH, file, { upsert: true });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from(LOGO_BUCKET)
                .getPublicUrl(LOGO_PATH);
              const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
              set({ logoUrl: newUrl });
            }
          } catch (supabaseError) {
            console.warn('Supabase upload failed, using local storage:', supabaseError);
          }
          
          return localDataUrl;
        } catch (error) {
          console.error('Error uploading site logo:', error);
          return null;
        }
      },
  
      removeLogo: async () => {
        try {
          await supabase.storage
            .from(LOGO_BUCKET)
            .remove([LOGO_PATH]);
        } catch (error) {
          console.warn('Error removing from Supabase:', error);
        }
        set({ logoUrl: DEFAULT_LOGO, localLogo: null });
      }
    }),
    {
      name: 'site-logo-storage',
      partialize: (state) => ({ localLogo: state.localLogo }),
    }
  )
);

export const initializeSiteLogo = async () => {
  const store = useSiteLogo.getState();
  await store.fetchLogo();
};
