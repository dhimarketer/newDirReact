// Test script for address detection - run this in browser console
import { parseEnhancedQuery } from './enhancedSearchQueryParser';

// Test address detection specifically
async function testAddressDetection() {
  console.log('🧪 Testing Address Detection\n');
  
  const testQueries = [
    'blue villa, london',
    'blue villa',
    'main street, central park',
    'apartment building, north zone',
    'red house, south district',
    'blue villa',
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
      console.log('     name field:', parsed.filters.name);
      console.log('     address field:', parsed.filters.address);
      console.log('     island field:', parsed.filters.island);
      
      console.log('   ──────────────────────────────────────');
      
    } catch (error) {
      console.error(`   ❌ Error parsing "${query}":`, error);
    }
  }
}

// Test the detectAddress function directly
function testDetectAddressDirectly() {
  console.log('\n🔍 Testing detectAddress Function Directly\n');
  
  // We need to access the function from the module
  // This is a test to see what the function should return
  
  const testTerms = [
    'blue villa',
    'main street',
    'apartment building',
    'john',
    'london'
  ];
  
  console.log('📝 Expected behavior for each term:');
  for (const term of testTerms) {
    console.log(`   "${term}":`);
    
    if (term.includes(' ')) {
      console.log(`     - Multi-word phrase: should be detected as address`);
    } else if (term.endsWith('aage') || term.endsWith('illa') || term.endsWith('eege') || term.endsWith('ge') || term.endsWith('maa')) {
      console.log(`     - Maldivian suffix pattern: should be detected as address`);
    } else if (term === 'london') {
      console.log(`     - Island name: should be detected as island`);
    } else {
      console.log(`     - Single word: could be name or address depending on context`);
    }
  }
}

// Export for testing
export { testAddressDetection, testDetectAddressDirectly };
