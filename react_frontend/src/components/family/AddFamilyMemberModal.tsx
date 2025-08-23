// 2025-01-27: Creating AddFamilyMemberModal component for Phase 2 React frontend

import React, { useState, useEffect } from 'react';
import { FamilyMember, FamilyRole } from '../../types';
import { useFamilyStore } from '../../store/familyStore';

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: number;
  onSuccess?: (member: FamilyMember) => void;
}

const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({
  isOpen,
  onClose,
  familyId,
  onSuccess,
}) => {
  const { addFamilyMember, fetchFamilyRoles, familyRoles, familyRolesLoading } = useFamilyStore();
  
  const [formData, setFormData] = useState({
    user: '',
    role: '',
    relationship: '',
    is_admin: false,
    notes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchFamilyRoles();
    }
  }, [isOpen, fetchFamilyRoles]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.user.trim()) {
      newErrors.user = 'User ID is required';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    if (!formData.relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
    }
    
    if (formData.relationship.length > 100) {
      newErrors.relationship = 'Relationship must be less than 100 characters';
    }
    
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newMember = await addFamilyMember(familyId, {
        user: parseInt(formData.user),
        role: parseInt(formData.role),
        relationship: formData.relationship,
        is_admin: formData.is_admin,
        notes: formData.notes || undefined,
      });
      
      if (newMember) {
        onSuccess?.(newMember);
        handleClose();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to add family member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      user: '',
      role: '',
      relationship: '',
      is_admin: false,
      notes: '',
    });
    setErrors({});
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Family Member</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User ID */}
          <div>
            <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
              User ID *
            </label>
            <input
              type="number"
              id="user"
              value={formData.user}
              onChange={(e) => handleInputChange('user', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.user ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter user ID"
              disabled={isSubmitting}
            />
            {errors.user && (
              <p className="mt-1 text-sm text-red-600">{errors.user}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting || familyRolesLoading === 'loading'}
            >
              <option value="">Select a role</option>
              {familyRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
            {familyRolesLoading === 'loading' && (
              <p className="mt-1 text-sm text-gray-500">Loading roles...</p>
            )}
          </div>

          {/* Relationship */}
          <div>
            <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">
              Relationship *
            </label>
            <input
              type="text"
              id="relationship"
              value={formData.relationship}
              onChange={(e) => handleInputChange('relationship', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.relationship ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Father, Mother, Son, Daughter, Spouse"
              disabled={isSubmitting}
            />
            {errors.relationship && (
              <p className="mt-1 text-sm text-red-600">{errors.relationship}</p>
            )}
          </div>

          {/* Admin Privileges */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_admin}
                onChange={(e) => handleInputChange('is_admin', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-700">
                Grant admin privileges
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Admins can manage family group settings and members
            </p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Additional notes about this member (optional)"
              disabled={isSubmitting}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFamilyMemberModal;
