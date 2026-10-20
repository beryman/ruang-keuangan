const CACHE='uangku-shell-v13';
const CORE=['./','./index.html','./manifest.webmanifest','./app-icon.svg','./supabase-sync.js','./rekap-pdf.js','./kos/index.html','./kos/manifest.webmanifest','./kos/icon-192.png','./kos/icon-512.png','./kos/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
// Network-first: selalu ambil versi terbaru saat online (agar perbaikan setelah deploy langsung terpakai),
// cache hanya dipakai sebagai cadangan saat offline. Permintaan /api/ tidak pernah disentuh.
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  event.respondWith(fetch(req).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy))}
    return response;
  }).catch(()=>caches.match(req).then(hit=>hit||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
