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
