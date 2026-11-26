const V='v4';
const CORE=['./','index.html','app.js','admin.js','manifest.json','icon-192.png','icon-512.png',
'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',
'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.allSettled(CORE.map(u=>c.add(u)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||/script\.google(usercontent)?\.com$/.test(u.hostname))return;
  e.respondWith(caches.match(r,{ignoreSearch:u.origin===location.origin}).then(hit=>{
    const net=fetch(r).then(res=>{
      if(res&&(res.ok||res.type==='opaque'))caches.open(V).then(c=>c.put(r,res.clone()));
      return res;
    }).catch(()=>hit);
    return hit||net;
  }));
});
