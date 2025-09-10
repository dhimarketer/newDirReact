// 2024-12-28: Enhanced Family Tree Window
// Implements Phase 2 of Family Tree Enhancement Plan
// Integrates connected family graph with search, filter, and navigation features

import React, { useState, useCallback, useEffect } from 'react';
import ConnectedFamilyGraph from './ConnectedFamilyGraph';
import FamilyTreeSearchFilter from './FamilyTreeSearchFilter';
import { GlobalPerson, GlobalRelationship } from '../../services/globalPersonRegistry';

interface EnhancedFamilyTreeWindowProps {
  rootPersonPid: number;
  onPersonClick?: (person: GlobalPerson) => void;
  onRelationshipClick?: (relationship: GlobalRelationship) => void;
  onClose?: () => void;
}

const EnhancedFamilyTreeWindow: React.FC<EnhancedFamilyTreeWindowProps> = ({
  rootPersonPid,
  onPersonClick,
  onRelationshipClick,
  onClose
}) => {
  const [maxDepth, setMaxDepth] = useState(3);
  const [showNuclearFamilyGrouping, setShowNuclearFamilyGrouping] = useState(true);
  const [showNavigationControls, setShowNavigationControls] = useState(true);
  const [showSearchFilter, setShowSearchFilter] = useState(true);
  const [filteredPersons, setFilteredPersons] = useState<GlobalPerson[]>([]);
  const [filteredRelationships, setFilteredRelationships] = useState<GlobalRelationship[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<GlobalPerson | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<GlobalRelationship | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  // Handle filtered data changes from search filter
  const handleFilteredDataChange = useCallback((
    persons: GlobalPerson[], 
    relationships: GlobalRelationship[]
  ) => {
    setFilteredPersons(persons);
    setFilteredRelationships(relationships);
  }, []);

  // Handle person selection
  const handlePersonClick = useCallback((person: GlobalPerson) => {
    setSelectedPerson(person);
    if (onPersonClick) {
      onPersonClick(person);
    }
  }, [onPersonClick]);

  // Handle relationship selection
  const handleRelationshipClick = useCallback((relationship: GlobalRelationship) => {
    setSelectedRelationship(relationship);
    if (onRelationshipClick) {
      onRelationshipClick(relationship);
    }
  }, [onRelationshipClick]);

  // Handle depth change
  const handleDepthChange = useCallback((newDepth: number) => {
    setMaxDepth(newDepth);
  }, []);

  // List view component
  const renderListView = () => (
    <div className="list-view">
      <div className="list-header">
        <h3>Family Members ({filteredPersons.length})</h3>
        <div className="list-controls">
          <button 
            onClick={() => setViewMode('graph')}
            className="view-toggle"
          >
            📊 Graph View
          </button>
        </div>
      </div>
      
      <div className="person-list">
        {filteredPersons.map(person => (
          <div 
            key={person.pid}
            className={`person-card ${selectedPerson?.pid === person.pid ? 'selected' : ''}`}
            onClick={() => handlePersonClick(person)}
          >
            <div className="person-info">
              <h4>{person.name}</h4>
              <p className="person-details">
                {person.age && <span>Age: {person.age}</span>}
                {person.gender && <span>Gender: {person.gender}</span>}
                {person.address && <span>Address: {person.address}</span>}
              </p>
            </div>
            <div className="person-actions">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Center on person in graph
                  setViewMode('graph');
                }}
                className="action-button"
              >
                📍 Center
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRelationships.length > 0 && (
        <div className="relationships-section">
          <h3>Relationships ({filteredRelationships.length})</h3>
          <div className="relationship-list">
            {filteredRelationships.map(rel => (
              <div 
                key={rel.id}
                className={`relationship-card ${selectedRelationship?.id === rel.id ? 'selected' : ''}`}
                onClick={() => handleRelationshipClick(rel)}
              >
                <div className="relationship-info">
                  <span className="person1">{rel.person1_name}</span>
                  <span className="relationship-type">{rel.relationship_type}</span>
                  <span className="person2">{rel.person2_name}</span>
                </div>
                {rel.family_group_name && (
                  <div className="family-group">
                    Family: {rel.family_group_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="enhanced-family-tree-window">
      {/* Header */}
      <div className="window-header">
        <div className="header-left">
          <h2>Enhanced Family Tree</h2>
          <span className="root-person">Root: Person ID {rootPersonPid}</span>
        </div>
        <div className="header-right">
          <div className="view-controls">
            <button 
              onClick={() => setViewMode('graph')}
              className={`view-button ${viewMode === 'graph' ? 'active' : ''}`}
            >
              📊 Graph
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            >
              📋 List
            </button>
          </div>
          <div className="feature-toggles">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showNuclearFamilyGrouping}
                onChange={(e) => setShowNuclearFamilyGrouping(e.target.checked)}
              />
              Family Groups
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showNavigationControls}
                onChange={(e) => setShowNavigationControls(e.target.checked)}
              />
              Navigation
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showSearchFilter}
                onChange={(e) => setShowSearchFilter(e.target.checked)}
              />
              Search
            </label>
          </div>
          {onClose && (
            <button onClick={onClose} className="close-button">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      {showSearchFilter && (
        <FamilyTreeSearchFilter
          persons={[]} // Will be populated by ConnectedFamilyGraph
          relationships={[]} // Will be populated by ConnectedFamilyGraph
          onFilteredDataChange={handleFilteredDataChange}
          onPersonSelect={handlePersonClick}
          onRelationshipSelect={handleRelationshipClick}
        />
      )}

      {/* Main Content */}
      <div className="main-content">
        {viewMode === 'graph' ? (
          <ConnectedFamilyGraph
            rootPersonPid={rootPersonPid}
            maxDepth={maxDepth}
            onPersonClick={handlePersonClick}
            onRelationshipClick={handleRelationshipClick}
            showNuclearFamilyGrouping={showNuclearFamilyGrouping}
            showNavigationControls={showNavigationControls}
          />
        ) : (
          renderListView()
        )}
      </div>

      {/* Selected Item Details */}
      {(selectedPerson || selectedRelationship) && (
        <div className="details-panel">
          <div className="details-header">
            <h3>Details</h3>
            <button 
              onClick={() => {
                setSelectedPerson(null);
                setSelectedRelationship(null);
              }}
              className="close-details"
            >
              ✕
            </button>
          </div>
          
          {selectedPerson && (
            <div className="person-details">
              <h4>{selectedPerson.name}</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>PID:</label>
                  <span>{selectedPerson.pid}</span>
                </div>
                {selectedPerson.age && (
                  <div className="detail-item">
                    <label>Age:</label>
                    <span>{selectedPerson.age} years</span>
                  </div>
                )}
                {selectedPerson.gender && (
                  <div className="detail-item">
                    <label>Gender:</label>
                    <span>{selectedPerson.gender}</span>
                  </div>
                )}
                {selectedPerson.address && (
                  <div className="detail-item">
                    <label>Address:</label>
                    <span>{selectedPerson.address}</span>
                  </div>
                )}
                {selectedPerson.island && (
                  <div className="detail-item">
                    <label>Island:</label>
                    <span>{selectedPerson.island}</span>
                  </div>
                )}
                {selectedPerson.contact && (
                  <div className="detail-item">
                    <label>Contact:</label>
                    <span>{selectedPerson.contact}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedRelationship && (
            <div className="relationship-details">
              <h4>Relationship</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Type:</label>
                  <span>{selectedRelationship.relationship_type}</span>
                </div>
                <div className="detail-item">
                  <label>From:</label>
                  <span>{selectedRelationship.person1_name}</span>
                </div>
                <div className="detail-item">
                  <label>To:</label>
                  <span>{selectedRelationship.person2_name}</span>
                </div>
                {selectedRelationship.family_group_name && (
                  <div className="detail-item">
                    <label>Family:</label>
                    <span>{selectedRelationship.family_group_name}</span>
                  </div>
                )}
                {selectedRelationship.notes && (
                  <div className="detail-item">
                    <label>Notes:</label>
                    <span>{selectedRelationship.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .enhanced-family-tree-window {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }
        .window-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .header-left h2 {
          margin: 0;
          font-size: 20px;
          color: #1f2937;
        }
        .root-person {
          font-size: 12px;
          color: #6b7280;
          margin-left: 8px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .view-controls {
          display: flex;
          gap: 4px;
        }
        .view-button {
          padding: 6px 12px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .view-button.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .feature-toggles {
          display: flex;
          gap: 12px;
        }
        .toggle-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #374151;
          cursor: pointer;
        }
        .close-button {
          padding: 6px 12px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .close-button:hover {
          background: #b91c1c;
        }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .list-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .list-header h3 {
          margin: 0;
          font-size: 16px;
          color: #374151;
        }
        .view-toggle {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .person-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .person-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .person-card:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }
        .person-card.selected {
          background: #dbeafe;
          border-color: #3b82f6;
        }
        .person-info h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #1f2937;
        }
        .person-details {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }
        .person-details span {
          margin-right: 12px;
        }
        .person-actions {
          display: flex;
          gap: 8px;
        }
        .action-button {
          padding: 4px 8px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
        }
        .action-button:hover {
          background: #059669;
        }
        .relationships-section {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
        }
        .relationships-section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #374151;
        }
        .relationship-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .relationship-card {
          padding: 8px 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .relationship-card:hover {
          background: #f3f4f6;
        }
        .relationship-card.selected {
          background: #dbeafe;
          border-color: #3b82f6;
        }
        .relationship-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .person1, .person2 {
          font-weight: 500;
          color: #1f2937;
        }
        .relationship-type {
          color: #6b7280;
          font-style: italic;
        }
        .family-group {
          font-size: 10px;
          color: #6b7280;
          margin-top: 4px;
        }
        .details-panel {
          position: absolute;
          top: 80px;
          right: 16px;
          width: 300px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 20;
        }
        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .details-header h3 {
          margin: 0;
          font-size: 14px;
          color: #374151;
        }
        .close-details {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: #6b7280;
        }
        .person-details, .relationship-details {
          padding: 16px;
        }
        .person-details h4, .relationship-details h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #1f2937;
        }
        .detail-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .detail-item label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
        }
        .detail-item span {
          font-size: 12px;
          color: #1f2937;
          text-align: right;
          max-width: 180px;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  );
};

export default EnhancedFamilyTreeWindow;
