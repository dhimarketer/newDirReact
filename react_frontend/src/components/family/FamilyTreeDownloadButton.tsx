// 2025-01-29: NEW - Download button component for family tree graphics
// 2025-01-29: Provides PNG and SVG download options with format selection
// 2025-01-29: ENHANCED - Added JPG support as third format option

import React, { useState, useRef, useEffect } from 'react';
import { Download, Image, FileText, ChevronDown } from 'lucide-react';
import { downloadFamilyTree, getOptimalImageDimensions } from '../../utils/imageDownloadUtils';

// Text wrapping utility functions
const wrapText = (text: string, maxWidth: number, fontSize: number = 12): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  // Estimate character width (rough approximation)
  const charWidth = fontSize * 0.6;
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, break it
        lines.push(word.substring(0, maxCharsPerLine));
        currentLine = word.substring(maxCharsPerLine);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

const wrapTextCanvas = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, break it
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

// Pure SVG generator function that reuses the same layout logic as ClassicFamilyTree
const generateFamilyTreeSVG = (familyMembers: any[], relationships: any[] = [], parentCount?: number, childCount?: number): SVGSVGElement => {
  // Use exact parent/child split from displayed layout, or fallback to role-based detection
  let parents: any[] = [];
  let children: any[] = [];
  
  if (parentCount !== undefined && childCount !== undefined) {
    // Use exact counts from displayed layout
    parents = familyMembers.filter(m => m.role === 'parent');
    children = familyMembers.filter(m => m.role === 'child');
    console.log(`🎯 Using exact layout: ${parents.length} parents, ${children.length} children`);
  } else {
    // Fallback to age-based detection (should not happen in download context)
    const sortedByAge = [...familyMembers].sort((a, b) => (b.entry.age || 0) - (a.entry.age || 0));
    const totalMembers = familyMembers.length;
    const detectedParentCount = Math.min(2, Math.ceil(totalMembers / 2));
    parents = sortedByAge.slice(0, detectedParentCount);
    children = sortedByAge.slice(detectedParentCount);
    console.log(`⚠️ Fallback age detection: ${parents.length} parents, ${children.length} children`);
  }
  
  console.log(`🎨 SVG Generator: ${parents.length} parents, ${children.length} children`);
  
  // Calculate dimensions (same as ClassicFamilyTree)
  const nodeWidth = 120;
  const nodeHeight = 60;
  const horizontalSpacing = 20;
  const verticalSpacing = 80;
  
  const parentWidth = parents.length * nodeWidth + (parents.length - 1) * horizontalSpacing;
  const childWidth = children.length * nodeWidth + (children.length - 1) * horizontalSpacing;
  const totalWidth = Math.max(parentWidth, childWidth, 400);
  const totalHeight = 200 + (children.length > 0 ? verticalSpacing : 0);
  
  // Calculate positions
  const parentY = 20;
  const childY = parentY + nodeHeight + verticalSpacing;
  const parentStartX = (totalWidth - parentWidth) / 2;
  const childStartX = (totalWidth - childWidth) / 2;
  
  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', totalWidth.toString());
  svg.setAttribute('height', totalHeight.toString());
  svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
  svg.style.backgroundColor = '#ffffff';
  
  // Create parent nodes
  parents.forEach((parent, index) => {
    const x = parentStartX + index * (nodeWidth + horizontalSpacing);
    const y = parentY;
    
    // Create parent group
    const parentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Parent rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x.toString());
    rect.setAttribute('y', y.toString());
    rect.setAttribute('width', nodeWidth.toString());
    rect.setAttribute('height', nodeHeight.toString());
    rect.setAttribute('fill', '#fef3c7');
    rect.setAttribute('stroke', '#8B4513');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '8');
    parentGroup.appendChild(rect);
    
    // Parent name with text wrapping
    const nameLines = wrapText(parent.entry.name || 'Unknown', nodeWidth - 10, 12);
    const totalNameHeight = nameLines.length * 14; // 14px per line
    const nameStartY = y + (nodeHeight - totalNameHeight) / 2 + 6; // Center vertically
    
    nameLines.forEach((line, index) => {
      const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameText.setAttribute('x', (x + nodeWidth / 2).toString());
      nameText.setAttribute('y', (nameStartY + index * 14).toString());
      nameText.setAttribute('text-anchor', 'middle');
      nameText.setAttribute('font-family', 'Arial, sans-serif');
      nameText.setAttribute('font-size', '12');
      nameText.setAttribute('font-weight', 'bold');
      nameText.setAttribute('fill', '#333');
      nameText.textContent = line;
      parentGroup.appendChild(nameText);
    });
    
    // Parent age (positioned below the wrapped name)
    if (parent.entry.age) {
      const ageText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ageText.setAttribute('x', (x + nodeWidth / 2).toString());
      ageText.setAttribute('y', (nameStartY + nameLines.length * 14 + 8).toString());
      ageText.setAttribute('text-anchor', 'middle');
      ageText.setAttribute('font-family', 'Arial, sans-serif');
      ageText.setAttribute('font-size', '10');
      ageText.setAttribute('fill', '#666');
      ageText.textContent = `${parent.entry.age} years`;
      parentGroup.appendChild(ageText);
    }
    
    svg.appendChild(parentGroup);
  });
  
  // Create child nodes
  children.forEach((child, index) => {
    const x = childStartX + index * (nodeWidth + horizontalSpacing);
    const y = childY;
    
    // Create child group
    const childGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Child rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x.toString());
    rect.setAttribute('y', y.toString());
    rect.setAttribute('width', nodeWidth.toString());
    rect.setAttribute('height', nodeHeight.toString());
    rect.setAttribute('fill', '#dbeafe');
    rect.setAttribute('stroke', '#8B4513');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '8');
    childGroup.appendChild(rect);
    
    // Child name with text wrapping
    const nameLines = wrapText(child.entry.name || 'Unknown', nodeWidth - 10, 12);
    const totalNameHeight = nameLines.length * 14; // 14px per line
    const nameStartY = y + (nodeHeight - totalNameHeight) / 2 + 6; // Center vertically
    
    nameLines.forEach((line, index) => {
      const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameText.setAttribute('x', (x + nodeWidth / 2).toString());
      nameText.setAttribute('y', (nameStartY + index * 14).toString());
      nameText.setAttribute('text-anchor', 'middle');
      nameText.setAttribute('font-family', 'Arial, sans-serif');
      nameText.setAttribute('font-size', '12');
      nameText.setAttribute('font-weight', 'bold');
      nameText.setAttribute('fill', '#333');
      nameText.textContent = line;
      childGroup.appendChild(nameText);
    });
    
    // Child age (positioned below the wrapped name)
    if (child.entry.age) {
      const ageText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ageText.setAttribute('x', (x + nodeWidth / 2).toString());
      ageText.setAttribute('y', (nameStartY + nameLines.length * 14 + 8).toString());
      ageText.setAttribute('text-anchor', 'middle');
      ageText.setAttribute('font-family', 'Arial, sans-serif');
      ageText.setAttribute('font-size', '10');
      ageText.setAttribute('fill', '#666');
      ageText.textContent = `${child.entry.age} years`;
      childGroup.appendChild(ageText);
    }
    
    svg.appendChild(childGroup);
  });
  
  // Draw connections (same logic as ClassicFamilyTree)
  console.log(`🔗 SVG Generator - Drawing connections: ${parents.length} parents, ${children.length} children`);
  if (parents.length > 0 && children.length > 0) {
    const connectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // If multiple parents, draw spouse line
    if (parents.length === 2) {
      const parent1X = parentStartX + nodeWidth / 2;
      const parent2X = parentStartX + nodeWidth + horizontalSpacing + nodeWidth / 2;
      const spouseY = parentY + nodeHeight;
      
      const spouseLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      spouseLine.setAttribute('x1', parent1X.toString());
      spouseLine.setAttribute('y1', spouseY.toString());
      spouseLine.setAttribute('x2', parent2X.toString());
      spouseLine.setAttribute('y2', spouseY.toString());
      spouseLine.setAttribute('stroke', '#8B4513');
      spouseLine.setAttribute('stroke-width', '3');
      spouseLine.setAttribute('stroke-dasharray', '8,4');
      connectionGroup.appendChild(spouseLine);
      
      // Center point for children connection
      const centerX = (parent1X + parent2X) / 2;
      const centerY = spouseY;
      
      // Vertical line down from center
      const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      verticalLine.setAttribute('x1', centerX.toString());
      verticalLine.setAttribute('y1', centerY.toString());
      verticalLine.setAttribute('x2', centerX.toString());
      verticalLine.setAttribute('y2', (centerY + verticalSpacing / 2).toString());
      verticalLine.setAttribute('stroke', '#8B4513');
      verticalLine.setAttribute('stroke-width', '3');
      connectionGroup.appendChild(verticalLine);
      
      // Horizontal distribution line to children
      if (children.length > 0) {
        const firstChildX = childStartX + nodeWidth / 2;
        const lastChildX = childStartX + (children.length - 1) * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
        const distributionY = centerY + verticalSpacing / 2;
        
        const distributionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        distributionLine.setAttribute('x1', firstChildX.toString());
        distributionLine.setAttribute('y1', distributionY.toString());
        distributionLine.setAttribute('x2', lastChildX.toString());
        distributionLine.setAttribute('y2', distributionY.toString());
        distributionLine.setAttribute('stroke', '#8B4513');
        distributionLine.setAttribute('stroke-width', '3');
        connectionGroup.appendChild(distributionLine);
        
        // Vertical lines to each child
        children.forEach((child, index) => {
          const childX = childStartX + index * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
          
          const childLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          childLine.setAttribute('x1', childX.toString());
          childLine.setAttribute('y1', distributionY.toString());
          childLine.setAttribute('x2', childX.toString());
          childLine.setAttribute('y2', childY.toString());
          childLine.setAttribute('stroke', '#8B4513');
          childLine.setAttribute('stroke-width', '3');
          connectionGroup.appendChild(childLine);
        });
      }
    } else if (parents.length === 1) {
      // Single parent - direct connection to children
      console.log(`🔗 SVG - Drawing single parent connections`);
      const parentX = parentStartX + nodeWidth / 2;
      const parentBottomY = parentY + nodeHeight;
      
      if (children.length > 0) {
        // Vertical line down from parent
        const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        verticalLine.setAttribute('x1', parentX.toString());
        verticalLine.setAttribute('y1', parentBottomY.toString());
        verticalLine.setAttribute('x2', parentX.toString());
        verticalLine.setAttribute('y2', (parentBottomY + verticalSpacing / 2).toString());
        verticalLine.setAttribute('stroke', '#8B4513');
        verticalLine.setAttribute('stroke-width', '3');
        connectionGroup.appendChild(verticalLine);
        
        // Horizontal distribution line to children
        const firstChildX = childStartX + nodeWidth / 2;
        const lastChildX = childStartX + (children.length - 1) * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
        const distributionY = parentBottomY + verticalSpacing / 2;
        
        const distributionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        distributionLine.setAttribute('x1', firstChildX.toString());
        distributionLine.setAttribute('y1', distributionY.toString());
        distributionLine.setAttribute('x2', lastChildX.toString());
        distributionLine.setAttribute('y2', distributionY.toString());
        distributionLine.setAttribute('stroke', '#8B4513');
        distributionLine.setAttribute('stroke-width', '3');
        connectionGroup.appendChild(distributionLine);
        
        // Vertical lines to each child
        children.forEach((child, index) => {
          const childX = childStartX + index * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
          
          const childLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          childLine.setAttribute('x1', childX.toString());
          childLine.setAttribute('y1', distributionY.toString());
          childLine.setAttribute('x2', childX.toString());
          childLine.setAttribute('y2', childY.toString());
          childLine.setAttribute('stroke', '#8B4513');
          childLine.setAttribute('stroke-width', '3');
          connectionGroup.appendChild(childLine);
        });
      }
    }
    
    svg.appendChild(connectionGroup);
  }
  
  return svg;
};

interface FamilyTreeDownloadButtonProps {
  svgRef: React.RefObject<SVGSVGElement>;
  familyName: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  currentViewMode?: string; // 2025-01-05: NEW - Track current view mode for appropriate download
}

const FamilyTreeDownloadButton: React.FC<FamilyTreeDownloadButtonProps> = ({
  svgRef,
  familyName,
  className = '',
  variant = 'primary',
  size = 'md',
  currentViewMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const downloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDownload = async (format: 'png' | 'jpg' | 'svg') => {
    console.log('🔽 Download initiated:', { 
      format, 
      familyName, 
      currentViewMode, 
      svgExists: !!svgRef.current 
    });
    
    // For table view, we need to handle it differently since there's no SVG
    if (currentViewMode === 'table') {
      console.log('📊 Table view download requested - converting table to image');
      
      // Find the table element - try multiple selectors
      let tableElement = document.querySelector('table.w-full.border-collapse') as HTMLTableElement;
      
      if (!tableElement) {
        tableElement = document.querySelector('table') as HTMLTableElement;
      }
      
      if (!tableElement) {
        // Try to find any table in the family tree content area
        const familyTreeContent = document.querySelector('.family-tree-content');
        if (familyTreeContent) {
          tableElement = familyTreeContent.querySelector('table') as HTMLTableElement;
        }
      }
      
      if (!tableElement) {
        console.error('❌ Table element not found for download. Available elements:', {
          allTables: document.querySelectorAll('table').length,
          familyTreeContent: document.querySelector('.family-tree-content'),
          tablesInContent: document.querySelector('.family-tree-content')?.querySelectorAll('table').length || 0
        });
        alert('Table not ready for download. Please wait for the table to load.');
        return;
      }
      
      console.log('🎯 Found table element:', tableElement);
      console.log('📊 Table details:', {
        tagName: tableElement.tagName,
        className: tableElement.className,
        rows: tableElement.rows.length,
        cells: tableElement.querySelectorAll('td, th').length
      });
      
      try {
        setIsDownloading(true);
        
        // Set a timeout to reset downloading state if something goes wrong
        downloadTimeoutRef.current = setTimeout(() => {
          console.log('⏰ Download timeout, resetting state');
          setIsDownloading(false);
        }, 10000);
        
        // For table view, we'll use html2canvas to convert the table to an image
        const { default: html2canvas } = await import('html2canvas');
        
        const canvas = await html2canvas(tableElement, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true
        });
        
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `family_table_${familyName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('✅ Table download completed successfully');
            setIsOpen(false);
            setIsDownloading(false);
            
            // Clear timeout since download completed
            if (downloadTimeoutRef.current) {
              clearTimeout(downloadTimeoutRef.current);
              downloadTimeoutRef.current = null;
            }
          } else {
            throw new Error('Failed to create image from table');
          }
        }, format === 'jpg' ? 'image/jpeg' : 'image/png');
        
        return;
      } catch (error) {
        console.error('❌ Table download failed:', error);
        alert(`Table download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsDownloading(false);
        
        // Clear timeout since download failed
        if (downloadTimeoutRef.current) {
          clearTimeout(downloadTimeoutRef.current);
          downloadTimeoutRef.current = null;
        }
        return;
      }
    }
    
    // For ReactFlow views, we need to find the ReactFlow container and use html-to-image
    if (currentViewMode === 'clean-reactflow') {
      // Add a small delay to ensure ReactFlow has fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the ReactFlow container instead of trying to find SVG
      let reactFlowContainer = document.querySelector('.react-flow__renderer') as HTMLElement;
      
      if (!reactFlowContainer) {
        reactFlowContainer = document.querySelector('.react-flow') as HTMLElement;
      }
      
      if (!reactFlowContainer) {
        reactFlowContainer = document.querySelector('.clean-family-tree-container') as HTMLElement;
      }
      
      // Also try to find the ReactFlow viewport which contains the actual rendered content
      let reactFlowViewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!reactFlowViewport) {
        reactFlowViewport = document.querySelector('[data-id="rf__viewport"]') as HTMLElement;
      }
      
      // Try to find the actual ReactFlow nodes and edges
      const reactFlowNodes = document.querySelectorAll('.react-flow__node');
      const reactFlowEdges = document.querySelectorAll('.react-flow__edge');
      const customNodes = document.querySelectorAll('.clean-family-node');
      
      console.log('📊 ReactFlow content analysis:', {
        viewport: !!reactFlowViewport,
        nodes: reactFlowNodes.length,
        edges: reactFlowEdges.length,
        customNodes: customNodes.length,
        container: !!reactFlowContainer
      });
      
      if (reactFlowContainer) {
        console.log('🎯 Found ReactFlow container:', reactFlowContainer);
        console.log('📊 Container details:', {
          tagName: reactFlowContainer.tagName,
          className: reactFlowContainer.className,
          children: reactFlowContainer.children.length,
          innerHTML: reactFlowContainer.innerHTML.substring(0, 200) + '...'
        });
        
        // For ReactFlow, we need to use a different approach since it doesn't render to a single SVG
        // Let's try to find the actual SVG with content
        const svgs = reactFlowContainer.querySelectorAll('svg');
        console.log('📊 Found SVGs in container:', svgs.length);
        
        let reactFlowSvg: SVGSVGElement | null = null;
        
        // Look for SVG with actual content (nodes/edges)
        let bestSvg: SVGSVGElement | null = null;
        let maxContent = 0;
        
        for (let i = 0; i < svgs.length; i++) {
          const svg = svgs[i] as SVGSVGElement;
          const hasContent = svg.querySelectorAll('g, path, circle, rect').length > 0;
          const isNotMarker = !svg.classList.contains('react-flow__marker');
          const contentCount = svg.querySelectorAll('g, path, circle, rect, line').length;
          
          // Check for ReactFlow specific content
          const hasNodes = svg.querySelectorAll('[data-id]').length > 0;
          const hasEdges = svg.querySelectorAll('.react-flow__edge').length > 0;
          const hasHandles = svg.querySelectorAll('.react-flow__handle').length > 0;
          
          console.log(`📊 SVG ${i}:`, {
            isNotMarker,
            hasContent,
            hasNodes,
            hasEdges,
            hasHandles,
            children: svg.children.length,
            gCount: svg.querySelectorAll('g').length,
            pathCount: svg.querySelectorAll('path').length,
            contentCount: contentCount,
            className: svg.className,
            viewBox: svg.getAttribute('viewBox'),
            width: svg.getAttribute('width'),
            height: svg.getAttribute('height')
          });
          
          // Prioritize SVGs with ReactFlow content
          const reactFlowContentCount = hasNodes ? 1000 : 0;
          const totalContentCount = contentCount + reactFlowContentCount;
          
          if (isNotMarker && (hasContent || hasNodes || hasEdges) && totalContentCount > maxContent) {
            bestSvg = svg;
            maxContent = totalContentCount;
          }
        }
        
        reactFlowSvg = bestSvg;
        
        if (!reactFlowSvg && svgs.length > 0) {
          // Fallback to the largest SVG
          reactFlowSvg = Array.from(svgs).reduce((largest, current) => {
            const currentArea = (current.getBoundingClientRect().width || 0) * (current.getBoundingClientRect().height || 0);
            const largestArea = (largest.getBoundingClientRect().width || 0) * (largest.getBoundingClientRect().height || 0);
            return currentArea > largestArea ? current : largest;
          }, svgs[0]) as SVGSVGElement;
        }
        
      if (reactFlowSvg) {
        console.log('🎯 Found ReactFlow SVG element:', reactFlowSvg);
        console.log('📊 SVG element details:', {
          tagName: reactFlowSvg.tagName,
          width: reactFlowSvg.getAttribute('width'),
          height: reactFlowSvg.getAttribute('height'),
          viewBox: reactFlowSvg.getAttribute('viewBox'),
          children: reactFlowSvg.children.length,
          innerHTML: reactFlowSvg.innerHTML.substring(0, 200) + '...'
        });
        
        // Check if this SVG has actual content (nodes/edges)
        const hasNodes = reactFlowSvg.querySelectorAll('[data-id]').length > 0;
        const hasPaths = reactFlowSvg.querySelectorAll('path').length > 0;
        const hasG = reactFlowSvg.querySelectorAll('g').length > 0;
        
        console.log('📊 SVG content check:', {
          hasNodes: hasNodes,
          hasPaths: hasPaths,
          hasG: hasG,
          nodeCount: reactFlowSvg.querySelectorAll('[data-id]').length,
          pathCount: reactFlowSvg.querySelectorAll('path').length,
          gCount: reactFlowSvg.querySelectorAll('g').length
        });
        
        // For ReactFlow, generate a pure SVG directly from the family data using the same layout logic
        console.log('🔄 Using pure SVG generation from family data');
        
        try {
          setIsDownloading(true);
          
          // Set a timeout to reset downloading state if something goes wrong
          downloadTimeoutRef.current = setTimeout(() => {
            console.log('⏰ Download timeout, resetting state');
            setIsDownloading(false);
          }, 10000);
          
          // Get the family data from the ReactFlow component
          // We need to extract the family members and relationships that are being displayed
          console.log('🔍 Extracting family data from ReactFlow display...');
          
          // Find the ReactFlow component and extract the underlying data
          const cleanFamilyTreeContainer = document.querySelector('.clean-family-tree-container');
          if (!cleanFamilyTreeContainer) {
            throw new Error('No clean family tree container found');
          }
          
          // Extract the EXACT layout from the displayed ReactFlow nodes (don't re-detect parents!)
          const reactFlowNodes = document.querySelectorAll('.react-flow__node');
          const displayedNodes: any[] = [];
          
          // Get node positions and data from the actual displayed layout
          reactFlowNodes.forEach((node) => {
            const nameElement = node.querySelector('.clean-family-node__name');
            const ageElement = node.querySelector('.clean-family-node__age');
            const nodeElement = node as HTMLElement;
            const nodeRect = nodeElement.getBoundingClientRect();
            
            if (nameElement) {
              const name = nameElement.textContent || '';
              const ageText = ageElement?.textContent || '';
              const age = ageText.includes('years') ? parseInt(ageText.replace(' years', '')) : undefined;
              
              // Look deeper into the ReactFlow node structure to find the actual styled content
              let isParent = false;
              
              // Method 1: Look for the inner div with clean-family-node class and background styling
              const innerNodes = nodeElement.querySelectorAll('div[style*="background"], div[class*="clean-family-node"]');
              
              for (let innerNode of innerNodes) {
                const innerStyle = getComputedStyle(innerNode as Element);
                const bgColor = innerStyle.backgroundColor;
                
                // Parent nodes have yellow background (#fef3c7 = rgb(254, 243, 199))
                if (bgColor === 'rgb(254, 243, 199)' || 
                    bgColor.includes('254, 243, 199') ||
                    (innerNode as HTMLElement).style.backgroundColor.includes('#fef3c7') ||
                    (innerNode as HTMLElement).style.backgroundColor.includes('254, 243, 199')) {
                  isParent = true;
                  console.log(`🎯 Found parent styling in inner node: ${bgColor}`);
                  break;
                }
              }
              
              // Method 2: Check for class names containing parent/child indicators
              const allElements = nodeElement.querySelectorAll('*');
              for (let element of allElements) {
                if (element.className && typeof element.className === 'string') {
                  if (element.className.includes('parent')) {
                    isParent = true;
                    console.log(`🎯 Found parent class: ${element.className}`);
                    break;
                  }
                }
              }
              
              // Method 3: Use Y position as fallback - if it's in the top half, likely a parent
              const containerRect = document.querySelector('.clean-family-tree-container')?.getBoundingClientRect();
              if (containerRect && !isParent) {
                const nodeCenter = nodeRect.top + nodeRect.height / 2;
                const containerCenter = containerRect.top + containerRect.height / 2;
                if (nodeCenter < containerCenter) {
                  isParent = true;
                  console.log(`🎯 Using position fallback: node at top half = parent`);
                }
              }
              
              console.log(`🔍 Node "${name}": isParent=${isParent}, innerNodes=${innerNodes.length}`);
              
              displayedNodes.push({
                entry: {
                  pid: displayedNodes.length + 1,
                  name: name,
                  age: age
                },
                role: isParent ? 'parent' : 'child',
                x: nodeRect.left,
                y: nodeRect.top,
                width: nodeRect.width,
                height: nodeRect.height
              });
            }
          });
          
          // Sort by Y position to maintain the layout structure (parents at top)
          displayedNodes.sort((a, b) => a.y - b.y);
          
          // Separate parents and children based on the ACTUAL displayed layout
          const parents = displayedNodes.filter(node => node.role === 'parent');
          const children = displayedNodes.filter(node => node.role === 'child');
          
          // If role detection failed, use Y position as fallback (same generation = similar Y)
          if (parents.length === 0 && children.length === 0) {
            const sortedByY = displayedNodes.sort((a, b) => a.y - b.y);
            const generations = [];
            let currentGeneration = [sortedByY[0]];
            
            for (let i = 1; i < sortedByY.length; i++) {
              if (Math.abs(sortedByY[i].y - currentGeneration[0].y) <= 50) {
                currentGeneration.push(sortedByY[i]);
              } else {
                generations.push(currentGeneration);
                currentGeneration = [sortedByY[i]];
              }
            }
            generations.push(currentGeneration);
            
            // First generation = parents, rest = children
            const parentsFromLayout = generations[0] || [];
            const childrenFromLayout = generations.slice(1).flat() || [];
            
            parents.push(...parentsFromLayout.map(n => ({ ...n, role: 'parent' })));
            children.push(...childrenFromLayout.map(n => ({ ...n, role: 'child' })));
          }
          
          console.log(`📊 Extracted EXACT layout: ${parents.length} parents, ${children.length} children`);
          console.log(`👨‍👩‍👧‍👦 Parents:`, parents.map(p => p.entry.name));
          console.log(`👶 Children:`, children.map(c => c.entry.name));
          
          // Debug: Check if we have the connection drawing condition
          if (parents.length > 0 && children.length > 0) {
            console.log(`🔗 Will draw connections: ${parents.length} parent(s) → ${children.length} child(ren)`);
          } else {
            console.log(`❌ No connections to draw: ${parents.length} parents, ${children.length} children`);
          }
          
          // Generate SVG using the EXACT extracted layout
          const familyMembers = [...parents, ...children];
          const generatedSvg = generateFamilyTreeSVG(familyMembers, [], parents.length, children.length);
          
          console.log('✅ Generated pure SVG from family data');
          
          // Convert SVG to image
          if (format === 'svg') {
            // For SVG format, download the SVG directly
            const svgData = new XMLSerializer().serializeToString(generatedSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `family_tree_${familyName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('✅ Pure SVG download completed successfully');
            setIsOpen(false);
            setIsDownloading(false);
            
            if (downloadTimeoutRef.current) {
              clearTimeout(downloadTimeoutRef.current);
              downloadTimeoutRef.current = null;
            }
          } else {
            // For PNG/JPG, draw directly on canvas instead of SVG conversion
            console.log(`🖼️ Drawing family tree directly on canvas for ${format.toUpperCase()}`);
            
            // Use the EXACT same parent/child split from the extracted layout
            const parents = familyMembers.filter(m => m.role === 'parent');
            const children = familyMembers.filter(m => m.role === 'child');
            
            // Calculate dimensions (same as SVG)
            const nodeWidth = 120;
            const nodeHeight = 60;
            const horizontalSpacing = 20;
            const verticalSpacing = 80;
            
            const parentWidth = parents.length * nodeWidth + (parents.length - 1) * horizontalSpacing;
            const childWidth = children.length * nodeWidth + (children.length - 1) * horizontalSpacing;
            const totalWidth = Math.max(parentWidth, childWidth, 400);
            const totalHeight = 200 + (children.length > 0 ? verticalSpacing : 0);
            
            // Calculate positions
            const parentY = 20;
            const childY = parentY + nodeHeight + verticalSpacing;
            const parentStartX = (totalWidth - parentWidth) / 2;
            const childStartX = (totalWidth - childWidth) / 2;
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = totalWidth * 2; // Higher resolution
            canvas.height = totalHeight * 2;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Could not get canvas context');
            }
            
            // Scale for higher resolution
            ctx.scale(2, 2);
            
            // Fill white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, totalWidth, totalHeight);
            
            // Set default font
            ctx.font = '12px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            console.log(`🎨 Drawing ${parents.length} parents and ${children.length} children`);
            
            // Draw parent nodes
            parents.forEach((parent, index) => {
              const x = parentStartX + index * (nodeWidth + horizontalSpacing);
              const y = parentY;
              
              // Draw parent rectangle
              ctx.fillStyle = '#fef3c7';
              ctx.strokeStyle = '#8B4513';
              ctx.lineWidth = 2;
              
              // Draw rounded rectangle
              ctx.beginPath();
              ctx.roundRect(x, y, nodeWidth, nodeHeight, 8);
              ctx.fill();
              ctx.stroke();
              
              // Draw parent name with wrapping
              ctx.fillStyle = '#333';
              ctx.font = 'bold 12px Arial, sans-serif';
              const parentNameLines = wrapTextCanvas(ctx, parent.entry.name || 'Unknown', nodeWidth - 10);
              const parentNameHeight = parentNameLines.length * 14;
              const parentNameStartY = y + (nodeHeight - parentNameHeight) / 2 + 6;
              
              parentNameLines.forEach((line, index) => {
                ctx.fillText(line, x + nodeWidth / 2, parentNameStartY + index * 14);
              });
              
              // Draw parent age (positioned below wrapped name)
              if (parent.entry.age) {
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial, sans-serif';
                ctx.fillText(`${parent.entry.age} years`, x + nodeWidth / 2, parentNameStartY + parentNameLines.length * 14 + 8);
              }
            });
            
            // Draw child nodes
            children.forEach((child, index) => {
              const x = childStartX + index * (nodeWidth + horizontalSpacing);
              const y = childY;
              
              // Draw child rectangle
              ctx.fillStyle = '#dbeafe';
              ctx.strokeStyle = '#8B4513';
              ctx.lineWidth = 2;
              
              // Draw rounded rectangle
              ctx.beginPath();
              ctx.roundRect(x, y, nodeWidth, nodeHeight, 8);
              ctx.fill();
              ctx.stroke();
              
              // Draw child name with wrapping
              ctx.fillStyle = '#333';
              ctx.font = 'bold 12px Arial, sans-serif';
              const childNameLines = wrapTextCanvas(ctx, child.entry.name || 'Unknown', nodeWidth - 10);
              const childNameHeight = childNameLines.length * 14;
              const childNameStartY = y + (nodeHeight - childNameHeight) / 2 + 6;
              
              childNameLines.forEach((line, index) => {
                ctx.fillText(line, x + nodeWidth / 2, childNameStartY + index * 14);
              });
              
              // Draw child age (positioned below wrapped name)
              if (child.entry.age) {
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial, sans-serif';
                ctx.fillText(`${child.entry.age} years`, x + nodeWidth / 2, childNameStartY + childNameLines.length * 14 + 8);
              }
            });
            
            // Draw connections
            console.log(`🔗 Canvas - Drawing connections: ${parents.length} parents, ${children.length} children`);
            if (parents.length > 0 && children.length > 0) {
              ctx.strokeStyle = '#8B4513';
              ctx.lineWidth = 3;
              
              if (parents.length === 2) {
                // Two parents - draw spouse line and connections
                const parent1X = parentStartX + nodeWidth / 2;
                const parent2X = parentStartX + nodeWidth + horizontalSpacing + nodeWidth / 2;
                const spouseY = parentY + nodeHeight;
                
                // Draw spouse line (dashed)
                ctx.setLineDash([8, 4]);
                ctx.beginPath();
                ctx.moveTo(parent1X, spouseY);
                ctx.lineTo(parent2X, spouseY);
                ctx.stroke();
                
                // Reset line dash
                ctx.setLineDash([]);
                
                // Center point for children connection
                const centerX = (parent1X + parent2X) / 2;
                const centerY = spouseY;
                
                // Vertical line down from center
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX, centerY + verticalSpacing / 2);
                ctx.stroke();
                
                // Horizontal distribution line to children
                if (children.length > 0) {
                  const firstChildX = childStartX + nodeWidth / 2;
                  const lastChildX = childStartX + (children.length - 1) * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
                  const distributionY = centerY + verticalSpacing / 2;
                  
                  ctx.beginPath();
                  ctx.moveTo(firstChildX, distributionY);
                  ctx.lineTo(lastChildX, distributionY);
                  ctx.stroke();
                  
                  // Vertical lines to each child
                  children.forEach((child, index) => {
                    const childX = childStartX + index * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
                    ctx.beginPath();
                    ctx.moveTo(childX, distributionY);
                    ctx.lineTo(childX, childY);
                    ctx.stroke();
                  });
                }
              } else if (parents.length === 1) {
                // Single parent - direct connection to children
                console.log(`🔗 Canvas - Drawing single parent connections`);
                const parentX = parentStartX + nodeWidth / 2;
                const parentBottomY = parentY + nodeHeight;
                
                if (children.length > 0) {
                  // Vertical line down from parent
                  ctx.beginPath();
                  ctx.moveTo(parentX, parentBottomY);
                  ctx.lineTo(parentX, parentBottomY + verticalSpacing / 2);
                  ctx.stroke();
                  
                  // Horizontal distribution line to children
                  const firstChildX = childStartX + nodeWidth / 2;
                  const lastChildX = childStartX + (children.length - 1) * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
                  const distributionY = parentBottomY + verticalSpacing / 2;
                  
                  ctx.beginPath();
                  ctx.moveTo(firstChildX, distributionY);
                  ctx.lineTo(lastChildX, distributionY);
                  ctx.stroke();
                  
                  // Vertical lines to each child
                  children.forEach((child, index) => {
                    const childX = childStartX + index * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
                    ctx.beginPath();
                    ctx.moveTo(childX, distributionY);
                    ctx.lineTo(childX, childY);
                    ctx.stroke();
                  });
                }
              }
            }
            
            console.log('✅ Family tree drawn directly on canvas');
            
            // Convert to blob and download
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `family_tree_${familyName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                console.log(`✅ Direct canvas ${format.toUpperCase()} download completed successfully`);
                setIsOpen(false);
                setIsDownloading(false);
                
                if (downloadTimeoutRef.current) {
                  clearTimeout(downloadTimeoutRef.current);
                  downloadTimeoutRef.current = null;
                }
              } else {
                throw new Error(`Failed to create ${format} blob from direct canvas`);
              }
            }, format === 'jpg' ? 'image/jpeg' : 'image/png', format === 'jpg' ? 0.95 : undefined);
          }
          
          return;
        } catch (error) {
          console.error('❌ Pure SVG generation failed:', error);
          
          // Fall through to try direct SVG approach
        }
        
        try {
          setIsDownloading(true);
          
          // Set a timeout to reset downloading state if something goes wrong
          downloadTimeoutRef.current = setTimeout(() => {
            console.log('⏰ Download timeout, resetting state');
            setIsDownloading(false);
          }, 10000); // 10 second timeout
          
          await downloadFamilyTree(reactFlowSvg, familyName, format);
          console.log('✅ ReactFlow download completed successfully');
          setIsOpen(false);
          setIsDownloading(false);
          
          // Clear timeout since download completed
          if (downloadTimeoutRef.current) {
            clearTimeout(downloadTimeoutRef.current);
            downloadTimeoutRef.current = null;
          }
          return;
        } catch (error) {
          console.error('❌ ReactFlow download failed:', error);
          alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsDownloading(false);
          
          // Clear timeout since download failed
          if (downloadTimeoutRef.current) {
            clearTimeout(downloadTimeoutRef.current);
            downloadTimeoutRef.current = null;
          }
          return;
        }
        } else {
          console.error('❌ ReactFlow container not found. Available elements:', {
            reactFlowRenderer: document.querySelector('.react-flow__renderer'),
            reactFlow: document.querySelector('.react-flow'),
            familyTreeContainer: document.querySelector('.clean-family-tree-container'),
            allSvgs: document.querySelectorAll('svg').length
          });
          alert('ReactFlow tree not ready for download. Please wait for the tree to load completely.');
          return;
        }
      } else {
        console.error('❌ ReactFlow SVG element not found. Available elements:', {
          reactFlowRenderer: document.querySelector('.react-flow__renderer'),
          reactFlow: document.querySelector('.react-flow'),
          familyTreeContainer: document.querySelector('.clean-family-tree-container'),
          allSvgs: document.querySelectorAll('svg').length
        });
        alert('ReactFlow tree not ready for download. Please wait for the tree to load completely.');
        return;
      }
    }
    
    // For SVG tree view, use the provided svgRef
    if (!svgRef.current) {
      console.error('❌ SVG element not found for download');
      alert('Family tree not ready for download. Please wait for the tree to load.');
      return;
    }

    try {
      setIsDownloading(true);
      console.log('📊 Starting SVG tree download process...');
      console.log('📊 SVG element details:', {
        tagName: svgRef.current.tagName,
        width: svgRef.current.getAttribute('width'),
        height: svgRef.current.getAttribute('height'),
        viewBox: svgRef.current.getAttribute('viewBox'),
        children: svgRef.current.children.length
      });
      
      // Set a timeout to reset downloading state if something goes wrong
      downloadTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Download timeout, resetting state');
        setIsDownloading(false);
      }, 10000); // 10 second timeout
      
      if (format === 'svg') {
        console.log('💾 Downloading SVG format');
        await downloadFamilyTree(svgRef.current, familyName, 'svg');
      } else {
        console.log(`🖼️ Downloading ${format.toUpperCase()} format`);
        // Get optimal dimensions for PNG/JPG
        const dimensions = getOptimalImageDimensions(svgRef.current);
        console.log('📐 Image dimensions:', dimensions);
        await downloadFamilyTree(svgRef.current, familyName, format, dimensions);
      }
      
      console.log('✅ Download completed successfully');
      setIsOpen(false);
      setIsDownloading(false);
      
      // Clear timeout since download completed
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
        downloadTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('❌ Download failed:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsDownloading(false);
      
      // Clear timeout since download failed
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
        downloadTimeoutRef.current = null;
      }
    }
  };


  const handleButtonClick = () => {
    console.log('🖱️ Download button clicked, current state:', { isOpen, isDownloading });
    
    // Don't open dropdown if currently downloading
    if (isDownloading) {
      console.log('🖱️ Download in progress, ignoring click');
      return;
    }
    
    const newState = !isOpen;
    setIsOpen(newState);
    console.log('🖱️ Setting dropdown state to:', newState);
  };

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔄 Dropdown state changed:', { isOpen });
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          isOpen 
            ? 'bg-blue-100 text-blue-700 border-blue-300' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
        }`}
        onClick={handleButtonClick}
        disabled={isDownloading}
        title={`Download family tree ${isOpen ? '(dropdown open)' : ''}`}
      >
        {isDownloading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Download</span>
            <ChevronDown className="h-4 w-4" />
          </>
        )}
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          style={{
            zIndex: 999999
          }}
          onClick={(e) => {
            console.log('📋 Dropdown clicked');
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => handleDownload('png')}
            disabled={isDownloading}
          >
            <Image className="h-4 w-4 mr-3" />
            Download PNG
          </button>
          
          <button
            type="button"
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => handleDownload('jpg')}
            disabled={isDownloading}
          >
            <Image className="h-4 w-4 mr-3" />
            Download JPG
          </button>
          
          <button
            type="button"
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => handleDownload('svg')}
            disabled={isDownloading}
          >
            <FileText className="h-4 w-4 mr-3" />
            Download SVG
          </button>
        </div>
      )}
    </div>
  );
};

export default FamilyTreeDownloadButton;
