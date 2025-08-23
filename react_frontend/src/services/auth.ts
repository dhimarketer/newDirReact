// 2025-01-27: Creating authentication service for Phase 2 React frontend

import apiService from './api';
import { 
  LoginCredentials, 
  RegisterData, 
  User, 
  AuthTokens,
  PasswordResetRequest,
  PasswordResetConfirm 
} from '../types';

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ProfileUpdateResponse {
  user: User;
}

class AuthService {
  private baseUrl = 'auth'; // 2025-01-27: Fixed - removed leading slash since base URL already includes /api

  // Login user
  async login(credentials: LoginCredentials): Promise<{ data: AuthResponse }> {
    const response = await apiService.post(`${this.baseUrl}/login/`, credentials);
    return response;
  }

  // Register new user
  async register(userData: RegisterData): Promise<{ data: AuthResponse }> {
    const response = await apiService.post(`${this.baseUrl}/register/`, userData);
    return response;
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/logout/`);
    } finally {
      // Always clear local tokens
      apiService.clearAuthToken();
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ data: AuthTokens }> {
    const response = await apiService.post(`${this.baseUrl}/refresh/`, {
      refresh: refreshToken,
    });
    return response;
  }

  // Get current user profile
  async getProfile(): Promise<{ data: User }> {
    const response = await apiService.get(`${this.baseUrl}/profile/`);
    return response;
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<{ data: ProfileUpdateResponse }> {
    const response = await apiService.patch(`${this.baseUrl}/profile/`, userData);
    return response;
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/change-password/`, {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/password-reset/`, { email });
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/password-reset/confirm/`, {
      token,
      new_password: newPassword,
    });
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/verify-email/`, { token });
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/resend-verification/`, { email });
  }

  // Check if username is available
  async checkUsernameAvailability(username: string): Promise<{ data: { available: boolean } }> {
    const response = await apiService.get(`${this.baseUrl}/check-username/${username}/`);
    return response;
  }

  // Check if email is available
  async checkEmailAvailability(email: string): Promise<{ data: { available: boolean } }> {
    const response = await apiService.get(`${this.baseUrl}/check-email/${email}/`);
    return response;
  }

  // Get user sessions
  async getUserSessions(): Promise<{ data: any[] }> {
    const response = await apiService.get(`${this.baseUrl}/sessions/`);
    return response;
  }

  // Revoke user session
  async revokeSession(sessionId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/sessions/${sessionId}/`);
  }

  // Revoke all sessions except current
  async revokeAllSessions(): Promise<void> {
    await apiService.post(`${this.baseUrl}/sessions/revoke-all/`);
  }

  // Enable two-factor authentication
  async enable2FA(): Promise<{ data: { qr_code: string; backup_codes: string[] } }> {
    const response = await apiService.post(`${this.baseUrl}/2fa/enable/`);
    return response;
  }

  // Disable two-factor authentication
  async disable2FA(password: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/2fa/disable/`, { password });
  }

  // Verify two-factor authentication
  async verify2FA(code: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/2fa/verify/`, { code });
  }

  // Get backup codes
  async getBackupCodes(): Promise<{ data: { backup_codes: string[] } }> {
    const response = await apiService.get(`${this.baseUrl}/2fa/backup-codes/`);
    return response;
  }

  // Generate new backup codes
  async generateBackupCodes(password: string): Promise<{ data: { backup_codes: string[] } }> {
    const response = await apiService.post(`${this.baseUrl}/2fa/backup-codes/generate/`, { password });
    return response;
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export default instance
export default authService;