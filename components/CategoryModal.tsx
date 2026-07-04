"use client";

import { useState } from "react";

type CategoryModalProps = {
  open: boolean;
  initialName?: string;
  initialEmoji?: string;
  onSave: (name: string, emoji: string) => void;
  onCancel: () => void;
};

const SUGGESTED_EMOJIS = ["🥩", "🥫", "🍎", "🥐", "🍰", "🍿", "🧴", "📦"];

export default function CategoryModal({
  open,
  initialName = "",
  initialEmoji = "📦",
  onSave,
  onCancel,
}: CategoryModalProps) {
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);

  if (!open) return null;

  const isEditing = initialName.length > 0;

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
        <h2 className="font-display text-lg text-ink">
          {isEditing ? "Modifier la catégorie" : "Nouvelle catégorie"}
        </h2>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-ink/50">
          Emoji
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`grid h-10 w-10 place-items-center rounded-full text-lg transition ${
                emoji === e ? "bg-violet-soft ring-2 ring-violet" : "bg-paper hover:bg-violet-soft"
              }`}
              aria-label={`Choisir l'emoji ${e}`}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-ink/50">
          Nom de la catégorie
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Petit déjeuner"
          className="mt-2 w-full rounded-full border border-ink/10 bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onSave(name.trim(), emoji);
          }}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
          >
            Annuler
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onSave(name.trim(), emoji)}
            className="rounded-full bg-violet px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-violet-deep disabled:opacity-40"
          >
            {isEditing ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
