import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavbarTheme = 'default' | 'blur' | 'glass';

interface NavbarThemeState {
    theme: NavbarTheme;
    setTheme: (theme: NavbarTheme) => void;
}

export const useNavbarTheme = create<NavbarThemeState>()(
    persist(
        (set) => ({
            theme: 'default',
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'cstream-navbar-theme',
        }
    )
);
