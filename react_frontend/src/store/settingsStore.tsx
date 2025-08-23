// 2025-01-27: Creating settings store for Phase 2 React frontend

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  UserProfile, 
  UserPreferences, 
  UserPrivacySettings, 
  NotificationSettings,
  AdminSearchFieldSettings,
  SearchFieldVisibilityUpdate,
  LoadingState 
} from '../types/settings';
import { settingsService } from '../services/settingsService';
import { STORAGE_KEYS } from '../utils/constants';

interface SettingsState {
  // Data
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  privacy: UserPrivacySettings | null;
  notifications: NotificationSettings | null;
  adminSearchFieldSettings: AdminSearchFieldSettings | null;
  
  // Loading states
  profileLoading: LoadingState;
  preferencesLoading: LoadingState;
  privacyLoading: LoadingState;
  notificationsLoading: LoadingState;
  adminSearchFieldSettingsLoading: LoadingState;
  
  // Errors
  profileError: string | null;
  preferencesError: string | null;
  privacyError: string | null;
  notificationsError: string | null;
  adminSearchFieldSettingsError: string | null;
  
  // Actions
  fetchUserSettings: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  updatePrivacySettings: (privacy: Partial<UserPrivacySettings>) => Promise<void>;
  updateNotificationSettings: (notifications: Partial<NotificationSettings>) => Promise<void>;
  fetchAdminSearchFieldSettings: () => Promise<void>;
  updateAdminSearchFieldSettings: (updates: SearchFieldVisibilityUpdate[]) => Promise<void>;
  resetAdminSearchFieldSettings: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  exportUserData: () => Promise<void>;
  deleteAccount: (reason?: string) => Promise<void>;
  clearErrors: () => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      preferences: null,
      privacy: null,
      notifications: null,
      adminSearchFieldSettings: null,
      
      profileLoading: 'idle',
      preferencesLoading: 'idle',
      privacyLoading: 'idle',
      notificationsLoading: 'idle',
      adminSearchFieldSettingsLoading: 'idle',
      
      profileError: null,
      preferencesError: null,
      privacyError: null,
      notificationsError: null,
      adminSearchFieldSettingsError: null,

      // Actions
      fetchUserSettings: async () => {
        try {
          set({ profileLoading: 'loading', profileError: null });
          
          const response = await settingsService.getUserSettings();
          if (response.success && response.data) {
            const userProfile = response.data;
            set({
              profile: userProfile,
              preferences: userProfile.preferences,
              privacy: userProfile.privacy_settings,
              notifications: userProfile.notification_settings,
              profileLoading: 'success',
            });
          } else {
            throw new Error(response.message || 'Failed to fetch settings');
          }
        } catch (error: any) {
          set({
            profileLoading: 'error',
            profileError: error.message || 'Failed to fetch settings',
          });
        }
      },

      updateProfile: async (profileData: Partial<UserProfile>) => {
        try {
          set({ profileLoading: 'loading', profileError: null });
          
          const response = await settingsService.updateProfile(profileData);
          if (response.success && response.data) {
            set({
              profile: response.data,
              profileLoading: 'success',
            });
          } else {
            throw new Error(response.message || 'Failed to update profile');
          }
        } catch (error: any) {
          set({
            profileLoading: 'error',
            profileError: error.message || 'Failed to update profile',
          });
          throw error;
        }
      },

      updatePreferences: async (preferences: Partial<UserPreferences>) => {
        try {
          set({ preferencesLoading: 'loading', preferencesError: null });
          
          const response = await settingsService.updatePreferences(preferences);
          if (response.success && response.data) {
            set({
              preferences: response.data,
              preferencesLoading: 'success',
            });
          } else {
            throw new Error(response.message || 'Failed to update preferences');
          }
        } catch (error: any) {
          set({
            preferencesLoading: 'error',
            preferencesError: error.message || 'Failed to update preferences',
          });
          throw error;
        }
      },

      updatePrivacySettings: async (privacy: Partial<UserPrivacySettings>) => {
        try {
          set({ privacyLoading: 'loading', privacyError: null });
          
          const response = await settingsService.updatePrivacySettings(privacy);
          if (response.success && response.data) {
            set({
              privacy: response.data,
              privacyLoading: 'success',
            });
          } else {
            throw new Error(response.message || 'Failed to update privacy settings');
          }
        } catch (error: any) {
          set({
            privacyLoading: 'error',
            privacyError: error.message || 'Failed to update privacy settings',
          });
          throw error;
        }
      },

      updateNotificationSettings: async (notifications: Partial<NotificationSettings>) => {
        try {
          set({ notificationsLoading: 'loading', notificationsError: null });
          
          const response = await settingsService.updateNotificationSettings(notifications);
          if (response.success && response.data) {
            set({
              notifications: response.data,
              notificationsLoading: 'success',
            });
          } else {
            throw new Error(response.message || 'Failed to update notification settings');
          }
        } catch (error: any) {
          set({
            notificationsLoading: 'error',
            notificationsError: error.message || 'Failed to update notification settings',
          });
          throw error;
        }
      },

      // 2025-01-27: Adding admin search field visibility settings actions
      fetchAdminSearchFieldSettings: async () => {
        try {
          set({ adminSearchFieldSettingsLoading: 'loading', adminSearchFieldSettingsError: null });
          
          const response = await settingsService.getAdminSearchFieldSettings();
          if (response.success && response.data) {
            set({
              adminSearchFieldSettings: response.data,
              adminSearchFieldSettingsLoading: 'success',
            });
          } else {
            throw new Error(response.message || 'Failed to fetch admin search field settings');
          }
        } catch (error: any) {
          set({
            adminSearchFieldSettingsLoading: 'error',
            adminSearchFieldSettingsError: error.message || 'Failed to fetch admin search field settings',
          });
          throw error;
        }
      },

      updateAdminSearchFieldSettings: async (updates: SearchFieldVisibilityUpdate[]) => {
        try {
          set({ adminSearchFieldSettingsLoading: 'loading', adminSearchFieldSettingsError: null });
          
          const response = await settingsService.updateAdminSearchFieldSettings(updates);
          if (response.success && response.data) {
            set({
              adminSearchFieldSettings: response.data,
              adminSearchFieldSettingsLoading: 'success',
            });
          } else {
            throw new Error(response.message || 'Failed to update admin search field settings');
          }
        } catch (error: any) {
          set({
            adminSearchFieldSettingsLoading: 'error',
            adminSearchFieldSettingsError: error.message || 'Failed to update admin search field settings',
          });
          throw error;
        }
      },

      resetAdminSearchFieldSettings: async () => {
        try {
          set({ adminSearchFieldSettingsLoading: 'loading', adminSearchFieldSettingsError: null });
          
          const response = await settingsService.resetAdminSearchFieldSettings();
          if (response.success && response.data) {
            set({
              adminSearchFieldSettings: response.data,
              adminSearchFieldSettingsLoading: 'success',
            });
          } else {
            throw new Error(response.message || 'Failed to reset admin search field settings');
          }
        } catch (error: any) {
          set({
            adminSearchFieldSettingsLoading: 'error',
            adminSearchFieldSettingsError: error.message || 'Failed to reset admin search field settings',
          });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match');
        }

        try {
          await settingsService.changePassword({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          });
        } catch (error: any) {
          throw new Error(error.message || 'Failed to change password');
        }
      },

      exportUserData: async () => {
        try {
          const blob = await settingsService.exportUserData();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'user-data-export.json';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error: any) {
          throw new Error(error.message || 'Failed to export user data');
        }
      },

      deleteAccount: async (reason?: string) => {
        try {
          await settingsService.deleteAccount({ confirm: true, reason });
        } catch (error: any) {
          throw new Error(error.message || 'Failed to delete account');
        }
      },

      clearErrors: () => {
        set({
          profileError: null,
          preferencesError: null,
          privacyError: null,
          notificationsError: null,
          adminSearchFieldSettingsError: null,
        });
      },

      resetSettings: () => {
        set({
          profile: null,
          preferences: null,
          privacy: null,
          notifications: null,
          adminSearchFieldSettings: null,
          profileLoading: 'idle',
          preferencesLoading: 'idle',
          privacyLoading: 'idle',
          notificationsLoading: 'idle',
          adminSearchFieldSettingsLoading: 'idle',
          profileError: null,
          preferencesError: null,
          privacyError: null,
          notificationsError: null,
          adminSearchFieldSettingsError: null,
        });
      },
    }),
    {
      name: STORAGE_KEYS.USER_PREFERENCES,
      partialize: (state) => ({
        preferences: state.preferences,
        privacy: state.privacy,
        notifications: state.notifications,
      }),
    }
  )
);
