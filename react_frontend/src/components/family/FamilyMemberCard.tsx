// 2025-01-27: Creating FamilyMemberCard component for Phase 2 React frontend

import React from 'react';
import { FamilyMember } from '../../types';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit?: (member: FamilyMember) => void;
  onRemove?: (memberId: number) => void;
  onViewProfile?: (userId: number) => void;
  className?: string;
  showActions?: boolean;
}

const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onEdit,
  onRemove,
  onViewProfile,
  className = '',
  showActions = true,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-orange-100 text-orange-800';
      case 'member':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRelationshipIcon = (relationship: string) => {
    const relationshipLower = relationship.toLowerCase();
    
    if (relationshipLower.includes('parent') || relationshipLower.includes('father') || relationshipLower.includes('mother')) {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (relationshipLower.includes('child') || relationshipLower.includes('son') || relationshipLower.includes('daughter')) {
      return (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
        </svg>
      );
    } else if (relationshipLower.includes('spouse') || relationshipLower.includes('husband') || relationshipLower.includes('wife')) {
      return (
        <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      );
    } else if (relationshipLower.includes('sibling') || relationshipLower.includes('brother') || relationshipLower.includes('sister')) {
      return (
        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 11a3 3 0 11-6 0 3 3 0 016 0zM6 12a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Profile Picture */}
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {member.profile_picture ? (
                <img 
                  src={member.profile_picture} 
                  alt={`${member.relationship} profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            
            {/* Member Info */}
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">
                  User #{member.user}
                </h4>
                {member.is_admin && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {getRelationshipIcon(member.relationship)}
                <span>{member.relationship}</span>
              </div>
            </div>
          </div>
          
          {/* Role Badge */}
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleBadgeColor(member.role?.name || 'member')}`}>
            {member.role?.name || 'Member'}
          </span>
        </div>

        {/* Notes */}
        {member.notes && (
          <div className="mb-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{member.notes}</p>
          </div>
        )}

        {/* Member Details */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="text-gray-500">Joined:</span>
            <div className="text-gray-900 font-medium">
              {formatDate(member.joined_date)}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Member ID:</span>
            <div className="text-gray-900 font-medium">#{member.id}</div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex space-x-2">
            {onViewProfile && (
              <button
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200"
                onClick={() => onViewProfile(member.user)}
              >
                View Profile
              </button>
            )}
            
            {onEdit && (
              <button
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors duration-200"
                onClick={() => onEdit(member)}
              >
                Edit
              </button>
            )}
            
            {onRemove && (
              <button
                className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors duration-200"
                onClick={() => onRemove(member.id)}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyMemberCard;
