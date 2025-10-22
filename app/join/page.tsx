"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonymousSignIn } from '@/lib/auth';

export default function JoinPage() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    ensureAnonymousSignIn();
  }, []);

  async function join() {
    setMessage('');
    const { data: game } = await supabase.from('games').select('id, code').eq('code', code.toUpperCase()).single();
    if (!game) { setMessage('ルームが見つかりません'); return; }
    const { data: me } = await supabase.auth.getUser();
    const { error } = await supabase.from('players').insert({ game_id: game.id, user_id: me.user?.id, name, role: 'player' });
    if (error) { setMessage(error.message); return; }
    window.location.href = `/play?game=${game.id}`;
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <h2>ルーム参加</h2>
      <label>コード<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD" style={{ width: '100%' }} /></label>
      <label>名前<input value={name} onChange={(e) => setName(e.target.value)} placeholder="あなたの名前" style={{ width: '100%' }} /></label>
      <button onClick={join} disabled={!code || !name} style={{ padding: '8px 12px' }}>参加</button>
      {message && <div style={{ color: '#fca5a5' }}>{message}</div>}
    </div>
  );
}


