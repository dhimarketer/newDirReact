// 2025-01-31: Component for rendering parent generation
// Extracted from ClassicFamilyTree component for better maintainability

import React from 'react';
import { FamilyMember } from '../hooks/useFamilyOrganization';
import { TreeDimensions } from '../hooks/useTreeDimensions';
import { DraggablePosition } from '../hooks/useDragAndDrop';
import { calculateCenteredPosition, formatNameWithAge } from '../utils/calculations';

interface ParentGenerationProps {
  parents: FamilyMember[];
  treeDimensions: TreeDimensions;
  memberPositions: Map<number, DraggablePosition>;
  onMouseDown: (e: React.MouseEvent, memberId: number) => void;
  hasGrandparents?: boolean;
}

export const ParentGeneration: React.FC<ParentGenerationProps> = ({
  parents,
  treeDimensions,
  memberPositions,
  onMouseDown,
  hasGrandparents = false
}) => {
  return (
    <g className="parent-generation">
      {parents.map((parent, index) => {
        let x = calculateCenteredPosition(
          index, 
          parents.length, 
          treeDimensions.parentSpacing,
          treeDimensions.nodeWidth,
          treeDimensions.containerWidth
        );
        let y = hasGrandparents ? 140 : 50; // Adjust position if grandparents are present
        
        // Apply drag offset if parent has been moved
        const dragOffset = memberPositions.get(parent.entry.pid);
        if (dragOffset) {
          x += dragOffset.x;
          y += dragOffset.y;
        }
        
        return (
          <g key={parent.entry.pid} className="parent-node">
            <rect
              x={x}
              y={y}
              width={treeDimensions.nodeWidth}
              height={treeDimensions.nodeHeight}
              fill="#FFE4B5"
              stroke="#DAA520"
              strokeWidth="2"
              rx="8"
              style={{ cursor: 'move' }}
              onMouseDown={(e) => onMouseDown(e, parent.entry.pid)}
            />
            <foreignObject
              x={x}
              y={y}
              width={treeDimensions.nodeWidth}
              height={treeDimensions.nodeHeight}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#DAA520',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  wordWrap: 'normal',
                  overflowWrap: 'normal',
                  wordBreak: 'normal',
                  hyphens: 'none',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={formatNameWithAge(parent.entry.name, parent)}
              >
                {formatNameWithAge(parent.entry.name, parent)}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </g>
  );
};
