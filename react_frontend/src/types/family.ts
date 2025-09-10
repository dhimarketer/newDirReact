// 2025-01-27: Creating family type definitions for Phase 2 React frontend

import { BaseEntity } from './common';
import { PhoneBookEntry } from './directory';

export interface FamilyGroup extends BaseEntity {
  name: string;
  description?: string;
  address?: string;  // 2025-01-29: Added to match backend serializer
  island?: string;   // 2025-01-29: Added to match backend serializer
  is_public: boolean;
  created_by: number;
  members: FamilyMember[];
  relationships?: FamilyRelationship[];  // 2025-01-29: Added to match backend serializer
  privacy_settings: FamilyPrivacySettings;
  tags: string[];
  member_count?: number;  // 2025-01-29: Added to match backend serializer
}

export interface FamilyMember extends BaseEntity {
  user: number;
  family_group: number;
  role: FamilyRole;
  relationship: string;
  is_admin: boolean;
  joined_date: string;
  profile_picture?: string;
  notes?: string;
  entry?: PhoneBookEntry;  // 2025-01-29: Added to match backend serializer
  role_in_family?: string;  // 2025-01-29: Added to match backend serializer
}

export interface FamilyRelationship extends BaseEntity {
  person1: number;
  person2: number;
  person1_name?: string;  // 2025-01-29: Added to match backend serializer
  person2_name?: string;  // 2025-01-29: Added to match backend serializer
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'step_parent' | 'step_child' | 'step_sibling' | 'half_sibling' | 'father_in_law' | 'mother_in_law' | 'son_in_law' | 'daughter_in_law' | 'brother_in_law' | 'sister_in_law' | 'adopted_parent' | 'adopted_child' | 'legal_guardian' | 'ward' | 'foster_parent' | 'foster_child' | 'godparent' | 'godchild' | 'sponsor' | 'other';
  relationship_type_display?: string;  // 2025-01-29: Added to match backend serializer
  family_group: number;
  notes?: string;
  is_active: boolean;
  
  // 2024-12-28: Phase 4 - Rich relationship metadata
  start_date?: string;  // ISO date string
  end_date?: string;    // ISO date string
  relationship_status: 'active' | 'inactive' | 'ended' | 'suspended';
  is_biological: boolean;
  is_legal: boolean;
  confidence_level: number;  // 0-100
}

export interface FamilyRole {
  id: number;
  name: string;
  description?: string;
  permissions: FamilyPermission[];
}

export interface FamilyPermission {
  id: number;
  name: string;
  description?: string;
  code: string;
}

export interface FamilyPrivacySettings {
  who_can_view: 'public' | 'members' | 'admins';
  who_can_edit: 'admins' | 'members';
  who_can_add_members: 'admins' | 'members';
  who_can_remove_members: 'admins';
  who_can_see_contact_info: 'public' | 'members' | 'admins';
  who_can_see_personal_notes: 'members' | 'admins';
}

export interface FamilyInvitation extends BaseEntity {
  family_group: number;
  invited_user: number;
  invited_by: number;
  role: number;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
}

export interface FamilyTree {
  id: number;
  family_group: number;
  root_members: FamilyTreeNode[];
  max_depth: number;
  created_at: string;
  updated_at: string;
}

export interface FamilyTreeNode {
  id: number;
  member: FamilyMember;
  parent?: number;
  children: number[];
  level: number;
  position: number;
  spouse?: number;
}

export interface FamilyStats {
  total_families: number;
  total_members: number;
  average_family_size: number;
  largest_family: number;
  families_this_month: number;
  active_families: number;
}

// 2024-12-28: Phase 4 - Media and Event types
export interface FamilyMedia extends BaseEntity {
  person?: number;
  relationship?: number;
  family_group?: number;
  media_type: 'photo' | 'document' | 'certificate' | 'video' | 'audio' | 'other';
  title: string;
  description?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  upload_date: string;
  is_public: boolean;
}

export interface FamilyEvent extends BaseEntity {
  person: number;
  event_type: 'birth' | 'death' | 'marriage' | 'divorce' | 'adoption' | 'graduation' | 'migration' | 'religious_ceremony' | 'anniversary' | 'other';
  title: string;
  description?: string;
  event_date: string;  // ISO date string
  location?: string;
  related_person?: number;
  media_attachments?: number[];  // Array of media IDs
  is_verified: boolean;
  source?: string;
  notes?: string;
}
