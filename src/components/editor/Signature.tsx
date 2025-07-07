import React, { useState } from 'react';
import { Move, X } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { SignatureType } from '../../types/documentTypes';

interface SignatureProps {
  signature: SignatureType;
  editable: boolean;
}

const Signature: React.FC<SignatureProps> = ({ signature, editable }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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

  return (
    <div
      className={`absolute pointer-events-auto ${editable ? 'cursor-move' : ''}`}
      style={{
        left: `${signature.position.x}px`,
        top: `${signature.position.y}px`,
        width: `${signature.size.width}px`,
        height: `${signature.size.height}px`,
        zIndex: isDragging ? 100 : 10
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
            fontStyle: signature.textStyle?.italic ? 'italic' : 'normal'
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
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded pointer-events-none"></div>
        </>
      )}
    </div>
  );
};

export default Signature;