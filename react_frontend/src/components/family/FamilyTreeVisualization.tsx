// 2025-01-27: Simple family tree org chart with draggable nodes
// 2025-01-27: Expanded bounding box to accommodate all family members with proper spacing
// 2025-01-27: Added age display and classical family tree connections (parents connected horizontally, children to middle)

import React, { useState, useRef, useEffect } from 'react';
import { PhoneBookEntry } from '../../types/directory';

interface FamilyMember {
  entry: PhoneBookEntry;
  role: 'parent' | 'child' | 'other';
  relationship?: string;
}

interface FamilyTreeVisualizationProps {
  familyMembers: FamilyMember[];
}

interface DraggableNode {
  id: string;
  x: number;
  y: number;
  member: FamilyMember;
}

const FamilyTreeVisualization: React.FC<FamilyTreeVisualizationProps> = ({ familyMembers }) => {
  const [nodes, setNodes] = useState<DraggableNode[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate optimal SVG dimensions based on family size
  const calculateSVGDimensions = () => {
    const parents = familyMembers.filter(m => m.role === 'parent');
    const children = familyMembers.filter(m => m.role === 'child');
    
    // Calculate width: ensure enough space for all members with proper spacing
    const maxMembersInRow = Math.max(parents.length, children.length);
    const nodeWidth = 180;
    const nodeSpacing = 250;
    const margin = 100;
    const calculatedWidth = Math.max(700, maxMembersInRow * nodeSpacing + margin);
    
    // Calculate height: ensure enough vertical space for parents, children, and connections
    // Account for variable node heights based on wrapped names and contact numbers
    const getMaxContentInRow = (members: FamilyMember[]) => {
      return Math.max(...members.map(m => {
        // Calculate name lines (with age appended)
        const nameWithAge = m.entry.DOB ? 
          `${m.entry.name || 'Unknown'} (${new Date().getFullYear() - new Date(m.entry.DOB).getFullYear()})` : 
          (m.entry.name || 'Unknown');
        
        // Wrap text function for name calculation
        const wrapText = (text: string, maxWidth: number) => {
          const words = text.split(' ');
          const lines: string[] = [];
          let currentLine = '';
          
          words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const estimatedWidth = testLine.length * 7; // 7px per character for 14px font
            
            if (estimatedWidth <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                lines.push(word);
              }
            }
          });
          
          if (currentLine) {
            lines.push(currentLine);
          }
          
          return lines;
        };
        
        const nameLines = wrapText(nameWithAge, 160);
        
        // Calculate contact lines
        const contacts = m.entry.contact ? m.entry.contact.split(/[,;]/).filter(c => c.trim()).length : 0;
        
        // Total content lines: role indicator (1) + name lines + contact lines
        return 1 + nameLines.length + contacts;
      }));
    };
    
    const maxParentContent = getMaxContentInRow(parents);
    const maxChildContent = getMaxContentInRow(children);
    
    const baseNodeHeight = 80;
    const nameLineHeight = 16;
    const contactLineHeight = 12;
    const roleIndicatorHeight = 20;
    
    const parentRowHeight = roleIndicatorHeight + (maxParentContent - 1) * Math.max(nameLineHeight, contactLineHeight);
    const childRowHeight = roleIndicatorHeight + (maxChildContent - 1) * Math.max(nameLineHeight, contactLineHeight);
    const connectionSpace = 80;   // Space for connection lines
    const bottomMargin = 60;      // Space for instructions
    const calculatedHeight = Math.max(350, parentRowHeight + connectionSpace + childRowHeight + bottomMargin);
    
    return { width: calculatedWidth, height: calculatedHeight };
  };

  // Initialize node positions
  useEffect(() => {
    const parents = familyMembers.filter(m => m.role === 'parent');
    const children = familyMembers.filter(m => m.role === 'child');
    
    const { width } = calculateSVGDimensions();
    const nodeSpacing = 250;
    
    const newNodes: DraggableNode[] = [];
    
    // Calculate the total width needed for all members
    const maxMembersInRow = Math.max(parents.length, children.length);
    const totalWidth = maxMembersInRow * nodeSpacing;
    
    // Center the entire family tree horizontally
    const startX = (width - totalWidth) / 2 + nodeSpacing / 2;
    
    // Position parents at the top, centered above their children
    parents.forEach((parent, index) => {
      newNodes.push({
        id: `parent-${parent.entry.pid}`,
        x: startX + index * nodeSpacing,
        y: 80,
        member: parent
      });
    });
    
    // Position children below parents, aligned with parents
    children.forEach((child, index) => {
      newNodes.push({
        id: `child-${child.entry.pid}`,
        x: startX + index * nodeSpacing,
        y: 200,
        member: child
      });
    });
    
    setNodes(newNodes);
  }, [familyMembers]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (!svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setDraggedNode(nodeId);
    setDragOffset({
      x: e.clientX - svgRect.left - node.x,
      y: e.clientY - svgRect.top - node.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode || !svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const newX = e.clientX - svgRect.left - dragOffset.x;
    const newY = e.clientY - svgRect.top - dragOffset.y;
    
    setNodes(prev => prev.map(node => 
      node.id === draggedNode 
        ? { ...node, x: newX, y: newY }
        : node
    ));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const renderNode = (node: DraggableNode) => {
    const isParent = node.member.role === 'parent';
    const nodeColor = isParent ? '#fbbf24' : '#10b981';
    const borderColor = isParent ? '#d97706' : '#059669';
    
    // Calculate age if birth year is available
    const calculateAge = (dob?: string) => {
      if (!dob) return null;
      try {
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return null;
        const currentYear = new Date().getFullYear();
        const birthYear = birthDate.getFullYear();
        return currentYear - birthYear;
      } catch {
        return null;
      }
    };
    
    const age = calculateAge(node.member.entry.DOB);
    
    // Format name with age appended
    const nameWithAge = age ? `${node.member.entry.name || 'Unknown'} (${age})` : (node.member.entry.name || 'Unknown');
    
    // Split contact numbers for wrapping (assuming comma or semicolon separated)
    const contactNumbers = node.member.entry.contact ? 
      node.member.entry.contact.split(/[,;]/).map(c => c.trim()).filter(c => c) : [];
    
    // Function to wrap long text into multiple lines
    const wrapText = (text: string, maxWidth: number, fontSize: number = 12) => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        // Approximate text width (rough estimation: 6px per character for 12px font)
        const estimatedWidth = testLine.length * (fontSize * 0.5);
        
        if (estimatedWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Single word is too long, split it
            lines.push(word);
          }
        }
      });
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    };
    
    // Wrap the name if it's too long (node width is 180px, leave some margin)
    const maxNameWidth = 160; // Leave 10px margin on each side
    const wrappedNameLines = wrapText(nameWithAge, maxNameWidth, 14); // 14px font for name
    
    return (
      <g key={node.id}>
        {/* Node background */}
        <rect
          x={node.x}
          y={node.y}
          width={180}
          height={80}
          rx={8}
          fill={nodeColor}
          stroke={borderColor}
          strokeWidth={2}
          className="cursor-move"
          onMouseDown={(e) => handleMouseDown(e, node.id)}
        />
        
        {/* Role indicator */}
        <text
          x={node.x + 90}
          y={node.y + 25}
          textAnchor="middle"
          className="text-sm font-bold fill-gray-800"
        >
          {isParent ? '👨‍👩‍👧‍👦' : '👶'}
        </text>
        
        {/* Name with age - wrapped if too long */}
        {wrappedNameLines.map((line, index) => (
          <text
            key={index}
            x={node.x + 90}
            y={node.y + 45 + (index * 16)}
            textAnchor="middle"
            className="text-sm font-medium fill-gray-900"
          >
            {line}
          </text>
        ))}
        
        {/* Contact numbers with wrapping */}
        {contactNumbers.length > 0 && (
          <g>
            {contactNumbers.map((contact, index) => (
              <text
                key={index}
                x={node.x + 90}
                y={node.y + 45 + (wrappedNameLines.length * 16) + (index * 12)}
                textAnchor="middle"
                className="text-xs fill-gray-700"
              >
                📞 {contact}
              </text>
          ))}
          </g>
        )}
      </g>
    );
  };

  const renderConnections = () => {
    const parents = nodes.filter(n => n.member.role === 'parent');
    const children = nodes.filter(n => n.member.role === 'child');
    
    if (parents.length === 0) return null;
    
    return (
      <g>
        {/* Connect parents with horizontal line if there are multiple parents */}
        {parents.length > 1 && (
          <line
            x1={parents[0].x + 90}
            y1={parents[0].y + 40}
            x2={parents[parents.length - 1].x + 90}
            y2={parents[parents.length - 1].y + 40}
            stroke="#6b7280"
            strokeWidth={3}
          />
        )}
        
        {/* Connect children to the middle of parent connection line with 90-degree angles */}
        {children.map(child => {
          if (parents.length === 0) return null;
          
          let connectionX: number;
          if (parents.length === 1) {
            // Single parent - connect directly
            connectionX = parents[0].x + 90;
          } else {
            // Multiple parents - connect to middle of parent line
            const firstParentX = parents[0].x + 90;
            const lastParentX = parents[parents.length - 1].x + 90;
            connectionX = firstParentX + (lastParentX - firstParentX) / 2;
          }
          
          const childCenterX = child.x + 90;
          const parentLineY = parents[0].y + 40;
          const childTopY = child.y;
          
          // Create L-shaped connection with 90-degree angles
          // Vertical line from parent line to child level
          const verticalLineY = parentLineY + (childTopY - parentLineY) / 2;
          
          return (
            <g key={`parent-connection-${child.id}`}>
              {/* Vertical line from parent line to middle level */}
              <line
                x1={connectionX}
                y1={parentLineY}
                x2={connectionX}
                y2={verticalLineY}
                stroke="#6b7280"
                strokeWidth={2}
              />
              
              {/* Horizontal line from middle to child's center */}
              <line
                x1={connectionX}
                y1={verticalLineY}
                x2={childCenterX}
                y2={verticalLineY}
                stroke="#6b7280"
                strokeWidth={2}
              />
              
              {/* Vertical line from middle level to child */}
              <line
                x1={childCenterX}
                y1={verticalLineY}
                x2={childCenterX}
                y2={childTopY}
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="4,4"
              />
            </g>
          );
        })}
      </g>
    );
  };

  if (familyMembers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No family members found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          We couldn't find additional people at this address and island.
        </p>
      </div>
    );
  }

  const { width, height } = calculateSVGDimensions();

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border border-gray-200 rounded-lg bg-white"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background */}
          <rect width="100%" height="100%" fill="#fafafa" />
          
          {/* Connections */}
          {renderConnections()}
          
          {/* Nodes */}
          {nodes.map(renderNode)}
          
          {/* Instructions */}
          <text
            x={width / 2}
            y={height - 20}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            💡 Drag nodes to rearrange the family tree
          </text>
        </svg>
      </div>
    </div>
  );
};

export default FamilyTreeVisualization;
