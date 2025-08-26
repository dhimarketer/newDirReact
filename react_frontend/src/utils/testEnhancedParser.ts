// 2025-01-28: Test file for simplified enhanced search parser

import { parseEnhancedQuery, testFieldDetection } from './enhancedSearchQueryParser';

// Test the simplified parser with a generic example
const testQuery = async () => {
  console.log('🧪 Testing simplified search parser with: "john, london, main street"');
  
  const result = await parseEnhancedQuery('john, london, main street');
  
  console.log('📊 Parser Result:');
  console.log('   Query:', result.query);
  console.log('   Filters:', result.filters);
  console.log('   Field Assignments:', result.fieldAssignments);
  console.log('   Search Terms:', result.searchTerms);
  console.log('   Has Wildcards:', result.hasWildcards);
  
  return result;
};

// Test individual field detection
const testIndividualFields = () => {
  console.log('\n🧪 Testing individual field detection:');
  
  const terms = ['john', 'london', 'main street', 'mdp', 'male', 'blue villa', 'm', '>25', '1234567'];
  
  testFieldDetection(terms);
};

// Run tests
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testSearchParser = testQuery;
  (window as any).testFieldDetection = testIndividualFields;
  
  console.log('🧪 Search parser tests loaded. Use testSearchParser() or testFieldDetection() in console.');
} else {
  // Node environment
  testQuery().then(() => {
    testIndividualFields();
  });
}

export { testQuery, testIndividualFields };
