// 2025-01-31: ReactFlow-based family tree component
// Professional, interactive family tree using ReactFlow + Dagre for automatic layout
// Replaces complex SVG rendering with maintainable, scalable solution

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
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

// Manual layout configuration to match SVG hierarchical structure
const getLayoutedElements = (nodes: Node[], edges: Edge[], organizedMembers: any) => {
  const nodeWidth = 150;
  const nodeHeight = 80;
  const horizontalSpacing = 200;
  const verticalSpacing = 150;
  const startX = 100;
  const startY = 50;

  // Create a map of node positions by generation
  const positionedNodes = new Map();
  let currentY = startY;

  // Position grandparents (if any)
  if (organizedMembers.grandparents.length > 0) {
    const grandparentY = currentY;
    organizedMembers.grandparents.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: grandparentY });
    });
    currentY += verticalSpacing;
  }

  // Position parents
  if (organizedMembers.parents.length > 0) {
    const parentY = currentY;
    const parentCount = organizedMembers.parents.length;
    const totalWidth = (parentCount - 1) * horizontalSpacing;
    const startParentX = startX - (totalWidth / 2);

    organizedMembers.parents.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startParentX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: parentY });
    });
    currentY += verticalSpacing;
  }

  // Position children
  if (organizedMembers.children.length > 0) {
    const childY = currentY;
    const childCount = organizedMembers.children.length;
    const totalWidth = (childCount - 1) * horizontalSpacing;
    const startChildX = startX - (totalWidth / 2);

    organizedMembers.children.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startChildX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: childY });
    });
    currentY += verticalSpacing;
  }

  // Position grandchildren (if any)
  if (organizedMembers.grandchildren.length > 0) {
    const grandchildY = currentY;
    const grandchildCount = organizedMembers.grandchildren.length;
    const totalWidth = (grandchildCount - 1) * horizontalSpacing;
    const startGrandchildX = startX - (totalWidth / 2);

    organizedMembers.grandchildren.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startGrandchildX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: grandchildY });
    });
  }

  // Update node positions
  return {
    nodes: nodes.map((node) => {
      const position = positionedNodes.get(node.id) || { x: 0, y: 0 };
      return { 
        ...node, 
        position,
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
    console.log('🔍 ReactFlowFamilyTree: Processing relationships:', relationships);
    relationships.forEach(rel => {
      console.log('🔍 ReactFlowFamilyTree: Processing relationship:', rel);
      if (rel.is_active) {
        const sourceId = String(rel.person1);
        const targetId = String(rel.person2);
        
        console.log('🔍 ReactFlowFamilyTree: Looking for nodes:', { sourceId, targetId });
        console.log('🔍 ReactFlowFamilyTree: Available node IDs:', flowNodes.map(n => n.id));
        
        // Ensure both nodes exist
        const sourceExists = flowNodes.some(node => node.id === sourceId);
        const targetExists = flowNodes.some(node => node.id === targetId);
        
        console.log('🔍 ReactFlowFamilyTree: Node existence check:', { sourceExists, targetExists });
        
        if (sourceExists && targetExists) {
          let edgeStyle = { stroke: '#8B4513', strokeWidth: 2 };
          let edgeType = 'smoothstep';
          
          // Style based on relationship type
          switch (rel.relationship_type) {
            case 'parent':
            case 'child':
              edgeStyle = { stroke: '#8B4513', strokeWidth: 3 };
              edgeType = 'straight';
              break;
            case 'spouse':
              edgeStyle = { stroke: '#FF69B4', strokeWidth: 2, strokeDasharray: '5,5' };
              edgeType = 'straight';
              break;
            case 'grandparent':
            case 'grandchild':
              edgeStyle = { stroke: '#9370DB', strokeWidth: 3 };
              edgeType = 'straight';
              break;
            case 'sibling':
              edgeStyle = { stroke: '#32CD32', strokeWidth: 2 };
              edgeType = 'straight';
              break;
            default:
              edgeStyle = { stroke: '#8B4513', strokeWidth: 3 };
              edgeType = 'straight';
          }
          
          flowEdges.push({
            id: `rel-${rel.id}`,
            source: sourceId,
            target: targetId,
            animated: false,
            style: edgeStyle,
            type: edgeType,
            markerEnd: {
              type: 'arrowclosed',
              color: edgeStyle.stroke,
              width: 15,
              height: 15,
            },
            markerStart: {
              type: 'arrowclosed',
              color: edgeStyle.stroke,
              width: 15,
              height: 15,
            },
            data: { relationship: rel }
          });
          
          console.log(`🔍 ReactFlowFamilyTree: Added relationship edge: ${rel.relationship_type} (${rel.person1} -> ${rel.person2})`);
        } else {
          console.log(`⚠️ ReactFlowFamilyTree: Skipping relationship ${rel.id} - missing nodes: source=${sourceExists}, target=${targetExists}`);
        }
      }
    });

    // Fallback: If no relationships found, create connections based on family structure
    console.log('🔍 ReactFlowFamilyTree: Checking fallback connections:', {
      flowEdgesLength: flowEdges.length,
      parentsCount: organizedMembers.parents.length,
      childrenCount: organizedMembers.children.length
    });
    
    if (flowEdges.length === 0 && organizedMembers.parents.length > 0 && organizedMembers.children.length > 0) {
      console.log('🔍 ReactFlowFamilyTree: No relationships found, creating fallback connections');
      organizedMembers.parents.forEach(parent => {
        organizedMembers.children.forEach(child => {
          const edge = {
            id: `fallback-${parent.entry.pid}-${child.entry.pid}`,
            source: String(parent.entry.pid),
            target: String(child.entry.pid),
            animated: false,
            style: { stroke: '#8B4513', strokeWidth: 3 },
            type: 'straight',
            markerEnd: {
              type: 'arrowclosed',
              color: '#8B4513',
              width: 20,
              height: 20,
            },
          };
          console.log('🔍 ReactFlowFamilyTree: Creating fallback edge:', edge);
          flowEdges.push(edge);
        });
      });
      console.log('🔍 ReactFlowFamilyTree: Created fallback edges:', flowEdges.length);
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
              type: 'straight',
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

  // Apply manual layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const layouted = getLayoutedElements(nodes, edges, organizedMembers);
    console.log('🔍 ReactFlowFamilyTree: After manual layout:', {
      nodesCount: layouted.nodes.length,
      edgesCount: layouted.edges.length,
      edges: layouted.edges
    });
    return layouted;
  }, [nodes, edges, organizedMembers]);

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
      {/* Debug info */}
      <div style={{ padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
        <strong>Debug Info:</strong> Nodes: {layoutedNodes.length}, Edges: {layoutedEdges.length}
        {layoutedEdges.length > 0 && (
          <div>
            <strong>Edges:</strong> {layoutedEdges.map(e => `${e.source}→${e.target}`).join(', ')}
          </div>
        )}
      </div>
      <style>{`
        .react-flow__edge-path {
          stroke: #8B4513 !important;
          stroke-width: 4px !important;
          stroke-opacity: 1 !important;
        }
        .react-flow__edge-arrowhead {
          fill: #8B4513 !important;
          stroke: #8B4513 !important;
        }
        .react-flow__edge {
          z-index: 1000 !important;
        }
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #8B4513 !important;
        }
        .react-flow__edge:hover .react-flow__edge-path {
          stroke: #8B4513 !important;
        }
        .react-flow__edge-text {
          fill: #8B4513 !important;
        }
        .react-flow__edge-textbg {
          fill: white !important;
        }
      `}</style>
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
        style={{ background: '#f8f9fa' }}
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
