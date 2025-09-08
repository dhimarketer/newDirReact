// 2025-01-05: Clean comparison component for SVG vs ReactFlow family tree implementations  
// Allows switching between ClassicFamilyTree (SVG) and CleanReactFlowFamilyTree for evaluation

import React, { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FamilyMember, FamilyRelationship } from './hooks/useFamilyOrganization';
import ClassicFamilyTree from './ClassicFamilyTree';
import CleanReactFlowFamilyTree from './CleanReactFlowFamilyTree';

interface FamilyTreeComparisonProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  onRelationshipChange?: (relationship: FamilyRelationship) => void;
  hasMultipleFamilies?: boolean;
  svgRef?: React.RefObject<SVGSVGElement>;
}

type TreeImplementation = 'svg' | 'clean-reactflow';

const FamilyTreeComparison: React.FC<FamilyTreeComparisonProps> = ({
  familyMembers,
  relationships = [],
  onRelationshipChange,
  hasMultipleFamilies = false,
  svgRef
}) => {
  const [implementation, setImplementation] = useState<TreeImplementation>('svg');

  const handleImplementationChange = (newImplementation: TreeImplementation) => {
    setImplementation(newImplementation);
  };

  const renderFamilyTree = () => {
    switch (implementation) {
      case 'clean-reactflow':
        return (
          <CleanReactFlowFamilyTree
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
    <ReactFlowProvider>
      <div className="family-tree-comparison">
        {/* Implementation Toggle */}
        <div className="family-tree-controls mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-800">Family Tree View</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleImplementationChange('svg')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    implementation === 'svg'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  SVG Tree
                </button>
                <button
                  onClick={() => handleImplementationChange('clean-reactflow')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    implementation === 'clean-reactflow'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Clean ReactFlow
                </button>
              </div>
            </div>
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
                <strong>Clean ReactFlow Implementation:</strong> Clean, optimized ReactFlow component 
                built from scratch with proper organizational chart layout and clean CSS styling.
              </div>
            )}
          </div>
        </div>

      {/* Family Tree Display */}
      <div className="family-tree-display">
        {renderFamilyTree()}
      </div>

      </div>
    </ReactFlowProvider>
  );
};

export default FamilyTreeComparison;
