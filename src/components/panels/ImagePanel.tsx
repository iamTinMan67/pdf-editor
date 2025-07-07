import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';

const ImagePanel: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const { addImage, images, removeImage, currentPage } = useDocumentStore();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    [...files].forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === 'string') {
            addImage({
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              dataURL: event.target.result,
              page: currentPage,
              position: { x: 100, y: 100 },
              size: { width: 200, height: 200 },
              originalName: file.name
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="text-sm text-slate-600 mb-2">
        Add images to your document by uploading or dragging and dropping.
      </div>
      
      <div 
        className={`border-2 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-dashed border-slate-300'} rounded-md p-4 h-32 flex flex-col items-center justify-center transition-colors`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <ImageIcon className={`h-8 w-8 ${dragActive ? 'text-blue-500' : 'text-slate-400'} mb-2`} />
        <p className="text-sm text-center text-slate-500">
          Drag and drop image here or
        </p>
        <label className="mt-2 cursor-pointer">
          <span className="text-sm text-blue-600 hover:text-blue-800">Browse files</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
            multiple
          />
        </label>
      </div>
      
      {images.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Added Images</h3>
          <div className="grid grid-cols-2 gap-2">
            {images.map((img) => (
              <div 
                key={img.id}
                className="relative border border-slate-200 rounded-md p-2 bg-white"
              >
                <img 
                  src={img.dataURL} 
                  alt={img.originalName || 'Image'} 
                  className="h-16 w-full object-contain"
                />
                <button 
                  className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm hover:bg-red-50 text-slate-400 hover:text-red-500"
                  onClick={() => removeImage(img.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="text-xs text-slate-500 truncate mt-1">
                  {img.originalName || 'Image'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePanel;