"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"], duration?: number) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: Toast["type"] = "info",
      duration: number = 5000
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove toast after duration
      if (duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, duration);
      }
    },
    []
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        hideToast,
        clearToasts,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} hideToast={hideToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  hideToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  hideToast,
}) => {
  // Disable all popup messages
  return null;
};

interface ToastItemProps {
  toast: Toast;
  hideToast: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, hideToast }) => {
  const getToastStyles = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white border-green-600";
      case "error":
        return "bg-red-500 text-white border-red-600";
      case "warning":
        return "bg-yellow-500 text-white border-yellow-600";
      case "info":
      default:
        return "bg-blue-500 text-white border-blue-600";
    }
  };

  return (
    <div
      className={`min-w-80 max-w-md p-4 rounded-lg shadow-lg border-l-4 ${getToastStyles(
        toast.type
      )} animate-in slide-in-from-right-full duration-300`}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium">{toast.message}</p>
        <button
          onClick={() => hideToast(toast.id)}
          className="ml-4 text-white/80 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
