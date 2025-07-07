import React from 'react';
import { Toaster } from './components/ui/Toaster';
import PDFEditorApp from './components/PDFEditorApp';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PDFEditorApp />
      <Toaster />
    </div>
  );
}

export default App;