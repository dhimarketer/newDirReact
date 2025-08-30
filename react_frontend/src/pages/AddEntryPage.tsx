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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
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
    <div className="min-h-screen bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 add-entry-page">
      {/* Dialog Window */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Dialog Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/directory')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/80 transition-colors duration-200 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Directory Entry</h1>
                <p className="text-blue-600 mt-1">
                  Create a new directory entry for the phonebook
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-200">
                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Admin Approval Required
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-blue-900">Create Entry</h3>
                  <p className="text-blue-700">Add new contact information</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-yellow-900">Review Process</h3>
                  <p className="text-yellow-700">Admin approval required</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-green-900">Published</h3>
                  <p className="text-green-700">Available in directory</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-200 p-8 mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">How it works</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <span className="w-7 h-7 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <p className="text-gray-700">Fill out the form below with the contact's information. Required fields are marked with an asterisk (*).</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="w-7 h-7 bg-yellow-200 text-yellow-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <p className="text-gray-700">Submit the form. Your entry will be queued for administrator review and approval.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <span className="w-7 h-7 bg-green-200 text-green-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                      <p className="text-gray-700">Once approved by an administrator, the entry will be published to the public directory.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="w-7 h-7 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                      <p className="text-gray-700">You can track the status of your submission through your profile or contact support.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold text-gray-900">Ready to add an entry?</h3>
                <p className="text-gray-700 mt-2">
                  Click the button below to open the entry form
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-3 flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Open Entry Form</span>
              </button>
            </div>
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
