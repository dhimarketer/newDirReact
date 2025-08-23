// 2025-01-27: Creating enhanced HomePage component with mobile-first responsive design

import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { Link } from 'react-router-dom';
import { 
  SearchIcon, 
  UsersIcon, 
  BookOpenIcon, 
  ChartBarIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  StarIcon,
  TrendingUpIcon,
  Image,
  Crown
} from 'lucide-react';
import { homePageService, HomePageStats } from '../services/homePageService';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<HomePageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch home page statistics on component mount
  useEffect(() => {
    if (user && isAuthenticated) {
      loadHomePageStats();
    }
  }, [user, isAuthenticated]);

  const loadHomePageStats = async () => {
    try {
      setIsLoading(true);
      console.log('HomePage: Loading home page stats for user:', user?.username);
      const homeStats = await homePageService.getHomePageStats();
      console.log('HomePage: Stats loaded successfully:', homeStats);
      setStats(homeStats);
    } catch (error) {
      console.error('HomePage: Failed to load home page stats:', error);
      // Keep loading state false so user can see fallback UI
    } finally {
      setIsLoading(false);
    }
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-x-hidden">
      {/* Hero Section - Mobile First */}
      <section className="px-4 py-8 sm:px-6 lg:px-8 max-w-full" aria-labelledby="welcome-heading">
        <div className="max-w-7xl mx-auto w-full">
          {/* Welcome Section */}
          <header className="text-center py-8 sm:py-12 lg:py-16">
            <div className="mb-8 sm:mb-10 lg:mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 sm:mb-8" aria-hidden="true">
                <BookOpenIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h1 id="welcome-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">dirFinal</span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                Your modern directory and family management application
              </p>
            </div>

            {/* User Welcome Card */}
            {user && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 sm:p-8 max-w-md mx-auto mb-8 sm:mb-12" role="status" aria-live="polite">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4" aria-hidden="true">
                    <UserCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Welcome back, {user.first_name || user.username}! 👋
                    </h2>
                    <p className="text-sm text-gray-600">
                      You're logged in and ready to manage your directory and family connections.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </header>

          {/* Quick Actions Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16" aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className="sr-only">Quick Actions</h2>
            {/* Search Directory */}
            <Link to="/search" className="group" aria-label="Search Directory - Find people, businesses, and organizations">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 lg:p-8 group-hover:scale-105 transition-transform duration-300 h-full hover:shadow-xl">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mb-3 sm:mb-4 mx-auto" aria-hidden="true">
                  <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 text-center">Search Directory</h3>
                <p className="text-gray-600 text-center text-xs sm:text-sm lg:text-base mb-4 sm:mb-6">
                  Find people, businesses, and organizations in your directory with advanced search capabilities.
                </p>
                <div className="text-center">
                  <span className="inline-flex items-center text-blue-600 font-medium text-xs sm:text-sm group-hover:text-blue-700">
                    Start Searching
                    <svg className="ml-1 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>

            {/* Manage Family */}
            <Link to="/family" className="group" aria-label="Manage Family - Create and manage family groups">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 lg:p-8 group-hover:scale-105 transition-transform duration-300 h-full hover:shadow-xl">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mb-3 sm:mb-4 mx-auto" aria-hidden="true">
                  <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 text-center">Manage Family</h3>
                <p className="text-gray-600 text-center text-xs sm:text-sm lg:text-base mb-4 sm:mb-6">
                  Create and manage family groups, track relationships, and build comprehensive family trees.
                </p>
                <div className="text-center">
                  <span className="inline-flex items-center text-green-600 font-medium text-xs sm:text-sm group-hover:text-green-700">
                    View Family
                    <svg className="ml-1 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>

            {/* Browse Directory */}
            <Link to="/directory" className="group" aria-label="Browse Directory - Explore complete directory with filtering">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 lg:p-8 group-hover:scale-105 transition-transform duration-300 h-full hover:shadow-xl">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg mb-3 sm:mb-4 mx-auto" aria-hidden="true">
                  <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 text-center">Browse Directory</h3>
                <p className="text-gray-600 text-center text-xs sm:text-sm lg:text-base mb-4 sm:mb-6">
                  Explore the complete directory with advanced filtering, sorting, and categorization options.
                </p>
                <div className="text-center">
                  <span className="inline-flex items-center text-purple-600 font-medium text-xs sm:text-sm group-hover:text-purple-700">
                    Browse Now
                    <svg className="ml-1 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </section>

          {/* Premium Feature Banner */}
          <section className="mb-8 sm:mb-12 lg:mb-16" aria-labelledby="premium-features-heading">
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 text-white">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full mb-6">
                  <Image className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h2 id="premium-features-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                  Premium Image Search
                </h2>
                <p className="text-lg sm:text-xl text-purple-100 mb-6 max-w-3xl mx-auto">
                  Discover our advanced image search functionality with PEP (Politically Exposed Person) filtering. 
                  Search through profiles with images and get comprehensive results.
                </p>
                
                {user?.user_type === 'premium' ? (
                  <Link
                    to="/premium-image-search"
                    className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Image className="w-5 h-5 mr-2" />
                    Access Premium Image Search
                    <Crown className="w-5 h-5 ml-2 text-purple-500" />
                  </Link>
                ) : (
                  <div className="space-y-4">
                    <p className="text-purple-200 text-sm">
                      Upgrade to Premium to unlock this powerful feature
                    </p>
                    <Link
                      to="/search"
                      className="inline-flex items-center px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors duration-200 border border-white/30"
                    >
                      <SearchIcon className="w-5 h-5 mr-2" />
                      Try Basic Search
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Stats Section - Mobile First */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 sm:p-8 w-full mb-12 sm:mb-16" aria-labelledby="stats-heading">
            <header className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg mb-4" aria-hidden="true">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h2 id="stats-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">Directory Statistics</h2>
              <p className="text-gray-600 mt-2">Real-time insights into your directory</p>
            </header>
            
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center group w-full">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 lg:p-6 w-full">
                      <div className="animate-pulse">
                        <div className="h-6 sm:h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
                {/* Total Entries */}
                <div className="text-center group w-full">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 lg:p-6 group-hover:scale-105 transition-transform duration-300 w-full hover:shadow-lg">
                    <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">
                      {formatNumber(stats?.overview?.total_contacts || 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Entries</div>
                  </div>
                </div>

                {/* Total Users */}
                <div className="text-center group w-full">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 lg:p-6 group-hover:scale-105 transition-transform duration-300 w-full hover:shadow-lg">
                    <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-green-600 mb-1 sm:mb-2">
                      {formatNumber(stats?.overview?.total_users || 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Users</div>
                  </div>
                </div>

                {/* Family Groups */}
                <div className="text-center group w-full">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 lg:p-6 group-hover:scale-105 transition-transform duration-300 w-full hover:shadow-lg">
                    <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">
                      {formatNumber(stats?.overview?.total_families || 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">Family Groups</div>
                  </div>
                </div>

                {/* Active Users */}
                <div className="text-center group w-full">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 sm:p-4 lg:p-6 group-hover:scale-105 transition-transform duration-300 w-full hover:shadow-lg">
                    <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-orange-600 mb-1 sm:mb-2">
                      {formatNumber(stats?.users?.active_users || 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">Active Users</div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Recent Activity Section - Mobile First */}
          <section className="w-full" aria-labelledby="recent-activity-heading">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 sm:p-8 w-full">
              <h3 id="recent-activity-heading" className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
              {isLoading ? (
                <div className="space-y-3 sm:space-y-4 w-full" role="status" aria-live="polite">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center p-3 sm:p-4 bg-gray-50/50 rounded-lg w-full">
                      <div className="animate-pulse w-full">
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-3 sm:space-y-4 w-full" role="list" aria-label="Recent activities">
                  {stats.recent_activity.slice(0, 5).map((activity, index) => (
                    <div key={activity.id} className="flex items-center p-3 sm:p-4 bg-gray-50/50 rounded-lg w-full" role="listitem">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 sm:mr-3 flex-shrink-0" aria-hidden="true"></div>
                      <span className="text-xs sm:text-sm text-gray-600 flex-1">{activity.description}</span>
                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8" role="status" aria-live="polite">
                  <p className="text-sm sm:text-base text-gray-500">No recent activity to display</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
