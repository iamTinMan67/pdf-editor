import React, { useState } from 'react';
import Header from './Header';
import PDFViewer from './PDFViewer';
import Toolbar from './Toolbar';
import EmptyState from './EmptyState';
import { useDocumentStore } from '../store/documentStore';

const PDFEditorApp: React.FC = () => {
  const { currentDocument } = useDocumentStore();
  const [activeToolPanel, setActiveToolPanel] = useState<string | null>(null);

  const toggleToolPanel = (panelName: string) => {
    setActiveToolPanel(activeToolPanel === panelName ? null : panelName);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar activePanel={activeToolPanel} togglePanel={toggleToolPanel} />
        <main className="flex-1 overflow-auto bg-slate-100">
          {currentDocument ? (
            <PDFViewer activeToolPanel={activeToolPanel} />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
};

export default PDFEditorApp;