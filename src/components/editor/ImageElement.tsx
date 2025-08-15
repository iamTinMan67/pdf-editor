import React, { useState } from 'react';
import { Move, X, Maximize2 } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { ImageType } from '../../types/documentTypes';

interface ImageElementProps {
  image: ImageType;
  editable: boolean;
}

const ImageElement: React.FC<ImageElementProps> = ({ image, editable }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const { updateImage, removeImage } = useDocumentStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editable) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - image.position.x,
      y: e.clientY - image.position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !editable) return;
    updateImage({
      ...image,
      position: {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }
    });
    e.preventDefault();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!editable) return;
    setIsResizing(true);
    setResizeStart({
      width: image.size.width,
      height: image.size.height,
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
    
    // Keep aspect ratio
    const aspectRatio = resizeStart.width / resizeStart.height;
    let newWidth = resizeStart.width + deltaX;
    let newHeight = newWidth / aspectRatio;
    
    // Enforce minimum size
    newWidth = Math.max(50, newWidth);
    newHeight = Math.max(50, newHeight);
    
    updateImage({
      ...image,
      size: {
        width: newWidth,
        height: newHeight
      }
    });
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeImage(image.id);
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

  return (
    <div
      className={`absolute pointer-events-auto ${editable ? 'cursor-move' : ''}`}
      style={{
        left: `${image.position.x}px`,
        top: `${image.position.y}px`,
        width: `${image.size.width}px`,
        height: `${image.size.height}px`,
        zIndex: isDragging || isResizing ? 100 : 10
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={image.dataURL}
        alt={image.originalName || 'Image'}
        className="w-full h-full object-contain"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
      />
      
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

export default ImageElement;