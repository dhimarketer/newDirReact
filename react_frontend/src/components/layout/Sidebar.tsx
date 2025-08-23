// 2025-01-27: Creating Sidebar component for Phase 2 React frontend

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
  const { sidebarOpen, setSidebarOpen, setMobileMenuOpen } = useUI();
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
      <div className="relative flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const isPremium = item.isPremium;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleNavClick}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${isPremium ? 'border-l-4 border-purple-500' : ''}`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    } ${isPremium ? 'text-purple-500' : ''}`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isPremium && (
                    <Crown className="h-4 w-4 text-purple-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User info */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {user?.user_type === 'premium' && (
                <div className="flex items-center mt-1">
                  <Crown className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-xs text-purple-600 font-medium">Premium</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop sidebar
  if (!sidebarOpen) {
    return (
      <div className="hidden lg:block w-16 bg-white border-r border-gray-200">
        <div className="flex flex-col items-center py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const isPremium = item.isPremium;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`p-3 rounded-md mb-2 relative ${
                  isActive
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                } ${isPremium ? 'border-l-2 border-purple-500' : ''}`}
                title={item.name}
              >
                <item.icon className={`h-6 w-6 ${isPremium ? 'text-purple-500' : ''}`} />
                {isPremium && (
                  <Crown className="absolute -top-1 -right-1 h-3 w-3 text-purple-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const isPremium = item.isPremium;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${isPremium ? 'border-l-4 border-purple-500' : ''}`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    } ${isPremium ? 'text-purple-500' : ''}`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isPremium && (
                    <Crown className="h-4 w-4 text-purple-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User info */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {user?.user_type === 'premium' && (
                <div className="flex items-center mt-1">
                  <Crown className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-xs text-purple-600 font-medium">Premium</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
