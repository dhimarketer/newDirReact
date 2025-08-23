// 2025-01-27: Creating settings types for Phase 2 React frontend including admin search field visibility

export interface UserProfile {
  id: number;
  bio?: string;
  location?: string;
  website?: string;
  social_media: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
    github: string;
  };
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
}

export interface UserPrivacySettings {
  profile_visibility: 'public' | 'friends' | 'family' | 'private';
  contact_info_visibility: 'public' | 'friends' | 'family' | 'private';
  family_info_visibility: 'public' | 'friends' | 'family' | 'private';
  search_visibility: 'public' | 'friends' | 'family' | 'private';
  allow_friend_requests: boolean;
  allow_family_invitations: boolean;
  show_online_status: boolean;
  show_last_seen: boolean;
}

export interface NotificationSettings {
  email: {
    new_friend_request: boolean;
    new_family_invitation: boolean;
    directory_updates: boolean;
    family_updates: boolean;
    system_notifications: boolean;
    marketing: boolean;
  };
  push: {
    new_friend_request: boolean;
    new_family_invitation: boolean;
    directory_updates: boolean;
    family_updates: boolean;
    system_notifications: boolean;
  };
  sms: {
    urgent_notifications: boolean;
    security_alerts: boolean;
  };
}

// 2025-01-27: Adding admin search field visibility settings
export interface SearchFieldVisibility {
  field_name: string;
  field_label: string;
  field_type: 'text' | 'select' | 'checkbox' | 'date' | 'number';
  visible_for: {
    admin: boolean;
    staff: boolean;
    regular: boolean;
    premium: boolean;
  };
  required_for: {
    admin: boolean;
    staff: boolean;
    regular: boolean;
    premium: boolean;
  };
  searchable_for: {
    admin: boolean;
    staff: boolean;
    regular: boolean;
    premium: boolean;
  };
}

export interface AdminSearchFieldSettings {
  id: number;
  name: string;
  description: string;
  search_fields: SearchFieldVisibility[];
  created_at: string;
  updated_at: string;
  created_by: number;
  is_active: boolean;
}

export interface SearchFieldVisibilityUpdate {
  field_name: string;
  visible_for: Partial<SearchFieldVisibility['visible_for']>;
  required_for: Partial<SearchFieldVisibility['required_for']>;
  searchable_for: Partial<SearchFieldVisibility['searchable_for']>;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
