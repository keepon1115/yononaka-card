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
    const supabase = getSupabase();
    const { data } = await supabase.from('players').select('*').eq('game_id', gameId).order('joined_at');
    setPlayers(data ?? []);
  }
  async function refreshAnswers() {
    if (!gameId) return;
    const supabase = getSupabase();
    const { data } = await supabase.from('answers').select('*').eq('game_id', gameId).order('created_at');
    setAnswers(data ?? []);
  }
  async function refreshNotes() {
    if (!gameId) return;
    const supabase = getSupabase();
    const { data } = await supabase.from('notes').select('*').eq('game_id', gameId).order('created_at');
    setNotes(data ?? []);
  }

  async function submitAnswer() {
    if (!me || !game) return;
    const supabase = getSupabase();
    await supabase.from('answers').insert({ game_id: game.id, player_id: me.id, round: game.round, text });
    setText('');
  }
  async function submitNote() {
    if (!me || !game) return;
    const supabase = getSupabase();
    await supabase.from('notes').insert({ game_id: game.id, player_id: me.id, round: game.round, message: note });
    setNote('');
  }

  async function sendReaction(kind: 'unique'|'practical'|'surprise', toPlayerId: string) {
    if (!me || !game) return;
    const res = await fetch('/api/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: game.id, round: game.round, fromPlayerId: me.id, toPlayerId, kind })
    });
    if (!res.ok) {
      alert('リアクション送信に失敗しました');
    }
  }

  if (!hasSupabaseEnv()) return <div style={{ padding: '8px 10px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', color: '#b91c1c' }}>環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。</div>;
  if (!game) return <div>読み込み中...</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>プレイヤー画面</h2>
      <div style={{ padding: '8px 10px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>フェーズ: <strong>{game.phase}</strong> / ラウンド: {game.round}</div>
      {game.phase === 'genre' && (
        <div>ジャンルが決定します。待機中...</div>
      )}
      {game.phase === 'answer' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div>ジャンル: <strong>{game.genre ?? '-'}</strong></div>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`${game.genre ?? 'お題'} に沿った具体語`} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
          <button onClick={submitAnswer} disabled={!text} style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--primary)', color: 'white', border: '1px solid var(--border)' }}>送信</button>
        </div>
      )}
      {game.phase === 'present' && (
        <div>発表フェーズ。順番を待機。</div>
      )}
      {game.phase === 'reaction' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div>リアクションを選択して相手に渡す：</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {players.filter(p => p.id !== me?.id).map((p) => (
              <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 8, background: 'var(--surface)' }}>
                <div>{p.name}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => sendReaction('unique', p.id)} style={{ padding: '6px 10px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>ユニーク</button>
                  <button onClick={() => sendReaction('practical', p.id)} style={{ padding: '6px 10px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>実用的</button>
                  <button onClick={() => sendReaction('surprise', p.id)} style={{ padding: '6px 10px', borderRadius: 12, background: 'var(--accent)', border: '1px solid var(--border)' }}>サプライズ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <section>
        <h3>自分のメモ</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="質問・メモ" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
          <button onClick={submitNote} disabled={!note} style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--primary)', color: 'white', border: '1px solid var(--border)' }}>投稿</button>
        </div>
      </section>
      <section>
        <h3>みんなの回答</h3>
        <ul>
          {answers.map((a) => (<li key={a.id}>{a.text}</li>))}
        </ul>
      </section>
      <section>
        <h3>メモ</h3>
        <ul>
          {notes.map((n) => (<li key={n.id}>{n.message}</li>))}
        </ul>
      </section>
    </div>
  );
}


