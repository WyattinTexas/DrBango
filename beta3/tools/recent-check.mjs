// RECENT-CHECK — recent rivals in VERSUS (v0.55.0, task 44; the roll lives
// in the v0.73.0 social sheet — CHALLENGE A FRIEND opens it).
// Two REAL throwaway uids in two headless Chromes. A first-night sheet shows
// the quiet empty line; A challenges B by name, the duel writes recent/ on
// BOTH sides live (no reload — the FR listener fires mid-duel); back in the
// sheet the RECENT roll shows B newest-first with "tonight" and the online
// glint; a REAL tap on AGAIN rings B, B accepts, the rematch lands. Then B
// parked: the same tap becomes a standing invite and the lobby says so. Then
// the circle: A searches alone (CHALLENGE WORLDWIDE), a circle mage answers,
// the row appears; a real tap on that row routes through the rival engine
// (no invites/ row) and a live duel begins. Nights-ago clock, the five
// tongues, layout, cleanup.
//
//   python3 -m http.server 8899 &
//   for p in a:9452 b:9453; do "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --no-sandbox --mute-audio --disable-gpu --remote-debugging-port=${p#*:} \
//     --user-data-dir=/tmp/cdp-recent-${p%%:*} --window-size=390,844 --force-device-scale-factor=3 about:blank & done
//   node tools/recent-check.mjs
const BASE = 'http://localhost:8899/index.html';
const RT = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = () => Math.random().toString(36).slice(2, 7);
const rt = async (p) => (await fetch(RT + p + '.json')).json();
const rtDel = (p) => fetch(RT + p + '.json', { method: 'DELETE' });
const errs = [];
async function client(port, tag) {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') { const t = d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text; if (!/WebGL context/.test(t || '')) errs.push(tag + ': ' + t); } };
  await new Promise((r) => ws.onopen = r);
  const send = (m, p) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed'); return r?.result?.value; };
  const seed = (src) => send('Page.addScriptToEvaluateOnNewDocument', { source: src });
  const nav = async (u) => {
    await ev(`window.__navMark = 1; 1`).catch(() => { });
    for (let i = 0; i < 4; i++) {
      const r = await send('Page.navigate', { url: u });
      if (r && r.errorText) console.log('  nav ' + tag + ': ' + r.errorText);
      for (let j = 0; j < 24; j++) {
        await sleep(250);
        const st = await ev(`(window.__navMark ? 'old' : (location.href.includes('index.html') && typeof SSNET !== 'undefined' ? 'new' : 'loading'))`).catch(() => 'loading');
        if (st === 'new') return true;
        if (st === 'loading') j = Math.min(j, 12);
      }
    }
    return false;
  };
  const park = async () => { await send('Page.navigate', { url: 'about:blank' }); await sleep(600); };
  const until = async (e, cap = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < cap) { try { if (await ev(e)) return true; } catch (err) { } await sleep(300); } return false; };
  const tap = async (expr) => {
    const p = JSON.parse(await ev(`(() => { const o = ${expr}; if (!o) return 'null'; const cam = o.scene.cameras.main, b = o.getBounds();
      const D = game.scale.width / innerWidth;
      return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
    if (!p) throw new Error('tap target missing: ' + expr);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  };
  const type = (text) => send('Input.insertText', { text });
  const key = async (k, code) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: 13 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: 13 });
  };
  return { ev, seed, nav, park, until, tap, type, key, tag };
}
const [A, B] = await Promise.all([client(9452, 'A'), client(9453, 'B')]);
const UA = 'u' + rnd() + 'rca', UB = 'u' + rnd() + 'rcb';
const NA = 'Ember ' + rnd().toUpperCase(), NB = 'Rival ' + rnd().toUpperCase();
const toDelete = new Set(['players/' + UA, 'players/' + UB, 'devices/' + UA, 'devices/' + UB, 'presence/' + UA, 'presence/' + UB,
  'invites/' + UA, 'invites/' + UB, 'recent/' + UA, 'recent/' + UB, 'friends/' + UA, 'friends/' + UB]);
const BOOT = (uid, name) => `navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); if (localStorage.getItem('rc.seeded') !== '${uid}') { localStorage.clear(); localStorage.setItem('rc.seeded', '${uid}');
    localStorage.setItem('starspellUid', '${uid}'); localStorage.setItem('starspellName', ${JSON.stringify(name)}); localStorage.setItem('beta3.vsmode', 'turns'); } } catch (e) {}`;
const READY = `SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').lanternB`;
const ensured = (c) => c.until(`(async () => { await SSNET.ensureName(); return true })()`, 30000);
const MENU = `game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').nameB`;
const toMenu = async (c) => { await c.ev(`game.scene.getScene('home').scene.start('vsmenu'); 1`); const r = await c.until(MENU, 20000); await sleep(600); return r; };
// the roll lives in the social sheet now (v0.73.0): recentRows exists only
// while the sheet stands, so CHALLENGE A FRIEND is tapped for real first
const toSheet = async (c) => {
  if (!await toMenu(c)) return false;
  for (let i = 0; i < 5; i++) {
    await c.tap(`game.scene.getScene('vsmenu').children.list.find(o => o.text === SS_T('vsChFriend'))`);
    if (await c.until(`!!game.scene.getScene('vsmenu').recentRows`, 4000)) { await sleep(500); return true; }
  }
  return false;
};
const home = async (c) => { await c.nav(BASE + '?diag=1'); return c.until(READY, 60000); };
const INPUT = `!!document.getElementById('ss-overlay-input') && document.activeElement === document.getElementById('ss-overlay-input')`;
const rows = (c) => c.ev(`JSON.stringify(game.scene.getScene('vsmenu').recentRows.map(r => ({ id: r.id, name: r.name, circle: r.circle, ago: r.agoT.text, lit: r.nameT.style.color, y: r.row.y })))`).then(JSON.parse);
const menuTexts = (c) => c.ev(`JSON.stringify(game.scene.getScene('vsmenu').frC.list.filter(o => o.text !== undefined).map(o => o.text))`).then(JSON.parse);
const lobby = (c) => c.ev(`(() => { const s = game.scene.getScene('vsbattle'); if (!s || !s.scene.isActive() || !s.room) return null;
  return JSON.stringify({ code: s.code, status: s.room.status, ch: s.challenged, sub: s.lobbySub && s.lobbySub.text, players: Object.keys(s.room.players || {}) }) })()`).then((v) => v ? JSON.parse(v) : null);
const ACTIVE = `(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.room.status === 'active' })()`;
const boot = async (c, uid, name) => {
  await c.seed(BOOT(uid, name));
  for (let i = 0; i < 3; i++) {
    if (await c.nav(BASE + '?diag=1') && await c.until(READY, 60000)) return true;
    console.log('  (' + c.tag + ' boot ' + (i + 1) + ' did not land — again)');
  }
  return false;
};
const codes = new Set();
const acceptBanner = async (c) => {
  await sleep(900);
  for (let i = 0; i < 3; i++) {
    await c.tap(`game.scene.getScene('summons').bannerC.list.find(o => o.text === SS_T('smAccept'))`);
    if (await c.until(`game.scene.getScene('summons').accepting || game.scene.isActive('vsbattle')`, 3000)) return true;
  }
  return false;
};
const tapRow = async (c, i) => c.tap(`game.scene.getScene('vsmenu').recentRows[${i}].again`);

// ---- 0. two real mages ----
console.log('A=' + UA + ' "' + NA + '"   B=' + UB + ' "' + NB + '"');
ok('both clients reach the sky', (await Promise.all([boot(A, UA, NA), boot(B, UB, NB)])).every(Boolean));
await Promise.all([ensured(A), ensured(B)]);
toDelete.add('names/' + await A.ev(`SSNET.nameKey(${JSON.stringify(NA)})`)); toDelete.add('names/' + await B.ev(`SSNET.nameKey(${JSON.stringify(NB)})`));
ok('A sees B online', await A.until(`SSNET.FR.isOnline(${JSON.stringify(UB)})`, 20000));
errs.length = 0;   // a dropped/aborted first navigate (README) leaves a half-loaded document's noise behind

// ---- 1. the empty state: one quiet line, no hole ----
ok('A opens VERSUS and the sheet', await toSheet(A));
let tx = await menuTexts(A);
ok('RECENT heading stands', tx.includes(await A.ev(`SS_T('vsRecentHead')`)));
ok('a first-night player sees the quiet empty line', tx.includes(await A.ev(`SS_T('vsNoRecent')`)) && (await rows(A)).length === 0, tx.join(' | ').slice(0, 200));

// ---- 2. a duel feeds recent/ on both sides, live ----
await A.ev(`game.scene.getScene('vsmenu').closeSocial(); 1`);   // BY NAME is a page door, under the sheet's veil
await A.tap(`game.scene.getScene('vsmenu').children.list.find(o => o.text === SS_T('vsByName'))`);
ok('BY NAME input opens', await A.until(INPUT, 6000));
await A.type(NB); await A.key('Enter', 'Enter');
ok('A lands in a lobby aimed at B', await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.challenged && s.challenged.id === ${JSON.stringify(UB)} })()`, 25000));
let lb = await lobby(A); if (lb) codes.add(lb.code);
ok('B\'s banner rings', await B.until(`(() => { const s = game.scene.getScene('summons'); return !!(s && s.bannerC && s.shown && s.shown.from === ${JSON.stringify(UA)}) })()`, 20000));
await acceptBanner(B);
ok('the duel starts on both sides', await A.until(ACTIVE, 25000) && await B.until(ACTIVE, 25000));
ok('recent/<A>/<B> lands with name + at', await (async () => { for (let i = 0; i < 20; i++) { const r = await rt('recent/' + UA + '/' + UB); if (r && r.name === NB && r.at > 0) return true; await sleep(400); } return false; })());
ok('recent/<B>/<A> lands too (both sides of every duel)', await (async () => { for (let i = 0; i < 20; i++) { const r = await rt('recent/' + UB + '/' + UA); if (r && r.name === NA && r.at > 0) return true; await sleep(400); } return false; })());
ok('the row is live in memory mid-duel, no reload (FR listener)', await A.until(`!!(SSNET.FR.recent[${JSON.stringify(UB)}]) && SSNET.FR.recentList(3)[0].id === ${JSON.stringify(UB)}`, 10000)
  && await B.until(`!!(SSNET.FR.recent[${JSON.stringify(UA)}])`, 10000));

// ---- 3. RECENT shows B: newest first, tonight, glint; AGAIN → rematch lands ----
ok('both back on the meadow', await home(A) && await home(B));
ok('A opens VERSUS', await toSheet(A));
let rs = await rows(A);
ok('RECENT roll: B is the first row', rs.length === 1 && rs[0].id === UB && rs[0].name === NB && !rs[0].circle, JSON.stringify(rs));
ok('…"tonight"', rs[0] && rs[0].ago === await A.ev(`SS_T('vsAgoTonight')`), rs[0] && rs[0].ago);
ok('…lit — B is online', rs[0] && rs[0].lit === '#f0e8d2', rs[0] && rs[0].lit);
ok('the empty line is gone', !(await menuTexts(A)).includes(await A.ev(`SS_T('vsNoRecent')`)));
const invTop = await A.ev(`game.scene.getScene('vsmenu').invB.getBounds().top`);
const rowBottom = await A.ev(`Math.max(...game.scene.getScene('vsmenu').recentRows.map(r => r.again.getBounds().bottom))`);
ok('the roll sits above the pinned invite', rowBottom < invTop, rowBottom + ' < ' + invTop);
await tapRow(A, 0);
ok('a real tap on AGAIN opens a challenge lobby aimed at B (live)', await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.challenged && s.challenged.id === ${JSON.stringify(UB)} && !s.challenged.away && !s.challenged.circle })()`, 25000));
lb = await lobby(A); if (lb) codes.add(lb.code);
ok('lobby waits for an answer', lb && lb.sub === await A.ev(`SS_T('vsWaitAnswer', ${JSON.stringify(NB)})`), lb && lb.sub);
let inv = await rt('invites/' + UB + '/' + UA);
ok('the bell rings for B', inv && inv.code === lb.code, JSON.stringify(inv));
ok('B\'s banner rings with A\'s name', await B.until(`(() => { const s = game.scene.getScene('summons'); return !!(s && s.bannerC && s.shown && s.shown.from === ${JSON.stringify(UA)} && s.shown.code === ${JSON.stringify(lb.code)}) })()`, 20000));
await acceptBanner(B);
ok('the rematch lands — both in a live duel', await A.until(ACTIVE, 25000) && await B.until(ACTIVE, 25000));

// ---- 4. offline: the same tap becomes a standing invite, said honestly ----
// a parked headless tab keeps its socket for a minute or more (the server's
// onDisconnect fires late) — leave the sky the way a phone losing signal
// does, through the client's own goOffline, then park
await B.ev(`firebase.database().goOffline(); 1`).catch(() => { });
await sleep(800);
await B.park();
ok('A back on the meadow', await home(A));
ok('A sees B leave the sky', await A.until(`!SSNET.FR.isOnline(${JSON.stringify(UB)})`, 40000));
ok('A opens VERSUS', await toSheet(A));
rs = await rows(A);
ok('B still first, now unlit', rs.length === 1 && rs[0].id === UB && rs[0].lit === '#a9a99a', JSON.stringify(rs));
await tapRow(A, 0);
ok('the tap lands a lobby aimed at the absent B', await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.challenged && s.challenged.id === ${JSON.stringify(UB)} && s.challenged.away })()`, 25000));
lb = await lobby(A); if (lb) codes.add(lb.code);
ok('the lobby says the summons waits under their stars', lb && lb.sub === await A.ev(`SS_T('vsWaitAway', ${JSON.stringify(NB)})`), lb && lb.sub);
inv = await rt('invites/' + UB + '/' + UA);
ok('the standing invite lands', inv && inv.code === lb.code && inv.name === NA, JSON.stringify(inv));

// ---- 5. the circle: a searcher alone is met; the row routes through the engine ----
const stale = (await rt('mp/rooms')) || {};
for (const [k, r] of Object.entries(stale)) if (r && r.status === 'waiting' && !r.private && r.createdAt < Date.now() - 120000) await rtDel('mp/rooms/' + k);
ok('A back on the meadow', await home(A));
ok('A opens VERSUS', await toMenu(A));
await A.tap(`game.scene.getScene('vsmenu').children.list.find(o => o.text === SS_T('vsChWorld'))`);
ok('CHALLENGE WORLDWIDE opens a searching room', await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.room.seekAt })()`, 25000));
lb = await lobby(A); if (lb) codes.add(lb.code);
ok('the quiet sky answers — a circle mage arrives and the duel starts', await A.until(ACTIVE, 30000));
const circ = JSON.parse(await A.ev(`JSON.stringify(SS_RIVAL.circle())`));
lb = await lobby(A);
const CU = lb && lb.players.find((p) => p !== UA);
const cp = circ.find((c) => c.uid === CU);
ok('the opponent is one of the circle', !!cp, CU);
if (cp) { toDelete.add('players/' + cp.uid); toDelete.add('names/' + await A.ev(`SSNET.nameKey(${JSON.stringify(cp.name)})`)); }
ok('recent/<A>/<mage> lands (the engine\'s seat is an ordinary row)', await (async () => { for (let i = 0; i < 20; i++) { const r = await rt('recent/' + UA + '/' + CU); if (r && r.name === cp.name) return true; await sleep(400); } return false; })());
ok('A back on the meadow', await home(A));
ok('A opens VERSUS', await toSheet(A));
rs = await rows(A);
ok('the circle mage is the newest row, marked of the circle, lit ready', rs.length === 2 && rs[0].id === CU && rs[0].circle && rs[0].lit === '#f0e8d2' && rs[1].id === UB, JSON.stringify(rs));
await tapRow(A, 0);
ok('the tap lands a lobby aimed at the mage, circle-routed', await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.challenged && s.challenged.id === ${JSON.stringify(CU)} && !!s.challenged.circle })()`, 25000));
lb = await lobby(A); if (lb) codes.add(lb.code);
ok('no dead invite is rung for the circle', (await rt('invites/' + CU)) === null);
ok('the room is private, sealed for the mage', (await rt('mp/rooms/' + lb.code + '/private')) === true && (await rt('mp/rooms/' + lb.code + '/invited')) === CU);
ok('the mage takes the seat through the engine and the duel goes LIVE', await A.until(ACTIVE, 20000));
lb = await lobby(A);
ok('both seats: A and the mage', lb && lb.players.includes(UA) && lb.players.includes(CU), lb && lb.players.join(','));
ok('the engine log shows the seat', await A.ev(`window.__ssRivalLog.some(e => e.ev === 'seated' && e.code === ${JSON.stringify(lb.code)})`));
ok('the lobby never said "declined"', await A.ev(`!game.scene.getScene('vsbattle').lobbySub || game.scene.getScene('vsbattle').lobbySub.text !== SS_T('vsDeclined', ${JSON.stringify(cp.name)})`));

// ---- 6. the coarse clock, ten tongues, layout in every tongue ----
const H = 3600000;
ok('vsNightsAgo: 0 → tonight', await A.ev(`vsNightsAgo(0) === SS_T('vsAgoTonight')`));
ok('vsNightsAgo: 24h → last night', await A.ev(`vsNightsAgo(24 * ${H}) === SS_T('vsAgoLastNight')`));
ok('vsNightsAgo: 72h → 3 nights ago', await A.ev(`vsNightsAgo(72 * ${H}) === SS_T('vsAgoNights', 3)`));
ok('vsNightsAgo: 100 days → long ago', await A.ev(`vsNightsAgo(2400 * ${H}) === SS_T('vsAgoLong')`));
ok('vsNightsAgo: garbage → tonight', await A.ev(`vsNightsAgo(NaN) === SS_T('vsAgoTonight')`));
const langs = JSON.parse(await A.ev(`JSON.stringify(Object.keys(SS_STR))`));
for (const lang of langs) {
  const r = JSON.parse(await A.ev(`JSON.stringify((() => { const t = SS_STR['${lang}']; const K = ['vsRecentHead','vsNoRecent','vsAgoTonight','vsAgoLastNight','vsAgoNights','vsAgoLong','vsAgain'];
    return { miss: K.filter(k => !t[k]), pct: /%1/.test(t.vsAgoNights) } })())`));
  ok(lang + ': all 7 strings present, %1 in nights-ago', r.miss.length === 0 && r.pct, JSON.stringify(r));
}
ok('no page exceptions', errs.length === 0, errs.join(' | ').slice(0, 300));

// ---- cleanup ----
await Promise.all([A.park(), B.park()]);
for (const c of codes) toDelete.add('mp/rooms/' + c);
for (const p of toDelete) await rtDel(p);
let left = 0; for (const p of toDelete) if ((await rt(p)) !== null) left++;
ok('cleanup: everything this run wrote is gone', left === 0);
console.log(pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
