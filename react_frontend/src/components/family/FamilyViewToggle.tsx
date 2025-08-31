// 2025-01-29: NEW - Family view toggle component for switching between tree and table views
// 2025-01-29: Provides intuitive toggle interface for users to choose their preferred data visualization

import React from 'react';

export type ViewMode = 'tree' | 'table';

interface FamilyViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

const FamilyViewToggle: React.FC<FamilyViewToggleProps> = ({ 
  currentView, 
  onViewChange, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">View:</span>
      
      {/* Tree View Button */}
      <button
        onClick={() => onViewChange('tree')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
          currentView === 'tree'
            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm'
            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200 hover:text-gray-700'
        }`}
        title="Show family tree visualization"
      >
        <span className="text-base">🌳</span>
        <span>Tree View</span>
      </button>

      {/* Table View Button */}
      <button
        onClick={() => onViewChange('table')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
          currentView === 'table'
            ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200 hover:text-gray-700'
        }`}
        title="Show family data in table format"
      >
        <span className="text-base">📋</span>
        <span>Table View</span>
      </button>

      {/* View Mode Indicator */}
      <div className="ml-2 text-xs text-gray-500">
        {currentView === 'tree' ? 'Visual' : 'Tabular'} format
      </div>
    </div>
  );
};

export default FamilyViewToggle;
