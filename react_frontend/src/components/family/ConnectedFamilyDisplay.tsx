// 2025-01-30: Connected Family Display component for showing multiple related family groups
import React, { useState, useEffect } from 'react';
import { ConnectedFamily, ConnectedFamilyResult } from '../../services/connectedFamilyService';
import { FamilyModal } from './index';
import ClassicFamilyTree from './ClassicFamilyTree';
import { familyService } from '../../services/familyService';

interface ConnectedFamilyDisplayProps {
  connectedFamilyResult: ConnectedFamilyResult;
  currentAddress: string;
  currentIsland: string;
  onClose: () => void;
}

interface FamilyDisplayData {
  connectedFamily: ConnectedFamily;
  members: any[];
  relationships: any[];
  isLoading: boolean;
  error: string | null;
}

const ConnectedFamilyDisplay: React.FC<ConnectedFamilyDisplayProps> = ({
  connectedFamilyResult,
  currentAddress,
  currentIsland,
  onClose
}) => {
  const [familyDisplayData, setFamilyDisplayData] = useState<FamilyDisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFamilyModal, setSelectedFamilyModal] = useState<{address: string, island: string} | null>(null);

  useEffect(() => {
    loadAllFamilyData();
  }, [connectedFamilyResult]);

  const loadAllFamilyData = async () => {
    setIsLoading(true);
    
    try {
      const familyDataPromises = connectedFamilyResult.connectedFamilies.map(async (connectedFamily) => {
        const familyData: FamilyDisplayData = {
          connectedFamily,
          members: [],
          relationships: [],
          isLoading: true,
          error: null
        };

        try {
          console.log('📡 Loading family data for:', connectedFamily.familyGroup.address);
          
          const result = await familyService.getFamilyByAddress(
            connectedFamily.familyGroup.address || '',
            connectedFamily.familyGroup.island || ''
          );

          if (result.success && result.data) {
            familyData.members = result.data.members || [];
            familyData.relationships = result.data.relationships || [];
            familyData.isLoading = false;
            
            console.log('✅ Loaded family data:', {
              address: connectedFamily.familyGroup.address,
              members: familyData.members.length,
              relationships: familyData.relationships.length
            });
          } else {
            familyData.error = result.error || 'Failed to load family data';
            familyData.isLoading = false;
          }
        } catch (error) {
          console.error('❌ Error loading family data:', error);
          familyData.error = 'Failed to load family data';
          familyData.isLoading = false;
        }

        return familyData;
      });

      const allFamilyData = await Promise.all(familyDataPromises);
      setFamilyDisplayData(allFamilyData);
      
    } catch (error) {
      console.error('❌ Error loading connected family data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openFamilyModal = (address: string, island: string) => {
    setSelectedFamilyModal({ address, island });
  };

  const closeFamilyModal = () => {
    setSelectedFamilyModal(null);
    // Reload family data after modal closes (in case changes were made)
    loadAllFamilyData();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Connected Families</h3>
            <p className="text-sm text-gray-600">Loading {connectedFamilyResult.connectedFamilies.length} family groups...</p>
          </div>
        </div>
      </div>
    );
  }

  const originalFamilies = familyDisplayData.filter(fd => fd.connectedFamily.connectionType === 'original');
  const derivedFamilies = familyDisplayData.filter(fd => fd.connectedFamily.connectionType === 'derived');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Connected Family Groups</h2>
              <p className="text-blue-100 text-sm">
                {connectedFamilyResult.connectedFamilies.length} families • {connectedFamilyResult.totalMembers} total members • Base: {connectedFamilyResult.baseAddress}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-700 rounded-lg px-3 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Original Families Section */}
          {originalFamilies.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Original Family ({originalFamilies.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {originalFamilies.map((familyData, index) => (
                  <FamilyDisplayCard
                    key={`original-${index}`}
                    familyData={familyData}
                    onOpenModal={openFamilyModal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Derived Families Section */}
          {derivedFamilies.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Connected Families ({derivedFamilies.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {derivedFamilies.map((familyData, index) => (
                  <FamilyDisplayCard
                    key={`derived-${index}`}
                    familyData={familyData}
                    onOpenModal={openFamilyModal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Connection Summary */}
          {connectedFamilyResult.hasConnectedFamilies && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Family Connections</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {originalFamilies.map(fd => (
                  <div key={fd.connectedFamily.familyGroup.id}>
                    <span className="font-medium">{fd.connectedFamily.familyGroup.address}</span> (Original family)
                  </div>
                ))}
                {derivedFamilies.map(fd => (
                  <div key={fd.connectedFamily.familyGroup.id}>
                    <span className="font-medium">{fd.connectedFamily.familyGroup.address}</span> 
                    {fd.connectedFamily.parentName && <span className="text-gray-500"> → Created from {fd.connectedFamily.parentName}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Family Modal */}
      {selectedFamilyModal && (
        <FamilyModal
          isOpen={true}
          onClose={closeFamilyModal}
          address={selectedFamilyModal.address}
          island={selectedFamilyModal.island}
        />
      )}
    </div>
  );
};

interface FamilyDisplayCardProps {
  familyData: FamilyDisplayData;
  onOpenModal: (address: string, island: string) => void;
}

const FamilyDisplayCard: React.FC<FamilyDisplayCardProps> = ({ familyData, onOpenModal }) => {
  const { connectedFamily, members, relationships, isLoading, error } = familyData;
  const family = connectedFamily.familyGroup;

  const handleOpenModal = () => {
    onOpenModal(family.address || '', family.island || '');
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Family Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{family.name || 'Unnamed Family'}</h4>
          <p className="text-sm text-gray-600">{family.address}</p>
          {connectedFamily.connectionType === 'derived' && connectedFamily.parentName && (
            <p className="text-xs text-green-600 mt-1">
              Created from {connectedFamily.parentName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            connectedFamily.connectionType === 'original' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {connectedFamily.connectionType === 'original' ? 'Original' : 'Connected'}
          </span>
        </div>
      </div>

      {/* Family Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span>👥 {members.length} members</span>
        <span>🔗 {relationships.length} relationships</span>
        <span>📅 {new Date(family.created_at).toLocaleDateString()}</span>
      </div>

      {/* Family Tree Preview or Loading/Error State */}
      <div className="border border-gray-100 rounded-lg p-3 mb-3 bg-gray-50">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Loading family tree...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        ) : members.length > 0 ? (
          <div style={{ height: '150px', overflow: 'hidden' }}>
            <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '142%', height: '142%' }}>
              <ClassicFamilyTree
                familyMembers={members}
                relationships={relationships}
                useMultiRowLayout={false}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">No family data available</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleOpenModal}
          className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
        {members.length > 0 && (
          <button className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Download
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectedFamilyDisplay;
