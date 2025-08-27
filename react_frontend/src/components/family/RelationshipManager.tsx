// 2025-01-28: NEW - Streamlined relationship management component for Phase 3
// 2025-01-28: Implements drag-and-drop relationship creation with visual indicators
// 2025-01-28: Real-time updates and enhanced editing capabilities
// 2025-01-28: Clean interface for managing family relationships

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  isEditable: boolean;
}

interface DragState {
  sourceMember: FamilyMember | null;
  targetMember: FamilyMember | null;
  relationshipType: string;
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
  }, [dragState.sourceMember, isEditable]);

  // Create relationship between two members
  const createRelationship = useCallback((source: FamilyMember, target: FamilyMember) => {
    if (hasExistingRelationship(source, target)) {
      alert(`A relationship already exists between ${source.entry.name} and ${target.entry.name}`);
      return;
    }
    
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
  }, [relationships, dragState.relationshipType, relationshipNotes, onRelationshipChange]);

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
        <h4>Family Members ({familyMembers.length})</h4>
        <div className="members-container">
          {familyMembers.map((member, index) => (
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
                <div className="member-name">{member.entry.name}</div>
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
            </div>
          ))}
        </div>
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
                      <span className="person-name">{person1.entry.name}</span>
                      <span className="relationship-arrow">→</span>
                      <span className="relationship-type">{relationshipType?.label}</span>
                      <span className="relationship-arrow">→</span>
                      <span className="person-name">{person2.entry.name}</span>
                    </div>
                    {relationship.notes && (
                      <div className="relationship-notes-display">
                        Notes: {relationship.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="relationship-actions">
                    <button
                      onClick={() => setEditingRelationship(relationship)}
                      className="action-button edit"
                      title="Edit relationship"
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
    </div>
  );
};

export default RelationshipManager;
