# Setup pas-à-pas — Landing Maxline Studio

> Ce document liste les **actions humaines** à faire pour mettre la landing en ligne sur `maxlinestudio.fr`. Suivre dans l'ordre. Temps total estimé : **2-3 heures** la 1ère fois.

---

## ✅ Pré-requis

- [ ] Node.js 20+ installé (`node --version`)
- [ ] npm ou pnpm installé
- [ ] Git installé et configuré (`git config --global user.name`, `user.email`)
- [ ] Un compte email pro pour les services (idéalement `tech@maxlinestudio.fr` ou similaire)

---

## Étape 1 — GitHub (15 min)

1. Aller sur [github.com](https://github.com) → créer un compte (ou se connecter)
2. Activer la 2FA obligatoirement : Settings → Security → 2FA
3. Créer un repo **privé** `maxline-landing`
4. Configurer une SSH key :
   ```powershell
   ssh-keygen -t ed25519 -C "tech@maxlinestudio.fr"
   ```
   Copier le contenu de `~/.ssh/id_ed25519.pub` et le coller dans GitHub → Settings → SSH and GPG keys.

5. Initialiser le repo local depuis le dossier `code/landing/` :
   ```powershell
   cd "C:\Users\metal\Desktop\Nouveau Projet\By Caption\code\landing"
   git init
   git add .
   git commit -m "feat: initial landing setup"
   git branch -M main
   git remote add origin git@github.com:VOTRE-USER/maxline-landing.git
   git push -u origin main
   ```

---

## Étape 2 — Supabase (20 min)

1. Aller sur [supabase.com](https://supabase.com) → "Start your project" (login GitHub)
2. **New Project** :
   - Name : `maxline-prod`
   - Database Password : **généré fort, sauvegardé dans Bitwarden**
   - Region : **`Europe (Frankfurt) eu-central-1`** (RGPD)
   - Plan : Free
3. Attendre ~2 min la création.

### Exécuter la migration

4. Aller dans **SQL Editor** → New Query
5. Coller le contenu du fichier `supabase/migrations/001_waitlist.sql`
6. Cliquer **Run** (en bas à droite)
7. Vérifier dans **Table Editor** que la table `waitlist` existe.

### Récupérer les clés API

8. Aller dans **Project Settings → API**
9. Noter :
   - **Project URL** : `https://xxxxx.supabase.co` → variable `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → variable `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** secret key → variable `SUPABASE_SERVICE_ROLE_KEY` ⚠️ NE JAMAIS commit
10. **Sauvegarder dans Bitwarden** immédiatement.

---

## Étape 3 — Resend (15 min)

1. Aller sur [resend.com](https://resend.com) → "Sign up" (login GitHub possible)
2. **Add Domain** → `maxlinestudio.fr`
3. Resend affiche les DNS records à ajouter (SPF, DKIM, DMARC) — à ajouter sur Cloudflare (voir étape 5)
4. Une fois le domaine vérifié (≤ 15 min), créer une **API Key** :
   - Settings → API Keys → Create
   - Permission : **Send only** (jamais Full Access en prod)
   - Nom : `maxline-landing-prod`
5. Copier la clé → variable `RESEND_API_KEY` → **sauvegarder dans Bitwarden**
6. Configurer l'email d'envoi : `RESEND_FROM_EMAIL=Maxence <contact@maxlinestudio.fr>`

---

## Étape 4 — Cloudflare (DNS + protection) (30 min)

1. Aller sur [cloudflare.com](https://cloudflare.com) → créer un compte (2FA obligatoire)
2. **Add a Site** → `maxlinestudio.fr` → plan **Free**
3. Cloudflare scanne les DNS existants
4. Cloudflare donne 2 nameservers (ex: `iris.ns.cloudflare.com`, `wally.ns.cloudflare.com`)
5. Aller dans Hostinger → Domains → Manage → **Change Nameservers** → remplacer par les nameservers Cloudflare
6. Attendre la propagation (2-24 h, généralement < 1 h)

### Ajouter les DNS pour Resend

7. Dans Cloudflare DNS → ajouter les records SPF/DKIM/DMARC fournis par Resend
8. Statut "verified" dans Resend ≤ 15 min après

### Sécurité

9. Activer **Always Use HTTPS** : SSL/TLS → Edge Certificates → Always Use HTTPS = ON
10. Activer **Auto Minify** : Speed → Optimization → Auto Minify (JS, CSS, HTML)
11. **Bot Fight Mode** : Security → Bots → activer

---

## Étape 5 — Vercel (déploiement) (20 min)

1. Aller sur [vercel.com](https://vercel.com) → "Sign Up" (login GitHub)
2. **Import Project** → sélectionner le repo `maxline-landing`
3. Framework Preset : Next.js (auto-détecté)
4. **Variables d'environnement** : ajouter toutes celles de `.env.example` avec leurs vraies valeurs
5. **Deploy** → premier déploiement (1-2 min)
6. Vercel donne une URL `maxline-landing-xxx.vercel.app` → tester que tout fonctionne

### Configurer le domaine custom

7. Project → **Settings → Domains** → Add `maxlinestudio.fr`
8. Vercel donne 1 record `A` (ou `CNAME` pour `www`) → l'ajouter dans Cloudflare DNS
9. Attendre la propagation + activation SSL auto (~5 min)
10. Tester `https://maxlinestudio.fr` — doit afficher la landing

### Configurer le sous-domaine www (optionnel)

11. Sur Vercel, ajouter aussi `www.maxlinestudio.fr` avec redirection 301 vers `maxlinestudio.fr`

---

## Étape 6 — Tests post-déploiement (15 min)

Une fois en ligne sur `https://maxlinestudio.fr`, tester :

- [ ] La landing s'affiche correctement (desktop)
- [ ] La landing s'affiche correctement (mobile — Chrome DevTools)
- [ ] Le formulaire d'inscription fonctionne :
   - [ ] Soumission valide : message de succès s'affiche
   - [ ] Email reçu de confirmation
   - [ ] Notification email reçue côté admin
   - [ ] Email présent dans Supabase Table Editor → `waitlist`
- [ ] Email invalide : message d'erreur affiché
- [ ] Réinscription du même email : pas de doublon en DB
- [ ] Pages légales accessibles (`/legal/mentions`, `/legal/confidentialite`, `/legal/cookies`)
- [ ] Lighthouse Mobile : Performance > 80, Accessibility > 95
- [ ] Tester sur 2-3 vrais devices (iPhone, Android, tablette)

---

## Étape 7 — SEO et lancement (5 min)

1. Créer une OG image (1200×630 px) — un visuel sobre avec le wordmark, à mettre dans `public/og-default.png`
2. Créer un favicon — à mettre dans `public/favicon.ico` (16×16, 32×32) + `public/apple-touch-icon.png` (180×180)
3. Soumettre l'URL à Google Search Console : https://search.google.com/search-console
4. Soumettre à Bing Webmaster Tools (bonus)

---

## Variables d'environnement — Référence

À configurer dans Vercel Project Settings → Environment Variables :

| Variable | Source | Visibilité |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Production + Preview + Dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Production + Preview + Dev |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role | **Production uniquement** |
| `RESEND_API_KEY` | Resend API key | Production uniquement |
| `RESEND_FROM_EMAIL` | `Maxence <contact@maxlinestudio.fr>` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://maxlinestudio.fr` | Production |
| `ADMIN_NOTIFY_EMAIL` | Ton email perso | Production uniquement |

---

## Maintenance hebdomadaire

Une fois en ligne :

- [ ] Vérifier les emails d'inscription reçus
- [ ] Vérifier dans Supabase que les inscriptions remontent correctement
- [ ] Vérifier Vercel Analytics (inclus dans free tier) — volume de visites
- [ ] Vérifier Cloudflare Analytics — trafic, attaques bloquées
- [ ] Lire les emails reçus sur `contact@maxlinestudio.fr` (configuration Hostinger Mail)

---

## En cas de problème

| Symptôme | Action |
|---|---|
| Le site ne charge pas | Vérifier propagation DNS (whatsmydns.net), Vercel logs |
| Le formulaire ne marche pas | Vérifier les Vercel logs (Function logs), `SUPABASE_SERVICE_ROLE_KEY` |
| Pas d'email de confirmation reçu | Vérifier que le domaine Resend est "Verified", clé API valide |
| Notification admin ne marche pas | Vérifier `ADMIN_NOTIFY_EMAIL`, vérifier les spams |
| Erreur Supabase 500 | Vérifier que la migration `001_waitlist.sql` a bien été exécutée |

---

## Quand passer à la landing officielle (post-lancement)

Voir [README.md](README.md) section "Au lancement officiel" pour les modifications nécessaires (~30 min de modifications).

---

## Checklist finale

- [ ] Repo GitHub privé créé et code pushé
- [ ] Supabase projet créé en région Europe + migration exécutée
- [ ] Resend domaine vérifié + API key créée
- [ ] Cloudflare DNS migré depuis Hostinger
- [ ] Vercel déployé avec variables d'env
- [ ] Domaine `maxlinestudio.fr` pointe vers Vercel
- [ ] HTTPS actif (cadenas vert dans le navigateur)
- [ ] Formulaire testé E2E
- [ ] Bitwarden contient toutes les clés API et mots de passe

Si toutes les cases sont cochées : **la landing est en ligne et opérationnelle.** 🚀
