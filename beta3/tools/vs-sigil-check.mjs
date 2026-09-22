// VS-SIGIL-CHECK — only sigils that make sense may enter the duel (designed
// for the 9/8 versus-polish card 04, RE-LANDED v0.105.0 by the 9/22 card 03
// after the original parked unverified). Skylar: "Some sigils don't make any
// sense in the verses, like Blood Ink, where it says, 'your words +25% beast
// strikes +25%.'" Review stamp: EXCLUDE them from versus — never invent
// versus twin effects; the rest untouched. A duel has no beasts, no acts, no
// run and no final score, so the law: a sigil enters the versus pick-3 only
// when its WHOLE effect is real in the duel engine on BOTH skies (versus.js
// wordDamage/tryCast + rival.js damage). The five survivors: quill · choir ·
// runes · longbow · forge. The nineteen excluded, each judged in the card's
// summary + memory (FOR SKYLAR to overturn): blood (its beast-strike COST
// vanished → pure upside) · salve aegis leech (no heal/max-hp path) · first
// storm roots nova verse (word effects the duel math never implements — dead
// cards) · hush comet shield ward eclipse (no beast strikes to delay, spare,
// block, blunt or halve) · echo meteor (no beasts to overkill or fell) ·
// gilded (no battle-start bonus hook) · tome (no eye, and its −25% score
// price has nothing to bite → Blood Ink's exact disease).
//
// What this suite proves:
//   §0 SOURCE — the table is whole (24) and flagged EXACTLY as audited; the
//      pool is ONE data declaration (SS_VS_SIGILS off the `vs` flag) read by
//      the human pick AND both mage pick sites; no literal pool list remains
//      anywhere; the BELT stands (blood still priced on both skies, replay
//      pushes {g} unfiltered — a pre-flag room finishes as dealt); solo is
//      byte-independent (rollSigilOpts consults locks only, never `vs`).
//   §1 THE POOL, EXHAUSTIVE — every table row's flag matches the audit
//      (walked in-page); the pick's own filter+splice arithmetic, run 400
//      seeded rolls against random held-sets (excluded holdings included),
//      never offers an excluded or held sigil and always deals
//      min(3, pool-left). Seeded LCG — arithmetic, not luck.
//   §2 THE HUMAN PICK, LIVE — a real correspondence challenge on the live
//      sky: A's third cast raises the real pick-3 (census: 3 offered, all
//      survivors), a REAL tap takes one and the seat write agrees; B claims
//      the held seat, weaves three, B's pick obeys the same law; the turn
//      returns and A's SECOND pick offers survivors minus the held. DPR-3
//      shot of the standing pick.
//   §3 THE MAGE — a worldwide near duel (seams pinned): the busy mage
//      answers a whole turn and PICKS; its seat sigils and its play script's
//      {g} entries all come from the surviving pool — a bot can never flaunt
//      what a human could not hold. Then the duel is forced done and a REAL
//      REMATCH re-seals: the rematch room's own pick-3 deals survivors only.
//   §4 SOLO UNTOUCHED — a grandfathered profile still opens all 24; 200
//      rollSigilOpts rolls in a real quick battle deal every excluded basic,
//      Blood Ink and a legendary — the exclusion never reached solo.
// Self-launching: serves beta3 on :8899 if nothing does, THREE headless
// Chromes (:9481 local/blocked-net, :9482 + :9483 live sky), /tmp/cdp-vsg*.
// Every registry row this run writes is deleted and proven gone at the end.
//
//   perl -e 'alarm 720; exec @ARGV' node tools/vs-sigil-check.mjs   # ~6 min
//
import { spawn, execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
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

// ---- the audited law, pinned harness-side so the check can never rot ----
const FIVE = ['quill', 'choir', 'runes', 'longbow', 'forge'];
const EXCLUDED = ['salve', 'aegis', 'first', 'hush', 'comet', 'shield', 'leech', 'gilded',
  'blood', 'tome', 'storm', 'roots', 'ward', 'echo',
  'feather', 'eclipse', 'nova', 'verse', 'meteor'];
const TABLE24 = [...FIVE, ...EXCLUDED].sort();
const EX_BASICS = ['salve', 'aegis', 'first', 'hush', 'comet', 'shield', 'leech', 'gilded'];
const LEGS = ['feather', 'eclipse', 'nova', 'verse', 'meteor'];

/* ---------- §0 the source audit (no browser needed) ---------- */
console.log('VS-SIGIL-CHECK · only sigils that make sense may enter the duel\n');
console.log('— §0 THE SOURCE AUDIT —');
const dtSrc = readFileSync('data.js', 'utf8');
const vsSrc = readFileSync('versus.js', 'utf8');
const rvSrc = readFileSync('rival.js', 'utf8');
const gmSrc = readFileSync('game.js', 'utf8');
const tableSrc = (dtSrc.match(/const SS_SIGILS = \[[\s\S]*?\n\];/) || [''])[0];
const rows = [...tableSrc.matchAll(/\{ id: '([a-z]+)',([^\n]*)/g)].map((m) => ({ id: m[1], vs: /vs: 1/.test(m[2]) }));
ok('the audited table is whole — 24 sigils, exactly the ids this audit judged (a NEW sigil demands a fresh audit)',
  rows.length === 24 && JSON.stringify(rows.map((r) => r.id).sort()) === JSON.stringify(TABLE24),
  rows.length + ' rows');
ok('the five survivors — and ONLY they — wear the vs flag (quill · choir · runes · longbow · forge)',
  JSON.stringify(rows.filter((r) => r.vs).map((r) => r.id).sort()) === JSON.stringify([...FIVE].sort()),
  rows.filter((r) => r.vs).map((r) => r.id).join(' '));
ok('all nineteen excluded sigils stand in the table unflagged (the exclusion list matches the audit)',
  EXCLUDED.every((id) => { const r = rows.find((x) => x.id === id); return r && !r.vs; }));
ok('SS_VS_SIGILS is declared beside the table, derived from the flag (the ONE pool)',
  /const SS_VS_SIGILS = SS_SIGILS\.filter\(\(_s\) => _s\.vs\)\.map\(\(_s\) => _s\.id\);/.test(dtSrc));
ok('the human pick draws by the flag — one filter, no local list',
  /const avail = SS_SIGILS\.filter\(\(s\) => s\.vs && !this\.mySigils\.includes\(s\.id\)\);/.test(vsSrc));
ok('no literal pool list survives in versus.js (VS_OK is gone)', !/VS_OK/.test(vsSrc) && !/\['quill'/.test(vsSrc));
ok('the mage pool IS the declaration (rival.js aliases SS_VS_SIGILS, empty-guarded)',
  /const VS_OK_SIGILS = \(typeof SS_VS_SIGILS !== 'undefined'\) \? SS_VS_SIGILS : \[\];/.test(rvSrc) && !/\['quill'/.test(rvSrc));
ok('both mage pick sites draw from it (the live pick and the simulator)',
  (rvSrc.match(/VS_OK_SIGILS\.filter\(\(s\) => !(this\.board|b)\.sigils\.includes\(s\)\)/g) || []).length === 2);
ok('the BELT: versus still prices blood for a standing pre-flag seat (excluded ≠ effect removed)',
  /if \(this\.hasSigil\('blood'\)\) dmg \*= 1\.25;/.test(vsSrc));
ok('…and the mage math still prices it too', /if \(has\('blood'\)\) dmg \*= 1\.25;/.test(rvSrc));
ok('…and the board replay pushes a recorded sigil UNFILTERED (a standing duel finishes as dealt)',
  /else if \(p\.g\) b\.sigils\.push\(p\.g\);/.test(rvSrc));
ok('solo is untouched: game.js never reads the pool or the flag',
  !/SS_VS_SIGILS/.test(gmSrc) && !/\.vs\b/.test((gmSrc.match(/rollSigilOpts\(\) \{[\s\S]*?\n  \}/) || [''])[0]));
ok('solo picks still draw from the drip alone (rollSigilOpts → ssSigilOpen)',
  /const open = ssSigilOpen\(\);/.test(gmSrc) && /function ssSigilOpen\(\) \{ return SS_SIGILS\.filter\(\(s\) => ssSigilUnlocked\(s\.id\)\); \}/.test(gmSrc));
ok('the versus cadence row stands untouched (every 3rd own cast)', /versus: \{ casts: 3, type: 'sigil' \}/.test(dtSrc));

/* ---------- server + three browsers ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
for (const p of ['/tmp/cdp-vsg0', '/tmp/cdp-vsga', '/tmp/cdp-vsgb']) { try { execSync('rm -rf ' + p); } catch (e) { } }
const errs = [];
async function client(port, dir, tag, blockNet) {
  const proc = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + port,
    '--user-data-dir=' + dir, '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' });
  kids.push(proc);
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
  if (blockNet) await send('Network.setBlockedURLs', { urls: ['*firebaseio.com*', '*gstatic.com*', '*googleapis.com*'] });
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
      return JSON.stringify({ x: (b.centerX - cam.scrollX * (o.scrollFactorX ?? 1)) / D, y: (b.centerY - cam.scrollY * (o.scrollFactorY ?? 1)) / D }); })()`));
    if (p === 'null') throw new Error('tap: no object');
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await sleep(80);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await sleep(90);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  };
  const tapTil = async (expr, cond, cap = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < cap) {
      try { await tap(expr); } catch (e) { }
      if (await until(cond, 2500)) return true;
    }
    return false;
  };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    if (r?.data) writeFileSync('/tmp/vsg-' + name + '.png', Buffer.from(r.data, 'base64'));
  };
  return { ev, seed, nav, until, tap, tapTil, shot, tag };
}

const toDelete = new Set();
const codes = new Set();
const SUF = rnd();
const UA = 'test_vga' + SUF, UB = 'test_vgb' + SUF;
const BOOT = (uid) => `navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); if (localStorage.getItem('vsg.seeded') !== '${uid}') { localStorage.clear(); localStorage.setItem('vsg.seeded', '${uid}');
    localStorage.setItem('starspellUid', '${uid}'); } } catch (e) {}`;
const READY = `SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').dailyChipB`;
const MENU = `game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').chFriendB`;
const VB = `game.scene.getScene('vsbattle')`;
const INVB = `game.scene.isActive('vsbattle') && ${VB}.state === 'pick'`;
// deep-walk the pick overlay for the offered ids (the desc block carries
// setData('sigilDesc', id); container children never appear in children.list)
const OFFER = `(() => { const s = ${VB}; if (!s || s.state !== 'sigil') return '[]';
  const ids = []; const walk = (o) => { if (!o) return; const d = o.getData && o.getData('sigilDesc'); if (d) ids.push(d); if (o.list) o.list.forEach(walk); };
  s.overlayC.list.forEach(walk); return JSON.stringify(ids); })()`;
const CARD1 = `${VB}.overlayC.list.filter((o) => o.getData && o.getData('sigilCard'))[0]`;

/* ---------- §1 THE POOL, EXHAUSTIVE (local sky) ---------- */
console.log('— §1 THE POOL: the table walked whole, the pick arithmetic sealed —');
const L = await client(9481, '/tmp/cdp-vsg0', 'L', true);
await L.seed(`try { sessionStorage.setItem('beta3.skipIntro', '1'); } catch (e) {}`);
ok('the local sky boots (Firebase blocked — no live rows from this client)',
  await L.nav(BASE + '?fps=0') && await L.until(`!!window.game && typeof SS_SIGILS !== 'undefined' && game.scene.isActive('home')`, 45000));
ok('the game rides the local net', await L.ev(`SSNET.mode`) === 'local', await L.ev(`SSNET.mode`));
ok('BUILD names this card\'s version', /v0\.105\.0/.test(await L.ev(`BUILD`)), await L.ev(`BUILD`));
ok('the live pool IS the five survivors (SS_VS_SIGILS, order-free)',
  await L.ev(`JSON.stringify([...SS_VS_SIGILS].sort())`) === JSON.stringify([...FIVE].sort()),
  await L.ev(`SS_VS_SIGILS.join(' ')`));
ok('EXHAUSTIVE: every one of the 24 rows answers the audit (flag ⇔ survivor)',
  await L.ev(`SS_SIGILS.every((s) => (!!s.vs) === ${JSON.stringify(FIVE)}.includes(s.id)) && SS_SIGILS.length === 24`));
const rolls = JSON.parse(await L.ev(`(() => {
  const FIVE = ${JSON.stringify(FIVE)};
  const bad = [];
  let r = 1234567;
  const rnd = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 400; k++) {
    const held = [...FIVE].sort(() => rnd() - 0.5).slice(0, Math.floor(rnd() * 6));
    if (rnd() < 0.5) held.push('blood');            // a pre-flag seat may HOLD an excluded sigil
    if (rnd() < 0.3) held.push('ward');             // …the pick must still offer only survivors
    const avail = SS_SIGILS.filter((s) => s.vs && !held.includes(s.id));
    const pool = avail.length;
    const opts = [];
    while (opts.length < 3 && avail.length) opts.push(avail.splice(Math.floor(rnd() * avail.length), 1)[0]);
    for (const o of opts) if (!FIVE.includes(o.id) || held.includes(o.id)) bad.push(k + ':' + o.id);
    if (opts.length !== Math.min(3, pool)) bad.push(k + ':n' + opts.length);
    if (new Set(opts.map((o) => o.id)).size !== opts.length) bad.push(k + ':dup');
  }
  return JSON.stringify(bad.slice(0, 6));
})()`));
ok('400 seeded rolls of the pick\'s own arithmetic: never an excluded or held sigil, always min(3, pool) distinct cards',
  rolls.length === 0, rolls.join(' '));

/* ---------- §2 THE HUMAN PICK, LIVE ---------- */
console.log('— §2 THE HUMAN PICK: a real duel\'s pick-3 obeys the law, both seats —');
const [A, B] = await Promise.all([client(9482, '/tmp/cdp-vsga', 'A'), client(9483, '/tmp/cdp-vsgb', 'B')]);
await A.seed(BOOT(UA));
ok('A boots to the meadow (live sky)', await A.nav(BASE + '?mpuid=' + UA.slice(5)) && await A.until(READY, 45000));
await B.seed(BOOT(UB));
ok('B boots to the meadow', await B.nav(BASE + '?mpuid=' + UB.slice(5)) && await B.until(READY, 45000));
const NA = await A.ev(`SSNET.myName()`), NB = await B.ev(`SSNET.myName()`);
toDelete.add('names/' + await A.ev(`SSNET.nameKey(${JSON.stringify(NA)})`));
toDelete.add('names/' + await B.ev(`SSNET.nameKey(${JSON.stringify(NB)})`));
for (const u of [UA, UB]) for (const p of ['players/', 'presence/', 'devices/', 'friends/', 'recent/', 'invites/']) toDelete.add(p + u);
await A.ev(`SSNET.FR.add(${JSON.stringify(UB)}, ${JSON.stringify(NB)})`);
await sleep(1200);
ok('A stands under VERSUS', await A.tapTil(`game.scene.getScene('home').rowBtns.versus`, MENU, 20000));
ok('the social sheet opens on B\'s row', await A.tapTil(`game.scene.getScene('vsmenu').chFriendB`,
  `!!game.scene.getScene('vsmenu').frRows && game.scene.getScene('vsmenu').frRows.some((r) => r.id === ${JSON.stringify(UB)})`, 20000));
ok('the challenge lands A in the correspondence duel',
  await A.tapTil(`game.scene.getScene('vsmenu').frRows.find((r) => r.id === ${JSON.stringify(UB)}).cb`, INVB, 35000));
const CODE1 = await A.ev(`${VB}.code`);
codes.add(CODE1); toDelete.add('mp/rooms/' + CODE1);
// weave the WEAKEST word standing (a probe that needs the duel alive never
// lets the solver swing hard — the 9/9 lesson); fall to the solver only when
// no two-letter word exists on the deal
const castWeak = async (cli) => {
  if (!(await cli.until(`${VB}.isMyTurn() && ${VB}.state === 'pick'`, 25000))) return false;
  const before = await cli.ev(`((${VB}.me() || {}).casts | 0)`);
  await cli.ev(`(() => { const s = ${VB}; if (s.storyC) { s.storyDone(true); }
    let best = null;
    for (let a = 0; a < s.board.length; a++) for (let b = 0; b < s.board.length; b++) {
      if (a === b || !s.board[a] || !s.board[b]) continue;
      s.sel = [a, b];
      if (s.validWord()) { const d = s.wordDamage([s.board[a], s.board[b]]); if (!best || d < best.d) best = { sel: [a, b], d }; }
    }
    if (best) { s.sel = best.sel; s.tryCast(); return 1; }
    s.sel = []; s.demoStep(); return 0; })()`);
  return cli.until(`((${VB}.me() || {}).casts | 0) > ${before}`, 25000);
};
ok('A weaves two quiet words (the duel must outlive the probe)', await castWeak(A) && await castWeak(A));
ok('the third cast raises the REAL pick-3', await castWeak(A) && await A.until(`${VB}.state === 'sigil'`, 12000));
await sleep(600);
const offerA1 = JSON.parse(await A.ev(OFFER));
ok('three cards stand, every one a survivor (the live census)',
  offerA1.length === 3 && offerA1.every((id) => FIVE.includes(id)), offerA1.join(' '));
await A.shot('pick-live');
ok('a REAL tap takes the first card', await A.tapTil(CARD1, `${VB}.state !== 'sigil'`, 12000));
const heldA1 = JSON.parse(await A.ev(`JSON.stringify(${VB}.mySigils)`));
ok('the taken sigil is one of the offered survivors', heldA1.length === 1 && offerA1.includes(heldA1[0]), heldA1.join(' '));
const roomA = await rt('mp/rooms/' + CODE1);
ok('the seat write agrees and the play script records the pick ({g})',
  !!roomA && JSON.stringify(roomA.players[UA].sigils) === JSON.stringify(heldA1)
  && (roomA.players[UA].plays || []).some((p) => p.g === heldA1[0]));
// B claims the held seat and weaves a turn of their own
ok('B answers through ?join (the claim)', await B.nav(BASE + '?mpuid=' + UB.slice(5) + '&join=' + CODE1 + '&from=' + UA) && await B.until(INVB, 45000));
ok('B weaves two quiet words', await castWeak(B) && await castWeak(B));
ok('B\'s third cast raises B\'s pick-3', await castWeak(B) && await B.until(`${VB}.state === 'sigil'`, 12000));
await sleep(600);
const offerB1 = JSON.parse(await B.ev(OFFER));
ok('B\'s three cards are survivors too (same law, other seat)',
  offerB1.length === 3 && offerB1.every((id) => FIVE.includes(id)), offerB1.join(' '));
ok('B takes one', await B.tapTil(CARD1, `${VB}.state !== 'sigil'`, 12000));
const heldB1 = JSON.parse(await B.ev(`JSON.stringify(${VB}.mySigils)`));
const roomB = await rt('mp/rooms/' + CODE1);
ok('B\'s seat carries only survivors', heldB1.every((id) => FIVE.includes(id))
  && JSON.stringify((roomB.players[UB] || {}).sigils) === JSON.stringify(heldB1), heldB1.join(' '));
// the turn returns — A's SECOND pick must offer the pool minus the held
ok('the turn returns to A and three more quiet words raise the second pick',
  await castWeak(A) && await castWeak(A) && await castWeak(A) && await A.until(`${VB}.state === 'sigil'`, 12000));
await sleep(600);
const offerA2 = JSON.parse(await A.ev(OFFER));
ok('the second offer deals from the survivors MINUS the held (never a repeat, never an excluded)',
  offerA2.length === 3 && offerA2.every((id) => FIVE.includes(id) && !heldA1.includes(id)), offerA2.join(' '));
ok('A takes one more (two held, both survivors)', await A.tapTil(CARD1, `${VB}.state !== 'sigil'`, 12000)
  && (JSON.parse(await A.ev(`JSON.stringify(${VB}.mySigils)`))).every((id) => FIVE.includes(id)));

/* ---------- §3 THE MAGE ---------- */
console.log('— §3 THE MAGE: the bot seat obeys the same pool —');
ok('A re-enters with the seams pinned (short theater, tight busy pace)',
  await A.nav(BASE + '?mpuid=' + UA.slice(5) + '&vsfind=1500&botpace=2500,2600') && await A.until(READY, 30000));
await A.tapTil(`game.scene.getScene('home').rowBtns.versus`, MENU, 20000);
await A.tap(`game.scene.getScene('vsmenu').chWorldB`);
ok('the theater resolves to a NEAR duel (the quiet sky answers on-device)',
  await A.until(`game.scene.isActive('vsbattle') && ${VB}.near && ${VB}.state === 'pick'`, 45000));
const CODE2 = await A.ev(`${VB}.code`);
const foeUid = await A.ev(`Object.keys(SS_NEAR.room(${JSON.stringify(CODE2)}).players).find((k) => k !== ${JSON.stringify(UA)})`);
ok('A weaves the whole turn (three quiet words), the pick obeying the law en route',
  await castWeak(A) && await castWeak(A) && await castWeak(A) && await A.until(`${VB}.state === 'sigil'`, 12000)
  && JSON.parse(await A.ev(OFFER)).every((id) => FIVE.includes(id))
  && await A.tapTil(CARD1, `${VB}.state !== 'sigil'`, 12000));
ok('the mage answers a whole turn and PICKS (sigils land on its seat)', await A.until(`(() => {
  const r = SS_NEAR.room(${JSON.stringify(CODE2)}); if (!r) return false;
  const seat = (r.players || {})[${JSON.stringify(foeUid)}];
  return seat && Array.isArray(seat.sigils) && seat.sigils.length >= 1; })()`, 90000));
const mageSigs = JSON.parse(await A.ev(`JSON.stringify(((SS_NEAR.room(${JSON.stringify(CODE2)}).players || {})[${JSON.stringify(foeUid)}] || {}).sigils || [])`));
ok('every mage sigil is a survivor — a bot can never flaunt what a human could not hold',
  mageSigs.length >= 1 && mageSigs.every((id) => FIVE.includes(id)), mageSigs.join(' '));
ok('…and none is an excluded sigil (Blood Ink can never dress a fresh bot)',
  mageSigs.every((id) => !EXCLUDED.includes(id)));
const mageGs = JSON.parse(await A.ev(`JSON.stringify(((SS_NEAR.note(${JSON.stringify(CODE2)}) || {}).plays || []).filter((p) => p.g).map((p) => p.g))`));
ok('the mage\'s play script agrees ({g} entries all survivors)', mageGs.every((id) => FIVE.includes(id)), mageGs.join(' '));
await A.shot('near-duel');

// ---- the REMATCH room speaks the same law (the pick is reborn with the room)
ok('the duel forced done raises the end screen (the deferred panel stands)',
  await A.ev(`SS_NEAR.api.ref('mp/rooms/${CODE2}').update({ status: 'done', winnerUid: ${JSON.stringify(UA)}, endedAt: Date.now() }); 1`) === 1
  && await A.until(`${VB}.state === 'done' && !!${VB}.rematchB && ${VB}.rematchB.active`, 35000));
ok('REMATCH re-seals a fresh room with the mage', await A.tapTil(`${VB}.rematchB`,
  `game.scene.isActive('vsbattle') && ${VB}.code !== ${JSON.stringify(CODE2)} && ${VB}.state === 'pick'`, 35000));
ok('the rematch room\'s third cast raises the pick-3',
  await castWeak(A) && await castWeak(A) && await castWeak(A) && await A.until(`${VB}.state === 'sigil'`, 15000));
await sleep(600);
const offerR = JSON.parse(await A.ev(OFFER));
const heldR = JSON.parse(await A.ev(`JSON.stringify(${VB}.mySigils)`));
ok('every card dealt in the REMATCH room is a survivor not already held (no excluded sigil can reach any room)',
  offerR.length === 3 && offerR.every((id) => FIVE.includes(id) && !heldR.includes(id)), offerR.join(' '));

/* ---------- §4 SOLO UNTOUCHED ---------- */
console.log('— §4 SOLO: the full unlocked pool still deals, Blood Ink included —');
await L.ev(`localStorage.clear(); localStorage.setItem('beta3.profile', JSON.stringify({ runs: 9, rating: 1000 })); 'planted'`);
const BT = `game.scene.getScene('battle')`;
ok('a grandfathered profile enters a quick run',
  await L.nav(BASE + '?fps=0&quick=1') && await L.until(`!!window.game && ${BT} && ${BT}.scene.isActive() && ${BT}.state === 'pick' && ${BT}.board.filter(Boolean).length === 16`, 60000));
ok('all 24 sigils stand open to solo (the grandfather law)', await L.ev(`ssSigilOpen().length`) === 24);
const tally = JSON.parse(await L.ev(`(() => {
  const b = ${BT};
  const t = {};
  for (let k = 0; k < 200; k++) {
    b.run.sigils = [];
    for (const o of b.rollSigilOpts()) if (o) t[o.id] = (t[o.id] | 0) + 1;
  }
  b.run.sigils = [];
  return JSON.stringify(t);
})()`));
const dealt = Object.keys(tally);
ok('200 solo rolls deal only table sigils', dealt.every((id) => TABLE24.includes(id)), dealt.length + ' distinct');
ok('every excluded BASIC still deals in solo (salve aegis first hush comet shield leech gilded)',
  EX_BASICS.every((id) => tally[id] > 0), EX_BASICS.map((id) => id + ':' + (tally[id] | 0)).join(' '));
ok('BLOOD INK still deals in solo — the exclusion never left the duel', (tally.blood | 0) > 0, 'blood ×' + (tally.blood | 0));
ok('the legendary tier still deals', LEGS.some((id) => (tally[id] | 0) > 0), LEGS.map((id) => id + ':' + (tally[id] | 0)).join(' '));

/* ---------- CLEANUP ---------- */
console.log('— CLEANUP —');
const rooms = (await rt('mp/rooms')) || {};
for (const [k, r] of Object.entries(rooms)) {
  if (!r) continue;
  if (/^test_vg[ab]/.test(r.hostUid || '') || codes.has(k)) await rtDel('mp/rooms/' + k);
}
for (const p of toDelete) await rtDel(p);
let left = 0; const leftNames = [];
for (const p of toDelete) if ((await rt(p)) !== null) { left++; leftNames.push(p); }
ok('every registry row this run wrote is gone', left === 0, leftNames.join(' '));
ok('zero page exceptions across all three clients', errs.length === 0, errs.slice(0, 3).join(' · '));

console.log('\nRESULT ' + pass + '/' + (pass + fail) + (fail ? '  ✗ ' + fail + ' FAILED' : '  — all green'));
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
