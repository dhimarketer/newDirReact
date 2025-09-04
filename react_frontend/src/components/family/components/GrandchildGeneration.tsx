// 2025-01-31: Component for rendering grandchild generation
// Extracted from ClassicFamilyTree component for better maintainability

import React from 'react';
import { FamilyMember } from '../hooks/useFamilyOrganization';
import { TreeDimensions } from '../hooks/useTreeDimensions';
import { DraggablePosition } from '../hooks/useDragAndDrop';
import { calculateCenteredPosition, formatNameWithAge } from '../utils/calculations';

interface GrandchildGenerationProps {
  grandchildren: FamilyMember[];
  treeDimensions: TreeDimensions;
  memberPositions: Map<number, DraggablePosition>;
  onMouseDown: (e: React.MouseEvent, memberId: number) => void;
}

export const GrandchildGeneration: React.FC<GrandchildGenerationProps> = ({
  grandchildren,
  treeDimensions,
  memberPositions,
  onMouseDown
}) => {
  if (grandchildren.length === 0) {
    return null;
  }

  return (
    <g className="grandchild-generation">
      {grandchildren.map((grandchild, index) => {
        let x = calculateCenteredPosition(
          index, 
          grandchildren.length, 
          treeDimensions.parentSpacing,
          treeDimensions.nodeWidth,
          treeDimensions.containerWidth
        );
        let y = 320; // Position below children
        
        // Apply drag offset if grandchild has been moved
        const dragOffset = memberPositions.get(grandchild.entry.pid);
        if (dragOffset) {
          x += dragOffset.x;
          y += dragOffset.y;
        }
        
        return (
          <g key={grandchild.entry.pid} className="grandchild-node">
            <rect
              x={x}
              y={y}
              width={treeDimensions.nodeWidth}
              height={treeDimensions.nodeHeight}
              fill="#F0E68C"
              stroke="#DAA520"
              strokeWidth="2"
              rx="8"
              style={{ cursor: 'move' }}
              onMouseDown={(e) => onMouseDown(e, grandchild.entry.pid)}
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
                title={formatNameWithAge(grandchild.entry.name, grandchild)}
              >
                {formatNameWithAge(grandchild.entry.name, grandchild)}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </g>
  );
};
