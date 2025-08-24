// 2025-01-27: Search bar component for directory with autocomplete suggestions
// 2025-01-27: Added collapse button for advanced search filters to improve UI cleanliness
// 2025-01-27: Integrated smart query parser for intelligent search
// 2025-01-27: Simplified styling to use consistent Tailwind utilities and prevent CSS conflicts
// 2025-01-27: COMPLETELY SIMPLIFIED - Google-like minimal interface for better UX

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchFilters } from '../../types/directory';
import { directoryService } from '../../services/directoryService';
import { SEARCH } from '../../utils/constants';
import { toast } from 'react-hot-toast';
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
  const handleQueryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Parse the query to show what fields were detected
    if (newQuery.trim()) {
      try {
        const parsed = await parseSmartQuery(newQuery);
        const formatted = formatParsedQuery(parsed);
        setParsedQueryInfo(formatted);
      } catch (error) {
        console.error('Error parsing query:', error);
        setParsedQueryInfo('');
      }
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
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      try {
        // Parse the smart query to extract specific filters
        const parsed = await parseSmartQuery(query.trim());
        
        // Clear all existing specific field filters and use only the parsed ones
        // This prevents old filter values from persisting between searches
        const clearedFilters = {
          query: query.trim(),
          name: '',
          contact: '',
          nid: '',
          address: '',
          atoll: '',
          island: '',
          party: '',
          profession: '',
          gender: '',
          remark: '',
          pep_status: '',
          min_age: undefined,
          max_age: undefined
        };
        
        // Merge parsed filters with cleared filters
        const mergedFilters = { ...clearedFilters, ...parsed.filters };
        
        // If we have specific filters from parsing, use them
        if (Object.keys(parsed.filters).length > 0) {
          console.log('Smart search with parsed filters:', parsed.filters);
          onSearch(mergedFilters);
        } else {
          // Fallback to general search
          onSearch(clearedFilters);
        }
        
        setShowSuggestions(false);
        setSuggestions([]);
        setParsedQueryInfo('');
      } catch (error) {
        console.error('Error parsing search query:', error);
        toast.error('Error processing search query');
      }
    } else {
      toast.error('Please enter a search term');
    }
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
    <div className="w-full">
      {/* Main Search Form - Ultra-clean Google-style */}
      <form onSubmit={handleSearch}>
        <div className="search-bar-container">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-full max-w-2xl relative">
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Search directory..."
                className="search-input w-full text-lg px-6 py-4 border border-blue-300 rounded-full focus:border-blue-500 focus:outline-none bg-white shadow-sm hover:shadow-md transition-all duration-200 text-blue-800"
                disabled={isLoading}
                title="Smart Search: Use commas for structured queries, wildcards, or field-specific searches"
                aria-label="Search directory entries"
              />

              
              {/* Clear search button when there's text */}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    const newFilters = { ...filters, query: '' };
                    onFiltersChange(newFilters);
                    setShowSuggestions(false);
                    setSuggestions([]);
                    setParsedQueryInfo('');
                  }}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 transition-all duration-200"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
              

            </div>
            
            {/* Google-style search buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-8 py-3 bg-blue-500 text-white text-base font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          
          {/* Parsed Query Info - Subtle display */}
          {parsedQueryInfo && (
            <div className="w-full max-w-2xl mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 text-center">
              <strong>Smart search detected:</strong> {parsedQueryInfo}
            </div>
          )}
          
          {/* Search Suggestions - Better positioning */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="w-full max-w-2xl mt-4 bg-white border border-blue-200 rounded-lg shadow-lg overflow-hidden"
            >
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.pid}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-blue-800">{suggestion.name}</div>
                  <div className="text-sm text-blue-600">
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
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
