// 2024-12-28: Enhanced family types for improved role-based editing

import { PhoneBookEntry } from './directory';

export type SpecificFamilyRole = 
  | 'father' 
  | 'mother' 
  | 'son' 
  | 'daughter' 
  | 'grandfather' 
  | 'grandmother'
  | 'grandson' 
  | 'granddaughter' 
  | 'brother' 
  | 'sister' 
  | 'uncle' 
  | 'aunt'
  | 'nephew' 
  | 'niece' 
  | 'son_in_law' 
  | 'daughter_in_law' 
  | 'father_in_law' 
  | 'mother_in_law' 
  | 'cousin'
  | 'spouse'
  | 'other';

export type GenerationLevel = 0 | 1 | 2 | 3; // 0=grandparents, 1=parents, 2=children, 3=grandchildren

export type FamilySide = 'maternal' | 'paternal' | 'self';

export interface EnhancedFamilyMember {
  id: number;
  person: PhoneBookEntry;
  specific_role: SpecificFamilyRole;
  generation_level: GenerationLevel;
  side?: FamilySide;
  is_primary?: boolean; // For identifying main family line vs extended family
  notes?: string;
}

export interface FamilyRoleDefinition {
  role: SpecificFamilyRole;
  label: string;
  generation: GenerationLevel;
  gender_preference?: 'M' | 'F';
  description: string;
  typical_age_range?: { min: number; max: number };
  implies_relationships?: Array<{
    to_role: SpecificFamilyRole;
    relationship_type: string;
  }>;
}

export interface FamilyStructureTemplate {
  id: string;
  name: string;
  description: string;
  required_roles: SpecificFamilyRole[];
  optional_roles: SpecificFamilyRole[];
  max_members: number;
}

export interface RoleAssignmentSuggestion {
  person_id: number;
  suggested_role: SpecificFamilyRole;
  confidence: number; // 0-1
  reason: string;
  alternative_roles?: SpecificFamilyRole[];
}

export interface FamilyValidationError {
  type: 'age_conflict' | 'gender_mismatch' | 'impossible_relationship' | 'duplicate_role' | 'missing_required';
  message: string;
  affected_person_ids: number[];
  suggested_fix?: string;
}

export interface EnhancedFamilyGroup {
  id: number;
  name: string;
  address: string;
  island: string;
  members: EnhancedFamilyMember[];
  validation_errors: FamilyValidationError[];
  created_at: string;
  updated_at: string;
}
