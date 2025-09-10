// 2024-12-28: Family Tree Demo Page
// Showcases Phase 2 connected family graph features
// Provides interactive demo of global person registry and multi-generational family trees

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectedFamilyGraph from '../components/family/ConnectedFamilyGraph';
import EnhancedFamilyTreeWindow from '../components/family/EnhancedFamilyTreeWindow';
import FamilyTreeSearchFilter from '../components/family/FamilyTreeSearchFilter';
import { GlobalPerson, GlobalRelationship } from '../services/globalPersonRegistry';

const FamilyTreeDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPersonPid, setSelectedPersonPid] = useState<number | null>(null);
  const [showEnhancedWindow, setShowEnhancedWindow] = useState(false);
  const [demoData, setDemoData] = useState<{
    persons: GlobalPerson[];
    relationships: GlobalRelationship[];
  }>({ persons: [], relationships: [] });

  // Load demo data on component mount
  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      // Load some sample family data for demonstration
      const response = await fetch('/api/global-relationships/?limit=50');
      const data = await response.json();
      
      // Extract persons and relationships from the response
      const persons: GlobalPerson[] = data.persons || [];
      const relationships: GlobalRelationship[] = data.relationships || [];
      
      setDemoData({ persons, relationships });
      
      // Set the first person as the default root
      if (persons.length > 0) {
        setSelectedPersonPid(persons[0].pid);
      }
    } catch (error) {
      console.error('Failed to load demo data:', error);
    }
  };

  const handlePersonClick = (person: GlobalPerson) => {
    console.log('Person clicked:', person);
    setSelectedPersonPid(person.pid);
  };

  const handleRelationshipClick = (relationship: GlobalRelationship) => {
    console.log('Relationship clicked:', relationship);
  };

  const handleOpenEnhancedWindow = () => {
    setShowEnhancedWindow(true);
  };

  const handleCloseEnhancedWindow = () => {
    setShowEnhancedWindow(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Family Tree Demo</h1>
              <p className="mt-2 text-gray-600">
                Explore the new Phase 2 connected family graph features with global person registry and multi-generational support.
              </p>
            </div>
            <button
              onClick={() => navigate('/family')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Family Discovery
            </button>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Phase 2 Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">🌐</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Global Person Registry</h3>
                <p className="text-sm text-gray-600">Each person has a unique global ID across all family contexts</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">🌳</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Connected Family Graph</h3>
                <p className="text-sm text-gray-600">View all connected families as a single interactive graph</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-medium">🔍</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Advanced Search & Filter</h3>
                <p className="text-sm text-gray-600">Search and filter by name, age, gender, and relationship type</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm font-medium">👥</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Multi-Generational Support</h3>
                <p className="text-sm text-gray-600">Navigate across generations with nuclear family grouping</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-medium">🎯</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Navigation Controls</h3>
                <p className="text-sm text-gray-600">Center on person, show path to root, zoom controls</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 text-sm font-medium">⚡</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Dagre Auto-Layout</h3>
                <p className="text-sm text-gray-600">Automatic graph layout with hierarchical organization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleOpenEnhancedWindow}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Open Enhanced Family Tree Window
            </button>
            
            <button
              onClick={loadDemoData}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              Reload Demo Data
            </button>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Root Person PID:</label>
              <input
                type="number"
                value={selectedPersonPid || ''}
                onChange={(e) => setSelectedPersonPid(parseInt(e.target.value) || null)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter PID"
              />
            </div>
          </div>
        </div>

        {/* Connected Family Graph Demo */}
        {selectedPersonPid && demoData.persons.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Family Graph</h2>
            <div className="h-96 border border-gray-200 rounded-lg">
              <ConnectedFamilyGraph
                rootPersonPid={selectedPersonPid}
                maxDepth={3}
                showNuclearFamilyGrouping={true}
                showNavigationControls={true}
                onPersonClick={handlePersonClick}
                onRelationshipClick={handleRelationshipClick}
              />
            </div>
          </div>
        )}

        {/* Data Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Data Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{demoData.persons.length}</div>
              <div className="text-sm text-gray-600">Total Persons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{demoData.relationships.length}</div>
              <div className="text-sm text-gray-600">Total Relationships</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(demoData.relationships.map(r => r.type)).size}
              </div>
              <div className="text-sm text-gray-600">Relationship Types</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">How to Use This Demo</h2>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Click on nodes</strong> to select different people as the root of the family tree</li>
            <li>• <strong>Use navigation controls</strong> to zoom, pan, and center the view</li>
            <li>• <strong>Toggle nuclear family grouping</strong> to see how families are organized</li>
            <li>• <strong>Adjust the depth</strong> to show more or fewer generations</li>
            <li>• <strong>Click on relationships</strong> to see connection details</li>
            <li>• <strong>Open the enhanced window</strong> to see the full-featured family tree interface</li>
          </ul>
        </div>
      </div>

      {/* Enhanced Family Tree Window Modal */}
      {showEnhancedWindow && selectedPersonPid && (
        <EnhancedFamilyTreeWindow
          rootPersonPid={selectedPersonPid}
          onPersonClick={handlePersonClick}
          onRelationshipClick={handleRelationshipClick}
          onClose={handleCloseEnhancedWindow}
        />
      )}
    </div>
  );
};

export default FamilyTreeDemoPage;
