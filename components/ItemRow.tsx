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
    <li className="group flex items-center gap-1 rounded-xl px-1 py-1 hover:bg-violet-soft/50">
      {isEditing ? (
        <div className="flex flex-1 items-center gap-3 px-1 py-0.5">
          <span
            aria-hidden
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
              item.is_checked ? "border-violet bg-violet text-white" : "border-mist bg-white text-transparent"
            }`}
          >
            <span className="text-xs">✓</span>
          </span>
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
        </div>
      ) : (
        // The whole row (circle + name) is one big tap target — much easier
        // to hit reliably on a phone than a small standalone checkbox.
        <button
          onClick={() => onToggle(item)}
          aria-pressed={item.is_checked}
          aria-label={item.is_checked ? `Marquer "${item.name}" comme non pris` : `Marquer "${item.name}" comme pris`}
          className="flex flex-1 items-center gap-3 rounded-xl px-1 py-2 text-left"
        >
          <span
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
              item.is_checked
                ? "border-violet bg-violet text-white"
                : "border-mist bg-white text-transparent"
            }`}
          >
            <span className={item.is_checked ? "animate-stamp text-xs" : "text-xs"}>✓</span>
          </span>
          <span className={`text-sm ${item.is_checked ? "checked-strike" : "text-ink"}`}>
            {item.name}
          </span>
        </button>
      )}

      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          aria-label={`Modifier ${item.name}`}
          className="shrink-0 rounded-full p-1.5 text-ink/25 transition hover:bg-violet-soft hover:text-violet"
        >
          ✎
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
