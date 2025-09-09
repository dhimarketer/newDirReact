// 2024-12-28: Family role definitions for enhanced family editing

import { FamilyRoleDefinition, SpecificFamilyRole } from '../types/enhancedFamily';

export const FAMILY_ROLE_DEFINITIONS: Record<SpecificFamilyRole, FamilyRoleDefinition> = {
  // Parents (Generation 1)
  father: {
    role: 'father',
    label: 'Father',
    generation: 1,
    gender_preference: 'M',
    description: 'Male parent',
    typical_age_range: { min: 18, max: 80 },
    implies_relationships: [
      { to_role: 'son', relationship_type: 'parent' },
      { to_role: 'daughter', relationship_type: 'parent' },
      { to_role: 'mother', relationship_type: 'spouse' }
    ]
  },
  
  mother: {
    role: 'mother',
    label: 'Mother',
    generation: 1,
    gender_preference: 'F',
    description: 'Female parent',
    typical_age_range: { min: 16, max: 80 },
    implies_relationships: [
      { to_role: 'son', relationship_type: 'parent' },
      { to_role: 'daughter', relationship_type: 'parent' },
      { to_role: 'father', relationship_type: 'spouse' }
    ]
  },

  // Children (Generation 2)
  son: {
    role: 'son',
    label: 'Son',
    generation: 2,
    gender_preference: 'M',
    description: 'Male child',
    typical_age_range: { min: 0, max: 60 },
    implies_relationships: [
      { to_role: 'father', relationship_type: 'child' },
      { to_role: 'mother', relationship_type: 'child' },
      { to_role: 'sister', relationship_type: 'sibling' },
      { to_role: 'brother', relationship_type: 'sibling' }
    ]
  },

  daughter: {
    role: 'daughter',
    label: 'Daughter',
    generation: 2,
    gender_preference: 'F',
    description: 'Female child',
    typical_age_range: { min: 0, max: 60 },
    implies_relationships: [
      { to_role: 'father', relationship_type: 'child' },
      { to_role: 'mother', relationship_type: 'child' },
      { to_role: 'sister', relationship_type: 'sibling' },
      { to_role: 'brother', relationship_type: 'sibling' }
    ]
  },

  // Siblings (Generation 2)
  brother: {
    role: 'brother',
    label: 'Brother',
    generation: 2,
    gender_preference: 'M',
    description: 'Male sibling',
    typical_age_range: { min: 0, max: 60 },
    implies_relationships: [
      { to_role: 'father', relationship_type: 'child' },
      { to_role: 'mother', relationship_type: 'child' },
      { to_role: 'sister', relationship_type: 'sibling' }
    ]
  },

  sister: {
    role: 'sister',
    label: 'Sister',
    generation: 2,
    gender_preference: 'F',
    description: 'Female sibling',
    typical_age_range: { min: 0, max: 60 },
    implies_relationships: [
      { to_role: 'father', relationship_type: 'child' },
      { to_role: 'mother', relationship_type: 'child' },
      { to_role: 'brother', relationship_type: 'sibling' }
    ]
  },

  // Grandparents (Generation 0)
  grandfather: {
    role: 'grandfather',
    label: 'Grandfather',
    generation: 0,
    gender_preference: 'M',
    description: 'Male grandparent',
    typical_age_range: { min: 40, max: 100 },
    implies_relationships: [
      { to_role: 'father', relationship_type: 'parent' },
      { to_role: 'mother', relationship_type: 'parent' },
      { to_role: 'grandson', relationship_type: 'grandparent' },
      { to_role: 'granddaughter', relationship_type: 'grandparent' }
    ]
  },

  grandmother: {
    role: 'grandmother',
    label: 'Grandmother',
    generation: 0,
    gender_preference: 'F',
    description: 'Female grandparent',
    typical_age_range: { min: 35, max: 100 },
    implies_relationships: [
      { to_role: 'father', relationship_type: 'parent' },
      { to_role: 'mother', relationship_type: 'parent' },
      { to_role: 'grandson', relationship_type: 'grandparent' },
      { to_role: 'granddaughter', relationship_type: 'grandparent' }
    ]
  },

  // Grandchildren (Generation 3)
  grandson: {
    role: 'grandson',
    label: 'Grandson',
    generation: 3,
    gender_preference: 'M',
    description: 'Male grandchild',
    typical_age_range: { min: 0, max: 40 },
    implies_relationships: [
      { to_role: 'grandfather', relationship_type: 'grandchild' },
      { to_role: 'grandmother', relationship_type: 'grandchild' },
      { to_role: 'father', relationship_type: 'child' },
      { to_role: 'mother', relationship_type: 'child' }
    ]
  },

  granddaughter: {
    role: 'granddaughter',
    label: 'Granddaughter',
    generation: 3,
    gender_preference: 'F',
    description: 'Female grandchild',
    typical_age_range: { min: 0, max: 40 },
    implies_relationships: [
      { to_role: 'grandfather', relationship_type: 'grandchild' },
      { to_role: 'grandmother', relationship_type: 'grandchild' },
      { to_role: 'father', relationship_type: 'child' },
      { to_role: 'mother', relationship_type: 'child' }
    ]
  },

  // Extended Family
  uncle: {
    role: 'uncle',
    label: 'Uncle',
    generation: 1,
    gender_preference: 'M',
    description: 'Brother of parent',
    typical_age_range: { min: 18, max: 80 },
    implies_relationships: [
      { to_role: 'nephew', relationship_type: 'aunt_uncle' },
      { to_role: 'niece', relationship_type: 'aunt_uncle' }
    ]
  },

  aunt: {
    role: 'aunt',
    label: 'Aunt',
    generation: 1,
    gender_preference: 'F',
    description: 'Sister of parent',
    typical_age_range: { min: 18, max: 80 },
    implies_relationships: [
      { to_role: 'nephew', relationship_type: 'aunt_uncle' },
      { to_role: 'niece', relationship_type: 'aunt_uncle' }
    ]
  },

  nephew: {
    role: 'nephew',
    label: 'Nephew',
    generation: 2,
    gender_preference: 'M',
    description: 'Son of sibling',
    typical_age_range: { min: 0, max: 60 },
    implies_relationships: [
      { to_role: 'uncle', relationship_type: 'niece_nephew' },
      { to_role: 'aunt', relationship_type: 'niece_nephew' }
    ]
  },

  niece: {
    role: 'niece',
    label: 'Niece',
    generation: 2,
    gender_preference: 'F',
    description: 'Daughter of sibling',
    typical_age_range: { min: 0, max: 60 },
    implies_relationships: [
      { to_role: 'uncle', relationship_type: 'niece_nephew' },
      { to_role: 'aunt', relationship_type: 'niece_nephew' }
    ]
  },

  // In-Laws
  son_in_law: {
    role: 'son_in_law',
    label: 'Son-in-law',
    generation: 2,
    gender_preference: 'M',
    description: 'Husband of daughter',
    typical_age_range: { min: 18, max: 80 },
    implies_relationships: [
      { to_role: 'daughter', relationship_type: 'spouse' }
    ]
  },

  daughter_in_law: {
    role: 'daughter_in_law',
    label: 'Daughter-in-law',
    generation: 2,
    gender_preference: 'F',
    description: 'Wife of son',
    typical_age_range: { min: 18, max: 80 },
    implies_relationships: [
      { to_role: 'son', relationship_type: 'spouse' }
    ]
  },

  father_in_law: {
    role: 'father_in_law',
    label: 'Father-in-law',
    generation: 1,
    gender_preference: 'M',
    description: 'Father of spouse',
    typical_age_range: { min: 40, max: 90 },
    implies_relationships: []
  },

  mother_in_law: {
    role: 'mother_in_law',
    label: 'Mother-in-law',
    generation: 1,
    gender_preference: 'F',
    description: 'Mother of spouse',
    typical_age_range: { min: 35, max: 90 },
    implies_relationships: []
  },

  // Other
  cousin: {
    role: 'cousin',
    label: 'Cousin',
    generation: 2,
    description: 'Child of aunt or uncle',
    typical_age_range: { min: 0, max: 80 },
    implies_relationships: []
  },

  spouse: {
    role: 'spouse',
    label: 'Spouse',
    generation: 1,
    description: 'Married partner',
    typical_age_range: { min: 18, max: 100 },
    implies_relationships: []
  },

  other: {
    role: 'other',
    label: 'Other',
    generation: 2,
    description: 'Other family member or relation',
    typical_age_range: { min: 0, max: 100 },
    implies_relationships: []
  }
};

// Helper functions for role management
export const getRolesByGeneration = (generation: number) => {
  return Object.values(FAMILY_ROLE_DEFINITIONS).filter(
    role => role.generation === generation
  );
};

export const getRolesByGender = (gender: 'M' | 'F') => {
  return Object.values(FAMILY_ROLE_DEFINITIONS).filter(
    role => role.gender_preference === gender || !role.gender_preference
  );
};

export const getRoleSuggestions = (age?: number, gender?: 'M' | 'F') => {
  return Object.values(FAMILY_ROLE_DEFINITIONS).filter(role => {
    let matches = true;
    
    if (gender && role.gender_preference && role.gender_preference !== gender) {
      matches = false;
    }
    
    if (age && role.typical_age_range) {
      if (age < role.typical_age_range.min || age > role.typical_age_range.max) {
        matches = false;
      }
    }
    
    return matches;
  }).sort((a, b) => {
    // Prioritize core family roles
    const coreRoles = ['father', 'mother', 'son', 'daughter', 'brother', 'sister'];
    const aIsCore = coreRoles.includes(a.role);
    const bIsCore = coreRoles.includes(b.role);
    
    if (aIsCore && !bIsCore) return -1;
    if (!aIsCore && bIsCore) return 1;
    return a.label.localeCompare(b.label);
  });
};
