-- ============================================================
-- Champion-Tipp: User tippt auf den NBA-Finals-Sieger.
-- Freischaltung: sobald Conf-Finals-Series (round=3) in der DB sind.
-- Lock: sobald das erste R3-Spiel angepfiffen ist.
-- Punktevergabe: 10 Pkt fuer richtigen Champion.
-- ============================================================

create table public.champion_tips (
  user_id                     uuid primary key references public.profiles(id) on delete cascade,
  predicted_champion_team_id  int not null references public.teams(id),
  points_awarded              int,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

alter table public.champion_tips enable row level security;

-- Helper: hat $user bereits einen Champion-Tipp?
create or replace function public.user_has_champion_tip(p_user uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists(select 1 from public.champion_tips where user_id = p_user);
$$;

-- Helper: Champion-Tipping ist gelockt sobald irgendein Conf-Finals-Spiel
-- bereits angepfiffen wurde.
create or replace function public.champion_tipping_locked()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists(
    select 1 from public.games g
    join public.series s on s.id = g.series_id
    where s.round = 3 and g.tip_off <= now()
  );
$$;

grant execute on function public.user_has_champion_tip(uuid) to authenticated;
grant execute on function public.champion_tipping_locked() to authenticated;

-- Eigener Tipp immer sichtbar
create policy "champion_tips_select_own"
  on public.champion_tips for select to authenticated
  using (auth.uid() = user_id);

-- Fremde Tipps sichtbar wenn ich selbst getippt habe ODER der Lock greift
create policy "champion_tips_select_others"
  on public.champion_tips for select to authenticated
  using (
    auth.uid() <> user_id
    and (
      public.user_has_champion_tip(auth.uid())
      or public.champion_tipping_locked()
    )
  );

-- Insert: nur eigener User, nur vor Lock
create policy "champion_tips_insert_own"
  on public.champion_tips for insert to authenticated
  with check (
    auth.uid() = user_id
    and not public.champion_tipping_locked()
  );
