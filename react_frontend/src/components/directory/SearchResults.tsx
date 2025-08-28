// 2025-01-27: Search results component for directory with pagination and entry display
// 2025-01-27: Updated to use search field visibility settings and display fields separately
// 2025-01-27: Simplified styling to use consistent Tailwind utilities and prevent CSS conflicts

import React, { useState, useEffect } from 'react';
import { PhoneBookEntry, SearchParams } from '../../types/directory';
import { PAGINATION } from '../../utils/constants';
import { toast } from 'react-hot-toast';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuth } from '../../store/authStore';
import { getUserType, getVisibleFields } from '../../utils/searchFieldUtils';
import FamilyTreeWindow from '../family/FamilyTreeWindow';
import islandService from '../../services/islandService';

interface SearchResultsProps {
  results: PhoneBookEntry[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onExport: () => void;
  isLoading?: boolean;
  searchFilters?: SearchParams;  // 2025-01-28: Add search filters to preserve island parameter
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onExport,
  isLoading = false,
  searchFilters  // 2025-01-28: Add search filters parameter
}) => {
  const { user } = useAuth();
  const { adminSearchFieldSettings, fetchAdminSearchFieldSettings } = useSettingsStore();
  
  // Family tree window state
  const [familyTreeWindowOpen, setFamilyTreeWindowOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('');
  
  const totalPages = Math.ceil(totalCount / pageSize);
  const userType = getUserType(user!);
  const visibleFields = getVisibleFields(adminSearchFieldSettings?.search_fields, userType);

  // Fallback fields if settings haven't loaded yet
  const fallbackFields = [
    { field_name: 'name', field_label: 'Name' },
    { field_name: 'contact', field_label: 'Contact' },
    { field_name: 'nid', field_label: 'NID' },
    { field_name: 'address', field_label: 'Address' },
    { field_name: 'atoll', field_label: 'Atoll' },
    { field_name: 'island', field_label: 'Island' },
    { field_name: 'profession', field_label: 'Profession' },
    { field_name: 'party', field_label: 'Party' },
    { field_name: 'change_status', field_label: 'Status' }
  ];

  // Use visible fields if available, otherwise use fallback
  const displayFields = visibleFields.length > 0 ? visibleFields : fallbackFields;

  // Load search field settings on component mount
  useEffect(() => {
    if (user && !adminSearchFieldSettings) {
      fetchAdminSearchFieldSettings();
    }
  }, [user, adminSearchFieldSettings, fetchAdminSearchFieldSettings]);

  // Format age from DOB
  const formatAge = (dob?: string): string => {
    if (!dob) return 'N/A';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return `${age - 1} years`;
      }
      return `${age} years`;
    } catch {
      return 'N/A';
    }
  };

  // Format contact number
  const formatContact = (contact: string): string => {
    if (contact.length === 7) {
      return `${contact.slice(0, 3)}-${contact.slice(3, 5)}-${contact.slice(5)}`;
    }
    return contact;
  };

  // Handle address click to show family tree window
  const handleAddressClick = async (address: string, island: string) => {
    console.log('Address clicked:', { address, island }); // 2025-01-28: Debug logging for address click
    
    // 2025-01-28: FIXED - Prioritize island from search result entry since it contains correct ForeignKey data
    // The search filters may contain wildcard patterns, but the search result has the actual island relationship
    let islandToUse = island;
    
    if (searchFilters?.island && searchFilters.island.trim()) {
      // Log what we're getting from search filters for debugging
      console.log('Search filters island (may contain wildcards):', searchFilters.island);
      console.log('Using island from search result entry (correct ForeignKey data):', island);
    } else {
      // Fallback to island from search result entry
      console.log('Using island from search result entry:', island);
    }
    
    // 2025-01-28: ENHANCED - Resolve island name from search result entry (which has correct ForeignKey data)
    let islandName = islandToUse;
    
    // Convert island ID to island name if it's a numeric ID (from ForeignKey relationship)
    if (islandToUse && !isNaN(Number(islandToUse))) {
      try {
        const resolvedIslandName = await islandService.getIslandNameById(islandToUse);
        if (resolvedIslandName) {
          islandName = resolvedIslandName;
          console.log('Converted island ID to name:', { id: islandToUse, name: islandName });
        } else {
          console.warn('Could not resolve island ID to name:', islandToUse);
        }
      } catch (error) {
        console.error('Error converting island ID to name:', error);
        // Fall back to using the original island value
      }
    } else if (islandToUse && islandToUse.trim()) {
      // If it's already a string (island name), use it directly
      console.log('Using island name directly:', islandToUse);
      islandName = islandToUse;
    }
    
    console.log('Final resolved island name:', islandName);
    
    setSelectedAddress(address);
    setSelectedIsland(islandName);
    setFamilyTreeWindowOpen(true);
  };

  // 2025-01-28: NEW - Check if address has DOB data for family tree availability
  const hasDOBData = (entry: PhoneBookEntry): boolean => {
    return !!(entry.DOB && entry.DOB !== 'None' && entry.DOB.trim() !== '');
  };

  // 2025-01-28: NEW - Get tooltip text for address click
  const getAddressTooltip = (entry: PhoneBookEntry): string => {
    if (hasDOBData(entry)) {
      return 'Click to view family tree';
    } else {
      return 'Family tree not available - no date of birth (DOB) data for this person';
    }
  };

  // Get field value for display
  const getFieldValue = (entry: PhoneBookEntry, fieldName: string): string | null => {
    switch (fieldName) {
      case 'name':
        return entry.name;
      case 'contact':
        return entry.contact ? formatContact(entry.contact) : null;
      case 'email':
        return entry.email || null;
      case 'nid':
        return entry.nid || null;
      case 'address':
        return entry.address || null;
      case 'atoll':
        return entry.atoll || null;
      case 'island':
        return entry.island || null;
      case 'street':
        return entry.street || null;
      case 'profession':
        return entry.profession || null;
      case 'gender':
        return entry.gender || null;
      case 'DOB':
        return entry.DOB ? `Age: ${formatAge(entry.DOB)}` : null;
      case 'party':
        return entry.party || null;
      case 'change_status':
        return entry.change_status || 'Active';
      default:
        return null;
    }
  };

  // Render field cell content
  const renderFieldCell = (entry: PhoneBookEntry, field: any) => {
    const value = getFieldValue(entry, field.field_name);
    
    if (!value) {
              return <div className="text-sm text-blue-500">-</div>;
    }

    // Special handling for status field
    if (field.field_name === 'change_status') {
      return (
        <span className={`status-badge ${value.toLowerCase()}`}>
          {value}
        </span>
      );
    }

    // Special handling for address field - make it clickable
    if (field.field_name === 'address' && entry.island) {
      const hasDOB = hasDOBData(entry);
      const tooltipText = getAddressTooltip(entry);
      
      if (hasDOB) {
        // Address has DOB data - make it clickable for family tree
        return (
          <button
            onClick={() => handleAddressClick(value, entry.island || '')}
            className="text-sm text-blue-400 hover:text-blue-300 underline cursor-pointer truncate-text"
            title={tooltipText}
          >
            {value}
          </button>
        );
      } else {
        // Address has no DOB data - show as non-clickable with info tooltip
        return (
          <div 
            className="text-sm text-gray-500 truncate-text cursor-help"
            title={tooltipText}
          >
            {value}
            <span className="ml-1 text-xs text-gray-400">(no family tree)</span>
          </div>
        );
      }
    }

    return (
              <div className="text-sm text-blue-600 truncate-text" title={value}>
        {value}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-blue-600">Searching...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-blue-500 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">No search results found</h3>
        <p className="text-blue-500 mb-4">Try adjusting your search criteria or using different filters.</p>
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg border border-blue-300">
          <span className="text-sm">💡 Tip: Try searching with fewer criteria or different keywords</span>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-container space-y-6">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-lg font-medium text-blue-800">
            Search Results
          </h2>
          <p className="text-sm text-blue-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onExport}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Export All
          </button>
        </div>
      </div>
      
      {/* Results Table */}
      <div className="table-container bg-white shadow-xl border border-blue-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                {displayFields.map((field) => (
                  <th 
                    key={field.field_name}
                    className={`px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider ${
                      field.field_name === 'name' ? 'min-w-[200px]' : 'min-w-[150px]'
                    }`}
                  >
                    {field.field_label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {results.map((entry, index) => (
                <tr key={entry.pid} className={`table-row ${index < results.length - 1 ? 'border-b border-blue-200' : ''}`}>
                  {displayFields.map((field) => (
                    <td key={field.field_name} className="table-cell">
                      {renderFieldCell(entry, field)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination-container">
        <div className="page-size-selector">
          <label className="text-sm text-blue-700">Show:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="page-size-selector select"
          >
            {PAGINATION.PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-blue-700">entries per page</span>
        </div>

        <div className="page-navigation">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-button"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`page-button ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-button"
          >
            Next
          </button>
        </div>
      </div>

              {/* Family Tree Window */}
              <FamilyTreeWindow
          isOpen={familyTreeWindowOpen}
          onClose={() => setFamilyTreeWindowOpen(false)}
          address={selectedAddress}
          island={selectedIsland}
        />
    </div>
  );
};

export default SearchResults;
