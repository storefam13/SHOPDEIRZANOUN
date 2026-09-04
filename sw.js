/* ═══════════════════════════════════════════════════════
   Service Worker — المختار للصيرفة (الجيل الثاني)
   • network-first عالـ HTML → دايماً آخر نسخة، والكاش بس أوفلاين
   • بيمسح كاشات نسختو القديمة فقط (بادئة mk2pro-) — ما بيلمس كاش أي برنامج تاني عنفس الدومين
   • بيتجاهل Firestore وكل APIs — المزامنة اللحظية ما بتتأثر أبداً
   ⚠️ بدّل CACHE_VERSION مع كل deploy (مع APP_BUILD)
   ═══════════════════════════════════════════════════════ */
const CACHE_PREFIX='mk2pro-';
const CACHE_VERSION=CACHE_PREFIX+'v220';
const CORE=['./','./index.html'];

const CACHE_HOSTS=[
  self.location.host,
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com',
  'cdnjs.cloudflare.com'
];

self.addEventListener('install',(e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_VERSION).then((c)=>c.addAll(CORE)).catch(()=>{}));
});

self.addEventListener('activate',(e)=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    // 🔒 بادئتنا فقط — كاشات البرامج التانية عنفس الأصل ممنوع نلمسها
    await Promise.all(keys.filter((k)=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_VERSION).map((k)=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',(e)=>{
  const req=e.request;
  if(req.method!=='GET')return;
  let url; try{url=new URL(req.url);}catch(_){return;}
  if(CACHE_HOSTS.indexOf(url.host)===-1)return;   // Firestore وغيره → ما منتدخّل

  const isHTML=req.mode==='navigate'||(req.headers.get('accept')||'').includes('text/html');

  if(isHTML&&url.host===self.location.host){
    e.respondWith((async()=>{
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        const c=await caches.open(CACHE_VERSION);
        c.put(req,fresh.clone());
        return fresh;
      }catch(_){
        return (await caches.match(req))||(await caches.match('./index.html'))||(await caches.match('./'))||Response.error();
      }
    })());
    return;
  }

  e.respondWith((async()=>{
    const cached=await caches.match(req);
    const fetching=fetch(req).then((res)=>{
      // opaque مقبول (سكربتات no-cors) — وإلا بيخرب الإقلاع أوفلاين
      if(res&&(res.ok||res.type==='opaque')){
        caches.open(CACHE_VERSION).then((c)=>{try{c.put(req,res.clone());}catch(_){}});
      }
      return res;
    }).catch(()=>cached);
    return cached||fetching;
  })());
});

self.addEventListener('message',(e)=>{if(e.data==='SKIP_WAITING')self.skipWaiting();});
