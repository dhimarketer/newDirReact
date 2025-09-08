import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, useNodesState, useEdgesState, MarkerType, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFamilyOrganization } from './hooks/useFamilyOrganization';

interface SimpleReactFlowTestProps {
  familyMembers: any[];
}

const SimpleReactFlowTest: React.FC<SimpleReactFlowTestProps> = ({ familyMembers }) => {
  console.log('🔍 SimpleReactFlowTest - Component called with:', familyMembers.length, 'members');

  // Use proper family organization logic
  const organizedMembers = useFamilyOrganization(familyMembers, []);

  // Create organized family tree nodes
  const nodes: Node[] = useMemo(() => {
    if (familyMembers.length === 0) return [];
    
    const nodes: Node[] = [];
    const horizontalSpacing = 200;
    const verticalSpacing = 150;
    const startX = 300;
    const startY = 50;
    
    console.log('🔍 SimpleReactFlowTest - Organized members:', {
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

    // Add center node positioned ON the horizontal spouse line
    if (organizedMembers.parents.length === 2) {
      // Calculate center position between parents
      const parent1X = startX - ((organizedMembers.parents.length - 1) * horizontalSpacing) / 2;
      const parent2X = startX + ((organizedMembers.parents.length - 1) * horizontalSpacing) / 2;
      const centerX = (parent1X + parent2X) / 2;
      
      // Add center node positioned ON the horizontal spouse line
      nodes.push({
        id: 'parent-center',
        type: 'default',
        draggable: false,
        position: { x: centerX, y: startY }, // ON the horizontal spouse line
        data: {
          label: null // Invisible node
        },
        style: {
          background: 'transparent',
          border: 'none',
          width: 0,
          height: 0,
          zIndex: 10
        }
      });
    }
    
    // Position children below parents
    const childrenY = startY + verticalSpacing;
    organizedMembers.children.forEach((child, index) => {
      const childX = startX - ((organizedMembers.children.length - 1) * horizontalSpacing) / 2 + (index * horizontalSpacing);
      nodes.push({
        id: String(child.entry.pid),
        type: 'default',
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

  // Create clean family relationship edges - ONE LINE PER CHILD
  const edges: Edge[] = useMemo(() => {
    if (nodes.length < 2) return [];
    
    const edges: Edge[] = [];
    
    // ORGANIZATIONAL CHART: Lines from center of parent relationship to each child
    if (organizedMembers.parents.length > 0 && organizedMembers.children.length > 0) {
      if (organizedMembers.parents.length === 2) {
        // Two parents: Connect children to center of horizontal spouse line
        const centerNodeId = 'parent-center';
        
        // Connect each child to the center
        organizedMembers.children.forEach((child: any) => {
          edges.push({
            id: `center-to-child-${child.entry.pid}`,
            source: centerNodeId,
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
      } else {
        // Single parent: Connect directly to children
        const parent = organizedMembers.parents[0];
        organizedMembers.children.forEach((child: any) => {
          edges.push({
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
    
    // Create organizational chart structure for two parents
    if (organizedMembers.parents.length === 2) {
      const parent1 = organizedMembers.parents[0];
      const parent2 = organizedMembers.parents[1];
      const centerNodeId = 'parent-center';
      
      // 1. Create horizontal spouse line between parents
      edges.push({
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
      
      // 2. Connect each child to the center node (positioned on the horizontal spouse line)
      organizedMembers.children.forEach((child: any) => {
        edges.push({
          id: `center-to-child-${child.entry.pid}`,
          source: centerNodeId,
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
    
    return edges;
  }, [nodes, organizedMembers]);

  console.log('🔍 SimpleReactFlowTest - Created:', { nodes: nodes.length, edges: edges.length });

  if (familyMembers.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '2px solid #ff0000',
        background: '#f9f9f9'
      }}>
        <div>No family members for test</div>
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
          cursor: default;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesConnectable={false}
        nodesDraggable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        attributionPosition="bottom-left"
        onInit={() => {
          console.log('🔍 SimpleReactFlowTest - ReactFlow initialized with:', { nodes: nodes.length, edges: edges.length });
        }}
      />
    </div>
  );
};

const SimpleReactFlowTestWithProvider: React.FC<SimpleReactFlowTestProps> = (props) => {
  return (
    <ReactFlowProvider>
      <SimpleReactFlowTest {...props} />
    </ReactFlowProvider>
  );
};

export default SimpleReactFlowTestWithProvider;
