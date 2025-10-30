"use client";
import { useEffect, useState } from 'react';
import { getSupabase, hasSupabaseEnv } from '@/lib/supabaseClient';
import { ensureAnonymousSignIn } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function JoinPage() {
  type GameRow = { id: string };
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    ensureAnonymousSignIn();
  }, []);

  async function join() {
    setMessage('');
    if (!hasSupabaseEnv()) {
      setMessage('環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。');
      return;
    }
    const authResult = await ensureAnonymousSignIn();
    if (!authResult.success) { 
      setMessage(authResult.error || '認証に失敗しました'); 
      return; 
    }
    const supabase = getSupabase();
    const { data: game } = await supabase
      .rpc('get_game_by_code', { p_code: code.toUpperCase() })
      .single<GameRow>();
    if (!game) { setMessage('ルームが見つかりません'); return; }
    const { data: me } = await supabase.auth.getUser();
    const { error } = await supabase.from('players').insert({ game_id: game.id, user_id: me.user?.id, name, role: 'player' });
    if (error) { setMessage(error.message); return; }
    window.location.href = `/play?game=${game.id}`;
  }

  return (
    <div className="gradient-container">
      <div style={{ maxWidth: 448, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          {/* ヘッダーセクション */}
          <div className="header-section">
            <div className="icon-container">
              <img src="/icon-join.svg" alt="参加アイコン" width={40} height={40} />
            </div>
            <h1>ゲームに参加</h1>
            <p className="subtitle">コードを入力してゲームに参加しましょう</p>
          </div>

          {/* フォームセクション */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!hasSupabaseEnv() && (
              <div style={{ padding: '12px 14px', background: '#fee2e2', borderRadius: 8, border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14 }}>
                環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                ルームコード
              </label>
              <input 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="ABCD" 
                className="input-field"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                あなたの名前
              </label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="例：太郎" 
                className="input-field"
              />
            </div>

            <button 
              onClick={join} 
              disabled={!code || !name || !hasSupabaseEnv()} 
              className="btn-primary"
              style={{ marginTop: 8 }}
            >
              参加する
            </button>

            {message && (
              <div style={{ padding: '12px 14px', background: '#fee2e2', borderRadius: 8, border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14 }}>
                {message}
              </div>
            )}
          </div>

          {/* 説明セクション */}
          <div className="section">
            <h3>💡 参加方法</h3>
            <div className="info-list">
              <div className="info-list-item">
                <span className="number">1.</span>
                <span>司会から共有されたルームコードを入力</span>
              </div>
              <div className="info-list-item">
                <span className="number">2.</span>
                <span>あなたの名前を入力</span>
              </div>
              <div className="info-list-item">
                <span className="number">3.</span>
                <span>「参加する」をタップしてゲーム開始！</span>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Link href="/" className="footer-text" style={{ textDecoration: 'underline' }}>
            ← トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}


