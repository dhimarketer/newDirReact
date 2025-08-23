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

  async deleteFamilyGroup(id: number): Promise<void> {
    await apiService.delete(`/family/groups/${id}/`);
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
}

export const familyService = new FamilyService();
export default familyService;
