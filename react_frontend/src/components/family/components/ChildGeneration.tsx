// 2025-01-31: Component for rendering child generation
// Extracted from ClassicFamilyTree component for better maintainability

import React from 'react';
import { FamilyMember } from '../hooks/useFamilyOrganization';
import { TreeDimensions } from '../hooks/useTreeDimensions';
import { DraggablePosition } from '../hooks/useDragAndDrop';
import { calculateCenteredPosition, formatNameWithAge, calculateMultiRowLayout } from '../utils/calculations';

interface ChildGenerationProps {
  children: FamilyMember[];
  treeDimensions: TreeDimensions;
  memberPositions: Map<number, DraggablePosition>;
  useMultiRowLayout: boolean;
  onMouseDown: (e: React.MouseEvent, memberId: number) => void;
}

export const ChildGeneration: React.FC<ChildGenerationProps> = ({
  children,
  treeDimensions,
  memberPositions,
  useMultiRowLayout,
  onMouseDown
}) => {
  const { rows, positions } = calculateMultiRowLayout(children, treeDimensions);

  return (
    <g className="child-generation">
      {(() => {
        if (useMultiRowLayout && children.length > 8) {
          // Multi-row layout
          return rows.map((row, rowIndex) =>
            row.map((child, colIndex) => {
              const childIndex = rowIndex * Math.ceil(Math.sqrt(children.length)) + colIndex;
              const position = positions[childIndex];
              
              // Apply drag offset if child has been moved
              const dragOffset = memberPositions.get(child.entry.pid);
              const x = position.x + (dragOffset?.x || 0);
              const y = position.y + (dragOffset?.y || 0);
              
              return (
                <g key={child.entry.pid} className="child-node">
                  <rect
                    x={x}
                    y={y}
                    width={treeDimensions.nodeWidth}
                    height={treeDimensions.nodeHeight}
                    fill="#E6F3FF"
                    stroke="#4A90E2"
                    strokeWidth="2"
                    rx="8"
                    style={{ cursor: 'move' }}
                    onMouseDown={(e) => onMouseDown(e, child.entry.pid)}
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
                        color: '#4A90E2',
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
                      title={formatNameWithAge(child.entry.name, child)}
                    >
                      {formatNameWithAge(child.entry.name, child)}
                    </div>
                  </foreignObject>
                </g>
              );
            })
          );
        } else {
          // Single-row layout
          return children.map((child, index) => {
            let x = calculateCenteredPosition(
              index,
              children.length,
              treeDimensions.childSpacing,
              treeDimensions.nodeWidth,
              treeDimensions.containerWidth
            );
            let y = 220;
            
            // Apply drag offset if child has been moved
            const dragOffset = memberPositions.get(child.entry.pid);
            if (dragOffset) {
              x += dragOffset.x;
              y += dragOffset.y;
            }
            
            return (
              <g key={child.entry.pid} className="child-node">
                <rect
                  x={x}
                  y={y}
                  width={treeDimensions.nodeWidth}
                  height={treeDimensions.nodeHeight}
                  fill="#E6F3FF"
                  stroke="#4A90E2"
                  strokeWidth="2"
                  rx="8"
                  style={{ cursor: 'move' }}
                  onMouseDown={(e) => onMouseDown(e, child.entry.pid)}
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
                      color: '#4A90E2',
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
                    title={formatNameWithAge(child.entry.name, child)}
                  >
                    {formatNameWithAge(child.entry.name, child)}
                  </div>
                </foreignObject>
              </g>
            );
          });
        }
      })()}
    </g>
  );
};
