import React, { useMemo, useCallback } from 'react';
import { ReactFlow, Node, Edge, MarkerType, ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
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
  // 2025-01-31: Removed console.log to prevent infinite loop - was causing excessive re-renders

  // Use proper family organization logic
  const organizedMembers = useFamilyOrganization(familyMembers, relationships);

  // Create organized family tree nodes - SIMPLIFIED APPROACH
  const nodes: Node[] = useMemo(() => {
    if (familyMembers.length === 0) return [];
    
    const nodes: Node[] = [];
    const horizontalSpacing = 200;
    const verticalSpacing = 150;
    const startX = 300;
    const startY = 50;
    
    // 2025-01-31: Removed console.log to prevent infinite loop
    
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
              minWidth: '120px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '500',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              color: '#1f2937'
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

    // 2025-01-31: Removed center node - children will connect directly to spouse line
    
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
              minWidth: '120px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '500',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              color: '#1f2937'
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
    
    // 2025-01-31: Removed console.log to prevent infinite loop
    return nodes;
  }, [familyMembers.length, organizedMembers.parents.length, organizedMembers.children.length, organizedMembers.parents, organizedMembers.children]);

  // Create organizational chart style edges with center connection
  const edges: Edge[] = useMemo(() => {
    // 2025-01-31: Removed console.log to prevent infinite loop
    
    if (organizedMembers.parents.length + organizedMembers.children.length < 2) {
      return [];
    }
    
    const edges: Edge[] = [];
    const edgeIds = new Set<string>(); // 2025-01-31: Track edge IDs to prevent duplicates
    
    // 2025-01-31: Define layout constants for edge calculations
    const horizontalSpacing = 200;
    const verticalSpacing = 150;
    const startX = 300;
    const startY = 50;
    const childrenY = startY + verticalSpacing;
    
    // 2025-01-31: Helper function to safely add edges and prevent duplicates
    const addEdge = (edge: Edge) => {
      if (!edgeIds.has(edge.id)) {
        edgeIds.add(edge.id);
        edges.push(edge);
      }
    };
    
    // COMPREHENSIVE SOLUTION: Create proper organizational chart structure
    if (organizedMembers.parents.length > 0 && organizedMembers.children.length > 0) {
      if (organizedMembers.parents.length === 2) {
        // TWO PARENTS: Create horizontal spouse line + direct connection to children
        const parent1 = organizedMembers.parents[0];
        const parent2 = organizedMembers.parents[1];
        
        // 2025-01-31: Removed console.log to prevent infinite loop
        
        // 1. Create horizontal spouse line between parents
        addEdge({
          id: `spouse-${parent1.entry.pid}-${parent2.entry.pid}`,
          source: String(parent1.entry.pid),
          target: String(parent2.entry.pid),
          type: 'straight',
          style: { 
            stroke: '#ec4899', 
            strokeWidth: 3,
            strokeDasharray: '8,4'
          }
        });
        
        // 2. Connect each child to both parents (creating a V-shape that meets at the center)
        organizedMembers.children.forEach((child: any, childIndex: number) => {
          const childX = startX - ((organizedMembers.children.length - 1) * horizontalSpacing) / 2 + (childIndex * horizontalSpacing);
          
          // Connect from parent1 to child
          addEdge({
            id: `parent1-to-child-${child.entry.pid}`,
            source: String(parent1.entry.pid),
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
              height: 10,
            }
          });
          
          // Connect from parent2 to child (this will create the V-shape meeting at center)
          addEdge({
            id: `parent2-to-child-${child.entry.pid}`,
            source: String(parent2.entry.pid),
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
              height: 10,
            }
          });
        });
        
        // 2025-01-31: Removed console.log to prevent infinite loop
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
              width: 12,
              height: 12,
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
    
    // 2025-01-31: Removed console.log to prevent infinite loop
    return edges;
  }, [organizedMembers.parents.length, organizedMembers.children.length, organizedMembers.parents, organizedMembers.children]);

  // 2025-01-31: Removed console.log to prevent infinite loop

  // Use ReactFlow hooks for proper state management
  const [reactFlowNodes, , onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, , onEdgesChange] = useEdgesState(edges);

  // 2025-01-31: Added useCallback to prevent unnecessary re-renders
  const handleNodesChange = useCallback(onNodesChange, [onNodesChange]);
  const handleEdgesChange = useCallback(onEdgesChange, [onEdgesChange]);

  // 2025-01-31: FIXED - Removed useEffect that was causing infinite loop
  // ReactFlow hooks already handle state updates automatically

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
          stroke-width: 2px !important;
        }
        .react-flow__edge-path {
          stroke: #8B4513 !important;
          stroke-width: 2px !important;
        }
        .react-flow__edge-arrowhead {
          fill: #8B4513 !important;
          stroke: #8B4513 !important;
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
            width: 12,
            height: 12,
          }
        }}
        onInit={() => {
          // 2025-01-31: Removed console.log to prevent infinite loop
        }}
      />
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
