// 2025-01-27: Creating simplified Header component to reduce errors

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useUI } from '../../store/uiStore';
import { Image, Menu } from 'lucide-react';
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
    <header className="bg-white shadow border-b">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-3"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <h1 className="text-xl font-bold text-blue-600">dirFinal</h1>
          </div>

          {/* Navigation - Hidden on mobile, visible on desktop */}
          <nav className="hidden lg:flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            <Link to="/directory" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Directory
            </Link>
            <Link to="/family" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Family
            </Link>
            <Link to="/search" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Search
            </Link>
            {/* Image Search - visible to users with sufficient points */}
            <Link 
              to={user && (user.score || 0) >= 10 ? '/premium-image-search' : '/search'} 
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                user && (user.score || 0) >= 10
                  ? 'text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
              title={user && (user.score || 0) >= 10 ? 'Image Search (Costs 10 points)' : 'Need 10+ points for Image Search'}
            >
              <Image className="w-4 h-4 mr-1" />
              Image Search
              {user && (user.score || 0) >= 10 && (
                <span className="ml-2 bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs">
                  {user.score || 0} pts
                </span>
              )}
            </Link>
            {user?.is_staff && (
              <Link to="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Admin
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Points Display */}
            <UserPointsDisplay />
            
            {/* User Profile Menu */}
            <div className="relative">
              {user ? (
                <>
                  <span className="text-sm text-gray-700 hidden sm:block">
                    Welcome, {user.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
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
