"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (!data.session) {
        setMessage({
          type: "info",
          text: "Compte créé ✉️ Confirmez votre email (un lien vous a été envoyé), puis connectez-vous avec votre mot de passe.",
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: "error", text: error.message });
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-medium text-ink">Courses à deux</h1>
        <p className="mt-2 text-sm text-ink/60">
          Votre liste de courses, partagée avec votre moitié.
        </p>

        <div className="mt-6 flex rounded-full bg-paper p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setMessage(null);
            }}
            className={`flex-1 rounded-full py-1.5 transition ${
              mode === "signin" ? "bg-white text-violet shadow-card" : "text-ink/50"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage(null);
            }}
            className={`flex-1 rounded-full py-1.5 transition ${
              mode === "signup" ? "bg-white text-violet shadow-card" : "text-ink/50"
            }`}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full rounded-full border border-ink/10 bg-paper px-4 py-2.5 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full rounded-full border border-ink/10 bg-paper px-4 py-2.5 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-violet to-pink py-2.5 text-sm font-semibold text-white shadow-card disabled:opacity-60"
          >
            {mode === "signin" ? "Se connecter" : "Créer mon compte"}
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