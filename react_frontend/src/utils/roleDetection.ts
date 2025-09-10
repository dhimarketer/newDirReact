// 2024-12-29: Utility functions for determining family member roles from relationships

import { FamilyMember, FamilyRelationship } from '../types/family';

export type DetectedRole = 
  | 'father' 
  | 'mother' 
  | 'son' 
  | 'daughter' 
  | 'brother' 
  | 'sister' 
  | 'grandfather' 
  | 'grandmother' 
  | 'grandson' 
  | 'granddaughter' 
  | 'uncle' 
  | 'aunt' 
  | 'nephew' 
  | 'niece' 
  | 'spouse' 
  | 'member';

/**
 * Determine the role of a family member based on their relationships
 */
export function detectMemberRole(
  member: FamilyMember, 
  allMembers: FamilyMember[], 
  relationships: FamilyRelationship[]
): DetectedRole {
  const memberPid = member.entry.pid;
  const memberGender = member.entry.gender?.toLowerCase();
  
  // Find all relationships involving this member
  const memberRelationships = relationships.filter(rel => 
    rel.person1 === memberPid || rel.person2 === memberPid
  );
  
  // Check if this member is a parent (has children)
  const hasChildren = memberRelationships.some(rel => 
    rel.relationship_type === 'parent' && rel.person1 === memberPid
  );
  
  // Check if this member is a child (has parents)
  const hasParents = memberRelationships.some(rel => 
    rel.relationship_type === 'parent' && rel.person2 === memberPid
  );
  
  // Check if this member is a spouse
  const hasSpouse = memberRelationships.some(rel => 
    rel.relationship_type === 'spouse' && (rel.person1 === memberPid || rel.person2 === memberPid)
  );
  
  // Check if this member is a sibling
  const hasSiblings = memberRelationships.some(rel => 
    rel.relationship_type === 'sibling' && (rel.person1 === memberPid || rel.person2 === memberPid)
  );
  
  // Determine role based on relationships and gender
  if (hasChildren && !hasParents) {
    // This member is a parent (not a child)
    if (memberGender === 'm') {
      return 'father';
    } else if (memberGender === 'f') {
      return 'mother';
    }
  } else if (hasParents && !hasChildren) {
    // This member is a child (not a parent)
    if (memberGender === 'm') {
      return 'son';
    } else if (memberGender === 'f') {
      return 'daughter';
    }
  } else if (hasSiblings && !hasChildren && !hasParents) {
    // This member is a sibling (no parents or children)
    if (memberGender === 'm') {
      return 'brother';
    } else if (memberGender === 'f') {
      return 'sister';
    }
  } else if (hasSpouse && !hasChildren && !hasParents) {
    // This member is a spouse (no parents or children)
    return 'spouse';
  }
  
  // Default to member if no specific role can be determined
  return 'member';
}

/**
 * Get role display text for UI
 */
export function getRoleDisplayText(role: DetectedRole): string {
  const roleMap: Record<DetectedRole, string> = {
    'father': 'Father',
    'mother': 'Mother',
    'son': 'Son',
    'daughter': 'Daughter',
    'brother': 'Brother',
    'sister': 'Sister',
    'grandfather': 'Grandfather',
    'grandmother': 'Grandmother',
    'grandson': 'Grandson',
    'granddaughter': 'Granddaughter',
    'uncle': 'Uncle',
    'aunt': 'Aunt',
    'nephew': 'Nephew',
    'niece': 'Niece',
    'spouse': 'Spouse',
    'member': 'Member'
  };
  
  return roleMap[role] || 'Member';
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: DetectedRole): string {
  const colorMap: Record<DetectedRole, string> = {
    'father': 'bg-blue-100 text-blue-800 border-blue-200',
    'mother': 'bg-pink-100 text-pink-800 border-pink-200',
    'son': 'bg-green-100 text-green-800 border-green-200',
    'daughter': 'bg-purple-100 text-purple-800 border-purple-200',
    'brother': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'sister': 'bg-rose-100 text-rose-800 border-rose-200',
    'grandfather': 'bg-amber-100 text-amber-800 border-amber-200',
    'grandmother': 'bg-orange-100 text-orange-800 border-orange-200',
    'grandson': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'granddaughter': 'bg-violet-100 text-violet-800 border-violet-200',
    'uncle': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'aunt': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    'nephew': 'bg-teal-100 text-teal-800 border-teal-200',
    'niece': 'bg-pink-100 text-pink-800 border-pink-200',
    'spouse': 'bg-red-100 text-red-800 border-red-200',
    'member': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  return colorMap[role] || 'bg-gray-100 text-gray-800 border-gray-200';
}
