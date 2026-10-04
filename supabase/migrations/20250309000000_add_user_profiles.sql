-- Public application data for authenticated users. Supabase's auth.users table
-- is managed by Auth, so user-facing attributes belong in a profile table.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Authenticated users can view registered users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    case
      when lower(new.email) = 'fran.moreno.se@gmail.com' then 'Fran'
      when lower(new.email) = 'paulaval214@gmail.com' then 'Paula'
      else coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1))
    end
  )
  on conflict (id) do update
  set email = excluded.email,
      name = excluded.name,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.handle_new_user_profile();

-- Backfill users that existed before this migration.
insert into public.profiles (id, email, name)
select
  id,
  email,
  case
    when lower(email) = 'fran.moreno.se@gmail.com' then 'Fran'
    when lower(email) = 'paulaval214@gmail.com' then 'Paula'
    else coalesce(nullif(trim(raw_user_meta_data ->> 'name'), ''), split_part(email, '@', 1))
  end
from auth.users
where email is not null
on conflict (id) do update
set email = excluded.email,
    name = excluded.name,
    updated_at = now();
