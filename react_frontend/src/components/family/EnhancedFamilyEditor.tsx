// 2024-12-28: Enhanced family tree editor with intuitive role assignment and visual interface

import React, { useState, useEffect, useMemo } from 'react';
import { PhoneBookEntry } from '../../types/directory';
import { SpecificFamilyRole, EnhancedFamilyMember, FamilyValidationError } from '../../types/enhancedFamily';
import { FAMILY_ROLE_DEFINITIONS, getRoleSuggestions } from '../../data/familyRoleDefinitions';
import FamilyPositionGrid from './FamilyPositionGrid';
import MemberSearchModal from './MemberSearchModal';
import { useUI } from '../../store/uiStore';

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
  console.log('🔍 EnhancedFamilyEditor: Component is rendering!', { isOpen, address, island });
  const { setSidebarOpen } = useUI();
  const [familyMembers, setFamilyMembers] = useState<EnhancedFamilyMember[]>([]);
  const [validationErrors, setValidationErrors] = useState<FamilyValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAutoSuggest, setShowAutoSuggest] = useState(false);
  const [showMultiGenModal, setShowMultiGenModal] = useState(false);
  const [suggestedFamilies, setSuggestedFamilies] = useState<Array<{
    name: string;
    address: string;
    members: EnhancedFamilyMember[];
    generation: number;
    parentFamilyId?: number; // ID of the parent family
    parentMemberId?: number; // ID of the parent member who connects to this family
  }>>([]);
  
  // 2025-01-10: NEW - State for member search modal
  const [showMemberSearch, setShowMemberSearch] = useState(false);

  // Handle member selection from search
  const handleMemberSelect = (member: PhoneBookEntry) => {
    // Add the selected member to available people
    const newMember: EnhancedFamilyMember = {
      id: Date.now(),
      person: member,
      specific_role: 'other', // Default role, user can change it
      generation_level: 1,
      notes: `Added from ${member.address}, ${member.island}`
    };
    
    setFamilyMembers(prev => [...prev, newMember]);
    setSuccessMessage(`Added ${member.name} to family. You can now assign them a role.`);
  };

  // 2025-01-10: NEW - Check for selected member from search page
  useEffect(() => {
    const selectedMember = sessionStorage.getItem('selectedMember');
    console.log('🔍 EnhancedFamilyEditor: Checking for selectedMember:', !!selectedMember);
    
    if (selectedMember) {
      try {
        const memberData = JSON.parse(selectedMember);
        console.log('🔍 EnhancedFamilyEditor: Processing selectedMember:', memberData.name, 'with role:', memberData.selectedRole);
        
        // Check if member has a selected role
        if (memberData.selectedRole) {
          // Add member with specific role
          const newMember: EnhancedFamilyMember = {
            id: Date.now(), // Generate unique ID
            person: {
              pid: memberData.pid,
              name: memberData.name,
              contact: memberData.contact,
              nid: memberData.nid,
              address: memberData.address,
              atoll: memberData.atoll,
              island: memberData.island,
              party: memberData.party,
              profession: memberData.profession,
              gender: memberData.gender,
              age: memberData.age,
              remark: memberData.remark,
              pep_status: memberData.pep_status,
              change_status: memberData.change_status || 'Active'
            },
            specific_role: memberData.selectedRole,
            generation_level: 1, // Default generation level
            notes: `Added from ${memberData.address}, ${memberData.island}`
          };
          
          setFamilyMembers(prev => [...prev, newMember]);
          setSuccessMessage(`Added ${memberData.name} as ${FAMILY_ROLE_DEFINITIONS[memberData.selectedRole as SpecificFamilyRole]?.label || memberData.selectedRole}`);
        } else {
          // Fallback to generic member selection
          handleMemberSelect(memberData);
        }
        
        // Clear the session storage
        sessionStorage.removeItem('selectedMember');
      } catch (error) {
        console.error('Error parsing selected member:', error);
      }
    }
  }, []);

  // 2025-01-11: NEW - Function to save family data immediately
  const saveFamilyData = async (members: EnhancedFamilyMember[]) => {
    try {
      const familyData = {
        address,
        island,
        members: members.map(member => ({
          entry_id: member.person.pid,
          role: member.specific_role
        })),
        relationships: generateRelationshipsFromRoles(members)
      };

      await onSave(familyData);
      console.log('🔍 EnhancedFamilyEditor: Family data saved successfully after adding member');
    } catch (error) {
      console.error('🔍 EnhancedFamilyEditor: Error saving family data:', error);
      setError(`Failed to save family data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 2025-01-10: NEW - Check for dragged member from search results
  useEffect(() => {
    console.log('🔍 EnhancedFamilyEditor: Component mounted, checking for dragged members');
    console.log('🔍 EnhancedFamilyEditor: isOpen state:', isOpen);
    
    const checkForDraggedMember = () => {
      // 2025-01-11: NEW - Check if member was already added to stop polling
      const memberAdded = sessionStorage.getItem('memberAdded');
      if (memberAdded === 'true') {
        console.log('🔍 EnhancedFamilyEditor: Member already added, stopping polling');
        return;
      }
      
      // Check all possible sessionStorage keys
      const draggedMember = sessionStorage.getItem('draggedMember');
      const dragInProgress = sessionStorage.getItem('dragInProgress');
      const selectedMember = sessionStorage.getItem('selectedMember');
      const memberSelectionMode = sessionStorage.getItem('memberSelectionMode');
      const memberSelectionCallback = sessionStorage.getItem('memberSelectionCallback');
      
      console.log('🔍 EnhancedFamilyEditor: Checking for dragged member:', { 
        draggedMember: !!draggedMember, 
        dragInProgress, 
        selectedMember: !!selectedMember,
        memberSelectionMode,
        memberSelectionCallback: !!memberSelectionCallback
      });
      
      // Debug: Log all sessionStorage keys
      console.log('🔍 EnhancedFamilyEditor: All sessionStorage keys:', Object.keys(sessionStorage));
      console.log('🔍 EnhancedFamilyEditor: Full sessionStorage content:', {
        draggedMember: sessionStorage.getItem('draggedMember'),
        dragInProgress: sessionStorage.getItem('dragInProgress'),
        selectedMember: sessionStorage.getItem('selectedMember'),
        memberSelectionMode: sessionStorage.getItem('memberSelectionMode'),
        memberSelectionCallback: sessionStorage.getItem('memberSelectionCallback')
      });
      
      // 2025-01-11: NEW - Check localStorage as well (more persistent)
      const localStorageSelectedMember = localStorage.getItem('selectedMember');
      console.log('🔍 EnhancedFamilyEditor: Checking localStorage for selectedMember:', !!localStorageSelectedMember);
      
      // Check for both draggedMember and selectedMember
      let memberData = null;
      if (draggedMember && dragInProgress === 'true') {
        memberData = JSON.parse(draggedMember);
        console.log('🔍 EnhancedFamilyEditor: Processing dragged member:', memberData.name);
      } else if (selectedMember) {
        memberData = JSON.parse(selectedMember);
        console.log('🔍 EnhancedFamilyEditor: Processing selected member:', memberData.name);
      } else if (localStorageSelectedMember) {
        memberData = JSON.parse(localStorageSelectedMember);
        console.log('🔍 EnhancedFamilyEditor: Processing localStorage selected member:', memberData.name);
      } else {
        // 2025-01-11: NEW - Check if there's any member data in sessionStorage
        console.log('🔍 EnhancedFamilyEditor: No member data found in expected keys, checking all sessionStorage...');
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('member') || key.includes('selected') || key.includes('drag'))) {
            const value = sessionStorage.getItem(key);
            console.log(`🔍 EnhancedFamilyEditor: Found potential member data in key "${key}":`, value);
            try {
              const parsed = JSON.parse(value || '');
              if (parsed && parsed.name && parsed.selectedRole) {
                memberData = parsed;
                console.log('🔍 EnhancedFamilyEditor: Found member data in unexpected key:', key, memberData.name);
                break;
              }
            } catch (e) {
              // Not JSON, skip
            }
          }
        }
      }
      
      if (memberData) {
        try {
          // Add member as generic member (user will assign role manually)
          const newMember: EnhancedFamilyMember = {
            id: Date.now(), // Generate unique ID
            person: {
              pid: memberData.pid,
              name: memberData.name,
              contact: memberData.contact,
              nid: memberData.nid,
              address: memberData.address,
              atoll: memberData.atoll,
              island: memberData.island,
              party: memberData.party,
              profession: memberData.profession,
              gender: memberData.gender,
              age: memberData.age,
              remark: memberData.remark,
              pep_status: memberData.pep_status,
              change_status: memberData.change_status || 'Active'
            },
            specific_role: memberData.selectedRole || 'other', // Use selected role if available
            generation_level: 1, // Default generation level
            notes: `Added from search results (${memberData.address}, ${memberData.island})`
          };
          
          console.log('🔍 EnhancedFamilyEditor: Adding new member to family:', newMember);
          setSuccessMessage(`Added ${memberData.name} from search results - please assign a family role`);
          
          // 2025-01-11: NEW - Save family data immediately to make it permanent
          // Use the updated state from setFamilyMembers callback to get all members
          setFamilyMembers(prev => {
            const updated = [...prev, newMember];
            console.log('🔍 EnhancedFamilyEditor: Updated family members count:', updated.length);
            // Save the complete family data including existing members
            saveFamilyData(updated).catch(error => {
              console.error('🔍 EnhancedFamilyEditor: Error saving family data after drag:', error);
            });
            return updated;
          });
          
          // Clear the session storage
          sessionStorage.removeItem('draggedMember');
          sessionStorage.removeItem('dragInProgress');
          sessionStorage.removeItem('selectedMember');
          // 2025-01-11: NEW - Also clear localStorage
          localStorage.removeItem('selectedMember');
          
          // 2025-01-11: NEW - Set a flag to stop polling
          sessionStorage.setItem('memberAdded', 'true');
        } catch (error) {
          console.error('Error parsing dragged member:', error);
        }
      }
    };

    // 2025-01-11: NEW - Add delay to account for timing issues
    const timeoutId = setTimeout(() => {
      checkForDraggedMember();
    }, 100);

    // 2025-01-11: NEW - Set up polling to check for dragged members every 500ms
    const interval = setInterval(checkForDraggedMember, 500);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
      // 2025-01-11: NEW - Clear the memberAdded flag when component unmounts
      sessionStorage.removeItem('memberAdded');
    };
  }, []);

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

    // 2024-12-28: ADDED grandparent detection based on age analysis
    // Detect grandparents as people significantly older than identified parents
    const identifiedParents = enhancedMembers.filter(member => 
      member.specific_role === 'father' || member.specific_role === 'mother'
    );
    
    if (identifiedParents.length > 0) {
      const remainingMembers = membersWithAge.filter(({ person }) => !usedPeople.has(person.pid));
      
      // Find potential grandparents (20+ years older than parents)
      remainingMembers.forEach(({ person, age }) => {
        if (usedPeople.has(person.pid)) return;
        
        const isGrandparent = identifiedParents.some(parent => {
          const parentAge = parent.person.DOB ? new Date().getFullYear() - new Date(parent.person.DOB).getFullYear() : undefined;
          return parentAge && age && (age - parentAge) >= 20;
        });
        
        if (isGrandparent) {
          let role: SpecificFamilyRole = 'other';
          if (person.gender === 'M') {
            role = 'grandfather';
          } else if (person.gender === 'F') {
            role = 'grandmother';
          }
          
          if (role !== 'other') {
            console.log('Assigned grandparent role by age analysis:', role, 'to', person.name);
            enhancedMembers.push({
              id: Date.now() + Math.random(),
              person,
              specific_role: role,
              generation_level: 0, // Grandparents are generation 0
              is_primary: true
            });
            usedPeople.add(person.pid);
          }
        }
      });
    }

    // 2024-12-28: ADDED grandchild detection based on age analysis
    // Detect grandchildren as people significantly younger than identified children
    const identifiedChildren = enhancedMembers.filter(member => 
      member.specific_role === 'son' || member.specific_role === 'daughter'
    );
    
    if (identifiedChildren.length > 0) {
      const remainingMembers = membersWithAge.filter(({ person }) => !usedPeople.has(person.pid));
      
      // Find potential grandchildren (20+ years younger than children)
      remainingMembers.forEach(({ person, age }) => {
        if (usedPeople.has(person.pid)) return;
        
        const isGrandchild = identifiedChildren.some(child => {
          const childAge = child.person.DOB ? new Date().getFullYear() - new Date(child.person.DOB).getFullYear() : undefined;
          return childAge && age && (childAge - age) >= 20;
        });
        
        if (isGrandchild) {
          let role: SpecificFamilyRole = 'other';
          if (person.gender === 'M') {
            role = 'grandson';
          } else if (person.gender === 'F') {
            role = 'granddaughter';
          }
          
          if (role !== 'other') {
            console.log('Assigned grandchild role by age analysis:', role, 'to', person.name);
            enhancedMembers.push({
              id: Date.now() + Math.random(),
              person,
              specific_role: role,
              generation_level: 3, // Grandchildren are generation 3
              is_primary: true
            });
            usedPeople.add(person.pid);
          }
        }
      });
    }

    // 2024-12-28: Continue with remaining members for children detection
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

  // 2024-12-28: Fixed multi-generational family detection - only create ONE additional family for grandchildren
  const detectMultiGenerationalFamily = (members: EnhancedFamilyMember[]) => {
    const generations = new Set<number>();
    members.forEach(member => {
      generations.add(member.generation_level);
    });
    
    // Check if we have grandchildren (generation 3) - only split if grandchildren exist
    const hasGrandchildren = generations.has(3);
    
    if (!hasGrandchildren) return null;
    
    // Find grandchildren (generation 3)
    const grandchildren = members.filter(member => member.generation_level === 3);
    
    if (grandchildren.length === 0) return null;
    
    // Create only ONE additional family for grandchildren
    const grandchildFamily = {
      name: `${grandchildren[0].person.name}'s Family`,
      address: `${grandchildren[0].person.name}'s Family, ${grandchildren[0].person.address || 'Habaruge'}`,
      members: grandchildren,
      generation: 3,
      parentFamilyId: 0, // Main family
      parentMemberId: undefined // Will be set by user
    };
    
    return { 
      suggestedFamilies: [grandchildFamily], 
      familyRelationships: [] 
    };
  };

  // 2024-12-28: Hide sidebar when modal opens, restore when closed
  useEffect(() => {
    console.log('🔍 EnhancedFamilyEditor: isOpen changed to:', isOpen);
    if (isOpen) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
    
    // Cleanup: restore sidebar when component unmounts
    return () => {
      setSidebarOpen(true);
    };
  }, [isOpen, setSidebarOpen]);

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

  // 2025-01-10: NEW - Handle external member drop from search results
  const handleExternalMemberDrop = (person: PhoneBookEntry, role: SpecificFamilyRole) => {
    const newMember: EnhancedFamilyMember = {
      id: Date.now(),
      person: person,
      specific_role: role,
      generation_level: 1,
      notes: `Added from ${person.address}, ${person.island}`
    };
    
    setFamilyMembers(prev => [...prev, newMember]);
    setSuccessMessage(`Added ${person.name} as ${FAMILY_ROLE_DEFINITIONS[role].label}`);
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
      // 2024-12-28: Check for multi-generational family before saving
      const multiGenResult = detectMultiGenerationalFamily(familyMembers);
      
      if (multiGenResult && multiGenResult.suggestedFamilies.length > 1) {
        // Show multi-generational family splitting modal
        setSuggestedFamilies(multiGenResult.suggestedFamilies);
        setShowMultiGenModal(true);
        setIsLoading(false);
        return;
      }

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
    const originalMembers = members.filter(person => !assignedPeople.includes(person.pid));
    
    // Include dragged members that are not yet assigned to specific roles
    const draggedMembers = familyMembers
      .filter(member => member.specific_role === 'other' && member.notes?.includes('Dragged from search results'))
      .map(member => member.person);
    
    // Combine original members with dragged members, removing duplicates
    const allPeople = [...originalMembers, ...draggedMembers];
    const uniquePeople = allPeople.filter((person, index, self) => 
      index === self.findIndex(p => p.pid === person.pid)
    );
    
    return uniquePeople;
  };

  if (!isOpen) {
    console.log('🔍 EnhancedFamilyEditor: Modal is closed, not rendering');
    return null;
  }
  
  console.log('🔍 EnhancedFamilyEditor: Modal is open, rendering component');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[320px] overflow-hidden flex flex-col">
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
            onExternalMemberDrop={handleExternalMemberDrop}
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
              onClick={() => setShowMemberSearch(true)}
              className="px-2 py-1 border border-gray-300 text-black hover:bg-gray-100 text-xs"
            >
              Search Members
            </button>
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

      {/* Multi-Generational Family Splitting Modal */}
      {showMultiGenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Grandchild Family Detected
              </h3>
              <p className="text-gray-600 mb-6">
                This family has grandchildren. We suggest creating one additional nuclear family for the grandchild while keeping the main family intact:
              </p>
              
              {/* Main Family - Will be kept */}
              <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg">
                <h4 className="font-semibold text-lg text-green-900 mb-2">
                  Main Family (Will be kept)
                </h4>
                <p className="text-green-700 mb-2">
                  All original members will remain in the main family at: <strong>{address}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {familyMembers
                    .filter(member => member.generation_level !== 3) // Exclude grandchildren
                    .map((member, memberIndex) => (
                      <span
                        key={memberIndex}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {member.person.name} ({member.specific_role})
                      </span>
                    ))}
                </div>
              </div>

              {/* Additional Family - Will be created */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-900 mb-2">
                  Additional Family to Create:
                </h4>
                {suggestedFamilies.map((family, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg text-gray-900">{family.name}</h4>
                      <span className="text-sm text-gray-500">Generation {family.generation}</span>
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address:
                      </label>
                      <input
                        type="text"
                        value={family.address}
                        onChange={(e) => {
                          const updated = [...suggestedFamilies];
                          updated[index].address = e.target.value;
                          setSuggestedFamilies(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Parent Selection for Grandchildren */}
                    {family.generation === 3 && family.parentFamilyId !== undefined && (
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Who is the parent of this grandchild family?
                        </label>
                        <select
                          value={family.parentMemberId || ''}
                          onChange={(e) => {
                            const updated = [...suggestedFamilies];
                            updated[index].parentMemberId = parseInt(e.target.value);
                            setSuggestedFamilies(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select parent from main family...</option>
                          {familyMembers
                            .filter(member => 
                              member.generation_level !== 3 && // Exclude grandchildren
                              (member.specific_role === 'father' || 
                               member.specific_role === 'mother' ||
                               member.specific_role === 'son' ||
                               member.specific_role === 'daughter')
                            )
                            .map((member, memberIndex) => (
                              <option key={memberIndex} value={member.person.pid}>
                                {member.person.name} ({member.specific_role})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Members ({family.members.length}):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {family.members.map((member, memberIndex) => (
                          <span
                            key={memberIndex}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {member.person.name} ({member.specific_role})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowMultiGenModal(false);
                    setSuggestedFamilies([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      
                      // Validate that all grandchild families have parent selected
                      const grandchildFamilies = suggestedFamilies.filter(f => f.generation === 3);
                      const missingParents = grandchildFamilies.filter(f => !f.parentMemberId);
                      
                      if (missingParents.length > 0) {
                        setError('Please select a parent for all grandchild families before creating families.');
                        setIsLoading(false);
                        return;
                      }
                      
                      // First, save the main family (remove grandchildren from it)
                      const mainFamilyMembers = familyMembers.filter(member => member.generation_level !== 3);
                      const mainFamilyData = {
                        address,
                        island,
                        members: mainFamilyMembers.map(member => ({
                          entry_id: member.person.pid,
                          role: member.specific_role
                        })),
                        relationships: generateRelationshipsFromRoles(mainFamilyMembers)
                      };
                      await onSave(mainFamilyData);
                      
                      // Then create the additional grandchild family
                      const grandchildFamily = suggestedFamilies[0];
                      
                      // Generate relationships for the grandchild family
                      let grandchildRelationships = generateRelationshipsFromRoles(grandchildFamily.members);
                      
                      // Add parent-child relationship between the selected parent and grandchild
                      if (grandchildFamily.parentMemberId) {
                        // Find the parent member in the main family
                        const parentMember = familyMembers.find(m => m.person.pid === grandchildFamily.parentMemberId);
                        if (parentMember) {
                          // Add parent-child relationship between the parent and the grandchild
                          const grandchild = grandchildFamily.members[0];
                          
                          grandchildRelationships.push({
                            person1_id: parentMember.person.pid,
                            person2_id: grandchild.person.pid,
                            relationship_type: 'parent',
                            notes: `${parentMember.person.name} (${parentMember.specific_role}) → ${grandchild.person.name} (${grandchild.specific_role}) - Family Relationship`
                          });
                        }
                      }
                      
                      const grandchildFamilyData = {
                        address: grandchildFamily.address,
                        island: island,
                        members: grandchildFamily.members.map(member => ({
                          entry_id: member.person.pid,
                          role: member.specific_role
                        })),
                        relationships: grandchildRelationships
                      };
                      
                      await onSave(grandchildFamilyData);
                      
                      setSuccessMessage(`Updated main family and created 1 additional grandchild family with proper relationships!`);
                      setTimeout(() => {
                        onClose();
                      }, 1500);
                    } catch (error) {
                      setError(`Failed to create families: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    } finally {
                      setIsLoading(false);
                      setShowMultiGenModal(false);
                      setSuggestedFamilies([]);
                    }
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Grandchild Family...' : 'Create Grandchild Family'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      // Save as single family (original behavior)
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
                      setSuccessMessage('Family structure saved as single family!');
                      setTimeout(() => {
                        onClose();
                      }, 1500);
                    } catch (error) {
                      setError(`Failed to save family structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    } finally {
                      setIsLoading(false);
                      setShowMultiGenModal(false);
                      setSuggestedFamilies([]);
                    }
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save as Single Family'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Search Modal */}
      <MemberSearchModal
        isOpen={showMemberSearch}
        onClose={() => setShowMemberSearch(false)}
        onSelectMember={handleMemberSelect}
        currentAddress={address}
        currentIsland={island}
        familyName={`${address} Family`}
        excludePids={familyMembers.map(m => m.person.pid)}
      />
    </div>
  );
};

export default EnhancedFamilyEditor;
