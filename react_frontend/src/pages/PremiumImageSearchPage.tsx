// 2025-01-27: Creating premium image search page for PEP profiles with image grid layout

import React, { useState, useEffect } from 'react';
import { PhoneBookEntryWithImage } from '../types/directory';
import { directoryService } from '../services/directoryService';
import { useAuth } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface PremiumImageSearchPageProps {}

const PremiumImageSearchPage: React.FC<PremiumImageSearchPageProps> = () => {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<PhoneBookEntryWithImage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
    profession: ''
  });

  // Check if user has sufficient points for image search
  const hasSufficientPoints = user && (user.score ?? 0) >= 10; // Minimum 10 points required for image search

  // Debug: Log current user state
  console.log('PremiumImageSearchPage - Current user:', user);
  console.log('PremiumImageSearchPage - hasSufficientPoints:', hasSufficientPoints);
  console.log('PremiumImageSearchPage - User score:', user?.score);

  // Load initial search results
  useEffect(() => {
    if (hasSufficientPoints) {
      performSearch();
    }
  }, [hasSufficientPoints]);

  // Perform premium image search
  const performSearch = async () => {
    if (!hasSufficientPoints) {
      toast.error(`Insufficient points. You need at least 10 points to use image search. Current balance: ${user?.score || 0} points.`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await directoryService.premiumImageSearch({
        ...filters,
        page: currentPage,
        page_size: pageSize
      });
      
      console.log('Search response:', response);
      console.log('Search results:', response.results);
      console.log('First result image_url:', response.results[0]?.image_url);
      
      setSearchResults(response.results);
      setTotalCount(response.total_count);
      
      if (response.total_count === 0) {
        toast.success('No results found for your search criteria');
      }
    } catch (error: any) {
      toast.error(error.message || 'Search failed. Please try again.');
      console.error('Premium image search error:', error);
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

  // Handle image click to show profile details
  const handleImageClick = (entry: PhoneBookEntryWithImage) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedEntry(null);
  };

  // If not premium user, show upgrade message
  if (!hasSufficientPoints) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <div className="text-yellow-600 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">Premium Feature</h2>
            <p className="text-yellow-700 mb-6">
              Image search with PEP (Politically Exposed Person) filtering is a premium feature.
              Upgrade your account to access advanced search capabilities.
            </p>
            <button className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors">
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Navigation Hint */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700">
              You're using <strong>Premium Image Search</strong> - a feature available to premium users.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/search"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Basic Search
            </Link>
            <span className="text-blue-400">|</span>
            <Link
              to="/directory"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Premium Image Search</h1>
        <p className="text-gray-600">
          Search through directory entries with images, with special focus on PEP (Politically Exposed Person) profiles.
        </p>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Query</label>
            <input
              type="text"
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              placeholder="Search by name, contact, NID, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PEP Only</label>
            <select
              value={filters.pep_only.toString()}
              onChange={(e) => handleFilterChange('pep_only', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="false">All Profiles</option>
              <option value="true">PEP Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atoll</label>
            <input
              type="text"
              value={filters.atoll}
              onChange={(e) => handleFilterChange('atoll', e.target.value)}
              placeholder="Enter atoll"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Island</label>
            <input
              type="text"
              value={filters.island}
              onChange={(e) => handleFilterChange('island', e.target.value)}
              placeholder="Enter island"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party</label>
            <input
              type="text"
              value={filters.party}
              onChange={(e) => handleFilterChange('party', e.target.value)}
              placeholder="Enter political party"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
            <input
              type="text"
              value={filters.profession}
              onChange={(e) => handleFilterChange('profession', e.target.value)}
              placeholder="Enter profession"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {searchResults.map((entry) => {
              console.log(`Rendering entry ${entry.pid}: image_url = ${entry.image_url}`);
              return (
              <div
                key={entry.pid}
                onClick={() => handleImageClick(entry)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 relative">
                  {entry.image_url ? (
                    <img
                      src={entry.image_url}
                      alt={entry.name}
                      className="w-full h-full object-cover"
                      onLoad={() => console.log(`Image loaded successfully: ${entry.image_url}`)}
                      onError={(e) => {
                        console.error(`Image failed to load: ${entry.image_url}`, e);
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-avatar.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* PEP Badge */}
                  {entry.pep_status === 'yes' && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      PEP
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <h4 className="font-medium text-gray-900 text-sm truncate">{entry.name}</h4>
                  <p className="text-gray-600 text-xs truncate">{entry.contact}</p>
                  {entry.profession && (
                    <p className="text-gray-500 text-xs truncate">{entry.profession}</p>
                  )}
                </div>
              </div>
            );
            })}
          </div>

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="mt-6 flex justify-center">
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
                        page === currentPage
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
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
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
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria to find entries with images.
          </p>
        </div>
      )}

      {/* Profile Detail Modal */}
      {showModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedEntry.name}</h2>
                <button
                  onClick={closeModal}
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
                  {selectedEntry.image_url ? (
                    <img
                      src={selectedEntry.image_url}
                      alt={selectedEntry.name}
                      className="w-full rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>

                {/* Profile Details */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact</label>
                    <p className="text-gray-900">{selectedEntry.contact}</p>
                  </div>
                  
                  {selectedEntry.nid && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">National ID</label>
                      <p className="text-gray-900">{selectedEntry.nid}</p>
                    </div>
                  )}
                  
                  {selectedEntry.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900">{selectedEntry.address}</p>
                    </div>
                  )}
                  
                  {selectedEntry.atoll && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Atoll</label>
                      <p className="text-gray-900">{selectedEntry.atoll}</p>
                    </div>
                  )}
                  
                  {selectedEntry.island && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Island</label>
                      <p className="text-gray-900">{selectedEntry.island}</p>
                    </div>
                  )}
                  
                  {selectedEntry.party && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Political Party</label>
                      <p className="text-gray-900">{selectedEntry.party}</p>
                    </div>
                  )}
                  
                  {selectedEntry.profession && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Profession</label>
                      <p className="text-gray-900">{selectedEntry.profession}</p>
                    </div>
                  )}
                  
                  {selectedEntry.age && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Age</label>
                      <p className="text-gray-900">{selectedEntry.age} years</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">PEP Status</label>
                    <p className={`font-medium ${
                      selectedEntry.pep_status === 'yes' ? 'text-red-600' : 
                      selectedEntry.pep_status === 'no' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {selectedEntry.pep_status_display}
                    </p>
                  </div>
                  
                  {selectedEntry.remark && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Remarks</label>
                      <p className="text-gray-900">{selectedEntry.remark}</p>
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

export default PremiumImageSearchPage;
