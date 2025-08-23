// 2025-01-27: Enhanced ProfilePage component with profile editing, password change, and score donation features

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { profileService, ChangePasswordData, DonatePointsData, ProfileUpdateData } from '../services/profile';
import { toast } from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateProfile: updateAuthProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'donate'>('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileUpdateData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  // Donation form state
  const [donationForm, setDonationForm] = useState<DonatePointsData>({
    recipient_username: '',
    points: 0,
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!profileForm.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!profileForm.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!profileForm.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!passwordForm.current_password) {
      newErrors.current_password = 'Current password is required';
    }
    
    if (!passwordForm.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordForm.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters long';
    }
    
    if (!passwordForm.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDonationForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!donationForm.recipient_username?.trim()) {
      newErrors.recipient_username = 'Recipient username is required';
    }
    
    if (!donationForm.points || donationForm.points <= 0) {
      newErrors.points = 'Points must be greater than 0';
    } else if (user && donationForm.points > user.score) {
      newErrors.points = `Insufficient points. You have ${user.score} points available`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) return;
    
    setIsLoading(true);
    try {
      const updatedProfile = await profileService.updateProfile(profileForm);
      await updateAuthProfile(updatedProfile);
      toast.success('Profile updated successfully!');
      setErrors({});
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setIsLoading(true);
    try {
      await profileService.changePassword(passwordForm);
      toast.success('Password changed successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setErrors({});
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDonationForm()) return;
    
    setIsLoading(true);
    try {
      const result = await profileService.donatePoints(donationForm);
      toast.success(result.message);
      setDonationForm({
        recipient_username: '',
        points: 0,
      });
      setErrors({});
      // Refresh user data to get updated score
      await updateAuthProfile({ score: result.new_balance });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to donate points');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (form: string, field: string, value: string | number) => {
    if (form === 'profile') {
      setProfileForm(prev => ({ ...prev, [field]: value }));
    } else if (form === 'password') {
      setPasswordForm(prev => ({ ...prev, [field]: value }));
    } else if (form === 'donate') {
      setDonationForm(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">
              {user.first_name?.[0] || user.username[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.username
              }
            </h2>
            <p className="text-gray-600">@{user.username}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {user.user_type}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.score} points
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Profile Info' },
            { id: 'password', label: 'Change Password' },
            { id: 'donate', label: 'Donate Points' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Info Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={profileForm.first_name}
                  onChange={(e) => handleInputChange('profile', 'first_name', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.first_name ? 'border-red-300' : ''
                  }`}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  value={profileForm.last_name}
                  onChange={(e) => handleInputChange('profile', 'last_name', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.last_name ? 'border-red-300' : ''
                  }`}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={profileForm.email}
                  onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : ''
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  id="current_password"
                  value={passwordForm.current_password}
                  onChange={(e) => handleInputChange('password', 'current_password', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.current_password ? 'border-red-300' : ''
                  }`}
                />
                {errors.current_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                )}
              </div>

              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="new_password"
                  value={passwordForm.new_password}
                  onChange={(e) => handleInputChange('password', 'new_password', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.new_password ? 'border-red-300' : ''
                  }`}
                />
                <p className="mt-1 text-sm text-gray-500">Password must be at least 8 characters long</p>
                {errors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => handleInputChange('password', 'confirm_password', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.confirm_password ? 'border-red-300' : ''
                  }`}
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Donate Points Tab */}
      {activeTab === 'donate' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Donate Points</h3>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Your current balance:</strong> {user.score} points
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Share your points with other users to help them access premium features.
            </p>
          </div>
          
          <form onSubmit={handleDonationSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="recipient_username" className="block text-sm font-medium text-gray-700">
                  Recipient Username
                </label>
                <input
                  type="text"
                  id="recipient_username"
                  value={donationForm.recipient_username}
                  onChange={(e) => handleInputChange('donate', 'recipient_username', e.target.value)}
                  placeholder="Enter the username of the person you want to donate to"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.recipient_username ? 'border-red-300' : ''
                  }`}
                />
                {errors.recipient_username && (
                  <p className="mt-1 text-sm text-red-600">{errors.recipient_username}</p>
                )}
              </div>

              <div>
                <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                  Points to Donate
                </label>
                <input
                  type="number"
                  id="points"
                  min="1"
                  max={user.score}
                  value={donationForm.points || ''}
                  onChange={(e) => handleInputChange('donate', 'points', parseInt(e.target.value) || 0)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.points ? 'border-red-300' : ''
                  }`}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum: {user.score} points
                </p>
                {errors.points && (
                  <p className="mt-1 text-sm text-red-600">{errors.points}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading || user.score === 0}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing Donation...' : 'Donate Points'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
