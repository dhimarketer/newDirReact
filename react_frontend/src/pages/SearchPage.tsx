// 2025-01-27: Implementing functional SearchPage with SearchBar and SearchResults components

import React, { useState, useEffect } from 'react';
import SearchBar from '../components/directory/SearchBar';
import SearchResults from '../components/directory/SearchResults';
import { SearchFilters, PhoneBookEntry, SearchResponse, SearchParams } from '../types/directory';
import { directoryService } from '../services/directoryService';
import { useAuth } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';

const SearchPage: React.FC = () => {
  const { user } = useAuth();
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

  // Perform search with current filters
  const performSearch = async (searchParams: SearchParams) => {
    setIsLoading(true);
    console.log('SearchPage: performSearch called with params:', searchParams);
    
    try {
      const response: SearchResponse = await directoryService.searchEntries(searchParams);
      
      setSearchResults(response.results);
      setTotalCount(response.total_count);
      
      // Try to save search to history (optional feature)
      try {
        await directoryService.saveSearchHistory(
          searchParams.query || '',
          searchParams,
          response.total_count
        );
      } catch (historyError) {
        // Search history is optional, don't fail the search
        console.warn('Failed to save search history:', historyError);
      }
      
      if (response.total_count === 0) {
        toast.success('No results found for your search criteria');
      }
    } catch (error: any) {
      toast.error(error.message || 'Search failed. Please try again.');
      console.error('Search error:', error);
      console.error('Search params that failed:', searchParams);
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
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

  // Initial search on component mount
  useEffect(() => {
    if (filters.query) {
      const searchParams: SearchParams = { ...filters, page: 1, page_size: pageSize };
      performSearch(searchParams);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Directory</h1>
        <p className="text-gray-600">
          Search through the phone directory with advanced filters and real-time suggestions.
        </p>
        
        {/* Image Search Link - for users with sufficient points */}
        {user && user.score >= 10 && (
          <div className="mt-4">
            <Link
              to="/premium-image-search"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Image className="w-4 h-4 mr-2" />
              Image Search
              <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                {user.score} pts
              </span>
            </Link>
            <p className="text-xs text-gray-500 mt-2">
              Visual search with images. Costs 10 points per search.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <SearchBar
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          filters={filters}
          isLoading={isLoading}
        />
      </div>

      {searchResults.length > 0 || isLoading ? (
        <SearchResults
          results={searchResults}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onExport={handleExport}
          isLoading={isLoading}
        />
      ) : filters.query && !isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or filters to find what you're looking for.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default SearchPage;
