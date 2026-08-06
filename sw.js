const CACHE = 'fambe-pwa-v1';
const CDN_HOSTS = ['unpkg.com', 'cdn.jsdelivr.net', 'www.gstatic.com', 'cdnjs.cloudflare.com'];
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  /* الصفحة: شبكة أولاً (التحديثات بتوصل دايماً) → كاش عند انقطاع النت */
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  /* مكتبات CDN + الأيقونات والمانيفست: كاش أولاً (إقلاع أوفلاين) */
  const isCdn = CDN_HOSTS.indexOf(url.hostname) >= 0;
  const isAsset = url.origin === location.origin && (url.pathname.endsWith('.png') || url.pathname.endsWith('.webmanifest'));
  if (isCdn || isAsset) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); return res; })));
  }
});
