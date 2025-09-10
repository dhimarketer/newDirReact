// 2024-12-28: Phase 4 - Enhanced relationship selector with rich relationship types and metadata

import React, { useState } from 'react';
import { FamilyRelationship } from '../../types/family';

interface EnhancedRelationshipSelectorProps {
  relationship: Partial<FamilyRelationship>;
  onUpdate: (relationship: Partial<FamilyRelationship>) => void;
  person1Name?: string;
  person2Name?: string;
  disabled?: boolean;
}

const RELATIONSHIP_CATEGORIES = {
  'Basic Relationships': [
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'grandparent', label: 'Grandparent' },
    { value: 'grandchild', label: 'Grandchild' },
    { value: 'aunt_uncle', label: 'Aunt/Uncle' },
    { value: 'niece_nephew', label: 'Niece/Nephew' },
    { value: 'cousin', label: 'Cousin' },
  ],
  'Extended Family': [
    { value: 'step_parent', label: 'Step-Parent' },
    { value: 'step_child', label: 'Step-Child' },
    { value: 'step_sibling', label: 'Step-Sibling' },
    { value: 'half_sibling', label: 'Half-Sibling' },
  ],
  'In-Law Relationships': [
    { value: 'father_in_law', label: 'Father-in-Law' },
    { value: 'mother_in_law', label: 'Mother-in-Law' },
    { value: 'son_in_law', label: 'Son-in-Law' },
    { value: 'daughter_in_law', label: 'Daughter-in-Law' },
    { value: 'brother_in_law', label: 'Brother-in-Law' },
    { value: 'sister_in_law', label: 'Sister-in-Law' },
  ],
  'Legal & Formal': [
    { value: 'adopted_parent', label: 'Adopted Parent' },
    { value: 'adopted_child', label: 'Adopted Child' },
    { value: 'legal_guardian', label: 'Legal Guardian' },
    { value: 'ward', label: 'Ward' },
    { value: 'foster_parent', label: 'Foster Parent' },
    { value: 'foster_child', label: 'Foster Child' },
  ],
  'Religious & Ceremonial': [
    { value: 'godparent', label: 'Godparent' },
    { value: 'godchild', label: 'Godchild' },
    { value: 'sponsor', label: 'Sponsor' },
  ],
  'Other': [
    { value: 'other', label: 'Other' },
  ],
};

const RELATIONSHIP_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'text-green-600' },
  { value: 'inactive', label: 'Inactive', color: 'text-gray-600' },
  { value: 'ended', label: 'Ended', color: 'text-red-600' },
  { value: 'suspended', label: 'Suspended', color: 'text-yellow-600' },
];

export const EnhancedRelationshipSelector: React.FC<EnhancedRelationshipSelectorProps> = ({
  relationship = {},
  onUpdate,
  person1Name,
  person2Name,
  disabled = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleRelationshipTypeChange = (relationshipType: string) => {
    onUpdate({
      ...relationship,
      relationship_type: relationshipType as any,
    });
  };

  const handleMetadataChange = (field: string, value: any) => {
    onUpdate({
      ...relationship,
      [field]: value,
    });
  };

  const getRelationshipDisplay = () => {
    if (!relationship.relationship_type) return 'Select relationship';
    const category = Object.values(RELATIONSHIP_CATEGORIES).flat().find(
      rel => rel.value === relationship.relationship_type
    );
    return category?.label || relationship.relationship_type;
  };

  return (
    <div className="space-y-4">
      {/* Relationship Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Relationship Type
        </label>
        <div className="relative">
          <select
            value={relationship.relationship_type || ''}
            onChange={(e) => handleRelationshipTypeChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select relationship type</option>
            {Object.entries(RELATIONSHIP_CATEGORIES).map(([category, relationships]) => (
              <optgroup key={category} label={category}>
                {relationships.map((rel) => (
                  <option key={rel.value} value={rel.value}>
                    {rel.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Relationship Description */}
      {person1Name && person2Name && relationship.relationship_type && (
        <div className="p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-medium">{person1Name}</span> is{' '}
            <span className="font-medium">{getRelationshipDisplay().toLowerCase()}</span> of{' '}
            <span className="font-medium">{person2Name}</span>
          </p>
        </div>
      )}

      {/* Advanced Metadata Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      {/* Advanced Metadata */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Relationship Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RELATIONSHIP_STATUS_OPTIONS.map((status) => (
                <label key={status.value} className="flex items-center">
                  <input
                    type="radio"
                    name="relationship_status"
                    value={status.value}
                    checked={relationship.relationship_status === status.value}
                    onChange={(e) => handleMetadataChange('relationship_status', e.target.value)}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className={`text-sm ${status.color}`}>{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={relationship.start_date || ''}
                onChange={(e) => handleMetadataChange('start_date', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={relationship.end_date || ''}
                onChange={(e) => handleMetadataChange('end_date', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Relationship Properties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={relationship.is_biological ?? true}
                  onChange={(e) => handleMetadataChange('is_biological', e.target.checked)}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Biological relationship</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={relationship.is_legal ?? false}
                  onChange={(e) => handleMetadataChange('is_legal', e.target.checked)}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Legally recognized</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confidence Level
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={relationship.confidence_level ?? 100}
                  onChange={(e) => handleMetadataChange('confidence_level', parseInt(e.target.value))}
                  disabled={disabled}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {relationship.confidence_level ?? 100}%
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={relationship.notes || ''}
              onChange={(e) => handleMetadataChange('notes', e.target.value)}
              disabled={disabled}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about this relationship..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRelationshipSelector;
