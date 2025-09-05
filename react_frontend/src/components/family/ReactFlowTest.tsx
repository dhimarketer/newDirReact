// 2025-01-31: Minimal ReactFlow test to isolate edge rendering issues
import React from 'react';
import ReactFlow, {
  Node,
  Edge,
  ReactFlowProvider,
  Background,
  Controls,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

const ReactFlowTest: React.FC = () => {
  // Simple test nodes
  const nodes: Node[] = [
    {
      id: '1',
      type: 'default',
      data: { label: 'Parent 1' },
      position: { x: 100, y: 100 },
    },
    {
      id: '2',
      type: 'default',
      data: { label: 'Parent 2' },
      position: { x: 300, y: 100 },
    },
    {
      id: '3',
      type: 'default',
      data: { label: 'Child 1' },
      position: { x: 100, y: 300 },
    },
    {
      id: '4',
      type: 'default',
      data: { label: 'Child 2' },
      position: { x: 300, y: 300 },
    },
  ];

  // Simple test edges
  const edges: Edge[] = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'straight',
      style: { stroke: '#ff0000', strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#ff0000',
        width: 20,
        height: 20,
      },
    },
    {
      id: 'e1-3',
      source: '1',
      target: '3',
      type: 'straight',
      style: { stroke: '#00ff00', strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#00ff00',
        width: 20,
        height: 20,
      },
    },
    {
      id: 'e2-4',
      source: '2',
      target: '4',
      type: 'straight',
      style: { stroke: '#0000ff', strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#0000ff',
        width: 20,
        height: 20,
      },
    },
  ];

  return (
    <div style={{ width: '100%', height: '500px', border: '2px solid red' }}>
      <div style={{ padding: '10px', background: '#f0f0f0' }}>
        <strong>ReactFlow Test:</strong> Nodes: {nodes.length}, Edges: {edges.length}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        style={{ background: '#ffffff' }}
        defaultEdgeOptions={{
          style: { stroke: '#ff0000', strokeWidth: 5 },
          type: 'straight',
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

const ReactFlowTestWithProvider: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ReactFlowTest />
    </ReactFlowProvider>
  );
};

export default ReactFlowTestWithProvider;