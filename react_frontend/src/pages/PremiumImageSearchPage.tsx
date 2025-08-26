// 2025-01-28: MODIFIED - 4-column grid with 2"x2" images and infinite scroll instead of pagination
// 2025-01-27: Creating premium image search page for PEP profiles with image grid layout
// 2025-01-27: Added collapsible image placeholders to save space

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PhoneBookEntryWithImage } from '../types/directory';
import { directoryService } from '../services/directoryService';
import { useAuth } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { User } from 'lucide-react';

interface PremiumImageSearchPageProps {}

const PremiumImageSearchPage: React.FC<PremiumImageSearchPageProps> = () => {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<PhoneBookEntryWithImage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(40); // Load 40 images per batch for infinite scroll
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<PhoneBookEntryWithImage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  
  // Check if user has sufficient points for image search
  const hasSufficientPoints = user && (user.score ?? 0) >= 10; // Minimum 10 points required for image search

  // Load initial search results - only active PEP entries with images
  useEffect(() => {
    if (hasSufficientPoints) {
      performSearch(true); // Reset search
    }
  }, [hasSufficientPoints]);

  // Infinite scroll observer setup
  useEffect(() => {
    if (loadingRef.current && hasMore && !isLoading) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading) {
            loadMoreImages();
          }
        },
        { threshold: 0.1 }
      );
      
      observerRef.current = observer;
      observer.observe(loadingRef.current);
      
      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [hasMore, isLoading]);

  // Perform premium image search - only active PEP entries with images
  const performSearch = async (reset: boolean = false) => {
    if (!hasSufficientPoints) {
      toast.error('Insufficient points for image search. You need at least 10 points.');
      return;
    }

    if (reset) {
      setSearchResults([]);
      setCurrentPage(1);
      setHasMore(true);
    }

    setIsLoading(true);
    try {
      // Search for active PEP entries with images only
      const response = await directoryService.premiumImageSearch({
        query: '',
        pep_only: true, // Only PEP entries
        status: 'active', // Only active entries
        atoll: '',
        island: '',
        party: '',
        profession: '',
        page: reset ? 1 : currentPage,
        page_size: pageSize
      });
      
      if (reset) {
        setSearchResults(response.results);
      } else {
        setSearchResults(prev => [...prev, ...response.results]);
      }
      
      setTotalCount(response.total_count);
      setHasMore(response.results.length === pageSize);
      
      // Deduct points for search
      if (user) {
        // Note: Points deduction is handled by the backend
        console.log('Image search completed. Points deducted.');
      }
    } catch (error) {
      console.error('Error performing premium image search:', error);
      toast.error('Failed to perform image search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load more images for infinite scroll
  const loadMoreImages = useCallback(() => {
    if (!isLoading && hasMore) {
      setCurrentPage(prev => prev + 1);
      performSearch(false);
    }
  }, [isLoading, hasMore]);

  // Handle image click to show modal
  const handleImageClick = (entry: PhoneBookEntryWithImage) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  if (!hasSufficientPoints) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Insufficient Points</h3>
          <p className="text-gray-600">
            You need at least 10 points to access the image search feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PEP Image Search</h1>
        <p className="text-gray-600">
          Browse active Politically Exposed Person (PEP) profiles with images. Click on any image to view details.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && searchResults.length === 0 && (
        <div className="text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PEP images...</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <div>
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                PEP Images
              </h2>
              <p className="text-sm text-gray-500">
                Showing {searchResults.length} of {totalCount} active PEP entries with images
              </p>
            </div>
          </div>

          {/* 4-Column Image Grid with square images that fill the page width */}
          <div className="image-grid">
            {searchResults.map((entry) => (
              <div
                key={entry.pid}
                onClick={() => handleImageClick(entry)}
                className="image-grid-item cursor-pointer hover:opacity-80 transition-opacity bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Pure Image - No borders, no backgrounds, no styling */}
                {entry.image_url ? (
                  <img
                    src={entry.image_url}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Image failed to load: ${entry.image_url}`, e);
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <User className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Infinite Scroll Loading Indicator */}
          {hasMore && (
            <div ref={loadingRef} className="mt-8 text-center py-4">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  <span className="text-gray-600">Loading more images...</span>
                </div>
              ) : (
                <div className="text-gray-500">Scroll down to load more images</div>
              )}
            </div>
          )}

          {/* End of results indicator */}
          {!hasMore && searchResults.length > 0 && (
            <div className="mt-8 text-center py-4">
              <div className="text-gray-500">All images loaded</div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PEP images found</h3>
          <p className="text-gray-600">
            No active PEP entries with images were found.
          </p>
        </div>
      )}

      {/* Profile Detail Modal */}
      {showModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Profile Details</h3>
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
                        alt={selectedEntry.name}
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">PEP Status</label>
                    <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      <span>PEP</span>
                    </div>
                  </div>
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
