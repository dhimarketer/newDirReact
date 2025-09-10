// 2025-01-27: Creating family service for Phase 2 React frontend family management

import { apiService } from './api';
import { 
  FamilyGroup, 
  FamilyMember, 
  FamilyRole,
  FamilyInvitation,
  FamilyTree,
  FamilyStats,
  PaginatedResponse, 
  ApiResponse 
} from '../types';

class FamilyService {
  // Family Groups
  async getFamilyGroups(params?: {
    page?: number;
    search?: string;
    is_public?: boolean;
    created_by?: number;
  }): Promise<PaginatedResponse<FamilyGroup>> {
    const response = await apiService.get<PaginatedResponse<FamilyGroup>>('/family/groups/', { params });
    return response.data;
  }

  async getFamilyGroup(id: number): Promise<FamilyGroup> {
    const response = await apiService.get<FamilyGroup>(`/family/groups/${id}/`);
    return response.data;
  }

  async createFamilyGroup(data: Partial<FamilyGroup>): Promise<FamilyGroup> {
    const response = await apiService.post<FamilyGroup>('/family/groups/', data);
    return response.data;
  }

  async updateFamilyGroup(id: number, data: Partial<FamilyGroup>): Promise<FamilyGroup> {
    const response = await apiService.put<FamilyGroup>(`/family/groups/${id}/`, data);
    return response.data;
  }

  async deleteFamilyGroup(id: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('DEBUG: Deleting family group:', id);
      
      const response = await apiService.delete(`/family/groups/${id}/`);
      
      return {
        success: true,
        message: 'Family group deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting family group:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete family group'
      };
    }
  }

  // 2025-01-28: NEW - Method to mark family as manually updated
  async markFamilyAsManuallyUpdated(familyId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiService.patch(`/family/groups/${familyId}/mark_manually_updated/`, {});
      return { success: true };
    } catch (error: any) {
      console.error('Error marking family as manually updated:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to mark family as manually updated' 
      };
    }
  }

  // 2025-01-29: NEW - Method to get families created by the current user
  async getMyFamilies(params?: {
    page?: number;
    search?: string;
  }): Promise<PaginatedResponse<FamilyGroup>> {
    const response = await apiService.get<PaginatedResponse<FamilyGroup>>('/family/groups/', { 
      params: { 
        ...params,
        created_by: 'me' // Backend will filter by current user
      } 
    });
    return response.data;
  }

  // Family Members
  async getFamilyMembers(familyId: number, params?: {
    page?: number;
    role?: string;
    search?: string;
  }): Promise<PaginatedResponse<FamilyMember>> {
    const response = await apiService.get<PaginatedResponse<FamilyMember>>(
      `/family/groups/${familyId}/members/`, 
      { params }
    );
    return response.data;
  }

  async addFamilyMember(familyId: number, data: {
    user: number;
    role: number;
    relationship: string;
    is_admin?: boolean;
    notes?: string;
  }): Promise<FamilyMember> {
    const response = await apiService.post<FamilyMember>(
      `/family/groups/${familyId}/members/`, 
      data
    );
    return response.data;
  }

  async updateFamilyMember(familyId: number, memberId: number, data: Partial<FamilyMember>): Promise<FamilyMember> {
    const response = await apiService.put<FamilyMember>(
      `/family/groups/${familyId}/members/${memberId}/`, 
      data
    );
    return response.data;
  }

  async removeFamilyMember(familyId: number, memberId: number): Promise<void> {
    await apiService.delete(`/family/groups/${familyId}/members/${memberId}/`);
  }

  // Family Roles
  async getFamilyRoles(): Promise<FamilyRole[]> {
    const response = await apiService.get<FamilyRole[]>('/family/roles/');
    return response.data;
  }

  async createFamilyRole(data: Partial<FamilyRole>): Promise<FamilyRole> {
    const response = await apiService.post<FamilyRole>('/family/roles/', data);
    return response.data;
  }

  // Family Invitations
  async getFamilyInvitations(familyId: number, params?: {
    status?: 'pending' | 'accepted' | 'declined' | 'expired';
    page?: number;
  }): Promise<PaginatedResponse<FamilyInvitation>> {
    const response = await apiService.get<PaginatedResponse<FamilyInvitation>>(
      `/family/groups/${familyId}/invitations/`, 
      { params }
    );
    return response.data;
  }

  async sendFamilyInvitation(familyId: number, data: {
    invited_user: number;
    role: number;
    message?: string;
    expires_at?: string;
  }): Promise<FamilyInvitation> {
    const response = await apiService.post<FamilyInvitation>(
      `/family/groups/${familyId}/invitations/`, 
      data
    );
    return response.data;
  }

  async respondToInvitation(invitationId: number, action: 'accept' | 'decline'): Promise<FamilyInvitation> {
    const response = await apiService.post<FamilyInvitation>(
      `/family/invitations/${invitationId}/${action}/`
    );
    return response.data;
  }

  // Family Tree
  async getFamilyTree(familyId: number): Promise<FamilyTree> {
    const response = await apiService.get<FamilyTree>(`/family/groups/${familyId}/tree/`);
    return response.data;
  }

  async generateFamilyTree(familyId: number): Promise<FamilyTree> {
    const response = await apiService.post<FamilyTree>(`/family/groups/${familyId}/tree/generate/`);
    return response.data;
  }

  // Family Statistics
  async getFamilyStats(): Promise<FamilyStats> {
    const response = await apiService.get<FamilyStats>('/family/stats/');
    return response.data;
  }

  async getUserFamilyStats(userId: number): Promise<FamilyStats> {
    const response = await apiService.get<FamilyStats>(`/family/users/${userId}/stats/`);
    return response.data;
  }

  // Search and Discovery
  async searchFamilies(query: string, params?: {
    page?: number;
    is_public?: boolean;
    tags?: string[];
  }): Promise<PaginatedResponse<FamilyGroup>> {
    const response = await apiService.get<PaginatedResponse<FamilyGroup>>('/family/search/', {
      params: { q: query, ...params }
    });
    return response.data;
  }

  async getPublicFamilies(params?: {
    page?: number;
    tags?: string[];
    sort_by?: 'name' | 'created_at' | 'member_count';
  }): Promise<PaginatedResponse<FamilyGroup>> {
    const response = await apiService.get<PaginatedResponse<FamilyGroup>>('/family/public/', { params });
    return response.data;
  }

  // Bulk Operations
  async bulkAddMembers(familyId: number, members: Array<{
    user: number;
    role: number;
    relationship: string;
    is_admin?: boolean;
  }>): Promise<FamilyMember[]> {
    const response = await apiService.post<FamilyMember[]>(
      `/family/groups/${familyId}/members/bulk/`, 
      { members }
    );
    return response.data;
  }

  async exportFamilyData(familyId: number, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<Blob> {
    const response = await apiService.get(`/family/groups/${familyId}/export/`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  // 2025-01-28: Added method to delete updated families while preserving phonebook entries
  async deleteUpdatedFamilies(params: {
    family_group_id?: number;
    address?: string;
    island?: string;
  }): Promise<{
    message: string;
    details: {
      family_name: string;
      address: string;
      island: string;
      members_removed: number;
      relationships_removed: number;
      phonebook_entries_preserved: number;
              preserved_members: Array<{
          entry_id: number;
          name: string;
          contact: string;
          address: string;
          island: string;
        }>;
    };
  }> {
    const response = await apiService.post('/family/groups/delete_updated_families/', params);
    return response.data;
  }



  // 2025-01-29: NEW - Method to save family changes with current state
  async saveFamilyChanges(address: string, island: string, members: any[], relationships: any[]): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('DEBUG: Saving family changes for:', { address, island });
      console.log('DEBUG: Members to save:', members);
      console.log('DEBUG: Relationships to save:', relationships);
      
      // Use the create_or_update_by_address endpoint with explicit data
      const response = await apiService.post('/family/groups/create_or_update_by_address/', {
        address,
        island,
        members: members.map(member => ({
          entry_id: member.entry.pid,
          role: member.role
        })),
        relationships: relationships.map(rel => ({
          person1_id: rel.person1,
          person2_id: rel.person2,
          relationship_type: rel.relationship_type,
          notes: rel.notes || ''
        }))
      });
      
      console.log('DEBUG: Save response:', response);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: 'Failed to save family changes'
        };
      }
    } catch (error: any) {
      console.error('Error saving family changes:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to save family changes'
      };
    }
  }

  // 2025-01-28: Added method to create or update family group by address
  async createOrUpdateFamilyByAddress(address: string, island: string): Promise<{
    success: boolean;
    data?: {
      id: number;
      name: string;
      description: string;
      address: string;
      island: string;
      members: Array<{
        entry: {
          pid: number;
          name: string;
          contact: string;
          dob?: string;
          address: string;
          island: string;
        };
        role: 'parent' | 'child' | 'other';
        relationship?: string;
      }>;
      relationships: Array<{
        id: number;
        person1: number;
        person2: number;
        relationship_type: string;
        notes?: string;
        is_active: boolean;
      }>;
    };
    error?: string;
  }> {
    try {
      // 2025-01-28: IMMEDIATE DEBUG - Log everything to identify the issue
      console.log('=== FAMILY CREATION DEBUG START ===');
      console.log('DEBUG: Auth token exists:', !!localStorage.getItem('dirfinal_auth_token'));
      console.log('DEBUG: Refresh token exists:', !!localStorage.getItem('dirfinal_refresh_token'));
      console.log('DEBUG: Auth token length:', localStorage.getItem('dirfinal_auth_token')?.length || 0);
      console.log('DEBUG: Auth token preview:', localStorage.getItem('dirfinal_auth_token')?.substring(0, 20) + '...');
      console.log('=== FAMILY CREATION DEBUG END ===');
      
      // 2025-01-28: ENHANCED - Use the new family inference endpoint for automatic family creation
      const response = await apiService.post('/family/groups/infer_family/', {
        address,
        island
      });
      
      // 2025-01-28: DEBUG - Log the actual response received
      console.log('=== FAMILY CREATION RESPONSE DEBUG ===');
      console.log('DEBUG: Response received:', response);
      console.log('DEBUG: Response status:', response.status);
      console.log('DEBUG: Response data:', response.data);
      console.log('=== END FAMILY CREATION RESPONSE DEBUG ===');
      
      if (response.data && response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      } else if (response.data && response.data.data) {
        // Handle case where response doesn't have success field but has data
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return {
        success: false,
        error: response.data?.error || response.data?.message || 'Failed to create family group'
      };
    } catch (error) {
      console.error('Error creating/updating family by address:', error);
      return {
        success: false,
        error: 'Failed to create family group'
      };
    }
  }
  
  // 2025-01-28: NEW - Method to use family inference endpoint specifically
  async inferFamilyByAddress(address: string, island: string): Promise<{
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('DEBUG: Using family inference endpoint for:', { address, island });
      
      const response = await apiService.post('/family/groups/infer_family/', {
        address,
        island
      });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: response.data?.error || 'Failed to infer family'
        };
      }
    } catch (error: any) {
      console.error('Error inferring family by address:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to infer family'
      };
    }
  }
  
  // 2025-01-31: NEW - Method to create sub-families when relationships change
  async createSubFamily(data: {
    address: string;
    island: string;
    parent_family_id?: number;
    members: Array<{
      entry_id: number;
      role: string;
    }>;
    relationships: Array<{
      person1_id: number;
      person2_id: number;
      relationship_type: string;
      notes?: string;
    }>;
    family_name?: string;
  }): Promise<{
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('DEBUG: Creating sub-family for:', data);
      
      const response = await apiService.post('/family/groups/create_sub_family/', data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: response.data?.error || 'Failed to create sub-family'
        };
      }
    } catch (error: any) {
      console.error('Error creating sub-family:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create sub-family'
      };
    }
  }
  
  // 2025-01-31: ENHANCED - Method to get all families at a specific address
  async getAllFamiliesByAddress(address: string, island: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
    total_families?: number;
    error?: string;
  }> {
    try {
      console.log('DEBUG: Getting all families for:', { address, island });
      console.log('DEBUG: Island type:', typeof island, 'Island value:', JSON.stringify(island));
      
      // 2025-01-31: DEBUG - Check if island is undefined or empty
      if (!island || island.trim() === '') {
        console.error('DEBUG: Island parameter is missing or empty:', { address, island });
        return {
          success: false,
          error: 'Island parameter is required but was not provided'
        };
      }
      
      console.log('DEBUG: Making API call to /family/groups/by_address/ with params:', { address, island });
      const response = await apiService.get('/family/groups/by_address/', {
        params: { address, island }
      });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
          total_families: response.data.total_families
        };
      } else {
        return {
          success: false,
          error: response.data?.error || 'Failed to get families'
        };
      }
    } catch (error: any) {
      console.error('Error getting families by address:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get families'
      };
    }
  }

  // 2025-01-31: NEW - Method to get all families at a specific address (ignoring island) for debugging
  async getAllFamiliesByAddressOnly(address: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
    total_families?: number;
    error?: string;
  }> {
    try {
      console.log('DEBUG: Getting all families by address only for:', { address });
      
      const response = await apiService.get('/family/groups/by_address_only/', {
        params: { address }
      });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
          total_families: response.data.total_families
        };
      } else {
        return {
          success: false,
          error: response.data?.error || 'Failed to get families by address only'
        };
      }
    } catch (error: any) {
      console.error('Error getting families by address only:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get families by address only'
      };
    }
  }

  // 2025-01-31: NEW - Debug method to get all families in the database
  async debugAllFamilies(): Promise<{
    success: boolean;
    total_families?: number;
    families?: any[];
    error?: string;
  }> {
    try {
      console.log('DEBUG: Getting all families in database for debugging');
      
      const response = await apiService.get('/family/groups/debug_all_families/');
      
      if (response.data && response.data.success) {
        return {
          success: true,
          total_families: response.data.total_families,
          families: response.data.families
        };
      } else {
        return {
          success: false,
          error: response.data?.error || 'Failed to get all families'
        };
      }
    } catch (error: any) {
      console.error('Error getting all families:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get all families'
      };
    }
  }
  
  // 2025-01-28: Added method to get family by address for family tree window
  async getFamilyByAddress(address: string, island: string): Promise<{
    success: boolean;
    data?: {
      id: number;
      name: string;
      description?: string;
      address: string;
      island: string;
      members: Array<{
        entry: {
          pid: number;
          name: string;
          contact?: string;
          dob?: string;
          address: string;
          island: string;
          atoll?: string;
          street?: string;
          ward?: string;
          party?: string;
          status?: string;
          remark?: string;
          email?: string;
          gender?: string;
          extra?: string;
          profession?: string;
          pep_status?: string;
          change_status?: string;
          requested_by?: string;
          batch?: string;
          image_status?: string;
          family_group_id?: number;
          nid?: string;
        };
        role: string;
        relationship?: string;
      }>;
      relationships: Array<{
        id: number;
        person1: number;
        person2: number;
        relationship_type: string;
        notes?: string;
        is_active: boolean;
      }>;
    };
    error?: string;
    notFound?: boolean; // 2025-01-28: NEW - Flag to indicate family not found vs actual error
  }> {
    try {
      // 2025-01-28: ENHANCED - Use the by_address endpoint to get existing family data
      const response = await apiService.get(`/family/groups/by_address/`, {
        params: { address, island }
      });
      
      // 2025-01-28: DEBUG - Log the actual response received
      console.log('=== FAMILY FETCH RESPONSE DEBUG ===');
      console.log('DEBUG: Response received:', response);
      console.log('DEBUG: Response data:', response.data);
      console.log('DEBUG: Members array:', response.data?.members);
      console.log('DEBUG: Relationships array:', response.data?.relationships);
      console.log('=== END FAMILY FETCH RESPONSE DEBUG ===');
      
      // 2025-01-28: FIXED - Django returns family data directly, not wrapped in success field
      if (response.data) {
        // Handle both single family and multiple families response
        const familyData = Array.isArray(response.data) ? response.data[0] : response.data;
        
        if (familyData && familyData.id) {
          // Transform Django response to expected frontend format
          const familyGroup = familyData;
          
          // Extract members from the family group
          const members = familyGroup.members || [];
          const relationships = familyGroup.all_relationships || familyGroup.relationships || [];
          
          return {
            success: true,
            data: {
              id: familyGroup.id,
              name: familyGroup.name,
              description: familyGroup.description,
              address: familyGroup.address,
              island: familyGroup.island,
              members: members.map((member: any) => ({
              entry: {
                pid: member.entry || member.entry_id || member.id,  // 2024-12-29: FIXED - entry is now just the ID
                name: member.entry_name || member.entry?.name || member.name || '',
                contact: member.entry_contact || member.entry?.contact || member.contact || '',
                dob: member.entry_dob || member.entry?.DOB || member.dob || '',
                address: member.entry?.address || member.entry_address || member.address || '',
                island: member.entry?.island || member.entry_island || member.island || '',
                atoll: member.entry?.atoll || '',
                street: member.entry?.street || '',
                ward: member.entry?.ward || '',
                party: member.entry?.party || '',
                status: member.entry?.status || '',
                remark: member.entry?.remark || '',
                email: member.entry?.email || '',
                gender: member.entry_gender || member.entry?.gender || '',
                extra: member.entry?.extra || '',
                profession: member.entry_profession || member.entry?.profession || '',
                pep_status: member.entry?.pep_status || '',
                change_status: member.entry?.change_status || 'Active',
                requested_by: member.entry?.requested_by || '',
                batch: member.entry?.batch || '',
                image_status: member.entry?.image_status || '',
                family_group_id: member.entry?.family_group_id || undefined,
                nid: member.entry_nid || member.entry?.nid || undefined,
                age: member.entry_age || member.entry?.age || undefined  // 2024-12-29: FIXED - Use entry_age from new serializer
              },
              role: member.role_in_family || member.role || 'other',
              relationship: member.relationship || ''
            })),
            relationships: relationships.map((rel: any) => ({
              id: rel.id,
              person1: rel.person1?.pid || rel.person1_id || rel.person1,
              person2: rel.person2?.pid || rel.person2_id || rel.person2,
              relationship_type: rel.relationship_type,
              notes: rel.notes || '',
              is_active: rel.is_active !== false
            }))
          }
        };
        } else {
          // 2025-01-28: NEW - Return not found instead of error for missing family groups
          return {
            success: false,
            notFound: true,
            error: 'No family group found for this address'
          };
        }
      }
    } catch (error: any) {
      console.error('Error fetching family by address:', error);
      
      // 2025-01-28: NEW - Handle 404 errors as "family not found" rather than actual errors
      if (error.response?.status === 404) {
        return {
          success: false,
          notFound: true,
          error: 'No family group found for this address'
        };
      }
      
      // Handle 401 errors gracefully
      if (error.response?.status === 401) {
        console.log('FamilyService: User not authenticated, cannot fetch family data');
        return {
          success: false,
          error: 'Please log in to view family information'
        };
      }
      
      return {
        success: false,
        error: 'Failed to fetch family data'
      };
    }
  }
}

export const familyService = new FamilyService();
export default familyService;
