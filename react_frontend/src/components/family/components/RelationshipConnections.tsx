// 2025-01-31: Component for rendering relationship connections
// Extracted from ClassicFamilyTree component for better maintainability

import React, { useMemo } from 'react';
import { OrganizedFamilyMembers } from '../hooks/useFamilyOrganization';
import { TreeDimensions } from '../hooks/useTreeDimensions';
import { DraggablePosition } from '../hooks/useDragAndDrop';
import { calculateCenteredPosition } from '../utils/calculations';

interface RelationshipConnectionsProps {
  organizedMembers: OrganizedFamilyMembers;
  treeDimensions: TreeDimensions;
  memberPositions: Map<number, DraggablePosition>;
}

export const RelationshipConnections: React.FC<RelationshipConnectionsProps> = ({
  organizedMembers,
  treeDimensions,
  memberPositions
}) => {
  const connections = useMemo(() => {
    console.log('🔗 RelationshipConnections: Processing connections with:', {
      parents: organizedMembers.parents.length,
      children: organizedMembers.children.length,
      grandparents: organizedMembers.grandparents.length,
      grandchildren: organizedMembers.grandchildren.length,
      parentChildMap: organizedMembers.parentChildMap?.size || 0,
      spouseMap: organizedMembers.spouseMap?.size || 0,
      generationLevels: organizedMembers.generationLevels?.size || 0
    });
    
    const connections: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      type: string;
      parentId?: number;
      childId?: number;
    }> = [];
    
    // Helper function to get actual position including drag offset
    const getActualPosition = (memberId: number, baseX: number, baseY: number) => {
      const dragOffset = memberPositions.get(memberId);
      return {
        x: baseX + (dragOffset?.x || 0),
        y: baseY + (dragOffset?.y || 0)
      };
    };
    
    // SIMPLIFIED: Process parent-child relationships from parentChildMap
    if (organizedMembers.parentChildMap && organizedMembers.parentChildMap.size > 0) {
      console.log('🔗 Processing parentChildMap relationships:', organizedMembers.parentChildMap);
      
      organizedMembers.parentChildMap.forEach((childIds, parentId) => {
        const parent = [...organizedMembers.grandparents, ...organizedMembers.parents, ...organizedMembers.children, ...organizedMembers.grandchildren]
          .find(p => p.entry.pid === parentId);
        
        if (parent) {
          childIds.forEach(childId => {
            const child = [...organizedMembers.grandparents, ...organizedMembers.parents, ...organizedMembers.children, ...organizedMembers.grandchildren]
              .find(p => p.entry.pid === childId);
            
            if (child) {
              // SIMPLIFIED: Use simple position calculation based on generation
              const parentGeneration = organizedMembers.generationLevels.get(parentId) || 1;
              const childGeneration = organizedMembers.generationLevels.get(childId) || 2;
              
              let parentX, parentY, childX, childY;
              
              // Calculate parent position based on generation
              if (parentGeneration === 0) {
                // Grandparent
                const grandparentIndex = organizedMembers.grandparents.findIndex(p => p.entry.pid === parentId);
                parentX = calculateCenteredPosition(
                  grandparentIndex, 
                  organizedMembers.grandparents.length, 
                  treeDimensions.parentSpacing,
                  treeDimensions.nodeWidth,
                  treeDimensions.containerWidth
                ) + treeDimensions.nodeWidth / 2;
                parentY = 20 + treeDimensions.nodeHeight / 2;
              } else if (parentGeneration === 1) {
                // Parent
                const parentIndex = organizedMembers.parents.findIndex(p => p.entry.pid === parentId);
                parentX = calculateCenteredPosition(
                  parentIndex, 
                  organizedMembers.parents.length, 
                  treeDimensions.parentSpacing,
                  treeDimensions.nodeWidth,
                  treeDimensions.containerWidth
                ) + treeDimensions.nodeWidth / 2;
                parentY = (organizedMembers.grandparents.length > 0 ? 140 : 50) + treeDimensions.nodeHeight / 2;
              } else if (parentGeneration === 2) {
                // Child
                const childIndex = organizedMembers.children.findIndex(p => p.entry.pid === parentId);
                parentX = calculateCenteredPosition(
                  childIndex, 
                  organizedMembers.children.length, 
                  treeDimensions.childSpacing,
                  treeDimensions.nodeWidth,
                  treeDimensions.containerWidth
                ) + treeDimensions.nodeWidth / 2;
                parentY = 220 + treeDimensions.nodeHeight / 2;
              } else {
                return; // Skip other generations
              }
              
              // Calculate child position based on generation
              if (childGeneration === 1) {
                // Parent
                const parentIndex = organizedMembers.parents.findIndex(p => p.entry.pid === childId);
                childX = calculateCenteredPosition(
                  parentIndex, 
                  organizedMembers.parents.length, 
                  treeDimensions.parentSpacing,
                  treeDimensions.nodeWidth,
                  treeDimensions.containerWidth
                ) + treeDimensions.nodeWidth / 2;
                childY = (organizedMembers.grandparents.length > 0 ? 140 : 50) + treeDimensions.nodeHeight / 2;
              } else if (childGeneration === 2) {
                // Child
                const childIndex = organizedMembers.children.findIndex(p => p.entry.pid === childId);
                childX = calculateCenteredPosition(
                  childIndex, 
                  organizedMembers.children.length, 
                  treeDimensions.childSpacing,
                  treeDimensions.nodeWidth,
                  treeDimensions.containerWidth
                ) + treeDimensions.nodeWidth / 2;
                childY = 220 + treeDimensions.nodeHeight / 2;
              } else if (childGeneration === 3) {
                // Grandchild
                const grandchildIndex = organizedMembers.grandchildren.findIndex(p => p.entry.pid === childId);
                childX = calculateCenteredPosition(
                  grandchildIndex, 
                  organizedMembers.grandchildren.length, 
                  treeDimensions.childSpacing,
                  treeDimensions.nodeWidth,
                  treeDimensions.containerWidth
                ) + treeDimensions.nodeWidth / 2;
                childY = 320 + treeDimensions.nodeHeight / 2;
              } else {
                return; // Skip other generations
              }
              
              // Apply drag offsets
              const actualParentPos = getActualPosition(parentId, parentX, parentY);
              const actualChildPos = getActualPosition(childId, childX, childY);
              
              connections.push({
                from: actualParentPos,
                to: actualChildPos,
                type: 'parent-child',
                parentId: parentId,
                childId: childId
              });
              
              console.log(`🔗 Added parent-child connection: ${parent.entry.name} -> ${child.entry.name}`);
            }
          });
        }
      });
    }
    
    // SIMPLIFIED: Only create fallback connections if NO actual relationships exist
    if (connections.length === 0 && organizedMembers.parents.length > 0 && organizedMembers.children.length > 0) {
      console.log(`🔗 Creating SIMPLE fallback connections: ${organizedMembers.parents.length} parents, ${organizedMembers.children.length} children`);
      
      // Simple direct connections from each parent to each child
      organizedMembers.parents.forEach((parent, parentIndex) => {
        const parentX = calculateCenteredPosition(
          parentIndex, 
          organizedMembers.parents.length, 
          treeDimensions.parentSpacing,
          treeDimensions.nodeWidth,
          treeDimensions.containerWidth
        ) + treeDimensions.nodeWidth / 2;
        const parentY = (organizedMembers.grandparents.length > 0 ? 140 : 50) + treeDimensions.nodeHeight / 2;
        
        organizedMembers.children.forEach((child, childIndex) => {
          const childX = calculateCenteredPosition(
            childIndex, 
            organizedMembers.children.length, 
            treeDimensions.childSpacing,
            treeDimensions.nodeWidth,
            treeDimensions.containerWidth
          ) + treeDimensions.nodeWidth / 2;
          const childY = 220 + treeDimensions.nodeHeight / 2;
          
          // Apply drag offsets
          const actualParentPos = getActualPosition(parent.entry.pid, parentX, parentY);
          const actualChildPos = getActualPosition(child.entry.pid, childX, childY);
          
          connections.push({
            from: actualParentPos,
            to: actualChildPos,
            type: 'parent-child'
          });
        });
      });
      
      // Add spouse connection between parents if there are exactly 2
      if (organizedMembers.parents.length === 2) {
        const parent1 = organizedMembers.parents[0];
        const parent2 = organizedMembers.parents[1];
        
        const parent1X = calculateCenteredPosition(0, 2, treeDimensions.parentSpacing, treeDimensions.nodeWidth, treeDimensions.containerWidth) + treeDimensions.nodeWidth / 2;
        const parent1Y = (organizedMembers.grandparents.length > 0 ? 140 : 50) + treeDimensions.nodeHeight / 2;
        const parent2X = calculateCenteredPosition(1, 2, treeDimensions.parentSpacing, treeDimensions.nodeWidth, treeDimensions.containerWidth) + treeDimensions.nodeWidth / 2;
        const parent2Y = (organizedMembers.grandparents.length > 0 ? 140 : 50) + treeDimensions.nodeHeight / 2;
        
        const actualParent1Pos = getActualPosition(parent1.entry.pid, parent1X, parent1Y);
        const actualParent2Pos = getActualPosition(parent2.entry.pid, parent2X, parent2Y);
        
        connections.push({
          from: actualParent1Pos,
          to: actualParent2Pos,
          type: 'spouse-connection'
        });
      }
    }
    
    // Add spouse connections across all generations
    console.log('🔗 Processing spouse connections from spouseMap:', organizedMembers.spouseMap);
    if (organizedMembers.spouseMap) {
      organizedMembers.spouseMap?.forEach((spouseIds, personId) => {
        console.log(`🔗 Processing person ${personId} with spouses:`, spouseIds);
        // Find person in any generation
        const person = [...organizedMembers.grandparents, ...organizedMembers.parents, ...organizedMembers.children, ...organizedMembers.grandchildren]
          .find(p => p.entry.pid === personId);
        
        if (person) {
          // Determine person's generation and position
          const personGeneration = organizedMembers.generationLevels.get(personId) || 1;
          let personIndex, personArray, basePersonY;
          
          if (personGeneration === 0) {
            // Grandparent
            personArray = organizedMembers.grandparents;
            personIndex = personArray.findIndex(p => p.entry.pid === personId);
            basePersonY = 20 + treeDimensions.nodeHeight / 2;
          } else if (personGeneration === 1) {
            // Parent
            personArray = organizedMembers.parents;
            personIndex = personArray.findIndex(p => p.entry.pid === personId);
            basePersonY = (organizedMembers.grandparents.length > 0 ? 140 : 50) + treeDimensions.nodeHeight / 2;
          } else if (personGeneration === 2) {
            // Child
            personArray = organizedMembers.children;
            personIndex = personArray.findIndex(p => p.entry.pid === personId);
            basePersonY = 220 + treeDimensions.nodeHeight / 2;
          } else if (personGeneration === 3) {
            // Grandchild
            personArray = organizedMembers.grandchildren;
            personIndex = personArray.findIndex(p => p.entry.pid === personId);
            basePersonY = 320 + treeDimensions.nodeHeight / 2;
          } else {
            return; // Skip other generations
          }
          
          const basePersonX = calculateCenteredPosition(
            personIndex, 
            personArray.length, 
            treeDimensions.parentSpacing,
            treeDimensions.nodeWidth,
            treeDimensions.containerWidth
          ) + treeDimensions.nodeWidth / 2;
          
          // Get actual person position with drag offset
          const actualPersonPos = getActualPosition(personId, basePersonX, basePersonY);
          
          spouseIds.forEach((spouseId: number) => {
            // Find spouse in any generation
            const spouse = [...organizedMembers.grandparents, ...organizedMembers.parents, ...organizedMembers.children, ...organizedMembers.grandchildren]
              .find(p => p.entry.pid === spouseId);
            
            if (spouse && spouseId > personId) { // Only draw once per pair
              // Determine spouse's generation and position
              const spouseGeneration = organizedMembers.generationLevels.get(spouseId) || 1;
              let spouseIndex, spouseArray, baseSpouseY;
              
              if (spouseGeneration === 0) {
                // Grandparent
                spouseArray = organizedMembers.grandparents;
                spouseIndex = spouseArray.findIndex(p => p.entry.pid === spouseId);
                baseSpouseY = 20 + treeDimensions.nodeHeight / 2;
              } else if (spouseGeneration === 1) {
                // Parent
                spouseArray = organizedMembers.parents;
                spouseIndex = spouseArray.findIndex(p => p.entry.pid === spouseId);
                baseSpouseY = (organizedMembers.grandparents.length > 0 ? 140 : 50) + treeDimensions.nodeHeight / 2;
              } else if (spouseGeneration === 2) {
                // Child
                spouseArray = organizedMembers.children;
                spouseIndex = spouseArray.findIndex(p => p.entry.pid === spouseId);
                baseSpouseY = 220 + treeDimensions.nodeHeight / 2;
              } else if (spouseGeneration === 3) {
                // Grandchild
                spouseArray = organizedMembers.grandchildren;
                spouseIndex = spouseArray.findIndex(p => p.entry.pid === spouseId);
                baseSpouseY = 320 + treeDimensions.nodeHeight / 2;
              } else {
                return; // Skip other generations
              }
              
              const baseSpouseX = calculateCenteredPosition(
                spouseIndex, 
                spouseArray.length, 
                treeDimensions.parentSpacing,
                treeDimensions.nodeWidth,
                treeDimensions.containerWidth
              ) + treeDimensions.nodeWidth / 2;
              
              // Get actual spouse position with drag offset
              const actualSpousePos = getActualPosition(spouseId, baseSpouseX, baseSpouseY);
              
              connections.push({
                from: { x: actualPersonPos.x, y: actualPersonPos.y },
                to: { x: actualSpousePos.x, y: actualSpousePos.y },
                type: 'spouse',
                parentId: personId,
                childId: spouseId
              });
            }
          });
        }
      });
    }
    
    console.log('🔗 Final connections array:', connections);
    return connections;
  }, [organizedMembers, treeDimensions, memberPositions]);

  return (
    <>
      {/* 2025-01-31: ENHANCED - Render organizational chart connections */}
      {connections.map((connection, index) => {
        let strokeColor = "#8B4513"; // Default brown
        let strokeWidth = "3";
        let markerEnd = "url(#arrowhead-relationship)";
        let strokeDasharray = "none";
        
        // VISUALIZATION RULE: Style different connection types according to family tree rules
        switch (connection.type) {
          case 'spouse-connection':
            strokeColor = "#FF69B4"; // Pink for spouse connection
            strokeWidth = "2";
            markerEnd = ""; // No arrow for spouse connection
            strokeDasharray = "5,5"; // Dashed line (VISUALIZATION RULE: Horizontal dashed lines = spouses)
            break;
          case 'vertical-connector':
            strokeColor = "#8B4513"; // Brown for main vertical line
            strokeWidth = "4";
            markerEnd = ""; // No arrow for vertical connector
            strokeDasharray = "none"; // Solid line
            break;
          case 'parent-child':
            strokeColor = "#8B4513"; // Brown for parent-child lines (VISUALIZATION RULE: Parent → child = brown arrow)
            strokeWidth = "2";
            markerEnd = ""; // Using inline arrow instead of marker
            strokeDasharray = "none"; // Solid line
            break;
          case 'spouse':
            strokeColor = "#FF69B4"; // Pink for spouse connection (VISUALIZATION RULE: Spouse → spouse = dashed pink line)
            strokeWidth = "2";
            markerEnd = "";
            strokeDasharray = "8,4"; // Dashed line with more visible dashes
            break;
        }
        
        // Debug logging for connection styling
        console.log(`🔗 Connection ${index} (${connection.type}):`, {
          strokeColor,
          strokeWidth,
          markerEnd,
          strokeDasharray,
          from: connection.from,
          to: connection.to
        });
        
        return (
          <g key={`connection-${index}`}>
            <line
              x1={connection.from.x}
              y1={connection.from.y}
              x2={connection.to.x}
              y2={connection.to.y}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray === "none" ? undefined : strokeDasharray}
              style={{ zIndex: 10 }}
              opacity="1"
            />
            {/* Inline arrow for parent-child connections */}
            {connection.type === 'parent-child' && (
              <>
                {console.log(`🔗 Creating arrow at (${connection.to.x}, ${connection.to.y}) for ${connection.type}`)}
                <polygon
                  points={`${connection.to.x-8},${connection.to.y-4} ${connection.to.x},${connection.to.y} ${connection.to.x-8},${connection.to.y+4}`}
                  fill="#8B4513"
                  stroke="#8B4513"
                  strokeWidth="1"
                  style={{ zIndex: 11 }}
                />
              </>
            )}
          </g>
        );
      })}
      
      {/* SIMPLIFIED: No complex fallback logic - connections are handled in the useMemo above */}
    </>
  );
};
