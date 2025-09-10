// 2024-12-28: Global Person Registry Service
// Implements Phase 1 of Family Tree Enhancement Plan
// Uses PID as globally unique identifier for persons across all family contexts

import { apiService } from './api';

export interface GlobalPerson {
  pid: number;
  name: string;
  contact?: string;
  dob?: string;
  address?: string;
  island?: string;
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
  nid?: string;
  age?: number;
  // 2024-12-28: NEW - Global person metadata
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface GlobalRelationship {
  id: number;
  person1_pid: number;
  person2_pid: number;
  person1_name?: string;
  person2_name?: string;
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other';
  relationship_type_display?: string;
  notes?: string;
  is_active: boolean;
  // 2024-12-28: NEW - Relationship metadata for future-proofing
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
  // 2024-12-28: NEW - Family context (for backward compatibility)
  family_group_id?: number;
  family_group_name?: string;
}

export interface PersonFamilyContext {
  pid: number;
  family_group_id: number;
  family_group_name: string;
  role_in_family?: string;
  joined_at?: string;
}

class GlobalPersonRegistry {
  private personCache = new Map<number, GlobalPerson>();
  private relationshipCache = new Map<string, GlobalRelationship[]>();
  private personFamilyContextCache = new Map<number, PersonFamilyContext[]>();

  /**
   * Get a person by PID from global registry
   */
  async getPerson(pid: number): Promise<GlobalPerson | null> {
    // Check cache first
    if (this.personCache.has(pid)) {
      return this.personCache.get(pid)!;
    }

    try {
      // Fetch from backend using existing phonebook API
      const response = await apiService.get(`/directory/entries/${pid}/`);
      
      if (response.data) {
        const person: GlobalPerson = {
          pid: response.data.pid,
          name: response.data.name,
          contact: response.data.contact,
          dob: response.data.DOB,
          address: response.data.address,
          island: response.data.island,
          atoll: response.data.atoll,
          street: response.data.street,
          ward: response.data.ward,
          party: response.data.party,
          status: response.data.status,
          remark: response.data.remark,
          email: response.data.email,
          gender: response.data.gender,
          extra: response.data.extra,
          profession: response.data.profession,
          pep_status: response.data.pep_status,
          change_status: response.data.change_status,
          requested_by: response.data.requested_by,
          batch: response.data.batch,
          image_status: response.data.image_status,
          nid: response.data.nid,
          age: response.data.age,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at,
          is_active: response.data.change_status === 'Active'
        };

        // Cache the person
        this.personCache.set(pid, person);
        return person;
      }
    } catch (error) {
      console.error(`Error fetching person ${pid}:`, error);
    }

    return null;
  }

  /**
   * Get multiple persons by PIDs
   */
  async getPersons(pids: number[]): Promise<GlobalPerson[]> {
    const persons: GlobalPerson[] = [];
    
    for (const pid of pids) {
      const person = await this.getPerson(pid);
      if (person) {
        persons.push(person);
      }
    }
    
    return persons;
  }

  /**
   * Get all relationships for a person (global scope)
   */
  async getPersonRelationships(pid: number): Promise<GlobalRelationship[]> {
    const cacheKey = `person_${pid}`;
    
    // Check cache first
    if (this.relationshipCache.has(cacheKey)) {
      return this.relationshipCache.get(cacheKey)!;
    }

    try {
      // Fetch all relationships where this person is involved
      const response = await apiService.get(`/family/relationships/?person_pid=${pid}`);
      
      if (response.data && response.data.results) {
        const relationships: GlobalRelationship[] = response.data.results.map((rel: any) => ({
          id: rel.id,
          person1_pid: rel.person1?.pid || rel.person1,
          person2_pid: rel.person2?.pid || rel.person2,
          person1_name: rel.person1_name,
          person2_name: rel.person2_name,
          relationship_type: rel.relationship_type,
          relationship_type_display: rel.relationship_type_display,
          notes: rel.notes,
          is_active: rel.is_active,
          start_date: rel.start_date,
          end_date: rel.end_date,
          created_at: rel.created_at,
          updated_at: rel.updated_at,
          family_group_id: rel.family_group,
          family_group_name: rel.family_group_name
        }));

        // Cache the relationships
        this.relationshipCache.set(cacheKey, relationships);
        return relationships;
      }
    } catch (error) {
      console.error(`Error fetching relationships for person ${pid}:`, error);
    }

    return [];
  }

  /**
   * Get all family contexts for a person
   */
  async getPersonFamilyContexts(pid: number): Promise<PersonFamilyContext[]> {
    // Check cache first
    if (this.personFamilyContextCache.has(pid)) {
      return this.personFamilyContextCache.get(pid)!;
    }

    try {
      // Fetch family memberships for this person
      const response = await apiService.get(`/family/members/?person_pid=${pid}`);
      
      if (response.data && response.data.results) {
        const contexts: PersonFamilyContext[] = response.data.results.map((member: any) => ({
          pid: member.entry?.pid || member.entry_id,
          family_group_id: member.family_group,
          family_group_name: member.family_group_name,
          role_in_family: member.role_in_family,
          joined_at: member.joined_at
        }));

        // Cache the contexts
        this.personFamilyContextCache.set(pid, contexts);
        return contexts;
      }
    } catch (error) {
      console.error(`Error fetching family contexts for person ${pid}:`, error);
    }

    return [];
  }

  /**
   * Get all connected persons (through relationships) for a given person
   */
  async getConnectedPersons(pid: number, maxDepth: number = 2): Promise<{
    persons: GlobalPerson[];
    relationships: GlobalRelationship[];
  }> {
    const visitedPids = new Set<number>();
    const allPersons: GlobalPerson[] = [];
    const allRelationships: GlobalRelationship[] = [];

    const explorePerson = async (currentPid: number, depth: number) => {
      if (depth > maxDepth || visitedPids.has(currentPid)) {
        return;
      }

      visitedPids.add(currentPid);

      // Get the person
      const person = await this.getPerson(currentPid);
      if (person) {
        allPersons.push(person);
      }

      // Get relationships for this person
      const relationships = await this.getPersonRelationships(currentPid);
      allRelationships.push(...relationships);

      // Explore connected persons
      for (const rel of relationships) {
        if (rel.is_active) {
          const connectedPid = rel.person1_pid === currentPid ? rel.person2_pid : rel.person1_pid;
          await explorePerson(connectedPid, depth + 1);
        }
      }
    };

    await explorePerson(pid, 0);

    return {
      persons: allPersons,
      relationships: allRelationships
    };
  }

  /**
   * Create a new relationship between two persons
   */
  async createRelationship(
    person1_pid: number,
    person2_pid: number,
    relationship_type: string,
    family_group_id?: number,
    notes?: string
  ): Promise<GlobalRelationship | null> {
    try {
      const response = await apiService.post('/family/relationships/', {
        person1: person1_pid,
        person2: person2_pid,
        relationship_type,
        family_group: family_group_id,
        notes
      });

      if (response.data) {
        const relationship: GlobalRelationship = {
          id: response.data.id,
          person1_pid: response.data.person1,
          person2_pid: response.data.person2,
          person1_name: response.data.person1_name,
          person2_name: response.data.person2_name,
          relationship_type: response.data.relationship_type,
          relationship_type_display: response.data.relationship_type_display,
          notes: response.data.notes,
          is_active: response.data.is_active,
          family_group_id: response.data.family_group,
          family_group_name: response.data.family_group_name,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at
        };

        // Clear caches for both persons
        this.relationshipCache.delete(`person_${person1_pid}`);
        this.relationshipCache.delete(`person_${person2_pid}`);

        return relationship;
      }
    } catch (error) {
      console.error('Error creating relationship:', error);
    }

    return null;
  }

  /**
   * Update a relationship
   */
  async updateRelationship(
    relationshipId: number,
    updates: Partial<GlobalRelationship>
  ): Promise<GlobalRelationship | null> {
    try {
      const response = await apiService.patch(`/family/relationships/${relationshipId}/`, updates);

      if (response.data) {
        const relationship: GlobalRelationship = {
          id: response.data.id,
          person1_pid: response.data.person1,
          person2_pid: response.data.person2,
          person1_name: response.data.person1_name,
          person2_name: response.data.person2_name,
          relationship_type: response.data.relationship_type,
          relationship_type_display: response.data.relationship_type_display,
          notes: response.data.notes,
          is_active: response.data.is_active,
          family_group_id: response.data.family_group,
          family_group_name: response.data.family_group_name,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at
        };

        // Clear caches for both persons
        this.relationshipCache.delete(`person_${relationship.person1_pid}`);
        this.relationshipCache.delete(`person_${relationship.person2_pid}`);

        return relationship;
      }
    } catch (error) {
      console.error('Error updating relationship:', error);
    }

    return null;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.personCache.clear();
    this.relationshipCache.clear();
    this.personFamilyContextCache.clear();
  }

  /**
   * Clear cache for a specific person
   */
  clearPersonCache(pid: number): void {
    this.personCache.delete(pid);
    this.relationshipCache.delete(`person_${pid}`);
    this.personFamilyContextCache.delete(pid);
  }
}

export const globalPersonRegistry = new GlobalPersonRegistry();
