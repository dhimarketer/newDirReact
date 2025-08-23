// 2025-01-27: Created comprehensive admin user management page with CRUD operations

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  Shield,
  UserCheck,
  UserX,
  Crown,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../store/authStore';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'basic' | 'premium' | 'admin' | 'moderator';
  relatedto: string;
  status: 'active' | 'inactive' | 'suspended';
  score: number;
  spam_score: number;
  warning_count: number;
  is_banned: boolean;
  join_date: string;
  is_staff: boolean;
  is_superuser: boolean;
  eula_agreed_date: string | null;
  last_spam_check: string | null;
}

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  user_type: 'basic' | 'premium' | 'admin' | 'moderator';
  first_name: string;
  last_name: string;
}

interface EditUserData {
  username: string;
  email: string;
  user_type: 'basic' | 'premium' | 'admin' | 'moderator';
  first_name: string;
  last_name: string;
  status: 'active' | 'inactive' | 'suspended';
  is_banned: boolean;
}

const AdminUserManagementPage: React.FC = () => {
  const { tokens, user, isAuthenticated } = useAuth();
  const token = tokens?.access;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    user_type: 'basic',
    first_name: '',
    last_name: ''
  });
  const [editUserData, setEditUserData] = useState<EditUserData>({
    username: '',
    email: '',
    user_type: 'basic',
    first_name: '',
    last_name: '',
    status: 'active',
    is_banned: false
  });
  const [scoreUpdateData, setScoreUpdateData] = useState({
    points: 0,
    reason: ''
  });
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: Failed to fetch users`);
      }

      const data = await response.json();
      setUsers(data.results || data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Create new user
  const createUser = async () => {
    try {
      if (!token) {
        setError('No authentication token available');
        return;
      }

      // Validate required fields
      if (!createUserData.username || !createUserData.email || !createUserData.password) {
        setError('Username, email, and password are required');
        return;
      }

      if (createUserData.password !== createUserData.password_confirm) {
        setError('Passwords do not match');
        return;
      }

      if (createUserData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      console.log('Creating user with data:', createUserData);
      
      const response = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createUserData)
      });

      console.log('Create user response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create user error:', errorData);
        throw new Error(errorData.detail || errorData.error || 'Failed to create user');
      }

      const result = await response.json();
      console.log('User created successfully:', result);

      setShowCreateModal(false);
      setCreateUserData({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        user_type: 'basic',
        first_name: '',
        last_name: ''
      });
      setError(null);
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  // Update user
  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      if (!token) {
        setError('No authentication token available');
        return;
      }

      // Validate required fields
      if (!editUserData.username || !editUserData.email) {
        setError('Username and email are required');
        return;
      }

      console.log('Updating user with data:', editUserData);
      
      const response = await fetch(`/api/users/${selectedUser.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editUserData)
      });

      console.log('Update user response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update user error:', errorData);
        throw new Error(errorData.detail || errorData.error || 'Failed to update user');
      }

      const result = await response.json();
      console.log('User updated successfully:', result);

      setShowEditModal(false);
      setSelectedUser(null);
      setError(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  // Deactivate user (soft delete)
  const deleteUser = async () => {
    if (!selectedUser) return;

    try {
      if (!token) {
        setError('No authentication token available');
        return;
      }

      console.log('Attempting to deactivate user:', selectedUser.username);

      const response = await fetch(`/api/users/${selectedUser.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Deactivate user response status:', response.status);
      console.log('Deactivate user response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Deactivate user error:', errorData);
        
        // Show detailed error message
        let errorMessage = 'Failed to deactivate user';
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        if (errorData.detail) {
          errorMessage += `: ${errorData.detail}`;
        }
        if (errorData.traceback) {
          console.error('Backend traceback:', errorData.traceback);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json().catch(() => ({}));
      console.log('Deactivate user success:', result);

      setShowDeleteModal(false);
      setSelectedUser(null);
      setError(null);
      fetchUsers();
    } catch (err) {
      console.error('Deactivate user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
    }
  };

  // Update user score
  const updateUserScore = async () => {
    if (!selectedUser) return;

    try {
      if (!token) {
        setError('No authentication token available');
        return;
      }

      const response = await fetch(`/api/users/${selectedUser.id}/update_score/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreUpdateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update score');
      }

      setShowScoreModal(false);
      setScoreUpdateData({ points: 0, reason: '' });
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update score');
    }
  };

  // Change user password
  const changeUserPassword = async () => {
    if (!selectedUser) return;

    if (!token) {
      setError('No authentication token available');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/change_password/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ new_password: passwordData.new_password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      setShowPasswordModal(false);
      setPasswordData({ new_password: '', confirm_password: '' });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  // Open edit modal
  const openEditModal = (user: User) => {
    console.log('openEditModal called with user:', user);
    setSelectedUser(user);
    setEditUserData({
      username: user.username,
      email: user.email,
      user_type: user.user_type,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      status: user.status,
      is_banned: user.is_banned
    });
    setShowEditModal(true);
    console.log('Edit modal state set to true');
    
    // Test alert to confirm state change
    setTimeout(() => {
      alert(`Modal state changed! showEditModal: ${true}, selectedUser: ${user.username}`);
    }, 100);
  };

  // Open score update modal
  const openScoreModal = (user: User) => {
    setSelectedUser(user);
    setScoreUpdateData({ points: 0, reason: '' });
    setShowScoreModal(true);
  };

  // Open password change modal
  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ new_password: '', confirm_password: '' });
    setShowPasswordModal(true);
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesUserType = !userTypeFilter || user.user_type === userTypeFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    
    return matchesSearch && matchesUserType && matchesStatus;
  });



  // Get user type icon
  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <Crown className="w-4 h-4 text-purple-600" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'premium':
        return <Star className="w-4 h-4 text-yellow-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string, isBanned: boolean) => {
    if (isBanned) return <UserX className="w-4 h-4 text-red-600" />;
    
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'suspended':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <UserCheck className="w-4 h-4 text-blue-600" />;
    }
  };

  useEffect(() => {
    console.log('useEffect triggered:', { isAuthenticated, token: !!token, user });
    if (isAuthenticated && token) {
      fetchUsers();
    }
  }, [isAuthenticated, token, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user has admin access
  if (!user?.is_staff && !user?.is_superuser && user?.user_type !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">
            User type: {user?.user_type}, Staff: {user?.is_staff?.toString()}, Superuser: {user?.is_superuser?.toString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">
          Manage user accounts, permissions, and access levels
        </p>
        

      </div>

      {/* Debug Info */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Debug: showEditModal={showEditModal.toString()}, showDeleteModal={showDeleteModal.toString()}, selectedUser={selectedUser ? selectedUser.username : 'null'}
            </p>
            {showEditModal && (
              <p className="text-sm text-red-600 font-bold mt-2">
                ⚠️ EDIT MODAL IS ACTIVE - You should see a red border overlay!
              </p>
            )}
            {showDeleteModal && (
              <p className="text-sm text-red-600 font-bold mt-2">
                ⚠️ DEACTIVATE MODAL IS ACTIVE - You should see a deactivation confirmation!
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal State Indicator */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h4 className="font-bold text-yellow-800">Modal State:</h4>
            <p className="text-sm text-yellow-700">
              showEditModal: <span className="font-mono bg-white px-2 py-1 rounded">{showEditModal.toString()}</span>
            </p>
            <p className="text-sm text-yellow-700">
              showDeactivateModal: <span className="font-mono bg-white px-2 py-1 rounded">{showDeleteModal.toString()}</span>
            </p>
            <p className="text-sm text-yellow-700">
              selectedUser: <span className="font-mono bg-white px-2 py-1 rounded">{selectedUser?.username || 'null'}</span>
            </p>
            <p className="text-sm text-yellow-700">
              Edit Modal should render: <span className="font-mono bg-white px-2 py-1 rounded">{(showEditModal && !!selectedUser).toString()}</span>
            </p>
            <p className="text-sm text-yellow-700">
              Deactivate Modal should render: <span className="font-mono bg-white px-2 py-1 rounded">{(showDeleteModal && !!selectedUser).toString()}</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Simple Modal Test */}
      {showEditModal && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'red',
            color: 'white',
            padding: '20px',
            fontSize: '24px',
            fontWeight: 'bold',
            zIndex: 10000,
            border: '5px solid yellow'
          }}
        >
          🚨 EDIT MODAL IS ACTIVE - RED BOX SHOULD BE VISIBLE! 🚨
        </div>
      )}
      
      {/* Deactivate Modal Test */}
      {showDeleteModal && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'orange',
            color: 'white',
            padding: '20px',
            fontSize: '24px',
            fontWeight: 'bold',
            zIndex: 10000,
            border: '5px solid purple'
          }}
        >
          🚨 DEACTIVATE MODAL IS ACTIVE - ORANGE BOX SHOULD BE VISIBLE! 🚨
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
          
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All User Types</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Create User Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
        
        {/* Test Modal Button */}
        <button
          onClick={() => {
            console.log('Test button clicked');
            setSelectedUser(users[0]);
            setShowEditModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ml-2"
        >
          Test Edit Modal
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {(user.first_name || user.last_name) && (
                          <div className="text-sm text-gray-400">
                            {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getUserTypeIcon(user.user_type)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {user.user_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(user.status, user.is_banned)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {user.is_banned ? 'Banned' : user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.score}</div>
                    {user.spam_score > 0 && (
                      <div className="text-xs text-red-500">
                        Spam: {user.spam_score}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.join_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log('Edit button clicked for user:', user);
                          openEditModal(user);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openScoreModal(user)}
                        className="text-green-600 hover:text-green-900"
                        title="Update Score"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openPasswordModal(user)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Change Password"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          console.log('Deactivate button clicked for user:', user);
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                          console.log('Deactivate modal state set to true');
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Deactivate User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || userTypeFilter || statusFilter 
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating a new user.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={createUserData.username}
                  onChange={(e) => setCreateUserData({...createUserData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={createUserData.email}
                  onChange={(e) => setCreateUserData({...createUserData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={createUserData.password}
                  onChange={(e) => setCreateUserData({...createUserData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={createUserData.password_confirm}
                  onChange={(e) => setCreateUserData({...createUserData, password_confirm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={createUserData.user_type}
                  onChange={(e) => setCreateUserData({...createUserData, user_type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  type="text"
                  placeholder="First Name (optional)"
                  value={createUserData.first_name}
                  onChange={(e) => setCreateUserData({...createUserData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Last Name (optional)"
                  value={createUserData.last_name}
                  onChange={(e) => setCreateUserData({...createUserData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            border: '10px solid red',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '5px solid blue',
              minWidth: '400px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'auto'
            }}
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User: {selectedUser.username}</h3>
              <p style={{color: 'red', fontWeight: 'bold', fontSize: '18px'}}>🚨 MODAL IS VISIBLE - RED BORDER SHOULD BE VISIBLE 🚨</p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={editUserData.username}
                  onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={editUserData.user_type}
                  onChange={(e) => setEditUserData({...editUserData, user_type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  type="text"
                  placeholder="First Name (optional)"
                  value={editUserData.first_name}
                  onChange={(e) => setEditUserData({...editUserData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Last Name (optional)"
                  value={editUserData.last_name}
                  onChange={(e) => setEditUserData({...editUserData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={editUserData.status}
                  onChange={(e) => setEditUserData({...editUserData, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editUserData.is_banned}
                    onChange={(e) => setEditUserData({...editUserData, is_banned: e.target.checked})}
                    className="mr-2"
                  />
                  Banned
                </label>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={updateUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate User Modal */}
      {showDeleteModal && selectedUser && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            border: '10px solid orange',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '5px solid purple',
              minWidth: '400px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'auto'
            }}
          >
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                <Trash2 className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Deactivate User</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to deactivate user "{selectedUser.username}"? This will set their status to inactive and they won't appear in searches, but their data will be preserved.
              </p>
              <p style={{color: 'orange', fontWeight: 'bold', fontSize: '18px'}}>🚨 DEACTIVATE MODAL IS VISIBLE - ORANGE BORDER SHOULD BE VISIBLE 🚨</p>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
                >
                  Deactivate User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Score Modal */}
      {showScoreModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Score for {selectedUser.username}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Score: {selectedUser.score}</label>
                  <input
                    type="number"
                    placeholder="Points to add/subtract"
                    value={scoreUpdateData.points}
                    onChange={(e) => setScoreUpdateData({...scoreUpdateData, points: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Reason for score change"
                  value={scoreUpdateData.reason}
                  onChange={(e) => setScoreUpdateData({...scoreUpdateData, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={updateUserScore}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Update Score
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password for {selectedUser.username}</h3>
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={changeUserPassword}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagementPage;
