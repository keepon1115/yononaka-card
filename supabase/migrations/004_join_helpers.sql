-- Helper to get game by code for join flow
create or replace function public.get_game_by_code(p_code text)
returns table(id uuid, code text)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.code
  from public.games g
  where g.code = p_code
  limit 1;
$$;

revoke all on function public.get_game_by_code(text) from public;
grant execute on function public.get_game_by_code(text) to authenticated, anon;


