// 2025-01-28: COMPLETELY REWRITTEN - Implemented ideal family tree layout matching reference images
// 2025-01-28: Parents connected horizontally at top, children below with simple connecting lines
// 2025-01-28: Clean, hierarchical structure with optimal spacing and readability
// 2025-01-28: ENHANCED: Added support for dynamic family relationships with editable connections
// 2025-01-28: ENHANCED: Implemented proper family editing workflow with relationship type selection

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhoneBookEntry } from '../../types/directory';

interface FamilyMember {
  entry: PhoneBookEntry;
  role: 'parent' | 'child' | 'other';
  relationship?: string;
}

interface FamilyRelationship {
  id: number;
  person1: number; // pid of first person
  person2: number; // pid of second person
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other';
  notes?: string;
  is_active: boolean;
}

interface FamilyTreeVisualizationProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[]; // 2025-01-28: Added actual family relationships
  onRelationshipChange?: (relationships: FamilyRelationship[]) => void; // 2025-01-28: Callback for relationship updates
  isEditable?: boolean; // 2025-01-28: Whether the tree can be edited
}

interface TreeNode {
  id: string;
  x: number;
  y: number;
  member: FamilyMember;
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

// 2025-01-28: Relationship type options for the dropdown
const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: '👨‍👩‍👧‍👦 Parent' },
  { value: 'child', label: '👶 Child' },
  { value: 'spouse', label: '💑 Spouse' },
  { value: 'sibling', label: '👫 Sibling' },
  { value: 'grandparent', label: '👴👵 Grandparent' },
  { value: 'grandchild', label: '👶 Grandchild' },
  { value: 'aunt_uncle', label: '👨‍👩‍👧‍👦 Aunt/Uncle' },
  { value: 'niece_nephew', label: '👶 Niece/Nephew' },
  { value: 'cousin', label: '👫 Cousin' },
  { value: 'other', label: '🔗 Other' }
];

const FamilyTreeVisualization: React.FC<FamilyTreeVisualizationProps> = ({ 
  familyMembers, 
  relationships = [], 
  onRelationshipChange,
  isEditable = false 
}) => {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [svgDimensions, setSvgDimensions] = useState({ width: 800, height: 600 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingMode, setEditingMode] = useState(false);
  const [relationshipType, setRelationshipType] = useState<string>('parent');
  const [showRelationshipSelector, setShowRelationshipSelector] = useState(false);
  const [pendingRelationship, setPendingRelationship] = useState<{
    fromNode: string;
    fromMember: FamilyMember;
    relationshipType: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const resizeTimeout = useRef<number | null>(null);
  const isCalculating = useRef(false);

  // 2025-01-28: Calculate optimal layout based on family structure and relationships
  const calculateLayout = useCallback(() => {
    // 2025-01-28: Prevent multiple simultaneous calculations
    if (isCalculating.current) return;
    
    isCalculating.current = true;
    
    try {
      console.log('calculateLayout called with:', {
        familyMembersCount: familyMembers.length,
        relationshipsCount: relationships.length,
        relationships: relationships
      });
      
      // 2025-01-28: Use actual relationships to determine hierarchy if available
      const hasRelationships = relationships.length > 0;
      
      if (hasRelationships) {
        calculateLayoutFromRelationships();
      } else {
        calculateLayoutFromRoles();
      }
    } finally {
      isCalculating.current = false;
    }
  }, [familyMembers, relationships]); // 2025-01-28: Include dependencies to get latest data

  // 2025-01-28: Calculate layout based on actual family relationships
  const calculateLayoutFromRelationships = () => {
    const nodeWidth = 140;
    const nodeHeight = 60;
    const horizontalSpacing = nodeWidth + 40;
    const verticalSpacing = nodeHeight + 60;
    
    // 2025-01-28: Build relationship graph and find hierarchy levels
    const relationshipGraph = new Map<number, Set<number>>();
    const relationshipTypes = new Map<string, string>();
    const nodeLevels = new Map<number, number>(); // Track each person's level in hierarchy
    const childrenByParent = new Map<number, number[]>(); // Track children for each parent
    
    // 2025-01-28: Build the relationship graph
    relationships.forEach(rel => {
      if (!relationshipGraph.has(rel.person1)) {
        relationshipGraph.set(rel.person1, new Set());
      }
      if (!relationshipGraph.has(rel.person2)) {
        relationshipGraph.set(rel.person2, new Set());
      }
      
      relationshipGraph.get(rel.person1)!.add(rel.person2);
      relationshipGraph.get(rel.person2)!.add(rel.person1);
      
      const key = `${rel.person1}-${rel.person2}`;
      relationshipTypes.set(key, rel.relationship_type);
      
      // 2025-01-28: Track parent-child relationships for hierarchy
      if (rel.relationship_type === 'parent' && rel.is_active) {
        if (!childrenByParent.has(rel.person1)) {
          childrenByParent.set(rel.person1, []);
        }
        childrenByParent.get(rel.person1)!.push(rel.person2);
      }
    });
    
    // 2025-01-28: Calculate hierarchy levels for all nodes
    const calculateNodeLevels = () => {
      const visited = new Set<number>();
      const queue: { pid: number; level: number }[] = [];
      
      // 2025-01-28: Find root nodes (people with no parents)
      const allPeople = new Set<number>();
      relationships.forEach(rel => {
        allPeople.add(rel.person1);
        allPeople.add(rel.person2);
      });
      
      const hasParents = new Set<number>();
      relationships.forEach(rel => {
        if (rel.relationship_type === 'parent' && rel.is_active) {
          hasParents.add(rel.person2); // person2 is the child
        }
      });
      
      const rootNodes = Array.from(allPeople).filter(pid => !hasParents.has(pid));
      
      // 2025-01-28: Start BFS from root nodes
      rootNodes.forEach(pid => {
        queue.push({ pid, level: 0 });
        nodeLevels.set(pid, 0);
        visited.add(pid);
      });
      
      // 2025-01-28: Process queue to assign levels
      while (queue.length > 0) {
        const { pid, level } = queue.shift()!;
        
        // 2025-01-28: Find all children of this person
        const children = childrenByParent.get(pid) || [];
        children.forEach(childPid => {
          if (!visited.has(childPid)) {
            const childLevel = level + 1;
            nodeLevels.set(childPid, childLevel);
            visited.add(childPid);
            queue.push({ pid: childPid, level: childLevel });
          }
        });
      }
      
      // 2025-01-28: Handle any disconnected nodes (assign them to level 0)
      allPeople.forEach(pid => {
        if (!visited.has(pid)) {
          nodeLevels.set(pid, 0);
        }
      });
    };
    
    // 2025-01-28: Calculate levels
    calculateNodeLevels();
    
    // 2025-01-28: Group nodes by level
    const nodesByLevel = new Map<number, number[]>();
    nodeLevels.forEach((level, pid) => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(pid);
    });
    
    // 2025-01-28: Calculate required dimensions
    const maxLevel = Math.max(...Array.from(nodeLevels.values()));
    const maxNodesInLevel = Math.max(...Array.from(nodesByLevel.values()).map(nodes => nodes.length));
    
    const requiredWidth = Math.max(
      maxNodesInLevel * horizontalSpacing - 40,
      600
    );
    const requiredHeight = 200 + (maxLevel * verticalSpacing);
    
    const svgWidth = requiredWidth + 80;
    const svgHeight = requiredHeight + 80;
    
    setSvgDimensions({ width: svgWidth, height: svgHeight });
    
    // 2025-01-28: Position nodes by level
    const newNodes: TreeNode[] = [];
    const newConnections: ConnectionLine[] = [];
    
    // 2025-28: Position nodes level by level
    for (let level = 0; level <= maxLevel; level++) {
      const levelNodes = nodesByLevel.get(level) || [];
      
      if (levelNodes.length === 0) continue;
      
      // 2025-01-28: Calculate horizontal positioning for this level
      const totalLevelWidth = (levelNodes.length - 1) * horizontalSpacing + nodeWidth;
      const levelStartX = (svgWidth - totalLevelWidth) / 2;
      const levelY = 40 + (level * verticalSpacing);
      
      // 2025-01-28: Position each node in this level
      levelNodes.forEach((pid, index) => {
        const member = familyMembers.find(m => m.entry.pid === pid);
        if (member) {
          const nodeX = levelStartX + index * horizontalSpacing;
          
          newNodes.push({
            id: `node-${pid}`,
            x: nodeX,
            y: levelY,
            member,
            width: nodeWidth,
            height: nodeHeight
          });
        }
      });
    }
    
    // 2025-01-28: Create connection lines from relationships
    relationships.forEach(rel => {
      if (rel.is_active && rel.relationship_type === 'parent') {
        const fromNode = newNodes.find(n => n.member.entry.pid === rel.person1);
        const toNode = newNodes.find(n => n.member.entry.pid === rel.person2);
        
        if (fromNode && toNode) {
          newConnections.push({
            id: `conn-${rel.id}`,
            fromNode: fromNode.id,
            toNode: toNode.id,
            relationshipType: rel.relationship_type,
            fromX: fromNode.x + fromNode.width / 2,
            fromY: fromNode.y + fromNode.height / 2,
            toX: toNode.x + toNode.width / 2,
            toY: toNode.y + toNode.height / 2
          });
        }
      }
    });
    
    setNodes(newNodes);
    setConnections(newConnections);
    
    console.log('Hierarchical layout calculated:', {
      levels: maxLevel + 1,
      nodesByLevel: Object.fromEntries(nodesByLevel),
      nodeLevels: Object.fromEntries(nodeLevels),
      totalNodes: newNodes.length,
      totalConnections: newConnections.length
    });
  };

  // 2025-01-28: Calculate layout based on inferred roles (fallback)
  const calculateLayoutFromRoles = () => {
    const parents = familyMembers.filter(m => m.role === 'parent');
    const children = familyMembers.filter(m => m.role === 'child');
    
    const nodeWidth = 140;
    const nodeHeight = 60;
    const horizontalSpacing = nodeWidth + 40;
    const verticalSpacing = nodeHeight + 60;
    
    const maxMembersInRow = Math.max(parents.length, children.length);
    const requiredWidth = Math.max(
      maxMembersInRow * horizontalSpacing - 40,
      600
    );
    const requiredHeight = 200 + (children.length > 0 ? verticalSpacing : 0);
    
    const svgWidth = requiredWidth + 80;
    const svgHeight = requiredHeight + 80;
    
    setSvgDimensions({ width: svgWidth, height: svgHeight });
    
    const newNodes: TreeNode[] = [];
    const newConnections: ConnectionLine[] = [];
    
    // 2025-01-28: Position parents at the top center
    if (parents.length === 1) {
      newNodes.push({
        id: `parent-${parents[0].entry.pid}`,
        x: (svgWidth - nodeWidth) / 2,
        y: 40,
        member: parents[0],
        width: nodeWidth,
        height: nodeHeight
      });
    } else if (parents.length > 1) {
      const totalWidth = (parents.length - 1) * horizontalSpacing + nodeWidth;
      const startX = (svgWidth - totalWidth) / 2;
      
      parents.forEach((parent, index) => {
        newNodes.push({
          id: `parent-${parent.entry.pid}`,
          x: startX + index * horizontalSpacing,
          y: 40,
          member: parent,
          width: nodeWidth,
          height: nodeHeight
        });
      });
    }
    
    // 2025-01-28: Position children below parents
    if (children.length > 0) {
      if (children.length === 1) {
        newNodes.push({
          id: `child-${children[0].entry.pid}`,
          x: (svgWidth - nodeWidth) / 2,
          y: 40 + verticalSpacing,
          member: children[0],
          width: nodeWidth,
          height: nodeHeight
        });
      } else {
        const totalChildWidth = (children.length - 1) * horizontalSpacing + nodeWidth;
        const childStartX = (svgWidth - totalChildWidth) / 2;
        
        children.forEach((child, index) => {
          newNodes.push({
            id: `child-${child.entry.pid}`,
            x: childStartX + index * horizontalSpacing,
            y: 40 + verticalSpacing,
            member: child,
            width: nodeWidth,
            height: nodeHeight
          });
        });
      }
    }
    
    // 2025-01-28: Create inferred connections (parents to children)
    if (parents.length > 0 && children.length > 0) {
      const parentCenterX = parents.reduce((sum, p) => sum + (svgWidth - nodeWidth) / 2, 0) / parents.length;
      const parentBottomY = 40 + nodeHeight;
      const childTopY = 40 + verticalSpacing;
      
      // 2025-01-28: Main vertical line from parents to children
      newConnections.push({
        id: 'inferred-main',
        fromNode: 'parent-line',
        toNode: 'child-line',
        relationshipType: 'parent',
        fromX: parentCenterX,
        fromY: parentBottomY,
        toX: parentCenterX,
        toY: childTopY
      });
      
      // 2025-01-28: Individual lines to each child
      children.forEach((child, index) => {
        const childX = children.length === 1 ? 
          (svgWidth - nodeWidth) / 2 : 
          (svgWidth - (children.length - 1) * horizontalSpacing - nodeWidth) / 2 + index * horizontalSpacing;
        
        newConnections.push({
          id: `inferred-child-${index}`,
          fromNode: 'parent-line',
          toNode: `child-${child.entry.pid}`,
          relationshipType: 'parent',
          fromX: parentCenterX,
          fromY: childTopY,
          toX: childX + nodeWidth / 2,
          toY: childTopY
        });
      });
    }
    
    setNodes(newNodes);
    setConnections(newConnections);
  };

  // 2025-01-28: Helper functions for relationship-based layout
  // Note: These functions are no longer needed with the new hierarchical layout algorithm

  // 2025-01-28: Handle editing mode toggle
  const toggleEditingMode = () => {
    const newMode = !editingMode;
    console.log('Toggling editing mode:', newMode);
    setEditingMode(newMode);
    setSelectedNode(null);
    setPendingRelationship(null);
    setShowRelationshipSelector(false);
  };

  // 2025-01-28: Handle node selection for editing
  const handleNodeClick = (nodeId: string) => {
    console.log('Node clicked:', nodeId, 'Editing mode:', editingMode);
    
    if (!editingMode) {
      console.log('Editing mode not active - enabling editing mode');
      // 2025-01-28: Auto-enable editing mode when clicking nodes
      setEditingMode(true);
      setSelectedNode(nodeId);
      setShowRelationshipSelector(true);
      return;
    }
    
    const clickedNode = nodes.find(n => n.id === nodeId);
    if (!clickedNode) {
      console.log('Clicked node not found:', nodeId);
      return;
    }
    
    console.log('Clicked node:', clickedNode.member.entry.name);
    
    if (selectedNode === nodeId) {
      // 2025-01-28: Deselect if clicking the same node
      console.log('Deselecting node:', nodeId);
      setSelectedNode(null);
      setPendingRelationship(null);
      setShowRelationshipSelector(false);
    } else if (selectedNode && selectedNode !== nodeId) {
      // 2025-01-28: Second node clicked - apply relationship
      console.log('Applying relationship from', selectedNode, 'to', nodeId);
      applyRelationship(selectedNode, nodeId);
    } else {
      // 2025-01-28: First node clicked - select it and show relationship selector
      console.log('Selecting first node:', nodeId);
      setSelectedNode(nodeId);
      setShowRelationshipSelector(true);
    }
  };

  // 2025-01-28: Handle relationship type selection
  const handleRelationshipTypeChange = (newType: string) => {
    setRelationshipType(newType);
    if (selectedNode) {
      const selectedMember = nodes.find(n => n.id === selectedNode)?.member;
      if (selectedMember) {
        setPendingRelationship({
          fromNode: selectedNode,
          fromMember: selectedMember,
          relationshipType: newType
        });
      }
    }
  };

  // 2025-01-28: Apply relationship between two nodes
  const applyRelationship = (fromNodeId: string, toNodeId: string) => {
    if (!pendingRelationship) {
      console.log('No pending relationship to apply');
      return;
    }
    
    if (!onRelationshipChange) {
      console.log('No onRelationshipChange callback provided - cannot create relationship');
      alert('Edit feature is not available - missing relationship callback');
      return;
    }
    
    const toMember = nodes.find(n => n.id === toNodeId)?.member;
    if (!toMember) {
      console.log('Target member not found:', toNodeId);
      return;
    }
    
    // 2025-01-28: Show confirmation dialog
    const fromName = pendingRelationship.fromMember.entry.name || 'Unknown';
    const toName = toMember.entry.name || 'Unknown';
    const relationshipLabel = RELATIONSHIP_OPTIONS.find(opt => opt.value === pendingRelationship.relationshipType)?.label || pendingRelationship.relationshipType;
    
    console.log('Creating relationship:', {
      from: fromName,
      to: toName,
      type: pendingRelationship.relationshipType,
      fromPid: pendingRelationship.fromMember.entry.pid,
      toPid: toMember.entry.pid
    });
    
    const confirmed = window.confirm(
      `Are you sure you want to set "${fromName}" as ${relationshipLabel} of "${toName}"?`
    );
    
    if (confirmed) {
      try {
        // 2025-01-28: Create new relationship - fix the direction for parent-child relationships
        let newRelationship: FamilyRelationship;
        
        if (pendingRelationship.relationshipType === 'child') {
          // 2025-01-28: If "A is child of B", create parent relationship from B to A
          newRelationship = {
            id: Date.now(), // Temporary ID
            person1: toMember.entry.pid, // B (the parent)
            person2: pendingRelationship.fromMember.entry.pid, // A (the child)
            relationship_type: 'parent', // B is parent of A
            is_active: true
          };
        } else if (pendingRelationship.relationshipType === 'parent') {
          // 2025-01-28: If "A is parent of B", create parent relationship from A to B
          newRelationship = {
            id: Date.now(), // Temporary ID
            person1: pendingRelationship.fromMember.entry.pid, // A (the parent)
            person2: toMember.entry.pid, // B (the child)
            relationship_type: 'parent', // A is parent of B
            is_active: true
          };
        } else {
          // 2025-01-28: For other relationship types, use original logic
          newRelationship = {
            id: Date.now(), // Temporary ID
            person1: pendingRelationship.fromMember.entry.pid,
            person2: toMember.entry.pid,
            relationship_type: pendingRelationship.relationshipType as any,
            is_active: true
          };
        }
        
        console.log('New relationship object:', newRelationship);
        console.log('Relationship direction:', {
          from: pendingRelationship.fromMember.entry.name,
          to: toMember.entry.name,
          type: pendingRelationship.relationshipType,
          finalRelationship: `${newRelationship.person1} is parent of ${newRelationship.person2}`
        });
        
        const updatedRelationships = [...relationships, newRelationship];
        console.log('Updated relationships array:', updatedRelationships);
        onRelationshipChange(updatedRelationships);
        
        // 2025-01-28: Reset editing state
        setSelectedNode(null);
        setPendingRelationship(null);
        setShowRelationshipSelector(false);
        
        // 2025-01-28: Show success message
        alert(`Relationship created: "${fromName}" is now ${relationshipLabel} of "${toName}"`);
      } catch (error) {
        console.error('Error creating relationship:', error);
        alert(`Error creating relationship: ${error}`);
      }
    }
  };

  // 2025-01-28: Calculate layout whenever component mounts or data changes
  useEffect(() => {
    // 2025-01-28: Recalculate whenever data changes
    if (familyMembers.length > 0 || relationships.length > 0) {
      console.log('Data changed, recalculating layout:', {
        familyMembersCount: familyMembers.length,
        relationshipsCount: relationships.length,
        relationships: relationships.map(r => `${r.person1}->${r.person2}(${r.person2})`)
      });
      console.log('Full relationships data:', relationships);
      calculateLayout();
    }
  }, [familyMembers, relationships]); // 2025-01-28: Depend on actual data, not just lengths

  // 2025-01-28: Handle container resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      // 2025-01-28: Debounce resize events to prevent excessive recalculations
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
      resizeTimeout.current = setTimeout(() => {
        if (familyMembers.length > 0 || relationships.length > 0) {
          calculateLayout();
        }
      }, 100);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
    };
  }, []); // 2025-01-28: Empty dependency array - only run once on mount

  // 2025-01-28: Fit to view function
  const fitToView = () => {
    setZoomLevel(1);
    calculateLayout();
  };

  // 2025-01-28: Zoom functions
  const zoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.3));

  // 2025-01-28: Render family member node
  const renderNode = (node: TreeNode) => {
    const { member } = node;
    const age = member.entry.DOB ? new Date().getFullYear() - new Date(member.entry.DOB).getFullYear() : null;
    const isSelected = selectedNode === node.id;
    const isPending = pendingRelationship?.fromNode === node.id;
    
    return (
      <g key={node.id}>
        {/* 2025-01-28: Node background */}
        <rect
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          rx={8}
          fill={isPending ? "#fef3c7" : isSelected ? "#dbeafe" : "white"}
          stroke={isPending ? "#f59e0b" : isSelected ? "#2563eb" : "#3b82f6"}
          strokeWidth={isPending ? "3" : isSelected ? "3" : "2"}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
          style={{ cursor: 'pointer' }}
          onClick={() => handleNodeClick(node.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        />
        
        {/* 2025-01-28: Member name */}
        <text
          x={node.x + node.width / 2}
          y={node.y + 20}
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="#1f2937"
        >
          {member.entry.name || 'Unknown'}
        </text>
        
        {/* 2025-01-28: Age display */}
        {age && (
          <text
            x={node.x + node.width / 2}
            y={node.y + 35}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            ({age})
          </text>
        )}
        
        {/* 2025-01-28: Contact number */}
        {member.entry.contact && (
          <text
            x={node.x + node.width / 2}
            y={node.y + 50}
            textAnchor="middle"
            fontSize="9"
            fill="#6b7280"
          >
            {member.entry.contact}
          </text>
        )}
        
        {/* 2025-01-28: Selection indicators */}
        {isSelected && (
          <circle
            cx={node.x + node.width + 5}
            cy={node.y + node.height / 2}
            r="8"
            fill="#2563eb"
            stroke="white"
            strokeWidth="2"
          />
        )}
        
        {isPending && (
          <circle
            cx={node.x + node.width + 5}
            cy={node.y + node.height / 2}
            r="8"
            fill="#f59e0b"
            stroke="white"
            strokeWidth="2"
          />
        )}
        
        {/* 2025-01-28: Clickable indicator */}
        <text
          x={node.x + node.width / 2}
          y={node.y + node.height + 15}
          textAnchor="middle"
          fontSize="8"
          fill="#6b7280"
          style={{ pointerEvents: 'none' }}
        >
          {editingMode ? 'Click to select' : 'Click to edit'}
        </text>
        
        {/* 2025-01-28: Editing mode indicator */}
        {editingMode && (
          <rect
            x={node.x - 2}
            y={node.y - 2}
            width={node.width + 4}
            height={node.height + 4}
            rx={10}
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="3,3"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </g>
    );
  };

  // 2025-01-28: Render connection lines
  const renderConnections = () => {
    return connections.map(conn => (
      <g key={conn.id}>
        {/* 2025-01-28: Connection line */}
        <line
          x1={conn.fromX}
          y1={conn.fromY}
          x2={conn.toX}
          y2={conn.toY}
          stroke="#3b82f6"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        
        {/* 2025-01-28: Relationship type label */}
        <text
          x={(conn.fromX + conn.toX) / 2}
          y={(conn.fromY + conn.toY) / 2 - 5}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
        >
          {conn.relationshipType}
        </text>
      </g>
    ));
  };

  return (
    <div ref={containerRef} className="family-tree-container">
      {/* 2025-01-28: Family tree controls */}
      <div className="family-tree-controls">
        <button
          onClick={fitToView}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium"
        >
          Fit to View
        </button>
        <button
          onClick={() => {
            console.log('Manual refresh triggered');
            calculateLayout();
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm font-medium"
          title="Refresh family tree layout"
        >
          🔄 Refresh
        </button>
        <button
          onClick={zoomIn}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium"
        >
          Zoom In
        </button>
        <button
          onClick={zoomOut}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium"
        >
          Zoom Out
        </button>
        <span className="text-sm text-gray-600 ml-2">
          Zoom: {Math.round(zoomLevel * 100)}%
        </span>
        
        {/* 2025-01-28: Edit family button */}
        {isEditable && (
          <button
            onClick={toggleEditingMode}
            className={`px-3 py-2 rounded text-sm font-medium ${
              editingMode 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {editingMode ? '✋ Stop Editing' : '✏️ Edit Family'}
          </button>
        )}
        
        {/* 2025-01-28: Relationship type selector */}
        {editingMode && showRelationshipSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Relationship:</span>
            <select
              value={relationshipType}
              onChange={(e) => handleRelationshipTypeChange(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {RELATIONSHIP_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* 2025-01-28: Editing mode indicator */}
        {editingMode && (
          <span className="text-sm text-green-600 ml-2">
            ✏️ Editing Mode
          </span>
        )}
      </div>
      
      {/* 2025-01-28: Family tree visualization */}
      <div className="family-tree-content">
        <svg
          ref={svgRef}
          width={svgDimensions.width}
          height={svgDimensions.height}
          viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            maxWidth: '100%',
            height: 'auto'
          }}
        >
          {/* 2025-01-28: Arrow marker for connections */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
          </defs>
          
          {/* 2025-01-28: Render connection lines first (behind nodes) */}
          {renderConnections()}
          
          {/* 2025-01-28: Render family member nodes */}
          {nodes.map(renderNode)}
        </svg>
      </div>
      
      {/* 2025-01-28: Editing instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        {editingMode ? (
          <>
            <p className="text-sm text-blue-800">
              <strong>✏️ Editing Mode Active:</strong> 
              {!selectedNode ? (
                ' Click on any family member to select them, then choose the relationship type from the dropdown above.'
              ) : !pendingRelationship ? (
                ' Now choose the relationship type from the dropdown above.'
              ) : (
                ' Now click on another family member to create the relationship. You will be asked to confirm.'
              )}
            </p>
            {selectedNode && (
              <p className="text-sm text-blue-600 mt-1">
                Selected: <strong>{nodes.find(n => n.id === selectedNode)?.member.entry.name || 'Unknown'}</strong>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-blue-800">
            <strong>💡 How to Edit Family:</strong> Click on any family member to start editing, or use the "Edit Family" button above.
          </p>
        )}
      </div>
    </div>
  );
};

export default FamilyTreeVisualization;