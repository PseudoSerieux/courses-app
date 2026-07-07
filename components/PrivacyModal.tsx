"use client";

type PrivacyModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function PrivacyModal({ open, onClose }: PrivacyModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl2 bg-white p-6 shadow-pop animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg text-ink">Confidentialité</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-ink/40 hover:bg-ink/5"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/70">
          <p>
            Cette application est un projet personnel, pensée pour un usage entre proches
            (couple, famille, amis) — pas un service commercial. Voici simplement ce qui est
            stocké, où, et pourquoi.
          </p>

          <div>
            <h3 className="font-semibold text-ink">Ce qui est enregistré</h3>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>Votre adresse email et votre mot de passe (chiffré, jamais lisible en clair)</li>
              <li>Le contenu de vos listes de courses (catégories et articles)</li>
              <li>L&apos;identifiant technique de votre compte, utilisé pour savoir quelle
                liste vous appartient et qui y a accès</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-ink">Ce qui n&apos;est pas collecté</h3>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>Aucun suivi publicitaire, aucun cookie tiers, aucune revente de données</li>
              <li>Aucune donnée de localisation, de contact, ou de navigation en dehors de l&apos;app</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-ink">Où c&apos;est hébergé</h3>
            <p className="mt-1.5">
              Les données sont hébergées par{" "}
              <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-violet underline">
                Supabase
              </a>{" "}
              (base de données et authentification) et l&apos;application est servie par{" "}
              <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-violet underline">
                Vercel
              </a>
              . Les deux sont des hébergeurs européens/conformes RGPD, avec leurs propres
              engagements de confidentialité.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink">Partage avec d&apos;autres personnes</h3>
            <p className="mt-1.5">
              Vos listes ne sont visibles que par les personnes que vous liez explicitement via
              un identifiant que vous choisissez de partager. Personne d&apos;autre n&apos;y a
              accès.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink">Vos droits</h3>
            <p className="mt-1.5">
              Vous pouvez demander la suppression de votre compte et de toutes vos données à
              tout moment en contactant la personne qui gère cette application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
