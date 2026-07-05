'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string; }

const ToastCtx = createContext<{ toast: (message: string, kind?: ToastKind) => void }>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

const ICONS = {
  success: <CheckCircle2 size={18} className="text-success shrink-0" />,
  error: <AlertTriangle size={18} className="text-warning shrink-0" />,
  info: <Info size={18} className="text-secondary shrink-0" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[min(420px,90vw)]" role="status" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="card flex items-center gap-3 px-4 py-3"
            >
              {ICONS[t.kind]}
              <p className="text-sm flex-1">{t.message}</p>
              <button
                aria-label="Dismiss notification"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-gray-400 hover:text-ink transition-colors"
              >
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
