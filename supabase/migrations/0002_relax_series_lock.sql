-- ============================================================
-- Series-Tipps duerfen bis zum Ende der Serie (status != 'finished')
-- abgegeben/aktualisiert werden, nicht mehr nur bis zum ersten Spiel.
-- Sinnvoll fuer Tippspielrunden, die mitten in den Playoffs starten.
-- ============================================================

drop policy if exists "series_tips_insert_own_before_lock" on public.series_tips;
drop policy if exists "series_tips_update_own_before_lock" on public.series_tips;

create policy "series_tips_insert_own_until_finished"
  on public.series_tips for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.series s
      where s.id = series_id and s.status <> 'finished'
    )
  );

create policy "series_tips_update_own_until_finished"
  on public.series_tips for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.series s
      where s.id = series_id and s.status <> 'finished'
    )
  );
