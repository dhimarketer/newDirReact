// 2025-01-31: ReactFlow-based family tree component
// Professional, interactive family tree using ReactFlow for clean organizational chart layout
// Matches SVG implementation quality with better maintainability

import React, { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFamilyOrganization } from './hooks/useFamilyOrganization';

// Define types locally to avoid import issues
interface FamilyMember {
  entry: {
    pid: number;
    name: string;
    age?: number;
    gender?: string;
  };
  generation?: string;
  familyGroupId?: number;
}

interface FamilyRelationship {
  id: number;
  person1: number;
  person2: number;
  relationship_type: string;
  is_active: boolean;
}

interface ReactFlowFamilyTreeProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  onRelationshipChange?: (relationship: FamilyRelationship) => void;
  hasMultipleFamilies?: boolean;
}

// Professional node component matching clean SVG styling
const FamilyMemberNode: React.FC<{ data: any }> = ({ data }) => {
  const { member, generation } = data;
  
  // Clean, professional styling matching SVG implementation
  const getNodeStyle = () => {
    switch (generation) {
      case 'grandparent':
        return { 
          backgroundColor: '#FFF8DC', 
          borderColor: '#DAA520',
          textColor: '#8B4513'
        };
      case 'parent':
        return { 
          backgroundColor: '#fef3c7', 
          borderColor: '#8B4513',
          textColor: '#1f2937'
        };
      case 'child':
        return { 
          backgroundColor: '#dbeafe', 
          borderColor: '#8B4513',
          textColor: '#1f2937'
        };
      case 'grandchild':
        return { 
          backgroundColor: '#F5F5DC', 
          borderColor: '#DEB887',
          textColor: '#8B4513'
        };
      default:
        return { 
          backgroundColor: '#dbeafe', 
          borderColor: '#8B4513',
          textColor: '#1f2937'
        };
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
        fontWeight: '500',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        color: nodeStyle.textColor
      }}
    >
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '2px', 
        fontSize: '12px',
        lineHeight: '1.2'
      }}>
        {member.entry.name}
      </div>
      <div style={{ 
        fontSize: '10px', 
        color: '#6b7280', 
        fontWeight: '400',
        lineHeight: '1.2'
      }}>
        {member.entry.age ? `${member.entry.age} years` : 'Age unknown'}
      </div>
    </div>
  );
};

// Custom node types
const nodeTypes: NodeTypes = {
  familyMember: FamilyMemberNode,
};

// Professional hierarchical layout matching clean SVG organizational chart structure
const getLayoutedElements = (nodes: Node[], edges: Edge[], organizedMembers: any) => {
  const horizontalSpacing = 180; // Reduced for tighter, more professional layout
  const verticalSpacing = 140;   // Reduced for better proportions
  const startX = 300;            // Centered starting position
  const startY = 60;             // Reduced top margin

  // Create a map of node positions by generation
  const positionedNodes = new Map();
  let currentY = startY;

  // Position grandparents (if any) - top level
  if (organizedMembers.grandparents.length > 0) {
    const grandparentY = currentY;
    const grandparentCount = organizedMembers.grandparents.length;
    const totalWidth = Math.max((grandparentCount - 1) * horizontalSpacing, 200);
    const startGrandparentX = startX - (totalWidth / 2);

    organizedMembers.grandparents.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startGrandparentX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: grandparentY });
    });
    currentY += verticalSpacing;
  }

  // Position parents - center them horizontally (main level)
  if (organizedMembers.parents.length > 0) {
    const parentY = currentY;
    const parentCount = organizedMembers.parents.length;
    const totalWidth = Math.max((parentCount - 1) * horizontalSpacing, 200);
    const startParentX = startX - (totalWidth / 2);

    organizedMembers.parents.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startParentX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: parentY });
    });
    currentY += verticalSpacing;
  }

  // Position children - center them horizontally (main level)
  if (organizedMembers.children.length > 0) {
    const childY = currentY;
    const childCount = organizedMembers.children.length;
    const totalWidth = Math.max((childCount - 1) * horizontalSpacing, 200);
    const startChildX = startX - (totalWidth / 2);

    organizedMembers.children.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startChildX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: childY });
    });
    currentY += verticalSpacing;
  }

  // Position grandchildren (if any) - bottom level
  if (organizedMembers.grandchildren.length > 0) {
    const grandchildY = currentY;
    const grandchildCount = organizedMembers.grandchildren.length;
    const totalWidth = Math.max((grandchildCount - 1) * horizontalSpacing, 200);
    const startGrandchildX = startX - (totalWidth / 2);

    organizedMembers.grandchildren.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startGrandchildX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: grandchildY });
    });
  }

  // Update node positions with professional spacing
  const layoutedNodes = nodes.map((node) => {
    const position = positionedNodes.get(node.id) || { x: 0, y: 0 };
    return { 
      ...node, 
      position,
      type: 'familyMember'
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
};

const ReactFlowFamilyTree: React.FC<ReactFlowFamilyTreeProps> = ({
  familyMembers,
  relationships = [],
  hasMultipleFamilies = false
}) => {
  console.log('🔍 ReactFlowFamilyTree - Component called with:', {
    familyMembersCount: familyMembers.length,
    relationshipsCount: relationships.length,
    hasMultipleFamilies
  });

  // Reuse existing data processing logic
  const organizedMembers = useFamilyOrganization(familyMembers, relationships);

  // Convert to ReactFlow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    const addedNodeIds = new Set<string>(); // Prevent duplicate nodes


    // Add grandparents (only if not already added)
    organizedMembers.grandparents.forEach((member: any) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'grandparent',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`
          },
          position: { x: 0, y: 0 }, // Will be set by layout
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Add parents (only if not already added)
    organizedMembers.parents.forEach((member: any) => {
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
          position: { x: 0, y: 0 }, // Will be set by layout
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Add children (only if not already added)
    organizedMembers.children.forEach((member: any) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'child',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`
          },
          position: { x: 0, y: 0 }, // Will be set by layout
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Add grandchildren (only if not already added)
    organizedMembers.grandchildren.forEach((member: any) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'grandchild',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`
          },
          position: { x: 0, y: 0 }, // Will be set by layout
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Create clean, professional edges based on family structure
    // Parent-child relationships
    organizedMembers.parents.forEach((parent: any) => {
      organizedMembers.children.forEach((child: any) => {
        const edge: Edge = {
          id: `parent-child-${parent.entry.pid}-${child.entry.pid}`,
          source: String(parent.entry.pid),
          target: String(child.entry.pid),
          type: 'straight',
          style: { 
            stroke: '#8B4513', 
            strokeWidth: 3 
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8B4513',
            width: 15,
            height: 15,
          }
        };
        flowEdges.push(edge);
      });
    });

    // Grandparent-grandchild relationships
    organizedMembers.grandparents.forEach((grandparent: any) => {
      organizedMembers.grandchildren.forEach((grandchild: any) => {
        const edge: Edge = {
          id: `grandparent-grandchild-${grandparent.entry.pid}-${grandchild.entry.pid}`,
          source: String(grandparent.entry.pid),
          target: String(grandchild.entry.pid),
          type: 'straight',
          style: { 
            stroke: '#8B4513', 
            strokeWidth: 3 
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8B4513',
            width: 15,
            height: 15,
          }
        };
        flowEdges.push(edge);
      });
    });

    // Spouse relationships (horizontal dashed lines, no arrows)
    if (organizedMembers.parents.length >= 2) {
      const parent1 = organizedMembers.parents[0];
      const parent2 = organizedMembers.parents[1];
      const edge: Edge = {
        id: `spouse-${parent1.entry.pid}-${parent2.entry.pid}`,
        source: String(parent1.entry.pid),
        target: String(parent2.entry.pid),
        type: 'straight',
        style: { 
          stroke: '#ec4899', 
          strokeWidth: 2,
          strokeDasharray: '5,5'
        }
      };
      flowEdges.push(edge);
    }

    
    console.log('🔍 ReactFlowFamilyTree - Final data:', {
      nodesCount: flowNodes.length,
      edgesCount: flowEdges.length,
      nodeIds: flowNodes.map(n => n.id),
      edgeDetails: flowEdges.map(e => ({ id: e.id, source: e.source, target: e.target, style: e.style, markerEnd: e.markerEnd }))
    });
    
    // Debug edge creation
    console.log('🔍 ReactFlowFamilyTree - Edge creation debug:', {
      parentCount: organizedMembers.parents.length,
      childCount: organizedMembers.children.length,
      grandparentCount: organizedMembers.grandparents.length,
      grandchildCount: organizedMembers.grandchildren.length,
      expectedParentChildEdges: organizedMembers.parents.length * organizedMembers.children.length,
      expectedGrandparentGrandchildEdges: organizedMembers.grandparents.length * organizedMembers.grandchildren.length
    });
    
    return { nodes: flowNodes, edges: flowEdges };
  }, [organizedMembers, hasMultipleFamilies, relationships]);

  // Apply manual layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, organizedMembers);
  }, [initialNodes, initialEdges, organizedMembers]);


  // Don't render if no members
  if (familyMembers.length === 0) {
    console.log('🔍 ReactFlowFamilyTree - No family members, showing empty state');
    return (
      <div style={{ 
        width: '100%', 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        background: '#f9f9f9'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>No family members found</p>
          <p style={{ fontSize: '14px', color: '#999' }}>Try searching for a different address or create a new family</p>
        </div>
      </div>
    );
  }

  console.log('🔍 ReactFlowFamilyTree - Rendering with:', {
    layoutedNodesCount: layoutedNodes.length,
    layoutedEdgesCount: layoutedEdges.length,
    firstNode: layoutedNodes[0],
    firstEdge: layoutedEdges[0]
  });

  return (
    <div style={{ 
      width: '100%', 
      height: '600px', 
      border: '1px solid #e0e0e0', 
      borderRadius: 8, 
      background: '#ffffff',
      position: 'relative'
    }}>
      <style>{`
        .react-flow__edge {
          stroke: #8B4513 !important;
          stroke-width: 5px !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 10 !important;
        }
        .react-flow__edge-path {
          stroke: #8B4513 !important;
          stroke-width: 5px !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 10 !important;
        }
        .react-flow__edge-arrowhead {
          fill: #8B4513 !important;
          stroke: #8B4513 !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 10 !important;
        }
        .react-flow__renderer {
          overflow: visible !important;
        }
        .react-flow__viewport {
          overflow: visible !important;
        }
        svg {
          overflow: visible !important;
        }
        .react-flow__edge.selected {
          stroke: #ff0000 !important;
          stroke-width: 8px !important;
        }
        .react-flow__edge:hover {
          stroke: #ff6600 !important;
          stroke-width: 6px !important;
        }
      `}</style>
      <ReactFlow
        nodes={layoutedNodes}
        edges={layoutedEdges}
        nodeTypes={nodeTypes}
        fitView
        nodesConnectable={false}
        nodesDraggable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        attributionPosition="bottom-left"
        style={{ background: '#ffffff' }}
        defaultEdgeOptions={{
          style: { stroke: '#8B4513', strokeWidth: 3 },
          type: 'straight',
        }}
        onInit={() => {
          console.log('🔍 ReactFlow onInit - Nodes:', layoutedNodes.length, 'Edges:', layoutedEdges.length);
          console.log('🔍 ReactFlow onInit - First few edges:', layoutedEdges.slice(0, 3));
        }}
        onEdgesChange={(changes) => {
          console.log('🔍 ReactFlow onEdgesChange:', changes);
        }}
        onNodesChange={(changes) => {
          console.log('🔍 ReactFlow onNodesChange:', changes);
        }}
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const generation = node.data?.generation;
            switch (generation) {
              case 'grandparent': return '#FFF8DC';
              case 'parent': return '#fef3c7';
              case 'child': return '#dbeafe';
              case 'grandchild': return '#F5F5DC';
              default: return '#dbeafe';
            }
          }}
          nodeBorderRadius={6}
          style={{ background: '#f8f9fa' }}
        />
        <Background color="#f0f0f0" gap={20} />
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
