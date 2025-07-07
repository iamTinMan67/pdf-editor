import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2, Save, Undo, Type, Edit3 } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { TextStyle } from '../../types/documentTypes';

const SignaturePanel: React.FC = () => {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [mode, setMode] = useState<'draw' | 'text'>('draw');
  const [text, setText] = useState('');
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontFamily: 'Dancing Script',
    fontSize: 32,
    color: '#000000',
    bold: false,
    italic: false,
  });
  
  const { addSignature, signatures, currentPage } = useDocumentStore();

  const handleClear = () => {
    if (mode === 'draw') {
      sigCanvasRef.current?.clear();
      setIsEmpty(true);
    } else {
      setText('');
    }
  };

  const handleUndo = () => {
    if (mode === 'draw') {
      sigCanvasRef.current?.clear();
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    if (mode === 'draw' && sigCanvasRef.current && !isEmpty) {
      const dataURL = sigCanvasRef.current.toDataURL('image/png');
      addSignature({ 
        id: `sig-${Date.now()}`,
        type: 'drawn',
        dataURL,
        page: currentPage,
        position: { x: 100, y: 100 },
        size: { width: 150, height: 80 }
      });
      handleClear();
    } else if (mode === 'text' && text.trim()) {
      addSignature({
        id: `sig-${Date.now()}`,
        type: 'text',
        text,
        textStyle,
        page: currentPage,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 50 }
      });
      handleClear();
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const fontFamilies = [
    'Dancing Script',
    'Alex Brush',
    'Great Vibes',
    'Pacifico',
    'Satisfy'
  ];

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-2 mb-2">
        <button
          className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center ${
            mode === 'draw' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          onClick={() => setMode('draw')}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Draw
        </button>
        <button
          className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center ${
            mode === 'text' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          onClick={() => setMode('text')}
        >
          <Type className="h-4 w-4 mr-2" />
          Text
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="border-2 border-dashed border-slate-300 bg-white rounded-md h-32 flex items-center justify-center">
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="black"
            canvasProps={{
              className: 'signature-canvas w-full h-full',
            }}
            onBegin={handleBegin}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your signature"
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          />
          
          <select
            value={textStyle.fontFamily}
            onChange={(e) => setTextStyle({ ...textStyle, fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          >
            {fontFamilies.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
          
          <div className="flex space-x-2">
            <input
              type="number"
              value={textStyle.fontSize}
              onChange={(e) => setTextStyle({ ...textStyle, fontSize: parseInt(e.target.value) })}
              className="w-24 px-3 py-2 border border-slate-300 rounded-md"
              min="12"
              max="72"
            />
            <input
              type="color"
              value={textStyle.color}
              onChange={(e) => setTextStyle({ ...textStyle, color: e.target.value })}
              className="w-12 h-10 border border-slate-300 rounded-md cursor-pointer"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1.5 rounded ${textStyle.bold ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
              onClick={() => setTextStyle({ ...textStyle, bold: !textStyle.bold })}
            >
              Bold
            </button>
            <button
              className={`px-3 py-1.5 rounded ${textStyle.italic ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
              onClick={() => setTextStyle({ ...textStyle, italic: !textStyle.italic })}
            >
              Italic
            </button>
          </div>
          
          <div className="border-2 border-dashed border-slate-300 bg-white rounded-md h-32 flex items-center justify-center p-4">
            <div
              style={{
                fontFamily: textStyle.fontFamily,
                fontSize: `${textStyle.fontSize}px`,
                color: textStyle.color,
                fontWeight: textStyle.bold ? 'bold' : 'normal',
                fontStyle: textStyle.italic ? 'italic' : 'normal'
              }}
            >
              {text || 'Preview'}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between">
        <button
          onClick={handleClear}
          className="flex items-center text-sm text-slate-600 hover:text-red-600 p-1.5"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </button>
        
        {mode === 'draw' && (
          <button
            onClick={handleUndo}
            className={`flex items-center text-sm p-1.5 ${isEmpty ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:text-slate-800'}`}
            disabled={isEmpty}
          >
            <Undo className="h-4 w-4 mr-1" />
            Reset
          </button>
        )}
      </div>
      
      <button
        onClick={handleSave}
        disabled={mode === 'draw' ? isEmpty : !text.trim()}
        className={`w-full py-2 rounded-md flex items-center justify-center ${
          (mode === 'draw' ? isEmpty : !text.trim())
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <Save className="h-4 w-4 mr-2" />
        Add to Document
      </button>
      
      {signatures.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Saved Signatures</h3>
          <div className="grid grid-cols-2 gap-2">
            {signatures.map((sig) => (
              <div 
                key={sig.id}
                className="border border-slate-200 rounded-md p-2 bg-white flex items-center justify-center"
              >
                {sig.type === 'drawn' ? (
                  <img 
                    src={sig.dataURL} 
                    alt="Signature" 
                    className="max-h-10 max-w-full object-contain"
                  />
                ) : (
                  <div
                    style={{
                      fontFamily: sig.textStyle?.fontFamily,
                      fontSize: `${sig.textStyle?.fontSize}px`,
                      color: sig.textStyle?.color,
                      fontWeight: sig.textStyle?.bold ? 'bold' : 'normal',
                      fontStyle: sig.textStyle?.italic ? 'italic' : 'normal'
                    }}
                  >
                    {sig.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignaturePanel;