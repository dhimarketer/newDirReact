// 2025-01-30: Connected Family Service for detecting and displaying related family groups
import { FamilyGroup } from '../types/family';
import { familyService } from './familyService';

export interface ConnectedFamily {
  familyGroup: FamilyGroup;
  connectionType: 'original' | 'derived';
  baseAddress: string;
  parentName?: string;
}

export interface ConnectedFamilyResult {
  hasConnectedFamilies: boolean;
  connectedFamilies: ConnectedFamily[];
  baseAddress: string;
  totalMembers: number;
}

class ConnectedFamilyService {
  // 2025-02-02: Added cache to track connected family data
  private familyCache = new Map<string, ConnectedFamilyResult>();

  /**
   * 2025-02-02: Clear cache for connected families (called after deletions)
   */
  clearCache(): void {
    console.log('🗑️ Clearing connected families cache');
    this.familyCache.clear();
  }

  /**
   * 2025-02-02: Clear cache for specific address
   */
  clearCacheForAddress(address: string, island: string): void {
    const cacheKey = `${address}|${island}`;
    console.log('🗑️ Clearing cache for:', cacheKey);
    this.familyCache.delete(cacheKey);
    
    // Also clear any connected families that might reference this address
    const keysToDelete: string[] = [];
    for (const [key, result] of this.familyCache.entries()) {
      const hasReference = result.connectedFamilies.some(cf => 
        cf.familyGroup.address === address && cf.familyGroup.island === island
      );
      if (hasReference) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      console.log('🗑️ Clearing related cache for:', key);
      this.familyCache.delete(key);
    });
  }

  /**
   * Find all families connected to a given address
   */
  async findConnectedFamilies(address: string, island: string, forceRefresh: boolean = false): Promise<ConnectedFamilyResult> {
    console.log('🔗 SEARCHING FOR CONNECTED FAMILIES:', { address, island, forceRefresh });

    // 2025-02-02: Check cache first unless force refresh is requested
    const cacheKey = `${address}|${island}`;
    if (!forceRefresh && this.familyCache.has(cacheKey)) {
      console.log('📋 Returning cached connected families for:', cacheKey);
      return this.familyCache.get(cacheKey)!;
    }

    try {
      // First, get all families for the user to search through
      const allFamiliesResponse = await familyService.getMyFamilies();
      const allFamilies = allFamiliesResponse.results || [];

      console.log('📋 All user families:', allFamilies.length);

      // Find families that match the address pattern
      const connectedFamilies: ConnectedFamily[] = [];
      const baseAddress = this.extractBaseAddress(address);

      console.log('🏠 Base address extracted:', baseAddress);

      // Look for the original family (exact address match)
      const originalFamily = allFamilies.find(family => 
        family.address === address && family.island === island
      );

      if (originalFamily) {
        connectedFamilies.push({
          familyGroup: originalFamily,
          connectionType: 'original',
          baseAddress: baseAddress
        });
        console.log('✅ Found original family:', originalFamily.name);
      }

      // Look for derived families (address starts with base address + " - ")
      const derivedFamilies = allFamilies.filter(family => 
        family.address && 
        family.address.startsWith(`${baseAddress} - `) &&
        family.island === island &&
        family.address !== address // Exclude the original family
      );

      derivedFamilies.forEach(family => {
        const parentName = this.extractParentNameFromAddress(family.address!, baseAddress);
        connectedFamilies.push({
          familyGroup: family,
          connectionType: 'derived',
          baseAddress: baseAddress,
          parentName: parentName
        });
        console.log('✅ Found derived family:', family.name, 'Parent:', parentName);
      });

      // Also look for families where the current address is a derived family
      if (address.includes(' - ') && address.includes(' Family')) {
        const potentialBaseAddress = this.extractBaseAddress(address);
        
        // Look for the original family with the base address
        const potentialOriginalFamily = allFamilies.find(family => 
          family.address === potentialBaseAddress && family.island === island
        );

        if (potentialOriginalFamily && !connectedFamilies.find(cf => cf.familyGroup.id === potentialOriginalFamily.id)) {
          connectedFamilies.push({
            familyGroup: potentialOriginalFamily,
            connectionType: 'original',
            baseAddress: potentialBaseAddress
          });
          console.log('✅ Found original family for derived address:', potentialOriginalFamily.name);
        }

        // Look for other derived families with the same base address
        const otherDerivedFamilies = allFamilies.filter(family => 
          family.address && 
          family.address.startsWith(`${potentialBaseAddress} - `) &&
          family.island === island &&
          family.address !== address && // Exclude the current family
          !connectedFamilies.find(cf => cf.familyGroup.id === family.id) // Avoid duplicates
        );

        otherDerivedFamilies.forEach(family => {
          const parentName = this.extractParentNameFromAddress(family.address!, potentialBaseAddress);
          connectedFamilies.push({
            familyGroup: family,
            connectionType: 'derived',
            baseAddress: potentialBaseAddress,
            parentName: parentName
          });
          console.log('✅ Found sibling derived family:', family.name, 'Parent:', parentName);
        });
      }

      // Calculate total members across all connected families
      const totalMembers = connectedFamilies.reduce((total, connectedFamily) => {
        return total + (connectedFamily.familyGroup.member_count || connectedFamily.familyGroup.members?.length || 0);
      }, 0);

      const result: ConnectedFamilyResult = {
        hasConnectedFamilies: connectedFamilies.length > 1,
        connectedFamilies: connectedFamilies.sort((a, b) => {
          // Sort by connection type (original first) then by name
          if (a.connectionType !== b.connectionType) {
            return a.connectionType === 'original' ? -1 : 1;
          }
          return (a.familyGroup.name || '').localeCompare(b.familyGroup.name || '');
        }),
        baseAddress: baseAddress,
        totalMembers: totalMembers
      };

      console.log('🔗 CONNECTED FAMILIES RESULT:', {
        hasConnectedFamilies: result.hasConnectedFamilies,
        familyCount: result.connectedFamilies.length,
        totalMembers: result.totalMembers,
        families: result.connectedFamilies.map(cf => ({
          name: cf.familyGroup.name,
          address: cf.familyGroup.address,
          type: cf.connectionType,
          parentName: cf.parentName
        }))
      });

      // 2025-02-02: Cache the result
      this.familyCache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('❌ Error finding connected families:', error);
      return {
        hasConnectedFamilies: false,
        connectedFamilies: [],
        baseAddress: address,
        totalMembers: 0
      };
    }
  }

  /**
   * Extract the base address from a family address
   * "Marine Drive - Ahmed Ali Family" → "Marine Drive"
   * "Marine Drive" → "Marine Drive"
   */
  private extractBaseAddress(address: string): string {
    const familySuffix = ' Family';
    const separator = ' - ';
    
    if (address.includes(separator) && address.endsWith(familySuffix)) {
      return address.split(separator)[0];
    }
    
    return address;
  }

  /**
   * Extract parent name from derived family address
   * "Marine Drive - Ahmed Ali Family" → "Ahmed Ali"
   */
  private extractParentNameFromAddress(address: string, baseAddress: string): string {
    const prefix = `${baseAddress} - `;
    const suffix = ' Family';
    
    if (address.startsWith(prefix) && address.endsWith(suffix)) {
      return address.slice(prefix.length, -suffix.length);
    }
    
    return 'Unknown';
  }

  /**
   * Get the display title for connected families
   */
  getConnectedFamilyDisplayTitle(connectedFamilyResult: ConnectedFamilyResult): string {
    if (!connectedFamilyResult.hasConnectedFamilies) {
      return 'Family Tree';
    }

    const originalCount = connectedFamilyResult.connectedFamilies.filter(cf => cf.connectionType === 'original').length;
    const derivedCount = connectedFamilyResult.connectedFamilies.filter(cf => cf.connectionType === 'derived').length;

    if (originalCount === 1 && derivedCount > 0) {
      return `Connected Families (${derivedCount + 1} groups, ${connectedFamilyResult.totalMembers} members)`;
    } else if (derivedCount > 0) {
      return `Related Families (${connectedFamilyResult.connectedFamilies.length} groups, ${connectedFamilyResult.totalMembers} members)`;
    }

    return 'Family Tree';
  }

  /**
   * Generate a connection summary for display
   */
  getConnectionSummary(connectedFamilyResult: ConnectedFamilyResult): string {
    if (!connectedFamilyResult.hasConnectedFamilies) {
      return '';
    }

    const derivedFamilies = connectedFamilyResult.connectedFamilies.filter(cf => cf.connectionType === 'derived');
    
    if (derivedFamilies.length === 1) {
      return `Connected to: ${derivedFamilies[0].familyGroup.address}`;
    } else if (derivedFamilies.length > 1) {
      const parentNames = derivedFamilies.map(cf => cf.parentName).filter(name => name).join(', ');
      return `Connected families: ${parentNames}`;
    }

    return '';
  }
}

export const connectedFamilyService = new ConnectedFamilyService();
