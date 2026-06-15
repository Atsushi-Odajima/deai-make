import { AnimatePresence, motion } from 'framer-motion';
import { create } from 'zustand';

interface ToastItem {
  id: number;
  text: string;
}
interface ToastState {
  toasts: ToastItem[];
  show: (text: string) => void;
  remove: (id: number) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (text) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, text }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function ToastHost() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="toast-host">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className="toast"
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
