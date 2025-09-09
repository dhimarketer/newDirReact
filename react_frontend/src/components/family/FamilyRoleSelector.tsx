// 2024-12-28: Enhanced family role selector component for intuitive role assignment

import React, { useState, useMemo } from 'react';
import { PhoneBookEntry } from '../../types/directory';
import { SpecificFamilyRole, EnhancedFamilyMember } from '../../types/enhancedFamily';
import { FAMILY_ROLE_DEFINITIONS, getRoleSuggestions } from '../../data/familyRoleDefinitions';

interface FamilyRoleSelectorProps {
  person: PhoneBookEntry;
  currentRole?: SpecificFamilyRole;
  onRoleSelect: (role: SpecificFamilyRole) => void;
  onCancel: () => void;
  existingMembers?: EnhancedFamilyMember[];
  className?: string;
}

const FamilyRoleSelector: React.FC<FamilyRoleSelectorProps> = ({
  person,
  currentRole,
  onRoleSelect,
  onCancel,
  existingMembers = [],
  className = ''
}) => {
  const [selectedRole, setSelectedRole] = useState<SpecificFamilyRole>(currentRole || 'other');
  const [showAllRoles, setShowAllRoles] = useState(false);

  // Calculate person's age for smart suggestions
  const personAge = useMemo(() => {
    if (!person.DOB) return undefined;
    try {
      const birthDate = new Date(person.DOB);
      const today = new Date();
      return today.getFullYear() - birthDate.getFullYear();
    } catch {
      return undefined;
    }
  }, [person.DOB]);

  // Get smart role suggestions based on age and gender
  const suggestedRoles = useMemo(() => {
    return getRoleSuggestions(personAge, person.gender as 'M' | 'F' | undefined);
  }, [personAge, person.gender]);

  // Get all available roles grouped by generation
  const rolesByGeneration = useMemo(() => {
    const groups: Record<number, typeof FAMILY_ROLE_DEFINITIONS[keyof typeof FAMILY_ROLE_DEFINITIONS][]> = {};
    
    Object.values(FAMILY_ROLE_DEFINITIONS).forEach(role => {
      if (!groups[role.generation]) {
        groups[role.generation] = [];
      }
      groups[role.generation].push(role);
    });

    return groups;
  }, []);

  // Check if a role is already taken
  const isRoleTaken = (role: SpecificFamilyRole) => {
    return existingMembers.some(member => 
      member.specific_role === role && member.person.pid !== person.pid
    );
  };

  // Get role validation message
  const getRoleValidation = (role: SpecificFamilyRole) => {
    const roleDef = FAMILY_ROLE_DEFINITIONS[role];
    const issues: string[] = [];

    // Check if role is taken (only for unique roles)
    const uniqueRoles = ['father', 'mother'];
    if (uniqueRoles.includes(role) && isRoleTaken(role)) {
      issues.push('This role is already assigned');
    }

    // Check age appropriateness
    if (personAge && roleDef.typical_age_range) {
      if (personAge < roleDef.typical_age_range.min) {
        issues.push(`Typical minimum age: ${roleDef.typical_age_range.min}`);
      }
      if (personAge > roleDef.typical_age_range.max) {
        issues.push(`Typical maximum age: ${roleDef.typical_age_range.max}`);
      }
    }

    // Check gender appropriateness
    if (person.gender && roleDef.gender_preference && person.gender !== roleDef.gender_preference) {
      issues.push(`Usually assigned to ${roleDef.gender_preference === 'M' ? 'males' : 'females'}`);
    }

    return issues;
  };

  const getRoleCardColor = (role: SpecificFamilyRole) => {
    const validation = getRoleValidation(role);
    const isSuggested = suggestedRoles.slice(0, 6).some(r => r.role === role);
    
    if (validation.length > 0) {
      return 'bg-gray-100 border-gray-400 text-black';
    }
    if (isSuggested) {
      return 'bg-gray-200 border-gray-500 text-black';
    }
    return 'bg-white border-gray-300 text-black';
  };

  const handleRoleSelect = (role: SpecificFamilyRole) => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    onRoleSelect(selectedRole);
  };

  const getPersonDisplayName = () => {
    let name = person.name || 'Unknown';
    if (personAge) {
      name += ` (${personAge})`;
    }
    return name;
  };

  return (
    <div className={`family-role-selector bg-white border border-gray-300 p-4 max-w-2xl mx-auto ${className}`}>
      {/* Simple Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-black mb-2">
          Assign Family Role
        </h3>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-black">
              {person.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="font-medium text-black">{getPersonDisplayName()}</p>
            <p className="text-sm text-gray-600">
              {person.gender === 'M' ? 'Male' : person.gender === 'F' ? 'Female' : 'Unknown gender'}
            </p>
          </div>
        </div>
      </div>

      {/* Smart Suggestions */}
      {suggestedRoles.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">
            🎯 Suggested Roles (based on age and gender)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {suggestedRoles.slice(0, 6).map((roleDef) => {
              const validation = getRoleValidation(roleDef.role);
              const isSelected = selectedRole === roleDef.role;
              
              return (
                <button
                  key={roleDef.role}
                  onClick={() => handleRoleSelect(roleDef.role)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : validation.length > 0
                      ? 'border-red-200 bg-red-50 hover:border-red-300'
                      : 'border-green-200 bg-green-50 hover:border-green-300'
                  }`}
                >
                  <div className="font-medium text-sm">{roleDef.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{roleDef.description}</div>
                  {validation.length > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      ⚠️ {validation[0]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All Roles by Generation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">All Family Roles</h4>
          <button
            onClick={() => setShowAllRoles(!showAllRoles)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAllRoles ? 'Show Less' : 'Show All'}
          </button>
        </div>

        {/* Generation Groups */}
        {Object.entries(rolesByGeneration)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .slice(0, showAllRoles ? undefined : 2)
          .map(([generation, roles]) => {
            const generationLabels = {
              '0': 'Grandparents',
              '1': 'Parents & In-Laws',
              '2': 'Children & Siblings',
              '3': 'Grandchildren'
            };
            
            return (
              <div key={generation} className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {generationLabels[generation as keyof typeof generationLabels] || `Generation ${generation}`}
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {roles.map((roleDef) => {
                    const validation = getRoleValidation(roleDef.role);
                    const isSelected = selectedRole === roleDef.role;
                    
                    return (
                      <button
                        key={roleDef.role}
                        onClick={() => handleRoleSelect(roleDef.role)}
                        className={`p-2 rounded border text-left text-sm transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : getRoleCardColor(roleDef.role) + ' hover:shadow-sm'
                        }`}
                      >
                        <div className="font-medium">{roleDef.label}</div>
                        {validation.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠️
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Selected Role Details */}
      {selectedRole && selectedRole !== 'other' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">
            Selected: {FAMILY_ROLE_DEFINITIONS[selectedRole].label}
          </h4>
          <p className="text-sm text-blue-800 mb-2">
            {FAMILY_ROLE_DEFINITIONS[selectedRole].description}
          </p>
          
          {/* Validation Messages */}
          {(() => {
            const validation = getRoleValidation(selectedRole);
            if (validation.length > 0) {
              return (
                <div className="text-sm text-orange-700 space-y-1">
                  {validation.map((issue, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          })()}
          
          {/* Implied Relationships */}
          {FAMILY_ROLE_DEFINITIONS[selectedRole].implies_relationships && 
           FAMILY_ROLE_DEFINITIONS[selectedRole].implies_relationships!.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-blue-700 font-medium mb-1">This will create relationships with:</p>
              <div className="flex flex-wrap gap-1">
                {FAMILY_ROLE_DEFINITIONS[selectedRole].implies_relationships!.map((rel, index) => (
                  <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {FAMILY_ROLE_DEFINITIONS[rel.to_role]?.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons - Simple */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-black hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-black text-white hover:bg-gray-800"
        >
          Assign Role
        </button>
      </div>
    </div>
  );
};

export default FamilyRoleSelector;
