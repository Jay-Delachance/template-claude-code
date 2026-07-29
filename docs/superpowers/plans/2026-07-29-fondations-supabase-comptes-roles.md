# Fondations Supabase, comptes & rôles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer un socle Next.js + Supabase multi-tenant autonome : auth (email + Google), organisations, rôles, invitations, marques.

**Architecture:** App Next.js App Router à la racine du repo, Supabase pour la base Postgres + Auth + RLS. L'autorisation est **RLS-first** (Postgres source de vérité) via des fonctions helper et des RPC `security definer` pour les opérations atomiques (onboarding, acceptation d'invitation). Sessions gérées par `@supabase/ssr` (cookies).

**Tech Stack:** Next.js 15 (App Router, React 19), TypeScript strict, Tailwind CSS, `@supabase/ssr` + `@supabase/supabase-js`, Resend (emails), Vitest (unit/intégration + tests RLS), Playwright (E2E).

## Global Constraints

Ces contraintes s'appliquent à **toutes** les tâches (copiées du spec et des règles projet) :

- Next.js App Router, **Next.js 15+**, TypeScript **strict**.
- Tailwind CSS uniquement — pas de CSS custom sauf exception justifiée.
- **React Server Components par défaut** ; `'use client'` seulement si hooks React ou événements browser.
- **Exports nommés** pour tous les composants (pas de `export default` sauf pages/layouts Next.js).
- `next/image` obligatoire (jamais `<img>`), `next/link` obligatoire.
- Fetch de données dans les Server Components — pas de `useEffect` pour les données initiales.
- Composants réutilisables dans `components/`, pages dans `app/`.
- `data-testid` sur **tout élément interactif** (règle frontend). Tests : pas de sélecteurs fragiles (class CSS, XPath, texte brut).
- **RLS-first** : toute requête sur données multi-tenant filtre par organisation. Pas de SELECT public.
- **Aucun secret côté client** : seule la clé `anon` est exposée ; `service_role`, `RESEND_API_KEY`, secrets Google restent serveur.
- **Aucun email, token ou secret dans les logs** (règle `secure-logging`).
- **TDD** : écrire un test qui échoue (rouge) avant tout code. Un test qui ne peut pas échouer n'est pas un test. Pas de `.only` ni `.skip` sans ticket.
- Commits **conventionnels** : `type(scope): message` en minuscules, ≤ 72 caractères. Types : feat, fix, refactor, test, docs, chore, perf.
- Ne jamais modifier une migration existante — toujours une nouvelle migration additive.
- Suppression de données = confirmation explicite.

**Layout du repo :** app Next.js et Supabase à la racine. Migrations dans `supabase/migrations/`. Code app dans `app/`, `components/`, `lib/`, `middleware.ts`.

**Modèle Anthropic (référence, hors périmètre de ce plan) :** `claude-sonnet-4-20250514` — non utilisé dans les fondations.

---

## File Structure

**Scaffolding & config**
- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.env.local.example`, `.env.local`
- `middleware.ts` — refresh session + protection des routes

**Supabase (base & sécurité)**
- `supabase/config.toml` — config locale
- `supabase/migrations/0001_core_schema.sql` — enums + tables
- `supabase/migrations/0002_profiles_trigger.sql` — auto-création `profiles`
- `supabase/migrations/0003_rls_helpers.sql` — `auth_is_member`, `auth_has_role`
- `supabase/migrations/0004_rls_policies.sql` — politiques par table
- `supabase/migrations/0005_guard_triggers.sql` — dernier owner, anti-escalade
- `supabase/migrations/0006_rpc_onboarding_invitations.sql` — RPC `create_organization_with_brand`, `accept_invitation`

**Clients & contexte**
- `lib/supabase/client.ts` — client navigateur
- `lib/supabase/server.ts` — client serveur (Server Components / Actions)
- `lib/supabase/middleware.ts` — `updateSession`
- `lib/supabase/service.ts` — client `service_role` (serveur uniquement)
- `lib/auth/context.ts` — `getCurrentContext()`
- `lib/types.ts` — types partagés (Role, PlanTier, PlanModule, Brand…)

**Auth (`app/(auth)/`)**
- `login/page.tsx`, `login/actions.ts`
- `signup/page.tsx`, `signup/actions.ts`
- `reset-password/page.tsx`, `reset-password/actions.ts`
- `auth/callback/route.ts`, `auth/confirm/route.ts`

**App protégée (`app/(app)/`)**
- `layout.tsx` — vérifie session, charge org/rôle/marques
- `onboarding/page.tsx`, `onboarding/actions.ts`
- `dashboard/page.tsx`
- `settings/team/page.tsx`, `settings/team/actions.ts`
- `brands/page.tsx`, `brands/actions.ts`
- `invitations/accept/page.tsx`, `invitations/accept/actions.ts`

**Composants**
- `components/brand-switcher.tsx` — sélecteur de marque active
- `components/submit-button.tsx` — bouton avec état pending (réutilisable)

**Emails**
- `lib/email/resend.ts` — envoi via Resend
- `lib/email/templates/invitation.ts` — corps de l'email d'invitation

**Tests helpers**
- `tests/helpers/db.ts` — seed via `service_role`, clients par utilisateur
- `tests/e2e/foundation.spec.ts` — parcours E2E

---

## Task 1: Scaffolding Next.js + Supabase + outillage de test

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `vitest.config.ts`, `.env.local.example`, `.env.local`, `supabase/config.toml`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Consumes: rien (première tâche)
- Produces: projet Next.js 15 buildable ; scripts npm `dev`, `build`, `test`, `test:e2e`, `db:start`, `db:reset` ; Supabase local initialisé.

- [ ] **Step 1: Scaffolder le projet et installer les dépendances**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint --use-npm --yes
npm install @supabase/ssr @supabase/supabase-js resend
npm install -D vitest @vitejs/plugin-react @playwright/test dotenv
npx playwright install chromium
```

- [ ] **Step 2: Initialiser Supabase local**

```bash
npx supabase init
```

Crée `supabase/config.toml`. Vérifier que Docker est lancé (Supabase local en dépend).

- [ ] **Step 3: Ajouter les scripts npm et la config Vitest**

Dans `package.json`, section `scripts`, ajouter :

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "db:start": "supabase start",
  "db:reset": "supabase db reset"
}
```

Créer `vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'app/**/*.test.ts', 'lib/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['dotenv/config'],
  },
})
```

Créer `.env.local.example` (valeurs par défaut Supabase local, à recopier dans `.env.local`) :

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-affichée-par-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-affichée-par-supabase-start>
RESEND_API_KEY=re_dev_placeholder
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Copier vers `.env.local` et remplir avec les clés affichées par `npm run db:start`. `.env.local` est déjà git-ignoré par `create-next-app`.

- [ ] **Step 4: Écrire un test smoke**

`tests/smoke.test.ts` :

```ts
import { expect, test } from 'vitest'

test('environnement de test opérationnel', () => {
  expect(1 + 1).toBe(2)
})
```

- [ ] **Step 5: Vérifier build + test**

```bash
npm run build
npm test
```

Expected: build réussi, test smoke PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(scaffold): initialiser next.js supabase et outillage de test"
```

---

## Task 2: Migration — enums et tables du schéma

**Files:**
- Create: `supabase/migrations/0001_core_schema.sql`
- Test: `tests/db/schema.test.ts`
- Create: `tests/helpers/db.ts`

**Interfaces:**
- Consumes: Supabase local (Task 1)
- Produces: tables `profiles`, `organizations`, `memberships`, `brands`, `invitations` ; enums `role`, `plan_tier`, `plan_module`. Helper de test `serviceClient()` et `resetDb()`.

- [ ] **Step 1: Écrire le helper de test DB**

`tests/helpers/db.ts` :

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function serviceClient(): SupabaseClient {
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function anonClient(): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Crée un utilisateur confirmé et renvoie un client authentifié en son nom.
export async function createUserClient(email: string, password = 'Passw0rd!test') {
  const admin = serviceClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const signIn = await client.auth.signInWithPassword({ email, password })
  if (signIn.error) throw signIn.error
  return { client, userId: data.user.id }
}
```

- [ ] **Step 2: Écrire le test qui échoue**

`tests/db/schema.test.ts` :

```ts
import { beforeAll, expect, test } from 'vitest'
import { serviceClient } from '../helpers/db'

test('la table organizations existe avec plan_tier et plan_module', async () => {
  const db = serviceClient()
  const { error } = await db.from('organizations').select('id, name, plan_tier, plan_module').limit(1)
  expect(error).toBeNull()
})

test('la table brands est rattachée à une organisation', async () => {
  const db = serviceClient()
  const { error } = await db.from('brands').select('id, organization_id, name, sector').limit(1)
  expect(error).toBeNull()
})

test('memberships porte un role', async () => {
  const db = serviceClient()
  const { error } = await db.from('memberships').select('id, organization_id, user_id, role').limit(1)
  expect(error).toBeNull()
})
```

- [ ] **Step 3: Lancer le test — il échoue**

```bash
npm run db:start
npm test -- tests/db/schema.test.ts
```

Expected: FAIL (tables inexistantes).

- [ ] **Step 4: Écrire la migration**

`supabase/migrations/0001_core_schema.sql` :

```sql
-- Enums
create type role as enum ('owner', 'admin', 'member');
create type plan_tier as enum ('independant', 'pme', 'agence');
create type plan_module as enum ('veille', 'geo', 'bundle');

-- Profils (miroir applicatif de auth.users)
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Organisations (le tenant)
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan_tier   plan_tier not null default 'independant',
  plan_module plan_module not null default 'veille',
  created_at  timestamptz not null default now()
);

-- Appartenances (user <-> org, porte le rôle)
create table memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id         uuid not null references profiles (id) on delete cascade,
  role            role not null default 'member',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- Marques (grain des données de veille)
create table brands (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name            text not null,
  sector          text not null,
  created_at      timestamptz not null default now()
);

-- Invitations
create table invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  email           text not null,
  role            role not null default 'member',
  token           text not null unique,
  invited_by      uuid references profiles (id) on delete set null,
  expires_at      timestamptz not null,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_memberships_user on memberships (user_id);
create index idx_memberships_org on memberships (organization_id);
create index idx_brands_org on brands (organization_id);
create index idx_invitations_token on invitations (token);
```

- [ ] **Step 5: Appliquer et vérifier**

```bash
npm run db:reset
npm test -- tests/db/schema.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0001_core_schema.sql tests/db/schema.test.ts tests/helpers/db.ts
git commit -m "feat(db): schema multi-tenant organizations marques et invitations"
```

---

## Task 3: Migration — auto-création du profil au signup

**Files:**
- Create: `supabase/migrations/0002_profiles_trigger.sql`
- Test: `tests/db/profiles-trigger.test.ts`

**Interfaces:**
- Consumes: tables de Task 2
- Produces: à chaque insertion dans `auth.users`, une ligne `profiles` est créée automatiquement.

- [ ] **Step 1: Écrire le test qui échoue**

`tests/db/profiles-trigger.test.ts` :

```ts
import { expect, test } from 'vitest'
import { serviceClient } from '../helpers/db'

test('un profil est créé automatiquement à la création d’un utilisateur', async () => {
  const db = serviceClient()
  const email = `trigger-${Date.now()}@test.local`
  const { data, error } = await db.auth.admin.createUser({
    email, password: 'Passw0rd!test', email_confirm: true,
  })
  expect(error).toBeNull()
  const { data: profile } = await db.from('profiles').select('id').eq('id', data.user!.id).single()
  expect(profile?.id).toBe(data.user!.id)
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- tests/db/profiles-trigger.test.ts
```

Expected: FAIL (aucun profil créé).

- [ ] **Step 3: Écrire la migration**

`supabase/migrations/0002_profiles_trigger.sql` :

```sql
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

- [ ] **Step 4: Appliquer et vérifier**

```bash
npm run db:reset
npm test -- tests/db/profiles-trigger.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0002_profiles_trigger.sql tests/db/profiles-trigger.test.ts
git commit -m "feat(db): creer le profil automatiquement au signup"
```

---

## Task 4: Migration — fonctions helper RLS

**Files:**
- Create: `supabase/migrations/0003_rls_helpers.sql`
- Test: `tests/db/rls-helpers.test.ts`

**Interfaces:**
- Consumes: tables de Task 2
- Produces: `auth_is_member(uuid) → boolean`, `auth_has_role(uuid, role[]) → boolean`. Utilisées par toutes les politiques RLS (Task 5) et testables via RPC.

- [ ] **Step 1: Écrire le test qui échoue**

`tests/db/rls-helpers.test.ts` :

```ts
import { expect, test } from 'vitest'
import { serviceClient, createUserClient } from '../helpers/db'

test('auth_is_member renvoie true pour un membre, false sinon', async () => {
  const admin = serviceClient()
  const { client, userId } = await createUserClient(`helper-${Date.now()}@test.local`)
  const { data: org } = await admin.from('organizations').insert({ name: 'Org H' }).select('id').single()
  await admin.from('memberships').insert({ organization_id: org!.id, user_id: userId, role: 'owner' })

  const inside = await client.rpc('auth_is_member', { org: org!.id })
  expect(inside.data).toBe(true)

  const { data: other } = await admin.from('organizations').insert({ name: 'Org autre' }).select('id').single()
  const outside = await client.rpc('auth_is_member', { org: other!.id })
  expect(outside.data).toBe(false)
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- tests/db/rls-helpers.test.ts
```

Expected: FAIL (fonction inexistante).

- [ ] **Step 3: Écrire la migration**

`supabase/migrations/0003_rls_helpers.sql` :

```sql
create or replace function auth_is_member(org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from memberships
    where organization_id = org and user_id = auth.uid()
  );
$$;

create or replace function auth_has_role(org uuid, roles role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from memberships
    where organization_id = org
      and user_id = auth.uid()
      and role = any (roles)
  );
$$;
```

- [ ] **Step 4: Appliquer et vérifier**

```bash
npm run db:reset
npm test -- tests/db/rls-helpers.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0003_rls_helpers.sql tests/db/rls-helpers.test.ts
git commit -m "feat(db): fonctions helper rls auth_is_member et auth_has_role"
```

---

## Task 5: Migration — politiques RLS

**Files:**
- Create: `supabase/migrations/0004_rls_policies.sql`
- Test: `tests/db/rls-isolation.test.ts`

**Interfaces:**
- Consumes: helpers de Task 4
- Produces: RLS activé + politiques sur les 5 tables. Isolation cross-tenant garantie.

- [ ] **Step 1: Écrire le test qui échoue (isolation cross-tenant)**

`tests/db/rls-isolation.test.ts` :

```ts
import { expect, test } from 'vitest'
import { serviceClient, createUserClient } from '../helpers/db'

async function seedOrgWithMember(name: string, email: string) {
  const admin = serviceClient()
  const { client, userId } = await createUserClient(email)
  const { data: org } = await admin.from('organizations').insert({ name }).select('id').single()
  await admin.from('memberships').insert({ organization_id: org!.id, user_id: userId, role: 'owner' })
  await admin.from('brands').insert({ organization_id: org!.id, name: `${name} brand`, sector: 'tech' })
  return { client, orgId: org!.id }
}

test('un membre de l’org A ne voit pas les marques de l’org B', async () => {
  const a = await seedOrgWithMember('Org A', `a-${Date.now()}@test.local`)
  const b = await seedOrgWithMember('Org B', `b-${Date.now()}@test.local`)

  const { data: mine } = await a.client.from('brands').select('id, organization_id')
  expect(mine!.every((row) => row.organization_id === a.orgId)).toBe(true)
  expect(mine!.some((row) => row.organization_id === b.orgId)).toBe(false)
})

test('un membre de l’org A ne peut pas insérer une marque dans l’org B', async () => {
  const a = await seedOrgWithMember('Org A2', `a2-${Date.now()}@test.local`)
  const b = await seedOrgWithMember('Org B2', `b2-${Date.now()}@test.local`)
  const { error } = await a.client.from('brands').insert({
    organization_id: b.orgId, name: 'pirate', sector: 'x',
  })
  expect(error).not.toBeNull()
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- tests/db/rls-isolation.test.ts
```

Expected: FAIL (RLS non activé → l'org A voit tout / peut tout insérer).

- [ ] **Step 3: Écrire la migration**

`supabase/migrations/0004_rls_policies.sql` :

```sql
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table memberships enable row level security;
alter table brands enable row level security;
alter table invitations enable row level security;

-- profiles : soi-même + membres des orgs partagées
create policy profiles_select on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from memberships m1
      join memberships m2 on m1.organization_id = m2.organization_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
    )
  );
create policy profiles_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- organizations
create policy organizations_select on organizations for select
  using (auth_is_member(id));
create policy organizations_update on organizations for update
  using (auth_has_role(id, array['owner','admin']::role[]))
  with check (auth_has_role(id, array['owner','admin']::role[]));
create policy organizations_delete on organizations for delete
  using (auth_has_role(id, array['owner']::role[]));

-- memberships
create policy memberships_select on memberships for select
  using (auth_is_member(organization_id));
create policy memberships_insert on memberships for insert
  with check (auth_has_role(organization_id, array['owner','admin']::role[]));
create policy memberships_update on memberships for update
  using (auth_has_role(organization_id, array['owner','admin']::role[]))
  with check (auth_has_role(organization_id, array['owner','admin']::role[]));
create policy memberships_delete on memberships for delete
  using (auth_has_role(organization_id, array['owner','admin']::role[]));

-- brands
create policy brands_select on brands for select
  using (auth_is_member(organization_id));
create policy brands_insert on brands for insert
  with check (auth_has_role(organization_id, array['owner','admin']::role[]));
create policy brands_update on brands for update
  using (auth_has_role(organization_id, array['owner','admin']::role[]))
  with check (auth_has_role(organization_id, array['owner','admin']::role[]));
create policy brands_delete on brands for delete
  using (auth_has_role(organization_id, array['owner','admin']::role[]));

-- invitations : seuls owner/admin voient et gèrent
create policy invitations_select on invitations for select
  using (auth_has_role(organization_id, array['owner','admin']::role[]));
create policy invitations_insert on invitations for insert
  with check (auth_has_role(organization_id, array['owner','admin']::role[]));
create policy invitations_delete on invitations for delete
  using (auth_has_role(organization_id, array['owner','admin']::role[]));
```

- [ ] **Step 4: Appliquer et vérifier**

```bash
npm run db:reset
npm test -- tests/db/rls-isolation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0004_rls_policies.sql tests/db/rls-isolation.test.ts
git commit -m "feat(db): politiques rls d isolation multi-tenant"
```

---

## Task 6: Migration — triggers garde-fous (dernier owner, anti-escalade)

**Files:**
- Create: `supabase/migrations/0005_guard_triggers.sql`
- Test: `tests/db/guards.test.ts`

**Interfaces:**
- Consumes: tables + RLS
- Produces: impossible de retirer/rétrograder le dernier owner ; un `admin` ne peut créer un `owner`.

- [ ] **Step 1: Écrire le test qui échoue**

`tests/db/guards.test.ts` :

```ts
import { expect, test } from 'vitest'
import { serviceClient, createUserClient } from '../helpers/db'

test('impossible de rétrograder le dernier owner', async () => {
  const admin = serviceClient()
  const { userId } = await createUserClient(`owner-${Date.now()}@test.local`)
  const { data: org } = await admin.from('organizations').insert({ name: 'Solo' }).select('id').single()
  const { data: m } = await admin
    .from('memberships')
    .insert({ organization_id: org!.id, user_id: userId, role: 'owner' })
    .select('id').single()

  const { error } = await admin.from('memberships').update({ role: 'member' }).eq('id', m!.id)
  expect(error).not.toBeNull()
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- tests/db/guards.test.ts
```

Expected: FAIL (la rétrogradation passe).

- [ ] **Step 3: Écrire la migration**

`supabase/migrations/0005_guard_triggers.sql` :

```sql
-- Empêche de retirer ou rétrograder le dernier owner d'une organisation
create or replace function prevent_last_owner_removal()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_org uuid;
  remaining_owners int;
begin
  if tg_op = 'DELETE' then
    target_org := old.organization_id;
  else
    target_org := new.organization_id;
  end if;

  -- On ne se soucie que du cas où l'ancien rôle était owner et ne l'est plus
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    select count(*) into remaining_owners
    from memberships
    where organization_id = target_org and role = 'owner' and id <> old.id;

    if remaining_owners = 0 then
      raise exception 'une organisation doit garder au moins un owner';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger guard_last_owner
  before update or delete on memberships
  for each row execute function prevent_last_owner_removal();

-- Empêche un admin de créer/promouvoir un owner
create or replace function prevent_privilege_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role = 'owner'
     and auth.uid() is not null
     and not auth_has_role(new.organization_id, array['owner']::role[]) then
    raise exception 'seul un owner peut désigner un owner';
  end if;
  return new;
end;
$$;

create trigger guard_privilege_escalation
  before insert or update on memberships
  for each row execute function prevent_privilege_escalation();
```

- [ ] **Step 4: Appliquer et vérifier**

```bash
npm run db:reset
npm test -- tests/db/guards.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0005_guard_triggers.sql tests/db/guards.test.ts
git commit -m "feat(db): garde-fous dernier owner et anti-escalade de privilege"
```

---

## Task 7: Migration — RPC onboarding et acceptation d'invitation

**Files:**
- Create: `supabase/migrations/0006_rpc_onboarding_invitations.sql`
- Test: `tests/db/rpc.test.ts`

**Interfaces:**
- Consumes: tables + RLS + triggers
- Produces:
  - `create_organization_with_brand(org_name text, brand_name text, brand_sector text) → uuid` — crée org + membership owner + marque, renvoie l'org id.
  - `accept_invitation(invite_token text) → uuid` — valide le token (existant, non expiré, non accepté, email = email courant), crée la membership, marque `accepted_at`, renvoie l'org id.

- [ ] **Step 1: Écrire le test qui échoue**

`tests/db/rpc.test.ts` :

```ts
import { expect, test } from 'vitest'
import { serviceClient, createUserClient } from '../helpers/db'

test('create_organization_with_brand crée org, owner et marque', async () => {
  const { client, userId } = await createUserClient(`rpc-${Date.now()}@test.local`)
  const { data: orgId, error } = await client.rpc('create_organization_with_brand', {
    org_name: 'Mon Org', brand_name: 'Ma Marque', brand_sector: 'saas',
  })
  expect(error).toBeNull()
  expect(orgId).toBeTruthy()

  const admin = serviceClient()
  const { data: m } = await admin.from('memberships')
    .select('role').eq('organization_id', orgId).eq('user_id', userId).single()
  expect(m?.role).toBe('owner')
  const { data: brands } = await admin.from('brands').select('name').eq('organization_id', orgId)
  expect(brands!.map((b) => b.name)).toContain('Ma Marque')
})

test('accept_invitation refuse un token expiré', async () => {
  const admin = serviceClient()
  const { client } = await createUserClient(`inv-${Date.now()}@test.local`)
  const { data: org } = await admin.from('organizations').insert({ name: 'Inviteur' }).select('id').single()
  await admin.from('invitations').insert({
    organization_id: org!.id, email: 'inv@test.local', role: 'member',
    token: `tok-${Date.now()}`, expires_at: new Date(Date.now() - 1000).toISOString(),
  })
  const { error } = await client.rpc('accept_invitation', { invite_token: `tok-${Date.now()}` })
  expect(error).not.toBeNull()
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- tests/db/rpc.test.ts
```

Expected: FAIL (RPC inexistantes).

- [ ] **Step 3: Écrire la migration**

`supabase/migrations/0006_rpc_onboarding_invitations.sql` :

```sql
-- Onboarding : org + membership owner + 1re marque, de façon atomique
create or replace function create_organization_with_brand(
  org_name text, brand_name text, brand_sector text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org uuid;
begin
  if auth.uid() is null then
    raise exception 'authentification requise';
  end if;

  insert into organizations (name) values (org_name) returning id into new_org;
  insert into memberships (organization_id, user_id, role)
    values (new_org, auth.uid(), 'owner');
  insert into brands (organization_id, name, sector)
    values (new_org, brand_name, brand_sector);

  return new_org;
end;
$$;

-- Acceptation d'invitation : valide et crée la membership
create or replace function accept_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv invitations%rowtype;
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'authentification requise';
  end if;

  select email into current_email from auth.users where id = auth.uid();

  select * into inv from invitations where token = invite_token;
  if not found then raise exception 'invitation introuvable'; end if;
  if inv.accepted_at is not null then raise exception 'invitation déjà utilisée'; end if;
  if inv.expires_at < now() then raise exception 'invitation expirée'; end if;
  if lower(inv.email) <> lower(current_email) then
    raise exception 'cette invitation ne correspond pas à votre email';
  end if;

  insert into memberships (organization_id, user_id, role)
    values (inv.organization_id, auth.uid(), inv.role)
    on conflict (organization_id, user_id) do nothing;

  update invitations set accepted_at = now() where id = inv.id;
  return inv.organization_id;
end;
$$;
```

- [ ] **Step 4: Appliquer et vérifier**

```bash
npm run db:reset
npm test -- tests/db/rpc.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0006_rpc_onboarding_invitations.sql tests/db/rpc.test.ts
git commit -m "feat(db): rpc onboarding et acceptation d invitation"
```

---

## Task 8: Clients Supabase et types partagés

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `lib/supabase/service.ts`, `lib/types.ts`
- Test: `lib/types.test.ts`

**Interfaces:**
- Consumes: env de Task 1
- Produces:
  - `createClient()` (navigateur) — `lib/supabase/client.ts`
  - `createClient()` (serveur, async) — `lib/supabase/server.ts`
  - `updateSession(request: NextRequest)` — `lib/supabase/middleware.ts`
  - `createServiceClient()` (service_role) — `lib/supabase/service.ts`
  - Types `Role`, `PlanTier`, `PlanModule`, `Brand`, `Organization`, `Membership` — `lib/types.ts`

- [ ] **Step 1: Écrire les types partagés + un test de garde**

`lib/types.ts` :

```ts
export type Role = 'owner' | 'admin' | 'member'
export type PlanTier = 'independant' | 'pme' | 'agence'
export type PlanModule = 'veille' | 'geo' | 'bundle'

export type Organization = {
  id: string
  name: string
  planTier: PlanTier
  planModule: PlanModule
}

export type Brand = {
  id: string
  organizationId: string
  name: string
  sector: string
}

export type Membership = {
  id: string
  organizationId: string
  userId: string
  role: Role
}

export const MANAGER_ROLES: Role[] = ['owner', 'admin']
```

`lib/types.test.ts` :

```ts
import { expect, test } from 'vitest'
import { MANAGER_ROLES } from './types'

test('les rôles gestionnaires sont owner et admin', () => {
  expect(MANAGER_ROLES).toEqual(['owner', 'admin'])
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- lib/types.test.ts
```

Expected: FAIL (module inexistant).

- [ ] **Step 3: Écrire les clients**

`lib/supabase/client.ts` :

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

`lib/supabase/server.ts` :

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Appelé depuis un Server Component : ignoré, le middleware rafraîchit.
          }
        },
      },
    },
  )
}
```

`lib/supabase/middleware.ts` :

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  return { response, user }
}
```

`lib/supabase/service.ts` :

```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Client service_role — SERVEUR UNIQUEMENT. Ne jamais importer côté client.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
```

- [ ] **Step 4: Vérifier**

```bash
npm test -- lib/types.test.ts
npm run build
```

Expected: test PASS, build OK.

- [ ] **Step 5: Commit**

```bash
git add lib/
git commit -m "feat(supabase): clients navigateur serveur middleware et service"
```

---

## Task 9: Middleware — refresh de session et protection des routes

**Files:**
- Create: `middleware.ts`
- Test: `tests/e2e/route-protection.spec.ts`

**Interfaces:**
- Consumes: `updateSession` (Task 8)
- Produces: routes `(app)` protégées (redirection `/login` si non connecté).

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/route-protection.spec.ts` :

```ts
import { expect, test } from '@playwright/test'

test('un visiteur non connecté est redirigé vers /login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm run dev &  # ou configurer webServer dans playwright.config.ts (voir Task 24)
npm run test:e2e -- route-protection
```

Expected: FAIL (pas de redirection).

- [ ] **Step 3: Écrire le middleware**

`middleware.ts` :

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PREFIXES = ['/login', '/signup', '/reset-password', '/auth', '/invitations']

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 4: Vérifier**

```bash
npm run test:e2e -- route-protection
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts tests/e2e/route-protection.spec.ts
git commit -m "feat(auth): middleware de protection des routes protegees"
```

---

## Task 10: Contexte d'authentification serveur

**Files:**
- Create: `lib/auth/context.ts`
- Test: `tests/db/context.test.ts`

**Interfaces:**
- Consumes: `createClient` serveur (Task 8), types (Task 8)
- Produces: `getCurrentContext()` → `AuthContext | null` avec `{ user, organization, role, brands, activeBrandId }`. Consommé par le layout `(app)` (Task 15) et les pages.

- [ ] **Step 1: Écrire le test qui échoue**

`tests/db/context.test.ts` (teste la fonction pure de mapping, isolée de `next/headers`) :

```ts
import { expect, test } from 'vitest'
import { mapContext } from '@/lib/auth/context'

test('mapContext assemble org, rôle et marques', () => {
  const ctx = mapContext(
    { id: 'u1', email: 'a@b.c' },
    {
      organization_id: 'o1',
      role: 'admin',
      organizations: { id: 'o1', name: 'Org', plan_tier: 'pme', plan_module: 'bundle' },
    },
    [{ id: 'br1', organization_id: 'o1', name: 'M', sector: 'tech' }],
    'br1',
  )
  expect(ctx.organization?.name).toBe('Org')
  expect(ctx.role).toBe('admin')
  expect(ctx.activeBrandId).toBe('br1')
  expect(ctx.brands[0].sector).toBe('tech')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- tests/db/context.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Écrire le contexte**

`lib/auth/context.ts` :

```ts
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Brand, Organization, Role } from '@/lib/types'

export type AuthContext = {
  user: { id: string; email: string }
  organization: Organization | null
  role: Role | null
  brands: Brand[]
  activeBrandId: string | null
}

type MembershipRow = {
  organization_id: string
  role: Role
  organizations: { id: string; name: string; plan_tier: string; plan_module: string }
} | null

type BrandRow = { id: string; organization_id: string; name: string; sector: string }

export function mapContext(
  user: { id: string; email: string },
  membership: MembershipRow,
  brandRows: BrandRow[],
  activeBrandId: string | null,
): AuthContext {
  return {
    user,
    organization: membership
      ? {
          id: membership.organizations.id,
          name: membership.organizations.name,
          planTier: membership.organizations.plan_tier as Organization['planTier'],
          planModule: membership.organizations.plan_module as Organization['planModule'],
        }
      : null,
    role: membership?.role ?? null,
    brands: brandRows.map((b) => ({
      id: b.id,
      organizationId: b.organization_id,
      name: b.name,
      sector: b.sector,
    })),
    activeBrandId,
  }
}

export async function getCurrentContext(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id, role, organizations(id, name, plan_tier, plan_module)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const brandRows = membership
    ? (await supabase.from('brands').select('id, organization_id, name, sector')).data ?? []
    : []

  const cookieStore = await cookies()
  const cookieBrand = cookieStore.get('active_brand_id')?.value ?? null
  const activeBrandId =
    brandRows.find((b) => b.id === cookieBrand)?.id ?? brandRows[0]?.id ?? null

  return mapContext(
    { id: user.id, email: user.email! },
    membership as MembershipRow,
    brandRows,
    activeBrandId,
  )
}
```

- [ ] **Step 4: Vérifier**

```bash
npm test -- tests/db/context.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/context.ts tests/db/context.test.ts
git commit -m "feat(auth): contexte serveur org role et marques"
```

---

## Task 11: Composant réutilisable SubmitButton

**Files:**
- Create: `components/submit-button.tsx`
- Test: `components/submit-button.test.tsx`

**Interfaces:**
- Consumes: rien
- Produces: `<SubmitButton>` avec état `pending` via `useFormStatus`. Réutilisé par tous les formulaires (login, signup, onboarding, team, brands).

- [ ] **Step 1: Configurer jsdom pour ce test + écrire le test qui échoue**

Dans `vitest.config.ts`, ajouter le support jsdom pour les tests `.tsx` : installer `npm i -D jsdom @testing-library/react @testing-library/dom` et ajouter en tête du fichier de test :

`components/submit-button.test.tsx` :

```tsx
// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SubmitButton } from './submit-button'

test('affiche le libellé et un data-testid', () => {
  render(<SubmitButton>Se connecter</SubmitButton>)
  const btn = screen.getByTestId('submit-button')
  expect(btn).toHaveTextContent('Se connecter')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- components/submit-button.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Écrire le composant**

`components/submit-button.tsx` :

```tsx
'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="submit-button"
      className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? 'Patientez…' : children}
    </button>
  )
}
```

- [ ] **Step 4: Vérifier**

```bash
npm test -- components/submit-button.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/submit-button.tsx components/submit-button.test.tsx vitest.config.ts package.json
git commit -m "feat(ui): bouton submit reutilisable avec etat pending"
```

---

## Task 12: Page & action de connexion (email/mot de passe)

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/login/actions.ts`
- Test: `tests/e2e/login.spec.ts`

**Interfaces:**
- Consumes: `createClient` serveur (Task 8), `SubmitButton` (Task 11)
- Produces: connexion par email/mot de passe. Action `signIn(formData)`.

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/login.spec.ts` :

```ts
import { expect, test } from '@playwright/test'

test('identifiants invalides affichent une erreur générique', async ({ page }) => {
  await page.goto('/login')
  await page.getByTestId('email').fill('inconnu@test.local')
  await page.getByTestId('password').fill('mauvais')
  await page.getByTestId('submit-button').click()
  await expect(page.getByTestId('form-error')).toContainText('incorrect')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm run test:e2e -- login
```

Expected: FAIL (page absente).

- [ ] **Step 3: Écrire l'action et la page**

`app/(auth)/login/actions.ts` :

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Message générique : pas d'énumération de comptes, pas de log d'email.
    return { error: 'Email ou mot de passe incorrect.' }
  }
  redirect('/dashboard')
}
```

`app/(auth)/login/page.tsx` :

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { signIn } from './actions'

export default function LoginPage() {
  const [state, action] = useActionState(signIn, null)
  return (
    <main className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <form action={action} className="space-y-3">
        <input data-testid="email" name="email" type="email" placeholder="Email"
          className="w-full rounded border p-2" required />
        <input data-testid="password" name="password" type="password" placeholder="Mot de passe"
          className="w-full rounded border p-2" required />
        {state?.error && (
          <p data-testid="form-error" className="text-sm text-red-600">{state.error}</p>
        )}
        <SubmitButton>Se connecter</SubmitButton>
      </form>
      <div className="text-sm">
        <Link href="/reset-password" className="underline">Mot de passe oublié ?</Link>
        {' · '}
        <Link href="/signup" className="underline">Créer un compte</Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Vérifier**

```bash
npm run test:e2e -- login
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)/login" tests/e2e/login.spec.ts
git commit -m "feat(auth): page et action de connexion email mot de passe"
```

---

## Task 13: Page & action d'inscription

**Files:**
- Create: `app/(auth)/signup/page.tsx`, `app/(auth)/signup/actions.ts`
- Test: `tests/e2e/signup.spec.ts`

**Interfaces:**
- Consumes: `createClient` serveur, `SubmitButton`
- Produces: inscription email/mot de passe. Action `signUp(formData)` → redirige vers `/onboarding` après confirmation (ou message « vérifiez vos emails »).

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/signup.spec.ts` :

```ts
import { expect, test } from '@playwright/test'

test('un nouvel utilisateur peut s’inscrire et arrive sur l’onboarding', async ({ page }) => {
  const email = `signup-${Date.now()}@test.local`
  await page.goto('/signup')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('Passw0rd!test')
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL(/\/onboarding/)
})
```

> Prérequis : en dev local, désactiver la confirmation email dans `supabase/config.toml` (`[auth.email] enable_confirmations = false`) pour que l'inscription connecte directement. En production, la confirmation reste active (email via Resend).

- [ ] **Step 2: Lancer — échoue**

```bash
npm run test:e2e -- signup
```

Expected: FAIL.

- [ ] **Step 3: Écrire l'action et la page**

`app/(auth)/signup/actions.ts` :

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm` },
  })
  if (error) return { error: 'Inscription impossible. Vérifiez vos informations.' }
  if (data.session) redirect('/onboarding')
  return { info: 'Vérifiez vos emails pour confirmer votre compte.' }
}
```

`app/(auth)/signup/page.tsx` :

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { signUp } from './actions'

export default function SignupPage() {
  const [state, action] = useActionState(signUp, null)
  return (
    <main className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      <form action={action} className="space-y-3">
        <input data-testid="email" name="email" type="email" placeholder="Email"
          className="w-full rounded border p-2" required />
        <input data-testid="password" name="password" type="password" placeholder="Mot de passe"
          className="w-full rounded border p-2" required minLength={8} />
        {state?.error && <p data-testid="form-error" className="text-sm text-red-600">{state.error}</p>}
        {state?.info && <p data-testid="form-info" className="text-sm text-green-700">{state.info}</p>}
        <SubmitButton>S’inscrire</SubmitButton>
      </form>
      <Link href="/login" className="text-sm underline">Déjà un compte ? Se connecter</Link>
    </main>
  )
}
```

- [ ] **Step 4: Vérifier**

```bash
npm run test:e2e -- signup
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)/signup" tests/e2e/signup.spec.ts supabase/config.toml
git commit -m "feat(auth): page et action d inscription"
```

---

## Task 14: Google OAuth + routes de callback/confirm

**Files:**
- Create: `app/(auth)/auth/callback/route.ts`, `app/(auth)/auth/confirm/route.ts`
- Modify: `app/(auth)/login/page.tsx` (ajouter le bouton Google), `app/(auth)/login/actions.ts` (action OAuth)
- Test: `app/(auth)/auth/callback/route.test.ts`

**Interfaces:**
- Consumes: `createClient` serveur
- Produces: route `/auth/callback` (échange code→session), `/auth/confirm` (vérif OTP email), action `signInWithGoogle()`.

- [ ] **Step 1: Écrire le test qui échoue (route callback sans code → redirige vers login avec erreur)**

`app/(auth)/auth/callback/route.test.ts` :

```ts
import { expect, test } from 'vitest'
import { GET } from './route'

test('callback sans code redirige vers /login avec une erreur', async () => {
  const res = await GET(new Request('http://localhost:3000/auth/callback'))
  expect(res.status).toBe(307)
  expect(res.headers.get('location')).toContain('/login')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- app/\(auth\)/auth/callback/route.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Écrire les routes et le bouton Google**

`app/(auth)/auth/callback/route.ts` :

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
```

`app/(auth)/auth/confirm/route.ts` :

```ts
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=confirm`)
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=confirm`)
  }
  return NextResponse.redirect(`${origin}/onboarding`)
}
```

Ajouter l'action OAuth dans `app/(auth)/login/actions.ts` :

```ts
export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  })
  if (error || !data.url) return
  redirect(data.url)
}
```

Ajouter le bouton dans `app/(auth)/login/page.tsx`, sous le formulaire :

```tsx
<form action={signInWithGoogle}>
  <button type="submit" data-testid="google-signin"
    className="w-full rounded border p-2">Continuer avec Google</button>
</form>
```

(importer `signInWithGoogle` depuis `./actions`.)

> Config Supabase : activer le provider Google (client ID/secret Google) dans `supabase/config.toml` `[auth.external.google]` en local et dans le dashboard en prod. Secrets via variables d'env — jamais en clair dans le repo.

- [ ] **Step 4: Vérifier**

```bash
npm test -- app/\(auth\)/auth/callback/route.test.ts
npm run build
```

Expected: test PASS, build OK.

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)/auth" "app/(auth)/login"
git commit -m "feat(auth): google oauth et routes callback confirm"
```

---

## Task 15: Réinitialisation de mot de passe

**Files:**
- Create: `app/(auth)/reset-password/page.tsx`, `app/(auth)/reset-password/actions.ts`
- Test: `tests/e2e/reset-password.spec.ts`

**Interfaces:**
- Consumes: `createClient` serveur, `SubmitButton`
- Produces: demande de lien de réinitialisation. Action `requestReset(formData)` — message générique quel que soit l'existence du compte.

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/reset-password.spec.ts` :

```ts
import { expect, test } from '@playwright/test'

test('la demande affiche toujours un message générique', async ({ page }) => {
  await page.goto('/reset-password')
  await page.getByTestId('email').fill('peuimporte@test.local')
  await page.getByTestId('submit-button').click()
  await expect(page.getByTestId('form-info')).toContainText('email')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm run test:e2e -- reset-password
```

Expected: FAIL.

- [ ] **Step 3: Écrire l'action et la page**

`app/(auth)/reset-password/actions.ts` :

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function requestReset(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?type=recovery`,
  })
  // Toujours le même message : pas de révélation de l'existence du compte.
  return { info: 'Si un compte existe, un email vient de vous être envoyé.' }
}
```

`app/(auth)/reset-password/page.tsx` :

```tsx
'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { requestReset } from './actions'

export default function ResetPasswordPage() {
  const [state, action] = useActionState(requestReset, null)
  return (
    <main className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
      <form action={action} className="space-y-3">
        <input data-testid="email" name="email" type="email" placeholder="Email"
          className="w-full rounded border p-2" required />
        {state?.info && <p data-testid="form-info" className="text-sm text-green-700">{state.info}</p>}
        <SubmitButton>Envoyer le lien</SubmitButton>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Vérifier**

```bash
npm run test:e2e -- reset-password
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)/reset-password" tests/e2e/reset-password.spec.ts
git commit -m "feat(auth): reinitialisation de mot de passe"
```

---

## Task 16: Layout protégé (app) + redirection onboarding

**Files:**
- Create: `app/(app)/layout.tsx`
- Test: `tests/e2e/onboarding-redirect.spec.ts`

**Interfaces:**
- Consumes: `getCurrentContext` (Task 10)
- Produces: layout qui charge le contexte ; sans organisation → redirige `/onboarding`. Fournit org/rôle/marques aux pages enfants.

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/onboarding-redirect.spec.ts` :

```ts
import { expect, test } from '@playwright/test'

test('un utilisateur connecté sans organisation est envoyé sur /onboarding', async ({ page }) => {
  const email = `noorg-${Date.now()}@test.local`
  await page.goto('/signup')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('Passw0rd!test')
  await page.getByTestId('submit-button').click()
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/onboarding/)
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm run test:e2e -- onboarding-redirect
```

Expected: FAIL.

- [ ] **Step 3: Écrire le layout**

`app/(app)/layout.tsx` :

```tsx
import { redirect } from 'next/navigation'
import { getCurrentContext } from '@/lib/auth/context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentContext()
  if (!ctx) redirect('/login')
  if (!ctx.organization) redirect('/onboarding')

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-bold">Veracto</span>
        <span data-testid="org-name" className="text-sm text-gray-600">{ctx.organization.name}</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
```

> Note : `/onboarding` doit vivre **hors** du groupe `(app)` (sinon boucle de redirection), ou dans un sous-layout dédié. On la place dans `app/(app)/onboarding/` mais on ajoute un garde spécifique — voir Task 17 : la page onboarding utilise son propre check et ne dépend pas de ce layout. Placer `onboarding/` dans un groupe distinct `app/(onboarding)/` avec son propre layout minimal qui vérifie seulement la session.

- [ ] **Step 4: Vérifier**

```bash
npm run test:e2e -- onboarding-redirect
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/layout.tsx" tests/e2e/onboarding-redirect.spec.ts
git commit -m "feat(app): layout protege et redirection onboarding"
```

---

## Task 17: Onboarding — créer organisation + première marque

**Files:**
- Create: `app/(onboarding)/layout.tsx`, `app/(onboarding)/onboarding/page.tsx`, `app/(onboarding)/onboarding/actions.ts`
- Test: `tests/e2e/onboarding.spec.ts`

**Interfaces:**
- Consumes: RPC `create_organization_with_brand` (Task 7), `createClient` serveur, `SubmitButton`
- Produces: page onboarding. Action `completeOnboarding(formData)` → appelle la RPC → redirige `/dashboard`.

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/onboarding.spec.ts` :

```ts
import { expect, test } from '@playwright/test'

test('l’onboarding crée l’organisation et la première marque', async ({ page }) => {
  const email = `onb-${Date.now()}@test.local`
  await page.goto('/signup')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('Passw0rd!test')
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL(/\/onboarding/)

  await page.getByTestId('org-name-input').fill('Mon Agence')
  await page.getByTestId('brand-name-input').fill('Client Alpha')
  await page.getByTestId('brand-sector-input').fill('immobilier')
  await page.getByTestId('submit-button').click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByTestId('org-name')).toContainText('Mon Agence')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm run test:e2e -- onboarding.spec
```

Expected: FAIL.

- [ ] **Step 3: Écrire layout, page et action**

`app/(onboarding)/layout.tsx` :

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <div className="min-h-screen p-6">{children}</div>
}
```

`app/(onboarding)/onboarding/actions.ts` :

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding(_prev: unknown, formData: FormData) {
  const orgName = String(formData.get('orgName') ?? '').trim()
  const brandName = String(formData.get('brandName') ?? '').trim()
  const brandSector = String(formData.get('brandSector') ?? '').trim()
  if (!orgName || !brandName || !brandSector) {
    return { error: 'Tous les champs sont requis.' }
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('create_organization_with_brand', {
    org_name: orgName, brand_name: brandName, brand_sector: brandSector,
  })
  if (error) return { error: 'Création impossible, réessayez.' }
  redirect('/dashboard')
}
```

`app/(onboarding)/onboarding/page.tsx` :

```tsx
'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { completeOnboarding } from './actions'

export default function OnboardingPage() {
  const [state, action] = useActionState(completeOnboarding, null)
  return (
    <main className="mx-auto mt-16 max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Bienvenue sur Veracto</h1>
      <p className="text-sm text-gray-600">Créez votre organisation et votre première marque.</p>
      <form action={action} className="space-y-3">
        <input data-testid="org-name-input" name="orgName" placeholder="Nom de l’organisation"
          className="w-full rounded border p-2" required />
        <input data-testid="brand-name-input" name="brandName" placeholder="Nom de la marque"
          className="w-full rounded border p-2" required />
        <input data-testid="brand-sector-input" name="brandSector" placeholder="Secteur"
          className="w-full rounded border p-2" required />
        {state?.error && <p data-testid="form-error" className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton>Créer mon espace</SubmitButton>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Vérifier**

```bash
npm run test:e2e -- onboarding.spec
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(onboarding)" tests/e2e/onboarding.spec.ts
git commit -m "feat(app): onboarding organisation et premiere marque"
```

---

## Task 18: Dashboard minimal + déconnexion

**Files:**
- Create: `app/(app)/dashboard/page.tsx`, `app/(app)/logout/route.ts`
- Modify: `app/(app)/layout.tsx` (lien déconnexion + navigation)
- Test: `tests/e2e/dashboard.spec.ts`

**Interfaces:**
- Consumes: `getCurrentContext`, `createClient` serveur
- Produces: page `/dashboard` (état vide) + route `/logout`.

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/dashboard.spec.ts` :

```ts
import { expect, test } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

test('le dashboard affiche la marque active', async ({ page }) => {
  await signUpAndOnboard(page, { org: 'Dash Org', brand: 'Dash Brand', sector: 'tech' })
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByTestId('active-brand')).toContainText('Dash Brand')
})
```

Créer aussi le helper `tests/e2e/helpers.ts` (réutilisé par les tests suivants) :

```ts
import { type Page, expect } from '@playwright/test'

export async function signUpAndOnboard(
  page: Page,
  opts: { org: string; brand: string; sector: string },
) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`
  await page.goto('/signup')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('Passw0rd!test')
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL(/\/onboarding/)
  await page.getByTestId('org-name-input').fill(opts.org)
  await page.getByTestId('brand-name-input').fill(opts.brand)
  await page.getByTestId('brand-sector-input').fill(opts.sector)
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL(/\/dashboard/)
  return email
}
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm run test:e2e -- dashboard
```

Expected: FAIL.

- [ ] **Step 3: Écrire dashboard + logout + navigation**

`app/(app)/dashboard/page.tsx` :

```tsx
import { getCurrentContext } from '@/lib/auth/context'

export default async function DashboardPage() {
  const ctx = await getCurrentContext()
  const active = ctx?.brands.find((b) => b.id === ctx.activeBrandId)
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p data-testid="active-brand" className="text-gray-600">
        Marque active : {active?.name ?? 'aucune'}
      </p>
      <div className="rounded border border-dashed p-8 text-center text-gray-400">
        Votre veille apparaîtra ici prochainement.
      </div>
    </section>
  )
}
```

`app/(app)/logout/route.ts` :

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url))
}
```

Dans `app/(app)/layout.tsx`, ajouter dans le `<header>` une navigation :

```tsx
<nav className="flex items-center gap-4 text-sm">
  <a href="/dashboard" data-testid="nav-dashboard">Dashboard</a>
  <a href="/brands" data-testid="nav-brands">Marques</a>
  <a href="/settings/team" data-testid="nav-team">Équipe</a>
  <form action="/logout" method="post">
    <button type="submit" data-testid="logout">Déconnexion</button>
  </form>
</nav>
```

(remplacer les `<a>` internes par `next/link` — voir règle `next/link` obligatoire ; ils sont montrés en `<a>` ici pour la lisibilité, à convertir en `<Link>`.)

- [ ] **Step 4: Vérifier**

```bash
npm run test:e2e -- dashboard
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/dashboard" "app/(app)/logout" "app/(app)/layout.tsx" tests/e2e/dashboard.spec.ts tests/e2e/helpers.ts
git commit -m "feat(app): dashboard minimal et deconnexion"
```

---

## Task 19: Sélecteur de marque active

**Files:**
- Create: `components/brand-switcher.tsx`, `app/(app)/brands/set-active/route.ts`
- Modify: `app/(app)/layout.tsx` (insérer le switcher)
- Test: `tests/e2e/brand-switch.spec.ts`

**Interfaces:**
- Consumes: `getCurrentContext`
- Produces: dropdown de marques ; changement stocké en cookie `active_brand_id` via route `POST /brands/set-active`.

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/brand-switch.spec.ts` :

```ts
import { expect, test } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

test('changer de marque met à jour la marque active du dashboard', async ({ page }) => {
  await signUpAndOnboard(page, { org: 'Switch Org', brand: 'Alpha', sector: 'tech' })
  // Créer une 2e marque
  await page.goto('/brands')
  await page.getByTestId('brand-name-input').fill('Beta')
  await page.getByTestId('brand-sector-input').fill('retail')
  await page.getByTestId('submit-button').click()

  await page.getByTestId('brand-switcher').selectOption({ label: 'Beta' })
  await page.goto('/dashboard')
  await expect(page.getByTestId('active-brand')).toContainText('Beta')
})
```

> Ce test dépend de la page `/brands` (Task 20). Si exécuté avant, marquer comme dépendant ; l'ordre d'exécution du plan garantit Task 20 avant la validation finale. Pour respecter le rouge→vert isolé, écrire d'abord la partie switcher et valider le changement de cookie via un test unitaire de la route ci-dessous.

Test unitaire de la route (rouge d'abord) `app/(app)/brands/set-active/route.test.ts` :

```ts
import { expect, test } from 'vitest'
import { POST } from './route'

test('set-active pose le cookie active_brand_id et redirige', async () => {
  const form = new FormData()
  form.set('brandId', 'br-123')
  const res = await POST(new Request('http://localhost:3000/brands/set-active', {
    method: 'POST', body: form,
  }))
  expect(res.headers.get('set-cookie')).toContain('active_brand_id=br-123')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- app/\(app\)/brands/set-active/route.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Écrire la route et le switcher**

`app/(app)/brands/set-active/route.ts` :

```ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const form = await request.formData()
  const brandId = String(form.get('brandId') ?? '')
  const res = NextResponse.redirect(new URL(request.headers.get('referer') ?? '/dashboard', request.url))
  res.cookies.set('active_brand_id', brandId, { path: '/', httpOnly: false, sameSite: 'lax' })
  return res
}
```

`components/brand-switcher.tsx` :

```tsx
'use client'

import type { Brand } from '@/lib/types'

export function BrandSwitcher({ brands, activeId }: { brands: Brand[]; activeId: string | null }) {
  if (brands.length === 0) return null
  return (
    <form action="/brands/set-active" method="post">
      <select
        name="brandId"
        data-testid="brand-switcher"
        defaultValue={activeId ?? undefined}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border p-1 text-sm"
      >
        {brands.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </form>
  )
}
```

Insérer dans `app/(app)/layout.tsx` (header) :

```tsx
<BrandSwitcher brands={ctx.brands} activeId={ctx.activeBrandId} />
```

(importer `BrandSwitcher`.)

- [ ] **Step 4: Vérifier**

```bash
npm test -- app/\(app\)/brands/set-active/route.test.ts
npm run test:e2e -- brand-switch
```

Expected: unitaire PASS ; E2E PASS (après Task 20).

- [ ] **Step 5: Commit**

```bash
git add components/brand-switcher.tsx "app/(app)/brands/set-active" "app/(app)/layout.tsx" tests/e2e/brand-switch.spec.ts
git commit -m "feat(app): selecteur de marque active via cookie"
```

---

## Task 20: Gestion des marques (CRUD)

**Files:**
- Create: `app/(app)/brands/page.tsx`, `app/(app)/brands/actions.ts`
- Test: `tests/e2e/brands.spec.ts`

**Interfaces:**
- Consumes: `createClient` serveur, `getCurrentContext`, `SubmitButton`
- Produces: liste + création + suppression (avec confirmation) de marques. Actions `createBrand`, `deleteBrand`.

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/brands.spec.ts` :

```ts
import { expect, test } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

test('créer puis supprimer une marque', async ({ page }) => {
  await signUpAndOnboard(page, { org: 'Brands Org', brand: 'Première', sector: 'tech' })
  await page.goto('/brands')

  await page.getByTestId('brand-name-input').fill('Deuxième')
  await page.getByTestId('brand-sector-input').fill('sante')
  await page.getByTestId('submit-button').click()
  await expect(page.getByTestId('brands-list')).toContainText('Deuxième')

  page.on('dialog', (d) => d.accept())
  await page.getByTestId('delete-brand-Deuxième').click()
  await expect(page.getByTestId('brands-list')).not.toContainText('Deuxième')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm run test:e2e -- brands.spec
```

Expected: FAIL.

- [ ] **Step 3: Écrire actions et page**

`app/(app)/brands/actions.ts` :

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/auth/context'

export async function createBrand(_prev: unknown, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const sector = String(formData.get('sector') ?? '').trim()
  if (!name || !sector) return { error: 'Nom et secteur requis.' }
  const ctx = await getCurrentContext()
  if (!ctx?.organization) return { error: 'Organisation introuvable.' }

  const supabase = await createClient()
  const { error } = await supabase.from('brands').insert({
    organization_id: ctx.organization.id, name, sector,
  })
  if (error) return { error: 'Création impossible.' }
  revalidatePath('/brands')
  return { ok: true }
}

export async function deleteBrand(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const supabase = await createClient()
  await supabase.from('brands').delete().eq('id', id)
  revalidatePath('/brands')
}
```

`app/(app)/brands/page.tsx` :

```tsx
import { createClient } from '@/lib/supabase/server'
import { BrandForm } from './brand-form'
import { deleteBrand } from './actions'

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase
    .from('brands').select('id, name, sector').order('created_at', { ascending: true })

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Marques</h1>
      <BrandForm />
      <ul data-testid="brands-list" className="space-y-2">
        {(brands ?? []).map((b) => (
          <li key={b.id} className="flex items-center justify-between rounded border p-3">
            <span>{b.name} — <span className="text-gray-500">{b.sector}</span></span>
            <form action={deleteBrand}>
              <input type="hidden" name="id" value={b.id} />
              <button
                type="submit"
                data-testid={`delete-brand-${b.name}`}
                className="text-sm text-red-600"
                // confirmation explicite avant suppression
                onClick={(e) => { if (!confirm(`Supprimer la marque ${b.name} ?`)) e.preventDefault() }}
              >Supprimer</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

> `onClick` avec `confirm` impose `'use client'` sur le bouton. Extraire le bouton de suppression dans un petit composant client `DeleteBrandButton` (`components/delete-brand-button.tsx`) recevant `id`, `name` et l'action `deleteBrand` — pour garder la page en Server Component. La forme de création va aussi dans un composant client `brand-form.tsx` :

`app/(app)/brands/brand-form.tsx` :

```tsx
'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { createBrand } from './actions'

export function BrandForm() {
  const [state, action] = useActionState(createBrand, null)
  return (
    <form action={action} className="flex gap-2">
      <input data-testid="brand-name-input" name="name" placeholder="Nom"
        className="rounded border p-2" required />
      <input data-testid="brand-sector-input" name="sector" placeholder="Secteur"
        className="rounded border p-2" required />
      {state?.error && <p data-testid="form-error" className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton>Ajouter</SubmitButton>
    </form>
  )
}
```

`components/delete-brand-button.tsx` :

```tsx
'use client'

import { deleteBrand } from '@/app/(app)/brands/actions'

export function DeleteBrandButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteBrand}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        data-testid={`delete-brand-${name}`}
        className="text-sm text-red-600"
        onClick={(e) => { if (!confirm(`Supprimer la marque ${name} ?`)) e.preventDefault() }}
      >Supprimer</button>
    </form>
  )
}
```

Dans `page.tsx`, remplacer le `<form>` de suppression inline par `<DeleteBrandButton id={b.id} name={b.name} />`.

- [ ] **Step 4: Vérifier**

```bash
npm run test:e2e -- brands.spec
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/brands" components/delete-brand-button.tsx tests/e2e/brands.spec.ts
git commit -m "feat(app): crud des marques avec confirmation de suppression"
```

---

## Task 21: Email d'invitation via Resend

**Files:**
- Create: `lib/email/resend.ts`, `lib/email/templates/invitation.ts`
- Test: `lib/email/templates/invitation.test.ts`

**Interfaces:**
- Consumes: `RESEND_API_KEY` (env)
- Produces:
  - `sendEmail({ to, subject, html }) → Promise<{ ok: boolean }>` — `lib/email/resend.ts`
  - `invitationEmail({ orgName, acceptUrl }) → { subject, html }` — `lib/email/templates/invitation.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`lib/email/templates/invitation.test.ts` :

```ts
import { expect, test } from 'vitest'
import { invitationEmail } from './invitation'

test('l’email d’invitation contient le lien et le nom de l’org, sans email en clair', () => {
  const { subject, html } = invitationEmail({
    orgName: 'Mon Agence',
    acceptUrl: 'https://app.veracto.fr/invitations/accept?token=abc',
  })
  expect(subject).toContain('Mon Agence')
  expect(html).toContain('https://app.veracto.fr/invitations/accept?token=abc')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm test -- lib/email/templates/invitation.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Écrire le template et le sender**

`lib/email/templates/invitation.ts` :

```ts
export function invitationEmail(params: { orgName: string; acceptUrl: string }) {
  const { orgName, acceptUrl } = params
  return {
    subject: `Vous êtes invité à rejoindre ${orgName} sur Veracto`,
    html: `
      <p>Bonjour,</p>
      <p>Vous avez été invité à rejoindre l'organisation <strong>${orgName}</strong> sur Veracto.</p>
      <p><a href="${acceptUrl}">Accepter l'invitation</a></p>
      <p>Ce lien expirera prochainement.</p>
    `,
  }
}
```

`lib/email/resend.ts` :

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  try {
    await resend.emails.send({
      from: 'Veracto <noreply@veracto.fr>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    return { ok: true }
  } catch {
    // Échec loggé sans l'adresse ni le contenu (règle secure-logging).
    console.error('échec envoi email transactionnel')
    return { ok: false }
  }
}
```

- [ ] **Step 4: Vérifier**

```bash
npm test -- lib/email/templates/invitation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/email/
git commit -m "feat(email): envoi resend et template d invitation"
```

---

## Task 22: Gestion d'équipe — liste, invitation, rôles, retrait

**Files:**
- Create: `app/(app)/settings/team/page.tsx`, `app/(app)/settings/team/actions.ts`, `app/(app)/settings/team/team-forms.tsx`
- Test: `tests/e2e/team.spec.ts`

**Interfaces:**
- Consumes: `createClient` serveur, `getCurrentContext`, `sendEmail` + `invitationEmail` (Task 21), `MANAGER_ROLES` (Task 8)
- Produces: page équipe (owner/admin). Actions `inviteMember`, `changeRole`, `removeMember`.

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/team.spec.ts` :

```ts
import { expect, test } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

test('un owner peut inviter un membre et voir l’invitation en attente', async ({ page }) => {
  await signUpAndOnboard(page, { org: 'Team Org', brand: 'B', sector: 'tech' })
  await page.goto('/settings/team')

  await page.getByTestId('invite-email').fill('collegue@test.local')
  await page.getByTestId('invite-role').selectOption('member')
  await page.getByTestId('submit-button').click()

  await expect(page.getByTestId('pending-invitations')).toContainText('collegue@test.local')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm run test:e2e -- team.spec
```

Expected: FAIL.

- [ ] **Step 3: Écrire actions, page et formulaires**

`app/(app)/settings/team/actions.ts` :

```ts
'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/auth/context'
import { sendEmail } from '@/lib/email/resend'
import { invitationEmail } from '@/lib/email/templates/invitation'
import type { Role } from '@/lib/types'

const INVITE_TTL_DAYS = 7

export async function inviteMember(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const role = String(formData.get('role') ?? 'member') as Role
  if (!email) return { error: 'Email requis.' }

  const ctx = await getCurrentContext()
  if (!ctx?.organization) return { error: 'Organisation introuvable.' }

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400_000).toISOString()

  const supabase = await createClient()
  const { error } = await supabase.from('invitations').insert({
    organization_id: ctx.organization.id, email, role, token,
    invited_by: ctx.user.id, expires_at: expiresAt,
  })
  if (error) return { error: 'Invitation impossible (droits insuffisants ?).' }

  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/accept?token=${token}`
  const { subject, html } = invitationEmail({ orgName: ctx.organization.name, acceptUrl })
  await sendEmail({ to: email, subject, html }) // échec email non bloquant

  revalidatePath('/settings/team')
  return { ok: true }
}

export async function changeRole(formData: FormData) {
  const membershipId = String(formData.get('membershipId') ?? '')
  const role = String(formData.get('role') ?? 'member') as Role
  const supabase = await createClient()
  await supabase.from('memberships').update({ role }).eq('id', membershipId)
  revalidatePath('/settings/team')
}

export async function removeMember(formData: FormData) {
  const membershipId = String(formData.get('membershipId') ?? '')
  const supabase = await createClient()
  await supabase.from('memberships').delete().eq('id', membershipId)
  revalidatePath('/settings/team')
}
```

`app/(app)/settings/team/team-forms.tsx` :

```tsx
'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { inviteMember } from './actions'

export function InviteForm() {
  const [state, action] = useActionState(inviteMember, null)
  return (
    <form action={action} className="flex gap-2">
      <input data-testid="invite-email" name="email" type="email" placeholder="Email"
        className="rounded border p-2" required />
      <select data-testid="invite-role" name="role" className="rounded border p-2" defaultValue="member">
        <option value="member">Membre</option>
        <option value="admin">Admin</option>
      </select>
      {state?.error && <p data-testid="form-error" className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton>Inviter</SubmitButton>
    </form>
  )
}
```

`app/(app)/settings/team/page.tsx` :

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/auth/context'
import { MANAGER_ROLES } from '@/lib/types'
import { InviteForm } from './team-forms'

export default async function TeamPage() {
  const ctx = await getCurrentContext()
  if (!ctx?.role || !MANAGER_ROLES.includes(ctx.role)) redirect('/dashboard')

  const supabase = await createClient()
  const { data: members } = await supabase
    .from('memberships').select('id, role, profiles(full_name, id)')
  const { data: invites } = await supabase
    .from('invitations').select('email, role, accepted_at').is('accepted_at', null)

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Équipe</h1>
      <InviteForm />

      <div>
        <h2 className="font-semibold">Membres</h2>
        <ul data-testid="members-list" className="space-y-1">
          {(members ?? []).map((m) => (
            <li key={m.id} className="rounded border p-2 text-sm">{m.role}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold">Invitations en attente</h2>
        <ul data-testid="pending-invitations" className="space-y-1">
          {(invites ?? []).map((i) => (
            <li key={i.email} className="rounded border p-2 text-sm">{i.email} — {i.role}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

> `changeRole` et `removeMember` sont câblés via de petits composants client analogues à `DeleteBrandButton` (select `onChange` → submit ; bouton retrait avec `confirm`). Les garde-fous (dernier owner, anti-escalade) sont assurés côté Postgres (Task 6) : une action interdite renvoie une erreur DB, affichée génériquement.

- [ ] **Step 4: Vérifier**

```bash
npm run test:e2e -- team.spec
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/settings/team" tests/e2e/team.spec.ts
git commit -m "feat(app): gestion d equipe invitations et roles"
```

---

## Task 23: Acceptation d'invitation

**Files:**
- Create: `app/(auth)/invitations/accept/page.tsx`, `app/(auth)/invitations/accept/actions.ts`
- Test: `tests/e2e/accept-invitation.spec.ts`

**Interfaces:**
- Consumes: RPC `accept_invitation` (Task 7), `createClient` serveur
- Produces: page d'acceptation. Non connecté → renvoi vers login/signup avec retour. Connecté → appelle la RPC, redirige `/dashboard`.

- [ ] **Step 1: Écrire le test E2E qui échoue**

`tests/e2e/accept-invitation.spec.ts` :

```ts
import { expect, test } from '@playwright/test'
import { serviceClient, createUserClient } from '../helpers/db'
import { signUpAndOnboard } from './helpers'

test('un token invalide affiche un message d’invitation invalide', async ({ page }) => {
  // Un utilisateur connecté sans invitation valide
  await signUpAndOnboard(page, { org: 'Acc Org', brand: 'B', sector: 'tech' })
  await page.goto('/invitations/accept?token=inexistant')
  await expect(page.getByTestId('invite-status')).toContainText('invalide')
})
```

- [ ] **Step 2: Lancer — échoue**

```bash
npm run test:e2e -- accept-invitation
```

Expected: FAIL.

- [ ] **Step 3: Écrire l'action et la page**

`app/(auth)/invitations/accept/actions.ts` :

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function acceptInvitation(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'needs-auth' as const }

  const { error } = await supabase.rpc('accept_invitation', { invite_token: token })
  if (error) return { status: 'invalid' as const }
  return { status: 'accepted' as const }
}
```

`app/(auth)/invitations/accept/page.tsx` :

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { acceptInvitation } from './actions'

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) {
    return <p data-testid="invite-status" className="p-6">Invitation invalide.</p>
  }

  const result = await acceptInvitation(token)

  if (result.status === 'needs-auth') {
    redirect(`/login?next=${encodeURIComponent(`/invitations/accept?token=${token}`)}`)
  }
  if (result.status === 'accepted') {
    redirect('/dashboard')
  }

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-3 p-6 text-center">
      <p data-testid="invite-status" className="text-red-600">
        Invitation invalide, expirée ou déjà utilisée.
      </p>
      <p className="text-sm text-gray-600">Contactez l’administrateur qui vous a invité.</p>
      <Link href="/dashboard" className="underline">Retour</Link>
    </main>
  )
}
```

> Le middleware laisse passer `/invitations` (préfixe public, Task 9) : la page gère elle-même l'auth. Après login via `?next=`, adapter l'action `signIn` pour rediriger vers `next` s'il est présent (sinon `/dashboard`).

- [ ] **Step 4: Mettre à jour `signIn` pour honorer `next`**

Dans `app/(auth)/login/actions.ts`, remplacer la redirection finale :

```ts
export async function signIn(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/dashboard')
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Email ou mot de passe incorrect.' }
  redirect(next.startsWith('/') ? next : '/dashboard')
}
```

Ajouter un champ caché `next` dans le formulaire de login, alimenté par `searchParams.next`.

- [ ] **Step 5: Vérifier**

```bash
npm run test:e2e -- accept-invitation
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "app/(auth)/invitations" "app/(auth)/login"
git commit -m "feat(app): acceptation d invitation avec retour post login"
```

---

## Task 24: Config Playwright + parcours E2E complet

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/full-journey.spec.ts`
- Modify: `.github/workflows/ci.yml` (lancer Supabase + tests)

**Interfaces:**
- Consumes: toutes les tâches précédentes
- Produces: config Playwright (webServer auto), test bout-en-bout, CI branchée.

- [ ] **Step 1: Écrire la config Playwright**

`playwright.config.ts` :

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 2: Écrire le test bout-en-bout (rouge tant que le flux complet n'est pas vert)**

`tests/e2e/full-journey.spec.ts` :

```ts
import { expect, test } from '@playwright/test'
import { serviceClient } from '../helpers/db'
import { signUpAndOnboard } from './helpers'

test('parcours complet : inscription → onboarding → invitation → marque', async ({ page }) => {
  await signUpAndOnboard(page, { org: 'Journey Org', brand: 'Alpha', sector: 'tech' })

  // Inviter un membre
  await page.goto('/settings/team')
  await page.getByTestId('invite-email').fill('journey-invite@test.local')
  await page.getByTestId('invite-role').selectOption('member')
  await page.getByTestId('submit-button').click()
  await expect(page.getByTestId('pending-invitations')).toContainText('journey-invite@test.local')

  // Créer une marque supplémentaire
  await page.goto('/brands')
  await page.getByTestId('brand-name-input').fill('Beta')
  await page.getByTestId('brand-sector-input').fill('retail')
  await page.getByTestId('submit-button').click()
  await expect(page.getByTestId('brands-list')).toContainText('Beta')

  // Vérifier en base que l'invitation existe
  const db = serviceClient()
  const { data } = await db.from('invitations').select('email').eq('email', 'journey-invite@test.local')
  expect(data!.length).toBeGreaterThan(0)
})
```

- [ ] **Step 3: Lancer — vérifier vert**

```bash
npm run db:reset
npm run test:e2e -- full-journey
```

Expected: PASS.

- [ ] **Step 4: Brancher la CI**

Dans `.github/workflows/ci.yml`, ajouter un job qui installe Supabase CLI, lance `supabase start`, applique les migrations (`supabase db reset`), puis exécute `npm test` et `npm run test:e2e`. Variables d'env fournies via secrets/valeurs locales Supabase.

- [ ] **Step 5: Vérifier la suite complète**

```bash
npm run db:reset
npm test
npm run test:e2e
```

Expected: toute la suite PASS.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e/full-journey.spec.ts .github/workflows/ci.yml
git commit -m "test(e2e): parcours complet et integration ci"
```

---

## Self-Review

**Spec coverage :**
- Modèle de données (6 tables, enums) → Tasks 2, 3. ✅
- `plan_tier` + `plan_module` → Task 2. ✅
- RLS helpers + politiques → Tasks 4, 5. ✅
- Garde-fous (dernier owner, anti-escalade) → Task 6. ✅
- RPC onboarding + acceptation → Task 7. ✅
- Clients `@supabase/ssr` (browser/server/middleware) + service_role → Task 8. ✅
- Middleware protection + redirection onboarding → Tasks 9, 16. ✅
- Contexte org/rôle/marques → Task 10. ✅
- Auth : login, signup, Google OAuth, callback/confirm, reset → Tasks 12, 13, 14, 15. ✅
- Onboarding (org + 1re marque atomique) → Task 17. ✅
- Sélecteur de marque active (cookie) → Task 19. ✅
- Gestion d'équipe (invite/rôles/retrait) → Task 22. ✅
- Acceptation d'invitation (token, email match, expiration) → Tasks 7, 23. ✅
- CRUD marques + confirmation suppression → Task 20. ✅
- Dashboard minimal → Task 18. ✅
- Emails Resend, sans données perso en log → Task 21. ✅
- Tests RLS + garde-fous + E2E → Tasks 5, 6, 24. ✅
- Hors périmètre (Stripe, rôle client, gating UI) → non implémenté, conforme au spec. ✅

**Placeholder scan :** aucun « TBD/TODO ». Les notes en `>` signalent des refactors de découpage composant (page Server → sous-composants client) avec le code fourni ; pas de placeholder.

**Type consistency :** `Role`/`PlanTier`/`PlanModule` définis Task 8 et réutilisés tels quels ; RPC `create_organization_with_brand(org_name, brand_name, brand_sector)` et `accept_invitation(invite_token)` appelées avec les mêmes signatures aux Tasks 17 et 23 ; `getCurrentContext()`/`AuthContext` définis Task 10 et consommés Tasks 16, 18, 20, 22 ; `SubmitButton`, `sendEmail`, `invitationEmail`, `MANAGER_ROLES` cohérents entre définition et usages. ✅

---

## Notes d'exécution

- **Runtime de conteneurs requis** pour Supabase local (`supabase start`) — utiliser **OrbStack** (`brew install orbstack`), pas Docker Desktop. `supabase start` fonctionne sans changement.
- **Confirmation email désactivée en local** (`supabase/config.toml`) pour fluidifier les tests E2E ; réactivée en prod (emails via Resend configuré dans Supabase Auth).
- **Google OAuth** : secrets configurés hors repo (env / dashboard Supabase).
- Ordre d'exécution = ordre des tâches ; certains tests E2E (ex. Task 19) ne passent au vert qu'une fois leur page dépendante livrée (Task 20) — c'est intentionnel et signalé.
