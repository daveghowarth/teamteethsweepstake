create table if not exists public.tournament_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.tournament_state (id, data)
values ('live', '{}'::jsonb)
on conflict (id) do nothing;
