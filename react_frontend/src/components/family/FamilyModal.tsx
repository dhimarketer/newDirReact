// 2025-01-27: Family modal component for showing family relationships when clicking on addresses
// 2025-01-27: Refactored to use Pico.css for lightweight, responsive, and professional styling
// 2025-01-27: Fixed styling issues to ensure graphics display properly

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PhoneBookEntry } from '../../types/directory';
import FamilyTreeVisualization from './FamilyTreeVisualization';
import FamilyTreeEditor from './FamilyTreeEditor';

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
  const [familyRelationships, setFamilyRelationships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 2025-01-27: Added state for family tree editor functionality
  const [showFamilyTreeEditor, setShowFamilyTreeEditor] = useState(false);
  const [hasCustomFamily, setHasCustomFamily] = useState(false);

  useEffect(() => {
    console.log('FamilyModal useEffect:', { isOpen, address, island });
    if (isOpen && address && island) {
      fetchFamilyMembers();
      // 2025-01-27: Check for existing custom family data
      checkForCustomFamily();
    }
  }, [isOpen, address, island]);

  const fetchFamilyMembers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchPayload = {
        address: address,
        island: island,
        limit_results: true
      };
      console.log('Fetching family members with payload:', searchPayload);
      const response = await fetch('/api/phonebook/advanced_search/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchPayload)
      });
      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);
      
      if (data.results && data.results.length > 0) {
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
    console.log('Processing family members from entries:', entries);
    
    const sortedEntries = entries.sort((a, b) => {
      if (a.DOB && b.DOB) {
        const ageA = new Date().getFullYear() - new Date(a.DOB).getFullYear();
        const ageB = new Date().getFullYear() - new Date(b.DOB).getFullYear();
        return ageB - ageA;
      }
      return (b.name?.length || 0) - (a.name?.length || 0);
    });

    console.log('Sorted entries:', sortedEntries);

    const familyMembers: FamilyMember[] = [];
    
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
    
    const membersWithAge = sortedEntries.filter(entry => calculateAge(entry.DOB) !== null);
    const membersWithoutAge = sortedEntries.filter(entry => calculateAge(entry.DOB) === null);
    
    const sortedMembersWithAge = membersWithAge.sort((a, b) => {
      const ageA = calculateAge(a.DOB)!;
      const ageB = calculateAge(b.DOB)!;
      return ageB - ageA;
    });
    
    const potentialParents: PhoneBookEntry[] = [];
    const children: PhoneBookEntry[] = [];
    
    // 2025-01-27: Fixed family detection logic to properly identify both parents and treat people without ages as children
    
    if (sortedMembersWithAge.length > 0) {
      const eldest = sortedMembersWithAge[0];
      const eldestAge = calculateAge(eldest.DOB)!;
      
      // First pass: identify potential parents based on age differences
      for (let i = 1; i < sortedMembersWithAge.length; i++) {
        const member = sortedMembersWithAge[i];
        const memberAge = calculateAge(member.DOB)!;
        const ageDifference = eldestAge - memberAge;
        
        // If age difference is at least 15 years, consider eldest as potential parent
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
    
    // Second pass: look for additional potential parents among remaining members
    if (potentialParents.length > 0 && children.length > 0) {
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
    
    // Add members without age to children (as per user requirement)
    children.push(...membersWithoutAge);
    
    // If we still don't have any parents identified, all members go to children
    if (potentialParents.length === 0) {
      children.push(...sortedMembersWithAge);
    }
    
    // Create family member objects with proper roles
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

    console.log('Processed family members:', familyMembers);
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
        onClose();
        console.log('Family saved successfully');
      }
    } catch (error) {
      console.error('Failed to save family:', error);
      setError('Failed to save family information');
    }
  };

  // 2025-01-28: Handle family relationship changes
  const handleRelationshipChange = async (relationships: any[]) => {
    try {
      console.log('Family relationships changed:', relationships);
      
      // 2025-01-28: Update local state with new relationships
      setFamilyRelationships(relationships);
      
      // 2025-01-28: Force a re-render by updating state
      console.log('Updated familyRelationships state:', relationships);
      
      // 2025-01-28: For now, just log the changes
      // TODO: Implement actual relationship saving to backend
      console.log('New relationships to save:', relationships);
      
      // 2025-01-28: Show success message
      alert('Family relationships updated successfully! (Note: Changes are currently logged but not saved to database)');
      
    } catch (error) {
      console.error('Error updating family relationships:', error);
      alert(`Error updating family relationships: ${error}`);
    }
  };

  // 2025-01-28: Handle family tree update
  const handleUpdateFamilyTree = async (updatedMembers: any[]) => {
    try {
      console.log('Updating family tree with data:', updatedMembers);
      
      const response = await fetch('/api/family/groups/create_or_update_by_address/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          address: address,
          island: island,
          members: updatedMembers.map(member => ({
            entry_id: member.pid,
            role: member.role,
            relationship: member.relationship
          }))
        })
      });
      
      if (response.ok) {
        const updatedFamily = await response.json();
        console.log('Family tree updated successfully:', updatedFamily);
        setHasCustomFamily(true);
        
        // Refresh family members to show updated relationships
        await fetchFamilyMembers();
        
        // Show success message
        setError(null);
        console.log('Family tree updated and refreshed successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to update family tree:', error);
      throw error;
    }
  };

  // 2025-01-27: Added function to check for existing custom family data
  const checkForCustomFamily = async () => {
    try {
      console.log('Checking for existing custom family at:', address, island);
      
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/family/groups/by_address/?address=${encodeURIComponent(address)}&island=${encodeURIComponent(island)}`, {
        headers
      });
      
      if (response.ok) {
        const familyData = await response.json();
        console.log('Found existing custom family:', familyData);
        setHasCustomFamily(true);
        
        // If we have custom family data, we should load it instead of auto-detecting
        // For now, just mark that we have custom data
        console.log('Custom family exists, will show updated relationships when available');
      } else if (response.status === 404) {
        console.log('No existing custom family found, will use auto-detection');
        setHasCustomFamily(false);
      } else if (response.status === 401) {
        console.log('User not authenticated, cannot check for custom family');
        setHasCustomFamily(false);
      } else {
        console.log('Error checking for custom family:', response.status);
        setHasCustomFamily(false);
      }
    } catch (error) {
      console.log('Error checking for custom family:', error);
      setHasCustomFamily(false);
    }
  };

  if (!isOpen) return null;

  console.log('FamilyModal is rendering!', { isOpen, address, island, familyMembersLength: familyMembers.length });

  const modalContent = (
    <>
      <div 
        className="modal-overlay"
        onClick={onClose}
      >
        <div 
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-content">
              <h2 className="modal-title">Family at {address}</h2>
              <p className="modal-subtitle">{island}</p>
              {/* 2025-01-28: Moved family summary to header to save vertical space */}
              {familyMembers.length > 0 && (
                <div className="mt-2 text-sm text-gray-600 px-2 py-1 bg-gray-50 rounded border">
                  👥 Found {familyMembers.length} family members • {familyMembers.filter(m => m.role === 'parent').length} parents • {familyMembers.filter(m => m.role === 'child').length} children
                </div>
              )}
              {/* 2025-01-27: Added custom family indicator */}
              {hasCustomFamily && (
                <div className="mt-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  ✨ Custom family tree available
                </div>
              )}
            </div>
            <div className="modal-header-actions">
              {/* 2025-01-27: Added Edit Family Tree button */}
              <button
                onClick={() => setShowFamilyTreeEditor(true)}
                className="mr-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                title="Edit Family Tree"
              >
                ✏️ Edit Tree
              </button>
              <button
                onClick={onClose}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="modal-body">
            {/* Loading State */}
            {isLoading && (
              <div className="loading-state">
                <div className="loading-spinner-container">
                  <div className="loading-spinner"></div>
                  <div className="loading-spinner-secondary"></div>
                </div>
                <p className="loading-text">Discovering family connections...</p>
                <p className="loading-subtext">Searching through our directory</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="error-state">
                <div className="error-icon">
                  <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="error-content">
                  <h3 className="error-title">Oops! Something went wrong</h3>
                  <div className="error-message">{error}</div>
                </div>
              </div>
            )}

            {/* Family Members */}
            {!isLoading && !error && (
              <div className="family-content">
                
                {/* Family Tree Visualization */}
                <div className="family-tree-container">
                  <div className="family-tree-wrapper">
                    <div className="family-tree-content">
                      <FamilyTreeVisualization 
                        familyMembers={familyMembers} 
                        relationships={familyRelationships}
                        onRelationshipChange={handleRelationshipChange} 
                        isEditable={true} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <div className="modal-actions">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Close
              </button>
              {familyMembers.length > 0 && (
                <button
                  onClick={handleSaveFamily}
                  className="btn-primary"
                >
                  💾 Save as Family
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 2025-01-27: Added FamilyTreeEditor for manual family relationship editing */}
      <FamilyTreeEditor
        isOpen={showFamilyTreeEditor}
        onClose={() => setShowFamilyTreeEditor(false)}
        address={address}
        island={island}
        members={familyMembers.map(member => member.entry)}
        onSave={handleUpdateFamilyTree}
      />
    </>
  );

  const bodyElement = document.body;
  console.log('Body element found:', bodyElement);
  
  if (!bodyElement) {
    console.error('No body element found!');
    return null;
  }
  
  try {
    const portalResult = createPortal(modalContent, bodyElement);
    console.log('Portal created successfully:', portalResult);
    return portalResult;
  } catch (error) {
    console.error('Portal failed, falling back to direct render:', error);
    return modalContent;
  }
};

export default FamilyModal;
