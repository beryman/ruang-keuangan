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

-- v34: akses bersama (pasangan). Pemilik mengundang email; anggota memakai baris snapshot pemilik.
create table if not exists public.snapshot_members (
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_email text not null default '',
  member_email text not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, member_email)
);
alter table public.snapshot_members enable row level security;
revoke all on public.snapshot_members from anon;
grant select, insert, update, delete on public.snapshot_members to authenticated;
drop policy if exists "owner manages members" on public.snapshot_members;
create policy "owner manages members" on public.snapshot_members for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', '')));
drop policy if exists "member sees own invites" on public.snapshot_members;
create policy "member sees own invites" on public.snapshot_members for select to authenticated
  using (lower(member_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "User can access own finance snapshot" on public.app_snapshots;
drop policy if exists "Owner or member can access snapshot" on public.app_snapshots;
create policy "Owner or member can access snapshot"
  on public.app_snapshots
  for all
  to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.snapshot_members m
               where m.owner_id = app_snapshots.user_id
                 and lower(m.member_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  )
  with check (
    auth.uid() = user_id
    or exists (select 1 from public.snapshot_members m
               where m.owner_id = app_snapshots.user_id
                 and lower(m.member_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

-- v32: foto nota & bukti transfer di Storage (bucket privat, tiap akun hanya bisa akses foldernya sendiri).
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false) on conflict (id) do nothing;
-- Folder = id pemilik data; anggota yang diundang boleh memakai folder pemilik.
drop policy if exists "receipts own read" on storage.objects;
drop policy if exists "receipts own insert" on storage.objects;
drop policy if exists "receipts own update" on storage.objects;
drop policy if exists "receipts own delete" on storage.objects;
create policy "receipts own read" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.snapshot_members m where m.owner_id::text = (storage.foldername(name))[1] and lower(m.member_email) = lower(coalesce(auth.jwt() ->> 'email', '')))));
create policy "receipts own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.snapshot_members m where m.owner_id::text = (storage.foldername(name))[1] and lower(m.member_email) = lower(coalesce(auth.jwt() ->> 'email', '')))));
create policy "receipts own update" on storage.objects for update to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.snapshot_members m where m.owner_id::text = (storage.foldername(name))[1] and lower(m.member_email) = lower(coalesce(auth.jwt() ->> 'email', '')))));
create policy "receipts own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.snapshot_members m where m.owner_id::text = (storage.foldername(name))[1] and lower(m.member_email) = lower(coalesce(auth.jwt() ->> 'email', '')))));
