// 2025-01-27: Created FamilyTreeEditor component for manual family relationship editing and assignment
// 2025-01-28: Fixed data structure mismatch and improved relationship type mapping

import React, { useState, useEffect } from 'react';
import { PhoneBookEntry } from '../../types/directory';

interface FamilyTreeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  island: string;
  members: PhoneBookEntry[];
  onSave: (updatedFamily: any) => void;
}

interface Relationship {
  person1_id: number;
  person2_id: number;
  relationship_type: string;
  notes?: string;
}

interface FamilyMember {
  entry_id: number;
  role: string;
}

// 2025-01-28: Updated relationship types to match backend model exactly
const RELATIONSHIP_TYPES = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle' },
  { value: 'niece_nephew', label: 'Niece/Nephew' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'other', label: 'Other' },
];

const FamilyTreeEditor: React.FC<FamilyTreeEditorProps> = ({
  isOpen,
  onClose,
  address,
  island,
  members,
  onSave
}) => {
  const [selectedPerson, setSelectedPerson] = useState<PhoneBookEntry | null>(null);
  const [targetPerson, setTargetPerson] = useState<PhoneBookEntry | null>(null);
  const [relationshipType, setRelationshipType] = useState<string>('parent');
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 2025-01-27: Added dynamic family size detection for responsive layout
  const getFamilySizeClass = (memberCount: number): string => {
    if (memberCount <= 4) return 'small-family';
    if (memberCount <= 8) return 'medium-family';
    if (memberCount <= 12) return 'large-family';
    if (memberCount <= 20) return 'extra-large-family';
    if (memberCount <= 30) return 'ultra-large-family';
    if (memberCount <= 40) return 'extreme-family';
    return 'mega-family';
  };

  const familySizeClass = getFamilySizeClass(members.length);

  useEffect(() => {
    if (isOpen && members.length > 0) {
      // Initialize family members with basic roles
      const initialMembers = members.map(member => ({
        entry_id: member.pid, // 2025-01-28: Fixed to use correct pid field
        role: 'member'
      }));
      setFamilyMembers(initialMembers);
      setRelationships([]);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, members]);

  const handlePersonSelect = (person: PhoneBookEntry) => {
    if (!selectedPerson) {
      setSelectedPerson(person);
      setError(null);
    } else if (selectedPerson.pid !== person.pid) {
      setTargetPerson(person);
      setError(null);
    } else {
      setError('Please select two different people for the relationship');
    }
  };

  const handleAddRelationship = () => {
    if (!selectedPerson || !targetPerson) {
      setError('Please select both people for the relationship');
      return;
    }

    const person1Id = selectedPerson.pid;
    const person2Id = targetPerson.pid;

    if (person1Id === person2Id) {
      setError('Cannot create relationship with the same person');
      return;
    }

    // Check if relationship already exists
    const existingRelationship = relationships.find(rel => 
      (rel.person1_id === person1Id && rel.person2_id === person2Id) ||
      (rel.person1_id === person2Id && rel.person2_id === person1Id)
    );

    if (existingRelationship) {
      setError('Relationship already exists between these people');
      return;
    }

    const newRelationship: Relationship = {
      person1_id: person1Id,
      person2_id: person2Id,
      relationship_type: relationshipType,
      notes: ''
    };

    setRelationships([...relationships, newRelationship]);
    setSuccessMessage(`Added ${relationshipType} relationship between ${selectedPerson.name} and ${targetPerson.name}`);
    
    // Reset selection
    setSelectedPerson(null);
    setTargetPerson(null);
    setError(null);
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRemoveRelationship = (index: number) => {
    const removedRel = relationships[index];
    const person1 = members.find(m => m.pid === removedRel.person1_id);
    const person2 = members.find(m => m.pid === removedRel.person2_id);
    
    setRelationships(relationships.filter((_, i) => i !== index));
    setSuccessMessage(`Removed relationship between ${person1?.name} and ${person2?.name}`);
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveFamily = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 2025-01-28: Fixed data structure to match backend API expectations exactly
      const familyData = {
        address,
        island,
        members: familyMembers.map(member => ({
          entry_id: member.entry_id,
          role: member.role
        })),
        relationships: relationships.map(rel => ({
          person1_id: rel.person1_id,
          person2_id: rel.person2_id,
          relationship_type: rel.relationship_type,
          notes: rel.notes || ''
        }))
      };

      console.log('Sending family data to backend:', familyData);
      await onSave(familyData);
      
      setSuccessMessage('Family tree saved successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setError(`Failed to save family tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonDisplayName = (person: PhoneBookEntry) => {
    let name = person.name || 'Unknown';
    if (person.DOB) {
      try {
        const age = new Date().getFullYear() - new Date(person.DOB).getFullYear();
        name += ` (${age})`;
      } catch (e) {
        // Invalid date, skip age
      }
    }
    return name;
  };

  const isPersonSelected = (person: PhoneBookEntry) => {
    return selectedPerson && selectedPerson.pid === person.pid ||
           targetPerson && targetPerson.pid === person.pid;
  };

  const getSelectionStatus = (person: PhoneBookEntry) => {
    if (selectedPerson && selectedPerson.pid === person.pid) {
      return 'first-selected';
    }
    if (targetPerson && targetPerson.pid === person.pid) {
      return 'second-selected';
    }
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="family-tree-editor bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold truncate">Edit Family Tree</h2>
            <p className="text-blue-100 mt-1 text-sm sm:text-base truncate">{address}, {island}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20 flex-shrink-0 ml-2"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6">
          {/* Instructions */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">How to use:</h3>
            <ol className="text-blue-800 text-xs sm:text-sm space-y-1">
              <li>1. Click on the first person to select them (highlighted in blue)</li>
              <li>2. Click on the second person to select them (highlighted in green)</li>
              <li>3. Choose the relationship type from the dropdown</li>
              <li>4. Click "Add Relationship" to create the connection</li>
              <li>5. Repeat for all family relationships</li>
              <li>6. Click "Save Family Tree" when done</li>
            </ol>
            {/* 2025-01-27: Added family size indicator */}
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
              <strong>Layout Mode:</strong> {familySizeClass.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
              ({members.length} members) - Boxes and gaps automatically adjust for optimal fit
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              ✅ {successMessage}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              ❌ {error}
            </div>
          )}

          {/* Family Members Grid */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Family Members ({members.length})
            </h3>
            <div className={`family-members-grid ${familySizeClass}`}>
              {members.map((member) => (
                <div
                  key={member.pid}
                  onClick={() => handlePersonSelect(member)}
                  className={`
                    family-member-card ${familySizeClass}
                    ${getSelectionStatus(member)}
                    cursor-pointer transition-all duration-200 hover:shadow-md
                  `}
                >
                  <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {getPersonDisplayName(member)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : 'Unknown'}
                  </div>
                  {member.contact && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {member.contact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Relationship Controls */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Add Relationship</h3>
            
            {/* Selection Display */}
            <div className="mb-4 flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1 w-full lg:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Person
                </label>
                <div className={`p-2 border rounded min-h-[40px] flex items-center text-sm ${
                  selectedPerson ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {selectedPerson ? getPersonDisplayName(selectedPerson) : 'Click to select'}
                </div>
              </div>
              
              <div className="text-gray-400 hidden lg:block">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              
              <div className="flex-1 w-full lg:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Second Person
                </label>
                <div className={`p-2 border rounded min-h-[40px] flex items-center text-sm ${
                  targetPerson ? 'bg-green-50 border-green-300 text-green-900' : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {targetPerson ? getPersonDisplayName(targetPerson) : 'Click to select'}
                </div>
              </div>
            </div>

            {/* Relationship Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship Type
              </label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {RELATIONSHIP_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddRelationship}
              disabled={!selectedPerson || !targetPerson}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              Add Relationship
            </button>
          </div>

          {/* Current Relationships */}
          {relationships.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Relationships ({relationships.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {relationships.map((rel, index) => {
                  const person1 = members.find(m => m.pid === rel.person1_id);
                  const person2 = members.find(m => m.pid === rel.person2_id);
                  const relType = RELATIONSHIP_TYPES.find(t => t.value === rel.relationship_type);
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="font-medium truncate">{person1?.name || 'Unknown'}</span>
                        <span className="text-gray-500 flex-shrink-0">is</span>
                        <span className="font-medium flex-shrink-0">{relType?.label || 'Unknown'}</span>
                        <span className="text-gray-500 flex-shrink-0">of</span>
                        <span className="font-medium truncate">{person2?.name || 'Unknown'}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveRelationship(index)}
                        className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0 ml-2 p-1"
                        title="Remove relationship"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFamily}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Family Tree'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTreeEditor;
