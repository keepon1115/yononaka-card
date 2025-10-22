export default function Home() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1>Yononaka Card</h1>
      <p>物理カード＋オンライン進行のPWA対応パーティゲーム。</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href="/join" style={{ padding: '8px 12px', border: '1px solid #334155', borderRadius: 8 }}>ルーム参加</a>
        <a href="/host" style={{ padding: '8px 12px', border: '1px solid #334155', borderRadius: 8 }}>司会（ルーム作成）</a>
        <a href="/play" style={{ padding: '8px 12px', border: '1px solid #334155', borderRadius: 8 }}>プレイ画面</a>
      </div>
    </div>
  );
}


