# Maxline Studio — Landing "Coming Soon"

> Landing page Next.js 15 pour Maxline Studio. Capture d'emails pré-lancement, conçue pour évoluer vers la landing officielle après lancement.

## Stack

- **Next.js 15** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** (avec CSS variables design tokens)
- **Supabase** (PostgreSQL — stockage des emails de la waitlist)
- **Resend** (envoi des emails de confirmation)
- **react-hook-form + zod** (validation formulaire)
- **Lucide Icons**

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier .env.example en .env.local
cp .env.example .env.local

# 3. Renseigner les valeurs (voir SETUP.md pour obtenir les clés)
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - RESEND_API_KEY
#    - RESEND_FROM_EMAIL
#    - ADMIN_NOTIFY_EMAIL

# 4. Exécuter la migration DB Supabase
#    Coller le contenu de supabase/migrations/001_waitlist.sql dans
#    le SQL Editor de Supabase et exécuter.

# 5. Lancer en dev
npm run dev

# 6. Ouvrir http://localhost:3000
```

## Structure

```
landing/
├── app/
│   ├── api/subscribe/route.ts   ← Endpoint capture email
│   ├── legal/                   ← Pages légales (mentions, conf., cookies)
│   ├── globals.css              ← Design tokens (CSS variables)
│   ├── layout.tsx               ← Layout racine + métadonnées
│   └── page.tsx                 ← Page d'accueil (assemblage sections)
├── components/
│   ├── ui/                      ← Composants primitifs (Button, Input, Badge)
│   ├── sections/                ← Sections de landing
│   ├── header.tsx
│   └── footer.tsx
├── lib/
│   ├── supabase.ts              ← Client serveur Supabase
│   └── utils.ts                 ← cn() (Tailwind classes merge)
├── public/                      ← Assets statiques (favicon, OG image)
├── supabase/migrations/         ← SQL à exécuter manuellement
├── .env.example                 ← Template variables d'environnement
├── next.config.ts
├── tailwind.config.ts implicite (Tailwind v4)
└── package.json
```

## Scripts disponibles

| Commande | Action |
|---|---|
| `npm run dev` | Démarre le serveur de dev (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Lance le serveur de production |
| `npm run lint` | Vérification ESLint |
| `npm run type-check` | Vérification TypeScript stricte |

## Déploiement

Voir [SETUP.md](SETUP.md) pour les instructions détaillées de déploiement Vercel + configuration domaine.

## Au lancement officiel

Pour transformer cette landing "coming soon" en landing de lancement :

1. Dans `components/sections/hero.tsx` :
   - Remplacer le badge `🚀 Prochainement` par retirer le badge ou mettre `✨ Disponible maintenant`
   - Changer le CTA "Être prévenu du lancement" en "Essayer gratuitement →"
   - Retirer le sticker "🚀 Prochainement" sur l'image
2. Dans `components/header.tsx` :
   - CTA "Être prévenu" → "Essayer gratuitement"
3. La section `subscribe` peut être conservée pour la newsletter, ou remplacée par une CTA finale d'inscription.
4. Pricing : ajouter des liens "Acheter" qui pointent vers Stripe Checkout.

Le reste de la structure est déjà en place.
