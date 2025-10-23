import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1>Yononaka Card</h1>
      <p>物理カード＋オンライン進行のPWA対応パーティゲーム。</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href="/join" style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', color: 'var(--text)' }}>参加者</Link>
        <Link href="/host" style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--primary-100)', color: 'var(--text-strong)' }}>ホスト</Link>
      </div>
    </div>
  );
}


