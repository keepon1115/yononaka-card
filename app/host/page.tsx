"use client";
import { useEffect, useState } from 'react';
import { getSupabase, hasSupabaseEnv } from '@/lib/supabaseClient';
import { ensureAnonymousSignIn } from '@/lib/auth';
import { subscribeToGame, subscribeToTable } from '@/lib/realtime';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Game = { id: string; code: string; round: number; phase: string; genre: string | null; presenter_id: string | null };

export default function HostPage() {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    ensureAnonymousSignIn();
  }, []);

  async function createRoom() {
    setLoading(true);
    setErrorMessage('');
    try {
      if (!hasSupabaseEnv()) {
        setErrorMessage('環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。');
        return;
      }
      const authResult = await ensureAnonymousSignIn();
      if (!authResult.success) {
        setErrorMessage(authResult.error || '認証に失敗しました');
        return;
      }
      const supabase = getSupabase();
      const code = Math.random().toString(36).slice(2, 6).toUpperCase();
      const { data: gameRow, error: insertErr } = await supabase
        .from('games')
        .insert({ code })
        .select()
        .single();
      if (insertErr) {
        console.error('insert games failed', insertErr);
        alert(`ゲーム作成に失敗しました: ${insertErr.message}`);
        return;
      }
      if (!gameRow) throw new Error('game not found after insert');

      const { data: me } = await supabase.auth.getUser();
      const pRes = await supabase.from('players').insert({ game_id: gameRow.id, user_id: me.user?.id, name: 'Host', role: 'host' });
      if (pRes.error) throw pRes.error;
      setGame(gameRow);

      const unsubGame = subscribeToGame(gameRow.id, (payload) => {
        if (payload.eventType === 'UPDATE') setGame(payload.new as Game);
      });
      const unsubPlayers = subscribeToTable('players', { game_id: gameRow.id }, () => fetchPlayers(gameRow.id));
      return () => { unsubGame(); unsubPlayers(); };
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlayers(gameId: string) {
    if (!hasSupabaseEnv()) return;
    const supabase = getSupabase();
    const { data } = await supabase.from('players').select('*').eq('game_id', gameId).order('joined_at');
    setPlayers(data ?? []);
  }

  async function setPhase(phase: string) {
    if (!game) return;
    if (!hasSupabaseEnv()) return;
    const supabase = getSupabase();
    await supabase.from('games').update({ phase }).eq('id', game.id);
  }

  async function spinGenre() {
    if (!game) return;
    const genres = ['感情', '季節', '食べ物', '道具', '生き物', '場所', 'スポーツ'];
    const genre = genres[Math.floor(Math.random() * genres.length)];
    if (!hasSupabaseEnv()) return;
    const supabase = getSupabase();
    await supabase.from('games').update({ genre, phase: 'answer' }).eq('id', game.id);
  }

  if (!game) {
    return (
      <div className="gradient-container">
        <div style={{ maxWidth: 448, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="header-section">
              <div className="icon-container">
                <img src="/icon-host.svg" alt="司会アイコン" width={40} height={40} />
              </div>
              <h1>ゲームを作成</h1>
              <p className="subtitle">司会としてゲームを開始します</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!hasSupabaseEnv() && (
                <div style={{ padding: '12px 14px', background: '#fee2e2', borderRadius: 8, border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14 }}>
                  環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。
                </div>
              )}

              {errorMessage && (
                <div style={{ padding: '12px 14px', background: '#fee2e2', borderRadius: 8, border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14, lineHeight: '1.5' }}>
                  <strong>エラー:</strong> {errorMessage}
                </div>
              )}

              <button 
                onClick={createRoom} 
                disabled={loading || !hasSupabaseEnv()} 
                className="btn-primary"
              >
                {loading ? '作成中...' : 'ルームを作成'}
              </button>
            </div>

            <div className="section">
              <h3>🎯 司会の役割</h3>
              <div className="info-list">
                <div className="info-list-item">
                  <span className="number">1.</span>
                  <span>ルームコードを参加者に共有</span>
                </div>
                <div className="info-list-item">
                  <span className="number">2.</span>
                  <span>ジャンルルーレットを回してお題決定</span>
                </div>
                <div className="info-list-item">
                  <span className="number">3.</span>
                  <span>ゲームの進行を管理</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <Link href="/" className="footer-text" style={{ textDecoration: 'underline' }}>
              ← トップに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-container">
      <div style={{ maxWidth: 600, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ maxWidth: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* ゲーム情報 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ fontSize: 20, margin: 0, color: '#171717' }}>司会画面</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 12px', background: 'linear-gradient(90deg, #9810fa 0%, #e60076 100%)', borderRadius: 8, color: 'white', fontWeight: 600, fontSize: 16 }}>
                  コード: {game.code}
                </div>
                <div style={{ padding: '8px 12px', background: 'white', borderRadius: 8, border: '1px solid var(--card-border)', fontSize: 14 }}>
                  フェーズ: <strong>{game.phase}</strong>
                </div>
                {game.genre && (
                  <div style={{ padding: '8px 12px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a', fontSize: 14 }}>
                    ジャンル: <strong>{game.genre}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* 参加者リスト */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 16, margin: 0, color: 'var(--text-muted)' }}>👥 参加者 ({players.length}人)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {players.map((p) => (
                  <div key={p.id} style={{ padding: '10px 12px', background: 'white', borderRadius: 8, border: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14 }}>
                      {p.name} {p.role === 'host' && <span style={{ color: '#9810fa', fontWeight: 600 }}>(司会)</span>}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#9810fa' }}>{p.score}点</span>
                  </div>
                ))}
              </div>
            </div>

            {/* コントロールボタン */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 16, margin: 0, color: 'var(--text-muted)' }}>🎮 ゲーム進行</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                <button 
                  onClick={() => setPhase('genre')} 
                  style={{ padding: '10px 14px', borderRadius: 8, background: 'white', border: '1px solid var(--card-border)', fontSize: 13, whiteSpace: 'nowrap' }}
                >
                  お題決定へ
                </button>
                <button 
                  onClick={spinGenre} 
                  style={{ padding: '10px 14px', borderRadius: 8, background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  🎲 ルーレット
                </button>
                <button 
                  onClick={() => setPhase('present')} 
                  style={{ padding: '10px 14px', borderRadius: 8, background: 'white', border: '1px solid var(--card-border)', fontSize: 13, whiteSpace: 'nowrap' }}
                >
                  発表へ
                </button>
                <button 
                  onClick={() => setPhase('reaction')} 
                  style={{ padding: '10px 14px', borderRadius: 8, background: 'white', border: '1px solid var(--card-border)', fontSize: 13, whiteSpace: 'nowrap' }}
                >
                  リアクションへ
                </button>
                <button 
                  onClick={() => setPhase('result')} 
                  style={{ padding: '10px 14px', borderRadius: 8, background: 'white', border: '1px solid var(--card-border)', fontSize: 13, whiteSpace: 'nowrap' }}
                >
                  結果
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Link href="/" className="footer-text" style={{ textDecoration: 'underline' }}>
            ← トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}


