import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
        set({ user });
      },

      setToken: (token) => {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        set({ token, isAuthenticated: true });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_USER,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
