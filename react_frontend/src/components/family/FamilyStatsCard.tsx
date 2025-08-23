// 2025-01-27: Creating FamilyStatsCard component for Phase 2 React frontend

import React from 'react';
import { FamilyStats } from '../../types';

interface FamilyStatsCardProps {
  stats: FamilyStats;
  className?: string;
}

const FamilyStatsCard: React.FC<FamilyStatsCardProps> = ({ stats, className = '' }) => {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case 'total_families':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 11a3 3 0 11-6 0 3 3 0 016 0zM6 12a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'total_members':
        return (
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
      case 'average_family_size':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'largest_family':
        return (
          <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        );
      case 'families_this_month':
        return (
          <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      case 'active_families':
        return (
          <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStatLabel = (statName: string) => {
    switch (statName) {
      case 'total_families':
        return 'Total Families';
      case 'total_members':
        return 'Total Members';
      case 'average_family_size':
        return 'Avg. Family Size';
      case 'largest_family':
        return 'Largest Family';
      case 'families_this_month':
        return 'New This Month';
      case 'active_families':
        return 'Active Families';
      default:
        return statName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatValue = (statName: string, value: number) => {
    if (statName === 'average_family_size') {
      return value.toFixed(1);
    }
    return formatNumber(value);
  };

  const statsArray = [
    { key: 'total_families', value: stats.total_families },
    { key: 'total_members', value: stats.total_members },
    { key: 'average_family_size', value: stats.average_family_size },
    { key: 'largest_family', value: stats.largest_family },
    { key: 'families_this_month', value: stats.families_this_month },
    { key: 'active_families', value: stats.active_families },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsArray.map(({ key, value }) => (
            <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {getStatIcon(key)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getStatValue(key, value)}
                </p>
                <p className="text-xs text-gray-500">
                  {getStatLabel(key)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last updated:</span>
            <span className="text-gray-900 font-medium">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyStatsCard;
