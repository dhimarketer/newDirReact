import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, useNodesState, useEdgesState, MarkerType, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface SimpleReactFlowTestProps {
  familyMembers: any[];
}

const SimpleReactFlowTest: React.FC<SimpleReactFlowTestProps> = ({ familyMembers }) => {
  console.log('🔍 SimpleReactFlowTest - Component called with:', familyMembers.length, 'members');

  // Create simple nodes
  const nodes: Node[] = useMemo(() => {
    return familyMembers.slice(0, 2).map((member, index) => ({
      id: String(member.entry.pid),
      type: 'default',
      data: { 
        label: (
          <div style={{ padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
            <div style={{ fontWeight: 'bold' }}>{member.entry.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {member.entry.age ? `${member.entry.age} years` : 'Age unknown'}
            </div>
          </div>
        )
      },
      position: { x: index * 200, y: 0 },
    }));
  }, [familyMembers]);

  // Create simple edges
  const edges: Edge[] = useMemo(() => {
    if (nodes.length < 2) return [];
    
    return [
      {
        id: 'test-edge-1',
        source: nodes[0].id,
        target: nodes[1].id,
        type: 'straight',
        style: { 
          stroke: '#ff0000', 
          strokeWidth: 5
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ff0000',
          width: 20,
          height: 20,
        }
      },
      {
        id: 'test-edge-2',
        source: nodes[0].id,
        target: nodes[1].id,
        type: 'smoothstep',
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
      }
    ];
  }, [nodes]);

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
      height: '400px', 
      border: '3px solid #ff0000',
      background: '#ffffff'
    }}>
      <style>{`
        .react-flow__edge {
          stroke: #ff0000 !important;
          stroke-width: 10px !important;
          z-index: 9999 !important;
        }
        .react-flow__edge-path {
          stroke: #ff0000 !important;
          stroke-width: 10px !important;
          z-index: 9999 !important;
        }
        .react-flow__edge-arrowhead {
          fill: #ff0000 !important;
          stroke: #ff0000 !important;
          z-index: 9999 !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
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
