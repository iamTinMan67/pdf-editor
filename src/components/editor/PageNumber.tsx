import React, { useState } from 'react';
import { Move, X, Maximize2, RotateCw } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { PageNumberType } from '../../types/documentTypes';

interface PageNumberProps {
  pageNumber: PageNumberType;
  currentPage: number;
  totalPages: number;
  editable: boolean;
}

const PageNumber: React.FC<PageNumberProps> = ({ 
  pageNumber, 
  currentPage, 
  totalPages, 
  editable 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSkewing, setIsSkewing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ fontSize: 0, x: 0, y: 0 });
  const [skewStart, setSkewStart] = useState({ rotation: 0, skewX: 0, skewY: 0, x: 0, y: 0 });
  const { updatePageNumber, removePageNumber } = useDocumentStore();

  // Calculate the actual page number based on starting number
  const calculatedPageNumber = currentPage + (pageNumber.startingNumber - 1);

  // Format the page number display based on the template
  const formattedPageNumber = pageNumber.template
    .replace('{page}', calculatedPageNumber.toString())
    .replace('{total}', totalPages.toString());

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editable) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pageNumber.position.x,
      y: e.clientY - pageNumber.position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !editable) return;
    updatePageNumber({
      ...pageNumber,
      position: {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }
    });
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsSkewing(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!editable) return;
    setIsResizing(true);
    setResizeStart({
      fontSize: pageNumber.fontSize || 12,
      x: e.clientX,
      y: e.clientY
    });
    e.stopPropagation();
    e.preventDefault();
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!isResizing || !editable) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    // Use the larger delta for font size change
    const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    let newFontSize = resizeStart.fontSize + (delta * 0.1);
    
    // Enforce minimum and maximum font size
    newFontSize = Math.max(8, Math.min(72, newFontSize));
    
    updatePageNumber({
      ...pageNumber,
      fontSize: newFontSize
    });
    e.preventDefault();
  };

  const handleSkewStart = (e: React.MouseEvent) => {
    if (!editable) return;
    setIsSkewing(true);
    setSkewStart({
      rotation: pageNumber.rotation || 0,
      skewX: pageNumber.skewX || 0,
      skewY: pageNumber.skewY || 0,
      x: e.clientX,
      y: e.clientY
    });
    e.stopPropagation();
    e.preventDefault();
  };

  const handleSkewMove = (e: React.MouseEvent) => {
    if (!isSkewing || !editable) return;
    
    const deltaX = e.clientX - skewStart.x;
    const deltaY = e.clientY - skewStart.y;
    
    // Calculate rotation and skew based on mouse movement
    const rotation = skewStart.rotation + (deltaX * 0.5);
    const skewX = skewStart.skewX + (deltaY * 0.2);
    
    // Constrain values
    const constrainedRotation = Math.max(-45, Math.min(45, rotation));
    const constrainedSkewX = Math.max(-30, Math.min(30, skewX));
    
    updatePageNumber({
      ...pageNumber,
      rotation: constrainedRotation,
      skewX: constrainedSkewX
    });
    e.preventDefault();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removePageNumber(pageNumber.id);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  React.useEffect(() => {
    if (isSkewing) {
      document.addEventListener('mousemove', handleSkewMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleSkewMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSkewing]);

  // Calculate transform string
  const getTransform = () => {
    const rotation = pageNumber.rotation || 0;
    const skewX = pageNumber.skewX || 0;
    const skewY = pageNumber.skewY || 0;
    
    return `translate(-50%, -50%) rotate(${rotation}deg) skewX(${skewX}deg) skewY(${skewY}deg)`;
  };
  // Determine text alignment
  const textAlign = pageNumber.alignment || 'center';

  return (
    <div
      className={`absolute pointer-events-auto ${editable ? 'cursor-move' : ''}`}
      style={{
        left: `${pageNumber.position.x}px`,
        top: `${pageNumber.position.y}px`,
        zIndex: isDragging || isResizing || isSkewing ? 100 : 10,
        minWidth: '60px',
        minHeight: '30px'
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="px-2 py-1 font-medium inline-block"
        style={{
          transform: getTransform(),
          transformOrigin: 'center center',
          textAlign,
          fontSize: `${pageNumber.fontSize || 12}px`
        }}
      >
        {formattedPageNumber}
      </div>
      
      {editable && (
        <>
          <div className="absolute -top-3 -left-3 bg-white rounded-full p-1 shadow-md cursor-move border border-slate-200">
            <Move className="h-3 w-3 text-blue-600" />
          </div>
          <button
            className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md hover:bg-red-50 border border-slate-200"
            onClick={handleDelete}
          >
            <X className="h-3 w-3 text-red-600" />
          </button>
          <div 
            className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-se-resize border border-slate-200"
            onMouseDown={handleResizeStart}
          >
            <Maximize2 className="h-3 w-3 text-blue-600" />
          </div>
          <div 
            className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-md cursor-grab border border-slate-200"
            onMouseDown={handleSkewStart}
            title="Rotate and skew text"
          >
            <RotateCw className="h-3 w-3 text-purple-600" />
          </div>
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded pointer-events-none"></div>
        </>
      )}
    </div>
  );
};

export default PageNumber;