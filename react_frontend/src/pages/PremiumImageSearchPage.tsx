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
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
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
      console.log('=== PREMIUM IMAGE SEARCH PAGE DEBUG ===');
      console.log('Calling directoryService.premiumImageSearch...');
      
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
        page_size: pageSize,
      });
      
      console.log('Response received in page:', response);
      console.log('Results count:', response.results?.length || 0);
      if (response.results && response.results.length > 0) {
        console.log('First result in page:', response.results[0]);
        console.log('First result fields:', Object.keys(response.results[0]));
      }
      console.log('=== END PREMIUM IMAGE SEARCH PAGE DEBUG ===');
      
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
  const handleImageClick = async (entry: PhoneBookEntryWithImage) => {
    console.log('=== IMAGE CLICK DEBUG ===');
    console.log('Entry clicked:', entry);
    console.log('Entry fields:', Object.keys(entry));
    console.log('Entry values:', entry);
    console.log('=== END IMAGE CLICK DEBUG ===');
    
    try {
      // First set the basic entry to show the modal immediately
      setSelectedEntry(entry);
      setShowModal(true);
      
      // Then fetch complete person details using PID
      if (entry.pid) {
        console.log('Fetching complete details for PID:', entry.pid);
        setIsLoadingDetails(true);
        
        try {
          const completeDetails = await directoryService.getPersonDetails(entry.pid);
          console.log('Complete details received:', completeDetails);
          
          // Update the modal with complete information
          console.log('Updating modal with complete details:', completeDetails);
          console.log('Complete details fields:', Object.keys(completeDetails));
          console.log('Atoll data:', completeDetails.atoll, completeDetails.atoll_name);
          console.log('Island data:', completeDetails.island, completeDetails.island_name);
          console.log('Party data:', completeDetails.party, completeDetails.party_name);
          
          // 2025-01-29: CRITICAL FIX - Force modal update with complete details
          console.log('Setting selectedEntry to complete details...');
          setSelectedEntry(completeDetails);
          
          // 2025-01-29: DEBUG - Verify state update
          setTimeout(() => {
            console.log('=== STATE UPDATE VERIFICATION ===');
            console.log('Current selectedEntry after update:', completeDetails);
            console.log('Modal should now show complete details');
            console.log('=== END STATE UPDATE VERIFICATION ===');
          }, 100);
        } finally {
          setIsLoadingDetails(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch complete person details:', error);
      // Keep the basic entry if detailed fetch fails
    }
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
                {/* 2025-01-29: Add randomization indicator */}
                <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Randomized Order
                </span>
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
        <div 
          key={`modal-${selectedEntry.pid}-${selectedEntry.atoll_name || 'basic'}`}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <div 
            className="bg-white rounded-lg overflow-hidden"
            style={{
              width: '750px',
              height: '600px',
              minWidth: '750px',
              maxWidth: '750px',
              minHeight: '600px',
              maxHeight: '600px',
              flexShrink: 0,
              flexGrow: 0
            }}
          >
            <div className="h-full flex flex-col">
              {/* Header - Optimized for minimal vertical space */}
              <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-gray-900">Profile Details</h3>
                  {isLoadingDetails && (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner w-3 h-3"></div>
                      <span className="text-xs text-gray-600">Loading complete details...</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors p-1"
                  style={{
                    width: '24px',
                    height: '24px',
                    minWidth: '24px',
                    maxWidth: '24px',
                    minHeight: '24px',
                    maxHeight: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Content - Two column layout with image top right */}
              <div className="flex-1 p-3 overflow-hidden">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {/* Left column - Details - Compact 3-column grid layout */}
                  <div className="pr-2">
                    {/* 3-Column Grid Layout for Compact Display */}
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                      {/* Column 1 - Basic Info */}
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Name</label>
                          <p className="text-xs text-gray-900 break-words text-left leading-tight">{selectedEntry.name}</p>
                        </div>
                        
                        {selectedEntry.contact && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 text-left mb-1">Contact</label>
                            <p className="text-xs text-gray-900 break-all text-left leading-tight">{selectedEntry.contact}</p>
                          </div>
                        )}
                        
                        {selectedEntry.nid && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 text-left mb-1">NID</label>
                            <p className="text-xs text-gray-900 break-all text-left leading-tight">{selectedEntry.nid}</p>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">DOB</label>
                          <p className="text-xs text-gray-900 text-left leading-tight">{selectedEntry.DOB || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Age</label>
                          <p className="text-xs text-gray-900 text-left leading-tight">{selectedEntry.age ? `${selectedEntry.age}y` : 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Gender</label>
                          <p className="text-xs text-gray-900 capitalize text-left leading-tight">{selectedEntry.gender || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {/* Column 2 - Location Info */}
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Address</label>
                          <p className="text-xs text-gray-900 break-words text-left leading-tight">{selectedEntry.address || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Street</label>
                          <p className="text-xs text-gray-900 break-words text-left leading-tight">{selectedEntry.street || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Ward</label>
                          <p className="text-xs text-gray-900 text-left leading-tight">{selectedEntry.ward || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Island</label>
                          <p className="text-xs text-gray-900 text-left leading-tight">
                            {selectedEntry.island_name || 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Atoll</label>
                          <p className="text-xs text-gray-900 text-left leading-tight">
                            {selectedEntry.atoll_name || 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Party</label>
                          <p className="text-xs text-gray-900 break-words text-left leading-tight">
                            {selectedEntry.party_name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Column 3 - Additional Info */}
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Profession</label>
                          <p className="text-xs text-gray-900 break-words text-left leading-tight">{selectedEntry.profession || 'N/A'}</p>
                        </div>
                        
                        {selectedEntry.email && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 text-left mb-1">Email</label>
                            <p className="text-xs text-gray-900 break-all text-left leading-tight">{selectedEntry.email}</p>
                          </div>
                        )}
                        
                        {selectedEntry.remark && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 text-left mb-1">Remarks</label>
                            <p className="text-xs text-gray-900 break-words text-left leading-tight">{selectedEntry.remark}</p>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Status</label>
                          <p className="text-xs text-gray-900 text-left leading-tight">{selectedEntry.status || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">Batch</label>
                          <p className="text-xs text-gray-900 text-left leading-tight">{selectedEntry.batch || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 text-left mb-1">PEP Status</label>
                          <div className="inline-flex items-center px-1 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            <span>PEP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom Row - Extended Info */}
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 text-left mb-1">Additional Info</label>
                        <p className="text-xs text-gray-900 break-words text-left leading-tight">{selectedEntry.extra || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 text-left mb-1">Change Status</label>
                        <p className="text-xs text-gray-900 text-left leading-tight">{selectedEntry.change_status || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 text-left mb-1">Requested By</label>
                        <p className="text-xs text-gray-900 text-left leading-tight">{selectedEntry.requested_by || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 text-left mb-1">Family Group ID</label>
                        <p className="text-xs text-gray-900 text-left leading-tight">{selectedEntry.family_group_id || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {/* Debug section - Compact version */}
                    <div className="mt-4 p-2 bg-gray-100 rounded border">
                      <label className="block text-xs font-medium text-gray-700 text-left mb-1">Debug Info</label>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600">
                        <div>Source: {selectedEntry?.atoll_name ? 'Complete API' : 'Basic Results'}</div>
                        <div>Updated: {new Date().toLocaleTimeString()}</div>
                        <div>Island: {selectedEntry?.island_name || 'N/A'}</div>
                        <div>Atoll: {selectedEntry?.atoll_name || 'N/A'}</div>
                        <div>Party: {selectedEntry?.party_name || 'N/A'}</div>
                        <div>Address: {selectedEntry?.address || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right column - Image - Aligned to top left */}
                  <div className="flex flex-col items-start justify-start h-full">
                    <div 
                      className="bg-gray-100 rounded-lg overflow-hidden shadow-lg"
                      style={{
                        width: '280px',
                        height: '400px',
                        minWidth: '280px',
                        maxWidth: '280px',
                        minHeight: '400px',
                        maxHeight: '400px',
                        flexShrink: 0,
                        flexGrow: 0
                      }}
                    >
                      {selectedEntry.image_url ? (
                        <img
                          src={selectedEntry.image_url}
                          alt={selectedEntry.name}
                          className="w-full h-full object-cover"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            console.error(`Image failed to load: ${selectedEntry.image_url}`, e);
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-20 h-20 text-gray-400" />
                        </div>
                      )}
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
