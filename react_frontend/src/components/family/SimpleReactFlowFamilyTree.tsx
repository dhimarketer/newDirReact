import React, { useMemo, useCallback, useEffect } from 'react';
import { ReactFlow, Node, Edge, MarkerType, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background } from '@xyflow/react';
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

const SimpleReactFlowFamilyTree: React.FC<SimpleReactFlowFamilyTreeProps> = ({
  familyMembers,
  relationships = []
}) => {
  // Use proper family organization logic
  const organizedMembers = useFamilyOrganization(familyMembers, relationships);

  // Create organized family tree nodes with invisible union node
  const nodes: Node[] = useMemo(() => {
    if (familyMembers.length === 0) return [];
    
    const nodes: Node[] = [];
    const horizontalSpacing = 200;
    const verticalSpacing = 150;
    const startX = 300;
    const startY = 50;
    
    // Position parents at top center
    organizedMembers.parents.forEach((parent: any, index: number) => {
      const parentX = startX - ((organizedMembers.parents.length - 1) * horizontalSpacing) / 2 + (index * horizontalSpacing);
      nodes.push({
        id: String(parent.entry.pid),
        type: 'default',
        draggable: true,
        data: { 
          label: (
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#fef3c7', 
              border: '2px solid #8B4513',
              borderRadius: '8px',
              width: '120px',
              height: '60px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '500',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              color: '#1f2937',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{parent.entry.name}</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>
                {parent.entry.age ? `${parent.entry.age} years` : 'Age unknown'}
              </div>
            </div>
          )
        },
        position: { x: parentX, y: startY },
      });
    });

    // 2025-01-31: Add invisible union node for two-parent families
    if (organizedMembers.parents.length === 2) {
      const parent1X = startX - ((organizedMembers.parents.length - 1) * horizontalSpacing) / 2;
      const parent2X = startX + ((organizedMembers.parents.length - 1) * horizontalSpacing) / 2;
      const unionX = (parent1X + parent2X) / 2;
      const unionY = startY + (verticalSpacing / 2);
      
      nodes.push({
        id: 'union-node',
        type: 'default',
        draggable: false,
        data: { 
          label: null // Invisible node
        },
        position: { x: unionX, y: unionY },
        style: {
          background: 'transparent',
          border: 'none',
          width: 0,
          height: 0,
          zIndex: 1,
          opacity: 0
        }
      });
    }
    
    // Position children below parents
    const childrenY = startY + verticalSpacing;
    organizedMembers.children.forEach((child: any, index: number) => {
      const childX = startX - ((organizedMembers.children.length - 1) * horizontalSpacing) / 2 + (index * horizontalSpacing);
      nodes.push({
        id: String(child.entry.pid),
        type: 'default',
        draggable: true,
        data: { 
          label: (
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#dbeafe', 
              border: '2px solid #8B4513',
              borderRadius: '8px',
              width: '120px',
              height: '60px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '500',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              color: '#1f2937',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{child.entry.name}</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>
                {child.entry.age ? `${child.entry.age} years` : 'Age unknown'}
              </div>
            </div>
          )
        },
        position: { x: childX, y: childrenY },
      });
    });
    
    return nodes;
  }, [familyMembers.length, organizedMembers.parents.length, organizedMembers.children.length]);

  // Create organizational chart style edges with union node approach
  const edges: Edge[] = useMemo(() => {
    if (organizedMembers.parents.length + organizedMembers.children.length < 2) {
      return [];
    }
    
    const edges: Edge[] = [];
    const edgeIds = new Set<string>();
    
    // Helper function to safely add edges and prevent duplicates
    const addEdge = (edge: Edge) => {
      if (!edgeIds.has(edge.id)) {
        edgeIds.add(edge.id);
        edges.push(edge);
      }
    };
    
    // Create proper organizational chart structure using union node approach
    if (organizedMembers.parents.length > 0 && organizedMembers.children.length > 0) {
      if (organizedMembers.parents.length === 2) {
        // TWO PARENTS: Use union node approach for clean organizational chart
        const parent1 = organizedMembers.parents[0];
        const parent2 = organizedMembers.parents[1];
        
        // 1. Create horizontal dashed pink spouse line between parents using straight edge
        addEdge({
          id: `spouse-${parent1.entry.pid}-${parent2.entry.pid}`,
          source: String(parent1.entry.pid),
          target: String(parent2.entry.pid),
          type: 'straight',
          style: { 
            stroke: '#ec4899', 
            strokeWidth: 3,
            strokeDasharray: '8,4'
          },
          // Force horizontal connection by using specific handles
          sourceHandle: 'right',
          targetHandle: 'left'
        });
        
        // 2. Create vertical solid brown line from center of spouse line to union node
        addEdge({
          id: `spouse-center-to-union`,
          source: String(parent1.entry.pid),
          target: 'union-node',
          type: 'straight',
          style: { 
            stroke: '#8B4513', 
            strokeWidth: 3
          },
          // Connect from bottom center of first parent to union node
          sourceHandle: 'bottom',
          targetHandle: 'top'
        });
        
        // 3. Connect each child to the union node (clean single line per child)
        organizedMembers.children.forEach((child: any) => {
          addEdge({
            id: `union-to-child-${child.entry.pid}`,
            source: 'union-node',
            target: String(child.entry.pid),
            type: 'straight',
            style: { 
              stroke: '#8B4513', 
              strokeWidth: 2
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#8B4513',
              width: 10,
              height: 7,
            }
          });
        });
        
      } else {
        // SINGLE PARENT: Connect directly to children
        const parent = organizedMembers.parents[0];
        organizedMembers.children.forEach((child: any) => {
          addEdge({
            id: `parent-to-child-${child.entry.pid}`,
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
              width: 10,
              height: 7,
            }
          });
        });
      }
    }
    
    // Fallback: If no parents detected, create sibling connections
    if (organizedMembers.parents.length === 0 && organizedMembers.children.length > 1) {
      for (let i = 0; i < organizedMembers.children.length; i++) {
        for (let j = i + 1; j < organizedMembers.children.length; j++) {
          const child1 = organizedMembers.children[i];
          const child2 = organizedMembers.children[j];
          addEdge({
            id: `sibling-${child1.entry.pid}-${child2.entry.pid}`,
            source: String(child1.entry.pid),
            target: String(child2.entry.pid),
            type: 'straight',
            style: { 
              stroke: '#8B4513', 
              strokeWidth: 1,
              strokeDasharray: '5,5'
            }
          });
        }
      }
    }
    
    return edges;
  }, [organizedMembers.parents.length, organizedMembers.children.length]);

  // 2025-01-31: Removed console.log to prevent infinite loop

  // Use ReactFlow hooks for proper state management
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, , onEdgesChange] = useEdgesState(edges);

  // 2025-01-31: Optimized useCallback for event handlers to prevent unnecessary re-renders
  const handleNodesChange = useCallback(onNodesChange, [onNodesChange]);
  const handleEdgesChange = useCallback(onEdgesChange, [onEdgesChange]);
  
  // 2025-01-31: Memoize onInit callback to prevent unnecessary re-renders
  const handleInit = useCallback(() => {
    // ReactFlow initialization callback
    // Can be used for additional setup if needed
  }, []);

  // 2025-01-31: Removed custom edge types to use simpler straight edges for better control

  // 2025-01-31: Optimized dynamic union node positioning when parents are dragged
  useEffect(() => {
    if (organizedMembers.parents.length === 2) {
      const parent1Node = reactFlowNodes.find(node => node.id === String(organizedMembers.parents[0].entry.pid));
      const parent2Node = reactFlowNodes.find(node => node.id === String(organizedMembers.parents[1].entry.pid));
      const unionNode = reactFlowNodes.find(node => node.id === 'union-node');
      
      if (parent1Node && parent2Node && unionNode) {
        // Calculate new union node position at midpoint of parents
        const newUnionX = (parent1Node.position.x + parent2Node.position.x) / 2;
        const newUnionY = parent1Node.position.y + 75; // Half of verticalSpacing
        
        // Only update if position has changed (with small tolerance to prevent micro-updates)
        const tolerance = 0.1;
        const xChanged = Math.abs(unionNode.position.x - newUnionX) > tolerance;
        const yChanged = Math.abs(unionNode.position.y - newUnionY) > tolerance;
        
        if (xChanged || yChanged) {
          setReactFlowNodes(prevNodes => 
            prevNodes.map(node => 
              node.id === 'union-node' 
                ? { ...node, position: { x: newUnionX, y: newUnionY } }
                : node
            )
          );
        }
      }
    }
  }, [reactFlowNodes, organizedMembers.parents.length, setReactFlowNodes]);

  if (familyMembers.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
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

  return (
    <div style={{ 
      width: '100%', 
      height: '500px', 
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      background: '#ffffff'
    }}>
      <style>{`
        .react-flow__edge {
          stroke: #8B4513 !important;
          stroke-width: 3px !important;
          z-index: 10 !important;
        }
        .react-flow__edge-path {
          stroke: #8B4513 !important;
          stroke-width: 3px !important;
          z-index: 10 !important;
        }
        .react-flow__edge-arrowhead {
          fill: #8B4513 !important;
          stroke: #8B4513 !important;
          z-index: 10 !important;
        }
        .react-flow__edge[data-id*="spouse"] {
          stroke: #ec4899 !important;
          stroke-width: 3px !important;
          stroke-dasharray: 8,4 !important;
        }
        .react-flow__edge[data-id*="spouse"] .react-flow__edge-path {
          stroke: #ec4899 !important;
          stroke-width: 3px !important;
          stroke-dasharray: 8,4 !important;
        }
        .react-flow__renderer {
          background: #ffffff;
        }
        .react-flow__node {
          cursor: grab !important;
        }
        .react-flow__node:active {
          cursor: grabbing !important;
        }
        .react-flow__node:hover {
          cursor: grab !important;
        }
        .react-flow__controls {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }
        .react-flow__controls-button {
          background: #ffffff !important;
          border: none !important;
          color: #374151 !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        .react-flow__controls-button:hover {
          background: #f9fafb !important;
          color: #1f2937 !important;
        }
        .react-flow__controls-button:last-child {
          border-bottom: none !important;
        }
        .react-flow__background {
          background: #ffffff !important;
        }
      `}</style>
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        fitView
        nodesConnectable={false}
        nodesDraggable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          style: { stroke: '#8B4513', strokeWidth: 2 },
          type: 'straight',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8B4513',
            width: 10,
            height: 7,
          }
        }}
        onInit={handleInit}
      >
        <Controls 
          position="top-right"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
        <Background 
          color="#f8f9fa" 
          gap={20} 
          size={1}
        />
      </ReactFlow>
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
