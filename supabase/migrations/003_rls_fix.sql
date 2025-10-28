-- RLS recursion fix: use SECURITY DEFINER helpers instead of self-referencing subqueries

-- Helpers
create or replace function public.is_member(p_game_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.players
    where game_id = p_game_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_host(p_game_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.players
    where game_id = p_game_id and user_id = auth.uid() and role = 'host'
  );
$$;

create or replace function public.is_self_player(p_player_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.players
    where id = p_player_id and user_id = auth.uid()
  );
$$;

-- GAMES
drop policy if exists "Games readable to members" on public.games;
create policy "Games readable to members" on public.games
  for select using (public.is_member(id));

drop policy if exists "Games update by host only" on public.games;
create policy "Games update by host only" on public.games
  for update using (public.is_host(id));

-- PLAYERS
drop policy if exists "Players readable to members" on public.players;
create policy "Players readable to members" on public.players
  for select using (public.is_member(game_id));

drop policy if exists "Players insert self only" on public.players;
create policy "Players insert self only" on public.players
  for insert with check (user_id = auth.uid());

drop policy if exists "Players update self (no score change)" on public.players;
create policy "Players update self" on public.players
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ANSWERS
drop policy if exists "Answers readable to members" on public.answers;
create policy "Answers readable to members" on public.answers
  for select using (public.is_member(game_id));

drop policy if exists "Answers insert self only" on public.answers;
create policy "Answers insert self only" on public.answers
  for insert with check (
    public.is_member(game_id) and public.is_self_player(player_id)
  );

-- NOTES
drop policy if exists "Notes readable to members" on public.notes;
create policy "Notes readable to members" on public.notes
  for select using (public.is_member(game_id));

drop policy if exists "Notes insert self only" on public.notes;
create policy "Notes insert self only" on public.notes
  for insert with check (
    public.is_member(game_id) and public.is_self_player(player_id)
  );

-- REACTIONS
drop policy if exists "Reactions readable to members" on public.reactions;
create policy "Reactions readable to members" on public.reactions
  for select using (public.is_member(game_id));

-- RULES
drop policy if exists "Rules readable to members" on public.rules;
create policy "Rules readable to members" on public.rules
  for select using (public.is_member(game_id));

drop policy if exists "Rules upsert by host only" on public.rules;
create policy "Rules upsert by host only" on public.rules
  for all using (public.is_host(game_id)) with check (public.is_host(game_id));


