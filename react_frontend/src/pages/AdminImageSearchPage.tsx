// 2025-01-27: Creating admin image search page for viewing all users with images as tiles

import React, { useState, useEffect } from 'react';
import { PhoneBookEntryWithImage } from '../types/directory';
import { directoryService } from '../services/directoryService';
import { useAuth } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { Image, Search, Filter, Eye, User, Phone, MapPin, Crown } from 'lucide-react';

interface AdminImageSearchPageProps {}

const AdminImageSearchPage: React.FC<AdminImageSearchPageProps> = () => {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<PhoneBookEntryWithImage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24); // Show more images per page
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PhoneBookEntryWithImage | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Search filters
  const [filters, setFilters] = useState({
    query: '',
    pep_only: false,
    atoll: '',
    island: '',
    party: '',
    profession: '',
    has_image: true // Always true for admin image search
  });

  // Check if user has admin access and sufficient points
  const isAdminUser = user?.is_staff || user?.is_superuser;
  const hasSufficientPoints = user && user.score >= 5; // Admin image search costs 5 points
  const canAccess = isAdminUser && hasSufficientPoints;

  // Load initial search results
  useEffect(() => {
    if (canAccess) {
      performSearch();
    }
  }, [canAccess]);

  // Perform admin image search
  const performSearch = async () => {
    if (!canAccess) {
      if (!isAdminUser) {
        toast.error('Admin access required.');
      } else if (!hasSufficientPoints) {
        toast.error(`Insufficient points. Admin image search costs 5 points. Current balance: ${user?.score || 0} points.`);
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await directoryService.premiumImageSearch({
        ...filters,
        page: currentPage,
        page_size: pageSize
      });
      
      setSearchResults(response.results);
      setTotalCount(response.total_count);
      
      if (response.total_count === 0) {
        toast.success('No users with images found for your search criteria');
      }
    } catch (error: any) {
      toast.error(error.message || 'Search failed. Please try again.');
      console.error('Admin image search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search submission
  const handleSearch = () => {
    setCurrentPage(1);
    performSearch();
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch();
  };

  // Handle image click to show details
  const handleImageClick = (entry: PhoneBookEntryWithImage) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      query: '',
      pep_only: false,
      atoll: '',
      island: '',
      party: '',
      profession: '',
      has_image: true
    });
    setCurrentPage(1);
  };

  // If not admin or insufficient points, show appropriate message
  if (!canAccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <Crown className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-red-900">
                {!isAdminUser ? 'Access Denied' : 'Insufficient Points'}
              </h1>
              <p className="text-red-700 mt-1">
                {!isAdminUser 
                  ? 'This page is only accessible to administrators.'
                  : `Admin image search costs 5 points. Current balance: ${user?.score || 0} points.`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Image Search</h1>
            <p className="text-gray-600">
              View all directory entries with images. Perfect for visual identification and verification.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {totalCount} users with images
            </div>
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Search Filters
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search Query */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Query
            </label>
            <input
              type="text"
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              placeholder="Name, contact, NID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Atoll */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atoll
            </label>
            <input
              type="text"
              value={filters.atoll}
              onChange={(e) => handleFilterChange('atoll', e.target.value)}
              placeholder="e.g., Male, Kaafu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Island */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Island
            </label>
            <input
              type="text"
              value={filters.island}
              onChange={(e) => handleFilterChange('island', e.target.value)}
              placeholder="e.g., Male, Hulhumale..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Party */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party
            </label>
            <input
              type="text"
              value={filters.party}
              onChange={(e) => handleFilterChange('party', e.target.value)}
              placeholder="e.g., MDP, PPM..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Profession */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profession
            </label>
            <input
              type="text"
              value={filters.profession}
              onChange={(e) => handleFilterChange('profession', e.target.value)}
              placeholder="e.g., Teacher, Doctor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* PEP Only Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pep_only"
              checked={filters.pep_only}
              onChange={(e) => handleFilterChange('pep_only', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="pep_only" className="ml-2 block text-sm text-gray-700">
              PEP (Politically Exposed Person) only
            </label>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Search Results - Image Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : searchResults.length > 0 ? (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Found {totalCount} entries with images
            </h3>
            <div className="text-sm text-gray-600">
              Page {currentPage} of {Math.ceil(totalCount / pageSize)}
            </div>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {searchResults.map((entry) => (
              <div
                key={entry.pid}
                onClick={() => handleImageClick(entry)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 relative">
                  {entry.image_url ? (
                    <img
                      src={entry.image_url}
                      alt={`${entry.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* PEP Badge */}
                  {entry.pep_status === '1' && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      PEP
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <h4 className="font-medium text-gray-900 text-sm truncate" title={entry.name}>
                    {entry.name}
                  </h4>
                  <div className="text-xs text-gray-500 space-y-1">
                    {entry.contact && (
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {entry.contact}
                      </div>
                    )}
                    {entry.atoll && entry.island && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {entry.atoll}, {entry.island}
                      </div>
                    )}
                    {entry.party && (
                      <div className="text-blue-600 font-medium">
                        {entry.party}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {Math.ceil(totalCount / pageSize) > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === Math.ceil(totalCount / pageSize)}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-500">
            Try adjusting your search filters or check if there are users with images in the system.
          </p>
        </div>
      )}

      {/* Image Detail Modal */}
      {showModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Profile Image</h4>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {selectedEntry.image_url ? (
                      <img
                        src={selectedEntry.image_url}
                        alt={`${selectedEntry.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-24 h-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{selectedEntry.name}</p>
                  </div>
                  
                  {selectedEntry.contact && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact</label>
                      <p className="text-sm text-gray-900">{selectedEntry.contact}</p>
                    </div>
                  )}
                  
                  {selectedEntry.nid && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">NID</label>
                      <p className="text-sm text-gray-900">{selectedEntry.nid}</p>
                    </div>
                  )}
                  
                  {selectedEntry.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedEntry.email}</p>
                    </div>
                  )}
                  
                  {selectedEntry.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="text-sm text-gray-900">{selectedEntry.address}</p>
                    </div>
                  )}
                  
                  {selectedEntry.atoll && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Atoll</label>
                      <p className="text-sm text-gray-900">{selectedEntry.atoll}</p>
                    </div>
                  )}
                  
                  {selectedEntry.island && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Island</label>
                      <p className="text-sm text-gray-900">{selectedEntry.island}</p>
                    </div>
                  )}
                  
                  {selectedEntry.party && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Party</label>
                      <p className="text-sm text-gray-900">{selectedEntry.party}</p>
                    </div>
                  )}
                  
                  {selectedEntry.profession && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Profession</label>
                      <p className="text-sm text-gray-900">{selectedEntry.profession}</p>
                    </div>
                  )}
                  
                  {selectedEntry.pep_status === '1' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">PEP Status</label>
                      <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        <Crown className="w-3 h-3 mr-1" />
                        Politically Exposed Person
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminImageSearchPage;
