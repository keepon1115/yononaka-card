import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase env not set' }, { status: 500 });
  }
  // The player's own session token; the Edge Function checks who is sending the reaction
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { gameId, round, fromPlayerId, toPlayerId, kind } = body as {
    gameId: string; round: number; fromPlayerId: string; toPlayerId: string; kind: 'unique'|'practical'|'surprise'
  };

  // Call Edge Function to award points and record reaction
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/score-reaction`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': authorization
    },
    body: JSON.stringify({ gameId, round, fromPlayerId, toPlayerId, kind })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: data?.error ?? 'edge function failed' }, { status: res.status });
  }
  return NextResponse.json(data);
}
