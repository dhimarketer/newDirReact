// 2025-01-27: Directory service for API calls including search functionality

import apiService from './api';
import { 
  PhoneBookEntry, 
  SearchParams, 
  SearchResponse, 
  SearchSuggestion,
  DirectoryStats,
  SearchHistory,
  PhoneBookEntryWithImage
} from '../types/directory';
import { API_CONFIG } from '../utils/constants';

class DirectoryService {
  private baseUrl = `/phonebook`;

  /**
   * Search phonebook entries with filters
   */
  async searchEntries(params: SearchParams): Promise<SearchResponse> {
    try {
      const response = await apiService.post<SearchResponse>(`${this.baseUrl}/advanced_search/`, params);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search entries');
    }
  }

  /**
   * Get phonebook entry by ID
   */
  async getEntry(id: number): Promise<PhoneBookEntry> {
    try {
      const response = await apiService.get<PhoneBookEntry>(`${this.baseUrl}/${id}/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get entry');
    }
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<SearchSuggestion[]> {
    try {
      const response = await apiService.get<{results: SearchSuggestion[]}>(`${this.baseUrl}/`, {
        params: {
          search: query,
          page_size: limit
        }
      });
      return response.data.results || [];
    } catch (error: any) {
      console.warn('Failed to get search suggestions:', error);
      return [];
    }
  }

  /**
   * Get directory statistics
   */
  async getDirectoryStats(): Promise<DirectoryStats> {
    try {
      // 2025-01-28: FIXED - Use public stats endpoint that doesn't require authentication
      const response = await apiService.get<DirectoryStats>(`/phonebook/public_stats/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get directory stats');
    }
  }

  /**
   * Get search history for current user
   */
  async getSearchHistory(): Promise<SearchHistory[]> {
    try {
      const response = await apiService.get<SearchHistory[]>(`${this.baseUrl}/search_history/`);  // 2025-01-27: Fixed - use correct endpoint name
      return response.data;
    } catch (error: any) {
      console.warn('Failed to get search history:', error);
      return [];
    }
  }

  /**
   * Save search to history
   */
  async saveSearchHistory(query: string, filters: any, resultCount: number): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/save_search_history/`, {  // 2025-01-27: Fixed - use correct endpoint name
        query,
        filters,
        result_count: resultCount
      });
    } catch (error: any) {
      console.warn('Failed to save search history:', error);
    }
  }

  /**
   * Export search results
   */
  async exportSearchResults(params: SearchParams, format: 'csv' | 'excel' = 'csv'): Promise<void> {
    try {
      const response = await apiService.post(`${this.baseUrl}/export/`, {
        ...params,
        format
      }, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `directory_search_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export search results');
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(): Promise<string[]> {
    try {
      const response = await apiService.get<{ popular_searches: string[] }>(`${this.baseUrl}/popular-searches/`);
      return response.data.popular_searches || [];
    } catch (error: any) {
      console.warn('Failed to get popular searches:', error);
      return [];
    }
  }

  /**
   * Premium feature: Search entries with images, especially PEP profiles
   */
  async premiumImageSearch(params: {
    query?: string;
    pep_only?: boolean;
    status?: string;  // 2025-01-28: Added status filter
    atoll?: string;
    island?: string;
    party?: string;
    profession?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    results: PhoneBookEntryWithImage[];
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
    pep_count: number;
    total_with_images: number;
  }> {
    try {
      console.log('=== PREMIUM IMAGE SEARCH DEBUG ===');
      console.log('Making API call to premium_image_search with params:', params);
      
      const response = await apiService.get<{
        results: PhoneBookEntryWithImage[];
        total_count: number;
        page: number;
        page_size: number;
        total_pages: number;
        pep_count: number;
        total_with_images: number;
      }>(`${this.baseUrl}/premium_image_search/`, { params });
      
      console.log('API Response received:', response);
      console.log('Response data:', response.data);
      console.log('Results count:', response.data.results?.length || 0);
      if (response.data.results && response.data.results.length > 0) {
        console.log('First result sample:', response.data.results[0]);
      }
      console.log('=== END PREMIUM IMAGE SEARCH DEBUG ===');
      
      return response.data;
    } catch (error: any) {
      console.error('Premium image search error:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 403 && error.response?.data?.code === 'PREMIUM_REQUIRED') {
        throw new Error('Premium feature. Upgrade your account to access image search.');
      }
      throw new Error(error.response?.data?.message || 'Failed to perform premium image search');
    }
  }

  /**
   * Get complete person details by PID
   */
  async getPersonDetails(pid: number): Promise<PhoneBookEntryWithImage> {
    try {
      console.log('=== GET PERSON DETAILS DEBUG ===');
      console.log('Fetching details for PID:', pid);
      
      const response = await apiService.get<{ person: PhoneBookEntryWithImage }>(
        `${this.baseUrl}/get_person_details/`, 
        { params: { pid } }
      );
      
      console.log('Person details response:', response.data);
      console.log('=== END GET PERSON DETAILS DEBUG ===');
      
      return response.data.person;
    } catch (error: any) {
      console.error('Failed to get person details:', error);
      throw new Error(error.response?.data?.message || 'Failed to get person details');
    }
  }
}

// Create singleton instance
export const directoryService = new DirectoryService();

// Export default instance
export default directoryService;
