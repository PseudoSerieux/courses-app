"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-pop animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink/70">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-pink px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-pink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
