// 2025-01-28: Test file to debug enhanced search query parser
// Testing the specific search query that's failing: "gulhazaarumaage, s.+hithadhoo"

import { parseEnhancedQuery } from './enhancedSearchQueryParser';

// Test the specific failing query
const testQuery = async () => {
  console.log('🧪 Testing enhanced search query parser');
  console.log('Query: "gulhazaarumaage, s.+hithadhoo"');
  
  try {
    const result = await parseEnhancedQuery('gulhazaarumaage, s.+hithadhoo');
    
    console.log('=== PARSER RESULT ===');
    console.log('Query:', result.query);
    console.log('Filters:', result.filters);
    console.log('Field assignments:', result.fieldAssignments);
    console.log('Search terms:', result.searchTerms);
    console.log('Has wildcards:', result.hasWildcards);
    console.log('Is comma separated:', (result.filters as any)._commaSeparated);
    console.log('=== END PARSER RESULT ===');
    
    // Check if address and island fields are properly detected
    if (result.filters.address) {
      console.log('✅ Address field detected:', result.filters.address);
    } else {
      console.log('❌ Address field NOT detected');
    }
    
    if (result.filters.island) {
      console.log('✅ Island field detected:', result.filters.island);
    } else {
      console.log('❌ Island field NOT detected');
    }
    
    // Check if this should use AND logic
    if ((result.filters as any)._commaSeparated) {
      console.log('✅ Should use AND logic for comma-separated query');
    } else {
      console.log('❌ Should NOT use AND logic');
    }
    
  } catch (error) {
    console.error('❌ Parser error:', error);
  }
};

// Test other variations
const testVariations = async () => {
  const testCases = [
    'gulhazaarumaage, s. hithadhoo',
    'gulhazaarumaage,s.hithadhoo',
    'gulhazaarumaage, s.+hithadhoo',
    'gulhazaarumaage,s.+hithadhoo'
  ];
  
  console.log('\n🧪 Testing query variations:');
  
  for (const testCase of testCases) {
    console.log(`\n--- Testing: "${testCase}" ---`);
    try {
      const result = await parseEnhancedQuery(testCase);
      console.log('Filters:', result.filters);
      console.log('Address:', result.filters.address || 'NOT DETECTED');
      console.log('Island:', result.filters.island || 'NOT DETECTED');
    } catch (error) {
      console.error('Error:', error);
    }
  }
};

// Run tests
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testEnhancedParser = {
    testQuery,
    testVariations
  };
  
  console.log('🧪 Test functions available on window.testEnhancedParser');
  console.log('Run: window.testEnhancedParser.testQuery()');
  console.log('Run: window.testEnhancedParser.testVariations()');
}

export { testQuery, testVariations };
