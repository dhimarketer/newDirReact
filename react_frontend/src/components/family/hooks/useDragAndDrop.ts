// 2025-01-31: Custom hook for drag and drop functionality
// Extracted from ClassicFamilyTree component for better maintainability

import { useState, useRef, useCallback } from 'react';

export interface DraggablePosition {
  x: number;
  y: number;
}

export const useDragAndDrop = () => {
  const [draggedMember, setDraggedMember] = useState<number | null>(null);
  const [memberPositions, setMemberPositions] = useState<Map<number, DraggablePosition>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Random positioning for bottom layer members
  const getRandomOffset = useCallback(() => {
    return {
      x: (Math.random() - 0.5) * 40, // Random offset between -20 and 20
      y: (Math.random() - 0.5) * 20  // Random offset between -10 and 10
    };
  }, []);

  // Improved drag event handlers to prevent flickering
  const handleMouseDown = useCallback((e: React.MouseEvent, memberId: number) => {
    e.preventDefault();
    setDraggedMember(memberId);
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { x: 0, y: 0 };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || draggedMember === null) return;
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    
    // Update the drag offset reference to prevent flickering
    dragOffset.current = { x: deltaX, y: deltaY };
    
    // Force re-render by updating state
    setMemberPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(draggedMember, { x: deltaX, y: deltaY });
      return newPositions;
    });
  }, [isDragging, draggedMember]);

  const handleMouseUp = useCallback(() => {
    if (draggedMember !== null) {
      // Finalize the position
      setMemberPositions(prev => {
        const newPositions = new Map(prev);
        const currentPos = newPositions.get(draggedMember) || { x: 0, y: 0 };
        newPositions.set(draggedMember, currentPos);
        return newPositions;
      });
    }
    setIsDragging(false);
    setDraggedMember(null);
    dragOffset.current = { x: 0, y: 0 };
  }, [draggedMember]);

  return {
    draggedMember,
    memberPositions,
    isDragging,
    getRandomOffset,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
