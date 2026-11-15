create table if not exists public.messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 120),
  message text not null check (char_length(message) between 10 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.site_stats (
  id int primary key check (id = 1),
  visits bigint not null default 0
);
insert into public.site_stats (id, visits) values (1, 0) on conflict do nothing;

-- Atomic increment: safe even with simultaneous visitors
create or replace function public.increment_visits()
returns bigint language sql security definer set search_path = public as $$
  update public.site_stats set visits = visits + 1 where id = 1 returning visits;
$$;

-- Lock tables down; only the Flask server (service role) can use them
alter table public.messages enable row level security;
alter table public.site_stats enable row level security;
revoke all on function public.increment_visits() from public, anon, authenticated;
grant execute on function public.increment_visits() to service_role;
