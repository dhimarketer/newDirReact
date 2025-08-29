// 2025-01-29: AdminPendingChangesPage component for reviewing pending directory changes
// Allows administrators to approve or reject user-submitted changes

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, FileText } from 'lucide-react';

interface PendingChange {
  id: number;
  change_type: 'add' | 'edit' | 'delete' | 'photo_upload' | 'family_update';
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  entry?: {
    pid: number;
    name: string;
    contact: string;
    address: string;
  };
  new_data?: any;
  requested_by: {
    username: string;
    email: string;
  };
  reviewed_by?: {
    username: string;
  };
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

const AdminPendingChangesPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedChange, setSelectedChange] = useState<PendingChange | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if user is admin
  if (!isLoading && (!user?.is_staff && !user?.is_superuser && user?.user_type !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  useEffect(() => {
    fetchPendingChanges();
  }, []);

  const fetchPendingChanges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pending-changes/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending changes');
      }

      const data = await response.json();
      setPendingChanges(data.results || data);
    } catch (error: any) {
      console.error('Failed to fetch pending changes:', error);
      setError(error.message || 'Failed to fetch pending changes');
      toast.error('Failed to load pending changes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (changeId: number) => {
    if (!reviewNotes.trim()) {
      toast.error('Please provide review notes before approving');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/pending-changes/${changeId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ review_notes: reviewNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve change');
      }

      toast.success('Change approved successfully');
      setSelectedChange(null);
      setReviewNotes('');
      fetchPendingChanges(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to approve change:', error);
      toast.error(error.message || 'Failed to approve change');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (changeId: number) => {
    if (!reviewNotes.trim()) {
      toast.error('Please provide review notes before rejecting');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/pending-changes/${changeId}/reject/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ review_notes: reviewNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject change');
      }

      toast.success('Change rejected successfully');
      setSelectedChange(null);
      setReviewNotes('');
      fetchPendingChanges(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to reject change:', error);
      toast.error(error.message || 'Failed to reject change');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'under_review':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'add':
        return 'Add New Entry';
      case 'edit':
        return 'Edit Entry';
      case 'delete':
        return 'Delete Entry';
      case 'photo_upload':
        return 'Photo Upload';
      case 'family_update':
        return 'Family Update';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredChanges = pendingChanges.filter(change => {
    const statusMatch = filterStatus === 'all' || change.status === filterStatus;
    const typeMatch = filterType === 'all' || change.change_type === filterType;
    return statusMatch && typeMatch;
  });

  const pendingCount = pendingChanges.filter(c => c.status === 'pending').length;
  const approvedCount = pendingChanges.filter(c => c.status === 'approved').length;
  const rejectedCount = pendingChanges.filter(c => c.status === 'rejected').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Changes Review</h1>
        <p className="text-gray-600">
          Review and approve or reject user-submitted changes to the directory.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <Clock className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>

          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Change Type
            </label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="add">Add Entry</option>
              <option value="edit">Edit Entry</option>
              <option value="delete">Delete Entry</option>
              <option value="photo_upload">Photo Upload</option>
              <option value="family_update">Family Update</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchPendingChanges}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Pending Changes List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pending changes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchPendingChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : filteredChanges.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No pending changes found.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChanges.map((change) => (
                  <tr key={change.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getChangeTypeLabel(change.change_type)}
                          </div>
                          {change.entry && (
                            <div className="text-sm text-gray-500">
                              {change.entry.name} • {change.entry.contact}
                            </div>
                          )}
                          {change.change_type === 'add' && change.new_data && (
                            <div className="text-sm text-gray-500">
                              {change.new_data.name} • {change.new_data.contact}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {change.requested_by.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {change.requested_by.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(change.status)}`}>
                        {getStatusIcon(change.status)}
                        <span className="ml-1">{change.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatDate(change.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {change.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedChange(change)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                          >
                            Review
                          </button>
                        </div>
                      )}
                      {change.status !== 'pending' && change.reviewed_by && (
                        <div className="text-sm text-gray-500">
                          Reviewed by {change.reviewed_by.username}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Review Change: {getChangeTypeLabel(selectedChange.change_type)}
              </h3>
            </div>

            <div className="px-6 py-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Change Details</h4>
                <div className="bg-gray-50 rounded-md p-3">
                  {selectedChange.change_type === 'add' && selectedChange.new_data && (
                    <div className="space-y-2">
                      <div><strong>Name:</strong> {selectedChange.new_data.name}</div>
                      <div><strong>Contact:</strong> {selectedChange.new_data.contact}</div>
                      <div><strong>Address:</strong> {selectedChange.new_data.address}</div>
                      {selectedChange.new_data.email && <div><strong>Email:</strong> {selectedChange.new_data.email}</div>}
                      {selectedChange.new_data.profession && <div><strong>Profession:</strong> {selectedChange.new_data.profession}</div>}
                    </div>
                  )}
                  {selectedChange.change_type === 'edit' && selectedChange.entry && (
                    <div className="space-y-2">
                      <div><strong>Entry ID:</strong> {selectedChange.entry.pid}</div>
                      <div><strong>Current Name:</strong> {selectedChange.entry.name}</div>
                      <div><strong>Current Contact:</strong> {selectedChange.entry.contact}</div>
                      <div><strong>Current Address:</strong> {selectedChange.entry.address}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="review-notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide notes about your decision..."
                  disabled={isProcessing}
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedChange(null);
                    setReviewNotes('');
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedChange.id)}
                  disabled={isProcessing || !reviewNotes.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApprove(selectedChange.id)}
                  disabled={isProcessing || !reviewNotes.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendingChangesPage;
