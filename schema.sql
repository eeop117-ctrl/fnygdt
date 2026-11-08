-- DEMUSICAL complete Supabase schema
create extension if not exists pgcrypto;

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  banner_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text,
  description text,
  audio_url text not null,
  cover_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_tracks (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,track_id)
);

create index if not exists tracks_created_at_idx on public.tracks(created_at desc);
create index if not exists tracks_user_id_idx on public.tracks(user_id);

alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.saved_tracks enable row level security;

-- Profiles
drop policy if exists "DEMUSICAL profiles public read" on public.profiles;
drop policy if exists "DEMUSICAL profiles own insert" on public.profiles;
drop policy if exists "DEMUSICAL profiles own update" on public.profiles;

create policy "DEMUSICAL profiles public read" on public.profiles for select to public using (true);
create policy "DEMUSICAL profiles own insert" on public.profiles for insert to authenticated with check (id=auth.uid());
create policy "DEMUSICAL profiles own update" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

-- Tracks
drop policy if exists "DEMUSICAL tracks public read" on public.tracks;
drop policy if exists "DEMUSICAL tracks authenticated insert" on public.tracks;
drop policy if exists "DEMUSICAL tracks owner update" on public.tracks;
drop policy if exists "DEMUSICAL tracks owner delete" on public.tracks;

create policy "DEMUSICAL tracks public read" on public.tracks for select to public using (true);
create policy "DEMUSICAL tracks authenticated insert" on public.tracks for insert to authenticated with check (user_id=auth.uid());
create policy "DEMUSICAL tracks owner update" on public.tracks for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "DEMUSICAL tracks owner delete" on public.tracks for delete to authenticated using (user_id=auth.uid());

-- Saved
drop policy if exists "DEMUSICAL saved read" on public.saved_tracks;
drop policy if exists "DEMUSICAL saved insert" on public.saved_tracks;
drop policy if exists "DEMUSICAL saved delete" on public.saved_tracks;

create policy "DEMUSICAL saved read" on public.saved_tracks for select to authenticated using (user_id=auth.uid());
create policy "DEMUSICAL saved insert" on public.saved_tracks for insert to authenticated with check (user_id=auth.uid());
create policy "DEMUSICAL saved delete" on public.saved_tracks for delete to authenticated using (user_id=auth.uid());

-- Storage buckets
insert into storage.buckets(id,name,public) values ('audio','audio',true) on conflict(id) do update set public=true;
insert into storage.buckets(id,name,public) values ('covers','covers',true) on conflict(id) do update set public=true;

-- Storage policies
drop policy if exists "DEMUSICAL audio public read" on storage.objects;
drop policy if exists "DEMUSICAL covers public read" on storage.objects;
drop policy if exists "DEMUSICAL audio upload" on storage.objects;
drop policy if exists "DEMUSICAL covers upload" on storage.objects;
drop policy if exists "DEMUSICAL audio update" on storage.objects;
drop policy if exists "DEMUSICAL covers update" on storage.objects;
drop policy if exists "DEMUSICAL audio delete" on storage.objects;
drop policy if exists "DEMUSICAL covers delete" on storage.objects;

create policy "DEMUSICAL audio public read" on storage.objects for select to public using (bucket_id='audio');
create policy "DEMUSICAL covers public read" on storage.objects for select to public using (bucket_id='covers');

create policy "DEMUSICAL audio upload" on storage.objects for insert to authenticated with check (bucket_id='audio');
create policy "DEMUSICAL covers upload" on storage.objects for insert to authenticated with check (bucket_id='covers');

create policy "DEMUSICAL audio update" on storage.objects for update to authenticated using (bucket_id='audio' and owner_id=auth.uid()::text) with check (bucket_id='audio' and owner_id=auth.uid()::text);
create policy "DEMUSICAL covers update" on storage.objects for update to authenticated using (bucket_id='covers' and owner_id=auth.uid()::text) with check (bucket_id='covers' and owner_id=auth.uid()::text);

create policy "DEMUSICAL audio delete" on storage.objects for delete to authenticated using (bucket_id='audio' and owner_id=auth.uid()::text);
create policy "DEMUSICAL covers delete" on storage.objects for delete to authenticated using (bucket_id='covers' and owner_id=auth.uid()::text);
