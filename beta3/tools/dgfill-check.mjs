// DGFILL-CHECK — THE DUELING GROUND, FILLED (v0.112.0, the 10/7 build on
// Skylar's go; design: skypilot82.github.io/starspell-dueling-ground).
// The versus menu's middle earns its ground: full 344×50 replay rows fill by
// the safeB law (friends online → recent rivals → the circle, ranked once
// per open and FROZEN), the strip survives only as the detagged fold at four
// plaques, THE TRUNCATION LAW retires every shrink loop (bucket pills at a
// fixed 10, names fixed 13/13/10), the hero flexes 1.5/1.85/2.0, the funnel
// + offline join the safeB family, the sheet regrows to 448, and THE QUIET
// GROUND stops rendering six lines. This suite measures all five states on
// BOTH a box-exact (390×743, safeB≈800) and a tall (390×844, safeB≈854)
// phone at DPR 3, asserts THE AIR LAW's buffers (≥12 text-to-furniture, ≥8
// furniture-to-furniture, ≥6 in-panel, rows ≥24 above the doors), pins the
// truncation in es/de/fr/pt, and drives the ground with REAL taps (a recent
// row seals a duel; ALL MAGES opens the sheet from the fold). Fabricated
// truths re-enter the scene so create() re-ranks the frozen picks the way a
// real open would. Serves beta3 on :8899 if nothing does; one headless
// Chrome on :9481 (/tmp/cdp-dgp, wiped first — the stale-profile law).
//
//   perl -e 'alarm 560; exec @ARGV' node tools/dgfill-check.mjs   # ~6 min
//
import { spawn, execSync } from 'node:child_process';
const SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const RT = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = () => Math.random().toString(36).slice(2, 7);
const rt = async (p) => (await fetch(RT + p + '.json')).json();
const rtDel = (p) => fetch(RT + p + '.json', { method: 'DELETE' });
const kids = [];
const errs = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
try { execSync('rm -rf /tmp/cdp-dgp'); } catch (e) { }
async function client(port, dir, tag) {
  kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + port,
    '--user-data-dir=' + dir, 'about:blank'], { stdio: 'ignore' }));
  let list = null;
  for (let i = 0; i < 60 && !list; i++) { try { list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json(); } catch (e) { await sleep(500); } }
  if (!list) { console.log('no Chrome on :' + port); process.exit(2); }
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200);
      if (!/WebGL context/.test(t)) errs.push(tag + ': ' + t);
    }
  };
  await new Promise((r) => ws.onopen = r);
  const send = (m, p) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  const ev = async (e) => {
    const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    if (r?.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || 'eval failed').slice(0, 300));
    return r?.result?.value;
  };
  const seed = (src) => send('Page.addScriptToEvaluateOnNewDocument', { source: src });
  const metrics = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 3, mobile: true });
  const nav = async (u) => {
    await ev(`window.__navMark = 1; 1`).catch(() => { });
    for (let i = 0; i < 4; i++) {
      await send('Page.navigate', { url: u });
      for (let j = 0; j < 24; j++) {
        await sleep(250);
        const st = await ev(`(window.__navMark ? 'old' : (location.href.includes('index.html') && typeof SSNET !== 'undefined' ? 'new' : 'loading'))`).catch(() => 'loading');
        if (st === 'new') return true;
        if (st === 'loading') j = Math.min(j, 12);
      }
    }
    return false;
  };
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
  const tapUntil = async (expr, cond, cap = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < cap) {
      try { await tap(expr); } catch (e) { }
      if (await until(cond, 2500)) return true;
    }
    return false;
  };
  const shot = async (file) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    if (r?.data) (await import('node:fs')).writeFileSync(file, Buffer.from(r.data, 'base64'));
  };
  return { ev, seed, nav, until, tap, tapUntil, send, metrics, shot, tag };
}
const A = await client(9481, '/tmp/cdp-dgp', 'A');
const toDelete = new Set(); const codes = new Set();
const UID = 'dg' + rnd();
for (const p of ['players/test_' + UID, 'presence/test_' + UID, 'devices/test_' + UID, 'recent/test_' + UID, 'friends/test_' + UID]) toDelete.add(p);
const BOOT = `navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); } catch (e) {}`;
const READY = `SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').dailyChipB`;
const MENU = `game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').chWorldB`;
const SHEET = `!!game.scene.getScene('vsmenu').socialC && !!game.scene.getScene('vsmenu').recentRows && !!game.scene.getScene('vsmenu').frRows`;
const toMenu = async () => { await A.ev(`game.scene.getScene('home').scene.start('vsmenu'); 1`); const r = await A.until(MENU, 20000); await sleep(700); return r; };
const reMenu = async () => {
  await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); if (s.socialC) s.closeSocial(); s.scene.start('home'); return 1 })()`);
  await A.until(`game.scene.isActive('home')`, 15000);
  return toMenu();
};
// fabricate a page truth, then re-enter the scene so create() re-ranks the
// frozen picks exactly as a real open would
const FAB = (games, friendsOn, recents, circleN) => `(() => { const now = Date.now();
  localStorage.setItem('starspellGames', JSON.stringify(${games}));
  localStorage.setItem('starspellPending', JSON.stringify([]));
  SSNET.FR.invites = {};
  SSNET.FR.friends = ${friendsOn} ? { f1: { name: 'Moonlit Hare', at: now } } : {};
  SSNET.FR.presence = ${friendsOn} ? Object.assign({}, SSNET.FR.presence, { f1: { name: 'Moonlit Hare', at: now } }) : {};
  SSNET.FR.recent = ${recents} >= 2 ? { r1: { name: 'Dawn Scribe', at: now - 86400000 }, r2: { name: 'Night Teller', at: now - 3 * 86400000 } }
    : ${recents} === 1 ? { r1: { name: 'Dawn Scribe', at: now - 86400000 } } : {};
  localStorage.setItem('starspellCircle', JSON.stringify(Array.from({ length: ${circleN} }, (_, i) =>
    ({ uid: 'c' + (i + 1), name: ['Astral Raven', 'Keeper of the Ninth Star', 'Ember Sage'][i] || ('Circle ' + i), rating: 1000 }))));
  return 1 })()`;
const G = (n) => `[1,2,3,4,5].slice(0, ${n}).map(i => ({ code: 'DG' + i + 'X', foe: { id: 'g' + i, name: 'Mage ' + i }, at: now - i * 1000, turn: 'g' + i, status: 'active', held: 0, seen: 0, settled: 0 }))`;
// one page survey: every seat in design units
const SURVEY = `JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const l = ssLayout(s);
  const cam = s.cameras.main, U = l.u(1);
  const dy = (py) => (py - l.y(0)) / U; const dx = (px) => (px - l.x(0)) / U;
  const rect = (o) => { const b = o.getBounds(); return { t: +dy(b.top).toFixed(1), b: +dy(b.bottom).toFixed(1), l: +dx(b.left).toFixed(1), r: +dx(b.right).toFixed(1), cy: +dy(b.centerY).toFixed(1), cx: +dx(b.centerX).toFixed(1) } };
  const fs = (t) => Math.round(parseFloat(t.style.fontSize) / U * 2) / 2;
  const roster = (s.rosterRows || []).map(r => ({ kind: r.kind, id: r.id, name: r.nameT.text, nameFs: fs(r.nameT),
    sub: r.subT ? r.subT.text : null, subFs: r.subT ? fs(r.subT) : null, dot: r.dot.fillColor, dotR: +(r.dot.radius / U).toFixed(1),
    pill: r.pillT.text, pillFs: fs(r.pillT), pillW: r.pillW, pillRect: rect(r.pill), cy: +dy(r.pill.y).toFixed(1), rowRect: rect(r.row) }));
  const pends = (s.pendRows || []).map(r => ({ kind: r.kind, name: r.name }));
  const beds = []; const walk = (list) => list.forEach(o => { if (o.texture && /^btn(dark)?@344x50$/.test(o.texture.key)) beds.push(rect(o)); if (o.list) walk(o.list); });
  walk(s.pendC.list);
  const plaqBeds = beds.slice(0, pends.length);
  const heads = {};
  const hunt = (list) => list.forEach(o => { if (o.text === SS_T('vsDuelsHead')) heads.band = { cy: +dy(o.y).toFixed(1), fs: fs(o) };
    if (o.text === SS_T('vsTonight')) heads.tonight = { cy: +dy(o.y).toFixed(1), fs: fs(o), vis: o.visible };
    if (o.list) hunt(o.list); });
  hunt(s.children.list);
  const chips = (s.chipRows || []).map(c => ({ name: c.nameT.text, fs: fs(c.nameT), cy: +dy(c.pill.y + (s.stripC ? s.stripC.y - l.y(0) + l.y(0) * 0 : 0)).toFixed(1), dot: c.dot.fillColor,
    hasTag: !!c.tagT, hasSub: !!c.subT, pillRect: rect(c.pill) }));
  const doors = {};
  if (s.chWorldB) doors.world = rect(s.chWorldB);
  if (s.chFriendB) doors.friend = rect(s.chFriendB);
  if (s.addDoorB) doors.add = rect(s.addDoorB);
  if (s.invDoorB) doors.inv = rect(s.invDoorB);
  if (s.retryB) doors.retry = rect(s.retryB);
  const all = s.allMagesB ? { rect: rect(s.allMagesB), text: (s.stripC.list.find(o => o.text != null && o !== undefined && o.text && o.x === s.allMagesB.x - 0 && o.text.length > 2) || { text: '?' }).text } : null;
  const cap = s.capT ? { vis: s.capT.visible, cy: +dy(s.capT.y).toFixed(1) } : null;
  const hero = { hs: +s.heroHs.toFixed(3), Ly: +dy(s.heroL.y).toFixed(1), Lx: +dx(s.heroL.x).toFixed(1), Lsx: +s.heroL.scaleX.toFixed(3), Rsx: +s.heroR.scaleX.toFixed(3),
    zenW: s.zenith && s.zenithHalo ? +(s.zenith.displayWidth / U).toFixed(1) : (s.zenith ? -1 : 0) };
  const texts = []; const tw = (list) => list.forEach(o => { if (o.text) texts.push(o.text); if (o.list) tw(o.list); }); tw(s.children.list);
  return { safeB: +s.safeB.toFixed(1), roster, pends, plaqBeds, heads, chips, doors, allMages: all, cap, hero,
    fold: !!(s.stripC && s.stripC.visible), stripY: s.stripC ? +dy(s.stripC.y + l.u(26)).toFixed(1) : null,
    picksN: (s.fillPicks || []).length, texts } })())`;
const survey = () => A.ev(SURVEY).then(JSON.parse);
const T = async (k, a) => A.ev(`SS_T('${k}'${a != null ? ',' + JSON.stringify(a) : ''})`);

/* ================= TALL PHONE (390×844, safeB ≈ 854) ================= */
console.log('— BOOT (tall 390×844 DPR3) —');
await A.metrics(390, 844);
await A.seed(BOOT);
ok('boot', await A.nav(BASE + '?mpuid=' + UID + '&fps=0&lang=en') && await A.until(READY, 60000));
await A.ev(`game.scene.getScene('summons').scene.pause(); 1`);

console.log('— STATE: ZERO DUELS (tall → 5 rows) —');
await A.ev(FAB(`[]`, 1, 2, 3));
ok('menu re-entered', await toMenu());
let sv = await survey();
ok('safeB ≈ 854', Math.abs(sv.safeB - 854.4) < 1.5, sv.safeB);
ok('zero state: no plaques, head vsTonight at y330, hero 1.85×', sv.pends.length === 0 && sv.heads.tonight && Math.abs(sv.heads.tonight.cy - 330) < 1
  && Math.abs(sv.hero.hs - 1.85 / 1.5) < 0.01, JSON.stringify([sv.heads.tonight, sv.hero.hs]));
ok('a tall phone seats FIVE rows at 374 + 58i', sv.roster.length === 5 && sv.roster.every((r, i) => Math.abs(r.cy - (374 + 58 * i)) < 1),
  JSON.stringify(sv.roster.map(r => r.cy)));
ok('rank: friend online → recents → circle (3 of the circle at most, 5 seats)',
  sv.roster.map(r => r.kind).join(',') === 'friend,recent,recent,circle,circle', sv.roster.map(r => r.kind).join(','));
ok('names fixed 13, subs 9.5, pills fixed 10 in buckets 76–128, dots r4.5',
  sv.roster.every(r => r.nameFs === 13 && (r.subFs === null || r.subFs === 9.5) && r.pillFs === 10 && r.pillW >= 76 && r.pillW <= 128 && r.dotR === 4.5),
  JSON.stringify(sv.roster.map(r => [r.nameFs, r.subFs, r.pillFs, r.pillW, r.dotR])));
ok('the friend row: green dot, online sub, DUEL pill; the recent: night-clock + AGAIN; the circle: gold glint, NO sub, DUEL',
  sv.roster[0].dot === 0x7fe0a0 && sv.roster[0].sub === await T('vsOnline') && sv.roster[0].pill === await T('vsDuelTag')
  && sv.roster[1].sub === await T('vsAgoLastNight') && sv.roster[1].pill === await T('vsAgain')
  && sv.roster[3].dot === 0xffd77a && sv.roster[3].sub === null && sv.roster[3].pill === await T('vsDuelTag'),
  JSON.stringify(sv.roster.map(r => [r.dot.toString(16), r.sub, r.pill])));
ok('the long-name test: "Keeper of the Ninth Star" stands whole at 13 (no ellipsis)',
  sv.roster.some(r => r.name === 'Keeper of the Ninth Star'), JSON.stringify(sv.roster.map(r => r.name)));
ok('the fill law: last row bottom ≥24 above the doors (safeB−188)',
  sv.roster[4].cy + 25 <= sv.safeB - 188 - 24 + 0.5 && sv.roster[4].cy + 25 + 58 > sv.safeB - 188 - 24,
  'last bottom ' + (sv.roster[4].cy + 25) + ' vs limit ' + (sv.safeB - 212));
ok('doors anchored: CHALLENGE A FRIEND safeB−158, WORLDWIDE safeB−90, labels alone (no sublines)',
  sv.doors.friend && Math.abs((sv.doors.friend.t + sv.doors.friend.b) / 2 - (sv.safeB - 158)) < 1
  && Math.abs((sv.doors.world.t + sv.doors.world.b) / 2 - (sv.safeB - 90)) < 1
  && !sv.texts.includes(await T('vsChFriendSub')) && !sv.texts.includes(await T('vsChWorldSub')),
  JSON.stringify(sv.doors));
ok('THE QUIET GROUND: no whisper, no caption off-funnel',
  !sv.texts.some(t => t.includes('✦') && /victor|Sieg|vitór/i.test(t)) && sv.cap && sv.cap.vis === false, JSON.stringify(sv.cap));
ok('no strip in a rows state', sv.fold === false && !sv.allMages);
// THE AIR LAW on this state: head↔row ≥12, row↔row ≥8, last row↔door ≥24, in-row ≥6
const air0 = await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const l = ssLayout(s), U = l.u(1);
  const dy = (py) => (py - l.y(0)) / U;
  const head = (() => { let h = null; const walk = (list) => list.forEach(o => { if (o.text === SS_T('vsTonight')) h = o; if (o.list) walk(o.list); }); walk(s.children.list); return h })();
  const headGlyphB = dy(head.y) + parseFloat(head.style.fontSize) / U / 2;
  const rows = (s.rosterRows || []).map(r => ({ top: dy(r.pill.y) - 25, bot: dy(r.pill.y) + 25, nameT: r.nameT, subT: r.subT, y: dy(r.pill.y), pill: r.pill, pw: r.pillW }));
  const firstTop = rows[0].top;
  const gaps = rows.slice(1).map((r, i) => r.top - rows[i].bot);
  const inPanel = rows.map(r => { const nt = dy(r.nameT.y) - parseFloat(r.nameT.style.fontSize) / U / 2;
    const sb = r.subT ? dy(r.subT.y) + parseFloat(r.subT.style.fontSize) / U / 2 : 0;
    return Math.min(nt - r.top, r.subT ? r.bot - sb : 99) });
  const doorTop = dy(s.chFriendB.getBounds().top);
  return { headGap: +(firstTop - headGlyphB).toFixed(1), rowGaps: gaps.map(g => +g.toFixed(1)),
    inPanel: inPanel.map(g => +g.toFixed(1)), doorGap: +(doorTop - rows[rows.length - 1].bot).toFixed(1) } })())`).then(JSON.parse);
ok('THE AIR LAW: head→row ≥12 · row↔row ≥8 · in-panel ≥6 · rows→door ≥24',
  air0.headGap >= 12 && air0.rowGaps.every(g => g >= 7.9) && air0.inPanel.every(g => g >= 6) && air0.doorGap >= 24,
  JSON.stringify(air0));
await A.shot('/tmp/dgfill-zero-tall.png');

console.log('— REAL TAP: a recent row starts the rematch road —');
ok('a REAL tap on the recent row seals the duel (challenge path, cap-gated)', await (async () => {
  if (!await A.tapUntil(`(game.scene.getScene('vsmenu').rosterRows || []).find(r => r.kind === 'recent' && r.id === 'r1').pill`,
    `game.scene.isActive('vsbattle') && !!game.scene.getScene('vsbattle').room`, 25000)) return false;
  const code = await A.ev(`game.scene.getScene('vsbattle').code`);
  codes.add(code);
  toDelete.add('invites/r1');
  return true;
})());
ok('stepping out stands the wait plaque AND the fill re-counts (pendKey gained the row component)', await (async () => {
  await A.ev(`(() => { const s = game.scene.getScene('vsbattle'); const b = s.children.list.find(o => o.text === '‹'); if (b) b.emit('pointerdown'); })()`);
  if (!await A.until(MENU, 15000)) return false;
  await sleep(1400);
  const sv2 = await survey();
  return sv2.pends.length === 1 && sv2.pends[0].kind === 'wait'
    && sv2.plaqBeds.length >= 1 && Math.abs((sv2.plaqBeds[0].t + sv2.plaqBeds[0].b) / 2 - 350) < 1
    && sv2.heads.band && Math.abs(sv2.heads.band.cy - 306) < 1
    && sv2.roster.length === 4 && Math.abs(sv2.roster[0].cy - (394 + 44)) < 1
    && Math.abs(sv2.hero.hs - 1) < 0.01;
})());
// the air cure: band head glyph bottom vs plaque top (the measured live defect)
const air1 = await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const l = ssLayout(s), U = l.u(1);
  const dy = (py) => (py - l.y(0)) / U;
  let h = null; const walk = (list) => list.forEach(o => { if (o.text === SS_T('vsDuelsHead')) h = o; if (o.list) walk(o.list); }); walk(s.pendC.list);
  const hb = dy(h.y) + parseFloat(h.style.fontSize) / U / 2;
  let bed = null; const w2 = (list) => list.forEach(o => { if (!bed && o.texture && /^btn(dark)?@344x50$/.test(o.texture.key)) bed = o; if (o.list) w2(o.list); }); w2(s.pendC.list);
  return { gap: +(dy(bed.getBounds().top) - hb).toFixed(1) } })())`).then(JSON.parse);
ok('THE AIR CURE: the band head clears the first plaque by ≥12 (was −2 on the live page)', air1.gap >= 12, JSON.stringify(air1));

console.log('— STATES: THE PLAQUE LADDER (2 → 3 plaques, tall) —');
await A.ev(`(() => { localStorage.removeItem('starspellPending'); const s = game.scene.getScene('vsmenu'); return 1 })()`);
await A.ev(FAB(G(2), 1, 2, 3));
ok('2 plaques → rows at the measured seats (tall: 3 rows fit)', await (async () => {
  if (!await reMenu()) return false;
  sv = await survey();
  const anchor = 350 + 58 + 25 + 19;
  return sv.pends.length === 2 && sv.roster.length === 3
    && Math.abs(sv.roster[0].cy - (anchor + 44)) < 1 && Math.abs(sv.hero.hs - 1) < 0.01
    && sv.heads.tonight && Math.abs(sv.heads.tonight.cy - anchor) < 1;
})(), JSON.stringify([sv.pends.length, sv.roster.map(r => r.cy), sv.heads.tonight]));
await A.ev(FAB(G(3), 1, 2, 3));
ok('3 plaques → 2 rows (tall)', await (async () => {
  if (!await reMenu()) return false;
  sv = await survey();
  const anchor = 350 + 2 * 58 + 25 + 19;
  return sv.pends.length === 3 && sv.roster.length === 2 && Math.abs(sv.roster[0].cy - (anchor + 44)) < 1;
})(), JSON.stringify([sv.pends.length, sv.roster.length]));

console.log('— STATE: THE FOLD (4 plaques, detagged chips) —');
await A.ev(FAB(G(4), 1, 2, 3));
ok('4 plaques fold: chips detagged at last-plaque-bottom + 32 (y581), names fixed 10, ALL MAGES bucket ≥10pt', await (async () => {
  if (!await reMenu()) return false;
  sv = await survey();
  return sv.pends.length === 4 && sv.roster.length === 0 && sv.fold === true
    && sv.chips.length === 2 && sv.chips.every(c => !c.hasTag && !c.hasSub && c.fs === 10)
    && Math.abs(sv.stripY - 581) < 1 && !!sv.allMages
    && !sv.texts.includes(await T('vsTonight'));
})(), JSON.stringify([sv.pends.length, sv.chips, sv.stripY]));
ok('fold air: chips clear the fourth plaque ≥8', await (async () => {
  const r = JSON.parse(await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const l = ssLayout(s), U = l.u(1);
    const dy = (py) => (py - l.y(0)) / U;
    const beds = []; const walk = (list) => list.forEach(o => { if (o.texture && /^btn(dark)?@344x50$/.test(o.texture.key)) beds.push(o); if (o.list) walk(o.list); });
    walk(s.pendC.list);
    const lastBot = Math.max(...beds.map(b => dy(b.getBounds().bottom)));
    const chipTop = dy(s.chipRows[0].pill.getBounds().top) + (s.stripC.y - l.y(0)) / U;
    return { gap: +(chipTop - lastBot).toFixed(1) } })())`));
  return r.gap >= 8;
})());
ok('a REAL tap on › ALL MAGES opens the sheet from the fold', await A.tapUntil(`game.scene.getScene('vsmenu').allMagesB`, SHEET, 12000));

console.log('— THE SHEET REGROWN (448, four recents, bucket pills) —');
const sheet = await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const l = ssLayout(s), U = l.u(1);
  const dy = (py) => (py - l.y(0)) / U;
  const fs = (t) => Math.round(parseFloat(t.style.fontSize) / U * 2) / 2;
  const panel = s.socialC.list.find(o => o.texture && o.texture.key === 'endpanel');
  const fr = (s.frRows || []).map(r => ({ name: r.nameT.text, fs: fs(r.nameT), cb: fs(r.ct), y: +dy(r.cb.y).toFixed(1) }));
  const rec = (s.recentRows || []).map(r => ({ name: r.nameT.text, fs: fs(r.nameT), ago: r.agoT.text, agoFs: fs(r.agoT), y: +dy(r.again.y).toFixed(1) }));
  const recPillFs = (s.recentRows || []).map(r => { const t = s.frC.list.find(o => o.text != null && Math.abs(o.x - r.again.x) < 1 && Math.abs(o.y - r.again.y) < 1); return t ? fs(t) : -1 });
  const invSub = s.socialC.list.some(o => o.text === SS_T('vsInviteNewSub'));
  return { ph: +(panel.displayHeight / U).toFixed(1), top: +dy(panel.getBounds().top).toFixed(1),
    fr, rec, recPillFs, invSub, recN: (s.recentRows || []).length } })())`).then(JSON.parse);
ok('the panel is 448 tall, top 176', Math.abs(sheet.ph - 448) < 1 && Math.abs(sheet.top - 176) < 1, JSON.stringify([sheet.ph, sheet.top]));
ok('sheet names fixed 13; recent AGAIN pills fixed 10 (the 9.5→7 loop is dead); the night-clock sub at 9.5',
  sheet.rec.every(r => r.fs === 13 && r.agoFs === 9.5) && sheet.recPillFs.every(f => f === 10), JSON.stringify(sheet));
ok('the invite plate carries its label alone (no subline)', sheet.invSub === false);
await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); if (s.socialC) s.closeSocial(); return 1 })()`);

console.log('— STATE: >4 DUELS (3 + more-line + fold) —');
await A.ev(FAB(G(5), 1, 2, 3));
ok('five duels: 3 plaques + "+2 more" at y516 + the fold chips', await (async () => {
  if (!await reMenu()) return false;
  sv = await survey();
  return sv.pends.length === 3 && sv.texts.includes(await A.ev(`SS_T('vsMore', 2)`)) && sv.fold === true && Math.abs(sv.stripY - 581) < 1;
})(), JSON.stringify([sv.pends.length, sv.fold, sv.stripY]));
await A.shot('/tmp/dgfill-fold-tall.png');

/* ================= BOX-EXACT PHONE (390×743, safeB ≈ 800) ================= */
console.log('— BOX-EXACT (390×743, safeB ≈ 800) —');
await A.metrics(390, 743);
ok('box-exact boot', await A.nav(BASE + '?mpuid=' + UID + '&fps=0&lang=en') && await A.until(READY, 60000));
await A.ev(`game.scene.getScene('summons').scene.pause(); 1`);
await A.ev(FAB(`[]`, 1, 2, 3));
ok('menu re-entered (box)', await toMenu());
sv = await survey();
ok('safeB ≈ 800', Math.abs(sv.safeB - 800.1) < 1.5, sv.safeB);
ok('zero duels on the box seats exactly FOUR rows', sv.roster.length === 4 && sv.roster.every((r, i) => Math.abs(r.cy - (374 + 58 * i)) < 1),
  JSON.stringify(sv.roster.map(r => r.cy)));
ok('the fill law holds on the box: a fifth row would cross safeB−212', sv.roster[3].cy + 25 + 58 > sv.safeB - 212, '');
await A.shot('/tmp/dgfill-zero-box.png');
await A.ev(FAB(G(3), 1, 2, 3));
ok('3 plaques on the box → exactly ONE row (the ladder\'s 1)', await (async () => {
  if (!await reMenu()) return false;
  sv = await survey();
  return sv.pends.length === 3 && sv.roster.length === 1 && Math.abs(sv.roster[0].cy - (510 + 44)) < 1;
})(), JSON.stringify([sv.pends.length, sv.roster.map(r => r.cy)]));
await A.shot('/tmp/dgfill-3plaq-box.png');

console.log('— STATE: FUNNEL (fresh mage, box) —');
await A.ev(`localStorage.removeItem('starspellGames'); localStorage.removeItem('starspellPending'); localStorage.removeItem('starspellCircle'); 1`);
const FU = 'dgf' + rnd();
for (const p of ['players/test_' + FU, 'presence/test_' + FU, 'devices/test_' + FU]) toDelete.add(p);
ok('fresh boot lands the funnel', await A.nav(BASE + '?mpuid=' + FU + '&fps=0&lang=en') && await A.until(READY, 60000) && await toMenu(A)
  && await A.ev(`game.scene.getScene('vsmenu').doorsMode === 'funnel' && !game.scene.getScene('vsmenu').chFriendB`));
sv = await survey();
ok('the funnel doors JOIN the safeB family: −370 / −296 / −222, labels alone',
  sv.doors.world && Math.abs((sv.doors.world.t + sv.doors.world.b) / 2 - (sv.safeB - 370)) < 1
  && Math.abs((sv.doors.add.t + sv.doors.add.b) / 2 - (sv.safeB - 296)) < 1
  && Math.abs((sv.doors.inv.t + sv.doors.inv.b) / 2 - (sv.safeB - 222)) < 1
  && !sv.texts.includes(await T('vsAddFriendSub')) && !sv.texts.includes(await T('vsInviteNewSub')),
  JSON.stringify(sv.doors));
ok('the caption teaches on the funnel alone; the hero stands 2.0×',
  sv.cap && sv.cap.vis === true && Math.abs(sv.hero.hs - 2 / 1.5) < 0.01
  && Math.abs(sv.hero.Ly - (128 + 84 * 2 / 1.5)) < 1.5 && Math.abs(sv.hero.Rsx + 2 / 1.5) < 0.01,
  JSON.stringify([sv.cap, sv.hero]));
ok('the zenith rides the flex', sv.hero.zenW >= 31 && sv.hero.zenW <= 33, sv.hero.zenW);
await A.shot('/tmp/dgfill-funnel-box.png');

console.log('— STATE: OFFLINE (ghost rows, box) —');
await A.send('Network.setBlockedURLs', { urls: ['*firebasejs*', '*firebaseio.com*'] });
ok('a blocked sky boots local', await A.nav(BASE + '?mpuid=' + FU + '&fps=0&lang=en')
  && await A.until(`typeof SSNET !== 'undefined' && SSNET.mode === 'local' && !!window.game && game.scene.isActive('home')`, 60000));
// the device remembers two standing duels — written on the booted page so
// no seed-order mystery can starve the ledger, then the page opens on them
await A.ev(`localStorage.setItem('starspellGames', JSON.stringify([
  { code: 'GH1X', foe: { id: 'x1', name: 'Quiet Owl' }, at: Date.now(), turn: '${'test_' + FU}', status: 'active', held: 0, seen: 0, settled: 0 },
  { code: 'GH2X', foe: { id: 'x2', name: 'Umbral Raven' }, at: Date.now(), turn: 'x2', status: 'active', held: 0, seen: 0, settled: 0 }])); 1`);
await A.ev(`game.scene.getScene('home').scene.start('vsmenu'); 1`);
ok('the offline page builds', await A.until(`game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').retryB`, 20000));
await sleep(900);
const off = await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const l = ssLayout(s), U = l.u(1);
  const dy = (py) => (py - l.y(0)) / U;
  const fs = (t) => Math.round(parseFloat(t.style.fontSize) / U * 2) / 2;
  const g = s.ghostC ? s.ghostC.list : [];
  const beds = g.filter(o => o.texture && /^btn(dark)?@344x50$/.test(o.texture.key));
  const names = g.filter(o => o.text && o.style && Math.round(parseFloat(o.style.fontSize) / U * 2) / 2 === 13).map(o => o.text);
  const subs = g.filter(o => o.text && o.style && Math.round(parseFloat(o.style.fontSize) / U * 2) / 2 === 9.5).map(o => o.text);
  const dots = g.filter(o => o.fillColor !== undefined && o.radius);
  const pills = g.filter(o => o.texture && /^btn/.test(o.texture.key) && !/344x50/.test(o.texture.key));
  const texts = []; const tw = (list) => list.forEach(o => { if (o.text) texts.push(o.text); if (o.list) tw(o.list); }); tw(s.children.list);
  return { gA: s.ghostC ? +s.ghostC.alpha.toFixed(2) : -1, beds: beds.map(b => +dy(b.y).toFixed(1)), names, subs,
    dots: dots.map(d => d.fillColor), pills: pills.length,
    retryCy: +dy(s.retryB.y).toFixed(1), safeB: +s.safeB.toFixed(1),
    hero: { hs: +s.heroHs.toFixed(3), a: +s.heroL.alpha.toFixed(2) }, zenScale: s.zenith ? +s.zenith.scaleX.toFixed(2) : -1,
    chip: !!s.idChipT, texts } })())`).then(JSON.parse);
ok('the ghost rows stand in the row anatomy at 430 + 58i: beds, slate dots, names 13, the status fiction subs, NO pills, α .55',
  off.beds.length === 2 && off.beds.every((y, i) => Math.abs(y - (430 + 58 * i)) < 1)
  && off.names.includes('Quiet Owl') && off.names.includes('Umbral Raven')
  && off.subs.length === 2 && off.dots.every(d => d === 0x39406b) && off.pills === 0 && off.gA === 0.55,
  JSON.stringify(off));
ok('the subs speak the duel\'s own fiction', off.subs.includes(await T('vsYourMove')) && off.subs.some(s2 => s2.includes('Umbral Raven')), JSON.stringify(off.subs));
ok('the vsGhost line is dead; the couplet stands at y372', !off.texts.includes(await T('vsGhost'))
  && off.texts.includes(await T('vsNoSky')), '');
ok('TRY THE SKY AGAIN anchors safeB−158; the dim hero stands 2.0×; no identity chip',
  Math.abs(off.retryCy - (off.safeB - 158)) < 1 && Math.abs(off.hero.hs - 2 / 1.5) < 0.01 && off.hero.a === 0.45
  && Math.abs(off.zenScale - 1.1 * 2 / 1.5) < 0.03 && off.chip === false, JSON.stringify([off.retryCy, off.hero, off.zenScale]));
await A.shot('/tmp/dgfill-offline-box.png');
await A.send('Network.setBlockedURLs', { urls: [] });

console.log('— TRUNCATION ×5 (es OTRA VEZ · de NOCHMAL at full 10pt in buckets) —');
for (const lang of ['es', 'de', 'fr', 'pt']) {
  const okb = await A.nav(BASE + '?mpuid=' + UID + '&fps=0&lang=' + lang) && await A.until(READY, 60000);
  if (!okb) { ok(lang + ': boot', false); continue; }
  await A.ev(`game.scene.getScene('summons').scene.pause(); 1`);
  await A.ev(FAB(`[]`, 1, 2, 3));
  if (!await toMenu()) { ok(lang + ': menu', false); continue; }
  const tr = await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const l = ssLayout(s), U = l.u(1);
    const fs = (t) => Math.round(parseFloat(t.style.fontSize) / U * 2) / 2;
    const rows = (s.rosterRows || []).map(r => ({ word: r.pillT.text, fs: fs(r.pillT), w: r.pillW,
      fits: r.pillT.width <= r.pill.displayWidth - l.u(10) }));
    return { rows, again: SS_T('vsAgain') } })())`).then(JSON.parse);
  ok(lang + ': every pill word whole at fixed 10pt inside its bucket (incl. ' + tr.again + ')',
    tr.rows.length > 0 && tr.rows.every(r => r.fs === 10 && !r.word.includes('…') && r.fits && r.w >= 76 && r.w <= 128)
    && tr.rows.some(r => r.word === tr.again), JSON.stringify(tr.rows));
}

ok('no page exceptions', errs.length === 0, errs.join(' || ').slice(0, 300));
/* cleanup */
for (const c of codes) toDelete.add('mp/rooms/' + c);
for (const p of toDelete) await rtDel(p);
let left = 0; const leftNames = [];
for (const p of toDelete) if ((await rt(p)) !== null) { left++; leftNames.push(p); }
ok('cleanup: everything this run wrote is gone', left === 0, leftNames.join(','));
console.log(pass + '/' + (pass + fail) + ' passed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
