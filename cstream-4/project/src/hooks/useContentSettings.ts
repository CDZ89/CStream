import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ContentSettings {
  showAdultContent: boolean;
  setShowAdultContent: (show: boolean) => void;
}

export const useContentSettings = create<ContentSettings>()(
  persist(
    (set) => ({
      showAdultContent: false,
      setShowAdultContent: (show: boolean) => set({ showAdultContent: show }),
    }),
    {
      name: 'cstream-content-settings',
    }
  )
);
