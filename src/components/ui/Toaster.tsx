import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToasterContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToasterContext = React.createContext<ToasterContextType>({
  showToast: () => {},
});

export const useToaster = () => React.useContext(ToasterContext);

export const ToasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  return (
    <ToasterContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-up ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-800 border-l-4 border-green-500'
                : toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-l-4 border-red-500'
                : 'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <Info className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToasterContext.Provider>
  );
};

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // This component acts as a singleton to display toasts without needing the context
  useEffect(() => {
    const showToast = (event: CustomEvent<{ message: string; type: ToastType }>) => {
      const { message, type } = event.detail;
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 5000);
    };

    // Create a type for the custom event
    type ToastEvent = CustomEvent<{ message: string; type: ToastType }>;

    // Add event listener with proper typing
    window.addEventListener('show-toast' as any, showToast as EventListener);

    return () => {
      window.removeEventListener('show-toast' as any, showToast as EventListener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border-l-4 border-green-500'
              : toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-l-4 border-red-500'
              : 'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Info className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export const showToast = (message: string, type: ToastType = 'info') => {
  // Dispatch custom event to show toast
  window.dispatchEvent(
    new CustomEvent('show-toast', {
      detail: { message, type },
    })
  );
};