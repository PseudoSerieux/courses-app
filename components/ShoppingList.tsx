"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryWithItems, Item } from "@/lib/types";
import CategoryCard from "./CategoryCard";
import CategoryModal from "./CategoryModal";
import ConfirmDialog from "./ConfirmDialog";
import ExportButton from "./ExportButton";

export default function ShoppingList({ listId }: { listId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [modalCategory, setModalCategory] = useState<Category | null | "new">(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Initial load
  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .eq("list_id", listId)
        .order("position", { ascending: true });
      const { data: allItems } = await supabase
        .from("items")
        .select("*")
        .in("category_id", (cats ?? []).map((c) => c.id))
        .order("position", { ascending: true });

      setCategories(cats ?? []);
      setItems(allItems ?? []);
    })();
  }, [supabase, listId]);

  // Realtime sync: any change from either partner is reflected instantly
  useEffect(() => {
    const channel = supabase
      .channel(`list-${listId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `list_id=eq.${listId}` },
        (payload) => {
          setCategories((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((c) => c.id !== payload.old.id);
            }
            const incoming = payload.new as Category;
            const exists = prev.some((c) => c.id === incoming.id);
            return exists
              ? prev.map((c) => (c.id === incoming.id ? incoming : c))
              : [...prev, incoming].sort((a, b) => a.position - b.position);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((i) => i.id !== payload.old.id);
            }
            const incoming = payload.new as Item;
            const exists = prev.some((i) => i.id === incoming.id);
            return exists
              ? prev.map((i) => (i.id === incoming.id ? incoming : i))
              : [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, listId]);

  const categoriesWithItems: CategoryWithItems[] = categories.map((c) => ({
    ...c,
    items: items.filter((i) => i.category_id === c.id).sort((a, b) => a.position - b.position),
  }));

  // --- Category handlers ---
  const toggleCollapse = async (category: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, is_collapsed: !c.is_collapsed } : c))
    );
    await supabase
      .from("categories")
      .update({ is_collapsed: !category.is_collapsed })
      .eq("id", category.id);
  };

  const saveCategory = async (name: string, emoji: string) => {
    if (modalCategory === "new") {
      const position = categories.length;
      await supabase.from("categories").insert({ list_id: listId, name, emoji, position });
    } else if (modalCategory) {
      await supabase.from("categories").update({ name, emoji }).eq("id", modalCategory.id);
    }
    setModalCategory(null);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    await supabase.from("categories").delete().eq("id", categoryToDelete.id);
    setCategoryToDelete(null);
  };

  // --- Item handlers ---
  const addItem = async (category: Category, name: string) => {
    const position = items.filter((i) => i.category_id === category.id).length;
    await supabase.from("items").insert({ category_id: category.id, name, position });
  };

  const toggleItem = async (item: Item) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_checked: !i.is_checked } : i))
    );
    await supabase.from("items").update({ is_checked: !item.is_checked }).eq("id", item.id);
  };

  const renameItem = async (item: Item, newName: string) => {
    await supabase.from("items").update({ name: newName }).eq("id", item.id);
  };

  const deleteItem = async (item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await supabase.from("items").delete().eq("id", item.id);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="rounded-full bg-gradient-to-r from-violet to-pink px-5 py-2 font-display text-lg font-semibold text-white shadow-card">
          Courses
        </h1>
        <ExportButton categories={categoriesWithItems} />
      </header>

      <div className="space-y-3">
        {categoriesWithItems.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onToggleCollapse={toggleCollapse}
            onEdit={(c) => setModalCategory(c)}
            onDelete={(c) => setCategoryToDelete(c)}
            onAddItem={addItem}
            onToggleItem={toggleItem}
            onRenameItem={renameItem}
            onDeleteItem={deleteItem}
          />
        ))}
      </div>

      <button
        onClick={() => setModalCategory("new")}
        className="mt-4 w-full rounded-xl2 border-2 border-dashed border-violet/25 py-3 text-sm font-medium text-violet/70 transition hover:border-violet/50 hover:bg-violet-soft/40"
      >
        + Ajouter une catégorie
      </button>

      <CategoryModal
        open={modalCategory !== null}
        initialName={modalCategory && modalCategory !== "new" ? modalCategory.name : ""}
        initialEmoji={modalCategory && modalCategory !== "new" ? modalCategory.emoji : "📦"}
        onSave={saveCategory}
        onCancel={() => setModalCategory(null)}
      />

      <ConfirmDialog
        open={categoryToDelete !== null}
        title={`Supprimer "${categoryToDelete?.name}" ?`}
        description="Tous les éléments de cette catégorie seront supprimés définitivement."
        onConfirm={confirmDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
