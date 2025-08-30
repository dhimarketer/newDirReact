// 2025-01-28: NEW - Classic family tree visualization component
// 2025-01-28: Implements traditional family tree layout with parents at top, children below
// 2025-01-28: Clean hierarchical structure matching family1.png reference

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

interface DraggablePosition {
  x: number;
  y: number;
}

interface ClassicFamilyTreeProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
  useMultiRowLayout?: boolean; // 2025-01-29: NEW - Toggle between classic and multi-row layouts
  svgRef?: React.RefObject<SVGSVGElement>; // 2025-01-29: NEW - Reference to SVG element for download functionality
}

const ClassicFamilyTree: React.FC<ClassicFamilyTreeProps> = ({ 
  familyMembers, 
  relationships = [],
  useMultiRowLayout = false,
  svgRef
}) => {

  // 2025-01-29: NEW - Drag and drop functionality for interactive family tree
  const [draggedMember, setDraggedMember] = useState<number | null>(null);
  const [memberPositions, setMemberPositions] = useState<Map<number, DraggablePosition>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 2025-01-29: NEW - Random positioning for bottom layer members
  const getRandomOffset = useCallback(() => {
    return (Math.random() - 0.5) * 60; // Random offset between -30px and +30px
  }, []);

  // 2025-01-29: NEW - Text truncation utility for long names
  const truncateText = useCallback((text: string, maxWidth: number, fontSize: number = 12) => {
    if (!text) return '';
    
    // Estimate character width (approximate for monospace-like fonts)
    const avgCharWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / avgCharWidth);
    
    if (text.length <= maxChars) return text;
    
    // Truncate and add ellipsis
    return text.substring(0, maxChars - 3) + '...';
  }, []);

  // 2025-01-29: NEW - Create unique mask ID for each family member
  const createMaskId = useCallback((memberId: number) => `mask-${memberId}`, []);

  // 2025-01-29: NEW - Text wrapping utility for long names
  const wrapText = useCallback((text: string, maxWidth: number, fontSize: number = 12) => {
    if (!text) return '';
    
    // Estimate character width (approximate for monospace-like fonts)
    const avgCharWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / avgCharWidth);
    
    if (text.length <= maxChars) return text;
    
    // Word-based wrapping - ONLY break at spaces, never within words
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      // Check if adding this word would exceed the line limit
      const testLine = currentLine ? currentLine + ' ' + word : word;
      
      if (testLine.length <= maxChars) {
        // Word fits on current line
        currentLine = testLine;
      } else {
        // Word doesn't fit - start new line
        if (currentLine) {
          lines.push(currentLine.trim());
        }
        currentLine = word;
      }
    }
    
    // Add the last line if it has content
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  }, []);

  // 2025-01-29: FIXED - Improved drag event handlers to prevent flickering
  const handleMouseDown = useCallback((e: React.MouseEvent, memberId: number) => {
    e.preventDefault();
    setDraggedMember(memberId);
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { x: 0, y: 0 };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || draggedMember === null) return;
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    
    // Update the drag offset reference to prevent flickering
    dragOffset.current = { x: deltaX, y: deltaY };
    
    // Force re-render by updating state
    setMemberPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(draggedMember, { x: deltaX, y: deltaY });
      return newPositions;
    });
  }, [isDragging, draggedMember]);

  const handleMouseUp = useCallback(() => {
    if (draggedMember !== null) {
      // Finalize the position
      setMemberPositions(prev => {
        const newPositions = new Map(prev);
        const currentPos = newPositions.get(draggedMember) || { x: 0, y: 0 };
        newPositions.set(draggedMember, currentPos);
        return newPositions;
      });
    }
    setIsDragging(false);
    setDraggedMember(null);
    dragOffset.current = { x: 0, y: 0 };
  }, [draggedMember]);

  // 2025-01-29: NEW - Multi-row layout functionality implemented directly in this component

  // Organize family members into classic structure
  const organizedMembers = useMemo(() => {
    // Filter out members without valid pid
    const validMembers = familyMembers.filter(member => 
      member.entry && member.entry.pid !== undefined && member.entry.pid !== null
    );

    if (validMembers.length === 0) {
      return { 
        parents: [], 
        children: [],
        parentChildMap: new Map(),
        childParentMap: new Map(),
        spouseMap: new Map()
      };
    }
    
    // 2025-01-29: DEBUG - Add parent detection debugging
    console.log(`🔍 ClassicFamilyTree: Processing ${validMembers.length} family members`);
    console.log(`📊 Members with age data:`, validMembers.filter(m => m.entry.age !== undefined && m.entry.age !== null).length);
    console.log(`📊 Members without age data:`, validMembers.filter(m => m.entry.age === undefined || m.entry.age === null).length);
    
    // Debug age distribution
    const membersWithAge = validMembers.filter(m => m.entry.age !== undefined && m.entry.age !== null);
    if (membersWithAge.length > 0) {
      const sortedByAge = [...membersWithAge].sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
      console.log(`📈 Age distribution:`, sortedByAge.map(m => ({ name: m.entry.name, age: m.entry.age, gender: m.entry.gender })));
    }

    // 2025-01-28: ENHANCED: Use relationships data to determine family structure instead of hardcoded logic
    if (relationships && relationships.length > 0) {
      console.log(`🔗 Processing ${relationships.length} relationships for family structure`);
      
      // Build family structure from relationships
      const parentChildMap = new Map<number, number[]>(); // parent -> children
      const childParentMap = new Map<number, number[]>(); // child -> parents
      const spouseMap = new Map<number, number[]>(); // person -> spouses
      
      // Process relationships to build family structure
      relationships.forEach(rel => {
        if (rel.is_active) {
          switch (rel.relationship_type) {
            case 'parent':
              // person1 is parent of person2
              if (!parentChildMap.has(rel.person1)) {
                parentChildMap.set(rel.person1, []);
              }
              parentChildMap.get(rel.person1)!.push(rel.person2);
              
              if (!childParentMap.has(rel.person2)) {
                childParentMap.set(rel.person2, []);
              }
              childParentMap.get(rel.person2)!.push(rel.person1);
              break;
              
            case 'spouse':
              // Both are spouses
              if (!spouseMap.has(rel.person1)) {
                spouseMap.set(rel.person1, []);
              }
              spouseMap.get(rel.person1)!.push(rel.person2);
              
              if (!spouseMap.has(rel.person2)) {
                spouseMap.set(rel.person2, []);
              }
              spouseMap.get(rel.person2)!.push(rel.person1);
              break;
          }
        }
      });
      
      console.log(`📊 Relationship maps built:`, {
        parentChildMap: parentChildMap.size,
        childParentMap: childParentMap.size,
        spouseMap: spouseMap.size
      });
      
      // Find people who are parents (have children)
      const parents = validMembers.filter(member => 
        parentChildMap.has(member.entry.pid) && parentChildMap.get(member.entry.pid)!.length > 0
      );
      
      // Find people who are children (have parents)
      const children = validMembers.filter(member => 
        childParentMap.has(member.entry.pid) && childParentMap.get(member.entry.pid)!.length > 0
      );
      
      console.log(`👥 Relationship-based classification:`, {
        parents: parents.map(p => p.entry.name),
        children: children.map(c => c.entry.name),
        parentCount: parents.length,
        childCount: children.length
      });
      
      // 2025-01-29: FIXED - Ensure all members are classified
      // If we have relationships but some members aren't classified, add them to children
      const classifiedMembers = new Set([...parents, ...children].map(m => m.entry.pid));
      const unclassifiedMembers = validMembers.filter(member => !classifiedMembers.has(member.entry.pid));
      
      if (unclassifiedMembers.length > 0) {
        console.log(`⚠️ Found ${unclassifiedMembers.length} unclassified members:`, unclassifiedMembers.map(m => m.entry.name));
        // Add unclassified members to children by default
        children.push(...unclassifiedMembers);
      }
      
      // If no clear parent-child relationships, fall back to sophisticated age-based logic
      if (parents.length === 0 && children.length === 0) {
        console.log(`⚠️ No relationships could be processed, falling back to age-based logic`);
        // 2025-01-29: ENHANCED - Use sophisticated 3-pass parent detection algorithm
        const sortedByAge = [...validMembers].sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
        
        if (sortedByAge.length > 0) {
          console.log(`🎯 Processing ${sortedByAge.length} members with age data for fallback logic`);
          console.log('Age distribution:', sortedByAge.map(m => ({ name: m.entry.name, age: m.entry.age })));
          
          const potentialParents: typeof validMembers = [];
          const children: typeof validMembers = [];
          
          // 2025-01-29: SIMPLIFIED - 2-step parent detection logic
          if (sortedByAge.length > 0) {
            // Step 1: Eldest person becomes parent if they have 10+ year gap to everyone else
            const eldest = sortedByAge[0];
            const eldestAge = eldest.entry.age || 0;
            
            // Check if eldest can be a parent to ALL other members
            let eldestCanBeParent = true;
            for (let i = 1; i < sortedByAge.length; i++) {
              const member = sortedByAge[i];
              const memberAge = member.entry.age || 0;
              const ageDifference = eldestAge - memberAge;
              
              if (ageDifference < 10) {
                eldestCanBeParent = false;
                break;
              }
            }
            
            if (eldestCanBeParent) {
              potentialParents.push(eldest);
              console.log(`✅ ${eldest.entry.name} (${eldestAge}) identified as first parent`);
              
              // DON'T add children yet - wait until both parents are identified
              console.log(`⏳ First parent identified, waiting to identify second parent before assigning children`);
            } else {
              // Eldest cannot be a parent, add to children
              children.push(eldest);
              console.log(`⚠️ ${eldest.entry.name} (${eldestAge}) cannot be parent - no children with 10+ year gap`);
              
              // Add all other members to children
              for (let i = 1; i < sortedByAge.length; i++) {
                children.push(sortedByAge[i]);
              }
            }
            
            // Step 2: Find second parent - second most eldest person of different gender with 10+ year gap to non-parents
            if (potentialParents.length === 1) {
              const firstParent = potentialParents[0];
              const firstParentGender = firstParent.entry.gender;
              
              console.log(`🔍 STEP 2: Looking for second parent (different gender than ${firstParent.entry.name} with 10+ year gap to non-parents)`);
              
              // Find the second eldest person among remaining members (excluding first parent)
              const remainingMembers = sortedByAge.filter(member => 
                !potentialParents.includes(member)
              );
              
              if (remainingMembers.length > 0) {
                // Sort remaining members by age to find second eldest
                const sortedRemaining = remainingMembers.sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
                
                console.log(`  🔍 Remaining members sorted by age:`, sortedRemaining.map(m => `${m.entry.name} (${m.entry.age}, ${m.entry.gender || 'unknown'})`));
                
                let bestSecondParent = null;
                
                // Look for second parent starting from eldest remaining member
                for (const member of sortedRemaining) {
                  const memberAge = member.entry.age || 0;
                  const memberGender = member.entry.gender;
                  
                  console.log(`  🔍 Checking ${member.entry.name} (${memberAge}, ${memberGender || 'unknown'}) as potential second parent`);
                  
                  // Must be different gender than first parent
                  if (memberGender && firstParentGender && memberGender === firstParentGender) {
                    console.log(`    ❌ Same gender as first parent - skipping`);
                    continue;
                  }
                  
                  // Must have 10+ year gap to potential children (those with 10+ year gap from first parent)
                  let canBeSecondParent = true;
                  
                  // Calculate potential children based on first parent's age gap
                  const potentialChildren = sortedByAge.filter(m => {
                    if (m === eldest || m === member) return false; // Exclude both parents
                    const ageDiff = eldestAge - (m.entry.age || 0);
                    return ageDiff >= 10; // Only those with 10+ year gap from first parent
                  });
                  
                  console.log(`    🔍 Checking age gaps against ${potentialChildren.length} potential children:`, potentialChildren.map(c => `${c.entry.name} (${c.entry.age})`));
                  
                  for (const child of potentialChildren) {
                    const childAge = child.entry.age || 0;
                    const ageDifference = memberAge - childAge;
                    
                    console.log(`    📏 ${member.entry.name} (${memberAge}) vs ${child.entry.name} (${childAge}): gap = ${ageDifference} years ${ageDifference >= 10 ? '✅' : '❌'}`);
                    
                    if (ageDifference < 10) {
                      canBeSecondParent = false;
                      console.log(`      ❌ Cannot be parent to ${child.entry.name} - age gap too small (${ageDifference} < 10)`);
                      break;
                    }
                  }
                  
                  if (canBeSecondParent) {
                    bestSecondParent = member;
                    console.log(`    ✅ ${member.entry.name} (${memberAge}) can be second parent to all ${potentialChildren.length} potential children`);
                    break;
                  } else {
                    console.log(`    ❌ ${member.entry.name} (${memberAge}) cannot be second parent - failed age gap validation`);
                  }
                }
                
                if (bestSecondParent) {
                  potentialParents.push(bestSecondParent);
                  console.log(`💑 ${bestSecondParent.entry.name} added as second parent`);
                } else {
                  console.log(`❌ No suitable second parent found`);
                }
              }
            }
            
            // Step 3: Now assign children after both parents are identified
            if (potentialParents.length > 0) {
              console.log(`🔍 STEP 3: Assigning children after identifying ${potentialParents.length} parent(s)`);
              
              // Find all members that can be children (have 10+ year gap from at least one parent)
              const allChildren = sortedByAge.filter(member => {
                if (potentialParents.includes(member)) return false; // Exclude parents
                
                // Check if this member can be a child to any parent
                for (const parent of potentialParents) {
                  const parentAge = parent.entry.age || 0;
                  const memberAge = member.entry.age || 0;
                  const ageDifference = parentAge - memberAge;
                  
                  if (ageDifference >= 10) {
                    console.log(`  ✅ ${member.entry.name} (${memberAge}) can be child to ${parent.entry.name} (${parentAge}) - gap: ${ageDifference} years`);
                    return true;
                  }
                }
                
                console.log(`  ❌ ${member.entry.name} (${member.entry.age}) cannot be child to any parent`);
                return false;
              });
              
              children.push(...allChildren);
              console.log(`👶 Added ${allChildren.length} children:`, allChildren.map(c => c.entry.name));
            }
          }
          
          return { 
            parents: potentialParents.slice(0, 4),
            children: children.slice(0, 12),
            parentChildMap, 
            childParentMap, 
            spouseMap 
          };
        }
      }
      
      // 2025-01-29: FIXED - Return all members properly classified
      const result = { 
        parents: parents.length > 0 ? parents : validMembers.slice(0, 2), 
        children: children.length > 0 ? children : validMembers.slice(2),
        parentChildMap,
        childParentMap,
        spouseMap
      };
      
      console.log(`🎯 RELATIONSHIPS RESULT:`, {
        parents: result.parents.map(p => ({ name: p.entry.name, age: p.entry.age, gender: p.entry.gender })),
        children: result.children.map(c => ({ name: c.entry.name, age: c.entry.age, gender: c.entry.gender })),
        totalParents: result.parents.length,
        totalChildren: result.children.length,
        totalMembers: result.parents.length + result.children.length
      });
      
      return result;
    }
    
    // Fallback to original logic if no relationships
    // 2025-01-28: ENHANCED - Use proven age-based parent detection logic instead of simple first-two logic
    if (validMembers.length === 0) {
      return { 
        parents: [], 
        children: [],
        parentChildMap: new Map(),
        childParentMap: new Map(),
        spouseMap: new Map()
      };
    }

    // Sort members by age (eldest first) - using existing proven logic
    const sortedByAge = [...validMembers].sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
    
    console.log(`🔍 FALLBACK LOGIC: Processing ${sortedByAge.length} members with age data`);
    console.log(`📊 Sorted by age:`, sortedByAge.map(m => ({ name: m.entry.name, age: m.entry.age, gender: m.entry.gender })));
    
    // 2025-01-29: SIMPLIFIED - 2-step parent detection logic
    const potentialParents: typeof validMembers = [];
    const children: typeof validMembers = [];
    
    if (sortedByAge.length > 0) {
      const eldest = sortedByAge[0];
      const eldestAge = eldest.entry.age || 0;
      
      // Step 1: Eldest person becomes parent if they have 12+ year gap to potential children
      console.log(`🔍 STEP 1: Checking if eldest ${eldest.entry.name} (${eldestAge}) can be parent to children`);
      
      // Find potential children (members with 12+ year age gap from eldest)
      const potentialChildren: typeof validMembers = [];
      let eldestCanBeParent = false;
      
      for (let i = 1; i < sortedByAge.length; i++) {
        const member = sortedByAge[i];
        const memberAge = member.entry.age || 0;
        const ageDifference = eldestAge - memberAge;
        
        console.log(`  📏 ${eldest.entry.name} (${eldestAge}) vs ${member.entry.name} (${memberAge}): gap = ${ageDifference} years ${ageDifference >= 12 ? '✅' : '❌'}`);
        
        if (ageDifference >= 12) {
          potentialChildren.push(member);
          eldestCanBeParent = true;
        }
      }
      
      if (eldestCanBeParent) {
        console.log(`    ✅ ${eldest.entry.name} can be parent to ${potentialChildren.length} children`);
      } else {
        console.log(`    ❌ ${eldest.entry.name} cannot be parent - no children with 12+ year gap`);
      }
      
      if (eldestCanBeParent) {
        potentialParents.push(eldest);
        console.log(`✅ ${eldest.entry.name} (${eldestAge}) identified as first parent`);
        
        // DON'T add children yet - wait until both parents are identified
        console.log(`⏳ First parent identified, waiting to identify second parent before assigning children`);
      } else {
        // Eldest cannot be a parent, add to children
        children.push(eldest);
        console.log(`⚠️ ${eldest.entry.name} (${eldestAge}) cannot be parent - no children with 12+ year gap`);
        
        // Add all other members to children
        for (let i = 1; i < sortedByAge.length; i++) {
          children.push(sortedByAge[i]);
        }
      }
    }
    
    // Step 2: Find second parent - second most eldest person of different gender with 12+ year gap to non-parents
    if (potentialParents.length === 1) {
      const firstParent = potentialParents[0];
      const firstParentGender = firstParent.entry.gender;
      
      console.log(`🔍 STEP 2: Looking for second parent (different gender than ${firstParent.entry.name} with 12+ year gap to non-parents)`);
      console.log(`  📋 Current children array (${children.length} members):`, children.map(c => `${c.entry.name} (${c.entry.age})`));
      
      // Find the second eldest person among remaining members (excluding first parent)
      const remainingMembers = sortedByAge.filter(member => 
        !potentialParents.includes(member)
      );
      
      if (remainingMembers.length > 0) {
        // Sort remaining members by age to find second eldest
        const sortedRemaining = remainingMembers.sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
        
        console.log(`  🔍 Remaining members sorted by age:`, sortedRemaining.map(m => `${m.entry.name} (${m.entry.age}, ${m.entry.gender || 'unknown'})`));
        
        let bestSecondParent = null;
        
        // Look for second parent starting from eldest remaining member
        for (const member of sortedRemaining) {
          const memberAge = member.entry.age || 0;
          const memberGender = member.entry.gender;
          
          console.log(`  🔍 Checking ${member.entry.name} (${memberAge}, ${memberGender || 'unknown'}) as potential second parent`);
          
          // Must be different gender than first parent
          if (memberGender && firstParentGender && memberGender === firstParentGender) {
            console.log(`    ❌ Same gender as first parent - skipping`);
            continue;
          }
          
          // Must have 10+ year gap to potential children (those with 12+ year gap from first parent)
          let canBeSecondParent = true;
          
          // Calculate potential children based on first parent's age gap
          const potentialChildren = sortedByAge.filter(m => {
            if (m === firstParent || m === member) return false; // Exclude both parents
            const ageDiff = (firstParent.entry.age || 0) - (m.entry.age || 0);
            return ageDiff >= 12; // Only those with 12+ year gap from first parent
          });
          
          console.log(`    🔍 Checking age gaps against ${potentialChildren.length} potential children:`, potentialChildren.map(c => `${c.entry.name} (${c.entry.age})`));
          
          for (const child of potentialChildren) {
            const childAge = child.entry.age || 0;
            const ageDifference = memberAge - childAge;
            
            console.log(`    📏 ${member.entry.name} (${memberAge}) vs ${child.entry.name} (${childAge}): gap = ${ageDifference} years ${ageDifference >= 12 ? '✅' : '❌'}`);
            
            if (ageDifference < 12) {
              canBeSecondParent = false;
              console.log(`      ❌ Cannot be parent to ${child.entry.name} - age gap too small (${ageDifference} < 12)`);
              break;
            }
          }
          
          if (canBeSecondParent) {
            bestSecondParent = member;
            console.log(`    ✅ ${member.entry.name} (${memberAge}) can be second parent to all ${potentialChildren.length} potential children`);
            break;
          } else {
            console.log(`    ❌ ${member.entry.name} (${memberAge}) cannot be second parent - failed age gap validation`);
          }
        }
        
        if (bestSecondParent) {
          potentialParents.push(bestSecondParent);
          console.log(`💑 ${bestSecondParent.entry.name} added as second parent`);
        } else {
          console.log(`❌ No suitable second parent found`);
        }
      }
    }
    
    // Step 3: Now assign children after both parents are identified
    if (potentialParents.length > 0) {
      console.log(`🔍 STEP 3: Assigning children after identifying ${potentialParents.length} parent(s)`);
      
      // Find all members that can be children (have 12+ year gap from at least one parent)
      const allChildren = sortedByAge.filter(member => {
        if (potentialParents.includes(member)) return false; // Exclude parents
        
        // Check if this member can be a child to any parent
        for (const parent of potentialParents) {
          const parentAge = parent.entry.age || 0;
          const memberAge = member.entry.age || 0;
          const ageDifference = parentAge - memberAge;
          
          if (ageDifference >= 12) {
            console.log(`  ✅ ${member.entry.name} (${memberAge}) can be child to ${parent.entry.name} (${parentAge}) - gap: ${ageDifference} years`);
            return true;
          }
        }
        
        console.log(`  ❌ ${member.entry.name} (${member.entry.age}) cannot be child to any parent`);
        return false;
      });
      
      children.push(...allChildren);
      console.log(`👶 Added ${allChildren.length} children:`, allChildren.map(c => c.entry.name));
    }
    
    // If we still don't have any parents identified, all members go to children
    if (potentialParents.length === 0) {
      children.push(...sortedByAge);
    }
    
    // 2025-01-29: FIXED - Remove hardcoded limits to show ALL family members
    const result = { 
      parents: potentialParents, // No limit on parents
      children: children, // No limit on children
      parentChildMap: new Map(),
      childParentMap: new Map(),
      spouseMap: new Map()
    };
    
    console.log(`🎯 FINAL RESULT:`, {
      parents: result.parents.map(p => ({ name: p.entry.name, age: p.entry.age, gender: p.entry.gender })),
      children: result.children.map(c => ({ name: c.entry.name, age: c.entry.age, gender: c.entry.gender })),
      totalParents: result.parents.length,
      totalChildren: result.children.length,
      totalMembers: result.parents.length + result.children.length
    });
    
    return result;
  }, [familyMembers, relationships]);

  // Calculate tree dimensions
  const treeDimensions = useMemo(() => {
    const parentCount = organizedMembers.parents.length;
    const childCount = organizedMembers.children.length;
    
    const nodeWidth = 120;
    const nodeHeight = 80;
    
    // 2025-01-29: FIXED - Improved spacing and container sizing for better fit
    const fixedSpacing = 40; // Reduced spacing for better fit
    
    // Calculate total width needed for each generation with fixed spacing
    const totalParentWidth = parentCount * nodeWidth + (parentCount > 1 ? (parentCount - 1) * fixedSpacing : 0);
    const totalChildWidth = childCount * nodeWidth + (childCount > 1 ? (childCount - 1) * fixedSpacing : 0);
    
    // 2025-01-29: FIXED - Dynamic container sizing based on actual content needs
    const minContainerWidth = Math.max(totalParentWidth, totalChildWidth) + 100; // Add 100px margin
    const containerWidth = useMultiRowLayout ? Math.max(1600, minContainerWidth) : Math.max(1000, minContainerWidth);
    const margin = 50; // Increased margin for better spacing
    const availableWidth = containerWidth - (2 * margin);
    
    // 2025-01-29: ENHANCED - Dynamic height calculation based on layout needs
    const baseHeight = 200; // Reduced base height for parents and connections
    const childRowHeight = nodeHeight + 20; // Reduced spacing between rows
    
    // Calculate optimal height based on number of children and layout mode
    let optimalHeight = baseHeight;
    if (useMultiRowLayout && childCount > 8) {
      // Multi-row layout: calculate height based on number of rows needed
      const maxChildrenPerRow = Math.ceil(Math.sqrt(childCount));
      const numRows = Math.ceil(childCount / maxChildrenPerRow);
      optimalHeight = baseHeight + (numRows * childRowHeight) + 20; // Add small margin
    } else if (childCount > 0) {
      // Single-row layout: add height for children with minimal spacing
      optimalHeight = baseHeight + childRowHeight + 10; // Add small margin
    }
    
    // 2025-01-29: FIXED - Ensure height is sufficient for ALL children
    // Calculate minimum height needed for all children to be visible
    const minHeightNeeded = baseHeight + (childCount * (nodeHeight + 10)); // 10px spacing between children
    optimalHeight = Math.max(optimalHeight, minHeightNeeded);
    
    // Ensure minimum height for visual appeal
    optimalHeight = Math.max(optimalHeight, 250);
    
    console.log(`📐 Tree dimensions calculated:`, {
      parentCount,
      childCount,
      baseHeight,
      minHeightNeeded,
      optimalHeight,
      containerWidth,
      useMultiRowLayout
    });
    
    return {
      nodeWidth,
      nodeHeight,
      parentSpacing: fixedSpacing,
      childSpacing: fixedSpacing,
      totalWidth: availableWidth,
      totalHeight: optimalHeight,
      containerWidth: containerWidth,
      margin: margin
    };
  }, [organizedMembers, useMultiRowLayout]);

  // 2025-01-28: Helper function to calculate centered positions
  const calculateCenteredPosition = (index: number, totalCount: number, spacing: number) => {
    // Calculate the total width needed for all nodes
    const totalWidth = totalCount * treeDimensions.nodeWidth + 
      (totalCount > 1 ? (totalCount - 1) * spacing : 0);
    
    // Calculate the center of the container
    const containerCenter = treeDimensions.containerWidth / 2;
    
    // Calculate the left edge of the first node to center the entire group
    const firstNodeLeftEdge = containerCenter - (totalWidth / 2);
    
    // Return the position for the current node
    return firstNodeLeftEdge + index * (treeDimensions.nodeWidth + spacing);
  };

  // Calculate connections between family members
  const connections = useMemo(() => {
    const connections: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      type: string;
    }> = [];
    
    // Add parent-child connections
    organizedMembers.parentChildMap?.forEach((childIds, parentId) => {
      const parent = organizedMembers.parents.find(p => p.entry.pid === parentId);
      if (parent) {
        const parentIndex = organizedMembers.parents.findIndex(p => p.entry.pid === parentId);
        const parentX = calculateCenteredPosition(parentIndex, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2;
        const parentY = 50 + treeDimensions.nodeHeight;
        
        childIds.forEach((childId: number) => {
          const child = organizedMembers.children.find(c => c.entry.pid === childId);
          if (child) {
            const childIndex = organizedMembers.children.findIndex(c => c.entry.pid === childId);
            const childX = calculateCenteredPosition(childIndex, organizedMembers.children.length, treeDimensions.childSpacing) + treeDimensions.nodeWidth / 2;
            const childY = 220;
            
            connections.push({
              from: { x: parentX, y: parentY },
              to: { x: childX, y: childY },
              type: 'parent-child'
            });
          }
        });
      }
    });
    
    // Add spouse connections between parents
    if (organizedMembers.spouseMap) {
      organizedMembers.spouseMap?.forEach((spouseIds, personId) => {
        const person = organizedMembers.parents.find(p => p.entry.pid === personId);
        if (person) {
          const personIndex = organizedMembers.parents.findIndex(p => p.entry.pid === personId);
          const personX = calculateCenteredPosition(personIndex, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2;
          const personY = 50 + treeDimensions.nodeHeight / 2;
          
          spouseIds.forEach((spouseId: number) => {
            const spouse = organizedMembers.parents.find(p => p.entry.pid === spouseId);
            if (spouse && spouseId > personId) { // Only draw once per pair
              const spouseIndex = organizedMembers.parents.findIndex(p => p.entry.pid === spouseId);
              const spouseX = calculateCenteredPosition(spouseIndex, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2;
              const spouseY = 50 + treeDimensions.nodeHeight / 2;
              
              connections.push({
                from: { x: personX, y: personY },
                to: { x: spouseX, y: spouseY },
                type: 'spouse'
              });
            }
          });
        }
      });
    }
    
    return connections;
  }, [organizedMembers, treeDimensions]);

  // Format age from DOB - 2025-01-28: Updated to use backend-calculated age for reliability
  const formatAge = (member: any): string => {
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
  };

  // Format name with age suffix - 2025-01-28: Updated to use backend-calculated age
  const formatNameWithAge = (name: string, member: any): string => {
    const age = formatAge(member);
    if (age === '') return name;
    return `${name} (${age})`;
  };

  // Don't render if no members
  if (familyMembers.length === 0) {
    return (
      <div className="classic-family-tree-empty">
        <p>No family members found.</p>
      </div>
    );
  }

  // 2025-01-29: ENHANCED - Using treeDimensions directly for better multi-row support

  return (
    <div className="classic-family-tree">
      {/* 2025-01-29: ENHANCED - Added layout indicator */}
      {useMultiRowLayout && familyMembers.length > 6 && (
        <div className="layout-indicator multi-row-active">
          📐 Multi-row layout active - Family members arranged in multiple rows
        </div>
      )}
      
      <div className={`classic-family-tree-container ${useMultiRowLayout ? 'multi-row-active' : ''}`}>
        {/* 2025-01-28: FIXED - Use full container width to prevent clipping */}
        <div className={`classic-family-tree-svg-wrapper ${useMultiRowLayout ? 'multi-row' : ''}`}>
          <svg
            ref={svgRef}
            width={treeDimensions.containerWidth}
            height={treeDimensions.totalHeight}
            viewBox={`0 0 ${treeDimensions.containerWidth} ${treeDimensions.totalHeight}`}
            className="classic-family-tree-svg"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              {/* Connection line styles */}
              <marker
                id="arrowhead-classic"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#8B4513" />
              </marker>
            </defs>

            {/* Parent Generation */}
            <g className="parent-generation">
              {organizedMembers.parents.map((parent, index) => {
                // 2025-01-29: ENHANCED - Calculate base position for parents
                let x = calculateCenteredPosition(index, organizedMembers.parents.length, treeDimensions.parentSpacing);
                let y = 50;
                
                // 2025-01-29: ENHANCED - Apply drag offset if parent has been moved
                const dragOffset = memberPositions.get(parent.entry.pid);
                if (dragOffset) {
                  x += dragOffset.x;
                  y += dragOffset.y;
                }
                
                return (
                  <g key={parent.entry.pid} className="parent-node">
                    {/* Parent node with drag functionality */}
                    <rect
                      x={x}
                      y={y}
                      width={treeDimensions.nodeWidth}
                      height={treeDimensions.nodeHeight}
                      rx="8"
                      ry="8"
                      fill="#FFE4B5"
                      stroke="#8B4513"
                      strokeWidth="2"
                      style={{ cursor: 'grab' }}
                      onMouseDown={(e) => handleMouseDown(e, parent.entry.pid!)}
                    />
                    
                    {/* Parent name with text wrapping */}
                    <foreignObject
                      x={x + 5}
                      y={y + 10}
                      width={treeDimensions.nodeWidth - 10}
                      height={30}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#8B4513',
                          textAlign: 'center',
                          lineHeight: '1.2',
                          wordWrap: 'normal',
                          overflowWrap: 'normal',
                          wordBreak: 'normal',
                          hyphens: 'none',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={formatNameWithAge(parent.entry.name, parent)}
                      >
                        {formatNameWithAge(parent.entry.name, parent)}
                      </div>
                    </foreignObject>
                    
                    {/* 2025-01-29: Removed parent contact and address display - keeping only member names for cleaner family tree */}
                  </g>
                );
              })}
            </g>

            {/* 2025-01-28: ENHANCED: Dynamic relationship-based connections instead of hardcoded lines */}
            {connections.map((connection, index) => (
              <line
                key={`connection-${index}`}
                x1={connection.from.x}
                y1={connection.from.y}
                x2={connection.to.x}
                y2={connection.to.y}
                stroke={connection.type === 'spouse' ? '#FF69B4' : '#8B4513'}
                strokeWidth={connection.type === 'spouse' ? '2' : '3'}
                markerEnd="url(#arrowhead-classic)"
                strokeDasharray={connection.type === 'spouse' ? '5,5' : 'none'}
              />
            ))}
            
            {/* Fallback connections if no relationships defined */}
            {connections.length === 0 && (
              <>
                {/* Parent connection line */}
                {organizedMembers.parents.length > 1 && (
                  <line
                    x1={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                    y1={50 + treeDimensions.nodeHeight / 2}
                    x2={calculateCenteredPosition(organizedMembers.parents.length - 1, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                    y2={50 + treeDimensions.nodeHeight / 2}
                    stroke="#8B4513"
                    strokeWidth="3"
                    markerEnd="url(#arrowhead-classic)"
                  />
                )}

                {/* 2025-01-29: ENHANCED - Optimized vertical connection from parents to children */}
                {organizedMembers.children.length > 0 && (
                  <line
                    x1={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                    y1={50 + treeDimensions.nodeHeight}
                    x2={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                    y2={130}
                    stroke="#8B4513"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead-classic)"
                  />
                )}
              </>
            )}

            {/* Child Generation - 2025-01-29: ENHANCED with unified layout logic */}
            <g className="child-generation">
              {(() => {
                // 2025-01-29: UNIFIED LAYOUT LOGIC - Single consistent approach for both layouts
                const totalChildren = organizedMembers.children.length;
                
                // 2025-01-29: DEBUG - Log children processing
                console.log(`👶 RENDERING CHILDREN: ${totalChildren} children to render`);
                console.log(`👶 Children names:`, organizedMembers.children.map(c => c.entry.name));
                
                if (totalChildren === 0) return null;
                
                // 2025-01-29: ENHANCED - Unified space calculation for optimal fit
                const containerWidth = treeDimensions.containerWidth;
                const margin = treeDimensions.margin;
                const availableWidth = containerWidth - (2 * margin);
                const availableHeight = treeDimensions.totalHeight - 200; // Reserve 200px for parents and connections
                
                // 2025-01-29: ENHANCED - Automatic layout decision based on available space
                const singleRowWidth = totalChildren * treeDimensions.nodeWidth + (totalChildren > 1 ? (totalChildren - 1) * 20 : 0);
                const useMultiRow = useMultiRowLayout && (singleRowWidth > availableWidth || totalChildren > 8);
                
                console.log(`📐 Layout decision:`, {
                  totalChildren,
                  singleRowWidth,
                  availableWidth,
                  useMultiRowLayout,
                  useMultiRow
                });
                
                if (useMultiRow) {
                  console.log('🔄 CREATING UNIFIED MULTI-ROW LAYOUT');
                  
                  // 2025-01-29: ENHANCED - Optimal row distribution based on available space
                  const maxChildrenPerRow = Math.ceil(Math.sqrt(totalChildren)); // Square root for balanced distribution
                  const numRows = Math.ceil(totalChildren / maxChildrenPerRow);
                  
                  // Create rows with balanced distribution
                  const rows: Array<Array<{ child: FamilyMember; index: number }>> = Array.from({ length: numRows }, () => []);
                  
                  organizedMembers.children.forEach((child, index) => {
                    const rowIndex = Math.floor(index / maxChildrenPerRow);
                    rows[rowIndex].push({ child, index });
                  });
                  
                  console.log(`📐 Unified multi-row distribution: ${totalChildren} children, ${numRows} rows, ${maxChildrenPerRow} max per row`);
                  console.log(`📐 Rows breakdown:`, rows.map((row, i) => `Row ${i}: ${row.length} children`));
                  
                  // 2025-01-29: ENHANCED - Unified positioning calculation for all rows
                  const rowPositions = rows.map((row, rowIndex) => {
                    if (row.length === 0) return { startX: 0, spacing: 0 };
                    
                    const totalNodeWidth = row.length * treeDimensions.nodeWidth;
                    const remainingSpace = availableWidth - totalNodeWidth;
                    const optimalSpacing = row.length > 1 ? remainingSpace / (row.length - 1) : 0;
                    const finalSpacing = Math.max(optimalSpacing, 15); // Minimum 15px spacing for tight fit
                    const totalRowWidth = totalNodeWidth + ((row.length - 1) * finalSpacing);
                    const startX = margin + (availableWidth - totalRowWidth) / 2;
                    
                    return { startX, spacing: finalSpacing };
                  });
                  
                  // 2025-01-29: ENHANCED - Unified rendering with optimal vertical distribution
                  const rowHeight = treeDimensions.nodeHeight + 30; // 30px gap between rows
                  const totalRowsHeight = numRows * rowHeight;
                  const startY = 180 + (availableHeight - totalRowsHeight) / 2; // Center rows vertically
                  
                  console.log(`📐 Multi-row positioning:`, {
                    rowHeight,
                    totalRowsHeight,
                    startY,
                    availableHeight
                  });
                  
                  return rows.flatMap((row, rowIndex) => 
                    row.map(({ child, index }, colIndex) => {
                      const { startX, spacing } = rowPositions[rowIndex];
                      
                      let x: number;
                      let y: number;
                      
                      if (rowIndex === 0) {
                        // Top row: normal positioning
                        x = startX + (colIndex * (treeDimensions.nodeWidth + spacing));
                        y = startY;
                      } else {
                        // Bottom rows: staggered positioning between top row children with random offset
                        const topRowSpacing = rowPositions[0].spacing;
                        const topRowStartX = rowPositions[0].startX;
                        
                        // 2025-01-29: ENHANCED - Add random horizontal offset for natural variation
                        const randomOffset = getRandomOffset();
                        
                        // Calculate position between top row children
                        if (colIndex === 0) {
                          // First child in row goes between first and second top row children
                          x = topRowStartX + (treeDimensions.nodeWidth / 2) + (topRowSpacing / 2) + randomOffset;
                        } else if (colIndex === row.length - 1) {
                          // Last child in row goes between last and second-to-last top row children
                          const lastTopRowIndex = rows[0].length - 1;
                          x = topRowStartX + (lastTopRowIndex * (treeDimensions.nodeWidth + topRowSpacing)) + (treeDimensions.nodeWidth / 2) - (topRowSpacing / 2) + randomOffset;
                        } else {
                          // Middle children go between corresponding top row children
                          const topRowIndex = colIndex + 1; // Offset by 1 to position between top row children
                          x = topRowStartX + (topRowIndex * (treeDimensions.nodeWidth + topRowSpacing)) + (treeDimensions.nodeWidth / 2) + randomOffset;
                        }
                        
                        y = startY + (rowIndex * rowHeight);
                      }
                      
                      // 2025-01-29: ENHANCED - Apply drag offset if member has been moved
                      const dragOffset = memberPositions.get(child.entry.pid);
                      if (dragOffset) {
                        x += dragOffset.x;
                        y += dragOffset.y;
                      }
                      
                      // 2025-01-29: ENHANCED - Unified connection logic for all layouts
                      const parentCenterX = calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2;
                      const parentBottomY = 130;
                      const childTopY = y;
                      
                      // 2025-01-29: FIXED - Adjusted control points to prevent arrow overlap with nodes
                      const controlPoint1X = parentCenterX;
                      const controlPoint1Y = parentBottomY + (childTopY - parentBottomY) / 2;
                      const controlPoint2X = x + treeDimensions.nodeWidth / 2;
                      const controlPoint2Y = childTopY - 15;
                      
                      const pathData = `M ${parentCenterX} ${parentBottomY} C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${x + treeDimensions.nodeWidth / 2} ${childTopY}`;
                      
                      console.log(`👶 Rendering child ${child.entry.name} at position (${x}, ${y})`);
                      
                      return (
                        <g key={child.entry.pid} className="child-node multi-row">
                          {/* Curved connection line from parent to child */}
                          <path
                            d={pathData}
                            fill="none"
                            stroke="#8B4513"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead-classic)"
                            className="multi-row-connection"
                          />
                          
                          {/* Child node with drag functionality */}
                          <rect
                            x={x}
                            y={y}
                            width={treeDimensions.nodeWidth}
                            height={treeDimensions.nodeHeight}
                            rx="8"
                            ry="8"
                            fill="#F0F8FF"
                            stroke="#8B4513"
                            strokeWidth="2"
                            className="multi-row-node"
                            style={{ cursor: 'grab' }}
                            onMouseDown={(e) => handleMouseDown(e, child.entry.pid!)}
                          />
                          
                          {/* Child name with text wrapping */}
                          <foreignObject
                            x={x + 5}
                            y={y + 10}
                            width={treeDimensions.nodeWidth - 10}
                            height={30}
                            style={{ overflow: 'hidden' }}
                          >
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#8B4513',
                                textAlign: 'center',
                                lineHeight: '1.2',
                                wordWrap: 'normal',
                                overflowWrap: 'normal',
                                wordBreak: 'normal',
                                hyphens: 'none',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title={formatNameWithAge(child.entry.name, child)}
                            >
                              {formatNameWithAge(child.entry.name, child)}
                            </div>
                          </foreignObject>
                        </g>
                      );
                    })
                  );
                } else {
                  console.log('📐 CREATING SINGLE-ROW LAYOUT');
                  
                  // Single-row layout for smaller families
                  const totalNodeWidth = totalChildren * treeDimensions.nodeWidth;
                  const remainingSpace = availableWidth - totalNodeWidth;
                  const spacing = totalChildren > 1 ? remainingSpace / (totalChildren - 1) : 0;
                  const finalSpacing = Math.max(spacing, 20); // Minimum 20px spacing
                  const totalRowWidth = totalNodeWidth + ((totalChildren - 1) * finalSpacing);
                  const startX = margin + (availableWidth - totalRowWidth) / 2;
                  const startY = 180; // Fixed Y position for single row
                  
                  console.log(`📐 Single-row positioning:`, {
                    totalNodeWidth,
                    remainingSpace,
                    finalSpacing,
                    totalRowWidth,
                    startX,
                    startY
                  });
                  
                  return organizedMembers.children.map((child, index) => {
                    let x = startX + (index * (treeDimensions.nodeWidth + finalSpacing));
                    let y = startY;
                    
                    // 2025-01-29: ENHANCED - Apply drag offset if member has been moved
                    const dragOffset = memberPositions.get(child.entry.pid);
                    if (dragOffset) {
                      x += dragOffset.x;
                      y += dragOffset.y;
                    }
                    
                    // 2025-01-29: ENHANCED - Unified connection logic for all layouts
                    const parentCenterX = calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2;
                    const parentBottomY = 130;
                    const childTopY = y;
                    
                    // 2025-01-29: FIXED - Adjusted control points to prevent arrow overlap with nodes
                    const controlPoint1X = parentCenterX;
                    const controlPoint1Y = parentBottomY + (childTopY - parentBottomY) / 2;
                    const controlPoint2X = x + treeDimensions.nodeWidth / 2;
                    const controlPoint2Y = childTopY - 15;
                    
                    const pathData = `M ${parentCenterX} ${parentBottomY} C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${x + treeDimensions.nodeWidth / 2} ${childTopY}`;
                    
                    console.log(`👶 Rendering child ${child.entry.name} at position (${x}, ${y})`);
                    
                    return (
                      <g key={child.entry.pid} className="child-node">
                        {/* Curved connection line from parent to child */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#8B4513"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead-classic)"
                        />
                        
                        {/* Child node with drag functionality */}
                        <rect
                          x={x}
                          y={y}
                          width={treeDimensions.nodeWidth}
                          height={treeDimensions.nodeHeight}
                          rx="8"
                          ry="8"
                          fill="#F0F8FF"
                          stroke="#8B4513"
                          strokeWidth="2"
                          style={{ cursor: 'grab' }}
                          onMouseDown={(e) => handleMouseDown(e, child.entry.pid!)}
                        />
                        
                        {/* Child name with text wrapping */}
                        <foreignObject
                          x={x + 5}
                          y={y + 10}
                          width={treeDimensions.nodeWidth - 10}
                          height={30}
                          style={{ overflow: 'hidden' }}
                        >
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#8B4513',
                              textAlign: 'center',
                              lineHeight: '1.2',
                              wordWrap: 'normal',
                              overflowWrap: 'normal',
                              wordBreak: 'normal',
                              hyphens: 'none',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={formatNameWithAge(child.entry.name, child)}
                          >
                            {formatNameWithAge(child.entry.name, child)}
                          </div>
                        </foreignObject>
                      </g>
                    );
                  });
                }
              })()}
            </g>
          </svg>
        </div>
      </div>
      
      {/* Family tree legend */}
      <div className="classic-family-tree-legend">
        <div className="legend-item">
          <div className="legend-color parent-color"></div>
          <span>Parents</span>
        </div>
        <div className="legend-item">
          <div className="legend-color child-color"></div>
          <span>Children</span>
        </div>
      </div>
    </div>
  );
};

export default ClassicFamilyTree;
