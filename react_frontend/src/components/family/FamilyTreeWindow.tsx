// 2025-01-28: NEW - Dedicated family tree window component for better user experience
// 2025-01-28: Replaces embedded modal approach with focused, expandable window
// 2025-01-28: Implements responsive design and proper window sizing
// 2025-01-28: ENHANCED: Added drag-and-drop family relationship editing functionality
// 2025-01-31: ENHANCED: Support for multiple families at the same address

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { familyService } from '../../services/familyService';
import ClassicFamilyTree from './ClassicFamilyTree';
import RelationshipManager from './RelationshipManager';
import FamilyTreeDownloadButton from './FamilyTreeDownloadButton';
import FamilyTableView from './FamilyTableView';
import FamilyViewToggle, { ViewMode } from './FamilyViewToggle';
import FamilyTreeComparison from './FamilyTreeComparison';
import { PhoneBookEntry } from '../../types/directory';

interface FamilyTreeWindowProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  island: string;
  initialViewMode?: ViewMode; // 2025-01-29: NEW - Allow setting initial view mode
}

// 2025-01-28: FIXED - Use proper types from types directory to resolve TypeScript conflicts
interface FamilyMember {
  entry: PhoneBookEntry;
  role: 'parent' | 'child' | 'other';
  relationship?: string;
  familyGroupId?: number; // 2025-01-31: NEW - Family group identifier for multiple families
  familyGroupName?: string; // 2025-01-31: NEW - Family group name for display
  originalRole?: 'parent' | 'child' | 'other'; // 2025-01-31: NEW - Original role when families are manually created
  originalFamilyId?: number; // 2025-01-31: NEW - Original family ID when families are manually created
}

interface FamilyRelationship {
  id: number;
  person1: number;
  person2: number;
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other';
  notes?: string;
  is_active: boolean;
  familyGroupId?: number; // 2025-01-31: NEW - Family group identifier for multiple families
}

// 2025-01-31: NEW - Interface for family groups
interface FamilyGroup {
  id: number;
  name: string;
  description?: string;
  address: string;
  island: string;
  parent_family?: number;
  parent_family_name?: string;
  members: FamilyMember[];
  relationships: FamilyRelationship[];
  created_at: string;
}

const FamilyTreeWindow: React.FC<FamilyTreeWindowProps> = ({ 
  isOpen, 
  onClose, 
  address, 
  island,
  initialViewMode = 'tree'
}) => {
  // const { user } = useAuthStore(); // Currently unused but kept for future use
  
  // State for family tree data
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyRelationships, setFamilyRelationships] = useState<FamilyRelationship[]>([]);
  
  // 2025-01-31: NEW - State for multiple families
  const [families, setFamilies] = useState<FamilyGroup[]>([]);
  const [hasMultipleFamilies, setHasMultipleFamilies] = useState(false);
  
  // 2025-01-28: ADDED - State to track if a family group exists (even with no members)
  const [familyGroupExists, setFamilyGroupExists] = useState(false);
  const [familyGroupData, setFamilyGroupData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 2025-01-29: FIXED - Increased default window size to accommodate family tree content
  const [windowSize, setWindowSize] = useState({ width: 1400, height: 900 });
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // 2025-01-28: FIXED - Center the window on screen by default
  const [windowPosition, setWindowPosition] = useState(() => {
    // Calculate center position based on screen size
    const centerX = Math.max(0, (window.innerWidth - 1400) / 2);
    const centerY = Math.max(0, (window.innerHeight - 900) / 2);
    return { x: centerX, y: centerY };
  });
  
  // 2025-01-28: ENHANCED: Added state for editing mode
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // 2025-01-29: NEW - State for multi-row layout toggle
  const [useMultiRowLayout, setUseMultiRowLayout] = useState(false);
  
  // 2025-01-29: NEW - State for tracking unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 2025-01-29: NEW - State for view mode toggle between tree and table views
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Try to get user's saved preference, fallback to initialViewMode prop
    const savedPreference = localStorage.getItem('family-view-preference') as ViewMode;
    return savedPreference || initialViewMode;
  });

  // 2025-01-29: NEW - Function to handle view mode changes and save user preference
  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    // Save user's preference to localStorage
    localStorage.setItem('family-view-preference', newViewMode);
  };
  
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Check if user is admin (currently unused but kept for future use)
  // const isAdmin = user?.is_staff || user?.is_superuser || user?.user_type === 'admin';

  // 2025-01-28: FIXED - Recalculate center position when window opens
  useEffect(() => {
    if (isOpen) {
      const centerX = Math.max(0, (window.innerWidth - windowSize.width) / 2);
      const centerY = Math.max(0, (window.innerHeight - windowSize.height) / 2);
      
      // 2025-01-28: ENHANCED - Ensure window stays within screen bounds
      const maxX = window.innerWidth - windowSize.width;
      const maxY = window.innerHeight - windowSize.height;
      
      const boundedX = Math.max(0, Math.min(centerX, maxX));
      const boundedY = Math.max(0, Math.min(centerY, maxY));
      
      setWindowPosition({ x: boundedX, y: boundedY });
    }
  }, [isOpen, windowSize.width, windowSize.height]);

  // 2025-01-28: ENHANCED - Handle window resize to keep family tree window centered
  useEffect(() => {
    const handleWindowResize = () => {
      if (isOpen) {
        const centerX = Math.max(0, (window.innerWidth - windowSize.width) / 2);
        const centerY = Math.max(0, (window.innerHeight - windowSize.height) / 2);
        
        // 2025-01-28: ENHANCED - Ensure window stays within screen bounds after resize
        const maxX = window.innerWidth - windowSize.width;
        const maxY = window.innerHeight - windowSize.height;
        
        const boundedX = Math.max(0, Math.min(centerX, maxX));
        const boundedY = Math.max(0, Math.min(centerY, maxY));
        
        setWindowPosition({ x: boundedX, y: boundedY });
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isOpen, windowSize.width, windowSize.height]);

  // Handle window resize
  const handleResize = (e: React.MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = Math.max(800, e.clientX - windowPosition.x);
    const newHeight = Math.max(600, e.clientY - windowPosition.y);
    
    setWindowSize({ width: newWidth, height: newHeight });
  };

  // Handle window drag
  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setWindowPosition({ x: newX, y: newY });
  };

  // Start resize
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Start drag
  const startDrag = (e: React.MouseEvent) => {
    if (e.target !== headerRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y
    });
  };

  // Stop interactions
  const stopInteractions = () => {
    setIsResizing(false);
    setIsDragging(false);
  };

  // Global mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        handleResize(e as any);
      } else if (isDragging) {
        handleDrag(e as any);
      }
    };

    const handleMouseUp = () => {
      stopInteractions();
    };

    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isDragging, windowPosition]);

  // Fetch family members when window opens
  useEffect(() => {
    if (isOpen && address && island) {
      fetchFamilyMembers();
    }
  }, [isOpen, address, island]);

  // Fetch family members for the given address
  const fetchFamilyMembers = async () => {
    setIsLoading(true);
    setError(null);
    

    
    try {
      // 2025-01-31: ENHANCED - Try to get all families at the address first
      const allFamiliesResponse = await familyService.getAllFamiliesByAddress(address, island);
      
      if (allFamiliesResponse.success && allFamiliesResponse.data && allFamiliesResponse.data.length > 0) {
        
        // Transform the families data
        const transformedFamilies: FamilyGroup[] = allFamiliesResponse.data.map((family: any) => ({
          id: family.id,
          name: family.name,
          description: family.description,
          address: family.address,
          island: family.island,
          parent_family: family.parent_family,
          parent_family_name: family.parent_family_name,
          created_at: family.created_at,
          members: (family.members || []).map((member: any, index: number) => ({
            entry: {
              pid: member.entry?.pid || member.entry_id || member.id || index + 1,
              name: member.entry?.name || member.entry_name || member.name || '',
              contact: member.entry?.contact || member.entry_contact || member.contact || '',
              address: member.entry?.address || member.entry_address || member.address || '',
              island: member.entry?.island || member.entry_island || member.island || '',
              atoll: member.entry?.atoll || '',
              street: member.entry?.street || '',
              ward: member.entry?.ward || '',
              party: member.entry?.party || '',
              DOB: member.entry?.DOB || member.entry_dob || member.dob || member.entry?.dob || '',
              status: member.entry?.status || '',
              remark: member.entry?.remark || '',
              email: member.entry?.email || '',
              gender: member.entry?.gender || '',
              extra: member.entry?.extra || '',
              profession: member.entry?.profession || '',
              pep_status: member.entry?.pep_status || '',
              change_status: member.entry?.change_status || 'Active',
              requested_by: member.entry?.requested_by || '',
              batch: member.entry?.batch || '',
              image_status: member.entry?.image_status || '',
              family_group_id: member.entry?.family_group_id || undefined,
              nid: member.entry?.nid || undefined,
              age: member.entry?.age || undefined
            },
            role: member.role_in_family || member.role || 'other',
            relationship: member.relationship || ''
          })),
          relationships: (family.relationships || []).map((rel: any) => ({
            id: rel.id,
            person1: rel.person1?.pid || rel.person1_id || rel.person1,
            person2: rel.person2?.pid || rel.person2_id || rel.person2,
            relationship_type: rel.relationship_type as 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other',
            notes: rel.notes || '',
            is_active: rel.is_active !== false
          }))
        }));
        
        setFamilies(transformedFamilies);
        setHasMultipleFamilies(transformedFamilies.length > 1);
        
        // 2025-01-31: FIXED - Combine all families' members and relationships for unified display
        if (transformedFamilies.length > 0) {
          // Combine all members from all families
          const allMembers: FamilyMember[] = [];
          const allRelationships: FamilyRelationship[] = [];
          
          transformedFamilies.forEach((family, familyIndex) => {
            // Add family members with family group info
            family.members.forEach(member => {
              allMembers.push({
                ...member,
                // Add family group identifier for visual distinction
                familyGroupId: family.id,
                familyGroupName: family.name || `Family ${familyIndex + 1}`,
                // 2025-01-31: NEW - Preserve original role when families are manually created
                originalRole: member.role,
                originalFamilyId: family.id
              });
            });
            
            // Add family relationships
            family.relationships.forEach(relationship => {
              allRelationships.push({
                ...relationship,
                // Add family group identifier
                familyGroupId: family.id
              });
            });
          });
          
          setFamilyMembers(allMembers);
          setFamilyRelationships(allRelationships);
          setFamilyGroupExists(true);
          setFamilyGroupData(transformedFamilies[0]); // Use first family as primary
          
          // Debug logging
          console.log('🔍 FamilyTreeWindow: Set family data:', {
            membersCount: allMembers.length,
            relationshipsCount: allRelationships.length,
            relationships: allRelationships,
            members: allMembers.map(m => ({ id: m.entry.pid, name: m.entry.name }))
          });
          
          console.log('🔍 FamilyTreeWindow: Set family data:', {
            familyGroupExists: true,
            familyGroupData: transformedFamilies[0],
            familiesCount: transformedFamilies.length,
            membersCount: allMembers.length,
            relationshipsCount: allRelationships.length
          });
          
          // 2025-01-31: DISABLED - Infinite loop prevention - relationship recreation logic disabled
          // The backend relationship creation logic needs to be fixed first
          if (allRelationships.length === 0 && allMembers.length > 0) {
            console.log('⚠️ Family found but has no relationships - backend relationship creation needs to be fixed');
            console.log('🔧 Using frontend fallback connections instead of recreating family');
          }
          
          // 2025-01-31: NEW - Set multiple families flag to true when we have multiple families
          // This ensures proper visual distinction and bypasses parent detection logic
          setHasMultipleFamilies(transformedFamilies.length > 1);
        }
        
        return;
      }
      
      // Fallback to single family approach if no families found
      const response = await familyService.getFamilyByAddress(address, island);
      
      // 2025-01-28: ENHANCED - If family not found, always attempt to create it automatically
      if (response.notFound) {
        try {
          // Always attempt to create the family group automatically
          const createResponse = await familyService.createOrUpdateFamilyByAddress(address, island);
          
          if (createResponse.success && createResponse.data) {
            // Fetch the newly created family data
            await fetchFamilyMembers();
            return;
          } else {
            // 2025-01-28: UPDATED - Show more accurate message since backend now allows family creation for all addresses
            setError(`Unable to create family group automatically: ${createResponse.error || 'Unknown error'}`);
            setFamilyGroupExists(false);
            setFamilyGroupData(null);
          }
        } catch (createError) {
          // 2025-01-28: UPDATED - Show more accurate message since backend now allows family creation for all addresses
          setError(`Unable to create family group due to a system error: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
          setFamilyGroupExists(false);
          setFamilyGroupData(null);
        }
        return;
      }
      
      if (response.success && response.data) {
        const members = response.data.members || [];
        const relationships = response.data.relationships || [];
        
        console.log('🔗 Raw API response relationships:', relationships);
        
        // 2025-01-28: FIXED - Transform API data to match expected types
        const transformedMembers: FamilyMember[] = members.map((member: any, index: number) => ({
          entry: {
            pid: member.entry?.pid || member.entry_id || member.id || index + 1, // Use index+1 as fallback for unique IDs
            name: member.entry?.name || member.entry_name || member.name || '',
            contact: member.entry?.contact || member.entry_contact || member.contact || '',
            address: member.entry?.address || member.entry_address || member.address || '',
            island: member.entry?.island || member.entry_island || member.island || '',
            atoll: member.entry?.atoll || '',
            street: member.entry?.street || '',
            ward: member.entry?.ward || '',
            party: member.entry?.party || '',
            DOB: member.entry?.DOB || member.entry_dob || member.dob || member.entry?.dob || '',
            status: member.entry?.status || '',
            remark: member.entry?.remark || '',
            email: member.entry?.email || '',
            gender: member.entry?.gender || '',
            extra: member.entry?.extra || '',
            profession: member.entry?.profession || '',
            pep_status: member.entry?.pep_status || '',
            change_status: member.entry?.change_status || 'Active',
            requested_by: member.entry?.requested_by || '',
            batch: member.entry?.batch || '',
            image_status: member.entry?.image_status || '',
            family_group_id: member.entry?.family_group_id || undefined,
            nid: member.entry?.nid || undefined,
            age: member.entry?.age || undefined  // 2025-01-28: FIXED - Add age field to preserve backend-calculated ages
          },
          role: member.role_in_family || member.role || 'other',
          relationship: member.relationship || ''
        }));
        
        const transformedRelationships: FamilyRelationship[] = relationships.map((rel: any) => {
          const transformed = {
            id: rel.id,
            person1: rel.person1?.pid || rel.person1_id || rel.person1,
            person2: rel.person2?.pid || rel.person2_id || rel.person2,
            relationship_type: rel.relationship_type as 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other',
            notes: rel.notes || '',
            is_active: rel.is_active !== false
          };
          console.log('🔗 Transformed relationship:', transformed);
          return transformed;
        });
        
        setFamilyMembers(transformedMembers);
        setFamilyRelationships(transformedRelationships);
        setFamilyGroupExists(true); // Assume family group exists if data is returned
        setFamilyGroupData(response.data); // Store full response data
        
        // Set as single family
        setFamilies([{
          id: response.data.id,
          name: response.data.name,
          description: response.data.description,
          address: response.data.address,
          island: response.data.island,
          parent_family: (response.data as any).parent_family || undefined,
          created_at: (response.data as any).created_at || new Date().toISOString(),
          members: transformedMembers,
          relationships: transformedRelationships
        }]);
        setHasMultipleFamilies(false);
        
        // 2025-01-31: NEW - Check if we need to update families state for multiple families
        // This ensures that if multiple families exist, we show them properly
        if (response.data.id) {
          try {
            const allFamiliesCheck = await familyService.getAllFamiliesByAddress(address, island);
            if (allFamiliesCheck.success && allFamiliesCheck.data && allFamiliesCheck.data.length > 1) {
              
              // Transform the families data
              const fallbackTransformedFamilies: FamilyGroup[] = allFamiliesCheck.data.map((family: any) => ({
                id: family.id,
                name: family.name,
                description: family.description,
                address: family.address,
                island: family.island,
                parent_family: family.parent_family,
                parent_family_name: family.parent_family_name,
                created_at: family.created_at,
                members: (family.members || []).map((member: any, index: number) => ({
                  entry: {
                    pid: member.entry?.pid || member.entry_id || member.id || index + 1,
                    name: member.entry?.name || member.entry_name || member.name || '',
                    contact: member.entry?.contact || member.entry_contact || member.contact || '',
                    address: member.entry?.address || member.entry_address || member.address || '',
                    island: member.entry?.island || member.entry_island || member.island || '',
                    atoll: member.entry?.atoll || '',
                    street: member.entry?.street || '',
                    ward: member.entry?.ward || '',
                    party: member.entry?.party || '',
                    DOB: member.entry?.DOB || member.entry_dob || member.dob || member.entry?.dob || '',
                    status: member.entry?.status || '',
                    remark: member.entry?.remark || '',
                    email: member.entry?.email || '',
                    gender: member.entry?.gender || '',
                    extra: member.entry?.extra || '',
                    profession: member.entry?.profession || '',
                    pep_status: member.entry?.pep_status || '',
                    change_status: member.entry?.change_status || 'Active',
                    requested_by: member.entry?.requested_by || '',
                    batch: member.entry?.batch || '',
                    image_status: member.entry?.image_status || '',
                    family_group_id: member.entry?.family_group_id || undefined,
                    nid: member.entry?.nid || undefined,
                    age: member.entry?.age || undefined
                  },
                  role: member.role_in_family || member.role || 'other',
                  relationship: member.relationship || ''
                })),
                relationships: (family.relationships || []).map((rel: any) => ({
                  id: rel.id,
                  person1: rel.person1?.pid || rel.person1_id || rel.person1,
                  person2: rel.person2?.pid || rel.person2_id || rel.person2,
                  relationship_type: rel.relationship_type as 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other',
                  notes: rel.notes || '',
                  is_active: rel.is_active !== false
                }))
              }));
              
              setFamilies(fallbackTransformedFamilies);
              setHasMultipleFamilies(true);
            }
          } catch (error) {
            // Silently handle error
          }
        }
      } else {
        // 2025-01-28: NEW - Only show error for actual failures, not for missing family groups
        setError(response.error || 'Failed to fetch family data');
        setFamilyGroupExists(false);
        setFamilyGroupData(null);
      }
    } catch (err) {
      setError('Error loading family data');
      setFamilyGroupExists(false);
      setFamilyGroupData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 2025-01-28: ENHANCED: Handle relationship changes from RelationshipManager
  const handleRelationshipChange = (updatedRelationships: FamilyRelationship[]) => {
    setFamilyRelationships(updatedRelationships);
    // 2025-01-28: NEW - Mark family as manually updated when user makes changes
    if (familyGroupData && familyGroupData.id) {
      markFamilyAsManuallyUpdated(familyGroupData.id);
    }
    // 2025-01-29: NEW - Track unsaved changes
    setHasUnsavedChanges(true);
    
    // 2025-01-31: NEW - Check if we need to refresh family data due to new family creation
    // If relationships were significantly reduced, it might indicate a new family was created
    if (updatedRelationships.length < familyRelationships.length - 2) {
      // Refresh family data to see if new families were created
      // Use a longer delay to ensure backend transaction is committed
      setTimeout(() => {
        fetchFamilyMembers();
      }, 2000);
    }
  };

  // 2025-01-28: ENHANCED: Handle family member changes (exclusions/inclusions)
  const handleFamilyMembersChange = (updatedMembers: FamilyMember[]) => {
    setFamilyMembers(updatedMembers);
    // 2025-01-28: NEW - Mark family as manually updated when user makes changes
    if (familyGroupData && familyGroupData.id) {
      markFamilyAsManuallyUpdated(familyGroupData.id);
    }
    // 2025-01-29: NEW - Track unsaved changes
    setHasUnsavedChanges(true);
    
    // 2025-01-31: NEW - Check if members were removed (indicating new family creation)
    if (updatedMembers.length < familyMembers.length - 1) {
      // Refresh family data to see if new families were created
      // Use a longer delay to ensure backend transaction is committed
      setTimeout(() => {
        fetchFamilyMembers();
      }, 2000);
    }
  };
  
  // 2025-01-28: NEW - Function to mark family as manually updated
  const markFamilyAsManuallyUpdated = async (familyId: number) => {
    try {
      // Call backend to mark family as manually updated
      await familyService.markFamilyAsManuallyUpdated(familyId);
    } catch (error) {
      // Silently handle error
    }
  };

  // 2025-01-29: NEW - Function to delete family group and clear saved relationships
  const handleDeleteFamily = async () => {
    console.log('🗑️ handleDeleteFamily called:', { 
      familyGroupData, 
      familyGroupExists, 
      hasFamilyGroupId: !!familyGroupData?.id 
    });
    
    if (!familyGroupData?.id) {
      console.error('❌ Cannot delete family: No family group ID available');
      setError('Cannot delete family: No family group ID available');
      return;
    }

    // Confirm deletion with user
    if (!window.confirm('Are you sure you want to delete this family group? This will remove all saved family relationships but keep individual members and their data intact. The family tree will be regenerated automatically.')) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Call backend to delete the family group
      await familyService.deleteFamilyGroup(familyGroupData.id);
      
      // Clear local state
      setFamilyMembers([]);
      setFamilyRelationships([]);
      setFamilyGroupExists(false);
      setFamilyGroupData(null);
      
      // Show success message
      setError(null);
      
      // Automatically regenerate family tree
      console.log('🔄 Regenerating family tree after deletion...');
      await fetchFamilyMembers();
    } catch (error) {
      setError(`Failed to delete family group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2025-01-29: NEW - Function to save family changes
  const handleSaveFamily = async () => {
    if (!familyGroupData?.id) {
      console.error('No family group ID available for saving');
      return;
    }

    setIsSaving(true);
    try {
      // Use the new saveFamilyChanges method to save family changes
      const response = await familyService.saveFamilyChanges(address, island, familyMembers, familyRelationships);
      
      if (response.success && response.data) {
        console.log('Family saved successfully');
        setHasUnsavedChanges(false);
        // Refresh family data to get updated information
        await fetchFamilyMembers();
        alert('Family changes saved successfully!');
      } else {
        throw new Error(response.error || 'Failed to save family changes');
      }
    } catch (error) {
      console.error('Failed to save family changes:', error);
      alert(`Failed to save family changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 2025-01-28: ENHANCED: Toggle editing mode
  const toggleEditingMode = () => {
    setIsEditingMode(!isEditingMode);
  };

  // Handle window close (currently unused but kept for future use)
  // const handleClose = () => {
  //   setFamilyMembers([]);
  //   setFamilyRelationships([]);
  //   setError(null);
  //   onClose();
  // };

  // Don't render if no address provided
  if (!address) {
    return null;
  }

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="family-tree-overlay" onClick={onClose}>
      <div
        ref={windowRef}
        className="family-tree-window"
        style={{
          '--window-width': `${windowSize.width}px`,
          '--window-height': `${windowSize.height}px`,
          '--window-left': `${windowPosition.x}px`,
          '--window-top': `${windowPosition.y}px`
        } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Window Header */}
        <div 
          ref={headerRef}
          className="family-tree-header"
          onMouseDown={startDrag}
        >
          <div className="family-tree-title">
            <h2>
              {viewMode === 'tree' ? 'Family Tree' : viewMode === 'comparison' ? 'Family Tree Comparison' : 'Family Table'} - {address}, {island}
            </h2>
            <div className="family-tree-subtitle">
              {hasMultipleFamilies ? (
                <>
                  {families.length} families • {families.reduce((total, family) => total + family.members.length, 0)} total members • {viewMode === 'tree' ? 'Combined' : viewMode === 'comparison' ? 'Comparison' : 'Tabular'} view
                </>
              ) : (
                <>
                  {familyMembers.length} family members • {viewMode === 'tree' ? 'Visual' : viewMode === 'comparison' ? 'Comparison' : 'Tabular'} view
                </>
              )}
            </div>
          </div>
          
          <div className="family-tree-controls">
            {/* 2025-01-29: NEW - View mode toggle between tree and table views */}
            {!isEditingMode && familyMembers.length > 0 && (
              <FamilyViewToggle
                currentView={viewMode}
                onViewChange={handleViewModeChange}
                className="mr-2"
              />
            )}
            
            {/* 2025-01-29: NEW - Save Family button when in editing mode with unsaved changes */}
            {isEditingMode && hasUnsavedChanges && (
              <button
                onClick={handleSaveFamily}
                disabled={isSaving}
                className="save-family-btn"
                title="Save family changes"
              >
                {isSaving ? '💾 Saving...' : '💾 Save Family'}
              </button>
            )}
            
            {/* 2025-01-29: NEW - Added Delete Family button to clear saved relationships */}
            {familyGroupExists && familyGroupData?.id && (
              <button
                onClick={handleDeleteFamily}
                className="delete-family-btn"
                title="Delete saved family relationships (keeps individual members)"
              >
                🗑️ Delete Family
              </button>
            )}
            
            {/* 2025-01-29: NEW - Multi-row layout toggle button - Always visible for better UX */}
            <button
              onClick={() => setUseMultiRowLayout(!useMultiRowLayout)}
              className={`multi-row-toggle-btn ${useMultiRowLayout ? 'active' : ''}`}
              title={useMultiRowLayout ? 'Switch to single-row layout' : 'Switch to multi-row layout (prevents horizontal clipping)'}
              style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
            >
              {useMultiRowLayout ? '📐 Single Row' : '📐 Multi Row'}
            </button>
            

            
            {/* 2025-01-29: NEW - Added Download Family Tree button */}
            {familyGroupExists && familyMembers.length > 0 && (
              <FamilyTreeDownloadButton
                svgRef={svgRef as React.RefObject<SVGSVGElement>}
                familyName={`${address}_${island}`}
                variant="outline"
                size="sm"
              />
            )}
            
            {/* 2025-01-28: ENHANCED: Added Edit Family Tree button */}
            <button
              onClick={toggleEditingMode}
              className={`edit-family-btn ${isEditingMode ? 'active' : ''}`}
              title={isEditingMode ? 'Exit Edit Mode' : 'Edit Family Tree'}
            >
              {isEditingMode ? '✏️ Exit Edit' : '✏️ Edit Tree'}
            </button>
            
            <button
              onClick={onClose}
              className="close-btn"
              title="Close window"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Window Content */}
        <div className="family-tree-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading family data...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>Error: {error}</p>
            </div>
          ) : familyMembers.length === 0 ? (
            <div className="empty-state">
              <p>No family members found for this address.</p>
              <p className="text-sm text-gray-500 mt-2">
                Family tree is being generated automatically...
              </p>
            </div>
          ) : (
            <>









              
              {/* 2025-01-31: NEW - Multiple families notification banner */}
              {hasMultipleFamilies && families.length > 1 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">
                        🌳 Multiple Families Detected
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Found {families.length} families at this address. Showing combined family tree view.
                      </p>
                      {families.some(f => f.parent_family) && (
                        <p className="text-xs text-blue-600 mt-2">
                          💡 Some families are sub-families with parent-child relationships.
                        </p>
                      )}
                      
                      {/* 2025-01-31: NEW - Family group color legend */}
                      <div className="mt-3 flex flex-wrap gap-4">
                        <p className="text-xs text-blue-600 font-medium">Family Groups:</p>
                        {families.map((family, index) => (
                          <div key={family.id} className="flex items-center gap-2">
                            <div 
                              className={`w-4 h-4 rounded border-2 ${
                                index % 2 === 0 
                                  ? 'bg-blue-100 border-blue-600' 
                                  : 'bg-orange-100 border-orange-600'
                              }`}
                            />
                            <span className="text-xs text-blue-700">
                              {family.name || `Family ${index + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        console.log('🔍 FamilyTreeWindow: Toggling to single family view');
                        setHasMultipleFamilies(false);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Show Single Family
                    </button>
                  </div>
                </div>
              )}
              
              {/* 2025-01-28: ENHANCED: Show RelationshipManager when in editing mode */}
              {isEditingMode ? (
                <RelationshipManager
                  familyMembers={familyMembers}
                  relationships={familyRelationships}
                  onRelationshipChange={handleRelationshipChange}
                  onFamilyMembersChange={handleFamilyMembersChange}
                  isEditable={true}
                  onSaveFamily={handleSaveFamily}
                  hasUnsavedChanges={hasUnsavedChanges}
                  familyGroupData={familyGroupData}
                />
              ) : (
                /* Show family tree visualization */
                viewMode === 'tree' ? (
                  (() => {
                    // 2025-01-31: FIXED - Always use ClassicFamilyTree for both single and multiple families
                    console.log('🔍 FamilyTreeWindow: Rendering ClassicFamilyTree with combined data:', {
                      viewMode,
                      hasMultipleFamilies,
                      familiesCount: families.length,
                      familyMembersCount: familyMembers.length,
                      relationshipsCount: familyRelationships.length,
                      relationships: familyRelationships
                    });
                    
                    return (
                      <ClassicFamilyTree
                        familyMembers={familyMembers}
                        relationships={familyRelationships}
                        useMultiRowLayout={useMultiRowLayout}
                        svgRef={svgRef as React.RefObject<SVGSVGElement>}
                      />
                    );
                  })()
                ) : viewMode === 'comparison' ? (
                  <FamilyTreeComparison
                    familyMembers={familyMembers}
                    relationships={familyRelationships}
                    onRelationshipChange={(relationship) => {
                      // Handle single relationship change by updating the relationships array
                      const updatedRelationships = familyRelationships.map(rel => 
                        rel.id === relationship.id ? relationship : rel
                      );
                      handleRelationshipChange(updatedRelationships);
                    }}
                    hasMultipleFamilies={hasMultipleFamilies}
                    svgRef={svgRef as React.RefObject<SVGSVGElement>}
                  />
                ) : (
                  <FamilyTableView
                    familyMembers={familyMembers}
                    address={address}
                    island={island}
                  />
                )
              )}
            </>
          )}
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeHandleRef}
          className="resize-handle"
          onMouseDown={startResize}
        />
      </div>
    </div>,
    document.body
  );
};

export default FamilyTreeWindow;
