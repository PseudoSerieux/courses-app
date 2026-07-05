"use client";

import { useState } from "react";
import type { Item } from "@/lib/types";

type ItemRowProps = {
  item: Item;
  onToggle: (item: Item) => void;
  onRename: (item: Item, newName: string) => void;
  onDelete: (item: Item) => void;
};

export default function ItemRow({ item, onToggle, onRename, onDelete }: ItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);

  const commitRename = () => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.name) onRename(item, trimmed);
    else setDraft(item.name);
  };

  return (
    <li className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-violet-soft/50">
      <button
        onClick={() => onToggle(item)}
        aria-pressed={item.is_checked}
        aria-label={item.is_checked ? "Marquer comme non pris" : "Marquer comme pris"}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
          item.is_checked
            ? "border-violet bg-violet text-white"
            : "border-mist bg-white text-transparent hover:border-violet"
        }`}
      >
        <span className={item.is_checked ? "animate-stamp text-xs" : "text-xs"}>✓</span>
      </button>

      {isEditing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraft(item.name);
              setIsEditing(false);
            }
          }}
          className="flex-1 rounded-md border border-violet/40 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-violet/30"
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-left text-sm ${item.is_checked ? "checked-strike" : "text-ink"}`}
        >
          {item.name}
        </button>
      )}

      <button
        onClick={() => onDelete(item)}
        aria-label={`Supprimer ${item.name}`}
        className="shrink-0 rounded-full p-1.5 text-ink/25 transition hover:bg-pink-soft hover:text-pink"
      >
        ✕
      </button>
    </li>
  );
}
