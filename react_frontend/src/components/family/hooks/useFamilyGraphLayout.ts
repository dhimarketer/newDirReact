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
      align: 'UL'           // Upper-left alignment
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Node sizing constants
    const FAMILY_NODE_WIDTH = 200;
    const FAMILY_NODE_HEIGHT = 80;

    // 2025-01-02: SIMPLIFIED - Create clean organizational chart structure
    // Add parent nodes to Dagre graph (top level)
    parents.forEach(parent => {
      const nodeId = (parent.entry?.pid || parent.id).toString();
      g.setNode(nodeId, { 
        width: FAMILY_NODE_WIDTH, 
        height: FAMILY_NODE_HEIGHT 
      });
    });

    // Add child nodes to Dagre graph (bottom level)
    children.forEach(child => {
      const nodeId = (child.entry?.pid || child.id).toString();
      g.setNode(nodeId, { 
        width: FAMILY_NODE_WIDTH, 
        height: FAMILY_NODE_HEIGHT 
      });
    });

    // Create clean organizational chart edges
    if (parents.length > 0 && children.length > 0) {
      if (parents.length === 2) {
        // TWO PARENTS: Create horizontal spouse line + vertical lines to children
        const parent1Id = (parents[0].entry?.pid || parents[0].id).toString();
        const parent2Id = (parents[1].entry?.pid || parents[1].id).toString();
        
        // Horizontal spouse connection between parents
        g.setEdge(parent1Id, parent2Id);
        
        // Each parent connects to each child (simple direct connections)
        children.forEach(child => {
          const childId = (child.entry?.pid || child.id).toString();
          g.setEdge(parent1Id, childId);
          g.setEdge(parent2Id, childId);
        });
      } else {
        // SINGLE PARENT OR MORE: Direct parent-child connections
        parents.forEach(parent => {
          const parentId = (parent.entry?.pid || parent.id).toString();
          children.forEach(child => {
            const childId = (child.entry?.pid || child.id).toString();
            g.setEdge(parentId, childId);
          });
        });
      }
    }

    // Calculate layout
    dagre.layout(g);

    // Convert Dagre nodes to React Flow nodes
    const nodes: Node[] = [];
    
    // Add parent nodes
    parents.forEach(parent => {
      const nodeId = (parent.entry?.pid || parent.id).toString();
      const nodeData = g.node(nodeId);
      if (nodeData) {
        nodes.push({
          id: nodeId,
          type: 'familyNode',
          position: { 
            x: nodeData.x - FAMILY_NODE_WIDTH / 2, 
            y: nodeData.y - FAMILY_NODE_HEIGHT / 2 
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
            backgroundColor: '#fef3c7', // Light yellow for parents
            border: '2px solid #8B4513',
            borderRadius: '8px',
          },
        });
      }
    });

    // Add child nodes  
    children.forEach(child => {
      const nodeId = (child.entry?.pid || child.id).toString();
      const nodeData = g.node(nodeId);
      if (nodeData) {
        nodes.push({
          id: nodeId,
          type: 'familyNode',
          position: { 
            x: nodeData.x - FAMILY_NODE_WIDTH / 2, 
            y: nodeData.y - FAMILY_NODE_HEIGHT / 2 
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
            backgroundColor: '#dbeafe', // Light blue for children
            border: '2px solid #8B4513',
            borderRadius: '8px',
          },
        });
      }
    });

    // Convert Dagre edges to React Flow edges
    const edges: Edge[] = [];
    
    console.log(`🔗 Converting ${g.edges().length} Dagre edges to React Flow:`, g.edges().map(e => `${e.v} → ${e.w}`));
    
    g.edges().forEach(edge => {
      // Determine edge type based on source and target
      const sourceIsParent = parents.some(p => (p.entry?.pid || p.id).toString() === edge.v);
      const targetIsParent = parents.some(p => (p.entry?.pid || p.id).toString() === edge.w);
      const sourceIsChild = children.some(c => (c.entry?.pid || c.id).toString() === edge.v);
      const targetIsChild = children.some(c => (c.entry?.pid || c.id).toString() === edge.w);
      
      // Determine if this is a spouse edge (parent to parent) or parent-child edge
      const isSpouseEdge = sourceIsParent && targetIsParent;
      const isParentChildEdge = (sourceIsParent && targetIsChild) || (sourceIsChild && targetIsParent);

      // Set proper handles and styling
      let sourceHandle = 'bottom';
      let targetHandle = 'top';
      let edgeStyle = { stroke: '#8B4513', strokeWidth: 3 };
      let edgeType = 'straight';
      
      if (isSpouseEdge) {
        // Horizontal spouse connection
        sourceHandle = 'right';
        targetHandle = 'left';
        edgeStyle = { stroke: '#ec4899', strokeWidth: 4, strokeDasharray: '8,4' };
        edgeType = 'smoothstep';
      }

      edges.push({
        id: `${edge.v}-${edge.w}`,
        source: edge.v,
        target: edge.w,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
        type: edgeType,
        style: edgeStyle,
        markerEnd: isParentChildEdge ? {
          type: MarkerType.ArrowClosed,
          color: '#8B4513',
          width: 10,
          height: 7,
        } : undefined,
        animated: false,
      });
    });

    return { nodes, edges };
  }, [parents, children, familyMembers, relationships]);
};
