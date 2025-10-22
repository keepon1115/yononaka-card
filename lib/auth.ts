import { supabase } from './supabaseClient';

export async function ensureAnonymousSignIn() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await supabase.auth.signInAnonymously();
  }
}


