// 2025-01-27: Creating FamilyGroupCard component for Phase 2 React frontend

import React from 'react';
import { FamilyGroup } from '../../types';
import { useFamilyStore } from '../../store/familyStore';

interface FamilyGroupCardProps {
  familyGroup: FamilyGroup;
  onEdit?: (family: FamilyGroup) => void;
  onDelete?: (id: number) => void;
  onViewMembers?: (id: number) => void;
  onViewTree?: (id: number) => void;
  className?: string;
}

const FamilyGroupCard: React.FC<FamilyGroupCardProps> = ({
  familyGroup,
  onEdit,
  onDelete,
  onViewMembers,
  onViewTree,
  className = '',
}) => {
  const { setCurrentFamilyGroup } = useFamilyStore();

  const handleCardClick = () => {
    setCurrentFamilyGroup(familyGroup);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPrivacyIcon = (isPublic: boolean) => {
    return isPublic ? (
      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {familyGroup.name}
            </h3>
            <div className="flex items-center space-x-2">
              {getPrivacyIcon(familyGroup.is_public)}
              <span className="text-sm text-gray-600">
                {familyGroup.is_public ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
          
          {/* Action Menu */}
          <div className="relative">
            <button
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {familyGroup.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {familyGroup.description}
          </p>
        )}

        {/* Tags */}
        {familyGroup.tags && familyGroup.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {familyGroup.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {familyGroup.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{familyGroup.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="text-center">
            <div className="text-gray-900 font-medium">
              {familyGroup.members?.length || 0}
            </div>
            <div className="text-gray-500">Members</div>
          </div>
          <div className="text-center">
            <div className="text-gray-900 font-medium">
              {formatDate(familyGroup.created_at)}
            </div>
            <div className="text-gray-500">Created</div>
          </div>
          <div className="text-center">
            <div className="text-gray-900 font-medium">
              {formatDate(familyGroup.updated_at)}
            </div>
            <div className="text-gray-500">Updated</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {onViewMembers && (
            <button
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onViewMembers(familyGroup.id);
              }}
            >
              View Members
            </button>
          )}
          
          {onViewTree && (
            <button
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onViewTree(familyGroup.id);
              }}
            >
              View Tree
            </button>
          )}
        </div>

        {/* Edit/Delete Actions */}
        {(onEdit || onDelete) && (
          <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
            {onEdit && (
              <button
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(familyGroup);
                }}
              >
                Edit
              </button>
            )}
            
            {onDelete && (
              <button
                className="flex-1 px-3 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(familyGroup.id);
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyGroupCard;
