// 2025-01-27: Simple family tree org chart with draggable nodes

import React, { useState, useRef, useEffect } from 'react';
import { PhoneBookEntry } from '../../types/directory';

interface FamilyMember {
  entry: PhoneBookEntry;
  role: 'parent' | 'child' | 'other';
  relationship?: string;
}

interface FamilyTreeVisualizationProps {
  familyMembers: FamilyMember[];
}

interface DraggableNode {
  id: string;
  x: number;
  y: number;
  member: FamilyMember;
}

const FamilyTreeVisualization: React.FC<FamilyTreeVisualizationProps> = ({ familyMembers }) => {
  const [nodes, setNodes] = useState<DraggableNode[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize node positions
  useEffect(() => {
    const parents = familyMembers.filter(m => m.role === 'parent');
    const children = familyMembers.filter(m => m.role === 'child');
    
    const newNodes: DraggableNode[] = [];
    
    // Position parents at the top with better spacing
    parents.forEach((parent, index) => {
      newNodes.push({
        id: `parent-${parent.entry.pid}`,
        x: 100 + index * 250,
        y: 80,
        member: parent
      });
    });
    
    // Position children below parents with better spacing
    children.forEach((child, index) => {
      newNodes.push({
        id: `child-${child.entry.pid}`,
        x: 100 + index * 250,
        y: 200,
        member: child
      });
    });
    
    setNodes(newNodes);
  }, [familyMembers]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (!svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setDraggedNode(nodeId);
    setDragOffset({
      x: e.clientX - svgRect.left - node.x,
      y: e.clientY - svgRect.top - node.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode || !svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const newX = e.clientX - svgRect.left - dragOffset.x;
    const newY = e.clientY - svgRect.top - dragOffset.y;
    
    setNodes(prev => prev.map(node => 
      node.id === draggedNode 
        ? { ...node, x: newX, y: newY }
        : node
    ));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const renderNode = (node: DraggableNode) => {
    const isParent = node.member.role === 'parent';
    const nodeColor = isParent ? '#fbbf24' : '#10b981';
    const borderColor = isParent ? '#d97706' : '#059669';
    
    return (
      <g key={node.id}>
        {/* Node background */}
        <rect
          x={node.x}
          y={node.y}
          width={180}
          height={80}
          rx={8}
          fill={nodeColor}
          stroke={borderColor}
          strokeWidth={2}
          className="cursor-move"
          onMouseDown={(e) => handleMouseDown(e, node.id)}
        />
        
        {/* Role indicator */}
        <text
          x={node.x + 90}
          y={node.y + 25}
          textAnchor="middle"
          className="text-sm font-bold fill-gray-800"
        >
          {isParent ? '👨‍👩‍👧‍👦' : '👶'}
        </text>
        
        {/* Name */}
        <text
          x={node.x + 90}
          y={node.y + 45}
          textAnchor="middle"
          className="text-sm font-medium fill-gray-900"
        >
          {node.member.entry.name || 'Unknown'}
        </text>
        
        {/* Contact */}
        {node.member.entry.contact && (
          <text
            x={node.x + 90}
            y={node.y + 65}
            textAnchor="middle"
            className="text-xs fill-gray-700"
          >
            📞 {node.member.entry.contact}
          </text>
        )}
      </g>
    );
  };

  const renderConnections = () => {
    const parents = nodes.filter(n => n.member.role === 'parent');
    const children = nodes.filter(n => n.member.role === 'child');
    
    if (parents.length === 0 || children.length === 0) return null;
    
    return (
      <g>
        {parents.map(parent => 
          children.map(child => (
            <line
              key={`${parent.id}-${child.id}`}
              x1={parent.x + 90}
              y1={parent.y + 80}
              x2={child.x + 90}
              y2={child.y}
              stroke="#6b7280"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
          ))
        )}
      </g>
    );
  };

  if (familyMembers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No family members found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          We couldn't find additional people at this address and island.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="relative">
        <svg
          ref={svgRef}
          width="700"
          height="350"
          className="border border-gray-200 rounded-lg bg-white"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background */}
          <rect width="100%" height="100%" fill="#fafafa" />
          
          {/* Connections */}
          {renderConnections()}
          
          {/* Nodes */}
          {nodes.map(renderNode)}
          
          {/* Instructions */}
          <text
            x="350"
            y="330"
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            💡 Drag nodes to rearrange the family tree
          </text>
        </svg>
      </div>
    </div>
  );
};

export default FamilyTreeVisualization;
