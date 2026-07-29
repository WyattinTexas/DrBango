/* JUMPR shell cache — cache-first so the pad opens in dead zones,
   background refresh so deploys still arrive. */
const V = "jr-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== "GET") return; // Firebase etc: straight through
  e.respondWith(
    caches.match(e.request).then(hit => {
      const refresh = fetch(e.request).then(r => {
        if (r && r.ok) caches.open(V).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => hit);
      return hit || refresh;
    })
  );
});
