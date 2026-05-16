-- ============================================================
-- Fix: infinite recursion in RLS policies for game_tips / series_tips
--
-- Die Policy "fremde Tipps sichtbar wenn ich selbst getippt habe"
-- prueft per `exists (select 1 from public.game_tips own ...)` die
-- gleiche Tabelle - das triggert die Policy erneut und Postgres
-- bricht mit "infinite recursion" ab. Loesung: den Check ueber eine
-- SECURITY DEFINER Funktion machen, die RLS bypasst.
-- ============================================================

-- Alte rekursive SELECT-Policies entfernen
drop policy if exists "game_tips_select_others_after_lock_or_tipped" on public.game_tips;
drop policy if exists "series_tips_select_others_after_lock_or_tipped" on public.series_tips;

-- Helper-Funktion: hat $user fuer $game schon einen Tipp abgegeben?
-- SECURITY DEFINER laesst die Funktion mit den Rechten des Owners
-- laufen und umgeht damit RLS - so entsteht keine Recursion.
create or replace function public.user_has_game_tip(p_user uuid, p_game uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.game_tips
    where user_id = p_user and game_id = p_game
  );
$$;

create or replace function public.user_has_series_tip(p_user uuid, p_series uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.series_tips
    where user_id = p_user and series_id = p_series
  );
$$;

-- Funktionen fuer authenticated user verfuegbar machen
grant execute on function public.user_has_game_tip(uuid, uuid) to authenticated;
grant execute on function public.user_has_series_tip(uuid, uuid) to authenticated;

-- Neue Policies ohne Recursion: nutzen die Helper-Functions
create policy "game_tips_select_others_after_lock_or_tipped"
  on public.game_tips for select to authenticated
  using (
    auth.uid() <> user_id
    and (
      public.user_has_game_tip(auth.uid(), game_id)
      or exists (
        select 1 from public.games g
        where g.id = game_tips.game_id and g.tip_off <= now()
      )
    )
  );

create policy "series_tips_select_others_after_lock_or_tipped"
  on public.series_tips for select to authenticated
  using (
    auth.uid() <> user_id
    and (
      public.user_has_series_tip(auth.uid(), series_id)
      or exists (
        select 1 from public.series s
        where s.id = series_tips.series_id
          and s.starts_at is not null
          and s.starts_at <= now()
      )
    )
  );
