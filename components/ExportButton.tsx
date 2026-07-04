"use client";

import { useState } from "react";
import type { CategoryWithItems } from "@/lib/types";
import { copyListToClipboard } from "@/lib/export";

export default function ExportButton({ categories }: { categories: CategoryWithItems[] }) {
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    await copyListToClipboard(categories);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-ink/70 shadow-card transition hover:text-violet"
    >
      <span aria-hidden>{copied ? "✓" : "⇪"}</span>
      {copied ? "Copié pour Notes" : "Exporter vers Notes"}
    </button>
  );
}
