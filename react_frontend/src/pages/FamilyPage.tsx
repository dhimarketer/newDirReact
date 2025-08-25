// 2025-01-27: Creating FamilyPage component for Phase 2 React frontend family management
// 2025-01-27: Fixed frontend crash by adding null checks for familyGroups, familyMembers, and pagination arrays
// 2025-01-27: COMPLETELY REWRITTEN - Implemented search-based family discovery with auto-detection

import React, { useState, useEffect } from 'react';
import SearchBar from '../components/directory/SearchBar';
import SearchResults from '../components/directory/SearchResults';
import { DeleteUpdatedFamilyModal } from '../components/family';
import { PhoneBookEntry, SearchFilters } from '../types/directory';
import { useAuthStore } from '../store/authStore';

interface DetectedFamily {
  id: string;
  address: string;
  island: string;
  members: PhoneBookEntry[];
  parents: PhoneBookEntry[];
  children: PhoneBookEntry[];
  isCustomized: boolean;
}

const FamilyPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PhoneBookEntry[]>([]);
  const [detectedFamilies, setDetectedFamilies] = useState<DetectedFamily[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<DetectedFamily | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showFamilyEditor, setShowFamilyEditor] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  
  // 2025-01-28: Added state for delete updated families modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Check if user is admin
  const isAdmin = user?.is_staff || user?.is_superuser;

  // Handle search from the search bar
  const handleSearch = async (filters: SearchFilters) => {
    setSearchQuery(filters.query || '');
    setIsSearching(true);
    
    try {
      // Use the existing search API endpoint
      const response = await fetch(`/api/phonebook/search/?q=${encodeURIComponent(filters.query || '')}`);
      const data = await response.json();
      setSearchResults(data.results || []);
      
      // Auto-detect families from search results
      const families = detectFamiliesFromSearchResults(data.results || []);
      setDetectedFamilies(families);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setDetectedFamilies([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-detect families based on address and island
  const detectFamiliesFromSearchResults = (results: PhoneBookEntry[]): DetectedFamily[] => {
    const familyGroups = new Map<string, DetectedFamily>();
    
    results.forEach(entry => {
      const key = `${entry.address || 'Unknown'}-${entry.island || 'Unknown'}`;
      
      if (!familyGroups.has(key)) {
        familyGroups.set(key, {
          id: key,
          address: entry.address || 'Unknown',
          island: entry.island || 'Unknown',
          members: [],
          parents: [],
          children: [],
          isCustomized: false
        });
      }
      
      familyGroups.get(key)!.members.push(entry);
    });
    
    // Process each family group to determine parents vs children using proper logic
    const processedFamilies: DetectedFamily[] = [];
    
    familyGroups.forEach(family => {
      // Helper function to calculate age from DOB
      const calculateAge = (dob?: string): number | null => {
        if (!dob) return null;
        try {
          const birthDate = new Date(dob);
          if (isNaN(birthDate.getTime())) return null;
          const currentYear = new Date().getFullYear();
          const birthYear = birthDate.getFullYear();
          return currentYear - birthYear;
        } catch {
          return null;
        }
      };
      
      // Separate members with and without age
      const membersWithAge = family.members.filter(member => calculateAge(member.DOB) !== null);
      const membersWithoutAge = family.members.filter(member => calculateAge(member.DOB) === null);
      
      // Sort members with age by age (eldest first)
      const sortedMembersWithAge = membersWithAge.sort((a, b) => {
        const ageA = calculateAge(a.DOB)!;
        const ageB = calculateAge(b.DOB)!;
        return ageB - ageA;
      });
      
      // Identify potential parents and children based on age differences
      const potentialParents: PhoneBookEntry[] = [];
      const children: PhoneBookEntry[] = [];
      
      // 2025-01-27: Fixed family detection logic to properly identify both parents and treat people without ages as children
      
      // Start with the eldest member as a potential parent
      if (sortedMembersWithAge.length > 0) {
        const eldest = sortedMembersWithAge[0];
        const eldestAge = calculateAge(eldest.DOB)!;
        
        // Check if other members could be children of the eldest
        for (let i = 1; i < sortedMembersWithAge.length; i++) {
          const member = sortedMembersWithAge[i];
          const memberAge = calculateAge(member.DOB)!;
          const ageDifference = eldestAge - memberAge;
          
          // If age difference is at least 15 years, consider eldest as parent
          if (ageDifference >= 15) {
            if (potentialParents.length === 0) {
              potentialParents.push(eldest);
            }
            children.push(member);
          } else {
            // Age difference is less than 15 years - could be siblings or co-parents
            // Don't assign as parent yet, add to children temporarily
            children.push(member);
          }
        }
        
        // If no children were found with proper age difference, eldest might not be a parent
        if (children.length === 0) {
          children.push(eldest);
        }
      }
      
      // Check if we can identify a second parent (but single parent families are also valid)
      if (potentialParents.length > 0 && children.length > 0) {
        // Look for a second potential parent among remaining members
        const remainingMembers = sortedMembersWithAge.filter(member => 
          !potentialParents.includes(member) && !children.includes(member)
        );
        
        for (const member of remainingMembers) {
          const memberAge = calculateAge(member.DOB)!;
          let canBeParent = true;
          
          // Check if this member can be a parent to all children
          for (const child of children) {
            const childAge = calculateAge(child.DOB)!;
            const ageDifference = memberAge - childAge;
            
            // If age difference is less than 15 years, can't be a parent
            if (ageDifference < 15) {
              canBeParent = false;
              break;
            }
          }
          
          if (canBeParent && potentialParents.length < 2) {
            potentialParents.push(member);
          } else {
            children.push(member);
          }
        }
      }
      
      // Third pass: if we still don't have 2 parents, look for co-parents among children
      if (potentialParents.length === 1 && children.length > 0) {
        const potentialCoParent = children.find(child => {
          const childAge = calculateAge(child.DOB)!;
          const parentAge = calculateAge(potentialParents[0].DOB)!;
          const ageDifference = Math.abs(parentAge - childAge);
          
          // If age difference is small (likely co-parents), promote to parent
          return ageDifference <= 5;
        });
        
        if (potentialCoParent) {
          potentialParents.push(potentialCoParent);
          children.splice(children.indexOf(potentialCoParent), 1);
        }
      }
      
      // Single parent families are valid - we don't need to force a second parent
      // The logic above will naturally handle cases where only one parent is identified
      
      // Add members without age to children (as per user requirement)
      children.push(...membersWithoutAge);
      
      // If we still don't have any parents identified, all members go to children
      if (potentialParents.length === 0) {
        children.push(...sortedMembersWithAge);
      }
      
      processedFamilies.push({
        ...family,
        parents: potentialParents,
        children: children
      });
    });
    
    return processedFamilies;
  };

  // Handle family customization
  const handleCustomizeFamily = (family: DetectedFamily) => {
    setSelectedFamily(family);
    setShowFamilyEditor(true);
  };

  // Save customized family
  const handleSaveFamily = async (customizedFamily: DetectedFamily) => {
    try {
      // Save to backend API
      const response = await fetch('/api/family/groups/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: `${customizedFamily.address} Family`,
          description: `Family from ${customizedFamily.address}, ${customizedFamily.island}`,
          members: customizedFamily.members.map(member => ({
            entry_id: member.pid,
            role: customizedFamily.parents.includes(member) ? 'parent' : 'child'
          }))
        })
      });
      
      if (response.ok) {
        // Update local state
        setDetectedFamilies(prev => 
          prev.map(f => f.id === customizedFamily.id ? { ...f, isCustomized: true } : f)
        );
        setShowFamilyEditor(false);
        setSelectedFamily(null);
      }
    } catch (error) {
      console.error('Failed to save family:', error);
    }
  };

  // 2025-01-28: Added handler for successful family deletion
  const handleFamilyDeleted = () => {
    // Refresh the page or update the detected families
    setDetectedFamilies([]);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Family Discovery</h1>
          <p className="mt-2 text-gray-600">
            Search for people and discover family relationships automatically based on address and island.
          </p>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-yellow-800 mb-2">Administrator Tools</h2>
                <p className="text-yellow-700 text-sm">
                  Manage updated families and family associations. This will preserve all phonebook entries 
                  while removing family relationships.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Updated Family
              </button>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search for People</h2>
          <SearchBar 
            onSearch={handleSearch}
            onFiltersChange={setSearchFilters}
            filters={searchFilters}
            isLoading={isSearching}
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results ({searchResults.length} people found)
            </h2>
            <SearchResults 
              results={searchResults}
              totalCount={searchResults.length}
              currentPage={1}
              pageSize={20}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
              onExport={() => {}}
              isLoading={isSearching}
            />
          </div>
        )}

        {/* Detected Families */}
        {detectedFamilies.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Detected Families ({detectedFamilies.length} families)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {detectedFamilies.map(family => (
                <div key={family.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900">
                      {family.address || 'Unknown Address'}
                    </h3>
                    <p className="text-sm text-gray-600">{family.island || 'Unknown Island'}</p>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{family.members.length}</span> family members
                    </p>
                    <p className="text-xs text-gray-500">
                      {family.parents.length} parents, {family.children.length} children
                    </p>
                  </div>
                  
                  <div className="mb-4">
                                         <h4 className="text-sm font-medium text-gray-700 mb-2">Parents:</h4>
                     <div className="space-y-1">
                       {family.parents.map(member => (
                         <div key={member.pid} className="text-sm text-gray-600">
                           • {member.name}
                         </div>
                       ))}
                     </div>
                     
                     <h4 className="text-sm font-medium text-gray-700 mb-2 mt-3">Children:</h4>
                     <div className="space-y-1">
                       {family.children.map(member => (
                         <div key={member.pid} className="text-sm text-gray-600">
                           • {member.name}
                         </div>
                       ))}
                     </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCustomizeFamily(family)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                      disabled={family.isCustomized}
                    >
                      {family.isCustomized ? 'Already Saved' : 'Customize & Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms or filters.</p>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Searching for people...</p>
          </div>
        )}

        {/* Instructions */}
        {!searchQuery && !isSearching && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Start discovering families</h3>
            <p className="mt-1 text-sm text-gray-500">
              Use the search bar above to find people. The system will automatically detect family relationships 
              based on shared addresses and islands.
            </p>
          </div>
        )}
      </div>

      {/* Family Editor Modal - TODO: Implement this component */}
      {showFamilyEditor && selectedFamily && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Customize Family: {selectedFamily.address}, {selectedFamily.island}
            </h2>
            <p className="text-gray-600 mb-4">
              Review and customize the detected family relationships before saving.
            </p>
            
            {/* TODO: Add family editor interface here */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowFamilyEditor(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveFamily(selectedFamily)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Family
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Updated Families Modal */}
      {showDeleteModal && (
        <DeleteUpdatedFamilyModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleFamilyDeleted}
        />
      )}
    </div>
  );
};

export default FamilyPage;
