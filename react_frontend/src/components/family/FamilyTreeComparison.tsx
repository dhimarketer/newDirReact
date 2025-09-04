// 2025-01-31: A/B testing component for comparing SVG vs ReactFlow family tree implementations
// Allows switching between ClassicFamilyTree (SVG) and ReactFlowFamilyTree for evaluation

import React, { useState } from 'react';
import { FamilyMember, FamilyRelationship } from './hooks/useFamilyOrganization';
import ClassicFamilyTree from './ClassicFamilyTree';
import ReactFlowFamilyTree from './ReactFlowFamilyTree';

interface FamilyTreeComparisonProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  onRelationshipChange?: (relationship: FamilyRelationship) => void;
  hasMultipleFamilies?: boolean;
  svgRef?: React.RefObject<SVGSVGElement>;
}

type TreeImplementation = 'svg' | 'reactflow';

const FamilyTreeComparison: React.FC<FamilyTreeComparisonProps> = ({
  familyMembers,
  relationships = [],
  onRelationshipChange,
  hasMultipleFamilies = false,
  svgRef
}) => {
  const [implementation, setImplementation] = useState<TreeImplementation>('svg');
  const [showComparison, setShowComparison] = useState(false);

  const handleImplementationChange = (newImplementation: TreeImplementation) => {
    setImplementation(newImplementation);
  };

  const renderFamilyTree = () => {
    switch (implementation) {
      case 'reactflow':
        return (
          <ReactFlowFamilyTree
            familyMembers={familyMembers}
            relationships={relationships}
            onRelationshipChange={onRelationshipChange}
            hasMultipleFamilies={hasMultipleFamilies}
          />
        );
      case 'svg':
      default:
        return (
          <ClassicFamilyTree
            familyMembers={familyMembers}
            relationships={relationships}
            useMultiRowLayout={false}
            svgRef={svgRef}
          />
        );
    }
  };

  return (
    <div className="family-tree-comparison">
      {/* Implementation Toggle */}
      <div className="family-tree-controls mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-800">Family Tree Implementation</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleImplementationChange('svg')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  implementation === 'svg'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                SVG (Current)
              </button>
              <button
                onClick={() => handleImplementationChange('reactflow')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  implementation === 'reactflow'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                ReactFlow (New)
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            {showComparison ? 'Hide' : 'Show'} Side-by-Side
          </button>
        </div>
        
        {/* Implementation Info */}
        <div className="mt-3 text-sm text-gray-600">
          {implementation === 'svg' ? (
            <div>
              <strong>SVG Implementation:</strong> Custom SVG rendering with drag-and-drop, 
              complex positioning logic, and manual relationship connections.
            </div>
          ) : (
            <div>
              <strong>ReactFlow Implementation:</strong> Professional node-based UI with 
              automatic layout, zoom/pan, and built-in interactions.
            </div>
          )}
        </div>
      </div>

      {/* Family Tree Display */}
      {showComparison ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SVG Version */}
          <div className="space-y-2">
            <h4 className="text-md font-semibold text-gray-700">SVG Implementation</h4>
            <div className="border border-gray-300 rounded-lg p-2">
              <ClassicFamilyTree
                familyMembers={familyMembers}
                relationships={relationships}
                useMultiRowLayout={false}
                svgRef={svgRef}
              />
            </div>
          </div>
          
          {/* ReactFlow Version */}
          <div className="space-y-2">
            <h4 className="text-md font-semibold text-gray-700">ReactFlow Implementation</h4>
            <div className="border border-gray-300 rounded-lg p-2">
              <ReactFlowFamilyTree
                familyMembers={familyMembers}
                relationships={relationships}
                onRelationshipChange={onRelationshipChange}
                hasMultipleFamilies={hasMultipleFamilies}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="family-tree-display">
          {renderFamilyTree()}
        </div>
      )}

      {/* Performance Metrics */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-md font-semibold text-blue-800 mb-2">Implementation Comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-blue-700">SVG Implementation</h5>
            <ul className="mt-1 space-y-1 text-blue-600">
              <li>• Custom drag-and-drop logic</li>
              <li>• Manual positioning calculations</li>
              <li>• Complex relationship rendering</li>
              <li>• ~500 lines of code</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-700">ReactFlow Implementation</h5>
            <ul className="mt-1 space-y-1 text-blue-600">
              <li>• Automatic layout with Dagre</li>
              <li>• Built-in zoom/pan/controls</li>
              <li>• Professional node-based UI</li>
              <li>• ~200 lines of code</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTreeComparison;
