// 2025-01-27: Creating AdminSearchFieldSettings component for admin search field visibility control

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuth } from '../../store/authStore';
import SettingSection from './SettingSection';
import SaveButton from './SaveButton';
import { SearchFieldVisibility, SearchFieldVisibilityUpdate } from '../../types/settings';

const AdminSearchFieldSettings: React.FC = () => {
  const { user } = useAuth();
  const {
    adminSearchFieldSettings,
    adminSearchFieldSettingsLoading,
    adminSearchFieldSettingsError,
    fetchAdminSearchFieldSettings,
    updateAdminSearchFieldSettings,
    resetAdminSearchFieldSettings,
  } = useSettingsStore();

  const [localSettings, setLocalSettings] = useState<SearchFieldVisibility[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    fetchAdminSearchFieldSettings();
  }, [fetchAdminSearchFieldSettings]);

  // Update local settings when data is loaded
  useEffect(() => {
    if (adminSearchFieldSettings?.search_fields) {
      setLocalSettings([...adminSearchFieldSettings.search_fields]);
      setHasChanges(false);
    }
  }, [adminSearchFieldSettings]);

  // Check if user is admin
  if (!user?.is_staff && !user?.is_superuser) {
    return null;
  }

  // Handle field visibility change
  const handleFieldVisibilityChange = (
    fieldIndex: number,
    userType: keyof SearchFieldVisibility['visible_for'],
    value: boolean
  ) => {
    const updatedSettings = [...localSettings];
    updatedSettings[fieldIndex] = {
      ...updatedSettings[fieldIndex],
      visible_for: {
        ...updatedSettings[fieldIndex].visible_for,
        [userType]: value,
      },
    };
    setLocalSettings(updatedSettings);
    setHasChanges(true);
  };

  // Handle field requirement change
  const handleFieldRequirementChange = (
    fieldIndex: number,
    userType: keyof SearchFieldVisibility['required_for'],
    value: boolean
  ) => {
    const updatedSettings = [...localSettings];
    updatedSettings[fieldIndex] = {
      ...updatedSettings[fieldIndex],
      required_for: {
        ...updatedSettings[fieldIndex].required_for,
        [userType]: value,
      },
    };
    setLocalSettings(updatedSettings);
    setHasChanges(true);
  };

  // Handle field searchability change
  const handleFieldSearchabilityChange = (
    fieldIndex: number,
    userType: keyof SearchFieldVisibility['searchable_for'],
    value: boolean
  ) => {
    const updatedSettings = [...localSettings];
    updatedSettings[fieldIndex] = {
      ...updatedSettings[fieldIndex],
      searchable_for: {
        ...updatedSettings[fieldIndex].searchable_for,
        [userType]: value,
      },
    };
    setLocalSettings(updatedSettings);
    setHasChanges(true);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      const updates: SearchFieldVisibilityUpdate[] = localSettings.map(field => ({
        field_name: field.field_name,
        visible_for: field.visible_for,
        required_for: field.required_for,
        searchable_for: field.searchable_for,
      }));

      await updateAdminSearchFieldSettings(updates);
      toast.success('Search field visibility settings updated successfully!');
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update search field visibility settings');
    }
  };

  // Handle reset to defaults
  const handleResetToDefaults = async () => {
    try {
      await resetAdminSearchFieldSettings();
      toast.success('Search field visibility settings reset to defaults!');
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset search field visibility settings');
    }
  };

  if (adminSearchFieldSettingsLoading === 'loading') {
    return (
      <SettingSection
        title="Admin Search Field Visibility Settings"
        description="Control which search fields are visible, required, and searchable for different user types"
      >
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </SettingSection>
    );
  }

  if (adminSearchFieldSettingsLoading === 'error') {
    return (
      <SettingSection
        title="Admin Search Field Visibility Settings"
        description="Control which search fields are visible, required, and searchable for different user types"
      >
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Settings
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{adminSearchFieldSettingsError}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={fetchAdminSearchFieldSettings}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </SettingSection>
    );
  }

  if (!adminSearchFieldSettings?.search_fields) {
    return (
      <SettingSection
        title="Admin Search Field Visibility Settings"
        description="Control which search fields are visible, required, and searchable for different user types"
      >
        <div className="text-center py-8">
          <p className="text-gray-500">No search field settings found.</p>
        </div>
      </SettingSection>
    );
  }

  return (
    <SettingSection
      title="Admin Search Field Visibility Settings"
      description="Control which search fields are visible, required, and searchable for different user types"
    >
      <div className="space-y-6">
        {/* Search Fields Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Search Field
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Regular
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localSettings.map((field, fieldIndex) => (
                <tr key={field.field_name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{field.field_label}</div>
                      <div className="text-sm text-gray-500">{field.field_name}</div>
                      <div className="text-xs text-gray-400">{field.field_type}</div>
                    </div>
                  </td>
                  
                  {/* Admin Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.visible_for.admin}
                          onChange={(e) => handleFieldVisibilityChange(fieldIndex, 'admin', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Visible</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.required_for.admin}
                          onChange={(e) => handleFieldRequirementChange(fieldIndex, 'admin', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Required</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.searchable_for.admin}
                          onChange={(e) => handleFieldSearchabilityChange(fieldIndex, 'admin', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Searchable</span>
                      </div>
                    </div>
                  </td>

                  {/* Staff Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.visible_for.staff}
                          onChange={(e) => handleFieldVisibilityChange(fieldIndex, 'staff', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Visible</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.required_for.staff}
                          onChange={(e) => handleFieldRequirementChange(fieldIndex, 'staff', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Required</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.searchable_for.staff}
                          onChange={(e) => handleFieldSearchabilityChange(fieldIndex, 'staff', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Searchable</span>
                      </div>
                    </div>
                  </td>

                  {/* Regular User Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.visible_for.regular}
                          onChange={(e) => handleFieldVisibilityChange(fieldIndex, 'regular', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Visible</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.required_for.regular}
                          onChange={(e) => handleFieldRequirementChange(fieldIndex, 'regular', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Required</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.searchable_for.regular}
                          onChange={(e) => handleFieldSearchabilityChange(fieldIndex, 'regular', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Searchable</span>
                      </div>
                    </div>
                  </td>

                  {/* Premium User Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.visible_for.premium}
                          onChange={(e) => handleFieldVisibilityChange(fieldIndex, 'premium', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Visible</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.required_for.premium}
                          onChange={(e) => handleFieldRequirementChange(fieldIndex, 'premium', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Required</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={field.searchable_for.premium}
                          onChange={(e) => handleFieldSearchabilityChange(fieldIndex, 'premium', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-600">Searchable</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset to Defaults
            </button>
          </div>
          
          <div className="flex space-x-3">
            <SaveButton
              onClick={handleSaveChanges}
              loading={adminSearchFieldSettingsLoading === 'loading'}
              error={adminSearchFieldSettingsError}
              disabled={!hasChanges}
            >
              Save Changes
            </SaveButton>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Search Field Visibility Control
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  <strong>Visible:</strong> Field appears in the search interface for this user type<br/>
                  <strong>Required:</strong> Field must be filled before search can be performed<br/>
                  <strong>Searchable:</strong> Field can be used as a search criteria
                </p>
                <p className="mt-2">
                  <strong>Note:</strong> Admin users can always access the settings page to modify these settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingSection>
  );
};

export default AdminSearchFieldSettings;
