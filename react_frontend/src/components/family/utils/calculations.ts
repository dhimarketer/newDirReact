// 2025-01-31: Utility functions for family tree calculations
// Extracted from ClassicFamilyTree component for better maintainability

import { FamilyMember } from '../hooks/useFamilyOrganization';
import { TreeDimensions } from '../hooks/useTreeDimensions';

/**
 * Calculate centered position for a node in a row
 */
export const calculateCenteredPosition = (
  index: number, 
  totalCount: number, 
  spacing: number,
  nodeWidth: number,
  containerWidth: number
): number => {
  if (totalCount === 0) return 0;
  
  // Calculate total width needed for all nodes
  const totalWidth = totalCount * nodeWidth + (totalCount > 1 ? (totalCount - 1) * spacing : 0);
  
  // Calculate starting position to center the row
  const startX = (containerWidth - totalWidth) / 2;
  
  // Calculate position for this specific node
  return startX + index * (nodeWidth + spacing);
};

/**
 * Format name with age suffix
 */
export const formatNameWithAge = (name: string, member: FamilyMember): string => {
  if (member.entry.age !== undefined && member.entry.age !== null) {
    return `${name} (${member.entry.age})`;
  }
  return name;
};

/**
 * Format age from DOB
 */
export const formatAge = (member: FamilyMember): string => {
  // Use backend-calculated age if available (more reliable)
  if (member.entry.age !== undefined && member.entry.age !== null) {
    return member.entry.age.toString();
  }
  
  // Fallback to DOB calculation only if age is not available
  if (!member.entry.DOB) return '';
  try {
    const birthDate = new Date(member.entry.DOB);
    if (isNaN(birthDate.getTime())) return '';
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age.toString() : '';
  } catch (error) {
    return '';
  }
};

/**
 * Calculate multi-row layout for children
 */
export const calculateMultiRowLayout = (
  children: FamilyMember[],
  treeDimensions: TreeDimensions
): { rows: FamilyMember[][], positions: Array<{ x: number; y: number }> } => {
  if (children.length === 0) {
    return { rows: [], positions: [] };
  }
  
  const maxChildrenPerRow = Math.ceil(Math.sqrt(children.length));
  const rows: FamilyMember[][] = [];
  const positions: Array<{ x: number; y: number }> = [];
  
  // Distribute children across rows
  for (let i = 0; i < children.length; i += maxChildrenPerRow) {
    rows.push(children.slice(i, i + maxChildrenPerRow));
  }
  
  // Calculate positions for each child
  let childIndex = 0;
  rows.forEach((row, rowIndex) => {
    row.forEach((child, colIndex) => {
      const x = calculateCenteredPosition(
        colIndex,
        row.length,
        treeDimensions.childSpacing,
        treeDimensions.nodeWidth,
        treeDimensions.containerWidth
      );
      const y = 220 + (rowIndex * (treeDimensions.nodeHeight + 20));
      
      positions[childIndex] = { x, y };
      childIndex++;
    });
  });
  
  return { rows, positions };
};
