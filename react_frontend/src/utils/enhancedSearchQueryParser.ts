// 2025-01-28: Simplified smart search query parser - clean and effective field detection
// Each comma-separated term is treated as a potential field with wildcard padding

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
 * Simplified smart search query parser
 * Each comma-separated term is analyzed independently for field detection
 * Uses wildcard padding (*term*) for flexible searching
 * Prevents duplicate field assignments in same query
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

  console.log('🔍 Simplified Parser: Processing terms:', terms);

  // Process each term independently
  for (const term of terms) {
    if (!term) continue;

    console.log(`   Analyzing term: "${term}"`);

    // Detect which field this term belongs to
    const fieldMatch = detectField(term);
    
    if (fieldMatch && !usedFields.has(fieldMatch.field)) {
      // Apply wildcard padding for flexible searching
      const paddedTerm = `*${term}*`;
      
      // Assign to specific field
      (filters as any)[fieldMatch.field] = paddedTerm;
      usedFields.add(fieldMatch.field);
      
      fieldAssignments.push({
        term: term,
        field: fieldMatch.field,
        confidence: fieldMatch.confidence,
        reason: fieldMatch.reason,
        paddedTerm: paddedTerm
      });
      
      console.log(`   ✅ "${term}" → ${fieldMatch.field} (${paddedTerm})`);
      
      // Check if term contains wildcards
      if (term.includes('*') || term.includes('%')) {
        hasWildcards = true;
      }
    } else {
      if (!fieldMatch) {
        console.log(`   ❌ No field detected for "${term}"`);
      } else {
        console.log(`   ❌ Field ${fieldMatch.field} already used for "${term}"`);
      }
      // Add to general search terms
      searchTerms.push(term);
    }
  }

  // Handle remaining search terms
  if (searchTerms.length > 0) {
    filters.query = searchTerms.join(' ');
  }

  // Mark as comma-separated query for backend AND logic
  (filters as any)._commaSeparated = true;

  console.log('   Final result:', { filters, fieldAssignments, searchTerms });
  
  return { query: rawQuery, filters, hasWildcards, searchTerms, fieldAssignments };
};

/**
 * Simple field detection with priority-based matching
 * Returns the best field match for a given term
 */
const detectField = (term: string): { field: keyof SearchFilters; confidence: number; reason: string } | null => {
  const cleanTerm = term.toLowerCase();
  
  // 1. Gender (specific codes) - highest priority
  if (['m', 'f'].includes(cleanTerm)) {
    return { field: 'gender', confidence: 100, reason: 'Gender code (M/F)' };
  }
  
  // 2. Age search
  if (cleanTerm.startsWith('>') && /^\d+$/.test(cleanTerm.substring(1))) {
    return { field: 'min_age', confidence: 100, reason: 'Age search with > operator' };
  }
  
  // 3. Phone number
  if (/^\d{7}$/.test(term)) {
    return { field: 'contact', confidence: 95, reason: '7-digit phone number' };
  }
  
  // 4. Address (check before party to avoid conflicts)
  if (isAddress(cleanTerm)) {
    return { field: 'address', confidence: 85, reason: 'Address pattern detected' };
  }
  
  // 5. Political Party (after address to avoid conflicts)
  if (isPoliticalParty(cleanTerm)) {
    return { field: 'party', confidence: 95, reason: 'Political party detected' };
  }
  
  // 6. Island (after address to avoid conflicts)
  if (isIsland(cleanTerm)) {
    return { field: 'island', confidence: 90, reason: 'Island name detected' };
  }
  
  // 7. Name (fallback - most common)
  if (isName(cleanTerm)) {
    return { field: 'name', confidence: 70, reason: 'Likely a person name' };
  }
  
  return null;
};

/**
 * Political party detection
 */
const isPoliticalParty = (term: string): boolean => {
  const parties = [
    'mdp', 'ppm', 'jp', 'mda', 'mnp', 'ap', 'democrats', 'pnc', 'mtd',
    'maldivian democratic party', 'progressive party of maldives', 'jumhooree party',
    'maldives development alliance', 'maldives national party', 'adhaalath party',
    'the democrats', 'peoples national congress', 'maldives thirdway democrats'
  ];
  
  return parties.some(party => 
    term === party || term.includes(party) || party.includes(term)
  );
};

/**
 * Island detection
 */
const isIsland = (term: string): boolean => {
  const cleanTerm = term.toLowerCase().trim();
  
  // Check exact matches first
  const islands = [
    'male', 'hithadhoo', 'thinadhoo', 'goidhoo', 'hulhumale', 'addu', 'fuvahmulah',
    'kulhudhuffushi', 'naifaru', 'mahibadhoo', 'villingili', 'gan', 'maradhoo',
    'feydhoo', 'habaruge', 'maafushi'
  ];
  
  if (islands.includes(cleanTerm)) return true;
  
  // Check atoll prefixes with dots and optional spaces
  const atollPrefixes = [
    'k.', 's.', 'hdh.', 'gdh.', 'lh.', 'ha.', 'adh.', 'aa.', 'b.', 'r.', 
    'sh.', 'th.', 'v.', 'm.', 'n.', 'l.', 'gn.', 'ga.', 'dh.', 'f.'
  ];
  
  // Check if term starts with any atoll prefix
  for (const prefix of atollPrefixes) {
    if (cleanTerm.startsWith(prefix)) {
      // Check if there's an island name after the prefix
      const islandPart = cleanTerm.substring(prefix.length).trim();
      if (islandPart.length > 0) {
        return true;
      }
    }
  }
  
  // Check for atoll prefixes with spaces (e.g., "s. hithadhoo")
  for (const prefix of atollPrefixes) {
    const prefixWithoutDot = prefix.replace('.', '');
    if (cleanTerm.startsWith(prefixWithoutDot + ' ') || cleanTerm.startsWith(prefixWithoutDot + '+')) {
      const islandPart = cleanTerm.substring(prefixWithoutDot.length + 1).trim();
      if (islandPart.length > 0) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Address detection
 */
const isAddress = (term: string): boolean => {
  const cleanTerm = term.toLowerCase().trim();
  
  // Multi-word phrases are usually addresses
  if (cleanTerm.includes(' ') && cleanTerm.split(' ').length >= 2) {
    return true;
  }
  
  // Common Maldivian address suffixes
  const addressSuffixes = [
    'ge', 'aage', 'illa', 'eege', 'maa', 'villa', 'hotel', 'resort', 'guesthouse',
    'building', 'complex', 'center', 'centre', 'office', 'shop', 'store'
  ];
  
  // Check if term ends with any address suffix
  for (const suffix of addressSuffixes) {
    if (cleanTerm.endsWith(suffix)) {
      return true;
    }
  }
  
  // Check for common Maldivian address patterns
  const addressPatterns = [
    /^[a-z]+(?:ge|aage|illa|eege|maa|villa)$/i,  // Single word with address suffix
    /^[a-z]+\s+[a-z]+/i,  // Two or more words
    /^[a-z]+\d+[a-z]*/i,  // Word with numbers (e.g., "building123")
  ];
  
  for (const pattern of addressPatterns) {
    if (pattern.test(cleanTerm)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Name detection (fallback)
 */
const isName = (term: string): boolean => {
  // Names are usually 3-50 characters, alphabetic
  if (!/^[a-z]+$/i.test(term) || term.length < 3 || term.length > 50) {
    return false;
  }
  
  // Avoid obvious non-name words
  const nonNames = [
    'council', 'society', 'corporation', 'limited', 'association', 'health',
    'post', 'centre', 'travel', 'tours', 'school', 'college', 'university'
  ];
  
  return !nonNames.some(nonName => term.includes(nonName));
};

/**
 * Test function for debugging field detection
 */
export const testFieldDetection = (terms: string[]) => {
  console.log('🧪 Testing field detection:');
  terms.forEach(term => {
    const result = detectField(term);
    console.log(`   "${term}" → ${result ? `${result.field} (${result.confidence}%)` : 'no match'}`);
  });
};

// Export for testing
export { detectField, isPoliticalParty, isIsland, isAddress, isName };

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
