-- ============================================================
-- NBA Tippspiel - Initial Schema
-- ============================================================

-- ============================================
-- TEAMS (Stammdaten, balldontlie team IDs)
-- ============================================
create table public.teams (
  id           int primary key,
  abbreviation text not null,
  full_name    text not null,
  conference   text not null check (conference in ('East', 'West'))
);

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text not null,
  has_seen_welcome boolean not null default false,
  created_at       timestamptz not null default now()
);

-- Trigger: lege bei jeder neuen auth.users Zeile auch ein profile an.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- SERIES (eine Playoff-Serie zwischen zwei Teams)
-- ============================================
create table public.series (
  id              uuid primary key default gen_random_uuid(),
  round           int not null check (round between 1 and 4),
  conference      text not null check (conference in ('East', 'West', 'Finals')),
  team_a_id       int not null references public.teams(id),
  team_b_id       int not null references public.teams(id),
  starts_at       timestamptz,
  winner_team_id  int references public.teams(id),
  games_played    int check (games_played between 4 and 7),
  status          text not null default 'upcoming' check (status in ('upcoming', 'live', 'finished')),
  created_at      timestamptz not null default now(),
  unique (round, conference, team_a_id, team_b_id)
);

-- ============================================
-- GAMES (Einzelspiele, optional einer Serie zugeordnet)
-- ============================================
create table public.games (
  id              uuid primary key default gen_random_uuid(),
  external_id     text unique,
  series_id       uuid references public.series(id) on delete set null,
  home_team_id    int not null references public.teams(id),
  away_team_id    int not null references public.teams(id),
  tip_off         timestamptz not null,
  home_score      int,
  away_score      int,
  winner_team_id  int references public.teams(id),
  status          text not null default 'scheduled' check (status in ('scheduled', 'live', 'final')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index games_tip_off_idx on public.games(tip_off);
create index games_series_idx on public.games(series_id);
create index games_status_idx on public.games(status);

-- ============================================
-- GAME TIPS (1 Tipp pro User pro Spiel)
-- ============================================
create table public.game_tips (
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  game_id                  uuid not null references public.games(id) on delete cascade,
  predicted_winner_team_id int not null references public.teams(id),
  points_awarded           int,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- ============================================
-- SERIES TIPS (1 Tipp pro User pro Serie: Sieger + Anzahl Spiele)
-- ============================================
create table public.series_tips (
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  series_id                uuid not null references public.series(id) on delete cascade,
  predicted_winner_team_id int not null references public.teams(id),
  predicted_games          int not null check (predicted_games between 4 and 7),
  points_awarded           int,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  primary key (user_id, series_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.teams       enable row level security;
alter table public.series      enable row level security;
alter table public.games       enable row level security;
alter table public.game_tips   enable row level security;
alter table public.series_tips enable row level security;

-- Stammdaten: alle authentifizierten duerfen lesen
create policy "profiles_select_all_authenticated"
  on public.profiles for select to authenticated using (true);

create policy "profiles_update_own"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "teams_select_all_authenticated"
  on public.teams for select to authenticated using (true);

create policy "series_select_all_authenticated"
  on public.series for select to authenticated using (true);

create policy "games_select_all_authenticated"
  on public.games for select to authenticated using (true);

-- ----------------------------------------------------------
-- GAME TIPS RLS:
--   * eigene Tipps immer sichtbar
--   * fremde Tipps nur sichtbar wenn entweder
--       (a) man selbst fuer dieses Spiel getippt hat, oder
--       (b) der Tip-Off bereits begonnen hat.
--   * INSERT/UPDATE nur fuer eigene Tipps und nur vor tip_off.
-- ----------------------------------------------------------
create policy "game_tips_select_own"
  on public.game_tips for select to authenticated
  using (auth.uid() = user_id);

create policy "game_tips_select_others_after_lock_or_tipped"
  on public.game_tips for select to authenticated
  using (
    auth.uid() <> user_id
    and (
      exists (
        select 1 from public.game_tips own
        where own.user_id = auth.uid() and own.game_id = game_tips.game_id
      )
      or exists (
        select 1 from public.games g
        where g.id = game_tips.game_id and g.tip_off <= now()
      )
    )
  );

create policy "game_tips_insert_own_before_lock"
  on public.game_tips for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.games g
      where g.id = game_id and g.tip_off > now()
    )
  );

create policy "game_tips_update_own_before_lock"
  on public.game_tips for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.games g
      where g.id = game_id and g.tip_off > now()
    )
  );

-- ----------------------------------------------------------
-- SERIES TIPS RLS: gleiche Logik wie game_tips, mit series.starts_at als Lock
-- ----------------------------------------------------------
create policy "series_tips_select_own"
  on public.series_tips for select to authenticated
  using (auth.uid() = user_id);

create policy "series_tips_select_others_after_lock_or_tipped"
  on public.series_tips for select to authenticated
  using (
    auth.uid() <> user_id
    and (
      exists (
        select 1 from public.series_tips own
        where own.user_id = auth.uid() and own.series_id = series_tips.series_id
      )
      or exists (
        select 1 from public.series s
        where s.id = series_tips.series_id and s.starts_at is not null and s.starts_at <= now()
      )
    )
  );

create policy "series_tips_insert_own_before_lock"
  on public.series_tips for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.series s
      where s.id = series_id and (s.starts_at is null or s.starts_at > now())
    )
  );

create policy "series_tips_update_own_before_lock"
  on public.series_tips for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.series s
      where s.id = series_id and (s.starts_at is null or s.starts_at > now())
    )
  );
