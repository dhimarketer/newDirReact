import { useMemo } from 'react';
import { FamilyMember, FamilyRelationship, OrganizedFamilyMembers } from '../../types/family';

export const useFamilyOrganization = (
  familyMembers: FamilyMember[],
  relationships: FamilyRelationship[] = []
): OrganizedFamilyMembers => {
  return useMemo(() => {
    // 2025-01-31: FIXED - Include ALL family members with valid PID and name
    // PID is unique and reliable for identification, always use it
    const validMembers = familyMembers.filter(member => 
      member && 
      member.entry && 
      member.entry.pid !== undefined && 
      member.entry.pid !== null &&
      member.entry.name && 
      member.entry.name.trim() !== ''
    );

    // 2025-01-31: Removed console.log to prevent infinite loop
    
    if (validMembers.length === 0) {
      return { parents: [], children: [], grandparents: [], grandchildren: [] };
    }

    // Sort by age (oldest first) - members without age are treated as children (age 0)
    const sortedByAge = [...validMembers].sort((a, b) => {
      const ageA = a.entry.age || 0; // Missing age = 0 (child)
      const ageB = b.entry.age || 0; // Missing age = 0 (child)
      return ageB - ageA; // Oldest first
    });
    
    // 2025-01-31: Removed console.log to prevent infinite loop
    
    const parents: typeof validMembers = [];
    const children: typeof validMembers = [];
    
    // EDGE CASE 1: Single member family
    if (sortedByAge.length === 1) {
      parents.push(sortedByAge[0]);
    }
    // EDGE CASE 2: Two member family
    else if (sortedByAge.length === 2) {
      const firstMember = sortedByAge[0];
      const secondMember = sortedByAge[1];
      const firstAge = firstMember.entry.age || 0;
      const secondAge = secondMember.entry.age || 0;
      const firstGender = firstMember.entry.gender?.toLowerCase();
      const secondGender = secondMember.entry.gender?.toLowerCase();
      const ageGap = Math.abs(firstAge - secondAge);
      
      // 2025-01-31: Removed console.log to prevent infinite loop
      
      // Check if they can be parent couple (both must have valid age, reasonable age gap and different genders)
      const firstHasAge = firstAge > 0;
      const secondHasAge = secondAge > 0;
      const reasonableAgeGap = ageGap <= 20; // Parents shouldn't be too far apart in age
      const differentGender = firstGender && secondGender && firstGender !== secondGender;
      
      if (firstHasAge && secondHasAge && reasonableAgeGap && differentGender) {
        // Both have valid age and can be parent couple
        parents.push(firstMember, secondMember);
      } else if (firstHasAge) {
        // First has age, second doesn't or doesn't qualify - first as parent, second as child
        parents.push(firstMember);
        children.push(secondMember);
      } else {
        // Neither has valid age, treat both as children
        children.push(firstMember, secondMember);
      }
    }
    // EDGE CASE 3: Three or more members - use standard logic
    else if (sortedByAge.length >= 3) {
      
      // 1st parent is the oldest (must have valid age)
      const firstParent = sortedByAge[0];
      const firstParentAge = firstParent.entry.age || 0;
      
      // Only consider as parent if they have valid age (not 0)
      if (firstParentAge > 0) {
        parents.push(firstParent);
        
        // Check if 2nd oldest can be 2nd parent (must also have valid age)
        if (sortedByAge.length >= 2) {
          const secondOldest = sortedByAge[1];
          const secondOldestAge = secondOldest.entry.age || 0;
          const firstParentGender = firstParent.entry.gender?.toLowerCase();
          const secondOldestGender = secondOldest.entry.gender?.toLowerCase();
          
          // 2025-01-31: Removed console.log to prevent infinite loop
          
          // Only consider as parent if they have valid age (not 0)
          if (secondOldestAge > 0) {
            // Check if 2nd parent has at least 12 years gap with all other members (excluding 1st parent)
            const otherMembers = sortedByAge.slice(2); // All members except 1st and 2nd
            const has12YearGap = otherMembers.every(member => {
              const memberAge = member.entry.age || 0;
              const ageGap = secondOldestAge - memberAge;
              return ageGap >= 12;
            });
            
            // Check if 2nd parent is different gender than 1st parent
            const differentGender = firstParentGender && secondOldestGender && firstParentGender !== secondOldestGender;
            
            if (has12YearGap && differentGender) {
              // 2nd parent qualifies
              parents.push(secondOldest);
              children.push(...otherMembers);
            } else {
              // 2nd parent doesn't qualify, all others are children
              children.push(...sortedByAge.slice(1));
            }
          } else {
            // 2nd oldest has no age, treat as child
            children.push(...sortedByAge.slice(1));
          }
        }
      } else {
        // First member has no age, treat all as children
        children.push(...sortedByAge);
      }
    }
    
    // 2025-01-31: Removed console.log to prevent infinite loop
    
    return {
      parents,
      children,
      grandparents: [], // Not used in simple logic
      grandchildren: [] // Not used in simple logic
    };
  }, [familyMembers, relationships]);
};
