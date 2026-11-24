// @ts-nocheck
// Deno Edge Function
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface Payload { gameId: string; round: number; fromPlayerId: string; toPlayerId: string; kind: 'unique'|'practical'|'surprise' }

const KINDS = ['unique', 'practical', 'surprise'];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fail(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    if (!body?.gameId || !body?.fromPlayerId || !body?.toPlayerId || !KINDS.includes(body.kind)) {
      return fail('invalid payload', 400);
    }
    if (body.fromPlayerId === body.toPlayerId) return fail('cannot react to yourself', 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('npm:@supabase/supabase-js');

    // Identify the caller from their own session token (not the anon key)
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return fail('unauthorized', 401);

    const client = createClient(supabaseUrl, serviceKey);

    // The sender must be the caller, and both players must be in this game
    const { data: players } = await client
      .from('players')
      .select('id, user_id, game_id')
      .in('id', [body.fromPlayerId, body.toPlayerId]);
    const from = players?.find((p) => p.id === body.fromPlayerId);
    const to = players?.find((p) => p.id === body.toPlayerId);
    if (!from || !to || from.user_id !== user.id || from.game_id !== body.gameId || to.game_id !== body.gameId) {
      return fail('forbidden', 403);
    }

    // Only during the reaction phase of the current round
    const { data: game } = await client.from('games').select('phase, round').eq('id', body.gameId).maybeSingle();
    if (!game || game.phase !== 'reaction') return fail('not in reaction phase', 409);
    const round = game.round;

    // One reaction per sender -> receiver per round
    const { count } = await client
      .from('reactions')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', body.gameId)
      .eq('round', round)
      .eq('from_player_id', from.id)
      .eq('to_player_id', to.id);
    if ((count ?? 0) > 0) return fail('already reacted', 409);

    // load rules
    const { data: rule } = await client
      .from('rules')
      .select('reaction_points_min, reaction_points_max')
      .eq('game_id', body.gameId)
      .maybeSingle();
    const min = rule?.reaction_points_min ?? 1;
    const max = rule?.reaction_points_max ?? 5;
    const points = randomInt(min, max);

    const { error: insertErr } = await client.from('reactions').insert({
      game_id: body.gameId,
      round,
      from_player_id: from.id,
      to_player_id: to.id,
      kind: body.kind,
      points
    });
    if (insertErr) throw insertErr;

    // increment score for receiver
    const { error: scoreErr } = await client.rpc('increment_player_score', {
      p_player_id: to.id,
      p_delta: points
    });
    if (scoreErr) throw scoreErr;

    return new Response(JSON.stringify({ ok: true, points }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error(e);
    return fail('internal error', 500);
  }
});
