import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function readPublicEnvFromMeta(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const el = document.querySelector(`meta[name="${name}"]`);
  const v = el?.getAttribute('content') || undefined;
  return v && v.trim().length > 0 ? v : undefined;
}

export function hasSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || readPublicEnvFromMeta('x-supabase-url');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || readPublicEnvFromMeta('x-supabase-anon-key');
  return Boolean(url && key);
}

export function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || readPublicEnvFromMeta('x-supabase-url');
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || readPublicEnvFromMeta('x-supabase-anon-key');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL/Key are not set. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  return cachedClient;
}

