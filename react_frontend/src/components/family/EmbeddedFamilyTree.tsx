// 2025-01-29: NEW - Embedded family tree component for use in modals
// This component provides family tree functionality without portal rendering

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { familyService } from '../../services/familyService';
import ClassicFamilyTree from './ClassicFamilyTree';
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
  initialViewMode = 'tree'
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
  
  // State for multi-row layout toggle
  const [useMultiRowLayout, setUseMultiRowLayout] = useState(false);
  
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Check if user is admin
  const isAdmin = user?.is_staff || user?.is_superuser || user?.user_type === 'admin';

  // Load family data when component mounts
  useEffect(() => {
    if (address && island) {
      fetchFamilyMembers();
    }
  }, [address, island]);

  // Fetch family members for the given address
  const fetchFamilyMembers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await familyService.getFamilyByAddress(address, island);
      
      if (response.notFound) {
        console.log('Family not found for:', { address, island });
        setFamilyGroupExists(false);
        setFamilyMembers([]);
        setFamilyRelationships([]);
      } else if (response.success && response.data) {
        const members = response.data.members || [];
        const relationships = response.data.relationships || [];
        
        // Transform API data to match expected types
        const transformedMembers: FamilyMember[] = members.map((member: any, index: number) => ({
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
              {viewMode === 'tree' ? 'Family Tree' : 'Family Table'} - {address}, {island}
            </h3>
            <p className="text-sm text-gray-600">
              {familyMembers.length} family members • {viewMode === 'tree' ? 'Visual' : 'Tabular'} view
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
            
            {/* Multi-row layout toggle */}
            <button
              onClick={() => setUseMultiRowLayout(!useMultiRowLayout)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                useMultiRowLayout 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={useMultiRowLayout ? 'Switch to single-row layout' : 'Switch to multi-row layout'}
            >
              {useMultiRowLayout ? '📐 Single Row' : '📐 Multi Row'}
            </button>
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
            {/* Show either ClassicFamilyTree or FamilyTableView based on view mode */}
            {viewMode === 'tree' ? (
              <ClassicFamilyTree
                familyMembers={familyMembers}
                relationships={familyRelationships}
                useMultiRowLayout={useMultiRowLayout}
                svgRef={svgRef as React.RefObject<SVGSVGElement>}
              />
            ) : (
              <FamilyTableView
                familyMembers={familyMembers}
                address={address}
                island={island}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmbeddedFamilyTree;
