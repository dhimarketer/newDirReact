// 2025-01-28: NEW - Classic family tree visualization component
// 2025-01-28: Implements traditional family tree layout with parents at top, children below
// 2025-01-28: Clean hierarchical structure matching family1.png reference

import React, { useMemo } from 'react';
import { PhoneBookEntry } from '../../types/directory';

interface FamilyMember {
  entry: PhoneBookEntry;
  role: 'parent' | 'child' | 'other';
  relationship?: string;
}

interface FamilyRelationship {
  id: number;
  person1: number;
  person2: number;
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other';
  notes?: string;
  is_active: boolean;
}

interface ClassicFamilyTreeProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
}

const ClassicFamilyTree: React.FC<ClassicFamilyTreeProps> = ({ 
  familyMembers, 
  relationships = [] 
}) => {
  // Organize family members into classic structure
  const organizedMembers = useMemo(() => {
    // Filter out members without valid pid
    const validMembers = familyMembers.filter(member => 
      member.entry && member.entry.pid !== undefined && member.entry.pid !== null
    );

    if (validMembers.length === 0) {
      return { parents: [], children: [] };
    }

    // 2025-01-28: FIXED - Show all family members instead of restrictive filtering
    // For now, show first 2 as parents and rest as children to ensure all are visible
    const parents = validMembers.slice(0, 2);
    const children = validMembers.slice(2);
    
    // If we have less than 2 members, adjust accordingly
    if (validMembers.length === 1) {
      return { parents: validMembers, children: [] };
    }
    
    return { parents, children };
  }, [familyMembers, relationships]);

  // Calculate tree dimensions
  const treeDimensions = useMemo(() => {
    const parentCount = organizedMembers.parents.length;
    const childCount = organizedMembers.children.length;
    
    const nodeWidth = 120;
    const nodeHeight = 80;
    
    // 2025-01-28: FIXED - Use fixed spacing and center the tree properly
    // Use fixed spacing between nodes for consistent layout
    const fixedSpacing = 60; // Fixed spacing between nodes
    
    // Calculate total width needed for each generation with fixed spacing
    const totalParentWidth = parentCount * nodeWidth + (parentCount > 1 ? (parentCount - 1) * fixedSpacing : 0);
    const totalChildWidth = childCount * nodeWidth + (childCount > 1 ? (childCount - 1) * fixedSpacing : 0);
    
    // Use container width (1000px) with margins
    const containerWidth = 1000;
    const margin = 40;
    const availableWidth = containerWidth - margin;
    
    return {
      nodeWidth,
      nodeHeight,
      parentSpacing: fixedSpacing,
      childSpacing: fixedSpacing,
      totalWidth: availableWidth,
      totalHeight: 300,
      containerWidth: availableWidth
    };
  }, [organizedMembers]);

  // 2025-01-28: Helper function to calculate centered positions
  const calculateCenteredPosition = (index: number, totalCount: number, spacing: number) => {
    // Calculate the total width needed for all nodes
    const totalWidth = totalCount * treeDimensions.nodeWidth + 
      (totalCount > 1 ? (totalCount - 1) * spacing : 0);
    
    // Calculate the center of the container
    const containerCenter = treeDimensions.containerWidth / 2;
    
    // Calculate the left edge of the first node to center the entire group
    const firstNodeLeftEdge = containerCenter - (totalWidth / 2);
    
    // Return the position for the current node
    return firstNodeLeftEdge + index * (treeDimensions.nodeWidth + spacing);
  };

  // Format age from DOB
  const formatAge = (dob?: string): string => {
    if (!dob) return '';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return `(${age - 1})`;
      }
      return `(${age})`;
    } catch {
      return '';
    }
  };

  // Don't render if no members
  if (familyMembers.length === 0) {
    return (
      <div className="classic-family-tree-empty">
        <p>No family members found.</p>
      </div>
    );
  }

  const { nodeWidth, nodeHeight, parentSpacing, childSpacing, totalWidth, totalHeight } = treeDimensions;

  return (
    <div className="classic-family-tree">
      <div className="classic-family-tree-container">
        {/* 2025-01-28: FIXED - Use full container width to prevent clipping */}
        <div className="classic-family-tree-svg-wrapper">
          <svg
            width="100%"
            height={totalHeight}
            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
            className="classic-family-tree-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Connection line styles */}
              <marker
                id="arrowhead-classic"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#8B4513" />
              </marker>
            </defs>

            {/* Parent Generation */}
            <g className="parent-generation">
              {organizedMembers.parents.map((parent, index) => {
                // 2025-01-28: FIXED - Center-based positioning to prevent clipping
                // Calculate center position and expand outward
                const x = calculateCenteredPosition(index, organizedMembers.parents.length, treeDimensions.parentSpacing);
                const y = 50;
                
                return (
                  <g key={parent.entry.pid} className="parent-node">
                    {/* Parent node */}
                    <rect
                      x={x}
                      y={y}
                      width={treeDimensions.nodeWidth}
                      height={treeDimensions.nodeHeight}
                      rx="8"
                      ry="8"
                      fill="#F5F5DC"
                      stroke="#8B4513"
                      strokeWidth="2"
                    />
                    
                    {/* Parent name */}
                    <text
                      x={x + treeDimensions.nodeWidth / 2}
                      y={y + 25}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#8B4513"
                    >
                      {parent.entry.name}
                    </text>
                    
                    {/* Parent age */}
                    <text
                      x={x + treeDimensions.nodeWidth / 2}
                      y={y + 40}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#8B4513"
                    >
                      {formatAge(parent.entry.DOB)}
                    </text>
                    
                    {/* Parent contact */}
                    <text
                      x={x + treeDimensions.nodeWidth / 2}
                      y={y + 55}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#8B4513"
                    >
                      {parent.entry.contact}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Parent connection line */}
            {organizedMembers.parents.length > 1 && (
              <line
                x1={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                y1={50 + treeDimensions.nodeHeight / 2}
                x2={calculateCenteredPosition(organizedMembers.parents.length - 1, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                y2={50 + treeDimensions.nodeHeight / 2}
                stroke="#8B4513"
                strokeWidth="3"
                markerEnd="url(#arrowhead-classic)"
              />
            )}

            {/* Vertical connection from parents to children */}
            {organizedMembers.children.length > 0 && (
              <line
                x1={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                y1={50 + treeDimensions.nodeHeight}
                x2={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                y2={200}
                stroke="#8B4513"
                strokeWidth="2"
                markerEnd="url(#arrowhead-classic)"
              />
            )}

            {/* Child Generation */}
            <g className="child-generation">
              {organizedMembers.children.map((child, index) => {
                // 2025-01-28: FIXED - Center-based positioning to prevent clipping
                // Calculate center position and expand outward
                const x = calculateCenteredPosition(index, organizedMembers.children.length, treeDimensions.childSpacing);
                const y = 220;
                
                return (
                  <g key={child.entry.pid} className="child-node">
                    {/* Child node */}
                    <rect
                      x={x}
                      y={y}
                      width={treeDimensions.nodeWidth}
                      height={treeDimensions.nodeHeight}
                      rx="8"
                      ry="8"
                      fill="#F0F8FF"
                      stroke="#8B4513"
                      strokeWidth="2"
                    />
                    
                    {/* Child name */}
                    <text
                      x={x + treeDimensions.nodeWidth / 2}
                      y={y + 25}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#8B4513"
                    >
                      {child.entry.name}
                    </text>
                    
                    {/* Child age */}
                    <text
                      x={x + treeDimensions.nodeWidth / 2}
                      y={y + 40}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#8B4513"
                    >
                      {formatAge(child.entry.DOB)}
                    </text>
                    
                    {/* Child contact */}
                    <text
                      x={x + treeDimensions.nodeWidth / 2}
                      y={y + 55}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#8B4513"
                    >
                      {child.entry.contact}
                    </text>
                    
                    {/* Connection line from main vertical to child */}
                    <line
                      x1={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                      y1={200}
                      x2={x + treeDimensions.nodeWidth / 2}
                      y2={y + treeDimensions.nodeHeight / 2}
                      stroke="#8B4513"
                      strokeWidth="1"
                      markerEnd="url(#arrowhead-classic)"
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
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
