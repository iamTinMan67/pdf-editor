import { create } from 'zustand';
import { showToast } from '../components/ui/Toaster';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  DocumentState, 
  SignatureType, 
  ImageType, 
  PageNumberType 
} from '../types/documentTypes';

interface DocumentStoreState {
  currentDocument: { name: string; file: ArrayBuffer } | null;
  signatures: SignatureType[];
  images: ImageType[];
  pageNumbers: PageNumberType[];
  history: DocumentState[];
  currentHistoryIndex: number;
  totalPages: number;
  currentPage: number;
  documentKey: number;
}

interface DocumentStoreActions {
  loadDocument: (name: string, file: ArrayBuffer) => void;
  saveDocument: (asDownload?: boolean) => Promise<void>;
  addSignature: (signature: SignatureType) => void;
  updateSignature: (signature: SignatureType) => void;
  removeSignature: (id: string) => void;
  addImage: (image: ImageType) => void;
  updateImage: (image: ImageType) => void;
  removeImage: (id: string) => void;
  addPageNumber: (pageNumber: PageNumberType) => void;
  updatePageNumber: (pageNumber: PageNumberType) => void;
  removePageNumber: (id: string) => void;
  deletePage: (pageIndex: number) => Promise<void>;
  addPage: (afterPageIndex: number) => Promise<void>;
  addPagesFromPDF: (pdfBuffer: ArrayBuffer, afterPageIndex: number) => Promise<void>;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Helper to create a snapshot of the current state
const createStateSnapshot = (state: DocumentStoreState): DocumentState => ({
  signatures: [...state.signatures],
  images: [...state.images],
  pageNumbers: [...state.pageNumbers],
  totalPages: state.totalPages,
  currentDocument: state.currentDocument ? {
    name: state.currentDocument.name,
    file: state.currentDocument.file.slice(0) // Deep copy the ArrayBuffer
  } : null,
});

// Helper to download a file
const downloadFile = (data: Uint8Array, filename: string) => {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/\.pdf$/, '') + '_edited.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const useDocumentStore = create<DocumentStoreState & DocumentStoreActions>((set, get) => ({
  currentDocument: null,
  signatures: [],
  images: [],
  pageNumbers: [],
  history: [],
  currentHistoryIndex: -1,
  totalPages: 0,
  currentPage: 1,
  documentKey: 0,
  canUndo: false,
  canRedo: false,

  loadDocument: (name, file) => {
    // Create a new ArrayBuffer copy to prevent detachment issues
    const newBuffer = file.slice(0);
    
    set({
      currentDocument: { name, file: newBuffer },
      signatures: [],
      images: [],
      pageNumbers: [],
      history: [],
      currentHistoryIndex: -1,
      totalPages: 1, // Will be updated after loading
      currentPage: 1,
      documentKey: get().documentKey + 1,
      canUndo: false,
      canRedo: false
    });
    
    // Get the actual number of pages from the PDF
    (async () => {
      try {
        const pdfDoc = await PDFDocument.load(newBuffer.slice(0));
        const pageCount = pdfDoc.getPageCount();
        set({ totalPages: pageCount });
      } catch (error) {
        console.error('Error getting page count:', error);
        set({ totalPages: 1 });
      }
    })();
    
    get().saveToHistory();
    showToast(`Loaded document: ${name}`, 'success');
  },

  saveDocument: async (asDownload = false) => {
    const state = get();
    if (!state.currentDocument) {
      showToast('No document loaded', 'error');
      return;
    }

    try {
      // Create a fresh copy of the ArrayBuffer to prevent detachment
      const originalBuffer = state.currentDocument.file;
      const bufferCopy = originalBuffer.slice(0);
      const pdfDoc = await PDFDocument.load(bufferCopy);
      const pages = pdfDoc.getPages();

      // Embed a standard font for text rendering
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Process signatures
      for (const sig of state.signatures) {
        const pageIndex = sig.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        
        const page = pages[pageIndex];
        const { width, height } = page.getSize();

        if (sig.type === 'drawn' && sig.dataURL) {
          // For drawn signatures, embed the image
          try {
            const imageData = sig.dataURL.split(',')[1];
            const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
            
            let signatureImage;
            if (sig.dataURL.startsWith('data:image/png')) {
              signatureImage = await pdfDoc.embedPng(imageBytes);
            } else {
              signatureImage = await pdfDoc.embedJpg(imageBytes);
            }
          
            // Convert from screen coordinates to PDF coordinates (scale 1.2 is used in viewer)
            const scale = 1.2;
            const pdfX = (sig.position.x / scale) * (width / 595);
            const pdfY = height - ((sig.position.y / scale) * (height / 842)) - ((sig.size.height / scale) * (height / 842));
            const pdfWidth = (sig.size.width / scale) * (width / 595);
            const pdfHeight = (sig.size.height / scale) * (height / 842);
            
            page.drawImage(signatureImage, {
              x: pdfX,
              y: pdfY,
              width: pdfWidth,
              height: pdfHeight,
            });
          } catch (error) {
            console.error('Error embedding signature image:', error);
          }
        } else if (sig.type === 'text' && sig.text) {
          // For text signatures, add text
          const scale = 1.2;
          const fontSize = ((sig.textStyle?.fontSize || 32) / scale) * (width / 595);
          const pdfX = (sig.position.x / scale) * (width / 595);
          const pdfY = height - ((sig.position.y / scale) * (height / 842));
          
          page.drawText(sig.text, {
            x: pdfX,
            y: pdfY,
            size: fontSize,
            color: rgb(0, 0, 0),
            font: font,
          });
        }
      }

      // Process images
      for (const img of state.images) {
        const pageIndex = img.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        
        const page = pages[pageIndex];
        const { width, height } = page.getSize();
        
        try {
          const imageData = img.dataURL.split(',')[1];
          const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
          
          let embedImage;
          if (img.dataURL.startsWith('data:image/png')) {
            embedImage = await pdfDoc.embedPng(imageBytes);
          } else {
            embedImage = await pdfDoc.embedJpg(imageBytes);
          }
          
          // Convert from screen coordinates to PDF coordinates (scale 1.2 is used in viewer)
          const scale = 1.2;
          const pdfX = (img.position.x / scale) * (width / 595);
          const pdfY = height - ((img.position.y / scale) * (height / 842)) - ((img.size.height / scale) * (height / 842));
          const pdfWidth = (img.size.width / scale) * (width / 595);
          const pdfHeight = (img.size.height / scale) * (height / 842);
          
          page.drawImage(embedImage, {
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
          });
        } catch (error) {
          console.error('Error embedding image:', error);
        }
      }

      // Process page numbers
      for (const pageNum of state.pageNumbers) {
        if (pageNum.page === 0) {
          // Apply to all pages
          pages.forEach((page, index) => {
            const { width, height } = page.getSize();
            const scale = 1.2;
            const fontSize = ((pageNum.fontSize || 12) / scale) * (width / 595);
            const pdfX = (pageNum.position.x / scale) * (width / 595);
            const pdfY = height - ((pageNum.position.y / scale) * (height / 842));
            
            const text = pageNum.template
              .replace('{page}', (index + pageNum.startingNumber).toString())
              .replace('{total}', state.totalPages.toString());
            
            page.drawText(text, {
              x: pdfX,
              y: pdfY,
              size: fontSize,
              color: rgb(0, 0, 0),
              font: font,
            });
          });
        } else {
          // Apply to specific page
          const pageIndex = pageNum.page - 1;
          if (pageIndex >= 0 && pageIndex < pages.length) {
            const page = pages[pageIndex];
            const { width, height } = page.getSize();
            const scale = 1.2;
            const fontSize = ((pageNum.fontSize || 12) / scale) * (width / 595);
            const pdfX = (pageNum.position.x / scale) * (width / 595);
            const pdfY = height - ((pageNum.position.y / scale) * (height / 842));
            
            const text = pageNum.template
              .replace('{page}', (pageNum.page + pageNum.startingNumber - 1).toString())
              .replace('{total}', state.totalPages.toString());
            
            page.drawText(text, {
              x: pdfX,
              y: pdfY,
              size: fontSize,
              color: rgb(0, 0, 0),
              font: font,
            });
          }
        }
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      if (asDownload) {
        downloadFile(pdfBytes, state.currentDocument.name);
        showToast('PDF exported successfully!', 'success');
      } else {
        // Update the current document with the saved PDF
        const newBuffer = new ArrayBuffer(pdfBytes.length);
        const newView = new Uint8Array(newBuffer);
        newView.set(pdfBytes);
        
        set({
          currentDocument: {
            ...state.currentDocument,
            file: newBuffer,
          },
          documentKey: get().documentKey + 1,
        });
        get().saveToHistory();
        showToast('PDF saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      showToast('Error saving PDF', 'error');
    }
  },

  addSignature: (signature) => {
    const state = get();
    state.saveToHistory();
    set({ signatures: [...state.signatures, signature] });
  },

  updateSignature: (updatedSignature) => {
    const state = get();
    set({
      signatures: state.signatures.map(sig => 
        sig.id === updatedSignature.id ? updatedSignature : sig
      )
    });
  },

  removeSignature: (id) => {
    const state = get();
    state.saveToHistory();
    set({
      signatures: state.signatures.filter(sig => sig.id !== id)
    });
  },

  addImage: (image) => {
    const state = get();
    state.saveToHistory();
    set({ images: [...state.images, image] });
  },

  updateImage: (updatedImage) => {
    const state = get();
    set({
      images: state.images.map(img => 
        img.id === updatedImage.id ? updatedImage : img
      )
    });
  },

  removeImage: (id) => {
    const state = get();
    state.saveToHistory();
    set({
      images: state.images.filter(img => img.id !== id)
    });
  },

  addPageNumber: (pageNumber) => {
    const state = get();
    state.saveToHistory();
    set({
      pageNumbers: [...state.pageNumbers, pageNumber]
    });
    showToast('Page numbers added', 'success');
  },

  updatePageNumber: (updatedPageNumber) => {
    const state = get();
    set({
      pageNumbers: state.pageNumbers.map(num => 
        num.id === updatedPageNumber.id ? updatedPageNumber : num
      )
    });
  },

  removePageNumber: (id) => {
    const state = get();
    state.saveToHistory();
    set({
      pageNumbers: state.pageNumbers.filter(num => num.id !== id)
    });
  },

  deletePage: async (pageIndex) => {
    const state = get();
    if (!state.currentDocument || state.totalPages <= 1) {
      showToast('Cannot delete the only remaining page', 'error');
      return;
    }

    // Show progress for large documents
    if (state.totalPages > 50) {
      showToast('Deleting page from large document...', 'info');
    }

    state.saveToHistory();

    try {
      // Load the PDF document
      const bufferCopy = state.currentDocument.file.slice(0);
      const pdfDoc = await PDFDocument.load(bufferCopy);
      
      // Remove the page (pageIndex is 1-based, but removePage expects 0-based)
      pdfDoc.removePage(pageIndex - 1);
      
      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      const newBuffer = new ArrayBuffer(pdfBytes.length);
      const newView = new Uint8Array(newBuffer);
      newView.set(pdfBytes);
      
      const newTotalPages = pdfDoc.getPageCount();
      let newCurrentPage = state.currentPage;
      
      // Adjust current page if necessary
      if (pageIndex === state.currentPage) {
        newCurrentPage = pageIndex > 1 ? pageIndex - 1 : 1;
      } else if (pageIndex < state.currentPage) {
        newCurrentPage = state.currentPage - 1;
      }
      
      // Update the document and state
      set({
        currentDocument: {
          ...state.currentDocument,
          file: newBuffer,
        },
        totalPages: newTotalPages,
        currentPage: Math.min(newCurrentPage, newTotalPages),
        documentKey: get().documentKey + 1,
        // Remove elements that were on the deleted page
        signatures: state.signatures.filter(sig => sig.page !== pageIndex).map(sig => ({
          ...sig,
          page: sig.page > pageIndex ? sig.page - 1 : sig.page
        })),
        images: state.images.filter(img => img.page !== pageIndex).map(img => ({
          ...img,
          page: img.page > pageIndex ? img.page - 1 : img.page
        })),
        pageNumbers: state.pageNumbers.filter(num => num.page !== pageIndex && num.page !== 0).map(num => ({
          ...num,
          page: num.page > pageIndex ? num.page - 1 : num.page
        }))
      });
      
      showToast(`Page ${pageIndex} deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting page:', error);
      showToast('Error deleting page', 'error');
    }
  },

  addPage: async (afterPageIndex) => {
    const state = get();
    if (!state.currentDocument) {
      showToast('No document loaded', 'error');
      return;
    }

    // Show progress for large documents
    if (state.totalPages > 50) {
      showToast('Adding page to large document...', 'info');
    }

    try {
      // Save to history before making changes
      get().saveToHistory();

      // Load the PDF document
      const currentState = get();
      const originalBuffer = currentState.currentDocument?.file;
      if (!originalBuffer || originalBuffer.byteLength === 0) {
        throw new Error('Document buffer is empty or invalid');
      }
      
      const bufferCopy = originalBuffer.slice(0);
      const pdfDoc = await PDFDocument.load(bufferCopy);
      
      // Add a new blank page after the specified index
      const newPage = pdfDoc.insertPage(afterPageIndex);
      
      // Set standard A4 size (595.28 x 841.89 points)
      newPage.setSize(595.28, 841.89);
      
      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      const newBuffer = new ArrayBuffer(pdfBytes.length);
      const newView = new Uint8Array(newBuffer);
      newView.set(pdfBytes);
      
      const newTotalPages = pdfDoc.getPageCount();
      
      // Update the document and state
      set({
        currentDocument: state.currentDocument ? {
          ...state.currentDocument,
          file: newBuffer,
        } : null,
        totalPages: newTotalPages,
        currentPage: afterPageIndex + 1,
        documentKey: get().documentKey + 1,
        // Update page numbers for elements that come after the inserted page
        signatures: state.signatures.map(sig => ({
          ...sig,
          page: sig.page > afterPageIndex ? sig.page + 1 : sig.page
        })),
        images: state.images.map(img => ({
          ...img,
          page: img.page > afterPageIndex ? img.page + 1 : img.page
        })),
        pageNumbers: state.pageNumbers.map(num => ({
          ...num,
          page: num.page > afterPageIndex && num.page !== 0 ? num.page + 1 : num.page
        }))
      });
      
      showToast('New page added successfully', 'success');
    } catch (error) {
      console.error('Error adding page:', error);
      showToast(`Error adding page: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      
      // Don't restore state on error to prevent document loss
      // Just log the error and let the user try again
    }
  },

  addPagesFromPDF: async (pdfBuffer, afterPageIndex) => {
    const state = get();
    if (!state.currentDocument) {
      showToast('No document loaded', 'error');
      return;
    }

    showToast('Importing PDF pages...', 'info');

    try {
      // Save to history before making changes
      get().saveToHistory();

      // Load both the current document and the PDF to import
      const originalBuffer = state.currentDocument.file;
      if (!originalBuffer || originalBuffer.byteLength === 0) {
        throw new Error('Document buffer is empty or invalid');
      }
      
      const bufferCopy = originalBuffer.slice(0);
      const currentPdfDoc = await PDFDocument.load(bufferCopy);
      const importPdfDoc = await PDFDocument.load(pdfBuffer);
      
      // Get all pages from the import PDF
      const importPages = await currentPdfDoc.copyPages(importPdfDoc, importPdfDoc.getPageIndices());
      
      // Insert all pages after the specified index
      let insertIndex = afterPageIndex;
      for (const page of importPages) {
        currentPdfDoc.insertPage(insertIndex, page);
        insertIndex++;
      }
      
      // Save the modified PDF
      const pdfBytes = await currentPdfDoc.save();
      const newBuffer = new ArrayBuffer(pdfBytes.length);
      const newView = new Uint8Array(newBuffer);
      newView.set(pdfBytes);
      
      const newTotalPages = currentPdfDoc.getPageCount();
      const pagesAdded = importPages.length;
      
      // Update the document and state
      set({
        currentDocument: {
          ...state.currentDocument!,
          file: newBuffer,
        },
        totalPages: newTotalPages,
        currentPage: afterPageIndex + 1,
        documentKey: get().documentKey + 1,
        // Update page numbers for elements that come after the inserted pages
        signatures: state.signatures.map(sig => ({
          ...sig,
          page: sig.page > afterPageIndex ? sig.page + pagesAdded : sig.page
        })),
        images: state.images.map(img => ({
          ...img,
          page: img.page > afterPageIndex ? img.page + pagesAdded : img.page
        })),
        pageNumbers: state.pageNumbers.map(num => ({
          ...num,
          page: num.page > afterPageIndex && num.page !== 0 ? num.page + pagesAdded : num.page
        }))
      });
      
      showToast(`Successfully imported ${pagesAdded} page(s) from PDF`, 'success');
    } catch (error) {
      console.error('Error importing PDF pages:', error);
      showToast(`Error importing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  },

  reorderPages: (fromIndex, toIndex) => {
    const state = get();
    state.saveToHistory();
    
    let newCurrentPage = state.currentPage;
    if (state.currentPage === fromIndex) {
      newCurrentPage = toIndex;
    } else if (
      (state.currentPage > fromIndex && state.currentPage <= toIndex) ||
      (state.currentPage < fromIndex && state.currentPage >= toIndex)
    ) {
      newCurrentPage = state.currentPage + (fromIndex < toIndex ? -1 : 1);
    }
    
    set({ currentPage: newCurrentPage });
    showToast(`Page ${fromIndex} moved to position ${toIndex}`, 'success');
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
  },

  setTotalPages: (pages) => {
    set({ totalPages: pages });
  },

  undo: () => {
    const state = get();
    if (state.currentHistoryIndex <= 0) return;
    
    const previousState = state.history[state.currentHistoryIndex - 1];
    
    set({
      currentDocument: previousState.currentDocument,
      signatures: previousState.signatures,
      images: previousState.images,
      pageNumbers: previousState.pageNumbers,
      totalPages: previousState.totalPages,
      currentHistoryIndex: state.currentHistoryIndex - 1,
      canUndo: state.currentHistoryIndex - 1 > 0,
      canRedo: true
    });
  },

  redo: () => {
    const state = get();
    if (state.currentHistoryIndex >= state.history.length - 1) return;
    
    const nextState = state.history[state.currentHistoryIndex + 1];
    
    set({
      currentDocument: nextState.currentDocument,
      signatures: nextState.signatures,
      images: nextState.images,
      pageNumbers: nextState.pageNumbers,
      totalPages: nextState.totalPages,
      currentHistoryIndex: state.currentHistoryIndex + 1,
      canUndo: true,
      canRedo: state.currentHistoryIndex + 1 < state.history.length - 1
    });
  },

  saveToHistory: function() {
    const state = get();
    const newHistoryEntry = createStateSnapshot(state);
    const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
    newHistory.push(newHistoryEntry);
    
    set({
      history: newHistory,
      currentHistoryIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false
    });
  },

  // Helper method to safely save to history
  _saveToHistory: () => {
    const state = get();
    try {
      const newHistoryEntry = createStateSnapshot(state);
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      newHistory.push(newHistoryEntry);
      
      set({
        history: newHistory,
        currentHistoryIndex: newHistory.length - 1,
        canUndo: newHistory.length > 1,
        canRedo: false
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }
}));