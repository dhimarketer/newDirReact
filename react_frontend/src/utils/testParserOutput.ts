// Test script to see what the enhanced parser outputs
import { parseEnhancedQuery } from './enhancedSearchQueryParser';

async function testParserOutput() {
  console.log('🧪 Testing Enhanced Parser Output\n');
  
  const testQueries = [
    'john, london, main street',
    'john smith, blue villa, central park',
    'john, london, main street, ap',
  ];
  
  for (const query of testQueries) {
    console.log(`📝 Query: "${query}"`);
    
    try {
      const parsed = await parseEnhancedQuery(query);
      console.log('   Parsed result:');
      console.log('     filters:', parsed.filters);
      console.log('     fieldAssignments:', parsed.fieldAssignments);
      console.log('     hasWildcards:', parsed.hasWildcards);
      
      // Check if it's comma-separated
      const isCommaSeparated = (parsed.filters as any)._commaSeparated;
      console.log('     _commaSeparated:', isCommaSeparated);
      
      // Check specific fields
      console.log('     name field:', parsed.filters.name);
      console.log('     island field:', parsed.filters.island);
      console.log('     address field:', parsed.filters.address);
      
      console.log('   ──────────────────────────────────────');
      
    } catch (error) {
      console.error(`   ❌ Error parsing "${query}":`, error);
    }
  }
}

// Run the test
testParserOutput().catch(console.error);
