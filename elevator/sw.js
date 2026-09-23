// オフラインでも遊べるようにするしくみ
const PREFIX="elevator-";
const CACHE=PREFIX+"v1";
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  // ページ本体：ネットを優先（更新がすぐ反映される）、つながらない時は保存分
  if(req.mode==="navigate"){
    e.respondWith(fetch(req).then(r=>{ const c=r.clone(); caches.open(CACHE).then(x=>x.put(req,c)); return r; })
      .catch(()=>caches.match(req).then(r=>r||caches.match("./index.html"))));
    return;
  }
  // それ以外（アイコン・フォントなど）：保存分をすぐ使い、裏で更新
  e.respondWith(caches.match(req).then(hit=>{
    const net=fetch(req).then(r=>{ if(r&&(r.ok||r.type==="opaque")){ const c=r.clone(); caches.open(CACHE).then(x=>x.put(req,c)); } return r; }).catch(()=>hit);
    return hit||net;
  }));
});
