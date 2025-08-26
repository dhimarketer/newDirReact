// 2025-01-28: Test file for enhanced smart search functionality
// Demonstrates the improved field detection based on real database patterns

import { parseEnhancedQuery, formatEnhancedParsedQuery } from './enhancedSearchQueryParser';

/**
 * Test the enhanced smart search with various query formats
 */
export const testEnhancedSearch = async (): Promise<void> => {
  console.log('🧪 Testing Enhanced Smart Search Functionality\n');
  
  const testQueries = [
    'john, london, main street, ap',
    'john smith, blue villa, central park',
    'john* london* main* ap*',
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing Query: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      const parsed = await parseEnhancedQuery(query);
      
      console.log('📋 Parsed Result:');
      console.log(`   Raw Query: ${parsed.query}`);
      console.log(`   Has Wildcards: ${parsed.hasWildcards}`);
      console.log(`   Search Terms: [${parsed.searchTerms.join(', ')}]`);
      
      console.log('\n🎯 Field Assignments:');
      for (const assignment of parsed.fieldAssignments) {
        console.log(`   ${assignment.field}: "${assignment.term}" (${assignment.confidence}% - ${assignment.reason})`);
      }
      
      console.log('\n🔧 Final Filters:');
      for (const [key, value] of Object.entries(parsed.filters)) {
        if (value !== undefined) {
          console.log(`   ${key}: ${value}`);
        }
      }
      
      console.log('\n📝 Formatted Output:');
      console.log(`   ${formatEnhancedParsedQuery(parsed)}`);
      
    } catch (error) {
      console.error(`❌ Error parsing query: ${error}`);
    }
  }
  
  console.log('\n✅ Enhanced Search Testing Complete!');
};

/**
 * Test specific field detection scenarios
 */
export const testFieldDetection = async (): Promise<void> => {
  console.log('\n🔬 Testing Specific Field Detection Scenarios\n');
  
  const testCases = [
    // Political Parties
    { term: 'MDP', expected: 'party', description: 'Major political party' },
    { term: 'PPM', expected: 'party', description: 'Major political party' },
    { term: 'JP', expected: 'party', description: 'Major political party' },
    { term: 'msp', expected: 'party', description: 'Unknown party (should not match)' },
    
    // Addresses
    { term: 'blue villa', expected: 'address', description: 'Building type' },
    { term: 'main street', expected: 'address', description: 'Street name' },
    { term: 'apartment building', expected: 'address', description: 'Building type' },
    
    // Islands
    { term: 'london', expected: 'island', description: 'City name' },
    { term: 'central park', expected: 'island', description: 'Park name' },
    { term: 'k. london', expected: 'island', description: 'Atoll-prefixed city' },
    
    // Names
    { term: 'john', expected: 'name', description: 'Common name' },
    { term: 'john smith', expected: 'name', description: 'Double name' },
    { term: 'ibrahim', expected: 'name', description: 'Common first name' },
    
    // Numbers
    { term: '1234567', expected: 'contact', description: '7-digit phone number' },
    { term: '123456789', expected: 'nid', description: '9-digit ID' },
    
    // Gender
    { term: 'm', expected: 'gender', description: 'Male gender code' },
    { term: 'f', expected: 'gender', description: 'Female gender code' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: "${testCase.term}" (${testCase.description})`);
    
    try {
      const parsed = await parseEnhancedQuery(testCase.term);
      const fieldAssignment = parsed.fieldAssignments[0];
      
      if (fieldAssignment && fieldAssignment.field === testCase.expected) {
        console.log(`   ✅ SUCCESS: Correctly detected as ${fieldAssignment.field} (${fieldAssignment.confidence}%)`);
        console.log(`      Reason: ${fieldAssignment.reason}`);
      } else if (fieldAssignment) {
        console.log(`   ⚠️  PARTIAL: Detected as ${fieldAssignment.field} but expected ${testCase.expected}`);
        console.log(`      Reason: ${fieldAssignment.reason}`);
      } else {
        console.log(`   ❌ FAILED: No field detected, expected ${testCase.expected}`);
      }
      
    } catch (error) {
      console.error(`   ❌ ERROR: ${error}`);
    }
  }
};

/**
 * Performance test for large queries
 */
export const testPerformance = async (): Promise<void> => {
  console.log('\n⚡ Performance Testing\n');
  
  const largeQuery = 'john, smith, london, main street, central park, blue villa, apartment, building, house, flat, room, floor, block, area, zone, district, ward, sector, north, south, east, west, upper, lower, inner, outer, new, old, big, small, red, green, blue, white, black, yellow, orange, purple, pink, brown, gray';
  
  console.log(`📊 Large Query Length: ${largeQuery.length} characters`);
  console.log(`📝 Number of Terms: ${largeQuery.split(',').length}`);
  
  const startTime = performance.now();
  
  try {
    const parsed = await parseEnhancedQuery(largeQuery);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Parsing Time: ${duration.toFixed(2)}ms`);
    console.log(`🎯 Fields Detected: ${parsed.fieldAssignments.length}`);
    console.log(`🔍 Search Terms: ${parsed.searchTerms.length}`);
    
    // Show first few field assignments
    console.log('\n📋 First 5 Field Assignments:');
    parsed.fieldAssignments.slice(0, 5).forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.field}: "${assignment.term}" (${assignment.confidence}%)`);
    });
    
  } catch (error) {
    console.error(`❌ Performance test failed: ${error}`);
  }
};

// Export test functions
export default {
  testEnhancedSearch,
  testFieldDetection,
  testPerformance
};
