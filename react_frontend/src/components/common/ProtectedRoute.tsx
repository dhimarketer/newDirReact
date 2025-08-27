// 2025-01-27: Creating ProtectedRoute component for Phase 2 React frontend

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { STORAGE_KEYS } from '../../utils/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // 2025-01-28: ADDED - Debug logging for authentication state
  console.log('=== PROTECTED ROUTE DEBUG ===');
  console.log('DEBUG: isAuthenticated:', isAuthenticated);
  console.log('DEBUG: user:', user);
  console.log('DEBUG: isLoading:', isLoading);
  console.log('DEBUG: localStorage token:', !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));
  console.log('=== END PROTECTED ROUTE DEBUG ===');

  // Handle authentication redirects
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('DEBUG: User not authenticated, redirecting to login');
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  // Handle admin access redirects
  useEffect(() => {
    if (!isLoading && isAuthenticated && requireAdmin && 
        (!user?.is_staff && !user?.is_superuser && user?.user_type !== 'admin')) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, requireAdmin, user, navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Check admin access if required
  if (requireAdmin && (!user?.is_staff && !user?.is_superuser && user?.user_type !== 'admin')) {
    return null;
  }

  // Render children if all checks pass
  console.log('DEBUG: User authenticated, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
