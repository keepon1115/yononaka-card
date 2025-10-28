import type { ReactNode } from 'react';
import './globals.css';
import PWARegister from '../components/PWARegister';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#9810fa" />
        {/* Expose public envs via meta to avoid HMR/env mismatch on client */}
        <meta name="x-supabase-url" content={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />
        <meta name="x-supabase-anon-key" content={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''} />
      </head>
      <body>
        <main>{children}</main>
        <PWARegister />
      </body>
    </html>
  );
}


