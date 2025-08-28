// 2025-01-27: Family modal component for showing family relationships when clicking on addresses
// 2025-01-27: Refactored to use Pico.css for lightweight, responsive, and professional styling
// 2025-01-27: Fixed styling issues to ensure graphics display properly
// 2025-01-28: ENHANCED: Added multi-generational family tree support by fetching existing relationships

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PhoneBookEntry } from '../../types/directory';
import FamilyTreeVisualization from './FamilyTreeVisualization';
import FamilyTreeEditor from './FamilyTreeEditor';
import { STORAGE_KEYS } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import { familyService } from '../../services/familyService';

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

// 2025-01-28: Added interface for family relationships to match backend structure
interface FamilyRelationship {
  id: number;
  person1: number; // pid of first person
  person2: number; // pid of second person
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other';
  notes?: string;
  is_active: boolean;
}

const FamilyModal: React.FC<FamilyModalProps> = ({ isOpen, onClose, address, island }) => {
  const { user } = useAuthStore();
  
  // 2025-01-28: DEBUG: Log initial state
  console.log('FamilyModal initial render:', { 
    user, 
    userType: user?.user_type,
    isStaff: user?.is_staff,
    isSuperuser: user?.is_superuser
  });
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyRelationships, setFamilyRelationships] = useState<FamilyRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false); // 2025-01-28: Added loading state for relationships
  const [error, setError] = useState<string | null>(null);
  // 2025-01-27: Added state for family tree editor functionality
  const [showFamilyTreeEditor, setShowFamilyTreeEditor] = useState(false);
  const [hasCustomFamily, setHasCustomFamily] = useState(false);
  const [familyGroupId, setFamilyGroupId] = useState<number | null>(null);
  
  // Check if user is admin
  const isAdmin = user?.is_staff || user?.is_superuser || user?.user_type === 'admin';
  
  // 2025-01-28: DEBUG: Log user and admin status
  console.log('FamilyModal user debug:', { 
    user, 
    isAdmin, 
    is_staff: user?.is_staff, 
    is_superuser: user?.is_superuser, 
    user_type: user?.user_type 
  });
  
  // 2025-01-28: Wait for user data to be loaded before showing admin features
  const isUserLoaded = !!user;

  useEffect(() => {
    console.log('FamilyModal useEffect:', { isOpen, address, island });
    if (isOpen && address && island) {
      fetchFamilyMembers();
      // 2025-01-28: ENHANCED: Check for existing custom family data and load relationships
      console.log('Calling checkForCustomFamily...');
      checkForCustomFamily();
    }
  }, [isOpen, address, island]);

  // 2025-01-28: DEBUG: Monitor relationships state changes
  useEffect(() => {
    console.log('FamilyModal relationships state changed:', {
      relationshipsCount: familyRelationships.length,
      relationships: familyRelationships,
      isLoadingRelationships,
      hasCustomFamily,
      familyGroupId
    });
  }, [familyRelationships, isLoadingRelationships, hasCustomFamily, familyGroupId]);
  
  // 2025-01-28: DEBUG: Monitor hasCustomFamily state changes specifically
  useEffect(() => {
    console.log('FamilyModal hasCustomFamily state changed:', hasCustomFamily);
  }, [hasCustomFamily]);
  
  // 2025-01-28: DEBUG: Monitor user state changes
  useEffect(() => {
    console.log('FamilyModal user state changed:', { 
      user, 
      isAdmin, 
      is_staff: user?.is_staff, 
      is_superuser: user?.is_superuser, 
      user_type: user?.user_type 
    });
  }, [user, isAdmin]);

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
      // 2025-01-28: Use backend-calculated age for reliable sorting
      if (a.age !== undefined && a.age !== null && b.age !== undefined && b.age !== null) {
        return b.age - a.age;  // Sort by age (eldest first)
      }
      // Fallback to DOB calculation only if age is not available
      if (a.DOB && b.DOB) {
        const ageA = new Date().getFullYear() - new Date(a.DOB).getFullYear();
        const ageB = new Date().getFullYear() - new Date(b.DOB).getFullYear();
        return ageB - ageA;
      }
      return (b.name?.length || 0) - (a.name?.length || 0);
    });

    console.log('Sorted entries:', sortedEntries);

    const familyMembers: FamilyMember[] = [];
    
    // 2025-01-28: Updated to use backend-calculated age for reliability
    const calculateAge = (entry: PhoneBookEntry): number | null => {
      // 2025-01-28: Use backend-calculated age if available (more reliable)
      if (entry.age !== undefined && entry.age !== null) {
        return entry.age;
      }
      
      // Fallback to DOB calculation only if age is not available
      if (!entry.DOB) return null;
      try {
        const birthDate = new Date(entry.DOB);
        if (isNaN(birthDate.getTime())) return null;
        const currentYear = new Date().getFullYear();
        const birthYear = birthDate.getFullYear();
        return currentYear - birthYear;
      } catch {
        return null;
      }
    };
    
    const membersWithAge = sortedEntries.filter(entry => calculateAge(entry) !== null);
    const membersWithoutAge = sortedEntries.filter(entry => calculateAge(entry) === null);
    
    const sortedMembersWithAge = membersWithAge.sort((a, b) => {
      const ageA = calculateAge(a)!;
      const ageB = calculateAge(b)!;
      return ageB - ageA;
    });
    
    const potentialParents: PhoneBookEntry[] = [];
    const children: PhoneBookEntry[] = [];
    
    // 2025-01-27: Fixed family detection logic to properly identify both parents and treat people without ages as children
    
    if (sortedMembersWithAge.length > 0) {
      const eldest = sortedMembersWithAge[0];
      const eldestAge = calculateAge(eldest)!;
      
      // First pass: identify potential parents based on age differences
      for (let i = 1; i < sortedMembersWithAge.length; i++) {
        const member = sortedMembersWithAge[i];
        const memberAge = calculateAge(member)!;
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
        const memberAge = calculateAge(member)!;
        let canBeParent = true;
        
        // Check if this member can be a parent to all children
        for (const child of children) {
          const childAge = calculateAge(child)!;
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
        const childAge = calculateAge(child)!;
        const parentAge = calculateAge(potentialParents[0])!;
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
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`
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

  // 2025-01-28: ENHANCED: Function to save relationships to a family group
  const saveRelationshipsToFamilyGroup = async (familyGroupId: number, relationships: FamilyRelationship[]) => {
    try {
      console.log('Saving relationships to family group:', familyGroupId, relationships);
      
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // 2025-01-28: Save each relationship using the correct nested endpoint
      for (const rel of relationships) {
        console.log('Saving relationship:', rel);
        
        // 2025-01-28: Use the correct nested endpoint for family relationships
        // 2025-01-28: FIXED: Backend automatically sets family_group from URL parameter, don't send in body
        const response = await fetch(`/api/family/groups/${familyGroupId}/relationships/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            person1: rel.person1,
            person2: rel.person2,
            relationship_type: rel.relationship_type,
            notes: rel.notes || '',
            is_active: rel.is_active
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to save relationship:', rel, response.status, errorText);
          throw new Error(`Failed to save relationship: ${response.status} ${errorText}`);
        } else {
          console.log('Relationship saved successfully:', rel);
        }
      }
      
      console.log('All relationships saved successfully');
    } catch (error) {
      console.error('Error saving relationships:', error);
      throw error;
    }
  };

  // 2025-01-28: ENHANCED: Function to fetch existing family relationships
  const fetchFamilyRelationships = async (familyGroupId: number) => {
    try {
      console.log('Fetching family relationships for group:', familyGroupId);
      setIsLoadingRelationships(true); // 2025-01-28: Set loading state
      
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('🔐 Authentication debug for fetchFamilyRelationships:', {
        tokenExists: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        familyGroupId: familyGroupId
      });
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.warn('⚠️ No auth token found - request will fail with 401');
      }
      
      const apiUrl = `/api/family/groups/${familyGroupId}/relationships/`;
      console.log('🌐 Making request to:', apiUrl);
      console.log('📋 Request headers:', headers);
      
      const response = await fetch(apiUrl, {
        headers
      });
      
      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const relationshipsData = await response.json();
        console.log('✅ Fetched family relationships:', relationshipsData);
        
        // 2025-01-28: Transform backend data to match frontend interface
        // 2025-01-28: FIXED: Handle paginated response structure - use results array
        const relationshipsArray = relationshipsData.results || relationshipsData;
        console.log('Raw relationships data:', relationshipsData);
        console.log('Relationships array to process:', relationshipsArray);
        
        const transformedRelationships: FamilyRelationship[] = relationshipsArray.map((rel: any) => ({
          id: rel.id,
          person1: rel.person1,
          person2: rel.person2,
          relationship_type: rel.relationship_type,
          notes: rel.notes,
          is_active: rel.is_active
        }));
        
        console.log('Transformed relationships:', transformedRelationships);
        console.log('Relationship validation:', transformedRelationships.map(r => ({
          id: r.id,
          person1: r.person1,
          person2: r.person2,
          type: r.relationship_type,
          active: r.is_active,
          valid: r.id && r.person1 && r.person2 && r.relationship_type
        })));
        
        // 2025-01-28: ENHANCED: Merge with existing relationships to preserve frontend state
        const mergedRelationships = mergeRelationships(familyRelationships, transformedRelationships);
        console.log('Merged relationships:', {
          existing: familyRelationships.length,
          fetched: transformedRelationships.length,
          merged: mergedRelationships.length
        });
        
        setFamilyRelationships(mergedRelationships);
      } else {
        console.log('Failed to fetch relationships:', response.status);
        setFamilyRelationships([]);
      }
    } catch (error) {
      console.error('Error fetching family relationships:', error);
      setFamilyRelationships([]);
    } finally {
      setIsLoadingRelationships(false); // 2025-01-28: Clear loading state
    }
  };

  // 2025-01-28: ENHANCED: Function to merge relationships without losing frontend state
  const mergeRelationships = (existing: FamilyRelationship[], fetched: FamilyRelationship[]): FamilyRelationship[] => {
    // 2025-01-28: Create a map of existing relationships by their unique pair
    const existingMap = new Map<string, FamilyRelationship>();
    existing.forEach(rel => {
      const pair = JSON.stringify([Math.min(rel.person1, rel.person2), Math.max(rel.person1, rel.person2)]);
      existingMap.set(pair, rel);
    });
    
    // 2025-01-28: Create a map of fetched relationships by their unique pair
    const fetchedMap = new Map<string, FamilyRelationship>();
    fetched.forEach(rel => {
      const pair = JSON.stringify([Math.min(rel.person1, rel.person2), Math.max(rel.person1, rel.person2)]);
      fetchedMap.set(pair, rel);
    });
    
    // 2025-01-28: Merge: use fetched relationships, but preserve any frontend-only relationships
    const merged = new Map<string, FamilyRelationship>();
    
    // 2025-01-28: Add all fetched relationships first
    fetchedMap.forEach((rel, pair) => {
      merged.set(pair, rel);
    });
    
    // 2025-01-28: Add any existing relationships that aren't in fetched (frontend-only)
    existingMap.forEach((rel, pair) => {
      if (!fetchedMap.has(pair)) {
        merged.set(pair, rel);
      }
    });
    
    const result = Array.from(merged.values());
    console.log('Relationship merge result:', {
      existingCount: existing.length,
      fetchedCount: fetched.length,
      mergedCount: result.length,
      frontendOnly: existing.length + fetched.length - result.length
    });
    
    return result;
  };

  // 2025-01-28: ENHANCED: Function to handle relationship changes from FamilyTreeVisualization
  // 2025-01-28: FIXED: Added backend refresh after saving to ensure SVG updates properly
  // 2025-01-28: CRITICAL: Now saves both family members and relationships to ensure complete family persistence
  const handleRelationshipChange = async (newRelationships: FamilyRelationship[]) => {
    console.log('Relationship change requested:', newRelationships);
    
    // 2025-01-28: DEBUG: Check token state before and after relationship change
    const tokenBefore = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    console.log('Token state before relationship change:', {
      exists: !!tokenBefore,
      length: tokenBefore?.length,
      preview: tokenBefore ? `${tokenBefore.substring(0, 20)}...` : 'none'
    });
    
    // 2025-01-28: CRITICAL FIX: Store the current relationships BEFORE updating state
    // 2025-01-28: This prevents the comparison logic from using already-updated state
    const currentRelationships = [...familyRelationships];
    
    // 2025-01-28: CRITICAL FIX: FamilyTreeVisualization now sends only NEW relationships
    // 2025-01-28: Merge the new relationships with existing ones to maintain complete state
    const mergedRelationships = [...currentRelationships, ...newRelationships];
    console.log('Merging relationships:', {
      existing: currentRelationships.length,
      new: newRelationships.length,
      merged: mergedRelationships.length
    });
    
    // 2025-01-28: Update local state with merged relationships for responsive UI
    setFamilyRelationships(mergedRelationships);
    
    // 2025-01-28: If we have a family group, update the backend
    if (hasCustomFamily) {
      console.log('Updating existing family group with new relationships');
      
      try {
        // 2025-01-28: Update the existing family group with both members and relationships
        if (familyGroupId) {
          // 2025-01-28: CRITICAL FIX: Since we're receiving only new relationships, no need to filter
          // 2025-01-28: All received relationships are new and should be saved
          console.log('Saving new relationships to backend:', newRelationships);
          
          const response = await fetch('/api/family/groups/create_or_update_by_address/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`
            },
            body: JSON.stringify({
              address: address,
              island: island,
              members: familyMembers.map(member => ({
                entry_id: member.entry.pid,
                role: member.role
              })),
              // 2025-01-28: Send all new relationships since they're guaranteed to be new
              relationships: newRelationships.map(rel => ({
                person1_id: rel.person1,
                person2_id: rel.person2,
                relationship_type: rel.relationship_type,
                notes: rel.notes || ''
              }))
            })
          });
          
          if (response.ok) {
            console.log('Family group updated successfully with new relationships');
            
            // 2025-01-28: CRITICAL: Refresh relationships from backend to ensure state consistency
            console.log('Refreshing relationships from backend after save...');
            await fetchFamilyRelationships(familyGroupId);
            
            alert('Family relationships updated and saved successfully!');
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          }
        } else {
          console.error('No family group ID available');
          alert('Error: Family group ID not found. Changes will not be persisted.');
        }
      } catch (error) {
        console.error('Failed to save relationships to existing family group:', error);
        alert('Failed to save relationships. Changes will not be persisted.');
        
        // 2025-01-28: CRITICAL: Revert to previous state if save failed
        console.log('Reverting to previous relationship state due to save failure');
        setFamilyRelationships(currentRelationships);
      }
    } else {
      console.log('No existing family group - creating one to persist relationships');
      
      // 2025-01-28: Create a new family group to persist the relationships
      try {
        const response = await fetch('/api/family/groups/create_or_update_by_address/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`
          },
          body: JSON.stringify({
            address: address,
            island: island,
            members: familyMembers.map(member => ({
              entry_id: member.entry.pid,
              role: member.role
            })),
            relationships: newRelationships.map(rel => ({
              person1_id: rel.person1,
              person2_id: rel.person2,
              relationship_type: rel.relationship_type,
              notes: rel.notes || ''
            }))
          })
        });
        
        if (response.ok) {
          const familyGroup = await response.json();
          console.log('Family group created successfully:', familyGroup);
          setHasCustomFamily(true);
          setFamilyGroupId(familyGroup.id); // 2025-01-28: Store the new family group ID
          
          // 2025-01-28: CRITICAL: Refresh relationships from backend to ensure state consistency
          console.log('Refreshing relationships from backend after creating new family group...');
          
          // 2025-01-28: DEBUG: Check token state before fetching relationships
          const tokenBeforeFetch = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          console.log('🔐 Token state before fetchFamilyRelationships:', {
            exists: !!tokenBeforeFetch,
            length: tokenBeforeFetch?.length,
            preview: tokenBeforeFetch ? `${tokenBeforeFetch.substring(0, 20)}...` : 'none'
          });
          
          await fetchFamilyRelationships(familyGroup.id);
          
          // 2025-01-28: CRITICAL: Ensure relationships are still set after saving
          console.log('After saving relationships, current familyRelationships state:', familyRelationships);
          console.log('Re-asserting relationships to prevent loss:', newRelationships);
          setFamilyRelationships(newRelationships);
          
          alert('Family group created and relationships saved successfully!');
        } else {
          console.error('Failed to create family group:', response.status);
          alert('Failed to create family group. Relationships will not be persisted.');
        }
      } catch (error) {
        console.error('Error creating family group:', error);
        alert('Error creating family group. Relationships will not be persisted.');
      }
    }
    
    // 2025-01-28: DEBUG: Check token state after relationship change
    const tokenAfter = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    console.log('Token state after relationship change:', {
      exists: !!tokenAfter,
      length: tokenAfter?.length,
      preview: tokenAfter ? `${tokenAfter.substring(0, 20)}...` : 'none',
      changed: tokenBefore !== tokenAfter
    });
    
  };

  // 2025-01-28: Handle family tree update
  const handleUpdateFamilyTree = async (updatedMembers: any[]) => {
    try {
      console.log('Updating family tree with data:', updatedMembers);
      
      const response = await fetch('/api/family/groups/create_or_update_by_address/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`
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

  // 2025-01-28: ENHANCED: Function to check for existing custom family data and load relationships
  const checkForCustomFamily = async () => {
    try {
      console.log('Checking for existing custom family at:', address, island);
      
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('Authentication check - Token exists:', !!token, 'Token length:', token?.length);
      
      // 2025-01-28: Only check for custom family if user is authenticated
      if (!token) {
        console.log('User not authenticated, skipping custom family check - will use basic family detection');
        setHasCustomFamily(false);
        return;
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // 2025-01-28: Fix URL encoding issue - the island has a space that needs proper encoding
      const apiUrl = `/api/family/groups/by_address/?address=${encodeURIComponent(address)}&island=${encodeURIComponent(island)}`;
      console.log('Making API request to:', apiUrl);
      console.log('Request headers:', headers);
      console.log('Raw address:', address, 'Raw island:', island);
      console.log('Encoded address:', encodeURIComponent(address), 'Encoded island:', encodeURIComponent(island));
      
      const response = await fetch(apiUrl, {
        headers
      });
      
      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));
      
      // 2025-01-28: DEBUG: If we get a 401, let's see the full response
      if (response.status === 401) {
        try {
          const errorData = await response.text();
          console.log('401 Error response body:', errorData);
          
          // 2025-01-28: Check if token is still valid by testing a simple endpoint
          console.log('Testing token validity with simple endpoint...');
          const testResponse = await fetch('/api/family/groups/', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('Token validity test result:', {
            status: testResponse.status,
            ok: testResponse.ok
          });
        } catch (error) {
          console.error('Error reading 401 response:', error);
        }
      }
      
      if (response.ok) {
        const familyData = await response.json();
        console.log('Found existing custom family:', familyData);
        setHasCustomFamily(true);
        console.log('2025-01-28: DEBUG: Set hasCustomFamily to true');
        setFamilyGroupId(familyData.id); // 2025-01-28: Store the family group ID
        
        // 2025-01-28: ENHANCED: Load existing family relationships for multi-generational display
        if (familyData.id) {
          console.log('Loading existing family relationships for group:', familyData.id);
          await fetchFamilyRelationships(familyData.id);
        }
        
        console.log('Custom family exists with relationships loaded');
      } else if (response.status === 404) {
        console.log('No existing custom family found, will use auto-detection');
        setHasCustomFamily(false);
      } else if (response.status === 401) {
        console.log('Token expired or invalid, cannot check for custom family');
        setHasCustomFamily(false);
        // 2025-01-28: Clear invalid token
        localStorage.removeItem('token');
      } else {
        console.log('Error checking for custom family:', response.status);
        setHasCustomFamily(false);
      }
    } catch (error) {
      console.log('Error checking for custom family:', error);
      setHasCustomFamily(false);
    }
  };

  // 2025-01-28: Added handler for family deletion confirmation
  const handleDeleteFamily = async () => {
    if (!familyGroupId) {
      console.error('No family group ID found');
      return;
    }
    
    try {
      console.log('Deleting family group:', familyGroupId);
      const response = await familyService.deleteUpdatedFamilies({ family_group_id: familyGroupId });
      console.log('Family deletion successful:', response);
      
      // Reset family data
      setFamilyMembers([]);
      setFamilyRelationships([]);
      setHasCustomFamily(false);
      setFamilyGroupId(null);
      setError(null);
      
      // Re-fetch default family members
      await fetchFamilyMembers();
      
    } catch (error: any) {
      console.error('Failed to delete family:', error);
      setError(error.response?.data?.error || error.message || 'Failed to delete family');
    }
  };

  // 2025-01-28: Format name with age suffix
  const formatNameWithAge = (name: string, dob?: string): string => {
    if (!dob) return name;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return `${name} (${age - 1})`;
      }
      return `${name} (${age})`;
    } catch {
      return name;
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
              
              {/* 2025-01-28: Added Delete Family button for admin users */}
              {isUserLoaded && isAdmin && hasCustomFamily && (
                <button
                  onClick={handleDeleteFamily}
                  className="mr-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  title="Delete Updated Family"
                >
                  🗑️ Delete Family
                </button>
              )}
              
              {/* 2025-01-28: DEBUG: Show admin and custom family status */}
              {(() => {
                console.log('Delete button debug:', { isAdmin, hasCustomFamily, familyGroupId });
                return null;
              })()}
              
              {/* 2025-01-28: DEBUG: Show delete button visibility conditions */}
              <div className="text-xs text-gray-500 mt-1">
                Delete button conditions: isUserLoaded={String(isUserLoaded)}, isAdmin={String(isAdmin)}, hasCustomFamily={String(hasCustomFamily)}
              </div>
              
              {/* 2025-01-28: DEBUG: Show user loading state */}
              {!isUserLoaded && (
                <div className="text-xs text-yellow-600 mt-1">
                  ⏳ Loading user data...
                </div>
              )}
              
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
                      {/* 2025-01-28: FIXED: Wait for relationships to be loaded before rendering family tree */}
                      {isLoadingRelationships ? (
                        <div className="loading-state">
                          <div className="loading-spinner-container">
                            <div className="loading-spinner"></div>
                          </div>
                          <p className="loading-text">Loading family relationships...</p>
                        </div>
                      ) : (
                        <>
                          {/* 2025-01-28: DEBUG: Show family composition to verify all members are included */}
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                            <strong>Family Composition:</strong> {familyMembers.length} total members
                            <br />
                            <strong>1st Generation:</strong> {familyMembers.filter(m => m.role === 'parent').length} parents
                            <br />
                            <strong>2nd Generation:</strong> {familyMembers.filter(m => m.role === 'child').length} children
                            <br />
                            <strong>Relationships:</strong> {familyRelationships.length} defined
                            <br />
                            <strong>All Members:</strong> {familyMembers.map(m => formatNameWithAge(m.entry.name, m.entry.DOB)).join(', ')}
                          </div>
                          
                          <FamilyTreeVisualization 
                            familyMembers={familyMembers} 
                            relationships={familyRelationships}
                            onRelationshipChange={handleRelationshipChange} 
                            isEditable={true} 
                          />
                        </>
                      )}
                      {/* 2025-01-28: DEBUG: Track relationships state */}
                      {(() => { console.log('FamilyModal rendering with relationships:', familyRelationships); return null; })()}
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
