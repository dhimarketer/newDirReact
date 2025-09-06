// 2025-01-31: A/B testing component for comparing SVG vs ReactFlow family tree implementations
// Allows switching between ClassicFamilyTree (SVG) and ReactFlowFamilyTree for evaluation

import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FamilyMember, FamilyRelationship } from './hooks/useFamilyOrganization';
import ClassicFamilyTree from './ClassicFamilyTree';
// import ReactFlowFamilyTree from './ReactFlowFamilyTree'; // 2025-01-31: DELETED - Using SimpleReactFlowFamilyTree instead
import SimpleReactFlowFamilyTree from './SimpleReactFlowFamilyTree';
import SimpleReactFlowTest from './SimpleReactFlowTest';
import ReactFlowTest from './ReactFlowTest';

interface FamilyTreeComparisonProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  onRelationshipChange?: (relationship: FamilyRelationship) => void;
  hasMultipleFamilies?: boolean;
  svgRef?: React.RefObject<SVGSVGElement>;
}

type TreeImplementation = 'svg' | 'reactflow' | 'test';

const FamilyTreeComparison: React.FC<FamilyTreeComparisonProps> = ({
  familyMembers,
  relationships = [],
  onRelationshipChange,
  hasMultipleFamilies = false,
  svgRef
}) => {
  const [implementation, setImplementation] = useState<TreeImplementation>('test'); // 2025-01-31: Changed default to test for debugging

  // Track state changes
  useEffect(() => {
    console.log('🔍 FamilyTreeComparison - useEffect: Implementation state changed to:', implementation);
  }, [implementation]);

  const handleImplementationChange = (newImplementation: TreeImplementation) => {
    console.log('🔍 FamilyTreeComparison - Button clicked, switching to:', newImplementation);
    console.log('🔍 FamilyTreeComparison - Previous implementation was:', implementation);
    console.log('🔍 FamilyTreeComparison - Family members count:', familyMembers.length);
    console.log('🔍 FamilyTreeComparison - Family members data:', familyMembers);
    setImplementation(newImplementation);
    console.log('🔍 FamilyTreeComparison - Implementation state updated to:', newImplementation);
  };

  const renderFamilyTree = () => {
    console.log('🔍 FamilyTreeComparison - Rendering implementation:', implementation);
    console.log('🔍 FamilyTreeComparison - Family members:', familyMembers.length);
    console.log('🔍 FamilyTreeComparison - Relationships:', relationships.length);
    console.log('🔍 FamilyTreeComparison - Current implementation state:', implementation);
    
    if (familyMembers.length === 0) {
      console.log('🔍 FamilyTreeComparison - No family members, both implementations will show empty state');
    }
    
    switch (implementation) {
      case 'test':
        console.log('🔍 FamilyTreeComparison - SWITCHING TO SIMPLE TEST - Rendering Simple ReactFlow Test component');
        console.log('🔍 FamilyTreeComparison - Passing family members to Test:', familyMembers.length);
        return (
          <SimpleReactFlowTest
            familyMembers={familyMembers}
          />
        );
      case 'reactflow':
        console.log('🔍 FamilyTreeComparison - SWITCHING TO SIMPLE REACTFLOW - Rendering Simple ReactFlow component');
        console.log('🔍 FamilyTreeComparison - Passing family members to ReactFlow:', familyMembers.length);
        console.log('🔍 FamilyTreeComparison - Family members data being passed:', familyMembers);
        return (
          <SimpleReactFlowFamilyTree
            familyMembers={familyMembers}
            relationships={relationships}
            onRelationshipChange={onRelationshipChange}
            hasMultipleFamilies={hasMultipleFamilies}
          />
        );
      case 'svg':
      default:
        console.log('🔍 FamilyTreeComparison - Rendering SVG component');
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

  console.log('🔍 FamilyTreeComparison - RENDER: Current implementation state:', implementation);
  console.log('🔍 FamilyTreeComparison - RENDER: About to render buttons');

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
                onClick={() => handleImplementationChange('test')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  implementation === 'test'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Test ReactFlow
              </button>
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
                onClick={() => {
                  console.log('🔍 ReactFlow button clicked!');
                  handleImplementationChange('reactflow');
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  implementation === 'reactflow'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                ReactFlow Tree
              </button>
            </div>
          </div>
          
        </div>
        
        {/* Implementation Info */}
        <div className="mt-3 text-sm text-gray-600">
          {implementation === 'test' ? (
            <div>
              <strong>Test ReactFlow Implementation:</strong> Minimal ReactFlow test with simple nodes and edges for debugging.
            </div>
          ) : implementation === 'svg' ? (
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
      <div className="family-tree-display">
        {renderFamilyTree()}
      </div>

      </div>
    </ReactFlowProvider>
  );
};

export default FamilyTreeComparison;
