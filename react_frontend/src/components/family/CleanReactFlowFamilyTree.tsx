import React, { useMemo, useCallback, useEffect } from 'react';
import { ReactFlow, Node, Edge, MarkerType, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background, Handle, Position, BaseEdge, EdgeLabelRenderer, getBezierPath, getStraightPath } from '@xyflow/react';
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
    <div className="clean-family-node" style={{ position: 'relative', width: '200px', height: '80px', border: '2px solid #333', backgroundColor: 'transparent' }}>
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

// Custom union node component for junction points - acts as T-junction on spouse line
const UnionNode = ({ data, isConnectable }: { data: any; isConnectable: boolean }) => {
  return (
    <div className="clean-family-union-node" style={{ position: 'relative', width: '10px', height: '10px', backgroundColor: 'transparent' }}>
      {/* Left handle - receives spouse line from left parent */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        style={{ 
          background: '#ec4899', 
          width: '4px', 
          height: '4px',
          border: 'none',
          left: '-2px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0
        }}
      />
      {/* Right handle - sends spouse line to right parent */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        style={{ 
          background: '#ec4899', 
          width: '4px', 
          height: '4px',
          border: 'none',
          right: '-2px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0
        }}
      />
      {/* Bottom handle - sends lines to children */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        style={{ 
          background: '#8B4513', 
          width: '4px', 
          height: '4px',
          border: 'none',
          bottom: '-2px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0
        }}
      />
      {/* Optional: Small visible dot to show junction point during development */}
      <div style={{
        width: '2px',
        height: '2px',
        backgroundColor: '#8B4513',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.3
      }} />
    </div>
  );
};

// Custom org chart edge that draws complete parent-to-child connection pattern
const OrgChartEdge = ({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd, data }: any) => {
  // For true org chart layout, we need to draw:
  // 1. Vertical line down from junction (spouse line center)
  // 2. Horizontal line to all children positions
  // 3. Vertical lines down to each child
  
  const childrenPositions = data?.childrenPositions || [];
  const junctionY = sourceY + 60; // Vertical drop distance
  
  if (childrenPositions.length === 0) {
    // Fallback: simple line to target
    const path = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
    return <BaseEdge path={path} style={style} markerEnd={markerEnd} />;
  }
  
  // Build the complete org chart path
  let path = `M ${sourceX},${sourceY}`; // Start at junction
  
  // 1. Vertical drop from junction
  path += ` L ${sourceX},${junctionY}`;
  
  // 2. Horizontal line to leftmost child
  const leftmostX = Math.min(...childrenPositions.map((c: any) => c.x));
  const rightmostX = Math.max(...childrenPositions.map((c: any) => c.x));
  
  path += ` L ${leftmostX},${junctionY}`;
  path += ` L ${rightmostX},${junctionY}`;
  
  // 3. Vertical lines to each child
  childrenPositions.forEach((child: any) => {
    path += ` M ${child.x},${junctionY} L ${child.x},${child.y}`;
  });
  
  return (
    <>
      <BaseEdge path={path} style={style} />
      {/* Add arrows to each child */}
      {childrenPositions.map((child: any, index: number) => (
        <BaseEdge 
          key={`arrow-${index}`}
          path={`M ${child.x},${child.y - 10} L ${child.x},${child.y}`} 
          style={style} 
          markerEnd={markerEnd} 
        />
      ))}
    </>
  );
};

// Custom T-junction edge for parent-to-child connections in org chart style
const TJunctionEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }: any) => {
  // For org chart T-junction: 
  // 1. Start from source (parent) bottom
  // 2. Go down to a junction point
  // 3. Move horizontally to align with target (child)
  // 4. Go down to target top
  
  const isOrgChart = data?.isOrgChart;
  const centerX = data?.centerX;
  
  let path;
  
  if (isOrgChart && centerX) {
    // Create proper T-junction path through the center point
    const junctionY = sourceY + 40; // Distance below the source
    
    // Path: source -> down -> center -> horizontal to target column -> down to target
    path = `M ${sourceX},${sourceY} L ${sourceX},${junctionY} L ${centerX},${junctionY} L ${targetX},${junctionY} L ${targetX},${targetY}`;
  } else {
    // Default T-junction behavior
    const midY = sourceY + Math.abs(targetY - sourceY) / 2;
    path = `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`;
  }
  
  return (
    <>
      <BaseEdge path={path} style={style} markerEnd={markerEnd} />
    </>
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
              <div className={`clean-family-node--${(node.data as any).member?.role_in_family?.includes('parent') ? 'parent' : 'child'}`} style={{
                width: '190px',
                height: '70px',
                backgroundColor: (node.data as any).member?.role_in_family?.includes('parent') ? '#fef3c7' : '#dbeafe',
                border: '1px solid #8B4513',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '4px',
                boxSizing: 'border-box'
              }}>
                <div className="clean-family-node__name" style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#333',
                  textAlign: 'center',
                  marginBottom: '4px',
                  lineHeight: '1.2'
                }}>{(node.data as any).name}</div>
                <div className="clean-family-node__age" style={{
                  fontSize: '12px',
                  color: '#666',
                  textAlign: 'center',
                  lineHeight: '1.1'
                }}>
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
        edgeTypes={{
          tjunction: TJunctionEdge,
          orgchart: OrgChartEdge
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
