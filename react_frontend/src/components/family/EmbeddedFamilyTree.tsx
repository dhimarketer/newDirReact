// 2025-01-29: NEW - Embedded family tree component for use in modals
// This component provides family tree functionality without portal rendering

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { familyService } from '../../services/familyService';
import ClassicFamilyTree from './ClassicFamilyTree';
import CleanReactFlowFamilyTree from './CleanReactFlowFamilyTree';
import FamilyTableView from './FamilyTableView';
import FamilyViewToggle, { ViewMode } from './FamilyViewToggle';
import { PhoneBookEntry } from '../../types/directory';

interface EmbeddedFamilyTreeProps {
  address: string;
  island: string;
  initialViewMode?: ViewMode;
}

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

const EmbeddedFamilyTree: React.FC<EmbeddedFamilyTreeProps> = ({ 
  address, 
  island,
  initialViewMode = 'svg-tree'
}) => {
  const { user, isAuthenticated } = useAuthStore();
  
  // State for family tree data
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyRelationships, setFamilyRelationships] = useState<FamilyRelationship[]>([]);
  const [familyGroupExists, setFamilyGroupExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for view mode toggle
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedPreference = localStorage.getItem('family-view-preference') as ViewMode;
    return savedPreference || initialViewMode;
  });
  
  
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Check if user is admin
  const isAdmin = user?.is_staff || user?.is_superuser || user?.user_type === 'admin';

  // Load family data when component mounts
  useEffect(() => {
    if (address && island) {
      fetchFamilyMembers();
    }
  }, [address, island]);

  // 2024-12-29: UNIFIED - Use same data fetching method as FamilyTreeWindow for consistency
  const fetchFamilyMembers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 2024-12-29: UNIFIED - Use getAllFamiliesByAddress like FamilyTreeWindow
      const allFamiliesResponse = await familyService.getAllFamiliesByAddress(address, island);
      
      if (allFamiliesResponse.success && allFamiliesResponse.data && allFamiliesResponse.data.length > 0) {
        // 2024-12-29: UNIFIED - Use first family data (same as FamilyTreeWindow)
        const family = allFamiliesResponse.data[0];
        const members = family.members || [];
        const relationships = family.all_relationships || [];
        
        // 2024-12-29: UNIFIED - Use same transformation logic as FamilyTreeWindow
        const transformedMembers: FamilyMember[] = members.map((member: any, index: number) => ({
          entry: {
            pid: member.entry || member.entry_id || member.id || index + 1,
            name: member.entry_name || member.entry?.name || member.name || '',
            contact: member.entry_contact || member.entry?.contact || member.contact || '',
            address: member.entry?.address || member.entry_address || member.address || '',
            island: member.entry?.island || member.entry_island || member.island || '',
            atoll: member.entry?.atoll || '',
            street: member.entry?.street || '',
            ward: member.entry?.ward || '',
            party: member.entry?.party || '',
            DOB: member.entry_dob || member.entry?.DOB || member.dob || '',
            status: member.entry?.status || '',
            remark: member.entry?.remark || '',
            email: member.entry?.email || '',
            gender: member.entry_gender || member.entry?.gender || '',
            extra: member.entry?.extra || '',
            profession: member.entry_profession || member.entry?.profession || '',
            pep_status: member.entry?.pep_status || '',
            change_status: member.entry?.change_status || 'Active',
            requested_by: member.entry?.requested_by || '',
            batch: member.entry?.batch || '',
            image_status: member.entry?.image_status || '',
            family_group_id: member.entry?.family_group_id || undefined,
            nid: member.entry_nid || member.entry?.nid || undefined,
            age: member.entry_age || member.entry?.age || undefined
          },
          role: member.role_in_family || member.role || 'other',
          relationship: member.relationship || ''
        }));
        
        const transformedRelationships: FamilyRelationship[] = relationships.map((rel: any) => ({
          id: rel.id,
          person1: rel.person1?.pid || rel.person1_id || rel.person1,
          person2: rel.person2?.pid || rel.person2_id || rel.person2,
          relationship_type: rel.relationship_type || 'other',
          notes: rel.notes,
          is_active: rel.is_active !== false
        }));
        
        setFamilyMembers(transformedMembers);
        setFamilyRelationships(transformedRelationships);
        setFamilyGroupExists(true);
      } else {
        console.log('No families found for:', { address, island });
        setFamilyGroupExists(false);
        setFamilyMembers([]);
        setFamilyRelationships([]);
      }
    } catch (error) {
      console.error('Failed to fetch family members:', error);
      setError('Failed to load family data. Please try again.');
      setFamilyGroupExists(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view mode changes
  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    localStorage.setItem('family-view-preference', newViewMode);
  };

  // Don't render if no address provided
  if (!address) {
    return null;
  }

  return (
    <div className="embedded-family-tree">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {viewMode === 'table' ? 'Family Table' : viewMode === 'svg-tree' ? 'Family Tree (SVG)' : 'Family Tree (ReactFlow)'} - {address}, {island}
            </h3>
            <p className="text-sm text-gray-600">
              {familyMembers.length} family members
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            {!isLoading && familyMembers.length > 0 && (
              <FamilyViewToggle
                currentView={viewMode}
                onViewChange={handleViewModeChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading family data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Error loading family</h3>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchFamilyMembers}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No family members found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No family members found for this address and island.
            </p>
          </div>
        ) : (
          <>
            {/* Show family tree based on view mode */}
            {viewMode === 'table' ? (
              <FamilyTableView
                familyMembers={familyMembers}
                relationships={familyRelationships}
                address={address}
                island={island}
              />
            ) : viewMode === 'svg-tree' ? (
              <ClassicFamilyTree
                familyMembers={familyMembers}
                relationships={familyRelationships}
                svgRef={svgRef as React.RefObject<SVGSVGElement>}
              />
            ) : (
              <CleanReactFlowFamilyTree
                familyMembers={familyMembers}
                relationships={familyRelationships}
                hasMultipleFamilies={false}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmbeddedFamilyTree;
