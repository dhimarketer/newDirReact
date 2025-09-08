// 2025-01-29: NEW - Download button component for family tree graphics
// 2025-01-29: Provides PNG and SVG download options with format selection
// 2025-01-29: ENHANCED - Added JPG support as third format option

import React, { useState, useRef, useEffect } from 'react';
import { Download, Image, FileText, ChevronDown } from 'lucide-react';
import { downloadFamilyTree, getOptimalImageDimensions } from '../../utils/imageDownloadUtils';

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
        
        // For ReactFlow, try a simple screenshot approach
        console.log('🔄 Using simple screenshot approach for ReactFlow download');
        
        try {
          setIsDownloading(true);
          
          // Set a timeout to reset downloading state if something goes wrong
          downloadTimeoutRef.current = setTimeout(() => {
            console.log('⏰ Download timeout, resetting state');
            setIsDownloading(false);
          }, 10000);
          
          const { default: html2canvas } = await import('html2canvas');
          
          // Find the family tree content area - this should contain everything visible
          let targetElement = document.querySelector('.family-tree-content') as HTMLElement;
          
          if (!targetElement) {
            targetElement = document.querySelector('.clean-family-tree-container') as HTMLElement;
          }
          
          if (!targetElement) {
            targetElement = document.querySelector('.react-flow') as HTMLElement;
          }
          
          if (!targetElement) {
            throw new Error('No family tree content found');
          }
          
          console.log('🎯 Capturing visible family tree content:', {
            className: targetElement.className,
            tagName: targetElement.tagName,
            dimensions: {
              width: targetElement.offsetWidth,
              height: targetElement.offsetHeight,
              scrollWidth: targetElement.scrollWidth,
              scrollHeight: targetElement.scrollHeight
            }
          });
          
          // Simple html2canvas configuration - no complex settings
          const canvas = await html2canvas(targetElement, {
            backgroundColor: '#ffffff',
            scale: 1, // Use 1x scale to avoid issues
            useCORS: true,
            allowTaint: true,
            logging: false,
            removeContainer: false,
            width: targetElement.offsetWidth,
            height: targetElement.offsetHeight
          });
          
          console.log('📊 Canvas created with dimensions:', {
            width: canvas.width,
            height: canvas.height,
            ratio: canvas.width / canvas.height
          });
          
          // Convert canvas to blob and download
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
              
              console.log('✅ ReactFlow simple download completed successfully');
              setIsOpen(false);
              setIsDownloading(false);
              
              // Clear timeout since download completed
              if (downloadTimeoutRef.current) {
                clearTimeout(downloadTimeoutRef.current);
                downloadTimeoutRef.current = null;
              }
            } else {
              throw new Error('Failed to create image from family tree content');
            }
          }, format === 'jpg' ? 'image/jpeg' : 'image/png');
          
          return;
        } catch (error) {
          console.error('❌ ReactFlow simple download failed:', error);
          
          // Try even simpler approach - capture the entire window
          try {
            console.log('🔄 Trying window capture approach');
            const { default: html2canvas } = await import('html2canvas');
            
            // Capture the entire body and crop to family tree area
            const body = document.body;
            const canvas = await html2canvas(body, {
              backgroundColor: '#ffffff',
              scale: 0.5, // Lower scale for performance
              useCORS: true,
              allowTaint: true,
              logging: false,
              removeContainer: false
            });
            
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
                
                console.log('✅ Window capture download completed successfully');
                setIsOpen(false);
                setIsDownloading(false);
                
                if (downloadTimeoutRef.current) {
                  clearTimeout(downloadTimeoutRef.current);
                  downloadTimeoutRef.current = null;
                }
              }
            }, format === 'jpg' ? 'image/jpeg' : 'image/png');
            
            return;
          } catch (windowError) {
            console.error('❌ Window capture also failed:', windowError);
          }
          
          // Fall through to try SVG approach
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
