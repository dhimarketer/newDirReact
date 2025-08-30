// 2025-01-27: Creating base API service for Phase 2 React frontend

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../utils/constants';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          // 2025-01-28: DEBUG - Log the authorization header being added
          console.log('=== API REQUEST DEBUG ===');
          console.log('DEBUG: Adding Authorization header:', `Bearer ${token.substring(0, 20)}...`);
          console.log('DEBUG: Request URL:', config.url);
          console.log('DEBUG: Request method:', config.method);
          console.log('DEBUG: Full headers:', config.headers);
          console.log('=== END API REQUEST DEBUG ===');
        } else {
          console.log('DEBUG: No auth token found in localStorage');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        // 2025-01-28: DEBUG - Log error details
        console.log('=== API RESPONSE ERROR DEBUG ===');
        console.log('DEBUG: Error status:', error.response?.status);
        console.log('DEBUG: Error message:', error.message);
        console.log('DEBUG: Error response data:', error.response?.data);
        console.log('DEBUG: Request URL:', error.config?.url);
        console.log('DEBUG: Request method:', error.config?.method);
        console.log('DEBUG: Request headers:', error.config?.headers);
        console.log('=== END API RESPONSE ERROR DEBUG ===');
        
        const originalRequest = error.config as any;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              console.log('DEBUG: Attempting token refresh...');
              // 2025-01-28: FIXED - Remove /api prefix since base URL already includes it
              const response = await this.api.post('/auth/refresh/', {
                refresh: refreshToken,
              });
              
              const { access } = response.data;
              localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access);
              console.log('DEBUG: Token refresh successful, new access token stored');
              
              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.api(originalRequest);
            } else {
              console.log('DEBUG: No refresh token available');
            }
          } catch (refreshError) {
            console.log('DEBUG: Token refresh failed:', refreshError);
            // 2025-01-28: FIXED - Remove incorrect useAuthStore usage from interceptor
            // Clear tokens and let the component handle logout
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      return await this.api.request(config);
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }



  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request({ ...config, method: 'GET', url });
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request({ ...config, method: 'POST', url, data });
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request({ ...config, method: 'PUT', url, data });
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request({ ...config, method: 'PATCH', url, data });
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request({ ...config, method: 'DELETE', url });
  }

  // Upload file
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  // Download file
  async download(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.get(url, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  // User management methods
  getUsers() {
    return this.get('/users/');
  }

  registerUser(userData: any) {
    return this.post('/auth/register/', userData);
  }

  updateUser(userId: number, userData: any) {
    return this.put(`/users/${userId}/`, userData);
  }

  deleteUser(userId: number) {
    return this.delete(`/users/${userId}/`);
  }

  updateUserScore(userId: number, scoreData: any) {
    return this.post(`/users/${userId}/update_score/`, scoreData);
  }

  changeUserPassword(userId: number, passwordData: any) {
    return this.post(`/users/${userId}/change_password/`, passwordData);
  }

  activateUser(userId: number) {
    return this.post(`/users/${userId}/activate_user/`, {});
  }

  banUser(userId: number) {
    return this.post(`/users/${userId}/ban_user/`, {});
  }

  unbanUser(userId: number) {
    return this.post(`/users/${userId}/unban_user/`, {});
  }

  changeUserType(userId: number, userType: string) {
    return this.post(`/users/${userId}/change_user_type/`, { user_type: userType });
  }

  // Error handling
  private handleError(error: AxiosError) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Bad Request:', data);
          break;
        case 401:
          console.error('Unauthorized');
          break;
        case 403:
          console.error('Forbidden');
          break;
        case 404:
          console.error('Not Found');
          break;
        case 500:
          console.error('Internal Server Error');
          break;
        default:
          console.error(`HTTP Error ${status}:`, data);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
  }

  // Set auth token manually
  setAuthToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  // Clear auth token
  clearAuthToken() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // Get auth token
  getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // 2025-01-28: ADDED - Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return token !== null && token !== undefined && token !== '';
  }

  // 2025-01-28: ADDED - Get base URL for debugging
  getBaseURL(): string {
    return this.api.defaults.baseURL || 'unknown';
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export default instance
export default apiService;
