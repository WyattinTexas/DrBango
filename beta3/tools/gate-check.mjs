// GATE-CHECK — THE LEVEL GATE: the endless between-level card + the weekly
// flag fan (v0.115.0). Skylar (9/3, built on his 10/8 verdicts): "before each
// level, please include an aesthetically pleasing level that says what level
// you're on … The user clicks, it fades out, and level 1 starts … you can see
// all the people who ended their journey at that level … ten flags … fan them
// out like each flag is a finger on a hand … flip the flag [on the left] …
// removed and reset Whenever the weekly reset happens." This build knowingly
// RETIRES v0.77's in-climb flags at his word (flag-check keeps the monuments:
// the board row, the profile sheet, the rating card).
//
// The game side: before EVERY endless level — level 1 included, a resume
// re-showing LEVEL N — THE CLEAR GATE (v0.116.0, Skylar 10/9: "we don't need
// the grayed-out blocked letters … the player's health … the Endless Sky at
// the top … the Cast and Scribe button"): the board, the beast's own
// furniture AND the HUD all go dark — only the score, the sigil dock and the
// back arrow stay beside the card — and a gate left untapped for ~1s fades in
// "tap to continue" (every gate; a tap before that never sees it); LEVEL N
// condenses in gold
// letterpress; the week's flags rise around it as two mirrored hands of five
// (SS_GATE_SLOTS: ranks alternate right/left, inner tallest+highest, leans AS
// MOCKED; left hand = the baked flagL-<colour> texture, name/roundel never
// mirrored; cloth names at w≥78 BY RULE — the inner six). THE LEDGER reads
// every standing name under the fan + "+N more". ≤4 flags → ×1.18 bump; empty
// = the numeral alone. The own flag takes its earned seat under a gold aura.
// THE FRONTIER re-seats on the gate (gold numeral, ≥1 rival weekly flag, once
// per climb via the run.ffront checkpoint). The fan reads the endless/<isoWeek>
// slice once per climb (getWeekFlags), weekKey-stamped, refetched past the
// Monday turnover. State 'gate' MEANS settled-and-tappable (the v0.80 map law);
// ?gate=0 skips; demoStep enters at once; reduce-motion deals pure fades.
// Self-launching like flag-check: serves beta3 on :8899 if nothing does,
// headless Chrome on :9481 (/tmp/cdp-gate, --disable-gpu), Firebase blocked at
// the network layer throughout (local sky), real DPR-3 taps; SHOTS=<dir> keeps
// screenshots.
//
//   perl -e 'alarm 580; exec @ARGV' node tools/gate-check.mjs
//
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
const PORT = 9481, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= 1. the paper (source, no browser) ================= */
console.log('\nGATE-CHECK · the level gate + the weekly flag fan\n');
console.log('— THE PAPER —');
const src = {
  game: readFileSync('game.js', 'utf8'), data: readFileSync('data.js', 'utf8'),
  net: readFileSync('net.js', 'utf8'), strings: readFileSync('strings.js', 'utf8'),
  index: readFileSync('index.html', 'utf8'),
};
const build = (src.game.match(/const BUILD = 'STARSPELL v([\d.]+)'/) || [])[1];
const stamps = [...src.index.matchAll(/\?v=([\d.]+)/g)].map((m) => m[1]);
ok('release ritual: BUILD ' + build + ' and all ' + stamps.length + ' ?v= stamps agree',
  !!build && stamps.length >= 12 && stamps.every((s) => s === build));
// the gate exists only in endless — the three doors into it, all mode-gated
ok('the gate deals only in endless (create entry · afterSigil · demoStep)',
  /else if \(this\.mode === 'endless'\) this\.showGate\(\);/.test(src.game) &&
  /else if \(this\.mode === 'endless'\) this\.showGate\(\);\s+\/\/ THE LEVEL GATE[^\n]*offer/.test(src.game) &&
  /if \(this\.state === 'gate'\) \{/.test(src.game));
ok('the removal seam is the ?gate=0 door (the ?ride=0 precedent)',
  /if \(QS\.get\('gate'\) === '0'\) \{ this\.startFight\(\); return; \}/.test(src.game));
// THE CLEAR GATE (v0.116.0): the HUD sinks with the board, every piece handed back at startFight
ok('the clear gate: gateHud rides gateSink to alpha 0 and startFight hands every piece back',
  /gateHud\(\) \{/.test(src.game) && /\.concat\(this\.gateBeastFurniture\(\), this\.gateHud\(\)\)/.test(src.game) &&
  /const hud = this\.gateHud\(\);/.test(src.game) && /hud\.forEach\(\(o\) => o\.setAlpha\(1\)\);/.test(src.game) &&
  /this\.headT\.setAlpha\(0\.9\);/.test(src.game));
ok('the hint is per-gate after SS_GATE_HINT_MS = 1000 (the first-of-session latch retired) and reads "tap to continue"',
  /const SS_GATE_HINT_MS = 1000;/.test(src.game) && !/SS_GATE_HINTED/.test(src.game) &&
  /this\.time\.delayedCall\(SS_GATE_HINT_MS,/.test(src.game) && /c\.__hint = hint;/.test(src.game) &&
  /gateTap: 'tap to continue'/.test(src.strings) && /gateTap: 'toca para continuar'/.test(src.strings) &&
  /gateTap: 'touche pour continuer'/.test(src.strings) && /gateTap: 'zum Fortfahren tippen'/.test(src.strings));
ok('the fan reads the week: getWeekFlags over endless/<isoWeek>, own row kept',
  /async function getWeekFlags\(\)/.test(src.net) && /const wk = weekKey\(\);/.test(src.net) &&
  /dbGet\('endless\/' \+ wk\)/.test(src.net) && /mine: id === uid\(\)/.test(src.net) &&
  /getWeekFlags,/.test(src.net));
ok('zero new writes / zero new sweep: submitEndless + pruneBoards untouched by the gate',
  /await dbTxn\('endless\/' \+ weekKey\(\) \+ '\/' \+ me, rec\);/.test(src.net) &&
  /\/\^\\d\{4\}-W\\d\{2\}\$\/\.test\(k\) && k < weekCut/.test(src.net));
// the ten hand slots — ground points, leans AS MOCKED, five mirrored
const slotM = src.game.match(/const SS_GATE_SLOTS = \[([\s\S]*?)\];/);
const slots = slotM ? [...slotM[1].matchAll(/\{ x: (-?\d+), y: (\d+), w: (\d+), rot: (-?\d+)(?:, m: 1)? \}/g)]
  .map((m) => ({ x: +m[1], y: +m[2], w: +m[3], rot: +m[4], m: /m: 1/.test(m[0]) })) : [];
ok('ten hand slots, ground points as the mock writes them', slots.length === 10, slots.length + ' slots');
ok('ranks alternate right / left, five mirrored on the left',
  slots.filter((s) => !s.m).every((s, i) => s.x > 0) && slots.filter((s) => s.m).length === 5 &&
  slots.every((s, i) => (i % 2 === 0) === (s.x > 0)));
ok('the inner is tallest + highest planted, stepping down and out to the pinkies',
  slots[0].w === 104 && slots[0].y === 434 && slots[9].w === 66 && slots[9].y === 528 &&
  slots.every((s, i) => i === 0 || Math.abs(s.x) >= Math.abs(slots[i - 1].x) - 1));
ok('the lean is AS MOCKED — 3° inner out to ~10-12° at the pinkies',
  Math.abs(slots[0].rot) === 3 && slots.every((s) => Math.abs(s.rot) >= 3 && Math.abs(s.rot) <= 12));
ok('the inner six carry cloth names by rule (w≥78), the outer four fly bare',
  slots.slice(0, 6).every((s) => s.w >= 78) && slots.slice(6).every((s) => s.w < 78));
// the mirror is a BAKED texture, the name/roundel never mirror
ok('the left hand is a baked texture (flagL-<colour>), not a scaled container',
  /function ssFlagTexL\(scene, colorId\)/.test(src.game) && /'flagL-' \+ col/.test(src.game) &&
  /c\.translate\(260, 0\); c\.scale\(-1, 1\);/.test(src.game));
ok('ssFlag lays the name + roundel upright on EITHER hand (never mirrored)',
  /const M = !!o\.mirror;/.test(src.game) && /M \? ssFlagTexL\(scene, col\) : ssFlagTex\(scene, col\)/.test(src.game) &&
  /u\(M \? -83 : 83\)/.test(src.game));
// the strings
const GKEYS = ['gateLevel', 'gateTap', 'gateMore', 'flagFront', 'flagFrontSub'];
const GSLOT = { gateMore: ['%1'], flagFrontSub: ['%1', '%2'] };
let strOk = true, strWhy = '';
for (const lang of ['en', 'es', 'fr', 'pt', 'de']) {
  const m = src.strings.match(new RegExp("  " + lang + ": \\{([\\s\\S]*?)\\n  \\},"));
  const blk = m ? m[1] : '';
  for (const k of GKEYS) {
    const km = blk.match(new RegExp("\\b" + k + ": '((?:[^'\\\\]|\\\\.)*)'"));
    if (!km) { strOk = false; strWhy = lang + ' misses ' + k; break; }
    for (const s of GSLOT[k] || []) if (!km[1].includes(s)) { strOk = false; strWhy = lang + '.' + k + ' misses ' + s; }
  }
}
ok('the gate strings ride in all five tongues, slots intact (gateLevel/gateTap/gateMore + the re-pointed frontier)', strOk, strWhy);

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
try { rmSync('/tmp/cdp-gate', { recursive: true, force: true }); } catch (e) { }
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-gate', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const ev = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r?.result?.value;
};
const evj = async (e) => JSON.parse(await ev(e));
const until = async (e, cap = 45000, step = 300) => {
  for (let i = 0; i < cap / step; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(step); }
  return false;
};
const shot = async (name) => {
  if (!SHOTS) return;
  try { mkdirSync(SHOTS, { recursive: true }); const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(SHOTS + '/' + name + '.png', Buffer.from(r.data, 'base64')); } catch (e) { }
};
const B = `game.scene.getScene('battle')`;
const PICK = `!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`;
const GATE = `!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state === 'gate'`;
const GATEBEA = `JSON.stringify(window.__ssgate || {})`;
// the fan that stands: per flag container, its baked texture (the jar + hand)
// and any name on the cloth, read deep (the name lives INSIDE the flag)
const FAN = `JSON.stringify((() => { const c = ${B}.gateC; if (!c || !c.__fan) return [];
  const out = [];
  for (const fc of c.__fan.list) { if (!fc.list) continue;
    const img = fc.list.find((o) => o.texture && /^flagL?-/.test(o.texture.key));
    if (!img) continue;
    const nm = fc.list.find((o) => o.style && o.text && o.text.length > 1);
    // the aura is 'glowbig' — but the Canvas tint shim re-keys a tinted image
    // to '<base>#<hex>' and stamps __ssBaseTex (the v0.84 law), so match both
    const aura = fc.list.some((o) => (o.__ssBaseTex === 'glowbig') || (o.texture && o.texture.key && o.texture.key.indexOf('glowbig') === 0));
    out.push({ tex: img.texture.key, name: nm ? nm.text : '', aura }); }
  return out })())`;
const LEDGER = `JSON.stringify((() => { const c = ${B}.gateC; if (!c || !c.__fan) return [];
  return c.__fan.list.filter((o) => o.style && o.text && o.text.indexOf('·') >= 0 && !o.list).map((o) => o.text) })())`;
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1');
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
// seed the WEEKLY slice (endless/<isoWeek>) through the real channel, keyed by
// the live uid for the own row, then re-read it into the standing climb
const seedWeek = async () => {
  await ev(`(async () => { const wk = SSNET.weekKey(), me = SSNET.uid();
    const rows = {
      test_r1: { name: 'Velvet Fox', lvl: 2, score: 400, word: 'MOON', at: 1, c: 'blue' },
      test_r2: { name: 'Astral Owl', lvl: 2, score: 300, word: 'STAR', at: 2, c: 'red' },
      test_veil: { name: 'Umbral Widow', lvl: 2, score: 900, word: 'VEIL', at: 3, c: 'purple', v: 1 },
      sg_fake: { name: 'Seeded Ghost', lvl: 2, score: 999, word: 'FAKE', at: 4, c: 'gold' },
    };
    rows[me] = { name: SSNET.myName(), lvl: 9, score: 777, word: 'OWN', at: 5, c: 'orange' };
    // twelve at level 12 for the overflow + ledger + tier rule
    const NM = ['Moth Choir','Iron Wick','Dawn Kestrel','Sable Moon','Wisp Lantern','Ashen Owl','Quiet Widow','Velvet Paw','Star Herald','Mr Bingles','Pale Fox','Dusk Hare'];
    const CL = ['black','orange','white','purple','teal','red','tan','blue','gold','green','blue','red'];
    for (let i = 0; i < 12; i++) rows['test_c' + i] = { name: NM[i], lvl: 12, score: 5000 - i * 100, word: 'DEEP', at: 10 + i, c: CL[i] };
    await SSNET.dbSet('endless/' + wk, rows); return 'ok' })()`);
  await ev(`(() => { const b = ${B}; b.flagRows = null; b.fetchWeekFlags(); return 'ok' })()`);
  await until(`!!${B}.flagRows`, 15000);
};
// from any state, reach the gate for level `lv`: tap through a standing gate,
// settle on pick, set the level, deal the gate, wait for it to settle
const gateAt = async (lv) => {
  if (await ev(`${B}.state === 'gate'`)) { await ev(`${B}.gateZone.emit('pointerdown'); 'ok'`); await until(PICK, 20000); }
  await until(PICK, 20000);
  await ev(`(() => { const b = ${B}; b.run.fightIdx = ${lv - 1}; b.showGate(); return 'ok' })()`);
  return until(`${GATE} && (window.__ssgate||{}).level === ${lv}`, 20000);
};

/* ================= 2. the gate itself: the state law, the dress ================= */
console.log('— THE GATE (the entry card, the state law) —');
await boot('endless=1');
ok('the entry gate deals before level 1 (verdict: level 1 included)', await until(GATE, 60000), await ev(`${B} && ${B}.state`));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
let g = await evj(GATEBEA);
ok("'gate' MEANS settled-and-tappable, the beacon shown once, level 1", g.level === 1 && g.shown === 1 && await ev(`${B}.state === 'gate'`), JSON.stringify(g));
// THE CLEAR GATE: nothing under the card but the score, the dock and the back arrow
const HUD_DARK = `(() => { const b = ${B}; return [b.headT, ...b.pips, b.youT, b.hpTrough, b.hpBar, b.hpT, b.castB, b.castT, b.scryB, b.scryT, ...b.scryPips, b.hintB, b.hintT].every((o) => o && o.alpha === 0) })()`;
const HUD_KEPT = `(() => { const b = ${B}; return b.scoreT.alpha === 1 && b.scoreT.visible && b.dockC.visible && b.dockC.alpha === 1 && b.homeB.alpha === 1 && b.homeB.visible })()`;
const HUD_BACK = `(() => { const b = ${B}; return b.headT.alpha === 0.9 && b.pips.every((p) => p.alpha === 1) && [b.youT, b.hpTrough, b.hpBar, b.hpT, b.scryB, b.scryT, b.hintB, b.hintT].every((o) => o.alpha === 1) && b.castB.alpha > 0.4 && b.castT.alpha > 0.4 && b.scryPips.every((p) => p.alpha > 0) })()`;
const HINT = `(() => { const c = ${B}.gateC; return c && c.__hint ? c.__hint.alpha : -1 })()`;
ok('no letters under the card: the board + word-line went fully dark (was a tenth)', await ev(`${B}.boardC.alpha === 0 && ${B}.lineC.alpha === 0`));
ok('the beast\'s own furniture went dark (bar, title, hint)', await ev(`${B}.ehpC.alpha === 0 && ${B}.beastTitle.alpha === 0 && ${B}.lineHint.alpha === 0`));
ok('the header line + its pips, the YOU row and the CAST/SCRY row hid with it', await ev(HUD_DARK));
ok('the score, the sigil dock and the back arrow stay beside the card (the header still names the level for its return)',
  await ev(HUD_KEPT) && await ev(`${B}.headT.text === SS_T('endlessTitle') + ' · ' + SS_T('endLvl', 1)`));
ok('nothing in the whole card is interactive but the one sky zone', await ev(`(() => { let n = 0; const scan = (ls) => ls.forEach((o) => { if (o.input && o.input.enabled && o.type !== 'Zone') n++; if (o.list) scan(o.list); }); scan(${B}.gateC.list); return n })()`) === 0);
ok('the sky zone fires on the UP (the mapZone contract), honoring the 8u drag', await ev(`!!${B}.gateZone && ${B}.gateZone.type === 'Zone'`));
await shot('gate-entry-l1');
// the hint law: a gate left standing fades "tap to continue" in after ~1s
ok('a gate left untapped fades in "tap to continue" after ~1s (the beacon counts the hint)',
  await until(`(window.__ssgate || {}).hints === 1 && ${HINT} > 0.85`, 6000, 100), JSON.stringify(await evj(GATEBEA)) + ' alpha ' + await ev(HINT));
ok('…in the five-tongue string, the game\'s own dim italic hint type', await ev(`${B}.gateC.__hint.text === SS_T('gateTap') && SS_T('gateTap') === 'tap to continue' && ${B}.gateC.__hint.style.fontStyle === 'italic'`));
await shot('gate-entry-l1-hint');
// the tap — one gesture — enters, the fight rises back from under the gate
await ev(`${B}.gateZone.emit('pointerdown'); 'ok'`);
ok('a tap enters the fight (pick, board dealt)', await until(PICK, 20000));
ok('the board rose back to full, the gate was swept', await ev(`${B}.boardC.alpha === 1 && !${B}.gateC`));
ok('every hidden piece came back: header 0.9, pips, the YOU row, CAST on its own validity alpha, SCRY, the eye', await ev(HUD_BACK));
let gt = await evj(GATEBEA);
ok('the beacon counted the tap', (gt.taps | 0) >= 1, JSON.stringify(gt));
// a gate tapped inside its first second never shows the hint: deal one and
// enter mid-entrance (the synthetic emit snaps + continues at once)
await ev(`(() => { const b = ${B}; b.run.fightIdx = 0; b.showGate(); return 'ok' })()`);
await until(`${B}.state === 'anim' || ${B}.state === 'gate'`, 5000, 60);
await ev(`${B}.gateZone.emit('pointerdown'); 'ok'`);
await until(PICK, 20000);
await sleep(1400);   // past where the hint would have landed
ok('a gate tapped inside the first second never shows the hint (the timer finds the card gone)', (await evj(GATEBEA)).hints === 1 && await ev(HUD_BACK), JSON.stringify(await evj(GATEBEA)));

/* ================= 3. the fan: slots, mirror, tier, sparse ================= */
console.log('— THE FAN (two hands, mirrored, named by rule) —');
await seedWeek();
ok('level 2 fans the two rivals — the veiled + the ghost stand NOWHERE', await gateAt(2));
await sleep(900);
let fan = await evj(FAN);
g = await evj(GATEBEA);
ok('two flags stand (veiled Umbral + sg_ ghost excluded from the fan)', g.drawn === 2 && fan.length === 2, JSON.stringify(fan.map((f) => f.tex)));
ok('rank 1 is the right hand (Velvet Fox, blue cloth, name across it)',
  fan.some((f) => f.tex === 'flag-blue' && f.name === 'VELVET FOX'), JSON.stringify(fan));
ok('rank 2 is the LEFT hand — the BAKED mirrored texture, name still upright',
  fan.some((f) => f.tex === 'flagL-red' && f.name === 'ASTRAL OWL'), JSON.stringify(fan));
ok('the sparse bump fired (≤4 flags → every cloth ×1.18)', await ev(`(() => { const fc = ${B}.gateC.__fan.list.find((o) => o.list && o.list.some((x) => x.texture && x.texture.key === 'flag-blue'));
  const img = fc.list.find((x) => x.texture && x.texture.key === 'flag-blue'); const l = ${B}.L;
  return Math.abs(img.displayWidth - l.u(104 * 1.18)) < l.u(3) })()`));
await shot('gate-fan-l2');

/* ================= 4. the own flag, the aura ================= */
console.log('— THE OWN FLAG (earned seat, gold aura) —');
ok('level 9 stands the own flag alone', await gateAt(9));
await sleep(900);
fan = await evj(FAN);
g = await evj(GATEBEA);
const myNm = (await ev(`SSNET.myName()`)).toUpperCase();
ok('the own flag takes its seat — orange cloth, this mage\'s name, the gold aura',
  g.mine === true && fan.some((f) => f.tex === 'flag-orange' && f.name === myNm && f.aura), JSON.stringify(fan));
await shot('gate-own-l9');

/* ================= 5. overflow + the ledger + the tier rule ================= */
console.log('— OVERFLOW, THE LEDGER, THE TIER RULE —');
ok('level 12 stands ten best + "+2 more"', await gateAt(12));
await sleep(1000);
fan = await evj(FAN);
g = await evj(GATEBEA);
ok('ten flags stand, +2 more kept honest (twelve at the rung)', g.drawn === 10 && g.more === 2 && fan.length === 10, JSON.stringify({ drawn: g.drawn, more: g.more }));
ok('the inner six fly named cloth, the outer four fly bare (the w≥78 rule)',
  fan.filter((f) => f.name).length === 6 && fan.filter((f) => !f.name).length === 4,
  fan.filter((f) => f.name).length + ' named');
const led = await evj(LEDGER);
ok('THE LEDGER reads every standing name under the fan (two clamped lines)', led.length === 2 && /·/.test(led[0]), JSON.stringify(led));
ok('the "+N more" line carries the overflow count', /2/.test(led.join(' ')) && led.join(' ').includes(await ev(`SS_T('gateMore', 2).replace('%1','2').slice(3)`)) || /more|más|plus|mais|weitere/.test(led.join(' ')), JSON.stringify(led));
await shot('gate-overflow-l12');

/* ================= 6. the empty rung ================= */
// level 5 holds no rows and sits BELOW the week's highest rival (12), so it is
// a genuine empty rung — not a frontier (a no-rows rung ABOVE the max is gold,
// not quiet); and it must not latch ffront before the frontier test below
console.log('— THE EMPTY RUNG (the quiet card) —');
// a held sigil so the dock stands at this gate (Skylar's own LEVEL 5 shot had
// one) — COMET also prints scry pips, which the clear gate must hide too
await ev(`(() => { const b = ${B}; b.run.sigils = ['comet']; b.refreshDock(); return 'ok' })()`);
ok('level 5 stands the numeral alone', await gateAt(5));
await sleep(700);
g = await evj(GATEBEA);
fan = await evj(FAN);
ok('no flag stands, no ledger, no apology, no frontier — the quiet IS the message',
  g.drawn === 0 && fan.length === 0 && (g.more | 0) === 0 && g.front === false, JSON.stringify(g));
ok('the sigil dock stands beside the clear card; the comet\'s scry pips hid with the SCRY button', await ev(HUD_KEPT) && await ev(HUD_DARK) && await ev(`${B}.scryPips.length > 0 && ${B}.dockC.list.length > 0`));
await sleep(900);   // ≥1s in: the hint stands on this gate too
ok('"tap to continue" stands on this gate too (every gate, not the first alone)', await until(`${HINT} > 0.85`, 4000, 100), 'alpha ' + await ev(HINT));
await shot('gate-empty-l5');

/* ================= 7. the frontier (≥1 rival, once per climb) ================= */
console.log('— THE FRONTIER (gold, once per climb, checkpoint-latched) —');
// the week's highest rival stands at 12 → level 13 is the frontier
ok('level 13 stands the frontier — above every rival flag', await gateAt(13));
await sleep(900);
g = await evj(GATEBEA);
ok('THE FRONTIER rings: gold numeral, the beat, ffront latched', g.front === true && g.level === 13 && await ev(`${B}.run.ffront === true`), JSON.stringify(g));
ok('the beat names the week\'s crown (flagFront + flagFrontSub)', await ev(`(() => { const c = ${B}.gateC; let hit = false;
  const scan = (ls) => ls.forEach((o) => { if (o.text === SS_T('flagFront')) hit = true; if (o.list) scan(o.list); }); scan(c.list); return hit })()`));
const ck = await evj(`localStorage.getItem('beta3.endless')`);
ok('the frontier rode the checkpoint (ffront 1; fpassLv retired — not written)', ck && ck.ffront === 1 && !('fpassLv' in ck), JSON.stringify({ ff: ck && ck.ffront, fp: ck && ck.fpassLv }));
await shot('gate-frontier-l13');
// once per climb: a higher gate never re-rings
ok('level 14 stands — NO second frontier (once per climb)', await gateAt(14));
await sleep(700);
g = await evj(GATEBEA);
ok('the next gate rings no second frontier', g.front === false, JSON.stringify(g));

/* ================= 8. the early-tap snap ================= */
console.log('— THE EARLY-TAP SNAP (one gesture, no wait-tax) —');
await ev(`${B}.gateZone.emit('pointerdown'); 'ok'`); await until(PICK, 20000);
// deal a gate and tap it WHILE it is still animating in (state 'anim')
await ev(`(() => { const b = ${B}; b.run.fightIdx = 1; b.showGate(); return 'ok' })()`);
await until(`${B}.state === 'anim'`, 5000, 60);
// past the 300ms residue guard, a mid-entrance real tap snaps + continues
await sleep(340);
const wasAnim = await ev(`${B}.state === 'anim' || ${B}.state === 'gate'`);
await ev(`${B}.gateZone.emit('pointerdown'); 'ok'`);   // synthetic enters at once (demo contract); proves the snap path reaches startFight
ok('a mid-entrance tap snaps the gate and continues in the same gesture', wasAnim && await until(PICK, 20000));

/* ================= 9. demoStep + ?gate=0 + reduce-motion ================= */
console.log('— THE SEAMS (demo · ?gate=0 · reduce-motion) —');
// demoStep: at a gate, a bare synthetic pointerdown enters at once
await ev(`(() => { const b = ${B}; b.run.fightIdx = 1; b.showGate(); return 'ok' })()`);
await until(GATE, 20000);
await ev(`${B}.demoStep(); 'ok'`);
ok('demoStep rides the gate through (the mapZone contract)', await until(PICK, 20000));
// ?gate=0: the removal seam — straight to the fight, no gate, no beacon
await boot('endless=1&gate=0');
ok('?gate=0 boots straight to pick — no gate, no beacon', await until(PICK, 60000) && await ev(`!window.__ssgate && !${B}.gateC`));
// reduce-motion: the gate still SHOWS (content, not motion) — pure fades
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await boot('endless=1');
ok('reduce-motion still deals the gate (it is content, not motion)', await until(GATE, 60000));
g = await evj(GATEBEA);
ok('…the card shows, settled, no rises', g.level === 1 && await ev(`${B}.state === 'gate'`), JSON.stringify(g));
await send('Emulation.setEmulatedMedia', { features: [] });

/* ================= 10. the weekly rollover refetch ================= */
console.log('— THE WEEK (the Monday-rollover refetch) —');
await boot('endless=1');
await until(GATE, 60000);
await seedWeek();
const wkNow = await ev(`SSNET.weekKey()`);
ok('the fetch stamped the live week', await ev(`${B}.flagWeek`) === wkNow, await ev(`${B}.flagWeek`));
// a gate entered after the Monday turnover sees the stamp stale and refetches
await ev(`(() => { ${B}.flagWeek = '2020-W01'; return 'ok' })()`);
await ev(`${B}.gateZone.emit('pointerdown'); 'ok'`); await until(PICK, 20000);
await ev(`(() => { const b = ${B}; b.run.fightIdx = 1; b.showGate(); return 'ok' })()`);
await until(GATE, 20000);
await sleep(800);
ok('a stale weekKey refetches at the next gate (back to the live week)', await ev(`${B}.flagWeek`) === wkNow, await ev(`${B}.flagWeek`));

/* ================= 11. the spanish dress ================= */
console.log('— THE SPANISH DRESS —');
await boot('endless=1&lang=es');
await until(GATE, 60000);
await seedWeek();
ok('the spanish entry gate stands (NIVEL)', await ev(`SS_T('gateLevel')`) === 'NIVEL', await ev(`SS_T('gateLevel')`));
ok('the gate word on the card reads NIVEL', await ev(`(() => { const c = ${B}.gateC; let hit = false;
  const scan = (ls) => ls.forEach((o) => { if (o.text === 'NIVEL') hit = true; if (o.list) scan(o.list); }); scan(c.list); return hit })()`));
await gateAt(13);
await sleep(900);
ok('the frontier beat speaks Spanish (LA FRONTERA ES TUYA)', await ev(`(() => { const c = ${B}.gateC; let hit = false;
  const scan = (ls) => ls.forEach((o) => { if (o.text === SS_T('flagFront')) hit = true; if (o.list) scan(o.list); }); scan(c.list); return hit })()`)
  && await ev(`SS_T('flagFront')`) === '✦ LA FRONTERA ES TUYA ✦');
await shot('gate-es-l13');
ok('no page errors anywhere', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= the verdict ================= */
console.log('\n' + pass + ' passed · ' + fail + ' failed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
try { ws.close(); } catch (e) { }
process.exit(fail ? 1 : 0);
