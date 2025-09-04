// 2025-01-31: Custom hook for tree dimensions calculation
// Extracted from ClassicFamilyTree component for better maintainability

import { useMemo } from 'react';
import { OrganizedFamilyMembers } from './useFamilyOrganization';

export interface TreeDimensions {
  nodeWidth: number;
  nodeHeight: number;
  parentSpacing: number;
  childSpacing: number;
  containerWidth: number;
  containerHeight: number;
}

export const useTreeDimensions = (
  organizedMembers: OrganizedFamilyMembers,
  useMultiRowLayout: boolean = false
): TreeDimensions => {
  return useMemo(() => {
    const parentCount = organizedMembers.parents.length;
    const childCount = organizedMembers.children.length;
    
    // Constants for tree layout
    const nodeWidth = 120;
    const nodeHeight = 60;
    const fixedSpacing = 60; // Reduced for tighter layout
    
    // Calculate total width needed for each generation with fixed spacing
    const totalParentWidth = parentCount * nodeWidth + (parentCount > 1 ? (parentCount - 1) * fixedSpacing : 0);
    const totalChildWidth = childCount * nodeWidth + (childCount > 1 ? (childCount - 1) * fixedSpacing : 0);
    
    // Use full available width instead of content-based width
    const minContainerWidth = Math.max(800, Math.max(totalParentWidth, totalChildWidth) + 200); // Use full width with minimum 800px
    
    // Enhanced height calculation based on layout needs
    const baseHeight = 200; // Reduced base height for parents and connections
    const childRowHeight = nodeHeight + 20; // Reduced spacing between rows
    
    // Calculate optimal height based on number of children and layout mode
    let optimalHeight = baseHeight;
    if (useMultiRowLayout && childCount > 8) {
      // Multi-row layout: calculate height based on number of rows needed
      const maxChildrenPerRow = Math.ceil(Math.sqrt(childCount));
      const numRows = Math.ceil(childCount / maxChildrenPerRow);
      optimalHeight = baseHeight + (numRows * childRowHeight) + 20; // Add small margin
    } else if (childCount > 0) {
      // Single-row layout: add height for children with minimal spacing
      optimalHeight = baseHeight + childRowHeight + 10; // Add small margin
    }
    
    // Ensure minimum height for proper display
    const minHeightNeeded = baseHeight + childRowHeight;
    const containerHeight = Math.max(optimalHeight, minHeightNeeded);
    
    console.log(`📐 Tree dimensions calculated:`, {
      parentCount,
      childCount,
      baseHeight,
      minHeightNeeded,
      optimalHeight,
      containerWidth: minContainerWidth,
      useMultiRowLayout
    });
    
    return {
      nodeWidth,
      nodeHeight,
      parentSpacing: fixedSpacing,
      childSpacing: fixedSpacing,
      containerWidth: minContainerWidth,
      containerHeight
    };
  }, [organizedMembers, useMultiRowLayout]);
};
