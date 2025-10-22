-- helper RPC to increment score (service role can call; RLS respected by function security definer)
create or replace function public.increment_player_score(p_player_id uuid, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update players set score = score + p_delta where id = p_player_id;
end;
$$;

revoke all on function public.increment_player_score(uuid, integer) from public;
grant execute on function public.increment_player_score(uuid, integer) to authenticated, service_role, anon;


