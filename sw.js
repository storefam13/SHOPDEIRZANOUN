const CACHE = 'famm2-pwa-v2';
/* منمسح بس كاشات هالتطبيق (famm2-*) — باقي تطبيقاتك عنفس famlove88.github.io إلها كاشاتها وما منقربلها */
const PREFIX = 'famm2-';
const CDN_HOSTS = ['unpkg.com', 'cdn.jsdelivr.net', 'www.gstatic.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf(PREFIX) === 0 && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
/* منخزّن بس الرد السليم: ok للـ same-origin، وopaque طبيعي لسكربتات CDN (no-cors) — 404 أو صفحة نت مقطوع ما بتفوت عالكاش */
function cacheable(res) { return !!res && (res.ok || res.type === 'opaque'); }
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  /* الصفحة: شبكة أولاً (التحديثات بتوصل دايماً) → كاش عند انقطاع النت */
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((res) => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); } return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  /* مكتبات CDN وخط Cairo + الأيقونات والمانيفست: كاش أولاً (إقلاع أوفلاين) */
  const isCdn = CDN_HOSTS.indexOf(url.hostname) >= 0;
  const isAsset = url.origin === location.origin && (url.pathname.endsWith('.png') || url.pathname.endsWith('.webmanifest'));
  if (isCdn || isAsset) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { if (cacheable(res)) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); } return res; })));
  }
});
