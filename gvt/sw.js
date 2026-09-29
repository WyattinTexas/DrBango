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

// CARD-G90 THE PUSH (jumpr 1348; Wyatt 9/29/2026 by phone: "if your country gets attacked, it's one of the only times we'll give a push notification to players. If one of your countries is
// under attack, you need to respond within 90 seconds."): HQ v88 sends the FACTS, sealed for this phone alone ({k:'gl', by, a2, nm, secs, until, lang}); the WORDS are written here, in the
// holder's own language (the game's own rows, copied at the build), the country's name by the phone (Intl.DisplayNames). ONE standing notification (tag gl: a newer knock replaces it); its tap
// brings the game to the front, where the game's own beat shows the knock card with what is left of the clock. The offline copy above is byte-what-it-was.
const GL_WORDS = {"en":["%1 WANTS %2!","COME DEFEND IT","YOU HAVE %1 SECONDS","YOUR ARMY IS DEFENDING %1"],"ar":["%1 يريد %2!","تعال ودافع عنها","أمامك %1 ثانية","جيشك يدافع عن %1"],"ja":["%1が %2を ねらってる！","まもりに いこう","のこり %1びょう","キミの ぐんたいが %1を まもっている"],"ko":["%1이(가) %2 노린다!","지키러 와!","남은 시간 %1초","네 군대가 %1 지키는 중"],"zh-Hans":["%1 想要 %2！","快来保卫它","你有 %1 秒","你的军队正在保卫 %1"],"de":["%1 WILL %2!","KOMM UND VERTEIDIGE ES","DU HAST %1 SEKUNDEN","DEINE ARMEE VERTEIDIGT %1"],"ru":["%1 ХОЧЕТ ЗАБРАТЬ %2!","ИДИ НА ЗАЩИТУ","У ТЕБЯ %1 СЕКУНД","ТВОЯ АРМИЯ ЗАЩИЩАЕТ %1"],"es":["¡%1 QUIERE %2!","VEN A DEFENDERLO","TIENES %1 SEGUNDOS","TU EJÉRCITO DEFIENDE %1"]};
function glLine(s, a, b) { return String(s).split('%1').join(a).split('%2').join(b == null ? '' : b); }
function glLand(d) {
  let nm = String(d.nm || '');
  try { if (d.a2 && d.lang && d.lang !== 'en') { const x = new Intl.DisplayNames([d.lang], { type: 'region' }).of(d.a2); if (x && x !== d.a2) nm = String(x).toUpperCase(); } } catch (e) {}
  return nm;
}
function glNote(d) {
  d = (d && d.k === 'gl') ? d : {};
  const w = GL_WORDS[d.lang] || GL_WORDS.en, by = String(d.by || '').toUpperCase().slice(0, 12), land = glLand(d);
  const left = Math.min(d.secs | 0, Math.round((+d.until || 0) - Date.now() / 1000));
  if (!by || !land) return { title: 'GREEN VS TAN', body: w[1], dir: 'auto', lang: 'en', id: '' };
  return { title: glLine(w[0], by, land), body: left > 3 ? w[1] + ' · ' + glLine(w[2], String(left)) : glLine(w[3], land), dir: d.lang === 'ar' ? 'rtl' : 'auto', lang: d.lang || 'en', id: String(d.id || '') };
}
self.addEventListener('push', e => {
  let d = null; try { d = e.data ? e.data.json() : null; } catch (err) { d = null; }
  const n = glNote(d);
  e.waitUntil(self.registration.showNotification(n.title, { body: n.body, tag: 'gl', renotify: true, dir: n.dir, lang: n.lang,
    icon: new URL('./icon-192.png', self.location.href).href, data: { k: 'gl', id: n.id } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const home = new URL('./', self.location.href).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if (c.url.indexOf(home) === 0 && 'focus' in c) return c.focus();
    return self.clients.openWindow(home);
  }).catch(() => {}));
});
