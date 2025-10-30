import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedEnvHash: string | null = null;

function readPublicEnvFromMeta(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const el = document.querySelector(`meta[name="${name}"]`);
  const v = el?.getAttribute('content') || undefined;
  return v && v.trim().length > 0 ? v : undefined;
}

function getEnvValues(): { url: string | undefined; key: string | undefined } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || readPublicEnvFromMeta('x-supabase-url'),
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || readPublicEnvFromMeta('x-supabase-anon-key')
  };
}

function getEnvHash(): string {
  const { url, key } = getEnvValues();
  return `${url || ''}:${key || ''}`;
}

/**
 * Supabaseクライアントのキャッシュをクリアします。
 * 環境変数を変更した後に呼び出して、新しい環境変数を反映させます。
 */
export function clearSupabaseCache(): void {
  cachedClient = null;
  cachedEnvHash = null;
}

export function hasSupabaseEnv(): boolean {
  const { url, key } = getEnvValues();
  return Boolean(url && key);
}

export function getSupabase(): SupabaseClient {
  const currentEnvHash = getEnvHash();

  // 環境変数が変更されていない場合、キャッシュされたクライアントを返す
  if (cachedClient && cachedEnvHash === currentEnvHash) {
    return cachedClient;
  }

  // 環境変数が変更された場合は既存のクライアントをクリア
  if (cachedClient && cachedEnvHash !== currentEnvHash) {
    clearSupabaseCache();
  }

  const { url, key } = getEnvValues();

  if (!url || !key) {
    throw new Error('Supabase URL/Key are not set. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  cachedClient = createClient(url, key, {
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

  cachedEnvHash = currentEnvHash;

  return cachedClient;
}
