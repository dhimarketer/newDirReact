// 2025-01-27: Smart query parser for intelligent search functionality
// 2025-01-27: Fixed to properly handle Maldivian geography context
// 2025-01-27: Fixed gender detection to use actual database values (M, F)
// 2025-01-27: Fixed comma logic - each comma indicates a new field, not adding to same field
// 2025-01-27: Added field priority order and age search support with > operator
// 2025-01-27: Added wildcard capability for each search term

import { SearchFilters } from '../types/directory';

export interface ParsedQuery {
  query: string;
  filters: Partial<SearchFilters>;
  hasWildcards: boolean;
  searchTerms: string[];
}

/**
 * Parse a smart search query and extract meaningful filters
 * Field priority order: name → island → address → party → number (contact/nid)
 * Age search: >30 means people older than 30 years (year-only calculation)
 * Wildcards: * or % can be used in any search term for partial matches
 * 
 * Examples:
 * - "ali*, male, hulhumale, MDP" -> name: "ali*", island: "male", address: "hulhumale", party: "MDP"
 * - "ali, hee*, >30" -> name: "ali", profession: "hee*", min_age: 30
 * - "j*n, >25, MDP" -> name: "j*n", min_age: 25, party: "MDP"
 * - "ali%" -> name: "ali*" (wildcard)
 * - "1234567" -> contact: "1234567" (numeric)
 */
export const parseSmartQuery = (rawQuery: string): ParsedQuery => {
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

  terms.forEach((term, index) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;

    // Check for age search with > operator
    if (cleanTerm.startsWith('>')) {
      const ageValue = cleanTerm.substring(1).trim();
      if (/^\d+$/.test(ageValue) && !usedFields.has('min_age')) {
        filters.min_age = parseInt(ageValue);
        usedFields.add('min_age');
        return;
      }
    }

    // Check for wildcard patterns in the term
    const hasWildcardInTerm = cleanTerm.includes('*') || cleanTerm.includes('%');
    if (hasWildcardInTerm) {
      hasWildcards = true;
      // Convert % to * for consistency
      const wildcardTerm = cleanTerm.replace(/%/g, '*');
      
      // Try to determine the field type for wildcard, following priority order
      const fieldType = analyzeTermWithPriority(wildcardTerm, usedFields);
      if (fieldType && !usedFields.has(fieldType)) {
        (filters as any)[fieldType] = wildcardTerm;
        usedFields.add(fieldType);
      } else {
        // Default to general query with wildcard
        filters.query = wildcardTerm;
      }
      return;
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
          return;
        }
      }
    }

    // Analyze the term following the priority order: name → island → address → party → number
    const fieldType = analyzeTermWithPriority(cleanTerm, usedFields);
    
    if (fieldType && !usedFields.has(fieldType)) {
      (filters as any)[fieldType] = cleanTerm;
      usedFields.add(fieldType);
    } else {
      // If we can't determine a field or field already used, add to search terms
      searchTerms.push(cleanTerm);
    }
  });

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
 * Analyze a term following the priority order: name → island → address → party → number
 * Avoids fields that have already been used
 */
const analyzeTermWithPriority = (term: string, usedFields: Set<string>): string | null => {
  const cleanTerm = term.toLowerCase();
  
  // Priority 1: Check for names (if name field not used)
  if (isLikelyName(term) && !usedFields.has('name')) {
    return 'name';
  }
  
  // Priority 2: Check for Maldivian islands (if island field not used)
  if (isMaldivianIsland(cleanTerm) && !usedFields.has('island')) {
    return 'island';
  }
  
  // Priority 3: Check for address-like terms (if address field not used)
  if (isLikelyAddress(cleanTerm) && !usedFields.has('address')) {
    return 'address';
  }
  
  // Priority 4: Check for political parties (if party field not used)
  if (isPoliticalParty(cleanTerm) && !usedFields.has('party')) {
    return 'party';
  }
  
  // Priority 5: Check for numeric patterns (contact/nid) (if not used)
  if (/^\d+$/.test(term)) {
    if (term.length === 7 && !usedFields.has('contact')) {
      return 'contact'; // 7 digits likely phone number
    } else if (term.length <= 10 && !usedFields.has('nid')) {
      return 'nid'; // Shorter numbers likely NID
    }
  }
  
  // Additional checks for other fields (if not used)
  
  // Check for Maldivian atolls (if atoll field not used)
  if (isMaldivianAtoll(cleanTerm) && !usedFields.has('atoll')) {
    return 'atoll';
  }
  
  // Check for gender codes (actual database values) - only if NOT "male"
  if (isGenderCode(cleanTerm) && !usedFields.has('gender') && cleanTerm !== 'male') {
    return 'gender';
  }
  
  // Check for common professions (if profession field not used)
  if (isCommonProfession(cleanTerm) && !usedFields.has('profession')) {
    return 'profession';
  }
  
  // Default to null - no field determined
  return null;
};

/**
 * Check if a term is a Maldivian atoll
 */
const isMaldivianAtoll = (term: string): boolean => {
  const atolls = [
    'male', 'male\'', 'male\' atoll', // Male' (capital atoll)
    'addu', 'addu atoll', 'seenu', 'seenu atoll',
    'fuamulah', 'fuamulah atoll', 'gnaviyani', 'gnaviyani atoll',
    'gan', 'gan atoll', 'laamu', 'laamu atoll',
    'fuvahmulah', 'fuvahmulah atoll', 'gnyaviyani', 'gnyaviyani atoll',
    'thinadhoo', 'vaadhoo', 'keyodhoo', 'maradhoo', 'feydhoo', 'hithadhoo',
    'kudahuvadhoo', 'kulhudhuffushi', 'naifaru', 'dhidhoo',
    'hulhumale', 'viligili', 'hulhule', 'villingili'
  ];
  return atolls.includes(term);
};

/**
 * Check if a term is a Maldivian island
 */
const isMaldivianIsland = (term: string): boolean => {
  const islands = [
    'male', 'male\'', // Male' (capital island)
    'addu', 'fuamulah', 'gan', 'fuvahmulah', 'thinadhoo',
    'vaadhoo', 'keyodhoo', 'maradhoo', 'feydhoo', 'hithadhoo',
    'kudahuvadhoo', 'kulhudhuffushi', 'naifaru', 'dhidhoo',
    'hulhumale', 'viligili', 'hulhule', 'villingili',
    'hithadhoo', 'kudahuvadhoo', 'kulhudhuffushi', 'naifaru'
  ];
  return islands.includes(term);
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
  
  // Check for Maldivian address patterns
  const maldivianAddressPatterns = [
    // "ge" suffix (common in Maldivian addresses)
    /ge$/i,
    // Wildcard patterns that could be addresses
    /^[*%][a-zA-Z]+$/i,  // *ge, %ge, etc.
    /^[a-zA-Z]+[*%]$/i,  // ge*, ge%, etc.
    /^[a-zA-Z]*[*%][a-zA-Z]*$/i,  // *ge, g*e, ge*, etc.
  ];
  
  if (maldivianAddressPatterns.some(pattern => pattern.test(term))) {
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
  
  // Check for common address components (ge, maa, etc.)
  const commonAddressComponents = [
    'ge', 'maa', 'villa', 'house', 'flat', 'room', 'floor',
    'block', 'area', 'zone', 'district', 'ward', 'sector'
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
  
  return false;
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
