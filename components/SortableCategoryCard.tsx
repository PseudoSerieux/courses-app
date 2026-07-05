"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CategoryCard from "./CategoryCard";
import type { CategoryWithItems, Item } from "@/lib/types";

type SortableCategoryCardProps = {
  category: CategoryWithItems;
  onToggleCollapse: (category: CategoryWithItems) => void;
  onEdit: (category: CategoryWithItems) => void;
  onDelete: (category: CategoryWithItems) => void;
  onAddItem: (category: CategoryWithItems, name: string) => void;
  onToggleItem: (item: Item) => void;
  onRenameItem: (item: Item, newName: string) => void;
  onDeleteItem: (item: Item) => void;
};

export default function SortableCategoryCard(props: SortableCategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.category.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : "auto",
        position: "relative",
      }}
    >
      <CategoryCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}
