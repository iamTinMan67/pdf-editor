import React from 'react';
import { Trash2, Plus, MoveVertical, Square, CheckSquare } from 'lucide-react';
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

  const [selectedPages, setSelectedPages] = React.useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = React.useState(false);

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
  
  const handleAddMultiplePages = () => {
    const count = parseInt(prompt('How many pages would you like to add?') || '1');
    if (count > 0 && count <= 50) {
      for (let i = 0; i < count; i++) {
        addPage(currentPage + i);
      }
    }
  };

  const handleSelectPage = (pageIndex: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageIndex)) {
      newSelected.delete(pageIndex);
    } else {
      newSelected.add(pageIndex);
    }
    setSelectedPages(newSelected);
    setSelectAll(newSelected.size === totalPages);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPages(new Set());
      setSelectAll(false);
    } else {
      setSelectedPages(new Set(pageIndexes));
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedPages.size === 0) return;
    
    const pageList = Array.from(selectedPages).sort((a, b) => b - a); // Delete from highest to lowest
    const confirmMessage = `Are you sure you want to delete ${pageList.length} page${pageList.length > 1 ? 's' : ''}?`;
    
    if (window.confirm(confirmMessage)) {
      pageList.forEach(pageIndex => {
        deletePage(pageIndex);
      });
      setSelectedPages(new Set());
      setSelectAll(false);
    }
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
      
      <div className="space-y-2 mb-4">
        <button
          onClick={handleAddBlankPage}
          className="w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Single Page
        </button>
        
        <button
          onClick={handleAddMultiplePages}
          className="w-full py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Multiple Pages
        </button>
      </div>

      {totalPages > 1 && (
        <div className="border-t pt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center text-sm text-slate-600 hover:text-slate-800"
            >
              {selectAll ? (
                <CheckSquare className="h-4 w-4 mr-1" />
              ) : (
                <Square className="h-4 w-4 mr-1" />
              )}
              {selectAll ? 'Deselect All' : 'Select All'}
            </button>
            
            {selectedPages.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center text-sm"
                disabled={selectedPages.size >= totalPages}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Selected ({selectedPages.size})
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
        {pageIndexes.map((pageIndex) => (
          <div 
            key={pageIndex}
            className={`border rounded-md p-2 flex items-center justify-between ${
              pageIndex === currentPage ? 'border-blue-500 bg-blue-50' : 
              selectedPages.has(pageIndex) ? 'border-orange-400 bg-orange-50' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center flex-1">
              {totalPages > 1 && (
                <button
                  onClick={() => handleSelectPage(pageIndex)}
                  className="mr-2 p-1"
                >
                  {selectedPages.has(pageIndex) ? (
                    <CheckSquare className="h-4 w-4 text-orange-600" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              )}
              
              <button
                className="flex-1 h-full flex items-center justify-start px-2"
                onClick={() => setCurrentPage(pageIndex)}
              >
                <span className="text-sm font-medium">Page {pageIndex}</span>
              </button>
            </div>
            
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
      
      {selectedPages.size >= totalPages && totalPages > 1 && (
        <p className="text-xs text-red-500 italic">
          You cannot delete all pages. At least one page must remain.
        </p>
      )}
    </div>
  );
};

export default PageManagementPanel;