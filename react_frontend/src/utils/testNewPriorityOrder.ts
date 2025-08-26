// Test script for new field detection priority order - run this in browser console
import { parseEnhancedQuery } from './enhancedSearchQueryParser';

// Test the new priority order: Party → Island → Address → Name
async function testNewPriorityOrder() {
  console.log('🧪 Testing New Field Detection Priority Order\n');
  console.log('📋 Priority: Party → Island → Address → Name (least to most common)\n');
  
  const testQueries = [
    'JP, blue villa',
    'london, blue villa',
    'blue villa, london',
    'john, blue villa',
    'blue villa, john',
    'london, john'
  ];
  
  for (const query of testQueries) {
    console.log(`📝 Query: "${query}"`);
    
    try {
      const parsed = await parseEnhancedQuery(query);
      console.log('   Parsed result:');
      console.log('     filters:', parsed.filters);
      console.log('     fieldAssignments:', parsed.fieldAssignments);
      console.log('     _commaSeparated:', (parsed.filters as any)._commaSeparated);
      
      // Check specific fields
      console.log('     party field:', parsed.filters.party);
      console.log('     island field:', parsed.filters.island);
      console.log('     address field:', parsed.filters.address);
      console.log('     name field:', parsed.filters.name);
      
      // Verify priority order in field assignments
      console.log('   Field Assignment Priority Analysis:');
      for (const assignment of parsed.fieldAssignments) {
        console.log(`     - "${assignment.term}" → ${assignment.field} (${assignment.confidence}%)`);
      }
      
      console.log('   ──────────────────────────────────────');
      
    } catch (error) {
      console.error(`   ❌ Error parsing "${query}":`, error);
    }
  }
}

// Test specific priority scenarios
function testPriorityScenarios() {
  console.log('\n🔍 Testing Priority Scenarios\n');
  
  const scenarios = [
    {
      query: 'MDP, london',
      expected: {
        'MDP': 'party',      // 1st priority - least common
        'london': 'island'   // 2nd priority - less common
      }
    },
    {
      query: 'london, blue villa',
      expected: {
        'london': 'island',        // 2nd priority - less common
        'blue villa': 'address'    // 3rd priority - more common
      }
    },
    {
      query: 'blue villa, john',
      expected: {
        'blue villa': 'address', // 3rd priority - more common
        'john': 'name'           // 4th priority - most common (fallback)
      }
    },
    {
      query: 'JP, hithadhoo, blue villa, john',
      expected: {
        'JP': 'party',           // 1st priority
        'hithadhoo': 'island',   // 2nd priority
        'blue villa': 'address', // 3rd priority
        'john': 'name'           // 4th priority
      }
    }
  ];
  
  console.log('📝 Expected priority behavior for each scenario:');
  for (const scenario of scenarios) {
    console.log(`\n   Query: "${scenario.query}"`);
    for (const [term, expectedField] of Object.entries(scenario.expected)) {
      console.log(`     "${term}" → should be ${expectedField}`);
    }
  }
}

// Export for testing
export { testNewPriorityOrder, testPriorityScenarios };
