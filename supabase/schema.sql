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

-- items: scoped through their parent category's list
create policy "members can view items" on items
  for select using (is_list_member((select list_id from categories where id = category_id)));
create policy "members can insert items" on items
  for insert with check (is_list_member((select list_id from categories where id = category_id)));
create policy "members can update items" on items
  for update using (is_list_member((select list_id from categories where id = category_id)));
create policy "members can delete items" on items
  for delete using (is_list_member((select list_id from categories where id = category_id)));

-- Enable realtime on the tables the app subscribes to
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table items;
