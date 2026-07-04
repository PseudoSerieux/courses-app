"use client";

import type { CategoryWithItems, Item } from "@/lib/types";
import ItemRow from "./ItemRow";
import AddItemInline from "./AddItemInline";

type CategoryCardProps = {
  category: CategoryWithItems;
  onToggleCollapse: (category: CategoryWithItems) => void;
  onEdit: (category: CategoryWithItems) => void;
  onDelete: (category: CategoryWithItems) => void;
  onAddItem: (category: CategoryWithItems, name: string) => void;
  onToggleItem: (item: Item) => void;
  onRenameItem: (item: Item, newName: string) => void;
  onDeleteItem: (item: Item) => void;
};

export default function CategoryCard({
  category,
  onToggleCollapse,
  onEdit,
  onDelete,
  onAddItem,
  onToggleItem,
  onRenameItem,
  onDeleteItem,
}: CategoryCardProps) {
  const isOpen = !category.is_collapsed;
  const remaining = category.items.filter((i) => !i.is_checked).length;

  return (
    <section className="overflow-hidden rounded-xl2 bg-white shadow-card">
      <div className="group flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => onToggleCollapse(category)}
          className="flex flex-1 items-center gap-2.5 text-left"
          aria-expanded={isOpen}
        >
          <span className="text-xl leading-none">{category.emoji}</span>
          <span className="font-display text-base font-medium text-ink">
            {category.name}
          </span>
          {remaining > 0 && (
            <span className="rounded-full bg-violet-soft px-2 py-0.5 text-xs font-semibold text-violet-deep">
              {remaining}
            </span>
          )}
          <svg
            className={`ml-auto h-4 w-4 shrink-0 text-ink/40 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="none"
          >
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onEdit(category)}
            aria-label="Modifier la catégorie"
            className="rounded-full p-1.5 text-ink/40 hover:bg-violet-soft hover:text-violet"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(category)}
            aria-label="Supprimer la catégorie"
            className="rounded-full p-1.5 text-ink/40 hover:bg-pink-soft hover:text-pink"
          >
            🗑
          </button>
        </div>
      </div>

      <div className={`collapse-grid ${isOpen ? "is-open" : ""}`}>
        <div>
          <ul className="space-y-0.5 px-2 pb-2">
            {category.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                onRename={onRenameItem}
                onDelete={onDeleteItem}
              />
            ))}
          </ul>
          <div className="pb-3">
            <AddItemInline onAdd={(name) => onAddItem(category, name)} />
          </div>
        </div>
      </div>
    </section>
  );
}
