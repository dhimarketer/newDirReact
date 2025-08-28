// 2025-01-28: NEW - Dedicated family tree window component for better user experience
// 2025-01-28: Replaces embedded modal approach with focused, expandable window
// 2025-01-28: Implements responsive design and proper window sizing
// 2025-01-28: ENHANCED: Added drag-and-drop family relationship editing functionality

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { STORAGE_KEYS } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import { familyService } from '../../services/familyService';
import ClassicFamilyTree from './ClassicFamilyTree';
import RelationshipManager from './RelationshipManager';
import { PhoneBookEntry } from '../../types/directory';

interface FamilyTreeWindowProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  island: string;
}

// 2025-01-28: FIXED - Use proper types from types directory to resolve TypeScript conflicts
interface FamilyMember {
  entry: PhoneBookEntry;
  role: 'parent' | 'child' | 'other';
  relationship?: string;
}

interface FamilyRelationship {
  id: number;
  person1: number;
  person2: number;
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other';
  notes?: string;
  is_active: boolean;
}

const FamilyTreeWindow: React.FC<FamilyTreeWindowProps> = ({ 
  isOpen, 
  onClose, 
  address, 
  island 
}) => {
  const { user, isAuthenticated } = useAuthStore();
  
  // State for family tree data
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyRelationships, setFamilyRelationships] = useState<FamilyRelationship[]>([]);
  
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
  
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  const isAdmin = user?.is_staff || user?.is_superuser || user?.user_type === 'admin';

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
      const response = await familyService.getFamilyByAddress(address, island);
      
      // 2025-01-28: DEBUG - Log the actual response structure
      console.log('=== FAMILY TREE WINDOW DEBUG ===');
      console.log('DEBUG: API response:', response);
      console.log('DEBUG: Response success:', response.success);
      console.log('DEBUG: Response data:', response.data);
      console.log('DEBUG: Response notFound:', response.notFound);
      console.log('DEBUG: Members array:', response.data?.members);
      console.log('DEBUG: Relationships array:', response.data?.relationships);
      console.log('=== END FAMILY TREE WINDOW DEBUG ===');
      
      // 2025-01-28: ENHANCED - If family not found, always attempt to create it automatically
      if (response.notFound) {
        console.log('Family not found for:', { address, island });
        console.log('Attempting to automatically create family group...');
        
        try {
          // Always attempt to create the family group automatically
          const createResponse = await familyService.createOrUpdateFamilyByAddress(address, island);
          
          if (createResponse.success && createResponse.data) {
            console.log('Successfully created family group automatically');
            // Fetch the newly created family data
            await fetchFamilyMembers();
            return;
          } else {
            console.error('Failed to automatically create family group:', createResponse.error);
            // 2025-01-28: UPDATED - Show more accurate message since backend now allows family creation for all addresses
            setError('Unable to create family group automatically. This could be due to no phonebook entries found at this address, or a temporary system issue. Please try again or contact support if the problem persists.');
            setFamilyGroupExists(false);
            setFamilyGroupData(null);
          }
        } catch (createError) {
          console.error('Error automatically creating family group:', createError);
          // 2025-01-28: UPDATED - Show more accurate message since backend now allows family creation for all addresses
          setError('Unable to create family group due to a system error. Please try again or contact support if the problem persists.');
          setFamilyGroupExists(false);
          setFamilyGroupData(null);
        }
        return;
      }
      
      if (response.success && response.data) {
        const members = response.data.members || [];
        const relationships = response.data.relationships || [];
        
        // 2025-01-28: DEBUG - Log the processed data
        console.log('DEBUG: Processed members:', members);
        console.log('DEBUG: Processed relationships:', relationships);
        console.log('DEBUG: First member structure:', members[0]);
        
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
        
        const transformedRelationships: FamilyRelationship[] = relationships.map((rel: any) => ({
          id: rel.id,
          person1: rel.person1?.pid || rel.person1_id || rel.person1,
          person2: rel.person2?.pid || rel.person2_id || rel.person2,
          relationship_type: rel.relationship_type as 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other',
          notes: rel.notes || '',
          is_active: rel.is_active !== false
        }));
        
        setFamilyMembers(transformedMembers);
        setFamilyRelationships(transformedRelationships);
        setFamilyGroupExists(true); // Assume family group exists if data is returned
        setFamilyGroupData(response.data); // Store full response data
      } else {
        // 2025-01-28: NEW - Only show error for actual failures, not for missing family groups
        setError(response.error || 'Failed to fetch family data');
        setFamilyGroupExists(false);
        setFamilyGroupData(null);
      }
    } catch (err) {
      console.error('Error fetching family members:', err);
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
    console.log('Relationships updated:', updatedRelationships);
  };

  // 2025-01-28: ENHANCED: Handle family member changes (exclusions/inclusions)
  const handleFamilyMembersChange = (updatedMembers: FamilyMember[]) => {
    setFamilyMembers(updatedMembers);
    // 2025-01-28: NEW - Mark family as manually updated when user makes changes
    if (familyGroupData && familyGroupData.id) {
      markFamilyAsManuallyUpdated(familyGroupData.id);
    }
    console.log('Family members updated:', updatedMembers);
  };
  
  // 2025-01-28: NEW - Function to mark family as manually updated
  const markFamilyAsManuallyUpdated = async (familyId: number) => {
    try {
      // Call backend to mark family as manually updated
      await familyService.markFamilyAsManuallyUpdated(familyId);
      console.log('Family marked as manually updated');
    } catch (error) {
      console.error('Failed to mark family as manually updated:', error);
    }
  };

  // 2025-01-29: NEW - Function to delete family group and clear saved relationships
  const handleDeleteFamily = async () => {
    if (!familyGroupData?.id) {
      console.error('No family group ID available for deletion');
      return;
    }

    // Confirm deletion with user
    if (!window.confirm('Are you sure you want to delete this family group? This will remove all saved family relationships but keep individual members and their data intact. The family tree will be regenerated automatically.')) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('Deleting family group:', familyGroupData.id);
      
      // Call backend to delete the family group
      await familyService.deleteFamilyGroup(familyGroupData.id);
      
      console.log('Family group deleted successfully');
      
      // Clear local state
      setFamilyMembers([]);
      setFamilyRelationships([]);
      setFamilyGroupExists(false);
      setFamilyGroupData(null);
      
      // Show success message
      setError(null);
      
      // Automatically regenerate family tree
      console.log('Regenerating family tree with corrected logic...');
      await fetchFamilyMembers();
    } catch (error) {
      console.error('Failed to delete family group:', error);
      setError(`Failed to delete family group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2025-01-28: ENHANCED: Toggle editing mode
  const toggleEditingMode = () => {
    setIsEditingMode(!isEditingMode);
  };

  // Handle window close
  const handleClose = () => {
    setFamilyMembers([]);
    setFamilyRelationships([]);
    setError(null);
    onClose();
  };

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
            <h2>Family Tree - {address}, {island}</h2>
            <div className="family-tree-subtitle">
              {familyMembers.length} family members
            </div>
          </div>
          
          <div className="family-tree-controls">
            {/* 2025-01-29: NEW - Added Delete Family button to clear saved relationships */}
            {familyGroupExists && (
              <button
                onClick={handleDeleteFamily}
                className="delete-family-btn"
                title="Delete saved family relationships (keeps individual members)"
              >
                🗑️ Delete Family
              </button>
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
              {/* 2025-01-28: ENHANCED: Show RelationshipManager when in editing mode */}
              {isEditingMode ? (
                <RelationshipManager
                  familyMembers={familyMembers}
                  relationships={familyRelationships}
                  onRelationshipChange={handleRelationshipChange}
                  onFamilyMembersChange={handleFamilyMembersChange}
                  isEditable={true}
                />
              ) : (
                /* Show ClassicFamilyTree when not editing */
                <ClassicFamilyTree
                  familyMembers={familyMembers}
                  relationships={familyRelationships}
                />
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
