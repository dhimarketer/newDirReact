import React from 'react';
import { EdgeProps, getStraightPath, BaseEdge } from '@xyflow/react';

// Custom edge component for parent-to-parent horizontal connection
const ParentConnectionEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  // Calculate the side edge positions for horizontal connection
  // Source should connect from right side, target from left side
  const sourceRightX = sourceX + 60; // Half of node width (120px)
  const targetLeftX = targetX - 60; // Half of node width (120px)
  
  // Use the same Y position for both (center of parent nodes)
  const centerY = sourceY;

  const [edgePath] = getStraightPath({
    sourceX: sourceRightX,
    sourceY: centerY,
    targetX: targetLeftX,
    targetY: centerY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: '#ec4899',
        strokeWidth: 3,
        strokeDasharray: '8,4',
        ...style,
      }}
    />
  );
};

export default ParentConnectionEdge;
