// 2025-01-31: ReactFlow-based family tree component
// Professional, interactive family tree using ReactFlow + Dagre for automatic layout
// Replaces complex SVG rendering with maintainable, scalable solution

import React, { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { useFamilyOrganization, FamilyMember, FamilyRelationship } from './hooks/useFamilyOrganization';

interface ReactFlowFamilyTreeProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  onRelationshipChange?: (relationship: FamilyRelationship) => void;
  hasMultipleFamilies?: boolean;
}

// Custom node component for family members
const FamilyMemberNode: React.FC<{ data: any }> = ({ data }) => {
  const { member, generation } = data;
  
  // Color coding based on generation
  const getNodeStyle = () => {
    switch (generation) {
      case 'grandparent':
        return { backgroundColor: '#F0E68C', borderColor: '#DAA520' };
      case 'parent':
        return { backgroundColor: '#E6F3FF', borderColor: '#4A90E2' };
      case 'child':
        return { backgroundColor: '#F0F8FF', borderColor: '#8B4513' };
      case 'grandchild':
        return { backgroundColor: '#F5F5DC', borderColor: '#DEB887' };
      default:
        return { backgroundColor: '#F0F8FF', borderColor: '#8B4513' };
    }
  };

  const nodeStyle = getNodeStyle();
  
  return (
    <div
      style={{
        padding: '8px 12px',
        backgroundColor: nodeStyle.backgroundColor,
        border: `2px solid ${nodeStyle.borderColor}`,
        borderRadius: '8px',
        minWidth: '120px',
        textAlign: 'center',
        fontSize: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {member.entry.name}
      </div>
      {member.entry.age && (
        <div style={{ fontSize: '10px', color: '#666' }}>
          Age: {member.entry.age}
        </div>
      )}
      {member.entry.gender && (
        <div style={{ fontSize: '10px', color: '#666' }}>
          {member.entry.gender}
        </div>
      )}
    </div>
  );
};

// Custom node types
const nodeTypes: NodeTypes = {
  familyMember: FamilyMemberNode,
};

// Dagre layout configuration
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'TB',        // Top to bottom
    nodesep: 100,         // Node separation
    ranksep: 150,         // Rank separation
    marginx: 20,          // X margin
    marginy: 20           // Y margin
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  nodes.forEach((node) => {
    g.setNode(node.id, { width: 120, height: 80 });
  });

  // Add edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  // Update node positions
  return {
    nodes: nodes.map((node) => {
      const dagreNode = g.node(node.id);
      return { 
        ...node, 
        position: { x: dagreNode.x, y: dagreNode.y },
        type: 'familyMember'
      };
    }),
    edges,
  };
};

const ReactFlowFamilyTree: React.FC<ReactFlowFamilyTreeProps> = ({
  familyMembers,
  relationships = [],
  onRelationshipChange,
  hasMultipleFamilies = false
}) => {
  // Reuse existing data processing logic
  const organizedMembers = useFamilyOrganization(familyMembers, relationships);
  
  // Debug logging
  console.log('🔍 ReactFlowFamilyTree: Processing data:', {
    familyMembersCount: familyMembers.length,
    relationshipsCount: relationships.length,
    relationships: relationships,
    organizedMembers: {
      parents: organizedMembers.parents.length,
      children: organizedMembers.children.length,
      grandparents: organizedMembers.grandparents.length,
      grandchildren: organizedMembers.grandchildren.length,
      parentChildMap: organizedMembers.parentChildMap?.size || 0,
      spouseMap: organizedMembers.spouseMap?.size || 0
    }
  });

  // Convert to ReactFlow format
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    const addedNodeIds = new Set<string>(); // Prevent duplicate nodes

    console.log('🔍 ReactFlowFamilyTree: Processing relationships for edges:', relationships);

    // Add grandparents (only if not already added)
    organizedMembers.grandparents.forEach((member, index) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'grandparent',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`
          },
          position: { x: 0, y: 0 }, // Will be set by Dagre
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Add parents (only if not already added)
    organizedMembers.parents.forEach((member, index) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        const bgColor = hasMultipleFamilies && member.familyGroupId
          ? (member.familyGroupId % 2 === 0 ? "#E6F3FF" : "#FFF2E6")
          : "#E6F3FF";
        const borderColor = hasMultipleFamilies && member.familyGroupId
          ? (member.familyGroupId % 2 === 0 ? "#0066CC" : "#CC6600")
          : "#4A90E2";

        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'parent',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`,
            backgroundColor: bgColor,
            borderColor: borderColor
          },
          position: { x: 0, y: 0 }, // Will be set by Dagre
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Add children (only if not already added)
    organizedMembers.children.forEach((member, index) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'child',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`
          },
          position: { x: 0, y: 0 }, // Will be set by Dagre
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Add grandchildren (only if not already added)
    organizedMembers.grandchildren.forEach((member, index) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'grandchild',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`
          },
          position: { x: 0, y: 0 }, // Will be set by Dagre
        });
        addedNodeIds.add(nodeId);
      }
    });

    // CRITICAL FIX: Process actual relationships from backend first
    relationships.forEach(rel => {
      if (rel.is_active) {
        const sourceId = String(rel.person1);
        const targetId = String(rel.person2);
        
        // Ensure both nodes exist
        const sourceExists = flowNodes.some(node => node.id === sourceId);
        const targetExists = flowNodes.some(node => node.id === targetId);
        
        if (sourceExists && targetExists) {
          let edgeStyle = { stroke: '#8B4513', strokeWidth: 2 };
          let edgeType = 'smoothstep';
          
          // Style based on relationship type
          switch (rel.relationship_type) {
            case 'parent':
            case 'child':
              edgeStyle = { stroke: '#8B4513', strokeWidth: 2 };
              break;
            case 'spouse':
              edgeStyle = { stroke: '#FF69B4', strokeWidth: 2, strokeDasharray: '5,5' };
              break;
            case 'grandparent':
            case 'grandchild':
              edgeStyle = { stroke: '#9370DB', strokeWidth: 2 };
              break;
            case 'sibling':
              edgeStyle = { stroke: '#32CD32', strokeWidth: 2 };
              break;
            default:
              edgeStyle = { stroke: '#666', strokeWidth: 1 };
          }
          
          flowEdges.push({
            id: `rel-${rel.id}`,
            source: sourceId,
            target: targetId,
            animated: false,
            style: edgeStyle,
            type: edgeType,
            data: { relationship: rel }
          });
          
          console.log(`🔍 ReactFlowFamilyTree: Added relationship edge: ${rel.relationship_type} (${rel.person1} -> ${rel.person2})`);
        } else {
          console.log(`⚠️ ReactFlowFamilyTree: Skipping relationship ${rel.id} - missing nodes: source=${sourceExists}, target=${targetExists}`);
        }
      }
    });

    // Fallback: If no relationships found, create connections based on family structure
    if (flowEdges.length === 0 && organizedMembers.parents.length > 0 && organizedMembers.children.length > 0) {
      console.log('🔍 ReactFlowFamilyTree: No relationships found, creating fallback connections');
      organizedMembers.parents.forEach(parent => {
        organizedMembers.children.forEach(child => {
          flowEdges.push({
            id: `fallback-${parent.entry.pid}-${child.entry.pid}`,
            source: String(parent.entry.pid),
            target: String(child.entry.pid),
            animated: false,
            style: { stroke: '#8B4513', strokeWidth: 2 },
            type: 'smoothstep',
          });
        });
      });
    }

    // Add spouse edges from organized members (bidirectional, avoid duplicates)
    organizedMembers.spouseMap?.forEach((spouseIds, personId) => {
      spouseIds.forEach(spouseId => {
        if (spouseId > personId) { // Prevent duplicates
          // Check if this spouse relationship already exists in edges
          const existingSpouseEdge = flowEdges.find(edge => 
            (edge.source === String(personId) && edge.target === String(spouseId)) ||
            (edge.source === String(spouseId) && edge.target === String(personId))
          );
          
          if (!existingSpouseEdge) {
            flowEdges.push({
              id: `spouse-${personId}-${spouseId}`,
              source: String(personId),
              target: String(spouseId),
              type: 'smoothstep',
              style: { stroke: '#FF69B4', strokeWidth: 2, strokeDasharray: '5,5' },
            });
          }
        }
      });
    });

    console.log('🔍 ReactFlowFamilyTree: Created nodes and edges:', {
      nodesCount: flowNodes.length,
      edgesCount: flowEdges.length,
      edges: flowEdges.map(e => ({ id: e.id, source: e.source, target: e.target, style: e.style }))
    });
    
    return { nodes: flowNodes, edges: flowEdges };
  }, [organizedMembers, hasMultipleFamilies, relationships]);

  // Apply Dagre layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const layouted = getLayoutedElements(nodes, edges);
    console.log('🔍 ReactFlowFamilyTree: After Dagre layout:', {
      nodesCount: layouted.nodes.length,
      edgesCount: layouted.edges.length,
      edges: layouted.edges
    });
    return layouted;
  }, [nodes, edges]);

  // Don't render if no members
  if (familyMembers.length === 0) {
    return (
      <div className="reactflow-family-tree-empty">
        <p>No family members found.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #ddd', borderRadius: 8 }}>
      <ReactFlow
        nodes={layoutedNodes}
        edges={layoutedEdges}
        nodeTypes={nodeTypes}
        fitView
        nodesConnectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const generation = node.data?.generation;
            switch (generation) {
              case 'grandparent': return '#F0E68C';
              case 'parent': return '#E6F3FF';
              case 'child': return '#F0F8FF';
              case 'grandchild': return '#F5F5DC';
              default: return '#fff';
            }
          }}
          nodeBorderRadius={8}
        />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider for proper context
const ReactFlowFamilyTreeWithProvider: React.FC<ReactFlowFamilyTreeProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowFamilyTree {...props} />
    </ReactFlowProvider>
  );
};

export default ReactFlowFamilyTreeWithProvider;
