import React, { useState, useRef, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DraggableElementProps {
  children: React.ReactNode;
  initialPosition?: Position;
  onPositionChange?: (position: Position) => void;
  className?: string;
}

const DraggableElement: React.FC<DraggableElementProps> = ({
  children,
  initialPosition = { x: 0, y: 0 },
  onPositionChange,
  className = '',
}) => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(position);
    }
  }, [position, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newPosition = {
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    };

    setPosition(newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={elementRef}
      className={`absolute cursor-move ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
};

export default DraggableElement;