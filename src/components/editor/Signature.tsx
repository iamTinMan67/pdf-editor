import React, { useState } from 'react';
import { Move, X, Maximize2, RotateCw } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { SignatureType } from '../../types/documentTypes';

interface SignatureProps {
  signature: SignatureType;
  editable: boolean;
}

const Signature: React.FC<SignatureProps> = ({ signature, editable }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSkewing, setIsSkewing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [skewStart, setSkewStart] = useState({ rotation: 0, skewX: 0, skewY: 0, x: 0, y: 0 });
  const { updateSignature, removeSignature } = useDocumentStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editable) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - signature.position.x,
      y: e.clientY - signature.position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !editable) return;
    updateSignature({
      ...signature,
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
      width: signature.size.width,
      height: signature.size.height,
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
    
    // For signatures, maintain aspect ratio
    const aspectRatio = resizeStart.width / resizeStart.height;
    let newWidth = resizeStart.width + deltaX;
    let newHeight = newWidth / aspectRatio;
    
    // Enforce minimum size
    newWidth = Math.max(50, newWidth);
    newHeight = Math.max(30, newHeight);
    
    updateSignature({
      ...signature,
      size: {
        width: newWidth,
        height: newHeight
      }
    });
    e.preventDefault();
  };

  const handleSkewStart = (e: React.MouseEvent) => {
    if (!editable || signature.type !== 'text') return;
    setIsSkewing(true);
    setSkewStart({
      rotation: signature.textStyle?.rotation || 0,
      skewX: signature.textStyle?.skewX || 0,
      skewY: signature.textStyle?.skewY || 0,
      x: e.clientX,
      y: e.clientY
    });
    e.stopPropagation();
    e.preventDefault();
  };

  const handleSkewMove = (e: React.MouseEvent) => {
    if (!isSkewing || !editable || signature.type !== 'text') return;
    
    const deltaX = e.clientX - skewStart.x;
    const deltaY = e.clientY - skewStart.y;
    
    // Calculate rotation based on mouse movement
    const rotation = skewStart.rotation + (deltaX * 0.5);
    const skewX = skewStart.skewX + (deltaY * 0.2);
    
    // Constrain values
    const constrainedRotation = Math.max(-45, Math.min(45, rotation));
    const constrainedSkewX = Math.max(-30, Math.min(30, skewX));
    
    updateSignature({
      ...signature,
      textStyle: {
        ...signature.textStyle!,
        rotation: constrainedRotation,
        skewX: constrainedSkewX
      }
    });
    e.preventDefault();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeSignature(signature.id);
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

  // Calculate transform string for text signatures
  const getTextTransform = () => {
    if (signature.type !== 'text' || !signature.textStyle) return '';
    
    const rotation = signature.textStyle.rotation || 0;
    const skewX = signature.textStyle.skewX || 0;
    const skewY = signature.textStyle.skewY || 0;
    
    return `rotate(${rotation}deg) skewX(${skewX}deg) skewY(${skewY}deg)`;
  };
  return (
    <div
      className={`absolute pointer-events-auto ${editable ? 'cursor-move' : ''}`}
      style={{
        left: `${signature.position.x}px`,
        top: `${signature.position.y}px`,
        width: `${signature.size.width}px`,
        height: `${signature.size.height}px`,
        zIndex: isDragging || isResizing || isSkewing ? 100 : 10
      }}
      onMouseDown={handleMouseDown}
    >
      {signature.type === 'drawn' ? (
        <img
          src={signature.dataURL}
          alt="Signature"
          className="w-full h-full object-contain"
        />
      ) : (
        <div
          className="w-full h-full flex items-center"
          style={{
            fontFamily: signature.textStyle?.fontFamily,
            fontSize: `${signature.textStyle?.fontSize}px`,
            color: signature.textStyle?.color,
            fontWeight: signature.textStyle?.bold ? 'bold' : 'normal',
            fontStyle: signature.textStyle?.italic ? 'italic' : 'normal',
            transform: getTextTransform(),
            transformOrigin: 'center center'
          }}
        >
          {signature.text}
        </div>
      )}
      
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
         {signature.type === 'text' && (
           <div 
             className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-md cursor-grab border border-slate-200"
             onMouseDown={handleSkewStart}
             title="Rotate and skew text"
           >
             <RotateCw className="h-3 w-3 text-purple-600" />
           </div>
         )}
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded pointer-events-none"></div>
        </>
      )}
    </div>
  );
};

export default Signature;