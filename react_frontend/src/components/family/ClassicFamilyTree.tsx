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

    // 2025-01-28: ENHANCED: Use relationships data to determine family structure instead of hardcoded logic
    if (relationships && relationships.length > 0) {
      // Build family structure from relationships
      const parentChildMap = new Map<number, number[]>(); // parent -> children
      const childParentMap = new Map<number, number[]>(); // child -> parents
      const spouseMap = new Map<number, number[]>(); // person -> spouses
      
      // Process relationships to build family structure
      relationships.forEach(rel => {
        if (rel.is_active) {
          switch (rel.relationship_type) {
            case 'parent':
              // person1 is parent of person2
              if (!parentChildMap.has(rel.person1)) {
                parentChildMap.set(rel.person1, []);
              }
              parentChildMap.get(rel.person1)!.push(rel.person2);
              
              if (!childParentMap.has(rel.person2)) {
                childParentMap.set(rel.person2, []);
              }
              childParentMap.get(rel.person2)!.push(rel.person1);
              break;
              
            case 'spouse':
              // Both are spouses
              if (!spouseMap.has(rel.person1)) {
                spouseMap.set(rel.person1, []);
              }
              spouseMap.get(rel.person1)!.push(rel.person2);
              
              if (!spouseMap.has(rel.person2)) {
                spouseMap.set(rel.person2, []);
              }
              spouseMap.get(rel.person2)!.push(rel.person1);
              break;
          }
        }
      });
      
      // Find people who are parents (have children)
      const parents = validMembers.filter(member => 
        parentChildMap.has(member.entry.pid) && parentChildMap.get(member.entry.pid)!.length > 0
      );
      
      // Find people who are children (have parents)
      const children = validMembers.filter(member => 
        childParentMap.has(member.entry.pid) && childParentMap.get(member.entry.pid)!.length > 0
      );
      
      // If no clear parent-child relationships, fall back to age-based logic
      if (parents.length === 0 && children.length === 0) {
        // Fall back to age-based parent detection logic
        const sortedByAge = [...validMembers].sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
        
        if (sortedByAge.length > 0) {
          const eldest = sortedByAge[0];
          const eldestAge = eldest.entry.age || 0;
          
          // Simple age-based logic for fallback
          const potentialParents: typeof validMembers = [];
          const ageBasedChildren: typeof validMembers = [];
          
          for (let i = 1; i < sortedByAge.length; i++) {
            const member = sortedByAge[i];
            const memberAge = member.entry.age || 0;
            const ageDifference = eldestAge - memberAge;
            
            if (ageDifference >= 10) {
              if (potentialParents.length === 0) {
                potentialParents.push(eldest);
              }
              ageBasedChildren.push(member);
            } else {
              ageBasedChildren.push(member);
            }
          }
          
          if (ageBasedChildren.length === 0) {
            ageBasedChildren.push(eldest);
          }
          
          return { 
            parents: potentialParents.slice(0, 4),
            children: ageBasedChildren.slice(0, 12),
            parentChildMap, 
            childParentMap, 
            spouseMap 
          };
        }
      }
      
      return { 
        parents: parents.length > 0 ? parents : validMembers.slice(0, 2), 
        children: children.length > 0 ? children : validMembers.slice(2),
        parentChildMap,
        childParentMap,
        spouseMap
      };
    }
    
    // Fallback to original logic if no relationships
    // 2025-01-28: ENHANCED - Use proven age-based parent detection logic instead of simple first-two logic
    if (validMembers.length === 0) {
      return { parents: [], children: [] };
    }

    // Sort members by age (eldest first) - using existing proven logic
    const sortedByAge = [...validMembers].sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
    
    // 2025-01-28: IMPLEMENTED - Use existing proven parent detection logic from FamilyModal.tsx
    const potentialParents: typeof validMembers = [];
    const children: typeof validMembers = [];
    
    if (sortedByAge.length > 0) {
      const eldest = sortedByAge[0];
      const eldestAge = eldest.entry.age || 0;
      
      // First pass: identify potential parents based on age differences (10 years threshold)
      for (let i = 1; i < sortedByAge.length; i++) {
        const member = sortedByAge[i];
        const memberAge = member.entry.age || 0;
        const ageDifference = eldestAge - memberAge;
        
        // If age difference is at least 10 years, consider eldest as potential parent
        if (ageDifference >= 10) {
          if (potentialParents.length === 0) {
            potentialParents.push(eldest);
          }
          children.push(member);
        } else {
          // Age difference is less than 10 years - could be siblings or co-parents
          // Don't assign as parent yet, add to children temporarily
          children.push(member);
        }
      }
      
      // If no children were found with proper age difference, eldest might not be a parent
      if (children.length === 0) {
        children.push(eldest);
      }
    }
    
    // Second pass: look for additional potential parents among remaining members
    if (potentialParents.length > 0 && children.length > 0) {
      const remainingMembers = sortedByAge.filter(member => 
        !potentialParents.includes(member) && !children.includes(member)
      );
      
      for (const member of remainingMembers) {
        const memberAge = member.entry.age || 0;
        let canBeParent = true;
        
        // Check if this member can be a parent to all children
        for (const child of children) {
          const childAge = child.entry.age || 0;
          const ageDifference = memberAge - childAge;
          
          // If age difference is less than 10 years, can't be a parent
          if (ageDifference < 10) {
            canBeParent = false;
            break;
          }
        }
        
        if (canBeParent && potentialParents.length < 2) {
          potentialParents.push(member);
        } else {
          children.push(member);
        }
      }
    }
    
    // Third pass: if we still don't have 2 parents, look for co-parents among children
    if (potentialParents.length === 1 && children.length > 0) {
      const potentialCoParent = children.find(child => {
        const childAge = child.entry.age || 0;
        const parentAge = potentialParents[0].entry.age || 0;
        const ageDifference = Math.abs(parentAge - childAge);
        
        // If age difference is small (likely co-parents), promote to parent
        return ageDifference <= 5;
      });
      
      if (potentialCoParent) {
        potentialParents.push(potentialCoParent);
        children.splice(children.indexOf(potentialCoParent), 1);
      }
    }
    
    // If we still don't have any parents identified, all members go to children
    if (potentialParents.length === 0) {
      children.push(...sortedByAge);
    }
    
    return { 
      parents: potentialParents.slice(0, 4), // Max 4 parents
      children: children.slice(0, 12), // Max 12 children
      parentChildMap: new Map(),
      childParentMap: new Map(),
      spouseMap: new Map()
    };
  }, [familyMembers, relationships]);

  // Calculate tree dimensions
  const treeDimensions = useMemo(() => {
    const parentCount = organizedMembers.parents.length;
    const childCount = organizedMembers.children.length;
    
    // 2025-01-31: FIXED - Significantly reduced node size to fit all family members
    const nodeWidth = 80; // Further reduced from 100
    const nodeHeight = 60; // Further reduced from 70
    
    // 2025-01-31: FIXED - Minimal spacing to fit maximum number of family members
    const fixedSpacing = 20; // Further reduced spacing between nodes
    
    // Calculate total width needed for each generation with fixed spacing
    const totalParentWidth = parentCount * nodeWidth + (parentCount > 1 ? (parentCount - 1) * fixedSpacing : 0);
    const totalChildWidth = childCount * nodeWidth + (childCount > 1 ? (childCount - 1) * fixedSpacing : 0);
    
    // 2025-01-31: FIXED - Use dynamic container width to fit the window better
    const maxWidth = Math.max(totalParentWidth, totalChildWidth);
    const containerWidth = Math.max(500, Math.min(800, maxWidth + 60)); // Further reduced max width and margins
    const margin = 15; // Further reduced margin
    const availableWidth = containerWidth - margin;
    
    return {
      nodeWidth,
      nodeHeight,
      parentSpacing: fixedSpacing,
      childSpacing: fixedSpacing,
      totalWidth: availableWidth,
      totalHeight: 250, // Reduced from 300
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

  // Calculate connections between family members
  const connections = useMemo(() => {
    const connections: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      type: string;
    }> = [];
    
    // Add parent-child connections
    organizedMembers.parentChildMap?.forEach((childIds, parentId) => {
      const parent = organizedMembers.parents.find(p => p.entry.pid === parentId);
      if (parent) {
        const parentIndex = organizedMembers.parents.findIndex(p => p.entry.pid === parentId);
        const parentX = calculateCenteredPosition(parentIndex, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2;
        const parentY = 40 + treeDimensions.nodeHeight; // Updated to match new Y position
        
        childIds.forEach((childId: number) => {
          const child = organizedMembers.children.find(c => c.entry.pid === childId);
          if (child) {
            const childIndex = organizedMembers.children.findIndex(c => c.entry.pid === childId);
            const childX = calculateCenteredPosition(childIndex, organizedMembers.children.length, treeDimensions.childSpacing) + treeDimensions.nodeWidth / 2;
            const childY = 180; // Updated to match new Y position
            
            connections.push({
              from: { x: parentX, y: parentY },
              to: { x: childX, y: childY },
              type: 'parent-child'
            });
          }
        });
      }
    });
    
    // Add spouse connections between parents
    if (organizedMembers.spouseMap) {
      organizedMembers.spouseMap?.forEach((spouseIds, personId) => {
        const person = organizedMembers.parents.find(p => p.entry.pid === personId);
        if (person) {
          const personIndex = organizedMembers.parents.findIndex(p => p.entry.pid === personId);
          const personX = calculateCenteredPosition(personIndex, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2;
          const personY = 50 + treeDimensions.nodeHeight / 2;
          
          spouseIds.forEach((spouseId: number) => {
            const spouse = organizedMembers.parents.find(p => p.entry.pid === spouseId);
            if (spouse && spouseId > personId) { // Only draw once per pair
              const spouseIndex = organizedMembers.parents.findIndex(p => p.entry.pid === spouseId);
              const spouseX = calculateCenteredPosition(spouseIndex, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2;
              const spouseY = 50 + treeDimensions.nodeHeight / 2;
              
              connections.push({
                from: { x: personX, y: personY },
                to: { x: spouseX, y: spouseY },
                type: 'spouse'
              });
            }
          });
        }
      });
    }
    
    return connections;
  }, [organizedMembers, treeDimensions]);

  // Format age from DOB - 2025-01-28: Updated to use backend-calculated age for reliability
  const formatAge = (member: any): string => {
    // 2025-01-28: Use backend-calculated age if available (more reliable)
    if (member.entry.age !== undefined && member.entry.age !== null) {
      return member.entry.age.toString();
    }
    
    // Fallback to DOB calculation only if age is not available
    if (!member.entry.DOB) return '';
    try {
      const birthDate = new Date(member.entry.DOB);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return (age - 1).toString();
      }
      return age.toString();
    } catch {
      return '';
    }
  };

  // Format name with age suffix - 2025-01-28: Updated to use backend-calculated age
  const formatNameWithAge = (name: string, member: any): string => {
    const age = formatAge(member);
    if (age === '') return name;
    return `${name} (${age})`;
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
            style={{ maxWidth: '100%', overflow: 'visible' }}
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
                viewBox="0 0 10 7"
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
                const y = 40; // Reduced from 50
                
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
                    
                    {/* Parent name with age - 2025-01-31: Implemented text wrapping with foreignObject */}
                    <foreignObject
                      x={x + 5}
                      y={y + 15}
                      width={treeDimensions.nodeWidth - 10}
                      height={treeDimensions.nodeHeight - 30}
                    >
                      <div
                        style={{
                          fontSize: '9px',
                          fontWeight: '600',
                          color: '#8B4513',
                          textAlign: 'center',
                          lineHeight: '1.2',
                          wordWrap: 'break-word',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%'
                        }}
                      >
                        {formatNameWithAge(parent.entry.name, parent)}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </g>

            {/* 2025-01-31: FIXED - Use either relationship-based connections OR fallback connections, not both */}
            {connections.length > 0 ? (
              // Use relationship-based connections
              connections.map((connection, index) => (
                <line
                  key={`connection-${index}`}
                  x1={connection.from.x}
                  y1={connection.from.y}
                  x2={connection.to.x}
                  y2={connection.to.y}
                  stroke={connection.type === 'spouse' ? '#FF69B4' : '#8B4513'}
                  strokeWidth={connection.type === 'spouse' ? '2' : '3'}
                  markerEnd="url(#arrowhead-classic)"
                  strokeDasharray={connection.type === 'spouse' ? '5,5' : undefined}
                />
              ))
            ) : (
              // Use fallback connections only when no relationships exist
              <>
                {/* Parent connection line */}
                {organizedMembers.parents.length > 1 && (
                  <line
                    x1={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                    y1={40 + treeDimensions.nodeHeight / 2} // Updated to match new Y position
                    x2={calculateCenteredPosition(organizedMembers.parents.length - 1, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                    y2={40 + treeDimensions.nodeHeight / 2} // Updated to match new Y position
                    stroke="#8B4513"
                    strokeWidth="3"
                    markerEnd="url(#arrowhead-classic)"
                  />
                )}

                {/* Vertical connection from parents to children */}
                {organizedMembers.children.length > 0 && (
                  <line
                    x1={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                    y1={40 + treeDimensions.nodeHeight} // Updated to match new Y position
                    x2={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                    y2={180} // Updated to match new Y position
                    stroke="#8B4513"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead-classic)"
                  />
                )}
              </>
            )}

            {/* Child Generation */}
            <g className="child-generation">
              {organizedMembers.children.map((child, index) => {
                // 2025-01-28: FIXED - Center-based positioning to prevent clipping
                // Calculate center position and expand outward
                const x = calculateCenteredPosition(index, organizedMembers.children.length, treeDimensions.childSpacing);
                const y = 180; // Reduced from 220
                
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
                    
                    {/* Child name with age - 2025-01-31: Implemented text wrapping with foreignObject */}
                    <foreignObject
                      x={x + 5}
                      y={y + 15}
                      width={treeDimensions.nodeWidth - 10}
                      height={treeDimensions.nodeHeight - 30}
                    >
                      <div
                        style={{
                          fontSize: '9px',
                          fontWeight: '600',
                          color: '#8B4513',
                          textAlign: 'center',
                          lineHeight: '1.2',
                          wordWrap: 'break-word',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%'
                        }}
                      >
                        {formatNameWithAge(child.entry.name, child)}
                      </div>
                    </foreignObject>
                    
                    {/* 2025-01-31: REMOVED - Individual child connections to prevent double lines */}
                    {/* Connection lines are now handled by the relationship-based or fallback connections above */}
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
