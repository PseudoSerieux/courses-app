"use client";

import { useEffect } from "react";

export type ToastState = {
  message: string;
  onUndo?: () => void;
} | null;

export default function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-pop animate-pop-in">
        <span>{toast.message}</span>
        {toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo?.();
              onDismiss();
            }}
            className="font-semibold text-pink-soft hover:text-white"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
