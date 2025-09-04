// 2025-01-31: Refactored Classic family tree visualization component
// Broken down into smaller, manageable components and hooks for better maintainability

import React, { useRef } from 'react';
import { useFamilyOrganization, FamilyMember, FamilyRelationship } from './hooks/useFamilyOrganization';
import { useTreeDimensions } from './hooks/useTreeDimensions';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { ParentGeneration } from './components/ParentGeneration';
import { ChildGeneration } from './components/ChildGeneration';
import { RelationshipConnections } from './components/RelationshipConnections';

interface ClassicFamilyTreeProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  useMultiRowLayout?: boolean;
  svgRef?: React.RefObject<SVGSVGElement>;
}

const ClassicFamilyTree: React.FC<ClassicFamilyTreeProps> = ({ 
  familyMembers, 
  relationships = [],
  useMultiRowLayout = false,
  svgRef
}) => {
  // Use custom hooks for different concerns
  const organizedMembers = useFamilyOrganization(familyMembers, relationships);
  const treeDimensions = useTreeDimensions(organizedMembers, useMultiRowLayout);
  const {
    memberPositions,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useDragAndDrop();

  // Don't render if no members
  if (familyMembers.length === 0) {
    return (
      <div className="classic-family-tree-empty">
        <p>No family members found.</p>
      </div>
    );
  }

  return (
    <div className="classic-family-tree">
      {/* Layout indicator */}
      {useMultiRowLayout && familyMembers.length > 6 && (
        <div className="layout-indicator multi-row-active">
          📐 Multi-row layout active - Family members arranged in multiple rows
        </div>
      )}

      {/* SVG Container */}
      <div 
        className="family-tree-svg-container"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          width: treeDimensions.containerWidth, 
          height: treeDimensions.containerHeight,
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <svg
          ref={svgRef}
          width={treeDimensions.containerWidth}
          height={treeDimensions.containerHeight}
          style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: '#fafafa'
          }}
        >
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead-classic"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#8B4513"
              />
            </marker>
          </defs>

          {/* Parent Generation */}
          <ParentGeneration
            parents={organizedMembers.parents}
            treeDimensions={treeDimensions}
            memberPositions={memberPositions}
            onMouseDown={handleMouseDown}
          />

          {/* Relationship Connections */}
          <RelationshipConnections
            organizedMembers={organizedMembers}
            treeDimensions={treeDimensions}
            memberPositions={memberPositions}
          />

          {/* Child Generation */}
          <ChildGeneration
            children={organizedMembers.children}
            treeDimensions={treeDimensions}
            memberPositions={memberPositions}
            useMultiRowLayout={useMultiRowLayout}
            onMouseDown={handleMouseDown}
          />
        </svg>
      </div>

      {/* Family tree legend */}
      <div className="classic-family-tree-legend">
        <div className="legend-item">
          <div className="legend-color parent-color"></div>
          <span>Parents</span>
        </div>
        <div className="legend-item">
          <div className="legend-color child-color"></div>
          <span>Children</span>
        </div>
      </div>
    </div>
  );
};

export default ClassicFamilyTree;
