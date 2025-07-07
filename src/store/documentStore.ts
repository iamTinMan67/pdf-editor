import { create } from 'zustand';
import { showToast } from '../components/ui/Toaster';
import { PDFDocument, rgb } from 'pdf-lib';
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
  deletePage: (pageIndex: number) => void;
  addPage: (afterPageIndex: number) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  setCurrentPage: (page: number) => void;
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
      totalPages: 10,
      currentPage: 1,
      canUndo: false,
      canRedo: false
    });
    
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
      // Create a copy of the ArrayBuffer to prevent detachment
      const bufferCopy = state.currentDocument.file.slice(0);
      const pdfDoc = await PDFDocument.load(bufferCopy);
      const pages = pdfDoc.getPages();

      // Process signatures
      for (const sig of state.signatures) {
        const page = pages[sig.page - 1];
        const { width, height } = page.getSize();

        if (sig.type === 'drawn' && sig.dataURL) {
          // For drawn signatures, embed the image
          const imageData = sig.dataURL.split(',')[1];
          const signatureImage = await pdfDoc.embedPng(Buffer.from(imageData, 'base64'));
          
          page.drawImage(signatureImage, {
            x: (sig.position.x / 595) * width,
            y: height - ((sig.position.y / 842) * height),
            width: (sig.size.width / 595) * width,
            height: (sig.size.height / 842) * height,
          });
        } else if (sig.type === 'text' && sig.text) {
          // For text signatures, add text
          page.drawText(sig.text, {
            x: (sig.position.x / 595) * width,
            y: height - ((sig.position.y / 842) * height),
            size: sig.textStyle?.fontSize || 12,
            color: rgb(0, 0, 0),
          });
        }
      }

      // Process images
      for (const img of state.images) {
        const page = pages[img.page - 1];
        const { width, height } = page.getSize();
        
        const imageData = img.dataURL.split(',')[1];
        const embedImage = await pdfDoc.embedPng(Buffer.from(imageData, 'base64'));
        
        page.drawImage(embedImage, {
          x: (img.position.x / 595) * width,
          y: height - ((img.position.y / 842) * height),
          width: (img.size.width / 595) * width,
          height: (img.size.height / 842) * height,
        });
      }

      // Process page numbers
      for (const pageNum of state.pageNumbers) {
        const page = pages[pageNum.page - 1];
        const { width, height } = page.getSize();
        
        const text = pageNum.template
          .replace('{page}', (pageNum.page + pageNum.startingNumber - 1).toString())
          .replace('{total}', state.totalPages.toString());
        
        page.drawText(text, {
          x: (pageNum.position.x / 595) * width,
          y: height - ((pageNum.position.y / 842) * height),
          size: 12,
          color: rgb(0, 0, 0),
        });
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      if (asDownload) {
        downloadFile(pdfBytes, state.currentDocument.name);
        showToast('PDF exported successfully!', 'success');
      } else {
        // Create a new ArrayBuffer to prevent detachment issues
        const newBuffer = pdfBytes.buffer.slice(0);
        
        set({
          currentDocument: {
            ...state.currentDocument,
            file: newBuffer,
          },
        });
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

  deletePage: (pageIndex) => {
    const state = get();
    state.saveToHistory();
    
    const newTotalPages = Math.max(1, state.totalPages - 1);
    let newCurrentPage = state.currentPage;
    
    if (pageIndex === state.currentPage) {
      newCurrentPage = pageIndex > 1 ? pageIndex - 1 : 1;
    } else if (pageIndex < state.currentPage) {
      newCurrentPage = state.currentPage - 1;
    }
    
    set({
      totalPages: newTotalPages,
      currentPage: newCurrentPage
    });
    
    showToast(`Page ${pageIndex} deleted`, 'success');
  },

  addPage: (afterPageIndex) => {
    const state = get();
    state.saveToHistory();
    
    set({
      totalPages: state.totalPages + 1,
      currentPage: afterPageIndex + 1
    });
    
    showToast('New page added', 'success');
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

  undo: () => {
    const state = get();
    if (state.currentHistoryIndex <= 0) return;
    
    const previousState = state.history[state.currentHistoryIndex - 1];
    
    set({
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
  }
}));