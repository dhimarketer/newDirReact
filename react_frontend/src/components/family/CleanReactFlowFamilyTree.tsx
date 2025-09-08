import React, { useMemo, useCallback, useEffect } from 'react';
import { ReactFlow, Node, Edge, MarkerType, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFamilyGraphLayout } from './hooks/useFamilyGraphLayout';
import { FamilyMember as OfficialFamilyMember, FamilyRelationship as OfficialFamilyRelationship } from '../../types/family';

// Local interfaces for compatibility with FamilyTreeWindow
interface FamilyMember {
  entry: {
    pid: number;
    name: string;
    age?: number;
    gender?: string;
  };
  role?: string;
  relationship?: string;
  familyGroupId?: number;
  familyGroupName?: string;
}

interface FamilyRelationship {
  id: number;
  person1: number;
  person2: number;
  relationship_type: string;
  is_active: boolean;
  familyGroupId?: number;
}

// Custom node component with handles
const FamilyNode = ({ data, isConnectable }: { data: any; isConnectable: boolean }) => {
  return (
    <div className="clean-family-node" style={{ position: 'relative', width: '200px', height: '80px', border: '2px solid #333' }}>
      {/* Right handle for spouse connections */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        style={{ 
          background: '#8B4513', 
          width: '8px', 
          height: '8px',
          border: '2px solid #fff',
          top: '50%',
          right: '-4px',
          transform: 'translateY(-50%)'
        }}
      />
      {/* Left handle for spouse connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        style={{ 
          background: '#8B4513', 
          width: '8px', 
          height: '8px',
          border: '2px solid #fff',
          top: '50%',
          left: '-4px',
          transform: 'translateY(-50%)'
        }}
      />
      {/* Top handle for parent connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
        style={{ 
          background: '#8B4513', 
          width: '8px', 
          height: '8px',
          border: '2px solid #fff',
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      {/* Bottom handle for child connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        style={{ 
          background: '#8B4513', 
          width: '8px', 
          height: '8px',
          border: '2px solid #fff',
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      {data.label}
    </div>
  );
};

// Custom union node component
const UnionNode = ({ data, isConnectable }: { data: any; isConnectable: boolean }) => {
  return (
    <div className="clean-family-union-node" style={{ position: 'relative', width: '20px', height: '20px', border: '2px solid #333' }}>
      {/* Top handle for parent connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
        style={{ 
          background: '#8B4513', 
          width: '8px', 
          height: '8px',
          border: '2px solid #fff',
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      {/* Bottom handle for child connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        style={{ 
          background: '#8B4513', 
          width: '8px', 
          height: '8px',
          border: '2px solid #fff',
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      {data.label}
    </div>
  );
};

// FamilyRelationship interface imported from types/family.ts

interface CleanReactFlowFamilyTreeProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  onRelationshipChange?: (relationship: FamilyRelationship) => void;
  hasMultipleFamilies?: boolean;
}

const CleanReactFlowFamilyTree: React.FC<CleanReactFlowFamilyTreeProps> = ({
  familyMembers,
  relationships = []
}) => {
  // Transform local interfaces to official types for the hook
  const transformedMembers: OfficialFamilyMember[] = useMemo(() => familyMembers.map(member => ({
    id: member.entry.pid,
    user: member.entry.pid,
    family_group: member.familyGroupId || 1,
    role: {
      id: 1,
      name: member.role || 'other',
      description: '',
      permissions: []
    },
    relationship: member.relationship || '',
    is_admin: false,
    joined_date: new Date().toISOString(),
    profile_picture: undefined,
    notes: undefined,
    entry: {
      pid: member.entry.pid,
      name: member.entry.name,
      contact: '',
      change_status: 'Active',
      age: member.entry.age,
      gender: member.entry.gender
    },
    role_in_family: member.role || 'other',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })), [familyMembers]);

  const transformedRelationships: OfficialFamilyRelationship[] = useMemo(() => relationships.map(rel => ({
    id: rel.id,
    person1: rel.person1,
    person2: rel.person2,
    person1_name: familyMembers.find(m => m.entry.pid === rel.person1)?.entry.name,
    person2_name: familyMembers.find(m => m.entry.pid === rel.person2)?.entry.name,
    relationship_type: rel.relationship_type as any,
    relationship_type_display: rel.relationship_type,
    family_group: rel.familyGroupId || 1,
    notes: '',
    is_active: rel.is_active,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })), [relationships, familyMembers]);

  // Use Dagre automatic layout hook
  const { nodes: dagreNodes, edges: dagreEdges } = useFamilyGraphLayout({
    familyMembers: transformedMembers,
    relationships: transformedRelationships
  });

  // Transform Dagre nodes to include proper labels and styling
  const nodes: Node[] = useMemo(() => {
    return dagreNodes.map(node => {
      if (node.type === 'familyNode') {
        return {
          ...node,
          data: {
            ...node.data,
            label: (
              <div className={`clean-family-node--${(node.data as any).member?.role_in_family?.includes('parent') ? 'parent' : 'child'}`}>
                <div className="clean-family-node__name">{(node.data as any).name}</div>
                <div className="clean-family-node__age">
                  {(node.data as any).age ? `${(node.data as any).age} years` : 'Age unknown'}
                </div>
              </div>
            )
          }
        };
      } else if (node.type === 'unionNode') {
        return {
          ...node,
          data: {
            ...node.data,
            label: null
          },
          style: {
            ...node.style,
            background: 'transparent',
            border: 'none',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none'
          }
        };
      }
      return node;
    });
  }, [dagreNodes]);

  // Use edges from Dagre layout
  const edges: Edge[] = useMemo(() => {
    const mappedEdges = dagreEdges.map(edge => ({
      ...edge,
      className: `clean-family-edge clean-family-edge--${edge.type === 'smoothstep' ? 'spouse' : 'parent-child'}`,
    }));
    
    // Debug logging
    console.log('🔗 React Flow Edges:', mappedEdges);
    console.log('🔗 Dagre Edges:', dagreEdges);
    
    return mappedEdges;
  }, [dagreEdges]);

  // ReactFlow state management
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Event handlers
  const handleNodesChange = useCallback(onNodesChange, [onNodesChange]);
  const handleEdgesChange = useCallback(onEdgesChange, [onEdgesChange]);
  
  // Update ReactFlow state when nodes or edges change
  useEffect(() => {
    setReactFlowNodes(nodes);
  }, [nodes, setReactFlowNodes]);
  
  useEffect(() => {
    setReactFlowEdges(edges);
  }, [edges, setReactFlowEdges]);
  
  // Dagre handles automatic positioning, no manual union node updates needed

  if (familyMembers.length === 0) {
    return (
      <div className="clean-family-tree-empty">
        <div>
          <p>No family members found</p>
          <p>Try searching for a different address or create a new family</p>
        </div>
      </div>
    );
  }

  // Debug logging removed for performance

  return (
    <div className="clean-family-tree-container">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        nodeTypes={{
          familyNode: FamilyNode,
          unionNode: UnionNode
        }}
        fitView
        nodesConnectable={false}
        nodesDraggable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        attributionPosition="bottom-left"
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        selectionKeyCode={null}
        defaultEdgeOptions={{
          style: { stroke: '#8B4513', strokeWidth: 3 },
          type: 'straight',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8B4513',
            width: 10,
            height: 7,
          }
        }}
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

// Wrap with ReactFlowProvider
const CleanReactFlowFamilyTreeWithProvider: React.FC<CleanReactFlowFamilyTreeProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CleanReactFlowFamilyTree {...props} />
    </ReactFlowProvider>
  );
};

export default CleanReactFlowFamilyTreeWithProvider;
