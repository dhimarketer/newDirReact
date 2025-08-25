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
      
      // 2025-01-28: ENHANCED: Better relationship detection - check if we have actual relationship data
      // 2025-01-28: FIXED: Wait for relationships to be loaded before deciding layout strategy
      const hasRelationships = relationships.length > 0 && relationships.some(rel => rel.id && rel.is_active);
      
      console.log('Relationship detection:', {
        relationshipsLength: relationships.length,
        hasValidRelationships: hasRelationships,
        relationshipDetails: relationships.map(r => ({ id: r.id, type: r.relationship_type, active: r.is_active }))
      });
      
      if (hasRelationships) {
        console.log('Using relationship-based layout for multi-generational display');
        calculateLayoutFromRelationships();
      } else {
        console.log('Falling back to role-based layout (2 generations only)');
        calculateLayoutFromRoles();
      }
    } finally {
      isCalculating.current = false;
    }
  }, [familyMembers, relationships]); // 2025-01-28: Include dependencies to get latest data

  // 2025-01-28: OPTIMIZED: Calculate layout based on actual family relationships with intelligent hierarchy
  const calculateLayoutFromRelationships = () => {
    const nodeWidth = 140;
    const nodeHeight = 60;
    const horizontalSpacing = nodeWidth + 40;
    const verticalSpacing = nodeHeight + 60;
    
    // 2025-01-28: Build comprehensive relationship tracking for optimal family tree
    const childrenByParent = new Map<number, number[]>(); // Track children for each parent
    const parentsByChild = new Map<number, number[]>(); // Track parents for each child
    const siblingsByPerson = new Map<number, number[]>(); // Track siblings
    const spouseByPerson = new Map<number, number[]>(); // Track spouses
    
    // 2025-01-28: Process all relationships to build comprehensive family graph
    console.log('Processing relationships for layout:', relationships);
    
    relationships.forEach(rel => {
      if (rel.is_active) {
        console.log('Processing active relationship:', {
          id: rel.id,
          person1: rel.person1,
          person2: rel.person2,
          type: rel.relationship_type,
          active: rel.is_active
        });
        
        switch (rel.relationship_type) {
          case 'parent':
            // person1 is parent of person2
            console.log(`Setting ${rel.person1} as parent of ${rel.person2}`);
            if (!childrenByParent.has(rel.person1)) {
              childrenByParent.set(rel.person1, []);
            }
            childrenByParent.get(rel.person1)!.push(rel.person2);
            
            if (!parentsByChild.has(rel.person2)) {
              parentsByChild.set(rel.person2, []);
            }
            parentsByChild.get(rel.person2)!.push(rel.person1);
            break;
            
          case 'sibling':
            // Both are siblings
            if (!siblingsByPerson.has(rel.person1)) {
              siblingsByPerson.set(rel.person1, []);
            }
            siblingsByPerson.get(rel.person1)!.push(rel.person2);
            
            if (!siblingsByPerson.has(rel.person2)) {
              siblingsByPerson.set(rel.person2, []);
            }
            siblingsByPerson.get(rel.person2)!.push(rel.person1);
            break;
            
          case 'spouse':
            // Both are spouses
            if (!spouseByPerson.has(rel.person1)) {
              spouseByPerson.set(rel.person1, []);
            }
            spouseByPerson.get(rel.person1)!.push(rel.person2);
            
            if (!spouseByPerson.has(rel.person2)) {
              spouseByPerson.set(rel.person2, []);
            }
            spouseByPerson.get(rel.person2)!.push(rel.person1);
            break;
        }
      }
    });
    
    // 2025-01-28: ENHANCED: Calculate hierarchy levels for all nodes, including family members without relationships
    const calculateNodeLevels = () => {
      const visited = new Set<number>();
      const queue: { pid: number; level: number }[] = [];
      const localNodeLevels = new Map<number, number>(); // Local variable for node levels
      
      // 2025-01-28: CRITICAL: Include ALL family members, not just those in relationships
      // 2025-01-28: This ensures 1st generation members are preserved when 2nd generation relationships are created
      const allPeople = new Set<number>();
      
      // 2025-01-28: Add all family members first - this is the complete family (1st + 2nd generation)
      familyMembers.forEach(member => {
        allPeople.add(member.entry.pid);
        console.log(`Adding family member to allPeople: ${member.entry.name} (PID: ${member.entry.pid})`);
      });
      
      // 2025-01-28: Also add people from relationships (in case there are additional people not in familyMembers)
      relationships.forEach(rel => {
        allPeople.add(rel.person1);
        allPeople.add(rel.person2);
        console.log(`Adding relationship people to allPeople: ${rel.person1} and ${rel.person2}`);
      });
      
      console.log('Complete allPeople set:', {
        totalFamilyMembers: familyMembers.length,
        totalRelationships: relationships.length,
        allPeopleCount: allPeople.size,
        allPeoplePids: Array.from(allPeople)
      });
      
      const hasParents = new Set<number>();
      relationships.forEach(rel => {
        if (rel.relationship_type === 'parent' && rel.is_active) {
          hasParents.add(rel.person2); // person2 is the child
        }
      });
      
      // 2025-01-28: Find root nodes (people with no parents)
      const rootNodes = Array.from(allPeople).filter(pid => !hasParents.has(pid));
      
      console.log('Hierarchy calculation:', {
        allPeople: Array.from(allPeople),
        hasParents: Array.from(hasParents),
        rootNodes: rootNodes,
        totalPeople: allPeople.size
      });
      
      // 2025-01-28: Start BFS from root nodes
      rootNodes.forEach(pid => {
        queue.push({ pid, level: 0 });
        localNodeLevels.set(pid, 0);
        visited.add(pid);
      });
      
      // 2025-01-28: Process queue to assign levels
      while (queue.length > 0) {
        const { pid, level } = queue.shift()!;
        
        // 2025-01-28: Find all children of this person
        const children = childrenByParent.get(pid) || [];
        console.log(`Processing person ${pid} at level ${level}, has ${children.length} children:`, children);
        
        children.forEach(childPid => {
          if (!visited.has(childPid)) {
            const childLevel = level + 1;
            localNodeLevels.set(childPid, childLevel);
            visited.add(childPid);
            queue.push({ pid: childPid, level: childLevel });
            console.log(`  Set ${childPid} to level ${childLevel}`);
          }
        });
      }
      
      // 2025-01-28: Handle any disconnected nodes (assign them to level 0)
      allPeople.forEach(pid => {
        if (!visited.has(pid)) {
          localNodeLevels.set(pid, 0);
        }
      });
      
      console.log('Node levels calculation:', {
        totalFamilyMembers: familyMembers.length,
        totalPeopleInRelationships: relationships.length * 2,
        uniquePeople: allPeople.size,
        rootNodes: rootNodes.length,
        nodeLevels: Object.fromEntries(localNodeLevels)
      });
      
      return localNodeLevels; // Return the calculated levels
    };
    
    // 2025-01-28: Calculate levels and store in nodeLevels variable
    const nodeLevels = calculateNodeLevels();
    
    // 2025-01-28: Group nodes by level
    const nodesByLevel = new Map<number, number[]>();
    nodeLevels.forEach((level, pid) => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(pid);
    });
    
    // 2025-01-28: ENHANCED: Calculate required dimensions with better multi-generational support
    const maxLevel = Math.max(...Array.from(nodeLevels.values()));
    const maxNodesInLevel = Math.max(...Array.from(nodesByLevel.values()).map(nodes => nodes.length));
    
    // 2025-01-28: Account for potential missing members that will be added to level 0
    const totalFamilyMembers = familyMembers.length;
    const totalPeopleInRelationships = new Set([
      ...relationships.map(r => r.person1),
      ...relationships.map(r => r.person2)
    ]).size;
    
    // 2025-01-28: Estimate how many members might be missing from relationships
    const estimatedMissingMembers = Math.max(0, totalFamilyMembers - totalPeopleInRelationships);
    const estimatedLevel0Nodes = Math.max(
      maxNodesInLevel,
      (nodesByLevel.get(0) || []).length + estimatedMissingMembers
    );
    
    // 2025-01-28: Ensure minimum dimensions for multi-generational display
    const minWidth = Math.max(estimatedLevel0Nodes * horizontalSpacing - 40, 600);
    const minHeight = Math.max(200 + (maxLevel * verticalSpacing), 400); // Minimum height for multi-gen
    
    const requiredWidth = minWidth;
    const requiredHeight = minHeight;
    
    const svgWidth = requiredWidth + 80;
    const svgHeight = requiredHeight + 80;
    
    console.log('Enhanced dimension calculation:', {
      maxLevel,
      maxNodesInLevel,
      totalFamilyMembers,
      totalPeopleInRelationships,
      estimatedMissingMembers,
      estimatedLevel0Nodes,
      requiredWidth,
      requiredHeight,
      svgWidth,
      svgHeight
    });
    
    console.log('Multi-generational layout dimensions:', {
      maxLevel,
      maxNodesInLevel,
      requiredWidth,
      requiredHeight,
      svgWidth,
      svgHeight,
      totalGenerations: maxLevel + 1
    });
    
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
          
          console.log(`Positioned node for ${member.entry.name} at level ${level}, position (${nodeX}, ${levelY})`);
        } else {
          console.warn(`WARNING: Could not find family member for PID ${pid} at level ${level}`);
        }
      });
    }
    
    // 2025-01-28: CRITICAL: Verify that all family members are included in positioning
    const positionedPids = new Set(newNodes.map(n => n.member.entry.pid));
    const missingFromPositioning = familyMembers.filter(m => !positionedPids.has(m.entry.pid));
    
    if (missingFromPositioning.length > 0) {
      console.error('CRITICAL ERROR: Some family members were not positioned during level-based positioning:', missingFromPositioning.map(m => m.entry.name));
      console.error('This should not happen - all family members should be positioned by level or added as missing members');
    }
    
    // 2025-01-28: ENHANCED: Ensure ALL family members are included, even if they don't have relationships
    // 2025-01-28: CRITICAL FIX: This was causing only 2nd generation to show - now shows complete family
    const includedPids = new Set(newNodes.map(n => n.member.entry.pid));
    const missingMembers = familyMembers.filter(m => !includedPids.has(m.entry.pid));
    
    if (missingMembers.length > 0) {
      console.log('CRITICAL: Adding missing family members that were not included in relationships:', missingMembers.map(m => m.entry.name));
      console.log('This ensures the complete family (1st + 2nd generation) is displayed');
      
      // 2025-01-28: Add missing members to level 0 (or appropriate level)
      const missingLevel = 0; // Default to top level for members without relationships
      const missingLevelY = 40 + (missingLevel * verticalSpacing);
      
      missingMembers.forEach((member, index) => {
        // 2025-01-28: Position missing members to the right of existing level 0 nodes
        const existingLevel0Nodes = newNodes.filter(n => n.y === missingLevelY);
        const startX = existingLevel0Nodes.length > 0 
          ? Math.max(...existingLevel0Nodes.map(n => n.x + n.width)) + 20
          : 40;
        
        newNodes.push({
          id: `node-${member.entry.pid}`,
          x: startX + (index * horizontalSpacing),
          y: missingLevelY,
          member,
          width: nodeWidth,
          height: nodeHeight
        });
      });
    }
    
    // 2025-01-28: DEBUG: Log final node composition to verify all members are included
    console.log('Final node composition:', {
      totalNodes: newNodes.length,
      totalFamilyMembers: familyMembers.length,
      nodesByLevel: new Map(newNodes.map(n => [n.member.entry.pid, n.y])),
      allMemberNames: newNodes.map(n => n.member.entry.name),
      missingCount: missingMembers.length
    });
    
    // 2025-01-28: CRITICAL: Final verification - ensure ALL family members are included
    const finalIncludedPids = new Set(newNodes.map(n => n.member.entry.pid));
    const finalMissingMembers = familyMembers.filter(m => !finalIncludedPids.has(m.entry.pid));
    
    if (finalMissingMembers.length > 0) {
      console.error('CRITICAL ERROR: Final verification failed - some family members are still missing:', finalMissingMembers.map(m => m.entry.name));
      console.error('This should never happen - all family members must be included in the visualization');
      
      // 2025-01-28: Emergency fallback - add any missing members to level 0
      const emergencyLevelY = 40;
      const rightmostX = newNodes.length > 0 ? Math.max(...newNodes.map(n => n.x + n.width)) + 20 : 40;
      
      finalMissingMembers.forEach((member, index) => {
        console.log(`Emergency adding missing member: ${member.entry.name}`);
        newNodes.push({
          id: `emergency-${member.entry.pid}`,
          x: rightmostX + (index * horizontalSpacing),
          y: emergencyLevelY,
          member,
          width: nodeWidth,
          height: nodeHeight
        });
      });
    } else {
      console.log('✅ SUCCESS: All family members are included in the visualization');
    }
    
    // 2025-01-28: ENHANCED: Create connection lines from ALL relationships to preserve complete family structure
    relationships.forEach(rel => {
      if (!rel.is_active) return; // Skip inactive relationships
      
      const fromNode = newNodes.find(n => n.member.entry.pid === rel.person1);
      const toNode = newNodes.find(n => n.member.entry.pid === rel.person2);
      
      if (fromNode && toNode) {
        // 2025-01-28: Create connection for all active relationship types
        let connectionId: string;
        let connectionLabel: string;
        
        switch (rel.relationship_type) {
          case 'parent':
            connectionId = `conn-parent-${rel.id}`;
            connectionLabel = 'Parent';
            break;
          case 'child':
            connectionId = `conn-child-${rel.id}`;
            connectionLabel = 'Child';
            break;
          case 'spouse':
            connectionId = `conn-spouse-${rel.id}`;
            connectionLabel = 'Spouse';
            break;
          case 'sibling':
            connectionId = `conn-sibling-${rel.id}`;
            connectionLabel = 'Sibling';
            break;
          case 'grandparent':
            connectionId = `conn-grandparent-${rel.id}`;
            connectionLabel = 'Grandparent';
            break;
          case 'grandchild':
            connectionId = `conn-grandchild-${rel.id}`;
            connectionLabel = 'Grandchild';
            break;
          case 'aunt_uncle':
            connectionId = `conn-aunt-uncle-${rel.id}`;
            connectionLabel = 'Aunt/Uncle';
            break;
          case 'niece_nephew':
            connectionId = `conn-niece-nephew-${rel.id}`;
            connectionLabel = 'Niece/Nephew';
            break;
          case 'cousin':
            connectionId = `conn-cousin-${rel.id}`;
            connectionLabel = 'Cousin';
            break;
          default:
            connectionId = `conn-other-${rel.id}`;
            connectionLabel = 'Other';
        }
        
        newConnections.push({
          id: connectionId,
          fromNode: fromNode.id,
          toNode: toNode.id,
          relationshipType: rel.relationship_type,
          fromX: fromNode.x + fromNode.width / 2,
          fromY: fromNode.y + fromNode.height / 2,
          toX: toNode.x + toNode.width / 2,
          toY: toNode.y + toNode.height / 2
        });
        
        console.log(`Created connection: ${fromNode.member.entry.name} -> ${toNode.member.entry.name} (${rel.relationship_type})`);
      } else {
        console.warn(`Could not find nodes for relationship ${rel.id}: person1=${rel.person1}, person2=${rel.person2}`);
      }
    });
    
    console.log('Connection creation summary:', {
      totalRelationships: relationships.length,
      activeRelationships: relationships.filter(r => r.is_active).length,
      connectionsCreated: newConnections.length,
      connectionTypes: newConnections.map(c => c.relationshipType)
    });
    
    setNodes(newNodes);
    setConnections(newConnections);
    
    console.log('Enhanced hierarchical layout calculated:', {
      levels: maxLevel + 1,
      nodesByLevel: Object.fromEntries(nodesByLevel),
      nodeLevels: Object.fromEntries(nodeLevels),
      totalNodes: newNodes.length,
      totalConnections: newConnections.length,
      allFamilyMembers: familyMembers.map(m => ({ pid: m.entry.pid, name: m.entry.name })),
      allNodes: newNodes.map(n => ({ pid: n.member.entry.pid, name: n.member.entry.name, x: n.x, y: n.y })),
      missingMembers: familyMembers.filter(m => !newNodes.some(n => n.member.entry.pid === m.entry.pid)).map(m => m.entry.name)
    });
  };

  // 2025-01-28: Calculate layout based on inferred roles (fallback)
  // 2025-01-28: ENHANCED: Better handling of multi-generational families
  const calculateLayoutFromRoles = () => {
    const parents = familyMembers.filter(m => m.role === 'parent');
    const children = familyMembers.filter(m => m.role === 'child');
    
    console.log('Role-based layout calculation:', {
      totalMembers: familyMembers.length,
      parents: parents.map(p => p.entry.name),
      children: children.map(c => c.entry.name),
      note: 'This is fallback layout - relationships should be used for multi-generational display'
    });
    
    const nodeWidth = 140;
    const nodeHeight = 60;
    const horizontalSpacing = nodeWidth + 40;
    const verticalSpacing = nodeHeight + 60;
    
    // 2025-01-28: ENHANCED: Calculate dimensions to accommodate all family members
    const maxMembersInRow = Math.max(parents.length, children.length, familyMembers.length);
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
    
    // 2025-01-28: CRITICAL: Ensure ALL family members are included, even if they don't fit the parent/child role model
    const includedPids = new Set(newNodes.map(n => n.member.entry.pid));
    const otherMembers = familyMembers.filter(m => !includedPids.has(m.entry.pid));
    
    if (otherMembers.length > 0) {
      console.log('Adding other family members that don\'t fit parent/child roles:', otherMembers.map(m => m.entry.name));
      
      // 2025-01-28: Position other members at the top level (level 0)
      const otherLevelY = 40;
      const existingTopLevelNodes = newNodes.filter(n => n.y === otherLevelY);
      const startX = existingTopLevelNodes.length > 0 
        ? Math.max(...existingTopLevelNodes.map(n => n.x + n.width)) + 20
        : 40;
      
      otherMembers.forEach((member, index) => {
        newNodes.push({
          id: `other-${member.entry.pid}`,
          x: startX + (index * horizontalSpacing),
          y: otherLevelY,
          member,
          width: nodeWidth,
          height: nodeHeight
        });
      });
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
    
    // 2025-01-28: DEBUG: Log final node composition for role-based layout
    console.log('Role-based layout final composition:', {
      totalNodes: newNodes.length,
      totalFamilyMembers: familyMembers.length,
      allMemberNames: newNodes.map(n => n.member.entry.name),
      otherMembersCount: otherMembers.length
    });
    
    setNodes(newNodes);
    setConnections(newConnections);
  };

  // 2025-01-28: ENHANCED: Function to check if new relationships create additional generation levels
  const checkForNewGeneration = (currentRelationships: FamilyRelationship[]): boolean => {
    if (currentRelationships.length === 0) return false;
    
    // 2025-01-28: Build relationship graph to detect generation levels
    const childrenByParent = new Map<number, number[]>();
    const hasParents = new Set<number>();
    
    // 2025-01-28: Process all relationships to build parent-child graph
    currentRelationships.forEach(rel => {
      if (rel.relationship_type === 'parent' && rel.is_active) {
        // person1 is parent of person2
        if (!childrenByParent.has(rel.person1)) {
          childrenByParent.set(rel.person1, []);
        }
        childrenByParent.get(rel.person1)!.push(rel.person2);
        hasParents.add(rel.person2);
      }
    });
    
    // 2025-01-28: Find root nodes (people with no parents)
    const allPeople = new Set<number>();
    currentRelationships.forEach(rel => {
      allPeople.add(rel.person1);
      allPeople.add(rel.person2);
    });
    
    const rootNodes = Array.from(allPeople).filter(pid => !hasParents.has(pid));
    
    // 2025-01-28: Calculate maximum generation depth using BFS
    const calculateMaxDepth = (startPid: number): number => {
      const visited = new Set<number>();
      const queue: { pid: number; depth: number }[] = [];
      
      queue.push({ pid: startPid, depth: 0 });
      visited.add(startPid);
      
      let maxDepth = 0;
      
      while (queue.length > 0) {
        const { pid, depth } = queue.shift()!;
        maxDepth = Math.max(maxDepth, depth);
        
        const children = childrenByParent.get(pid) || [];
        children.forEach(childPid => {
          if (!visited.has(childPid)) {
            visited.add(childPid);
            queue.push({ pid: childPid, depth: depth + 1 });
          }
        });
      }
      
      return maxDepth;
    };
    
    // 2025-01-28: Check if any root node leads to more than 2 generations
    const maxGenerations = Math.max(...rootNodes.map(pid => calculateMaxDepth(pid)));
    const hasMultipleGenerations = maxGenerations >= 2; // 2 means 3 generations (0, 1, 2)
    
    console.log('Generation analysis:', {
      totalRelationships: currentRelationships.length,
      rootNodes: rootNodes.length,
      maxGenerations: maxGenerations + 1, // +1 because depth 0 = 1 generation
      hasMultipleGenerations
    });
    
    return hasMultipleGenerations;
  };

  // 2025-01-28: ENHANCED: Function to calculate and display generation count
  const calculateGenerationCount = (): number => {
    if (relationships.length === 0) return 0;
    
    // 2025-01-28: Use the same logic as checkForNewGeneration but return count
    const childrenByParent = new Map<number, number[]>();
    const hasParents = new Set<number>();
    
    relationships.forEach(rel => {
      if (rel.relationship_type === 'parent' && rel.is_active) {
        if (!childrenByParent.has(rel.person1)) {
          childrenByParent.set(rel.person1, []);
        }
        childrenByParent.get(rel.person1)!.push(rel.person2);
        hasParents.add(rel.person2);
      }
    });
    
    const allPeople = new Set<number>();
    relationships.forEach(rel => {
      allPeople.add(rel.person1);
      allPeople.add(rel.person2);
    });
    
    const rootNodes = Array.from(allPeople).filter(pid => !hasParents.has(pid));
    
    const calculateMaxDepth = (startPid: number): number => {
      const visited = new Set<number>();
      const queue: { pid: number; depth: number }[] = [];
      
      queue.push({ pid: startPid, depth: 0 });
      visited.add(startPid);
      
      let maxDepth = 0;
      
      while (queue.length > 0) {
        const { pid, depth } = queue.shift()!;
        maxDepth = Math.max(maxDepth, depth);
        
        const children = childrenByParent.get(pid) || [];
        children.forEach(childPid => {
          if (!visited.has(childPid)) {
            visited.add(childPid);
            queue.push({ pid: childPid, depth: depth + 1 });
          }
        });
      }
      
      return maxDepth;
    };
    
    const maxGenerations = rootNodes.length > 0 ? Math.max(...rootNodes.map(pid => calculateMaxDepth(pid))) : 0;
    return maxGenerations + 1; // +1 because depth 0 = 1 generation
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
        
        // 2025-01-28: ENHANCED: Check if this relationship creates a new generation level
        const newGenerationCreated = checkForNewGeneration(updatedRelationships);
        if (newGenerationCreated) {
          console.log('New generation level detected! Family tree will expand to show all generations.');
        }
        
        onRelationshipChange(updatedRelationships);
        
        // 2025-01-28: Reset editing state
        setSelectedNode(null);
        setPendingRelationship(null);
        setShowRelationshipSelector(false);
        
        // 2025-01-28: Show success message with generation info
        const generationMessage = newGenerationCreated 
          ? `Relationship created: "${fromName}" is now ${relationshipLabel} of "${toName}". The family tree has expanded to show multiple generations!`
          : `Relationship created: "${fromName}" is now ${relationshipLabel} of "${toName}"`;
        alert(generationMessage);
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

  // 2025-01-28: ENHANCED: Render connection lines with different styles for different relationship types
  const renderConnections = () => {
    return connections.map(conn => {
      // 2025-01-28: Define different line styles for different relationship types
      let lineStyle: {
        stroke: string;
        strokeWidth: number;
        strokeDasharray?: string;
        markerEnd?: string;
      };
      
      switch (conn.relationshipType) {
        case 'parent':
          lineStyle = {
            stroke: '#3b82f6', // Blue for parent-child
            strokeWidth: 3,
            markerEnd: 'url(#arrowhead)'
          };
          break;
        case 'child':
          lineStyle = {
            stroke: '#3b82f6', // Blue for parent-child
            strokeWidth: 3,
            markerEnd: 'url(#arrowhead)'
          };
          break;
        case 'spouse':
          lineStyle = {
            stroke: '#ec4899', // Pink for spouse
            strokeWidth: 2,
            strokeDasharray: '5,5' // Dashed line for spouse
          };
          break;
        case 'sibling':
          lineStyle = {
            stroke: '#10b981', // Green for siblings
            strokeWidth: 2,
            strokeDasharray: '3,3' // Dotted line for siblings
          };
          break;
        case 'grandparent':
          lineStyle = {
            stroke: '#8b5cf6', // Purple for grandparents
            strokeWidth: 2,
            markerEnd: 'url(#arrowhead)'
          };
          break;
        case 'grandchild':
          lineStyle = {
            stroke: '#8b5cf6', // Purple for grandparents
            strokeWidth: 2,
            markerEnd: 'url(#arrowhead)'
          };
          break;
        case 'aunt_uncle':
          lineStyle = {
            stroke: '#f59e0b', // Orange for aunt/uncle
            strokeWidth: 2,
            strokeDasharray: '4,4'
          };
          break;
        case 'niece_nephew':
          lineStyle = {
            stroke: '#f59e0b', // Orange for niece/nephew
            strokeWidth: 2,
            strokeDasharray: '4,4'
          };
          break;
        case 'cousin':
          lineStyle = {
            stroke: '#06b6d4', // Cyan for cousins
            strokeWidth: 1,
            strokeDasharray: '2,2'
          };
          break;
        default:
          lineStyle = {
            stroke: '#6b7280', // Gray for other relationships
            strokeWidth: 1,
            strokeDasharray: '1,1'
          };
      }
      
      return (
        <g key={conn.id}>
          {/* 2025-01-28: Connection line with relationship-specific styling */}
          <line
            x1={conn.fromX}
            y1={conn.fromY}
            x2={conn.toX}
            y2={conn.toY}
            {...lineStyle}
          />
          
          {/* 2025-01-28: Relationship type label */}
          <text
            x={(conn.fromX + conn.toX) / 2}
            y={(conn.fromY + conn.toY) / 2 - 5}
            textAnchor="middle"
            fontSize="9"
            fill={lineStyle.stroke}
            fontWeight="500"
          >
            {conn.relationshipType.replace('_', ' ')}
          </text>
        </g>
      );
    });
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
        
        {/* 2025-01-28: ENHANCED: Generation indicator for multi-generational families */}
        {relationships.length > 0 && (
          <span className="text-sm text-purple-600 ml-2 font-medium">
            🌳 {calculateGenerationCount()} Generations
          </span>
        )}
        
        {/* 2025-01-28: ENHANCED: Relationship legend for different line styles */}
        {relationships.length > 0 && (
          <div className="flex items-center gap-2 ml-2 text-xs">
            <span className="text-gray-600">Lines:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-blue-500">Parent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500 border-dotted border-t border-green-500"></div>
              <span className="text-green-500">Sibling</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-purple-500"></div>
              <span className="text-purple-500">Grand</span>
            </div>
          </div>
        )}
        
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