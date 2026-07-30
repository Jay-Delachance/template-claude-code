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
