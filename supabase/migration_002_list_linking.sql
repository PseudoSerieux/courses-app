-- Run this in your existing Supabase project's SQL Editor.
-- It adds the "own list vs active list" system on top of your current setup,
-- without touching your existing data.

drop function if exists create_list_with_membership(text);

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

create or replace function unlink_active_list()
returns void as $$
begin
  update profiles set active_list_id = own_list_id where user_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;
