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
        <meta name="theme-color" content="#111827" />
      </head>
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif', background: '#0f172a', color: '#f8fafc' }}>
        <header style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937' }}>
          <nav style={{ display: 'flex', gap: 16 }}>
            <Link href="/join">参加</Link>
            <Link href="/host">司会</Link>
            <Link href="/play">プレイ</Link>
          </nav>
        </header>
        <main style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>{children}</main>
        <PWARegister />
      </body>
    </html>
  );
}


