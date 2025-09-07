import React, { useMemo } from 'react';
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
  relationships = [],
  hasMultipleFamilies = false
}) => {
  console.log('🔍 SimpleReactFlowFamilyTree - Component called with:', {
    familyMembersCount: familyMembers.length,
    relationshipsCount: relationships.length,
    hasMultipleFamilies
  });

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
    
    console.log('🔍 SimpleReactFlowFamilyTree - Organized members:', {
      parents: organizedMembers.parents.length,
      children: organizedMembers.children.length,
      grandparents: organizedMembers.grandparents.length,
      grandchildren: organizedMembers.grandchildren.length
    });
    
    // Position parents at top center
    organizedMembers.parents.forEach((parent, index) => {
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
    
    // Position children below parents
    const childrenY = startY + verticalSpacing;
    organizedMembers.children.forEach((child, index) => {
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
    
    return nodes;
  }, [familyMembers, organizedMembers]);

  // Create organizational chart style edges - MATCHING SVG STRUCTURE
  const edges: Edge[] = useMemo(() => {
    if (organizedMembers.parents.length + organizedMembers.children.length < 2) return [];
    
    const edges: Edge[] = [];
    
    // ORGANIZATIONAL CHART STRUCTURE: Individual parent-child connections
    if (organizedMembers.parents.length > 0 && organizedMembers.children.length > 0) {
      // Individual parent-to-child connections (organizational chart style)
      organizedMembers.parents.forEach((parent) => {
        organizedMembers.children.forEach((child) => {
          edges.push({
            id: `parent-child-${parent.entry.pid}-${child.entry.pid}`,
            source: String(parent.entry.pid),
            target: String(child.entry.pid),
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
          });
        });
      });
    }
    
    // Spouse connections between parents (horizontal dashed lines)
    if (organizedMembers.parents.length >= 2) {
      const parent1 = organizedMembers.parents[0];
      const parent2 = organizedMembers.parents[1];
      edges.push({
        id: `spouse-${parent1.entry.pid}-${parent2.entry.pid}`,
        source: String(parent1.entry.pid),
        target: String(parent2.entry.pid),
        type: 'straight',
        style: { 
          stroke: '#ec4899', 
          strokeWidth: 2,
          strokeDasharray: '8,4'
        }
      });
    }
    
    // Fallback: If no parents detected, create sibling connections
    if (organizedMembers.parents.length === 0 && organizedMembers.children.length > 1) {
      for (let i = 0; i < organizedMembers.children.length; i++) {
        for (let j = i + 1; j < organizedMembers.children.length; j++) {
          const child1 = organizedMembers.children[i];
          const child2 = organizedMembers.children[j];
          edges.push({
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
  }, [organizedMembers]);

  console.log('🔍 SimpleReactFlowFamilyTree - Created:', { nodes: nodes.length, edges: edges.length });

  // Use ReactFlow hooks for proper state management
  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

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
          console.log('🔍 SimpleReactFlowFamilyTree - ReactFlow initialized with:', { nodes: reactFlowNodes.length, edges: reactFlowEdges.length });
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
