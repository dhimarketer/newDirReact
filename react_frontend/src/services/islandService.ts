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
}

export default new IslandService();
