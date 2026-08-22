// VS-MATCH — the rival queue, matched by rating (v0.48.0). THREE headless
// Chromes, each its own profile and rating, pressing FIND A RIVAL with real
// taps against the testroom RTDB (the local SSNET fallback refuses versus
// outright — "no sky" — so this one needs the network). Run from beta3/ with
// the folder served on :8899 and three Chromes on :9461/:9462/:9463:
//
//   python3 -m http.server 8899 &
//   for i in 1 2 3; do "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --no-sandbox --disable-gpu --mute-audio \
//     --remote-debugging-port=946$i --user-data-dir=/tmp/cdp-vsm$i \
//     --window-size=390,844 --force-device-scale-factor=3 about:blank & done
//   node tools/vs-match.mjs
//
// What it pins: the near rival is chosen over the far one; a lone searcher
// still meets anyone once the tolerance has opened (and a veiled rating
// queues by its true number); three simultaneous searchers never
// double-claim or orphan a room, over repeated runs; since v0.49.0 the one
// left alone is met by a circle mage ~12–16s in, and two far-apart searchers
// who both reach the 12s mark pair with EACH OTHER (the last look beats the
// rating gap — nobody gets a circle mage while a person waits). Every wait POLLS —
// three software-rendered tabs share one CPU and nothing here is quick.
const BASE = 'http://localhost:8899/index.html';
const DB = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/mp/rooms';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function client(port, tag) {
  const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
  let id = 0; const pend = new Map(); const errs = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200);
      if (!/WebGL context/.test(t)) errs.push(t);
    }
  };
  await new Promise(r => ws.onopen = r);
  const send = (m, p) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  const ev = async (e) => {
    const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
    return r?.result?.value;
  };
  const until = async (e, cap = 45000) => {
    for (let i = 0; i < cap / 500; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(500); }
    return false;
  };
  const tap = async (expr) => {
    const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
      const D = game.scale.width / innerWidth;
      return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  };
  const c = { tag, ws, send, ev, until, tap, errs, uid: 'test_' + tag };
  // boot with a given profile: the rating is seeded through localStorage on a
  // same-origin page BEFORE the game loads (SS.load reads it at boot)
  c.boot = async (prof) => {
    await send('Page.navigate', { url: 'http://localhost:8899/ascent.html' }); await sleep(800);
    await ev(`localStorage.clear(); localStorage.setItem('beta3.profile', JSON.stringify(${JSON.stringify(prof)})); 'ok'`);
    await send('Page.navigate', { url: BASE + '?fps=0&vsmode=turns&mpuid=' + tag }); await sleep(9000);
    await until(`!!window.game && game.scene.isActive('home') && !game.scene.getScene('home').introPlaying`, 60000);
    await ev(`game.scene.getScene('home').scene.start('vsmenu'); 'ok'`);
    await until(`game.scene.isActive('vsmenu') && SSNET.mode === 'firebase'`, 30000);
    await sleep(600);
  };
  // a REAL tap on FIND A RIVAL (the gold button under the label)
  c.find = async () => {
    await tap(`game.scene.getScene('vsmenu').children.list.find(o => o.text === SS_T('vsFind'))`);
  };
  c.room = () => ev(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room ? s.code : null; })()`);
  c.park = async () => { await send('Page.navigate', { url: 'about:blank' }); await sleep(500); };
  return c;
}

const rooms = async () => (await (await fetch(DB + '.json')).json()) || {};
const testRooms = async () => Object.fromEntries(Object.entries(await rooms()).filter(([, r]) => r && /^test_/.test(r.hostUid || '') || Object.keys((r && r.players) || {}).some(k => /^test_/.test(k))));
// sweep the test rooms, and the profile rows of any circle mage who sat in one
const sweep = async () => {
  const rs = await testRooms();
  for (const [id, r] of Object.entries(rs)) {
    for (const k of Object.keys((r && r.players) || {})) if (!/^test_/.test(k)) await fetch(DB.replace(/\/mp\/rooms$/, '') + '/players/' + k + '.json', { method: 'DELETE' });
    await fetch(DB + '/' + id + '.json', { method: 'DELETE' });
  }
};
const seatsOf = (rs, uid) => Object.entries(rs).filter(([, r]) => r && r.players && r.players[uid]).map(([id]) => id);
const poll = async (fn, cap) => { for (let i = 0; i < cap / 700; i++) { if (await fn()) return true; await sleep(700); } return false; };

const A = await client(9461, 'a'), B = await client(9462, 'b'), C = await client(9463, 'c');
await sweep();

// ---------------------------------------------------------------- laws (in-page, pure)
await A.boot({ rating: 1000 });
ok('the tolerance starts at ±75 and opens +75 per 3s of combined wait',
  await A.ev(`vsTolerance(0, 0) === 75 && vsTolerance(1500, 1400) === 75 && vsTolerance(3000, 0) === 150 && vsTolerance(6000, 6000) === 375`));
ok('vsPickRoom takes the closest host within tolerance and skips the far one', await A.ev(`(() => {
  const now = 1e12, mk = (host, rating, extra) => Object.assign({ mode: 'turns', status: 'waiting', createdAt: now - 1000, seekAt: now - 1000, hostUid: host, players: { [host]: { rating, seat: 0 } } }, extra || {});
  const rooms = { FARR: mk('u1', 1600), NEAR: mk('u2', 1050), GONE: mk('u3', 1000, { players: { u3: { rating: 1000, gone: true } } }), PRIV: mk('u4', 1000, { private: true }), TIME: mk('u5', 1000, { mode: 'timed' }) };
  const p = vsPickRoom(rooms, 'turns', now, now, null, null);
  return !!p && p.id === 'NEAR' && p.diff === 50;
})()`));
ok('the far host comes into reach once the combined wait has opened the tolerance', await A.ev(`(() => {
  const now = 1e12, far = { mode: 'turns', status: 'waiting', createdAt: now - 12000, seekAt: now - 12000, hostUid: 'u1', players: { u1: { rating: 1600, seat: 0 } } };
  const early = vsPickRoom({ FARR: far }, 'turns', now, now, null, null);
  const late = vsPickRoom({ FARR: far }, 'turns', now, now - 10000, null, null);
  return early === null && !!late && late.id === 'FARR';
})()`));
ok('a host only ever migrates into an OLDER room (the elder stays put)', await A.ev(`(() => {
  const now = 1e12, mk = (t, host) => ({ mode: 'turns', status: 'waiting', createdAt: t, seekAt: t, hostUid: host, players: { [host]: { rating: 1000, seat: 0 } } });
  const rooms = { OLDR: mk(now - 5000, 'u1'), YNGR: mk(now - 1000, 'u2') };
  const asMid = vsPickRoom(rooms, 'turns', now, now - 3000, { code: 'MINE', createdAt: now - 3000 }, null);
  const asEldest = vsPickRoom(rooms, 'turns', now, now - 9000, { code: 'MINE', createdAt: now - 9000 }, null);
  return !!asMid && asMid.id === 'OLDR' && asEldest === null;
})()`));

// ---------------------------------------------------------------- the near rival over the far one
console.log('-- near over far');
await B.boot({ rating: 1600 });
await C.boot({ rating: 1050 });
await A.find();
ok('A (1000) presses FIND and opens a room, seekAt stamped', await poll(async () => { const rs = await testRooms(); const s = seatsOf(rs, A.uid); return s.length === 1 && !!rs[s[0]].seekAt; }, 20000));
await B.find();
ok('B (1600) finds A too far (600 > 75) and opens a room of their own', await poll(async () => { const rs = await testRooms(); const s = seatsOf(rs, B.uid); return s.length === 1 && Object.keys(rs[s[0]].players).length === 1; }, 20000));
await C.find();
ok('C (1050) takes the seat in A\'s room, not B\'s', await poll(async () => {
  const rs = await testRooms(); const a = seatsOf(rs, A.uid), c = seatsOf(rs, C.uid);
  return a.length === 1 && c.length === 1 && a[0] === c[0] && Object.keys(rs[a[0]].players).length === 2;
}, 20000));
{
  const rs = await testRooms(); const b = seatsOf(rs, B.uid);
  ok('B is still alone in their own room', b.length === 1 && Object.keys(rs[b[0]].players).length === 1);
  ok('A\'s room rose into the duel', await poll(async () => { const rs = await testRooms(); const a = seatsOf(rs, A.uid); return a.length === 1 && rs[a[0]].status === 'active'; }, 30000));
  ok('the searching screen is the lobby as before — B\'s tab sits in vsbattle waiting', await B.ev(`game.scene.isActive('vsbattle') && game.scene.getScene('vsbattle').room.status === 'waiting'`));
}
await A.park(); await B.park(); await C.park(); await sweep();

// ---------------------------------------------------------------- the lone searcher, and the veil
console.log('-- lone searcher widens');
await A.boot({ rating: 1000 });
await B.boot({ rating: 1600, rhide: true });
await A.find();
ok('A opens a room', await poll(async () => seatsOf(await testRooms(), A.uid).length === 1, 20000));
const aRoom = seatsOf(await testRooms(), A.uid)[0];
await B.find();
ok('B (1600, veiled) opens a room of their own', await poll(async () => { const rs = await testRooms(); const s = seatsOf(rs, B.uid); return s.length === 1 && s[0] !== aRoom; }, 20000));
{
  const rs = await testRooms(); const b = seatsOf(rs, B.uid)[0];
  ok('the veiled seat still queues by its true number (rating 1600, rhide 1)', rs[b].players[B.uid].rating === 1600 && rs[b].players[B.uid].rhide === 1);
}
const t0 = Date.now();
ok('as the tolerance opens, B (the younger room) migrates into A\'s room', await poll(async () => {
  const rs = await testRooms(); const b = seatsOf(rs, B.uid);
  return b.length === 1 && b[0] === aRoom && Object.keys(rs[aRoom].players).length === 2;
}, 60000), 'after ' + Math.round((Date.now() - t0) / 1000) + 's');
{
  const rs = await testRooms();
  ok('B\'s own room is gone — no orphan left behind', Object.keys(rs).filter((id) => id !== aRoom && rs[id].hostUid === B.uid).length === 0);
  ok('B\'s tab now stands in A\'s room', await poll(async () => (await B.room()) === aRoom, 15000));
  ok('the duel rises', await poll(async () => ((await testRooms())[aRoom] || {}).status === 'active', 30000));
}
await A.park(); await B.park(); await sweep();

// ---------------------------------------------------------------- no double-claims, three at once, thrice
console.log('-- three at once, repeated');
for (let run = 1; run <= 3; run++) {
  await A.boot({ rating: 1000 }); await B.boot({ rating: 1020 }); await C.boot({ rating: 980 });
  await Promise.all([A.find(), B.find(), C.find()]);
  const settled = await poll(async () => {
    const rs = await testRooms();
    const sizes = Object.values(rs).map((r) => Object.keys(r.players || {}).length).sort();
    return sizes.join(',') === '1,2' && [A, B, C].every((c) => seatsOf(rs, c.uid).length === 1);
  }, 10000);
  let rs = await testRooms();
  const sizes = Object.values(rs).map((r) => Object.keys(r.players || {}).length).sort().join(',');
  ok('run ' + run + ': one pair and one lone searcher, every uid seated exactly once', settled, 'rooms ' + sizes);
  ok('run ' + run + ': no room holds more than two, none is orphaned (every room has its host seated)',
    Object.values(rs).every((r) => Object.keys(r.players || {}).length <= 2 && !!(r.players || {})[r.hostUid]));
  // the quiet sky: the one left alone is met by a circle mage, never by a test uid
  const metAt = Date.now();
  const met = await poll(async () => { rs = await testRooms(); return Object.values(rs).every((r) => Object.keys(r.players || {}).length === 2); }, 22000);
  const lone = Object.values(rs).find((r) => Object.keys(r.players || {}).some((k) => !/^test_/.test(k)));
  const guest = lone && Object.keys(lone.players).find((k) => !/^test_/.test(k));
  ok('run ' + run + ': the lone searcher was met by one of the circle (uid cut like a device uid)', met && !!guest && /^u[a-z0-9]{8,}$/.test(guest), guest + ' after ' + Math.round((Date.now() - metAt) / 1000) + 's');
  ok('run ' + run + ': exactly one such seat across the sky', Object.values(rs).reduce((n, r) => n + Object.keys(r.players || {}).filter((k) => !/^test_/.test(k)).length, 0) === 1);
  await A.park(); await B.park(); await C.park(); await sweep();
}

// ---------------------------------------------------------------- two reach the 12s mark together, far apart
console.log('-- two at 12s, 700 apart: each other, never the circle');
await A.boot({ rating: 1000 }); await B.boot({ rating: 1700 });
await Promise.all([A.find(), B.find()]);
ok('A (1000) and B (1700) each open a room — 700 apart is beyond any early tolerance', await poll(async () => { const rs = await testRooms(); return seatsOf(rs, A.uid).length === 1 && seatsOf(rs, B.uid).length === 1 && seatsOf(rs, A.uid)[0] !== seatsOf(rs, B.uid)[0]; }, 15000));
{
  const t0 = Date.now();
  const paired = await poll(async () => { const rs = await testRooms(); const a = seatsOf(rs, A.uid), b = seatsOf(rs, B.uid); return a.length === 1 && b.length === 1 && a[0] === b[0]; }, 30000);
  const rs = await testRooms();
  ok('at the 12s mark the younger crossed the gap into the elder: A and B share a room', paired, 'after ' + Math.round((Date.now() - t0) / 1000) + 's');
  ok('no circle mage anywhere — only the two of them', Object.values(rs).every((r) => Object.keys(r.players || {}).every((k) => /^test_/.test(k))) && Object.keys(rs).length === 1, Object.keys(rs).length + ' rooms');
  ok('the duel rises', await poll(async () => Object.values(await testRooms()).some((r) => r.status === 'active'), 20000));
}
await A.park(); await B.park(); await sweep();

const errs = [...A.errs, ...B.errs, ...C.errs];
ok('no page exceptions across the three tabs', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log('\n' + pass + ' passed, ' + fail + ' failed');
A.ws.close(); B.ws.close(); C.ws.close();
process.exit(fail ? 1 : 0);
