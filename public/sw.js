const CACHE_NAME = 'yononaka-v3';
const ASSETS = ['/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // 非GETはキャッシュしない
  if (req.method !== 'GET') {
    return;
  }
  const isNavigation = req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));
  if (isNavigation) {
    // HTML はネットワーク優先（遷移のスタックを回避）
    event.respondWith(fetch(req).catch(() => caches.match('/')));
    return;
  }
  // それ以外はキャッシュ優先のフォールバック
  event.respondWith(
    caches.match(req).then((resp) => resp || fetch(req).then((net) => {
      const copy = net.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
      return net;
    }))
  );
});


