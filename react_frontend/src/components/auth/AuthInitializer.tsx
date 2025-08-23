// 2025-01-27: AuthInitializer component to fetch current user data on app load

import React, { useEffect } from 'react';
import { useAuth } from '../../store/authStore';
import { STORAGE_KEYS } from '../../utils/constants';

const AuthInitializer: React.FC = () => {
  const { user, tokens, isAuthenticated, getCurrentUser, isLoading, initializeFromStorage } = useAuth();

  useEffect(() => {
    // Initialize auth state from localStorage on app startup
    initializeFromStorage();
  }, [initializeFromStorage]);

  useEffect(() => {
    // If we have tokens but no user data, fetch the current user
    if (tokens && !user && !isLoading) {
      console.log('AuthInitializer - Fetching current user data...');
      getCurrentUser().catch((error) => {
        console.error('AuthInitializer - Failed to get current user:', error);
      });
    }
  }, [tokens, user, getCurrentUser, isLoading]);

  // This component doesn't render anything
  return null;
};

export default AuthInitializer;
