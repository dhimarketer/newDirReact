// 2025-01-27: Creating enhanced HomePage component with mobile-first responsive design
// 2025-01-27: Updated to use new component utilities and improved styling
// 2025-01-27: Fixed data structure handling and added better error handling
// 2025-01-27: Updated to use correct Django analytics endpoint data structure
// 2025-01-27: Refactored to use Pico.css for lightweight, responsive, and professional styling
// 2025-01-29: REMOVED - Redundant Quick Actions section that duplicated sidebar navigation

import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { 
  UsersIcon, 
  ChartBarIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  StarIcon,
  TrendingUpIcon
} from 'lucide-react';
import { homePageService, HomePageStats } from '../services/homePageService';
import { STORAGE_KEYS } from '../utils/constants';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<HomePageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch home page statistics on component mount
  useEffect(() => {
    // 2025-01-28: ADDED - Check if there's a valid token before making API call
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (user && isAuthenticated && token) {
      loadHomePageStats();
    } else {
      // 2025-01-28: FIXED - Don't try to fetch stats if not authenticated
      console.log('HomePage: User not authenticated or no token, skipping stats fetch');
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  const loadHomePageStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('HomePage: Loading home page stats for user:', user?.username);
      const homeStats = await homePageService.getHomePageStats();
      console.log('HomePage: Stats loaded successfully:', homeStats);
      setStats(homeStats);
    } catch (error: any) {
      console.error('HomePage: Failed to load home page stats:', error);
      
      // 2025-01-28: FIXED - Handle 401 errors gracefully
      if (error.response?.status === 401) {
        console.log('HomePage: User not authorized, setting fallback stats');
        setError('Please log in to view statistics.');
      } else {
        setError('Failed to load statistics. Please try again later.');
      }
      
      // Set fallback stats
      setStats({
        overview: {
          total_users: 0,
          total_contacts: 0,
          total_families: 0,
          pending_changes: 0
        },
        users: {
          active_users: 0,
          banned_users: 0,
          average_score: 0
        },
        contacts_by_atoll: [],
        recent_activity: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format number with commas - with null safety
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="home-page space-y-5">
      {/* Hero Section */}
      <section className="page-header" aria-labelledby="welcome-heading">
        <div className="content-wrapper">
          {/* Welcome Section */}
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-3" aria-hidden="true">
              <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h1 id="welcome-heading" className="page-title">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">dirFinal</span>
            </h1>
            <p className="page-subtitle">
              Your modern directory and family management application
            </p>
          </div>

          {/* User Welcome Card */}
          {user && (
            <div className="welcome-card">
              <div className="flex items-center justify-center mb-3">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                  <UserCircleIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-semibold">
                    Welcome back, {user.first_name || user.username}! 👋
                  </h2>
                  <p>
                    You're logged in and ready to manage your directory and family connections.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="section">
        <div className="content-wrapper">
          <h2 className="section-title">Directory Statistics</h2>
          {error && (
            <div className="text-center mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="stats-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="stat-card">
                  <div className="animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="stats-grid">
              <article className="stat-card">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="stat-number">
                  {formatNumber(stats?.overview?.total_contacts)}
                </h3>
                <p className="stat-label">Total Contacts</p>
              </article>
              
              <article className="stat-card">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <UsersIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="stat-number">
                  {formatNumber(stats?.overview?.total_families)}
                </h3>
                <p className="stat-label">Family Groups</p>
              </article>
              
              <article className="stat-card">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUpIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="stat-number">
                  {formatNumber(stats?.users?.active_users)}
                </h3>
                <p className="stat-label">Active Users</p>
              </article>
              
              <article className="stat-card">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <StarIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="stat-number">
                  {formatNumber(stats?.overview?.total_users)}
                </h3>
                <p className="stat-label">Total Users</p>
              </article>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity Section */}
      {stats?.recent_activity && stats.recent_activity.length > 0 && (
        <section className="section">
          <div className="content-wrapper">
            <h2 className="section-title">Recent Activity</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {stats.recent_activity.slice(0, 6).map((activity) => (
                <article key={activity.id} className="card">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-sm font-medium">
                        {activity.user?.first_name?.[0] || activity.user?.username?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 mb-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{activity.user?.username || 'Unknown User'}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Admin Section */}
      {user?.is_staff && (
        <section className="section">
          <div className="content-wrapper">
            <h2 className="section-title">Admin Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <article className="action-card">
                <div className="flex items-center mb-3">
                  <div className="action-icon red">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <h3 className="action-title">Admin Dashboard</h3>
                </div>
                <p className="action-description">
                  Access administrative tools, user management, and system settings.
                </p>
                <a href="/admin" className="btn-primary">
                  Go to Admin
                  <ShieldCheckIcon className="w-4 h-4" />
                </a>
              </article>
              
              <article className="action-card">
                <div className="flex items-center mb-3">
                  <div className="action-icon indigo">
                    <ChartBarIcon className="w-6 h-6" />
                  </div>
                  <h3 className="action-title">System Analytics</h3>
                </div>
                <p className="action-description">
                  View system statistics, user activity, and performance metrics.
                </p>
                <a href="/admin" className="btn-primary">
                  View Analytics
                  <ChartBarIcon className="w-4 h-4" />
                </a>
              </article>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
