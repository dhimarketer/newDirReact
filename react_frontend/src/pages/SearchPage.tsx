// 2025-01-27: Implementing functional SearchPage with SearchBar and SearchResults components
// 2025-01-27: COMPLETELY SIMPLIFIED - Google-like minimal interface for better UX
// 2025-01-29: ADDED - URL query parameter handling for header search bar integration

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/directory/SearchBar';
import SearchResults from '../components/directory/SearchResults';
import { SearchFilters, PhoneBookEntry, SearchResponse, SearchParams } from '../types/directory';
import { directoryService } from '../services/directoryService';
import { useAuth } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    name: '',
    contact: '',
    nid: '',
    address: '',
    atoll: '',
    island: '',
    party: '',
    profession: '',
    gender: '',
    min_age: undefined,
    max_age: undefined,
    remark: '',
    pep_status: ''
  });

  const [searchResults, setSearchResults] = useState<PhoneBookEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Handle URL query parameters on component mount
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      const newFilters = { ...filters, query: queryParam };
      setFilters(newFilters);
      // Clear the URL parameter after setting it
      setSearchParams({}, { replace: true });
      // Perform search with the query parameter
      const searchParams: SearchParams = { ...newFilters, page: 1, page_size: pageSize };
      performSearch(searchParams);
    }
  }, []);

  // Perform search with current filters
  const performSearch = async (searchParams: SearchParams) => {
    setIsLoading(true);
    setSearchStartTime(Date.now());
    setShowTimeoutWarning(false);
    console.log('🔍 SearchPage: performSearch called with params:', searchParams);
    
    // 2025-01-28: Add timeout warning for long searches
    const timeoutWarningTimer = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, 15000); // Show warning after 15 seconds
    
    try {
      console.log('🔍 SearchPage: Calling directoryService.searchEntries...');
      const response: SearchResponse = await directoryService.searchEntries(searchParams);
      
      console.log('🔍 SearchPage: Response received:', response);
      console.log('🔍 SearchPage: Response type:', typeof response);
      console.log('🔍 SearchPage: Response.results type:', typeof response.results);
      console.log('🔍 SearchPage: Response.results length:', response.results?.length);
      console.log('🔍 SearchPage: Response.total_count:', response.total_count);
      console.log('🔍 SearchPage: Response.results sample:', response.results?.slice(0, 2));
      
      // 2025-01-29: FIXED - Ensure results is always an array
      const results = Array.isArray(response.results) ? response.results : [];
      const totalCount = response.total_count || 0;
      
      console.log('🔍 SearchPage: Processed results length:', results.length);
      console.log('🔍 SearchPage: Processed total_count:', totalCount);
      
      setSearchResults(results);
      setTotalCount(totalCount);
      
      console.log('🔍 SearchPage: State updated - searchResults.length:', results.length);
      console.log('🔍 SearchPage: State updated - totalCount:', totalCount);
      
      // Try to save search to history (optional feature)
      try {
        await directoryService.saveSearchHistory(
          searchParams.query || '',
          searchParams,
          totalCount
        );
      } catch (historyError) {
        // Search history is optional, don't fail the search
        console.warn('Failed to save search history:', historyError);
      }
      
      if (totalCount === 0) {
        toast.success('No results found for your search criteria');
      } else {
        toast.success(`Found ${totalCount} results`);
      }
    } catch (error: any) {
      console.error('🔍 SearchPage: Search error:', error);
      console.error('🔍 SearchPage: Search params that failed:', searchParams);
      toast.error(error.message || 'Search failed. Please try again.');
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
      setSearchStartTime(null);
      setShowTimeoutWarning(false);
      clearTimeout(timeoutWarningTimer);
      console.log('🔍 SearchPage: Search completed, isLoading set to false');
    }
  };

  // Handle search submission
  const handleSearch = (searchFilters: SearchFilters) => {
    setCurrentPage(1);
    setFilters(searchFilters);
    
    // Clean filters to avoid conflicts - but preserve explicitly parsed field filters
    const cleanFilters = { ...searchFilters };
    
    // 2025-01-27: Fixed filter cleaning logic to preserve parsed field filters
    // When we have parsed filters (address, island, party, etc.), keep them
    // Only remove individual field filters if they exactly match the query field
    if (cleanFilters.query && cleanFilters.query.trim()) {
      // Check if we have parsed field filters that should be preserved
      const hasParsedFilters = cleanFilters.address || cleanFilters.island || 
                              cleanFilters.party || cleanFilters.name || 
                              cleanFilters.profession || cleanFilters.contact || 
                              cleanFilters.nid || cleanFilters.atoll || 
                              cleanFilters.gender || cleanFilters.remark || 
                              cleanFilters.pep_status;
      
      if (hasParsedFilters) {
        // We have parsed field filters, so this is a smart search
        // Keep all the parsed filters and remove only the general query
        // This ensures "habaruge, hithadhoo" works as address+island search
        console.log('Smart search detected - preserving parsed field filters:', {
          address: cleanFilters.address,
          island: cleanFilters.island,
          party: cleanFilters.party,
          name: cleanFilters.name,
          profession: cleanFilters.profession
        });
        
        // Remove the general query field since we're using specific field filters
        delete cleanFilters.query;
      } else {
        // No parsed filters, this is a general search
        // Remove individual field filters that might conflict with the general query
        // Only keep filters that are explicitly set and different from the query
        if (cleanFilters.name === cleanFilters.query) delete cleanFilters.name;
        if (cleanFilters.contact === cleanFilters.query) delete cleanFilters.contact;
        if (cleanFilters.nid === cleanFilters.query) delete cleanFilters.nid;
        if (cleanFilters.address === cleanFilters.query) delete cleanFilters.address;
        if (cleanFilters.party === cleanFilters.query) delete cleanFilters.party;
        if (cleanFilters.profession === cleanFilters.query) delete cleanFilters.profession;
      }
    }
    
    const searchParams: SearchParams = { ...cleanFilters, page: 1, page_size: pageSize };
    console.log('Cleaned search params:', searchParams);
    performSearch(searchParams);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const searchParams: SearchParams = { ...filters, page, page_size: pageSize };
    performSearch(searchParams);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    const searchParams: SearchParams = { ...filters, page: 1, page_size: newPageSize };
    performSearch(searchParams);
  };

  // Handle export
  const handleExport = async () => {
    try {
      // Export functionality can be implemented here
      toast.success('Export functionality will be implemented in the next phase');
    } catch (error: any) {
      toast.error('Export failed. Please try again.');
    }
  };

  // Initial search on component mount - only if no URL query parameter
  useEffect(() => {
    if (filters.query && !searchParams.get('q')) {
      const searchParams: SearchParams = { ...filters, page: 1, page_size: pageSize };
      performSearch(searchParams);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Search page header - removed duplicate navigation */}
      <div className="flex justify-end p-4">
        {/* Navigation handled by sidebar - no duplicate links */}
      </div>

      {/* Main search area - Google style */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Directory Search</h1>
          <p className="text-blue-500">Find people, places, and information</p>
        </div>

        {/* Search bar */}
        <div className="w-full max-w-2xl mb-8">
          <SearchBar
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            filters={filters}
            isLoading={isLoading}
          />
          
          {/* Timeout warning for long searches */}
          {showTimeoutWarning && isLoading && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800 text-sm">
                ⏱️ Search is taking longer than expected. This is normal for complex searches with our large database.
              </p>
            </div>
          )}
        </div>

        {/* Simple search tips */}
        <div className="text-center text-sm text-blue-400 max-w-md">
          <p>Try searching for names, addresses, islands, or contact numbers</p>
        </div>
      </div>

      {/* Search results - only show when there are results */}
      {searchResults.length > 0 || isLoading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <SearchResults
            results={searchResults}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onExport={handleExport}
            isLoading={isLoading}
            searchFilters={filters}  // 2025-01-28: Pass search filters to preserve island parameter
          />
        </div>
      ) : filters.query && !isLoading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                  <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-6 text-center">
          <h3 className="text-lg font-medium text-blue-800 mb-2">No results found</h3>
          <p className="text-blue-600">
            Try adjusting your search criteria or filters to find what you're looking for.
          </p>
        </div>
        </div>
      ) : null}

      {/* Premium features - very subtle at bottom */}
      {user && user.score && user.score >= 10 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="text-center">
            <Link
              to="/premium-image-search"
              className="inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Image Search ({user.score} pts)
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
