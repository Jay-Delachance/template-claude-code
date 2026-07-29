# Veracto — Instructions permanentes Claude Code

## Contexte projet

**Veracto** est un SaaS de veille et de GEO (Generative Engine Optimization) pour PME françaises et indépendants.
Il surveille le secteur, les concurrents et la visibilité d'une marque dans les LLMs, et transforme ces données en actions hebdomadaires.

**Marque produit :** Veracto | **Opérateur :** Nivel (nivel.fr)

Deux modules :
- **Veille** — digest hebdo, posts réseaux, recommandations contenu
- **GEO** — audit visibilité IA sur ChatGPT, Perplexity, Gemini, Claude ; monitoring continu

---

## Toujours
- Écrire un test qui échoue (rouge) avant tout correctif.
- Réutiliser les composants existants avant d'en créer.
- Committer avec le format conventionnel : `feat/fix/refactor(scope): message`.
- Documenter toute décision d'architecture dans `docs/decisions/`.
- Appeler l'API Anthropic **côté serveur uniquement** (Edge Function ou endpoint Node) — jamais depuis le client.

## Jamais
- Committer des secrets, clés API, mots de passe.
- Modifier les fichiers de migration existants.
- Supprimer des données de production sans confirmation explicite.
- Utiliser des sélecteurs fragiles en test (class CSS, XPath, texte brut).
- Exposer la clé `ANTHROPIC_API_KEY` ou la `service_role` Supabase côté client.

---

## Stack

### Frontend
- Framework : Next.js App Router (Next.js 15+)
- Langage : TypeScript strict
- Style : Tailwind CSS — pas de CSS custom sauf exception justifiée
- Composants : React Server Components par défaut, `'use client'` si hooks ou events browser
- Images : `next/image` obligatoire — jamais `<img>` natif
- Navigation : `next/link` obligatoire
- Fetching : `fetch` natif dans les Server Components, pas de `useEffect` pour les données

### Backend / Infra
- **Supabase** — PostgreSQL, Auth, RLS, Edge Functions, Webhooks
- **N8N** — orchestration des workflows (auto-hébergé VPS Hostinger)
- **Anthropic API** — modèle `claude-sonnet-4-20250514` pour l'analyse GEO et les rapports
- **Resend** — emails transactionnels (confirmation J+0, rapport J+1)

### Base de données (tables clés)
| Table / Vue | Rôle |
|---|---|
| `audits` | Créé au clic "Auditer" — stocke score, résultats JSON par LLM |
| `leads` | Créé à la soumission email — lié à `audits` |
| `reports` | Rapport HTML/JSON généré par Claude — lié à `leads` |
| `pending_reports` | Vue N8N — leads >18h sans rapport envoyé |

### Sécurité RLS
- Clé `anon` : INSERT uniquement sur `audits` et `leads`
- Clé `service_role` : N8N uniquement — jamais exposée côté client
- Pas de SELECT public

---

## Règles par domaine

L'app vit à la racine (layout mono-app). Ces règles, héritées des anciens
dossiers `frontend/` et `backend/`, s'appliquent selon le type de fichier.

### UI (`app/`, `components/`)
- Pas de composant natif brut : passer par le design system / les composants réutilisables de `components/`.
- Tout composant interactif porte un attribut `data-testid`.
- WCAG 1.4.1 : contraste minimum requis sur tous les éléments visuels.

### Données & serveur (`supabase/`, Server Actions, Route Handlers)
- Toute requête sur données multi-tenant DOIT filtrer par organisation (RLS + filtre applicatif).
- Les Route Handlers publics sont préfixés `/api/v1/public/`.
- Pas de non-null assertion (`!`) ni de cast forcé pour contourner un type hors tests — exception admise pour la lecture des variables d'environnement de configuration.

---

## Index du savoir-faire

| Situation | Ressource |
|---|---|
| Fichiers backend / Edge Functions | skill `feature-implementation` (`.claude/skills/`) |
| Fichiers `.sql` / RLS | rule `rls-queries` (`.claude/rules/`) |
| Bug à corriger | skill `systematic-debugging` (`.claude/skills/`) |
| Feature à implémenter | skill `feature-implementation` (`.claude/skills/`) |
| Besoin flou à cadrer | skill `brainstorming` (`.claude/skills/`) |
| Incident en prod | gabarit `docs/postmortems/TEMPLATE.md` |
| Décision d'architecture | gabarit `docs/decisions/TEMPLATE.md` |
| Workflows N8N | voir `veracto-brief.md` §Workflows N8N |
