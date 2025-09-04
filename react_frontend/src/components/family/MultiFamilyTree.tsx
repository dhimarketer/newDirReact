// 2025-01-31: NEW - Multi-family tree visualization component
// 2025-01-31: Displays multiple families at the same address in a combined graphic
// 2025-01-31: Each nuclear family is shown separately but displayed together

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { PhoneBookEntry } from '../../types/directory';

interface FamilyMember {
  entry: PhoneBookEntry;
  role: 'parent' | 'child' | 'other';
  relationship?: string;
}

interface FamilyRelationship {
  id: number;
  person1: number;
  person2: number;
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other';
  notes?: string;
  is_active: boolean;
}

interface FamilyGroup {
  id: number;
  name: string;
  description?: string;
  address: string;
  island: string;
  parent_family?: number;
  members: FamilyMember[];
  relationships: FamilyRelationship[];
  created_at: string;
}

interface MultiFamilyTreeProps {
  families: FamilyGroup[];
  address: string;
  island: string;
  onFamilyChange?: (families: FamilyGroup[]) => void;
  svgRef?: React.RefObject<SVGSVGElement>;
}

interface TreeNode {
  id: string;
  x: number;
  y: number;
  member: FamilyMember;
  familyId: number;
  width: number;
  height: number;
}

interface ConnectionLine {
  id: string;
  fromNode: string;
  toNode: string;
  relationshipType: string;
  familyId: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const MultiFamilyTree: React.FC<MultiFamilyTreeProps> = ({ 
  families, 
  address, 
  island,
  onFamilyChange,
  svgRef
}) => {
  // 2025-01-31: DEBUG - Log families data to understand what's being received
  console.log('🔍 MultiFamilyTree: Received families data:', {
    familiesCount: families.length,
    families: families,
    address,
    island
  });
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [svgDimensions, setSvgDimensions] = useState({ width: 1200, height: 800 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isFittingToView, setIsFittingToView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const localSvgRef = useRef<SVGSVGElement>(null);
  const resizeTimeout = useRef<number | null>(null);

  // Calculate layout for multiple families
  const calculateLayout = useCallback(() => {
    console.log('🔍 MultiFamilyTree: calculateLayout called with families:', families);
    if (!families.length) {
      console.log('🔍 MultiFamilyTree: No families to layout');
      return;
    }

    const newNodes: TreeNode[] = [];
    const newConnections: ConnectionLine[] = [];
    
    let currentY = 50;
    const familySpacing = 100; // Space between families
    const memberSpacing = 120; // Space between members in a family
    
    families.forEach((family, familyIndex) => {
      const familyMembers = family.members;
      const familyRelationships = family.relationships;
      
      // Calculate family width based on member count
      const familyWidth = Math.max(familyMembers.length * memberSpacing, 400);
      const startX = (svgDimensions.width - familyWidth) / 2;
      
      // Position members in the family
      familyMembers.forEach((member, memberIndex) => {
        const x = startX + memberIndex * memberSpacing;
        const y = currentY;
        
        const node: TreeNode = {
          id: `family-${family.id}-member-${member.entry.pid}`,
          x,
          y,
          member,
          familyId: family.id,
          width: 100,
          height: 60
        };
        newNodes.push(node);
      });
      
      // Create connections within the family
      familyRelationships.forEach((rel, relIndex) => {
        const fromNode = newNodes.find(n => 
          n.familyId === family.id && n.member.entry.pid === rel.person1
        );
        const toNode = newNodes.find(n => 
          n.familyId === family.id && n.member.entry.pid === rel.person2
        );
        
        if (fromNode && toNode) {
          const connection: ConnectionLine = {
            id: `connection-${family.id}-${relIndex}`,
            fromNode: fromNode.id,
            toNode: toNode.id,
            relationshipType: rel.relationship_type,
            familyId: family.id,
            fromX: fromNode.x + fromNode.width / 2,
            fromY: fromNode.y + fromNode.height / 2,
            toX: toNode.x + toNode.width / 2,
            toY: toNode.y + toNode.height / 2
          };
          newConnections.push(connection);
        }
      });
      
      // Add family label
      const familyLabelNode: TreeNode = {
        id: `family-label-${family.id}`,
        x: startX,
        y: currentY - 30,
        member: {
          entry: {
            pid: 0,
            name: family.name,
            contact: '',
            address: family.address,
            island: family.island,
            atoll: '',
            street: '',
            ward: '',
            party: '',
            DOB: '',
            status: '',
            remark: '',
            email: '',
            gender: '',
            extra: '',
            profession: '',
            pep_status: '',
            change_status: 'Active',
            requested_by: '',
            batch: '',
            image_status: '',
            family_group_id: undefined,
            nid: undefined,
            age: undefined
          },
          role: 'other'
        },
        familyId: family.id,
        width: familyWidth,
        height: 20
      };
      newNodes.push(familyLabelNode);
      
      // 2025-01-31: NEW - Add parent family relationship indicator
      if (family.parent_family) {
        const parentFamily = families.find(f => f.id === family.parent_family);
        if (parentFamily) {
          const parentFamilyIndex = families.findIndex(f => f.id === family.parent_family);
          if (parentFamilyIndex !== -1) {
            const parentFamilyY = 50 + parentFamilyIndex * (Math.max(parentFamily.members.length * 80, 120) + 100);
            const parentFamilyX = (svgDimensions.width - Math.max(parentFamily.members.length * 120, 400)) / 2;
            
            // Create connection line from parent family to this family
            const familyConnection: ConnectionLine = {
              id: `family-connection-${family.parent_family}-${family.id}`,
              fromNode: `family-label-${family.parent_family}`,
              toNode: `family-label-${family.id}`,
              relationshipType: 'sub-family',
              familyId: 0, // Special ID for family connections
              fromX: parentFamilyX + Math.max(parentFamily.members.length * 120, 400) / 2,
              fromY: parentFamilyY + 20,
              toX: startX + familyWidth / 2,
              toY: currentY - 10
            };
            newConnections.push(familyConnection);
          }
        }
      }
      
      currentY += Math.max(familyMembers.length * 80, 120) + familySpacing;
    });
    
    setNodes(newNodes);
    setConnections(newConnections);
    
    // Update SVG dimensions if needed
    if (currentY > svgDimensions.height) {
      setSvgDimensions(prev => ({ ...prev, height: currentY + 50 }));
    }
  }, [families, svgDimensions.width]);

  // Fit content to view
  const fitToView = useCallback(() => {
    if (!containerRef.current || !localSvgRef.current) return;
    
    setIsFittingToView(true);
    
    setTimeout(() => {
      if (localSvgRef.current) {
        const svg = localSvgRef.current;
        const bbox = svg.getBBox();
        
        if (bbox.width > 0 && bbox.height > 0) {
          const containerWidth = containerRef.current!.clientWidth;
          const containerHeight = containerRef.current!.clientHeight;
          
          const scaleX = containerWidth / bbox.width;
          const scaleY = containerHeight / bbox.height;
          const scale = Math.min(scaleX, scaleY, 1) * 0.9; // 90% to leave some margin
          
          setZoomLevel(scale);
        }
      }
      setIsFittingToView(false);
    }, 100);
  }, []);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => Math.max(0.1, Math.min(3, prev + delta * 0.1)));
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      handleZoom(delta);
    }
  }, [handleZoom]);

  // Calculate layout when families change
  React.useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
      resizeTimeout.current = window.setTimeout(() => {
        if (containerRef.current) {
          setSvgDimensions(prev => ({
            ...prev,
            width: containerRef.current!.clientWidth
          }));
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
    };
  }, []);

  // Auto-fit to view on mount
  React.useEffect(() => {
    if (families.length > 0) {
      setTimeout(fitToView, 500);
    }
  }, [families, fitToView]);

  if (!families.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No families found at {address}, {island}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-white"
      onWheel={handleWheel}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => handleZoom(1)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => handleZoom(-1)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={fitToView}
          disabled={isFittingToView}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          title="Fit to View"
        >
          {isFittingToView ? '...' : 'Fit'}
        </button>
      </div>

      {/* Family Count Display */}
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 px-3 py-2 rounded shadow">
        <h3 className="font-semibold text-gray-800">
          {families.length} Family{families.length !== 1 ? 'ies' : ''} at {address}
        </h3>
        <p className="text-sm text-gray-600">{island}</p>
      </div>

      {/* SVG Container */}
      <svg
        ref={svgRef || localSvgRef}
        width={svgDimensions.width}
        height={svgDimensions.height}
        className="w-full h-full"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left'
        }}
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connections */}
        {connections.map(connection => (
          <g key={connection.id}>
            <line
              x1={connection.fromX}
              y1={connection.fromY}
              x2={connection.toX}
              y2={connection.toY}
              stroke="#666"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            {/* Relationship type label */}
            <text
              x={(connection.fromX + connection.toX) / 2}
              y={(connection.fromY + connection.toY) / 2 - 5}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
              className="select-none"
            >
              {connection.relationshipType}
            </text>
          </g>
        ))}

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>

        {/* Nodes */}
        {nodes.map(node => {
          if (node.id.startsWith('family-label-')) {
            // Family label node
            return (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill="#e3f2fd"
                  stroke="#2196f3"
                  strokeWidth="2"
                  rx="4"
                />
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#1976d2"
                  className="select-none"
                >
                  {node.member.entry.name}
                  {/* 2025-01-31: NEW - Show sub-family indicator */}
                  {(() => {
                    const family = families.find(f => f.id === node.familyId);
                    if (family && family.parent_family) {
                      const parentFamily = families.find(f => f.id === family.parent_family);
                      return parentFamily ? ` (Sub-family of ${parentFamily.name})` : ' (Sub-family)';
                    }
                    return '';
                  })()}
                </text>
              </g>
            );
          } else {
            // Member node
            const isSelected = selectedNode === node.id;
            return (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill={isSelected ? "#fff3cd" : "#fff"}
                  stroke={isSelected ? "#ffc107" : "#ddd"}
                  strokeWidth={isSelected ? "3" : "2"}
                  rx="8"
                  className="cursor-pointer hover:stroke-blue-500"
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                />
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="medium"
                  fill="#333"
                  className="select-none"
                >
                  {node.member.entry.name}
                </text>
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 + 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#666"
                  className="select-none"
                >
                  {node.member.role}
                </text>
              </g>
            );
          }
        })}
      </svg>

      {/* Zoom Level Display */}
      <div className="absolute bottom-4 right-4 z-10 bg-white bg-opacity-90 px-2 py-1 rounded text-sm text-gray-600">
        {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
};

export default MultiFamilyTree;
