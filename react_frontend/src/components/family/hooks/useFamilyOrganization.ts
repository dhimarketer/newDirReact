// 2025-01-31: Custom hook for family organization logic
// Extracted from ClassicFamilyTree component for better maintainability

import { useMemo } from 'react';
import { PhoneBookEntry } from '../../../types/directory';

export interface FamilyMember {
  entry: PhoneBookEntry;
  role: 'parent' | 'child' | 'other';
  relationship?: string;
}

export interface FamilyRelationship {
  id: number;
  person1: number;
  person2: number;
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other';
  notes?: string;
  is_active: boolean;
}

export interface OrganizedFamilyMembers {
  parents: FamilyMember[];
  children: FamilyMember[];
  grandparents: FamilyMember[];
  grandchildren: FamilyMember[];
  parentChildMap: Map<number, number[]>;
  childParentMap: Map<number, number[]>;
  spouseMap: Map<number, number[]>;
  grandparentMap: Map<number, number[]>;
  grandchildMap: Map<number, number[]>;
  generationLevels: Map<number, number>;
}

export const useFamilyOrganization = (
  familyMembers: FamilyMember[],
  relationships: FamilyRelationship[] = []
): OrganizedFamilyMembers => {
  return useMemo(() => {
    // Filter out members without valid pid
    const validMembers = familyMembers.filter(member => 
      member.entry && member.entry.pid !== undefined && member.entry.pid !== null
    );

    if (validMembers.length === 0) {
      return { 
        parents: [], 
        children: [],
        grandparents: [],
        grandchildren: [],
        parentChildMap: new Map(),
        childParentMap: new Map(),
        spouseMap: new Map(),
        grandparentMap: new Map(),
        grandchildMap: new Map(),
        generationLevels: new Map()
      };
    }
    
    console.log(`🔍 useFamilyOrganization: Processing ${validMembers.length} family members`);
    console.log(`📊 Members with age data:`, validMembers.filter(m => m.entry.age !== undefined && m.entry.age !== null).length);
    console.log(`📊 Members without age data:`, validMembers.filter(m => m.entry.age === undefined || m.entry.age === null).length);
    
    // Debug age distribution
    const membersWithAge = validMembers.filter(m => m.entry.age !== undefined && m.entry.age !== null);
    if (membersWithAge.length > 0) {
      const sortedByAge = [...membersWithAge].sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
      console.log(`📈 Age distribution:`, sortedByAge.map(m => ({ name: m.entry.name, age: m.entry.age, gender: m.entry.gender })));
    }

    // SIMPLIFIED: Use relationships data to determine family structure
    console.log(`🔗 useFamilyOrganization: Received ${relationships?.length || 0} relationships:`, relationships);
    if (relationships && relationships.length > 0) {
      console.log(`🔗 Processing ${relationships.length} relationships for family structure`);
      
      // Build family structure from relationships
      const parentChildMap = new Map<number, number[]>(); // parent -> children
      const childParentMap = new Map<number, number[]>(); // child -> parents
      const spouseMap = new Map<number, number[]>(); // person -> spouses
      const grandparentMap = new Map<number, number[]>(); // grandparent -> grandchildren
      const grandchildMap = new Map<number, number[]>(); // grandchild -> grandparents
      const generationLevels = new Map<number, number>(); // person -> generation level (0=grandparents, 1=parents, 2=children, 3=grandchildren)
      
      // Process relationships to build family structure
      relationships.forEach(rel => {
        if (rel.is_active) {
          const person1Name = validMembers.find(m => m.entry.pid === rel.person1)?.entry.name || `PID:${rel.person1}`;
          const person2Name = validMembers.find(m => m.entry.pid === rel.person2)?.entry.name || `PID:${rel.person2}`;
          console.log(`🔗 Processing relationship: ${person1Name} -> ${person2Name} (${rel.relationship_type})`);
          
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
              console.log(`🔗 Added parent-child: ${rel.person1} -> ${rel.person2}`);
              break;
              
            case 'grandparent':
              // person1 is grandparent of person2
              if (!grandparentMap.has(rel.person1)) {
                grandparentMap.set(rel.person1, []);
              }
              grandparentMap.get(rel.person1)!.push(rel.person2);
              
              if (!grandchildMap.has(rel.person2)) {
                grandchildMap.set(rel.person2, []);
              }
              grandchildMap.get(rel.person2)!.push(rel.person1);
              console.log(`🔗 Added grandparent-grandchild: ${rel.person1} -> ${rel.person2}`);
              break;
              
            case 'grandchild':
              // person1 is grandchild of person2 (reverse of grandparent)
              if (!grandchildMap.has(rel.person1)) {
                grandchildMap.set(rel.person1, []);
              }
              grandchildMap.get(rel.person1)!.push(rel.person2);
              
              if (!grandparentMap.has(rel.person2)) {
                grandparentMap.set(rel.person2, []);
              }
              grandparentMap.get(rel.person2)!.push(rel.person1);
              console.log(`🔗 Added grandchild-grandparent: ${rel.person1} -> ${rel.person2}`);
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
              console.log(`🔗 Added spouse: ${rel.person1} <-> ${rel.person2}`);
              break;
          }
        }
      });
      
      console.log(`🔗 Relationship maps created:`, {
        parentChildMap: parentChildMap.size,
        childParentMap: childParentMap.size,
        spouseMap: spouseMap.size,
        grandparentMap: grandparentMap.size,
        grandchildMap: grandchildMap.size
      });
      
      // SIMPLIFIED: Calculate generation levels for multi-generational family
      const calculateGenerationLevels = () => {
        const visited = new Set<number>();
        
        console.log(`🌳 MULTI-GENERATIONAL BFS: Starting generation level calculation with ${validMembers.length} members`);
        console.log(`🌳 Parent-Child Map:`, Array.from(parentChildMap.entries()).map(([parent, children]) => ({
          parent,
          children,
          parentName: validMembers.find(m => m.entry.pid === parent)?.entry.name
        })));
        console.log(`🌳 Child-Parent Map:`, Array.from(childParentMap.entries()).map(([child, parents]) => ({
          child,
          parents,
          childName: validMembers.find(m => m.entry.pid === child)?.entry.name
        })));
        
        // MULTI-GENERATIONAL TRANSITION RULE: Re-run BFS to recalculate generation levels
        // (grandparents → parents → children → grandchildren)
        
        // Find root members (those who have children but no parents) - these are grandparents (level 0)
        const rootMembers = validMembers.filter(member => {
          const pid = member.entry.pid;
          const hasChildren = parentChildMap.has(pid) && parentChildMap.get(pid)!.length > 0;
          const hasParents = childParentMap.has(pid) && childParentMap.get(pid)!.length > 0;
          return hasChildren && !hasParents;
        });
        
        console.log(`🌳 MULTI-GENERATIONAL BFS: Found ${rootMembers.length} root members (grandparents):`, rootMembers.map(m => m.entry.name));
        
        // Start BFS from root members at level 0 (grandparents)
        const queue: Array<{ pid: number; level: number }> = [];
        rootMembers.forEach(root => {
          queue.push({ pid: root.entry.pid, level: 0 });
          generationLevels.set(root.entry.pid, 0); // Grandparents level
          visited.add(root.entry.pid);
        });
        
        // If no root members found, find parent members (those who have children) - these are parents (level 1)
        if (rootMembers.length === 0) {
          const parentMembers = validMembers.filter(member => {
            const pid = member.entry.pid;
            return parentChildMap.has(pid) && parentChildMap.get(pid)!.length > 0;
          });
          
          console.log(`👨👩 MULTI-GENERATIONAL BFS: Found ${parentMembers.length} parent members:`, parentMembers.map(m => m.entry.name));
          
          parentMembers.forEach(parent => {
            queue.push({ pid: parent.entry.pid, level: 1 });
            generationLevels.set(parent.entry.pid, 1); // Parents level
            visited.add(parent.entry.pid);
          });
        }
        
        // BFS to assign generation levels: grandparents (0) → parents (1) → children (2) → grandchildren (3)
        while (queue.length > 0) {
          const { pid, level } = queue.shift()!;
          
          // Process direct children (parent-child relationships)
          const children = parentChildMap.get(pid) || [];
          children.forEach(childPid => {
            if (!visited.has(childPid)) {
              const childLevel = level + 1;
              generationLevels.set(childPid, childLevel);
              visited.add(childPid);
              queue.push({ pid: childPid, level: childLevel });
              const levelName = childLevel === 0 ? 'grandparent' : childLevel === 1 ? 'parent' : childLevel === 2 ? 'child' : 'grandchild';
              console.log(`🌳 MULTI-GENERATIONAL BFS: Assigned ${levelName} level ${childLevel} to child ${childPid}`);
            }
          });
        }
        
        // Handle unvisited members by analyzing their relationships
        validMembers.forEach(member => {
          if (!visited.has(member.entry.pid)) {
            const pid = member.entry.pid;
            // If they have parents, they're children
            if (childParentMap.has(pid) && childParentMap.get(pid)!.length > 0) {
              // Check if their parents are grandparents (level 0) or parents (level 1)
              const parents = childParentMap.get(pid) || [];
              const parentLevels = parents.map(parentPid => generationLevels.get(parentPid) || 1);
              const maxParentLevel = Math.max(...parentLevels);
              generationLevels.set(pid, maxParentLevel + 1);
              console.log(`🌳 Assigned level ${maxParentLevel + 1} to child ${pid} based on parents`);
            } else if (parentChildMap.has(pid) && parentChildMap.get(pid)!.length > 0) {
              // If they have children but no parents, they're likely parents (level 1)
              generationLevels.set(pid, 1);
              console.log(`🌳 Assigned level 1 to parent ${pid}`);
            } else {
              // Default to parents level for members without clear relationships
              generationLevels.set(pid, 1);
              console.log(`🌳 Assigned default level 1 to member ${pid}`);
            }
          }
        });
        
        console.log('🌳 Final generation levels assigned:', Array.from(generationLevels.entries()).map(([pid, level]) => {
          const member = validMembers.find(m => m.entry.pid === pid);
          return { name: member?.entry.name, level };
        }));
      };
      
      calculateGenerationLevels();
      
      // 2025-01-31: ENHANCED - Classify members by generation levels (multi-generational: grandparents, parents, children, grandchildren)
      // Ensure each member is only in one generation array - FIXED: Prevent duplicates
      const grandparents = validMembers.filter(member => {
        const level = generationLevels.get(member.entry.pid);
        return level === 0;
      });
      
      const parents = validMembers.filter(member => {
        const level = generationLevels.get(member.entry.pid);
        return level === 1;
      });
      
      let children = validMembers.filter(member => {
        const level = generationLevels.get(member.entry.pid);
        return level === 2;
      });
      
      const grandchildren = validMembers.filter(member => {
        const level = generationLevels.get(member.entry.pid);
        return level === 3;
      });
      
      // FIXED: If no children at level 2, check if parents at level 1 have their own children
      // In a 2-generation family, the "children" are actually the children of the parents at level 1
      if (children.length === 0 && parents.length > 0) {
        // Check if any level 1 members have children - if so, they are parents and their children are the actual children
        const actualChildren = validMembers.filter(member => {
          const level = generationLevels.get(member.entry.pid);
          if (level === 1) {
            // Check if this member has children in the parentChildMap
            const hasChildren = parentChildMap.has(member.entry.pid) && parentChildMap.get(member.entry.pid)!.length > 0;
            return hasChildren;
          }
          return false;
        });
        
        if (actualChildren.length > 0) {
          // This is a 3-generation family: grandparents (0) → parents (1) → children (2)
          // Keep the current classification
        } else {
          // This is a 2-generation family: grandparents (0) → children (1)
          // The "parents" at level 1 are actually the children of grandparents
          children = parents;
          // Clear parents since they're actually children
          parents.length = 0;
        }
      }
      
      // FIXED: Ensure no member appears in multiple generations
      const allAssignedMembers = new Set<number>();
      [grandparents, parents, children, grandchildren].forEach(generation => {
        generation.forEach(member => {
          if (allAssignedMembers.has(member.entry.pid)) {
            console.error(`🚨 DUPLICATE MEMBER FOUND: ${member.entry.name} (PID: ${member.entry.pid}) appears in multiple generations`);
          } else {
            allAssignedMembers.add(member.entry.pid);
          }
        });
      });
      
      console.log(`🌳 Multi-Generational Family: ${grandparents.length}GP, ${parents.length}P, ${children.length}C, ${grandchildren.length}GC`);
      
      // Debug: Check for duplicate members across generations
      const allMemberIds = new Set<number>();
      const duplicates: Array<{ member: FamilyMember; levels: number[] }> = [];
      
      validMembers.forEach(member => {
        const pid = member.entry.pid;
        if (allMemberIds.has(pid)) {
          const existingLevels = [grandparents, parents, children, grandchildren]
            .map((gen, index) => gen.find(m => m.entry.pid === pid) ? index : -1)
            .filter(level => level !== -1);
          duplicates.push({ member, levels: existingLevels });
        } else {
          allMemberIds.add(pid);
        }
      });
      
      if (duplicates.length > 0) {
        console.error('🚨 DUPLICATE MEMBERS FOUND:', duplicates.map(d => ({
          name: d.member.entry.name,
          pid: d.member.entry.pid,
          levels: d.levels.map(l => ['grandparent', 'parent', 'child', 'grandchild'][l])
        })));
      }
      
      // Use generation levels directly, no need for additional classification
      // The generation levels have already been calculated correctly based on relationships
      
      // 2025-01-29: FIXED - Validate relationships for gender compatibility
      // If we have 2 parents of the same gender, the relationships are invalid
      if (parents.length >= 2) {
        const parentGenders = parents.map(p => p.entry.gender).filter(g => g && g !== 'None');
        const uniqueGenders = new Set(parentGenders);
        
        if (uniqueGenders.size === 1 && parentGenders.length >= 2) {
          console.log('⚠️ Invalid parent configuration: 2+ parents of same gender, using age-based logic');
          // Clear invalid relationships and fall back to age-based logic
          parents.length = 0;
          children = [];
        }
      }
      
      // Find people who are children (have parents) - only if relationships are valid
      if (parents.length > 0) {
        children = validMembers.filter(member => 
          childParentMap.has(member.entry.pid) && childParentMap.get(member.entry.pid)!.length > 0
        );
      }
      
      console.log('🔍 Final generation classification:', {
        parents: parents.map(p => p.entry.name),
        children: children.map(c => c.entry.name)
      });
      
      const result = { 
        parents: parents.length > 0 ? parents : validMembers.slice(0, 2), 
        children: children,
        grandparents: grandparents,
        grandchildren: grandchildren,
        parentChildMap,
        childParentMap,
        spouseMap,
        grandparentMap,
        grandchildMap,
        generationLevels
      };
      
      console.log('🔍 Final organized members result:', {
        parentsCount: result.parents.length,
        childrenCount: result.children.length,
        grandparentsCount: result.grandparents.length,
        grandchildrenCount: result.grandchildren.length,
        parentChildMapSize: result.parentChildMap.size,
        spouseMapSize: result.spouseMap.size,
        generationLevelsSize: result.generationLevels.size
      });
      
      return result;
    }
    
    // 2025-01-31: SIMPLIFIED - If no relationships found, create only nuclear family structure
    // Multi-generational structure should only be created through user editing
    if (validMembers.length > 0) {
      console.log('🔍 No relationships found, using SIMPLIFIED nuclear family logic');
      
      // Use simple 2-generation parent detection algorithm (parents + children only)
      const sortedByAge = [...validMembers].sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
      
      if (sortedByAge.length > 0) {
        console.log('🔍 Nuclear family fallback: Using age distribution to infer parent-child relationships only');
        
        // Simple 2-generation classification: parents and children only
        const maxAge = Math.max(...sortedByAge.map(m => m.entry.age || 0));
        const minAge = Math.min(...sortedByAge.map(m => m.entry.age || 0));
        const ageRange = maxAge - minAge;
        
        console.log(`🔍 Age analysis: max=${maxAge}, min=${minAge}, range=${ageRange}, members=${sortedByAge.length}`);
        
        const potentialParents: typeof validMembers = [];
        const children: typeof validMembers = [];
        
        // Use conservative age gap of 20 years to avoid creating grandparent relationships
        const parentChildAgeGap = 20;
        
        sortedByAge.forEach(member => {
          const age = member.entry.age || 0;
          
          // Parents: older generation (typically 30+ and significantly older than others)
          if (age >= 30 && age >= minAge + parentChildAgeGap) {
            potentialParents.push(member);
          }
          // Children: younger generation (typically < 30 or significantly younger than parents)
          else {
            children.push(member);
          }
        });
        
        console.log(`🔍 Nuclear family classification: ${potentialParents.length}P, ${children.length}C`);
        
        // Gender validation for parents (ensure we have male and female parents)
        if (potentialParents.length >= 2) {
          const parentGenders = potentialParents.map(p => p.entry.gender).filter(g => g && g !== 'None');
          const uniqueGenders = new Set(parentGenders);
          
          if (uniqueGenders.size === 1 && parentGenders.length >= 2) {
            console.log('⚠️ Invalid parent configuration: 2+ parents of same gender, using age-based logic');
            // Clear invalid parents and use simple age-based logic
            potentialParents.length = 0;
            children.length = 0;
            
            // Use simple age-based logic: eldest 2 as parents, rest as children
            if (sortedByAge.length >= 2) {
              potentialParents.push(...sortedByAge.slice(0, 2));
              children.push(...sortedByAge.slice(2));
            } else {
              potentialParents.push(sortedByAge[0]);
            }
          }
        }
        
        // Ensure we have at least some structure
        if (potentialParents.length === 0 && children.length === 0) {
          // Fallback: use first member as parent, rest as children
          if (sortedByAge.length > 0) {
            potentialParents.push(sortedByAge[0]);
            children.push(...sortedByAge.slice(1));
          }
        }
        
        console.log(`🔍 Final nuclear family: ${potentialParents.length} parents, ${children.length} children`);
        
        // Create fallback relationships based on family structure
        const fallbackParentChildMap = new Map<number, number[]>();
        const fallbackChildParentMap = new Map<number, number[]>();
        const fallbackSpouseMap = new Map<number, number[]>();
        const fallbackGenerationLevels = new Map<number, number>();
        
        // Set generation levels for nuclear family
        potentialParents.forEach(parent => {
          fallbackGenerationLevels.set(parent.entry.pid, 1); // Parents level
        });
        children.forEach(child => {
          fallbackGenerationLevels.set(child.entry.pid, 2); // Children level
        });
        
        // Create parent-child relationships
        potentialParents.forEach(parent => {
          children.forEach(child => {
            if (!fallbackParentChildMap.has(parent.entry.pid)) {
              fallbackParentChildMap.set(parent.entry.pid, []);
            }
            fallbackParentChildMap.get(parent.entry.pid)!.push(child.entry.pid);
            
            if (!fallbackChildParentMap.has(child.entry.pid)) {
              fallbackChildParentMap.set(child.entry.pid, []);
            }
            fallbackChildParentMap.get(child.entry.pid)!.push(parent.entry.pid);
          });
        });
        
        // Create spouse relationships between parents
        if (potentialParents.length >= 2) {
          const parent1 = potentialParents[0];
          const parent2 = potentialParents[1];
          fallbackSpouseMap.set(parent1.entry.pid, [parent2.entry.pid]);
          fallbackSpouseMap.set(parent2.entry.pid, [parent1.entry.pid]);
        }
        
        console.log(`🔍 Created fallback relationships:`, {
          parentChildMap: fallbackParentChildMap.size,
          childParentMap: fallbackChildParentMap.size,
          spouseMap: fallbackSpouseMap.size,
          generationLevels: fallbackGenerationLevels.size
        });
        
        return { 
          parents: potentialParents,
          children: children,
          grandparents: [], // NO grandparents in initial creation
          grandchildren: [], // NO grandchildren in initial creation
          parentChildMap: fallbackParentChildMap, 
          childParentMap: fallbackChildParentMap, 
          spouseMap: fallbackSpouseMap,
          grandparentMap: new Map(),
          grandchildMap: new Map(),
          generationLevels: fallbackGenerationLevels
        };
      }
    }
    
    // Final fallback - simple nuclear family only
    console.log('🔍 Final fallback: Creating simple nuclear family structure');
    
    const finalParents = validMembers.slice(0, 2);
    const finalChildren = validMembers.slice(2);
    
    // Create fallback relationships for final fallback
    const finalParentChildMap = new Map<number, number[]>();
    const finalChildParentMap = new Map<number, number[]>();
    const finalSpouseMap = new Map<number, number[]>();
    const finalGenerationLevels = new Map<number, number>();
    
    // Set generation levels for nuclear family
    finalParents.forEach(parent => {
      finalGenerationLevels.set(parent.entry.pid, 1); // Parents level
    });
    finalChildren.forEach(child => {
      finalGenerationLevels.set(child.entry.pid, 2); // Children level
    });
    
    // Create parent-child relationships
    finalParents.forEach(parent => {
      finalChildren.forEach(child => {
        if (!finalParentChildMap.has(parent.entry.pid)) {
          finalParentChildMap.set(parent.entry.pid, []);
        }
        finalParentChildMap.get(parent.entry.pid)!.push(child.entry.pid);
        
        if (!finalChildParentMap.has(child.entry.pid)) {
          finalChildParentMap.set(child.entry.pid, []);
        }
        finalChildParentMap.get(child.entry.pid)!.push(parent.entry.pid);
      });
    });
    
    // Create spouse relationships between parents
    if (finalParents.length >= 2) {
      const parent1 = finalParents[0];
      const parent2 = finalParents[1];
      finalSpouseMap.set(parent1.entry.pid, [parent2.entry.pid]);
      finalSpouseMap.set(parent2.entry.pid, [parent1.entry.pid]);
    }
    
    console.log(`🔍 Final fallback relationships:`, {
      parentChildMap: finalParentChildMap.size,
      childParentMap: finalChildParentMap.size,
      spouseMap: finalSpouseMap.size,
      generationLevels: finalGenerationLevels.size
    });
    
    return {
      parents: finalParents,
      children: finalChildren,
      grandparents: [], // NO grandparents in initial creation
      grandchildren: [], // NO grandchildren in initial creation
      parentChildMap: finalParentChildMap,
      childParentMap: finalChildParentMap,
      spouseMap: finalSpouseMap,
      grandparentMap: new Map(),
      grandchildMap: new Map(),
      generationLevels: finalGenerationLevels
    };
  }, [familyMembers, relationships]);
};
