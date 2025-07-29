import React, { useState } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { Plus, Trash2, ChevronLeft, ChevronRight, Check, Square, FileText, Upload, FileX } from 'lucide-react';

export const PageManagementPanel: React.FC = () => {
  const { 
    currentDocument,
    totalPages,
    currentPage, 
    setCurrentPage, 
    addPage,
    deletePage
  } = useDocumentStore();
  
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isAddingPages, setIsAddingPages] = useState(false);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [addPageType, setAddPageType] = useState<'blank' | 'import'>('blank');

  if (!currentDocument) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FileText className="h-12 w-12 text-slate-400 mb-4" />
        <p className="text-slate-500">No document loaded</p>
        <p className="text-sm text-slate-400">Open a PDF to manage pages</p>
      </div>
    );
  }

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

  const handleAddSinglePage = () => {
    setShowAddPageModal(true);
  };

  const handleAddMultipleBlankPages = async () => {
    const count = prompt('How many pages would you like to add after the current page? (1-50)');
    if (count === null || count.trim() === '') return;
    
    const numPages = parseInt(count);
    if (isNaN(numPages) || numPages < 1 || numPages > 50) {
      alert('Please enter a valid number between 1 and 50');
      return;
    }

    setIsAddingPages(true);
    try {
      for (let i = 0; i < numPages; i++) {
        console.log(`Adding page ${i + 1} of ${numPages}`);
        const currentState = useDocumentStore.getState();
        await addPage(currentState.currentPage + i);
        // Longer delay for larger batches to prevent overwhelming the system
        if (numPages > 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      console.log('Successfully added all pages');
    } catch (error) {
      console.error('Error adding pages:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to add pages: ${errorMessage}. Please try again.`);
    } finally {
      setIsAddingPages(false);
    }
  };

  const handleAddPageConfirm = async () => {
    if (addPageType === 'blank') {
      await addPage(currentPage);
      setShowAddPageModal(false);
    } else {
      // Trigger file input for PDF import
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf';
      fileInput.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            await addPagesFromPDF(arrayBuffer, currentPage);
            setShowAddPageModal(false);
          } catch (error) {
            console.error('Error importing PDF:', error);
            alert('Failed to import PDF. Please try again.');
          }
        }
      };
      fileInput.click();
    }
  };

  const { addPagesFromPDF } = useDocumentStore();

  const handleDeleteSelected = async () => {
    if (selectedPages.size === 0) return;
    if (selectedPages.size === totalPages) {
      alert('Cannot delete all pages. At least one page must remain.');
      return;
    }

    const pageList = Array.from(selectedPages).sort((a, b) => b - a); // Delete from highest to lowest
    const confirmed = confirm(`Are you sure you want to delete ${pageList.length} page(s)?`);
    
    if (confirmed) {
      try {
        for (const pageNum of pageList) {
          await deletePage(pageNum);
        }
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
    <div className="flex flex-col space-y-4">
      <div className="text-sm text-slate-600 mb-2">
        Manage pages in your document. Add new pages or delete existing ones.
      </div>
      
      {/* Add Pages Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Add Pages</h4>
        <div className="flex gap-2">
          <button
            onClick={handleAddSinglePage}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add 1 Page
          </button>
        </div>
        <div>
          <button
            onClick={handleAddMultipleBlankPages}
            disabled={isAddingPages}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isAddingPages ? 'Adding...' : 'Add Multiple Blank'}
          </button>
        </div>
      </div>

      {/* Bulk Actions Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Bulk Actions</h4>
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm"
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
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedPages.size})
            </button>
          )}
        </div>
      </div>

      {/* Pages List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Pages ({totalPages})</h4>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {totalPages > 50 && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              ⚠️ Large document ({totalPages} pages). Operations may take longer.
            </div>
          )}
          {pages.map((pageNum) => (
            <div
              key={pageNum}
              className={`flex items-center justify-between p-2 rounded-md border transition-all ${
                currentPage === pageNum
                  ? 'border-blue-400 bg-blue-50'
                  : selectedPages.has(pageNum)
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPages.has(pageNum)}
                  onChange={() => handlePageSelect(pageNum)}
                  className="w-3 h-3 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Page {pageNum}
                </span>
                {currentPage === pageNum && (
                  <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                    Current
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(pageNum)}
                  className="p-1 text-slate-600 hover:text-blue-600 transition-colors"
                  title="Go to page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSinglePageDelete(pageNum)}
                  className="p-1 text-slate-600 hover:text-red-600 transition-colors"
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
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-2 py-1 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        
        <span className="text-sm text-slate-600">
          {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-2 py-1 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Add Page Modal */}
      {showAddPageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Page</h3>
            <p className="text-sm text-slate-600 mb-4">
              Choose how you want to add a new page after page {currentPage}:
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="addPageType"
                  value="blank"
                  checked={addPageType === 'blank'}
                  onChange={(e) => setAddPageType(e.target.value as 'blank' | 'import')}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <FileX className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="font-medium text-slate-700">Blank Page</div>
                    <div className="text-sm text-slate-500">Add an empty page</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="addPageType"
                  value="import"
                  checked={addPageType === 'import'}
                  onChange={(e) => setAddPageType(e.target.value as 'blank' | 'import')}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="font-medium text-slate-700">Import from PDF</div>
                    <div className="text-sm text-slate-500">Merge pages from another PDF</div>
                  </div>
                </div>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddPageModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPageConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {addPageType === 'blank' ? 'Add Blank Page' : 'Select PDF File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};