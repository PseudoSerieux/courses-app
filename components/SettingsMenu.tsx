"use client";

import { useEffect, useRef, useState } from "react";
import { copyListToClipboard } from "@/lib/export";
import type { CategoryWithItems } from "@/lib/types";

type SettingsMenuProps = {
  categories: CategoryWithItems[];
  onOpenLinkedLists: () => void;
  onExported: () => void;
  onOpenPrivacy: () => void;
};

export default function SettingsMenu({
  categories,
  onOpenLinkedLists,
  onExported,
  onOpenPrivacy,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleExport = async () => {
    await copyListToClipboard(categories);
    setOpen(false);
    onExported();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Réglages"
        aria-expanded={open}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg shadow-card transition hover:text-violet"
      >
        ⚙️
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl2 bg-white p-1.5 shadow-pop animate-pop-in">
          <button
            onClick={() => {
              setOpen(false);
              onOpenLinkedLists();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-violet-soft"
          >
            <span aria-hidden>🪢</span> Listes liées
          </button>
          <button
            onClick={handleExport}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-violet-soft"
          >
            <span aria-hidden>📤</span> Exporter vers Notes
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onOpenPrivacy();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-violet-soft"
          >
            <span aria-hidden>🔒</span> Confidentialité
          </button>
        </div>
      )}
    </div>
  );
}
