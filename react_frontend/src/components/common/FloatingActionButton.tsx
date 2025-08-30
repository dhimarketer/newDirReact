// 2025-01-27: Creating floating action button for quick access to premium features
// 2025-01-29: Cleaned up - removed redundant navigation, kept only essential quick actions
// 2025-01-29: REMOVED - Redundant Image Search navigation that duplicates sidebar functionality
// 2025-01-29: REMOVED - Redundant Add Entry navigation that duplicates sidebar functionality

import React from 'react';
import { useAuth } from '../../store/authStore';

const FloatingActionButton: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Since all navigation is now handled by the Sidebar, this component is no longer needed
  // Keeping it as a placeholder for potential future quick actions that don't duplicate sidebar navigation
  return null;
};

export default FloatingActionButton;
