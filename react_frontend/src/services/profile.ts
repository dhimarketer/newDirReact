// 2025-01-27: Profile service for handling profile-related API calls

import { apiService } from './api';

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface DonatePointsData {
  recipient_username: string;
  points: number;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

class ProfileService {
  /**
   * Get current user's profile
   */
  async getProfile() {
    const response = await apiService.get('/auth/profile/');
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateData) {
    const response = await apiService.patch('/auth/profile/', data);
    return response.data;
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData) {
    const response = await apiService.post('/auth/profile/change_password/', data);
    return response.data;
  }

  /**
   * Donate points to another user
   */
  async donatePoints(data: DonatePointsData) {
    const response = await apiService.post('/auth/profile/donate_points/', data);
    return response.data;
  }
}

export const profileService = new ProfileService();
