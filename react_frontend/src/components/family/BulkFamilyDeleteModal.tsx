// 2025-01-31: Creating BulkFamilyDeleteModal component for bulk family relationship deletion
// This component allows admins to search and delete multiple family relationships at once

import React, { useState, useEffect } from 'react';
import { FamilyGroup } from '../../types/family';
import { familyService } from '../../services/familyService';

interface BulkFamilyDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SearchResult {
  id: number;
  name: string;
  address: string;
  island: string;
  member_count: number;
  created_at: string;
  is_manually_updated: boolean;
}

const BulkFamilyDeleteModal: React.FC<BulkFamilyDeleteModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<Set<number>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search for families based on query
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await familyService.getFamilyGroups({
        search: searchQuery.trim(),
        page: 1
      });
      
      setSearchResults(response.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setError('Failed to search for families. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle family selection
  const handleFamilyToggle = (familyId: number) => {
    const newSelected = new Set(selectedFamilies);
    if (newSelected.has(familyId)) {
      newSelected.delete(familyId);
    } else {
      newSelected.add(familyId);
    }
    setSelectedFamilies(newSelected);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedFamilies.size === searchResults.length) {
      setSelectedFamilies(new Set());
    } else {
      setSelectedFamilies(new Set(searchResults.map(f => f.id)));
    }
  };

  // Bulk delete selected families
  const handleBulkDelete = async () => {
    if (selectedFamilies.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedFamilies.size} family relationship(s)?\n\n` +
      'This will only delete the family relationships, not the actual member data.\n' +
      'This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const familyIds = Array.from(selectedFamilies);
      let successCount = 0;
      let errorCount = 0;
      
      // Delete families one by one to handle individual failures gracefully
      for (const familyId of familyIds) {
        try {
          await familyService.deleteFamilyGroup(familyId);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete family ${familyId}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        setSuccessMessage(
          `Successfully deleted ${successCount} family relationship(s). ` +
          (errorCount > 0 ? `${errorCount} failed.` : '')
        );
        
        // Clear selection and search results
        setSelectedFamilies(new Set());
        setSearchResults([]);
        setSearchQuery('');
        
        // Notify parent component
        onSuccess();
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError('Failed to delete any families. Please try again.');
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      setError('An unexpected error occurred during bulk delete.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (isDeleting) return; // Prevent closing while deleting
    
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFamilies(new Set());
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  // Handle Enter key in search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold">Bulk Family Delete</h2>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="text-white hover:text-gray-200 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto min-h-0">
          {/* Search Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Families
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search by family name, address, or island..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isDeleting}
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching || isDeleting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Found {searchResults.length} family(ies)
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedFamilies.size === searchResults.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  {searchResults.map((family) => (
                    <div
                      key={family.id}
                      className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 ${
                        selectedFamilies.has(family.id) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFamilies.has(family.id)}
                        onChange={() => handleFamilyToggle(family.id)}
                        disabled={isDeleting}
                        className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{family.name || 'Unnamed Family'}</div>
                        <div className="text-sm text-gray-600">
                          {family.address}, {family.island}
                        </div>
                        <div className="text-xs text-gray-500">
                          {family.member_count} member(s) • Created: {new Date(family.created_at).toLocaleDateString()}
                          {family.is_manually_updated && ' • Manually Updated'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {successMessage}
            </div>
          )}
        </div>

        {/* Action Buttons - Always Visible */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedFamilies.size === 0 || isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : `Delete ${selectedFamilies.size} Family Relationship(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkFamilyDeleteModal;
