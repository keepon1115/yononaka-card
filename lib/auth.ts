import { getSupabase, hasSupabaseEnv } from './supabaseClient';

export async function ensureAnonymousSignIn(): Promise<{ success: boolean; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { success: false, error: '環境変数が設定されていません' };
  }
  
  const supabase = getSupabase();
  const { data: before } = await supabase.auth.getSession();
  if (before.session) return { success: true };
  
  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('anonymous sign-in failed:', error.message);
    // Supabaseの匿名サインインが無効の場合
    if (error.message.includes('Anonymous sign-ins are disabled')) {
      return { 
        success: false, 
        error: 'Supabaseの匿名サインインが無効になっています。Supabaseダッシュボードで「Anonymous Sign-ins」を有効にしてください。' 
      };
    }
    return { success: false, error: `認証エラー: ${error.message}` };
  }
  
  // セッション確立を最大 ~2s まで待機
  const startedAt = Date.now();
  while (Date.now() - startedAt < 2000) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return { success: true };
    await new Promise((r) => setTimeout(r, 100));
  }
  const { data: last } = await supabase.auth.getSession();
  
  if (last.session) {
    return { success: true };
  } else {
    return { success: false, error: 'セッションの確立に失敗しました' };
  }
}


