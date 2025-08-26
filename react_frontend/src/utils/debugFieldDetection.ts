// Debug script for field detection - run this in browser console
import { parseEnhancedQuery } from './enhancedSearchQueryParser';

// Test field detection step by step
async function debugFieldDetection() {
  console.log('🔍 Debugging Field Detection Step by Step\n');
  
  const query = 'john, london';
  console.log(`📝 Query: "${query}"`);
  
  try {
    console.log('1️⃣ Calling parseEnhancedQuery...');
    const parsed = await parseEnhancedQuery(query);
    
    console.log('2️⃣ Parse result received:');
    console.log('   Raw result:', parsed);
    console.log('   Filters object:', parsed.filters);
    console.log('   Filter keys:', Object.keys(parsed.filters));
    console.log('   Filter count:', Object.keys(parsed.filters).length);
    
    console.log('3️⃣ Checking specific fields:');
    console.log('   name field:', parsed.filters.name);
    console.log('   island field:', parsed.filters.island);
    console.log('   address field:', parsed.filters.address);
    
    console.log('4️⃣ Checking internal flags:');
    console.log('   _commaSeparated:', (parsed.filters as any)._commaSeparated);
    
    console.log('5️⃣ Field assignments:');
    console.log('   fieldAssignments:', parsed.fieldAssignments);
    
    // Now test what the SearchBar logic would do
    console.log('\n6️⃣ Simulating SearchBar Logic:');
    
    const isCommaSeparated = (parsed.filters as any)._commaSeparated;
    console.log('   isCommaSeparated:', isCommaSeparated);
    
    if (Object.keys(parsed.filters).length > 0) {
      console.log('   ✅ Has specific filters - will use smart search');
    } else {
      console.log('   ❌ No specific filters - will fall back to general search');
      console.log('   ❌ This explains the 34 results!');
    }
    
  } catch (error) {
    console.error('❌ Error during parsing:', error);
  }
}

// Export for testing
export { debugFieldDetection };
