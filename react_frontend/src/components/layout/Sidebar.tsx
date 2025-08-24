// 2025-01-27: Creating Sidebar component for Phase 2 React frontend
// 2025-01-27: Updated to use new component utilities and improved styling
// 2025-01-27: Refactored to use Pico.css for lightweight, responsive, and professional styling
// 2025-01-27: Simplified positioning logic and improved styling

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useUI } from '../../store/uiStore';
import { 
  Home, 
  Search, 
  BookOpen, 
  Users, 
  Settings, 
  Shield,
  X,
  Image,
  Crown
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  isPremium?: boolean;
}

interface SidebarProps {
  mobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ mobile = false }) => {
  const { user, isLoading } = useAuth();
  const { setMobileMenuOpen } = useUI();
  const location = useLocation();

  // Don't render navigation until user data is loaded
  if (isLoading || !user) {
    return null;
  }

  // Build navigation array based on user permissions
  const baseNavigation: NavigationItem[] = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Directory', href: '/directory', icon: BookOpen },
    { name: 'Family', href: '/family', icon: Users },
  ];

  // Add image search if user has sufficient points
  if (user && user.score >= 10) {
    baseNavigation.push({ 
      name: 'Image Search', 
      href: '/premium-image-search', 
      icon: Image
    });
  }

  // Debug: Log user permissions for navigation
  console.log('Sidebar navigation debug:', {
    username: user?.username,
    user_type: user?.user_type,
    is_staff: user?.is_staff,
    is_superuser: user?.is_superuser,
    admin_check: user?.is_staff || user?.is_superuser
  });

  // Add admin features if user is admin
  if (user?.is_staff || user?.is_superuser) {
    console.log('Adding admin navigation items');
    baseNavigation.push({ name: 'Settings', href: '/settings', icon: Settings });
    baseNavigation.push({ name: 'Admin', href: '/admin', icon: Shield });
    baseNavigation.push({ name: 'Admin Image Search', href: '/admin-image-search', icon: Image });
  } else {
    console.log('User is not admin, not adding admin navigation');
  }

  const navigation = baseNavigation;

  const handleNavClick = () => {
    if (mobile) {
      setMobileMenuOpen(false);
    }
  };

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
      {/* Logo */}
      <div className="sidebar-logo">
        <Link to="/" className="sidebar-logo-link">
          <div className="sidebar-logo-icon">
            <span className="sidebar-logo-text">DF</span>
          </div>
          <span className="sidebar-logo-title">dirFinal</span>
        </Link>
      </div>

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
