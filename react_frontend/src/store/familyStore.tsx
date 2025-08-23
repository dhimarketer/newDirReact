// 2025-01-27: Creating family store for Phase 2 React frontend family management

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  FamilyGroup, 
  FamilyMember, 
  FamilyRole, 
  FamilyInvitation, 
  FamilyTree,
  FamilyStats,
  PaginatedResponse,
  LoadingState 
} from '../types';
import { familyService } from '../services/familyService';

interface FamilyState {
  // Family Groups
  familyGroups: FamilyGroup[];
  currentFamilyGroup: FamilyGroup | null;
  familyGroupsLoading: LoadingState;
  familyGroupsError: string | null;
  
  // Family Members
  familyMembers: FamilyMember[];
  familyMembersLoading: LoadingState;
  familyMembersError: string | null;
  
  // Family Roles
  familyRoles: FamilyRole[];
  familyRolesLoading: LoadingState;
  
  // Family Invitations
  familyInvitations: FamilyInvitation[];
  invitationsLoading: LoadingState;
  
  // Family Tree
  familyTree: FamilyTree | null;
  treeLoading: LoadingState;
  
  // Family Statistics
  familyStats: FamilyStats | null;
  statsLoading: LoadingState;
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  
  // Search and Filters
  searchQuery: string;
  filters: {
    isPublic?: boolean;
    tags?: string[];
    role?: string;
    status?: string;
  };
}

interface FamilyActions {
  // Family Groups
  fetchFamilyGroups: (params?: {
    page?: number;
    search?: string;
    is_public?: boolean;
    created_by?: number;
  }) => Promise<void>;
  
  fetchFamilyGroup: (id: number) => Promise<void>;
  
  createFamilyGroup: (data: Partial<FamilyGroup>) => Promise<FamilyGroup | null>;
  
  updateFamilyGroup: (id: number, data: Partial<FamilyGroup>) => Promise<FamilyGroup | null>;
  
  deleteFamilyGroup: (id: number) => Promise<boolean>;
  
  // Family Members
  fetchFamilyMembers: (familyId: number, params?: {
    page?: number;
    role?: string;
    search?: string;
  }) => Promise<void>;
  
  addFamilyMember: (familyId: number, data: {
    user: number;
    role: number;
    relationship: string;
    is_admin?: boolean;
    notes?: string;
  }) => Promise<FamilyMember | null>;
  
  updateFamilyMember: (familyId: number, memberId: number, data: Partial<FamilyMember>) => Promise<FamilyMember | null>;
  
  removeFamilyMember: (familyId: number, memberId: number) => Promise<boolean>;
  
  // Family Roles
  fetchFamilyRoles: () => Promise<void>;
  
  // Family Invitations
  fetchFamilyInvitations: (familyId: number, params?: {
    status?: 'pending' | 'accepted' | 'declined' | 'expired';
    page?: number;
  }) => Promise<void>;
  
  sendFamilyInvitation: (familyId: number, data: {
    invited_user: number;
    role: number;
    message?: string;
    expires_at?: string;
  }) => Promise<FamilyInvitation | null>;
  
  respondToInvitation: (invitationId: number, action: 'accept' | 'decline') => Promise<boolean>;
  
  // Family Tree
  fetchFamilyTree: (familyId: number) => Promise<void>;
  
  generateFamilyTree: (familyId: number) => Promise<void>;
  
  // Family Statistics
  fetchFamilyStats: () => Promise<void>;
  
  // Search and Discovery
  searchFamilies: (query: string, params?: {
    page?: number;
    is_public?: boolean;
    tags?: string[];
  }) => Promise<void>;
  
  // Utility Actions
  setCurrentFamilyGroup: (family: FamilyGroup | null) => void;
  
  setSearchQuery: (query: string) => void;
  
  setFilters: (filters: Partial<FamilyState['filters']>) => void;
  
  resetPagination: () => void;
  
  clearErrors: () => void;
  
  resetState: () => void;
}

const initialState: FamilyState = {
  // Family Groups
  familyGroups: [],
  currentFamilyGroup: null,
  familyGroupsLoading: 'idle',
  familyGroupsError: null,
  
  // Family Members
  familyMembers: [],
  familyMembersLoading: 'idle',
  familyMembersError: null,
  
  // Family Roles
  familyRoles: [],
  familyRolesLoading: 'idle',
  
  // Family Invitations
  familyInvitations: [],
  invitationsLoading: 'idle',
  
  // Family Tree
  familyTree: null,
  treeLoading: 'idle',
  
  // Family Statistics
  familyStats: null,
  statsLoading: 'idle',
  
  // Pagination
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  },
  
  // Search and Filters
  searchQuery: '',
  filters: {},
};

export const useFamilyStore = create<FamilyState & FamilyActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Family Groups
      fetchFamilyGroups: async (params = {}) => {
        set({ familyGroupsLoading: 'loading', familyGroupsError: null });
        
        try {
          const response = await familyService.getFamilyGroups({
            page: get().pagination.page,
            pageSize: get().pagination.pageSize,
            ...params,
          });
          
          set({
            familyGroups: response.results,
            familyGroupsLoading: 'success',
            pagination: {
              page: response.next ? get().pagination.page + 1 : get().pagination.page,
              pageSize: get().pagination.pageSize,
              total: response.count,
              hasNext: !!response.next,
              hasPrevious: !!response.previous,
            },
          });
        } catch (error) {
          set({
            familyGroupsLoading: 'error',
            familyGroupsError: error instanceof Error ? error.message : 'Failed to fetch family groups',
          });
        }
      },
      
      fetchFamilyGroup: async (id: number) => {
        set({ familyGroupsLoading: 'loading', familyGroupsError: null });
        
        try {
          const familyGroup = await familyService.getFamilyGroup(id);
          set({
            currentFamilyGroup: familyGroup,
            familyGroupsLoading: 'success',
          });
        } catch (error) {
          set({
            familyGroupsLoading: 'error',
            familyGroupsError: error instanceof Error ? error.message : 'Failed to fetch family group',
          });
        }
      },
      
      createFamilyGroup: async (data: Partial<FamilyGroup>) => {
        try {
          const newFamilyGroup = await familyService.createFamilyGroup(data);
          set((state) => ({
            familyGroups: [newFamilyGroup, ...state.familyGroups],
            currentFamilyGroup: newFamilyGroup,
          }));
          return newFamilyGroup;
        } catch (error) {
          set({
            familyGroupsError: error instanceof Error ? error.message : 'Failed to create family group',
          });
          return null;
        }
      },
      
      updateFamilyGroup: async (id: number, data: Partial<FamilyGroup>) => {
        try {
          const updatedFamilyGroup = await familyService.updateFamilyGroup(id, data);
          set((state) => ({
            familyGroups: state.familyGroups.map(fg => 
              fg.id === id ? updatedFamilyGroup : fg
            ),
            currentFamilyGroup: state.currentFamilyGroup?.id === id ? updatedFamilyGroup : state.currentFamilyGroup,
          }));
          return updatedFamilyGroup;
        } catch (error) {
          set({
            familyGroupsError: error instanceof Error ? error.message : 'Failed to update family group',
          });
          return null;
        }
      },
      
      deleteFamilyGroup: async (id: number) => {
        try {
          await familyService.deleteFamilyGroup(id);
          set((state) => ({
            familyGroups: state.familyGroups.filter(fg => fg.id !== id),
            currentFamilyGroup: state.currentFamilyGroup?.id === id ? null : state.currentFamilyGroup,
          }));
          return true;
        } catch (error) {
          set({
            familyGroupsError: error instanceof Error ? error.message : 'Failed to delete family group',
          });
          return false;
        }
      },
      
      // Family Members
      fetchFamilyMembers: async (familyId: number, params = {}) => {
        set({ familyMembersLoading: 'loading', familyMembersError: null });
        
        try {
          const response = await familyService.getFamilyMembers(familyId, params);
          set({
            familyMembers: response.results,
            familyMembersLoading: 'success',
          });
        } catch (error) {
          set({
            familyMembersLoading: 'error',
            familyMembersError: error instanceof Error ? error.message : 'Failed to fetch family members',
          });
        }
      },
      
      addFamilyMember: async (familyId: number, data) => {
        try {
          const newMember = await familyService.addFamilyMember(familyId, data);
          set((state) => ({
            familyMembers: [...state.familyMembers, newMember],
          }));
          return newMember;
        } catch (error) {
          set({
            familyMembersError: error instanceof Error ? error.message : 'Failed to add family member',
          });
          return null;
        }
      },
      
      updateFamilyMember: async (familyId: number, memberId: number, data: Partial<FamilyMember>) => {
        try {
          const updatedMember = await familyService.updateFamilyMember(familyId, memberId, data);
          set((state) => ({
            familyMembers: state.familyMembers.map(member => 
              member.id === memberId ? updatedMember : member
            ),
          }));
          return updatedMember;
        } catch (error) {
          set({
            familyMembersError: error instanceof Error ? error.message : 'Failed to update family member',
          });
          return null;
        }
      },
      
      removeFamilyMember: async (familyId: number, memberId: number) => {
        try {
          await familyService.removeFamilyMember(familyId, memberId);
          set((state) => ({
            familyMembers: state.familyMembers.filter(member => member.id !== memberId),
          }));
          return true;
        } catch (error) {
          set({
            familyMembersError: error instanceof Error ? error.message : 'Failed to remove family member',
          });
          return false;
        }
      },
      
      // Family Roles
      fetchFamilyRoles: async () => {
        set({ familyRolesLoading: 'loading' });
        
        try {
          const roles = await familyService.getFamilyRoles();
          set({
            familyRoles: roles,
            familyRolesLoading: 'success',
          });
        } catch (error) {
          set({ familyRolesLoading: 'error' });
        }
      },
      
      // Family Invitations
      fetchFamilyInvitations: async (familyId: number, params = {}) => {
        set({ invitationsLoading: 'loading' });
        
        try {
          const response = await familyService.getFamilyInvitations(familyId, params);
          set({
            familyInvitations: response.results,
            invitationsLoading: 'success',
          });
        } catch (error) {
          set({ invitationsLoading: 'error' });
        }
      },
      
      sendFamilyInvitation: async (familyId: number, data) => {
        try {
          const invitation = await familyService.sendFamilyInvitation(familyId, data);
          set((state) => ({
            familyInvitations: [invitation, ...state.familyInvitations],
          }));
          return invitation;
        } catch (error) {
          return null;
        }
      },
      
      respondToInvitation: async (invitationId: number, action: 'accept' | 'decline') => {
        try {
          await familyService.respondToInvitation(invitationId, action);
          set((state) => ({
            familyInvitations: state.familyInvitations.filter(inv => inv.id !== invitationId),
          }));
          return true;
        } catch (error) {
          return false;
        }
      },
      
      // Family Tree
      fetchFamilyTree: async (familyId: number) => {
        set({ treeLoading: 'loading' });
        
        try {
          const tree = await familyService.getFamilyTree(familyId);
          set({
            familyTree: tree,
            treeLoading: 'success',
          });
        } catch (error) {
          set({ treeLoading: 'error' });
        }
      },
      
      generateFamilyTree: async (familyId: number) => {
        set({ treeLoading: 'loading' });
        
        try {
          const tree = await familyService.generateFamilyTree(familyId);
          set({
            familyTree: tree,
            treeLoading: 'success',
          });
        } catch (error) {
          set({ treeLoading: 'error' });
        }
      },
      
      // Family Statistics
      fetchFamilyStats: async () => {
        set({ statsLoading: 'loading' });
        
        try {
          const stats = await familyService.getFamilyStats();
          set({
            familyStats: stats,
            statsLoading: 'success',
          });
        } catch (error) {
          set({ statsLoading: 'error' });
        }
      },
      
      // Search and Discovery
      searchFamilies: async (query: string, params = {}) => {
        set({ familyGroupsLoading: 'loading', familyGroupsError: null });
        
        try {
          const response = await familyService.searchFamilies(query, params);
          set({
            familyGroups: response.results,
            familyGroupsLoading: 'success',
            pagination: {
              page: response.next ? get().pagination.page + 1 : get().pagination.page,
              pageSize: get().pagination.pageSize,
              total: response.count,
              hasNext: !!response.next,
              hasPrevious: !!response.previous,
            },
          });
        } catch (error) {
          set({
            familyGroupsLoading: 'error',
            familyGroupsError: error instanceof Error ? error.message : 'Failed to search families',
          });
        }
      },
      
      // Utility Actions
      setCurrentFamilyGroup: (family: FamilyGroup | null) => {
        set({ currentFamilyGroup: family });
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },
      
      setFilters: (filters: Partial<FamilyState['filters']>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },
      
      resetPagination: () => {
        set({
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            hasNext: false,
            hasPrevious: false,
          },
        });
      },
      
      clearErrors: () => {
        set({
          familyGroupsError: null,
          familyMembersError: null,
        });
      },
      
      resetState: () => {
        set(initialState);
      },
    }),
    {
      name: 'family-store',
    }
  )
);
