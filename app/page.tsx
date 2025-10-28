import Link from 'next/link';

export default function Home() {
  return (
    <div className="gradient-container">
      <div style={{ maxWidth: 448, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          {/* ヘッダーセクション */}
          <div className="header-section">
            <div className="icon-container">
              <img src="/icon-sparkles.svg" alt="アイコン" width={40} height={40} />
            </div>
            <h1>わいわいカード</h1>
            <p className="subtitle">物理カード × アプリ連動</p>
            <p className="description">みんなで楽しむ発想ゲーム</p>
          </div>

          {/* ボタンセクション */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Link href="/host" className="btn-primary">
              <img src="/icon-host.svg" alt="" width={20} height={20} />
              ゲームを作成（司会）
            </Link>
            <Link href="/join" className="btn-secondary">
              <img src="/icon-join.svg" alt="" width={20} height={20} />
              ゲームに参加
            </Link>
          </div>

          {/* 遊び方セクション */}
          <div className="section">
            <h3>🎮 遊び方</h3>
            <div className="info-list">
              <div className="info-list-item">
                <span className="number">1.</span>
                <span>司会がゲームを作成し、参加者を招待</span>
              </div>
              <div className="info-list-item">
                <span className="number">2.</span>
                <span>ルーレットでジャンルを決定</span>
              </div>
              <div className="info-list-item">
                <span className="number">3.</span>
                <span>各自が答えを入力して発表</span>
              </div>
              <div className="info-list-item">
                <span className="number">4.</span>
                <span>物理カードを渡してリアクション</span>
              </div>
              <div className="info-list-item">
                <span className="number">5.</span>
                <span>得点と称号を獲得！</span>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <p className="footer-text">スマホ専用・PWA対応</p>
      </div>
    </div>
  );
}


