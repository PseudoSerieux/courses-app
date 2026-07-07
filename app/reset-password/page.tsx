"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: "error", text: "Le mot de passe doit faire au moins 6 caractères." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "info", text: "Mot de passe mis à jour ✅ Redirection…" });
    setTimeout(() => {
      window.location.href = "/";
    }, 1200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-medium text-ink">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-ink/60">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe"
            className="w-full rounded-full border border-ink/10 bg-paper px-4 py-2.5 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
          />
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirmez le mot de passe"
            className="w-full rounded-full border border-ink/10 bg-paper px-4 py-2.5 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-violet to-pink py-2.5 text-sm font-semibold text-white shadow-card disabled:opacity-60"
          >
            Mettre à jour
          </button>

          {message && (
            <p
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === "error" ? "bg-pink-soft text-pink" : "bg-violet-soft text-violet-deep"
              }`}
            >
              {message.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}