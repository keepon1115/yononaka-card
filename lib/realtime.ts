import { getSupabase } from './supabaseClient';

export function subscribeToGame(gameId: string, onChange: (payload: any) => void) {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`games:${gameId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToTable(
  table: 'answers' | 'notes' | 'reactions' | 'players',
  filters: { game_id: string; round?: number },
  onChange: (payload: any) => void
) {
  const supabase = getSupabase();
  const parts = [`game_id=eq.${filters.game_id}`];
  if (typeof filters.round === 'number') parts.push(`round=eq.${filters.round}`);
  const filter = parts.join('&');
  const channel = supabase
    .channel(`${table}:${filter}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}


