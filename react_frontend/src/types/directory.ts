// 2025-01-27: Directory types for search functionality

export interface PhoneBookEntry {
  pid: number;  // Primary key from the live database
  nid?: string;
  name: string;
  contact: string;
  address?: string;
  atoll?: string;
  island?: string;
  street?: string;
  ward?: string;
  party?: string;
  DOB?: string;
  status?: 'active' | 'deceased' | 'unlisted' | 'inactive' | 'outdated';  // 2025-01-29: ENHANCED - Standardized status choices
  is_unlisted?: boolean;  // 2025-01-29: NEW - Boolean field to mark entries as unlisted
  remark?: string;
  email?: string;
  gender?: string;
  extra?: string;
  profession?: string;
  pep_status?: string;
  change_status: string;
  requested_by?: string;
  batch?: string;
  image_status?: string;
  family_group_id?: number;
  age?: number;  // 2025-01-28: Added age field for reliable backend-calculated ages
  // 2025-01-29: Added fields for ForeignKey relationship names
  atoll_name?: string;
  island_name?: string;
  party_name?: string;
}

export interface SearchFilters {
  query?: string;
  name?: string;
  contact?: string;
  nid?: string;
  address?: string;
  atoll?: string;
  island?: string;
  party?: string;
  profession?: string;
  gender?: string;
  min_age?: number;
  max_age?: number;
  remark?: string;
  pep_status?: string;
}

export interface SearchParams extends SearchFilters {
  page: number;
  page_size: number;
}

export interface SearchResponse {
  results: PhoneBookEntry[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SearchSuggestion {
  pid: number;  // Primary key from the live database
  name: string;
  contact: string;
  nid?: string;
  atoll?: string;
  island?: string;
  profession?: string;
  party?: string;
}

export interface SearchHistory {
  id: number;
  query: string;
  filters: SearchFilters;
  result_count: number;
  created_at: string;
}

export interface DirectoryStats {
  total_entries: number;
  entries_by_atoll: Record<string, number>;
  entries_by_profession: Record<string, number>;
  entries_by_gender: Record<string, number>;
  recent_additions: number;
  pending_changes: number;
}

export interface PhoneBookEntryWithImage extends PhoneBookEntry {
  age?: number;
  image_url?: string;
  image_filename?: string;
  image_upload_date?: string;
  pep_status_display?: string;
  // 2025-01-29: Added fields for ForeignKey relationship names
  atoll_name?: string;
  island_name?: string;
  party_name?: string;
  // 2025-01-29: Added additional fields for complete profile information
  batch?: string;
  change_status?: string;
  requested_by?: string;
  family_group_id?: number;
}
