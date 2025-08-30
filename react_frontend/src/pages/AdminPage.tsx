// 2025-01-27: Creating placeholder AdminPage component for Phase 2 React frontend

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { Users, Settings, Shield, Database, BarChart3, FileText, UserCheck } from 'lucide-react';

const AdminPage: React.FC = () => {
  const { user, isLoading } = useAuth();

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

  const adminFeatures = [
    {
      title: 'User Management',
      description: 'Manage user accounts, permissions, and access levels',
      icon: Users,
      href: '/admin/users',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Directory Management',
      description: 'Manage phone book entries, images, and data integrity',
      icon: Database,
      href: '/admin/directory',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'System Settings',
      description: 'Configure application settings, search fields, and preferences',
      icon: Settings,
      href: '/settings',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Analytics & Reports',
      description: 'View system usage statistics and generate reports',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Audit Logs',
      description: 'Review system activity and user actions for security',
      icon: FileText,
      href: '/admin/audit',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Moderation',
      description: 'Review and moderate user-generated content and reports',
      icon: UserCheck,
      href: '/admin/moderation',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      title: 'Pending Changes',
      description: 'Review and approve user-submitted directory changes',
      icon: FileText,
      href: '/admin/pending-changes',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Security',
      description: 'Manage security settings, API keys, and access controls',
      icon: Shield,
      href: '/admin/security',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage system settings, users, and administrative functions.
        </p>
      </div>

      {/* Admin Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Link
              key={index}
              to={feature.href}
              className="block group"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg ${feature.color} text-white mr-4`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                  Access feature
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                <Link to="/admin/users" className="text-blue-600 hover:text-blue-800">
                  View All
                </Link>
              </p>
            </div>
          </div>
        </div>



        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Database className="w-4 h-4 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Directory Entries</p>
              <p className="text-2xl font-bold text-gray-900">
                <Link to="/directory" className="text-purple-600 hover:text-purple-800">
                  View Directory
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Shield className="w-4 h-4 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admin Users</p>
              <p className="text-2xl font-bold text-gray-900">
                <Link to="/admin/users" className="text-orange-600 hover:text-orange-800">
                  Manage Users
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
