import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import Signature from './editor/Signature';
import ImageElement from './editor/ImageElement';
import PageNumber from './editor/PageNumber';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { showToast } from '../components/ui/Toaster';

// Set the worker source for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  activeToolPanel: string | null;
  isExporting?: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ activeToolPanel, isExporting = false }) => {
  const { currentDocument, signatures, images, pageNumbers, currentPage, setCurrentPage, totalPages, documentKey, processedElements } = useDocumentStore();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.2);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update document URL when currentDocument changes
  useEffect(() => {
    if (currentDocument?.file) {
      // Convert ArrayBuffer to Blob and create object URL
      const blob = new Blob([currentDocument.file], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
      
      // Cleanup function to revoke the URL
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setDocumentUrl(null);
    }
  }, [currentDocument]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Update the store with the actual page count
    const store = useDocumentStore.getState();
    store.setTotalPages(numPages);
    if (currentPage > numPages) {
      setCurrentPage(1);
    }
    
    // Show performance tip for large documents
    if (numPages > 100) {
      showToast(`Large document loaded (${numPages} pages). Consider working on smaller sections for better performance.`, 'info');
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setNumPages(null);
  };

  const changePage = (offset: number) => {
    if (!numPages) return;
    const newPage = currentPage + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  // Elements that belong to the current page and haven't been processed yet
  const currentSignatures = signatures.filter(sig => sig.page === currentPage && !processedElements.has(sig.id));
  const currentImages = images.filter(img => img.page === currentPage && !processedElements.has(img.id));
  // Page numbers with page 0 appear on all pages, others only on their specific page
  const currentPageNumbers = pageNumbers.filter(num => (num.page === 0 || num.page === currentPage) && !processedElements.has(num.id));

  // Center the page initially
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  return (
    <div ref={containerRef} className="relative h-full flex flex-col">
      {/* PDF Controls */}
      <div className="bg-white border-b border-slate-200 p-2 flex justify-between items-center">
        <div className="flex items-center space-x-1">
          <button
            className={`p-1 rounded-md ${currentPage <= 1 || !numPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'}`}
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1 || !numPages}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm">
            Page {currentPage} of {numPages || totalPages || '?'}
          </span>
          <button
            className={`p-1 rounded-md ${currentPage >= (numPages || totalPages || 0) || !numPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'}`}
            onClick={() => changePage(1)}
            disabled={currentPage >= (numPages || totalPages || 0) || !numPages}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center space-x-1">
          <button
            className="p-1 rounded-md text-slate-700 hover:bg-slate-100"
            onClick={zoomOut}
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button
            className="p-1 rounded-md text-slate-700 hover:bg-slate-100"
            onClick={zoomIn}
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* PDF Document and Overlay */}
      <div className="flex-1 overflow-auto flex justify-center bg-slate-200 p-8">
        <div className="relative inline-block shadow-xl">
          {documentUrl ? (
            <Document
              key={documentKey}
              file={documentUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              className="pdf-document"
              loading={
                <div className="flex items-center justify-center bg-white h-[842px] w-[595px] border">
                  <p className="text-slate-400">Loading PDF...</p>
                </div>
              }
              error={
                <div className="flex items-center justify-center bg-white h-[842px] w-[595px] border">
                  <p className="text-red-500">Error loading PDF</p>
                </div>
              }
            >
              <div className="relative">
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  className="bg-white border"
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={
                    <div className="flex items-center justify-center bg-white h-[842px] w-[595px] border">
                      <p className="text-slate-400">Loading page...</p>
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center bg-white h-[842px] w-[595px] border">
                      <p className="text-red-500">Error loading page</p>
                    </div>
                  }
                />
                
                {/* Overlays for editing elements */}
                {!isExporting && (
                  <div className="absolute inset-0 pointer-events-none">
                  {/* Render signatures */}
                  {currentSignatures.map((sig) => (
                    <Signature
                      key={sig.id}
                      signature={sig}
                      editable={activeToolPanel === 'signature'}
                    />
                  ))}
                  
                  {/* Render images */}
                  {currentImages.map((img) => (
                    <ImageElement
                      key={img.id}
                      image={img}
                      editable={activeToolPanel === 'image'}
                    />
                  ))}
                  
                  {/* Render page numbers */}
                  {currentPageNumbers.map((pageNum) => (
                    <PageNumber
                      key={pageNum.id}
                      pageNumber={pageNum}
                      currentPage={currentPage}
                      totalPages={numPages || totalPages || 0}
                      editable={activeToolPanel === 'pageNumber'}
                    />
                  ))}
                  </div>
                )}
              </div>
            </Document>
          ) : (
            <div className="flex items-center justify-center bg-white h-[842px] w-[595px] border shadow-xl">
              <p className="text-slate-400">No document loaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;