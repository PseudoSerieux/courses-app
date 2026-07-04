# Courses à deux 🛒

Liste de courses partagée en temps réel, avec catégories repliables et export vers l'app Notes.

## Stack

- **Next.js 14** (App Router, RSC + Server Actions-ready)
- **Supabase** : Postgres, Auth (magic link), Realtime
- **Tailwind CSS**
- **Vercel** pour le déploiement (tier gratuit)

## Mise en route

### 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → New project (gratuit).
2. Dans **SQL Editor**, colle le contenu de `supabase/schema.sql` et exécute-le. Ça crée les tables, les policies RLS (pour que seuls les membres d'une liste puissent la voir/modifier) et active le Realtime sur `categories` et `items`.
3. Dans **Authentication → Providers**, l'auth par email (magic link) est activée par défaut, rien à faire.
4. Dans **Authentication → URL Configuration**, ajoute `http://localhost:3000/auth/callback` (et plus tard ton URL Vercel) dans les Redirect URLs.
5. Récupère `Project URL` et `anon public key` dans **Settings → API**.

### 2. Config locale

```bash
cp .env.local.example .env.local
# colle tes clés Supabase dedans
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000), connecte-toi par lien magique. Une liste "Courses" avec 3 catégories de démo (Viandes, Fruits, Conserves) est créée automatiquement.

### 3. Inviter ton copain / ta copine

Une fois connectée, la page affiche un lien du type `http://localhost:3000?join=<list_id>`. Ton partenaire n'a qu'à ouvrir ce lien avec son propre compte (email) pour rejoindre la même liste — la synchro Realtime fait le reste.

### 4. Déployer sur Vercel

1. Push ce repo sur GitHub.
2. Sur [vercel.com](https://vercel.com), importe le repo.
3. Ajoute les mêmes variables d'env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` = ton URL Vercel finale).
4. Ajoute l'URL Vercel dans les Redirect URLs Supabase (`https://ton-app.vercel.app/auth/callback`).

## Ce qui est fait ✅

- CRUD catégories (ajout / renommage / suppression **avec confirmation**)
- Catégories repliables, animation fluide sans recalcul JS (grid-rows trick), pas de scroll inutile
- CRUD éléments (ajout / renommage inline / suppression **sans confirmation**)
- Coche = barré, avec petite animation "tampon"
- Synchro simultanée entre les deux comptes via Supabase Realtime
- Export en un clic : copie une version texte formatée dans le presse-papier, prête à coller dans Notes (iOS/Android)
- Auth par lien magique + partage de liste par simple URL

## Pistes pour la suite 🌱

- Drag & drop pour réordonner catégories/éléments
- Suggestions/auto-complétion des éléments récents
- Bouton "annuler" (undo) après suppression/coche, en plus de la confirmation sur les catégories
- Swipe-to-delete sur mobile
- Passage en PWA installable
- Menu hamburger en haut à droite (prévu dès maintenant : l'espace est laissé libre) pour gérer plusieurs listes
