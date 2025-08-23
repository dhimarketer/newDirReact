// 2025-01-27: Creating settings service for Phase 2 React frontend

import { apiService } from './api';
import { 
  UserProfile, 
  UserPreferences, 
  UserPrivacySettings, 
  NotificationSettings,
  AdminSearchFieldSettings,
  SearchFieldVisibilityUpdate,
  ApiResponse 
} from '../types/settings';
import { mockSearchFieldSettings } from '../data/mockSearchFieldSettings';

export interface SettingsUpdateData {
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
  privacy?: Partial<UserPrivacySettings>;
  notifications?: Partial<NotificationSettings>;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ThemeSettings {
  theme: 'light' | 'dark' | 'system';
  primary_color?: string;
  accent_color?: string;
}

export interface LanguageSettings {
  language: string;
  date_format: string;
  time_format: '12h' | '24h';
  timezone: string;
}

class SettingsService {
  // Get user profile and settings
  async getUserSettings(): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiService.get('/users/profile/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch user settings');
    }
  }

  // Update user profile
  async updateProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiService.patch('/users/profile/', profileData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  }

  // Update user preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    try {
      const response = await apiService.patch('/users/preferences/', preferences);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update preferences');
    }
  }

  // Update privacy settings
  async updatePrivacySettings(privacy: Partial<UserPrivacySettings>): Promise<ApiResponse<UserPrivacySettings>> {
    try {
      const response = await apiService.patch('/users/privacy/', privacy);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update privacy settings');
    }
  }

  // Update notification settings
  async updateNotificationSettings(notifications: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> {
    try {
      const response = await apiService.patch('/users/notifications/', notifications);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update notification settings');
    }
  }

  // Change password
  async changePassword(passwordData: PasswordChangeData): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiService.post('/users/change-password/', passwordData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to change password');
    }
  }

  // Update theme settings
  async updateTheme(themeSettings: ThemeSettings): Promise<ApiResponse<ThemeSettings>> {
    try {
      const response = await apiService.patch('/users/theme/', themeSettings);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update theme settings');
    }
  }

  // Update language and locale settings
  async updateLanguage(languageSettings: LanguageSettings): Promise<ApiResponse<LanguageSettings>> {
    try {
      const response = await apiService.patch('/users/language/', languageSettings);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update language settings');
    }
  }

  // Get available themes
  async getAvailableThemes(): Promise<ApiResponse<{ themes: string[] }>> {
    try {
      const response = await apiService.get('/users/themes/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch available themes');
    }
  }

  // Get available languages
  async getAvailableLanguages(): Promise<ApiResponse<{ languages: Array<{ code: string; name: string; native_name: string }> }>> {
    try {
      const response = await apiService.get('/users/languages/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch available languages');
    }
  }

  // Export user data
  async exportUserData(): Promise<Blob> {
    try {
      const response = await apiService.get('/users/export/', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to export user data');
    }
  }

  // Delete user account
  async deleteAccount(confirmation: { confirm: boolean; reason?: string }): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiService.post('/users/delete-account/', confirmation);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete account');
    }
  }

  // Get account activity
  async getAccountActivity(): Promise<ApiResponse<{ activities: Array<{ action: string; timestamp: string; ip_address: string; device: string }> }>> {
    try {
      const response = await apiService.get('/users/activity/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch account activity');
    }
  }

  // 2025-01-27: Adding admin search field visibility settings methods
  // Get admin search field visibility settings
  async getAdminSearchFieldSettings(): Promise<ApiResponse<AdminSearchFieldSettings>> {
    try {
      // For now, return mock data. Replace with actual API call when backend is ready
      // const response = await apiService.get('/admin/search-field-settings/');
      // return response.data;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: mockSearchFieldSettings,
        message: 'Admin search field settings retrieved successfully'
      };
    } catch (error) {
      throw new Error('Failed to fetch admin search field settings');
    }
  }

  // Update admin search field visibility settings
  async updateAdminSearchFieldSettings(updates: SearchFieldVisibilityUpdate[]): Promise<ApiResponse<AdminSearchFieldSettings>> {
    try {
      // For now, simulate update with mock data. Replace with actual API call when backend is ready
      // const response = await apiService.patch('/admin/search-field-settings/', { updates });
      // return response.data;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock data based on updates
      const updatedSettings = { ...mockSearchFieldSettings };
      updatedSettings.search_fields = updatedSettings.search_fields.map(field => {
        const update = updates.find(u => u.field_name === field.field_name);
        if (update) {
          return {
            ...field,
            visible_for: { ...field.visible_for, ...update.visible_for },
            required_for: { ...field.required_for, ...update.required_for },
            searchable_for: { ...field.searchable_for, ...update.searchable_for },
          };
        }
        return field;
      });
      
      return {
        success: true,
        data: updatedSettings,
        message: 'Admin search field settings updated successfully'
      };
    } catch (error) {
      throw new Error('Failed to update admin search field settings');
    }
  }

  // Reset admin search field visibility settings to defaults
  async resetAdminSearchFieldSettings(): Promise<ApiResponse<AdminSearchFieldSettings>> {
    try {
      // For now, simulate reset with mock data. Replace with actual API call when backend is ready
      // const response = await apiService.post('/admin/search-field-settings/reset/');
      // return response.data;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        data: mockSearchFieldSettings,
        message: 'Admin search field settings reset to defaults successfully'
      };
    } catch (error) {
      throw new Error('Failed to reset admin search field settings');
    }
  }
}

export const settingsService = new SettingsService();
export default settingsService;
