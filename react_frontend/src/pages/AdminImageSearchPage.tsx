// 2025-01-27: Admin image search page for viewing all users with images as tiles
// 2025-01-27: Added collapsible image placeholders to save space

import React, { useState, useEffect } from 'react';
import { PhoneBookEntryWithImage } from '../types/directory';
import { directoryService } from '../services/directoryService';
import { useAuth } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronUp, Image, Search, User } from 'lucide-react';

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
  const [showImages, setShowImages] = useState(true); // 2025-01-27: Added toggle for image visibility
  
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
      toast.error('Access denied. Admin privileges and sufficient points required.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await directoryService.adminImageSearch(filters, currentPage, pageSize);
      setSearchResults(response.results);
      setTotalCount(response.total_count);
      
      // Deduct points for search
      if (user) {
        // Note: Points deduction is handled by the backend
        console.log('Admin image search completed. Points deducted.');
      }
    } catch (error) {
      console.error('Error performing admin image search:', error);
      toast.error('Failed to perform admin image search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    performSearch();
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle image click to show modal
  const handleImageClick = (entry: PhoneBookEntryWithImage) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  // Toggle image visibility
  const toggleImages = () => {
    setShowImages(!showImages);
  };

  if (!canAccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Image className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            {!isAdminUser 
              ? 'Admin privileges required to access this page.'
              : 'Insufficient points for admin image search. You need at least 5 points.'
            }
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm rounded-lg">
            <span>Current Points: {user?.score || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Image Search</h1>
        <p className="text-gray-600">
          View and search through all directory entries with images. Admin access required.
        </p>
        <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-lg">
          <span>Cost: 5 points per search • Available Points: {user?.score || 0}</span>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Query</label>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                placeholder="Search by name, contact, or other details"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
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
            
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.pep_only}
                  onChange={(e) => handleFilterChange('pep_only', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">PEP Only</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  Searching...
                </span>
              ) : (
                <span className="flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  Search Images
                </span>
              )}
            </button>
            
            {/* Image Toggle Button */}
            <button
              type="button"
              onClick={toggleImages}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {showImages ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Images
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show Images
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <div>
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Search Results
              </h2>
              <p className="text-sm text-gray-500">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries with images
              </p>
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
                {/* Image Section - Collapsible */}
                {showImages && (
                  <div className={`${showImages ? 'h-32' : 'h-16'} bg-gray-100 relative transition-all duration-300 ease-in-out`}>
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
                )}
                
                {/* Info Section - Always visible */}
                <div className="p-3">
                  <h4 className="font-medium text-gray-900 text-sm truncate">{entry.name}</h4>
                  <p className="text-gray-600 text-xs truncate">{entry.contact}</p>
                  {entry.profession && (
                    <p className="text-gray-500 text-xs truncate">{entry.profession}</p>
                  )}
                </div>
              </div>
            ))}
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
                        <span>PEP</span>
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
