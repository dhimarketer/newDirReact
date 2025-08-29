// 2025-01-29: NEW - Download button component for family tree graphics
// 2025-01-29: Provides PNG and SVG download options with format selection
// 2025-01-29: ENHANCED - Added JPG support as third format option

import React, { useState, useRef } from 'react';
import { Download, Image, FileText, ChevronDown } from 'lucide-react';
import { downloadFamilyTree, getOptimalImageDimensions } from '../../utils/imageDownloadUtils';

interface FamilyTreeDownloadButtonProps {
  svgRef: React.RefObject<SVGSVGElement>;
  familyName: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const FamilyTreeDownloadButton: React.FC<FamilyTreeDownloadButtonProps> = ({
  svgRef,
  familyName,
  className = '',
  variant = 'primary',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg' | 'svg'>('png');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async () => {
    if (!svgRef.current) {
      console.error('SVG element not found');
      return;
    }

    try {
      setIsDownloading(true);
      
      if (downloadFormat === 'svg') {
        await downloadFamilyTree(svgRef.current, familyName, 'svg');
      } else {
        // Get optimal dimensions for PNG/JPG
        const dimensions = getOptimalImageDimensions(svgRef.current);
        await downloadFamilyTree(svgRef.current, familyName, downloadFormat, dimensions);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Download failed:', error);
      // You could add toast notification here if you have a toast system
    } finally {
      setIsDownloading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'download-btn';
    
    const variantClasses = {
      primary: 'download-btn-primary',
      secondary: 'download-btn-secondary',
      outline: 'download-btn-outline'
    };
    
    const sizeClasses = {
      sm: 'download-btn-sm',
      md: 'download-btn-md',
      lg: 'download-btn-lg'
    };
    
    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  };

  const getDropdownClasses = () => {
    const baseClasses = 'download-dropdown';
    return isOpen ? `${baseClasses} download-dropdown-open` : `${baseClasses} download-dropdown-closed`;
  };

  const getFormatIcon = (format: 'png' | 'jpg' | 'svg') => {
    switch (format) {
      case 'png':
      case 'jpg':
        return <Image className="h-3 w-3" />;
      case 'svg':
        return <FileText className="h-3 w-3" />;
      default:
        return <Image className="h-3 w-3" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        className={getButtonClasses()}
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Downloading...
          </>
        ) : (
          <>
            <Download className="h-3 w-3" />
            Download
          </>
        )}
      </button>

      <button
        type="button"
        className="download-format-toggle"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDownloading}
        title="Select download format"
      >
        <ChevronDown className="h-3 w-3" />
      </button>

      <div className={getDropdownClasses()}>
        <div className="py-1">
          <button
            type="button"
            className={`download-dropdown-option ${downloadFormat === 'png' ? 'download-dropdown-option-active' : ''}`}
            onClick={() => setDownloadFormat('png')}
          >
            <Image className="h-3 w-3" />
            PNG
          </button>
          
          <button
            type="button"
            className={`download-dropdown-option ${downloadFormat === 'jpg' ? 'download-dropdown-option-active' : ''}`}
            onClick={() => setDownloadFormat('jpg')}
          >
            <Image className="h-3 w-3" />
            JPG
          </button>
          
          <button
            type="button"
            className={`download-dropdown-option ${downloadFormat === 'svg' ? 'download-dropdown-option-active' : ''}`}
            onClick={() => setDownloadFormat('svg')}
          >
            <FileText className="h-3 w-3" />
            SVG
          </button>
          
          <div className="download-dropdown-divider">
            {/* Removed duplicate download button - main button already handles download functionality */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTreeDownloadButton;
