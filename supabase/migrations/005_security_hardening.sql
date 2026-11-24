-- Security hardening (2026-11)
--
-- 1. increment_player_score was executable by anon/authenticated, so anyone holding
--    the public anon key could set any player's score. Only the Edge Function
--    (service_role) needs it.
-- 2. Players could insert themselves as role='host' into any game (and then control it
--    via the host-only policies). Now 'host' is only allowed for the first player of a game.
-- 3. "Players update self" let a player change their own score / role / game_id.
--    The app never updates players from the client, so only the name column stays updatable.

-- 1. score RPC: service_role only
revoke execute on function public.increment_player_score(uuid, integer) from anon, authenticated;

-- 2. host role only for the first player in a game
create or replace function public.game_has_players(p_game_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.players where game_id = p_game_id);
$$;

revoke all on function public.game_has_players(uuid) from public;
grant execute on function public.game_has_players(uuid) to authenticated;

drop policy if exists "Players insert self only" on public.players;
create policy "Players insert self only" on public.players
  for insert with check (
    user_id = auth.uid()
    and score = 0
    and (role = 'player' or not public.game_has_players(game_id))
  );

-- 3. players: clients may only rename themselves
revoke update on public.players from anon, authenticated;
grant update (name) on public.players to authenticated;
