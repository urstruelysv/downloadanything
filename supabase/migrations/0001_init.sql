create extension if not exists "pgcrypto";

create table if not exists subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  ls_subscription_id text unique,
  status text not null,
  plan text not null,
  renews_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  ip inet,
  url text not null,
  platform text not null,
  format text,
  bytes bigint,
  status text not null,
  error text,
  created_at timestamptz default now()
);

create index if not exists downloads_user_created_idx
  on downloads (user_id, created_at desc);
create index if not exists downloads_ip_created_idx
  on downloads (ip, created_at desc);

alter table subscriptions enable row level security;
alter table downloads enable row level security;

drop policy if exists "owner reads sub" on subscriptions;
create policy "owner reads sub" on subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "owner reads downloads" on downloads;
create policy "owner reads downloads" on downloads
  for select using (auth.uid() = user_id);
