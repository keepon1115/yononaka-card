"use client";
import { useEffect, useState } from 'react';
import { getSupabase, hasSupabaseEnv } from '@/lib/supabaseClient';
import { ensureAnonymousSignIn } from '@/lib/auth';

export default function AuthDebugPage() {
  const [status, setStatus] = useState<any>({});

  useEffect(() => {
    (async () => {
      const s: any = { hasEnv: hasSupabaseEnv() };
      if (!s.hasEnv) { setStatus(s); return; }
      const supabase = getSupabase();
      const before = await supabase.auth.getSession();
      s.before = Boolean(before.data.session);
      const ok = await ensureAnonymousSignIn();
      s.ensureOk = ok;
      const after = await supabase.auth.getSession();
      s.after = Boolean(after.data.session);
      s.user = (await supabase.auth.getUser()).data.user?.id || null;
      setStatus(s);
    })();
  }, []);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>Auth Debug</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
}


