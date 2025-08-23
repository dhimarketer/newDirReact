// 2025-01-27: Creating user type definitions for Phase 2 React frontend

export interface UserProfile extends BaseEntity {
  user: number;
  bio?: string;
  location?: string;
  website?: string;
  social_media: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    github?: string;
  };
  preferences: UserPreferences;
  privacy_settings: UserPrivacySettings;
  notification_settings: NotificationSettings;
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

export interface UserStats {
  total_contacts: number;
  total_families: number;
  total_friends: number;
  profile_views: number;
  last_active: string;
  member_since: string;
  contribution_score: number;
}

export interface UserActivity {
  id: number;
  user: number;
  action: string;
  target_type: string;
  target_id: number;
  details?: Record<string, any>;
  created_at: string;
}

export interface UserSession {
  id: string;
  user: number;
  device_info: {
    user_agent: string;
    ip_address: string;
    device_type: string;
    browser: string;
    os: string;
  };
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
}
