import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Toast context + hook */
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx;
}

/** Provider */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, duration = 4000 }) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [
        ...prev,
        { id, title, description, duration, createdAt: Date.now() },
      ]);

      // auto-dismiss
      setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
      <ToastContext.Provider value={value}>
        {children}
        {/* Toast viewport */}
      <div className="fixed bottom-3 left-1/2 z-[110] flex w-[calc(100%-1rem)] max-w-sm -translate-x-1/2 flex-col gap-2.5 sm:bottom-4 sm:left-auto sm:right-4 sm:w-auto sm:max-w-none sm:translate-x-0">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  // extra safety: remove if somehow lingers too long
  useEffect(() => {
    const max = setTimeout(onClose, toast.duration + 2000);
    return () => clearTimeout(max);
  }, [onClose, toast.duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 290, damping: 24 }}
      className="w-full rounded-2xl border border-orange-100/90 bg-gradient-to-b from-white to-orange-50/40 p-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.12)] sm:w-[320px] sm:p-4"
    >
      {toast.title && <div className="font-semibold mb-1">{toast.title}</div>}
      {toast.description && (
        <div className="text-sm text-gray-600">{toast.description}</div>
      )}
      <div className="mt-3 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-full border border-orange-200 bg-white px-3 py-1 text-sm text-gray-700 transition hover:bg-orange-50"
          aria-label="Close"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}
