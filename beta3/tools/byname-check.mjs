// BYNAME-CHECK — challenge by name (v0.54.0, task 43).
// Two REAL throwaway uids (test_ identities never enter the registry) in two
// headless Chromes. A opens VERSUS, taps BY NAME with a REAL tap, types B's
// name sloppily (case, spacing) into the floating input and presses Enter;
// the registry resolves it, the summons rings through invites/<B>/<A>, B's
// banner appears and a real tap on ACCEPT starts the duel. Then the honest
// miss (what was typed comes back in the field), your own name (a gentle
// no), and the offline path: B is closed, the bell lands and survives, the
// lobby says the summons waits under their stars, the two-minute re-ring
// keeps it fresh, and B arriving later finds and answers it. The crisp
// sentinel is read after the input flows. Everything written is deleted.
//
//   python3 -m http.server 8899 &
//   for p in a:9450 b:9451; do "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --no-sandbox --mute-audio --disable-gpu --remote-debugging-port=${p#*:} \
//     --user-data-dir=/tmp/cdp-byname-${p%%:*} --window-size=390,844 --force-device-scale-factor=3 about:blank & done
//   node tools/byname-check.mjs
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
  const seedIds = [];
  const seed = async (src) => { const r = await send('Page.addScriptToEvaluateOnNewDocument', { source: src }); seedIds.push(r.identifier); };
  // navigate and PROVE a NEW document is ours before waiting on the game: the
  // old document is marked first, so a reload of index.html is not mistaken
  // for itself, and a second navigate is only fired when the first was
  // dropped (a navigate that lands while about:blank settles can be) — never
  // on top of a load in progress, which aborts game.js and leaves versus.js
  // to throw on the QS it never got
  const nav = async (u) => {
    await ev(`window.__navMark = 1; 1`).catch(() => { });
    for (let i = 0; i < 4; i++) {
      const r = await send('Page.navigate', { url: u });
      if (r && r.errorText) console.log('  nav ' + tag + ': ' + r.errorText);
      for (let j = 0; j < 24; j++) {
        await sleep(250);
        const st = await ev(`(window.__navMark ? 'old' : (location.href.includes('index.html') && typeof SSNET !== 'undefined' ? 'new' : 'loading'))`).catch(() => 'loading');
        if (st === 'new') return true;
        if (st === 'loading') j = Math.min(j, 12);   // a fresh document is under way — keep waiting, never re-fire
      }
    }
    return false;
  };
  const park = async () => { await send('Page.navigate', { url: 'about:blank' }); await sleep(600); };
  const until = async (e, cap = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < cap) { try { if (await ev(e)) return true; } catch (err) { } await sleep(300); } return false; };
  // a REAL tap: press + release at the object's bounds centre, camera-corrected
  const tap = async (expr) => {
    const p = JSON.parse(await ev(`(() => { const o = ${expr}; if (!o) return 'null'; const cam = o.scene.cameras.main, b = o.getBounds();
      const D = game.scale.width / innerWidth;
      return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
    if (!p) throw new Error('tap target missing: ' + expr);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  };
  // real typing into whatever is focused, then a real key
  const type = (text) => send('Input.insertText', { text });
  const key = async (k, code) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: code === 'Enter' ? 13 : 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: code === 'Enter' ? 13 : 27 });
  };
  return { ev, seed, nav, park, until, tap, type, key, tag };
}
const [A, B] = await Promise.all([client(9450, 'A'), client(9451, 'B')]);
const UA = 'u' + rnd() + 'bna', UB = 'u' + rnd() + 'bnb';
const NA = 'Seeker ' + rnd().toUpperCase(), NB = 'Target ' + rnd().toUpperCase();
const toDelete = new Set(['players/' + UA, 'players/' + UB, 'devices/' + UA, 'devices/' + UB, 'presence/' + UA, 'presence/' + UB,
  'invites/' + UA, 'invites/' + UB, 'recent/' + UA, 'recent/' + UB, 'friends/' + UA, 'friends/' + UB]);
const BOOT = (uid, name) => `navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); if (localStorage.getItem('bn.seeded') !== '${uid}') { localStorage.clear(); localStorage.setItem('bn.seeded', '${uid}');
    localStorage.setItem('starspellUid', '${uid}'); localStorage.setItem('starspellName', ${JSON.stringify(name)}); localStorage.setItem('beta3.vsmode', 'turns'); } } catch (e) {}`;
const READY = `SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').lanternB`;
const ensured = (c) => c.until(`(async () => { await SSNET.ensureName(); return true })()`, 30000);
const MENU = `game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').nameB`;
const toMenu = async (c) => { await c.ev(`game.scene.getScene('home').scene.start('vsmenu'); 1`); const r = await c.until(MENU, 20000); await sleep(500); return r; };
const INPUT = `!!document.getElementById('ss-overlay-input') && document.activeElement === document.getElementById('ss-overlay-input')`;
const tapByName = async (c) => { await c.tap(`game.scene.getScene('vsmenu').children.list.find(o => o.text === SS_T('vsByName'))`); return c.until(INPUT, 6000); };
const lobby = (c) => c.ev(`(() => { const s = game.scene.getScene('vsbattle'); if (!s || !s.scene.isActive() || !s.room) return null;
  return JSON.stringify({ code: s.code, status: s.room.status, ch: s.challenged, sub: s.lobbySub && s.lobbySub.text, players: Object.keys(s.room.players || {}) }) })()`).then((v) => v ? JSON.parse(v) : null);
const banner = (c) => c.ev(`(() => { const s = game.scene.getScene('summons'); return !!(s && s.bannerC && s.shown) ? JSON.stringify(s.shown) : null })()`).then((v) => v ? JSON.parse(v) : null);
const crisp = (c) => c.ev(`JSON.stringify({ ok: ssCrispMeasure().ok, heals: window.__ssdev.heals, crisp: window.__ssdev.last && window.__ssdev.last.crisp })`).then(JSON.parse);
// a navigate fired at a page parked on about:blank can be dropped (README):
// seed once, then navigate and wait for the meadow up to three times
const boot = async (c, uid, name) => {
  await c.seed(BOOT(uid, name));
  for (let i = 0; i < 3; i++) {
    if (await c.nav(BASE + '?diag=1') && await c.until(READY, 60000)) return true;
    console.log('  (' + c.tag + ' boot ' + (i + 1) + ' did not land — again) ' + await c.ev(`location.href + ' ' + typeof window.game + ' ' + (typeof SSNET === 'undefined' ? '-' : SSNET.mode)`).catch((e) => String(e)));
  }
  return false;
};
const codes = new Set();
// the banner settles in over 420ms; a tap during the entrance tween lands where
// the button WAS (the README rule: a touch fired the instant a surface appears
// is lost). Let it land, tap, and prove the acceptance took.
const acceptBanner = async (c) => {
  await sleep(900);
  for (let i = 0; i < 3; i++) {
    await c.tap(`game.scene.getScene('summons').bannerC.list.find(o => o.text === SS_T('smAccept'))`);
    if (await c.until(`game.scene.getScene('summons').accepting || game.scene.isActive('vsbattle')`, 3000)) return true;
    console.log('  (ACCEPT tap ' + (i + 1) + ' did not take — again)');
  }
  return false;
};

// ---- 0. two real mages under the sky, both in the registry ----
console.log('A=' + UA + ' "' + NA + '"   B=' + UB + ' "' + NB + '"');
const reach = await Promise.all([boot(A, UA, NA), boot(B, UB, NB)]);
ok('both clients reach the sky', reach.every(Boolean));
await Promise.all([ensured(A), ensured(B)]);
const kA = await A.ev(`SSNET.nameKey(${JSON.stringify(NA)})`), kB = await B.ev(`SSNET.nameKey(${JSON.stringify(NB)})`);
toDelete.add('names/' + kA); toDelete.add('names/' + kB);
ok('registry holds both names', (await rt('names/' + kA)) === UA && (await rt('names/' + kB)) === UB);
ok('SSNET.findByName folds case and spacing to the uid', await A.ev(`SSNET.findByName('  ' + ${JSON.stringify(NB.toLowerCase().replace(' ', '   '))} + ' ').then(r => r && r.uid === ${JSON.stringify(UB)} && r.name === ${JSON.stringify(NB)})`));
ok('SSNET.findByName misses honestly', await A.ev(`SSNET.findByName('Nobody Here ${rnd()}').then(r => r === null)`));
ok('A sees B online', await A.until(`SSNET.FR.isOnline(${JSON.stringify(UB)})`, 20000));
errs.length = 0;   // a dropped/aborted first navigate (nav above) leaves a half-loaded document's noise behind

// ---- 1. A challenges B by typed name (sloppy case), B accepts, the duel starts ----
ok('A opens VERSUS (BY NAME door built)', await toMenu(A));
ok('a real tap on BY NAME opens the input, focused', await tapByName(A));
ok('the input carries the mage-name placeholder', await A.ev(`document.getElementById('ss-overlay-input').placeholder === SS_T('vsNamePh')`));
const sloppy = '  ' + NB.split(' ')[0].toUpperCase().slice(0, 3) + NB.split(' ')[0].toLowerCase().slice(3) + '   ' + NB.split(' ')[1].toLowerCase() + ' ';
await A.type(sloppy); await A.key('Enter', 'Enter');
ok('A lands in a challenge lobby aimed at B', await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.challenged && s.challenged.id === ${JSON.stringify(UB)} })()`, 25000), sloppy);
let lb = await lobby(A); if (lb) codes.add(lb.code);
ok('lobby wears B\'s name as B wears it, and waits for an answer', lb && lb.ch.name === NB && !lb.ch.away && lb.sub === await A.ev(`SS_T('vsWaitAnswer', ${JSON.stringify(NB)})`), lb && lb.sub);
ok('the input is gone from the page', await A.ev(`!document.getElementById('ss-overlay-input')`));
let inv = await rt('invites/' + UB + '/' + UA);
ok('invites/<B>/<A> = {name, code, mode, at}', inv && inv.code === (lb && lb.code) && inv.mode === 'turns' && inv.name === NA && inv.at > 0, JSON.stringify(inv));
ok('B\'s summons banner rings with A\'s name', await B.until(`(() => { const s = game.scene.getScene('summons'); return !!(s && s.bannerC && s.shown && s.shown.from === ${JSON.stringify(UA)}) })()`, 20000));
await acceptBanner(B);
ok('B joins and the duel starts on both sides', await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.room && s.room.status === 'active' })()`, 25000)
  && await B.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.room.status === 'active' })()`, 25000));
lb = await lobby(A);
ok('both seats are taken', lb && lb.players.includes(UA) && lb.players.includes(UB), lb && lb.players.join(','));
ok('the bell is answered (invite row gone)', await (async () => { for (let i = 0; i < 20; i++) { if ((await rt('invites/' + UB + '/' + UA)) === null) return true; await sleep(400); } return false; })());
const cr1 = await crisp(A);
ok('crisp sentinel green after the typed challenge', cr1.ok && cr1.heals === 0 && cr1.crisp !== false, JSON.stringify(cr1));

// ---- 2. the honest miss keeps what was typed; your own name is a gentle no ----
await Promise.all([A.nav(BASE + '?diag=1'), B.nav(BASE + '?diag=1')]);
ok('both back on the meadow', await A.until(READY, 60000) && await B.until(READY, 60000));
ok('A opens VERSUS again', await toMenu(A));
ok('BY NAME opens the input', await tapByName(A));
const nobody = 'Nobody Here ' + rnd().toUpperCase();
await A.type('  ' + nobody.toLowerCase() + '  '); await A.key('Enter', 'Enter');
ok('the miss is named honestly', await A.until(`game.scene.getScene('vsmenu').noteT.text === SS_T('vsNameNone', ${JSON.stringify(nobody.toLowerCase())})`, 15000), await A.ev(`game.scene.getScene('vsmenu').noteT.text`));
ok('the field comes back holding what was typed (retry)', await A.until(INPUT, 5000) && await A.ev(`document.getElementById('ss-overlay-input').value === ${JSON.stringify(nobody.toLowerCase())}`), await A.ev(`(document.getElementById('ss-overlay-input')||{}).value`));
ok('still on the versus menu, nothing sealed', await A.ev(`game.scene.isActive('vsmenu') && !game.scene.isActive('vsbattle') && !game.scene.getScene('vsmenu').busyC`));
await A.key('Escape', 'Escape');
ok('Escape closes the field without ringing anyone', await A.until(`!document.getElementById('ss-overlay-input')`, 4000) && (await rt('invites/' + UB)) === null);
ok('BY NAME reopens prefilled with the last try', await tapByName(A) && await A.ev(`document.getElementById('ss-overlay-input').value === ${JSON.stringify(nobody.toLowerCase())}`));
await A.type(' ' + NA.toUpperCase() + ' '); await A.key('Enter', 'Enter');   // the selection is replaced
ok('your own name is a gentle no', await A.until(`game.scene.getScene('vsmenu').noteT.text === SS_T('vsNameSelf')`, 10000), await A.ev(`game.scene.getScene('vsmenu').noteT.text`));
await sleep(800);
ok('own name: no lobby, no input, menu free', await A.ev(`game.scene.isActive('vsmenu') && !game.scene.isActive('vsbattle') && !document.getElementById('ss-overlay-input') && !game.scene.getScene('vsmenu').busyC`));

// ---- 3. offline: B is closed, the bell lands and stands, B arrives later and answers ----
// a parked headless tab keeps its socket for a minute or more (the server's
// onDisconnect fires late — recent-check found it) — leave the sky the way a
// phone losing signal does, through the client's own goOffline, then park
await B.ev(`firebase.database().goOffline(); 1`).catch(() => { });
await sleep(800);
await B.park();
ok('A sees B leave the sky', await A.until(`!SSNET.FR.isOnline(${JSON.stringify(UB)})`, 40000));
ok('BY NAME opens the input', await tapByName(A));
await A.type(NB.toLowerCase()); await A.key('Enter', 'Enter');
ok('A lands in a lobby aimed at the absent B', await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.challenged && s.challenged.id === ${JSON.stringify(UB)} })()`, 25000));
lb = await lobby(A); if (lb) codes.add(lb.code);
ok('the seeker is told the summons waits under their stars', lb && lb.ch.away && lb.sub === await A.ev(`SS_T('vsWaitAway', ${JSON.stringify(NB)})`), lb && lb.sub);
inv = await rt('invites/' + UB + '/' + UA);
ok('the invite row lands for the absent mage', inv && inv.code === lb.code && inv.name === NA, JSON.stringify(inv));
await sleep(6000);
const inv2 = await rt('invites/' + UB + '/' + UA);
ok('…and survives while the lobby stands', inv2 && inv2.code === lb.code && inv2.at === inv.at);
await A.ev(`game.scene.getScene('vsbattle').bellAt = Date.now() - 130000; 1`);
await sleep(2500);
const inv3 = await rt('invites/' + UB + '/' + UA);
ok('the standing lobby re-rings the bell (at refreshed, same seal)', inv3 && inv3.code === lb.code && inv3.at > inv.at, JSON.stringify(inv3));
ok('the room still waits, private, for B', (await rt('mp/rooms/' + lb.code + '/status')) === 'waiting' && (await rt('mp/rooms/' + lb.code + '/invited')) === UB);
ok('B returns to the sky', await boot(B, UB, NB));
ok('B finds the summons waiting under their stars', await B.until(`(() => { const s = game.scene.getScene('summons'); return !!(s && s.bannerC && s.shown && s.shown.from === ${JSON.stringify(UA)} && s.shown.code === ${JSON.stringify(lb.code)}) })()`, 30000));
await acceptBanner(B);
ok('B answers and the duel starts', await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.room && s.room.status === 'active' })()`, 25000)
  && await B.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.room.status === 'active' })()`, 25000));
const cr2 = await crisp(A);
ok('crisp sentinel still green', cr2.ok && cr2.heals === 0 && cr2.crisp !== false, JSON.stringify(cr2));

// ---- 4. the words exist in all 10 tongues and the door label fits ----
const langs = JSON.parse(await A.ev(`JSON.stringify(Object.keys(SS_STR))`));
for (const lang of langs) {
  const r = JSON.parse(await A.ev(`JSON.stringify((() => { const t = SS_STR['${lang}']; const K = ['vsOrReach','vsByName','vsNamePh','vsNameSeek','vsNameNone','vsNameSelf','vsWaitAway','vsWaitBusy'];
    return { miss: K.filter(k => !t[k]), pct: K.filter(k => /%1/.test('vsNameSeek vsNameNone vsWaitAway vsWaitBusy'.includes(k) ? t[k] : '%1')).length } })())`));
  ok(lang + ': all 8 strings present, %1 kept where a name goes', r.miss.length === 0 && r.pct === 8, JSON.stringify(r));
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
