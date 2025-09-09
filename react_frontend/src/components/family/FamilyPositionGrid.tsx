// 2024-12-28: Visual family position grid for intuitive family structure editing

import React, { useState } from 'react';
import { PhoneBookEntry } from '../../types/directory';
import { SpecificFamilyRole, EnhancedFamilyMember, GenerationLevel } from '../../types/enhancedFamily';
import FamilyRoleSelector from './FamilyRoleSelector';

interface FamilyPositionGridProps {
  members: EnhancedFamilyMember[];
  availablePeople: PhoneBookEntry[];
  onMemberUpdate: (personId: number, role: SpecificFamilyRole) => void;
  onMemberAdd: (person: PhoneBookEntry, role: SpecificFamilyRole) => void;
  onMemberRemove: (personId: number) => void;
  onAutoAssign?: () => void;
  className?: string;
}

interface PositionSlot {
  role: SpecificFamilyRole;
  label: string;
  generation: GenerationLevel;
  position: { row: number; col: number; span?: number };
  member?: EnhancedFamilyMember;
  isEmpty: boolean;
}

const FamilyPositionGrid: React.FC<FamilyPositionGridProps> = ({
  members,
  availablePeople,
  onMemberUpdate,
  onMemberAdd,
  onMemberRemove,
  onAutoAssign,
  className = ''
}) => {
  const [selectedPosition, setSelectedPosition] = useState<PositionSlot | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PhoneBookEntry | null>(null);

  // 2024-12-28: Removed familyStructure - now using compact role boxes instead

  // 2024-12-28: Removed positionsWithMembers - now using compact role boxes instead

  // 2024-12-28: Removed handlePositionClick - now using direct drag-and-drop to role boxes

  // Handle role selection
  const handleRoleSelect = (role: SpecificFamilyRole) => {
    if (selectedPerson && selectedPosition) {
      if (selectedPosition.member) {
        // Update existing member
        onMemberUpdate(selectedPosition.member.person.pid, role);
      } else {
        // Add new member
        onMemberAdd(selectedPerson, role);
      }
    }
    setShowRoleSelector(false);
    setSelectedPosition(null);
    setSelectedPerson(null);
  };

  // Handle role selector cancel
  const handleRoleSelectorCancel = () => {
    setShowRoleSelector(false);
    setSelectedPosition(null);
    setSelectedPerson(null);
  };

  // Handle member removal
  const handleRemoveMember = (member: EnhancedFamilyMember) => {
    onMemberRemove(member.person.pid);
  };

  // Get person display name with age
  const getPersonDisplayName = (person: PhoneBookEntry) => {
    let name = person.name || 'Unknown';
    if (person.DOB) {
      try {
        const age = new Date().getFullYear() - new Date(person.DOB).getFullYear();
        name += ` (${age})`;
      } catch {
        // Invalid date, skip age
      }
    }
    return name;
  };

  // Get all people (both assigned and unassigned) for dragging
  const getAllPeople = () => {
    const assignedPeople = members.map(m => m.person);
    const unassignedPeople = availablePeople;
    return [...assignedPeople, ...unassignedPeople];
  };

  // Get available people for selection (not already assigned)
  const getAvailablePeople = () => {
    const assignedPeople = members.map(m => m.person.pid);
    return availablePeople.filter(person => !assignedPeople.includes(person.pid));
  };

  if (showRoleSelector) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {selectedPosition?.member ? (
            // Edit existing member
            <FamilyRoleSelector
              person={selectedPosition.member.person}
              currentRole={selectedPosition.member.specific_role}
              onRoleSelect={handleRoleSelect}
              onCancel={handleRoleSelectorCancel}
              existingMembers={members}
            />
          ) : (
            // Add new member - show person selection first
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Select Person for {selectedPosition?.label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {getAvailablePeople().map(person => (
                  <button
                    key={person.pid}
                    onClick={() => setSelectedPerson(person)}
                    className={`p-3 border rounded-lg text-left hover:shadow-md transition-all ${
                      selectedPerson?.pid === person.pid
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{getPersonDisplayName(person)}</div>
                    <div className="text-sm text-gray-500">
                      {person.gender === 'M' ? 'Male' : person.gender === 'F' ? 'Female' : 'Unknown gender'}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleRoleSelectorCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedPerson && handleRoleSelect(selectedPosition!.role)}
                  disabled={!selectedPerson}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`family-position-grid ${className}`}>
      {/* Side-by-side Layout - More balanced widths */}
      <div className="flex gap-2 h-full">
        {/* Left Side - Family Members Table */}
        <div className="w-1/2">
          <h4 className="text-xs font-medium text-black mb-0.5">Members ({getAllPeople().length})</h4>
          <div className="overflow-x-auto h-36 overflow-y-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-1 py-0.5 text-left text-xs font-semibold text-gray-700 w-3/5">Name</th>
                  <th className="border border-gray-300 px-1 py-0.5 text-left text-xs font-semibold text-gray-700 w-1/5">Age</th>
                  <th className="border border-gray-300 px-1 py-0.5 text-center text-xs font-semibold text-gray-700 w-1/5">Status</th>
                </tr>
              </thead>
              <tbody>
                {getAllPeople().map(person => {
                  const isAssigned = members.some(m => m.person.pid === person.pid);
                  const assignedRole = members.find(m => m.person.pid === person.pid)?.specific_role;
                  const age = person.DOB ? new Date().getFullYear() - new Date(person.DOB).getFullYear() : 'Unknown';
                  
                  return (
                    <tr 
                      key={person.pid}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify(person));
                        e.dataTransfer.effectAllowed = 'move';
                        console.log(`Starting drag of ${person.name}`);
                        e.currentTarget.classList.add('opacity-50', 'bg-blue-100');
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('opacity-50', 'bg-blue-100');
                      }}
                      className={`cursor-move hover:bg-gray-50 transition-all duration-200 ${
                        isAssigned ? 'bg-gray-100' : 'bg-white'
                      }`}
                      title={isAssigned ? `Currently assigned as ${assignedRole} - Drag to reassign` : 'Drag to assign role'}
                    >
                      <td className="border border-gray-300 px-1 py-0.5 text-xs font-medium text-black truncate">
                        {getPersonDisplayName(person)}
                      </td>
                      <td className="border border-gray-300 px-1 py-0.5 text-xs text-gray-600">
                        {age}
                      </td>
                      <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {isAssigned ? (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="Assigned"></span>
                        ) : (
                          <span className="inline-block w-2 h-2 bg-gray-300 rounded-full" title="Unassigned"></span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side - Family Role Assignment Table */}
        <div className="w-1/2">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="text-xs font-semibold text-gray-700">Roles - Drag to assign</h3>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setSelectedPosition({ role: 'other', label: 'Other', generation: 2, position: { row: 0, col: 0 }, isEmpty: true });
                  setShowRoleSelector(true);
                }}
                className="px-1 py-0.5 bg-black text-white text-xs hover:bg-gray-800"
              >
                Add
              </button>
              {onAutoAssign && (
                <button
                  onClick={onAutoAssign}
                  className="px-1 py-0.5 bg-blue-500 text-white text-xs hover:bg-blue-600"
                >
                  Auto
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto h-36 overflow-y-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-1 py-0.5 text-left text-xs font-semibold text-gray-700 w-1/3">Role</th>
                <th className="border border-gray-300 px-1 py-0.5 text-left text-xs font-semibold text-gray-700 w-1/2">Person</th>
                <th className="border border-gray-300 px-1 py-0.5 text-left text-xs font-semibold text-gray-700 w-1/6">Age</th>
              </tr>
            </thead>
            <tbody>
              {/* Create rows for each role type with multiple members */}
              {['father', 'mother', 'son', 'daughter', 'son_in_law', 'daughter_in_law'].map(role => {
                const roleMembers = members.filter(m => m.specific_role === role);
                const roleLabel = role === 'son_in_law' ? 'Son-in-law' : 
                                 role === 'daughter_in_law' ? 'Daughter-in-law' :
                                 role.charAt(0).toUpperCase() + role.slice(1);
                
                // Show empty row if no members assigned
                if (roleMembers.length === 0) {
                  return (
                    <tr key={role} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-1 py-0.5 text-xs font-medium text-gray-700 truncate">
                        {roleLabel}
                      </td>
                      <td 
                        className="border border-gray-300 px-1 py-0.5 text-xs transition-colors duration-200 hover:bg-blue-50"
                        onDrop={(e) => {
                          e.preventDefault();
                          const personData = e.dataTransfer.getData('text/plain');
                          if (personData) {
                            try {
                              const person = JSON.parse(personData);
                              console.log(`Dropping ${person.name} onto role: ${role}`);
                              
                              const existingMember = members.find(m => m.person.pid === person.pid);
                              if (existingMember) {
                                onMemberUpdate(person.pid, role as SpecificFamilyRole);
                              } else {
                                onMemberAdd(person, role as SpecificFamilyRole);
                              }
                            } catch (error) {
                              console.error('Error parsing dropped person data:', error);
                            }
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('bg-blue-100', 'border-blue-400');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('bg-blue-100', 'border-blue-400');
                        }}
                      >
                        <div className="text-gray-500 italic cursor-pointer hover:text-blue-600 text-center py-0.5 border border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-xs truncate">
                          Drop
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-0.5 text-xs text-gray-600 text-center">-</td>
                    </tr>
                  );
                }
                
                // Show rows for each assigned member
                return roleMembers.map((member, index) => (
                  <tr key={`${role}-${member.id}`} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-1 py-0.5 text-xs font-medium text-gray-700 truncate">
                      {role === 'son' || role === 'daughter' ? `${roleLabel} ${index + 1}` : roleLabel}
                    </td>
                    <td 
                      className="border border-gray-300 px-1 py-0.5 text-xs transition-colors duration-200 hover:bg-green-50"
                      onDrop={(e) => {
                        e.preventDefault();
                        const personData = e.dataTransfer.getData('text/plain');
                        if (personData) {
                          try {
                            const person = JSON.parse(personData);
                            console.log(`Dropping ${person.name} onto role: ${role}`);
                            
                            const existingMember = members.find(m => m.person.pid === person.pid);
                            if (existingMember) {
                              onMemberUpdate(person.pid, role as SpecificFamilyRole);
                            } else {
                              onMemberAdd(person, role as SpecificFamilyRole);
                            }
                          } catch (error) {
                            console.error('Error parsing dropped person data:', error);
                          }
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-blue-100', 'border-blue-400');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-blue-100', 'border-blue-400');
                      }}
                    >
                      <div 
                        className="font-medium text-black p-0.5 bg-green-50 border border-green-200 rounded text-xs truncate cursor-pointer hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMember(member);
                        }}
                        title="Click to remove assignment"
                      >
                        {member.person.name}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-xs text-gray-600 text-center">
                      {member.person.DOB ? 
                        new Date().getFullYear() - new Date(member.person.DOB).getFullYear() : 
                        'Unknown'
                      }
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyPositionGrid;
