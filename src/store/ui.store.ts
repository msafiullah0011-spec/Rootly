import { create } from 'zustand';

/**
 * Transient UI state that outlives a single screen: toasts, and the confirmation
 * banner the add-flow shows after filing a link.
 */

export type ToastTone = 'error' | 'success' | 'info';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
  /** Optional inline action, e.g. the add-flow's "Undo". */
  action?: { label: string; onPress: () => void };
  durationMs: number;
}

interface UiState {
  toasts: Toast[];
  showToast: (message: string, tone?: ToastTone, options?: Partial<Pick<Toast, 'action' | 'durationMs'>>) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

let toastCounter = 0;

export const useUiStore = create<UiState>((set) => ({
  toasts: [],

  showToast: (message, tone = 'info', options = {}) => {
    const id = `toast_${(toastCounter += 1)}`;
    const toast: Toast = {
      id,
      message,
      tone,
      action: options.action,
      durationMs: options.durationMs ?? (tone === 'error' ? 5000 : 3500),
    };
    // Cap the stack — three simultaneous toasts is already too many.
    set((state) => ({ toasts: [...state.toasts, toast].slice(-3) }));
    return id;
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),
}));

/** Imperative access for non-React callers (the query client's error handler). */
export const uiActions = {
  showToast: (message: string, tone: ToastTone = 'info') => useUiStore.getState().showToast(message, tone),
};
