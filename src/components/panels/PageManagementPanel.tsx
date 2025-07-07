import React from 'react';
import { Trash2, Plus, MoveVertical } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';

const PageManagementPanel: React.FC = () => {
  const { 
    currentDocument, 
    totalPages, 
    currentPage, 
    setCurrentPage,
    deletePage,
    addPage,
    reorderPages
  } = useDocumentStore();

  // Create an array of page indexes for rendering
  const pageIndexes = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  const handleDeletePage = (pageIndex: number) => {
    if (window.confirm(`Are you sure you want to delete page ${pageIndex}?`)) {
      deletePage(pageIndex);
    }
  };
  
  const handleAddBlankPage = () => {
    // Add a blank page after the current page
    addPage(currentPage);
  };
  
  const handleReorderPage = (pageIndex: number, direction: 'up' | 'down') => {
    if (direction === 'up' && pageIndex > 1) {
      reorderPages(pageIndex, pageIndex - 1);
    } else if (direction === 'down' && pageIndex < totalPages) {
      reorderPages(pageIndex, pageIndex + 1);
    }
  };

  if (!currentDocument) {
    return (
      <div className="text-sm text-slate-600">
        Please open a PDF document to manage pages.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="text-sm text-slate-600 mb-2">
        Add, delete, or reorder pages in your document.
      </div>
      
      <button
        onClick={handleAddBlankPage}
        className="w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center mb-4"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Blank Page
      </button>
      
      <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
        {pageIndexes.map((pageIndex) => (
          <div 
            key={pageIndex}
            className={`border rounded-md p-2 flex items-center justify-between ${pageIndex === currentPage ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
          >
            <button
              className="flex-1 h-full flex items-center justify-start px-2"
              onClick={() => setCurrentPage(pageIndex)}
            >
              <span className="text-sm font-medium">Page {pageIndex}</span>
            </button>
            
            <div className="flex items-center space-x-1">
              <button
                className={`p-1 rounded-md ${pageIndex <= 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => handleReorderPage(pageIndex, 'up')}
                disabled={pageIndex <= 1}
                title="Move Up"
              >
                <MoveVertical className="h-4 w-4 transform rotate-180" />
              </button>
              
              <button
                className={`p-1 rounded-md ${pageIndex >= totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => handleReorderPage(pageIndex, 'down')}
                disabled={pageIndex >= totalPages}
                title="Move Down"
              >
                <MoveVertical className="h-4 w-4" />
              </button>
              
              <button
                className="p-1 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => handleDeletePage(pageIndex)}
                title="Delete Page"
                disabled={totalPages <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {totalPages <= 1 && (
        <p className="text-xs text-slate-500 italic">
          You cannot delete the only page in the document.
        </p>
      )}
    </div>
  );
};

export default PageManagementPanel;