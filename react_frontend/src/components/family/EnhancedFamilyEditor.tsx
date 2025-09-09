// 2024-12-28: Enhanced family tree editor with intuitive role assignment and visual interface

import React, { useState, useEffect, useMemo } from 'react';
import { PhoneBookEntry } from '../../types/directory';
import { SpecificFamilyRole, EnhancedFamilyMember, FamilyValidationError } from '../../types/enhancedFamily';
import { FAMILY_ROLE_DEFINITIONS, getRoleSuggestions } from '../../data/familyRoleDefinitions';
import FamilyPositionGrid from './FamilyPositionGrid';

interface FamilyRelationship {
  id: number;
  person1: number;
  person2: number;
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other';
  notes?: string;
  is_active: boolean;
}

interface EnhancedFamilyEditorProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  island: string;
  members: PhoneBookEntry[];
  onSave: (familyData: any) => void;
  initialFamilyData?: {
    members: Array<{
      person: PhoneBookEntry;
      role: SpecificFamilyRole;
    }>;
  };
  relationships?: FamilyRelationship[];
}

const EnhancedFamilyEditor: React.FC<EnhancedFamilyEditorProps> = ({
  isOpen,
  onClose,
  address,
  island,
  members,
  onSave,
  initialFamilyData,
  relationships = []
}) => {
  const [familyMembers, setFamilyMembers] = useState<EnhancedFamilyMember[]>([]);
  const [validationErrors, setValidationErrors] = useState<FamilyValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAutoSuggest, setShowAutoSuggest] = useState(false);

  // Map generic roles to specific roles
  const mapGenericRoleToSpecific = (genericRole: string, person: PhoneBookEntry): SpecificFamilyRole => {
    // Handle direct matches first
    if (genericRole && FAMILY_ROLE_DEFINITIONS[genericRole as SpecificFamilyRole]) {
      return genericRole as SpecificFamilyRole;
    }
    
    // Map generic roles to specific roles based on gender and context
    switch (genericRole) {
      case 'parent':
        return person.gender === 'M' ? 'father' : person.gender === 'F' ? 'mother' : 'other';
      case 'child':
        return person.gender === 'M' ? 'son' : person.gender === 'F' ? 'daughter' : 'other';
      case 'spouse':
        return 'spouse';
      case 'sibling':
        return person.gender === 'M' ? 'brother' : person.gender === 'F' ? 'sister' : 'other';
      case 'grandparent':
        return person.gender === 'M' ? 'grandfather' : person.gender === 'F' ? 'grandmother' : 'other';
      case 'grandchild':
        return person.gender === 'M' ? 'grandson' : person.gender === 'F' ? 'granddaughter' : 'other';
      case 'aunt_uncle':
        return person.gender === 'M' ? 'uncle' : person.gender === 'F' ? 'aunt' : 'other';
      case 'niece_nephew':
        return person.gender === 'M' ? 'nephew' : person.gender === 'F' ? 'niece' : 'other';
      case 'member':
        // For generic "member" role, use age-based assignment
        return assignRoleByAgeAndGender(person);
      default:
        console.warn(`Unknown role "${genericRole}" for person ${person.name}, defaulting to "other"`);
        return 'other';
    }
  };

  // Helper function to assign role based on age and gender
  const assignRoleByAgeAndGender = (person: PhoneBookEntry): SpecificFamilyRole => {
    let age: number | undefined;
    if (person.DOB) {
      try {
        age = new Date().getFullYear() - new Date(person.DOB).getFullYear();
      } catch {
        age = undefined;
      }
    }

    if (age !== undefined) {
      if (age >= 18 && age <= 40) {
        // Young adults - likely children
        if (person.gender === 'M') {
          return 'son';
        } else if (person.gender === 'F') {
          return 'daughter';
        }
      } else if (age >= 40 && age <= 70) {
        // Middle-aged - likely parents
        if (person.gender === 'M') {
          return 'father';
        } else if (person.gender === 'F') {
          return 'mother';
        }
      } else if (age > 70) {
        // Elderly - likely grandparents
        if (person.gender === 'M') {
          return 'grandfather';
        } else if (person.gender === 'F') {
          return 'grandmother';
        }
      }
    }

    // Fallback based on gender only
    if (person.gender === 'M') {
      return 'son';
    } else if (person.gender === 'F') {
      return 'daughter';
    }

    return 'other';
  };

  // Auto-identify family members using relationships and age/gender
  const autoIdentifyFamilyMembers = (members: PhoneBookEntry[]): EnhancedFamilyMember[] => {
    if (!members.length) return [];

    console.log('Auto-identifying family members for:', members.length, 'members');
    console.log('Available relationships:', relationships.length);

    const enhancedMembers: EnhancedFamilyMember[] = [];
    const usedPeople = new Set<number>();

    // Build relationship maps
    const parentChildMap = new Map<number, number[]>();
    const childParentMap = new Map<number, number[]>();
    const spouseMap = new Map<number, number[]>();
    const siblingMap = new Map<number, number[]>();

    relationships.forEach(rel => {
      if (rel.is_active) {
        switch (rel.relationship_type) {
          case 'parent':
            if (!parentChildMap.has(rel.person1)) parentChildMap.set(rel.person1, []);
            parentChildMap.get(rel.person1)!.push(rel.person2);
            if (!childParentMap.has(rel.person2)) childParentMap.set(rel.person2, []);
            childParentMap.get(rel.person2)!.push(rel.person1);
            break;
          case 'spouse':
            if (!spouseMap.has(rel.person1)) spouseMap.set(rel.person1, []);
            spouseMap.get(rel.person1)!.push(rel.person2);
            if (!spouseMap.has(rel.person2)) spouseMap.set(rel.person2, []);
            spouseMap.get(rel.person2)!.push(rel.person1);
            break;
          case 'sibling':
            if (!siblingMap.has(rel.person1)) siblingMap.set(rel.person1, []);
            siblingMap.get(rel.person1)!.push(rel.person2);
            if (!siblingMap.has(rel.person2)) siblingMap.set(rel.person2, []);
            siblingMap.get(rel.person2)!.push(rel.person1);
            break;
        }
      }
    });

    // Calculate ages
    const membersWithAge = members.map(person => {
      let age: number | undefined;
      if (person.DOB) {
        try {
          age = new Date().getFullYear() - new Date(person.DOB).getFullYear();
        } catch {
          age = undefined;
        }
      }
      return { person, age };
    });

    // Find parents (people with children) - enhanced detection
    const parents = membersWithAge.filter(({ person }) => parentChildMap.has(person.pid));
    console.log('Found parents from relationships:', parents.length);
    parents.forEach(({ person }) => {
      if (usedPeople.has(person.pid)) return;
      
      let role: SpecificFamilyRole = 'other';
      if (person.gender === 'M') {
        role = 'father';
      } else if (person.gender === 'F') {
        role = 'mother';
      }
      
      if (role !== 'other') {
        console.log('Assigned parent role:', role, 'to', person.name);
        enhancedMembers.push({
          id: Date.now() + Math.random(),
          person,
          specific_role: role,
          generation_level: 1,
          is_primary: true
        });
        usedPeople.add(person.pid);
      }
    });

    // 2024-12-28: IMPROVED parent detection using age gap analysis (like SVG family tree)
    // Sort members by age to identify potential parents
    const sortedByAge = membersWithAge
      .filter(({ person }) => !usedPeople.has(person.pid))
      .sort((a, b) => (b.age || 0) - (a.age || 0));
    
    console.log('Found potential parents by age analysis:', sortedByAge.length);
    
    // Use the same logic as the working SVG family tree
    if (sortedByAge.length >= 2) {
      // Check if eldest can be a parent (has 12+ year gap to others)
      const eldest = sortedByAge[0];
      const eldestAge = eldest.age || 0;
      
      if (eldestAge > 0) {
        // Check if eldest has 12+ year gap to all other members
        const has12YearGap = sortedByAge.slice(1).every(({ age }) => {
          const memberAge = age || 0;
          return eldestAge - memberAge >= 12;
        });
        
        if (has12YearGap) {
          // Eldest can be first parent
          let role: SpecificFamilyRole = 'other';
          if (eldest.person.gender === 'M') {
            role = 'father';
          } else if (eldest.person.gender === 'F') {
            role = 'mother';
          }
          
          if (role !== 'other') {
            console.log('Assigned first parent by age gap analysis:', role, 'to', eldest.person.name);
            enhancedMembers.push({
              id: Date.now() + Math.random(),
              person: eldest.person,
              specific_role: role,
              generation_level: 1,
              is_primary: true
            });
            usedPeople.add(eldest.person.pid);
          }
          
          // Check if second oldest can be second parent (different gender, 12+ year gap to remaining)
          if (sortedByAge.length >= 2) {
            const secondOldest = sortedByAge[1];
            const secondOldestAge = secondOldest.age || 0;
            const eldestGender = eldest.person.gender?.toLowerCase();
            const secondOldestGender = secondOldest.person.gender?.toLowerCase();
            
            if (secondOldestAge > 0 && eldestGender && secondOldestGender && eldestGender !== secondOldestGender) {
              // Check if second parent has 12+ year gap to all remaining members
              const remainingMembers = sortedByAge.slice(2);
              const has12YearGapToRemaining = remainingMembers.every(({ age }) => {
                const memberAge = age || 0;
                return secondOldestAge - memberAge >= 12;
              });
              
              if (has12YearGapToRemaining) {
                let secondRole: SpecificFamilyRole = 'other';
                if (secondOldest.person.gender === 'M') {
                  secondRole = 'father';
                } else if (secondOldest.person.gender === 'F') {
                  secondRole = 'mother';
                }
                
                if (secondRole !== 'other') {
                  console.log('Assigned second parent by age gap analysis:', secondRole, 'to', secondOldest.person.name);
                  enhancedMembers.push({
                    id: Date.now() + Math.random(),
                    person: secondOldest.person,
                    specific_role: secondRole,
                    generation_level: 1,
                    is_primary: true
                  });
                  usedPeople.add(secondOldest.person.pid);
                }
              }
            }
          }
        }
      }
    }

    // Find children (people with parents)
    const children = membersWithAge.filter(({ person }) => childParentMap.has(person.pid));
    children.forEach(({ person }) => {
      if (usedPeople.has(person.pid)) return;
      
      let role: SpecificFamilyRole = 'other';
      if (person.gender === 'M') {
        role = 'son';
      } else if (person.gender === 'F') {
        role = 'daughter';
      }
      
      if (role !== 'other') {
        enhancedMembers.push({
          id: Date.now() + Math.random(),
          person,
          specific_role: role,
          generation_level: 2,
          is_primary: true
        });
        usedPeople.add(person.pid);
      }
    });

    // Find in-laws (spouses of children)
    children.forEach(({ person: child }) => {
      if (usedPeople.has(child.pid)) return;
      
      const childSpouses = spouseMap.get(child.pid) || [];
      childSpouses.forEach(spouseId => {
        const spouse = members.find(p => p.pid === spouseId);
        if (spouse && !usedPeople.has(spouse.pid)) {
          let role: SpecificFamilyRole = 'other';
          if (child.gender === 'M' && spouse.gender === 'F') {
            role = 'daughter_in_law'; // Wife of son
          } else if (child.gender === 'F' && spouse.gender === 'M') {
            role = 'son_in_law'; // Husband of daughter
          }
          
          if (role !== 'other') {
            enhancedMembers.push({
              id: Date.now() + Math.random(),
              person: spouse,
              specific_role: role,
              generation_level: 2,
              is_primary: true
            });
            usedPeople.add(spouse.pid);
          }
        }
      });
    });

    // 2024-12-28: REMOVED automatic grandparent detection
    // Users will manually identify grandparents and grandchildren
    // System should only auto-detect parents by age analysis

    // 2024-12-28: REMOVED hardcoded age thresholds for remaining members
    // Only assign children based on relationship data or age gap analysis
    // Users will manually assign grandparents and other roles
    const remainingMembers = membersWithAge.filter(({ person }) => !usedPeople.has(person.pid));
    
    // Only assign as children if they have parents or are significantly younger than identified parents
    remainingMembers.forEach(({ person, age }) => {
      if (usedPeople.has(person.pid)) return;
      
      // Check if this person is significantly younger than any identified parent
      const isChildOfIdentifiedParent = enhancedMembers.some(member => {
        if (member.specific_role !== 'father' && member.specific_role !== 'mother') return false;
        const parentAge = member.person.DOB ? new Date().getFullYear() - new Date(member.person.DOB).getFullYear() : undefined;
        return parentAge && age && (parentAge - age) >= 12;
      });
      
      if (isChildOfIdentifiedParent) {
        let role: SpecificFamilyRole = 'other';
        if (person.gender === 'M') {
          role = 'son';
        } else if (person.gender === 'F') {
          role = 'daughter';
        }
        
        if (role !== 'other') {
          console.log('Assigned child role by age gap to parent:', role, 'to', person.name);
          enhancedMembers.push({
            id: Date.now() + Math.random(),
            person,
            specific_role: role,
            generation_level: 2,
            is_primary: true
          });
          usedPeople.add(person.pid);
        }
      }
    });

    console.log('Auto-identification complete. Total assigned members:', enhancedMembers.length);
    console.log('Assigned roles:', enhancedMembers.map(m => `${m.person.name} -> ${m.specific_role}`));
    
    return enhancedMembers;
  };

  // Initialize family data
  useEffect(() => {
    if (isOpen) {
      // 2024-12-28: ALWAYS clear state when opening smart edit to prevent data from previous addresses
      console.log('EnhancedFamilyEditor: Clearing all previous data and starting fresh for address:', address);
      setFamilyMembers([]);
      setError(null);
      setSuccessMessage(null);
      setValidationErrors([]);
      
      if (initialFamilyData?.members) {
        console.log('EnhancedFamilyEditor: Loading initial family data:', initialFamilyData.members);
        
        // Load existing family data with proper role mapping
        const enhancedMembers: EnhancedFamilyMember[] = initialFamilyData.members.map((member) => {
          console.log(`Mapping member ${member.person.name} with role "${member.role}"`);
          const specificRole = mapGenericRoleToSpecific(member.role, member.person);
          const roleDefinition = FAMILY_ROLE_DEFINITIONS[specificRole];
          
          console.log(`Mapped to specific role: "${specificRole}", generation: ${roleDefinition?.generation || 2}`);
          
          return {
            id: Date.now() + Math.random(),
            person: member.person,
            specific_role: specificRole,
            generation_level: roleDefinition?.generation || 2, // Default to children generation
            is_primary: true
          };
        });
        setFamilyMembers(enhancedMembers);
      } else {
        // Auto-identify family members in correct positions based on age and gender
        const autoIdentifiedMembers = autoIdentifyFamilyMembers(members);
        setFamilyMembers(autoIdentifiedMembers);
        
        // Show success message if members were auto-assigned
        if (autoIdentifiedMembers.length > 0) {
          console.log('Auto-assigned members:', autoIdentifiedMembers);
          setSuccessMessage(`Auto-assigned ${autoIdentifiedMembers.length} family members to roles. You can adjust as needed.`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          console.log('No members were auto-assigned. Members available:', members.length);
        }
      }
    }
  }, [isOpen, address, initialFamilyData, members]); // 2024-12-28: FIXED - Added address dependency

  // Auto-suggest family structure based on age and gender
  const autoSuggestedStructure = useMemo(() => {
    if (!members.length) return [];

    const suggestions: Array<{
      person: PhoneBookEntry;
      suggestedRole: SpecificFamilyRole;
      confidence: number;
      reason: string;
    }> = [];

    // Calculate ages for all members
    const membersWithAge = members.map(person => {
      let age: number | undefined;
      if (person.DOB) {
        try {
          age = new Date().getFullYear() - new Date(person.DOB).getFullYear();
        } catch {
          age = undefined;
        }
      }
      return { person, age };
    });

    // Sort by age (oldest first)
    const sortedMembers = membersWithAge.sort((a, b) => (b.age || 0) - (a.age || 0));

    // Apply smart role assignment rules
    sortedMembers.forEach(({ person, age }) => {
      const roleSuggestions = getRoleSuggestions(age, person.gender as 'M' | 'F' | undefined);
      
      if (roleSuggestions.length > 0) {
        let suggestedRole = roleSuggestions[0].role;
        let confidence = 0.8;
        let reason = `Based on age ${age || 'unknown'} and gender ${person.gender || 'unknown'}`;

        // Special logic for family structure - only suggest parents, not grandparents
        if (age && age >= 25) {
          // Likely parent (no automatic grandparent suggestion)
          if (person.gender === 'M') {
            suggestedRole = 'father';
          } else if (person.gender === 'F') {
            suggestedRole = 'mother';
          }
          confidence = 0.8;
          reason = `Age ${age} suggests parent role`;
        } else if (age && age < 25) {
          // Likely child
          if (person.gender === 'M') {
            suggestedRole = 'son';
          } else if (person.gender === 'F') {
            suggestedRole = 'daughter';
          }
          confidence = 0.85;
          reason = `Age ${age} suggests child role`;
        }

        suggestions.push({
          person,
          suggestedRole,
          confidence,
          reason
        });
      }
    });

    return suggestions;
  }, [members]);

  // Validate family structure
  const validateFamily = (members: EnhancedFamilyMember[]): FamilyValidationError[] => {
    const errors: FamilyValidationError[] = [];

    // Check for duplicate unique roles
    const roleCountMap = new Map<SpecificFamilyRole, number>();
    members.forEach(member => {
      roleCountMap.set(member.specific_role, (roleCountMap.get(member.specific_role) || 0) + 1);
    });

    const uniqueRoles: SpecificFamilyRole[] = ['father', 'mother'];
    uniqueRoles.forEach(role => {
      const count = roleCountMap.get(role) || 0;
      if (count > 1) {
        errors.push({
          type: 'duplicate_role',
          message: `Multiple people assigned as ${FAMILY_ROLE_DEFINITIONS[role].label}`,
          affected_person_ids: members.filter(m => m.specific_role === role).map(m => m.person.pid),
          suggested_fix: 'Only one person can be assigned to this role'
        });
      }
    });

    // Check age consistency
    const father = members.find(m => m.specific_role === 'father');
    const mother = members.find(m => m.specific_role === 'mother');
    const children = members.filter(m => ['son', 'daughter'].includes(m.specific_role));

    children.forEach(child => {
      const childAge = getPersonAge(child.person);
      
      if (father && childAge !== undefined) {
        const fatherAge = getPersonAge(father.person);
        if (fatherAge !== undefined && childAge >= fatherAge) {
          errors.push({
            type: 'age_conflict',
            message: `${child.person.name} (${childAge}) is older than or same age as father ${father.person.name} (${fatherAge})`,
            affected_person_ids: [child.person.pid, father.person.pid],
            suggested_fix: 'Check birth dates or role assignments'
          });
        }
      }

      if (mother && childAge !== undefined) {
        const motherAge = getPersonAge(mother.person);
        if (motherAge !== undefined && childAge >= motherAge) {
          errors.push({
            type: 'age_conflict',
            message: `${child.person.name} (${childAge}) is older than or same age as mother ${mother.person.name} (${motherAge})`,
            affected_person_ids: [child.person.pid, mother.person.pid],
            suggested_fix: 'Check birth dates or role assignments'
          });
        }
      }
    });

    return errors;
  };

  // Get person age
  const getPersonAge = (person: PhoneBookEntry): number | undefined => {
    if (!person.DOB) return undefined;
    try {
      return new Date().getFullYear() - new Date(person.DOB).getFullYear();
    } catch {
      return undefined;
    }
  };

  // Handle member role update
  const handleMemberUpdate = (personId: number, role: SpecificFamilyRole) => {
    setFamilyMembers(prev => {
      const updated = prev.map(member => 
        member.person.pid === personId 
          ? { 
              ...member, 
              specific_role: role,
              generation_level: FAMILY_ROLE_DEFINITIONS[role].generation
            }
          : member
      );
      setValidationErrors(validateFamily(updated));
      return updated;
    });
    setSuccessMessage(`Role updated successfully`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle adding new member
  const handleMemberAdd = (person: PhoneBookEntry, role: SpecificFamilyRole) => {
    const newMember: EnhancedFamilyMember = {
      id: Date.now(),
      person,
      specific_role: role,
      generation_level: FAMILY_ROLE_DEFINITIONS[role].generation,
      is_primary: true
    };
    
    setFamilyMembers(prev => {
      const updated = [...prev, newMember];
      setValidationErrors(validateFamily(updated));
      return updated;
    });
    setSuccessMessage(`Added ${person.name} as ${FAMILY_ROLE_DEFINITIONS[role].label}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle member removal
  const handleMemberRemove = (personId: number) => {
    setFamilyMembers(prev => {
      const updated = prev.filter(member => member.person.pid !== personId);
      setValidationErrors(validateFamily(updated));
      return updated;
    });
    setSuccessMessage(`Family member removed`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Apply auto-suggestions
  const handleApplyAutoSuggestions = () => {
    const newMembers: EnhancedFamilyMember[] = autoSuggestedStructure.map((suggestion, index) => ({
      id: Date.now() + index,
      person: suggestion.person,
      specific_role: suggestion.suggestedRole,
      generation_level: FAMILY_ROLE_DEFINITIONS[suggestion.suggestedRole].generation,
      is_primary: true
    }));

    setFamilyMembers(newMembers);
    setValidationErrors(validateFamily(newMembers));
    setShowAutoSuggest(false);
    setSuccessMessage(`Applied auto-suggestions for ${newMembers.length} family members`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Manual auto-assign function for unassigned members
  const handleManualAutoAssign = () => {
    console.log('Manual auto-assign triggered. Available members:', members.length);
    console.log('Currently assigned members:', familyMembers.length);
    
    const autoIdentifiedMembers = autoIdentifyFamilyMembers(members);
    console.log('Auto-identified members:', autoIdentifiedMembers);
    
    // Only assign unassigned members
    const currentlyAssigned = new Set(familyMembers.map(m => m.person.pid));
    const newAssignments = autoIdentifiedMembers.filter(m => !currentlyAssigned.has(m.person.pid));
    
    console.log('New assignments to add:', newAssignments);
    
    if (newAssignments.length > 0) {
      setFamilyMembers(prev => {
        const updated = [...prev, ...newAssignments];
        setValidationErrors(validateFamily(updated));
        return updated;
      });
      setSuccessMessage(`Auto-assigned ${newAssignments.length} additional family members to roles.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setSuccessMessage('No additional members could be auto-assigned.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Save family data
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert enhanced family data to backend format
      const familyData = {
        address,
        island,
        members: familyMembers.map(member => ({
          entry_id: member.person.pid,
          role: member.specific_role
        })),
        relationships: generateRelationshipsFromRoles(familyMembers)
      };

      await onSave(familyData);
      setSuccessMessage('Family structure saved successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setError(`Failed to save family structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate relationships from role assignments
  const generateRelationshipsFromRoles = (members: EnhancedFamilyMember[]) => {
    const relationships: Array<{
      person1_id: number;
      person2_id: number;
      relationship_type: string;
      notes: string;
    }> = [];

    // Find key family members
    const father = members.find(m => m.specific_role === 'father');
    const mother = members.find(m => m.specific_role === 'mother');
    const children = members.filter(m => ['son', 'daughter', 'brother', 'sister'].includes(m.specific_role));

    // Create parent-child relationships
    children.forEach(child => {
      if (father) {
        relationships.push({
          person1_id: father.person.pid,
          person2_id: child.person.pid,
          relationship_type: 'parent',
          notes: `${father.person.name} (father) → ${child.person.name} (${child.specific_role})`
        });
      }
      if (mother) {
        relationships.push({
          person1_id: mother.person.pid,
          person2_id: child.person.pid,
          relationship_type: 'parent',
          notes: `${mother.person.name} (mother) → ${child.person.name} (${child.specific_role})`
        });
      }
    });

    // Create spouse relationship
    if (father && mother) {
      relationships.push({
        person1_id: father.person.pid,
        person2_id: mother.person.pid,
        relationship_type: 'spouse',
        notes: `${father.person.name} (father) ↔ ${mother.person.name} (mother)`
      });
    }

    // Create sibling relationships
    for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        relationships.push({
          person1_id: children[i].person.pid,
          person2_id: children[j].person.pid,
          relationship_type: 'sibling',
          notes: `${children[i].person.name} (${children[i].specific_role}) ↔ ${children[j].person.name} (${children[j].specific_role})`
        });
      }
    }

    return relationships;
  };

  const getAvailablePeople = () => {
    const assignedPeople = familyMembers.map(m => m.person.pid);
    return members.filter(person => !assignedPeople.includes(person.pid));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[320px] overflow-hidden flex flex-col ml-32">
        {/* Ultra Compact Header */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-gray-300 bg-white">
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-semibold text-black">Family Editor</h2>
            <p className="text-gray-600 text-xs truncate">{address}, {island}</p>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onClose}
              className="text-black hover:text-gray-600 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-1">
          {/* Status Messages - Ultra Compact */}
          {successMessage && (
            <div className="mb-0.5 p-0.5 bg-gray-100 border border-gray-300 text-black rounded text-xs">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-0.5 p-0.5 bg-gray-100 border border-gray-300 text-black rounded text-xs">
              {error}
            </div>
          )}

          {/* Validation Errors - Ultra Compact */}
          {validationErrors.length > 0 && (
            <div className="mb-0.5 p-0.5 bg-gray-100 border border-gray-300 rounded">
              <h4 className="font-medium text-black mb-0.5 text-xs">Issues: {validationErrors.length}</h4>
            </div>
          )}

          {/* Auto-Suggest Section - Ultra Compact */}
          {autoSuggestedStructure.length > 0 && familyMembers.length === 0 && (
            <div className="mb-0.5 p-0.5 bg-gray-100 border border-gray-300 rounded">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-medium text-black text-xs">Suggestions</h4>
                <button
                  onClick={() => setShowAutoSuggest(!showAutoSuggest)}
                  className="text-xs text-black hover:text-gray-600"
                >
                  {showAutoSuggest ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showAutoSuggest && (
                <div>
                  <div className="grid grid-cols-2 gap-0.5 mb-0.5">
                    {autoSuggestedStructure.slice(0, 4).map((suggestion, index) => (
                      <div key={index} className="p-0.5 bg-white rounded border border-gray-300">
                        <div className="font-medium text-xs text-black truncate">{suggestion.person.name}</div>
                        <div className="text-gray-600 text-xs">→ {FAMILY_ROLE_DEFINITIONS[suggestion.suggestedRole].label}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleApplyAutoSuggestions}
                    className="w-full py-0.5 bg-black text-white rounded hover:bg-gray-800 text-xs"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Family Grid - All Members Visible */}
          <FamilyPositionGrid
            members={familyMembers}
            availablePeople={getAvailablePeople()}
            onMemberUpdate={handleMemberUpdate}
            onMemberAdd={handleMemberAdd}
            onMemberRemove={handleMemberRemove}
            onAutoAssign={handleManualAutoAssign}
          />
        </div>

        {/* Ultra Compact Footer Actions */}
        <div className="flex items-center justify-between px-2 py-1 border-t border-gray-300 bg-white">
          <div className="text-xs text-gray-600">
            {familyMembers.length} members
          </div>
          <div className="flex space-x-1">
            <button
              onClick={onClose}
              className="px-2 py-1 border border-gray-300 text-black hover:bg-gray-100 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || validationErrors.length > 0}
              className="px-2 py-1 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFamilyEditor;
