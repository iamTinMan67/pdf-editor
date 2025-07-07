import React, { useState } from 'react';
import { Plus, AlignLeft, AlignCenter, AlignRight, Hash } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';

type PageNumberFormat = 'numeric' | 'page-of-total' | 'custom';
type PageNumberPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

const PageNumberPanel: React.FC = () => {
  const [format, setFormat] = useState<PageNumberFormat>('numeric');
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [customFormat, setCustomFormat] = useState<string>('Page {page}');
  const [startingNumber, setStartingNumber] = useState<number>(1);
  
  const { addPageNumber } = useDocumentStore();

  const handleAddPageNumbers = () => {
    let template = '';
    
    switch (format) {
      case 'numeric':
        template = '{page}';
        break;
      case 'page-of-total':
        template = 'Page {page} of {total}';
        break;
      case 'custom':
        template = customFormat;
        break;
    }
    
    // Convert position to x, y coordinates (percentages)
    let x = 50;
    let y = 95;
    
    switch (position) {
      case 'top-left':
        x = 5;
        y = 5;
        break;
      case 'top-center':
        x = 50;
        y = 5;
        break;
      case 'top-right':
        x = 95;
        y = 5;
        break;
      case 'bottom-left':
        x = 5;
        y = 95;
        break;
      case 'bottom-center':
        x = 50;
        y = 95;
        break;
      case 'bottom-right':
        x = 95;
        y = 95;
        break;
    }
    
    addPageNumber({
      id: `pagenum-${Date.now()}`,
      template,
      page: 1, // This will be applied to all pages
      position: { x, y },
      startingNumber,
      alignment: position.includes('left') ? 'left' : position.includes('right') ? 'right' : 'center'
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
        <select 
          value={format}
          onChange={(e) => setFormat(e.target.value as PageNumberFormat)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="numeric">Number only (1, 2, 3)</option>
          <option value="page-of-total">Page X of Y</option>
          <option value="custom">Custom format</option>
        </select>
      </div>
      
      {format === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Custom Format</label>
          <input 
            type="text" 
            value={customFormat}
            onChange={(e) => setCustomFormat(e.target.value)}
            placeholder="e.g. Page {page} of {total}"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">
            Use {'{page}'} for page number and {'{total}'} for total pages
          </p>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          {[
            { pos: 'top-left', icon: <AlignLeft className="h-4 w-4" /> },
            { pos: 'top-center', icon: <AlignCenter className="h-4 w-4" /> },
            { pos: 'top-right', icon: <AlignRight className="h-4 w-4" /> },
            { pos: 'bottom-left', icon: <AlignLeft className="h-4 w-4" /> },
            { pos: 'bottom-center', icon: <AlignCenter className="h-4 w-4" /> },
            { pos: 'bottom-right', icon: <AlignRight className="h-4 w-4" /> },
          ].map((item) => (
            <button
              key={item.pos}
              className={`border ${position === item.pos ? 'border-blue-500 bg-blue-50' : 'border-slate-200'} rounded-md p-2 flex items-center justify-center`}
              onClick={() => setPosition(item.pos as PageNumberPosition)}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Starting Number</label>
        <input 
          type="number" 
          min="1"
          value={startingNumber}
          onChange={(e) => setStartingNumber(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>
      
      <button
        onClick={handleAddPageNumbers}
        className="w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Page Numbers
      </button>
    </div>
  );
};

export default PageNumberPanel;