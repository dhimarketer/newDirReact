// 2025-01-27: Smart query parser for intelligent search functionality
// 2025-01-27: Fixed to properly handle Maldivian geography context
// 2025-01-27: Fixed gender detection to use actual database values (M, F)
// 2025-01-27: Fixed comma logic - each comma indicates a new field, not adding to same field
// 2025-01-27: Added field priority order and age search support with > operator
// 2025-01-27: Added wildcard capability for each search term
// 2025-01-27: Enhanced address and island detection for better smart search
// 2025-01-27: COMPLETELY REWRITTEN with probability-based field detection for optimal accuracy

import { SearchFilters } from '../types/directory';
import islandService from '../services/islandService';

export interface ParsedQuery {
  query: string;
  filters: Partial<SearchFilters>;
  hasWildcards: boolean;
  searchTerms: string[];
}

export interface FieldProbability {
  field: keyof SearchFilters;
  probability: number;
  reason: string;
}

/**
 * Parse a smart search query and extract meaningful filters using probability-based field detection
 * Each term is analyzed individually and assigned to the field with the highest probability
 * 
 * Examples:
 * - "habaruge, hithadhoo" -> address: "habaruge", island: "hithadhoo"
 * - "ali*, male, hulhumale, MDP" -> name: "ali*", island: "male", address: "hulhumale", party: "MDP"
 * - "ali, hee*, >30" -> name: "ali", profession: "hee*", min_age: 30
 * - "j*n, >25, MDP" -> name: "j*n", min_age: 25, party: "MDP"
 * - "ali%" -> name: "ali*" (wildcard)
 * - "1234567" -> contact: "1234567" (numeric)
 */
export const parseSmartQuery = async (rawQuery: string): Promise<ParsedQuery> => {
  const query = rawQuery.trim();
  if (!query) {
    return {
      query: '',
      filters: {},
      hasWildcards: false,
      searchTerms: []
    };
  }

  // Split by commas and clean up
  const terms = query
    .split(',')
    .map(term => term.trim())
    .filter(term => term.length > 0);

  const filters: Partial<SearchFilters> = {} as any;
  const searchTerms: string[] = [];
  let hasWildcards = false;
  let usedFields = new Set<string>(); // Track which fields we've already used

  for (let index = 0; index < terms.length; index++) {
    const term = terms[index];
    const cleanTerm = term.trim();
    if (!cleanTerm) continue;

    // Check for age search with > operator
    if (cleanTerm.startsWith('>')) {
      const ageValue = cleanTerm.substring(1).trim();
      if (/^\d+$/.test(ageValue) && !usedFields.has('min_age')) {
        filters.min_age = parseInt(ageValue);
        usedFields.add('min_age');
        continue;
      }
    }

    // Check for wildcard patterns in the term
    const hasWildcardInTerm = cleanTerm.includes('*') || cleanTerm.includes('%');
    if (hasWildcardInTerm) {
      hasWildcards = true;
      // Convert % to * for consistency
      const wildcardTerm = cleanTerm.replace(/%/g, '*');
      
      // Use probability-based detection for wildcard terms
      const fieldProbabilities = await calculateFieldProbabilities(wildcardTerm);
      const bestField = getBestAvailableField(fieldProbabilities, usedFields);
      
      if (bestField && !usedFields.has(bestField.field)) {
        (filters as any)[bestField.field] = wildcardTerm;
        usedFields.add(bestField.field);
        console.log(`Wildcard term "${wildcardTerm}" assigned to ${bestField.field} (${bestField.probability}% - ${bestField.reason})`);
      } else {
        // Default to general query with wildcard
        filters.query = wildcardTerm;
      }
      continue;
    }

    // Check for specific field indicators
    if (cleanTerm.includes(':')) {
      const [field, value] = cleanTerm.split(':').map(s => s.trim());
      if (field && value) {
        const fieldKey = field.toLowerCase() as keyof SearchFilters;
        if (isValidFilterField(fieldKey) && !usedFields.has(fieldKey)) {
          // Check if value contains wildcards
          const valueHasWildcards = value.includes('*') || value.includes('%');
          if (valueHasWildcards) {
            hasWildcards = true;
            const wildcardValue = value.replace(/%/g, '*');
            (filters as any)[fieldKey] = wildcardValue;
          } else {
            (filters as any)[fieldKey] = value;
          }
          usedFields.add(fieldKey);
          continue;
        }
      }
    }

    // Use probability-based field detection for the term
    const fieldProbabilities = await calculateFieldProbabilities(cleanTerm);
    const bestField = getBestAvailableField(fieldProbabilities, usedFields);
    
    if (bestField && !usedFields.has(bestField.field)) {
      (filters as any)[bestField.field] = cleanTerm;
      usedFields.add(bestField.field);
      console.log(`Term "${cleanTerm}" assigned to ${bestField.field} (${bestField.probability}% - ${bestField.reason})`);
    } else {
      // If we can't determine a field or field already used, add to search terms
      searchTerms.push(cleanTerm);
    }
  }

  // If we have specific filters, don't use the general query
  // If we only have search terms, combine them into the general query
  if (Object.keys(filters).length === 0 && searchTerms.length > 0) {
    filters.query = searchTerms.join(' ');
  } else if (searchTerms.length > 0) {
    // Add search terms to the general query for broader search
    filters.query = searchTerms.join(' ');
  }

  return {
    query: rawQuery,
    filters,
    hasWildcards,
    searchTerms
  };
};

/**
 * Calculate probability scores for each field for a given term
 * Now async to support database lookups for islands and atolls
 */
const calculateFieldProbabilities = async (term: string): Promise<FieldProbability[]> => {
  const probabilities: FieldProbability[] = [];
  const cleanTerm = term.toLowerCase();
  
  console.log(`🔍 Analyzing term: "${term}" (clean: "${cleanTerm}")`);
  
  // Check for numeric patterns (contact/nid)
  if (/^\d+$/.test(term)) {
    if (term.length === 7) {
      probabilities.push({
        field: 'contact',
        probability: 95,
        reason: '7-digit phone number pattern'
      });
      console.log(`   📱 Contact: 95% - 7-digit phone number`);
    } else if (term.length <= 10) {
      probabilities.push({
        field: 'nid',
        probability: 85,
        reason: 'Numeric ID pattern'
      });
      console.log(`   🆔 NID: 85% - Numeric ID pattern`);
    }
  }
  
  // Check for political parties
  if (isPoliticalParty(cleanTerm)) {
    probabilities.push({
      field: 'party',
      probability: 95,
      reason: 'Known political party'
    });
    console.log(`   🏛️ Party: 95% - Known political party`);
  }
  
  // Check for gender codes
  if (isGenderCode(cleanTerm)) {
    probabilities.push({
      field: 'gender',
      probability: 90,
      reason: 'Gender code (M, F)'
    });
    console.log(`   👤 Gender: 90% - Gender code (M, F)`);
  }
  
  // Check for address patterns FIRST (including "ge" suffix) - prioritize over island detection for "ge" terms
  const addressProbability = getAddressProbability(cleanTerm);
  if (addressProbability > 0) {
    probabilities.push({
      field: 'address',
      probability: addressProbability,
      reason: addressProbability >= 90 ? 'Clear address pattern (ge suffix)' : 'Address pattern detected'
    });
    console.log(`   🏠 Address: ${addressProbability}% - ${addressProbability >= 90 ? 'Clear address pattern (ge suffix)' : 'Address pattern detected'}`);
  }
  
  // Check for Maldivian islands (async database lookup) - ONLY if not already identified as address
  try {
    const isIsland = await isMaldivianIsland(cleanTerm);
    if (isIsland) {
      // Give higher probability for well-known islands, but lower than address for "ge" suffix terms
      let islandProbability = 95;
      let reason = 'Known Maldivian island';
      
      // Special handling for very common islands
      if (['male', 'hulhumale', 'addu', 'gan', 'fuamulah'].includes(cleanTerm)) {
        islandProbability = 98;
        reason = 'Major Maldivian island/atoll capital';
      }
      
      // Reduce island probability if it's also detected as address (especially for "ge" suffix)
      if (addressProbability >= 90) {
        islandProbability = 85; // Lower than address probability
        reason = 'Known Maldivian island (but likely address due to ge suffix)';
      }
      
      probabilities.push({
        field: 'island',
        probability: islandProbability,
        reason: reason
      });
      console.log(`   🏝️ Island: ${islandProbability}% - ${reason}`);
    }
  } catch (error) {
    console.warn('Island check failed:', error);
  }
  
  // Check for Maldivian atolls (async database lookup, after island and address to avoid conflicts)
  try {
    const isAtoll = await isMaldivianAtoll(cleanTerm);
    if (isAtoll) {
      // Only add atoll if it's not already detected as an island or address
      const hasHigherPriority = probabilities.some(p => p.field === 'island' || p.field === 'address');
      if (!hasHigherPriority) {
        probabilities.push({
          field: 'atoll',
          probability: 90,
          reason: 'Known Maldivian atoll'
        });
        console.log(`   🗺️ Atoll: 90% - Known Maldivian atoll`);
      } else {
        console.log(`   ⚠️ Atoll: Skipped - already detected as island or address`);
      }
    }
  } catch (error) {
    console.warn('Atoll check failed:', error);
  }
  
  // Check for professions
  if (isCommonProfession(cleanTerm)) {
    probabilities.push({
      field: 'profession',
      probability: 85,
      reason: 'Common profession'
    });
    console.log(`   💼 Profession: 85% - Common profession`);
  }
  
  // Check for names (if no other high-probability matches)
  if (isLikelyName(term)) {
    probabilities.push({
      field: 'name',
      probability: 70,
      reason: 'Likely name pattern'
    });
    console.log(`   👤 Name: 70% - Likely name pattern`);
  }
  
  // Sort by probability (highest first)
  const sortedProbabilities = probabilities.sort((a, b) => b.probability - a.probability);
  
  console.log(`   📊 Final probabilities for "${term}":`);
  sortedProbabilities.forEach(prob => {
    console.log(`      ${prob.field}: ${prob.probability}% - ${prob.reason}`);
  });
  
  return sortedProbabilities;
};

/**
 * Get the best available field from probability list
 */
const getBestAvailableField = (probabilities: FieldProbability[], usedFields: Set<string>): FieldProbability | null => {
  for (const prob of probabilities) {
    if (!usedFields.has(prob.field)) {
      return prob;
    }
  }
  return null;
};

/**
 * Check if a term is a Maldivian atoll
 * Now uses database lookup instead of hardcoded lists
 */
const isMaldivianAtoll = async (term: string): Promise<boolean> => {
  try {
    return await islandService.isKnownAtoll(term);
  } catch (error) {
    console.warn('Error checking atoll in database, falling back to basic check:', error);
    // Fallback: only match terms that look like actual Maldivian atolls (not names)
    const cleanTerm = term.toLowerCase();
    
    // Don't treat short names as atolls
    if (cleanTerm.length < 4) {
      return false;
    }
    
    // Use a conservative fallback list of actual Maldivian atolls
    const commonAtolls = [
      'haa alifu', 'haa dhaalu', 'shaviyani', 'noonu', 'raa', 'baa', 'lhaviyani',
      'kaafu', 'alifu alifu', 'alifu dhaalu', 'vaavu', 'meemu', 'faafu', 'dhaalu',
      'thaa', 'laamu', 'gaafu alifu', 'gaafu dhaalu', 'fuvahmulah', 'addu'
    ];
    
    return commonAtolls.includes(cleanTerm);
  }
};

/**
 * Check if a term is a Maldivian island
 * Now uses database lookup instead of hardcoded lists
 */
const isMaldivianIsland = async (term: string): Promise<boolean> => {
  try {
    return await islandService.isKnownIsland(term);
  } catch (error) {
    console.warn('Error checking island in database, falling back to basic check:', error);
    // Fallback: only match terms that look like Maldivian islands (not addresses with "ge" suffix)
    const cleanTerm = term.toLowerCase();
    
    // Don't treat "ge" suffix terms as islands (they're addresses)
    if (cleanTerm.endsWith('ge')) {
      return false;
    }
    
    // Use a more conservative fallback list of common Maldivian islands
    const commonIslands = [
      'male', 'hulhumale', 'addu', 'gan', 'fuamulah', 'hithadhoo', 'thinadhoo',
      'vaadhoo', 'keyodhoo', 'maradhoo', 'feydhoo', 'kudahuvadhoo', 'kulhudhuffushi',
      'naifaru', 'dhidhoo', 'viligili', 'hulhule', 'villingili'
    ];
    
    return commonIslands.includes(cleanTerm);
  }
};

/**
 * Check if a term is a political party (case-insensitive)
 */
const isPoliticalParty = (term: string): boolean => {
  const parties = [
    'mdp', 'maldivian democratic party',
    'ppm', 'progressive party of maldives',
    'jp', 'jumhooree party',
    'mnp', 'maldivian nationalist party',
    'adh', 'adhaalath party',
    'pjp', 'people\'s national congress',
    'ap', 'adhaalath party'
  ];
  return parties.includes(term);
};

/**
 * Check if a term is a gender code (actual database values)
 */
const isGenderCode = (term: string): boolean => {
  // Only check for the actual database values: M, F
  const genderCodes = ['m', 'f'];
  return genderCodes.includes(term);
};

/**
 * Check if a term is a common profession
 */
const isCommonProfession = (term: string): boolean => {
  const professions = [
    'teacher', 'doctor', 'engineer', 'lawyer', 'business',
    'fisherman', 'farmer', 'student', 'retired', 'unemployed',
    'government', 'private', 'self-employed', 'nurse', 'accountant',
    'manager', 'driver', 'cook', 'cleaner', 'security'
  ];
  return professions.includes(term);
};

/**
 * Check if a term is likely a name
 */
const isLikelyName = (term: string): boolean => {
  const cleanTerm = term.toLowerCase();
  return /^[a-zA-Z\s*]{2,20}$/.test(term) && !isCommonWord(cleanTerm);
};

/**
 * Check if a term is likely a profession
 */
const isLikelyProfession = (term: string): boolean => {
  const cleanTerm = term.toLowerCase();
  const professions = [
    'teacher', 'doctor', 'engineer', 'lawyer', 'business',
    'fisherman', 'farmer', 'student', 'retired', 'unemployed',
    'government', 'private', 'self-employed'
  ];
  return professions.some(prof => cleanTerm.includes(prof.replace('*', '')));
};

/**
 * Check if a term is likely a political party
 */
const isLikelyParty = (term: string): boolean => {
  const cleanTerm = term.toLowerCase();
  const parties = ['mdp', 'ppm', 'jp', 'mnp', 'adh', 'pjp', 'ap'];
  return parties.some(party => cleanTerm.includes(party.replace('*', '')));
};

/**
 * Check if a word is a common word (not likely a name)
 */
const isCommonWord = (word: string): boolean => {
  const commonWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'down', 'out', 'off',
    'over', 'under', 'above', 'below', 'between', 'among',
    'through', 'during', 'before', 'after', 'since', 'until',
    'while', 'where', 'when', 'why', 'how', 'what', 'which',
    'who', 'whom', 'whose', 'this', 'that', 'these', 'those',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'must', 'shall'
  ];
  return commonWords.includes(word);
};

/**
 * Check if a term is likely an address
 */
const isLikelyAddress = (term: string): boolean => {
  const addressIndicators = [
    'street', 'road', 'avenue', 'lane', 'drive', 'place', 'court',
    'building', 'house', 'apartment', 'flat', 'room', 'floor',
    'block', 'area', 'zone', 'district', 'ward', 'sector'
  ];
  
  // Check if term contains address-like words
  if (addressIndicators.some(indicator => term.toLowerCase().includes(indicator))) {
    return true;
  }
  
  // Check for common address patterns (numbers + words)
  if (/^\d+\s+[a-zA-Z]+/.test(term)) {
    return true;
  }
  
  // Check for postal code patterns
  if (/^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i.test(term)) {
    return true;
  }
  
  // Enhanced Maldivian address patterns with "ge" suffix handling
  const maldivianAddressPatterns = [
    // "ge" suffix (common in Maldivian addresses) - with or without space
    /ge$/i,                    // ends with "ge" (e.g., "habaruge")
    /\sge$/i,                  // ends with " ge" (e.g., "habaru ge")
    /ge\s/i,                   // starts with "ge " (e.g., "ge habaru")
    /\sge\s/i,                 // contains " ge " (e.g., "some ge place")
    // "maa" suffix (common in Maldivian addresses)
    /maa$/i,
    // "villa" suffix (common in Maldivian addresses)
    /villa$/i,
    // "house" suffix (common in Maldivian addresses)
    /house$/i,
    // "flat" suffix (common in Maldivian addresses)
    /flat$/i,
    // "room" suffix (common in Maldivian addresses)
    /room$/i,
    // "floor" suffix (common in Maldivian addresses)
    /floor$/i,
    // "block" suffix (common in Maldivian addresses)
    /block$/i,
    // "area" suffix (common in Maldivian addresses)
    /area$/i,
    // "zone" suffix (common in Maldivian addresses)
    /zone$/i,
    // "district" suffix (common in Maldivian addresses)
    /district$/i,
    // "ward" suffix (common in Maldivian addresses)
    /ward$/i,
    // "sector" suffix (common in Maldivian addresses)
    /sector$/i,
    // Wildcard patterns that could be addresses
    /^[*%][a-zA-Z]+$/i,  // *ge, %ge, etc.
    /^[a-zA-Z]+[*%]$/i,  // ge*, ge%, etc.
    /^[a-zA-Z]*[*%][a-zA-Z]*$/i,  // *ge, g*e, ge*, etc.
  ];
  
  if (maldivianAddressPatterns.some(pattern => pattern.test(term))) {
    return true;
  }
  
  // Special handling for "ge" suffix patterns (very common in Maldivian addresses)
  const cleanTerm = term.toLowerCase();
  if (cleanTerm.endsWith('ge') || cleanTerm.includes(' ge')) {
    return true;
  }
  
  // Check for wildcard patterns that could be addresses
  if (term.includes('*') || term.includes('%')) {
    // If it's a wildcard pattern and doesn't look like a name, treat as address
    const cleanTerm = term.replace(/[*%]/g, '').toLowerCase();
    if (cleanTerm.length >= 2 && !isCommonWord(cleanTerm) && !isLikelyName(term.replace(/[*%]/g, ''))) {
      return true;
    }
  }
  
  // Enhanced common address components for Maldivian context
  const commonAddressComponents = [
    'ge', 'maa', 'villa', 'house', 'flat', 'room', 'floor',
    'block', 'area', 'zone', 'district', 'ward', 'sector',
    'street', 'road', 'avenue', 'lane', 'drive', 'place', 'court',
    'building', 'apartment', 'habaruge'
  ];
  
  if (commonAddressComponents.includes(term.toLowerCase())) {
    return true;
  }
  
  // Check for short terms that could be address abbreviations
  if (term.length >= 2 && term.length <= 4 && /^[a-zA-Z]+$/.test(term)) {
    // If it's a short term and not a common word, likely an address component
    if (!isCommonWord(term.toLowerCase()) && !isLikelyName(term)) {
      return true;
    }
  }
  
  // Check for terms that look like building names or locations
  if (term.length >= 3 && /^[A-Z][a-z]+/.test(term)) {
    // Capitalized terms that could be building names
    if (!isCommonWord(term.toLowerCase()) && !isLikelyName(term)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Enhanced address probability calculation for "ge" suffix patterns
 */
const getAddressProbability = (term: string): number => {
  const cleanTerm = term.toLowerCase();
  
  // Highest probability for clear "ge" suffix patterns
  if (cleanTerm.endsWith('ge')) {
    return 95; // Very high probability for "habaruge", "hulhumale", etc.
  }
  
  if (cleanTerm.includes(' ge')) {
    return 90; // High probability for "habaru ge", "hulhumale ge", etc.
  }
  
  // High probability for known address components
  if (['ge', 'maa', 'villa', 'house', 'flat', 'room', 'floor', 'block', 'area', 'zone', 'district', 'ward', 'sector'].includes(cleanTerm)) {
    return 85;
  }
  
  // Medium probability for other address patterns
  if (isLikelyAddress(cleanTerm)) {
    return 80;
  }
  
  return 0; // Not an address
};

/**
 * Check if a field key is valid for SearchFilters
 */
const isValidFilterField = (field: string): field is keyof SearchFilters => {
  const validFields: (keyof SearchFilters)[] = [
    'name', 'contact', 'nid', 'address', 'atoll', 'island',
    'party', 'profession', 'gender', 'min_age', 'max_age',
    'remark', 'pep_status'
  ];
  return validFields.includes(field as keyof SearchFilters);
};

/**
 * Format the parsed query for display to show what fields were detected
 */
export const formatParsedQuery = (parsed: ParsedQuery): string => {
  const parts: string[] = [];
  
  if (parsed.filters.name) parts.push(`Name: ${parsed.filters.name}`);
  if (parsed.filters.contact) parts.push(`Contact: ${parsed.filters.contact}`);
  if (parsed.filters.nid) parts.push(`NID: ${parsed.filters.nid}`);
  if (parsed.filters.gender) parts.push(`Gender: ${parsed.filters.gender}`);
  if (parsed.filters.party) parts.push(`Party: ${parsed.filters.party}`);
  if (parsed.filters.profession) parts.push(`Profession: ${parsed.filters.profession}`);
  if (parsed.filters.atoll) parts.push(`Atoll: ${parsed.filters.atoll}`);
  if (parsed.filters.island) parts.push(`Island: ${parsed.filters.island}`);
  if (parsed.filters.address) parts.push(`Address: ${parsed.filters.address}`);
  if (parsed.filters.query) parts.push(`General: ${parsed.filters.query}`);
  
  return parts.join(', ');
};

/**
 * Test function to demonstrate probability-based field detection
 * This can be used for debugging and testing the parser
 */
export const testFieldDetection = async (query: string): Promise<void> => {
  console.log(`\n🔍 Testing field detection for: "${query}"`);
  
  const terms = query.split(',').map(term => term.trim()).filter(term => term.length > 0);
  
  for (let index = 0; index < terms.length; index++) {
    const term = terms[index];
    console.log(`\n📝 Term ${index + 1}: "${term}"`);
    const probabilities = await calculateFieldProbabilities(term);
    
    if (probabilities.length === 0) {
      console.log(`   ❌ No field detected`);
    } else {
      console.log(`   ✅ Field probabilities:`);
      probabilities.forEach(prob => {
        console.log(`      ${prob.field}: ${prob.probability}% - ${prob.reason}`);
      });
      
      const bestField = probabilities[0];
      console.log(`   🎯 Best field: ${bestField.field} (${bestField.probability}%)`);
    }
  }
  
  // Test full parsing
  console.log(`\n🔧 Full parsing result:`);
  const parsed = await parseSmartQuery(query);
  console.log(`   Filters:`, parsed.filters);
  console.log(`   Search terms:`, parsed.searchTerms);
  console.log(`   Has wildcards:`, parsed.hasWildcards);
};
