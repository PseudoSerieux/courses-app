-- Run this once in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "uuid-ossp";

create table lists (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Courses',
  created_at timestamptz not null default now()
);

create table list_members (
  list_id uuid references lists(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create table categories (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid not null references lists(id) on delete cascade,
  name text not null,
  emoji text not null default '📦',
  position int not null default 0,
  is_collapsed boolean not null default false,
  created_at timestamptz not null default now()
);

create table items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references categories(id) on delete cascade,
  list_id uuid not null references lists(id) on delete cascade,
  name text not null,
  is_checked boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Helper: is the current user a member of this list?
create or replace function is_list_member(target_list_id uuid)
returns boolean as $$
  select exists (
    select 1 from list_members
    where list_id = target_list_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

alter table lists enable row level security;
alter table list_members enable row level security;
alter table categories enable row level security;
alter table items enable row level security;

-- lists: members can read; anyone authenticated can create (they become the first member right after)
create policy "members can view their lists" on lists
  for select using (is_list_member(id));
create policy "authenticated users can create lists" on lists
  for insert with check (auth.uid() is not null);

-- list_members: a member can see the roster of lists they belong to; a user can add themselves (join via invite link)
create policy "members can view roster" on list_members
  for select using (is_list_member(list_id));
create policy "users can add themselves to a list" on list_members
  for insert with check (user_id = auth.uid());

-- categories: full CRUD for list members only
create policy "members can view categories" on categories
  for select using (is_list_member(list_id));
create policy "members can insert categories" on categories
  for insert with check (is_list_member(list_id));
create policy "members can update categories" on categories
  for update using (is_list_member(list_id));
create policy "members can delete categories" on categories
  for delete using (is_list_member(list_id));

-- items: scoped directly via list_id (a direct-column check, not a subquery
-- through categories, so Supabase Realtime can reliably authorize INSERT/UPDATE
-- events the same way it already does for the categories table)
create policy "members can view items" on items
  for select using (is_list_member(list_id));
create policy "members can insert items" on items
  for insert with check (is_list_member(list_id));
create policy "members can update items" on items
  for update using (is_list_member(list_id));
create policy "members can delete items" on items
  for delete using (is_list_member(list_id));

-- Enable realtime on the tables the app subscribes to
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table profiles;

-- Each user has a permanent "own" list (created once, at signup, and never
-- overwritten) and an "active" list (the one currently displayed — their own,
-- or a partner's list they've linked to). Separating the two means linking to
-- someone else's list is always reversible with zero data loss.
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  own_list_id uuid not null references lists(id) on delete restrict,
  active_list_id uuid not null references lists(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "users can view their own profile" on profiles
  for select using (user_id = auth.uid());
create policy "users can update their own profile" on profiles
  for update using (user_id = auth.uid());

-- Runs automatically right after signup: creates a personal list, default
-- categories, and the profile row pointing at it.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_list_id uuid;
begin
  insert into lists (name) values ('Courses') returning id into new_list_id;
  insert into list_members (list_id, user_id) values (new_list_id, new.id);
  insert into profiles (user_id, own_list_id, active_list_id)
    values (new.id, new_list_id, new_list_id);
  insert into categories (list_id, name, emoji, position) values
    (new_list_id, 'Viandes', '🥩', 0),
    (new_list_id, 'Fruits', '🍎', 1),
    (new_list_id, 'Conserves', '🥫', 2);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fallback for accounts created before this trigger existed: reuses any
-- pre-existing list membership instead of creating a duplicate list.
create or replace function ensure_profile()
returns profiles as $$
declare
  result profiles;
  existing_list_id uuid;
begin
  select * into result from profiles where user_id = auth.uid();
  if found then
    return result;
  end if;

  select list_id into existing_list_id
  from list_members
  where user_id = auth.uid()
  order by created_at asc
  limit 1;

  if existing_list_id is null then
    insert into lists (name) values ('Courses') returning id into existing_list_id;
    insert into list_members (list_id, user_id) values (existing_list_id, auth.uid());
    insert into categories (list_id, name, emoji, position) values
      (existing_list_id, 'Viandes', '🥩', 0),
      (existing_list_id, 'Fruits', '🍎', 1),
      (existing_list_id, 'Conserves', '🥫', 2);
  end if;

  insert into profiles (user_id, own_list_id, active_list_id)
    values (auth.uid(), existing_list_id, existing_list_id)
    returning * into result;

  return result;
end;
$$ language plpgsql security definer set search_path = public;

-- Links the caller to another list by id: grants membership (if they don't
-- already have it) and switches their active list. own_list_id is untouched.
create or replace function link_to_list(target_list_id uuid)
returns void as $$
begin
  if not exists (select 1 from lists where id = target_list_id) then
    raise exception 'Liste introuvable. Vérifiez l''identifiant.';
  end if;

  insert into list_members (list_id, user_id) values (target_list_id, auth.uid())
    on conflict (list_id, user_id) do nothing;

  update profiles set active_list_id = target_list_id where user_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

-- Reverts the caller back to their own permanent list.
create or replace function unlink_active_list()
returns void as $$
begin
  update profiles set active_list_id = own_list_id where user_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

-- Returns the email of every member of a list, but only to callers who are
-- themselves a member of it. Needed because emails live in the auth schema,
-- which client queries can't read directly.
create or replace function list_members_info(target_list_id uuid)
returns table(user_id uuid, email text) as $$
begin
  if not is_list_member(target_list_id) then
    raise exception 'Accès refusé.';
  end if;

  return query
    select lm.user_id, u.email::text
    from list_members lm
    join auth.users u on u.id = lm.user_id
    where lm.list_id = target_list_id;
end;
$$ language plpgsql security definer set search_path = public;

-- Removes someone from the caller's own list. Only the list's owner may call
-- this (own_list_id must belong to the caller). If the removed person was
-- actively viewing this list, they're automatically switched back to their
-- own permanent list — never left pointing at a list they no longer belong to.
create or replace function kick_member(target_user_id uuid)
returns void as $$
declare
  caller_own_list uuid;
begin
  select own_list_id into caller_own_list from profiles where user_id = auth.uid();
  if caller_own_list is null then
    raise exception 'Profil introuvable.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas vous retirer vous-même.';
  end if;

  delete from list_members where list_id = caller_own_list and user_id = target_user_id;

  update profiles
  set active_list_id = own_list_id
  where user_id = target_user_id and active_list_id = caller_own_list;
end;
$$ language plpgsql security definer set search_path = public;
