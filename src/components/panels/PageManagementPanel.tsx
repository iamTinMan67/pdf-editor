import React, { useState } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { Plus, Trash2, ChevronLeft, ChevronRight, Check, Square } from 'lucide-react';

export const PageManagementPanel: React.FC = () => {
  const { 
    document, 
    currentPage, 
    setCurrentPage, 
    addPage, 
    deletePage, 
    addMultiplePages,
    deleteMultiplePages 
  } = useDocumentStore();
  
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isAddingPages, setIsAddingPages] = useState(false);

  if (!document) return null;

  const totalPages = document.numPages;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handlePageSelect = (pageNum: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }
    setSelectedPages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPages.size === totalPages) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages));
    }
  };

  const handleAddMultiplePages = async () => {
    const count = prompt('How many pages would you like to add? (1-50)');
    if (count === null) return; // User cancelled
    
    const numPages = parseInt(count);
    if (isNaN(numPages) || numPages < 1 || numPages > 50) {
      alert('Please enter a valid number between 1 and 50');
      return;
    }

    setIsAddingPages(true);
    try {
      await addMultiplePages(numPages, currentPage);
    } catch (error) {
      console.error('Error adding pages:', error);
      alert('Failed to add pages. Please try again.');
    } finally {
      setIsAddingPages(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPages.size === 0) return;
    if (selectedPages.size === totalPages) {
      alert('Cannot delete all pages. At least one page must remain.');
      return;
    }

    const pageList = Array.from(selectedPages).sort((a, b) => a - b);
    const confirmed = confirm(`Are you sure you want to delete ${pageList.length} page(s)?`);
    
    if (confirmed) {
      try {
        await deleteMultiplePages(pageList);
        setSelectedPages(new Set());
      } catch (error) {
        console.error('Error deleting pages:', error);
        alert('Failed to delete pages. Please try again.');
      }
    }
  };

  const handleSinglePageDelete = async (pageNum: number) => {
    if (totalPages === 1) {
      alert('Cannot delete the last remaining page.');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete page ${pageNum}?`);
    if (confirmed) {
      try {
        await deletePage(pageNum);
      } catch (error) {
        console.error('Error deleting page:', error);
        alert('Failed to delete page. Please try again.');
      }
    }
  };

  return (
    <div className="p-4 bg-white border-l border-gray-200 w-80 h-full overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Page Management</h3>
      
      {/* Add Pages Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Add Pages</h4>
        <div className="flex gap-2">
          <button
            onClick={() => addPage(currentPage)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Page
          </button>
          <button
            onClick={handleAddMultiplePages}
            disabled={isAddingPages}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isAddingPages ? 'Adding...' : 'Add Multiple'}
          </button>
        </div>
      </div>

      {/* Bulk Actions Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Bulk Actions</h4>
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            {selectedPages.size === totalPages ? (
              <>
                <Square className="w-4 h-4" />
                Deselect All
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Select All
              </>
            )}
          </button>
          {selectedPages.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedPages.size})
            </button>
          )}
        </div>
      </div>

      {/* Pages List */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Pages ({totalPages})</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {pages.map((pageNum) => (
            <div
              key={pageNum}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                currentPage === pageNum
                  ? 'border-blue-500 bg-blue-50'
                  : selectedPages.has(pageNum)
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedPages.has(pageNum)}
                  onChange={() => handlePageSelect(pageNum)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Page {pageNum}
                </span>
                {currentPage === pageNum && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                    Current
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(pageNum)}
                  className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Go to page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSinglePageDelete(pageNum)}
                  className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                  title="Delete page"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        
        <span className="text-sm text-gray-600">
          {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};