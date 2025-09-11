import React, { useState, useEffect } from 'react';
import { familyService } from '../../services/familyService';
import { FamilyGroup } from '../../types/family';

interface FamilyDeletionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'single' | 'bulk';
}

const FamilyDeletionManager: React.FC<FamilyDeletionManagerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'bulk'
}) => {
  const [currentMode, setCurrentMode] = useState<'single' | 'bulk'>(mode);
  const [familyId, setFamilyId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FamilyGroup[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletionSummary, setDeletionSummary] = useState<any>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState<string>('');

  // Drag functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });

  // Auto-search when query changes - disabled for now to prevent auth issues
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     if (searchQuery.trim()) {
  //       handleSearch();
  //     } else {
  //       setSearchResults([]);
  //     }
  //   }, 300);

  //   return () => clearTimeout(timeoutId);
  // }, [searchQuery]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setDialogPosition({
          x: e.clientX - dragOffset.x - window.innerWidth / 2,
          y: e.clientY - dragOffset.y - window.innerHeight / 2
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await familyService.searchFamilies(searchQuery);
      setSearchResults(response.results || []);
      setMessage({ type: 'success', text: `Found ${response.results?.length || 0} families` });
    } catch (error: any) {
      console.error('Error searching families:', error);
      setMessage({ type: 'error', text: `Error: ${error.message || 'Failed to search families'}` });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadAllFamilies = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await familyService.debugAllFamilies();
      if (response.success && response.families) {
        setSearchResults(response.families);
        setMessage({ type: 'success', text: `Loaded ${response.families.length} families` });
      } else {
        setMessage({ type: 'error', text: `Error: ${response.error || 'Failed to load families'}` });
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Error getting all families:', error);
      setMessage({ type: 'error', text: `Error: ${error.message || 'Failed to load families'}` });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleDelete = async () => {
    if (!familyId.trim()) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await familyService.deleteUpdatedFamilies(parseInt(familyId));
      setMessage({ type: 'success', text: `Family ${familyId} deleted successfully` });
      setFamilyId('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error deleting family:', error);
      setMessage({ type: 'error', text: `Error: ${error.message || 'Failed to delete family'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFamilySelect = (familyId: number, selected: boolean) => {
    const newSelected = new Set(selectedFamilies);
    if (selected) {
      newSelected.add(familyId);
    } else {
      newSelected.delete(familyId);
    }
    setSelectedFamilies(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFamilies.size === searchResults.length && searchResults.length > 0) {
      setSelectedFamilies(new Set());
    } else {
      setSelectedFamilies(new Set(searchResults.map(f => f.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFamilies.size === 0) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const familyIds = Array.from(selectedFamilies);
      const summary = await familyService.deleteMultipleFamilies(familyIds);
      
      setDeletionSummary(summary);
      setSelectedFamilies(new Set());
      setSearchResults([]);
      setMessage({ 
        type: 'success', 
        text: `Bulk deletion completed. ${summary.successful} successful, ${summary.failed} failed.` 
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error in bulk delete:', error);
      setMessage({ type: 'error', text: `Error: ${error.message || 'Failed to delete families'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteAllConfirm !== 'DELETE ALL FAMILIES') return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const summary = await familyService.deleteAllFamilies();
      setDeletionSummary(summary);
      setMessage({ 
        type: 'success', 
        text: `All families deleted. ${summary.successful} successful, ${summary.failed} failed.` 
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error deleting all families:', error);
      setMessage({ type: 'error', text: `Error: ${error.message || 'Failed to delete all families'}` });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('FamilyDeletionManager render:', { isOpen, currentMode, mode });
  
  if (!isOpen) return null;

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        style={{ 
          backgroundColor: 'white',
          width: '500px',
          height: '600px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '20px',
          position: 'relative',
          zIndex: 1000000,
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: 'black' }}>
          Family Manager
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setCurrentMode('single')}
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              backgroundColor: currentMode === 'single' ? 'black' : 'white',
              color: currentMode === 'single' ? 'white' : 'black',
              border: '1px solid black',
              cursor: 'pointer'
            }}
          >
            Single
          </button>
          <button
            onClick={() => setCurrentMode('bulk')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentMode === 'bulk' ? 'black' : 'white',
              color: currentMode === 'bulk' ? 'white' : 'black',
              border: '1px solid black',
              cursor: 'pointer'
            }}
          >
            Bulk
          </button>
        </div>

        {/* Single Family Deletion */}
        {currentMode === 'single' && (
          <div style={{ border: '2px solid blue', padding: '10px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Delete Single Family</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="number"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
                placeholder="Family ID"
                style={{
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  width: '120px'
                }}
              />
              <button
                onClick={handleSingleDelete}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'black',
                  color: 'white',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Bulk Family Deletion */}
        {currentMode === 'bulk' && (
          <div style={{ border: '2px solid blue', padding: '10px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Search Families</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search families..."
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'black',
                  color: 'white',
                  border: 'none',
                  cursor: (isLoading || !searchQuery.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || !searchQuery.trim()) ? 0.5 : 1
                }}
              >
                {isLoading ? '...' : 'Search'}
              </button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <button
                onClick={handleLoadAllFamilies}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: '1px solid black',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? 'Loading...' : 'Load All Families'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{ border: '1px solid #ccc', marginBottom: '10px' }}>
                <div style={{ padding: '10px', borderBottom: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={selectedFamilies.size === searchResults.length && searchResults.length > 0}
                        onChange={handleSelectAll}
                      />
                      <span style={{ fontWeight: 'bold' }}>All ({searchResults.length})</span>
                    </div>
                    {selectedFamilies.size > 0 && (
                      <button
                        onClick={() => setSelectedFamilies(new Set())}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#666',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ padding: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                    {searchResults.map((family) => (
                      <div
                        key={family.id}
                        onClick={() => handleFamilySelect(family.id, !selectedFamilies.has(family.id))}
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          cursor: 'pointer',
                          backgroundColor: selectedFamilies.has(family.id) ? '#e0e0e0' : 'white',
                          borderRadius: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            type="checkbox"
                            checked={selectedFamilies.has(family.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFamilySelect(family.id, e.target.checked);
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {family.name || `F${family.id}`}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {family.address || 'No address'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {selectedFamilies.size > 0 && `${selectedFamilies.size} selected`}
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => setSelectedFamilies(new Set())}
                  disabled={selectedFamilies.size === 0}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    color: 'black',
                    border: '1px solid #ccc',
                    cursor: selectedFamilies.size === 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedFamilies.size === 0 ? 0.5 : 1
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedFamilies.size === 0 || isLoading}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'black',
                    color: 'white',
                    border: 'none',
                    cursor: (selectedFamilies.size === 0 || isLoading) ? 'not-allowed' : 'pointer',
                    opacity: (selectedFamilies.size === 0 || isLoading) ? 0.5 : 1
                  }}
                >
                  {isLoading ? '...' : `Delete ${selectedFamilies.size}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {message && (
          <div style={{
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px'
          }}>
            {message.text}
          </div>
        )}

        {/* Close Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};

export default FamilyDeletionManager;