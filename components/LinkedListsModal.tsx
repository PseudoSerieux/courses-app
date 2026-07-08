"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type HistoryEntry = { list_id: string };
type MemberEntry = { user_id: string; email: string };

type LinkedListsModalProps = {
  open: boolean;
  onClose: () => void;
  ownListId: string;
  activeListId: string;
  isOwnerOfActiveList: boolean;
  currentUserId: string;
  prefillListId?: string;
};

function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-ink/10 bg-paper px-3 py-2 text-left font-mono text-xs text-ink/70 transition hover:border-violet/40"
      title="Copier"
    >
      <span className="min-w-0 flex-1 truncate">{value}</span>
      <span className="shrink-0 text-violet">{copied ? "✓ Copié" : "⧉ Copier"}</span>
    </button>
  );
}

export default function LinkedListsModal({
  open,
  onClose,
  ownListId,
  activeListId,
  isOwnerOfActiveList,
  currentUserId,
  prefillListId,
}: LinkedListsModalProps) {
  const supabase = createClient();
  const [targetId, setTargetId] = useState(prefillListId ?? "");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTargetId(prefillListId ?? "");
    setError(null);
    (async () => {
      const { data } = await supabase
        .from("list_members")
        .select("list_id")
        .order("created_at", { ascending: true });
      setHistory((data ?? []).filter((row) => row.list_id !== activeListId));

      const { data: memberData } = await supabase.rpc("list_members_info", {
        target_list_id: activeListId,
      });
      setMembers((memberData ?? []).filter((m: MemberEntry) => m.user_id !== currentUserId));
    })();
  }, [open, prefillListId, activeListId, currentUserId, supabase]);

  if (!open) return null;

  const runAndReload = async (op: PromiseLike<{ error: { message?: string } | null }>) => {
    setError(null);
    setLoading(true);
    const { error: rpcError } = await op;
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message ?? "Une erreur est survenue, réessayez.");
      return;
    }
    window.location.reload();
  };

  const handleLink = () => {
    const trimmed = targetId.trim();
    if (!trimmed) return;
    runAndReload(supabase.rpc("link_to_list", { target_list_id: trimmed }));
  };

  const handleUnlink = () => {
    runAndReload(supabase.rpc("unlink_active_list"));
  };

  const handleKick = async (userId: string) => {
    setError(null);
    const { error: rpcError } = await supabase.rpc("kick_member", {
      target_user_id: userId,
      target_list_id: activeListId,
    });
    if (rpcError) {
      setError(rpcError.message ?? "Une erreur est survenue, réessayez.");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
  };

  const isOnOwnDefaultList = activeListId === ownListId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl2 bg-white p-6 shadow-pop animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg text-ink">Listes liées</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 rounded-full p-1 text-ink/40 hover:bg-ink/5"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-xs uppercase tracking-wide text-ink/40">
          Cette liste (à partager)
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 basis-full sm:basis-auto">
            <CopyableId value={activeListId} />
          </div>
          {!isOnOwnDefaultList && (
            <button
              onClick={handleUnlink}
              disabled={loading}
              className="shrink-0 rounded-full bg-pink-soft px-3 py-2 text-xs font-semibold text-pink hover:bg-pink hover:text-white disabled:opacity-50"
            >
              Se délier
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-ink/40">
          {isOwnerOfActiveList
            ? "C'est l'une de vos listes."
            : "Vous êtes lié·e à cette liste, ce n'est pas la vôtre."}
        </p>

        {isOwnerOfActiveList && (
          <>
            <div className="my-5 h-px bg-ink/10" />
            <p className="text-xs uppercase tracking-wide text-ink/40">
              Personnes sur cette liste
            </p>
            {members.length > 0 ? (
              <ul className="mt-1.5 space-y-1.5">
                {members.map((member) => (
                  <li
                    key={member.user_id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-ink/10 bg-paper px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs text-ink/70">
                      {member.email}
                    </span>
                    <button
                      onClick={() => handleKick(member.user_id)}
                      className="shrink-0 rounded-full bg-pink-soft px-3 py-1.5 text-xs font-semibold text-pink hover:bg-pink hover:text-white"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-ink/40">Personne d&apos;autre pour l&apos;instant.</p>
            )}
          </>
        )}

        <div className="my-5 h-px bg-ink/10" />

        <p className="text-xs uppercase tracking-wide text-ink/40">
          Se lier à une autre liste
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Collez un identifiant de liste"
            className="min-w-0 flex-1 basis-full rounded-full border border-ink/10 bg-paper px-4 py-2 text-xs outline-none focus:border-violet focus:ring-2 focus:ring-violet/30 sm:basis-auto"
            onKeyDown={(e) => e.key === "Enter" && handleLink()}
          />
          <button
            onClick={handleLink}
            disabled={loading || !targetId.trim()}
            className="shrink-0 rounded-full bg-violet px-4 py-2 text-xs font-semibold text-white shadow-card hover:bg-violet-deep disabled:opacity-40"
          >
            Se lier
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-pink">{error}</p>}

        {history.length > 0 && (
          <>
            <p className="mt-5 text-xs uppercase tracking-wide text-ink/40">
              Historique des listes liées
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {history.map((entry) => (
                <li key={entry.list_id} className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <CopyableId value={entry.list_id} />
                  </div>
                  {entry.list_id !== activeListId && (
                    <button
                      onClick={() =>
                        runAndReload(
                          supabase.rpc("link_to_list", { target_list_id: entry.list_id })
                        )
                      }
                      disabled={loading}
                      className="shrink-0 rounded-full bg-violet-soft px-3 py-2 text-xs font-semibold text-violet-deep hover:bg-violet hover:text-white disabled:opacity-50"
                    >
                      Y retourner
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
