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
