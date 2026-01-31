import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { setAccessToken, setRefreshToken, getAccessToken } from '@/lib/api';
import type { User, LoginCredentials, RegisterCredentials, AuthTokens } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  googleAuth: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<{ success: boolean; data: { user: User; tokens: AuthTokens } }>(
            '/auth/login',
            credentials
          );
          const { user, tokens } = response.data.data;
          setAccessToken(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<{ success: boolean; data: { user: User; tokens: AuthTokens } }>(
            '/auth/register',
            credentials
          );
          const { user, tokens } = response.data.data;
          setAccessToken(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      googleAuth: async (idToken: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<{ success: boolean; data: { user: User; tokens: AuthTokens } }>(
            '/auth/google',
            { idToken }
          );
          const { user, tokens } = response.data.data;
          setAccessToken(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Google authentication failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Ignore logout errors
        } finally {
          setAccessToken(null);
          setRefreshToken(null);
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await api.get<{ success: boolean; data: User }>('/auth/me');
          set({ user: response.data.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
          setAccessToken(null);
          setRefreshToken(null);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
