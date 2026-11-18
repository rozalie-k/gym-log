/* offline: app files cached; the app is fetched fresh when online so updates arrive; the sync api is never cached */
const CACHE="gymlog-v5";
const FILES=["manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET"||r.url.includes("/api/")||r.url.includes("/audio/"))return; /* audio streams straight from the site so seeking works */
  if(r.mode==="navigate"){e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put("index.html",c));}return res;}).catch(()=>caches.match("index.html")));return;}
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok&&(r.url.includes("fonts.g")||r.url.startsWith(self.location.origin))){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));}return res;})));
});
