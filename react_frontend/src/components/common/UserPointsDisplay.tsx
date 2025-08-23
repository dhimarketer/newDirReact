// 2025-01-27: Creating user points display component for header

import React from 'react';
import { useAuth } from '../../store/authStore';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';

interface UserPointsDisplayProps {
  className?: string;
  showIcon?: boolean;
  showTrend?: boolean;
}

const UserPointsDisplay: React.FC<UserPointsDisplayProps> = ({ 
  className = '', 
  showIcon = true, 
  showTrend = false 
}) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const getPointsColor = (score: number) => {
    if (score >= 50) return 'text-green-600';
    if (score >= 20) return 'text-blue-600';
    if (score >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPointsBackground = (score: number) => {
    if (score >= 50) return 'bg-green-100';
    if (score >= 20) return 'bg-blue-100';
    if (score >= 10) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPointsStatus = (score: number) => {
    if (score >= 50) return 'Excellent';
    if (score >= 20) return 'Good';
    if (score >= 10) return 'Fair';
    return 'Low';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && (
        <div className={`p-1.5 rounded-full ${getPointsBackground(user.score)}`}>
          <Coins className={`w-4 h-4 ${getPointsColor(user.score)}`} />
        </div>
      )}
      
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-semibold ${getPointsColor(user.score)}`}>
            {user.score} pts
          </span>
          {showTrend && (
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600">+5 today</span>
            </div>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {getPointsStatus(user.score)}
        </span>
      </div>
    </div>
  );
};

export default UserPointsDisplay;

