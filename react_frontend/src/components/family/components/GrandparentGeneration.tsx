// 2025-01-31: Component for rendering grandparent generation
// Extracted from ClassicFamilyTree component for better maintainability

import React from 'react';
import { FamilyMember } from '../hooks/useFamilyOrganization';
import { TreeDimensions } from '../hooks/useTreeDimensions';
import { DraggablePosition } from '../hooks/useDragAndDrop';
import { calculateCenteredPosition, formatNameWithAge } from '../utils/calculations';

interface GrandparentGenerationProps {
  grandparents: FamilyMember[];
  treeDimensions: TreeDimensions;
  memberPositions: Map<number, DraggablePosition>;
  onMouseDown: (e: React.MouseEvent, memberId: number) => void;
}

export const GrandparentGeneration: React.FC<GrandparentGenerationProps> = ({
  grandparents,
  treeDimensions,
  memberPositions,
  onMouseDown
}) => {
  if (grandparents.length === 0) {
    return null;
  }

  return (
    <g className="grandparent-generation">
      {grandparents.map((grandparent, index) => {
        let x = calculateCenteredPosition(
          index, 
          grandparents.length, 
          treeDimensions.parentSpacing,
          treeDimensions.nodeWidth,
          treeDimensions.containerWidth
        );
        let y = 20; // Top position for grandparents
        
        // Apply drag offset if grandparent has been moved
        const dragOffset = memberPositions.get(grandparent.entry.pid);
        if (dragOffset) {
          x += dragOffset.x;
          y += dragOffset.y;
        }
        
        return (
          <g key={grandparent.entry.pid} className="grandparent-node">
            <rect
              x={x}
              y={y}
              width={treeDimensions.nodeWidth}
              height={treeDimensions.nodeHeight}
              fill="#E6E6FA"
              stroke="#8A2BE2"
              strokeWidth="2"
              rx="8"
              style={{ cursor: 'move' }}
              onMouseDown={(e) => onMouseDown(e, grandparent.entry.pid)}
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
                  color: '#8A2BE2',
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
                title={formatNameWithAge(grandparent.entry.name, grandparent)}
              >
                {formatNameWithAge(grandparent.entry.name, grandparent)}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </g>
  );
};
