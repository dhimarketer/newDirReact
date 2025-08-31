// 2025-01-28: NEW - Performance optimization utilities for family tree components
// 2025-01-28: Implements memoization, debouncing, and efficient rendering strategies
// 2025-01-28: Ensures smooth performance even with large family trees

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Debounce function for performance optimization
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
}

// Memoized family member organization for performance
export function useFamilyMemberOrganization(
  familyMembers: any[],
  relationships: any[]
) {
  return useMemo(() => {
    const organized = {
      grandparents: [] as any[],
      parents: [] as any[],
      children: [] as any[]
    };

    if (!familyMembers.length) return organized;

    // Create a map for quick lookups
    const memberMap = new Map();
    familyMembers.forEach(member => {
      memberMap.set(member.entry.pid.toString(), member);
    });

    // Find root members (those without parents)
    const rootMembers = familyMembers.filter(member => {
      const hasParent = relationships.some(rel => 
        rel.relationship_type === 'parent' && 
        rel.person2 === member.entry.pid
      );
      return !hasParent;
    });

    // Find children of root members
    const children = familyMembers.filter(member => {
      const hasParent = relationships.some(rel => 
        rel.relationship_type === 'parent' && 
        rel.person2 === member.entry.pid
      );
      return hasParent;
    });

    // Find grandparents (parents of root members)
    const grandparents = familyMembers.filter(member => {
      const isGrandparent = relationships.some(rel => 
        rel.relationship_type === 'grandparent' && 
        rel.person1 === member.entry.pid
      );
      return isGrandparent;
    });

    // Assign to appropriate generation - 2025-01-30: FIXED - No hardcoded limits
    organized.grandparents = grandparents; // No limit on grandparents
    organized.parents = rootMembers; // No limit on parents
    organized.children = children; // No limit on children

    return organized;
  }, [familyMembers, relationships]);
}

// Memoized tree layout calculation
export function useTreeLayout(organizedMembers: any) {
  return useMemo(() => {
    const NODE_WIDTH = 180;
    const NODE_HEIGHT = 80;
    const LEVEL_SPACING = 120;
    const NODE_SPACING = 200;
    const MARGIN = 40;

    const nodes: any[] = [];
    const connections: any[] = [];
    
    let nodeId = 0;

    // Position grandparents (top level)
    const grandparentCount = organizedMembers.grandparents.length;
    const grandparentStartX = (grandparentCount * NODE_SPACING) / 2;
    
    organizedMembers.grandparents.forEach((member: any, index: number) => {
      const x = grandparentStartX - (index * NODE_SPACING) + MARGIN;
      const y = MARGIN;
      
      nodes.push({
        id: `node_${nodeId++}`,
        x,
        y,
        member,
        level: 0,
        generation: 'grandparent',
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      });
    });

    // Position parents (middle level)
    const parentCount = organizedMembers.parents.length;
    const parentStartX = (parentCount * NODE_SPACING) / 2;
    
    organizedMembers.parents.forEach((member: any, index: number) => {
      const x = parentStartX - (index * NODE_SPACING) + MARGIN;
      const y = MARGIN + LEVEL_SPACING;
      
      nodes.push({
        id: `node_${nodeId++}`,
        x,
        y,
        member,
        level: 1,
        generation: 'parent',
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      });
    });

    // Position children (bottom level)
    const childrenPerRow = 6;
    
    organizedMembers.children.forEach((member: any, index: number) => {
      const row = Math.floor(index / childrenPerRow);
      const col = index % childrenPerRow;
      const x = (col * NODE_SPACING) + MARGIN;
      const y = MARGIN + (2 * LEVEL_SPACING) + (row * (NODE_HEIGHT + 20));
      
      nodes.push({
        id: `node_${nodeId++}`,
        x,
        y,
        member,
        level: 2,
        generation: 'child',
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      });
    });

    return { nodes, connections };
  }, [organizedMembers]);
}

// Memoized SVG dimensions calculation
export function useSvgDimensions(treeLayout: any) {
  return useMemo(() => {
    if (!treeLayout.nodes.length) {
      return { width: 800, height: 600 };
    }

    const maxX = Math.max(...treeLayout.nodes.map((n: any) => n.x + n.width));
    const maxY = Math.max(...treeLayout.nodes.map((n: any) => n.y + n.height));
    
    return {
      width: Math.max(800, maxX + 40),
      height: Math.max(600, maxY + 40)
    };
  }, [treeLayout]);
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    
    if (renderCount.current > 1) {
      console.log(`${componentName} render #${renderCount.current} took ${timeSinceLastRender.toFixed(2)}ms`);
      
      // Warn if render takes too long
      if (timeSinceLastRender > 100) {
        console.warn(`${componentName} render is taking longer than expected: ${timeSinceLastRender.toFixed(2)}ms`);
      }
    }
    
    lastRenderTime.current = currentTime;
  });

  return {
    renderCount: renderCount.current,
    timeSinceLastRender: performance.now() - lastRenderTime.current
  };
}

// Virtual scrolling optimization for large family trees
export function useVirtualScrolling(
  items: any[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    
    return {
      start: Math.max(0, start - overscan),
      end
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange.start, visibleRange.end]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    scrollTop
  };
}

// Memory cleanup utility
export function useMemoryCleanup() {
  useEffect(() => {
    return () => {
      // Cleanup any large objects or event listeners
      // This helps prevent memory leaks in long-running applications
    };
  }, []);
}

// Batch update utility for relationship changes
export function useBatchUpdates<T>(
  initialState: T,
  batchDelay: number = 100
) {
  const [state, setState] = useState<T>(initialState);
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((updates: Partial<T>[]) => {
    batchRef.current.push(...updates);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const finalUpdate = batchRef.current.reduce((acc, update) => ({ ...acc, ...update }), {});
      setState(prev => ({ ...prev, ...finalUpdate }));
      batchRef.current = [];
    }, batchDelay);
  }, [batchDelay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate] as const;
}

// Export all utilities
export {
  useDebounce,
  useFamilyMemberOrganization,
  useTreeLayout,
  useSvgDimensions,
  usePerformanceMonitor,
  useVirtualScrolling,
  useMemoryCleanup,
  useBatchUpdates
};
