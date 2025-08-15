import React, { useState } from 'react';
import Header from './Header';
import PDFViewer from './PDFViewer';
import Toolbar from './Toolbar';
import EmptyState from './EmptyState';
import { useDocumentStore } from '../store/documentStore';

const PDFEditorApp: React.FC = () => {
  const { currentDocument } = useDocumentStore();
  const [activeToolPanel, setActiveToolPanel] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const toggleToolPanel = (panelName: string) => {
    setActiveToolPanel(activeToolPanel === panelName ? null : panelName);
  };

  // Listen for export events
  React.useEffect(() => {
    const handleExportStart = () => setIsExporting(true);
    const handleExportEnd = () => setIsExporting(false);
    
    window.addEventListener('export-start', handleExportStart);
    window.addEventListener('export-end', handleExportEnd);
    
    return () => {
      window.removeEventListener('export-start', handleExportStart);
      window.removeEventListener('export-end', handleExportEnd);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar activePanel={activeToolPanel} togglePanel={toggleToolPanel} />
        <main className="flex-1 overflow-auto bg-slate-100">
          {currentDocument ? (
            <PDFViewer activeToolPanel={activeToolPanel} isExporting={isExporting} />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
};

export default PDFEditorApp;