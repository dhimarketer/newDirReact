// 2025-01-28: NEW - Dedicated family tree window component for better user experience
// 2025-01-28: Replaces embedded modal approach with focused, expandable window
// 2025-01-28: Implements responsive design and proper window sizing

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { STORAGE_KEYS } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import { familyService } from '../../services/familyService';
import ClassicFamilyTree from './ClassicFamilyTree';
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
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [windowPosition, setWindowPosition] = useState({ x: 50, y: 50 });
  
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  const isAdmin = user?.is_staff || user?.is_superuser || user?.user_type === 'admin';

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

  // Fetch family members from API
  const fetchFamilyMembers = async () => {
    // 2025-01-28: ADDED - Check if there's a valid token before making API call
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      console.log('FamilyTreeWindow: No auth token found, cannot fetch family data');
      setError('Please log in to view family information');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await familyService.getFamilyByAddress(address, island);
      
      // 2025-01-28: DEBUG - Log the actual response structure
      console.log('=== FAMILY TREE WINDOW DEBUG ===');
      console.log('DEBUG: API response:', response);
      console.log('DEBUG: Response success:', response.success);
      console.log('DEBUG: Response data:', response.data);
      console.log('DEBUG: Members array:', response.data?.members);
      console.log('DEBUG: Relationships array:', response.data?.relationships);
      console.log('=== END FAMILY TREE WINDOW DEBUG ===');
      
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
            DOB: member.entry?.DOB || member.entry_dob || member.dob || '',
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
            nid: member.entry?.nid || undefined
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
        setError('Failed to fetch family data');
        setFamilyGroupExists(false); // No family group found
        setFamilyGroupData(null);
      }
    } catch (err) {
      console.error('Error fetching family members:', err);
      setError('Error loading family data');
      setFamilyGroupExists(false); // No family group found
      setFamilyGroupData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle family group creation
  const handleCreateFamilyGroup = async () => {
    setIsCreatingFamily(true);
    setError(null);
    
    try {
      // 2025-01-28: Create family group for this address using the backend endpoint
      const response = await familyService.createOrUpdateFamilyByAddress(address, island);
      
      if (response.success && response.data) {
        // 2025-01-28: After creating family group, fetch family members again
        await fetchFamilyMembers();
      } else {
        setError(response.error || 'Failed to create family group');
      }
    } catch (err) {
      console.error('Error creating family group:', err);
      setError('Failed to create family group');
    } finally {
      setIsCreatingFamily(false);
    }
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

  return (
    <div className="family-tree-window">
      <div className="family-tree-header">
        <h3>Family Tree - {address}, {island}</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="family-tree-content">
        <div className="family-tree-header">
          <h4>Family Tree Visualization</h4>
          <p>Showing {familyMembers.length} family members with their relationships.</p>
        </div>
        
        {isLoading ? (
          <div className="loading-state">
            <p>Loading family tree...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Error: {error}</p>
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="empty-state">
            <p>No family members found for this address.</p>
            <button onClick={handleCreateFamilyGroup} disabled={isCreatingFamily}>
              {isCreatingFamily ? 'Creating...' : 'Create Family Group'}
            </button>
          </div>
        ) : (
          <div className="family-tree-container">
            <ClassicFamilyTree 
              familyMembers={familyMembers}
              relationships={familyRelationships}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyTreeWindow;
