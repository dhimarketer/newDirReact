// 2025-01-31: SIMPLIFIED - Classic family tree with consistent parent detection logic
// Uses the same useFamilyOrganization hook for consistent parent detection

import React, { useMemo } from 'react';
import { PhoneBookEntry } from '../../types/directory';
import { useFamilyOrganization } from './hooks/useFamilyOrganization';

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
  svgRef?: React.RefObject<SVGSVGElement>; // 2025-01-05: NEW - Reference to SVG element for download functionality
}

const ClassicFamilyTree: React.FC<ClassicFamilyTreeProps> = ({ 
  familyMembers, 
  relationships = [],
  svgRef
}) => {
  // 2025-01-31: SIMPLIFIED - Use the same family organization logic as the hook
  const organizedMembers = useFamilyOrganization(familyMembers, relationships);

  // Extract parents and children from organized members
  const { parents, children } = organizedMembers;

  console.log(`🔍 ClassicFamilyTree: Using organized members - ${parents.length} parents, ${children.length} children`);
  console.log(`🔍 Parents:`, parents.map(p => ({ name: p.entry.name, age: p.entry.age, gender: p.entry.gender })));
  console.log(`🔍 Children:`, children.map(c => ({ name: c.entry.name, age: c.entry.age, gender: c.entry.gender })));

  // Calculate dimensions
  const nodeWidth = 120;
  const nodeHeight = 60;
  const horizontalSpacing = 20;
  const verticalSpacing = 80;
  
  const parentCount = parents.length;
  const childCount = children.length;
  
  // Calculate total width needed
  const parentWidth = parentCount * nodeWidth + (parentCount - 1) * horizontalSpacing;
  const childWidth = childCount * nodeWidth + (childCount - 1) * horizontalSpacing;
  const totalWidth = Math.max(parentWidth, childWidth, 400);
  
  // Calculate total height
  const totalHeight = 200 + (childCount > 0 ? verticalSpacing : 0);
  
  // Calculate positions
  const parentY = 20;
  const childY = parentY + nodeHeight + verticalSpacing;
  
  // Center parents horizontally
  const parentStartX = (totalWidth - parentWidth) / 2;
  
  // Center children horizontally
  const childStartX = (totalWidth - childWidth) / 2;

  return (
    <div className="classic-family-tree">
      <svg 
        ref={svgRef}
        width={totalWidth} 
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="w-full h-auto"
        style={{ minWidth: '400px' }}
      >
        {/* Parent nodes */}
        {parents.map((parent, index) => {
          const x = parentStartX + index * (nodeWidth + horizontalSpacing);
          const y = parentY;
          
          return (
            <g key={`parent-${parent.entry.pid}`}>
              <rect
                x={x}
                y={y}
                width={nodeWidth}
                height={nodeHeight}
                fill="#fef3c7"
                stroke="#8B4513"
                strokeWidth="2"
                rx="8"
              />
              <text
                x={x + nodeWidth / 2}
                y={y + nodeHeight / 2 - 8}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#1f2937"
              >
                {parent.entry.name}
              </text>
              <text
                x={x + nodeWidth / 2}
                y={y + nodeHeight / 2 + 8}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {parent.entry.age ? `${parent.entry.age} years` : 'Age unknown'}
              </text>
            </g>
          );
        })}

        {/* Child nodes */}
        {children.map((child, index) => {
          const x = childStartX + index * (nodeWidth + horizontalSpacing);
          const y = childY;
          
          return (
            <g key={`child-${child.entry.pid}`}>
              <rect
                x={x}
                y={y}
                width={nodeWidth}
                height={nodeHeight}
                fill="#dbeafe"
                stroke="#8B4513"
                strokeWidth="2"
                rx="8"
              />
              <text
                x={x + nodeWidth / 2}
                y={y + nodeHeight / 2 - 8}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#1f2937"
              >
                {child.entry.name}
              </text>
              <text
                x={x + nodeWidth / 2}
                y={y + nodeHeight / 2 + 8}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {child.entry.age ? `${child.entry.age} years` : 'Age unknown'}
              </text>
            </g>
          );
        })}

        {/* Connection lines from parents to children */}
        {parents.length > 0 && children.length > 0 && (
          <g>
            {/* Main vertical connector */}
            <line
              x1={totalWidth / 2}
              y1={parentY + nodeHeight}
              x2={totalWidth / 2}
              y2={childY}
              stroke="#8B4513"
              strokeWidth="3"
            />
            
            {/* Individual parent-to-child connections */}
            {parents.map((parent, parentIndex) => {
              const parentX = parentStartX + parentIndex * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
              const parentBottomY = parentY + nodeHeight;
              
              return children.map((child, childIndex) => {
                const childX = childStartX + childIndex * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
                const childTopY = childY;
                
                return (
                  <line
                    key={`connection-${parent.entry.pid}-${child.entry.pid}`}
                    x1={parentX}
                    y1={parentBottomY}
                    x2={childX}
                    y2={childTopY}
                    stroke="#8B4513"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              });
            })}
          </g>
        )}

        {/* Spouse connections */}
        {parents.length >= 2 && (
          <line
            x1={parentStartX + nodeWidth / 2}
            y1={parentY + nodeHeight / 2}
            x2={parentStartX + nodeWidth + horizontalSpacing + nodeWidth / 2}
            y2={parentY + nodeHeight / 2}
            stroke="#ec4899"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
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
      </svg>
    </div>
  );
};

export default ClassicFamilyTree;
