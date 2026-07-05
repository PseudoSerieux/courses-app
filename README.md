# Courses à deux 🛒

Liste de courses partagée en temps réel, avec catégories repliables et export vers l'app Notes.

## Stack

- **Next.js 14** (App Router, RSC + Server Actions-ready)
- **Supabase** : Postgres, Auth (email + mot de passe), Realtime
- **Tailwind CSS**
- **Vercel** pour le déploiement (tier gratuit)

## Mise en route

### 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → New project (gratuit).
2. Dans **SQL Editor**, colle le contenu de `supabase/schema.sql` et exécute-le. Ça crée les tables, les policies RLS (pour que seuls les membres d'une liste puissent la voir/modifier) et active le Realtime sur `categories` et `items`.
3. Dans **Authentication → Providers**, l'auth par email (magic link) est activée par défaut, rien à faire.
4. Dans **Authentication → Providers → Email**, **décoche "Confirm email"**. C'est important : cette app n'utilise plus aucun lien envoyé par email (ni pour l'inscription, ni pour rejoindre une liste), donc l'email de confirmation n'a plus de destination — le désactiver rend l'inscription instantanée, sans dépendre du service d'envoi de mails.
5. Récupère `Project URL` et la **Publishable key** dans **Settings → API Keys** (Supabase a renommé l'ancienne "anon key" en "publishable key", préfixe `sb_publishable_...`).

### 2. Config locale

```bash
cp .env.local.example .env.local
# colle tes clés Supabase dedans
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000), connecte-toi par lien magique. Une liste "Courses" avec 3 catégories de démo (Viandes, Fruits, Conserves) est créée automatiquement.

### 3. Inviter ton copain / ta copine

Chacun crée son propre compte (email + mot de passe, instantané puisque la confirmation d'email est désactivée). Chaque compte a sa **propre liste permanente**. Pour partager la même liste :

1. Ouvre le bouton **🪢 Listes liées** en haut de l'app
2. Copie ton **identifiant de liste** ("Votre lien")
3. Envoie-le à ton copain par n'importe quel moyen (SMS, Discord, peu importe)
4. Il colle cet identifiant dans le champ "Se lier à une autre liste" chez lui, et bascule dessus

Se délier ne supprime rien : chacun retrouve instantanément sa propre liste intacte via le bouton "Se délier", et l'historique garde une trace de toutes les listes déjà liées pour y revenir en un clic.

### 4. Déployer sur Vercel

1. Push ce repo sur GitHub.
2. Sur [vercel.com](https://vercel.com), importe le repo.
3. Ajoute les mêmes variables d'env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
4. Ajoute l'URL Vercel dans les Redirect URLs Supabase (`https://ton-app.vercel.app/auth/callback`).

## Ce qui est fait ✅

- CRUD catégories (ajout / renommage / suppression **avec confirmation**)
- Catégories repliables, animation fluide sans recalcul JS (grid-rows trick), pas de scroll inutile
- CRUD éléments (ajout / renommage inline / suppression **sans confirmation**)
- Coche = barré, avec petite animation "tampon"
- Synchro simultanée entre les deux comptes via Supabase Realtime
- Export en un clic : copie une version texte formatée dans le presse-papier, prête à coller dans Notes (iOS/Android)
- Auth par email + mot de passe (instantanée, pas de mail requis) + liaison entre listes par simple identifiant, réversible sans perte de données

## Pistes pour la suite 🌱

- Drag & drop pour réordonner catégories/éléments
- Suggestions/auto-complétion des éléments récents
- Bouton "annuler" (undo) après suppression/coche, en plus de la confirmation sur les catégories
- Swipe-to-delete sur mobile
- Passage en PWA installable
- Menu hamburger en haut à droite (prévu dès maintenant : l'espace est laissé libre) pour gérer plusieurs listes
