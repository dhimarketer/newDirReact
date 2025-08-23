// 2025-01-27: Family modal component for showing family relationships when clicking on addresses

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PhoneBookEntry } from '../../types/directory';
import FamilyTreeVisualization from './FamilyTreeVisualization';

interface FamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  island: string;
}

interface FamilyMember {
  entry: PhoneBookEntry;
  role: 'parent' | 'child' | 'other';
  relationship?: string;
}

const FamilyModal: React.FC<FamilyModalProps> = ({ isOpen, onClose, address, island }) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('FamilyModal useEffect:', { isOpen, address, island }); // 2025-01-27: Debug logging for modal state
    if (isOpen && address && island) {
      fetchFamilyMembers();
    }
  }, [isOpen, address, island]);

  const fetchFamilyMembers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Search for people at this address and island using the correct API endpoint
      // 2025-01-27: Use advanced search endpoint for better filtering and limit results for family display
      const searchPayload = {
        address: address,
        island: island,
        limit_results: true // Flag to limit family search results
      };
      console.log('Fetching family members with payload:', searchPayload); // 2025-01-27: Debug logging for API call
      const response = await fetch('/api/phonebook/advanced_search/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchPayload)
      });
      console.log('API response status:', response.status); // 2025-01-27: Debug logging for response status
      const data = await response.json();
      console.log('API response data:', data); // 2025-01-27: Debug logging for response data
      
      if (data.results && data.results.length > 0) {
        // Process the results to determine family roles
        const members = processFamilyMembers(data.results);
        setFamilyMembers(members);
      } else {
        setFamilyMembers([]);
      }
    } catch (error) {
      console.error('Failed to fetch family members:', error);
      setError('Failed to load family information');
    } finally {
      setIsLoading(false);
    }
  };

  const processFamilyMembers = (entries: PhoneBookEntry[]): FamilyMember[] => {
    console.log('Processing family members from entries:', entries); // 2025-01-27: Debug logging for family processing
    
    // Sort by age (using DOB if available) or name length as fallback
    const sortedEntries = entries.sort((a, b) => {
      if (a.DOB && b.DOB) {
        const ageA = new Date().getFullYear() - new Date(a.DOB).getFullYear();
        const ageB = new Date().getFullYear() - new Date(b.DOB).getFullYear();
        return ageB - ageA; // Eldest first
      }
      // Fallback: longer names might indicate older people
      return (b.name?.length || 0) - (a.name?.length || 0);
    });

    console.log('Sorted entries:', sortedEntries); // 2025-01-27: Debug logging for sorted entries

    // Use improved parent identification logic similar to FamilyPage
    const familyMembers: FamilyMember[] = [];
    
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
    const membersWithAge = sortedEntries.filter(entry => calculateAge(entry.DOB) !== null);
    const membersWithoutAge = sortedEntries.filter(entry => calculateAge(entry.DOB) === null);
    
    // Sort members with age by age (eldest first)
    const sortedMembersWithAge = membersWithAge.sort((a, b) => {
      const ageA = calculateAge(a.DOB)!;
      const ageB = calculateAge(b.DOB)!;
      return ageB - ageA;
    });
    
    // Identify potential parents and children based on age differences
    const potentialParents: PhoneBookEntry[] = [];
    const children: PhoneBookEntry[] = [];
    
    // Start with the eldest member as a potential parent
    if (sortedMembersWithAge.length > 0) {
      const eldest = sortedMembersWithAge[0];
      const eldestAge = calculateAge(eldest.DOB)!;
      
      // Check if other members could be children of the eldest
      for (let i = 1; i < sortedMembersWithAge.length; i++) {
        const member = sortedMembersWithAge[i];
        const memberAge = calculateAge(member.DOB)!;
        const ageDifference = eldestAge - memberAge;
        
        // If age difference is at least 10 years, consider eldest as parent
        if (ageDifference >= 10) {
          if (potentialParents.length === 0) {
            potentialParents.push(eldest);
          }
          children.push(member);
        } else {
          // Age difference is less than 10 years - could be siblings
          // Don't assign as parent, add to children
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
          
          // If age difference is less than 10 years, can't be a parent
          if (ageDifference < 10) {
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
    
    // Add members without age to children (can't determine their role)
    children.push(...membersWithoutAge);
    
    // If we still don't have any parents identified, all members go to children
    if (potentialParents.length === 0) {
      children.push(...sortedMembersWithAge);
    }
    
    // Create family members array with proper roles
    potentialParents.forEach(parent => {
      familyMembers.push({
        entry: parent,
        role: 'parent',
        relationship: 'Parent'
      });
    });
    
    children.forEach(child => {
      familyMembers.push({
        entry: child,
        role: 'child',
        relationship: 'Child'
      });
    });

    console.log('Processed family members:', familyMembers); // 2025-01-27: Debug logging for final family members
    return familyMembers;
  };

  const handleSaveFamily = async () => {
    try {
      const response = await fetch('/api/family/groups/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: `${address} Family`,
          description: `Family from ${address}, ${island}`,
          members: familyMembers.map(member => ({
            entry_id: member.entry.pid,
            role: member.role
          }))
        })
      });
      
      if (response.ok) {
        // Close modal and show success message
        onClose();
        // You could add a toast notification here
        console.log('Family saved successfully');
      }
    } catch (error) {
      console.error('Failed to save family:', error);
      setError('Failed to save family information');
    }
  };

  if (!isOpen) return null;

  console.log('FamilyModal is rendering!', { isOpen, address, island, familyMembersLength: familyMembers.length }); // 2025-01-27: Debug modal rendering
  
  // 2025-01-27: Modal is now working, removed alert

  const modalContent = (
    <>
      {/* 2025-01-27: Portal test successful, removing test div */}
      
      <div 
        className="fixed inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/90 backdrop-blur-sm flex items-center justify-center p-4" 
        style={{ 
          zIndex: 99999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl border-0 max-w-6xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 ease-out"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            position: 'relative',
            zIndex: 100000,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-t-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  🏠 Family at {address}
                </h2>
                <p className="text-blue-100 text-lg font-medium">{island}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-all duration-200 hover:bg-white/20 p-2 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto" style={{ height: 'calc(95vh - 200px)' }}>
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <p className="mt-4 text-lg text-gray-600 font-medium">Discovering family connections...</p>
                <p className="mt-2 text-sm text-gray-500">Searching through our directory</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-red-800">Oops! Something went wrong</h3>
                    <div className="mt-2 text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Family Members */}
            {!isLoading && !error && (
              <div className="h-full flex flex-col">
                {/* Family Member Count */}
                {familyMembers.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="text-blue-800">
                        <span className="font-semibold text-lg">Found {familyMembers.length} family members</span>
                        <div className="text-sm text-blue-600 mt-1">
                          {familyMembers.filter(m => m.role === 'parent').length} parents • {familyMembers.filter(m => m.role === 'child').length} children
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Family Tree Visualization */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                      Family Tree Structure
                    </h3>
                    <FamilyTreeVisualization familyMembers={familyMembers} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium shadow-sm"
              >
                Close
              </button>
              {familyMembers.length > 0 && (
                <button
                  onClick={handleSaveFamily}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  💾 Save as Family
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Render the modal using a portal to ensure it's at the document body level
  console.log('About to render modal with portal to document.body'); // 2025-01-27: Debug portal rendering
  
  // Try to find the body element
  const bodyElement = document.body;
  console.log('Body element found:', bodyElement); // 2025-01-27: Debug body element
  
  if (!bodyElement) {
    console.error('No body element found!'); // 2025-01-27: Debug body element error
    return null;
  }
  
  try {
    const portalResult = createPortal(modalContent, bodyElement);
    console.log('Portal created successfully:', portalResult); // 2025-01-27: Debug portal success
    return portalResult;
  } catch (error) {
    console.error('Portal failed, falling back to direct render:', error); // 2025-01-27: Debug portal fallback
    // Fallback: render directly without portal
    return modalContent;
  }
};

export default FamilyModal;
