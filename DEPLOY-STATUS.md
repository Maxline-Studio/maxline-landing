# État du déploiement — Landing Maxline

> ⚠️ **Document historique** (mise en ligne initiale). Le produit est désormais live en prod (www.maxlinestudio.fr). Pour l'état réel et à jour du projet, voir la mémoire auto et les docs de cadrage `02-strategie/`.
>
> Document de statut. Mis à jour au fur et à mesure des étapes du déploiement initial.

---

## ✅ Ce qui est FAIT

### Supabase

- ✅ **Projet identifié** : `Maxline-Studio` (ID `zkghkgkvoyqrtvnzypyo`)
- ✅ **Région** : `eu-west-1` (Irlande, UE — RGPD compatible)
- ✅ **Status** : `ACTIVE_HEALTHY`
- ✅ **Migration `create_waitlist_table` appliquée** :
  - Table `public.waitlist` créée (id, email, source, ip_hash, user_agent, subscribed_at, ...)
  - Index sur `email` + `subscribed_at`
  - Contrainte unique sur `email` (anti-doublon)
  - RLS (Row Level Security) activé — seule la service_role peut lire/écrire
- ✅ **URL projet** : `https://zkghkgkvoyqrtvnzypyo.supabase.co`
- ✅ **Clé publishable** : `sb_publishable_ur85UjhL0wLEbztYjfDHpQ_TQl_md1B` (publique, OK dans le repo)

### Code local

- ✅ **Git initialisé** dans `code/landing/` sur la branche `main`
- ✅ **Premier commit créé** : `20c62af feat: initial landing page`
- ✅ **26 fichiers staged + commited**
- ✅ **Remote ajouté** : `origin → https://github.com/Maxline-Studio/maxline-landing.git`
- ✅ **`.env.example` mis à jour** avec l'URL et la clé publishable réelles

---

## 🟡 Ce qui RESTE à faire (étapes humaines)

### 1. Créer le repo GitHub (~2 minutes)

Le repo `Maxline-Studio/maxline-landing` est **introuvable** côté public — donc soit pas encore créé, soit privé sans accès anonyme.

#### Si le repo n'existe pas encore

1. Va sur https://github.com/new
2. **Owner** : `Maxline-Studio`
3. **Repository name** : `maxline-landing`
4. **Description** : `Landing page Maxline Studio — capture d'emails pré-lancement`
5. **Visibility** : Privé OU Public (privé est OK et gratuit illimité sur GitHub Free)
6. ⚠️ **NE PAS cocher** "Initialize this repository with: Add a README / .gitignore / license" → on a déjà tout en local
7. Cliquer **Create repository**

#### Si le repo existe déjà (privé)

Aucune action ici. Il faut juste s'authentifier au moment du push (étape 2).

### 2. Push le code (~1 minute)

Ouvre un **terminal Windows** (PowerShell ou Git Bash), puis :

```powershell
cd "C:\Users\metal\Desktop\Nouveau Projet\By Caption\code\landing"
git push -u origin main
```

**Au premier push**, Git Credential Manager (installé avec Git for Windows) ouvre **automatiquement ton navigateur** pour t'authentifier à GitHub.

- Si tu es déjà connecté à GitHub dans ton navigateur : 1 clic pour autoriser
- Si pas connecté : login GitHub puis autorisation
- Les credentials sont sauvegardés pour les prochains push (1 seule fois à faire)

Une fois le push fait, le repo sera visible sur https://github.com/Maxline-Studio/maxline-landing

### 3. Déployer sur Vercel (~10 minutes)

1. Aller sur https://vercel.com et se connecter avec GitHub
2. **Add New → Project** → sélectionner le repo `Maxline-Studio/maxline-landing`
3. **Root Directory** : laisser `./` (le code est à la racine)
4. **Framework Preset** : Next.js (auto-détecté)
5. **Environment Variables** — Ajouter les 7 variables suivantes :

| Variable | Valeur | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zkghkgkvoyqrtvnzypyo.supabase.co` | Public OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ur85UjhL0wLEbztYjfDHpQ_TQl_md1B` | Public OK |
| `SUPABASE_SERVICE_ROLE_KEY` | *(à récupérer — voir étape ci-dessous)* | ⚠️ Secret |
| `RESEND_API_KEY` | `re_xxx` | À créer (étape 4) |
| `RESEND_FROM_EMAIL` | `Maxence <contact@maxlinestudio.fr>` | À adapter |
| `NEXT_PUBLIC_APP_URL` | `https://maxlinestudio.fr` | |
| `ADMIN_NOTIFY_EMAIL` | `maxence.chopin@gmail.com` | Email perso pour notifs |

**Récupérer la `SUPABASE_SERVICE_ROLE_KEY`** :

1. Va sur https://supabase.com/dashboard/project/zkghkgkvoyqrtvnzypyo/settings/api
2. Section **Project API keys**
3. Repère la ligne `service_role` → cliquer **Reveal** → copier
4. ⚠️ **Cette clé est SECRÈTE** — ne jamais la commit, ne jamais la partager publiquement
5. La coller dans Vercel comme valeur de `SUPABASE_SERVICE_ROLE_KEY`

6. **Deploy** → premier déploiement (~1-2 min)
7. Tu obtiens une URL temporaire `maxline-landing-xxx.vercel.app` → tester que la landing s'affiche

### 4. Créer compte Resend pour les emails (~10 minutes)

1. Aller sur https://resend.com → "Sign up" (option "Continue with GitHub" plus simple)
2. **Add Domain** → `maxlinestudio.fr`
3. Resend affiche 3-4 records DNS (SPF, DKIM, DMARC) → à ajouter dans Cloudflare DNS (étape 5)
4. Une fois le domaine "Verified" (5-15 min après ajout DNS), créer une **API Key** :
   - Onglet "API Keys" → "Create API Key"
   - Permission : **Sending access**
   - Nom : `maxline-landing-prod`
5. Copier la clé `re_xxx...` → la mettre dans Vercel comme `RESEND_API_KEY`
6. Redéployer Vercel pour que la nouvelle variable soit prise en compte (auto si push, sinon manuel)

### 5. Migrer DNS Hostinger → Cloudflare + connecter le domaine (~30 min + propagation)

1. Créer compte Cloudflare https://cloudflare.com (gratuit, 2FA recommandée)
2. **Add a Site** → `maxlinestudio.fr` → plan Free
3. Cloudflare scanne les DNS existants chez Hostinger
4. Cloudflare donne 2 nameservers (ex: `iris.ns.cloudflare.com`)
5. Hostinger → Domains → Manage maxlinestudio.fr → **Change Nameservers** → coller ceux de Cloudflare
6. Attendre 5 min à 24 h de propagation (whatsmydns.net pour suivre)

Une fois le DNS pointe vers Cloudflare :

7. Ajouter les DNS records pour **Resend** (SPF, DKIM, DMARC) — Cloudflare → DNS → Add Record
8. Connecter le domaine custom à Vercel :
   - Vercel → Project → Settings → Domains → Add `maxlinestudio.fr`
   - Vercel donne un record `A` ou `CNAME` à ajouter dans Cloudflare DNS
9. Attendre l'activation SSL Vercel (~5 min)
10. Tester https://maxlinestudio.fr — la landing doit s'afficher

### 6. Tests E2E finaux (~10 minutes)

Sur l'URL en prod :

- [ ] La landing s'affiche correctement
- [ ] Mobile responsive (test sur téléphone réel)
- [ ] Formulaire fonctionne :
  - Soumettre un email valide → message succès
  - Vérifier email reçu chez `contact@`
  - Vérifier notification reçue chez `maxence.chopin@gmail.com`
  - Vérifier ligne ajoutée dans Supabase Table Editor → `waitlist`
- [ ] Email invalide → message d'erreur clair
- [ ] Pages légales accessibles
- [ ] HTTPS actif (cadenas vert)

---

## 📊 Récap rapide — ce que tu dois faire

| # | Action | Temps | Quand |
|---|---|---|---|
| 1 | Vérifier/créer repo GitHub `Maxline-Studio/maxline-landing` | 2 min | Maintenant |
| 2 | Lancer `git push -u origin main` dans ton terminal | 1 min | Après 1. |
| 3 | Récupérer SUPABASE_SERVICE_ROLE_KEY dans le dashboard | 1 min | En parallèle |
| 4 | Créer projet Vercel + ajouter variables d'env + déployer | 10 min | Après 2. |
| 5 | Créer Resend, ajouter domain + DNS, créer API key | 10 min | En parallèle |
| 6 | Cloudflare : ajouter site, changer nameservers Hostinger | 5 min + propagation | En parallèle |
| 7 | Connecter domain Vercel → maxlinestudio.fr | 5 min | Après 6. |
| 8 | Tests E2E sur prod | 10 min | Final |

**Total temps actif** : ~45 min
**Total temps avec propagation DNS** : 1 h à 24 h (souvent ≤ 2 h)

---

## 💾 Détails techniques utiles

### Commit local actuel

```
20c62af feat: initial landing page
```

### Remote configuré

```
origin → https://github.com/Maxline-Studio/maxline-landing.git
```

### Fichiers staged (26 au total)

- Configuration : `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `.env.example`, `.gitignore`
- Documentation : `README.md`, `SETUP.md`, `DEPLOY-STATUS.md`
- Code app : `app/{layout,page,globals.css}`, `app/api/subscribe/route.ts`, `app/legal/{mentions,confidentialite,cookies}/page.tsx`
- Composants : `components/{header,footer}.tsx`, `components/ui/{button,input,badge}.tsx`, `components/sections/{hero,how-it-works,differentiators,promises,pricing-preview,faq,subscribe}.tsx`
- Libs : `lib/{utils,supabase}.ts`
- Migration DB : `supabase/migrations/001_waitlist.sql`

### Vérification que la table waitlist existe bien

Tu peux vérifier dans Supabase Table Editor :
https://supabase.com/dashboard/project/zkghkgkvoyqrtvnzypyo/editor

→ Tu dois voir la table `waitlist` avec 9 colonnes.
