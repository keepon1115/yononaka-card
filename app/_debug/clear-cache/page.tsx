"use client";
import { useEffect, useState } from 'react';

export default function ClearCachePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const newLogs: string[] = [];
      try {
        // Service Worker unregister
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const r of regs) {
            await r.unregister();
          }
          newLogs.push(`ServiceWorker: unregistered ${regs.length}`);
        } else {
          newLogs.push('ServiceWorker: not supported');
        }

        // Cache Storage clear
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
          newLogs.push(`Caches: deleted ${keys.length}`);
        } else {
          newLogs.push('Caches: not supported');
        }

        // local/session storage
        try { localStorage.clear(); newLogs.push('localStorage: cleared'); } catch {}
        try { sessionStorage.clear(); newLogs.push('sessionStorage: cleared'); } catch {}

        // IndexedDB clear (best-effort)
        const anyWindow = window as any;
        if (anyWindow.indexedDB) {
          if (anyWindow.indexedDB.databases) {
            const dbs = await anyWindow.indexedDB.databases();
            await Promise.all((dbs || []).map((db: any) => db?.name && new Promise<void>((res) => {
              const req = indexedDB.deleteDatabase(db.name as string);
              req.onsuccess = () => res();
              req.onerror = () => res();
              req.onblocked = () => res();
            })));
            newLogs.push(`IndexedDB: deleted ${(dbs || []).length}`);
          } else {
            // Fallback: try to delete common names if known (none specific here)
            newLogs.push('IndexedDB: databases() not supported, skipped');
          }
        }
      } finally {
        setLogs(newLogs);
        setDone(true);
      }
    })();
  }, []);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>キャッシュ削除ツール</h2>
      <p>このページを開くと、自動で Service Worker / Caches / Storage / IndexedDB を可能な範囲で削除します。</p>
      <div style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
        <div>結果:</div>
        <ul>
          {logs.map((l, i) => (<li key={i}>{l}</li>))}
        </ul>
      </div>
      {done ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <div>削除が完了しました。ページを再読み込みしてください。</div>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--primary)', color: 'white', border: '1px solid var(--border)' }}>再読み込み</button>
        </div>
      ) : (
        <div>実行中...</div>
      )}
    </div>
  );
}


