// 2025-01-27: Creating floating action button for quick access to premium features

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { Image, Crown, Plus } from 'lucide-react';

const FloatingActionButton: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 lg:hidden">
      {/* Main FAB */}
      <div className="relative group">
        <button className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-white">
          <Plus className="w-6 h-6" />
        </button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Quick Actions
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
        
        {/* Dropdown Menu */}
        <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-48">
            {/* Image Search */}
            {user.score >= 10 ? (
              <Link
                to="/premium-image-search"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-150"
              >
                <Image className="w-5 h-5 mr-3 text-purple-500" />
                <span className="font-medium">Image Search</span>
                <span className="ml-auto text-sm text-purple-600 font-medium">
                  {user.score} pts
                </span>
              </Link>
            ) : (
              <div className="px-4 py-3 text-gray-500">
                <div className="flex items-center">
                  <Image className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="font-medium">Image Search</span>
                  <span className="ml-auto text-sm text-gray-400">
                    Need 10+ pts
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Earn points to unlock</p>
              </div>
            )}
            
            {/* Quick Search */}
            <Link
              to="/search"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
            >
              <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-medium">Quick Search</span>
            </Link>
            
            {/* Add Family Member */}
            <Link
              to="/family"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-150"
            >
              <svg className="w-5 h-5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Add Family Member</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingActionButton;
