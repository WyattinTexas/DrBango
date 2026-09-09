// CORR-CHECK — versus goes back-and-forth (v0.89.0, Skylar's 9/8 card 04).
// Skylar: "play a turn against someone, maybe casting three words, and then
// they get to go. But they don't have to go right away … a place on the home
// screen at the bottom for the ongoing games … limit it to having a total of
// five ongoing games … they'll have to abandon one … or finish that game up."
// Stamps: friend AND worldwide are ONE async system · exactly 3 casts per
// turn · home strip · 5-game cap · abandon = rated loss (desertion
// convention).
//
// What this suite proves, with real CDP taps at DPR 3 on the LIVE sky:
//   §1 the friend flow — CHALLENGE seals the duel ACTIVE with the friend's
//      seat HELD and the challenger weaving at once; exactly 3 casts then
//      the turn passes (turnCasts 1→2→0 walked on the room record); a 4th
//      cast is refused; the turn-done beat speaks; stepping out STANDS the
//      duel (no desertion, rating untouched) and the home strip carries the
//      row; the friend claims through ?join, sees the missed story (recap),
//      weaves their 3, and the challenger's strip row flips to ✦ your move
//      with the roaming watcher's ring; tapping the row lands the SAME
//      board, tile for tile (the replay law), and play continues.
//   §2 the five-game cap — both challenge doors refuse a 6th with the
//      honest sheet; abandoning from the home strip frees the slot and the
//      door opens.
//   §3 abandon = rated loss — the confirm names the stake; the abandoning
//      seat pays the Elo, the rival's seat inherits the win and settles the
//      mirror delta at their own end screen; both slots free.
//   §4 worldwide rides the same engine — the searching theater's near duel
//      is correspondence-shaped (corr, 150 hp, 3-cast turns): the busy
//      rival answers a WHOLE turn on one rolled clock (answerAt written
//      once, spent at the turn's end, stamps ascending from the appointed
//      minute), and a cold reload lands the standing board verbatim.
//   §5 scry passes the whole turn (the reroll is your action, as ever).
//   §6 the strip itself — nothing when nothing stands, calls-first order,
//      rows leave when duels end.
// Self-launching: serves beta3 on :8899 if nothing does, TWO headless
// Chromes on :9473/:9474 (/tmp/cdp-cora|b, wiped first). Every registry row
// this run writes is deleted and proven gone at the end.
//
//   perl -e 'alarm 900; exec @ARGV' node tools/corr-check.mjs   # ~8 min
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

/* ---------- §0 the source audit (no browser needed) ---------- */
console.log('— THE SOURCE AUDIT —');
const vsSrc = readFileSync('versus.js', 'utf8');
const rvSrc = readFileSync('rival.js', 'utf8');
const gmSrc = readFileSync('game.js', 'utf8');
const stSrc = readFileSync('strings.js', 'utf8');
ok('correspondence constants stand (150 hp · 3 casts · cap 5)',
  /VS_CORR_HP = 150/.test(vsSrc) && /VS_TURN_CASTS = 3/.test(vsSrc) && /VS_CAP = 5/.test(vsSrc));
ok('one turn law for every seat — vsTurnStep in versus.js, spoken by the rival too',
  /function vsTurnStep/.test(vsSrc) && (rvSrc.match(/vsTurnStep\(cur, this\.uid/g) || []).length >= 2);
ok('the challenge holds a seat (vsHeldSeat) and the claim fills it', /vsHeldSeat/.test(vsSrc) && /delete seatRec\.held/.test(vsSrc));
ok('the device ledger of sky duels exists (VS_GAMES) and feeds one shared row list', /const VS_GAMES/.test(vsSrc) && /function vsGameRows/.test(vsSrc));
ok('the home strip is built from the same rows', /refreshDuelStrip/.test(gmSrc) && /vsGameRows\(\)\.slice\(0, 5\)/.test(gmSrc));
ok('the abandon door is confirmed and rated (SS_RATING.duel at 0)', /function vsAbandon/.test(vsSrc) && /SS_RATING\.duel\(foeR, 0\)/.test(vsSrc));
ok('the back arrow never deserts a correspondence duel', /if \(this\.near \|\| this\.corr\) \{\n\s+if \(this\.room && this\.room\.status === 'active'/.test(vsSrc));
ok('correspondence rooms live long (7-day done / 30-day idle sweep; 40-min law kept for the rest)',
  /r\.corr && r\.status === 'done' && now - \(r\.endedAt \|\| r\.createdAt\) > 7 \* 86400000/.test(vsSrc) &&
  /!r\.corr && now - r\.createdAt > 40 \* 60000/.test(vsSrc));
ok('the busy rival answers a whole turn on one clock (first cast only waits)', /turnCasts \| 0\) === 0\) \{\n\s+\/\/ the busy-human rhythm/.test(rvSrc));
ok('?botduel stays the arcade seam (corr: false)', /corr: false \}\)\)\) \{ DIAG\('botduel: seal failed'\)/.test(rvSrc));
const NEWKEYS = ['vsTurnOf', 'vsTurnLast', 'vsWeaving', 'vsTurnDone', 'vsCapTitle', 'vsCapBody', 'vsCapOk', 'vsQuitTitle', 'vsQuitBody', 'vsQuitFree', 'vsQuitKeep', 'vsQuitGo'];
{
  // each language block runs from "  <lang>: {" to the next block — count keys inside
  const blocks = {};
  for (const lg of LANGS) {
    const m = stSrc.indexOf('\n  ' + lg + ': {');
    blocks[lg] = m;
  }
  const order = LANGS.slice().sort((a, b) => blocks[a] - blocks[b]);
  let all = true, why = '';
  for (let i = 0; i < order.length; i++) {
    const from = blocks[order[i]], to = i + 1 < order.length ? blocks[order[i + 1]] : stSrc.length;
    const seg = stSrc.slice(from, to);
    for (const k of NEWKEYS) if (!(new RegExp(k + ':').test(seg))) { all = false; why += order[i] + ':' + k + ' '; }
  }
  ok('the twelve correspondence keys speak all five tongues', all, why.trim());
}

/* ---------- server + two browsers ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
for (const p of ['/tmp/cdp-cora', '/tmp/cdp-corb']) { try { execSync('rm -rf ' + p); } catch (e) { } }
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
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    if (r?.data) { const { writeFileSync } = await import('node:fs'); writeFileSync('/tmp/corr-' + name + '.png', Buffer.from(r.data, 'base64')); }
  };
  // the first synthesized click after a boot is sometimes eaten (the v0.23
  // lesson) — tap, verify, tap again until the condition answers
  const tapTil = async (expr, cond, cap = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < cap) {
      try { await tap(expr); } catch (e) { }
      if (await until(cond, 2500)) return true;
    }
    return false;
  };
  return { ev, seed, nav, until, tap, tapTil, shot, tag };
}
const [A, B] = await Promise.all([client(9473, '/tmp/cdp-cora', 'A'), client(9474, '/tmp/cdp-corb', 'B')]);
const toDelete = new Set();
const codes = new Set();
const SUF = rnd();
const UA = 'test_ca' + SUF, UB = 'test_cb' + SUF;
const BOOT = (uid) => `navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); if (localStorage.getItem('corr.seeded') !== '${uid}') { localStorage.clear(); localStorage.setItem('corr.seeded', '${uid}');
    localStorage.setItem('starspellUid', '${uid}'); } } catch (e) {}`;
const READY = `SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').dailyChipB`;
const MENU = `game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').chFriendB`;
const VB = `game.scene.getScene('vsbattle')`;
const INVB = `game.scene.isActive('vsbattle') && ${VB}.state === 'pick'`;
// deep-walk census: container children never appear in scene.children.list
const TEXTS = (scene) => `(() => { const out = []; const walk = (o) => { if (!o) return;
  if (o.list) { for (const k of o.list) walk(k); return; } if (o.text !== undefined && o.visible) out.push(String(o.text)); };
  const s = game.scene.getScene('${scene}'); if (!s || !s.children) return '';
  for (const o of s.children.list) walk(o); return out.join(' | '); })()`;

for (const u of [UA, UB]) for (const p of ['players/', 'presence/', 'devices/', 'friends/', 'recent/', 'invites/']) toDelete.add(p + u);

/* ---------- §1 THE FRIEND FLOW ---------- */
console.log('— §1 THE FRIEND FLOW: three casts, the pass, the claim, the return —');
await A.seed(BOOT(UA));
ok('A boots to the meadow', await A.nav(BASE + '?mpuid=' + UA.slice(5)) && await A.until(READY, 45000));
await B.seed(BOOT(UB));
ok('B boots to the meadow', await B.nav(BASE + '?mpuid=' + UB.slice(5)) && await B.until(READY, 45000));
const NA = await A.ev(`SSNET.myName()`), NB = await B.ev(`SSNET.myName()`);
toDelete.add('names/' + await A.ev(`SSNET.nameKey(${JSON.stringify(NA)})`));
toDelete.add('names/' + await B.ev(`SSNET.nameKey(${JSON.stringify(NB)})`));
await A.ev(`SSNET.FR.add(${JSON.stringify(UB)}, ${JSON.stringify(NB)})`);
await sleep(1200);
// through the real doors: VERSUS → the sheet → B's row CHALLENGE
ok('A stands under VERSUS', await A.tapTil(`game.scene.getScene('home').rowBtns.versus`, MENU, 20000));
ok("the social sheet opens on B's row", await A.tapTil(`game.scene.getScene('vsmenu').chFriendB`,
  `!!game.scene.getScene('vsmenu').frRows && game.scene.getScene('vsmenu').frRows.some((r) => r.id === ${JSON.stringify(UB)})`, 20000));
ok('the challenge lands A straight in the duel (correspondence: your three first)',
  await A.tapTil(`game.scene.getScene('vsmenu').frRows.find((r) => r.id === ${JSON.stringify(UB)}).cb`, INVB, 35000));
const CODE1 = await A.ev(`${VB}.code`);
codes.add(CODE1); toDelete.add('mp/rooms/' + CODE1);
let room = await rt('mp/rooms/' + CODE1);
ok('the room is ACTIVE from birth, correspondence-dressed (corr · 150 hp · turnCasts 0)',
  !!room && room.status === 'active' && room.corr === 1 && room.hp === 150 && (room.turnCasts | 0) === 0,
  room && (room.status + ' corr:' + room.corr + ' hp:' + room.hp));
ok("B's seat is HELD with their name on it, full hp", !!room.players[UB] && room.players[UB].held === 1 && room.players[UB].hp === 150 && room.players[UB].name === NB);
ok('the first turn is the challenger\'s', room.turnUid === UA);
const bell1 = await rt('invites/' + UB + '/' + UA);
ok('the summons bell rings B (and is NOT cancelled by the challenger entering)', !!bell1 && bell1.code === CODE1);
// three casts, the count walked on the record. The solver's own brain casts;
// the pin is the seat's cast count moving (state alone lies mid-anim), and
// the every-3rd sigil pick is absorbed so the next door is never veiled.
const castOnce = async (cli) => {
  // only cast when it is truly my turn and the board is ready
  if (!(await cli.until(`${VB}.isMyTurn() && ${VB}.state === 'pick'`, 20000))) return false;
  const before = await cli.ev(`((${VB}.me() || {}).casts | 0)`);
  await cli.ev(`${VB}.demoStep(); 1`);
  const moved = await cli.until(`((${VB}.me() || {}).casts | 0) > ${before}`, 25000);
  // the every-3rd sigil overlay arrives a beat AFTER the seat update —
  // settle onto a named state, breathe, then absorb it so no veil stands
  await cli.until(`${VB}.state === 'pick' || ${VB}.state === 'sigil' || ${VB}.state === 'done'`, 12000);
  await sleep(500);
  if (await cli.ev(`${VB}.state === 'sigil'`)) { await cli.ev(`${VB}.demoStep(); 1`); await cli.until(`${VB}.state !== 'sigil'`, 10000); }
  return moved;
};
// poll the committed record (REST) — the scene's local room can lag the
// listener under two-Chrome software-GL load; the record is the truth
const restUntil = async (code, pred, cap = 12000) => { const t0 = Date.now(); let r = null; while (Date.now() - t0 < cap) { r = await rt('mp/rooms/' + code); if (r && pred(r)) return r; await sleep(400); } return r; };
await A.until(`${VB}.isMyTurn() && ${VB}.state === 'pick'`, 15000);
const boardStart = await A.ev(`${VB}.board.filter(Boolean).length`);
ok('the opening deal stands (16 tiles)', boardStart === 16, 'tiles ' + boardStart);
await castOnce(A);
room = await restUntil(CODE1, (r) => (r.turnCasts | 0) === 1);
ok('cast one: the turn HOLDS (turnCasts 1, still A)', (room.turnCasts | 0) === 1 && room.turnUid === UA, 'tc ' + room.turnCasts + ' turn ' + room.turnUid);
await castOnce(A);
room = await restUntil(CODE1, (r) => (r.turnCasts | 0) === 2);
ok('cast two: the turn HOLDS (turnCasts 2)', (room.turnCasts | 0) === 2 && room.turnUid === UA, 'tc ' + (room && room.turnCasts));
ok('the turn line counts it out (the last cast)', await A.until(`(${TEXTS('vsbattle')}).includes(SS_T('vsTurnLast'))`, 6000));
await castOnce(A);
room = await restUntil(CODE1, (r) => r.turnUid === UB && (r.turnCasts | 0) === 0);
ok('cast three: the turn PASSES to the held seat', !!room && room.turnUid === UB && (room.turnCasts | 0) === 0, room && ('turn ' + (room.turnUid === UB ? 'B' : 'A') + ' tc ' + room.turnCasts));
ok('the record agrees (turnUid B · turnCasts 0 · turnCount 1 · movedAt fresh)',
  room.turnUid === UB && (room.turnCasts | 0) === 0 && (room.turnCount | 0) === 1 && Date.now() - room.movedAt < 120000);
ok('exactly three casts stand, all A\'s, and the seat ledger matches',
  Object.values(room.casts || {}).length === 3 && Object.values(room.casts).every((c) => c.uid === UA) && room.players[UA].casts === 3);
ok('the turn-done beat spoke', (await A.ev(TEXTS('vsbattle'))).includes(await A.ev(`SS_T('vsTurnDone', ${JSON.stringify(NB)})`)));
ok('my play script rides my seat (3 casts recorded for the replay)', (room.players[UA].plays || []).filter((p) => p.c).length === 3);
// a fourth cast is refused: the solver's own guard reads isMyTurn false —
// drive the raw door instead and prove nothing lands
await A.ev(`${VB}.tryCast(); 1`);
await sleep(1500);
room = await rt('mp/rooms/' + CODE1);
ok('a fourth cast is refused (the turn is not mine)', Object.values(room.casts || {}).length === 3 && room.players[UA].casts === 3);
const boardA1 = await A.ev(`${VB}.board.map((s) => s ? s.ch : '.').join('')`);
const ratingA0 = await A.ev(`SS.prof.rating`);
// step out: the duel STANDS
ok('the back arrow stands the duel (menu, no desertion)',
  await A.tapTil(`(() => { const s = ${VB}; return s.children.list.find((o) => o.text === '‹'); })()`, MENU, 20000));
ok('…and the rating is untouched', (await A.ev(`SS.prof.rating`)) === ratingA0);
room = await rt('mp/rooms/' + CODE1);
ok('the room still stands active in the sky', !!room && room.status === 'active');
// home: the strip carries the row
ok('A comes home', await A.tapTil(`(() => { const s = game.scene.getScene('vsmenu'); return s.children.list.find((o) => o.text === '‹ HOME'); })()`, READY, 20000));
ok('the strip holds the duel\'s row (B named, summons waiting)', await A.until(`(() => { const h = game.scene.getScene('home');
  return h.duelRows && h.duelRows.some((r) => r.code === ${JSON.stringify(CODE1)} && r.kind === 'wait'); })()`, 8000));
await A.shot('strip-wait');
// B claims through the deep link
ok('B answers through ?join (the claim)', await B.nav(BASE + '?mpuid=' + UB.slice(5) + '&join=' + CODE1 + '&from=' + UA) && await B.until(INVB, 45000));
room = await rt('mp/rooms/' + CODE1);
ok('the held seat is CLAIMED (held gone, rating filled, hp story kept)',
  !!room.players[UB] && !room.players[UB].held && Number.isFinite(room.players[UB].rating) && room.players[UB].hp <= 150);
const lastAcast = Math.max(...Object.values(room.casts || {}).filter((c) => c.uid === UA).map((c) => c.at));
ok('B sees the missed story (the seen watermark walked A\'s three casts)',
  await B.until(`((VS_GAMES.get(${JSON.stringify(CODE1)}) || {}).seen || 0) >= ${lastAcast}`, 12000));
ok('it is B\'s turn, counted from one', await B.until(`${VB}.isMyTurn() && (${TEXTS('vsbattle')}).includes(SS_T('vsTurnOf', 1))`, 8000));
for (let i = 0; i < 3; i++) { await castOnce(B); await sleep(700); }
room = await restUntil(CODE1, (r) => r.turnUid === UA && (r.turnCasts | 0) === 0, 18000);
ok('B\'s three pass the turn home', !!room && room.turnUid === UA && (room.turnCasts | 0) === 0, room && ('turn ' + (room.turnUid === UA ? 'A' : 'B')));
ok('six casts stand, three a side', Object.values(room.casts || {}).length === 6 && Object.values(room.casts).filter((c) => c.uid === UB).length === 3, 'casts ' + Object.values(room.casts || {}).length);
// A's strip flips to the call
ok('A\'s strip row flips to ✦ your move (the roaming watcher)', await A.until(`(() => { const h = game.scene.getScene('home');
  return h.duelRows && h.duelRows.some((r) => r.code === ${JSON.stringify(CODE1)} && r.kind === 'move'); })()`, 20000));
await A.shot('strip-move');
// tap the row: the same board, tile for tile
ok('the strip row lands A back in the duel',
  await A.tapTil(`game.scene.getScene('home').duelRows.find((r) => r.code === ${JSON.stringify(CODE1)}).zone`, INVB, 35000));
const boardA2 = await A.ev(`${VB}.board.map((s) => s ? s.ch : '.').join('')`);
ok('the standing board is replayed VERBATIM (' + boardA1 + ')', boardA1 === boardA2, boardA2);
const lastBcast = Math.max(...Object.values(room.casts).filter((c) => c.uid === UB).map((c) => c.at));
ok('the missed reply is TOLD and marked seen (the recap watermark)', await A.until(`((VS_GAMES.get(${JSON.stringify(CODE1)}) || {}).seen || 0) >= ${lastBcast}`, 12000));

/* ---------- §2 THE FIVE-GAME CAP ---------- */
console.log('— §2 THE FIVE-GAME CAP —');
// back out to the meadow; fabricate four more ongoing duels in the ledger
await A.tapTil(`(() => { const s = ${VB}; return s.children.list.find((o) => o.text === '‹'); })()`, MENU, 20000);
await A.tapTil(`(() => { const s = game.scene.getScene('vsmenu'); return s.children.list.find((o) => o.text === '‹ HOME'); })()`, READY, 20000);
const rtPut = (p, v) => fetch(RT + p + '.json', { method: 'PUT', body: JSON.stringify(v) });
for (let i = 0; i < 4; i++) {
  const fu = 'test_fk' + SUF + i;
  await rtPut('mp/rooms/FAK' + i, { mode: 'turns', status: 'active', corr: 1, hp: 150, createdAt: Date.now(), movedAt: Date.now(),
    hostUid: UA, seed: 7 + i, lang: 'en', turnUid: fu, turnCasts: 0, turnCount: 1,
    players: { [UA]: { name: NA, hp: 150, seat: 0, casts: 0, dealt: 0, gone: false, joinedAt: Date.now(), rating: 1000, rhide: 0 },
      [fu]: { name: 'Faker ' + i, hp: 150, seat: 1, casts: 0, dealt: 0, gone: false, joinedAt: Date.now(), rating: 1000, rhide: 0 } } });
  toDelete.add('mp/rooms/FAK' + i);
}
const oc = await A.ev(`(() => { for (let i = 0; i < 4; i++) VS_GAMES.add({ code: 'FAK' + i, foe: { id: 'test_fk' + ${JSON.stringify(SUF)} + i, name: 'Faker ' + i }, at: Date.now() - i * 1000, turn: 'test_fk' + ${JSON.stringify(SUF)} + i, status: 'active', held: 0, seen: 0, settled: 0 });
  return vsOngoingCount(); })()`);
ok('five ongoing duels stand (the real one + four)', oc === 5, 'count ' + oc);
await A.tapTil(`game.scene.getScene('home').rowBtns.versus`, MENU, 20000);
ok('CHALLENGE WORLDWIDE refuses at the cap — the honest sheet',
  await A.tapTil(`game.scene.getScene('vsmenu').chWorldB`, `(${TEXTS('vsmenu')}).includes(SS_T('vsCapTitle'))`, 12000));
ok('…and no room was minted (the door truly held)', !(await A.ev(`game.scene.isActive('vsbattle')`)));
await A.shot('cap-sheet');
await A.tapTil(`(() => { const s = game.scene.getScene('vsmenu'); let hit = null; const walk = (o) => { if (o.list) { o.list.forEach(walk); return; }
  if (o.text === SS_T('vsCapOk')) hit = o; }; s.children.list.forEach(walk); return hit; })()`, `!(${TEXTS('vsmenu')}).includes(SS_T('vsCapTitle'))`, 10000);
await A.tapTil(`game.scene.getScene('vsmenu').chFriendB`, `!!game.scene.getScene('vsmenu').frRows && game.scene.getScene('vsmenu').frRows.length > 0`, 15000);
ok('CHALLENGE A FRIEND refuses at the cap too',
  await A.tapTil(`game.scene.getScene('vsmenu').frRows[0].cb`, `(${TEXTS('vsmenu')}).includes(SS_T('vsCapTitle'))`, 12000));
ok('…and A never left the page for a duel', !(await A.ev(`game.scene.isActive('vsbattle')`)));
// the way through: abandon one from the HOME strip (a fabricated duel — its
// room never existed, so the confirm speaks the free takeback)
await A.nav(BASE + '?mpuid=' + UA.slice(5));
await A.until(READY, 30000);
ok('the strip shows five rows (the cap made visible)', (await A.ev(`(game.scene.getScene('home').duelRows || []).length`)) === 5);
// the strip ✕ is a small container-child control — fired via emit (the
// codebase's pattern for these; byname/vspage do the same). The confirm's
// GO is a full button, tapped for real.
await A.ev(`(() => { const r = game.scene.getScene('home').duelRows.find((x) => x.code === 'FAK0'); if (r && r.abandon) r.abandon.emit('pointerdown'); })()`);
ok('the ✕ raises the confirm (free — this rival never wove)', await A.until(`(${TEXTS('home')}).includes(SS_T('vsQuitTitle'))`, 8000));
ok('the slot frees (four remain)', await A.tapTil(`(() => { const s = game.scene.getScene('home'); let hit = null; const walk = (o) => { if (o.list) { o.list.forEach(walk); return; }
  if (o.text === SS_T('vsQuitGo')) hit = o; }; s.children.list.forEach(walk); return hit; })()`, `vsOngoingCount() === 4`, 12000));
ok('…for free (rating untouched)', (await A.ev(`SS.prof.rating`)) === ratingA0);
await A.ev(`for (const c of ['FAK1','FAK2','FAK3']) VS_GAMES.remove(c); 1`);
for (const c of ['FAK1', 'FAK2', 'FAK3']) await rtDel('mp/rooms/' + c);

/* ---------- §3 ABANDON = RATED LOSS (both ledgers) ---------- */
console.log('— §3 ABANDON = RATED LOSS —');
const ratingB0 = await B.ev(`SS.prof.rating`);
// B steps out of the duel (it stands for them too)
await B.tapTil(`(() => { const s = ${VB}; return s.children.list.find((o) => o.text === '‹'); })()`, MENU, 20000);
await B.tapTil(`(() => { const s = game.scene.getScene('vsmenu'); return s.children.list.find((o) => o.text === '‹ HOME'); })()`, READY, 20000);
// A abandons the real duel from the home strip — B has cast, so it is RATED.
// the confirm's body wraps across lines (ssTextBlock), so read the block's
// joined lines, not the flat census
const BLOCKS = (scene) => `(() => { let out = []; const walk = (o) => { if (!o) return;
  if (o.getData && o.getData('textBlock') && o.lines) out.push(o.lines.map((t) => t.text).join(' '));
  if (o.list) o.list.forEach(walk); if (o.text !== undefined && (!o.getData || !o.getData('textBlock'))) out.push(String(o.text)); };
  const s = game.scene.getScene('${scene}'); if (s && s.children) s.children.list.forEach(walk); return out.join(' | '); })()`;
await A.ev(`game.scene.getScene('home').duelKey = ''; game.scene.getScene('home').refreshDuelStrip(); 1`);
ok('CODE1 stands on the strip with the abandon door (a live your-move row)',
  await A.until(`(() => { const h = game.scene.getScene('home'); return h.duelRows && h.duelRows.some((r) => r.code === ${JSON.stringify(CODE1)} && r.abandon); })()`, 10000));
await A.ev(`(() => { const r = game.scene.getScene('home').duelRows.find((x) => x.code === ${JSON.stringify(CODE1)}); if (r && r.abandon) r.abandon.emit('pointerdown'); })()`);
ok('the ✕ raises the abandon confirm', await A.until(`(${TEXTS('home')}).includes(SS_T('vsQuitTitle'))`, 8000));
// the wrapped body reconstructs with stray whitespace — normalize before compare
ok('…and it names the RATED stake — a defeat, not a free takeback',
  await A.ev(`(() => { const norm = (s) => s.replace(/\\s+/g, ' ').trim();
    const got = norm(${BLOCKS('home')});
    return got.includes(norm(SS_T('vsQuitBody', ${JSON.stringify(NB)}))) && !got.includes(norm(SS_T('vsQuitFree', ${JSON.stringify(NB)}))); })()`));
await A.shot('abandon-confirm');
ok('the abandoning seat pays the Elo at once', await A.tapTil(`(() => { const s = game.scene.getScene('home'); let hit = null; const walk = (o) => { if (o.list) { o.list.forEach(walk); return; }
  if (o.text === SS_T('vsQuitGo')) hit = o; }; s.children.list.forEach(walk); return hit; })()`, `SS.prof.rating < ${ratingA0}`, 12000));
const ratingA1 = await A.ev(`SS.prof.rating`);
ok('…a real defeat\'s worth (Elo vs B: −20…−12)', ratingA0 - ratingA1 >= 12 && ratingA0 - ratingA1 <= 20, '-' + (ratingA0 - ratingA1));
room = await rt('mp/rooms/' + CODE1);
ok('the room ends honorably for the rival (done · winner B · resigned A)', !!room && room.status === 'done' && room.winnerUid === UB && room.resigned === UA);
ok('the slot frees on A\'s side (ledger + strip row gone)', await A.until(`!VS_GAMES.get(${JSON.stringify(CODE1)}) && vsOngoingCount() === 0`, 8000));
// B's side: the row turns "decided", the tap settles the mirror
ok('B\'s strip row says the duel is decided', await B.until(`(() => { const h = game.scene.getScene('home');
  return h.duelRows && h.duelRows.some((r) => r.code === ${JSON.stringify(CODE1)} && r.kind === 'done'); })()`, 20000));
ok('the end screen inherits the win',
  await B.tapTil(`game.scene.getScene('home').duelRows.find((r) => r.code === ${JSON.stringify(CODE1)}).zone`, `game.scene.isActive('vsbattle') && ${VB}.state === 'done'`, 35000));
ok('…and settles the mirror delta once', await B.until(`SS.prof.rating > ${ratingB0}`, 10000));
const ratingB1 = await B.ev(`SS.prof.rating`);
ok('the two deltas mirror', Math.abs((ratingA0 - ratingA1) - (ratingB1 - ratingB0)) <= 1, (ratingA0 - ratingA1) + ' vs +' + (ratingB1 - ratingB0));
ok('B\'s slot frees too', await B.ev(`!VS_GAMES.get(${JSON.stringify(CODE1)})`));
// leave B on the end screen's RETURN → menu → home for §6
await B.tapTil(`(() => { const s = ${VB}; let hit = null; const walk = (o) => { if (o.list) { o.list.forEach(walk); return; } if (o.text === 'RETURN') hit = o; }; s.children.list.forEach(walk); return hit; })()`, MENU, 20000);

/* ---------- §4 WORLDWIDE RIDES THE SAME ENGINE ---------- */
console.log('— §4 WORLDWIDE: the near duel is correspondence too —');
// a fresh boot pins the theater short and the busy pace tight (the shrink
// seams); the quiet sky answers on-device — same 3-cast law, same hp
ok('A re-enters with the seams pinned', await A.nav(BASE + '?mpuid=' + UA.slice(5) + '&vsfind=1500&botpace=2500,2600') && await A.until(READY, 30000));
await A.tapTil(`game.scene.getScene('home').rowBtns.versus`, MENU, 20000);
await A.tap(`game.scene.getScene('vsmenu').chWorldB`);
ok('the theater resolves to a NEAR duel (the sky was quiet)', await A.until(`game.scene.isActive('vsbattle') && ${VB}.near && ${VB}.state === 'pick'`, 45000));
const CODE2 = await A.ev(`${VB}.code`);
codes.add(CODE2); toDelete.add('mp/rooms/' + CODE2);
const nearRoom = await A.ev(`JSON.parse(JSON.stringify(SS_NEAR.room(${JSON.stringify(CODE2)})))`);
ok('the near room wears the correspondence dress (corr · 150 hp · 3-cast turns)', nearRoom.corr === 1 && nearRoom.hp === 150);
const foeUid = Object.keys(nearRoom.players).find((k) => k !== UA);
ok('a circle mage holds the other chair', !!foeUid);
toDelete.add('players/' + foeUid);
await A.ev(`window.__foeName = SS_NEAR.room(${JSON.stringify(CODE2)}).players[${JSON.stringify(foeUid)}].name; 1`);
toDelete.add('names/' + await A.ev(`SSNET.nameKey(window.__foeName)`));
// my three casts — one turn
for (let i = 0; i < 3; i++) { await castOnce(A); await sleep(600); }
ok('my three pass the turn to the mage', await A.until(`SS_NEAR.room(${JSON.stringify(CODE2)}).turnUid === ${JSON.stringify(foeUid)}`, 15000));
const noteAt0 = await A.ev(`Number((SS_NEAR.note(${JSON.stringify(CODE2)}) || {}).answerAt) || 0`);
ok('the reply clock is rolled ONCE and written (answerAt in the botpace window)', noteAt0 > Date.now() - 2000 && noteAt0 < Date.now() + 10000, 'in ' + Math.round((noteAt0 - Date.now()) / 100) / 10 + 's');
await sleep(1200);
ok('…and stands unchanged while the wait breathes', (await A.ev(`Number((SS_NEAR.note(${JSON.stringify(CODE2)}) || {}).answerAt) || 0`)) === noteAt0);
// the whole turn answers on the one clock
ok('the mage answers a WHOLE turn (three casts, the turn comes home)', await A.until(`SS_NEAR.room(${JSON.stringify(CODE2)}).turnUid === ${JSON.stringify(UA)} &&
  Object.values(SS_NEAR.room(${JSON.stringify(CODE2)}).casts || {}).filter((c) => c.uid === ${JSON.stringify(foeUid)}).length === 3`, 90000));
const botCasts = await A.ev(`Object.values(SS_NEAR.room(${JSON.stringify(CODE2)}).casts || {}).filter((c) => c.uid === ${JSON.stringify(foeUid)}).map((c) => c.at).sort((a, b) => a - b)`);
ok('the first reply lands ON the appointed minute', Math.abs(botCasts[0] - noteAt0) < 1500, 'Δ' + (botCasts[0] - noteAt0) + 'ms');
ok('the sitting\'s stamps ascend', botCasts[0] < botCasts[1] && botCasts[1] < botCasts[2]);
ok('the spent clock is cleared for the next turn', await A.until(`(Number((SS_NEAR.note(${JSON.stringify(CODE2)}) || {}).answerAt) || 0) === 0`, 12000));
// cold reload mid-rhythm: the standing board comes back verbatim
const boardN1 = await A.ev(`${VB}.board.map((s) => s ? s.ch : '.').join('')`);
ok('A cold-reloads mid-duel', await A.nav(BASE + '?mpuid=' + UA.slice(5) + '&botpace=2500,2600') && await A.until(READY, 30000));
ok('the strip carries the near duel as ✦ your move', await A.until(`(() => { const h = game.scene.getScene('home');
  return h.duelRows && h.duelRows.some((r) => r.code === ${JSON.stringify(CODE2)} && r.kind === 'move'); })()`, 10000));
ok('the row lands the duel, board VERBATIM after the restart', await A.tapTil(`game.scene.getScene('home').duelRows.find((r) => r.code === ${JSON.stringify(CODE2)}).zone`, INVB, 35000) &&
  (await A.ev(`${VB}.board.map((s) => s ? s.ch : '.').join('')`)) === boardN1);

/* ---------- §5 SCRY PASSES THE WHOLE TURN ---------- */
console.log('— §5 SCRY PASSES THE TURN —');
await A.until(`${VB}.isMyTurn() && ${VB}.state === 'pick'`, 15000);
await A.ev(`${VB}.scry(); 1`);
ok('the reroll hands the turn whole (turnUid the mage, turnCasts 0)', await A.until(`SS_NEAR.room(${JSON.stringify(CODE2)}).turnUid === ${JSON.stringify(foeUid)} &&
  (SS_NEAR.room(${JSON.stringify(CODE2)}).turnCasts | 0) === 0`, 10000));
ok('…and the script remembers it ({s:1})', await A.ev(`((SS_NEAR.note(${JSON.stringify(CODE2)}) || {}).myPlays || []).some((p) => p.s === 1)`));

/* ---------- §6 THE STRIP ITSELF ---------- */
console.log('— §6 THE STRIP: nothing, order, leaving —');
// B holds no duels: the strip is NOTHING
await B.tapTil(`(() => { const s = game.scene.getScene('vsmenu'); return s.children.list.find((o) => o.text === '‹ HOME'); })()`, READY, 20000);
ok('with nothing ongoing the strip is nothing (zero rows, zero chrome)', (await B.ev(`(game.scene.getScene('home').duelC && game.scene.getScene('home').duelC.list.length) || 0`)) === 0);
// order: calls first. Clear the ledger, fabricate one of each kind, then read
// the SORTED row list (vsGameRows) AND the rendered strip
// fabricate one of each kind, sort, AND render in ONE eval — the roaming
// watcher sweeps roomless ledger entries a beat later, so read synchronously
const ord = JSON.parse(await B.ev(`(() => {
  for (const g of VS_GAMES.list()) VS_GAMES.remove(g.code);
  VS_GAMES.add({ code: 'ORD1', foe: { id: 'x1', name: 'Their Turn' }, at: Date.now(), turn: 'x1', status: 'active', held: 0, seen: 0, settled: 0 });
  VS_GAMES.add({ code: 'ORD2', foe: { id: 'x2', name: 'My Turn' }, at: Date.now() - 5000, turn: SSNET.uid(), status: 'active', held: 0, seen: 0, settled: 0 });
  VS_GAMES.add({ code: 'ORD3', foe: { id: 'x3', name: 'Held One' }, at: Date.now() - 2000, turn: 'x3', status: 'active', held: 1, seen: 0, settled: 0 });
  const pure = vsGameRows().map((r) => r.kind).join(',');
  const h = game.scene.getScene('home'); h.duelKey = ''; h.refreshDuelStrip();
  const rendered = (h.duelRows || []).map((r) => r.kind).join(',');
  return JSON.stringify({ pure, rendered }); })()`));
ok('the call rows lead the strip (move · theirs · wait)', ord.pure === 'move,theirs,wait', ord.pure);
ok('the strip renders those three rows in that order', ord.rendered === 'move,theirs,wait', ord.rendered);
await B.shot('strip-order');
await B.ev(`for (const c of ['ORD1','ORD2','ORD3']) VS_GAMES.remove(c); game.scene.getScene('home').duelKey = ''; game.scene.getScene('home').refreshDuelStrip(); 1`);
ok('rows leave when duels leave', (await B.ev(`(game.scene.getScene('home').duelRows || []).length`)) === 0);
// A finishes the near duel through the abandon door (rated — the mage wove)
await A.tapTil(`(() => { const s = ${VB}; return s.children.list.find((o) => o.text === '‹'); })()`, MENU, 20000);
const rA2 = await A.ev(`SS.prof.rating`);
ok('the versus page carries the near duel with an abandon door', await A.until(`(() => { const m = game.scene.getScene('vsmenu'); return m.pendRows && m.pendRows.some((r) => r.code === ${JSON.stringify(CODE2)} && r.abandon); })()`, 10000));
await A.ev(`(() => { const r = game.scene.getScene('vsmenu').pendRows.find((x) => x.code === ${JSON.stringify(CODE2)}); if (r && r.abandon) r.abandon.emit('pointerdown'); })()`);
ok('the versus page abandon door raises the confirm',
  await A.until(`(${TEXTS('vsmenu')}).includes(SS_T('vsQuitTitle'))`, 8000));
ok('the near abandon pays the rated loss', await A.tapTil(`(() => { const s = game.scene.getScene('vsmenu'); let hit = null; const walk = (o) => { if (o.list) { o.list.forEach(walk); return; }
  if (o.text === SS_T('vsQuitGo')) hit = o; }; s.children.list.forEach(walk); return hit; })()`, `SS.prof.rating < ${rA2}`, 15000));
ok('…and the near duel leaves the device whole', await A.until(`SS_NEAR.codes().indexOf(${JSON.stringify(CODE2)}) < 0`, 8000));

/* ---------- CLEANUP ---------- */
console.log('— CLEANUP —');
const rooms = (await rt('mp/rooms')) || {};
for (const [k, r] of Object.entries(rooms)) {
  if (!r) continue;
  if (/^test_c[ab]/.test(r.hostUid || '') || codes.has(k)) await rtDel('mp/rooms/' + k);
}
for (const p of toDelete) await rtDel(p);
let left = 0; const leftNames = [];
for (const p of toDelete) if ((await rt(p)) !== null) { left++; leftNames.push(p); }
ok('every registry row this run wrote is gone', left === 0, leftNames.join(' '));
ok('zero page exceptions across both clients', errs.length === 0, errs.slice(0, 3).join(' · '));

console.log('\nRESULT ' + pass + '/' + (pass + fail) + (fail ? '  ✗ ' + fail + ' FAILED' : '  — all green'));
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
