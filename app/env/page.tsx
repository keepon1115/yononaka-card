export const dynamic = 'force-dynamic';

export default async function EnvPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>Env Debug</h2>
      <div>URL present: <strong>{Boolean(url).toString()}</strong></div>
      <div>URL sample: <code>{url.slice(0, 32)}{url ? '...' : ''}</code></div>
      <div>Anon present: <strong>{Boolean(anon).toString()}</strong></div>
      <div>Anon sample: <code>{anon.slice(0, 8)}{anon ? '...' : ''}</code></div>
      <ClientMetaDebug />
    </div>
  );
}

function ClientMetaDebug() {
  // client-only subcomponent using dynamic import semantics (executed on client)
  // This file is a server component by default; but nested function components render on client when they access browser APIs.
  // We guard with typeof document check.
  const metaUrl = typeof document !== 'undefined' ? document.querySelector('meta[name="x-supabase-url"]')?.getAttribute('content') || '' : '';
  const metaKey = typeof document !== 'undefined' ? document.querySelector('meta[name="x-supabase-anon-key"]')?.getAttribute('content') || '' : '';
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
      <div>Meta URL present: <strong>{Boolean(metaUrl).toString()}</strong></div>
      <div>Meta URL sample: <code>{metaUrl.slice(0, 32)}{metaUrl ? '...' : ''}</code></div>
      <div>Meta Anon present: <strong>{Boolean(metaKey).toString()}</strong></div>
      <div>Meta Anon sample: <code>{metaKey.slice(0, 8)}{metaKey ? '...' : ''}</code></div>
    </div>
  );
}


