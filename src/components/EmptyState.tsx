import React from 'react';
import { FileText, Upload } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';

const EmptyState: React.FC = () => {
  const { loadDocument } = useDocumentStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result;
        if (arrayBuffer) {
          loadDocument(file.name, arrayBuffer as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-50 p-4 rounded-full">
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">No PDF Document Open</h2>
        <p className="text-slate-600 mb-6">
          Start by opening a PDF document to edit. You can add signatures, images, page numbers, and manage pages.
        </p>
        <label htmlFor="empty-file-upload" className="btn-primary flex items-center justify-center w-full py-3 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer">
          <Upload className="h-5 w-5 mr-2" />
          <span>Open a PDF</span>
          <input 
            id="empty-file-upload" 
            type="file" 
            accept=".pdf" 
            className="hidden" 
            onChange={handleFileUpload}
          />
        </label>
      </div>
    </div>
  );
};

export default EmptyState;