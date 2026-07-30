-- Patch du guard d'escalade de privilèges : autoriser le cas bootstrap
-- (première insertion d'un owner quand l'org n'en a pas encore)
create or replace function prevent_privilege_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  existing_owners int;
begin
  if new.role = 'owner'
     and auth.uid() is not null
     and not auth_has_role(new.organization_id, array['owner']::role[]) then
    -- Cas bootstrap : première désignation d'owner (org vide de owners)
    select count(*) into existing_owners
    from memberships
    where organization_id = new.organization_id and role = 'owner';

    if existing_owners > 0 then
      raise exception 'seul un owner peut désigner un owner';
    end if;
  end if;
  return new;
end;
$$;

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
