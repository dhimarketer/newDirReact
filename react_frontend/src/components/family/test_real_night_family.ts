// Test script to verify the new co-parent detection logic for "real night" family

interface FamilyMember {
  entry: {
    pid: number;
    name: string;
    age: number;
    gender: string;
  };
}

// Mock data for "real night" family
const realNightFamily: FamilyMember[] = [
  {
    entry: {
      pid: 158431,
      name: "abdul latheef moosa",
      age: 75,
      gender: "M"
    }
  },
  {
    entry: {
      pid: 164015,
      name: "abida ibrahim", 
      age: 74,
      gender: "F"
    }
  },
  {
    entry: {
      pid: 279987,
      name: "sithara adam",
      age: 57,
      gender: "F"
    }
  },
  {
    entry: {
      pid: 200612,
      name: "anil adam",
      age: 42,
      gender: "M"
    }
  }
];

// Test the new logic
function testRealNightFamily() {
  console.log("🧪 TESTING NEW CO-PARENT DETECTION LOGIC");
  console.log("📊 Family: real night, K. Male");
  console.log("=" * 60);
  
  // Sort by age (oldest first)
  const sortedByAge = [...realNightFamily].sort((a, b) => b.entry.age - a.entry.age);
  
  console.log("📈 Age distribution:");
  sortedByAge.forEach((member, index) => {
    console.log(`  ${index + 1}. ${member.entry.name}: ${member.entry.age} years (${member.entry.gender})`);
  });
  
  const potentialParents: FamilyMember[] = [];
  const children: FamilyMember[] = [];
  
  // Step 1: Check if eldest can be parent to children
  if (sortedByAge.length > 0) {
    const eldest = sortedByAge[0];
    const eldestAge = eldest.entry.age;
    
    console.log(`\n🔍 STEP 1: Checking if eldest ${eldest.entry.name} (${eldestAge}) can be parent to children`);
    
    // Find potential children (members with 10+ year age gap from eldest)
    const potentialChildren: FamilyMember[] = [];
    let eldestCanBeParent = false;
    
    for (let i = 1; i < sortedByAge.length; i++) {
      const member = sortedByAge[i];
      const memberAge = member.entry.age;
      const ageDifference = eldestAge - memberAge;
      
      console.log(`  📏 ${eldest.entry.name} (${eldestAge}) vs ${member.entry.name} (${memberAge}): gap = ${ageDifference} years ${ageDifference >= 10 ? '✅' : '❌'}`);
      
      if (ageDifference >= 10) {
        potentialChildren.push(member);
        eldestCanBeParent = true;
      }
    }
    
    if (eldestCanBeParent) {
      potentialParents.push(eldest);
      console.log(`    ✅ ${eldest.entry.name} can be parent to ${potentialChildren.length} children`);
      
      // Add potential children to children array
      children.push(...potentialChildren);
      console.log(`    👶 Added children:`, potentialChildren.map(c => c.entry.name));
      
      // Add remaining members (those without 10+ year gap) to children as well
      const remainingMembers = sortedByAge.filter(member => 
        member !== eldest && !potentialChildren.includes(member)
      );
      children.push(...remainingMembers);
      console.log(`    👶 Added remaining members to children:`, remainingMembers.map(m => m.entry.name));
    } else {
      console.log(`    ❌ ${eldest.entry.name} cannot be parent - no children with 10+ year gap`);
    }
  }
  
  // Step 2: Find co-parent among remaining members who can also parent the children
  if (potentialParents.length === 1) {
    const firstParent = potentialParents[0];
    
    console.log(`\n🔍 STEP 2: Looking for co-parent (can parent the same children as ${firstParent.entry.name})`);
    
    // Look for co-parent among remaining members who can parent the children
    const remainingMembers = sortedByAge.filter(member => 
      !potentialParents.includes(member)
    );
    
    let bestCoParent = null;
    
    for (const member of remainingMembers) {
      const memberAge = member.entry.age;
      
      console.log(`  🔍 Checking ${member.entry.name} (${memberAge}, ${member.entry.gender}) as potential co-parent`);
      
      // Check if this member can parent the same children as the first parent
      let canBeCoParent = true;
      for (const child of children) {
        const childAge = child.entry.age;
        const ageDifference = memberAge - childAge;
        
        console.log(`    📏 ${member.entry.name} (${memberAge}) vs ${child.entry.name} (${childAge}): gap = ${ageDifference} years ${ageDifference >= 10 ? '✅' : '❌'}`);
        
        if (ageDifference < 10) {
          canBeCoParent = false;
          console.log(`      ❌ Cannot be parent to ${child.entry.name} - age gap too small`);
          break;
        }
      }
      
      if (canBeCoParent) {
        bestCoParent = member;
        console.log(`    ✅ ${member.entry.name} (${memberAge}) can be co-parent to all children`);
        break;
      }
    }
    
    if (bestCoParent) {
      potentialParents.push(bestCoParent);
      // Remove co-parent from children array
      const coParentIndex = children.findIndex(c => c.entry.pid === bestCoParent.entry.pid);
      if (coParentIndex !== -1) {
        children.splice(coParentIndex, 1);
      }
      console.log(`💑 ${bestCoParent.entry.name} added as co-parent`);
    } else {
      console.log(`❌ No suitable co-parent found`);
    }
  }
  
  console.log(`\n🎯 FINAL RESULT:`);
  console.log(`  Parents:`, potentialParents.map(p => ({ name: p.entry.name, age: p.entry.age, gender: p.entry.gender })));
  console.log(`  Children:`, children.map(c => ({ name: c.entry.name, age: c.entry.age, gender: c.entry.gender })));
  console.log(`  Total Parents: ${potentialParents.length}`);
  console.log(`  Total Children: ${children.length}`);
  
  return { potentialParents, children };
}

// Run the test
const result = testRealNightFamily();

// Expected result:
// Parents: abdul latheef moosa (75M), abida ibrahim (74F)
// Children: sithara adam (57F), anil adam (42M)
