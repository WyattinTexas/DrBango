// WORLDWIDE-CHECK — CHALLENGE WORLDWIDE always finds a rival (v0.121.0,
// Skylar 10/9: "when you click challenge worldwide nothing happens it just
// says 'consulting the stars..' … After 5-7 seconds if no real players are
// in queue it should queue you against the computer").
//
// The stall he saw: a page in 'firebase' mode whose socket had died under it
// (a phone that slept, a network that changed hands) queues every RTDB read
// until the sky returns — vsQuickMatch's rooms read never settled, and the
// note was the last thing on screen. This suite boots ONE phone-shaped
// headless Chrome (390×844 DPR 3, iPhone UA) per scenario against the folder
// served on :8899 and the testroom sky for real, taps the door by a real CDP
// tap, and reads the theater off the scene on a WALL clock:
//
//   live     the sky reachable, nobody else searching → theater at the tap,
//            the quiet sky seats a mage ON-DEVICE, OPPONENT FOUND on the
//            rolled beat (T in [5s, 7s]), the live room gone from the sky
//   dead     the socket cut AFTER boot (the SDK says so: .info/connected
//            false) → no sky asked; the near answer at the tap itself
//   silent   the socket cut but the SDK still says connected (reads hang) →
//            the hunt is bounded (HUNT_MS); the near answer stands in
//   slow     every request held 2.5s → bounded reads, still on the beat
//   deadhost a public queue room whose host will never light it (fabricated
//            by REST) → the joiner's HOST BELT gives the seat back and the
//            near sky answers
//
// Every scenario: the note is never the last thing, OPPONENT FOUND lands
// never early and inside the window's slack, the duel reaches 'pick', zero
// page exceptions. Rooms this suite makes are deleted after.
//
//   node tools/worldwide-check.mjs            # all five, ~4 min
//   node tools/worldwide-check.mjs live dead  # a subset
//
import { spawn, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SRV = 8899, PORT = 9499, DIR = '/tmp/cdp-wwc';
const BASE = 'http://localhost:' + SRV + '/index.html';
const DB = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x != null ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const want = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const SCENARIOS = ['live', 'dead', 'silent', 'slow', 'deadhost'];
const todo = want.length ? SCENARIOS.filter((s) => want.includes(s)) : SCENARIOS;

/* ---------- §0 the source pins ---------- */
const vsSrc = readFileSync('versus.js', 'utf8');
const VS_FB = (() => { const m = vsSrc.match(/const VS_FB = (\{[\s\S]*?\});/); return m ? Function('return ' + m[1])() : null; })();
ok('the window is 5–7s and every sky read on the path is bounded (VS_FB)', !!VS_FB && VS_FB.T_MIN === 5000 && VS_FB.T_SPREAD === 2000
  && VS_FB.HUNT_MS > 0 && VS_FB.LOOK_MS > 0 && VS_FB.SHUT_MS > 0 && VS_FB.HOST_BELT_MS > 0 && VS_FB.SETUP_MS >= VS_FB.LOOK_MS + VS_FB.SHUT_MS, JSON.stringify(VS_FB));
ok('the menu answers from the door, the beat keeps wall time, the belt stands',
  /function vsNearSearch/.test(vsSrc) && /function vsWithin/.test(vsSrc) && /function vsSkyUp/.test(vsSrc) && /function vsUnseat/.test(vsSrc)
  && /wallAfter\(/.test(vsSrc) && /hostBelt\(\)/.test(vsSrc) && /this\.quietSky\(\);\s*\/\/ the beat's alarm/.test(vsSrc));
ok('the sky speaks its socket (net.js) and the mage\'s claim is bounded (rival.js)',
  /\.info\/connected/.test(readFileSync('net.js', 'utf8')) && /get connected\(\)/.test(readFileSync('net.js', 'utf8'))
  && /CLAIM_MS/.test(readFileSync('rival.js', 'utf8')) && /SSNET\.connected !== false/.test(readFileSync('rival.js', 'utf8')));
ok('the computer\'s reply pace is untouched (BOT_PACE 90–300s, thinkMs)', /BOT_PACE/.test(readFileSync('rival.js', 'utf8')) && /function thinkMs/.test(readFileSync('rival.js', 'utf8'))
  && /MIN: 90000|90 \* 1000|90000/.test(readFileSync('rival.js', 'utf8')));

/* ---------- server ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
const made = new Set();   // live rooms to delete after
async function rest(path, method, body) { try { const r = await fetch(DB + path + '.json', { method, body: body == null ? undefined : JSON.stringify(body) }); return method === 'GET' ? r.json() : r.status; } catch (e) { return null; } }

/* ---------- one phone-shaped Chrome per scenario ---------- */
async function boot(tag) {
  try { execSync('rm -rf ' + DIR); } catch (e) { }
  const kid = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + DIR, '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' });
  let list = null;
  for (let i = 0; i < 60 && !list; i++) { try { list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); } catch (e) { await sleep(500); } }
  if (!list) { console.log('no Chrome on :' + PORT); process.exit(2); }
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  let id = 0; const pend = new Map(); const errs = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200);
      if (!/WebGL context/.test(t)) errs.push(t);
    }
  };
  await new Promise((r) => ws.onopen = r);
  const send = (m, p) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setUserAgentOverride', { userAgent: UA });
  const ev = async (e) => {
    const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
    return r?.result?.value;
  };
  const until = async (e, cap = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < cap) { try { if (await ev(e)) return true; } catch (err) { } await sleep(200); } return false; };
  const tap = async (expr) => {
    const p = JSON.parse(await ev(`(() => { const o = ${expr}; if (!o) return 'null'; const cam = o.scene.cameras.main, b = o.getBounds();
      const D = game.scale.width / innerWidth;
      return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
    if (!p) throw new Error('tap target missing: ' + expr);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  };
  const uid = 'test_wwc' + tag;
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `navigator.share = undefined;
    try { sessionStorage.setItem('beta3.skipIntro', '1'); localStorage.clear(); localStorage.setItem('starspellUid', '${uid}'); localStorage.setItem('starspellName', 'Wisp ${tag.toUpperCase()}'); } catch (e) {}` });
  const close = () => { try { ws.close(); } catch (e) { } try { kid.kill('SIGKILL'); } catch (e) { } };
  return { ev, until, tap, send, errs, uid, close };
}

/* ---------- the scenario ---------- */
const READY = `typeof SSNET !== 'undefined' && SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').dailyChipB`;
const MENU = `game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').chWorldB`;
const STATE = `(() => { const m = game.scene.getScene('vsmenu'), b = game.scene.getScene('vsbattle'), on = game.scene.isActive('vsbattle');
  return JSON.stringify({ menu: game.scene.isActive('vsmenu'), note: m && m.noteT && m.noteT.active ? m.noteT.text : '', on,
    state: on ? b.state : '', near: on ? !!b.near : null, revealed: on ? !!b.revealed : null, code: on ? b.code : '',
    T: on && b.theater ? b.theater.T : 0, t0: on && b.theater ? b.theater.t0 : 0,
    search: on && b.searchT && b.searchT.active ? b.searchT.text : '', clock: on && b.searchClockT && b.searchClockT.active ? b.searchClockT.text : '',
    room: on && b.room ? b.room.status + '/' + Object.keys(b.room.players || {}).length : '', host: on && b.room ? b.room.hostUid : '' }) })()`;
const read = async (c) => JSON.parse(await c.ev(STATE));

async function scenario(name) {
  console.log('— ' + name.toUpperCase() + ' —');
  const c = await boot(name);
  try {
    await c.send('Page.navigate', { url: BASE + '?mpuid=' + c.uid.slice(5) + '&fps=0&lang=en' });
    ok(name + ': the page boots online', await c.until(READY, 60000));
    await c.ev(`game.scene.getScene('home').scene.start('vsmenu'); 1`);
    ok(name + ': the dueling ground stands with the world door', await c.until(MENU, 20000));
    await c.until(`SSNET.connected === true`, 8000);
    await sleep(600);
    let deadCode = null;
    if (name === 'dead' || name === 'silent') {
      await c.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
      if (name === 'dead') ok('dead: the sky calls the socket dead (.info/connected false)', await c.until(`SSNET.connected === false`, 6000));
      else {
        await c.until(`SSNET.connected === false`, 6000);
        await c.ev(`Object.defineProperty(SSNET, 'connected', { get: () => true, configurable: true }); 1`);   // the silent death
        ok('silent: the SDK still says connected while every read will hang', await c.ev(`SSNET.connected === true`));
      }
      await sleep(500);
    }
    if (name === 'slow') await c.send('Network.emulateNetworkConditions', { offline: false, latency: 2500, downloadThroughput: 40000, uploadThroughput: 40000 });
    if (name === 'deadhost') {
      deadCode = 'DH' + Math.random().toString(36).slice(2, 4).toUpperCase().replace(/[^A-Z]/g, 'K');
      const now = Date.now();
      const rec = { mode: 'turns', status: 'waiting', createdAt: now - 1500, hostUid: 'test_wwcdeadhost0', seed: 12345, lang: 'en', private: false, seekAt: now - 1500,
        corr: 1, hp: 150, turnCasts: 0, movedAt: now - 1500,
        players: { test_wwcdeadhost0: { name: 'Dead Host', hp: 150, seat: 0, casts: 0, dealt: 0, gone: false, joinedAt: now - 1500, rating: 1000, rhide: 0 } } };
      ok('deadhost: a public queue room with a host who will never light it stands in the sky', (await rest('mp/rooms/' + deadCode, 'PUT', rec)) === 200, deadCode);
      made.add(deadCode);
    }
    await c.tap(`game.scene.getScene('vsmenu').chWorldB`);
    const tapAt = Date.now();
    // the hunt: the theater must rise — at once with the sky, inside HUNT_MS + a breath without it
    const cap = (name === 'silent' ? VS_FB.HUNT_MS : 0) + 3500;
    const up = await c.until(`game.scene.isActive('vsbattle') && !!game.scene.getScene('vsbattle').theater`, cap + 2000);
    const upAt = Date.now() - tapAt;
    ok(name + ': the searching theater rises after the tap (never the note alone)', up && upAt <= cap, (upAt / 1000).toFixed(1) + 's ≤ ' + (cap / 1000).toFixed(1) + 's');
    let s = await read(c);
    ok(name + ': the beat is rolled inside [5s, 7s]', s.T >= 5000 && s.T <= 7000, (s.T / 1000).toFixed(1) + 's');
    ok(name + ': the note is gone, SEARCHING stands with its clock', !s.note && s.search === await c.ev(`SS_T('vsSearching')`) && /^\d+:\d\d$/.test(s.clock), s.note || s.search);
    if (name === 'live' || name === 'slow') { ok(name + ': the hunt sealed a LIVE queue room first (humans first)', s.near === false && /^waiting\/1$/.test(s.room) || s.room === '', s.room + ' near=' + s.near); if (s.code) made.add(s.code); }
    if (name === 'dead' || name === 'silent') ok(name + ': the answer is NEAR from the door — no live room was waited on', s.near === true, 'near=' + s.near);
    if (name === 'deadhost') { ok('deadhost: the seat was taken in the dead host\'s room', await c.until(`(() => { const b = game.scene.getScene('vsbattle'); return b.room && b.room.hostUid === 'test_wwcdeadhost0' && Object.keys(b.room.players || {}).length === 2 })()`, 8000)); }
    // OPPONENT FOUND — on the beat, never early; the slack is the window's own
    const slack = name === 'deadhost' ? VS_FB.HOST_BELT_MS + 7000 : (name === 'slow' ? 4000 : 1500);
    let foundAt = 0;
    while (Date.now() - tapAt < s.T + slack + 1500) {
      if (await c.ev(`(() => { const b = game.scene.getScene('vsbattle'); return !!(b.searchT && b.searchT.active && b.searchT.text === SS_T('vsFound')) })()`)) { foundAt = Date.now(); break; }
      await sleep(120);
    }
    const beat = foundAt ? (foundAt - s.t0) / 1000 : -1;
    ok(name + ': OPPONENT FOUND lands on the rolled beat — never early, inside the slack', foundAt > 0 && foundAt >= s.t0 + s.T - 600 && foundAt <= s.t0 + s.T + slack,
      beat.toFixed(1) + 's of ' + (s.T / 1000).toFixed(1) + 's rolled (slack ' + (slack / 1000) + 's)');
    ok(name + ': …then straight into the duel', await c.until(`(() => { const b = game.scene.getScene('vsbattle'); return b.state === 'pick' && b.room && b.room.status === 'active' })()`, 20000));
    s = await read(c);
    ok(name + ': the rival is seated on THIS device under a minted name, rated', s.near === true && await c.ev(`(() => { const b = game.scene.getScene('vsbattle');
      const e = Object.entries(b.room.players).find(([id]) => id !== SSNET.uid()); return !!e && /^u[a-z0-9]{8,}$/.test(e[0]) && /^[A-Z][a-z]+ [A-Z][a-z]+( \\d+)?$/.test(e[1].name) && Number.isFinite(e[1].rating) })()`), s.code);
    if (name === 'live') ok('live: the live room left the sky (the door shut by transaction)', await (async () => { for (let i = 0; i < 20; i++) { if ((await rest('mp/rooms/' + s.code, 'GET')) === null) return true; await sleep(300); } return false; })(), s.code);
    if (name === 'deadhost') {
      const room = await rest('mp/rooms/' + deadCode, 'GET');
      ok('deadhost: my seat went back to the sky (vsUnseat) — the dead host stands alone again', !!room && !(room.players || {})[c.uid] && Object.keys(room.players || {}).length === 1, JSON.stringify(Object.keys((room || {}).players || {})));
      ok('deadhost: the near duel wears a fresh code, not the dead room\'s', s.code !== deadCode, s.code);
    }
    ok(name + ': the player is never told — no bot/computer word on the found screen or in the duel', await c.ev(`(() => { const b = game.scene.getScene('vsbattle');
      const walk = (list, out) => { for (const o of list) { if (o.text != null) out.push(String(o.text)); if (o.list) walk(o.list, out); } return out; };
      return !walk(b.children.list, []).some((t) => /\\b(bot|computer|circle|cpu|machine|offline)\\b/i.test(t)) })()`));
    ok(name + ': zero page exceptions', c.errs.length === 0, c.errs.join(' | ').slice(0, 200));
    // tidy: the near duel leaves the device whole
    await c.ev(`try { if (game.scene.isActive('vsbattle')) { const b = game.scene.getScene('vsbattle'); if (SS_RIVAL.stopFor) SS_RIVAL.stopFor(b.code); SS_NEAR.purge(b.code); } } catch (e) {} 1`).catch(() => { });
    if (name === 'dead' || name === 'silent' || name === 'slow') await c.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await sleep(400);
  } catch (e) { ok(name + ': the scenario ran to its end', false, String(e && e.message || e).slice(0, 160)); }
  c.close();
  await sleep(800);
}

for (const name of todo) await scenario(name);

/* ---------- tidy the sky ---------- */
const rooms = (await rest('mp/rooms', 'GET')) || {};
for (const [k, r] of Object.entries(rooms)) if (made.has(k) || /^test_wwc/.test((r && r.hostUid) || '') || (r && r.players && Object.keys(r.players).every((id) => /^test_wwc/.test(id)))) await rest('mp/rooms/' + k, 'DELETE');
for (const k of kids) { try { k.kill('SIGKILL'); } catch (e) { } }
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
