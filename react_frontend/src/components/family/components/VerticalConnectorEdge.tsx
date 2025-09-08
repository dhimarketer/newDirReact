import React from 'react';
import { EdgeProps, getStraightPath, BaseEdge } from '@xyflow/react';

// Custom edge component for vertical connector from spouse line center to union node
const VerticalConnectorEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  data,
  markerEnd,
}) => {
  // Calculate the midpoint of the spouse line (between parent side edges)
  // Source is right side of first parent, target is left side of second parent
  const sourceRightX = sourceX + 60; // Right side of first parent
  const targetLeftX = targetX - 60; // Left side of second parent
  const spouseMidpointX = (sourceRightX + targetLeftX) / 2;
  const spouseMidpointY = sourceY; // Same Y as parents
  
  // Create a straight vertical line from spouse midpoint to union node
  const [edgePath] = getStraightPath({
    sourceX: spouseMidpointX,
    sourceY: spouseMidpointY,
    targetX: targetX,
    targetY: targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: '#8B4513',
        strokeWidth: 3,
        ...style,
      }}
    />
  );
};

export default VerticalConnectorEdge;
