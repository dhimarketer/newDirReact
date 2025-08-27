// 2025-01-28: NEW - Simplified family tree visualization component for Phase 2
// 2025-01-28: Implements 3-level hierarchy limit (grandparents → parents → children)
// 2025-01-28: Clean grid-based layout algorithm with optimized SVG rendering
// 2025-01-28: Clear visual hierarchy and responsive design

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

interface SimpleFamilyTreeProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  onRelationshipChange?: (relationships: FamilyRelationship[]) => void;
  isEditable?: boolean;
}

interface TreeNode {
  id: string;
  x: number;
  y: number;
  member: FamilyMember;
  level: number;
  generation: 'grandparent' | 'parent' | 'child';
  width: number;
  height: number;
}

interface ConnectionLine {
  id: string;
  fromNode: string;
  toNode: string;
  relationshipType: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const SimpleFamilyTree: React.FC<SimpleFamilyTreeProps> = ({ 
  familyMembers, 
  relationships = [], 
  onRelationshipChange,
  isEditable = false 
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Constants for tree layout
  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 80;
  const LEVEL_SPACING = 120;
  const NODE_SPACING = 200;
  const MARGIN = 40;

  // Organize family members into 3 generations
  const organizedMembers = useMemo(() => {
    // 2025-01-28: DEBUG - Log incoming data structure
    console.log('=== SIMPLE FAMILY TREE DEBUG ===');
    console.log('DEBUG: familyMembers received:', familyMembers);
    console.log('DEBUG: relationships received:', relationships);
    console.log('DEBUG: First member structure:', familyMembers[0]);
    console.log('DEBUG: First member entry:', familyMembers[0]?.entry);
    console.log('DEBUG: First member pid:', familyMembers[0]?.entry?.pid);
    console.log('=== END SIMPLE FAMILY TREE DEBUG ===');
    
    const organized = {
      grandparents: [] as FamilyMember[],
      parents: [] as FamilyMember[],
      children: [] as FamilyMember[]
    };

    // 2025-01-27: FIXED - Added null checks for member.entry.pid to prevent TypeError
    // Filter out members without valid pid before processing
    const validMembers = familyMembers.filter(member => 
      member.entry && member.entry.pid !== undefined && member.entry.pid !== null
    );
    
    console.log('DEBUG: Valid members after filtering:', validMembers);
    console.log('DEBUG: Invalid members filtered out:', familyMembers.filter(member => 
      !member.entry || member.entry.pid === undefined || member.entry.pid === null
    ));
    
    // 2025-01-28: FIXED - Add early return if no valid members to prevent crashes
    if (validMembers.length === 0) {
      console.log('DEBUG: No valid members found, returning empty organized structure');
      return organized;
    }

    // Analyze relationships to determine generations
    const memberMap = new Map<string, FamilyMember>();
    validMembers.forEach((member, index) => {
      // 2025-01-28: FIXED - Use index as fallback when pid is 0 to ensure unique keys
      const uniqueId = member.entry.pid !== 0 ? member.entry.pid.toString() : `member_${index}`;
      memberMap.set(uniqueId, member);
    });

    // Find root members (those without parents)
    const rootMembers = validMembers.filter(member => {
      if (!member.entry.pid) return false;
      const hasParent = relationships.some(rel => 
        rel.relationship_type === 'parent' && 
        rel.person2 === member.entry.pid
      );
      return !hasParent;
    });

    // Find children of root members
    const children = validMembers.filter(member => {
      if (!member.entry.pid) return false;
      const hasParent = relationships.some(rel => 
        rel.relationship_type === 'parent' && 
        rel.person2 === member.entry.pid
      );
      return hasParent;
    });

    // Find grandparents (parents of root members)
    const grandparents = validMembers.filter(member => {
      if (!member.entry.pid) return false;
      const isGrandparent = relationships.some(rel => 
        rel.relationship_type === 'grandparent' && 
        rel.person1 === member.entry.pid
      );
      return isGrandparent;
    });

    // Assign to appropriate generation
    organized.grandparents = grandparents.slice(0, 4); // Max 4 grandparents
    organized.parents = rootMembers.slice(0, 6); // Max 6 parents
    organized.children = children.slice(0, 12); // Max 12 children

    return organized;
  }, [familyMembers, relationships]);

  // Calculate tree layout
  const treeLayout = useMemo(() => {
    const nodes: TreeNode[] = [];
    const connections: ConnectionLine[] = [];
    
    let nodeId = 0;

    // Position grandparents (top level)
    const grandparentCount = organizedMembers.grandparents.length;
    const grandparentStartX = (grandparentCount * NODE_SPACING) / 2;
    
    organizedMembers.grandparents.forEach((member, index) => {
      const x = grandparentStartX - (index * NODE_SPACING) + MARGIN;
      const y = MARGIN;
      
      nodes.push({
        id: `node_${nodeId++}`,
        x,
        y,
        member,
        level: 0,
        generation: 'grandparent',
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      });
    });

    // Position parents (middle level)
    const parentCount = organizedMembers.parents.length;
    const parentStartX = (parentCount * NODE_SPACING) / 2;
    
    organizedMembers.parents.forEach((member, index) => {
      const x = parentStartX - (index * NODE_SPACING) + MARGIN;
      const y = MARGIN + LEVEL_SPACING;
      
      nodes.push({
        id: `node_${nodeId++}`,
        x,
        y,
        member,
        level: 1,
        generation: 'parent',
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      });
    });

    // Position children (bottom level)
    const childrenPerRow = 6;
    const childRows = Math.ceil(organizedMembers.children.length / childrenPerRow);
    
    organizedMembers.children.forEach((member, index) => {
      const row = Math.floor(index / childrenPerRow);
      const col = index % childrenPerRow;
      const x = (col * NODE_SPACING) + MARGIN;
      const y = MARGIN + (2 * LEVEL_SPACING) + (row * (NODE_HEIGHT + 20));
      
      nodes.push({
        id: `node_${nodeId++}`,
        x,
        y,
        member,
        level: 2,
        generation: 'child',
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      });
    });

    // Create connections based on relationships
    relationships.forEach((relationship, index) => {
      const fromNode = nodes.find(n => n.member.entry.pid === relationship.person1);
      const toNode = nodes.find(n => n.member.entry.pid === relationship.person2);
      
      if (fromNode && toNode) {
        connections.push({
          id: `connection_${index}`,
          fromNode: fromNode.id,
          toNode: toNode.id,
          relationshipType: relationship.relationship_type,
          fromX: fromNode.x + fromNode.width / 2,
          fromY: fromNode.y + fromNode.height / 2,
          toX: toNode.x + toNode.width / 2,
          toY: toNode.y + toNode.height / 2
        });
      }
    });

    return { nodes, connections };
  }, [organizedMembers, relationships]);

  // Calculate SVG dimensions
  const svgDimensions = useMemo(() => {
    if (treeLayout.nodes.length === 0) {
      return { width: 800, height: 600 };
    }

    const maxX = Math.max(...treeLayout.nodes.map(n => n.x + n.width));
    const maxY = Math.max(...treeLayout.nodes.map(n => n.y + n.height));
    
    return {
      width: Math.max(800, maxX + MARGIN),
      height: Math.max(600, maxY + MARGIN)
    };
  }, [treeLayout]);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => Math.max(0.5, Math.min(2, prev + delta * 0.1)));
  }, []);

  // Handle pan start
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [panOffset]);

  // Handle pan move
  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  // Handle pan end
  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  }, [selectedNode]);

  // Handle node hover
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNode(nodeId);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            handleZoom(1);
            break;
          case '-':
            e.preventDefault();
            handleZoom(-1);
            break;
          case '0':
            e.preventDefault();
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 });
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleZoom]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -1 : 1);
    }
  }, [handleZoom]);

  // Get node styling based on generation and state
  const getNodeStyle = useCallback((node: TreeNode) => {
    const baseStyle = {
      fill: '#ffffff',
      stroke: '#3b82f6',
      strokeWidth: 2
    };

    // Generation-specific colors
    switch (node.generation) {
      case 'grandparent':
        baseStyle.fill = '#fef3c7';
        baseStyle.stroke = '#f59e0b';
        break;
      case 'parent':
        baseStyle.fill = '#dbeafe';
        baseStyle.stroke = '#3b82f6';
        break;
      case 'child':
        baseStyle.fill = '#dcfce7';
        baseStyle.stroke = '#10b981';
        break;
    }

    // Hover and selection states
    if (hoveredNode === node.id) {
      baseStyle.strokeWidth = 3;
      baseStyle.stroke = '#1d4ed8';
    }

    if (selectedNode === node.id) {
      baseStyle.strokeWidth = 4;
      baseStyle.stroke = '#dc2626';
    }

    return baseStyle;
  }, [hoveredNode, selectedNode]);

  // Get connection styling
  const getConnectionStyle = useCallback((connection: ConnectionLine) => {
    const baseStyle = {
      stroke: '#6b7280',
      strokeWidth: 2,
      fill: 'none'
    };

    // Relationship-specific colors
    switch (connection.relationshipType) {
      case 'parent':
      case 'grandparent':
        baseStyle.stroke = '#3b82f6';
        break;
      case 'spouse':
        baseStyle.stroke = '#ec4899';
        break;
      case 'sibling':
        baseStyle.stroke = '#10b981';
        break;
      case 'other':
        baseStyle.stroke = '#6b7280';
        break;
    }

    return baseStyle;
  }, []);

  // Format age from DOB
  const formatAge = useCallback((dob?: string): string => {
    if (!dob) return '';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
      }
      return age;
    } catch {
      return '';
    }
  }, []);

  // Format name with age suffix
  const formatNameWithAge = useCallback((name: string, dob?: string): string => {
    if (!dob) return name;
    const age = formatAge(dob);
    if (age === '') return name;
    return `${name} (${age})`;
  }, [formatAge]);

  // Format contact number
  const formatContact = useCallback((contact: string): string => {
    if (contact.length === 7) {
      return `${contact.slice(0, 3)}-${contact.slice(3, 5)}-${contact.slice(5)}`;
    }
    return contact;
  }, []);

  // Early return if no family members
  if (!familyMembers || familyMembers.length === 0) {
    return (
      <div className="family-tree-empty-state">
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Family Members Found</h3>
          <p className="text-gray-500 mb-4">
            No family members have been added yet. Click "Edit Family Tree" to add members.
          </p>
          <div className="text-sm text-gray-400">
            <p>Debug Info:</p>
            <p>Family Members: {familyMembers?.length || 0}</p>
            <p>Relationships: {relationships?.length || 0}</p>
            <p>Is Editable: {isEditable ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Early return if no valid members after filtering
  if (organizedMembers.grandparents.length === 0 && 
      organizedMembers.parents.length === 0 && 
      organizedMembers.children.length === 0) {
    return (
      <div className="family-tree-empty-state">
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Valid Family Members</h3>
          <p className="text-gray-500 mb-4">
            Family members were found but could not be organized into generations.
          </p>
          <div className="text-sm text-gray-400">
            <p>Debug Info:</p>
            <p>Total Members: {familyMembers.length}</p>
            <p>Valid Members: {familyMembers.filter(m => m.entry && m.entry.pid !== undefined && m.entry.pid !== null).length}</p>
            <p>Relationships: {relationships.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="simple-family-tree-container"
      onMouseDown={handlePanStart}
      onMouseMove={handlePanMove}
      onMouseUp={handlePanEnd}
      onMouseLeave={handlePanEnd}
      onWheel={handleWheel}
    >
      {/* Controls */}
      <div className="simple-family-tree-controls">
        <div className="control-group">
          <button 
            onClick={() => handleZoom(1)}
            title="Zoom In (Ctrl/Cmd + +)"
            className="control-button"
          >
            +
          </button>
          <button 
            onClick={() => handleZoom(-1)}
            title="Zoom Out (Ctrl/Cmd + -)"
            className="control-button"
          >
            −
          </button>
          <button 
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            title="Reset View (Ctrl/Cmd + 0)"
            className="control-button"
          >
            ⌂
          </button>
        </div>
        
        <div className="generation-info">
          <span className="generation-badge grandparent">Grandparents: {organizedMembers.grandparents.length}</span>
          <span className="generation-badge parent">Parents: {organizedMembers.parents.length}</span>
          <span className="generation-badge child">Children: {organizedMembers.children.length}</span>
        </div>
      </div>

      {/* SVG Container */}
      <div className="svg-container">
        <svg
          ref={svgRef}
          width={svgDimensions.width}
          height={svgDimensions.height}
          viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Connections */}
          <g className="connections">
            {treeLayout.connections.map(connection => (
              <line
                key={connection.id}
                x1={connection.fromX}
                y1={connection.fromY}
                x2={connection.toX}
                y2={connection.toY}
                {...getConnectionStyle(connection)}
                markerEnd="url(#arrowhead)"
              />
            ))}
          </g>

          {/* Arrow marker for connections */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
            </marker>
          </defs>

          {/* Nodes */}
          <g className="nodes">
            {treeLayout.nodes.map((node, index) => (
              <g
                key={`${node.id}_${index}`}
                className={`family-node ${node.generation} ${selectedNode === node.id ? 'selected' : ''}`}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => handleNodeHover(node.id)}
                onMouseLeave={() => handleNodeHover(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node background */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx="8"
                  ry="8"
                  {...getNodeStyle(node)}
                />
                
                {/* Node content */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 20}
                  textAnchor="middle"
                  className="node-name"
                  fontSize="12"
                  fontWeight="600"
                  fill="#1f2937"
                >
                  {formatNameWithAge(node.member.entry.name, node.member.entry.DOB)}
                </text>
                
                {/* Remove separate age display since it's now part of the name */}
                
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 35}
                  textAnchor="middle"
                  className="node-role"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {node.member.role}
                </text>
                
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 50}
                  textAnchor="middle"
                  className="node-contact"
                  fontSize="9"
                  fill="#9ca3af"
                >
                  {node.member.entry.contact ? formatContact(node.member.entry.contact) : 'No contact'}
                </text>
                
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 65}
                  textAnchor="middle"
                  className="node-address"
                  fontSize="8"
                  fill="#9ca3af"
                >
                  {node.member.entry.address}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Instructions */}
      <div className="simple-family-tree-instructions">
        <p>
          <strong>Controls:</strong> 
          Drag to pan • Scroll to zoom • Click nodes to select • 
          Ctrl/Cmd + 0 to reset view
        </p>
      </div>
    </div>
  );
};

export default SimpleFamilyTree;
