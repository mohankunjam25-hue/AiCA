import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, type, message, duration };

    set((state) => {
      // Prevent duplicate identical messages in queue
      const isDuplicate = state.toasts.some((t) => t.message === message && t.type === type);
      if (isDuplicate) return state;
      return { toasts: [...state.toasts.slice(-4), newToast] }; // Keep max 5 toasts
    });

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }

    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    })),
  clearAll: () => set({ toasts: [] })
}));

/**
 * Convenient procedural toast helper for use outside or inside components.
 */
export const toast = {
  error: (message: string, duration?: number) => useToastStore.getState().addToast('error', message, duration),
  success: (message: string, duration?: number) => useToastStore.getState().addToast('success', message, duration),
  info: (message: string, duration?: number) => useToastStore.getState().addToast('info', message, duration),
  warning: (message: string, duration?: number) => useToastStore.getState().addToast('warning', message, duration),
  dismiss: (id: string) => useToastStore.getState().removeToast(id),
  clear: () => useToastStore.getState().clearAll()
};
