// 2025-01-02: FIXED - Creating proper organizational chart family tree that matches SVG layout logic
import { useMemo } from 'react';
import dagre from 'dagre';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { FamilyMember, FamilyRelationship } from '../../../types/family';
import { useFamilyOrganization } from './useFamilyOrganization';

// Interface for the hook's input data
interface FamilyGraphData {
  familyMembers: FamilyMember[];
  relationships: FamilyRelationship[];
}

// Interface for the hook's output
interface FamilyGraphLayout {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Custom hook that transforms family data into positioned React Flow nodes and edges
 * using the SAME parent detection logic as SVG layout for consistency
 */
export const useFamilyGraphLayout = ({ familyMembers, relationships }: FamilyGraphData): FamilyGraphLayout => {
  // 2025-01-02: FIXED - Move hook call outside useMemo to follow Rules of Hooks
  const organizedMembers = useFamilyOrganization(familyMembers, relationships);
  const { parents, children } = organizedMembers;

  return useMemo(() => {
    console.log(`🔗 useFamilyGraphLayout called with:`, {
      familyMembers: familyMembers.length,
      relationships: relationships.length,
      memberNames: familyMembers.map(m => m.entry?.name || `User ${m.user}`),
      relationshipTypes: relationships.map(r => r.relationship_type)
    });

    console.log(`🔗 Organized Members (Same as SVG):`, {
      parents: parents.length,
      children: children.length,
      parentNames: parents.map(p => p.entry?.name),
      childNames: children.map(c => c.entry?.name)
    });

    // Create Dagre graph instance
    const g = new dagre.graphlib.Graph();
    g.setGraph({ 
      rankdir: 'TB',        // Top-to-bottom layout
      nodesep: 80,          // Node separation
      ranksep: 120,         // Rank separation  
      align: 'UL',          // Upper-left alignment
      ranker: 'longest-path' // Use longest-path ranker for better family tree layout
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Node sizing constants
    const FAMILY_NODE_WIDTH = 200;
    const FAMILY_NODE_HEIGHT = 80;

    // 2024-12-20: FIXED - Use manual positioning only, no Dagre for family tree layout
    // Define union node IDs for manual edge creation
    let centerUnionId = '';
    let distributionUnionId = '';
    
    if (parents.length === 2 && children.length > 0) {
      const parent1Id = (parents[0].entry?.pid || parents[0].id).toString();
      const parent2Id = (parents[1].entry?.pid || parents[1].id).toString();
      centerUnionId = `center-union-${parent1Id}-${parent2Id}`;
      distributionUnionId = `dist-union-${parent1Id}-${parent2Id}`;
    }
    
    // 2024-12-20: FIXED - Create spouse center node for proper T-junction connection
    let spouseCenterNodeId = '';
    if (parents.length === 2) {
      const parent1Id = (parents[0].entry?.pid || parents[0].id).toString();
      const parent2Id = (parents[1].entry?.pid || parents[1].id).toString();
      spouseCenterNodeId = `spouse-center-${parent1Id}-${parent2Id}`;
    }

    // No Dagre layout needed - all positioning is manual

    // Convert Dagre nodes to React Flow nodes
    const nodes: Node[] = [];
    
    // 2024-12-20: FIXED - Manually position parents side-by-side (like SVG layout)
    const parentY = 50; // Fixed Y position for parents (top level)
    const containerWidth = 800; // Assume reasonable container width
    const parentSpacing = 250; // Horizontal spacing between parents
    
    if (parents.length === 1) {
      // Single parent - center horizontally
      const parent = parents[0];
      const nodeId = (parent.entry?.pid || parent.id).toString();
      nodes.push({
        id: nodeId,
        type: 'familyNode',
        position: { 
          x: (containerWidth - FAMILY_NODE_WIDTH) / 2, 
          y: parentY 
        },
        data: { 
          member: parent,
          name: parent.entry?.name || `User ${parent.user}`,
          age: parent.entry?.age,
          gender: parent.entry?.gender,
          role: 'parent'
        },
        style: {
          width: FAMILY_NODE_WIDTH,
          height: FAMILY_NODE_HEIGHT,
          backgroundColor: '#fef3c7',
          border: '2px solid #8B4513',
          borderRadius: '8px',
        },
      });
    } else if (parents.length === 2) {
      // Two parents - position side-by-side horizontally
      const totalWidth = FAMILY_NODE_WIDTH + parentSpacing;
      const startX = (containerWidth - totalWidth) / 2;
      
      parents.forEach((parent, index) => {
        const nodeId = (parent.entry?.pid || parent.id).toString();
        nodes.push({
          id: nodeId,
          type: 'familyNode',
          position: { 
            x: startX + index * (FAMILY_NODE_WIDTH + parentSpacing), 
            y: parentY 
          },
          data: { 
            member: parent,
            name: parent.entry?.name || `User ${parent.user}`,
            age: parent.entry?.age,
            gender: parent.entry?.gender,
            role: 'parent'
          },
          style: {
            width: FAMILY_NODE_WIDTH,
            height: FAMILY_NODE_HEIGHT,
            backgroundColor: '#fef3c7',
            border: '2px solid #8B4513',
            borderRadius: '8px',
          },
        });
      });
    }

    // 2024-12-20: FIXED - Manually position children horizontally (like SVG) for proper T-junction
    const childY = parentY + FAMILY_NODE_HEIGHT + 160; // Position children below union nodes
    const childSpacing = 220; // Horizontal spacing between children
    
    if (children.length === 1) {
      // Single child - center horizontally
      const child = children[0];
      const nodeId = (child.entry?.pid || child.id).toString();
      nodes.push({
        id: nodeId,
        type: 'familyNode',
        position: { 
          x: (containerWidth - FAMILY_NODE_WIDTH) / 2, 
          y: childY 
        },
        data: { 
          member: child,
          name: child.entry?.name || `User ${child.user}`,
          age: child.entry?.age,
          gender: child.entry?.gender,
          role: 'child'
        },
        style: {
          width: FAMILY_NODE_WIDTH,
          height: FAMILY_NODE_HEIGHT,
          backgroundColor: '#dbeafe',
          border: '2px solid #8B4513',
          borderRadius: '8px',
        },
      });
    } else if (children.length > 1) {
      // Multiple children - position horizontally in a line
      const totalChildWidth = (children.length - 1) * childSpacing + FAMILY_NODE_WIDTH;
      const childStartX = (containerWidth - totalChildWidth) / 2;
      
      children.forEach((child, index) => {
        const nodeId = (child.entry?.pid || child.id).toString();
        nodes.push({
          id: nodeId,
          type: 'familyNode',
          position: { 
            x: childStartX + index * childSpacing, 
            y: childY 
          },
          data: { 
            member: child,
            name: child.entry?.name || `User ${child.user}`,
            age: child.entry?.age,
            gender: child.entry?.gender,
            role: 'child'
          },
          style: {
            width: FAMILY_NODE_WIDTH,
            height: FAMILY_NODE_HEIGHT,
            backgroundColor: '#dbeafe',
            border: '2px solid #8B4513',
            borderRadius: '8px',
          },
        });
      });
    }

    // 2024-12-20: FIXED - Add spouse center node and union nodes for proper T-junction structure
    if (parents.length === 2) {
      const totalWidth = FAMILY_NODE_WIDTH + parentSpacing;
      const startX = (containerWidth - totalWidth) / 2;
      const centerX = startX + FAMILY_NODE_WIDTH / 2 + parentSpacing / 2; // Center between the two parents
      
      const spouseCenterY = parentY + FAMILY_NODE_HEIGHT / 2; // Middle of spouse line (same Y as parents)
      const centerUnionY = parentY + FAMILY_NODE_HEIGHT + 40; // Below parents
      const distributionUnionY = centerUnionY + 40; // Below center union
      
      // Add spouse center node (invisible node at center of spouse line)
      nodes.push({
        id: spouseCenterNodeId,
        type: 'unionNode',
        position: { 
          x: centerX - 0.5, 
          y: spouseCenterY - 0.5 
        },
        data: { 
          label: null 
        },
        style: {
          width: 1,
          height: 1,
          backgroundColor: 'transparent',
          border: 'none',
          opacity: 0,
          pointerEvents: 'none'
        },
      });
      
      if (children.length > 0) {
        // Add center union node (vertical drop from spouse line center)
        nodes.push({
          id: centerUnionId,
          type: 'unionNode',
          position: { 
            x: centerX - 0.5, 
            y: centerUnionY - 0.5 
          },
          data: { 
            label: null 
          },
          style: {
            width: 1,
            height: 1,
            backgroundColor: 'transparent',
            border: 'none',
            opacity: 0,
            pointerEvents: 'none'
          },
        });
        
        // Add distribution union node (horizontal distribution to children)
        nodes.push({
          id: distributionUnionId,
          type: 'unionNode',
          position: { 
            x: centerX - 0.5, 
            y: distributionUnionY - 0.5 
          },
          data: { 
            label: null 
          },
          style: {
            width: 1,
            height: 1,
            backgroundColor: 'transparent',
            border: 'none',
            opacity: 0,
            pointerEvents: 'none'
          },
        });
      }
    }

    // Convert Dagre edges to React Flow edges
    const edges: Edge[] = [];
    
    // 2024-12-20: FIXED - Add manual edges for spouse connection and parent-to-union
    if (parents.length === 2) {
      const parent1Id = (parents[0].entry?.pid || parents[0].id).toString();
      const parent2Id = (parents[1].entry?.pid || parents[1].id).toString();
      
      // 1. Horizontal spouse line between parents
      edges.push({
        id: `spouse-${parent1Id}-${parent2Id}`,
        source: parent1Id,
        target: parent2Id,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'straight',
        style: { stroke: '#ec4899', strokeWidth: 4, strokeDasharray: '8,4' },
        animated: false,
      });
      
      // 2. Vertical line from spouse center to center union (if children exist)
      if (children.length > 0) {
        edges.push({
          id: `spouse-center-to-center-union`,
          source: spouseCenterNodeId,
          target: centerUnionId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'straight',
          style: { stroke: '#8B4513', strokeWidth: 3 },
          animated: false,
        });
        
        // 3. Vertical line from center union to distribution union
        edges.push({
          id: `center-to-distribution-union`,
          source: centerUnionId,
          target: distributionUnionId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'straight',
          style: { stroke: '#8B4513', strokeWidth: 3 },
          animated: false,
        });
        
        // 4. Vertical lines from distribution union to each child
        children.forEach((child, index) => {
          const childId = (child.entry?.pid || child.id).toString();
          edges.push({
            id: `distribution-to-child-${childId}`,
            source: distributionUnionId,
            target: childId,
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'straight',
            style: { stroke: '#8B4513', strokeWidth: 3 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#8B4513',
              width: 10,
              height: 7,
            },
            animated: false,
          });
        });
      }
    } else if (parents.length === 1 && children.length > 0) {
      // Single parent case - direct vertical connections to children
      const parentId = (parents[0].entry?.pid || parents[0].id).toString();
      children.forEach((child, index) => {
        const childId = (child.entry?.pid || child.id).toString();
        edges.push({
          id: `parent-to-child-${childId}`,
          source: parentId,
          target: childId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'straight',
          style: { stroke: '#8B4513', strokeWidth: 3 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8B4513',
            width: 10,
            height: 7,
          },
          animated: false,
        });
      });
    }
    
    console.log(`🔗 Created ${edges.length} manual edges for T-junction family tree structure`);

    return { nodes, edges };
  }, [parents, children, familyMembers, relationships]);
};
