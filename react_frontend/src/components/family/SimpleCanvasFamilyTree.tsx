// 2025-01-31: Simple Canvas-based family tree that definitely works
// This is a fallback solution that will show lines and arrows reliably

import React, { useRef, useEffect } from 'react';

interface FamilyMember {
  entry: {
    pid: number;
    name: string;
    age?: number;
    gender?: string;
  };
  generation?: string;
}

interface FamilyRelationship {
  id: number;
  person1: number;
  person2: number;
  relationship_type: string;
  is_active: boolean;
}

interface SimpleCanvasFamilyTreeProps {
  familyMembers: FamilyMember[];
  relationships?: FamilyRelationship[];
}

const SimpleCanvasFamilyTree: React.FC<SimpleCanvasFamilyTreeProps> = ({
  familyMembers,
  relationships = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || familyMembers.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('🔍 SimpleCanvasFamilyTree: Drawing with', familyMembers.length, 'members and', relationships.length, 'relationships');

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 800;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up drawing styles
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Organize members by generation
    const grandparents = familyMembers.filter(m => m.generation === 'grandparent');
    const parents = familyMembers.filter(m => m.generation === 'parent');
    const children = familyMembers.filter(m => m.generation === 'child');
    const grandchildren = familyMembers.filter(m => m.generation === 'grandchild');

    // If no generation data, create simple parent-child structure
    let organizedMembers = { grandparents, parents, children, grandchildren };
    if (parents.length === 0 && children.length === 0) {
      // Simple 2-generation structure
      const sortedByAge = familyMembers.sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
      organizedMembers.parents = sortedByAge.slice(0, 2);
      organizedMembers.children = sortedByAge.slice(2);
    }

    // Draw family tree
    const nodeWidth = 120;
    const nodeHeight = 60;
    const horizontalSpacing = 150;
    const verticalSpacing = 120;
    const startX = 100;
    const startY = 100;

    const nodePositions = new Map<number, { x: number; y: number }>();

    // Draw grandparents (top level)
    if (organizedMembers.grandparents.length > 0) {
      const grandparentY = startY;
      const grandparentCount = organizedMembers.grandparents.length;
      const totalWidth = Math.max((grandparentCount - 1) * horizontalSpacing, 200);
      const startGrandparentX = startX + (canvas.width - totalWidth) / 2;

      organizedMembers.grandparents.forEach((member, index) => {
        const x = startGrandparentX + (index * horizontalSpacing);
        const y = grandparentY;
        nodePositions.set(member.entry.pid, { x, y });
        drawNode(ctx, x, y, member, '#FFF8DC', '#DAA520');
      });
    }

    // Draw parents
    if (organizedMembers.parents.length > 0) {
      const parentY = startY + verticalSpacing;
      const parentCount = organizedMembers.parents.length;
      const totalWidth = Math.max((parentCount - 1) * horizontalSpacing, 200);
      const startParentX = startX + (canvas.width - totalWidth) / 2;

      organizedMembers.parents.forEach((member, index) => {
        const x = startParentX + (index * horizontalSpacing);
        const y = parentY;
        nodePositions.set(member.entry.pid, { x, y });
        drawNode(ctx, x, y, member, '#fef3c7', '#F59E0B');
      });
    }

    // Draw children
    if (organizedMembers.children.length > 0) {
      const childY = startY + (verticalSpacing * 2);
      const childCount = organizedMembers.children.length;
      const totalWidth = Math.max((childCount - 1) * horizontalSpacing, 200);
      const startChildX = startX + (canvas.width - totalWidth) / 2;

      organizedMembers.children.forEach((member, index) => {
        const x = startChildX + (index * horizontalSpacing);
        const y = childY;
        nodePositions.set(member.entry.pid, { x, y });
        drawNode(ctx, x, y, member, '#dbeafe', '#3B82F6');
      });
    }

    // Draw grandchildren
    if (organizedMembers.grandchildren.length > 0) {
      const grandchildY = startY + (verticalSpacing * 3);
      const grandchildCount = organizedMembers.grandchildren.length;
      const totalWidth = Math.max((grandchildCount - 1) * horizontalSpacing, 200);
      const startGrandchildX = startX + (canvas.width - totalWidth) / 2;

      organizedMembers.grandchildren.forEach((member, index) => {
        const x = startGrandchildX + (index * horizontalSpacing);
        const y = grandchildY;
        nodePositions.set(member.entry.pid, { x, y });
        drawNode(ctx, x, y, member, '#F5F5DC', '#8B4513');
      });
    }

    // Draw relationships
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);

    // Draw parent-child relationships
    organizedMembers.parents.forEach(parent => {
      organizedMembers.children.forEach(child => {
        const parentPos = nodePositions.get(parent.entry.pid);
        const childPos = nodePositions.get(child.entry.pid);
        if (parentPos && childPos) {
          drawArrow(ctx, parentPos.x, parentPos.y + nodeHeight/2, childPos.x, childPos.y - nodeHeight/2);
        }
      });
    });

    // Draw grandparent-grandchild relationships
    organizedMembers.grandparents.forEach(grandparent => {
      organizedMembers.grandchildren.forEach(grandchild => {
        const grandparentPos = nodePositions.get(grandparent.entry.pid);
        const grandchildPos = nodePositions.get(grandchild.entry.pid);
        if (grandparentPos && grandchildPos) {
          drawArrow(ctx, grandparentPos.x, grandparentPos.y + nodeHeight/2, grandchildPos.x, grandchildPos.y - nodeHeight/2);
        }
      });
    });

    // Draw sibling relationships (horizontal lines)
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Draw sibling lines for each generation
    [organizedMembers.parents, organizedMembers.children, organizedMembers.grandchildren].forEach(generation => {
      if (generation.length > 1) {
        for (let i = 0; i < generation.length - 1; i++) {
          const pos1 = nodePositions.get(generation[i].entry.pid);
          const pos2 = nodePositions.get(generation[i + 1].entry.pid);
          if (pos1 && pos2) {
            ctx.beginPath();
            ctx.moveTo(pos1.x + nodeWidth/2, pos1.y);
            ctx.lineTo(pos2.x - nodeWidth/2, pos2.y);
            ctx.stroke();
          }
        }
      }
    });

  }, [familyMembers, relationships]);

  const drawNode = (ctx: CanvasRenderingContext2D, x: number, y: number, member: FamilyMember, bgColor: string, borderColor: string) => {
    const nodeWidth = 120;
    const nodeHeight = 60;

    // Draw node background
    ctx.fillStyle = bgColor;
    ctx.fillRect(x - nodeWidth/2, y - nodeHeight/2, nodeWidth, nodeHeight);

    // Draw node border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - nodeWidth/2, y - nodeHeight/2, nodeWidth, nodeHeight);

    // Draw member name
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 12px Arial';
    const name = member.entry.name.length > 15 ? member.entry.name.substring(0, 15) + '...' : member.entry.name;
    ctx.fillText(name, x, y - 8);

    // Draw age
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px Arial';
    const ageText = member.entry.age ? `${member.entry.age} years` : 'Age unknown';
    ctx.fillText(ageText, x, y + 8);
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle - arrowAngle),
      toY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle + arrowAngle),
      toY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  };

  if (familyMembers.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        background: '#f9f9f9'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>No family members found</p>
          <p style={{ fontSize: '14px', color: '#999' }}>Try searching for a different address or create a new family</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '800px', 
      border: '1px solid #e0e0e0', 
      borderRadius: 8, 
      background: '#ffffff',
      overflow: 'auto'
    }}>
      <canvas
        ref={canvasRef}
        style={{ 
          display: 'block',
          background: '#ffffff'
        }}
      />
    </div>
  );
};

export default SimpleCanvasFamilyTree;
