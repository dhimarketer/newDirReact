// 2025-01-27: Creating simplified Header component to reduce errors
// 2025-01-27: Updated to use new component utilities and improved styling
// 2025-01-27: Refactored to use Pico.css for lightweight, responsive, and professional styling
// 2025-01-29: Cleaned up navigation - removed duplicate nav items, keeping only logo and user menu
// 2025-01-29: REMOVED - Redundant search bar from header to eliminate duplicate search interfaces

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useUI } from '../../store/uiStore';
import { Menu, User, LogOut } from 'lucide-react';
import UserPointsDisplay from '../common/UserPointsDisplay';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { setMobileMenuOpen } = useUI();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DF</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-blue-600">dirFinal</span>
              </div>
            </Link>
          </div>

          {/* User Menu - Only user-related items, no navigation */}
          <div className="flex items-center space-x-4">
            {/* User Points Display */}
            <UserPointsDisplay />
            
            {/* User Profile Menu */}
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        Welcome, {user.username}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="btn-secondary"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn-primary">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
