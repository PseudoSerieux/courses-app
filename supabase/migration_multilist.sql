-- Lists can now have an explicit owner, letting each user create several
-- of their own lists (not just the single default one from signup).
alter table lists add column if not exists owner_id uuid references auth.users(id) on delete cascade;

-- Backfill: whoever's own_list_id already points to a list is that list's owner.
update lists set owner_id = profiles.user_id
from profiles
where profiles.own_list_id = lists.id
  and lists.owner_id is null;

alter table lists alter column owner_id set not null;

alter table lists enable row level security;
drop policy if exists "members can view their lists" on lists;
drop policy if exists "authenticated users can create lists" on lists;

create policy "members can view their lists" on lists
  for select using (is_list_member(id));
create policy "owners can update their lists" on lists
  for update using (owner_id = auth.uid());

-- Creates a brand-new list owned by the caller (with starter categories),
-- and immediately switches the caller to it.
create or replace function create_list(list_name text default 'Nouvelle liste')
returns lists as $$
declare
  new_list lists;
begin
  insert into lists (name, owner_id) values (list_name, auth.uid()) returning * into new_list;
  insert into list_members (list_id, user_id) values (new_list.id, auth.uid());
  insert into categories (list_id, name, emoji, position) values
    (new_list.id, 'Viandes', '🥩', 0),
    (new_list.id, 'Fruits', '🍎', 1),
    (new_list.id, 'Conserves', '🥫', 2);
  update profiles set active_list_id = new_list.id where user_id = auth.uid();
  return new_list;
end;
$$ language plpgsql security definer set search_path = public;

-- Lists you personally created — shown in the hamburger menu.
create or replace function my_lists()
returns setof lists as $$
  select * from lists where owner_id = auth.uid() order by created_at asc;
$$ language sql security definer set search_path = public;

-- All lists you can currently see (yours + ones you've linked to), flagged
-- with whether you own each one — used to split the hamburger menu into
-- "Vos listes" vs "Listes auxquelles vous participez".
create or replace function my_visible_lists()
returns table(id uuid, name text, owner_id uuid, created_at timestamptz, is_owner boolean) as $$
  select l.id, l.name, l.owner_id, l.created_at, (l.owner_id = auth.uid()) as is_owner
  from lists l
  join list_members lm on lm.list_id = l.id
  where lm.user_id = auth.uid()
  order by is_owner desc, l.created_at asc;
$$ language sql security definer set search_path = public;

-- Lists you're linked to but don't own — shown in a separate section.
create or replace function linked_lists()
returns setof lists as $$
  select l.* from lists l
  join list_members lm on lm.list_id = l.id
  where lm.user_id = auth.uid() and l.owner_id != auth.uid()
  order by l.created_at asc;
$$ language sql security definer set search_path = public;

-- Deletes a list you own. Your original default list is protected (can't be
-- deleted, enforced below and by the "on delete restrict" on own_list_id).
-- Anyone currently viewing the deleted list — including you — falls back to
-- their own default list, so nobody is left pointing at nothing.
create or replace function delete_list(target_list_id uuid)
returns void as $$
declare
  my_default_list_id uuid;
begin
  select own_list_id into my_default_list_id from profiles where user_id = auth.uid();

  if target_list_id = my_default_list_id then
    raise exception 'Vous ne pouvez pas supprimer votre liste par défaut.';
  end if;

  if not exists (select 1 from lists where id = target_list_id and owner_id = auth.uid()) then
    raise exception 'Vous ne pouvez supprimer que vos propres listes.';
  end if;

  update profiles
  set active_list_id = own_list_id
  where active_list_id = target_list_id;

  delete from lists where id = target_list_id;
end;
$$ language plpgsql security definer set search_path = public;

-- Switches your active (currently viewed) list to any list you already
-- belong to — your own, or one you've linked to.
create or replace function switch_active_list(target_list_id uuid)
returns void as $$
begin
  if not is_list_member(target_list_id) then
    raise exception 'Vous n''êtes pas membre de cette liste.';
  end if;
  update profiles set active_list_id = target_list_id where user_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

-- kick_member now targets an explicit list, since you may own several.
drop function if exists kick_member(uuid);
create or replace function kick_member(target_user_id uuid, target_list_id uuid)
returns void as $$
begin
  if not exists (select 1 from lists where id = target_list_id and owner_id = auth.uid()) then
    raise exception 'Vous ne pouvez retirer quelqu''un que de vos propres listes.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas vous retirer vous-même.';
  end if;

  delete from list_members where list_id = target_list_id and user_id = target_user_id;

  update profiles
  set active_list_id = own_list_id
  where user_id = target_user_id and active_list_id = target_list_id;
end;
$$ language plpgsql security definer set search_path = public;
