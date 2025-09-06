import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, useNodesState, useEdgesState, MarkerType, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFamilyOrganization } from './hooks/useFamilyOrganization';

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

interface SimpleReactFlowFamilyTreeProps {
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
const nodeTypes = {
  familyMember: FamilyMemberNode,
};

// Professional hierarchical layout matching clean SVG organizational chart structure
const getLayoutedElements = (nodes: Node[], edges: Edge[], organizedMembers: any) => {
  const horizontalSpacing = 160; // Optimized for clean layout
  const verticalSpacing = 120;   // Optimized for better proportions
  const startX = 400;            // Centered starting position
  const startY = 80;             // Optimized top margin

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

const SimpleReactFlowFamilyTree: React.FC<SimpleReactFlowFamilyTreeProps> = ({
  familyMembers,
  relationships = [],
  hasMultipleFamilies = false
}) => {
  console.log('🔍 SimpleReactFlowFamilyTree - Component called with:', {
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
        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'parent',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`
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

    // FORCE TEST: Always create test edges to verify ReactFlow is working
    if (flowNodes.length >= 2) {
      console.log('🔍 FORCE TEST: Creating test edges to verify ReactFlow rendering');
      
      // Create multiple test edges with different styles
      const testEdge1: Edge = {
        id: 'test-edge-force-1',
        source: flowNodes[0].id,
        target: flowNodes[1].id,
        type: 'straight',
        style: { 
          stroke: '#ff0000', 
          strokeWidth: 8,
          zIndex: 1000
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ff0000',
          width: 20,
          height: 20,
        }
      };
      flowEdges.push(testEdge1);
      
      // Create a second test edge with different style
      const testEdge2: Edge = {
        id: 'test-edge-force-2',
        source: flowNodes[0].id,
        target: flowNodes[1].id,
        type: 'smoothstep',
        style: { 
          stroke: '#00ff00', 
          strokeWidth: 6,
          zIndex: 1001
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#00ff00',
          width: 15,
          height: 15,
        }
      };
      flowEdges.push(testEdge2);
      
      console.log('🔍 FORCE TEST: Added test edges:', [testEdge1, testEdge2]);
    }

    // ADDITIONAL TEST: Create edges between all nodes to test ReactFlow
    if (flowNodes.length > 1) {
      console.log('🔍 ADDITIONAL TEST: Creating edges between all nodes');
      for (let i = 0; i < flowNodes.length - 1; i++) {
        const edge: Edge = {
          id: `test-all-${flowNodes[i].id}-${flowNodes[i + 1].id}`,
          source: flowNodes[i].id,
          target: flowNodes[i + 1].id,
          type: 'straight',
          style: { 
            stroke: '#00ff00', 
            strokeWidth: 3
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#00ff00',
            width: 15,
            height: 15,
          }
        };
        flowEdges.push(edge);
      }
      console.log('🔍 ADDITIONAL TEST: Added', flowNodes.length - 1, 'test edges');
    }

    // Create clean, professional edges based on family structure
    // Parent-child relationships - clean organizational chart style
    if (organizedMembers.parents.length > 0 && organizedMembers.children.length > 0) {
      // Create individual parent-to-child connections
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
    }

    // Sibling relationships (if no parents detected, connect all children as siblings)
    if (organizedMembers.parents.length === 0 && organizedMembers.children.length > 1) {
      console.log('🔍 No parents detected, creating sibling connections between all children');
      for (let i = 0; i < organizedMembers.children.length; i++) {
        for (let j = i + 1; j < organizedMembers.children.length; j++) {
          const child1 = organizedMembers.children[i];
          const child2 = organizedMembers.children[j];
          const edge: Edge = {
            id: `sibling-${child1.entry.pid}-${child2.entry.pid}`,
            source: String(child1.entry.pid),
            target: String(child2.entry.pid),
            type: 'straight',
            style: { 
              stroke: '#8B4513', 
              strokeWidth: 1,
              strokeDasharray: '5,5'
            }
          };
          flowEdges.push(edge);
        }
      }
    }

    // Grandparent-grandchild relationships
    if (organizedMembers.grandparents.length > 0 && organizedMembers.grandchildren.length > 0) {
      organizedMembers.grandparents.forEach((grandparent: any) => {
        organizedMembers.grandchildren.forEach((grandchild: any) => {
          const edge: Edge = {
            id: `grandparent-grandchild-${grandparent.entry.pid}-${grandchild.entry.pid}`,
            source: String(grandparent.entry.pid),
            target: String(grandchild.entry.pid),
            type: 'straight',
            style: { 
              stroke: '#8B4513', 
              strokeWidth: 2 
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#8B4513',
              width: 12,
              height: 12,
            }
          };
          flowEdges.push(edge);
        });
      });
    }

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
          strokeDasharray: '8,4'
        }
      };
      flowEdges.push(edge);
    }

    // Fallback: If no edges created and we have family members, create basic connections
    if (flowEdges.length === 0 && flowNodes.length > 1) {
      console.log('🔍 No specific relationships detected, creating basic family connections');
      for (let i = 0; i < flowNodes.length; i++) {
        for (let j = i + 1; j < flowNodes.length; j++) {
          const node1 = flowNodes[i];
          const node2 = flowNodes[j];
          const edge: Edge = {
            id: `family-${node1.id}-${node2.id}`,
            source: node1.id,
            target: node2.id,
            type: 'straight',
            style: { 
              stroke: '#8B4513', 
              strokeWidth: 1,
              strokeDasharray: '8,4'
            }
          };
          flowEdges.push(edge);
        }
      }
    }

    console.log('🔍 SimpleReactFlowFamilyTree - Final data:', {
      nodesCount: flowNodes.length,
      edgesCount: flowEdges.length,
      nodeIds: flowNodes.map(n => n.id)
    });
    
    return { nodes: flowNodes, edges: flowEdges };
  }, [organizedMembers, hasMultipleFamilies, relationships]);

  // Apply manual layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, organizedMembers);
  }, [initialNodes, initialEdges, organizedMembers]);

  // Use ReactFlow hooks for proper state management
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes and edges when layouted data changes
  React.useEffect(() => {
    console.log('🔍 SimpleReactFlowFamilyTree - Updating nodes and edges:', {
      nodesCount: layoutedNodes.length,
      edgesCount: layoutedEdges.length,
      edgeDetails: layoutedEdges.map(e => ({ id: e.id, source: e.source, target: e.target }))
    });
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Don't render if no members
  if (familyMembers.length === 0) {
    console.log('🔍 SimpleReactFlowFamilyTree - No family members, showing empty state');
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

  console.log('🔍 SimpleReactFlowFamilyTree - Rendering with:', {
    nodesCount: nodes.length,
    edgesCount: edges.length,
    firstNode: nodes[0],
    firstEdge: edges[0],
    allEdges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, style: e.style }))
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
          stroke: #ff0000 !important;
          stroke-width: 10px !important;
          z-index: 9999 !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        .react-flow__edge-path {
          stroke: #ff0000 !important;
          stroke-width: 10px !important;
          z-index: 9999 !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        .react-flow__edge-arrowhead {
          fill: #ff0000 !important;
          stroke: #ff0000 !important;
          z-index: 9999 !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        .react-flow__renderer {
          background: #ffffff !important;
        }
        .react-flow__edge.selected {
          stroke: #ff0000 !important;
          stroke-width: 10px !important;
        }
        .react-flow__edge:hover {
          stroke: #ff0000 !important;
          stroke-width: 10px !important;
        }
        .react-flow__viewport {
          background: #f0f0f0 !important;
        }
        .react-flow__node {
          z-index: 1 !important;
        }
        .react-flow__edge * {
          stroke: #ff0000 !important;
          fill: #ff0000 !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8B4513',
            width: 15,
            height: 15,
          }
        }}
        onInit={() => {
          console.log('🔍 SimpleReactFlow onInit - Nodes:', nodes.length, 'Edges:', edges.length);
          
          // DOM inspection to check if edges are rendered
          setTimeout(() => {
            const edgeElements = document.querySelectorAll('.react-flow__edge');
            const edgePathElements = document.querySelectorAll('.react-flow__edge-path');
            const edgeArrowElements = document.querySelectorAll('.react-flow__edge-arrowhead');
            
            console.log('🔍 DOM INSPECTION - Edge elements found:', {
              edges: edgeElements.length,
              edgePaths: edgePathElements.length,
              edgeArrows: edgeArrowElements.length,
              edgeElements: Array.from(edgeElements).map(el => ({
                tagName: el.tagName,
                className: el.className,
                style: el.getAttribute('style'),
                id: el.id
              }))
            });
            
            // Check if any edges are visible
            edgeElements.forEach((edge, index) => {
              const rect = edge.getBoundingClientRect();
              const computedStyle = window.getComputedStyle(edge);
              console.log(`🔍 Edge ${index}:`, {
                rect: rect,
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                stroke: computedStyle.stroke,
                strokeWidth: computedStyle.strokeWidth
              });
            });
          }, 1000);
        }}
      />
      
      {/* FORCE TEST: Direct SVG overlay to test if edges are being created */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10000
      }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <line 
            x1="100" 
            y1="100" 
            x2="300" 
            y2="200" 
            stroke="#ff0000" 
            strokeWidth="10"
            style={{ zIndex: 10001 }}
          />
          <text x="50" y="50" fill="#ff0000" fontSize="20" style={{ zIndex: 10001 }}>
            TEST LINE - If you see this, SVG works
          </text>
        </svg>
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider for proper context
const SimpleReactFlowFamilyTreeWithProvider: React.FC<SimpleReactFlowFamilyTreeProps> = (props) => {
  return (
    <ReactFlowProvider>
      <SimpleReactFlowFamilyTree {...props} />
    </ReactFlowProvider>
  );
};

export default SimpleReactFlowFamilyTreeWithProvider;
