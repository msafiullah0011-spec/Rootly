import { create } from 'zustand';

import type { TimelineKind } from '@/api/schemas';

/**
 * Transient UI state that outlives a single screen: toasts, the confirmation
 * banner the add-flow shows after filing a link, and the timeline's kind filter
 * — which lives here because the filter sheet is a route of its own, presented
 * over the feed it filters.
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

  /** Timeline kinds to show. Empty means "everything" — the default. */
  timelineKinds: TimelineKind[];
  toggleTimelineKind: (kind: TimelineKind) => void;
  clearTimelineKinds: () => void;
}

let toastCounter = 0;

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  timelineKinds: [],

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

  toggleTimelineKind: (kind) =>
    set((state) => ({
      timelineKinds: state.timelineKinds.includes(kind)
        ? state.timelineKinds.filter((k) => k !== kind)
        : [...state.timelineKinds, kind],
    })),

  clearTimelineKinds: () => set({ timelineKinds: [] }),
}));

/** Imperative access for non-React callers (the query client's error handler). */
export const uiActions = {
  showToast: (message: string, tone: ToastTone = 'info') => useUiStore.getState().showToast(message, tone),
};
