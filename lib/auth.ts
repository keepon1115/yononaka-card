import { getSupabase, hasSupabaseEnv } from './supabaseClient';

export async function ensureAnonymousSignIn() {
  if (!hasSupabaseEnv()) return; // 環境変数未設定のときは何もしない
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await supabase.auth.signInAnonymously();
  }
}


