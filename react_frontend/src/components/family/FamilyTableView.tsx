// 2025-01-29: NEW - Family table view component for users who prefer tabular data format
// 2025-01-29: Displays family members in a structured table with sortable columns
// 2025-01-29: Provides alternative to family tree visualization

import React, { useState, useMemo } from 'react';
import { FamilyMember, FamilyRelationship } from '../../types/family';
import { detectMemberRole, getRoleDisplayText, getRoleBadgeColor, DetectedRole } from '../../utils/roleDetection';

interface FamilyTableViewProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  address: string;
  island: string;
}

type SortField = 'name' | 'age' | 'contact' | 'profession' | 'role';
type SortDirection = 'asc' | 'desc';

const FamilyTableView: React.FC<FamilyTableViewProps> = ({ 
  familyMembers, 
  relationships = [],
  address, 
  island 
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // 2024-12-29: Process family data
  const familyData = {
    address,
    island,
    firstMember: familyMembers[0] ? {
      name: familyMembers[0].entry?.name,
      age: familyMembers[0].entry?.age,
      gender: familyMembers[0].entry?.gender,
      pid: familyMembers[0].entry?.pid
    } : null,
    firstRelationship: relationships[0] ? {
      person1: relationships[0].person1,
      person2: relationships[0].person2,
      type: relationships[0].relationship_type
    } : null
  };

  // Sort family members based on current sort settings
  const sortedMembers = useMemo(() => {
    return [...familyMembers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.entry.name?.toLowerCase() || '';
          bValue = b.entry.name?.toLowerCase() || '';
          break;
        case 'age':
          aValue = a.entry.age || 0;
          bValue = b.entry.age || 0;
          break;
        case 'contact':
          aValue = a.entry.contact?.toLowerCase() || '';
          bValue = b.entry.contact?.toLowerCase() || '';
          break;
        case 'profession':
          aValue = a.entry.profession?.toLowerCase() || '';
          bValue = b.entry.profession?.toLowerCase() || '';
          break;
        case 'role':
          aValue = detectMemberRole(a, familyMembers, relationships);
          bValue = detectMemberRole(b, familyMembers, relationships);
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [familyMembers, sortField, sortDirection]);

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort indicator for column headers
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Format age display
  const formatAge = (age?: number): string => {
    if (age === undefined || age === null) return 'N/A';
    return `${age} years`;
  };

  // 2024-12-29: Removed getMemberRole wrapper - using detectMemberRole directly

  if (familyMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-semibold mb-2">No Family Members Found</h3>
        <p className="text-sm text-center">
          No family members were found at this address.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with location info */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Family Members at Address
        </h2>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{address}</span>
          {island && (
            <>
              <span className="mx-2">•</span>
              <span className="font-medium">{island}</span>
            </>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {familyMembers.length} member{familyMembers.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="border-b border-gray-200">
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <span className="text-gray-400">{getSortIndicator('name')}</span>
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center space-x-1">
                  <span>Role</span>
                  <span className="text-gray-400">{getSortIndicator('role')}</span>
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('age')}
              >
                <div className="flex items-center space-x-1">
                  <span>Age</span>
                  <span className="text-gray-400">{getSortIndicator('age')}</span>
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('contact')}
              >
                <div className="flex items-center space-x-1">
                  <span>Contact</span>
                  <span className="text-gray-400">{getSortIndicator('contact')}</span>
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('profession')}
              >
                <div className="flex items-center space-x-1">
                  <span>Profession</span>
                  <span className="text-gray-400">{getSortIndicator('profession')}</span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Additional Info
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedMembers.map((member, index) => (
              <tr 
                key={`${member.entry.pid}-${index}`}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {member.entry.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {member.entry.name || 'N/A'}
                      </div>
                      {member.entry.nid && (
                        <div className="text-xs text-gray-500">
                          NID: {member.entry.nid}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {(() => {
                    const detectedRole = detectMemberRole(member, familyMembers, relationships);
                    return (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(detectedRole)}`}>
                        {getRoleDisplayText(detectedRole)}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {(() => {
                    const age = member.entry.age;
                    return formatAge(age);
                  })()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {member.entry.contact || 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {member.entry.profession || 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <div className="space-y-1">
                    {member.entry.gender && (
                      <div className="text-xs">
                        <span className="font-medium">Gender:</span> {member.entry.gender}
                      </div>
                    )}
                    {member.entry.party && (
                      <div className="text-xs">
                        <span className="font-medium">Party:</span> {member.entry.party}
                      </div>
                    )}
                    {member.entry.remark && (
                      <div className="text-xs">
                        <span className="font-medium">Notes:</span> {member.entry.remark}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with summary */}
      <div className="bg-gray-50 border-t border-gray-200 p-3">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {familyMembers.length} family member{familyMembers.length !== 1 ? 's' : ''}
          </span>
          <span>
            Sorted by {sortField} ({sortDirection === 'asc' ? 'ascending' : 'descending'})
          </span>
        </div>
      </div>
    </div>
  );
};

export default FamilyTableView;
