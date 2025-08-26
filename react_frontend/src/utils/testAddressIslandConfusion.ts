// Test script for address vs island confusion - run this in browser console
import { parseEnhancedQuery } from './enhancedSearchQueryParser';

// Test to ensure address and island detection are not confused
async function testAddressIslandConfusion() {
  console.log('🧪 Testing Address vs Island Confusion\n');
  
  const testQueries = [
    'blue villa, london',
    'london, blue villa',
    'main street, central park',
    'central park, main street',
    'apartment building, north zone',
    'north zone, apartment building'
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
      
      // Verify field assignments are correct
      console.log('   Field Assignment Analysis:');
      for (const assignment of parsed.fieldAssignments) {
        console.log(`     - "${assignment.term}" → ${assignment.field} (${assignment.confidence}%)`);
      }
      
      console.log('   ──────────────────────────────────────');
      
    } catch (error) {
      console.error(`   ❌ Error parsing "${query}":`, error);
    }
  }
}

// Test specific edge cases
function testEdgeCases() {
  console.log('\n🔍 Testing Edge Cases\n');
  
  const edgeCases = [
    'sina london',      // Should be address (multi-word)
    'london',           // Should be island (exact match)
    'k. london',        // Should be island (atoll prefix)
    'blue villa',       // Should be address (multi-word)
    'main street',      // Should be address (multi-word)
    'apartment building' // Should be address (suffix pattern)
  ];
  
  console.log('📝 Expected behavior for each term:');
  for (const term of edgeCases) {
    console.log(`   "${term}":`);
    
    if (term.includes(' ')) {
      console.log(`     - Multi-word phrase: should be detected as ADDRESS`);
    } else if (term === 'london') {
      console.log(`     - Single word, exact island match: should be detected as ISLAND`);
    } else if (term.startsWith('k. ')) {
      console.log(`     - Atoll prefix: should be detected as ISLAND`);
    } else if (term.endsWith('aage') || term.endsWith('illa') || term.endsWith('eege') || term.endsWith('ge') || term.endsWith('maa')) {
      console.log(`     - Maldivian suffix pattern: should be detected as ADDRESS`);
    } else {
      console.log(`     - Single word: could be name or address depending on context`);
    }
  }
}

// Export for testing
export { testAddressIslandConfusion, testEdgeCases };
