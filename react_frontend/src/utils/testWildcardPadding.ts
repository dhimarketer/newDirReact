// 2025-01-28: Test script for wildcard padding functionality
// Demonstrates how user queries are automatically padded with wildcards for better search flexibility

import { parseEnhancedQuery, formatEnhancedParsedQuery } from './enhancedSearchQueryParser';

/**
 * Test the wildcard padding functionality
 */
export const testWildcardPadding = async (): Promise<void> => {
  console.log('🧪 Testing Wildcard Padding Functionality\n');
  
  const testQueries = [
    'john, london, main street, ap',
    'john smith, blue villa, central park',
    'john london, main street',
    'example london, main street',
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing Query: "${query}"`);
    console.log('─'.repeat(60));
    
    try {
      const parsed = await parseEnhancedQuery(query);
      
      console.log('📋 Parsed Result:');
      console.log(`   Raw Query: ${parsed.query}`);
      console.log(`   Has Wildcards: ${parsed.hasWildcards}`);
      console.log(`   Comma Separated: ${(parsed.filters as any)._commaSeparated || false}`);
      
      console.log('\n🎯 Field Assignments with Wildcard Padding:');
      for (const assignment of parsed.fieldAssignments) {
        console.log(`   ${assignment.field}: "${assignment.term}" → "${(parsed.filters as any)[assignment.field]}"`);
        console.log(`      Confidence: ${assignment.confidence}%`);
        console.log(`      Reason: ${assignment.reason}`);
      }
      
      console.log('\n🔧 Final Filters (with wildcards):');
      for (const [key, value] of Object.entries(parsed.filters)) {
        if (value !== undefined && key !== '_commaSeparated') {
          console.log(`   ${key}: ${value}`);
        }
      }
      
      if (parsed.searchTerms.length > 0) {
        console.log(`\n📝 Search Terms: [${parsed.searchTerms.join(', ')}]`);
      }
      
      console.log('\n📝 Formatted Output:');
      console.log(`   ${formatEnhancedParsedQuery(parsed)}`);
      
    } catch (error) {
      console.error(`❌ Error parsing query: ${error}`);
    }
  }
  
  console.log('\n✅ Wildcard Padding Testing Complete!');
};

/**
 * Test specific scenarios
 */
export const testSpecificScenarios = async (): Promise<void> => {
  console.log('\n🎯 Testing Specific Scenarios\n');
  
  // Scenario 1: "john, london" with wildcard padding
  console.log('📝 Scenario 1: "john, london"');
  console.log('Expected: name="*john*", island="*london*"');
  
  const scenario1 = await parseEnhancedQuery('john, london');
  console.log('   Result:');
  for (const assignment of scenario1.fieldAssignments) {
    const actualValue = (scenario1.filters as any)[assignment.field];
    console.log(`     ${assignment.field}: "${assignment.term}" → "${actualValue}"`);
  }
  
  // Scenario 2: Mixed format with wildcard padding
  console.log('\n📝 Scenario 2: "john smith, blue villa, central park"');
  console.log('Expected: name="*john* *smith*", address="*blue* *villa*", address="*central* *park*"');
  
  const scenario2 = await parseEnhancedQuery('john smith, blue villa, central park');
  console.log('   Result:');
  for (const assignment of scenario2.fieldAssignments) {
    const actualValue = (scenario2.filters as any)[assignment.field];
    console.log(`     ${assignment.field}: "${assignment.term}" → "${actualValue}"`);
  }
  
  // Scenario 3: Already wildcarded terms
  console.log('\n📝 Scenario 3: "john*, *london*"');
  console.log('Expected: No additional padding, preserve existing wildcards');
  
  const scenario3 = await parseEnhancedQuery('john*, *london*');
  console.log('   Result:');
  for (const assignment of scenario3.fieldAssignments) {
    const actualValue = (scenario3.filters as any)[assignment.field];
    console.log(`     ${assignment.field}: "${assignment.term}" → "${actualValue}"`);
  }
  
  console.log('\n✅ Specific Scenarios Testing Complete!');
};

/**
 * Performance test for wildcard padding
 */
export const testPerformance = async (): Promise<void> => {
  console.log('\n⚡ Performance Testing with Wildcard Padding\n');
  
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
    
    // Show first few field assignments with wildcard padding
    console.log('\n📋 First 5 Field Assignments (with wildcards):');
    parsed.fieldAssignments.slice(0, 5).forEach((assignment, index) => {
      const actualValue = (parsed.filters as any)[assignment.field];
      console.log(`   ${index + 1}. ${assignment.field}: "${assignment.term}" → "${actualValue}"`);
    });
    
    // Count how many terms were padded
    const paddedCount = parsed.fieldAssignments.filter(assignment => 
      (parsed.filters as any)[assignment.field] !== assignment.term
    ).length;
    
    console.log(`\n🔧 Wildcard Padding Summary:`);
    console.log(`   Total fields: ${parsed.fieldAssignments.length}`);
    console.log(`   Padded fields: ${paddedCount}`);
    console.log(`   Unpadded fields: ${parsed.fieldAssignments.length - paddedCount}`);
    
  } catch (error) {
    console.error(`❌ Performance test failed: ${error}`);
  }
};

// Export test functions
export default {
  testWildcardPadding,
  testSpecificScenarios,
  testPerformance
};
