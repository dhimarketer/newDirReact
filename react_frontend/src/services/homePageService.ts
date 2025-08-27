// 2025-01-27: Creating home page service to fetch real statistics from Django API
// 2025-01-27: Fixed API endpoint construction and data structure to prevent double /api/ issue
// 2025-01-27: Updated interface to match actual Django analytics endpoint response

import apiService from './api';

export interface HomePageStats {
  overview: {
    total_users: number;
    total_contacts: number;
    total_families: number;
    pending_changes: number;
  };
  users: {
    active_users: number;
    banned_users: number;
    average_score: number;
  };
  contacts_by_atoll: Array<{ atoll: string; count: number }>;
  recent_activity: Array<{
    id: number;
    event_type: string;
    description: string;
    timestamp: string;
    user: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
    };
  }>;
}

class HomePageService {
  /**
   * Get home page statistics
   */
  async getHomePageStats(): Promise<HomePageStats> {
    try {
      // Check if user is authenticated before making API call
      if (!apiService.isAuthenticated()) {
        console.log('HomePageService: User not authenticated, returning fallback data');
        return this.getFallbackStats();
      }
      
      console.log('HomePageService: Making API call to: /analytics/');
      const response = await apiService.get<HomePageStats>('/analytics/');
      console.log('HomePageService: API response received:', response);
      return response.data;
    } catch (error: any) {
      console.error('HomePageService: Failed to fetch home page stats:', error);
      console.error('HomePageService: Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Return fallback data if API fails
      return this.getFallbackStats();
    }
  }

  /**
   * Get fallback statistics when API is unavailable or user is not authenticated
   */
  private getFallbackStats(): HomePageStats {
    return {
      overview: {
        total_users: 0,
        total_contacts: 0,
        total_families: 0,
        pending_changes: 0
      },
      users: {
        active_users: 0,
        banned_users: 0,
        average_score: 0
      },
      contacts_by_atoll: [],
      recent_activity: []
    };
  }

  /**
   * Get directory statistics specifically
   */
  async getDirectoryStats(): Promise<any> {
    try {
      const response = await apiService.get('/analytics/directory_stats/');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch directory stats:', error);
      return null;
    }
  }
}

export const homePageService = new HomePageService();
export default homePageService;
