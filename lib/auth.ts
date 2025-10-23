import { getSupabase } from './supabaseClient';

export async function ensureAnonymousSignIn() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await supabase.auth.signInAnonymously();
  }
}


