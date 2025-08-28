// 2025-01-28: NEW - Simplified family tree visualization component for Phase 2
// 2025-01-28: Implements 3-level hierarchy limit (grandparents → parents → children)
// 2025-01-28: Clean grid-based layout algorithm with optimized SVG rendering
// 2025-01-28: Clear visual hierarchy and responsive design
// 2025-01-29: FIXED - Container fitting issues to prevent clipping and ensure all family members are visible

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

interface OrganizedMembers {
  grandparents: FamilyMember[];
  parents: FamilyMember[];
  children: FamilyMember[];
}

const SimpleFamilyTree: React.FC<SimpleFamilyTreeProps> = ({ 
  familyMembers, 
  relationships = [], 
  onRelationshipChange,
  isEditable = false 
}) => {
  console.log('🔍 SimpleFamilyTree Component Debug:');
  console.log('Received familyMembers:', familyMembers);
  console.log('Family members structure:', familyMembers.map(m => ({
    entry: m.entry,
    role: m.role,
    relationship: m.relationship,
    hasAge: m.entry?.age !== undefined && m.entry?.age !== null
  })));

  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [autoFitApplied, setAutoFitApplied] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 2025-01-29: ENHANCED - Dynamic sizing based on container and family size
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  // Constants for tree layout - now dynamic based on container size
  const getLayoutConstants = useCallback(() => {
    const baseWidth = Math.min(containerSize.width * 0.8, 200);
    // 2025-01-29: ENHANCED - Increased base height to accommodate wrapped text
    const baseHeight = Math.min(containerSize.height * 0.12, 120);
    const baseSpacing = Math.min(containerSize.width * 0.15, 150);
    const baseLevelSpacing = Math.min(containerSize.height * 0.15, 120);
    
    return {
      NODE_WIDTH: Math.max(baseWidth, 120),
      NODE_HEIGHT: Math.max(baseHeight, 80), // Increased minimum height for wrapped text
      NODE_SPACING: Math.max(baseSpacing, 100),
      LEVEL_SPACING: Math.max(baseLevelSpacing, 80),
      MARGIN: Math.max(containerSize.width * 0.05, 30)
    };
  }, [containerSize]);

  // 2025-01-29: ADDED - Container size observer for responsive layout
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
        // Reset auto-fit when container size changes
        setAutoFitApplied(false);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // 2025-01-29: ENHANCED - Auto-fit functionality to ensure all content is visible
  const applyAutoFit = useCallback((nodes: TreeNode[]) => {
    if (!svgRef.current || nodes.length === 0) return;
    
    const svg = svgRef.current;
    const svgRect = svg.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!containerRect) return;
    
    // Calculate the bounding box of all nodes
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + n.width));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y + n.height));
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // 2025-01-29: FIXED - Calculate scale to fit content within container with proper margins
    const margin = 100; // Ensure 100px margin on all sides
    const availableWidth = containerRect.width - (margin * 2);
    const availableHeight = containerRect.height - (margin * 2);
    
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
    
    // 2025-01-29: FIXED - Calculate center offset to properly center content
    const scaledContentWidth = contentWidth * scale;
    const scaledContentHeight = contentHeight * scale;
    
    const centerX = (containerRect.width - scaledContentWidth) / 2;
    const centerY = (containerRect.height - scaledContentHeight) / 2;
    
    // Apply transformations with proper centering
    setZoomLevel(scale);
    setPanOffset({
      x: centerX - minX * scale,
      y: centerY - minY * scale
    });
    
    setAutoFitApplied(true);
    
    console.log('🔍 Auto-fit applied:', {
      contentWidth,
      contentHeight,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
      scale,
      centerX,
      centerY,
      panOffset: { x: centerX - minX * scale, y: centerY - minY * scale }
    });
  }, []);

  // 2025-01-29: ENHANCED - Organize family members into generations using proven 3-pass parent detection logic with 10-year age gap threshold
  const organizedMembers = useMemo(() => {
    const organized: OrganizedMembers = {
      grandparents: [],
      parents: [],
      children: []
    };

    // Filter out invalid members (must have age data)
    const validMembers = familyMembers.filter(member => 
      member.entry.age !== undefined && member.entry.age !== null
    );

    if (validMembers.length === 0) {
      console.log('⚠️ No members with age data found');
      return organized;
    }

    // Sort by age (oldest first)
    const sortedByAge = [...validMembers].sort((a, b) => 
      (b.entry.age || 0) - (a.entry.age || 0)
    );

    console.log(`🎯 Processing ${sortedByAge.length} members with age data`);
    console.log('Age distribution:', sortedByAge.map(m => ({ name: m.entry.name, age: m.entry.age })));

    const potentialParents: FamilyMember[] = [];
    const children: FamilyMember[] = [];

    // First pass: identify true parents based on significant age gaps to ALL potential children
    if (sortedByAge.length > 0) {
      // Start with the assumption that the eldest might be a parent
      const eldest = sortedByAge[0];
      const eldestAge = eldest.entry.age || 0;
      
      // Check if eldest can be a parent to ALL other members
      let eldestCanBeParent = true;
      for (let i = 1; i < sortedByAge.length; i++) {
        const member = sortedByAge[i];
        const memberAge = member.entry.age || 0;
        const ageDifference = eldestAge - memberAge;
        
        // If age difference is less than 10 years, eldest cannot be a parent
        if (ageDifference < 10) {
          eldestCanBeParent = false;
          break;
        }
      }
      
      if (eldestCanBeParent) {
        potentialParents.push(eldest);
        // Add all other members as children
        for (let i = 1; i < sortedByAge.length; i++) {
          children.push(sortedByAge[i]);
        }
        console.log(`✅ ${eldest.entry.name} (${eldestAge}) identified as parent to all children`);
      } else {
        // Eldest cannot be a parent, add to children
        children.push(eldest);
        console.log(`⚠️ ${eldest.entry.name} (${eldestAge}) cannot be parent - age gap too small`);
      }
    }

    // Second pass: look for additional parents among remaining members
    if (potentialParents.length > 0 && children.length > 0) {
      const remainingMembers = sortedByAge.filter(member => 
        !potentialParents.includes(member) && !children.includes(member)
      );
      
      for (const member of remainingMembers) {
        const memberAge = member.entry.age || 0;
        let canBeParent = true;
        
        // Check if this member can be a parent to ALL children
        for (const child of children) {
          const childAge = child.entry.age || 0;
          const ageDifference = memberAge - childAge;
          
          // If age difference is less than 10 years, can't be a parent
          if (ageDifference < 10) {
            canBeParent = false;
            console.log(`❌ ${member.entry.name} (${memberAge}) cannot be parent to ${child.entry.name} (${childAge}) - age gap: ${ageDifference} years`);
            break;
          }
        }
        
        if (canBeParent && potentialParents.length < 2) {
          potentialParents.push(member);
          console.log(`✅ ${member.entry.name} (${memberAge}) identified as additional parent`);
        } else {
          children.push(member);
          console.log(`👶 ${member.entry.name} (${memberAge}) classified as child`);
        }
      }
    }

    // Third pass: look for second parent among children based on age gap to remaining children
    // 2025-01-29: FIXED - Second parent should have 10+ year gap to children, not to first parent
    if (potentialParents.length === 1 && children.length > 0) {
      const firstParent = potentialParents[0];
      const firstParentGender = firstParent.entry.gender;
      
      console.log(`🔍 Third pass: Looking for second parent among ${children.length} children`);
      console.log(`   First parent: ${firstParent.entry.name} (${firstParent.entry.age}) - gender: ${firstParentGender || 'unknown'}`);
      
      // Look for second parent among children
      // Second parent should have 10+ year age gap to the remaining children
      let bestSecondParent = null;
      let maxValidChildren = 0;
      
      for (const child of children) {
        const childAge = child.entry.age || 0;
        const childGender = child.entry.gender;
        
        console.log(`   Checking ${child.entry.name} (${childAge}) - gender: ${childGender || 'unknown'}`);
        
        // Check if this person could be a parent to the remaining children
        const remainingChildren = children.filter(c => c !== child);
        let validChildrenCount = 0;
        
        for (const otherChild of remainingChildren) {
          const otherChildAge = otherChild.entry.age || 0;
          const gapToOtherChild = childAge - otherChildAge;
          
          if (gapToOtherChild >= 10) {
            validChildrenCount++;
            console.log(`     ✅ Can be parent to ${otherChild.entry.name} (${otherChildAge}) - gap: ${gapToOtherChild} years`);
          } else {
            console.log(`     ❌ Cannot be parent to ${otherChild.entry.name} (${otherChildAge}) - gap: ${gapToOtherChild} years`);
          }
        }
        
        console.log(`   📊 ${child.entry.name} can be parent to ${validChildrenCount}/${remainingChildren.length} remaining children`);
        
        // Prefer different gender from first parent, but accept same gender if no better option
        const isDifferentGender = firstParentGender && childGender && firstParentGender !== childGender;
        const genderBonus = isDifferentGender ? 1 : 0;
        const totalScore = validChildrenCount + genderBonus;
        
        if (validChildrenCount > 0 && totalScore > maxValidChildren) {
          maxValidChildren = totalScore;
          bestSecondParent = child;
          console.log(`   🎯 New best second parent: ${child.entry.name} (score: ${totalScore})`);
        }
      }
      
      if (bestSecondParent) {
        potentialParents.push(bestSecondParent);
        children.splice(children.indexOf(bestSecondParent), 1);
        console.log(`💑 ${bestSecondParent.entry.name} promoted to second parent (can parent ${maxValidChildren} children)`);
      } else {
        console.log(`   ❌ No suitable second parent found`);
      }
    }

    // If we still don't have any parents identified, all members go to children
    if (potentialParents.length === 0) {
      children.push(...sortedByAge);
      console.log(`⚠️ No parents identified, all ${sortedByAge.length} members moved to children`);
    }
    
    // Assign to appropriate generation using proven logic
    organized.parents = potentialParents.slice(0, 4); // Max 4 parents
    organized.children = children.slice(0, 12); // Max 12 children

    console.log(`🎯 Final organization: ${organized.parents.length} parents, ${organized.children.length} children`);
    console.log('Final parents:', organized.parents.map(p => ({ name: p.entry.name, age: p.entry.age })));
    console.log('Final children:', organized.children.map(c => ({ name: c.entry.name, age: c.entry.age })));

    return organized;
  }, [familyMembers]);

  // 2025-01-29: ENHANCED - Dynamic layout calculation with container-aware positioning
  const treeLayout = useMemo(() => {
    const nodes: TreeNode[] = [];
    const connections: ConnectionLine[] = [];
    
    let nodeId = 0;
    const layout = getLayoutConstants();

    // 2025-01-29: FIXED - Calculate total width needed for each level with proper spacing
    const grandparentWidth = Math.max(organizedMembers.grandparents.length * layout.NODE_SPACING, layout.NODE_WIDTH);
    const parentWidth = Math.max(organizedMembers.parents.length * layout.NODE_SPACING, layout.NODE_WIDTH);
    
    // 2025-01-29: FIXED - Calculate children layout with proper row handling
    const maxChildrenPerRow = Math.max(1, Math.floor((containerSize.width - 100) / layout.NODE_SPACING));
    const childRows = Math.ceil(organizedMembers.children.length / maxChildrenPerRow);
    const maxRowWidth = Math.min(organizedMembers.children.length, maxChildrenPerRow) * layout.NODE_SPACING;

    // 2025-01-29: FIXED - Center each level within the container with proper margins
    const centerX = containerSize.width / 2;
    const leftMargin = Math.max(layout.MARGIN, 50); // Ensure minimum left margin
    const rightMargin = Math.max(layout.MARGIN, 50); // Ensure minimum right margin

    // 2025-01-29: FIXED - Position grandparents (top level) with proper centering
    const grandparentStartX = centerX - (grandparentWidth / 2) + (layout.NODE_WIDTH / 2);
    
    organizedMembers.grandparents.forEach((member, index) => {
      const x = grandparentStartX + (index * layout.NODE_SPACING);
      const y = layout.MARGIN;
      
      nodes.push({
        id: `node_${nodeId++}`,
        x,
        y,
        member,
        level: 0,
        generation: 'grandparent',
        width: layout.NODE_WIDTH,
        height: layout.NODE_HEIGHT
      });
    });

    // 2025-01-29: FIXED - Position parents (middle level) with proper centering
    const parentStartX = centerX - (parentWidth / 2) + (layout.NODE_WIDTH / 2);
    
    organizedMembers.parents.forEach((member, index) => {
      const x = parentStartX + (index * layout.NODE_SPACING);
      const y = layout.MARGIN + layout.LEVEL_SPACING;
      
      nodes.push({
        id: `node_${nodeId++}`,
        x,
        y,
        member,
        level: 1,
        generation: 'parent',
        width: layout.NODE_WIDTH,
        height: layout.NODE_HEIGHT
      });
    });

    // 2025-01-29: FIXED - Position children (bottom level) with proper grid layout and centering
    organizedMembers.children.forEach((member, index) => {
      const row = Math.floor(index / maxChildrenPerRow);
      const col = index % maxChildrenPerRow;
      
      // Calculate actual width of this specific row
      const actualRowWidth = Math.min(organizedMembers.children.length - (row * maxChildrenPerRow), maxChildrenPerRow) * layout.NODE_SPACING;
      const rowStartX = centerX - (actualRowWidth / 2) + (layout.NODE_WIDTH / 2);
      
      const x = rowStartX + (col * layout.NODE_SPACING);
      // 2025-01-29: ENHANCED - Increased row spacing to accommodate taller nodes
      const y = layout.MARGIN + (2 * layout.LEVEL_SPACING) + (row * (layout.NODE_HEIGHT + 30));
      
      nodes.push({
        id: `node_${nodeId++}`,
        x,
        y,
        member,
        level: 2,
        generation: 'child',
        width: layout.NODE_WIDTH,
        height: layout.NODE_HEIGHT
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
  }, [organizedMembers, relationships, getLayoutConstants, containerSize]);

  // 2025-01-29: ENHANCED - Dynamic SVG dimensions that adapt to content and container
  const svgDimensions = useMemo(() => {
    if (treeLayout.nodes.length === 0) {
      return { width: containerSize.width, height: containerSize.height };
    }

    const minX = Math.min(...treeLayout.nodes.map(n => n.x));
    const maxX = Math.max(...treeLayout.nodes.map(n => n.x + n.width));
    const minY = Math.min(...treeLayout.nodes.map(n => n.y));
    const maxY = Math.max(...treeLayout.nodes.map(n => n.y + n.height));
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // 2025-01-29: FIXED - Ensure SVG is wide enough to contain all content with proper margins
    const requiredWidth = Math.max(containerSize.width, contentWidth + 200); // Add 200px margin
    const requiredHeight = Math.max(containerSize.height, contentHeight + 200); // Add 200px margin
    
    // Ensure minimum dimensions for usability
    const width = Math.max(requiredWidth, 1200);
    const height = Math.max(requiredHeight, 800);
    
    return { width, height };
  }, [treeLayout, containerSize]);

  // 2025-01-29: ENHANCED - Auto-apply fit on first load for large families
  useEffect(() => {
    if (familyMembers.length > 0 && !autoFitApplied) {
      // Small delay to ensure container is properly sized and tree layout is calculated
      const timer = setTimeout(() => {
        if (treeLayout.nodes.length > 0) {
          console.log('🔍 Auto-applying fit for family with', familyMembers.length, 'members');
          applyAutoFit(treeLayout.nodes);
        }
      }, 200); // Increased delay to ensure proper rendering
      return () => clearTimeout(timer);
    }
  }, [familyMembers.length, autoFitApplied, applyAutoFit, treeLayout.nodes]);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => Math.max(0.3, Math.min(3, prev + delta * 0.1)));
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

  // 2025-01-29: ENHANCED - Reset view function
  const resetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setAutoFitApplied(false);
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
            resetView();
            break;
          case 'f':
            e.preventDefault();
            if (treeLayout.nodes.length > 0) {
              applyAutoFit(treeLayout.nodes);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleZoom, resetView, applyAutoFit]);

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

  // Format age from DOB - 2025-01-28: Updated to use backend-calculated age for reliability
  const formatAge = useCallback((member: any): string => {
    // 2025-01-28: Use backend-calculated age if available (more reliable)
    if (member.entry.age !== undefined && member.entry.age !== null) {
      return member.entry.age.toString();
    }
    
    // Fallback to DOB calculation only if age is not available
    if (!member.entry.DOB) return '';
    try {
      const birthDate = new Date(member.entry.DOB);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return (age - 1).toString();
      }
      return age.toString();
    } catch {
      return '';
    }
  }, []);

  // Format name with age
  const formatNameWithAge = useCallback((name: string, entry: any): string => {
    const age = formatAge({ entry });
    return age ? `${name} (${age})` : name;
  }, [formatAge]);

  // Format contact information
  const formatContact = useCallback((contact: string): string => {
    if (!contact) return 'No contact';
    if (contact.length <= 12) return contact;
    return contact.substring(0, 12) + '...';
  }, []);

  // 2025-01-29: ENHANCED - Render with improved container fitting
  if (familyMembers.length === 0) {
    return (
      <div className="simple-family-tree-container" ref={containerRef}>
        <div className="simple-family-tree-empty">
          <p>No family members found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="simple-family-tree-container" ref={containerRef}>
      {/* Controls */}
      <div className="simple-family-tree-controls">
        <div className="control-group">
          <button
            className="control-button"
            onClick={() => handleZoom(-1)}
            title="Zoom Out"
          >
            ➖
          </button>
          <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
          <button
            className="control-button"
            onClick={() => handleZoom(1)}
            title="Zoom In"
          >
            ➕
          </button>
        </div>
        
        <div className="control-group">
          <button
            className="control-button"
            onClick={resetView}
            title="Reset View"
          >
            🔄
          </button>
          <button
            className="control-button fit-button"
            onClick={() => applyAutoFit(treeLayout.nodes)}
            title="Fit to View (Ctrl/Cmd + F)"
          >
            ⤢
          </button>
        </div>
        
        <div className="generation-badges">
          <span className="generation-badge grandparent">Grandparents: {organizedMembers.grandparents.length}</span>
          <span className="generation-badge parent">Parents: {organizedMembers.parents.length}</span>
          <span className="generation-badge child">Children: {organizedMembers.children.length}</span>
        </div>
      </div>

      {/* SVG Container - 2025-01-29: ENHANCED with proper overflow handling */}
      <div className="svg-container" style={{ overflow: 'auto', width: '100%', height: '100%' }}>
        <svg
          ref={svgRef}
          width={svgDimensions.width}
          height={svgDimensions.height}
          viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
          className="transform-gpu transition-transform duration-200"
          style={{ 
            '--pan-x': `${panOffset.x}px`,
            '--pan-y': `${panOffset.y}px`,
            '--zoom-level': zoomLevel,
            transform: `translate(var(--pan-x, 0px), var(--pan-y, 0px)) scale(var(--zoom-level, 1))`,
            transformOrigin: '0 0'
          } as React.CSSProperties}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
          onWheel={handleWheel}
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
            
            {/* 2025-01-29: ADDED - Masks for each node to ensure complete content clipping */}
            {treeLayout.nodes.map((node, index) => (
              <mask key={`mask_${node.id}_${index}`} id={`mask_${node.id}_${index}`}>
                <rect x="0" y="0" width="100%" height="100%" fill="white"/>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx="8"
                  ry="8"
                  fill="black"
                />
              </mask>
            ))}
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
                mask={`url(#mask_${node.id}_${index})`}
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
                {/* 2025-01-29: FIXED - Use SVG text with proper clipping and truncation */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 25}
                  textAnchor="middle"
                  className="node-name"
                  fontSize="12"
                  fontWeight="600"
                  fill="#1f2937"
                  style={{
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  <title>{formatNameWithAge(node.member.entry.name, node.member.entry)}</title>
                  {/* Truncate text if it's too long */}
                  {formatNameWithAge(node.member.entry.name, node.member.entry).length > 15 
                    ? formatNameWithAge(node.member.entry.name, node.member.entry).substring(0, 15) + '...'
                    : formatNameWithAge(node.member.entry.name, node.member.entry)
                  }
                </text>
                
                {/* Role label */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 40}
                  textAnchor="middle"
                  className="node-role"
                  fontSize="10"
                  fill="#6b7280"
                >
                  <title>{node.member.role}</title>
                  {node.member.role}
                </text>
                
                {/* Contact info - truncated */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 55}
                  textAnchor="middle"
                  className="node-contact"
                  fontSize="9"
                  fill="#9ca3af"
                >
                  <title>{node.member.entry.contact ? formatContact(node.member.entry.contact) : 'No contact'}</title>
                  {(() => {
                    const contact = node.member.entry.contact ? formatContact(node.member.entry.contact) : 'No contact';
                    return contact.length > 12 ? contact.substring(0, 12) + '...' : contact;
                  })()}
                </text>
                
                {/* Address - truncated */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 68}
                  textAnchor="middle"
                  className="node-address"
                  fontSize="8"
                  fill="#9ca3af"
                >
                  <title>{node.member.entry.address || 'No address'}</title>
                  {(() => {
                    const address = node.member.entry.address || 'No address';
                    return address.length > 14 ? address.substring(0, 14) + '...' : address;
                  })()}
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
          Ctrl/Cmd + 0 to reset view • Ctrl/Cmd + F to fit to view
        </p>
      </div>
    </div>
  );
};

export default SimpleFamilyTree;
