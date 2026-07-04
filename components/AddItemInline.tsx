"use client";

import { useState } from "react";

type AddItemInlineProps = {
  onAdd: (name: string) => void;
};

export default function AddItemInline({ onAdd }: AddItemInlineProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className="flex items-center gap-2 px-2 pt-1">
      <span className="text-mist">+</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Ajouter un élément"
        className="w-full bg-transparent py-1 text-sm text-ink/60 placeholder:text-ink/35 outline-none focus:text-ink"
      />
    </div>
  );
}
