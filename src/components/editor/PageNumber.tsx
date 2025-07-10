import React, { useState } from 'react';
import { Move, X, Maximize2 } from 'lucide-react';
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ fontSize: 0, x: 0, y: 0 });
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

  // Determine text alignment
  const textAlign = pageNumber.alignment || 'center';

  return (
    <div
      className={`absolute pointer-events-auto ${editable ? 'cursor-move' : ''}`}
      style={{
        left: `${pageNumber.position.x}px`,
        top: `${pageNumber.position.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: isDragging || isResizing ? 100 : 10,
        textAlign,
        fontSize: `${pageNumber.fontSize || 12}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="px-2 py-1 font-medium">
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
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded pointer-events-none"></div>
        </>
      )}
    </div>
  );
};

export default PageNumber;