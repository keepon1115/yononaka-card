"use client";
import { useEffect, useMemo, useState } from 'react';
import { getSupabase, hasSupabaseEnv } from '@/lib/supabaseClient';
import { ensureAnonymousSignIn } from '@/lib/auth';
import { subscribeToGame, subscribeToTable } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

type Game = { id: string; code: string; round: number; phase: string; genre: string | null; presenter_id: string | null };

export default function HostPage() {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureAnonymousSignIn();
  }, []);

  async function createRoom() {
    setLoading(true);
    try {
      const code = Math.random().toString(36).slice(2, 6).toUpperCase();
      const supabase = getSupabase();
      const { data: gameRes, error } = await supabase.from('games').insert({ code }).select('*').single();
      if (error) throw error;

      const { data: me } = await supabase.auth.getUser();
      const { error: pErr } = await supabase.from('players').insert({ game_id: gameRes.id, user_id: me.user?.id, name: 'Host', role: 'host' });
      if (pErr) throw pErr;
      setGame(gameRes);

      const unsubGame = subscribeToGame(gameRes.id, (payload) => {
        if (payload.eventType === 'UPDATE') setGame(payload.new as Game);
      });
      const unsubPlayers = subscribeToTable('players', { game_id: gameRes.id }, () => fetchPlayers(gameRes.id));
      return () => {
        unsubGame();
        unsubPlayers();
      };
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlayers(gameId: string) {
    const supabase = getSupabase();
    const { data } = await supabase.from('players').select('*').eq('game_id', gameId).order('joined_at');
    setPlayers(data ?? []);
  }

  async function setPhase(phase: string) {
    if (!game) return;
    const supabase = getSupabase();
    await supabase.from('games').update({ phase }).eq('id', game.id);
  }

  async function spinGenre() {
    if (!game) return;
    const genres = ['感情', '季節', '食べ物', '道具', '生き物', '場所', 'スポーツ'];
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const supabase = getSupabase();
    await supabase.from('games').update({ genre, phase: 'answer' }).eq('id', game.id);
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>司会画面</h2>
      {!hasSupabaseEnv() && (
        <div style={{ padding: '8px 10px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', color: '#b91c1c' }}>
          環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。
        </div>
      )}
      {!game ? (
        <button onClick={createRoom} disabled={loading || !hasSupabaseEnv()} style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--primary)', color: 'white', border: '1px solid var(--border)', opacity: (!hasSupabaseEnv() ? .6 : 1) }}>ルームを作成</button>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ padding: '8px 10px', background: 'var(--primary-100)', borderRadius: 12, border: '1px solid var(--border)' }}>コード: <strong>{game.code}</strong></div>
            <div style={{ padding: '8px 10px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>フェーズ: <strong>{game.phase}</strong></div>
            <div style={{ padding: '8px 10px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>ジャンル: <strong>{game.genre ?? '-'}</strong></div>
          </div>
          <div>
            <h3>参加者</h3>
            <ul>
              {players.map((p) => (
                <li key={p.id}>{p.name} {p.role === 'host' ? '(司会)' : ''} / {p.score}点</li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setPhase('genre')} style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>お題決定へ</button>
            <button onClick={spinGenre} style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--accent)', border: '1px solid var(--border)' }}>ジャンル・ルーレット</button>
            <button onClick={() => setPhase('present')} style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>発表へ</button>
            <button onClick={() => setPhase('reaction')} style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>リアクションへ</button>
            <button onClick={() => setPhase('result')} style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>結果</button>
          </div>
        </div>
      )}
    </div>
  );
}


