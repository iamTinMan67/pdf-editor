
import React from 'react';
import { PDFDocument } from 'pdf-lib';
import { useDocumentStore } from '../store/documentStore';

const ExportButton: React.FC = () => {
  const { currentDocument } = useDocumentStore();

  const handleExport = async () => {
    if (!currentDocument) return;
    const arrayBuffer = await currentDocument.file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exported.pdf';
    link.click();
  };

  return (
    <button onClick={handleExport} className="px-3 py-1 bg-green-600 text-white rounded">
      Export PDF
    </button>
  );
};

export default ExportButton;
