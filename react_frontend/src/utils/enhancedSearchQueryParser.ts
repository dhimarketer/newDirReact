// 2025-01-29: SIMPLIFIED - Frontend sends raw queries, backend handles smart field detection
// Users enter terms in any order (e.g., "ali, futha, male") and backend determines
// which field each term belongs to by running actual database queries

import { SearchFilters } from '../types/directory';

export interface ParsedQuery {
  query: string;
  filters: Partial<SearchFilters>;
  hasWildcards: boolean;
  searchTerms: string[];
  fieldAssignments: FieldAssignment[];
}

export interface FieldAssignment {
  term: string;
  field: keyof SearchFilters;
  confidence: number;
  reason: string;
  paddedTerm: string;
}

/**
 * NEW STRATEGY: Database-driven field detection
 * Users enter terms in any order: "ali, futha, male"
 * System runs database queries to determine which field each term belongs to
 * Benefits: No need to remember field names, intelligent field assignment
 */
export const parseEnhancedQuery = async (rawQuery: string): Promise<ParsedQuery> => {
  const query = rawQuery.trim();
  if (!query) {
    return {
      query: '',
      filters: {},
      hasWildcards: false,
      searchTerms: [],
      fieldAssignments: []
    };
  }

  // Split by commas and clean each term
  const terms = query.split(',').map(term => term.trim()).filter(term => term.length > 0);
  const filters: Partial<SearchFilters> = {} as any;
  const searchTerms: string[] = [];
  const fieldAssignments: FieldAssignment[] = [];
  let hasWildcards = false;
  let usedFields = new Set<string>();

  console.log('🔍 SIMPLIFIED STRATEGY: Frontend sends raw terms, backend handles smart field detection:', terms);
  console.log('🔍 NOTE: Multi-word terms like "happy night" are preserved as complete phrases');

  // Process each term independently
  for (const term of terms) {
    if (!term) continue;

    console.log(`   Processing term: "${term}"`);

    // Check if term follows field:value format (backward compatibility)
    const explicitFieldMatch = parseExplicitFieldTerm(term);
    
    if (explicitFieldMatch && !usedFields.has(explicitFieldMatch.field)) {
      // User explicitly specified field - use it directly
      const paddedTerm = `*${explicitFieldMatch.term}*`;
      
      (filters as any)[explicitFieldMatch.field] = paddedTerm;
      usedFields.add(explicitFieldMatch.field);
      
      fieldAssignments.push({
        term: explicitFieldMatch.term,
        field: explicitFieldMatch.field,
        confidence: 100,
        reason: `User explicitly specified: ${explicitFieldMatch.field}`,
        paddedTerm: paddedTerm
      });
      
      console.log(`   ✅ "${term}" → ${explicitFieldMatch.field}:${explicitFieldMatch.term} (explicit)`);
      
      if (explicitFieldMatch.term.includes('*') || explicitFieldMatch.term.includes('%')) {
        hasWildcards = true;
      }
    } else if (explicitFieldMatch && usedFields.has(explicitFieldMatch.field)) {
      // Field already used - add to general search
      console.log(`   ❌ Field ${explicitFieldMatch.field} already used for "${term}" - adding to general search`);
      searchTerms.push(term);
    } else {
      // No explicit field - send to backend for smart field detection
      console.log(`   🔍 No explicit field for "${term}" - sending to backend for smart detection`);
      searchTerms.push(term);
    }
  }

  // Handle remaining search terms - these will trigger smart field detection in backend
  if (searchTerms.length > 0) {
    // 2025-01-29: FIXED - Preserve comma separation for backend smart field detection
    // Join with commas to maintain term boundaries for the backend parser
    filters.query = searchTerms.join(', ');
    console.log(`   🔍 Smart search terms: "${filters.query}" - backend will detect fields and apply filters`);
  }

  // Mark for backend logic - use AND logic only if we have commas (multi-field search)
  // No comma = single field search, Comma = multi-field search with AND logic
  if (rawQuery.includes(',')) {
    (filters as any).useAndLogic = true;
    // 2025-01-29: ENABLED - Smart field detection for comma-separated queries
    (filters as any).enableSmartFieldDetection = true;
    console.log(`   🔍 Multi-field search detected - enabling smart field detection`);
  }
  // (filters as any).enableSmartFieldDetection = true;

  console.log('   Final result:', { filters, fieldAssignments, searchTerms });
  
  return { query: rawQuery, filters, hasWildcards, searchTerms, fieldAssignments };
};

/**
 * Parse explicit field:term format (backward compatibility)
 * Format: "name:ali", "address:futha", "island:male"
 */
const parseExplicitFieldTerm = (term: string): { field: keyof SearchFilters; term: string } | null => {
  if (!term.includes(':')) {
    return null;
  }

  const parts = term.split(':');
  if (parts.length !== 2) {
    return null;
  }

  const field = parts[0].trim().toLowerCase();
  const value = parts[1].trim();

  if (!value) {
    return null;
  }

  const fieldMapping: Record<string, keyof SearchFilters> = {
    'name': 'name', 'n': 'name',
    'address': 'address', 'addr': 'address', 'a': 'address',
    'island': 'island', 'i': 'island',
    'atoll': 'atoll', 'at': 'atoll',
    'party': 'party', 'p': 'party',
    'contact': 'contact', 'phone': 'contact', 'tel': 'contact', 'c': 'contact',
    'nid': 'nid', 'id': 'nid',
    'profession': 'profession', 'prof': 'profession', 'job': 'profession',
    'gender': 'gender', 'sex': 'gender', 'g': 'gender',
    'min_age': 'min_age', 'max_age': 'max_age',
    'remark': 'remark', 'pep_status': 'pep_status'
  };

  const mappedField = fieldMapping[field];
  if (!mappedField) {
    return null;
  }

  return { field: mappedField, term: value };
};

/**
 * REMOVED: Fake database-driven field detection
 * This logic has been moved to the Django backend where it belongs
 * The backend will now run real database queries to detect fields
 */

/**
 * OLD FIELD DETECTION LOGIC - REMOVED
 * The new strategy uses explicit field:term format instead of guessing fields
 * This eliminates the complexity and unpredictability of field detection
 */

/**
 * OLD FIELD DETECTION HELPER FUNCTIONS - REMOVED
 * These complex field detection functions are no longer needed with the new strategy
 * The new approach uses explicit field:term format for predictable, reliable results
 */







/**
 * Test function for debugging field:term parsing
 */
export const testFieldDetection = (terms: string[]) => {
  console.log('🧪 Testing field:term parsing:');
  terms.forEach(term => {
    const result = parseExplicitFieldTerm(term);
    console.log(`   "${term}" → ${result ? `${result.field}:${result.term}` : 'no field:term format'}`);
  });
};

/**
 * Test the complete parser with a specific term
 */
export const testParserWithTerm = async (term: string) => {
  console.log(`🧪 Testing simplified parser with term: "${term}"`);
  const result = await parseEnhancedQuery(term);
  console.log('Parser result:', result);
  console.log('Explicit field assignments:', result.fieldAssignments);
  console.log('Smart search terms (for backend):', result.searchTerms);
  console.log('Final filters:', result.filters);
  return result;
};

/**
 * Format the parsed query for display
 */
export const formatEnhancedParsedQuery = (parsed: ParsedQuery): string => {
  const parts: string[] = [];
  
  for (const assignment of parsed.fieldAssignments) {
    parts.push(`${assignment.field}: ${assignment.term} (${assignment.confidence}%)`);
  }
  
  if (parsed.filters.query) parts.push(`General: ${parsed.filters.query}`);
  
  return parts.join(', ');
};