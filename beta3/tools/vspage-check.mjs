// VSPAGE-CHECK — the challenge-first versus page (v0.73.0).
// Skylar (9/2): no 'Versus' heading, no timed, no battlegrounds — async
// battle only; INVITE A FRIEND becomes CHALLENGE A FRIEND and opens the
// friends + recent-rivals sheet with an invite-a-new-friend row pinned at
// its foot (the share carries the STARSPELL app link, never a drbango.com
// page); FIND A RIVAL becomes CHALLENGE WORLDWIDE; a + by the FRIENDS
// heading adds a friend by their unique name; every friend row wears the
// drawn crossed-blades glyph + CHALLENGE (an away friend takes a standing
// summons). This suite proves the page in all five languages, the sheet's
// shape and pinned invite, the share payload, the + add-by-name flow on two
// REAL uids against the live registry, a real friend-row challenge landing a
// TURNS room through the summons bell, the away-row standing invite, and
// CHALLENGE WORLDWIDE seeding a turns room with a queue clock.
// Self-launching: serves beta3 on :8899 if nothing does, TWO headless
// Chromes on :9471/:9472 (/tmp/cdp-vspa|b, wiped first — the stale-profile
// law), the LIVE sky (registry + FR need it; every row this run writes is
// deleted and proven gone at the end).
//
//   perl -e 'alarm 580; exec @ARGV' node tools/vspage-check.mjs   # ~6 min
//
import { spawn, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const RT = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LANGS = ['en', 'es', 'fr', 'pt', 'de'];
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = () => Math.random().toString(36).slice(2, 7);
const rt = async (p) => (await fetch(RT + p + '.json')).json();
const rtDel = (p) => fetch(RT + p + '.json', { method: 'DELETE' });

/* ---------- the source audit (no browser needed) ---------- */
console.log('— THE SOURCE AUDIT —');
const vsSrc = readFileSync('versus.js', 'utf8');
ok("the '⚔ VERSUS ⚔' heading is gone from versus.js", !vsSrc.includes('⚔ VERSUS ⚔'));
ok('no mode pills, no mode subs, no saved mode', !/VS_MODE_SUB|setMode\(|setItem\('beta3\.vsmode'/.test(vsSrc));
ok('the dead beta3.vsmode key is swept', /removeItem\('beta3\.vsmode'\)/.test(vsSrc));
ok("every menu door seals turns: match('turns') + three 'turns' seals",
  /this\.match\('turns'\)/.test(vsSrc) && (vsSrc.match(/vsSealRoom\(code, 'turns'/g) || []).length >= 2
  && /FR\.challenge\(f\.id, code, 'turns'\)/.test(vsSrc));
ok('VS_APP_URL is the TestFlight door', /VS_APP_URL = 'https:\/\/testflight\.apple\.com\/join\/Hxs8e7fU'/.test(vsSrc));
ok('the app invite rides VS_APP_URL, and no friend-link URL builder survives',
  /vsShare\(SS_T\('vsAppText', vsName\(\), vsName\(\)\), VS_APP_URL\)/.test(vsSrc) && !/vsFriendUrl/.test(vsSrc));
ok('the drawn crossed-blades glyph is baked art (vsSwordsTex through ssBake), on crest and rows',
  /function vsSwordsTex/.test(vsSrc) && /ssBake\(t, key, W, W/.test(vsSrc) && (vsSrc.match(/vsSwordsTex\(this\)/g) || []).length >= 2);
const strSrc = readFileSync('strings.js', 'utf8');
const NEW_KEYS = ['vsAsync', 'vsChFriend', 'vsChFriendSub', 'vsChWorld', 'vsChWorldSub', 'vsInviteNew', 'vsInviteNewSub', 'vsAppText', 'vsAddSelf', 'vsShareFail'];
const OLD_KEYS = ['vsInvite', 'vsInviteSub', 'vsFind', 'vsFindSub', 'vsTurnsSub', 'vsTimedSub', 'vsBgSub', 'vsFriendLink', 'vsFriendText'];
ok('all ten new keys ship exactly five times (one per language)',
  NEW_KEYS.every((k) => (strSrc.match(new RegExp(k + ':', 'g')) || []).length === 5),
  NEW_KEYS.map((k) => k + '×' + (strSrc.match(new RegExp(k + ':', 'g')) || []).length).join(' '));
ok('no retired key survives in any language',
  OLD_KEYS.every((k) => !new RegExp('[^a-zA-Z]' + k + ':').test(strSrc)),
  OLD_KEYS.filter((k) => new RegExp('[^a-zA-Z]' + k + ':').test(strSrc)).join(','));

/* ---------- server + two browsers ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
for (const p of ['/tmp/cdp-vspa', '/tmp/cdp-vspb']) { try { execSync('rm -rf ' + p); } catch (e) { } }
const errs = [];
async function client(port, dir, tag) {
  kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + port,
    '--user-data-dir=' + dir, '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
    if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
    return r?.result?.value;
  };
  const seed = (src) => send('Page.addScriptToEvaluateOnNewDocument', { source: src });
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
  const tapUntil = async (expr, cond, cap = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < cap) {
      try { await tap(expr); } catch (e) { }
      if (await until(cond, 2500)) return true;
    }
    return false;
  };
  const type = (text) => send('Input.insertText', { text });
  const key = async (k, code) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: 13 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: 13 });
  };
  return { ev, seed, nav, park, until, tap, tapUntil, type, key, tag };
}
const [A, B] = await Promise.all([client(9471, '/tmp/cdp-vspa', 'A'), client(9472, '/tmp/cdp-vspb', 'B')]);
const toDelete = new Set();
const codes = new Set();
const BOOT = (uid, name) => `navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); if (localStorage.getItem('vp.seeded') !== '${uid}') { localStorage.clear(); localStorage.setItem('vp.seeded', '${uid}');
    localStorage.setItem('starspellUid', '${uid}'); ${name ? `localStorage.setItem('starspellName', ${JSON.stringify(name)});` : ''} } } catch (e) {}`;
const READY = `SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').lanternB`;
const MENU = `game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').nameB`;
const SHEET = `!!game.scene.getScene('vsmenu').socialC && !!game.scene.getScene('vsmenu').recentRows && !!game.scene.getScene('vsmenu').frRows`;
const toMenu = async (c) => { await c.ev(`game.scene.getScene('home').scene.start('vsmenu'); 1`); const r = await c.until(MENU, 20000); await sleep(600); return r; };
const openSheet = async (c) => c.tapUntil(`game.scene.getScene('vsmenu').children.list.find(o => o.text === SS_T('vsChFriend'))`, SHEET, 12000);
const INPUT = `!!document.getElementById('ss-overlay-input') && document.activeElement === document.getElementById('ss-overlay-input')`;
const sceneTexts = (c) => c.ev(`JSON.stringify(game.scene.getScene('vsmenu').children.list.filter(o => o.text !== undefined).map(o => o.text))`).then(JSON.parse);
const sheetTexts = (c) => c.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const out = [];
  const walk = (list) => list.forEach(o => { if (o.text !== undefined) out.push(o.text); if (o.list) walk(o.list); });
  walk(s.socialC.list); return out })())`).then(JSON.parse);

/* ---------- 1. the page, in all five languages ---------- */
console.log('— THE PAGE ×5 —');
const VPU = 'vp' + rnd();
toDelete.add('players/test_' + VPU); toDelete.add('presence/test_' + VPU); toDelete.add('devices/test_' + VPU);
for (const lang of LANGS) {
  await A.seed(BOOT('x', null));   // mpuid rules the uid; the seed only quiets share/clipboard
  const up = await A.nav(BASE + '?mpuid=' + VPU + '&fps=0&lang=' + lang) && await A.until(READY, 60000) && await toMenu(A);
  if (!up) { ok(lang + ': the page', false, 'boot failed'); continue; }
  const tx = await sceneTexts(A);
  const T = await A.ev(`JSON.stringify({ vs: SS_T('versus'), cf: SS_T('vsChFriend'), cw: SS_T('vsChWorld'), as: SS_T('vsAsync'),
    mt: SS_T('vsModeTurns'), md: SS_T('vsModeTimed'), mb: SS_T('vsModeBg'), fr: SS_T('vsFriends'), rh: SS_T('vsRecentHead'),
    bn: SS_T('vsByName'), sl: SS_T('vsSeal') })`).then(JSON.parse);
  const good = !tx.includes(T.vs) && tx.includes(T.cf) && tx.includes(T.cw) && tx.includes(T.as)
    && !tx.includes(T.mt) && !tx.includes(T.md) && !tx.includes(T.mb)
    && !tx.includes(T.fr) && !tx.includes(T.rh) && tx.includes(T.bn) && tx.includes(T.sl)
    && await A.ev(`game.scene.getScene('vsmenu').recentRows === null && game.scene.getScene('vsmenu').socialC === null`);
  ok(lang + ': no heading, no pills, no panel — the two primaries + caption + doors', good, tx.join(' | ').slice(0, 160));
}
// the booted key tables (readable from the standing de boot)
for (const lang of LANGS) {
  const r = await A.ev(`JSON.stringify((() => { const t = SS_STR['${lang}'];
    return { miss: ${JSON.stringify(NEW_KEYS)}.filter(k => !t[k]), old: ${JSON.stringify(OLD_KEYS)}.filter(k => t[k]) } })())`).then(JSON.parse);
  ok(lang + ': all ten new keys present, every retired key gone', r.miss.length === 0 && r.old.length === 0, JSON.stringify(r));
}

/* ---------- 2. the sheet: shape, pinned invite, close/reopen ---------- */
console.log('— THE SHEET —');
ok('en boot back up', await A.nav(BASE + '?mpuid=' + VPU + '&fps=0&lang=en') && await A.until(READY, 60000) && await toMenu(A));
ok('CHALLENGE A FRIEND opens the sheet', await openSheet(A));
let stx = await sheetTexts(A);
const ST = await A.ev(`JSON.stringify({ fr: SS_T('vsFriends'), rh: SS_T('vsRecentHead'), nf: SS_T('vsNoFriends'), nr: SS_T('vsNoRecent'),
  inv: SS_T('vsInviteNew'), sub: SS_T('vsInviteNewSub') })`).then(JSON.parse);
ok('the heads, the +, the ✕, both quiet empty lines', stx.includes(ST.fr) && stx.includes('+') && stx.includes('✕')
  && stx.includes(ST.rh) && stx.includes(ST.nf) && stx.includes(ST.nr), stx.join(' | ').slice(0, 200));
ok('the invite row stands at the very bottom, under everything in the roll',
  await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); const invTop = s.invB.getBounds().top;
    let bad = 0; const walk = (list) => list.forEach(o => { if (o.getBounds && o.getBounds().bottom > invTop + 2) bad++; if (o.list) walk(o.list); });
    walk(s.frC.list); return bad === 0 })()`));
ok('invite copy inside the row', stx.includes(ST.inv) && stx.includes(ST.sub));
ok('the +, the ✕ and the invite row all meet the 44-pt law',
  await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); const css = (o) => { const D = game.scale.width / innerWidth;
      return Math.min(o.input.hitArea.width * Math.abs(o.scaleX), o.input.hitArea.height * Math.abs(o.scaleY)) / D; };
    const xb = s.socialC.list.find(o => o.text === '✕');
    return css(s.addB) >= 43.5 && css(xb) >= 43.5 && css(s.invB) >= 43.5 })()`));
ok('✕ closes the sheet', await (async () => {
  await A.tap(`game.scene.getScene('vsmenu').socialC.list.find(o => o.text === '✕')`);
  return A.until(`game.scene.getScene('vsmenu').socialC === null`, 6000);
})());
ok('…and it opens again (the stale-ref law)', await openSheet(A));
ok('a tap on the veil above the parchment closes it too', await (async () => {
  await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); const v = s.socialC.list[0]; v.emit('pointerdown'); return 1 })()`);
  return A.until(`game.scene.getScene('vsmenu').socialC === null`, 6000);
})());

/* ---------- 3. the share payload: the app, never the site ---------- */
console.log('— THE APP INVITE —');
ok('sheet open for the share', await openSheet(A));
// the v0.41 lesson: navigator.clipboard's prototype getter cannot be assigned
// over — define an OWN property with a capturing writeText (the modern path a
// real phone takes); the execCommand hook rides along as the fallback net
await A.ev(`window.__cap = null;
Object.defineProperty(navigator, 'clipboard', { configurable: true,
  value: { writeText: (t) => { window.__cap = t; return Promise.resolve(); } } });
document.execCommand = function (cmd) {
  if (cmd === 'copy') window.__cap = document.activeElement && document.activeElement.value; return true; }; 1`);
ok('a real tap on the invite row copies the summons', await A.tapUntil(`game.scene.getScene('vsmenu').invB`,
  `typeof window.__cap === 'string' && window.__cap.length > 0`, 20000));
const cap = await A.ev(`window.__cap`) || '';
const myName = await A.ev(`SSNET.myName()`);
ok('the payload carries the STARSPELL app link', cap.includes('https://testflight.apple.com/join/Hxs8e7fU'), cap.slice(0, 120));
ok('…and the sender\'s name for the add-by-name bridge', cap.includes(myName), cap.slice(0, 120));
ok('…and NEVER a web page: no drbango.com, no localhost, no join/friend deep link',
  !/drbango\.com|localhost|[?&]join=|[?&]friend=/.test(cap), cap);
ok('the sheet note says COPIED', await A.until(`(() => { const s = game.scene.getScene('vsmenu'); return s.shNoteT && s.shNoteT.text === SS_T('vsCopied') })()`, 6000));

/* ---------- 4. + adds a friend by name (two real mages, live registry) ---------- */
console.log('— THE + (ADD BY NAME) —');
const UA = 'u' + rnd() + 'vpa', UB = 'u' + rnd() + 'vpb';
const NA = 'Vega ' + rnd().toUpperCase(), NB = 'Lyra ' + rnd().toUpperCase();
for (const u of [UA, UB]) for (const p of ['players/', 'presence/', 'devices/', 'friends/', 'recent/', 'invites/']) toDelete.add(p + u);
console.log('A=' + UA + ' "' + NA + '"   B=' + UB + ' "' + NB + '"');
await A.seed(BOOT(UA, NA)); await B.seed(BOOT(UB, NB));
ok('both mages reach the sky', await A.nav(BASE + '?fps=0') && await A.until(READY, 60000)
  && await B.nav(BASE + '?fps=0') && await B.until(READY, 60000));
await A.until(`(async () => { await SSNET.ensureName(); return true })()`, 30000);
await B.until(`(async () => { await SSNET.ensureName(); return true })()`, 30000);
toDelete.add('names/' + await A.ev(`SSNET.nameKey(${JSON.stringify(NA)})`));
toDelete.add('names/' + await B.ev(`SSNET.nameKey(${JSON.stringify(NB)})`));
ok('A opens the sheet', await toMenu(A) && await openSheet(A));
ok('the + opens the name field', await A.tapUntil(`game.scene.getScene('vsmenu').addB`, INPUT, 12000));
await A.type(NB.toLowerCase()); await A.key('Enter', 'Enter');
ok('the friendship lands on BOTH sides of the sky', await (async () => {
  for (let i = 0; i < 25; i++) {
    const a = await rt('friends/' + UA + '/' + UB), b = await rt('friends/' + UB + '/' + UA);
    if (a && a.name === NB && b && b.name === NA) return true;
    await sleep(400);
  }
  return false;
})());
ok('the roll repaints itself: B\'s row, the drawn glyph, CHALLENGE ready',
  await A.until(`(() => { const s = game.scene.getScene('vsmenu'); if (!s.frRows || !s.frRows.length) return false;
    const r = s.frRows.find(r => r.id === ${JSON.stringify(UB)});
    return !!(r && r.nameT.text === ${JSON.stringify(NB)} && r.glyph.texture.key === 'vsswords' && r.cb.input && r.cb.input.enabled) })()`, 15000));
ok('…and says so', await A.until(`(() => { const s = game.scene.getScene('vsmenu'); return s.shNoteT && s.shNoteT.text === SS_T('frAdded', ${JSON.stringify(NB)}) })()`, 8000));
// the honest miss re-offers the typed text
const nobody = 'Nobody ' + rnd().toUpperCase();
ok('+ again for a mage who does not exist', await A.tapUntil(`game.scene.getScene('vsmenu').addB`, INPUT, 12000));
await A.type(nobody); await A.key('Enter', 'Enter');
ok('the miss is named honestly', await A.until(`(() => { const s = game.scene.getScene('vsmenu'); return s.shNoteT && s.shNoteT.text === SS_T('vsNameNone', ${JSON.stringify(nobody)}) })()`, 15000));
ok('…and the field comes back holding what was typed', await A.until(INPUT + ` && document.getElementById('ss-overlay-input').value === ${JSON.stringify(nobody)}`, 8000));
// the next + replaces the standing input through ssDomInput's own guarded
// removal (removing a FOCUSED input throws NotFoundError from the blur race
// — the game swallows it; a harness eval must not remove it bare)
// yourself is refused gently
ok('+ once more, for your own name', await A.tapUntil(`game.scene.getScene('vsmenu').addB`, INPUT, 12000));
await A.type(NA); await A.key('Enter', 'Enter');
ok('your own name is a gentle no', await A.until(`(() => { const s = game.scene.getScene('vsmenu'); return s.shNoteT && s.shNoteT.text === SS_T('vsAddSelf') })()`, 10000));

/* ---------- 5. a friend row's CHALLENGE lands a TURNS room ---------- */
console.log('— THE ROW CHALLENGE —');
ok('a real tap on the row\'s CHALLENGE opens a lobby aimed at B',
  await A.tapUntil(`((game.scene.getScene('vsmenu').frRows || []).find(r => r.id === ${JSON.stringify(UB)}) || {}).cb`,
    `(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.challenged && s.challenged.id === ${JSON.stringify(UB)} && !s.challenged.away })()`, 25000));
let room = await A.ev(`(() => { const s = game.scene.getScene('vsbattle'); return JSON.stringify({ code: s.code, mode: s.room.mode, priv: s.room.private, inv: s.room.invited }) })()`).then(JSON.parse);
codes.add(room.code);
ok('the room is TURNS, private, sealed for B', room.mode === 'turns' && room.priv === true && room.inv === UB, JSON.stringify(room));
ok('B\'s banner rings', await B.until(`(() => { const s = game.scene.getScene('summons'); return !!(s && s.bannerC && s.shown && s.shown.from === ${JSON.stringify(UA)}) })()`, 20000));
ok('a real ACCEPT starts the duel on both sides', await (async () => {
  await sleep(900);
  for (let i = 0; i < 3; i++) {
    await B.tap(`game.scene.getScene('summons').bannerC.list.find(o => o.text === SS_T('smAccept'))`);
    if (await B.until(`game.scene.getScene('summons').accepting || game.scene.isActive('vsbattle')`, 3000)) break;
  }
  const ACT = `(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.room.status === 'active' })()`;
  return await A.until(ACT, 25000) && await B.until(ACT, 25000);
})());
// away: the friend keeps the affordance, the tap lands the standing summons
await B.ev(`firebase.database().goOffline(); 1`).catch(() => { });
await sleep(800);
await B.park();
ok('A back on the meadow', await A.nav(BASE + '?fps=0') && await A.until(READY, 60000));
ok('A sees B leave the sky', await A.until(`!SSNET.FR.isOnline(${JSON.stringify(UB)})`, 40000));
ok('the sheet still gives the away friend the challenge', await toMenu(A) && await openSheet(A)
  && await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); const r = (s.frRows || []).find(r => r.id === ${JSON.stringify(UB)});
    return !!(r && !r.online && r.cb.input && r.cb.input.enabled && r.glyph.texture.key === 'vsswords') })()`));
ok('…and the tap lands a lobby that says the summons waits',
  await A.tapUntil(`((game.scene.getScene('vsmenu').frRows || []).find(r => r.id === ${JSON.stringify(UB)}) || {}).cb`,
    `(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.challenged && s.challenged.id === ${JSON.stringify(UB)} && s.challenged.away
      && s.lobbySub && s.lobbySub.text === SS_T('vsWaitAway', ${JSON.stringify(NB)}) })()`, 25000));
room = await A.ev(`(() => { const s = game.scene.getScene('vsbattle'); return JSON.stringify({ code: s.code, mode: s.room.mode }) })()`).then(JSON.parse);
codes.add(room.code);
ok('the standing invite waits under B\'s stars, a turns room behind it', room.mode === 'turns' && await (async () => {
  for (let i = 0; i < 15; i++) { const inv = await rt('invites/' + UB + '/' + UA); if (inv && inv.code === room.code && inv.mode === 'turns') return true; await sleep(400); }
  return false;
})());

/* ---------- 6. CHALLENGE WORLDWIDE seeds a turns room with a queue clock ---------- */
console.log('— CHALLENGE WORLDWIDE —');
const stale = (await rt('mp/rooms')) || {};
for (const [k, r] of Object.entries(stale)) if (r && r.status === 'waiting' && !r.private && r.createdAt < Date.now() - 120000) await rtDel('mp/rooms/' + k);
ok('A back on the meadow', await A.nav(BASE + '?fps=0') && await A.until(READY, 60000) && await toMenu(A));
await A.tap(`game.scene.getScene('vsmenu').children.list.find(o => o.text === SS_T('vsChWorld'))`);
ok('the tap opens a searching TURNS room, queue clock running',
  await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.room.seekAt > 0 && s.room.mode === 'turns' && !s.room.private })()`, 25000));
room = await A.ev(`(() => { const s = game.scene.getScene('vsbattle'); return JSON.stringify({ code: s.code }) })()`).then(JSON.parse);
codes.add(room.code);
await A.park();   // park before the quiet sky answers — rival-check owns that path

/* ---------- 6b. the ?frdemo=invite recipe still stands (sealLobby) ---------- */
ok('?frdemo=invite still lands a private turns lobby', await (async () => {
  if (!await A.nav(BASE + '?fps=0&frdemo=invite&mpuid=' + VPU)) return false;
  const up = await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room
    && s.room.status === 'waiting' && s.room.private === true && s.room.mode === 'turns' })()`, 45000);
  if (up) codes.add(await A.ev(`game.scene.getScene('vsbattle').code`));
  await A.park();
  return up;
})());

/* ---------- 7. the es dress ---------- */
console.log('— THE ES DRESS —');
await A.seed(BOOT('x2', null));
ok('es boot', await A.nav(BASE + '?mpuid=' + VPU + '&fps=0&lang=es') && await A.until(READY, 60000) && await toMenu(A) && await openSheet(A));
stx = await sheetTexts(A);
ok('the sheet speaks Spanish', stx.includes('— AMIGOS —') && stx.includes('— RIVALES RECIENTES —') && stx.includes('✶ INVITAR A UN NUEVO AMIGO'),
  stx.join(' | ').slice(0, 160));

ok('no page exceptions', errs.length === 0, errs.join(' || ').slice(0, 300));

/* ---------- cleanup ---------- */
await Promise.all([A.park(), B.park()]);
for (const c of codes) toDelete.add('mp/rooms/' + c);
for (const p of toDelete) await rtDel(p);
let left = 0; const leftNames = [];
for (const p of toDelete) if ((await rt(p)) !== null) { left++; leftNames.push(p); }
ok('cleanup: everything this run wrote is gone', left === 0, leftNames.join(','));
console.log(pass + '/' + (pass + fail) + ' passed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
