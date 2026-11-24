"use client";
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabase, hasSupabaseEnv } from '@/lib/supabaseClient';
import { ensureAnonymousSignIn } from '@/lib/auth';
import { subscribeToGame, subscribeToTable } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export default function PlayPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <PlayPageInner />
    </Suspense>
  );
}

function PlayPageInner() {
  const params = useSearchParams();
  const gameId = params.get('game');
  const [game, setGame] = useState<any | null>(null);
  const [me, setMe] = useState<any | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => { ensureAnonymousSignIn(); }, []);

  useEffect(() => {
    if (!gameId || !hasSupabaseEnv()) return;
    (async () => {
      if (!hasSupabaseEnv()) return;
      const supabase = getSupabase();
      const { data: g } = await supabase.from('games').select('*').eq('id', gameId).single();
      setGame(g);
      const { data: auth } = await supabase.auth.getUser();
      const { data: meRow } = await supabase.from('players').select('*').eq('game_id', gameId).eq('user_id', auth.user?.id).single();
      setMe(meRow);
      refreshPlayers();
      refreshAnswers();
      refreshNotes();
    })();

    const unsubGame = subscribeToGame(gameId, (payload) => {
      if (payload.eventType === 'UPDATE') setGame(payload.new);
    });
    const unsubPlayers = subscribeToTable('players', { game_id: gameId }, refreshPlayers);
    const unsubAnswers = subscribeToTable('answers', { game_id: gameId }, refreshAnswers);
    const unsubNotes = subscribeToTable('notes', { game_id: gameId }, refreshNotes);
    return () => { unsubGame(); unsubPlayers(); unsubAnswers(); unsubNotes(); };
  }, [gameId]);

  async function refreshPlayers() {
    if (!gameId) return;
    if (!hasSupabaseEnv()) return;
    const supabase = getSupabase();
    const { data } = await supabase.from('players').select('*').eq('game_id', gameId).order('joined_at');
    setPlayers(data ?? []);
  }
  async function refreshAnswers() {
    if (!gameId) return;
    if (!hasSupabaseEnv()) return;
    const supabase = getSupabase();
    const { data } = await supabase.from('answers').select('*').eq('game_id', gameId).order('created_at');
    setAnswers(data ?? []);
  }
  async function refreshNotes() {
    if (!gameId) return;
    if (!hasSupabaseEnv()) return;
    const supabase = getSupabase();
    const { data } = await supabase.from('notes').select('*').eq('game_id', gameId).order('created_at');
    setNotes(data ?? []);
  }

  async function submitAnswer() {
    if (!me || !game) return;
    if (!hasSupabaseEnv()) return;
    const supabase = getSupabase();
    await supabase.from('answers').insert({ game_id: game.id, player_id: me.id, round: game.round, text });
    setText('');
  }
  async function submitNote() {
    if (!me || !game) return;
    if (!hasSupabaseEnv()) return;
    const supabase = getSupabase();
    await supabase.from('notes').insert({ game_id: game.id, player_id: me.id, round: game.round, message: note });
    setNote('');
  }

  async function sendReaction(kind: 'unique'|'practical'|'surprise', toPlayerId: string) {
    if (!me || !game) return;
    const { data: { session } } = await getSupabase().auth.getSession();
    if (!session) {
      alert('ログイン状態を確認できませんでした。ページを再読み込みしてください');
      return;
    }
    const res = await fetch('/api/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ gameId: game.id, round: game.round, fromPlayerId: me.id, toPlayerId, kind })
    });
    if (!res.ok) {
      alert('リアクション送信に失敗しました');
    }
  }

  if (!hasSupabaseEnv()) {
    return (
      <div className="gradient-container">
        <div style={{ maxWidth: 448, width: '100%' }}>
          <div className="card">
            <div style={{ padding: '12px 14px', background: '#fee2e2', borderRadius: 8, border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14 }}>
              環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="gradient-container">
        <div style={{ maxWidth: 448, width: '100%' }}>
          <div className="card">
            <div className="header-section">
              <p className="subtitle">読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-container">
      <div style={{ maxWidth: 600, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ maxWidth: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ヘッダー */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 style={{ fontSize: 20, margin: 0, color: '#171717' }}>プレイヤー画面</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ padding: '6px 12px', background: 'white', borderRadius: 8, border: '1px solid var(--card-border)', fontSize: 13 }}>
                  フェーズ: <strong>{game.phase}</strong>
                </div>
                <div style={{ padding: '6px 12px', background: 'white', borderRadius: 8, border: '1px solid var(--card-border)', fontSize: 13 }}>
                  ラウンド: <strong>{game.round}</strong>
                </div>
                {game.genre && (
                  <div style={{ padding: '6px 12px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a', fontSize: 13 }}>
                    ジャンル: <strong>{game.genre}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* フェーズごとのコンテンツ */}
            {game.phase === 'genre' && (
              <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: 8, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>🎲 ジャンルが決定します。待機中...</p>
              </div>
            )}

            {game.phase === 'answer' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <h3 style={{ fontSize: 16, margin: 0, color: 'var(--text-muted)' }}>✍️ あなたの答えを入力</h3>
                <input 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  placeholder={`${game.genre ?? 'お題'} に沿った具体語を入力`} 
                  className="input-field"
                />
                <button 
                  onClick={submitAnswer} 
                  disabled={!text} 
                  className="btn-primary"
                >
                  送信
                </button>
              </div>
            )}

            {game.phase === 'present' && (
              <div style={{ padding: '16px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>🎤 発表フェーズ。順番を待機中...</p>
              </div>
            )}

            {game.phase === 'reaction' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontSize: 16, margin: 0, color: 'var(--text-muted)' }}>🎁 リアクションを選択して相手に渡す</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {players.filter(p => p.id !== me?.id).map((p) => (
                    <div key={p.id} style={{ padding: '12px', background: 'white', borderRadius: 8, border: '1px solid var(--card-border)' }}>
                      <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => sendReaction('unique', p.id)} 
                          style={{ padding: '8px 12px', borderRadius: 6, background: '#dbeafe', border: '1px solid #93c5fd', fontSize: 12, color: '#1e40af', fontWeight: 500 }}
                        >
                          ✨ ユニーク
                        </button>
                        <button 
                          onClick={() => sendReaction('practical', p.id)} 
                          style={{ padding: '8px 12px', borderRadius: 6, background: '#dcfce7', border: '1px solid #86efac', fontSize: 12, color: '#166534', fontWeight: 500 }}
                        >
                          💡 実用的
                        </button>
                        <button 
                          onClick={() => sendReaction('surprise', p.id)} 
                          style={{ padding: '8px 12px', borderRadius: 6, background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', border: 'none', fontSize: 12, color: 'white', fontWeight: 600 }}
                        >
                          🎉 サプライズ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 自分のメモ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: 14, margin: 0, color: 'var(--text-muted)' }}>📝 自分のメモ</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="質問・メモを記録" 
                  className="input-field"
                  style={{ flex: 1 }}
                />
                <button 
                  onClick={submitNote} 
                  disabled={!note} 
                  style={{ padding: '10px 16px', borderRadius: 8, background: 'linear-gradient(90deg, #9810fa 0%, #e60076 100%)', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, opacity: !note ? 0.5 : 1 }}
                >
                  投稿
                </button>
              </div>
            </div>

            {/* みんなの回答 */}
            {answers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h3 style={{ fontSize: 14, margin: 0, color: 'var(--text-muted)' }}>💬 みんなの回答</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {answers.map((a) => (
                    <div key={a.id} style={{ padding: '8px 12px', background: 'white', borderRadius: 6, border: '1px solid var(--card-border)', fontSize: 13 }}>
                      {a.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* メモ一覧 */}
            {notes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h3 style={{ fontSize: 14, margin: 0, color: 'var(--text-muted)' }}>📌 メモ</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {notes.map((n) => (
                    <div key={n.id} style={{ padding: '8px 12px', background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a', fontSize: 13 }}>
                      {n.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


