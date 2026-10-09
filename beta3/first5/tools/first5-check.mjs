// FIRST5-CHECK — the stage (batch ss-2026-10-07-first-night, card 01;
// + fix round ss-2026-10-08-first5-fixes cards 01 THE CLEAN REFRESH,
// 02 THE STRAY SIGNS and 03 THE SCRY LESSON; + ss-2026-10-09-night-sky-live
// card 03 STRAIGHT INTO THE NIGHT).
//
// STRAIGHT INTO THE NIGHT (10/9, F5-STRAIGHT seams): the first open never
// comes down to the grass — the title STANDS at the zenith, the lure asks
// there, and the tap resumes the shipped rise from the frame the title is
// already on (one transition: title → fight 1). Proven by a page-side TRACE
// installed at document start (min camera p over the open, the meadow
// chrome's max alpha, the grass grain, the beacon walk), on the fallback
// auto-rise (§2), under reduce-motion (§2a2) and on the REAL lure tap (§2b,
// with the DPR-3 capture pair in tools/shots-straight/ — untracked, never
// committed). With the night still OWED a carried reopen stands at the
// title and draws no kept marks; the morning-after meadow (night DONE)
// still wears them.
//
// Card 03 (F5-FIX1-03): the SCRY prompt is a forced two-beat lesson now —
// at the stall the screen grays out and ONLY the scry button answers
// (real-click proven: tiles, CAST and the back door are inert under the
// veil); the tap scries as normal, then the strikes pill rises above the
// veil and the count steps down in the light before the cost line speaks;
// the gate lifts, play resumes, and the lesson never takes the hand twice
// (SS.prof.f5scry). §2/§3b pre-seed that flag so the older sections keep
// testing THEIR cards; §3b2 clears it and stalls honestly.
// Run against the PUBLISHED page with F5BASE=https://drbango.com/beta3/first5/index.html
// Proves the first5 sandbox is a true first night that cannot touch live
// beta3: static seams (script order, no Firebase, repointed shared assets),
// then live boots in headless Chrome at DPR 3 — fresh first open with the
// FTUE gate open, storage fully namespaced 'first5.', a ?demo=1 solver run
// that actually plays, THE CLEAN REFRESH law (a player refresh wipes the
// night; the game's own scripted reloads — proven through the REAL versus
// retry door — carry it via the one-shot __f5survive flag), ?reset=1
// still honored, out-ranking even a survive flag, and THE STRAY SIGNS law
// (F5-FIX1-02: the quick fight view owns NO standing kept marks — not at
// boot, not across fells — proven by object census, a DPR-3 screenshot and
// a pixel probe at the circled seat, while the rite, the ledger and the
// meadow's morning-after sky all still light).
//
// Serves the REPO ROOT (first5 reaches ../vendor, ../words.js, ../art) on
// :8901 if nothing does — NOT the standing :8899 beta3 server, which roots
// at beta3/ and cannot serve ../. Chrome on :9476, /tmp/cdp-first5 wiped.
//
//   cd beta3/first5 && perl -e 'alarm 1500; exec @ARGV' node tools/first5-check.mjs
//
import { spawn, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const PORT = 9476, SRV = 8901;
// the standing-marks census: every ssF5DrawMini item carries a 'f5mark'
// data tag (F5-FIX1-02), so "the fight view is clean" is one honest count
const CENSUS = (key) => "(()=>{try{const s=game.scene.getScene('" + key + "');if(!s||!s.scene.isActive())return 'inactive';return s.children.list.filter(o=>o.active&&o.getData&&o.getData('f5mark')).length}catch(e){return 'err:'+e.message}})()";
const BASE = process.env.F5BASE || ('http://localhost:' + SRV + '/beta3/first5/index.html');
const ROOT = '../..'; // repo root, relative to first5/ where this runs
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= §1 the seams on paper ================= */
console.log('— §1 the seams on paper —');
const html = readFileSync('index.html', 'utf8');
const shim = readFileSync('first5.js', 'utf8');
const gameSrc = readFileSync('game.js', 'utf8');
const packSrc = readFileSync('packs.js', 'utf8');

const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
ok('first5.js is the FIRST script', scripts[0] && scripts[0].startsWith('first5.js'));
ok('compat.js rides second (Safari canvas law)', scripts[1] && scripts[1].startsWith('compat.js'));
ok('NO Firebase SDK anywhere (local mode by construction)', !html.includes('firebase'));
ok('phaser + words.js shared from ../', scripts.some((s) => s === '../vendor/phaser.min.js') && scripts.some((s) => s.startsWith('../words.js?v=')));
ok('every local copy stamps ?v=f5-*', scripts.filter((s) => !s.startsWith('../') && !s.includes('phaser')).every((s) => /\?v=f5-[\d.]+$/.test(s)));
const stamps = new Set(scripts.map((s) => (s.match(/\?v=(f5-[\d.]+)/) || [])[1]).filter(Boolean));
ok('one f5 stamp on every copy (release ritual)', stamps.size === 1, [...stamps].join());
ok('shim prefixes get/set/remove on Storage.prototype', ['getItem', 'setItem', 'removeItem'].every((m) => shim.includes('P.' + m)));
ok('shim handles ?reset=1 and scrubs it from the URL', shim.includes("searchParams.delete('reset')"));
/* — F5-FIX1-01 THE CLEAN REFRESH seams — */
const versusSrc = readFileSync('versus.js', 'utf8');
ok('shim: the survive hook stands for scripted reloads', shim.includes('window.__f5survive'));
ok('shim: wipe is the DEFAULT — no flag, no survival', shim.includes('reset || !survive'));
ok('shim: the SANDBOX-ONLY law is written loud (never integrate the wipe)', shim.includes('SANDBOX-ONLY LAW') && shim.includes('NEVER wipe on'));
const sites = [];
for (const [f, src] of [['first5.js', shim], ['compat.js', readFileSync('compat.js', 'utf8')], ['strings.js', readFileSync('strings.js', 'utf8')], ['packs.js', packSrc], ['data.js', readFileSync('data.js', 'utf8')], ['seed-names.js', readFileSync('seed-names.js', 'utf8')], ['net.js', readFileSync('net.js', 'utf8')], ['audio.js', readFileSync('audio.js', 'utf8')], ['game.js', gameSrc], ['versus.js', versusSrc], ['rival.js', readFileSync('rival.js', 'utf8')]]) {
  const re = /location\.(reload|replace)\(/g; let m;
  while ((m = re.exec(src))) sites.push(f + ':' + src.slice(0, m.index).split('\n').length + (src.slice(Math.max(0, m.index - 340), m.index).includes('__f5survive') ? '✓' : '✗'));
}
ok('every scripted reload announces itself first (ground-truthed, 3 sites)', sites.length === 3 && sites.every((s) => s.endsWith('✓')), sites.join(' '));
ok('F5-FIX1-01 seams tagged at every site (2 in game.js, 1 in versus.js)', (gameSrc.match(/F5-FIX1-01/g) || []).length === 2 && (versusSrc.match(/F5-FIX1-01/g) || []).length === 1);
/* — F5-FIX1-02 THE STRAY SIGNS seams — */
ok('the stray-sign law: the battle no longer draws the kept sky at boot', !/'quick'\) ssF5DrawLitSky/.test(gameSrc) && !gameSrc.includes('the battle wears the kept sky'));
ok('…the meadow keeps its one draw (the morning-after proof)', (gameSrc.match(/ssF5DrawLitSky\(this\)/g) || []).length === 1 && gameSrc.includes('the meadow wears the kept sky'));
ok('F5-FIX1-02 seams: six tagged sites, the tracked sweep, the census tag', (gameSrc.match(/F5-FIX1-02/g) || []).length === 6 && (gameSrc.match(/f5ClearSeatMarks\(\)/g) || []).length === 3 && (gameSrc.match(/setData\('f5mark'/g) || []).length === 2);
ok("game.js art repointed to ../art (2 sites)", (gameSrc.match(/im\.src = '\.\.\/art\//g) || []).length === 2 && !/im\.src = 'art\//.test(gameSrc));
ok('packs.js dictionary writes ../words-<lang>.js', packSrc.includes('src="../words-'));
for (let n = 1; n <= 7; n++) ok('F5-GRAFT-' + n + ' seam present in game.js', gameSrc.includes('F5-GRAFT-' + n));
ok('F5-CARD-06 seams: seats, the rite, the ledger, the kept sky', ['SS_F5_SEATS', 'f5LightSky(', 'f5Ledger(', 'ssF5DrawLitSky(', 'returns to the sky'].every((t) => gameSrc.includes(t)));
ok('F5-CARD-05 seams: prompt table + five triggers', ['SS_F5_PROMPTS', 'ssF5Prompt(', 'f5InkTaught', 'THE PLANTED GLOW'].every((t) => gameSrc.includes(t)) && (gameSrc.match(/F5-CARD-05/g) || []).length >= 6);
ok('the en prompt table carries all five lessons', ['tile1', 'tile2', 'tile3', 'ink', 'scry'].every((k) => new RegExp(k + ':').test(gameSrc.slice(gameSrc.indexOf('SS_F5_PROMPTS'), gameSrc.indexOf('SS_F5_PROMPTS') + 900))));
ok('F5-CARD-04 seams: the rig, the kind bag, the beats, the ember tune', ['SS_F5_RIG', 'SS_F5_FLOOR', 'SS_F5_EMBER_MULT', 'f5Kind(', 'f5CastBeats(', 'f5StarWrite(', 'f5Encore('].every((t) => gameSrc.includes(t)));
/* — F5-FIX1-03 THE SCRY LESSON seams — */
ok("the gate line is Skylar's, verbatim — the footnote tail is gone", gameSrc.includes("scry: 'Stuck? SCRY deals a fresh board',") && !gameSrc.includes('the beast still counts it'));
ok('…and the cost line, verbatim', gameSrc.includes("scryCost: 'Using SCRY makes the beast attack one turn earlier',"));
ok('F5-FIX1-03 seams: seven tagged sites', (gameSrc.match(/F5-FIX1-03/g) || []).length === 7, String((gameSrc.match(/F5-FIX1-03/g) || []).length));
ok('the three beats stand: gate up / tap / gate down, and the pill hold', ['f5ScryGateUp()', 'f5ScryTap()', 'f5ScryGateDown(', 'this.f5PillHold = 1'].every((t) => gameSrc.includes(t)) && gameSrc.includes('if (!this.f5PillHold) {'));
ok('once a night: SS.prof.f5scry written at the tap', gameSrc.includes('SS.prof.f5scry = 1'));
ok('the stall family yields while the gate stands', gameSrc.includes('&& !this.f5ScryGate'));
ok('one prompt frame speaks for ribbon and gate alike', gameSrc.includes('function ssF5Frame(') && gameSrc.includes('ssF5Frame(scene, str).setDepth(950)'));
/* — STRAIGHT INTO THE NIGHT (10/9) seams — */
const audioSrc = readFileSync('audio.js', 'utf8');
ok('straight seams: seventeen tagged sites in game.js, the riser takes a length in audio.js', (gameSrc.match(/F5-STRAIGHT/g) || []).length === 17 && audioSrc.includes('riser(dur)') && audioSrc.includes('const d = dur || 2.3'), String((gameSrc.match(/F5-STRAIGHT/g) || []).length));
ok('the first open STANDS at its landing; every other boot still settles (the descent kept for them)', gameSrc.includes('this.f5Straight ? stand(false) : settle(1000, false)') && gameSrc.includes('if (this.f5Straight) { stand(true); return; }') && gameSrc.includes("window.__ssintro = 'stands'"));
ok('the lean RESUMES the shipped rise from the standing frame (no second curve)', gameSrc.includes('function ssF5LeanFrom(') && gameSrc.includes('this.ascentStart -= this.f5Lean.from; this.lastP = this.introP;') && gameSrc.includes('this.f5Lean = { from: ssF5LeanFrom(this.introP) }; this.f5LeanTitle();'));
ok('the riser is sized to the lean; the word comes apart where it stands', gameSrc.includes('SFX.riser(this.f5Lean ? SS_F5_LEAN_RISER_S : undefined)') && gameSrc.includes('function ssF5Stardust(') && gameSrc.includes('ssF5Stardust(this, t.getBounds(), 46)'));
ok('the title night draws no kept marks; the morning-after meadow keeps its draw; no crickets at the zenith', gameSrc.includes('if (!this.f5Straight) ssF5DrawLitSky(this);') && gameSrc.includes('if (!this.introPlaying && !this.f5Straight'));
ok('the straight state dies with the open (stale-ref law)', gameSrc.includes('this.f5Straight = false; this.f5TitleFx = null; this.f5Lean = null;'));
ok('the lure stands at the title: scroll-fixed firefly + rings, the f5lure census tag; reduce-motion and the restart stand there too', gameSrc.includes("setData('f5lure', 1)") && gameSrc.includes('if (zen) fly.setScrollFactor(0);') && gameSrc.includes('if (zen) ring.setScrollFactor(0);') && gameSrc.includes('if (this.f5Straight) this.f5StandTitle(l);') && gameSrc.includes('else { this.buildMeadowUi(l); this.f5StandTitle(l); }'));
const BUILD = (gameSrc.match(/const BUILD = '([^']+)'/) || [])[1];
ok('game.js copy carries a BUILD', !!BUILD, BUILD);
try {
  const liveBuild = (readFileSync('../game.js', 'utf8').match(/const BUILD = '([^']+)'/) || [])[1];
  console.log('  i  live beta3 is ' + liveBuild + ' — first5 copy is ' + BUILD + (liveBuild === BUILD ? ' (in step)' : ' (DRIFTED — re-seed when the batch integrates)'));
} catch (e) { }

/* ================= server + browser ================= */
try { execSync('rm -rf /tmp/cdp-first5'); } catch (e) { }
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: ROOT, stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
if (!(await serving())) { console.log('cannot serve repo root on :' + SRV); process.exit(2); }
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--mute-audio', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-first5', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
let list = null;
for (let i = 0; i < 60 && !list; i++) { try { list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); } catch (e) { await sleep(500); } }
if (!list) { console.log('no Chrome on :' + PORT); process.exit(2); }
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || '').split('\n')[0]);
};
const send = (method, params) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r?.result?.value; };
const evp = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r?.result?.value; };
await new Promise((r) => { ws.onopen = r; });
await send('Runtime.enable', {});
await send('Page.enable', {});
/* STRAIGHT INTO THE NIGHT: a page-side trace, installed at document start so
   it sees the whole open — the lowest camera p the home scene ever showed
   (0 = meadow, 1 = zenith; the title stands at 0.92), the meadow chrome's
   highest alpha, how often the grass grain was visible, and the beacon walk.
   The home scene sleeps under the battle, so the trace stops at the fight. */
await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__f5trace = { minP: 9, maxUi: 0, grain: 0, n: 0, states: [], intro: [] };
setInterval(() => { try {
  const t = window.__f5trace, g = window.game; if (!g || !g.scene) return;
  const h = g.scene.getScene('home');
  if (h && h.sky && h.sky.T && h.scene.isActive() && h.cameras && h.cameras.main) {
    t.n++;
    const p = -h.cameras.main.scrollY / h.sky.T; if (p < t.minP) t.minP = p;
    if (h.uiItems) for (const o of h.uiItems) if (o && o.active && o.alpha > t.maxUi) t.maxUi = o.alpha;
    if (h.sky.grain && h.sky.grain.visible) t.grain++;
  }
  const s = window.__ssftue && window.__ssftue.state; if (s && t.states[t.states.length - 1] !== s) t.states.push(s);
  const i = window.__ssintro; if (i && t.intro[t.intro.length - 1] !== i) t.intro.push(i);
} catch (e) { } }, 100);` });
const trace = async () => JSON.parse((await ev('JSON.stringify(window.__f5trace || null)')) || 'null');
const fmtTrace = (t) => t ? ('min p ' + (t.minP === 9 ? '—' : t.minP.toFixed(3)) + ' · ui ' + t.maxUi + ' · grain ' + t.grain + ' · ' + t.n + ' samples · ' + t.states.join('>') + ' · intro ' + t.intro.join('>')) : 'no trace';
// the idle-clock law: a woken headless clock pays ~one frame per input event —
// poke the page while polling a RIDE (the lean is 0.8s of game-loop time)
const poke = (i) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 30 + (i % 5), y: 30 + (i % 7) });
const pickStands = () => ev("(()=>{try{const b=game.scene.getScene('battle');return !!(b&&b.scene.isActive()&&b.state==='pick')}catch(e){return false}})()");
const go = async (url) => { errs.length = 0; await send('Page.navigate', { url }); await sleep(1500); };
// a REAL tap at viewport CSS coordinates (the verify-with-clicks law)
const tap = async (p) => {
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
// card 03's pre-seed: sections that test the OLDER cards mark the scry
// lesson already-taught (SS.prof.f5scry=1), so their organic stalls keep
// the old voice (glint + ribbon) and never veil the chain; §3b2 clears the
// seed and owns the gate.
const seedScry = () => ev("(()=>{try{if(typeof SS!=='undefined'&&SS.prof){SS.prof.f5scry=1;SS.save();return 1}}catch(e){}return 0})()");

/* ================= §2 the true first open ================= */
console.log('— §2 the true first open —');
await go(BASE);
// NOTE: harness evaluates run in the page, so localStorage.getItem rides the
// shim — ask with the GAME's key names and the prefix lands underneath.
let booted = false;
for (let i = 0; i < 40 && !booted; i++) { booted = await ev("localStorage.getItem('beta3.boot') !== null"); if (!booted) await sleep(1000); }
ok('boot beacon lands under the first5 prefix', booted, await ev("localStorage.getItem('beta3.boot')"));
ok('the canvas stands', await ev("document.querySelector('canvas') !== null"));
ok('every storage key wears the prefix — zero bare beta3.* keys', await ev("(()=>{const ks=[];for(let i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));return ks.length>0&&ks.every(k=>k.startsWith('first5.'))})()"),
  await ev("(()=>{const ks=[];for(let i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));return ks.filter(k=>!k.startsWith('first5.')).join()||'(all prefixed, '+ks.length+' keys)'})()"));
ok('the FTUE gate is OPEN — this device reads virgin (ftue 0 = owed)', (await ev('typeof SS !== "undefined" && SS.prof ? SS.prof.ftue : "no SS.prof"')) === 0, String(await ev('typeof SS !== "undefined" && SS.prof ? SS.prof.ftue : "no SS.prof"')));
ok('net rides local mode (no firebase global)', await ev("typeof firebase === 'undefined'"));
await seedScry();   // the §2 chain tests cards 01–06 + fixes 01–02, not the gate
// the first open rises BY ITSELF into the battle. The game's own headless
// beacon (window.__ssftue) is the truth; swiftshader stretches the intro
// well past its real ~10s, so the window is generous.
let rose = null;
for (let i = 0; i < 150 && !rose; i++) {
  const st = await ev("window.__ssftue ? window.__ssftue.state : null");
  if (st === 'rise' || st === 'board' || st === 'done' || await ev("typeof game !== 'undefined' && game.scene ? game.scene.isActive('battle') : false")) rose = st || 'battle';
  if (!rose) await sleep(1000);
}
ok('the ascent rises by itself into the first fight', !!rose, 'ftue state ' + rose);
let f1 = null; // graft 1: the battle scene stands moments after the rise
for (let i = 0; i < 30 && !f1; i++) { f1 = await ev("(()=>{try{const b=game.scene.getScene('battle');return b&&b.fights&&b.fights[0]?b.fights[0].id:null}catch(e){return null}})()"); if (!f1) await sleep(1000); }
ok('fight one is pinned VULPES, every day of the week (graft 1)', f1 === 'vulpes', String(f1));
// STRAIGHT INTO THE NIGHT: the untapped open (the 5s fallback) rode the same
// road — the title stood, the sky never came down, the fight was dealt
let pk0 = false;
for (let i = 0; i < 80 && !pk0; i++) { await poke(i); pk0 = await pickStands(); if (!pk0) await sleep(500); }
const t0 = await trace();
ok('STRAIGHT INTO THE NIGHT — the camera never left the zenith between title and fight (min p ≥ 0.9)', pk0 && !!t0 && t0.n > 0 && t0.minP >= 0.9, fmtTrace(t0));
ok('…the title STOOD at its landing (intro beacon "stands" — never "done"/"skipped", no settle)', !!t0 && t0.intro.includes('stands') && !t0.intro.includes('done') && !t0.intro.includes('skipped'), t0 && t0.intro.join('>'));
ok('…the meadow chrome never showed (ui alpha 0 throughout) and the grass grain never lit', !!t0 && t0.maxUi === 0 && t0.grain === 0);
ok('…the beacon walked lure → rise → board, in order (the silent fallback rose on its own)', !!t0 && ['lure', 'rise', 'board'].every((s) => t0.states.includes(s)) && t0.states.indexOf('lure') < t0.states.indexOf('rise') && t0.states.indexOf('rise') < t0.states.indexOf('board'), t0 && t0.states.join('>'));
ok('zero page exceptions through the open', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ======== §2a2 reduce-motion: the same straight road, under a veil ======== */
console.log('— §2a2 reduce-motion: the title stands under the veil, never the grass —');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await go(BASE + '?reset=1');
let rmb = false;
for (let i = 0; i < 150 && !rmb; i++) { await poke(i); rmb = await pickStands(); if (!rmb) await sleep(500); }
const t1 = await trace();
ok('reduce-motion: the open stands at the zenith and crossfades into fight 1 — the grass is never visited', rmb && !!t1 && t1.n > 0 && t1.minP >= 0.9, fmtTrace(t1));
ok('…the intro beacon read "reduced" (the veil path), the meadow chrome stayed dark', !!t1 && t1.intro.includes('reduced') && t1.maxUi === 0, t1 && t1.intro.join('>'));
ok('zero exceptions on the reduce-motion open', errs.length === 0, errs.slice(0, 2).join(' | '));
await send('Emulation.setEmulatedMedia', { features: [] });

/* ======== §2b the lure — the rise, heard (card 03) ======== */
console.log('— §2b the lure: the rise is heard, straight from the title —');
await go(BASE + '?reset=1');
let lure = false;
for (let i = 0; i < 180 && !lure; i++) { lure = (await ev("window.__ssftue ? window.__ssftue.state : null")) === 'lure'; if (!lure) await sleep(1000); }
ok('one firefly asks — the lure stands at the TITLE (no settle, no meadow)', lure);
const atTitle = await ev("(()=>{try{const h=game.scene.getScene('home');const p=-h.cameras.main.scrollY/h.sky.T;const fx=h.f5TitleFx;const fly=h.children.list.find(o=>o.active&&o.getData&&o.getData('f5lure'));return [!!(fx&&fx.t&&fx.t.active&&fx.t.alpha>0.99&&fx.t.scrollFactorX===0),!!(fly&&fly.scrollFactorX===0&&fx&&fly.y>fx.t.y),p.toFixed(3),h.introPlaying,h.uiItems.every(o=>!o.active||o.alpha===0)]}catch(e){return ['err:'+e.message]}})()");
ok('…under the standing wordmark: the word at full voice and scroll-fixed, the firefly scroll-fixed below it, the sky at the zenith, the chrome dark', Array.isArray(atTitle) && atTitle[0] === true && atTitle[1] === true && Number(atTitle[2]) >= 0.9 && atTitle[3] === false && atTitle[4] === true, String(atTitle));
try { mkdirSync('tools/shots-straight', { recursive: true }); } catch (e) { }
const shotT = await send('Page.captureScreenshot', { format: 'png' });
if (shotT && shotT.data) writeFileSync('tools/shots-straight/title-night.png', Buffer.from(shotT.data, 'base64'));
ok('DPR-3 capture 1/2 on file: the title night with the lure standing (tools/shots-straight/title-night.png)', !!(shotT && shotT.data), shotT && shotT.data ? Math.round(shotT.data.length / 1024) + 'kb' : 'no data');
await seedScry();   // the reset re-owed the lesson — re-seed before this ascent
// a REAL tap, anywhere on screen (the verify-with-clicks law)
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 195, y: 420, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 195, y: 420, button: 'left', clickCount: 1 });
let lured = null;
for (let i = 0; i < 20 && !lured; i++) { const st = await ev("window.__ssftue ? window.__ssftue.state : null"); if (st === 'lured' || st === 'rise' || st === 'board') lured = st; if (!lured) await sleep(400); }
ok('the tap launches the ascent (lure → rise)', !!lured, String(lured));
ok('…and the same gesture ARMED THE SOUND (riser audible)', await ev("typeof SFX !== 'undefined' && SFX.ok === true && SFX.ctx && SFX.ctx.state === 'running'"), String(await ev("typeof SFX !== 'undefined' && SFX.ctx ? SFX.ctx.state : 'no ctx'")));
// ONE TRANSITION: the lean (the shipped rise resumed from the title's frame,
// ~0.8s) then the crossfade — fight 1 stands, and the sky never came down
let pk2 = false;
for (let i = 0; i < 90 && !pk2; i++) { await poke(i); pk2 = await pickStands(); if (!pk2) await sleep(500); }
const t2 = await trace();
const f1b = await ev("(()=>{try{const b=game.scene.getScene('battle');return b&&b.fights&&b.fights[0]?b.fights[0].id:null}catch(e){return null}})()");
ok('ONE TRANSITION: title → fight 1 (pinned VULPES) off the real tap — the camera never below the zenith shade', pk2 && f1b === 'vulpes' && !!t2 && t2.minP >= 0.9, fmtTrace(t2) + ' · fight ' + f1b);
// the home sleeps when the 450ms crossfade ENDS — under load the deal's
// 'pick' can land first, so the sleep is polled, never read once
let hSleep = false;
for (let i = 0; i < 60 && !hSleep; i++) { await poke(i); hSleep = (await ev("game.scene.isSleeping('home') === true")) === true; if (!hSleep) await sleep(250); }
ok('…the lean rode the shipped curve: beta3.ascent stamped, the home scene asleep under the battle (the crossfade done), the standing word taken apart', await ev("localStorage.getItem('beta3.ascent') !== null") && hSleep && await ev("(()=>{const h=game.scene.getScene('home');return h.f5TitleFx===null&&h.f5Lean===null})()"), 'asleep ' + hSleep);
const shotF = await send('Page.captureScreenshot', { format: 'png' });
if (shotF && shotF.data) writeFileSync('tools/shots-straight/first-fight.png', Buffer.from(shotF.data, 'base64'));
ok('DPR-3 capture 2/2 on file: the first fight frame (tools/shots-straight/first-fight.png)', !!(shotF && shotF.data), shotF && shotF.data ? Math.round(shotF.data.length / 1024) + 'kb' : 'no data');
ok('zero exceptions through the lure', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ======== §2c THE SKY LEANS IN (card 04) ======== */
console.log('— §2c the sky leans in —');
let b1 = false; // ride the lure-tapped ascent into the first fight
for (let i = 0; i < 90 && !b1; i++) { b1 = await ev("(()=>{try{const b=game.scene.getScene('battle');return !!(b&&b.scene.isActive()&&b.state==='pick')}catch(e){return false}})()"); if (!b1) await sleep(1000); }
ok('the first fight stands after the lure', b1);
const ehp = await ev("(()=>{try{const b=game.scene.getScene('battle');return b.beast?b.beast.hp:null}catch(e){return null}})()");
ok('THE EMBER MINUTE tuning: pinned VULPES at 33 hp', ehp === 33, String(ehp));
ok('the en rig letters are all in the en bag', await ev("['m','o','n','s','e','a'].every(c=>SS_PACKS.en.bag[c])"));
ok('the en floor word stands in the dictionary', await ev("WORDSET.has('moons')"));
await sleep(2500); // the deal's bounce settles before probe taps (house law)
const cast1 = await ev("(()=>{const b=game.scene.getScene('battle');const deal=['s','t','a','r'];const used=[];for(const ch of deal){let f=-1;for(let i=0;i<16;i++){if(used.includes(i))continue;if(b.board[i]&&b.board[i].ch===ch){f=i;break}}if(f<0)return 'missing '+ch;used.push(f)}used.forEach(i=>b.tapTile(i));b.tryCast();return 'cast'})()");
ok('the first cast flies (S·T·A·R, real scene taps)', cast1 === 'cast', String(cast1));
let sw = false;
for (let i = 0; i < 12 && !sw; i++) { sw = (await ev('window.__f5starwrite | 0')) >= 1; if (!sw) await sleep(400); }
ok('THE WORD WRITTEN IN STARS hangs on the first cast', sw);
await sleep(3200); // the rigged refill lands and settles
const dens = await ev("(()=>{const b=game.scene.getScene('battle');const counts={};for(const s of b.board)if(s&&!s.blk)counts[s.ch]=(counts[s.ch]|0)+1;const fits=(w)=>{if(w.includes('q'))return false;const c=Object.assign({},counts);for(const ch of w){if(!c[ch])return false;c[ch]--}return true};let n4=0,n5=0,n6=0;for(const w of WORDSET){const L=w.length;if(L===4&&n4<9&&fits(w))n4++;else if(L===5&&n5<9&&fits(w))n5++;else if(L===6&&n6<9&&fits(w))n6++;if(n4>8&&n5>8&&n6>8)break}return [n4,n5,n6]})()");
ok('THE DENSITY GATE: >=3 findable words at 4/5/6 after the rig (en)', dens && dens[0] >= 3 && dens[1] >= 3 && dens[2] >= 3, String(dens));
const trio = await ev("(()=>{const b=game.scene.getScene('battle');return b.rollSigilOpts().map(o=>o.id).join()})()");
ok('the first-ever sigil trio is curated: QUILL / SALVE / FIRST LIGHT', trio === 'quill,salve,first', trio);
await ev("(()=>{const b=game.scene.getScene('battle');b.f5LastTap=b.time.now-31000;b.f5Glinted=true;b.f5Encored=false;return 1})()");
let enc = false;
for (let i = 0; i < 10 && !enc; i++) { enc = (await ev('window.__f5encore | 0')) >= 1; if (!enc) await sleep(500); }
ok('the 30s rescue encore walks the best word (idle rescue)', enc);
const w5 = await ev("(()=>{const b=game.scene.getScene('battle');if(b.state!=='pick')return 'state '+b.state;const tiles=b.board.map((s,i)=>s&&!s.blk?{i,ch:s.ch}:null).filter(Boolean);const pick=(w)=>{const used=[];for(const ch of w){let f=-1;for(const t of tiles){if(used.includes(t.i))continue;if(t.ch===ch){f=t.i;break}}if(f<0)return null;used.push(f)}return used};for(const w of WORDSET){if(w.length!==5||w.includes('q'))continue;const u=pick(w);if(u){u.forEach(i=>b.tapTile(i));b.tryCast();return w}}return 'none'})()");
ok('a 5-letter word stands on the rigged board and CASTS', !!w5 && w5 !== 'none' && !String(w5).startsWith('state'), String(w5));
let r5 = false;
for (let i = 0; i < 10 && !r5; i++) { r5 = (await ev('window.__f5ladder5 | 0')) === 1; if (!r5) await sleep(400); }
ok('the first 5+ pays the shooting star (ladder rung 5)', r5);
await ev("(()=>{const b=game.scene.getScene('battle');b.f5CastBeats('zzzzzzz', 7);return 1})()");
await sleep(1200);
ok('rungs 6 and 7 cue and draw clean (sky swell + gold rain)', ((await ev('window.__f5ladder6 | 0')) + (await ev('window.__f5ladder7 | 0'))) === 2);
ok('zero exceptions through the leaning sky', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ======== §2d the teaching scripts (card 05) ======== */
console.log('— §2d the teaching scripts —');
// the dew and the ink ride their REAL functions — the same calls the game makes
const dewed = await ev("(()=>{const b=game.scene.getScene('battle');let pi=-1;for(let i=0;i<16;i++){const s=b.board[i];if(s&&s.tier===0&&!s.blk&&s.c.active){pi=i;break}}if(pi<0)return 'no plain tile';b.dewTile(pi);return 'dewed'})()");
ok('a dew tile blooms (real dewTile call)', dewed === 'dewed', String(dewed));
let p3 = false;
for (let i = 0; i < 8 && !p3; i++) { p3 = ((await ev("(window.__f5prompt||{}).tile3 | 0")) >= 1); if (!p3) await sleep(400); }
ok('…and the GREEN lesson speaks once', p3);
await ev("(()=>{const b=game.scene.getScene('battle');let pi=-1;for(let i=0;i<16;i++){const s=b.board[i];if(s&&s.tier===0&&!s.blk&&s.c.active){pi=i;break}}if(pi>=0)b.blackTile(pi);return 1})()");
let pink = false;
for (let i = 0; i < 8 && !pink; i++) { pink = ((await ev("(window.__f5prompt||{}).ink | 0")) >= 1); if (!pink) await sleep(400); }
ok('an inked tile teaches the beast special (real blackTile call)', pink);
await ev("(()=>{const b=game.scene.getScene('battle');ssF5Prompt(b,'scry',100,600);ssF5Prompt(b,'scry',100,600);return 1})()");
ok('every prompt fires ONCE per run (scry asked twice, spoke once)', (await ev("(window.__f5prompt||{}).scry | 0")) === 1);
// the ORANGE lesson rides the real forge chain: the 5-letter cast already
// paid pending; march to the next refill (or through the sigil pick into
// fight 2, where the PLANTED GLOW lands) and the prompt speaks
let p1 = (await ev("(window.__f5prompt||{}).tile1 | 0")) >= 1;
for (let round = 0; round < 6 && !p1; round++) {
  const st = await ev("(()=>{const b=game.scene.getScene('battle');if(b.state==='sigil'||b.state==='upgrade'){const cards=[];const scan=(ls)=>ls.forEach(o=>{if(o.getData&&o.getData('sigilCard'))cards.push(o);else if(o.list)scan(o.list)});scan(b.overlayC.list);if(cards.length){cards[0].emit('pointerdown');return 'picked'}}if(b.state==='pick'&&!b.sel.length){const w=b.bestWord();if(w){w.forEach(i=>b.tapTile(i));b.tryCast();return 'cast'}}return b.state})()");
  for (let i = 0; i < 12 && !p1; i++) { p1 = (await ev("(window.__f5prompt||{}).tile1 | 0")) >= 1; if (!p1) await sleep(700); }
}
ok('the ORANGE lesson speaks on the real forge/plant chain', p1);
ok('zero exceptions through the lessons', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ======== §2e the lit sky (card 06) ======== */
console.log('— §2e the lit sky —');
ok('every quick-5 beast has an authored zenith seat', await ev("SS_QUICK_POOL.concat(['draco']).every(id=>SS_F5_SEATS[id])"));
// drive a FELL through the true chain: the beast drops to a sliver and one
// real cast fells it (unless §2d's march already felled one via its pick)
let fell = 'pending';
for (let round = 0; round < 8 && fell !== 'felled'; round++) {
  if (await ev("(window.__f5lit||[]).length >= 1")) { fell = 'already lit'; break; }
  fell = await ev("(()=>{const b=game.scene.getScene('battle');if(!b)return 'no battle';if(b.state==='sigil'||b.state==='upgrade'){const cards=[];const scan=(ls)=>ls.forEach(o=>{if(o.getData&&o.getData('sigilCard'))cards.push(o);else if(o.list)scan(o.list)});scan(b.overlayC.list);if(cards.length){cards[0].emit('pointerdown');return 'picked'}}if(b.state==='pick'&&!b.sel.length){if(b.beast)b.beast.hpNow=1;const w=b.bestWord();if(w){w.forEach(i=>b.tapTile(i));b.tryCast();return 'felled'}}return b.state})()");
  if (fell !== 'felled') await sleep(1400);
}
let vlit = false;
for (let i = 0; i < 15 && !vlit; i++) { vlit = await ev("(window.__f5lit||[]).length >= 1"); if (!vlit) await sleep(800); }
const lit1 = await ev("JSON.stringify(ssF5LitList())");
ok('the fell WRITES the mark through the true chain', vlit && lit1 !== '[]', lit1 + ' · via ' + fell);
const conv = await ev("(()=>{const b=game.scene.getScene('battle');const free=Object.keys(SS_F5_SEATS).find(id=>!ssF5LitList().includes(id));const ms=b.f5LightSky(free);const again=b.f5LightSky(free);return [free,ms,again,ssF5LitList().length]})()");
ok('a later first-species fell CONVERGES (~600ms beat, no full rite)', conv && conv[1] > 0 && conv[1] <= 600, String(conv));
ok('a species already in the sky never re-lights', conv && conv[2] === 0);
/* — fix 02 THE STRAY SIGNS: the rite still SEATS its mark in the fight
   view (the fell's own ceremony is untouched), then the sweep clears the
   zenith (the same f5ClearSeatMarks the next fight runs). Measure the
   census as a DELTA off whatever the run already seated — NEVER reset
   f5SeatMarks (that orphans live marks and the sweep could not clear
   them). Both halves POLL: robust to the full rite's ~2.85s seat delay,
   the 240ms sweep fade, and a loaded box whose game-loop starves between
   wall-clock waits. */
const base = await ev(CENSUS('battle'));
const freeSeat = await ev("(()=>{const b=game.scene.getScene('battle');const free=Object.keys(SS_F5_SEATS).find(id=>!ssF5LitList().includes(id));if(!free)return null;b.f5LightSky(free);return free})()");
let grew = false;
for (let i = 0; i < 16 && !grew; i++) { grew = (await ev(CENSUS('battle'))) > base; if (!grew) await sleep(500); }
ok('THE RITE STILL SEATS ITS MARK in the fight view (the ceremony draws)', grew, 'base ' + base + ' -> grew · seat ' + freeSeat);
await ev("(()=>{game.scene.getScene('battle').f5ClearSeatMarks();return 1})()");
let swept = false;
for (let i = 0; i < 10 && !swept; i++) { swept = (await ev(CENSUS('battle'))) === 0; if (!swept) await sleep(400); }
ok('…then the sweep clears EVERY standing mark (the fight view owns none)', swept, 'census ' + await ev(CENSUS('battle')));
await ev("(()=>{const b=game.scene.getScene('battle');b.f5Ledger();ssF5TomorrowCue(b);return 1})()");
await sleep(1200);
ok('the graduation ledger and the tomorrow cue draw clean', (await ev('window.__f5ledger | 0')) >= 1 && (await ev('window.__f5tomorrow | 0')) >= 1);
ok('zero exceptions through the lighting', errs.length === 0, errs.slice(0, 2).join(' | '));
// the morning after — ON THIS STAGE a plain reopen is a fresh night (THE
// CLEAN REFRESH, F5-FIX1-01), so the kept-sky MACHINERY is proven through
// the survive door: a carried reopen keeps the marks, as a scripted reload
// would. (Integration note: live, a plain reopen keeps them — never the wipe.)
await ev('window.__f5survive()');
await go(BASE);
let kept = null;
for (let i = 0; i < 40 && !kept; i++) { const v = await ev("typeof SS !== 'undefined' && SS.prof ? JSON.stringify(ssF5LitList()) : null"); if (v && v !== 'null' && v !== '[]') kept = v; if (!kept) await sleep(1000); }
ok('the kept sky survives a CARRIED reopen (2+ marks — the machinery holds)', !!kept && kept.split(',').length >= 2, String(kept));
ok('the survive flag was consumed on sight (one-shot)', await ev("sessionStorage.getItem('__survive') === null"));
ok('zero exceptions on the kept-sky boot', errs.length === 0, errs.slice(0, 2).join(' | '));
// fix 02: the carried reopen resumes the held fight — and the battle must
// boot a CLEAN zenith now (the old boot draw painted every kept mark here)
let rb1 = false;
for (let i = 0; i < 90 && !rb1; i++) { rb1 = await ev("(()=>{try{const b=game.scene.getScene('battle');return !!(b&&b.scene.isActive()&&b.state==='pick')}catch(e){return false}})()"); if (!rb1) await sleep(1000); }
ok('THE RESUMED BATTLE BOOTS CLEAN — kept list stands, zero marks drawn', rb1 && (await ev(CENSUS('battle'))) === 0 && (await ev('ssF5LitList().length')) >= 1, 'census ' + (await ev(CENSUS('battle'))) + ' · lit ' + (await ev('ssF5LitList().length')));
/* — STRAIGHT INTO THE NIGHT (10/9): with the first night still OWED (no
   endRun yet), a carried reopen with no held fight stands at the TITLE —
   and draws no kept marks there (the stray-signs law, extended to the
   night sky): the marks' home is the meadow, which comes AFTER the fight — */
await ev("localStorage.removeItem('beta3.quickck')");
await ev('window.__f5survive()');
await go(BASE);
let tStand = null;
for (let i = 0; i < 60 && !tStand; i++) { const st = await ev("window.__ssftue ? window.__ssftue.state : null"); if (st === 'lure' || st === 'rise' || st === 'board') tStand = st; if (!tStand) await sleep(1000); }
const tCensus = await ev(CENSUS('home')), tLit = await ev("typeof ssF5LitList === 'function' ? ssF5LitList().length : -1"), tOwed = await ev('SS.prof ? SS.prof.ftue : null');
ok('THE TITLE NIGHT DRAWS NO KEPT MARKS — night still owed, the open stands at the zenith with census 0 while the kept list stands', tStand === 'lure' && tCensus === 0 && tLit >= 2 && tOwed === 0, 'state ' + tStand + ' · census ' + tCensus + ' · lit ' + tLit + ' · ftue ' + tOwed);
/* — fix 02: the mark's true home still lights. The first night DONE (the
   ftue flag down, as endRun leaves it), a carried reopen with no held fight
   lands on the MEADOW and the morning-after sky stands — */
await ev("(()=>{SS.prof.ftue = 1; SS.save(); return 1})()");
await ev("localStorage.removeItem('beta3.quickck')");
await ev('window.__f5survive()');
await go(BASE);
let mMarks = null;
for (let i = 0; i < 60 && mMarks === null; i++) {
  const v = await ev(CENSUS('home'));
  if (typeof v === 'number' && v > 0) mMarks = v; else await sleep(1000);
}
ok('THE MEADOW STILL WEARS THE KEPT SKY (the morning-after proof stands)', mMarks !== null && mMarks >= 2, String(mMarks) + ' mark items');
ok('zero exceptions through the stray-sign sweep', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ================= §3 the run engine plays (demo solver) ================= */
console.log('— §3 the run engine plays —');
await go(BASE + '?reset=1&demo=1');
let stat = null;
for (let i = 0; i < 120 && !stat; i++) { const s = await ev("localStorage.getItem('beta3.stat')"); if (s) { const j = JSON.parse(s); if (j.words >= 1) stat = j; } if (!stat) await sleep(1500); }
ok('the solver weaves real words in the sandbox', !!stat, stat && ('fight ' + stat.fight + ' · ' + stat.words + ' words · score ' + stat.score));
ok('demo stat rides the prefix too', await ev("localStorage.getItem('beta3.stat') === null || true") && await ev("(()=>{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k==='beta3.stat')return false}return true})()"));
let qk = null; // graft 4: the first fell writes the held fight
for (let i = 0; i < 150 && !qk; i++) { const c = await ev("localStorage.getItem('beta3.quickck')"); if (c) { const j = JSON.parse(c); if (j.fightIdx >= 1) qk = j; } if (!qk) await sleep(1500); }
ok('the fell writes the held fight (graft 4: beta3.quickck)', !!qk, qk && ('fight ' + qk.fightIdx + ' · qseed kept ' + Number.isFinite(qk.qseed)));
ok('zero exceptions mid-run', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ======== §3a THE SKYLAR SCENE (fix 02: the stray signs) ========
   Mid-run, a later fight standing, the kept list non-empty — the exact
   screen Skylar circled. Pause the solver ATOMICALLY at 'pick' so no fell
   can seat a rite mark mid-look (the rite is WANTED; standing marks are
   not), prove 'pick' HELD for a beat (no cast in flight), then the count,
   the DPR-3 screenshot, and the pixel probe at the circled seat. */
console.log('— §3a THE SKYLAR SCENE: the circled corner is clean sky —');
let mrHeld = false;
for (let round = 0; round < 6 && !mrHeld; round++) {
  let picked = false;
  for (let i = 0; i < 90 && !picked; i++) { picked = await ev("(()=>{try{const b=game.scene.getScene('battle');if(!b||!b.scene.isActive())return false;if(b.state==='pick'&&b.run.fightIdx>=1&&ssF5LitList().length>=1){if(b.demoTimer)b.demoTimer.paused=true;return true}return false}catch(e){return false}})()"); if (!picked) await sleep(1000); }
  if (!picked) break;
  await sleep(1300); // a just-fired cast lands inside this; the sweep fade too
  if (await ev("(()=>{try{return game.scene.getScene('battle').state==='pick'}catch(e){return false}})()")) mrHeld = true;
  else await ev("(()=>{try{const b=game.scene.getScene('battle');if(b.demoTimer)b.demoTimer.paused=false;return 1}catch(e){return 0}})()");
}
const mrIdx = await ev("(()=>{try{return game.scene.getScene('battle').run.fightIdx}catch(e){return -1}})()");
ok('mid-run stands still for the look: a later fight, the kept list lit', mrHeld, 'fight ' + (mrIdx + 1) + ' · lit ' + await ev("JSON.stringify(typeof ssF5LitList==='function'?ssF5LitList():null)"));
// SETTLE-POLL: the previous fight's mark was swept at startFight, but its
// 240ms fade can linger when a loaded game-loop starves between my waits —
// give it a few seconds to reach zero. A mark that TRULY stands never does.
let mrMarks = await ev(CENSUS('battle'));
for (let i = 0; i < 10 && mrMarks !== 0; i++) { await sleep(400); mrMarks = await ev(CENSUS('battle')); }
ok('THE STRAY SIGNS ARE GONE — zero standing marks in the fight view', mrMarks === 0, String(mrMarks));
// the record for Skylar: the quick-play screen at iPhone DPR 3, final bytes
try { mkdirSync('tools/shots-stray', { recursive: true }); } catch (e) { }
const shot = await send('Page.captureScreenshot', { format: 'png' });
if (shot && shot.data) writeFileSync('tools/shots-stray/midrun-clean-zenith.png', Buffer.from(shot.data, 'base64'));
ok('the DPR-3 screenshot is on file (tools/shots-stray/)', !!(shot && shot.data), shot && shot.data ? Math.round(shot.data.length / 1024) + 'kb' : 'no data');
// the pixel probe: the vulpes seat (the circled corner, clear of the gold
// bar). Gold signature = warm pixel (R leads B); clean sky and white
// starfield dots read cold. A standing mark paints hundreds of warm px.
const probe = await evp("(()=>{return new Promise((res)=>{try{const b=game.scene.getScene('battle');const l=b.L;const x0=Math.round(l.x(-148)),y0=Math.round(l.y(80)),w=Math.round(l.u(38)),h=Math.round(l.u(34));const t=setTimeout(()=>res(['timeout']),8000);game.renderer.snapshotArea(x0,y0,w,h,(img)=>{try{clearTimeout(t);const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);const d=g.getImageData(0,0,c.width,c.height).data;let gold=0,maxR=0;for(let i=0;i<d.length;i+=4){const r=d[i],bl=d[i+2];if(r>maxR)maxR=r;if(r>55&&r-bl>6)gold++}res([gold,maxR,img.width,img.height])}catch(e){res(['err',String(e)])}})}catch(e){res(['err',String(e)])}})})()");
ok('THE CIRCLED CORNER IS CLEAN SKY (pixel probe at the vulpes seat)', Array.isArray(probe) && typeof probe[0] === 'number' && probe[0] < 60, 'warm px ' + String(probe));
// and the header the circle grazed is unharmed: the YOU bar, its numbers,
// the beast's constellation all stand exactly where they were
const header = await ev("(()=>{try{const b=game.scene.getScene('battle');return [!!(b.hpBar&&b.hpBar.active),!!(b.hpT&&b.hpT.active&&b.hpT.text.length),!!(b.beastC&&b.beastC.active&&b.beastC.list.length>0),!!(b.beast&&b.beast.hpNow>0)].join('|')}catch(e){return 'err:'+e.message}})()");
ok('the YOU bar and the beast constellation stand untouched', header === 'true|true|true|true', header);
ok('zero exceptions through the look', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ======== §3b the carried night, the glint, the two refusals ======== */
console.log('— §3b the carried night: the survive door, then the REAL retry door —');
// graft 4's resume rides the survive flag on this stage: a scripted reload
// carries the night, a player refresh does not (§3c proves the wipe)
await ev('window.__f5survive()');
await go(BASE); // carried — the held fight must stand
let resumed = false;
for (let i = 0; i < 90 && !resumed; i++) { resumed = await ev("(()=>{try{const b=game.scene.getScene('battle');return !!(b&&b.scene.isActive()&&b.mode==='quick'&&b.state==='pick')}catch(e){return false}})()"); if (!resumed) await sleep(1000); }
const rIdx = await ev("(()=>{try{return game.scene.getScene('battle').run.fightIdx}catch(e){return -1}})()");
ok('a CARRIED reopen resumes the held fight (graft 4 rides the survive door)', resumed && qk && rIdx === qk.fightIdx, 'resumed at fight ' + rIdx + ' (held ' + (qk && qk.fightIdx) + ')');
await seedScry();   // §3b tests the doors and the glint — §3b2 owns the gate
ok('the intro was NOT replayed over the carried run (graft 4)', await ev("window.__ssftue && window.__ssftue.on === false"));
// now the REAL door — the versus offline retry button fires the actual
// versus.js F5-FIX1-01 line: a true scripted reload through real game code
await ev("(()=>{game.scene.start('vsmenu');return 1})()");
let rbUp = false;
for (let i = 0; i < 20 && !rbUp; i++) { rbUp = await ev("(()=>{try{const v=game.scene.getScene('vsmenu');return !!(v&&v.retryB&&v.retryB.input&&v.retryB.input.enabled)}catch(e){return false}})()"); if (!rbUp) await sleep(500); }
ok('the offline dueling ground stands its retry door (sandbox is local)', rbUp);
await Promise.race([ev("(()=>{game.scene.getScene('vsmenu').retryB.emit('pointerdown');return 1})()"), sleep(3000)]);
await sleep(2500); // the reload the button fired lands
let reResumed = false;
for (let i = 0; i < 90 && !reResumed; i++) { reResumed = await ev("(()=>{try{const b=game.scene.getScene('battle');return !!(b&&b.scene.isActive()&&b.mode==='quick'&&b.state==='pick')}catch(e){return false}})()"); if (!reResumed) await sleep(1000); }
const rIdx2 = await ev("(()=>{try{return game.scene.getScene('battle').run.fightIdx}catch(e){return -1}})()");
ok('THE REAL RETRY DOOR reloads WITHOUT losing the night (versus.js F5-FIX1-01)', reResumed && qk && rIdx2 === qk.fightIdx, 'resumed at fight ' + rIdx2 + ' (held ' + (qk && qk.fightIdx) + ')');
ok('that flag too was consumed (one-shot)', await ev("sessionStorage.getItem('__survive') === null"));
ok('…and this resumed fight too wears a CLEAN zenith (fix 02, every boot door)', (await ev(CENSUS('battle'))) === 0 && await ev("typeof ssF5LitList==='function' && ssF5LitList().length >= 1"));
await sleep(2500); // the deal's bounce settles before probe taps (house law)
await ev("(()=>{const b=game.scene.getScene('battle');b.f5LastTap=b.time.now-11000;b.f5Glinted=false;return 1})()");
let glinted = false;
for (let i = 0; i < 10 && !glinted; i++) { glinted = (await ev('window.__f5glint | 0')) >= 1; if (!glinted) await sleep(500); }
ok('the stalled speller is fed — one viable-tile glint (graft 5)', glinted);
await ev("(()=>{const b=game.scene.getScene('battle');b.tapTile(0);b.tryCast();return 1})()");
await sleep(600);
ok('a single tile BOUNCES HOME (graft 6: too short)', (await ev('window.__f5refusal')) === 'home' && await ev("game.scene.getScene('battle').sel.length === 0"));
const pair = await ev("(()=>{const b=game.scene.getScene('battle');for(let i=0;i<16;i++)for(let j=0;j<16;j++){if(i===j)continue;const w=b.board[i].ch+b.board[j].ch;if(!WORDSET.has(w))return [i,j]}return null})()");
ok('a non-word pair exists on the board to refuse', !!pair, String(pair));
if (pair) {
  await ev("(()=>{const b=game.scene.getScene('battle');b.tapTile(" + pair[0] + ");b.tapTile(" + pair[1] + ");b.tryCast();return 1})()");
  await sleep(700);
  ok('a word the sky never heard CRUMBLES TO DUST (graft 6)', (await ev('window.__f5refusal')) === 'dust' && await ev("game.scene.getScene('battle').sel.length === 0"));
}
ok('zero exceptions through the pocket round', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ======== §3b2 THE SCRY LESSON (fix 03) — the hand is taken, the cost shown ========
   The resumed battle stands at 'pick' with a full fuse and no comet (the
   held run's one sigil is from the curated trio). Clear the pre-seed so
   the lesson is owed again, stall honestly (§3b's clock rewind), and the
   gate must arm: veil up, SCRY alone lit, Skylar's line verbatim. Every
   inert-screen proof is a REAL CDP tap — a letter tile, CAST, the back
   door — then the REAL tap on SCRY runs the whole lesson: the redeal, the
   raised pill, the count stepping down, the cost line, the lift. Then the
   same real fingers that were refused answer again, and a later stall
   only glints — the hand is never taken twice. */
console.log('— §3b2 THE SCRY LESSON: the hand is taken, the cost is shown —');
const pr0 = await ev('(window.__f5prompt||{}).scry | 0');
await ev("(()=>{delete SS.prof.f5scry;SS.save();window.__f5refusal=null;const b=game.scene.getScene('battle');b.f5Glinted=false;b.f5LastTap=b.time.now-11000;return 1})()");
let armed = false;
for (let i = 0; i < 24 && !armed; i++) { armed = ((await ev('(window.__f5scry||{}).armed | 0')) >= 1); if (!armed) await sleep(500); }
ok('THE GATE ARMS at the honest stall (the lesson owed, the fuse real)', armed);
ok("…the prompt is Skylar's line, verbatim", (await ev('(window.__f5scry||{}).gate')) === 'Stuck? SCRY deals a fresh board', String(await ev('(window.__f5scry||{}).gate')));
const gateUp = await ev("(()=>{const b=game.scene.getScene('battle');const g=b.f5ScryGate;return g?[g.veil.active,g.veil.depth,b.scryB.depth,b.scryT.depth,b.beast.count,b.run.words]:null})()");
ok('…the veil stands and SCRY ALONE rises above it', !!gateUp && gateUp[0] === true && gateUp[1] === 900 && gateUp[2] === 905 && gateUp[3] === 906, String(gateUp));
const cnt0 = gateUp ? gateUp[4] : 0, words0 = gateUp ? gateUp[5] : -1;
ok('…over a fuse with room to step (count > 1)', cnt0 > 1, 'count ' + cnt0);
// the inert screen — real taps at real coordinates
const pts = await ev("(()=>{const b=game.scene.getScene('battle');const r=game.canvas.getBoundingClientRect();const kx=r.width/game.scale.width,ky=r.height/game.scale.height;const m=(x,y)=>({x:Math.round(r.left+x*kx),y:Math.round(r.top+y*ky)});let ti=-1;for(let i=0;i<16;i++)if(b.board[i]&&b.board[i].c.active){ti=i;break}const tp=b.slotPos(ti);return {tile:m(tp.x,tp.y),cast:m(b.castB.x,b.castB.y),scry:m(b.scryB.x,b.scryB.y),back:m(b.homeB.x+8,b.homeB.y),ti}})()");
ok('real screen coordinates stand for tile / CAST / SCRY / back', !!(pts && pts.tile && pts.cast && pts.scry && pts.back), JSON.stringify(pts));
const b0 = await ev("(()=>{const b=game.scene.getScene('battle');return b.board.map(s=>s?s.ch:'·').join('')})()");
await tap(pts.tile); await sleep(900);
const tIn = await ev("(()=>{const b=game.scene.getScene('battle');return [b.sel.length,b.state,b.board.map(s=>s?s.ch:'·').join('')].join('|')})()");
ok('a REAL tap on a letter tile does NOTHING under the gate', tIn === '0|pick|' + b0, String(tIn).slice(0, 26));
await tap(pts.cast); await sleep(900);
ok('a REAL tap on CAST does NOTHING under the gate', (await ev("(()=>{const b=game.scene.getScene('battle');return [b.sel.length,b.state,b.run.words,String(window.__f5refusal)].join('|')})()")) === '0|pick|' + words0 + '|null');
await tap(pts.back); await sleep(900);
ok('a REAL tap on the back door does NOTHING under the gate', (await ev("game.scene.isActive('battle')")) === true && ((await ev('(window.__f5scry||{}).lifted | 0')) === 0));
ok('…and the gate still stands through all three', await ev("(()=>{const b=game.scene.getScene('battle');return !!(b.f5ScryGate&&b.f5ScryGate.veil.active)})()"));
// THE TAP — the one lit door answers. The lesson's 700ms + 1500ms beats
// ride the GAME clock, and the headless clock IDLES when input quiets
// (the settings-door law) — so every timed poll here NUDGES with a
// harmless mouse-move to keep the loop ticking, as a held phone would.
const nudge = (i) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 200 + (i % 5), y: 420 + (i % 7) });
await tap(pts.scry);
let tapped = false;
for (let i = 0; i < 16 && !tapped; i++) { tapped = ((await ev('(window.__f5scry||{}).tapped | 0')) >= 1); if (!tapped) await sleep(400); }
const b1s = await ev("(()=>{const b=game.scene.getScene('battle');return b.board.map(s=>s?s.ch:'·').join('')})()");
ok('a REAL tap on SCRY fires the scry itself — the board redeals (beat 2)', tapped && b1s !== b0, tapped ? 'redealt' : 'no tap seen');
let down = null;
for (let i = 0; i < 20 && !down; i++) { await nudge(i); const d = await ev('(window.__f5scry||{}).down || null'); if (d) down = d; else await sleep(400); }
ok('THE COST IS SHOWN: the count steps down before the raised pill (' + cnt0 + ' → ' + (cnt0 - 1) + ')', !!down && down[0] === cnt0 && down[1] === cnt0 - 1, String(down));
let cost = false;
for (let i = 0; i < 10 && !cost; i++) { await nudge(i + 30); cost = ((await ev('(window.__f5prompt||{}).scryCost | 0')) >= 1); if (!cost) await sleep(400); }
ok('…then SAID: the cost line speaks (once, like every lesson)', cost && ((await ev('(window.__f5scry||{}).cost | 0')) === 1));
let lifted = false;
// the 1.5s linger needs real accumulated game time: BURST the nudges (a
// woken headless clock pays ~one clamped frame per input event)
for (let i = 0; i < 30 && !lifted; i++) {
  for (let k = 0; k < 6; k++) await nudge(i * 6 + k);
  lifted = ((await ev('(window.__f5scry||{}).lifted | 0')) >= 1);
  if (!lifted) await sleep(250);
}
ok('THE GATE LIFTS (beat 4)', lifted);
const after = await ev("(()=>{const b=game.scene.getScene('battle');return [b.f5ScryGate===null,b.scryB.depth,b.scryT.depth,b.strikeT.depth,b.strikeRib.depth,b.strikeGlow.depth,SS.prof.f5scry|0,b.strikeT.text.includes(' " + (cnt0 - 1) + " ')?1:0].join('|')})()");
ok('every depth goes home; the pill tells the new truth; the lesson is written', after === 'true|0|0|0|0|0|1|1', after);
await sleep(1200);   // the redeal's bounce settles before the resume taps
// NORMAL PLAY RESUMES — the same real fingers that were refused now answer
await tap(pts.tile);
let selGrew = false;
for (let i = 0; i < 10 && !selGrew; i++) { selGrew = ((await ev("game.scene.getScene('battle').sel.length")) === 1); if (!selGrew) await sleep(400); }
ok('tiles ANSWER again after the lift (a real tap selects)', selGrew);
await ev('window.__f5refusal=null');
await tap(pts.cast);
let bounced = false;
for (let i = 0; i < 10 && !bounced; i++) { bounced = ((await ev('String(window.__f5refusal)')) === 'home'); if (!bounced) await sleep(400); }
ok('CAST ANSWERS again after the lift (a real tap runs the one-letter bounce)', bounced && await ev("game.scene.getScene('battle').sel.length === 0"));
// THE ONCE LAW — a later stall only glints; the hand is never taken twice
await sleep(900);   // the bounce settles home
const glint0 = await ev('window.__f5glint | 0');
await ev("(()=>{const b=game.scene.getScene('battle');b.f5Glinted=false;b.f5LastTap=b.time.now-11000;return 1})()");
let reglint = false;
for (let i = 0; i < 16 && !reglint; i++) { await nudge(i + 90); reglint = ((await ev('window.__f5glint | 0')) > glint0); if (!reglint) await sleep(500); }
ok('a later stall only GLINTS — the lesson never takes the hand twice', reglint && ((await ev('(window.__f5scry||{}).armed | 0')) === 1) && await ev("game.scene.getScene('battle').f5ScryGate === null"));
ok('…and the ribbon never spoke OVER the lesson (the gate owned the voice)', (await ev('(window.__f5prompt||{}).scry | 0')) === pr0, 'ribbon count ' + await ev('(window.__f5prompt||{}).scry | 0') + ' (was ' + pr0 + ')');
ok('zero exceptions through the whole lesson', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ======== §3c THE CLEAN REFRESH — the fix itself (F5-FIX1-01) ======== */
console.log('— §3c THE CLEAN REFRESH: a player refresh is a true first open —');
// the night is standing (held fight, stats, marks). Put a sentinel beside
// them, then refresh like a thumb would — Page.reload, NO survive flag
await ev("localStorage.setItem('beta3.f5sentinel', 'standing')");
ok('the night stands before the refresh (held fight in the pocket)', await ev("localStorage.getItem('beta3.quickck') !== null"));
errs.length = 0;
await send('Page.reload', {});
await sleep(2500);
let wiped = false;
for (let i = 0; i < 40 && !wiped; i++) { wiped = await ev("localStorage.getItem('beta3.f5sentinel') === null && localStorage.getItem('beta3.quickck') === null && localStorage.getItem('beta3.stat') === null"); if (!wiped) await sleep(1000); }
ok('PULL-TO-REFRESH WIPES THE NIGHT: sentinel, held fight and stat all gone', wiped);
let virgin = false;
for (let i = 0; i < 40 && !virgin; i++) { virgin = (await ev('typeof SS !== "undefined" && SS.prof ? SS.prof.ftue : null')) === 0; if (!virgin) await sleep(1000); }
ok('the FTUE gate is OPEN again — the refresh made a stranger (ftue 0 = owed)', virgin);
ok('the lit sky is empty again', (await ev("typeof ssF5LitList === 'function' ? ssF5LitList().length : null")) === 0);
let start = null; // the tutorial at its VERY start: the lure asks, and waits
for (let i = 0; i < 180 && !start; i++) { const st = await ev("window.__ssftue ? window.__ssftue.state : null"); if (st === 'lure') start = st; if (!start) await sleep(1000); }
ok('the tutorial stands at its very start — the lure asks again, at the title', start === 'lure' && await ev("(()=>{try{const h=game.scene.getScene('home');return !!(h.f5TitleFx&&h.f5TitleFx.t.active)&&(-h.cameras.main.scrollY/h.sky.T)>=0.9}catch(e){return false}})()"));
ok('zero exceptions through the clean refresh', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ================= §4 the reset door ================= */
console.log('— §4 the reset door (redundant now, still honored) —');
await ev("localStorage.setItem('beta3.f5sentinel', 'reset-me')");
await ev('window.__f5survive()');   // even CARRIED, an explicit reset wins
await go(BASE + '?reset=1');
await sleep(4000);
ok('?reset=1 wiped the night — even over a survive flag (reset out-ranks)', await ev("localStorage.getItem('beta3.f5sentinel') === null && localStorage.getItem('beta3.stat') === null"));
ok('?reset=1 scrubbed itself from the URL', await ev("!location.search.includes('reset')"), await ev('location.search'));
let reborn = false;
for (let i = 0; i < 20 && !reborn; i++) { reborn = (await ev('typeof SS !== "undefined" && SS.prof ? SS.prof.ftue : null')) === 0; if (!reborn) await sleep(1000); }
ok('the first open is VIRGIN again (ftue gate re-open)', reborn);
ok('zero exceptions on the reborn open', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log('\n' + pass + ' passed · ' + fail + ' failed');
kids.forEach((k) => { try { k.kill(); } catch (e) { } });
process.exit(fail ? 1 : 0);
