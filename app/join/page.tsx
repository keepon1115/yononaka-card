"use client";
import { useEffect, useState } from 'react';
import { getSupabase, hasSupabaseEnv } from '@/lib/supabaseClient';
import { ensureAnonymousSignIn } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function JoinPage() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    ensureAnonymousSignIn();
  }, []);

  async function join() {
    setMessage('');
    const supabase = getSupabase();
    const { data: game } = await supabase.from('games').select('id, code').eq('code', code.toUpperCase()).single();
    if (!game) { setMessage('ルームが見つかりません'); return; }
    const { data: me } = await supabase.auth.getUser();
    const { error } = await supabase.from('players').insert({ game_id: game.id, user_id: me.user?.id, name, role: 'player' });
    if (error) { setMessage(error.message); return; }
    window.location.href = `/play?game=${game.id}`;
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <h2>参加者</h2>
      {!hasSupabaseEnv() && (
        <div style={{ padding: '8px 10px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', color: '#b91c1c' }}>
          環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。
        </div>
      )}
      <label>コード
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD" style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
      </label>
      <label>名前
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="あなたの名前" style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
      </label>
      <button onClick={join} disabled={!code || !name || !hasSupabaseEnv()} style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--primary)', color: 'white', border: '1px solid var(--border)', opacity: (!hasSupabaseEnv() ? .6 : 1) }}>参加する</button>
      {message && <div style={{ color: '#b91c1c' }}>{message}</div>}
    </div>
  );
}


