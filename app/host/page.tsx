"use client";
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonymousSignIn } from '@/lib/auth';
import { subscribeToGame, subscribeToTable } from '@/lib/realtime';

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
    const { data } = await supabase.from('players').select('*').eq('game_id', gameId).order('joined_at');
    setPlayers(data ?? []);
  }

  async function setPhase(phase: string) {
    if (!game) return;
    await supabase.from('games').update({ phase }).eq('id', game.id);
  }

  async function spinGenre() {
    if (!game) return;
    const genres = ['感情', '季節', '食べ物', '道具', '生き物', '場所', 'スポーツ'];
    const genre = genres[Math.floor(Math.random() * genres.length)];
    await supabase.from('games').update({ genre, phase: 'answer' }).eq('id', game.id);
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>司会画面</h2>
      {!game ? (
        <button onClick={createRoom} disabled={loading} style={{ padding: '8px 12px' }}>ルーム作成</button>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div>コード: <strong>{game.code}</strong></div>
            <div>フェーズ: <strong>{game.phase}</strong></div>
            <div>ジャンル: <strong>{game.genre ?? '-'}</strong></div>
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
            <button onClick={() => setPhase('genre')}>お題決定へ</button>
            <button onClick={spinGenre}>ジャンル・ルーレット</button>
            <button onClick={() => setPhase('present')}>発表へ</button>
            <button onClick={() => setPhase('reaction')}>リアクションへ</button>
            <button onClick={() => setPhase('result')}>結果</button>
          </div>
        </div>
      )}
    </div>
  );
}


