// RIVAL-CHECK — the rival engine (v0.49.0). One headless Chrome on :9470
// (/tmp/cdp-rival, --disable-gpu, --mute-audio, DPR 3), the folder served on
// :8899 (started here if nothing answers), the testroom RTDB for real (the
// local SSNET fallback refuses versus). Run from beta3/:
//
//   node tools/rival-check.mjs            # everything, ~8 minutes
//   node tools/rival-check.mjs brain      # the sim + pacing pins only (seconds)
//   node tools/rival-check.mjs play       # just the duel the harness taps out itself
//   node tools/rival-check.mjs queue      # the quiet sky: the 12-second rival (v0.49.0)
//
// What it pins:
//   BRAIN  — mean damage per cast over 60 seeded boards climbs 800 < 1200 < 1600;
//            every think time in [1.6s, mode cap], jittered (CV > 0.15), the
//            opening hesitation ≥ 2.2s
//   DUELS  — ?botduel=R&vsdemo=1 at 800/1200/1600 plays to `done`, the demo's
//            rematch is answered and played to `done` again; the rival's seat
//            carries only a person's fields; every cast came ≥ 1.5s after the
//            turn arrived and never past the stall limit; no page exceptions,
//            no engine errors; the seat's rating sits near the target
//   TIMED  — one 1200 duel in timed mode to completion, same pacing pins
//   FORFEIT— the human walks out of a live duel (a real tap on ‹): the rival
//            settles the room `done` with itself the winner, no stall
//   PLAY   — the harness is the human: real taps on tiles and CAST, sigil cards
//            by tap, to completion; the rival's transcript printed for a read
//   QUEUE  — ?vsdemo=1 presses FIND A RIVAL alone: one of the circle arrives
//            11–17s after seekAt with a seat cut like a person's, rated 40–90
//            off the player's; a forced WIN then (rematch) a forced LOSS both
//            move the player's rating (+ then −); the persona's profile row
//            carries only SS.sync's fields and grows with the duel; no persona
//            on any board or in presence; no bot/ai word in the room, the row,
//            the on-screen text or the console; the spread over 20 draws
import { spawn } from 'node:child_process';

const PORT = 9470, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const DB = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/mp/rooms';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ONLY = process.argv[2] || 'all';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) * (x - m)))); };

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-rival', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
let list = null;
for (let i = 0; i < 60 && !list; i++) { try { list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); } catch (e) { await sleep(500); } }
if (!list) { console.log('no Chrome on :' + PORT); process.exit(2); }
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); const errs = []; const logs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.consoleAPICalled') logs.push((d.params.args || []).map((a) => a.value != null ? String(a.value) : (a.description || '')).join(' '));
  if (d.method === 'Runtime.exceptionThrown') {
    const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200);
    if (!/WebGL context/.test(t)) errs.push(t);
  }
};
await new Promise((r) => ws.onopen = r);
const send = (m, p) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const ev = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r?.result?.value;
};
const until = async (e, cap = 45000, step = 500) => {
  for (let i = 0; i < cap / step; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(step); }
  return false;
};
// a REAL press+release on a game object (expr evaluates to it in the page)
const tap = async (expr) => {
  const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await sleep(40);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(70);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
const VS = `game.scene.getScene('vsbattle')`;
const room = async (code) => (await (await fetch(DB + '/' + code + '.json')).json()) || null;
async function cleanRooms() {
  const all = (await (await fetch(DB + '.json')).json()) || {};
  for (const [k, r] of Object.entries(all)) {
    if (r && (/^test_rc/.test(r.hostUid || '') || Object.keys(r.players || {}).some((p) => /^test_rc/.test(p)))) await fetch(DB + '/' + k + '.json', { method: 'DELETE' });
  }
}
async function boot(q) {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(600);
  await ev(`localStorage.clear(); localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0&mpuid=rc&' + q }); await sleep(4000);
  await until(`!!window.game && typeof SS_RIVAL !== 'undefined' && SSNET.mode === 'firebase'`, 60000);
}
const rlog = async () => JSON.parse(await ev(`JSON.stringify(window.__ssRivalLog || [])`));
function paceChecks(tag, log, cap) {
  // each cast/scry follows its own 'think' entry: wall time between them is
  // the pause the human saw; the think's ms is what the engine meant
  let last = null; const gaps = [];
  for (const e of log) {
    if (e.ev === 'think') last = e;
    else if ((e.ev === 'cast' || e.ev === 'scry') && last) { gaps.push({ ms: e.t - last.t, meant: last.ms, first: last.first }); last = null; }
  }
  ok(tag + ' casts were thought about', gaps.length > 0, gaps.length + ' moves');
  ok(tag + ' no move under 1.5s', gaps.every((g) => g.ms >= 1500 && g.meant >= 1600), gaps.map((g) => g.ms).join(','));
  ok(tag + ' no stall past the limit', gaps.every((g) => g.meant <= cap + 3000 && g.ms <= cap + 9000), 'cap ' + cap);
  const firsts = gaps.filter((g) => g.first);
  ok(tag + ' opening hesitation ≥ 2.2s', firsts.every((g) => g.meant >= 2200), firsts.map((g) => g.meant).join(','));
  if (gaps.length >= 4) ok(tag + ' not metronomic', sd(gaps.map((g) => g.meant)) / mean(gaps.map((g) => g.meant)) > 0.08, 'cv ' + (sd(gaps.map((g) => g.meant)) / mean(gaps.map((g) => g.meant))).toFixed(2));
  ok(tag + ' no engine errors', !log.some((e) => e.ev === 'error'), log.filter((e) => e.ev === 'error').map((e) => e.msg).join(' | '));
  return gaps;
}
function seatChecks(tag, r, uid) {
  const seat = r && r.players && r.players[uid];
  ok(tag + ' rival seated in the room', !!seat);
  if (!seat) return;
  const PERSON = ['name', 'hp', 'seat', 'casts', 'dealt', 'gone', 'joinedAt', 'rating', 'rhide', 'lastWord', 'sigils'];
  const extra = Object.keys(seat).filter((k) => !PERSON.includes(k));
  ok(tag + " seat carries only a person's fields", extra.length === 0, extra.join(','));
  ok(tag + ' uid cut like a device uid', /^u[a-z0-9]{8,}$/.test(uid) && !/test_/.test(uid), uid);
  ok(tag + ' name cut like a generated name', /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(seat.name), seat.name);
  const casts = Object.values(r.casts || {}).filter((c) => c.uid === uid);
  const CAST = ['uid', 'name', 'word', 'dmg', 'target', 'at'];
  ok(tag + ' casts carry only a cast\'s fields', casts.every((c) => Object.keys(c).every((k) => CAST.includes(k))));
  ok(tag + ' casts counted on the seat', (seat.casts | 0) === casts.length, seat.casts + ' vs ' + casts.length);
  ok(tag + ' dealt = sum of casts', (seat.dealt | 0) === casts.reduce((a, c) => a + c.dmg, 0));
  const flat = JSON.stringify(r).toLowerCase();
  ok(tag + ' nothing in the room says bot/ai/engine', !/bot|"ai"|engine|rival|skill|target"/.test(flat.replace(/"target":/g, '')));
  return casts;
}

/* ======================= BRAIN ======================= */
const live = {};
if (ONLY === 'all' || ONLY === 'brain') {
  console.log('BRAIN');
  await boot('');
  const seeds = Array.from({ length: 60 }, (_, i) => 1000003 * (i + 1));
  const sims = JSON.parse(await ev(`JSON.stringify([800, 1200, 1600].map(r => SS_RIVAL.sim(r, ${JSON.stringify(seeds)}, 6, 'turns')))`));
  for (const s of sims) console.log('    ' + s.rating + ': mean dmg ' + s.mean.toFixed(2) + ' · len ' + s.meanLen.toFixed(2) + ' · rank ' + s.meanRank.toFixed(2) + ' · scrys ' + s.scrys + '/' + s.turns);
  ok('mean damage climbs 800 < 1200 < 1600', sims[0].mean < sims[1].mean && sims[1].mean < sims[2].mean);
  ok('…by a margin worth feeling (≥ 15% per step)', sims[1].mean >= sims[0].mean * 1.15 && sims[2].mean >= sims[1].mean * 1.15);
  ok('word length climbs too', sims[0].meanLen < sims[1].meanLen && sims[1].meanLen < sims[2].meanLen);
  ok('the weak mage misses the best word more', sims[0].meanRank > sims[2].meanRank);
  const fine = JSON.parse(await ev(`JSON.stringify([600, 700, 900, 1000, 1100, 1300, 1400, 1500, 1750].map(r => SS_RIVAL.sim(r, ${JSON.stringify(seeds.slice(0, 30))}, 6, 'turns').mean))`));
  ok('every 100 points buys damage (9 ratings, non-decreasing)', fine.every((v, i) => i === 0 || v >= fine[i - 1] - 0.05), fine.map((v) => v.toFixed(1)).join(' '));
  for (const [mode, cap] of [['turns', 15000], ['timed', 11000]]) {
    for (const r of [800, 1200, 1600]) {
      const p = JSON.parse(await ev(`JSON.stringify(SS_RIVAL.paceSample(${r}, '${mode}', 3000, false))`));
      const f = JSON.parse(await ev(`JSON.stringify(SS_RIVAL.paceSample(${r}, '${mode}', 500, true))`));
      ok(mode + ' ' + r + ' thinks in [1.6s, ' + cap / 1000 + 's]', p.every((x) => x >= 1600 && x <= cap), 'min ' + Math.min(...p) + ' max ' + Math.max(...p) + ' mean ' + mean(p).toFixed(0));
      ok(mode + ' ' + r + ' jittered (cv > 0.15)', sd(p) / mean(p) > 0.15, (sd(p) / mean(p)).toFixed(2));
      ok(mode + ' ' + r + ' opening hesitation ≥ 2.2s', f.every((x) => x >= 2200), 'min ' + Math.min(...f));
    }
  }
  const tempo = JSON.parse(await ev(`JSON.stringify([800, 1600].map(r => SS_RIVAL.paceSample(r, 'turns', 3000, false)).map(a => a.reduce((x, y) => x + y, 0) / a.length))`));
  ok('the strong mage reads faster', tempo[1] < tempo[0], tempo.map((t) => t.toFixed(0)).join(' > '));
  // the rival's opening board is the human's: same seed, same deal
  const same = await ev(`(() => { setSeed(424242); const b = []; const v = () => b.filter(s => VOWELS.includes(s.ch[0])).length;
    for (let i = 0; i < 16; i++) { let ch = rpick(BAG); if (v() < 5 && !VOWELS.includes(ch)) ch = rpick(['a','e','i','o','u']); ch = PACK.digraph[ch] || ch; b.push({ ch }); }
    const rb = new SS_RIVAL.Board(SS_PACKS.en, 424242); return b.map(s => s.ch).join('') === rb.slots.map(s => s.ch).join(''); })()`);
  ok('rival deals the identical opening board from the room seed', same === true);
  ok('no page exceptions', errs.length === 0, errs.join(' | '));
}

/* ======================= DUELS ======================= */
async function duel(tag, rating, q, opts) {
  const o = Object.assign({ rematch: true, cap: 15000, timeout: 240000 }, opts || {});
  errs.length = 0;
  await boot('botduel=' + rating + '&' + q);
  const started = await until(`!!window.__ssRival && !!${VS} && ${VS}.scene.isActive() && ${VS}.state !== 'wait'`, 60000);
  ok(tag + ' the duel rose', started);
  if (!started) return null;
  const code1 = await ev(`${VS}.code`);
  const uid = await ev(`window.__ssRival.uid`);
  const done1 = await until(`window.__ssRival.state === 'done' && window.__ssRival.duels === 1`, o.timeout, 1000);
  ok(tag + ' duel 1 played to done', done1);
  const r1 = await room(code1);
  ok(tag + ' room 1 done with a winner', !!(r1 && r1.status === 'done' && r1.winnerUid), r1 && (r1.winnerUid === uid ? 'rival won' : 'human won'));
  let r2 = null, code2 = null;
  if (o.rematch) {
    const done2 = await until(`window.__ssRival.duels === 2 && window.__ssRival.state === 'done'`, o.timeout, 1000);
    ok(tag + ' rematch answered and played to done', done2);
    code2 = await ev(`window.__ssRival.code`);
    r2 = await room(code2);
    ok(tag + ' room 2 done with a winner', !!(r2 && r2.status === 'done' && r2.winnerUid && code2 !== code1));
    ok(tag + ' the human saw the second duel end', await ev(`${VS}.state === 'done' && ${VS}.code === '${code2}'`));
  }
  const log = await rlog();
  const gaps = paceChecks(tag, log, o.cap);
  const casts1 = seatChecks(tag + ' r1', r1, uid) || [];
  const casts2 = r2 ? (seatChecks(tag + ' r2', r2, uid) || []) : [];
  const seat = r1 && r1.players && r1.players[uid];
  ok(tag + ' seat rating near the target', !!seat && Math.abs(seat.rating - rating) <= 60, seat && seat.rating);
  ok(tag + ' no page exceptions', errs.length === 0, errs.join(' | '));
  const all = casts1.concat(casts2);
  const out = { rating, casts: all.length, mean: mean(all.map((c) => c.dmg)), won: [r1, r2].filter((r) => r && r.winnerUid === uid).length, gaps };
  console.log('    ' + tag + ': ' + all.length + ' casts · mean dmg ' + out.mean.toFixed(1) + ' · rival won ' + out.won + ' of ' + (r2 ? 2 : 1) + ' · words ' + all.map((c) => c.word).join(' '));
  return out;
}
if (ONLY === 'all' || ONLY === 'duels') {
  console.log('DUELS · turns');
  for (const r of [800, 1200, 1600]) live[r] = await duel('turns ' + r, r, 'vsdemo=1&vsmode=turns&seed=' + (777000 + r));
  if (live[800] && live[1600]) ok('live: the 1600 rival out-damages the 800 rival per cast', live[1600].mean > live[800].mean, live[800].mean.toFixed(1) + ' → ' + (live[1200] ? live[1200].mean.toFixed(1) : '?') + ' → ' + live[1600].mean.toFixed(1));
  console.log('DUELS · timed');
  await duel('timed 1200', 1200, 'vsdemo=1&vsmode=timed&seed=778200', { cap: 11000, timeout: 400000 });
}

/* ======================= FORFEIT ======================= */
if (ONLY === 'all' || ONLY === 'forfeit') {
  console.log('FORFEIT');
  errs.length = 0;
  await boot('botduel=1000&vsmode=turns&seed=779000');
  const up = await until(`!!window.__ssRival && ${VS}.scene.isActive() && ${VS}.state === 'pick'`, 60000);
  ok('the duel is live', up);
  const code = await ev(`${VS}.code`), uid = await ev(`window.__ssRival.uid`);
  await sleep(1500);
  await tap(`${VS}.children.list.find(o => o.text === '‹')`);   // the back arrow: deserting a live duel
  const home = await until(`game.scene.isActive('vsmenu')`, 10000);
  ok('a real tap on ‹ left the duel', home);
  const settled = await until(`window.__ssRival.state === 'done'`, 15000, 500);
  ok('the rival settled the room within 15s', settled);
  const r = await room(code);
  ok('room done, the rival stands alone as winner', !!(r && r.status === 'done' && r.winnerUid === uid), r && r.status + ' ' + (r.winnerUid === uid));
  ok('the deserter is marked gone', !!(r && r.players && r.players['test_rc'] && r.players['test_rc'].gone));
  const log = await rlog();
  ok('no engine errors', !log.some((e) => e.ev === 'error'));
  ok('no page exceptions', errs.length === 0, errs.join(' | '));
}

/* ======================= PLAY (the harness is the human) ======================= */
if (ONLY === 'all' || ONLY === 'play') {
  console.log('PLAY · a real duel, my taps against the rival');
  errs.length = 0;
  await boot('botduel=1100&vsmode=turns&seed=780100');
  const up = await until(`!!window.__ssRival && ${VS}.scene.isActive() && ${VS}.state === 'pick'`, 60000);
  ok('the duel is live', up);
  const code = await ev(`${VS}.code`), uid = await ev(`window.__ssRival.uid`);
  let myCasts = 0, rounds = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 300000) {
    const st = await ev(`JSON.stringify({ s: ${VS}.state, my: ${VS}.isMyTurn(), done: window.__ssRival.state })`);
    const { s, my } = JSON.parse(st);
    if (s === 'done') break;
    if (s === 'sigil') {
      await tap(`${VS}.overlayC.list.filter(o => o.getData && o.getData('sigilCard'))[0]`);
      await sleep(600); continue;
    }
    if (s !== 'pick' || !my) { await sleep(400); continue; }
    rounds++;
    // my word: the scene's own solver picks it, my taps weave it
    const idx = JSON.parse(await ev(`JSON.stringify(${VS}.bestWord() || [])`));
    if (!idx.length) { await tap(`${VS}.scryB`); await sleep(800); continue; }
    await sleep(900 + Math.random() * 900);
    for (const i of idx) { await tap(`${VS}.board[${i}].c`); await sleep(160 + Math.random() * 120); }
    const word = await ev(`${VS}.currentWord()`);
    await sleep(300);
    await tap(`${VS}.castB`);
    myCasts++;
    console.log('    me: ' + word.toUpperCase());
    await until(`${VS}.state !== 'anim' && !${VS}.sel.length`, 8000, 200);
    await sleep(300);
  }
  const r = await room(code);
  ok('the duel reached done', !!(r && r.status === 'done'), r && (r.winnerUid === uid ? 'rival won' : 'I won'));
  ok('I cast real words by tapping', myCasts >= 1, myCasts + ' casts');
  const log = await rlog();
  paceChecks('play', log, 15000);
  seatChecks('play', r, uid);
  ok('no page exceptions', errs.length === 0, errs.join(' | '));
  console.log('  — the rival\'s transcript —');
  const t = log[0] ? log[0].t : 0;
  for (const e of log) {
    if (e.ev === 'think') console.log('    ' + ((e.t - t) / 1000).toFixed(1) + 's  thinks ' + (e.ms / 1000).toFixed(1) + 's' + (e.first ? ' (opening)' : '') + (e.rush ? ' (rush)' : '') + ' → ' + e.word + ' ' + e.dmg + (e.rank ? ' (rank ' + (e.rank + 1) + ' of ' + e.of + ', best ' + e.best + ')' : ''));
    else if (e.ev === 'cast') console.log('    ' + ((e.t - t) / 1000).toFixed(1) + 's  CAST ' + e.word + ' −' + e.dmg + ' → ' + e.target);
    else if (e.ev === 'sigil') console.log('    ' + ((e.t - t) / 1000).toFixed(1) + 's  sigil ' + e.id + ' of ' + e.offer.join('/'));
    else console.log('    ' + ((e.t - t) / 1000).toFixed(1) + 's  ' + e.ev + ' ' + JSON.stringify(Object.assign({}, e, { t: undefined, ev: undefined })));
  }
}

/* ======================= QUEUE (the quiet sky) ======================= */
if (ONLY === 'all' || ONLY === 'queue') {
  console.log('QUEUE · the 12-second rival');
  errs.length = 0; logs.length = 0;
  await cleanRooms();   // a stale room of test_rc's (an unanswered rematch) would be reclaimed by FIND
  const ROOT = DB.replace(/\/mp\/rooms$/, '');
  const fields = ['name', 'runs', 'wins', 'words', 'beasts', 'longest', 'bigHit', 'bestQuick', 'vsWins', 'achCount', 'rating', 'rhide', 'streak', 'streakDay', 'streakBest', 'streakGrace', 'streakMark', 'at'];
  await boot('vsdemo=1&vsmode=turns');   // VSAUTO: the solver presses FIND from the menu by itself
  const mine = await ev(`SS.prof.rating`);
  const seated = await until(`!!${VS} && ${VS}.scene.isActive() && !!${VS}.room && !!${VS}.room.seekAt`, 40000);
  ok('FIND opened a queued room (seekAt stamped)', seated);
  const code = await ev(`${VS}.code`);
  const met = await until(`!!${VS}.room && Object.keys(${VS}.room.players || {}).length === 2`, 25000, 250);
  let r = await room(code);
  const other = Object.keys((r && r.players) || {}).find((k) => k !== 'test_rc');
  const seat = other && r.players[other];
  ok('a rival arrived while the searcher waited alone', met && !!seat, other);
  const reveal = seat ? (seat.joinedAt - r.seekAt) / 1000 : -1;
  ok('…between 11s and 17s after FIND (jittered)', reveal >= 11 && reveal <= 17, reveal.toFixed(1) + 's');
  ok('uid cut like a device uid, no test_ prefix', /^u[a-z0-9]{8,}$/.test(other || ''), other);
  ok('name cut like a generated name', !!seat && /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(seat.name), seat && seat.name);
  const gap = seat ? Math.abs(seat.rating - mine) : 0;
  ok('seat rating 40–90 off the player\'s (' + mine + ')', gap >= 40 && gap <= 90, seat && seat.rating);
  // the profile row, as a quiet player's — read while the rival is still fresh in the seat
  const row1 = (await (await fetch(ROOT + '/players/' + other + '.json')).json()) || null;
  ok('the persona has an ordinary profile row', !!row1 && row1.name === seat.name && row1.rating === seat.rating, JSON.stringify(row1).slice(0, 120));
  ok('…with only the fields SS.sync writes', !!row1 && Object.keys(row1).every((k) => fields.includes(k)), row1 && Object.keys(row1).filter((k) => !fields.includes(k)).join(','));
  ok('the duel rose on the ordinary path (host auto-start)', await until(`!!${VS}.room && !!${VS}.room.startedAt`, 20000, 250));
  ok('the searching screen saw the rival as a person: lobby roster named them', await ev(`${VS}.lobbyRoster && ${VS}.lobbyRoster.text.includes(${JSON.stringify(seat ? seat.name : '')})`));
  // the on-screen text of the battle, every Text object alive
  const screen = await ev(`${VS}.children.list.filter(o => o.text != null).map(o => o.text).join(' | ')`);
  ok('nothing on screen says bot/ai', !/\bbot\b|\bai\b|robot|engine|persona/i.test(screen), screen.slice(0, 80));
  ok('the opponent nameplate shows the persona with a star-class glyph', await ev(`!!${VS}.oppPanels && !!${VS}.oppPanels[${JSON.stringify(other)}] && ${VS}.oppPanels[${JSON.stringify(other)}].nm.text.endsWith(${JSON.stringify(seat ? seat.name : '')})`));
  // ---- forced WIN: the rival's hp to 1 before anyone casts — the solver is quick, and the first blow ends it
  const rating0 = await ev(`SS.prof.rating`);
  await ev(`SSNET.dbSet('mp/rooms/${code}/players/${other}/hp', 1)`);
  // tapping the name opens the rating card from the seat — the real rating, never 1000-by-default
  ok('the board opened', await until(`${VS}.state === 'pick' || ${VS}.state === 'anim'`, 30000, 100));
  await tap(`${VS}.oppPanels[${JSON.stringify(other)}].nm`);
  await sleep(400);
  const card = await ev(`(() => { const c = ${VS}.__rcC; if (!c) return ''; const out = []; const walk = (o) => { if (o.text != null) out.push(o.text); if (o.list) o.list.forEach(walk); }; walk(c); return out.join(' | '); })()`);
  const tierLine = await ev(`'— ' + SS_T(ssRatingTier(${seat ? seat.rating : 1000}).key) + ' —'`);
  ok('the rating card names the persona and its star-class from the seat', !!card && card.includes(seat.name) && card.includes(tierLine), card.slice(0, 90));
  ok('…and no ☾ veil / no "loading" stub', !/☾|\.\.\.|…$/.test(card));
  await ev(`${VS}.__rcC && ${VS}.__rcC.destroy(); ${VS}.__rcC = null; 'ok'`);
  const done1 = await until(`${VS}.room && ${VS}.room.status === 'done' && ${VS}.code === '${code}' && ${VS}.state === 'done'`, 120000, 300);
  ok('WIN: duel 1 reached the end screen (state done, REMATCH live)', done1);
  r = await room(code);
  ok('WIN: the searcher is the winner', !!r && r.winnerUid === 'test_rc');
  const res1 = JSON.parse(await ev(`localStorage.getItem('beta3.vsresult') || 'null'`));
  const rating1 = await ev(`SS.prof.rating`);
  ok('WIN: the rating moved UP, as against a person', !!res1 && res1.won && res1.rd > 0 && rating1 > rating0, rating0 + ' → ' + rating1 + ' (rd ' + (res1 && res1.rd) + ')');
  ok('WIN: the end screen offers ADD AS FRIEND for the persona', await ev(`${VS}.overlayC.list.some(o => o.text && o.text === SS_T('endAddFriend', ${JSON.stringify(seat.name)}))`));
  const add = await ev(`(() => { const o = ${VS}.overlayC.list.find(o => o.text && o.text === SS_T('endAddFriend', ${JSON.stringify(seat.name)})); if (!o) return 'none'; o.emit('pointerdown'); return 'tapped'; })()`);
  await sleep(1500);
  ok('ADD AS FRIEND lands the persona in my friends, offline and quiet', add === 'tapped' && await ev(`!!SSNET.FR.friends[${JSON.stringify(other)}] && !SSNET.FR.isOnline(${JSON.stringify(other)}) && SSNET.FR.onlineCount() === 0`));
  // ---- the demo's rematch (2–4s after the end): the persona answers; forced LOSS
  const rose2 = await until(`${VS}.code !== '${code}' && !!${VS}.room && ${VS}.room.status === 'active'`, 60000, 250);
  ok('REMATCH: the persona answered and the second duel rose', rose2);
  const code2 = await ev(`${VS}.code`);
  await ev(`SSNET.dbSet('mp/rooms/${code2}/players/test_rc/hp', 1)`);
  ok('LOSS: duel 2 reached the end screen', await until(`${VS}.room && ${VS}.room.status === 'done' && ${VS}.code === '${code2}' && ${VS}.state === 'done'`, 120000, 300));
  const r2 = await room(code2);
  const res2 = JSON.parse(await ev(`localStorage.getItem('beta3.vsresult') || 'null'`));
  const rating2 = await ev(`SS.prof.rating`);
  ok('LOSS: the persona is the winner of the rematch', !!r2 && r2.winnerUid === other, r2 && r2.winnerUid);
  ok('LOSS: the rating moved DOWN', !!res2 && !res2.won && res2.rd < 0 && rating2 < rating1, rating1 + ' → ' + rating2 + ' (rd ' + (res2 && res2.rd) + ')');
  seatChecks('queue r1', r, other); seatChecks('queue r2', r2, other);
  // the row grew with the duels, by the same Elo
  await sleep(2500);
  const row2 = (await (await fetch(ROOT + '/players/' + other + '.json')).json()) || null;
  ok('the row grew: two runs, words cast, one win, rating moved both ways', !!row2 && row2.runs === row1.runs + 2 && row2.vsWins === row1.vsWins + 1 && row2.words > row1.words && row2.rating !== row1.rating, row1 && row2 && (row1.rating + ' → ' + row2.rating + ', runs ' + row1.runs + ' → ' + row2.runs + ', words ' + row1.words + ' → ' + row2.words + ', vsWins ' + row1.vsWins + ' → ' + row2.vsWins));
  ok('…still only a person\'s fields', !!row2 && Object.keys(row2).every((k) => fields.includes(k)));
  // never on a board, never present
  const [daily, weekly, presence] = await Promise.all(['daily', 'weekly', 'presence'].map(async (k) => (await (await fetch(ROOT + '/' + k + '.json')).json()) || {}));
  const onBoard = JSON.stringify(daily).includes(other) || JSON.stringify(weekly).includes(other);
  ok('the persona is on no daily or weekly board', !onBoard);
  ok('the persona has no presence row (never "online")', !presence[other]);
  const circle = JSON.parse(await ev(`JSON.stringify(SS_RIVAL.circle())`));
  ok('the circle kept the persona for next time', circle.some((p) => p.uid === other) && circle.length <= 8);
  // the spread, over twenty draws
  const draws = JSON.parse(await ev(`JSON.stringify(Array.from({length: 20}, () => SS_RIVAL.spreadRating(1000)))`));
  ok('spread: 20 draws all 40–90 off 1000', draws.every((d) => Math.abs(d - 1000) >= 40 && Math.abs(d - 1000) <= 90), draws.join(' '));
  ok('spread: some above, some below', draws.some((d) => d > 1000) && draws.some((d) => d < 1000));
  const low = JSON.parse(await ev(`JSON.stringify(Array.from({length: 20}, () => SS_RIVAL.spreadRating(620)))`));
  ok('spread: at the floor every draw lands above', low.every((d) => d > 620 && d - 620 >= 40 && d - 620 <= 90));
  ok('no console line says bot/ai', !logs.some((l) => /\bbot\b|\bai\b|robot|persona/i.test(l)), logs.filter((l) => /\bbot\b|\bai\b/i.test(l)).slice(0, 2).join(' | '));
  ok('no page exceptions', errs.length === 0, errs.join(' | '));
  const log = await rlog();
  ok('no engine errors', !log.some((e) => e.ev === 'error'), log.filter((e) => e.ev === 'error').map((e) => e.msg).join(' | '));
  // leave nothing of the persona behind in the test sky
  await fetch(ROOT + '/players/' + other + '.json', { method: 'DELETE' });
  await fetch(ROOT + '/friends/test_rc.json', { method: 'DELETE' });
  await fetch(ROOT + '/friends/' + other + '.json', { method: 'DELETE' });
  await fetch(ROOT + '/recent/test_rc.json', { method: 'DELETE' });
}

await cleanRooms();
console.log('\n' + pass + ' passed, ' + fail + ' failed');
console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors');
try { ws.close(); } catch (e) { }
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
