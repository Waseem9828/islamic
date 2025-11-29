
import { type ToastActionElement, type ToastProps } from "@/components/ui/toast";
import { create } from "zustand";

const TOAST_LIMIT = 1;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToastState = {
  toasts: ToasterToast[];
  addToast: (toast: ToasterToast) => void;
  updateToast: (id: string, toast: Partial<ToasterToast>) => void;
  dismissToast: (id: string) => void;
  removeToast: (id: string) => void;
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => {
      const newToasts = [...state.toasts, toast];
      const slicedToasts = newToasts.slice(-TOAST_LIMIT);
      return { toasts: slicedToasts };
    }),
  updateToast: (id, toast) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...toast } : t)),
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, open: false } : t)),
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function useToast() {
  const { addToast, dismissToast, toasts, updateToast } = useToastStore();

  function toast(props: Omit<ToasterToast, "id">) {
    const id = genId();
    addToast({ ...props, id });

    return {
      id,
      dismiss: () => dismissToast(id),
      update: (props: Partial<ToasterToast>) => updateToast(id, props),
    };
  }

  return {
    toast,
    dismiss: dismissToast,
    toasts,
  };
}
