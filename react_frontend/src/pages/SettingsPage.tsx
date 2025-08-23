// 2025-01-27: Implementing admin-only Settings page for search field visibility control

import React from 'react';
import { useAuth } from '../store/authStore';
import AdminSearchFieldSettings from '../components/settings/AdminSearchFieldSettings';
import PointsSystemSettings from '../components/settings/PointsSystemSettings';
import UserDebugInfo from '../components/debug/UserDebugInfo';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  // Check if user is admin
  if (!user?.is_staff && !user?.is_superuser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            You need administrator privileges to access the settings page.
          </p>
        </div>
        
        {/* Debug information to help troubleshoot */}
        <div className="mt-8">
          <UserDebugInfo />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage system-wide settings and search field visibility for different user types
        </p>
      </div>

      <div className="space-y-8">
        {/* Points System Settings */}
        <PointsSystemSettings />
        
        {/* Admin Search Field Visibility Settings */}
        <AdminSearchFieldSettings />
      </div>
    </div>
  );
};

export default SettingsPage;
