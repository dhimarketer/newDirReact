// 2025-01-27: Creating FamilyInvitationCard component for Phase 2 React frontend

import React from 'react';
import { FamilyInvitation } from '../../types';

interface FamilyInvitationCardProps {
  invitation: FamilyInvitation;
  onAccept?: (invitationId: number) => void;
  onDecline?: (invitationId: number) => void;
  onViewProfile?: (userId: number) => void;
  className?: string;
}

const FamilyInvitationCard: React.FC<FamilyInvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline,
  onViewProfile,
  className = '',
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'accepted':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'declined':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'expired':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const isExpired = new Date(invitation.expires_at) < new Date();
  const canRespond = invitation.status === 'pending' && !isExpired;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900">
                Invitation #{invitation.id}
              </h4>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(invitation.status)}`}>
                {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Family Group #{invitation.family_group}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon(invitation.status)}
          </div>
        </div>

        {/* Invitation Details */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Invited User:</span>
              <div className="text-gray-900 font-medium">
                User #{invitation.invited_user}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Invited By:</span>
              <div className="text-gray-900 font-medium">
                User #{invitation.invited_by}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Role:</span>
              <div className="text-gray-900 font-medium">
                Role #{invitation.role}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Expires:</span>
              <div className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(invitation.expires_at)}
                {isExpired && <span className="ml-1 text-xs">(Expired)</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {invitation.message && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{invitation.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        {canRespond && (
          <div className="flex space-x-2">
            {onAccept && (
              <button
                onClick={() => onAccept(invitation.id)}
                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200"
              >
                Accept Invitation
              </button>
            )}
            
            {onDecline && (
              <button
                onClick={() => onDecline(invitation.id)}
                className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Decline Invitation
              </button>
            )}
          </div>
        )}

        {/* View Profile Button */}
        {onViewProfile && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => onViewProfile(invitation.invited_user)}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              View User Profile
            </button>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Created: {formatDate(invitation.created_at)}</span>
            <span>Updated: {formatDate(invitation.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyInvitationCard;
