import type { ReactNode } from 'react';
import './globals.css';
import Link from 'next/link';
import PWARegister from '../components/PWARegister';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#ff8a3d" />
      </head>
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif', background: 'var(--bg)', color: 'var(--text)' }}>
        <header style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <nav style={{ display: 'flex', gap: 16 }}>
            <Link href="/join">参加者</Link>
            <Link href="/host">ホスト</Link>
          </nav>
        </header>
        <main style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>{children}</main>
        <PWARegister />
      </body>
    </html>
  );
}


