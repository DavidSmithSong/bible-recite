create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.card_states (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  verse_id integer not null,
  interval integer not null default 0,
  ease_factor numeric(4, 2) not null default 2.5,
  due_date date not null,
  repetitions integer not null default 0,
  consecutive_correct integer not null default 0,
  passed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (profile_id, verse_id)
);

create table if not exists public.history_entries (
  id bigserial primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  verse_id integer not null,
  date date not null,
  ts timestamptz not null,
  mode text not null check (mode in ('recite', 'reference')),
  correct boolean not null,
  missed_count integer not null default 0
);

create index if not exists card_states_profile_id_idx on public.card_states (profile_id);
create index if not exists history_entries_profile_ts_idx on public.history_entries (profile_id, ts desc);
