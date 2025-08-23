// 2025-01-27: Utility functions for search field visibility based on admin settings

import { SearchFieldVisibility } from '../types/settings';
import { User } from '../types/auth';

export type UserType = 'admin' | 'staff' | 'regular' | 'premium';

/**
 * Determine the user type based on user object
 */
export const getUserType = (user: User): UserType => {
  if (user.is_superuser || user.is_staff) {
    return 'admin';
  }
  
  // Check if user_type field exists and map it
  if (user.user_type) {
    switch (user.user_type.toLowerCase()) {
      case 'staff':
        return 'staff';
      case 'premium':
        return 'premium';
      case 'regular':
      default:
        return 'regular';
    }
  }
  
  // Default to regular if no user_type specified
  return 'regular';
};

/**
 * Get visible fields for a specific user type
 */
export const getVisibleFields = (
  searchFieldSettings: SearchFieldVisibility[] | undefined,
  userType: UserType
): SearchFieldVisibility[] => {
  if (!searchFieldSettings) {
    return [];
  }
  
  return searchFieldSettings.filter(field => 
    field.visible_for[userType] === true
  );
};

/**
 * Get required fields for a specific user type
 */
export const getRequiredFields = (
  searchFieldSettings: SearchFieldVisibility[] | undefined,
  userType: UserType
): SearchFieldVisibility[] => {
  if (!searchFieldSettings) {
    return [];
  }
  
  return searchFieldSettings.filter(field => 
    field.required_for[userType] === true
  );
};

/**
 * Get searchable fields for a specific user type
 */
export const getSearchableFields = (
  searchFieldSettings: SearchFieldVisibility[] | undefined,
  userType: UserType
): SearchFieldVisibility[] => {
  if (!searchFieldSettings) {
    return [];
  }
  
  return searchFieldSettings.filter(field => 
    field.searchable_for[userType] === true
  );
};

/**
 * Check if a specific field is visible for a user type
 */
export const isFieldVisible = (
  fieldName: string,
  searchFieldSettings: SearchFieldVisibility[] | undefined,
  userType: UserType
): boolean => {
  if (!searchFieldSettings) {
    return true; // Default to visible if no settings
  }
  
  const field = searchFieldSettings.find(f => f.field_name === fieldName);
  return field ? field.visible_for[userType] : true;
};

/**
 * Check if a specific field is required for a user type
 */
export const isFieldRequired = (
  fieldName: string,
  searchFieldSettings: SearchFieldVisibility[] | undefined,
  userType: UserType
): boolean => {
  if (!searchFieldSettings) {
    return false; // Default to not required if no settings
  }
  
  const field = searchFieldSettings.find(f => f.field_name === fieldName);
  return field ? field.required_for[userType] : false;
};

/**
 * Check if a specific field is searchable for a user type
 */
export const isFieldSearchable = (
  fieldName: string,
  searchFieldSettings: SearchFieldVisibility[] | undefined,
  userType: UserType
): boolean => {
  if (!searchFieldSettings) {
    return true; // Default to searchable if no settings
  }
  
  const field = searchFieldSettings.find(f => f.field_name === fieldName);
  return field ? field.searchable_for[userType] : true;
};
