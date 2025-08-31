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
import EditDirectoryEntryModal from './EditDirectoryEntryModal';
import islandService from '../../services/islandService';
import familyService from '../../services/familyService';

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
  
  // 2025-01-29: DEBUG - Log component props
  console.log('🔍 SearchResults: Component rendered with props:', {
    resultsLength: results?.length,
    totalCount,
    currentPage,
    pageSize,
    isLoading,
    searchFilters
  });
  console.log('🔍 SearchResults: Results array:', results);
  
  // Family tree window state
  const [familyTreeWindowOpen, setFamilyTreeWindowOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('');
  
  // 2025-01-29: NEW - State for preferred view mode when opening family tree
  const [preferredViewMode, setPreferredViewMode] = useState<'tree' | 'table'>('tree');
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PhoneBookEntry | null>(null);
  
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

  // 2025-01-28: NEW - Handle address click to open family tree window
  const handleAddressClick = async (address: string, island: string) => {
    console.log('Address clicked:', { address, island });
    
    // 2025-01-29: ENHANCED - First check if there's a saved family for this address
    try {
      const familyResponse = await familyService.getFamilyByAddress(address, island);
      
      if (familyResponse.success && familyResponse.data && familyResponse.data.id) {
        // There's a saved family - open it directly
        console.log('Found saved family for address:', address);
        setSelectedAddress(address);
        setSelectedIsland(island);
        setFamilyTreeWindowOpen(true);
      } else {
        // No saved family - create one automatically using backend inference
        console.log('No saved family found, creating one automatically for address:', address);
        
        // 2025-01-29: FIXED - Allow family tree generation even without DOB data
        // The backend will handle family inference and create the family group
        setSelectedAddress(address);
        setSelectedIsland(island);
        setFamilyTreeWindowOpen(true);
      }
    } catch (error) {
      console.error('Error checking for saved family:', error);
      // Fallback to opening family tree window - let backend handle inference
      setSelectedAddress(address);
      setSelectedIsland(island);
      setFamilyTreeWindowOpen(true);
    }
  };

  // 2025-01-28: NEW - Check if address has DOB data for family tree availability
  const hasDOBData = (entry: PhoneBookEntry): boolean => {
    return !!(entry.DOB && entry.DOB !== 'None' && entry.DOB.trim() !== '');
  };

  // 2025-01-28: NEW - Get tooltip text for address click
  const getAddressTooltip = (entry: PhoneBookEntry): string => {
    // 2025-01-29: FIXED - Family trees are always available, regardless of DOB data
    return 'Click to view family tree';
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
        // 2025-01-29: Use atoll_name instead of atoll ID for display
        return entry.atoll_name || entry.atoll || null;
      case 'island':
        // 2025-01-29: Use island_name instead of island ID for display
        return entry.island_name || entry.island || null;
      case 'street':
        return entry.street || null;
      case 'profession':
        return entry.profession || null;
      case 'gender':
        return entry.gender || null;
      case 'DOB':
        return entry.DOB ? `Age: ${formatAge(entry.DOB)}` : null;
      case 'party':
        // 2025-01-29: Use party_name instead of party ID for display
        return entry.party_name || entry.party || null;
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

    // Special handling for name field - make it clickable to open edit modal
    if (field.field_name === 'name') {
      return (
        <button
          onClick={() => {
            setSelectedEntry(entry);
            setShowEditModal(true);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer truncate-text font-medium"
          title={`Click to edit ${value}'s record`}
        >
          {value}
        </button>
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
            onClick={() => handleAddressClick(value, entry.island_name || entry.island || '')}
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
    console.log('🔍 SearchResults: Showing loading state');
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
    console.log('🔍 SearchResults: Showing no results state - results.length === 0');
    console.log('🔍 SearchResults: Results array:', results);
    console.log('🔍 SearchResults: Total count:', totalCount);
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

  console.log('🔍 SearchResults: Rendering results table with', results.length, 'results');
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
          {/* 2025-01-29: NEW - View mode preference toggle for family tree windows */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-600">Family View:</span>
            <button
              onClick={() => setPreferredViewMode('tree')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                preferredViewMode === 'tree'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Open family trees in visual tree view"
            >
              🌳 Tree
            </button>
            <button
              onClick={() => setPreferredViewMode('table')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                preferredViewMode === 'table'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Open family trees in table view"
            >
              📋 Table
            </button>
          </div>
          
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
                {user && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider min-w-[120px]">
                    Actions
                  </th>
                )}
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
                  {user && (
                    <td className="table-cell">
                      <button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowEditModal(true);
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                      >
                        Edit
                      </button>
                    </td>
                  )}
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
        initialViewMode={preferredViewMode}
      />

              {/* Edit Directory Entry Modal */}
              <EditDirectoryEntryModal
                isOpen={showEditModal}
                onClose={() => {
                  setShowEditModal(false);
                  setSelectedEntry(null);
                }}
                entry={selectedEntry}
                onSuccess={() => {
                  // Could trigger a refresh of search results here
                  toast.success('Entry update submitted successfully!');
                }}
              />
            </div>
          );
        };

export default SearchResults;
