// 2025-01-28: NEW - Classic family tree visualization component
// 2025-01-28: Implements traditional family tree layout with parents at top, children below
// 2025-01-28: Clean hierarchical structure matching family1.png reference

import React, { useMemo } from 'react';
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

interface ClassicFamilyTreeProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
}

const ClassicFamilyTree: React.FC<ClassicFamilyTreeProps> = ({ 
  familyMembers, 
  relationships = [] 
}) => {
  // Organize family members into classic structure
  const organizedMembers = useMemo(() => {
    // Filter out members without valid pid
    const validMembers = familyMembers.filter(member => 
      member.entry && member.entry.pid !== undefined && member.entry.pid !== null
    );

    if (validMembers.length === 0) {
      return { parents: [], children: [] };
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
      
      // Find people who are parents (have children)
      const parents = validMembers.filter(member => 
        parentChildMap.has(member.entry.pid) && parentChildMap.get(member.entry.pid)!.length > 0
      );
      
      // Find people who are children (have parents)
      const children = validMembers.filter(member => 
        childParentMap.has(member.entry.pid) && childParentMap.get(member.entry.pid)!.length > 0
      );
      
      // If no clear parent-child relationships, fall back to sophisticated age-based logic
      if (parents.length === 0 && children.length === 0) {
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
                  console.log(`�� ${bestSecondParent.entry.name} added as second parent`);
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
        totalChildren: result.children.length
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
      
      // Step 1: Eldest person becomes parent if they have 10+ year gap to potential children
      console.log(`🔍 STEP 1: Checking if eldest ${eldest.entry.name} (${eldestAge}) can be parent to children`);
      
      // Find potential children (members with 10+ year age gap from eldest)
      const potentialChildren: typeof validMembers = [];
      let eldestCanBeParent = false;
      
      for (let i = 1; i < sortedByAge.length; i++) {
        const member = sortedByAge[i];
        const memberAge = member.entry.age || 0;
        const ageDifference = eldestAge - memberAge;
        
        console.log(`  📏 ${eldest.entry.name} (${eldestAge}) vs ${member.entry.name} (${memberAge}): gap = ${ageDifference} years ${ageDifference >= 10 ? '✅' : '❌'}`);
        
        if (ageDifference >= 10) {
          potentialChildren.push(member);
          eldestCanBeParent = true;
        }
      }
      
      if (eldestCanBeParent) {
        console.log(`    ✅ ${eldest.entry.name} can be parent to ${potentialChildren.length} children`);
      } else {
        console.log(`    ❌ ${eldest.entry.name} cannot be parent - no children with 10+ year gap`);
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
    }
    
    // Step 2: Find second parent - second most eldest person of different gender with 10+ year gap to non-parents
    if (potentialParents.length === 1) {
      const firstParent = potentialParents[0];
      const firstParentGender = firstParent.entry.gender;
      
      console.log(`🔍 STEP 2: Looking for second parent (different gender than ${firstParent.entry.name} with 10+ year gap to non-parents)`);
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
          
          // Must have 10+ year gap to all non-parents (children)
          let canBeSecondParent = true;
          console.log(`    🔍 Checking age gaps against ${children.length} children:`, children.map(c => `${c.entry.name} (${c.entry.age})`));
          
          for (const child of children) {
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
            console.log(`    ✅ ${member.entry.name} (${memberAge}) can be second parent to all ${children.length} children`);
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
    
    // Children are now properly assigned in Step 3
    
    // If we still don't have any parents identified, all members go to children
    if (potentialParents.length === 0) {
      children.push(...sortedByAge);
    }
    
    const result = { 
      parents: potentialParents.slice(0, 4), // Max 4 parents
      children: children.slice(0, 12), // Max 12 children
      parentChildMap: new Map(),
      childParentMap: new Map(),
      spouseMap: new Map()
    };
    
    console.log(`🎯 FINAL RESULT:`, {
      parents: result.parents.map(p => ({ name: p.entry.name, age: p.entry.age, gender: p.entry.gender })),
      children: result.children.map(c => ({ name: c.entry.name, age: c.entry.age, gender: c.entry.gender })),
      totalParents: result.parents.length,
      totalChildren: result.children.length
    });
    
    return result;
  }, [familyMembers, relationships]);

  // Calculate tree dimensions
  const treeDimensions = useMemo(() => {
    const parentCount = organizedMembers.parents.length;
    const childCount = organizedMembers.children.length;
    
    const nodeWidth = 120;
    const nodeHeight = 80;
    
    // 2025-01-28: FIXED - Use fixed spacing and center the tree properly
    // Use fixed spacing between nodes for consistent layout
    const fixedSpacing = 60; // Fixed spacing between nodes
    
    // Calculate total width needed for each generation with fixed spacing
    const totalParentWidth = parentCount * nodeWidth + (parentCount > 1 ? (parentCount - 1) * fixedSpacing : 0);
    const totalChildWidth = childCount * nodeWidth + (childCount > 1 ? (childCount - 1) * fixedSpacing : 0);
    
    // Use container width (1000px) with margins
    const containerWidth = 1000;
    const margin = 40;
    const availableWidth = containerWidth - margin;
    
    return {
      nodeWidth,
      nodeHeight,
      parentSpacing: fixedSpacing,
      childSpacing: fixedSpacing,
      totalWidth: availableWidth,
      totalHeight: 300,
      containerWidth: availableWidth
    };
  }, [organizedMembers]);

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

  const { nodeWidth, nodeHeight, parentSpacing, childSpacing, totalWidth, totalHeight } = treeDimensions;

  return (
    <div className="classic-family-tree">
      <div className="classic-family-tree-container">
        {/* 2025-01-28: FIXED - Use full container width to prevent clipping */}
        <div className="classic-family-tree-svg-wrapper">
          <svg
            width="100%"
            height={totalHeight}
            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
            className="classic-family-tree-svg"
            preserveAspectRatio="xMidYMid meet"
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
                // 2025-01-28: FIXED - Center-based positioning to prevent clipping
                // Calculate center position and expand outward
                const x = calculateCenteredPosition(index, organizedMembers.parents.length, treeDimensions.parentSpacing);
                const y = 50;
                
                return (
                  <g key={parent.entry.pid} className="parent-node">
                    {/* Parent node */}
                    <rect
                      x={x}
                      y={y}
                      width={treeDimensions.nodeWidth}
                      height={treeDimensions.nodeHeight}
                      rx="8"
                      ry="8"
                      fill="#F5F5DC"
                      stroke="#8B4513"
                      strokeWidth="2"
                    />
                    
                    {/* Parent name */}
                    <text
                      x={x + treeDimensions.nodeWidth / 2}
                      y={y + 25}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#8B4513"
                    >
                      {formatNameWithAge(parent.entry.name, parent)}
                    </text>
                    
                    {/* Parent contact */}
                    <text
                      x={x + treeDimensions.nodeWidth / 2}
                      y={y + 40}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#8B4513"
                    >
                      {parent.entry.contact}
                    </text>
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

                {/* Vertical connection from parents to children */}
                {organizedMembers.children.length > 0 && (
                  <line
                    x1={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                    y1={50 + treeDimensions.nodeHeight}
                    x2={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                    y2={200}
                    stroke="#8B4513"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead-classic)"
                  />
                )}
              </>
            )}

            {/* Child Generation */}
            <g className="child-generation">
              {organizedMembers.children.map((child, index) => {
                // 2025-01-28: FIXED - Center-based positioning to prevent clipping
                // Calculate center position and expand outward
                const x = calculateCenteredPosition(index, organizedMembers.children.length, treeDimensions.childSpacing);
                const y = 220;
                
                return (
                  <g key={child.entry.pid} className="child-node">
                    {/* Child node */}
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
                    />
                    
                    {/* Child name */}
                    <text
                      x={x + treeDimensions.nodeWidth / 2}
                      y={y + 25}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#8B4513"
                    >
                      {formatNameWithAge(child.entry.name, child)}
                    </text>
                    
                    {/* Child contact */}
                    <text
                      x={x + treeDimensions.nodeWidth / 2}
                      y={y + 40}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#8B4513"
                    >
                      {child.entry.contact}
                    </text>
                    
                    {/* Connection line from main vertical to child */}
                    <line
                      x1={calculateCenteredPosition(0, organizedMembers.parents.length, treeDimensions.parentSpacing) + treeDimensions.nodeWidth / 2}
                      y1={200}
                      x2={x + treeDimensions.nodeWidth / 2}
                      y2={y + treeDimensions.nodeHeight / 2}
                      stroke="#8B4513"
                      strokeWidth="1"
                      markerEnd="url(#arrowhead-classic)"
                    />
                  </g>
                );
              })}
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
