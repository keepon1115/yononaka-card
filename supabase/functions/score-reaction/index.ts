// Deno Edge Function
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface Payload { gameId: string; round: number; fromPlayerId: string; toPlayerId: string; kind: 'unique'|'practical'|'surprise' }

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const client = (await import('npm:@supabase/supabase-js')).createClient(supabaseUrl, serviceKey);

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
      round: body.round,
      from_player_id: body.fromPlayerId,
      to_player_id: body.toPlayerId,
      kind: body.kind,
      points
    });
    if (insertErr) throw insertErr;

    // increment score for receiver
    const { error: scoreErr } = await client.rpc('increment_player_score', {
      p_player_id: body.toPlayerId,
      p_delta: points
    });
    if (scoreErr) throw scoreErr;

    return new Response(JSON.stringify({ ok: true, points }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: corsHeaders });
  }
});


