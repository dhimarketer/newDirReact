import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const ReactFlowTest: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState([]);
  const [edges, , onEdgesChange] = useEdgesState([]);

  // Create minimal test data
  const testNodes: Node[] = useMemo(() => [
    {
      id: '1',
      type: 'default',
      data: { label: 'Node 1' },
      position: { x: 100, y: 100 },
    },
    {
      id: '2',
      type: 'default', 
      data: { label: 'Node 2' },
      position: { x: 300, y: 200 },
    }
  ], []);

  const testEdges: Edge[] = useMemo(() => [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      style: {
        stroke: '#ff0000',
        strokeWidth: 10,
      },
    }
  ], []);

  console.log('🔍 ReactFlowTest - Rendering with nodes:', testNodes.length, 'edges:', testEdges.length);

  return (
    <div style={{ width: '100%', height: '400px', border: '2px solid red' }}>
      <h3>ReactFlow Test - Should show 2 nodes and 1 red line</h3>
      <ReactFlow
        nodes={testNodes}
        edges={testEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      />
    </div>
  );
};

export default ReactFlowTest;