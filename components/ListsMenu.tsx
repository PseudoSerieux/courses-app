"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ListInfo } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";

type ListsMenuProps = {
  activeListId: string;
  ownListId: string;
};

export default function ListsMenu({ activeListId, ownListId }: ListsMenuProps) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListInfo[]>([]);
  const [newName, setNewName] = useState("");
  const [listToDelete, setListToDelete] = useState<ListInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    setError(null);
    (async () => {
      const { data } = await supabase.rpc("my_lists");
      setLists((data as ListInfo[]) ?? []);
    })();
  }, [open, supabase]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSwitch = async (listId: string) => {
    if (listId === activeListId) return;
    setLoading(true);
    const { error: rpcError } = await supabase.rpc("switch_active_list", {
      target_list_id: listId,
    });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    window.location.reload();
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("create_list", { list_name: name });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    window.location.reload();
  };

  const confirmDelete = async () => {
    if (!listToDelete) return;
    setLoading(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("delete_list", {
      target_list_id: listToDelete.id,
    });
    setLoading(false);
    setListToDelete(null);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    window.location.reload();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Vos listes"
        aria-expanded={open}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg shadow-card transition hover:text-violet"
      >
        ☰
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl2 bg-white p-4 shadow-pop animate-pop-in">
          <p className="text-xs uppercase tracking-wide text-ink/40">Vos listes</p>

          <ul className="mt-2 space-y-1.5">
            {lists.map((list) => {
              const isDefault = list.id === ownListId;
              const isActive = list.id === activeListId;
              return (
                <li key={list.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleSwitch(list.id)}
                    disabled={loading}
                    className={`flex-1 truncate rounded-xl px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? "bg-violet text-white"
                        : "bg-paper text-ink hover:bg-violet-soft"
                    }`}
                  >
                    {list.name}
                    {isDefault && <span className="ml-1 text-xs opacity-60">(défaut)</span>}
                  </button>
                  {!isDefault && (
                    <button
                      onClick={() => setListToDelete(list)}
                      aria-label={`Supprimer ${list.name}`}
                      className="shrink-0 rounded-full p-1.5 text-ink/30 hover:bg-pink-soft hover:text-pink"
                    >
                      🗑
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="my-3 h-px bg-ink/10" />

          <p className="text-xs uppercase tracking-wide text-ink/40">Créer une nouvelle liste</p>
          <div className="mt-1.5 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex. Bricolage"
              className="min-w-0 flex-1 rounded-full border border-ink/10 bg-paper px-3 py-2 text-xs outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={loading || !newName.trim()}
              className="shrink-0 rounded-full bg-violet px-3 py-2 text-xs font-semibold text-white shadow-card hover:bg-violet-deep disabled:opacity-40"
            >
              Créer
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-pink">{error}</p>}
        </div>
      )}

      <ConfirmDialog
        open={listToDelete !== null}
        title={`Supprimer "${listToDelete?.name}" ?`}
        description="Toutes ses catégories et ses articles seront supprimés définitivement, pour vous et pour toute personne qui y était liée."
        onConfirm={confirmDelete}
        onCancel={() => setListToDelete(null)}
      />
    </div>
  );
}
