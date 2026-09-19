// GVT sw.js — 1097 THE OPEN DOOR (FM-GVT-OPEN-DOOR-01; Wyatt 9/18/2026 by phone: "Even if there's no internet connection, they should still be able
// to go in there"): AN OFFLINE COPY OF THE GAME. NETWORK FIRST, ALWAYS — a live network answers every page request exactly as it did before this
// file existed (and the fresh copy goes into the cache); the cache answers ONLY when the network fails (no signal, a torn line) or says nothing for
// SW_NET_MS. Never a stale client while online. Only the page itself (a navigation, or index.html, with NO query) is handled here: the ?nb= / ?cb=
// probes are the page's own truth tests and pass straight through, so does every other file (the media, the manifest, the icons) and every HEAD.
const SW_K = 'gvt-open-door-v1';   // the cache; a new name here = every old cache dropped at activate
const SW_NET_MS = 20000;           // the network's silence (headers not yet in) before the cache answers — ⚑ PT-C
const SW_PAGE = new URL('./index.html', self.location.href).href;
self.addEventListener('install', e => {
  self.skipWaiting();
  // the first copy: the browser's HTTP cache answers this when the page just loaded (max-age on Pages) — no second download
  e.waitUntil(caches.open(SW_K).then(c => c.add(new Request(SW_PAGE, { cache: 'default' }))).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SW_K).map(k => caches.delete(k)))).then(() => self.clients.claim()).catch(() => {}));
});
function isPage(rq) {
  if (rq.method !== 'GET') return false;
  const u = new URL(rq.url);
  if (u.origin !== self.location.origin || u.search) return false;
  if (rq.mode === 'navigate') return true;
  return u.href === SW_PAGE || u.pathname === new URL('./', self.location.href).pathname;
}
self.addEventListener('fetch', e => {
  const rq = e.request;
  if (!isPage(rq)) return;   // everything else: the browser's own road, untouched
  e.respondWith((async () => {
    const net = fetch(rq).then(r => {
      if (r && r.ok && (r.type === 'basic' || r.type === 'default')) {   // a whole, good reply refreshes the copy; a torn body fails the put and the last good copy stands
        const c = r.clone(); e.waitUntil(caches.open(SW_K).then(k => k.put(SW_PAGE, c)).catch(() => {}));
      }
      return r;
    });
    let r = null;
    try { r = await Promise.race([net, new Promise(res => setTimeout(() => res(null), SW_NET_MS))]); } catch (err) { r = null; }
    if (r) return r;
    const hit = await caches.match(SW_PAGE).catch(() => null);
    if (hit) return hit;
    return net.catch(() => Response.error());   // no copy yet: the network's own answer (or its error page), as before
  })());
});
