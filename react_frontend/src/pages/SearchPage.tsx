// 2025-01-27: Implementing functional SearchPage with SearchBar and SearchResults components
// 2025-01-27: COMPLETELY SIMPLIFIED - Google-like minimal interface for better UX
// 2025-01-29: ADDED - URL query parameter handling for header search bar integration

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/directory/SearchBar';
import SearchResults from '../components/directory/SearchResults';
import { SearchFilters, PhoneBookEntry, SearchResponse, SearchParams } from '../types/directory';
import { SpecificFamilyRole } from '../types/enhancedFamily';
import { directoryService } from '../services/directoryService';
import { useAuth } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 2025-01-10: NEW - Member selection mode state
  const [isMemberSelectionMode, setIsMemberSelectionMode] = useState(false);
  const [memberSelectionContext, setMemberSelectionContext] = useState<{
    currentAddress: string;
    currentIsland: string;
    familyName?: string;
    excludePids: number[];
    sourceFamilyEditor?: boolean;
  } | null>(null);
  
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

  // 2025-01-10: NEW - Check for member selection mode on component mount
  useEffect(() => {
    const memberSelectionMode = sessionStorage.getItem('memberSelectionMode');
    const memberSelectionCallback = sessionStorage.getItem('memberSelectionCallback');
    
    console.log('🔍 SearchPage: Checking member selection mode:', { memberSelectionMode, memberSelectionCallback: !!memberSelectionCallback });
    
    if (memberSelectionMode === 'true' && memberSelectionCallback) {
      try {
        const context = JSON.parse(memberSelectionCallback);
        console.log('🔍 SearchPage: Setting member selection mode with context:', context);
        setIsMemberSelectionMode(true);
        setMemberSelectionContext(context);
        
        // Clear the session storage
        sessionStorage.removeItem('memberSelectionMode');
        sessionStorage.removeItem('memberSelectionCallback');
      } catch (error) {
        console.error('Error parsing member selection context:', error);
      }
    }
  }, []);

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

  // 2025-01-10: NEW - Handle member drop in family roles
  const handleMemberDrop = (member: PhoneBookEntry, role: string) => {
    if (isMemberSelectionMode && memberSelectionContext) {
      // Map display role to actual family role
      const roleMapping: Record<string, SpecificFamilyRole> = {
        'Father': 'father',
        'Mother': 'mother',
        'Son': 'son',
        'Daughter': 'daughter',
        'Grandfather': 'grandfather',
        'Grandmother': 'grandmother',
        'Son-in-law': 'son_in_law',
        'Daughter-in-law': 'daughter_in_law',
        'Uncle': 'uncle',
        'Aunt': 'aunt',
        'Cousin': 'cousin',
        'Other': 'other'
      };
      
      const selectedRole = roleMapping[role] || 'other';
      
      // Store the selected member with role for family editor processing
      const selectedMemberData = { 
        ...member, 
        selectedRole 
      };
      sessionStorage.setItem('selectedMember', JSON.stringify(selectedMemberData));
      // 2025-01-11: NEW - Also store in localStorage for persistence
      localStorage.setItem('selectedMember', JSON.stringify(selectedMemberData));
      
      // Show success message
      toast.success(`Added ${member.name} as ${role} to ${memberSelectionContext.familyName || 'Family'}`);
      
      console.log('🔍 SearchPage: Stored selectedMember in sessionStorage:', member.name, 'with role:', selectedRole);
      console.log('🔍 SearchPage: Full selectedMember data:', selectedMemberData);
      console.log('🔍 SearchPage: SessionStorage after storing:', {
        selectedMember: sessionStorage.getItem('selectedMember'),
        allKeys: Object.keys(sessionStorage)
      });
      
      // Navigate back to family editor after a short delay to show the success message
      setTimeout(() => {
        console.log('🔍 SearchPage: Navigating back to family editor');
        navigate(-1);
      }, 1500);
    }
  };

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
      let results = Array.isArray(response.results) ? response.results : [];
      
      // 2025-01-10: NEW - Filter out excluded members in member selection mode
      if (isMemberSelectionMode && memberSelectionContext) {
        results = results.filter(entry => 
          !memberSelectionContext.excludePids.includes(entry.pid) &&
          !(entry.address === memberSelectionContext.currentAddress && 
            entry.island === memberSelectionContext.currentIsland)
        );
      }
      
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
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            {isMemberSelectionMode ? 'Select Family Member' : 'Directory Search'}
          </h1>
          <p className="text-blue-500">
            {isMemberSelectionMode 
              ? `Drag any person below to add them to the "${memberSelectionContext?.familyName || 'Family'}" family` 
              : 'Find people, places, and information'
            }
          </p>
          {isMemberSelectionMode && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                💡 <strong>Drag & Drop Mode:</strong> Drag any person from the search results to the family roles below to add them to the <strong>"{memberSelectionContext?.familyName || 'Family'}"</strong> family. 
                People from your current address ({memberSelectionContext?.currentAddress}) are automatically excluded.
              </p>
            </div>
          )}
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
          {console.log('🔍 SearchPage: Rendering SearchResults with isMemberSelectionMode:', isMemberSelectionMode)}
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
            onMemberSelect={isMemberSelectionMode ? (member) => {
              console.log('🔍 SearchPage: Member selected for drag:', member.name);
            } : undefined} // 2025-01-10: NEW - Member selection (handler for drag and drop)
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

      {/* Family Drop Zone - always show when in member selection mode */}
      {isMemberSelectionMode && memberSelectionContext?.sourceFamilyEditor && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="mt-8 p-6 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 text-center">
              Drag Members to {memberSelectionContext.familyName || 'Family'} Roles
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {['Father', 'Mother', 'Son', 'Daughter', 'Grandfather', 'Grandmother', 'Son-in-law', 'Daughter-in-law', 'Uncle', 'Aunt', 'Cousin', 'Other'].map((role) => (
                <div
                  key={role}
                  className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
                  onDrop={(e) => {
                    e.preventDefault();
                    const memberData = e.dataTransfer.getData('application/json');
                    if (memberData) {
                      try {
                        const member = JSON.parse(memberData);
                        console.log(`Dropping ${member.name} onto role: ${role}`);
                        handleMemberDrop(member, role);
                      } catch (error) {
                        console.error('Error parsing dropped member data:', error);
                        toast.error('Error adding member to family');
                      }
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-100');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                  }}
                >
                  <div className="text-sm font-medium text-gray-700 mb-2">{role}</div>
                  <div className="text-xs text-gray-500">Drop here</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
