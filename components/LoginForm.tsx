"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-medium text-ink">Courses à deux</h1>
        <p className="mt-2 text-sm text-ink/60">
          Votre liste de courses, partagée avec votre moitié.
        </p>

        {sent ? (
          <p className="mt-6 rounded-xl bg-violet-soft px-4 py-3 text-sm text-violet-deep">
            Lien envoyé ✉️ Ouvrez votre boîte mail pour vous connecter.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full rounded-full border border-ink/10 bg-paper px-4 py-2.5 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-violet to-pink py-2.5 text-sm font-semibold text-white shadow-card"
            >
              Recevoir mon lien de connexion
            </button>
            {error && <p className="text-xs text-pink">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
