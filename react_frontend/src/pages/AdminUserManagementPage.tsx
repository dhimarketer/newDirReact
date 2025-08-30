// 2025-01-27: Created comprehensive admin user management page with CRUD operations

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { apiService } from '../services/api';

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

// Comprehensive Modal Component with guaranteed visibility
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  console.log('Modal component called with:', { isOpen, title, size });
  
  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }

  console.log('Modal is open, rendering portal');
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl'
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all`}>
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-10"
              >
                <span className="sr-only">Close</span>
                <XCircle className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const AdminUserManagementPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const token = apiService.getAuthToken();
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
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteData, setPromoteData] = useState({
    user_type: 'basic'
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await apiService.getUsers();
      setUsers(response.data.results || response.data);
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

      const response = await apiService.registerUser(createUserData);

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        console.error('Create user error:', errorData);
        throw new Error(errorData.detail || errorData.error || 'Failed to create user');
      }

      const result = response.data;

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

      // Prepare the data for update - only include fields that can be updated
      const updateData = {
        username: editUserData.username,
        email: editUserData.email,
        first_name: editUserData.first_name,
        last_name: editUserData.last_name,
        user_type: editUserData.user_type,
        status: editUserData.status,
        is_banned: editUserData.is_banned
      };
      
      const response = await apiService.updateUser(selectedUser.id, updateData);

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        console.error('Update user error:', errorData);
        throw new Error(errorData.detail || errorData.error || 'Failed to update user');
      }

      const result = response.data;

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

      const response = await apiService.deleteUser(selectedUser.id);

      if (response.status !== 200 && response.status !== 204) {
        const errorData = response.data || {};
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

      const result = response.data || {};

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

      if (scoreUpdateData.points === 0) {
        setError('Please enter a non-zero score value');
        return;
      }

      if (!scoreUpdateData.reason.trim()) {
        setError('Please provide a reason for the score change');
        return;
      }

      const response = await apiService.updateUserScore(selectedUser.id, scoreUpdateData);

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        console.error('Update score error:', errorData);
        throw new Error(errorData.detail || errorData.error || 'Failed to update score');
      }

      const result = response.data;

      setShowScoreModal(false);
      setSelectedUser(null);
      setScoreUpdateData({ points: 0, reason: '' });
      setError(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating score:', err);
      setError(err instanceof Error ? err.message : 'Failed to update score');
    }
  };

  // Change user password
  const changeUserPassword = async () => {
    if (!selectedUser) return;

    try {
      if (!token) {
        setError('No authentication token available');
        return;
      }

      if (!passwordData.new_password || !passwordData.confirm_password) {
        setError('Please fill in both password fields');
        return;
      }

      if (passwordData.new_password !== passwordData.confirm_password) {
        setError('Passwords do not match');
        return;
      }

      if (passwordData.new_password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      const response = await apiService.changeUserPassword(selectedUser.id, { new_password: passwordData.new_password });

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        console.error('Change password error:', errorData);
        throw new Error(errorData.detail || errorData.error || 'Failed to change password');
      }

      const result = response.data;

      setShowPasswordModal(false);
      setSelectedUser(null);
      setPasswordData({ new_password: '', confirm_password: '' });
      setError(null);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  // Open edit modal
  const openEditModal = (user: User) => {
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

  // Open promote/demote modal
  const openPromoteModal = (user: User) => {
    setSelectedUser(user);
    setPromoteData({ user_type: user.user_type });
    setShowPromoteModal(true);
  };

  // Handle user activation
  const handleActivateUser = async (user: User) => {
    try {
      if (!token) {
        setError('No authentication token available');
        return;
      }

      const response = await apiService.activateUser(user.id);

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        throw new Error(errorData.detail || errorData.error || 'Failed to activate user');
      }

      setError(null);
      fetchUsers();
    } catch (err) {
      console.error('Error activating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to activate user');
    }
  };

  // Handle user ban
  const handleBanUser = async (user: User) => {
    try {
      if (!token) {
        setError('No authentication token available');
        return;
      }

      const response = await apiService.banUser(user.id);

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        throw new Error(errorData.detail || errorData.error || 'Failed to ban user');
      }

      setError(null);
      fetchUsers();
    } catch (err) {
      console.error('Error banning user:', err);
      setError(err instanceof Error ? err.message : 'Failed to ban user');
    }
  };

  // Handle user unban
  const handleUnbanUser = async (user: User) => {
    try {
      if (!token) {
        setError('No authentication token available');
        return;
      }

      const response = await apiService.unbanUser(user.id);

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        throw new Error(errorData.detail || errorData.error || 'Failed to unban user');
      }

      setError(null);
      fetchUsers();
    } catch (err) {
      console.error('Error unbanning user:', err);
      setError(err instanceof Error ? err.message : 'Failed to unban user');
    }
  };

  // Handle user type change
  const handleChangeUserType = async () => {
    if (!selectedUser) return;

    try {
      if (!token) {
        setError('No authentication token available');
        return;
      }

      const response = await apiService.changeUserType(selectedUser.id, promoteData.user_type);

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        throw new Error(errorData.detail || errorData.error || 'Failed to change user type');
      }

      setShowPromoteModal(false);
      setSelectedUser(null);
      setError(null);
      fetchUsers();
    } catch (err) {
      console.error('Error changing user type:', err);
      setError(err instanceof Error ? err.message : 'Failed to change user type');
    }
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

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
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

      {/* User Statistics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.status === 'active' && !u.is_banned).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Banned Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.is_banned).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Premium Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.user_type === 'premium').length}
              </p>
            </div>
          </div>
        </div>
      </div>

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
                  Credit Points
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
                    <div className="flex items-center space-x-2">
                      {getUserTypeIcon(user.user_type)}
                      <span className={`text-sm font-medium capitalize px-2 py-1 rounded-full ${
                        user.user_type === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.user_type === 'moderator'
                          ? 'bg-blue-100 text-blue-800'
                          : user.user_type === 'premium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.user_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(user.status, user.is_banned)}
                      <div>
                        <span className={`text-sm font-medium capitalize px-2 py-1 rounded-full ${
                          user.is_banned 
                            ? 'bg-red-100 text-red-800' 
                            : user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : user.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_banned ? 'Banned' : user.status}
                        </span>
                        {user.is_banned && (
                          <div className="text-xs text-red-600 mt-1">Account suspended</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="text-lg font-semibold text-gray-900">{user.score}</div>
                      {user.spam_score > 0 && (
                        <div className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                          Spam: {user.spam_score}
                        </div>
                      )}
                    </div>
                    {user.warning_count > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        ⚠️ {user.warning_count} warning{user.warning_count !== 1 ? 's' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.join_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      {/* Edit User */}
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* Update Score */}
                      <button
                        onClick={() => openScoreModal(user)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Update Score"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      
                      {/* Change Password */}
                      <button
                        onClick={() => openPasswordModal(user)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                        title="Change Password"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      
                      {/* Activate/Deactivate */}
                      {user.status === 'inactive' ? (
                        <button
                          onClick={() => handleActivateUser(user)}
                          className="text-emerald-600 hover:text-emerald-900 p-1 rounded hover:bg-emerald-50"
                          title="Activate User"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                          title="Deactivate User"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Ban/Unban */}
                      {user.is_banned ? (
                        <button
                          onClick={() => handleUnbanUser(user)}
                          className="text-emerald-600 hover:text-emerald-900 p-1 rounded hover:bg-emerald-50"
                          title="Unban User"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBanUser(user)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Ban User"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Promote/Demote */}
                      <button
                        onClick={() => openPromoteModal(user)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="Change User Type"
                      >
                        <Crown className="w-4 h-4" />
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
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New User"
        >
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
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit User: ${selectedUser.username}`}
        >
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
        </Modal>
      )}

      {/* Deactivate User Modal */}
      {showDeleteModal && selectedUser && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Deactivate User"
        >
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
            <Trash2 className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-4">Deactivate User</h3>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to deactivate user "{selectedUser.username}"? This will set their status to inactive and they won't appear in searches, but their data will be preserved.
          </p>
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
        </Modal>
      )}

      {/* Update Score Modal */}
      {showScoreModal && selectedUser && (
        <Modal
          isOpen={showScoreModal}
          onClose={() => setShowScoreModal(false)}
          title={`Update Score for ${selectedUser.username}`}
        >
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
        </Modal>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title={`Change Password for ${selectedUser.username}`}
        >
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
        </Modal>
      )}

      {/* Promote/Demote User Modal */}
      {showPromoteModal && selectedUser && (
        <Modal
          isOpen={showPromoteModal}
          onClose={() => setShowPromoteModal(false)}
          title={`Change User Type for ${selectedUser.username}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current User Type: <span className="font-semibold capitalize">{selectedUser.user_type}</span>
              </label>
              <select
                value={promoteData.user_type}
                onChange={(e) => setPromoteData({...promoteData, user_type: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Changing user types affects permissions and access levels. 
                Admin users have full system access.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowPromoteModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleChangeUserType}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              Update User Type
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUserManagementPage;
