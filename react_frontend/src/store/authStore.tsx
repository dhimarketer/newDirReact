// 2025-01-27: Creating simplified authentication store to reduce errors

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, AuthTokens, User, LoginCredentials, RegisterData } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { authService } from '../services/auth';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authService.login(credentials);
          const { user, access_token, refresh_token } = response.data;
          
          // Transform Django response format to match frontend expectations
          const tokens = {
            access: access_token,
            refresh: refresh_token
          };
          
          // Ensure boolean fields are properly typed
          const normalizedUser = {
            ...user,
            is_staff: Boolean(user.is_staff),
            is_superuser: Boolean(user.is_superuser),
            is_active: Boolean(user.is_active),
          };
          
          // Store tokens in localStorage for API service
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
          
          set({
            user: normalizedUser,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed',
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authService.register(userData);
          const { user, access_token, refresh_token } = response.data;
          
          // Transform Django response format to match frontend expectations
          const tokens = {
            access: access_token,
            refresh: refresh_token
          };
          
          // Ensure boolean fields are properly typed
          const normalizedUser = {
            ...user,
            is_staff: Boolean(user.is_staff),
            is_superuser: Boolean(user.is_superuser),
            is_active: Boolean(user.is_active),
          };
          
          // Store tokens in localStorage for API service
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
          
          set({
            user: normalizedUser,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Registration failed',
          });
          throw error;
        }
      },

      logout: () => {
        // Clear tokens from localStorage
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        // Reset state
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      refreshToken: async () => {
        try {
          const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          
          const response = await authService.refreshToken(refreshToken);
          const { access_token, refresh_token } = response.data;
          
          // Update tokens in localStorage
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token);
          if (refresh_token) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
          }
          
          // Update state
          set({
            tokens: {
              access: access_token,
              refresh: refresh_token || refreshToken
            }
          });
        } catch (error: any) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      getCurrentUser: async () => {
        try {
          set({ isLoading: true });
          
          const response = await authService.getProfile();
          const user = response.data;
          
          // Ensure boolean fields are properly typed
          const normalizedUser = {
            ...user,
            is_staff: Boolean(user.is_staff),
            is_superuser: Boolean(user.is_superuser),
            is_active: Boolean(user.is_active),
          };
          
          set({
            user: normalizedUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to get user profile',
          });
          throw error;
        }
      },

      updateProfile: async (userData: Partial<User>) => {
        try {
          set({ isLoading: true });
          
          const response = await authService.updateProfile(userData);
          const user = response.data.user;
          
          // Ensure boolean fields are properly typed
          const normalizedUser = {
            ...user,
            is_staff: Boolean(user.is_staff),
            is_superuser: Boolean(user.is_superuser),
            is_active: Boolean(user.is_active),
          };
          
          set({
            user: normalizedUser,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to update profile',
          });
          throw error;
        }
      },

      requestPasswordReset: async (email: string) => {
        try {
          set({ isLoading: true });
          await authService.requestPasswordReset(email);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to request password reset',
          });
          throw error;
        }
      },

      resetPassword: async (token: string, newPassword: string) => {
        try {
          set({ isLoading: true });
          await authService.resetPassword(token, newPassword);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to reset password',
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initializeFromStorage: () => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          // Try to get current user from API
          get().getCurrentUser().catch(() => {
            // If failed, clear invalid token
            get().logout();
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Export hook
export const useAuth = useAuthStore;

// Provider component for React context compatibility
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
