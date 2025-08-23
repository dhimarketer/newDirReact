// 2025-01-27: Creating family type definitions for Phase 2 React frontend

export interface FamilyGroup extends BaseEntity {
  name: string;
  description?: string;
  is_public: boolean;
  created_by: number;
  members: FamilyMember[];
  privacy_settings: FamilyPrivacySettings;
  tags: string[];
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
