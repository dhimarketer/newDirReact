// Debug script for parent detection issues
// Add this to any family tree component to debug parent detection

export const debugParentDetection = (familyMembers: any[], componentName: string) => {
  console.log(`🔍 DEBUGGING PARENT DETECTION in ${componentName}`);
  console.log(`📊 Total members: ${familyMembers.length}`);
  
  // Check age data
  const membersWithAge = familyMembers.filter(m => m.entry?.age !== undefined && m.entry?.age !== null);
  const membersWithoutAge = familyMembers.filter(m => m.entry?.age === undefined || m.entry?.age === null);
  
  console.log(`✅ Members with age: ${membersWithAge.length}`);
  console.log(`❌ Members without age: ${membersWithoutAge.length}`);
  
  if (membersWithAge.length === 0) {
    console.log(`🚨 NO AGE DATA - All members lack age information`);
    return;
  }
  
  // Sort by age
  const sortedByAge = [...membersWithAge].sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
  
  console.log(`📈 Age distribution:`);
  sortedByAge.forEach((member, index) => {
    console.log(`  ${index + 1}. ${member.entry.name}: ${member.entry.age} years (${member.entry.gender || 'unknown'})`);
  });
  
  // Check eldest potential parent
  const eldest = sortedByAge[0];
  const eldestAge = eldest.entry.age || 0;
  
  console.log(`\n👴 ELDEST MEMBER: ${eldest.entry.name} (${eldestAge} years)`);
  
  // Check age gaps to everyone else
  let eldestCanBeParent = true;
  const ageGaps = [];
  
  for (let i = 1; i < sortedByAge.length; i++) {
    const member = sortedByAge[i];
    const memberAge = member.entry.age || 0;
    const ageDifference = eldestAge - memberAge;
    ageGaps.push({ name: member.entry.name, age: memberAge, gap: ageDifference });
    
    if (ageDifference < 10) {
      eldestCanBeParent = false;
    }
  }
  
  console.log(`📏 Age gaps from eldest:`);
  ageGaps.forEach(gap => {
    const status = gap.gap >= 10 ? '✅' : '❌';
    console.log(`  ${status} ${gap.name} (${gap.age}): ${gap.gap} years gap`);
  });
  
  if (eldestCanBeParent) {
    console.log(`✅ ELDEST CAN BE PARENT - 10+ year gap to everyone`);
  } else {
    console.log(`❌ ELDEST CANNOT BE PARENT - Some age gaps < 10 years`);
  }
  
  // Check if any other member could be parent
  console.log(`\n🔍 CHECKING OTHER POTENTIAL PARENTS:`);
  
  for (let i = 1; i < sortedByAge.length; i++) {
    const member = sortedByAge[i];
    const memberAge = member.entry.age || 0;
    const memberGender = member.entry.gender;
    
    console.log(`\n  Checking ${member.entry.name} (${memberAge}, ${memberGender || 'unknown'}):`);
    
    // Check age gaps to all other members
    let canBeParent = true;
    const gaps = [];
    
    for (let j = 0; j < sortedByAge.length; j++) {
      if (i === j) continue; // Skip self
      
      const otherMember = sortedByAge[j];
      const otherAge = otherMember.entry.age || 0;
      const ageDifference = memberAge - otherAge;
      gaps.push({ name: otherMember.entry.name, age: otherAge, gap: ageDifference });
      
      if (ageDifference < 10) {
        canBeParent = false;
      }
    }
    
    gaps.forEach(gap => {
      const status = gap.gap >= 10 ? '✅' : '❌';
      console.log(`    ${status} vs ${gap.name} (${gap.age}): ${gap.gap} years gap`);
    });
    
    if (canBeParent) {
      console.log(`    ✅ ${member.entry.name} COULD BE PARENT`);
    } else {
      console.log(`    ❌ ${member.entry.name} cannot be parent`);
    }
  }
  
  console.log(`\n🎯 DEBUG SUMMARY:`);
  console.log(`  - Total members: ${familyMembers.length}`);
  console.log(`  - Members with age: ${membersWithAge.length}`);
  console.log(`  - Eldest age: ${eldestAge}`);
  console.log(`  - Eldest can be parent: ${eldestCanBeParent}`);
  console.log(`  - Potential parents found: ${eldestCanBeParent ? 'At least 1 (eldest)' : '0'}`);
  
  return {
    totalMembers: familyMembers.length,
    membersWithAge: membersWithAge.length,
    eldestAge,
    eldestCanBeParent,
    ageGaps
  };
};
