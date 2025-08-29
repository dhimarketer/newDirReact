// 2025-01-29: NEW - Utility functions for downloading family tree graphics as images
// 2025-01-29: Supports SVG to PNG conversion and direct download functionality
// 2025-01-29: FIXED - PNG background issue by adding white background to canvas
// 2025-01-29: ENHANCED - Added JPG support as additional format option

/**
 * Converts an SVG element to a downloadable PNG image with white background
 * @param svgElement - The SVG element to convert
 * @param filename - The filename for the downloaded image
 * @param width - Optional width for the output image
 * @param height - Optional height for the output image
 */
export const downloadSVGAsPNG = async (
  svgElement: SVGSVGElement,
  filename: string,
  width?: number,
  height?: number
): Promise<void> => {
  try {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const svgWidth = width || svgRect.width;
    const svgHeight = height || svgRect.height;

    // Set canvas dimensions
    canvas.width = svgWidth;
    canvas.height = svgHeight;

    // Fill canvas with white background to prevent transparent PNG issues
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, svgWidth, svgHeight);

    // Create a new SVG string with proper dimensions
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create an image element
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Draw the SVG image onto the canvas (over the white background)
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
          
          // Convert canvas to blob and download
          canvas.toBlob((blob) => {
            if (blob) {
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `${filename}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Clean up
              URL.revokeObjectURL(downloadUrl);
              URL.revokeObjectURL(url);
              resolve();
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/png');
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG image'));
      };
      
      img.src = url;
    });
  } catch (error) {
    console.error('Error downloading SVG as PNG:', error);
    throw error;
  }
};

/**
 * Converts an SVG element to a downloadable JPG image with white background
 * @param svgElement - The SVG element to convert
 * @param filename - The filename for the downloaded image
 * @param width - Optional width for the output image
 * @param height - Optional height for the output image
 * @param quality - JPG quality (0.1 to 1.0, default 0.9)
 */
export const downloadSVGAsJPG = async (
  svgElement: SVGSVGElement,
  filename: string,
  width?: number,
  height?: number,
  quality: number = 0.9
): Promise<void> => {
  try {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const svgWidth = width || svgRect.width;
    const svgHeight = height || svgRect.height;

    // Set canvas dimensions
    canvas.width = svgWidth;
    canvas.height = svgHeight;

    // Fill canvas with white background to prevent transparent JPG issues
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, svgWidth, svgHeight);

    // Create a new SVG string with proper dimensions
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create an image element
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Draw the SVG image onto the canvas (over the white background)
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
          
          // Convert canvas to blob and download as JPG
          canvas.toBlob((blob) => {
            if (blob) {
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `${filename}.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Clean up
              URL.revokeObjectURL(downloadUrl);
              URL.revokeObjectURL(url);
              resolve();
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/jpeg', quality);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG image'));
      };
      
      img.src = url;
    });
  } catch (error) {
    console.error('Error downloading SVG as JPG:', error);
    throw error;
  }
};

/**
 * Downloads an SVG element directly as an SVG file
 * @param svgElement - The SVG element to download
 * @param filename - The filename for the downloaded SVG
 */
export const downloadSVGDirectly = (svgElement: SVGSVGElement, filename: string): void => {
  try {
    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(svgElement);
    
    // Create blob and download
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading SVG directly:', error);
    throw error;
  }
};

/**
 * Downloads a family tree as an image with multiple format options
 * @param svgElement - The SVG element containing the family tree
 * @param familyName - The name of the family for the filename
 * @param format - The desired image format ('png', 'jpg', or 'svg')
 * @param dimensions - Optional custom dimensions
 * @param quality - JPG quality (0.1 to 1.0, only used for JPG format)
 */
export const downloadFamilyTree = async (
  svgElement: SVGSVGElement,
  familyName: string,
  format: 'png' | 'jpg' | 'svg' = 'png',
  dimensions?: { width: number; height: number },
  quality: number = 0.9
): Promise<void> => {
  try {
    // Sanitize filename
    const sanitizedName = familyName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    
    if (format === 'svg') {
      downloadSVGDirectly(svgElement, `family_tree_${sanitizedName}`);
    } else if (format === 'jpg') {
      await downloadSVGAsJPG(
        svgElement, 
        `family_tree_${sanitizedName}`,
        dimensions?.width,
        dimensions?.height,
        quality
      );
    } else {
      await downloadSVGAsPNG(
        svgElement, 
        `family_tree_${sanitizedName}`,
        dimensions?.width,
        dimensions?.height
      );
    }
  } catch (error) {
    console.error('Error downloading family tree:', error);
    throw error;
  }
};

/**
 * Gets the optimal dimensions for a family tree image based on content
 * @param svgElement - The SVG element to analyze
 * @returns Object with recommended width and height
 */
export const getOptimalImageDimensions = (svgElement: SVGSVGElement): { width: number; height: number } => {
  const svgRect = svgElement.getBoundingClientRect();
  const viewBox = svgElement.viewBox.baseVal;
  
  // Use viewBox if available, otherwise use bounding rect
  const contentWidth = viewBox.width || svgRect.width;
  const contentHeight = viewBox.height || svgRect.height;
  
  // Calculate optimal dimensions with some padding
  const padding = 40;
  const optimalWidth = Math.max(contentWidth + padding, 800);
  const optimalHeight = Math.max(contentHeight + padding, 600);
  
  return {
    width: Math.round(optimalWidth),
    height: Math.round(optimalHeight)
  };
};
