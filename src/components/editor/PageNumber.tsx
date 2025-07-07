import React, { useState } from 'react';
import { Move, X } from 'lucide-react';
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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

  // Determine text alignment
  const textAlign = pageNumber.alignment || 'center';

  return (
    <div
      className={`absolute pointer-events-auto ${editable ? 'cursor-move' : ''}`}
      style={{
        left: `${pageNumber.position.x}px`,
        top: `${pageNumber.position.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: isDragging ? 100 : 10,
        textAlign
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="px-2 py-1 text-sm font-medium">
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
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded pointer-events-none"></div>
        </>
      )}
    </div>
  );
};

export default PageNumber;