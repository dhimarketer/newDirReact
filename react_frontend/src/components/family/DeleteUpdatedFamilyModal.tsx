// 2025-01-28: Component for deleting updated families while preserving phonebook entries

import React, { useState } from 'react';
import { familyService } from '../../services/familyService';

interface DeleteUpdatedFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  familyGroupId?: number;
  address?: string;
  island?: string;
  familyName?: string;
}

interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const DeleteUpdatedFamilyModal: React.FC<DeleteUpdatedFamilyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  familyGroupId,
  address,
  island,
  familyName
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<DeleteResponse | null>(null);
  const [deleteBy, setDeleteBy] = useState<'id' | 'address'>(
    familyGroupId ? 'id' : 'address'
  );
  const [formData, setFormData] = useState({
    family_group_id: familyGroupId || '',
    address: address || '',
    island: island || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const params: any = {};
      
      if (deleteBy === 'id' && formData.family_group_id) {
        params.family_group_id = parseInt(formData.family_group_id as string);
      } else if (deleteBy === 'address' && formData.address && formData.island) {
        params.address = formData.address;
        params.island = formData.island;
      } else {
        throw new Error('Please provide either family group ID or both address and island');
      }

      const response = await familyService.deleteUpdatedFamilies(params);
      
      if (response.success) {
        setSuccess(response);
      } else {
        throw new Error(response.error || 'Failed to delete family');
      }
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to delete family');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setFormData({
      family_group_id: familyGroupId || '',
      address: address || '',
      island: island || ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Delete Updated Family
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!success ? (
          <>
            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-4">
                This action will delete the family group and all family relationships while preserving 
                all phonebook entries. Users and names from addresses will remain intact.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delete by:
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="id"
                      checked={deleteBy === 'id'}
                      onChange={(e) => setDeleteBy(e.target.value as 'id' | 'address')}
                      className="mr-2"
                    />
                    Family Group ID
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="address"
                      checked={deleteBy === 'address'}
                      onChange={(e) => setDeleteBy(e.target.value as 'id' | 'address')}
                      className="mr-2"
                    />
                    Address & Island
                  </label>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {deleteBy === 'id' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family Group ID
                  </label>
                  <input
                    type="number"
                    name="family_group_id"
                    value={formData.family_group_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter family group ID"
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter address"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Island
                    </label>
                    <input
                      type="text"
                      name="island"
                      value={formData.island}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter island"
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete Family'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-4 text-green-600">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Family Deleted Successfully
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Status:</strong> {success.message}</p>
              <p><strong>Result:</strong> Family relationships deleted successfully</p>
              <p><strong>Note:</strong> Individual member data has been preserved</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteUpdatedFamilyModal;
