import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
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
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ gameId, round, fromPlayerId, toPlayerId, kind })
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'edge function failed' }, { status: 500 });
  }
  const data = await res.json();
  return NextResponse.json(data);
}


