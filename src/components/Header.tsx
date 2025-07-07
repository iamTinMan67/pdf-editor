import React from 'react';
import { File, Save, Download, Undo, Redo } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';

const Header: React.FC = () => {
  const { currentDocument, loadDocument, saveDocument, canUndo, canRedo, undo, redo } = useDocumentStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result;
        if (arrayBuffer) {
          loadDocument(file.name, arrayBuffer as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  return (
    <header className="bg-white border-b border-slate-200 py-2 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <File className="h-6 w-6 text-blue-600" />
          <span className="ml-2 font-semibold text-slate-800">PDF Editor</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <label htmlFor="file-upload" className="btn-primary text-sm flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer">
            <span>Open PDF</span>
            <input 
              id="file-upload" 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
          
          <button 
            className={`btn-outline text-sm flex items-center px-3 py-1.5 rounded-md border border-slate-300 ${!currentDocument ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}
            disabled={!currentDocument}
            onClick={() => currentDocument && saveDocument()}
          >
            <Save className="h-4 w-4 mr-1" />
            <span>Save</span>
          </button>
          
          <button 
            className={`btn-outline text-sm flex items-center px-3 py-1.5 rounded-md border border-slate-300 ${!currentDocument ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}
            disabled={!currentDocument}
            onClick={() => currentDocument && saveDocument(true)}
          >
            <Download className="h-4 w-4 mr-1" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          className={`p-1.5 rounded-md ${canUndo ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-400 cursor-not-allowed'}`}
          disabled={!canUndo}
          onClick={() => canUndo && undo()}
        >
          <Undo className="h-5 w-5" />
        </button>
        <button 
          className={`p-1.5 rounded-md ${canRedo ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-400 cursor-not-allowed'}`}
          disabled={!canRedo}
          onClick={() => canRedo && redo()}
        >
          <Redo className="h-5 w-5" />
        </button>
        
        {currentDocument && (
          <span className="text-sm text-slate-500 ml-4">
            {currentDocument.name}
          </span>
        )}
      </div>
    </header>
  );
};

export default Header;