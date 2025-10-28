import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL_present: Boolean(url),
    NEXT_PUBLIC_SUPABASE_URL_sample: url.slice(0, 32) + (url ? '...' : ''),
    NEXT_PUBLIC_SUPABASE_ANON_KEY_present: Boolean(anon),
    NEXT_PUBLIC_SUPABASE_ANON_KEY_sample: anon.slice(0, 8) + (anon ? '...' : '')
  });
}


