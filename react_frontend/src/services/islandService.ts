import api from './api';

export interface Island {
  id: number;
  name: string;
  atoll: string;
  island_type: string;
  is_active: boolean;
}

export interface IslandsResponse {
  success: boolean;
  islands: Island[];
  count: number;
}

class IslandService {
  private islandsCache: Island[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all islands from the backend
   * Uses caching to avoid repeated API calls
   */
  async getIslands(): Promise<Island[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.islandsCache && now < this.cacheExpiry) {
      return this.islandsCache;
    }

    try {
      const response = await api.get<IslandsResponse>('/islands/');
      
      if (response.data.success) {
        // Cache the data
        this.islandsCache = response.data.islands;
        this.cacheExpiry = now + this.CACHE_DURATION;
        
        return response.data.islands;
      } else {
        throw new Error('Failed to fetch islands');
      }
    } catch (error) {
      console.error('Error fetching islands:', error);
      
      // Return cached data if available, even if expired
      if (this.islandsCache) {
        return this.islandsCache;
      }
      
      throw error;
    }
  }

  /**
   * Get island names only (for backward compatibility)
   */
  async getIslandNames(): Promise<string[]> {
    const islands = await this.getIslands();
    return islands.map(island => island.name);
  }

  /**
   * Get atoll names only
   */
  async getAtollNames(): Promise<string[]> {
    const islands = await this.getIslands();
    const atolls = new Set(islands.map(island => island.atoll));
    return Array.from(atolls).sort();
  }

  /**
   * Clear the cache (useful for testing or when data changes)
   */
  clearCache(): void {
    this.islandsCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Check if a term is a known island
   */
  async isKnownIsland(term: string): Promise<boolean> {
    const islands = await this.getIslands();
    return islands.some(island => 
      island.name.toLowerCase() === term.toLowerCase()
    );
  }

  /**
   * Check if a term is a known atoll
   */
  async isKnownAtoll(term: string): Promise<boolean> {
    const atolls = await this.getAtollNames();
    return atolls.some(atoll => 
      atoll.toLowerCase() === term.toLowerCase()
    );
  }

  /**
   * Get island name by ID
   */
  async getIslandNameById(id: string | number): Promise<string | null> {
    try {
      const islands = await this.getIslands();
      const island = islands.find(island => island.id.toString() === id.toString());
      return island ? island.name : null;
    } catch (error) {
      console.error('Error getting island name by ID:', error);
      return null;
    }
  }

  /**
   * 2025-01-28: NEW - Find islands by partial name to help resolve island names
   * This is useful when users search for "hithadhoo" instead of "s. hithadhoo"
   */
  async findIslandsByPartialName(partialName: string): Promise<Island[]> {
    try {
      const islands = await this.getIslands();
      const normalizedPartial = partialName.toLowerCase().trim();
      
      return islands.filter(island => 
        island.name.toLowerCase().includes(normalizedPartial) ||
        island.name.toLowerCase().replace(/^[a-z]\.\s*/i, '').includes(normalizedPartial)
      );
    } catch (error) {
      console.error('Error finding islands by partial name:', error);
      return [];
    }
  }

  /**
   * 2025-01-28: NEW - Get the best matching island name for a partial search
   * Returns the most likely full island name for a partial search
   */
  async getBestIslandMatch(partialName: string): Promise<string | null> {
    try {
      // 2025-01-28: ENHANCED - Handle wildcard patterns like "*hithadhoo*"
      let cleanPartialName = partialName;
      if (partialName.includes('*')) {
        cleanPartialName = partialName.replace(/\*/g, '').trim();
        console.log('Cleaned wildcard pattern:', { from: partialName, to: cleanPartialName });
      }
      
      const matches = await this.findIslandsByPartialName(cleanPartialName);
      
      if (matches.length === 0) {
        console.log('No island matches found for:', cleanPartialName);
        return null;
      }
      
      if (matches.length === 1) {
        console.log('Single island match found:', matches[0].name);
        return matches[0].name;
      }
      
      // If multiple matches, prioritize exact matches and shorter names
      const exactMatches = matches.filter(island => 
        island.name.toLowerCase().includes(cleanPartialName.toLowerCase())
      );
      
      if (exactMatches.length > 0) {
        // Return the shortest exact match (most specific)
        const bestMatch = exactMatches.sort((a, b) => a.name.length - b.name.length)[0];
        console.log('Best exact match found:', bestMatch.name);
        return bestMatch.name;
      }
      
      // Return the first match if no exact matches
      console.log('Using first available match:', matches[0].name);
      return matches[0].name;
    } catch (error) {
      console.error('Error getting best island match:', error);
      return null;
    }
  }
}

export default new IslandService();
