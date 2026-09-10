// FTUE-CHECK — the first open: a wordless rise and the friendly finger (v0.75.0).
// Skylar (9/2): "FIRST TIME YOU OPEN THE GAME — The game needs to open up
// with its default Starspell logo and general main menu screen, except with
// no UI. Then it needs to flow upwards just like it does when you start a
// new campaign. However there are no UI prompts for which Horoscope to pick
// instead. You are just transported up and put into a game. The game you're
// put into will start with curated letters. The curated letters will have a
// friendly finger … that will show you how to push each button. After you
// push in a word, whether you pushed in the word that the tutorial wants
// you to push in or whatever word you pushed in, when the Cast button lines
// up, the hand will move over to the Cast and animate as pushing in at the
// Cast button."
// The game side: `prof.ftue` is decided ONCE in SS.load (the grandfather
// law — any stored profile, any recorded play, or a device the game has run
// on before closes it forever) and drops at the first game's end by any
// door (endRun win/loss, goHome abandon). The gated boot builds a BARE
// meadow (buildMeadowUi's ftueBare: scene + wordmark, zero interactive
// chrome), plays the default cinematic over it, and rises by itself into an
// unsigned QUICK run (ftueOpen/ftueRise). The first fight's opening deal is
// the language's authored SS_FTUE board (data.js, five packs); the finger
// (art/hand.webp, cut by make-hand-asset.py, anchored by its fingertip,
// never interactive) walks the target word letter by letter, backs off when
// the player wanders, glides to CAST when ANY woven word stands valid, and
// retires on the player's first real cast. The return home restarts the
// meadow with its full chrome (Home.onWake's ftueBare seam) and every later
// open is the standard experience.
// Self-launching like endless-check: serves beta3 on :8899 if nothing does,
// headless Chrome on :9473 (/tmp/cdp-ftue wiped first, --disable-gpu),
// Firebase blocked at the network layer throughout (local sky, no litter).
//
//   perl -e 'alarm 580; exec @ARGV' node tools/ftue-check.mjs   # ~6 min
//
import { spawn, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
const PORT = 9473, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= §1 THE DEALS ON PAPER (no browser) ================= */
console.log('— §1 the deals on paper —');
const gameSrc = readFileSync('game.js', 'utf8');
const dataSrc = readFileSync('data.js', 'utf8');
const packSrc = readFileSync('packs.js', 'utf8');
const dict = (f, feed) => {
  const s = readFileSync(f, 'utf8');
  const m = feed ? s.match(/feed\((?:'|")[a-z]+(?:'|"),\s*(?:'|")([^'"]+)/) : s.match(/STARSPELL_WORDS\s*=\s*(?:'|")([^'"]+)/);
  return new Set(m[1].split(' '));
};
const DICTS = { en: dict('words.js'), es: dict('words-es.js', 1), fr: dict('words-fr.js', 1), pt: dict('words-pt.js', 1), de: dict('words-de.js', 1) };
const FTUE = eval('(' + dataSrc.match(/const SS_FTUE = (\{[\s\S]*?\n\});/)[1] + ')');
const PACKS = eval('(' + packSrc.match(/const SS_PACKS = (\{[\s\S]*?\n\});/)[1] + ')');
ok('SS_FTUE authors exactly the five shipping packs', JSON.stringify(Object.keys(FTUE).sort()) === JSON.stringify(['de', 'en', 'es', 'fr', 'pt']));
for (const [lang, d] of Object.entries(FTUE)) {
  const bag = PACKS[lang].bag, vset = PACKS[lang].vowels;
  const probs = [];
  if (d.board.length !== 16) probs.push('board ' + d.board.length + ' tiles');
  for (const t of d.board) if (!bag[t]) probs.push('tile "' + t + '" not in the ' + lang + ' bag');
  const vow = d.board.filter((t) => vset.includes(t[0])).length;
  if (vow < 5) probs.push('only ' + vow + ' vowels');
  // the target's tiles must be on the board with multiplicity
  const pool = [...d.board];
  for (const t of d.word) { const i = pool.indexOf(t); if (i < 0) probs.push('target tile "' + t + '" missing'); else pool.splice(i, 1); }
  const w = d.word.join('');
  const letters = d.word.reduce((a, t) => a + t.length, 0);
  if (letters < 3 || letters > 8) probs.push('target length ' + letters);
  if (!DICTS[lang].has(w)) probs.push('"' + w + '" not in the ' + lang + ' dictionary');
  ok(lang + ': 16 legal tiles, ' + vow + ' vowels, target "' + w + '" on board and in the dictionary', probs.length === 0, probs.join(' · '));
}
ok('the es board teaches a digraph tile', FTUE.es.board.some((t) => ['ch', 'll', 'rr'].includes(t)));
const gate = (gameSrc.match(/const ftue = [\s\S]*?&& !deep && !bypassed;/) || [''])[0];
ok('the gate excludes every door from the source', !!gate
  && ['!entry', '!DEMO', "'vsdemo'", "'frdemo'", "'botduel'", "'daily'", "'quick'", "'endless'", "'lab'", "'mpuid'", '!deep', '!bypassed'].every((t) => gate.includes(t)),
  'gate len ' + gate.length);
let handBytes = 0; try { handBytes = statSync('art/hand.webp').size; } catch (e) { }
ok('art/hand.webp shipped and small', handBytes > 2000 && handBytes < 60000, handBytes + 'B');
const buildV = (gameSrc.match(/const BUILD = 'STARSPELL v([\d.]+)'/) || [])[1];
const html = readFileSync('index.html', 'utf8');
ok('the release ritual held (BUILD ' + buildV + ' on every ?v= stamp)', !!buildV && !html.match(new RegExp('\\?v=(?!' + buildV.replace(/\./g, '\\.') + ')[\\d.]+')));

/* ================= server + browser ================= */
try { execSync('rm -rf /tmp/cdp-ftue'); } catch (e) { }
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-ftue', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
await send('Runtime.enable'); await send('Page.enable');
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Network.setBlockedURLs', { urls: ['*firebaseio.com*', '*firebasedatabase.app*', '*firebase*', '*gstatic.com*'] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: 'navigator.share = undefined;' });
const ev = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r?.result?.value;
};
const until = async (e, cap = 45000, step = 300) => {
  for (let i = 0; i < cap / step; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(step); }
  return false;
};
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
const tapUntil = async (expr, cond, tries = 6) => {
  for (let t = 0; t < tries; t++) {
    try { await tap(expr); } catch (e) { }
    await sleep(650);
    try { if (await ev(cond) === true) return true; } catch (e) { }
  }
  return false;
};
const shot = async (name) => {
  if (!SHOTS) return;
  try {
    mkdirSync(SHOTS, { recursive: true });
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(SHOTS + '/' + name + '.png', Buffer.from(r.data, 'base64'));
  } catch (e) { }
};
const B = `game.scene.getScene('battle')`;
const H = `game.scene.getScene('home')`;
const PICK = `!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`;
// the FULL meadow: doors, chips, footer — what a bare open must not
// have (the rating pill left the meadow in v0.78.0: the chip stands alone,
// so full chrome is now proven by the chip and never the pill; the streak
// lantern left the meadow in v0.86.0 and must stay gone on BOTH meadows;
// the footer's three targets folded into the one settings gear in v0.96.0
// — full chrome carries setB, and muteB/langB must stay gone everywhere)
const CHROME_FULL = `!!window.game && ${H} && ${H}.sys.isActive() && !!${H}.menuRows && ${H}.menuRows.length >= 3
  && !!${H}.dailyChipB && !${H}.lanternB && !!${H}.setB && !${H}.langB && !${H}.muteB && !!${H}.profileChip && !${H}.ratingPill`;
// wipe = a genuinely-first device: every key gone (starspellUid included)
const wipe = async (seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(400);
  await ev(`localStorage.clear(); sessionStorage.clear(); ${seed || ''} 'ok'`);
};
const boot = async (q) => {
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') });
  await until(`window.__ssftue !== undefined`, 20000, 150);
};
const interactiveChrome = () => ev(`(() => { const h = ${H}; if (!h || !h.sys.isActive()) return -1; let n = 0;
  const scan = (ls) => ls.forEach((o) => { if (o.input && o.input.enabled) n++; if (o.list) scan(o.list); });
  scan(h.children.list); return n })()`);
// fell the standing beast through the REAL death path (the proven helper)
const fell = async () => {
  await until(`!!${B} && !${B}.dying && ${B}.state === 'pick'`, 25000, 250);
  const armed = await ev(`(() => { const b = ${B}; if (b.dying) return 'busy';
    b.beast.hpNow = -1; b.dying = true; b.beastDeath(); return 'ok' })()`);
  if (armed !== 'ok') return 'lost';
  const landed = await until(`(${B}.state === 'sigil' && ${B}.overlayC.list.some((o) => o.getData && o.getData('sigilCard') && o.alpha === 1))
    || ${B}.state === 'upgrade' || ${B}.state === 'end' || (${B}.state === 'pick' && !${B}.dying)`, 30000, 250);
  if (!landed) return 'lost';
  return ev(`${B}.state`);
};
const takeCard = async () => {
  for (let t = 0; t < 6; t++) {
    await tap(`(() => { let r = null; const scan = (ls) => ls.forEach((o) => { if (!r && o.getData && o.getData('sigilCard')) r = o; if (o.list) scan(o.list); }); scan(${B}.overlayC.list); return r })()`);
    await sleep(450);
    if (await ev(`${B}.state !== 'sigil' && ${B}.state !== 'upgrade'`)) return true;
  }
  return ev(`${B}.state !== 'sigil' && ${B}.state !== 'upgrade'`);
};

/* ================= §2 THE FIRST OPEN ================= */
console.log('— §2 the wordless first open —');
await wipe();
await boot();
ok('a genuinely-first boot arms the flow', await ev(`window.__ssftue.on === true`) === true);
const chromeDuringOpen = await interactiveChrome();
ok('the open is wordless: ZERO interactive chrome on the meadow', chromeDuringOpen === 0, 'count ' + chromeDuringOpen);
ok('no doors, chips or footer exist at all', await ev(`(() => { const h = ${H};
  return !h.menuRows && !h.dailyChipB && !h.lanternB && !h.setB && !h.langB && !h.muteB && !h.profileChip })()`) === true);
ok('the wordmark stands (logo + meadow, nothing else)', await ev(`(() => { const h = ${H}; return !!h.titleT && h.titleT.active })()`) === true);
ok('the first-open decision is already written down', await ev(`JSON.parse(localStorage.getItem('beta3.profile')).ftue === 0`) === true);
await shot('open');
ok('the default cinematic played this open', await ev(`typeof window.__ssintro === 'string'`) === true);
ok('the rise comes by itself — a battle with NO tap asked', await until(PICK, 40000));
ok('no horoscope was ever asked: no picker, an unsigned quick game', await ev(`(() => { const h = ${H}, b = ${B};
  return h.signC === null && b.mode === 'quick' && b.sign === null && b.ftue === true })()`) === true);

/* ================= §3 THE CURATED BOARD ================= */
console.log('— §3 the curated board —');
const enDeal = FTUE.en.board.join(' ');
ok('the opening deal is the authored English board, tile for tile',
  await ev(`${B}.board.map((s) => s.ch).join(' ')`) === enDeal);
ok('all sixteen are plain glass (no bonus tiles, nothing inked)',
  await ev(`${B}.board.every((s) => s.tier === 0 && !s.blk)`) === true);
ok('the beacon speaks the target', await ev(`window.__ssftue.word`) === 'star');

/* ================= §4 THE FRIENDLY FINGER ================= */
console.log('— §4 the friendly finger —');
ok('the finger rises pointing at the first letter (S)', await until(`window.__ssftue.point === 'slot:9'`, 15000));
ok('it can never block a tap (no input) and floats above the board',
  await ev(`(() => { const h = ${B}.ftueHand; return !!h && !h.input && h.depth === 62 && h.alpha > 0.5 })()`) === true);
ok('the tip rests OFF the letter it points at', await ev(`(() => { const b = ${B}, h = b.ftueHand;
  return Math.abs(h.x - b.slotPos(9).x) >= b.tileSize * 0.22 })()`) === true);   // 0.22: the push animation dips the tip inward
await shot('hand-first');
// the player wanders: a letter off the road — the finger backs away, waits
ok('a wandering tap is welcomed: the finger backs off and waits',
  await tapUntil(`${B}.board[5].c`, `window.__ssftue.point === 'wait' && ${B}.sel.length === 1`));
ok('…visibly faded, still present', await until(`(() => { const h = ${B}.ftueHand; return !!h && h.alpha <= 0.6 })()`, 8000));
ok('undoing the wander brings the finger back to the road',
  await tapUntil(`${B}.board[5].c`, `window.__ssftue.point === 'slot:9' && ${B}.sel.length === 0`));
// the walk: S → T → A → R, the player performing every real tap
ok('S taken — the finger glides to T', await tapUntil(`${B}.board[9].c`, `window.__ssftue.point === 'slot:7' && ${B}.sel.length === 1`));
ok('the right half is pointed at from the left (mirrored, room on every phone)',
  await ev(`(() => { const h = ${B}.ftueHand; return h.flipX === true && h.x < ${B}.slotPos(7).x })()`) === true);
ok('T taken — the finger glides to A', await tapUntil(`${B}.board[7].c`, `window.__ssftue.point === 'slot:4' && ${B}.sel.length === 2`));
ok('A taken — the finger glides to R', await tapUntil(`${B}.board[4].c`, `window.__ssftue.point === 'slot:0' && ${B}.sel.length === 3`));
await shot('hand-walk');
ok('the word stands — the finger moves to CAST and pushes',
  await tapUntil(`${B}.board[0].c`, `window.__ssftue.point === 'cast' && ${B}.sel.length === 4`));
ok('CAST is lit with its damage preview', await ev(`/^CAST \\d+$/.test(${B}.castT.text)`) === true);
await shot('hand-cast');
ok('the player casts — for real', await tapUntil(`${B}.castB`, `${B}.run.words === 1`));
ok('its lessons taught, the finger bows out for good',
  await until(`${B}.ftueHand === null && window.__ssftue.state === 'done'`, 10000));
await sleep(1600);
ok('…and never returns after the refill', await ev(`${B}.ftueHand === null && ${B}.ftueGone === true`) === true);

/* ================= §5 COMPLETION & GRADUATION ================= */
console.log('— §5 the first game runs to its end —');
let state = '', guard = 0;
while (state !== 'end' && guard++ < 9) {
  state = await fell();
  if (state === 'sigil' || state === 'upgrade') { await takeCard(); state = await ev(`${B}.state`); }
  if (state === 'lost') break;
}
ok('the run reaches its end screen (' + guard + ' fells)', state === 'end');
ok('the first game completed: the flag is down forever',
  await ev(`SS.prof.ftue === 1 && JSON.parse(localStorage.getItem('beta3.profile')).ftue === 1`) === true);
ok('HOME lands on the STANDARD meadow — full chrome', await tapUntil(
  `(() => { let r = null; const scan = (ls) => ls.forEach((o) => { if (!r && o.text === 'HOME') r = o; if (o.list) scan(o.list); }); scan(${B}.overlayC.list); return r })()`,
  CHROME_FULL, 10));
ok('the woken meadow is the graduate\'s: gate off, doors live', await ev(`window.__ssftue.on === false
  && ${H}.rowBtns.newcamp.visible && !${H}.ftueBare`) === true);
await shot('graduated');

/* ================= §6 EVERY LATER OPEN IS STANDARD ================= */
console.log('— §6 every later open is standard —');
await send('Page.navigate', { url: BASE + '?fps=0' });
await until(`window.__ssftue !== undefined`, 20000, 150);
ok('the second open: standard cinematic, no first-open flow', await ev(`window.__ssftue.on === false && typeof window.__ssintro === 'string'`) === true);
ok('…onto the full meadow', await until(CHROME_FULL, 30000));
await sleep(4500);
ok('…and nobody is transported anywhere', await ev(`!${B} || !${B}.scene.isActive()`) === true);

/* ================= §7 MID-TUTORIAL SANITY ================= */
console.log('— §7 a reload or an abandon mid-tutorial —');
await wipe();
await boot();
ok('fresh again: the flow arms', await ev(`window.__ssftue.on === true`) === true);
ok('…and reaches the board', await until(PICK, 40000));
await send('Page.navigate', { url: BASE + '?fps=0' });
await until(`window.__ssftue !== undefined`, 20000, 150);
ok('a reload mid-tutorial lands sanely: the ride simply replays', await ev(`window.__ssftue.on === true`) === true);
ok('…back to the curated board', await until(PICK, 40000)
  && await ev(`${B}.board.map((s) => s.ch).join(' ')`) === enDeal);
ok('the back-arrow abandon graduates too: full meadow, flag down',
  await tapUntil(`${B}.homeB`, CHROME_FULL, 8)
  && await ev(`SS.prof.ftue === 1 && window.__ssftue.on === false`) === true);

/* ================= §8 WHO NEVER SEES IT ================= */
console.log('— §8 who never sees it —');
await wipe(`localStorage.setItem('beta3.profile', JSON.stringify({ runs: 3 }));`);
await boot();
ok('a profile with prior play never meets the flow', await ev(`window.__ssftue.on === false`) === true
  && await until(CHROME_FULL, 30000));
ok('…its flag written 1 on sight', await ev(`JSON.parse(localStorage.getItem('beta3.profile')).ftue === 1`) === true);
await wipe(`localStorage.setItem('starspellUid', 'u_seen_before');`);
await boot();
ok('a device the game has run on (keychain uid, no profile) never meets it',
  await ev(`window.__ssftue.on === false && JSON.parse(localStorage.getItem('beta3.profile')).ftue === 1`) === true);
await wipe(`sessionStorage.setItem('beta3.skipIntro', '1');`);
await boot();
ok('the language-sheet reload (skipIntro) bypasses it', await ev(`window.__ssftue.on === false`) === true
  && await until(CHROME_FULL, 30000));
await wipe();
await boot('ftue=0');
ok('?ftue=0 stands the flow down', await ev(`window.__ssftue.on === false`) === true);
await wipe(`localStorage.setItem('beta3.profile', JSON.stringify({ runs: 3 }));`);
await boot('ftue=1');
ok('?ftue=1 forces it (the dev seam) — even on a grown profile', await ev(`window.__ssftue.on === true`) === true
  && await until(PICK, 40000) && await ev(`${B}.ftue === true`) === true);

/* ================= §9 THE OTHER DOORS ================= */
console.log('— §9 every other door bypasses it —');
const door = async (q, name, cond) => {
  await wipe();
  await boot(q);
  const off = await ev(`window.__ssftue.on === false`);
  const extra = cond ? await until(cond, 30000) : true;
  ok(name, off === true && extra === true);
};
await door('demo=1', '?demo=1 — the solver, no flow', `!!${B} && ${B}.scene.isActive() && ${B}.ftue === false`);
await door('quick=1', '?quick=1 — a plain quick run, RANDOM deal', `!!${B} && ${B}.scene.isActive() && ${B}.mode === 'quick' && ${B}.ftue === false`);
await door('daily=1', '?daily=1 — the hunt, no flow', `!!${B} && ${B}.scene.isActive() && ${B}.mode === 'daily'`);
// a VIRGIN ?endless=1 boot has always been intro-swallowed (the old intro
// gate never excluded it; the delayed startMode meets busy() — every real
// endless-check boot seeds skipIntro): the ftue law here is only that the
// flow stands down and the STANDARD meadow arrives, not the door's own
// function (endless-check owns that, under its skipIntro boots)
await door('endless=1', '?endless=1 — no flow, the standard meadow stands', CHROME_FULL + ` && (!${B} || !${B}.scene.isActive() || ${B}.ftue === false)`);
await door('vsdemo=1', '?vsdemo=1 — versus, no flow', `game.scene.isActive('vsmenu')`);
await door('frdemo=invite', '?frdemo=invite — the lobby recipe, no flow', `game.scene.isActive('vsmenu')`);
await door('botduel=1000', '?botduel — the rival seam, no flow', null);
await door('join=ZZZZ&from=u_test', 'a ?join deep link, no flow', null);
await door('mpuid=ftx', 'a ?mpuid test identity, no flow', null);
await wipe();
await send('Page.navigate', { url: BASE + '?fps=0&lab=1' }); await sleep(4000);
ok('?lab=1 — lab.js owns boot, the flow never wakes', await ev(`window.__ssftue === undefined`) === true);

/* ================= §10 THE SPANISH BOARD (digraphs) ================= */
console.log('— §10 the Spanish board —');
await wipe(`localStorage.setItem('beta3.lang', 'es');`);
await boot();
ok('a Spanish device meets the flow in Spanish', await ev(`window.__ssftue.on === true`) === true);
ok('…and lands on the authored es board', await until(PICK, 40000)
  && await ev(`${B}.board.map((s) => s.ch).join(' ')`) === FTUE.es.board.join(' '));
ok('the RR digraph is dealt as ONE tile', await ev(`${B}.board[6].ch === 'rr' && ${B}.board.filter(Boolean).length === 16`) === true);
ok('the target lives in the Spanish dictionary the battle plays', await ev(`WORDSET.has('luna') && PACK.lang === 'es'`) === true);
ok('the finger walks LUNA: L', await until(`window.__ssftue.point === 'slot:2'`, 15000)
  && await tapUntil(`${B}.board[2].c`, `window.__ssftue.point === 'slot:8' && ${B}.sel.length === 1`));
ok('…U then N', await tapUntil(`${B}.board[8].c`, `window.__ssftue.point === 'slot:4' && ${B}.sel.length === 2`)
  && await tapUntil(`${B}.board[4].c`, `window.__ssftue.point === 'slot:5' && ${B}.sel.length === 3`));
ok('…A — and the finger pushes at CAST', await tapUntil(`${B}.board[5].c`, `window.__ssftue.point === 'cast' && ${B}.sel.length === 4`));
ok('the Spanish first word casts for real', await tapUntil(`${B}.castB`, `${B}.run.words === 1`));
await shot('es-cast');

/* ================= the ledger ================= */
if (errs.length) { console.log('PAGE EXCEPTIONS:'); errs.slice(0, 12).forEach((e) => console.log('  ' + e)); }
ok('zero page exceptions', errs.length === 0, errs.length ? errs[0] : '');
console.log('\n' + pass + ' passed · ' + fail + ' failed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
