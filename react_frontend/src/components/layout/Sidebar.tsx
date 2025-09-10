// 2025-01-27: Creating simplified Sidebar component to reduce errors
// 2025-01-27: Updated to use new styling approach and improved layout structure
// 2025-01-27: Refactored to use Pico.css for lightweight, responsive, and professional styling
// 2025-01-29: Cleaned up navigation - consolidated all navigation items here, removed duplicates
// 2025-01-29: REMOVED - Duplicate logo section that duplicates Header branding

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useUI } from '../../store/uiStore';
import { 
  Home, 
  Search, 
  BookOpen, 
  PlusCircle, 
  Users, 
  Image, 
  Settings, 
  Shield, 
  X,
  Crown,
  Network
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isPremium?: boolean;
}

interface SidebarProps {
  mobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ mobile = false }) => {
  const { user, isLoading } = useAuth();
  const { setMobileMenuOpen } = useUI();
  const location = useLocation();

  // Build navigation array based on user permissions
  const navigation = React.useMemo(() => {
    if (isLoading || !user) {
      return [];
    }

    const baseNavigation: NavigationItem[] = [
      { name: 'Search', href: '/', icon: Search },
      { name: 'Home', href: '/home', icon: Home },
      { name: 'Add Entry', href: '/add-entry', icon: PlusCircle },
      { name: 'Family', href: '/family', icon: Users },
      { name: 'Family Tree Demo', href: '/family-tree-demo', icon: Network },
    ];

    // Add image search if user has sufficient points
    if (user && (user.score || 0) >= 10) {
      baseNavigation.push({ 
        name: 'Image Search', 
        href: '/premium-image-search', 
        icon: Image,
        isPremium: true
      });
    }

    // Add settings for all authenticated users
    baseNavigation.push({ name: 'Settings', href: '/settings', icon: Settings });

    // Add admin features if user is admin
    if (user?.is_staff || user?.is_superuser) {
      console.log('Adding admin navigation items');
      baseNavigation.push({ name: 'Admin', href: '/admin', icon: Shield });
    } else {
      console.log('User is not admin, not adding admin navigation');
    }

    return baseNavigation;
  }, [user, isLoading]);

  // Debug: Log user permissions for navigation
  React.useEffect(() => {
    if (user) {
      console.log('Sidebar navigation debug:', {
        username: user?.username,
        user_type: user?.user_type,
        is_staff: user?.is_staff,
        is_superuser: user?.is_superuser,
        admin_check: user?.is_staff || user?.is_superuser
      });
    }
  }, [user]);

  const handleNavClick = () => {
    if (mobile) {
      setMobileMenuOpen(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`${mobile ? 'mobile-sidebar' : 'desktop-sidebar'}`}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Show empty state if no user
  if (!user) {
    return (
      <div className={`${mobile ? 'mobile-sidebar' : 'desktop-sidebar'}`}>
        <div className="p-4 text-center text-gray-500">
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  if (mobile) {
    return (
      <div className="mobile-sidebar">
        <div className="mobile-sidebar-header">
          <h2 className="mobile-sidebar-title">Navigation</h2>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="mobile-sidebar-close"
            aria-label="Close mobile menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mobile-sidebar-nav">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={`mobile-sidebar-item ${isActive ? 'active' : ''}`}
              >
                <item.icon
                  className="mobile-sidebar-icon"
                  aria-hidden="true"
                />
                {item.name}
                {item.isPremium && (
                  <Crown className="ml-auto h-4 w-4 text-yellow-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div className="desktop-sidebar">
      {/* Navigation */}
      <nav className="sidebar-nav">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon
                className="sidebar-nav-icon"
                aria-hidden="true"
              />
              {item.name}
              {item.isPremium && (
                <Crown className="ml-auto h-4 w-4 text-yellow-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <div className="sidebar-user-avatar">
            <span className="sidebar-user-initial">
              {user.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="sidebar-user-details">
            <p className="sidebar-user-name">{user.username}</p>
            <p className="sidebar-user-email">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
