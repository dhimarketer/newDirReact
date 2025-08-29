// 2025-01-29: AddEntryPage component for adding new directory entries
// Dedicated page for better user experience and navigation

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import AddDirectoryEntryModal from '../components/directory/AddDirectoryEntryModal';
import { toast } from 'react-hot-toast';

const AddEntryPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);

  // Check if user is authenticated
  if (!isLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/directory'); // Redirect back to directory page
  };

  const handleSuccess = () => {
    toast.success('Entry submitted successfully! Redirecting to directory...');
    setTimeout(() => {
      navigate('/directory');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/directory')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add New Entry</h1>
                <p className="text-gray-600 mt-1">
                  Create a new directory entry for the phonebook
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Admin Approval Required
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Entry</h3>
                <p className="text-sm text-gray-600">Add new contact information</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Review Process</h3>
                <p className="text-sm text-gray-600">Admin approval required</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Published</h3>
                <p className="text-sm text-gray-600">Available in directory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                  <p>Fill out the form below with the contact's information. Required fields are marked with an asterisk (*).</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                  <p>Submit the form. Your entry will be queued for administrator review and approval.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                  <p>Once approved by an administrator, the entry will be published to the public directory.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">4</span>
                  <p>You can track the status of your submission through your profile or contact support.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to add an entry?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Click the button below to open the entry form
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Open Entry Form</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Directory Entry Modal */}
      <AddDirectoryEntryModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default AddEntryPage;
