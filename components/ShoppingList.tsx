"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryWithItems, Item } from "@/lib/types";
import CategoryCard from "./CategoryCard";
import CategoryModal from "./CategoryModal";
import ConfirmDialog from "./ConfirmDialog";
import SettingsMenu from "./SettingsMenu";
import LinkedListsModal from "./LinkedListsModal";
import Toast, { type ToastState } from "./Toast";

type ShoppingListProps = {
  activeListId: string;
  ownListId: string;
  currentUserId: string;
  prefillJoinId?: string;
};

const DELETE_GRACE_PERIOD_MS = 5000;

export default function ShoppingList({
  activeListId,
  ownListId,
  currentUserId,
  prefillJoinId,
}: ShoppingListProps) {
  const listId = activeListId;
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [modalCategory, setModalCategory] = useState<Category | null | "new">(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(Boolean(prefillJoinId));
  const [toast, setToast] = useState<ToastState>(null);

  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
        { event: "*", schema: "public", table: "items", filter: `list_id=eq.${listId}` },
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

  // Detects being unlinked/kicked from elsewhere (another tab, or the list
  // owner removing you) and reloads so the server picks up the new active list.
  useEffect(() => {
    const channel = supabase
      .channel(`profile-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const incoming = payload.new as { active_list_id: string };
          if (incoming.active_list_id !== activeListId) {
            window.location.reload();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId, activeListId]);

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
      const id = crypto.randomUUID();
      const position = categories.length;
      const optimistic: Category = {
        id,
        list_id: listId,
        name,
        emoji,
        position,
        is_collapsed: false,
        created_at: new Date().toISOString(),
      };
      setCategories((prev) => [...prev, optimistic]);
      const { error } = await supabase
        .from("categories")
        .insert({ id, list_id: listId, name, emoji, position });
      if (error) setCategories((prev) => prev.filter((c) => c.id !== id));
    } else if (modalCategory) {
      const { id } = modalCategory;
      const previous = { name: modalCategory.name, emoji: modalCategory.emoji };
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name, emoji } : c)));
      await supabase.from("categories").update({ name, emoji }).eq("id", id);
      setToast({
        message: "Catégorie modifiée",
        onUndo: async () => {
          setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...previous } : c))
          );
          await supabase.from("categories").update(previous).eq("id", id);
        },
      });
    }
    setModalCategory(null);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const category = categoryToDelete;
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
    setCategoryToDelete(null);

    const timeout = setTimeout(async () => {
      pendingDeletes.current.delete(category.id);
      await supabase.from("categories").delete().eq("id", category.id);
    }, DELETE_GRACE_PERIOD_MS);
    pendingDeletes.current.set(category.id, timeout);

    setToast({
      message: `"${category.name}" supprimée`,
      onUndo: () => {
        const pending = pendingDeletes.current.get(category.id);
        if (pending) {
          clearTimeout(pending);
          pendingDeletes.current.delete(category.id);
        }
        setCategories((prev) =>
          prev.some((c) => c.id === category.id) ? prev : [...prev, category]
        );
      },
    });
  };

  // --- Item handlers ---
  const addItem = async (category: Category, name: string) => {
    const id = crypto.randomUUID();
    const position = items.filter((i) => i.category_id === category.id).length;
    const optimistic: Item = {
      id,
      category_id: category.id,
      list_id: listId,
      name,
      is_checked: false,
      position,
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [...prev, optimistic]);
    const { error } = await supabase
      .from("items")
      .insert({ id, category_id: category.id, list_id: listId, name, position });
    if (error) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleItem = async (item: Item) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_checked: !i.is_checked } : i))
    );
    await supabase.from("items").update({ is_checked: !item.is_checked }).eq("id", item.id);
  };

  const renameItem = async (item: Item, newName: string) => {
    const previousName = item.name;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, name: newName } : i)));
    await supabase.from("items").update({ name: newName }).eq("id", item.id);
    setToast({
      message: "Élément renommé",
      onUndo: async () => {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, name: previousName } : i))
        );
        await supabase.from("items").update({ name: previousName }).eq("id", item.id);
      },
    });
  };

  const deleteItem = (item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    const timeout = setTimeout(async () => {
      pendingDeletes.current.delete(item.id);
      await supabase.from("items").delete().eq("id", item.id);
    }, DELETE_GRACE_PERIOD_MS);
    pendingDeletes.current.set(item.id, timeout);

    setToast({
      message: `"${item.name}" supprimé`,
      onUndo: () => {
        const pending = pendingDeletes.current.get(item.id);
        if (pending) {
          clearTimeout(pending);
          pendingDeletes.current.delete(item.id);
        }
        setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]));
      },
    });
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
      <header className="mb-5 flex items-center justify-between gap-2">
        <h1 className="rounded-full bg-gradient-to-r from-violet to-pink px-5 py-2 font-display text-lg font-semibold text-white shadow-card">
          Courses
        </h1>
        <SettingsMenu
          categories={categoriesWithItems}
          onOpenLinkedLists={() => setLinkModalOpen(true)}
          onExported={() => setToast({ message: "Copié pour Notes 📋" })}
        />
      </header>

      {activeListId !== ownListId && (
        <button
          onClick={() => setLinkModalOpen(true)}
          className="mb-4 flex w-full items-center gap-2 rounded-xl bg-violet-soft px-4 py-2.5 text-left text-xs font-medium text-violet-deep transition hover:bg-violet/20"
        >
          <span aria-hidden>🪢</span>
          Vous consultez une liste liée, pas la vôtre — touchez ici pour gérer
        </button>
      )}

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
        key={modalCategory === "new" ? "new" : modalCategory?.id ?? "closed"}
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

      <LinkedListsModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        ownListId={ownListId}
        activeListId={activeListId}
        currentUserId={currentUserId}
        prefillListId={prefillJoinId}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
