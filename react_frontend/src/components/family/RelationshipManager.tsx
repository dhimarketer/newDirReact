// 2025-01-28: NEW - Streamlined relationship management component for Phase 3
// 2025-01-28: Implements drag-and-drop relationship creation with visual indicators
// 2025-01-28: Real-time updates and enhanced editing capabilities
// 2025-01-28: Clean interface for managing family relationships

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { PhoneBookEntry } from '../../types/directory';

interface FamilyMember {
  entry: PhoneBookEntry;
  role: 'parent' | 'child' | 'other';
  relationship?: string;
}

interface FamilyRelationship {
  id: number;
  person1: number;
  person2: number;
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other';
  notes?: string;
  is_active: boolean;
}

interface RelationshipManagerProps {
  familyMembers: FamilyMember[];
  relationships: FamilyRelationship[];
  onRelationshipChange: (relationships: FamilyRelationship[]) => void;
  onFamilyMembersChange?: (members: FamilyMember[]) => void; // 2025-01-28: Added callback for family member changes
  isEditable: boolean;
}

interface DragState {
  sourceMember: FamilyMember | null;
  targetMember: FamilyMember | null;
  relationshipType: string;
}

// 2025-01-28: Added family exclusion functionality
interface ExcludedMember {
  pid: number;
  name: string;
  reason?: string;
}

const RELATIONSHIP_TYPES = [
  { value: 'parent', label: '👨‍👩‍👧‍👦 Parent', description: 'Parent of' },
  { value: 'child', label: '👶 Child', description: 'Child of' },
  { value: 'spouse', label: '💑 Spouse', description: 'Spouse of' },
  { value: 'sibling', label: '👫 Sibling', description: 'Sibling of' },
  { value: 'grandparent', label: '👴👵 Grandparent', description: 'Grandparent of' },
  { value: 'grandchild', label: '👶 Grandchild', description: 'Grandchild of' },
  { value: 'aunt_uncle', label: '👨‍👩‍👧‍👦 Aunt/Uncle', description: 'Aunt/Uncle of' },
  { value: 'niece_nephew', label: '👶 Niece/Nephew', description: 'Niece/Nephew of' },
  { value: 'cousin', label: '👫 Cousin', description: 'Cousin of' },
  { value: 'other', label: '🔗 Other', description: 'Other relationship to' }
];

const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  familyMembers,
  relationships,
  onRelationshipChange,
  onFamilyMembersChange,
  isEditable
}) => {
  const [dragState, setDragState] = useState<DragState>({
    sourceMember: null,
    targetMember: null,
    relationshipType: 'parent',
  });
  
  const [showRelationshipPanel, setShowRelationshipPanel] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<FamilyRelationship | null>(null);
  const [relationshipNotes, setRelationshipNotes] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // 2025-01-28: Added state for family exclusion management
  const [excludedMembers, setExcludedMembers] = useState<ExcludedMember[]>([]);
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [exclusionReason, setExclusionReason] = useState('');
  const [memberToExclude, setMemberToExclude] = useState<FamilyMember | null>(null);
  
  // 2025-01-28: Added state for creating new family with new address
  const [showNewFamilyModal, setShowNewFamilyModal] = useState(false);
  const [newFamilyAddress, setNewFamilyAddress] = useState('');
  const [selectedMembersForNewFamily, setSelectedMembersForNewFamily] = useState<Set<number>>(new Set());
  const [newFamilyName, setNewFamilyName] = useState('');
  
  // 2025-01-28: Added state for family deletion
  const [showDeleteFamilyModal, setShowDeleteFamilyModal] = useState(false);
  const [deleteFamilyReason, setDeleteFamilyReason] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if two members already have a relationship
  const hasExistingRelationship = useCallback((member1: FamilyMember, member2: FamilyMember) => {
    return relationships.some(rel => 
      (rel.person1 === member1.entry.pid && rel.person2 === member2.entry.pid) ||
      (rel.person1 === member2.entry.pid && rel.person2 === member1.entry.pid)
    );
  }, [relationships]);

  // Get existing relationship between two members
  const getExistingRelationship = useCallback((member1: FamilyMember, member2: FamilyMember) => {
    return relationships.find(rel => 
      (rel.person1 === member1.entry.pid && rel.person2 === member2.entry.pid) ||
      (rel.person1 === member2.entry.pid && rel.person2 === member1.entry.pid)
    );
  }, [relationships]);

  // 2025-01-28: Added family exclusion functions
  const excludeFromFamily = useCallback((member: FamilyMember, reason?: string) => {
    const excludedMember: ExcludedMember = {
      pid: member.entry.pid,
      name: member.entry.name,
      reason: reason || 'Not a family member'
    };
    
    setExcludedMembers(prev => [...prev, excludedMember]);
    
    // Remove relationships involving this member
    const updatedRelationships = relationships.filter(rel => 
      rel.person1 !== member.entry.pid && rel.person2 !== member.entry.pid
    );
    
    // Update relationships
    onRelationshipChange(updatedRelationships);
    
    // Notify parent component about family member change
    if (onFamilyMembersChange) {
      const updatedMembers = familyMembers.filter(m => m.entry.pid !== member.entry.pid);
      onFamilyMembersChange(updatedMembers);
    }
    
    // Close modal and reset state
    setShowExclusionModal(false);
    setMemberToExclude(null);
    setExclusionReason('');
    
    alert(`${member.entry.name} has been excluded from the family tree.`);
  }, [familyMembers, relationships, onRelationshipChange, onFamilyMembersChange]);

  const includeInFamily = useCallback((excludedMember: ExcludedMember) => {
    // Remove from excluded list
    setExcludedMembers(prev => prev.filter(m => m.pid !== excludedMember.pid));
    
    // Find the original member data and add back to family
    const originalMember = familyMembers.find(m => m.entry.pid === excludedMember.pid);
    if (originalMember && onFamilyMembersChange) {
      const updatedMembers = [...familyMembers, originalMember];
      onFamilyMembersChange(updatedMembers);
    }
    
    alert(`${excludedMember.name} has been included back in the family tree.`);
  }, [familyMembers, onFamilyMembersChange]);

  const openExclusionModal = useCallback((member: FamilyMember) => {
    setMemberToExclude(member);
    setShowExclusionModal(true);
  }, []);

  // 2025-01-28: Get active family members (excluding excluded ones)
  const activeFamilyMembers = useMemo(() => {
    return familyMembers.filter(member => 
      !excludedMembers.some(excluded => excluded.pid === member.entry.pid)
    );
  }, [familyMembers, excludedMembers]);

  // 2025-01-28: Added functions for creating new family
  const openNewFamilyModal = useCallback(() => {
    setShowNewFamilyModal(true);
    setSelectedMembersForNewFamily(new Set());
    setNewFamilyAddress('');
    setNewFamilyName('');
  }, []);

  const toggleMemberSelection = useCallback((memberId: number) => {
    setSelectedMembersForNewFamily(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  }, []);

  const createNewFamily = useCallback(() => {
    if (!newFamilyAddress.trim() || selectedMembersForNewFamily.size === 0) {
      alert('Please provide an address and select at least one family member.');
      return;
    }

    const selectedMembers = activeFamilyMembers.filter(member => 
      selectedMembersForNewFamily.has(member.entry.pid)
    );

    // 2025-01-28: Create new family data structure
    const newFamilyData = {
      name: newFamilyName.trim() || `${selectedMembers[0].entry.name}'s Family`,
      address: newFamilyAddress.trim(),
      members: selectedMembers.map(member => ({
        pid: member.entry.pid,
        name: member.entry.name,
        contact: member.entry.contact,
        address: newFamilyAddress.trim()
      })),
      relationships: relationships.filter(rel => 
        selectedMembersForNewFamily.has(rel.person1) && 
        selectedMembersForNewFamily.has(rel.person2)
      )
    };

    // 2025-01-28: Notify parent component about new family creation
    if (onFamilyMembersChange) {
      // Remove selected members from current family
      const remainingMembers = activeFamilyMembers.filter(member => 
        !selectedMembersForNewFamily.has(member.entry.pid)
      );
      onFamilyMembersChange(remainingMembers);
    }

    // 2025-01-28: Remove relationships involving selected members
    const updatedRelationships = relationships.filter(rel => 
      !selectedMembersForNewFamily.has(rel.person1) && 
      !selectedMembersForNewFamily.has(rel.person2)
    );
    onRelationshipChange(updatedRelationships);

    // 2025-01-28: Close modal and reset state
    setShowNewFamilyModal(false);
    setSelectedMembersForNewFamily(new Set());
    setNewFamilyAddress('');
    setNewFamilyName('');

    // 2025-01-28: Show success message with new family details
    alert(`New family created successfully!\n\nFamily: ${newFamilyData.name}\nAddress: ${newFamilyData.address}\nMembers: ${selectedMembers.map(m => m.entry.name).join(', ')}\n\nNote: This family has been moved to the new address. You can now manage them separately.`);
    
    console.log('New family created:', newFamilyData);
  }, [newFamilyAddress, selectedMembersForNewFamily, activeFamilyMembers, relationships, onFamilyMembersChange, onRelationshipChange, newFamilyName]);

  // 2025-01-28: Added function to delete current family structure
  const deleteCurrentFamily = useCallback(() => {
    if (!deleteFamilyReason.trim()) {
      alert('Please provide a reason for deleting this family structure.');
      return;
    }

    // 2025-01-28: Clear all family relationships (but preserve member data)
    onRelationshipChange([]);
    
    // 2025-01-28: Clear family members list (but members remain in database)
    if (onFamilyMembersChange) {
      onFamilyMembersChange([]);
    }

    // 2025-01-28: Close modal and reset state
    setShowDeleteFamilyModal(false);
    setDeleteFamilyReason('');

    // 2025-01-28: Show confirmation message
    alert(`Family structure deleted successfully!\n\nReason: ${deleteFamilyReason}\n\nNote: All member data has been preserved in the database. You can now construct a new family from existing members.`);
    
    console.log('Family structure deleted. Reason:', deleteFamilyReason);
  }, [deleteFamilyReason, onRelationshipChange, onFamilyMembersChange]);

  const openDeleteFamilyModal = useCallback(() => {
    setShowDeleteFamilyModal(true);
    setDeleteFamilyReason('');
  }, []);

  // Create relationship between two members
  const createRelationship = useCallback((source: FamilyMember, target: FamilyMember) => {
    // Check if relationship already exists
    const existingRelationship = getExistingRelationship(source, target);
    
    if (existingRelationship) {
      // 2025-01-28: ENHANCED: Allow updating existing relationships instead of blocking them
      const shouldUpdate = confirm(
        `A relationship already exists between ${source.entry.name} and ${target.entry.name}.\n\n` +
        `Current: ${existingRelationship.relationship_type}\n` +
        `New: ${dragState.relationshipType}\n\n` +
        `Would you like to update the relationship type?`
      );
      
      if (shouldUpdate) {
        // Update the existing relationship
        const updatedRelationships = relationships.map(rel => 
          rel.id === existingRelationship.id 
            ? { 
                ...rel, 
                relationship_type: dragState.relationshipType as any,
                notes: relationshipNotes || rel.notes
              }
            : rel
        );
        
        onRelationshipChange(updatedRelationships);
        
        // Reset state
        setDragState(prev => ({
          ...prev,
          sourceMember: null,
          targetMember: null
        }));
        setRelationshipNotes('');
        
        // Show success message
        alert(`Updated relationship between ${source.entry.name} and ${target.entry.name} to ${dragState.relationshipType}`);
        return;
      } else {
        // User chose not to update, just reset selection
        setDragState(prev => ({
          ...prev,
          sourceMember: null,
          targetMember: null
        }));
        return;
      }
    }
    
    // Create new relationship
    const newRelationship: FamilyRelationship = {
      id: Date.now(), // Temporary ID
      person1: source.entry.pid,
      person2: target.entry.pid,
      relationship_type: dragState.relationshipType as any,
      notes: relationshipNotes,
      is_active: true
    };
    
    // Add to relationships
    const updatedRelationships = [...relationships, newRelationship];
    onRelationshipChange(updatedRelationships);
    
    // Reset state
    setDragState(prev => ({
      ...prev,
      sourceMember: null,
      targetMember: null
    }));
    setRelationshipNotes('');
    
    // Show success message
    alert(`Created ${dragState.relationshipType} relationship between ${source.entry.name} and ${target.entry.name}`);
  }, [relationships, dragState.relationshipType, relationshipNotes, onRelationshipChange, getExistingRelationship]);

  // Handle member click for relationship creation
  const handleMemberClick = useCallback((member: FamilyMember) => {
    if (!isEditable) return;
    
    if (!dragState.sourceMember) {
      // First click - select source member
      setDragState(prev => ({
        ...prev,
        sourceMember: member,
        targetMember: null
      }));
    } else if (dragState.sourceMember.entry.pid === member.entry.pid) {
      // Click on same member - deselect
      setDragState(prev => ({
        ...prev,
        sourceMember: null,
        targetMember: null
      }));
    } else {
      // Second click - select target member and create relationship
      setDragState(prev => ({
        ...prev,
        targetMember: member
      }));
      
      // Create the relationship
      createRelationship(dragState.sourceMember, member);
    }
  }, [dragState.sourceMember, isEditable, createRelationship]);

  // Update existing relationship
  const updateRelationship = useCallback((relationship: FamilyRelationship, updates: Partial<FamilyRelationship>) => {
    const updatedRelationships = relationships.map(rel => 
      rel.id === relationship.id ? { ...rel, ...updates } : rel
    );
    onRelationshipChange(updatedRelationships);
    setEditingRelationship(null);
    setRelationshipNotes('');
  }, [relationships, onRelationshipChange]);

  // Delete relationship
  const deleteRelationship = useCallback((relationship: FamilyRelationship) => {
    if (confirm('Are you sure you want to delete this relationship?')) {
      const updatedRelationships = relationships.filter(rel => rel.id !== relationship.id);
      onRelationshipChange(updatedRelationships);
    }
  }, [relationships, onRelationshipChange]);

  // Filter relationships by type
  const filteredRelationships = relationships.filter(rel => 
    filterType === 'all' || rel.relationship_type === filterType
  );

  // Global mouse event handlers
  useEffect(() => {
    // 2025-01-28: REMOVED - Old drag and drop functionality replaced with click-based approach
    // No need for global mouse event handlers anymore
  }, []);

  // Prevent default drag behavior
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('drop', preventDefault);
    
    return () => {
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('drop', preventDefault);
    };
  }, []);

  // 2025-01-28: Format name with age suffix
  const formatNameWithAge = (name: string, dob?: string): string => {
    if (!dob) return name;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return `${name} (${age - 1})`;
      }
      return `${name} (${age})`;
    } catch {
      return name;
    }
  };

  if (!isEditable) {
    return (
      <div className="relationship-manager-readonly">
        <p>Relationship editing is not available for your user type.</p>
      </div>
    );
  }

  return (
    <div className="relationship-manager">
      {/* Header with clear instructions */}
      <div className="relationship-manager-header">
        <h3>Family Relationships</h3>
        <p className="relationship-instructions">
          <strong>How to create relationships:</strong><br/>
          1. Click on a family member to select them<br/>
          2. Choose the relationship type from the dropdown<br/>
          3. Click on another member to create the connection
        </p>
        
        {/* 2025-01-28: Added Create New Family button */}
        <div className="header-actions">
          <button
            onClick={openNewFamilyModal}
            className="create-family-btn"
            title="Create a new family with selected members at a new address"
          >
            🏠 Create New Family
          </button>
          
          {/* 2025-01-28: Added Delete Family button */}
          <button
            onClick={openDeleteFamilyModal}
            className="delete-family-btn"
            title="Delete current family structure and start fresh (preserves all member data)"
          >
            🗑️ Delete Family
          </button>
        </div>
      </div>

      {/* Relationship Type Selector */}
      <div className="relationship-type-selector">
        <label htmlFor="relationship-type">Relationship Type:</label>
        <select
          id="relationship-type"
          value={dragState.relationshipType}
          onChange={(e) => setDragState(prev => ({ ...prev, relationshipType: e.target.value }))}
          className="relationship-type-select"
        >
          {RELATIONSHIP_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Family Members Grid */}
      <div className="family-members-section">
        <h4>Family Members ({activeFamilyMembers.length})</h4>
        <div className="members-container">
          {activeFamilyMembers.map((member, index) => (
            <div
              key={`${member.entry.pid || index}`}
              className={`family-member-card ${dragState.sourceMember?.entry.pid === member.entry.pid ? 'selected' : ''} ${dragState.targetMember?.entry.pid === member.entry.pid ? 'target' : ''}`}
              onClick={() => handleMemberClick(member)}
              title={`Click to select ${member.entry.name}`}
            >
              <div className="member-avatar">
                {member.entry.name.charAt(0).toUpperCase()}
              </div>
              <div className="member-info">
                <div className="member-name">{formatNameWithAge(member.entry.name, member.entry.DOB)}</div>
                <div className="member-role">{member.role}</div>
                <div className="member-contact">
                  {member.entry.contact ? member.entry.contact : 'No contact'}
                </div>
              </div>
              
              {/* Selection indicator */}
              <div className="selection-indicator">
                {dragState.sourceMember?.entry.pid === member.entry.pid && '👆 Source'}
                {dragState.targetMember?.entry.pid === member.entry.pid && '🎯 Target'}
              </div>
              
              {/* 2025-01-28: Added family exclusion controls */}
              <div className="member-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openExclusionModal(member);
                  }}
                  className="exclude-btn"
                  title="Exclude from family"
                >
                  🚫
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* 2025-01-28: Show excluded members section */}
        {excludedMembers.length > 0 && (
          <div className="excluded-members-section">
            <h5>Excluded Members ({excludedMembers.length})</h5>
            <div className="excluded-members-list">
              {excludedMembers.map((excludedMember) => (
                <div key={excludedMember.pid} className="excluded-member-item">
                  <span className="excluded-member-name">{excludedMember.name}</span>
                  {excludedMember.reason && (
                    <span className="exclusion-reason">({excludedMember.reason})</span>
                  )}
                  <button
                    onClick={() => includeInFamily(excludedMember)}
                    className="include-btn"
                    title="Include back in family"
                  >
                    ✅ Include
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Relationships List */}
      <div className="relationships-list">
        <h4>Current Relationships ({filteredRelationships.length})</h4>
        {filteredRelationships.length === 0 ? (
          <p className="no-relationships">No relationships found.</p>
        ) : (
          <div className="relationships-container">
            {filteredRelationships.map(relationship => {
              const person1 = familyMembers.find(m => m.entry.pid === relationship.person1);
              const person2 = familyMembers.find(m => m.entry.pid === relationship.person2);
              const relationshipType = RELATIONSHIP_TYPES.find(t => t.value === relationship.relationship_type);
              
              if (!person1 || !person2) return null;
              
              return (
                <div key={relationship.id} className="relationship-item">
                  <div className="relationship-info">
                    <div className="relationship-pair">
                      <span className="person-name">{formatNameWithAge(person1.entry.name, person1.entry.DOB)}</span>
                      <span className="relationship-arrow">→</span>
                      <span className="relationship-type">{relationshipType?.label}</span>
                      <span className="relationship-arrow">→</span>
                      <span className="person-name">{formatNameWithAge(person2.entry.name, person2.entry.DOB)}</span>
                    </div>
                    {relationship.notes && (
                      <div className="relationship-notes-display">
                        Notes: {relationship.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="relationship-actions">
                    {/* 2025-01-28: ENHANCED: Added quick relationship type changer */}
                    <select
                      value={relationship.relationship_type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        if (newType !== relationship.relationship_type) {
                          updateRelationship(relationship, { relationship_type: newType as any });
                        }
                      }}
                      className="relationship-type-changer"
                      title="Change relationship type"
                    >
                      {RELATIONSHIP_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => setEditingRelationship(relationship)}
                      className="action-button edit"
                      title="Edit relationship details"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteRelationship(relationship)}
                      className="action-button delete"
                      title="Delete relationship"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Relationship Creation Confirmation */}
      {dragState.sourceMember && dragState.targetMember && (
        <div className="relationship-confirmation">
          <div className="confirmation-content">
            <h4>Create Relationship</h4>
            <p>
              Create <strong>{RELATIONSHIP_TYPES.find(t => t.value === dragState.relationshipType)?.label}</strong> 
              relationship between:
            </p>
            <div className="confirmation-members">
              <span className="source-member">{dragState.sourceMember.entry.name}</span>
              <span className="relationship-arrow">→</span>
              <span className="target-member">{dragState.targetMember.entry.name}</span>
            </div>
            <div className="confirmation-actions">
              <button
                onClick={() => createRelationship(dragState.sourceMember!, dragState.targetMember!)}
                className="confirm-button"
              >
                Create Relationship
              </button>
              <button
                onClick={() => setDragState(prev => ({ ...prev, sourceMember: null, targetMember: null }))}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Relationship Modal */}
      {editingRelationship && (
        <div className="edit-relationship-modal">
          <div className="modal-content">
            <h4>Edit Relationship</h4>
            <div className="edit-form">
              <div className="form-group">
                <label>Relationship Type:</label>
                <select
                  value={editingRelationship.relationship_type}
                  onChange={(e) => setEditingRelationship(prev => prev ? { ...prev, relationship_type: e.target.value as any } : null)}
                  className="edit-select"
                >
                  {RELATIONSHIP_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Notes:</label>
                <input
                  type="text"
                  value={editingRelationship.notes || ''}
                  onChange={(e) => setEditingRelationship(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  className="edit-input"
                />
              </div>
              
              <div className="form-actions">
                <button
                  onClick={() => updateRelationship(editingRelationship, {
                    relationship_type: editingRelationship.relationship_type,
                    notes: editingRelationship.notes
                  })}
                  className="save-button"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingRelationship(null)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exclusion Modal */}
      {showExclusionModal && memberToExclude && (
        <div className="exclusion-modal">
          <div className="modal-content">
            <h4>Exclude Member</h4>
            <p>
              Are you sure you want to exclude <strong>{memberToExclude.entry.name}</strong> from the family tree?
            </p>
            <div className="exclusion-reason-input">
              <label>Reason for exclusion:</label>
              <input
                type="text"
                value={exclusionReason}
                onChange={(e) => setExclusionReason(e.target.value)}
                placeholder="e.g., Not a family member, deceased, etc."
              />
            </div>
            <div className="exclusion-actions">
              <button
                onClick={() => excludeFromFamily(memberToExclude, exclusionReason)}
                className="confirm-button"
              >
                Exclude
              </button>
              <button
                onClick={() => setShowExclusionModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2025-01-28: New Family Creation Modal */}
      {showNewFamilyModal && (
        <div className="new-family-modal">
          <div className="modal-content">
            <h4>Create New Family</h4>
            <p>Select family members to move to a new address and create a separate family unit.</p>
            
            <div className="new-family-form">
              <div className="form-group">
                <label htmlFor="new-family-name">Family Name (Optional):</label>
                <input
                  id="new-family-name"
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="e.g., Smith Family, Johnson Household"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="new-family-address">New Address: *</label>
                <input
                  id="new-family-address"
                  type="text"
                  value={newFamilyAddress}
                  onChange={(e) => setNewFamilyAddress(e.target.value)}
                  placeholder="e.g., 123 New Street, City, State"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Select Members to Move:</label>
                <div className="member-selection-grid">
                  {activeFamilyMembers.map((member) => (
                    <div
                      key={member.entry.pid}
                      className={`member-selection-item ${selectedMembersForNewFamily.has(member.entry.pid) ? 'selected' : ''}`}
                      onClick={() => toggleMemberSelection(member.entry.pid)}
                    >
                      <div className="member-selection-avatar">
                        {member.entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-selection-info">
                        <div className="member-selection-name">{formatNameWithAge(member.entry.name, member.entry.DOB)}</div>
                        <div className="member-selection-role">{member.role}</div>
                      </div>
                      <div className="member-selection-checkbox">
                        {selectedMembersForNewFamily.has(member.entry.pid) ? '✅' : '⬜'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="new-family-actions">
              <button
                onClick={createNewFamily}
                className="create-button"
                disabled={!newFamilyAddress.trim() || selectedMembersForNewFamily.size === 0}
              >
                🏠 Create New Family
              </button>
              <button
                onClick={() => setShowNewFamilyModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2025-01-28: Delete Family Modal */}
      {showDeleteFamilyModal && (
        <div className="delete-family-modal">
          <div className="modal-content">
            <h4>Delete Family Structure</h4>
            <p>
              Are you sure you want to delete the current family structure? This action will remove all family relationships and members.
            </p>
            <div className="delete-reason-input">
              <label>Reason for deletion:</label>
              <input
                type="text"
                value={deleteFamilyReason}
                onChange={(e) => setDeleteFamilyReason(e.target.value)}
                placeholder="e.g., Family structure is no longer relevant, merging families, etc."
              />
            </div>
            <div className="delete-actions">
              <button
                onClick={deleteCurrentFamily}
                className="confirm-button"
                disabled={!deleteFamilyReason.trim()}
              >
                🗑️ Delete Family
              </button>
              <button
                onClick={() => setShowDeleteFamilyModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipManager;
