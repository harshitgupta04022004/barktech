import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  activeModal: string | null;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'system',
      activeModal: null,

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setTheme: (theme) => {
        set({ theme });
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', prefersDark);
        }
      },

      openModal: (id) => {
        set({ activeModal: id });
      },

      closeModal: () => {
        set({ activeModal: null });
      },
    }),
    {
      name: STORAGE_KEYS.SIDEBAR,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
