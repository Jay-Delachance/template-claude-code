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
