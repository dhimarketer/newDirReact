// 2025-01-27: Debug component to display user information

import React from 'react';
import { useAuth } from '../../store/authStore';

const UserDebugInfo: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800">Loading user data...</div>;
  }

  if (!isAuthenticated || !user) {
    return <div className="p-4 bg-red-100 text-red-800">No user data available</div>;
  }

  return (
    <div className="p-4 bg-blue-100 text-blue-800 rounded-lg m-4">
      <h3 className="font-bold mb-2">User Debug Information</h3>
      <div className="text-sm space-y-1">
        <div><strong>Username:</strong> {user.username}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Name:</strong> {user.first_name} {user.last_name}</div>
        <div><strong>User Type:</strong> {user.user_type}</div>
        <div><strong>Is Active:</strong> {user.is_active ? 'Yes' : 'No'}</div>
        <div><strong>Is Staff:</strong> {user.is_staff ? 'Yes' : 'No'} (Type: {typeof user.is_staff})</div>
        <div><strong>Is Superuser:</strong> {user.is_superuser ? 'Yes' : 'No'} (Type: {typeof user.is_superuser})</div>
        <div><strong>Admin Check:</strong> {user.is_staff || user.is_superuser ? 'Yes' : 'No'}</div>
        <div><strong>Date Joined:</strong> {user.date_joined}</div>
        <div><strong>Last Login:</strong> {user.last_login}</div>
      </div>
      
      <div className="mt-4 p-2 bg-white rounded">
        <h4 className="font-bold mb-1">Raw User Object:</h4>
        <pre className="text-xs overflow-auto">{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  );
};

export default UserDebugInfo;
