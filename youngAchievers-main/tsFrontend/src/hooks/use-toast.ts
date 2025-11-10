
import * as React from "react";
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast";

export type ToasterToast = Toast;

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToastWithoutId = Omit<ToasterToast, "id">;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const toastStore = {
  toasts: [] as ToasterToast[],
  listeners: [] as Array<(toasts: ToasterToast[]) => void>,

  subscribe(listener: (toasts: ToasterToast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  },

  update(toast: ToasterToast) {
    this.toasts = this.toasts.map((t) => (t.id === toast.id ? { ...t, ...toast } : t));
    this.emitChange();
  },

  add(toast: ToasterToastWithoutId) {
    const id = genId();
    const newToast = { ...toast, id };
    this.toasts = [newToast, ...this.toasts].slice(0, TOAST_LIMIT);
    this.emitChange();
    return id;
  },

  dismiss(toastId: string) {
    this.toasts = this.toasts.map((t) => (t.id === toastId ? { ...t, open: false } : t));
    this.emitChange();
  },

  remove(toastId: string) {
    this.toasts = this.toasts.filter((t) => t.id !== toastId);
    this.emitChange();
  },

  emitChange() {
    this.listeners.forEach((listener) => {
      listener(this.toasts);
    });
  },
};

export function toast(props: ToasterToastWithoutId) {
  const id = toastStore.add(props);
  return {
    id,
    dismiss: () => toastStore.dismiss(id),
    update: (props: ToasterToastWithoutId) => toastStore.update({ ...props, id }),
  };
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([]);

  React.useEffect(() => {
    return toastStore.subscribe((toasts) => {
      setToasts(toasts);
    });
  }, []);

  return {
    toast,
    dismiss: (toastId?: string) => toastId ? toastStore.dismiss(toastId) : undefined,
    toasts,
  };
}

interface ToastApi {
  toast: typeof toast
  dismiss: (toastId?: string) => void
  toasts: ToasterToast[]
}

export const reducer = (state: ToasterToast[], action: any): ToasterToast[] => {
  switch (action.type) {
    case "ADD_TOAST":
      return [...state, { ...action.toast, id: action.id }]
    case "UPDATE_TOAST":
      return state.map((t) =>
        t.id === action.toast.id ? { ...t, ...action.toast } : t
      )
    case "DISMISS_TOAST": {
      return state.map((t) =>
        t.id === action.toastId || action.toastId === undefined
          ? { ...t, open: false }
          : t
      )
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return []
      }
      return state.filter((t) => t.id !== action.toastId)
    default:
      return state
  }
}
