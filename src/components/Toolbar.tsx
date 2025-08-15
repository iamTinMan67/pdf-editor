import React from 'react';
import { Pencil, Image, Hash, FileText, GripVertical, X } from 'lucide-react';
import SignaturePanel from './panels/SignaturePanel';
import ImagePanel from './panels/ImagePanel';
import PageNumberPanel from './panels/PageNumberPanel';
import { PageManagementPanel } from './panels/PageManagementPanel';
import { useDocumentStore } from '../store/documentStore';

interface ToolbarProps {
  activePanel: string | null;
  togglePanel: (panel: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ activePanel, togglePanel }) => {
  const { currentDocument } = useDocumentStore();
  const disabled = !currentDocument;

  const tools = [
    { id: 'signature', icon: <Pencil />, title: 'Signature', panel: <SignaturePanel /> },
    { id: 'image', icon: <Image />, title: 'Image', panel: <ImagePanel /> },
    { id: 'pageNumber', icon: <Hash />, title: 'Page Numbers', panel: <PageNumberPanel /> },
    { id: 'pageManagement', icon: <FileText />, title: 'Pages', panel: <PageManagementPanel /> },
  ];

  return (
    <div className="flex h-full">
      {/* Tool Icons */}
      <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`p-3 rounded-lg mb-1 relative ${
              activePanel === tool.id
                ? 'bg-blue-100 text-blue-600'
                : disabled
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => !disabled && togglePanel(tool.id)}
            disabled={disabled}
            title={tool.title}
          >
            {tool.icon}
            {activePanel === tool.id && (
              <span className="absolute -right-1 top-1/2 transform -translate-y-1/2 h-2 w-2 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tool Panel */}
      {activePanel && (
        <div className="w-72 bg-white border-r border-slate-200 animate-slide-in shadow-md">
          <div className="p-3 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center text-slate-700 font-medium">
              <GripVertical className="h-4 w-4 text-slate-400 mr-2" />
              {tools.find((t) => t.id === activePanel)?.title}
            </div>
            <button
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              onClick={() => togglePanel(activePanel)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            {tools.find((t) => t.id === activePanel)?.panel}
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;