// 2025-01-27: Search bar component for directory with autocomplete suggestions
// 2025-01-27: Added collapse button for advanced search filters
// 2025-01-27: Integrated smart query parser for intelligent search

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchFilters } from '../../types/directory';
import { directoryService } from '../../services/directoryService';
import { SEARCH } from '../../utils/constants';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { parseSmartQuery, formatParsedQuery } from '../../utils/searchQueryParser';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  filters: SearchFilters;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onFiltersChange, 
  filters, 
  isLoading = false 
}) => {
  const [query, setQuery] = useState(filters.query || '');
  const [suggestions, setSuggestions] = useState<Array<{ 
    pid: number;  // Primary key from the live database
    name: string; 
    contact: string; 
    nid?: string;
    atoll?: string; 
    island?: string;
    profession?: string;
    party?: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [parsedQueryInfo, setParsedQueryInfo] = useState<string>('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search for suggestions
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= SEARCH.MIN_QUERY_LENGTH) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          const results = await directoryService.getSearchSuggestions(searchQuery, SEARCH.SUGGESTION_LIMIT);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.warn('Failed to get search suggestions:', error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, SEARCH.DEBOUNCE_DELAY);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Handle query changes
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Parse the query to show what fields were detected
    if (newQuery.trim()) {
      const parsed = parseSmartQuery(newQuery);
      const formatted = formatParsedQuery(parsed);
      setParsedQueryInfo(formatted);
    } else {
      setParsedQueryInfo('');
    }
    
    const newFilters = { ...filters, query: newQuery };
    onFiltersChange(newFilters);
    
    debouncedSearch(newQuery);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: { 
    pid: number;  // Primary key from the live database
    name: string; 
    contact: string; 
    nid?: string;
    atoll?: string; 
    island?: string;
    profession?: string;
    party?: string;
  }) => {
    setQuery(suggestion.name);
    const newFilters = { ...filters, query: suggestion.name };
    onFiltersChange(newFilters);
    setShowSuggestions(false);
    setSuggestions([]);
    setParsedQueryInfo('');
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      // Parse the smart query to extract specific filters
      const parsed = parseSmartQuery(query.trim());
      
      // Merge parsed filters with existing filters
      const mergedFilters = { ...filters, ...parsed.filters };
      
      // If we have specific filters from parsing, use them
      if (Object.keys(parsed.filters).length > 0) {
        console.log('Smart search with parsed filters:', parsed.filters);
        onSearch(mergedFilters);
      } else {
        // Fallback to general search
        const updatedFilters = { ...filters, query: query.trim() };
        onSearch(updatedFilters);
      }
      
      setShowSuggestions(false);
      setSuggestions([]);
      setParsedQueryInfo('');
    } else {
      toast.error('Please enter a search term');
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: string | number | undefined) => {
    // Ensure we don't send empty strings or undefined values
    const cleanValue = value === '' || value === undefined ? undefined : value;
    const newFilters = { ...filters, [key]: cleanValue };
    onFiltersChange(newFilters);
  };

  // Toggle advanced filters visibility
  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="search-bar-container">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Smart search: ali, heena, male (name, name, atoll) or ali% (wildcard) or name:ali (specific field)"
                className="search-input"
                disabled={isLoading}
              />
              <div className="search-icon">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Parsed Query Info */}
              {parsedQueryInfo && (
                <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 z-10">
                  <strong>Detected fields:</strong> {parsedQueryInfo}
                </div>
              )}
              
              {/* Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="search-suggestions"
                  style={{ marginTop: parsedQueryInfo ? '40px' : '0' }}
                >
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.pid}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="suggestion-item"
                    >
                      <div className="font-medium text-gray-900">{suggestion.name}</div>
                      <div className="text-sm text-gray-600">
                        {suggestion.contact}
                        {suggestion.nid && ` • NID: ${suggestion.nid}`}
                        {suggestion.atoll && ` • ${suggestion.atoll}`}
                        {suggestion.island && ` • ${suggestion.island}`}
                        {suggestion.profession && ` • ${suggestion.profession}`}
                        {suggestion.party && ` • ${suggestion.party}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Loading indicator for suggestions */}
              {isLoadingSuggestions && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ display: 'block' }}
              title={`Query: "${query}", Loading: ${isLoading}, Disabled: ${isLoading || !query.trim()}`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Smart Search Examples */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600">
          <strong>Smart Search Examples:</strong>
          <ul className="mt-1 space-y-1 text-xs">
            <li>• <code>ali, heena, male</code> → Name: ali, Name: heena, Atoll: male</li>
            <li>• <code>ali%</code> → Wildcard search for names starting with "ali"</li>
            <li>• <code>name:ali, atoll:male</code> → Specific field search</li>
            <li>• <code>1234567</code> → Contact number search</li>
            <li>• <code>MDP</code> → Political party search</li>
            <li>• <code>M</code> → Gender: M (male)</li>
            <li>• <code>F</code> → Gender: F (female)</li>
          </ul>
        </div>
      </div>

      {/* Advanced Filters Toggle Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={toggleAdvancedFilters}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <span>Advanced Filters</span>
          {showAdvancedFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Advanced Filters - Collapsible */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Search Options</h3>
          <div className="advanced-filters">
            {/* Name Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={filters.name || ''}
                onChange={(e) => handleFilterChange('name', e.target.value || undefined)}
                placeholder="Enter name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Contact Number Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="text"
                value={filters.contact || ''}
                onChange={(e) => handleFilterChange('contact', e.target.value || undefined)}
                placeholder="Enter contact number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* National ID Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
              <input
                type="text"
                value={filters.nid || ''}
                onChange={(e) => handleFilterChange('nid', e.target.value || undefined)}
                placeholder="Enter NID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Island Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Island</label>
              <input
                type="text"
                value={filters.island || ''}
                onChange={(e) => handleFilterChange('island', e.target.value || undefined)}
                placeholder="Enter island"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Address Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={filters.address || ''}
                onChange={(e) => handleFilterChange('address', e.target.value || undefined)}
                placeholder="Enter address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Party (Political Affiliation) Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Party</label>
              <input
                type="text"
                value={filters.party || ''}
                onChange={(e) => handleFilterChange('party', e.target.value || undefined)}
                placeholder="Enter political party"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Profession Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
              <input
                type="text"
                value={filters.profession || ''}
                onChange={(e) => handleFilterChange('profession', e.target.value || undefined)}
                placeholder="Enter profession"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Age Range Filters */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={filters.min_age || ''}
                onChange={(e) => handleFilterChange('min_age', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Min age"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={filters.max_age || ''}
                onChange={(e) => handleFilterChange('max_age', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Max age"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Gender Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={filters.gender || ''}
                onChange={(e) => handleFilterChange('gender', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* PEP Status Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">PEP Status</label>
              <select
                value={filters.pep_status || ''}
                onChange={(e) => handleFilterChange('pep_status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Remarks Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <input
                type="text"
                value={filters.remark || ''}
                onChange={(e) => handleFilterChange('remark', e.target.value || undefined)}
                placeholder="Search in remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Atoll Filter */}
            <div className="filter-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Atoll</label>
              <input
                type="text"
                value={filters.atoll || ''}
                onChange={(e) => handleFilterChange('atoll', e.target.value || undefined)}
                placeholder="Enter atoll"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Advanced Search Button */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => {
                // Clean the filters to remove empty values
                const cleanFilters = Object.fromEntries(
                  Object.entries(filters).filter(([_, value]) => 
                    value !== '' && value !== undefined && value !== null
                  )
                );
                
                // Check if any advanced filters are set
                const hasAdvancedFilters = Object.keys(cleanFilters).length > 0;
                
                if (hasAdvancedFilters) {
                  console.log('Sending clean filters:', cleanFilters);
                  onSearch(cleanFilters);
                } else {
                  toast.error('Please set at least one search criteria');
                }
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Search with Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
