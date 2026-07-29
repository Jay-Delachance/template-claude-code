# Fondations — Supabase, comptes & rôles multi-tenant

**Date :** 2026-07-29
**Sous-projet :** 0 — Fondations (socle du module Veille)
**Statut :** design validé, prêt pour plan d'implémentation

---

## Contexte

Veracto est un SaaS de veille et de GEO pour PME françaises et indépendants. Le
produit se construit en sous-projets indépendants :

| # | Sous-projet | État |
|---|---|---|
| **0** | **Fondations : Supabase + comptes/rôles + schéma multi-tenant** | **ce document** |
| 1 | Ingestion (sources web/RSS/newsletters + extension Chrome LinkedIn) | à venir |
| 2 | Analyse | à venir |
| 3 | Tone of voice | à venir |
| 4 | Génération de posts multi-format | à venir |

Ce document couvre **uniquement le sous-projet 0**. Il livre un socle autonome :
un utilisateur peut s'inscrire, monter son organisation, inviter des membres,
créer ses marques — prêt à recevoir le module Ingestion.

## Objectif

Livrer un socle complet et utilisable :

- Schéma Supabase multi-tenant + politiques RLS
- Authentification (email/mot de passe + Google OAuth)
- Onboarding (création organisation + 1ʳᵉ marque)
- Gestion d'équipe (invitations par email, gestion des rôles)
- Gestion des marques (CRUD)

À la fin, le socle est prêt à recevoir le module Ingestion.

## Décisions de cadrage

| Décision | Choix retenu |
|---|---|
| Modèle de tenancy | **Organisation → Marques → Données.** Un compte = une organisation possédant 1..N marques. Les données de veille se rattachent à une marque. |
| Rôles | **`owner` + `admin` + `member`.** (Le rôle `client` agence est reporté au canal agence, ajoutable sans migration destructive.) |
| Authentification | **Email/mot de passe + Google OAuth**, via Supabase Auth. |
| Plans/facturation | **Schéma de plan minimal, sans Stripe.** Colonnes `plan_tier` + `plan_module` sur l'organisation, pour gater les modules plus tard. |
| Livrable | **Socle complet** : schéma + RLS + auth + onboarding + gestion équipe + CRUD marques. |
| Autorisation | **RLS-first** (Postgres source de vérité) + invitations custom + sessions `@supabase/ssr`. |

## Approche technique

**RLS-first + invitations custom + sessions par cookies.**

- La source de vérité d'autorisation est **Postgres RLS**. Chaque table porte
  `organization_id` ; les politiques filtrent via des fonctions helper qui lisent
  l'appartenance (`memberships`). La sécurité ne dépend pas du code applicatif.
- Sessions gérées par `@supabase/ssr` (cookies) — pattern standard Next.js App
  Router.
- Invitations via une table `invitations` custom (token + email + rôle +
  expiration) : permet d'inviter dans une **org existante**, ce que l'invite
  Supabase native (user global) ne fait pas.

*Alternatives écartées :* autorisation en couche applicative (contredit les règles
projet, risque de fuite cross-tenant) ; custom claims JWT (optimisation de perf
prématurée, ajoutable plus tard sans refonte).

---

## Modèle de données

Grain : **organisation → marques**. Utilisateurs reliés aux orgs par une table
d'appartenance.

```
auth.users (géré par Supabase)
   │
   └─< profiles          (1-1 avec auth.users : nom, avatar)
         │
         └─< memberships  (N-N users↔orgs : porte le rôle)
                   │
   organizations ─┤       (nom, plan_tier, plan_module)
         │        │
         ├─< brands        (nom, secteur — le grain data de la veille)
         └─< invitations   (email, rôle, token, expiration)
```

### Tables

| Table | Colonnes notables | Rôle |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `full_name`, `avatar_url`, `created_at` | Miroir applicatif de l'utilisateur auth |
| `organizations` | `id`, `name`, `plan_tier`, `plan_module`, `created_at` | Le tenant |
| `memberships` | `id`, `organization_id`, `user_id`, `role`, `created_at`, `unique(organization_id, user_id)` | Lien user↔org + rôle |
| `brands` | `id`, `organization_id`, `name`, `sector`, `created_at` | Le grain des données de veille |
| `invitations` | `id`, `organization_id`, `email`, `role`, `token`, `invited_by`, `expires_at`, `accepted_at`, `created_at` | Invitation en attente |

### Enums

- `plan_tier` : `independant` | `pme` | `agence`
- `plan_module` : `veille` | `geo` | `bundle`
- `role` : `owner` | `admin` | `member`

### Décisions de modèle

- **`plan_tier` + `plan_module` en deux colonnes** : gating d'un module = règle
  simple (accès Veille si `plan_module IN ('veille','bundle')`). Prêt pour Stripe
  sans migration destructive.
- **`brands.organization_id`** (pas `user_id`) : une marque appartient à l'org,
  tous les membres y accèdent selon leur rôle. Rend le cas agence natif.
- **Table `memberships` séparée** : un utilisateur pourra appartenir à plusieurs
  organisations plus tard sans refonte.
- **Marque active** : sélecteur de marque stocké en cookie (`active_brand_id`),
  point d'ancrage du futur module Ingestion.

---

## Politiques RLS

Principe : aucune donnée lisible/modifiable sans appartenance (`memberships`). La
sécurité vit dans Postgres.

### Fonctions helper (SQL, `security definer`)

```
auth_is_member(org uuid) → boolean          -- membre de cette org ?
auth_has_role(org uuid, roles role[]) → boolean  -- a l'un de ces rôles ?
```

`security definer` pour éviter la récursion RLS et centraliser la logique.

### Politiques par table

| Table | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| `profiles` | soi-même + membres des orgs partagées | UPDATE : soi-même uniquement |
| `organizations` | membres (`auth_is_member`) | UPDATE : `owner`/`admin` · DELETE : `owner` |
| `memberships` | membres de la même org | INSERT/UPDATE/DELETE : `owner`/`admin` (voir garde-fous) |
| `brands` | membres de l'org | INSERT/UPDATE/DELETE : `owner`/`admin` |
| `invitations` | `owner`/`admin` de l'org | INSERT/DELETE : `owner`/`admin` |

### Garde-fous (au-delà du RLS brut)

- **Dernier owner indéboulonnable** : trigger Postgres empêchant de
  supprimer/rétrograder le dernier `owner` d'une org. Évite l'org orpheline.
- **Pas d'auto-élévation** : un `member` ne peut se donner `admin` ; un `admin`
  ne peut créer un `owner`.
- **Acceptation d'invitation** : l'INSERT dans `memberships` par acceptation se
  fait via une Server Action contrôlée (vérification du token), pas via la clé
  `service_role` exposée.

### Clés Supabase

- Clé `anon` (navigateur) : soumise au RLS.
- Clé `service_role` : **jamais côté client** — opérations serveur privilégiées
  uniquement (envoi d'invitation, tâches système futures type N8N).

---

## Flux d'authentification

Librairie `@supabase/ssr` (sessions par cookies). Trois clients : navigateur,
serveur (Server Components / Actions), middleware.

**Middleware** (`middleware.ts`) : rafraîchit la session et protège les routes.
- Non authentifié sur route `(app)` → redirection `/login`.
- Authentifié sans organisation → redirection `/onboarding`.

### Pages du groupe `(auth)`

| Route | Rôle |
|---|---|
| `/login` | Email + mot de passe, bouton « Continuer avec Google » |
| `/signup` | Création de compte + Google |
| `/reset-password` | Demande de lien de réinitialisation |
| `/auth/callback` | Retour OAuth Google et confirmation email (échange code → session) |
| `/auth/confirm` | Vérification du lien email (signup, reset) |

- **Emails transactionnels via Resend** : confirmation et reset passent par le
  SMTP Resend configuré dans Supabase Auth. Templates Supabase par défaut,
  personnalisables plus tard.
- **Google OAuth** : provider activé côté Supabase, `signInWithOAuth`, retour sur
  `/auth/callback`.
- **Trigger post-signup** : création automatique de la ligne `profiles` à la
  création d'un `auth.users`.

### Sécurité

- Aucun secret côté client : seule la clé `anon` (publique par design) est
  exposée ; `service_role` et secrets Google restent serveur.
- Aucun log d'email/token (règle `secure-logging`).
- Messages d'erreur génériques côté auth (pas d'énumération de comptes).

---

## Structure applicative

Groupe protégé `(app)` : layout vérifiant la session, chargeant l'org active et
le rôle une fois, transmis via contexte serveur.

### Onboarding (`/onboarding`)

Déclenché quand un utilisateur authentifié n'a aucune organisation. Server Action
transactionnelle :
1. Créer l'organisation (nom + défauts `independant`/`veille`).
2. Créer sa 1ʳᵉ marque (nom + secteur).
→ l'utilisateur devient `owner`, `membership` créée, redirection `/dashboard`.

### Sélecteur de marque active

Dropdown dans le layout `(app)` listant les marques de l'org. Sélection en cookie
(`active_brand_id`), lue côté serveur. Fallback : première marque. Point d'ancrage
du module Ingestion.

### Gestion d'équipe (`/settings/team`) — visible `owner`/`admin`

| Action | Qui | Mécanique |
|---|---|---|
| Lister membres | tous membres | SELECT `memberships` + `profiles` |
| Inviter par email | owner/admin | Server Action : crée `invitations` (token + expiration), email via Resend |
| Changer un rôle | owner/admin | UPDATE `memberships` (garde-fous) |
| Retirer un membre | owner/admin | DELETE `memberships` (dernier owner protégé) |

**Acceptation d'invitation** (`/invitations/accept?token=…`) :
- Non connecté → login/signup d'abord, puis retour sur le lien.
- Server Action vérifie le token (validité + non-expiré + email correspondant),
  crée la `membership`, marque `accepted_at`. Token à usage unique.

### Gestion des marques (`/brands`) — CRUD, visible `owner`/`admin`

Créer / renommer / changer secteur / supprimer. Suppression = confirmation
explicite (règle « pas de suppression sans confirmation »).

### Dashboard (`/dashboard`)

Minimal pour les fondations : bienvenue, marque active, état vide prêt à accueillir
le flux de veille. Pas de contenu métier (c'est le sous-projet Ingestion).

### Conventions (règles projet)

Server Components par défaut, `'use client'` seulement sur les formulaires ;
`next/link`, `next/image` ; composants réutilisables dans `components/` ;
`data-testid` sur les éléments interactifs (règle frontend).

---

## Gestion des erreurs

| Cas | Traitement |
|---|---|
| Identifiants invalides / OAuth échoué | Message générique, pas de révélation de l'existence d'un compte |
| Token d'invitation invalide/expiré/utilisé | Page « invitation invalide », proposer de contacter l'admin |
| Email d'invitation ≠ email connecté | Refus explicite, pas de membership créée |
| Violation RLS (cross-tenant) | 404/403 générique, aucune fuite de données d'une autre org |
| Dernier owner retiré/rétrogradé | Bloqué par trigger → message « une organisation doit garder un propriétaire » |
| Échec envoi email Resend | Compte/invitation créé quand même ; échec loggé **sans l'adresse**, rejouable |

Principe transverse : aucun email/token/secret dans les logs ; messages d'erreur
génériques côté auth.

---

## Stratégie de test

Aligné sur `test-discipline` : rouge avant vert, pas de sélecteurs fragiles,
`data-testid`.

- **RLS (le plus critique)** — intégration sur Supabase local : un membre de l'org
  A ne voit/modifie rien de l'org B (SELECT/INSERT/UPDATE/DELETE). Filet
  anti-fuite cross-tenant.
- **Garde-fous** — dernier owner non retirable ; `member` ne peut s'auto-élever ;
  `admin` ne peut créer un `owner`.
- **Flux d'invitation** — token valide → membership créée ; token
  expiré/réutilisé/mauvais email → refus.
- **Onboarding** — nouveau compte → création org + marque atomique → devient owner.
- **Auth** — signup crée le `profile` (trigger) ; middleware redirige (non connecté
  → login, sans org → onboarding).
- **E2E (Playwright)** — signup → onboarding → inviter → accepter depuis un 2ᵉ
  compte → créer une marque.

---

## Hors périmètre

Explicitement exclu de ce sous-projet :

- Stripe / facturation (seul le schéma de plan est présent, pas la logique de
  paiement).
- Rôle `client` agence (ajoutable plus tard sans migration destructive).
- Gating effectif des modules dans l'UI.
- Ingestion / Analyse / Tone of voice / Génération (sous-projets 1 à 4).
