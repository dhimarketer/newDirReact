// 2025-01-27: Creating simplified Header component to reduce errors
// 2025-01-27: Updated to use new component utilities and improved styling
// 2025-01-27: Refactored to use Pico.css for lightweight, responsive, and professional styling

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useUI } from '../../store/uiStore';
import { Image, Menu, User, LogOut } from 'lucide-react';
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
    <header className="nav-container sticky top-0 z-40">
      <div className="content-wrapper">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-3 transition-colors duration-200"
              aria-label="Open mobile menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">DF</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">dirFinal</h1>
            </Link>
          </div>

          {/* Navigation - Hidden on mobile, visible on desktop */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main navigation">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/directory" className="nav-link">
              Directory
            </Link>
            <Link to="/family" className="nav-link">
              Family
            </Link>
            <Link to="/search" className="nav-link">
              Search
            </Link>
            {/* Image Search - visible to users with sufficient points */}
            <Link 
              to={user && (user.score || 0) >= 10 ? '/premium-image-search' : '/search'} 
              className={`nav-link inline-flex items-center ${
                user && (user.score || 0) >= 10
                  ? 'text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100' 
                  : ''
              }`}
              title={user && (user.score || 0) >= 10 ? 'Image Search (Costs 10 points)' : 'Need 10+ points for Image Search'}
            >
              <Image className="w-4 h-4 mr-1" />
              Image Search
              {user && (user.score || 0) >= 10 && (
                <span className="ml-2 bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  {user.score || 0} pts
                </span>
              )}
            </Link>
            {user?.is_staff && (
              <Link to="/admin" className="nav-link">
                Admin
              </Link>
            )}
          </nav>

          {/* User Menu */}
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
