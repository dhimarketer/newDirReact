// 2025-01-27: Implementing complete DirectoryPage with search functionality

import React, { useState, useEffect, useCallback } from 'react';
import { SearchFilters, SearchParams, SearchResponse, PhoneBookEntry, DirectoryStats as DirectoryStatsType } from '../types/directory';
import { directoryService } from '../services/directoryService';
import { PAGINATION } from '../utils/constants';
import { toast } from 'react-hot-toast';
import SearchBar from '../components/directory/SearchBar';
import SearchResults from '../components/directory/SearchResults';
import DirectoryStats from '../components/directory/DirectoryStats';
import AddDirectoryEntryModal from '../components/directory/AddDirectoryEntryModal';
import { useAuth } from '../store/authStore';
import { Plus } from 'lucide-react';

const DirectoryPage: React.FC = () => {
  const { user } = useAuth();
  
  // State management
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    page_size: PAGINATION.DEFAULT_PAGE_SIZE
  });
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [directoryStats, setDirectoryStats] = useState<DirectoryStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Add Directory Entry modal state
  const [showAddModal, setShowAddModal] = useState(false);

  // Load directory stats on component mount
  useEffect(() => {
    loadDirectoryStats();
  }, []);

  // Load directory statistics
  const loadDirectoryStats = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await directoryService.getDirectoryStats();
      setDirectoryStats(stats);
    } catch (error: any) {
      console.error('Failed to load directory stats:', error);
      toast.error('Failed to load directory statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Handle search filters change
  const handleFiltersChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
    // Reset to first page when filters change
    setSearchParams(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle search submission
  const handleSearch = useCallback(async (filters: SearchFilters) => {
    try {
      setIsLoading(true);
      setHasSearched(true);
      
      const params: SearchParams = {
        ...filters,
        page: 1,
        page_size: searchParams.page_size
      };
      
      setSearchParams(params);
      
      const response = await directoryService.searchEntries(params);
      setSearchResponse(response);
      
      // Save search to history
      await directoryService.saveSearchHistory(
        filters.query || '',
        filters,
        response.total_count
      );
      
      toast.success(`Found ${response.total_count} entries`);
      
    } catch (error: any) {
      console.error('Search failed:', error);
      toast.error(error.message || 'Search failed. Please try again.');
      setSearchResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams.page_size]);

  // Handle page change
  const handlePageChange = useCallback(async (page: number) => {
    if (page === searchParams.page) return;
    
    try {
      setIsLoading(true);
      const newParams = { ...searchParams, page };
      setSearchParams(newParams);
      
      const response = await directoryService.searchEntries({
        ...searchFilters,
        ...newParams
      });
      setSearchResponse(response);
      
    } catch (error: any) {
      console.error('Page change failed:', error);
      toast.error('Failed to load page. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, searchFilters]);

  // Handle page size change
  const handlePageSizeChange = useCallback(async (pageSize: number) => {
    try {
      setIsLoading(true);
      const newParams = { ...searchParams, page_size: pageSize, page: 1 };
      setSearchParams(newParams);
      
      const response = await directoryService.searchEntries({
        ...searchFilters,
        ...newParams
      });
      setSearchResponse(response);
      
    } catch (error: any) {
      console.error('Page size change failed:', error);
      toast.error('Failed to change page size. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, searchFilters]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!searchResponse) return;
    
    try {
      await directoryService.exportSearchResults({
        ...searchFilters,
        ...searchParams
      });
      toast.success('Export completed successfully');
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Export failed. Please try again.');
    }
  }, [searchResponse, searchFilters, searchParams]);

  // Handle quick search (from stats)
  const handleQuickSearch = useCallback(async (query: string) => {
    const filters: SearchFilters = { query };
    setSearchFilters(filters);
    await handleSearch(filters);
  }, [handleSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Directory Search</h1>
            <p className="text-gray-600">
              Search through our comprehensive directory of contacts and manage your phonebook entries.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add New Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Statistics */}
      {directoryStats && (
        <DirectoryStats 
          stats={directoryStats} 
          isLoading={isLoadingStats}
        />
      )}

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        onFiltersChange={handleFiltersChange}
        filters={searchFilters}
        isLoading={isLoading}
      />

      {/* Search Results */}
      {hasSearched && searchResponse && (
        <SearchResults
          results={searchResponse.results}
          totalCount={searchResponse.total_count}
          currentPage={searchResponse.page}
          pageSize={searchResponse.page_size}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onExport={handleExport}
          isLoading={isLoading}
        />
      )}

      {/* No Search State */}
      {!hasSearched && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Search</h3>
          <p className="text-gray-500 mb-6">
            Use the search bar above to find contacts in our directory. You can search by name, contact number, NID, or address.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleQuickSearch('')}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View All Entries
            </button>
            <button
              onClick={() => handleQuickSearch('Male')}
              className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Search Male Contacts
            </button>
            <button
              onClick={() => handleQuickSearch('Female')}
              className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Search Female Contacts
            </button>
            {user && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add New Entry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Tips */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Search Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Basic Search</h4>
            <ul className="space-y-1">
              <li>• Search by full name or partial name</li>
              <li>• Use contact numbers (7 digits)</li>
              <li>• Search by NID number</li>
              <li>• Look up by email address</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Advanced Filters</h4>
            <ul className="space-y-1">
              <li>• Filter by atoll and island</li>
              <li>• Search by profession</li>
              <li>• Filter by gender</li>
              <li>• Set age range limits</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Directory Entry Modal */}
      <AddDirectoryEntryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Refresh directory stats after adding entry
          loadDirectoryStats();
        }}
      />

      {/* Floating Action Button */}
      {user && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex items-center justify-center"
            title="Add New Entry"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage;
