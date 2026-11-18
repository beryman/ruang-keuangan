-- Jalankan sekali pada Supabase Dashboard > SQL Editor.
-- Snapshot dipisahkan per akun login dan hanya pemilik yang dapat mengakses barisnya.
create table if not exists public.app_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_snapshots enable row level security;

revoke all on public.app_snapshots from anon;
grant select, insert, update, delete on public.app_snapshots to authenticated;

drop policy if exists "User can access own finance snapshot" on public.app_snapshots;
create policy "User can access own finance snapshot"
  on public.app_snapshots
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
