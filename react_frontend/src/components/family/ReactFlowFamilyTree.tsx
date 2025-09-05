// 2025-01-31: ReactFlow-based family tree component
// Professional, interactive family tree using ReactFlow for clean organizational chart layout
// Matches SVG implementation quality with better maintainability

import React, { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  MarkerType,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFamilyOrganization } from './hooks/useFamilyOrganization';
import ReactFlowTest from './ReactFlowTest';

// Define types locally to avoid import issues
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

interface ReactFlowFamilyTreeProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  onRelationshipChange?: (relationship: FamilyRelationship) => void;
  hasMultipleFamilies?: boolean;
}

// Custom node component for family members - matches SVG styling
const FamilyMemberNode: React.FC<{ data: any }> = ({ data }) => {
  const { member, generation } = data;
  
  // Clean styling matching SVG implementation
  const getNodeStyle = () => {
    switch (generation) {
      case 'grandparent':
        return { backgroundColor: '#FFF8DC', borderColor: '#DAA520' };
      case 'parent':
        return { backgroundColor: '#E6F3FF', borderColor: '#4A90E2' };
      case 'child':
        return { backgroundColor: '#F0F8FF', borderColor: '#8B4513' };
      case 'grandchild':
        return { backgroundColor: '#F5F5DC', borderColor: '#DEB887' };
      default:
        return { backgroundColor: '#F0F8FF', borderColor: '#8B4513' };
    }
  };

  const nodeStyle = getNodeStyle();
  
  return (
    <div
      style={{
        padding: '10px 15px',
        backgroundColor: nodeStyle.backgroundColor,
        border: `2px solid ${nodeStyle.borderColor}`,
        borderRadius: '6px',
        minWidth: '140px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: '500',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        color: '#333'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
        {member.entry.name}
      </div>
      {member.entry.age && (
        <div style={{ fontSize: '11px', color: '#666', fontWeight: '400' }}>
          {member.entry.age} years
        </div>
      )}
      {member.entry.gender && (
        <div style={{ fontSize: '11px', color: '#666', fontWeight: '400' }}>
          {member.entry.gender}
        </div>
      )}
    </div>
  );
};

// Custom node types
const nodeTypes: NodeTypes = {
  familyMember: FamilyMemberNode,
};

// Clean hierarchical layout matching SVG organizational chart structure
const getLayoutedElements = (nodes: Node[], edges: Edge[], organizedMembers: any) => {
  const horizontalSpacing = 220;
  const verticalSpacing = 180;
  const startX = 200;
  const startY = 80;

  // Create a map of node positions by generation
  const positionedNodes = new Map();
  let currentY = startY;

  // Position grandparents (if any)
  if (organizedMembers.grandparents.length > 0) {
    const grandparentY = currentY;
    const grandparentCount = organizedMembers.grandparents.length;
    const totalWidth = (grandparentCount - 1) * horizontalSpacing;
    const startGrandparentX = startX - (totalWidth / 2);

    organizedMembers.grandparents.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startGrandparentX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: grandparentY });
    });
    currentY += verticalSpacing;
  }

  // Position parents - center them horizontally
  if (organizedMembers.parents.length > 0) {
    const parentY = currentY;
    const parentCount = organizedMembers.parents.length;
    const totalWidth = (parentCount - 1) * horizontalSpacing;
    const startParentX = startX - (totalWidth / 2);

    organizedMembers.parents.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startParentX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: parentY });
    });
    currentY += verticalSpacing;
  }

  // Position children - center them horizontally
  if (organizedMembers.children.length > 0) {
    const childY = currentY;
    const childCount = organizedMembers.children.length;
    const totalWidth = (childCount - 1) * horizontalSpacing;
    const startChildX = startX - (totalWidth / 2);

    organizedMembers.children.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startChildX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: childY });
    });
    currentY += verticalSpacing;
  }

  // Position grandchildren (if any)
  if (organizedMembers.grandchildren.length > 0) {
    const grandchildY = currentY;
    const grandchildCount = organizedMembers.grandchildren.length;
    const totalWidth = (grandchildCount - 1) * horizontalSpacing;
    const startGrandchildX = startX - (totalWidth / 2);

    organizedMembers.grandchildren.forEach((member: any, index: number) => {
      const nodeId = String(member.entry.pid);
      const x = startGrandchildX + (index * horizontalSpacing);
      positionedNodes.set(nodeId, { x, y: grandchildY });
    });
  }

  // Update node positions
  const layoutedNodes = nodes.map((node) => {
    const position = positionedNodes.get(node.id) || { x: 0, y: 0 };
    return { 
      ...node, 
      position,
      type: 'familyMember'
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
};

const ReactFlowFamilyTree: React.FC<ReactFlowFamilyTreeProps> = ({
  familyMembers,
  relationships = [],
  hasMultipleFamilies = false
}) => {

  // Reuse existing data processing logic
  const organizedMembers = useFamilyOrganization(familyMembers, relationships);

  // Convert to ReactFlow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    const addedNodeIds = new Set<string>(); // Prevent duplicate nodes


    // Add grandparents (only if not already added)
    organizedMembers.grandparents.forEach((member: any) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'grandparent',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`
          },
          position: { x: 0, y: 0 }, // Will be set by layout
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Add parents (only if not already added)
    organizedMembers.parents.forEach((member: any) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        const bgColor = hasMultipleFamilies && member.familyGroupId
          ? (member.familyGroupId % 2 === 0 ? "#E6F3FF" : "#FFF2E6")
          : "#E6F3FF";
        const borderColor = hasMultipleFamilies && member.familyGroupId
          ? (member.familyGroupId % 2 === 0 ? "#0066CC" : "#CC6600")
          : "#4A90E2";

        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'parent',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`,
            backgroundColor: bgColor,
            borderColor: borderColor
          },
          position: { x: 0, y: 0 }, // Will be set by layout
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Add children (only if not already added)
    organizedMembers.children.forEach((member: any) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'child',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`
          },
          position: { x: 0, y: 0 }, // Will be set by layout
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Add grandchildren (only if not already added)
    organizedMembers.grandchildren.forEach((member: any) => {
      const nodeId = String(member.entry.pid);
      if (!addedNodeIds.has(nodeId)) {
        flowNodes.push({
          id: nodeId,
          data: { 
            member, 
            generation: 'grandchild',
            label: `${member.entry.name} (${member.entry.age || 'N/A'})`
          },
          position: { x: 0, y: 0 }, // Will be set by layout
        });
        addedNodeIds.add(nodeId);
      }
    });

    // Process actual relationships from backend
    console.log('🔍 ReactFlowFamilyTree: Processing relationships:', relationships);
    console.log('🔍 ReactFlowFamilyTree: Available node IDs before processing:', flowNodes.map(n => n.id));
    
    relationships.forEach(rel => {
      if (rel.is_active) {
        const sourceId = String(rel.person1);
        const targetId = String(rel.person2);
        
        console.log('🔍 ReactFlowFamilyTree: Processing relationship:', { rel, sourceId, targetId });
        
        // Ensure both nodes exist
        const sourceExists = flowNodes.some(node => node.id === sourceId);
        const targetExists = flowNodes.some(node => node.id === targetId);
        
        console.log('🔍 ReactFlowFamilyTree: Node existence check:', { sourceExists, targetExists, availableNodes: flowNodes.map(n => n.id) });
        
        if (sourceExists && targetExists) {
          let edgeStyle = { stroke: '#8B4513', strokeWidth: 3 };
          let markerEnd = {
            type: MarkerType.ArrowClosed,
            color: '#8B4513',
            width: 20,
            height: 20,
          };
          
          // Style based on relationship type
          switch (rel.relationship_type) {
            case 'parent':
            case 'child':
              edgeStyle = { stroke: '#8B4513', strokeWidth: 3 };
              markerEnd = {
                type: MarkerType.ArrowClosed,
                color: '#8B4513',
                width: 20,
                height: 20,
              };
              break;
            case 'spouse':
              edgeStyle = { stroke: '#FF69B4', strokeWidth: 2 };
              markerEnd = {
                type: MarkerType.ArrowClosed,
                color: '#FF69B4',
                width: 15,
                height: 15,
              };
              break;
            case 'grandparent':
            case 'grandchild':
              edgeStyle = { stroke: '#9370DB', strokeWidth: 3 };
              markerEnd = {
                type: MarkerType.ArrowClosed,
                color: '#9370DB',
                width: 20,
                height: 20,
              };
              break;
            case 'sibling':
              edgeStyle = { stroke: '#32CD32', strokeWidth: 2 };
              markerEnd = {
                type: MarkerType.ArrowClosed,
                color: '#32CD32',
                width: 15,
                height: 15,
              };
              break;
            default:
              edgeStyle = { stroke: '#8B4513', strokeWidth: 3 };
              markerEnd = {
                type: MarkerType.ArrowClosed,
                color: '#8B4513',
                width: 20,
                height: 20,
              };
          }
          
          const edge: Edge = {
            id: `rel-${rel.id}`,
            source: sourceId,
            target: targetId,
            animated: false,
            style: { stroke: '#ff0000', strokeWidth: 5 },
            type: 'straight',
            data: { relationship: rel }
          };
          
          flowEdges.push(edge);
          console.log('🔍 ReactFlowFamilyTree: Added relationship edge:', edge);
        } else {
          console.log('⚠️ ReactFlowFamilyTree: Skipping relationship - missing nodes:', { sourceExists, targetExists });
        }
      }
    });

    // Fallback: If no relationships found, create connections based on family structure
    console.log('🔍 ReactFlowFamilyTree: Checking fallback edges:', {
      flowEdgesLength: flowEdges.length,
      parentsCount: organizedMembers.parents.length,
      childrenCount: organizedMembers.children.length,
      parentIds: organizedMembers.parents.map((p: any) => p.entry.pid),
      childIds: organizedMembers.children.map((c: any) => c.entry.pid)
    });
    
    // ALWAYS create fallback edges if we have parents and children, regardless of existing edges
    if (organizedMembers.parents.length > 0 && organizedMembers.children.length > 0) {
      console.log('🔍 ReactFlowFamilyTree: Creating fallback edges (forcing creation)');
      organizedMembers.parents.forEach((parent: any) => {
        organizedMembers.children.forEach((child: any) => {
          const edge: Edge = {
            id: `fallback-${parent.entry.pid}-${child.entry.pid}`,
            source: String(parent.entry.pid),
            target: String(child.entry.pid),
            animated: false,
            style: { stroke: '#00ff00', strokeWidth: 5 },
            type: 'straight',
          };
          flowEdges.push(edge);
          console.log('🔍 ReactFlowFamilyTree: Created fallback edge:', edge);
        });
      });
    } else {
      console.log('🔍 ReactFlowFamilyTree: Cannot create fallback edges - missing parents or children:', {
        hasParents: organizedMembers.parents.length > 0,
        hasChildren: organizedMembers.children.length > 0
      });
    }
    
    // If still no edges, create connections between all family members
    if (flowEdges.length === 0 && flowNodes.length > 1) {
      console.log('🔍 ReactFlowFamilyTree: Creating basic connections between all members');
      for (let i = 0; i < flowNodes.length - 1; i++) {
        const edge: Edge = {
          id: `basic-${flowNodes[i].id}-${flowNodes[i + 1].id}`,
          source: flowNodes[i].id,
          target: flowNodes[i + 1].id,
          animated: false,
          style: { stroke: '#ff0000', strokeWidth: 5 },
          type: 'straight',
        };
        flowEdges.push(edge);
        console.log('🔍 ReactFlowFamilyTree: Created basic edge:', edge);
      }
    }
    
    // FORCE CREATE TEST EDGES for main family tree (like test component)
    console.log('🔍 ReactFlowFamilyTree: FORCING test edges for main family tree');
    if (flowNodes.length >= 2) {
      const testEdge1: Edge = {
        id: 'main-test-1',
        source: flowNodes[0].id,
        target: flowNodes[1].id,
        type: 'straight',
        style: { stroke: '#ff0000', strokeWidth: 8 },
        animated: false,
      };
      flowEdges.push(testEdge1);
      console.log('🔍 Added main test edge 1:', testEdge1);
    }
    
    if (flowNodes.length >= 3) {
      const testEdge2: Edge = {
        id: 'main-test-2',
        source: flowNodes[1].id,
        target: flowNodes[2].id,
        type: 'straight',
        style: { stroke: '#00ff00', strokeWidth: 6 },
        animated: false,
      };
      flowEdges.push(testEdge2);
      console.log('🔍 Added main test edge 2:', testEdge2);
    }
    
    if (flowNodes.length >= 4) {
      const testEdge3: Edge = {
        id: 'main-test-3',
        source: flowNodes[0].id,
        target: flowNodes[3].id,
        type: 'straight',
        style: { stroke: '#0000ff', strokeWidth: 4 },
        animated: false,
      };
      flowEdges.push(testEdge3);
      console.log('🔍 Added main test edge 3:', testEdge3);
    }
    
    console.log('🔍 ReactFlowFamilyTree: Final edges count:', flowEdges.length);
    console.log('🔍 ReactFlowFamilyTree: Final edges:', flowEdges);
    
    // Debug: Log first few edges in detail
    flowEdges.slice(0, 5).forEach((edge, index) => {
      console.log(`🔍 Edge ${index + 1}:`, {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        style: edge.style,
        animated: edge.animated,
        data: edge.data
      });
    });
    
    // Debug: Check if edges have valid source/target nodes
    const nodeIds = flowNodes.map(n => n.id);
    console.log('🔍 Available node IDs:', nodeIds);
    
    const invalidEdges = flowEdges.filter(edge => 
      !nodeIds.includes(edge.source) || !nodeIds.includes(edge.target)
    );
    if (invalidEdges.length > 0) {
      console.log('⚠️ Invalid edges (missing source/target nodes):', invalidEdges);
    }

    // Add spouse edges from organized members (bidirectional, avoid duplicates)
    organizedMembers.spouseMap?.forEach((spouseIds: any, personId: any) => {
      spouseIds.forEach((spouseId: any) => {
        if (spouseId > personId) { // Prevent duplicates
          // Check if this spouse relationship already exists in edges
          const existingSpouseEdge = flowEdges.find(edge => 
            (edge.source === String(personId) && edge.target === String(spouseId)) ||
            (edge.source === String(spouseId) && edge.target === String(personId))
          );
          
          if (!existingSpouseEdge) {
            flowEdges.push({
              id: `spouse-${personId}-${spouseId}`,
              source: String(personId),
              target: String(spouseId),
              type: 'straight',
              style: { stroke: '#0000ff', strokeWidth: 5 },
            });
          }
        }
      });
    });

    
    return { nodes: flowNodes, edges: flowEdges };
  }, [organizedMembers, hasMultipleFamilies, relationships]);

  // Apply manual layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, organizedMembers);
  }, [initialNodes, initialEdges, organizedMembers]);

  // Use direct state instead of hooks to avoid potential issues
  const [reactFlowNodes, setNodes] = React.useState(layoutedNodes);
  const [reactFlowEdges, setEdges] = React.useState(layoutedEdges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    console.log('🔍 useEffect: Updating ReactFlow state with:', {
      nodesCount: layoutedNodes.length,
      edgesCount: layoutedEdges.length,
      firstEdge: layoutedEdges[0]
    });
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges]);

  // Simple change handlers
  const onNodesChange = React.useCallback((changes: any) => {
    setNodes((nds) => nds);
  }, []);

  const onEdgesChange = React.useCallback((changes: any) => {
    setEdges((eds) => eds);
  }, []);

  // Don't render if no members
  if (familyMembers.length === 0) {
    return (
      <div className="reactflow-family-tree-empty">
        <p>No family members found.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #e0e0e0', borderRadius: 8, background: '#ffffff' }}>
      {/* Debug info */}
      <div style={{ padding: '10px', background: '#f0f0f0', fontSize: '12px', borderBottom: '1px solid #ddd' }}>
        <strong>ReactFlow Debug:</strong> Nodes: {layoutedNodes.length}, Edges: {layoutedEdges.length}
        {layoutedEdges.length > 0 && (
          <div>
            <strong>Edges:</strong> {layoutedEdges.map(e => `${e.source}→${e.target}`).join(', ')}
          </div>
        )}
        <div style={{ marginTop: '5px' }}>
          <strong>Node IDs:</strong> {layoutedNodes.map(n => n.id).join(', ')}
        </div>
        <div style={{ marginTop: '5px' }}>
          <strong>Edge Details:</strong>
          {layoutedEdges.map((edge, i) => (
            <div key={i} style={{ fontSize: '10px' }}>
              {edge.id}: {edge.source} → {edge.target} (style: {JSON.stringify(edge.style)})
            </div>
          ))}
        </div>
      </div>
      
      {/* Test component to check if basic ReactFlow works */}
      <div style={{ marginBottom: '20px', border: '2px solid blue' }}>
        <h3>ReactFlow Test (should show edges):</h3>
        <ReactFlowTest />
      </div>
      
      {/* Main family tree as separate ReactFlow instance */}
      <div style={{ marginBottom: '20px', border: '2px solid green' }}>
        <h3>Main Family Tree (should show edges):</h3>
        <div style={{ width: '100%', height: '400px', border: '1px solid #ccc' }}>
          <ReactFlow
            nodes={layoutedNodes}
            edges={layoutedEdges}
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
      </div>
      
      <style>{`
        /* Force edge visibility with aggressive CSS */
        .react-flow__edge {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 1000 !important;
        }
        .react-flow__edge-path {
          stroke: #ff0000 !important;
          stroke-width: 8px !important;
          stroke-opacity: 1 !important;
          fill: none !important;
          display: block !important;
          visibility: visible !important;
        }
        .react-flow__edge-arrowhead {
          fill: #ff0000 !important;
          stroke: #ff0000 !important;
          stroke-width: 4px !important;
          display: block !important;
          visibility: visible !important;
        }
        .react-flow__node {
          z-index: 2000 !important;
        }
        /* Force SVG elements to be visible */
        .react-flow__renderer {
          overflow: visible !important;
        }
        .react-flow__viewport {
          overflow: visible !important;
        }
        svg {
          overflow: visible !important;
        }
        .react-flow__renderer svg {
          overflow: visible !important;
        }
        /* Force all edges to be red and thick */
        .react-flow__edge * {
          stroke: #ff0000 !important;
          stroke-width: 8px !important;
        }
      `}</style>
      <ReactFlow
        nodes={layoutedNodes}
        edges={layoutedEdges}
        fitView
        nodesConnectable={false}
        nodesDraggable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        attributionPosition="bottom-left"
        style={{ background: '#ffffff' }}
        defaultEdgeOptions={{
          style: { stroke: '#ff0000', strokeWidth: 5 },
          type: 'straight',
        }}
        onInit={() => {
          console.log('🔍 ReactFlow onInit:', {
            nodesCount: layoutedNodes.length,
            edgesCount: layoutedEdges.length,
            firstEdge: layoutedEdges[0],
            allEdges: layoutedEdges
          });
        }}
        onEdgesChange={() => {
          console.log('🔍 ReactFlow onEdgesChange triggered');
        }}
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const generation = node.data?.generation;
            switch (generation) {
              case 'grandparent': return '#FFF8DC';
              case 'parent': return '#E6F3FF';
              case 'child': return '#F0F8FF';
              case 'grandchild': return '#F5F5DC';
              default: return '#fff';
            }
          }}
          nodeBorderRadius={6}
          style={{ background: '#f8f9fa' }}
        />
        <Background color="#f0f0f0" gap={20} />
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider for proper context
const ReactFlowFamilyTreeWithProvider: React.FC<ReactFlowFamilyTreeProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowFamilyTree {...props} />
    </ReactFlowProvider>
  );
};

export default ReactFlowFamilyTreeWithProvider;
