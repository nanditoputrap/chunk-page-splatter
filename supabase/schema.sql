create table if not exists public.app_state (
  id text primary key,
  school_data jsonb not null default '[]'::jsonb,
  submissions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "Allow anon read app_state" on public.app_state;
create policy "Allow anon read app_state"
on public.app_state
for select
using (true);

drop policy if exists "Allow anon write app_state" on public.app_state;
create policy "Allow anon write app_state"
on public.app_state
for insert
with check (true);

drop policy if exists "Allow anon update app_state" on public.app_state;
create policy "Allow anon update app_state"
on public.app_state
for update
using (true)
with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.app_state to anon, authenticated;
