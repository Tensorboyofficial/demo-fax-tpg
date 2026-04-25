"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/utils";

interface ToastMessage {
  id: number;
  text: string;
}

interface ToastContextValue {
  toast: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let _nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((text: string) => {
    const id = ++_nextId;
    setMessages((prev) => [...prev.slice(-2), { id, text }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 1500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-1.5 pointer-events-none">
        {messages.map((m) => (
          <div
            key={m.id}
            className="animate-in fade-in slide-in-from-bottom-2 bg-[var(--cevi-text)] text-white px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5 text-[12px] font-medium"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cevi-jade-light)]" strokeWidth={2} />
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
