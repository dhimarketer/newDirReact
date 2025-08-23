// 2025-01-27: Creating FamilyPage component for Phase 2 React frontend family management

import React, { useState, useEffect } from 'react';
import { useFamilyStore } from '../store/familyStore';
import { FamilyGroup, FamilyMember } from '../types';
import {
  FamilyGroupCard,
  FamilyMemberCard,
  FamilySearchBar,
  CreateFamilyGroupModal,
  AddFamilyMemberModal,
} from '../components/family';

const FamilyPage: React.FC = () => {
  const {
    familyGroups,
    familyMembers,
    currentFamilyGroup,
    familyGroupsLoading,
    familyMembersLoading,
    familyGroupsError,
    familyMembersError,
    pagination,
    fetchFamilyGroups,
    fetchFamilyMembers,
    createFamilyGroup,
    updateFamilyGroup,
    deleteFamilyGroup,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    setCurrentFamilyGroup,
    clearErrors,
  } = useFamilyStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState<FamilyGroup | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    fetchFamilyGroups();
    clearErrors();
  }, [fetchFamilyGroups, clearErrors]);

  useEffect(() => {
    if (currentFamilyGroup) {
      fetchFamilyMembers(currentFamilyGroup.id);
    }
  }, [currentFamilyGroup, fetchFamilyMembers]);

  const handleCreateFamilyGroup = (familyGroup: FamilyGroup) => {
    setShowCreateModal(false);
    // The store will automatically update the list
  };

  const handleEditFamilyGroup = (family: FamilyGroup) => {
    setEditingFamily(family);
    setShowCreateModal(true);
  };

  const handleDeleteFamilyGroup = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this family group? This action cannot be undone.')) {
      const success = await deleteFamilyGroup(id);
      if (success && currentFamilyGroup?.id === id) {
        setCurrentFamilyGroup(null);
        setShowMembers(false);
      }
    }
  };

  const handleViewMembers = (familyId: number) => {
    const family = familyGroups.find(fg => fg.id === familyId);
    if (family) {
      setCurrentFamilyGroup(family);
      setShowMembers(true);
    }
  };

  const handleViewTree = (familyId: number) => {
    // TODO: Implement family tree visualization
    console.log('View family tree for:', familyId);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    // TODO: Implement member edit modal
  };

  const handleRemoveMember = async (memberId: number) => {
    if (currentFamilyGroup && window.confirm('Are you sure you want to remove this member?')) {
      await removeFamilyMember(currentFamilyGroup.id, memberId);
    }
  };

  const handleViewProfile = (userId: number) => {
    // TODO: Navigate to user profile
    console.log('View profile for user:', userId);
  };

  const handleBackToFamilies = () => {
    setCurrentFamilyGroup(null);
    setShowMembers(false);
    setEditingFamily(null);
    setEditingMember(null);
  };

  const renderFamilyGroups = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Groups</h1>
          <p className="text-gray-600">Manage and discover family connections</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          Create Family Group
        </button>
      </div>

      {/* Search and Filters */}
      <FamilySearchBar showFilters={true} />

      {/* Error Display */}
      {familyGroupsError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{familyGroupsError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {familyGroupsLoading === 'loading' && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Family Groups Grid */}
      {familyGroupsLoading === 'success' && familyGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyGroups.map((familyGroup) => (
            <FamilyGroupCard
              key={familyGroup.id}
              familyGroup={familyGroup}
              onEdit={handleEditFamilyGroup}
              onDelete={handleDeleteFamilyGroup}
              onViewMembers={handleViewMembers}
              onViewTree={handleViewTree}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {familyGroupsLoading === 'success' && familyGroups.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No family groups</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first family group.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Family Group
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => fetchFamilyGroups({ page: pagination.page - 1 })}
              disabled={!pagination.hasPrevious}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchFamilyGroups({ page: pagination.page + 1 })}
              disabled={!pagination.hasNext}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{' '}
                <span className="font-medium">{Math.min(pagination.pageSize, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => fetchFamilyGroups({ page: pagination.page - 1 })}
                  disabled={!pagination.hasPrevious}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchFamilyGroups({ page: pagination.page + 1 })}
                  disabled={!pagination.hasNext}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFamilyMembers = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={handleBackToFamilies}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-2"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Families
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{currentFamilyGroup?.name} - Members</h1>
          <p className="text-gray-600">Manage family group members and relationships</p>
        </div>
        <button
          onClick={() => setShowAddMemberModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          Add Member
        </button>
      </div>

      {/* Error Display */}
      {familyMembersError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{familyMembersError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {familyMembersLoading === 'loading' && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Members Grid */}
      {familyMembersLoading === 'success' && familyMembers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyMembers.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              onEdit={handleEditMember}
              onRemove={handleRemoveMember}
              onViewProfile={handleViewProfile}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {familyMembersLoading === 'success' && familyMembers.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No members yet</h3>
          <p className="mt-1 text-sm text-gray-500">Start building your family by adding members.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Member
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showMembers ? renderFamilyMembers() : renderFamilyGroups()}
      </div>

      {/* Create/Edit Family Group Modal */}
      <CreateFamilyGroupModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingFamily(null);
        }}
        onSuccess={handleCreateFamilyGroup}
      />

      {/* Add Family Member Modal */}
      <AddFamilyMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        familyId={currentFamilyGroup?.id || 0}
        onSuccess={(member) => {
          // The store will automatically update the members list
          console.log('Member added:', member);
        }}
      />
    </div>
  );
};

export default FamilyPage;
