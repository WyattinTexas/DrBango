// HARD-CHECK — the beast strikes every 10 seconds unless you keep casting
// (v0.70.0). Skylar (9/1): "under each sign in the new campaign there should
// be a box that lets you tick off if you want to play that sign in hard
// mode … the beast will attack every 10 seconds so you have to spell words
// quickly … Every time you spell a word and cast a word, that timer goes
// back up to 10 seconds … the sigils and sigil upgrades should happen even
// less … your score should also be amplified … at the end of your total
// tally … There should also be achievements for beating a certain sign on
// hard, maybe beating all the signs on hard … we could probably add
// something to the leaderboard as well for hard mode runs."
// The game side: hard is a MODIFIER (Battle.hard) — pinned by the picker's
// drawn tick box into beta3.camphard + prof.hardPick (per sign), riding the
// checkpoint as `hard`. SS_HARD (data.js) holds every dial: strikeMs 10000,
// warnMs 3000, scoreMult 1.5, and the boss knobs hardMult 1.0 / hardAtkAdd
// 0 for Skylar's post-test tuning. The strike clock is ACTIVE-PLAY (the
// v0.61 gates): it runs only at state 'pick' with the page visible+focused,
// resets on every successful cast, and at zero throws the beast's NORMAL
// strike through strikeNow (the cast counter untouched — both threats
// live). The cadence stretches by SS_CADENCE.hard.gapAdd; the final tally
// multiplies by scoreMult beside the tome's price and prints its own ⚑ row;
// a hard campaign clear records signs[id].hardClears, rings 'hard-<sign>'
// (12 of them crown 'hard-zodiac'), lands on hard/all (the Board's fourth
// tab) and stamps its weekly row h:1 (the small ⚑ mark).
// Self-launching like endless-check: serves beta3 on :8899 if nothing does,
// headless Chrome on :9469 (/tmp/cdp-hard, --disable-gpu), Firebase blocked
// at the network layer throughout (local sky). The clock rig rides
// Page.addScriptToEvaluateOnNewDocument (clock-check's own): Date.now skewed
// by window.__skew in sub-4s chunks (a single 10s jump must be DROPPED — the
// frozen-tab law), visibility/focus steered by __vis/__foc.
//
//   perl -e 'alarm 580; exec @ARGV' node tools/hard-check.mjs   # ~5 min
//
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const PORT = 9469, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-hard', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
// the fake clock (clock-check's rig): Date.now + visibility + focus are all
// steerable; navigator.share stripped so no native sheet can ever open
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => {
    const _now = Date.now; window.__skew = 0;
    Date.now = () => _now.call(Date) + window.__skew;
    window.__vis = null;
    Object.defineProperty(document, 'visibilityState', { get: () => window.__vis || 'visible', configurable: true });
    Object.defineProperty(document, 'hidden', { get: () => (window.__vis || 'visible') === 'hidden', configurable: true });
    window.__foc = null;
    document.hasFocus = () => window.__foc == null ? true : window.__foc;
    navigator.share = undefined; navigator.clipboard = undefined;
  })();`,
});
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
const tapUntil = async (expr, cond, tries = 5) => {
  for (let t = 0; t < tries; t++) {
    try { await tap(expr); } catch (e) { }
    await sleep(700);
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
const HOME = `!!window.game && ${H} && ${H}.sys.isActive() && !!${H}.rowBtns`;
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1');
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); window.__skew = 0; ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
// keep the standing sky (profile, checkpoint, pins) — a reload, not a wipe
const reboot = async (q) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`sessionStorage.setItem('beta3.skipIntro', '1'); window.__skew = 0; 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
// advance the fake clock in sub-cap chunks, one per real frame batch, so the
// heartbeat counts every one (a single big jump is the frozen-tab shape and
// is DROPPED — that law gets its own check)
const advance = async (ms, chunk = 2000) => {
  for (let left = ms; left > 0; left -= chunk) {
    await ev(`window.__skew += ${Math.min(chunk, left)}; 'ok'`);
    await sleep(120);
  }
};
// a container-tree finder for tagged objects (rites, cards, boxes)
const find = (root, tag, val) => `(() => { let r = null;
  const scan = (ls) => ls.forEach((o) => { if (!r && o.getData && o.getData('${tag}') ${val ? `=== ${JSON.stringify(val)}` : ''}) r = o; if (o.list) scan(o.list); });
  scan(${root}.children ? ${root}.children.list : ${root}.list); return r })()`;
// the picker's harness peek
const peek = async () => evj(`JSON.stringify(${H}.signPeek ? { id: ${H}.signPeek().id, moving: ${H}.signPeek().moving } : null)`);
const goCard = async (dir) => {
  await ev(`${H}.signGo(${dir}); 'ok'`);
  await until(`${H}.signPeek && ${H}.signPeek().moving === false`, 6000, 120);
  await sleep(150);
};
// find a castable word on the live board (wake-check's helper, 7-letter cap)
const findWord = async (must, avoid, minLen = 2, maxLen = 7) => evj(`(() => {
  const b = ${B}, must = ${JSON.stringify(must || [])}, avoid = ${JSON.stringify(avoid || [])}; b.buildTrie();
  const tiles = b.board.map((s, i) => ({ s, i })).filter((x) => x.s && !avoid.includes(x.i));
  let best = null;
  const used = tiles.map(() => false), pick = [];
  const dive = (node) => {
    const idx = pick.map((k) => tiles[k].i);
    if (node.$ && idx.length >= ${minLen} && must.every((m) => idx.includes(m)) && (!best || idx.length > best.length)) best = idx.slice();
    if (pick.length >= ${maxLen}) return;
    for (let k = 0; k < tiles.length; k++) {
      if (used[k]) continue;
      let n = node, okk = true;
      for (const ch of tiles[k].s.ch) { n = n[ch]; if (!n) { okk = false; break; } }
      if (!okk) continue;
      used[k] = true; pick.push(k); dive(n); used[k] = false; pick.pop();
    }
  };
  dive(b.trie);
  return JSON.stringify(best);
})()`);
// spell a word with real taps and press CAST (dew-check's proven helper)
const castWord = async (idx) => {
  await until(`${B}.board.every((s, i) => !s || Math.abs(s.c.y - ${B}.slotPos(i).y) < 0.5)`, 8000, 100);
  for (const i of idx) {
    for (let t = 0; t < 4; t++) {
      await tap(`${B}.board[${i}].c`); await sleep(140);
      if (await ev(`${B}.sel.includes(${i})`)) break;
    }
  }
  const sel = await evj(`JSON.stringify(${B}.sel)`);
  if (sel.length !== idx.length) { console.log('    · taps selected ' + JSON.stringify(sel) + ' of ' + JSON.stringify(idx)); return false; }
  await tap(`${B}.castB`);
  await sleep(300);
  return until(PICK, 25000);
};
// fell the standing beast through the REAL death path
const fell = async () => {
  await until(`!!${B} && !${B}.dying && ${B}.state === 'pick'`, 20000, 250);
  const armed = await ev(`(() => { const b = ${B}; if (b.dying) return 'busy';
    b.beast.hpNow = -1; b.dying = true; b.beastDeath(); return 'ok' })()`);
  if (armed !== 'ok') return 'lost';
  const landed = await until(`(${B}.state === 'sigil' && ${B}.overlayC.list.some((o) => o.getData && o.getData('sigilCard') && o.alpha === 1))
    || ${B}.state === 'upgrade' || ${B}.state === 'map' || ${B}.state === 'end' || (${B}.state === 'pick' && !${B}.dying)`, 30000, 250);
  if (!landed) return 'lost';
  return ev(`${B}.state`);
};
const takeCard = async () => {
  for (let t = 0; t < 6; t++) {
    await tap(find(`${B}.overlayC`, 'sigilCard'));
    await sleep(450);
    if (await ev(`${B}.state !== 'sigil' && ${B}.state !== 'upgrade'`)) return true;
  }
  return ev(`${B}.state !== 'sigil' && ${B}.state !== 'upgrade'`);
};

console.log('\nHARD-CHECK · the beast strikes every 10 seconds unless you keep casting\n');

/* ================= 1. the laws on paper ================= */
console.log('— THE LAWS ON PAPER —');
await boot('quick=1');
ok('quick run at pick', await until(PICK, 60000));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
const dials = await evj(`JSON.stringify([SS_HARD.strikeMs, SS_HARD.warnMs, SS_HARD.scoreMult, SS_HARD.hardMult, SS_HARD.hardAtkAdd])`);
ok('SS_HARD dials as shipped: 10s clock · 3s warn · ×1.5 tally · boss knobs 1.0/+0',
  JSON.stringify(dials) === '[10000,3000,1.5,1,0]', JSON.stringify(dials));
ok('SS_CADENCE.hard is the gapAdd modifier row', await ev(`SS_CADENCE.hard && SS_CADENCE.hard.gapAdd === 1`));
const langs = await evj(`JSON.stringify(Object.keys(SS_STR).map((l) => [l, !!(SS_STR[l].hardLbl && SS_STR[l].hardLbl.length)]))`);
ok('hardLbl worded in all five languages', langs.length === 5 && langs.every(([, g]) => g),
  langs.filter(([, g]) => !g).map(([l]) => l).join(',') || '5');
const fam = await evj(`JSON.stringify((SS_ACH.find((a) => a.id === 'hard-sign') || {}).famIds || [])`);
ok('EMBER-SWORN is one display row over the 12 per-sign ids',
  fam.length === 12 && await ev(`SS_ZODIAC.every((z) => ${JSON.stringify(fam)}.includes('hard-' + z.id))`), fam.length);
ok('THE EMBER ZODIAC is the family row\'s crown (13 rows keep the seal — the layout law)', await ev(`(SS_ACH.find((a) => a.id === 'hard-sign') || {}).crown.id === 'hard-zodiac' && !SS_ACH.find((a) => a.id === 'hard-zodiac')`));
ok('SSNET grew submitHard', await ev(`typeof SSNET.submitHard === 'function'`));
ok('the hard board is tuned in the seed layer', await ev(`!!SS_SEED_TUNE.hard && SS_SEED_TUNE.hard.span === 'all'`));
// versus and the rival engine know nothing of the modifier — from source
const vsrc = await (await fetch('http://localhost:' + SRV + '/versus.js')).text();
const rsrc = await (await fetch('http://localhost:' + SRV + '/rival.js')).text();
const sym = /SS_HARD|camphard|hardLeft|hardStrike|hardPick|\.hard\b|submitHard/;
ok('versus.js and rival.js carry zero hard-mode symbols', !sym.test(vsrc) && !sym.test(rsrc));

/* the plan law: the modifier stretches the gap band — fewer offers, gaps
   3-5 between non-boss neighbors (gap [3,4] + the fold), determinism, the
   hook and the act bosses still pay, and hard=false is byte-identical to
   the bare call (normal runs untouched by construction) */
const planProbe = await evj(`(() => {
  const camp = [];
  for (let a = 0; a < 4; a++) for (let f = 0; f < 5; f++) camp.push({ actIdx: a });
  let nN = 0, nH = 0, hookBoss = true, det = true, bare = true, gapsOk = true, fewer = 0;
  for (let s = 1; s <= 200; s++) {
    const pn = [...ssSigilPlan('campaign', camp, s)].sort((x, y) => x - y);
    const ph = [...ssSigilPlan('campaign', camp, s, true)].sort((x, y) => x - y);
    const p2 = [...ssSigilPlan('campaign', camp, s, true)].sort((x, y) => x - y);
    if (JSON.stringify(ph) !== JSON.stringify(p2)) det = false;
    if (JSON.stringify(pn) !== JSON.stringify([...ssSigilPlan('campaign', camp, s, false)].sort((x, y) => x - y))) bare = false;
    nN += pn.length; nH += ph.length;
    if (ph.length < pn.length) fewer++;
    if (!ph.includes(0) || !ph.includes(4) || !ph.includes(9) || !ph.includes(14)) hookBoss = false;
    const bosses = [4, 9, 14];
    for (let i = 1; i < ph.length; i++) {
      const a = ph[i - 1], b = ph[i], gap = b - a;
      if (bosses.includes(b) || bosses.includes(a)) { if (gap < 1) gapsOk = false; continue; }
      if (gap < 3 || gap > 5) gapsOk = false;
    }
  }
  return JSON.stringify({ avgN: nN / 200, avgH: nH / 200, hookBoss, det, bare, gapsOk, fewer });
})()`);
ok('hard plans are deterministic and the bare call is unchanged', planProbe.det && planProbe.bare);
ok('the hook and every act boss still pay on hard', planProbe.hookBoss);
ok('non-boss gaps sit in the stretched 3-5 band', planProbe.gapsOk);
ok('fewer offers per climb (avg ' + planProbe.avgH.toFixed(1) + ' hard vs ' + planProbe.avgN.toFixed(1) + ')',
  planProbe.avgH < planProbe.avgN && planProbe.fewer > 100, planProbe.fewer + '/200 strictly fewer');

/* ================= 2. the picker: the drawn tick box ================= */
console.log('\n— THE PICKER: A BOX UNDER EACH SIGN, REMEMBERED PER SIGN —');
await boot('');
ok('the meadow stands', await until(HOME, 60000));
ok('NEW GAME opens the sign picker', await tapUntil(`${H}.rowBtns.newcamp`, `!!${H}.signC && !!${H}.signPeek`, 6));
let pk = await peek();
ok('THE OPEN SKY leads the deck', pk && pk.id === 'none', pk && pk.id);
ok('the open sky carries the box too (the challenge needs no sign)',
  await ev(`!!${find(`${H}.signC`, 'hardBox')} && !!${find(`${H}.signC`, 'hardTick', 'none')}`));
ok('…unticked on a fresh profile', await ev(`(() => { const t = ${find(`${H}.signC`, 'hardTick', 'none')}; return !!t && !t.visible })()`));
ok('a real tap ticks it', await tapUntil(find(`${H}.signC`, 'hardBox'), `SS.prof.hardPick.none === 1`, 5));
ok('…and the tick shows', await ev(`(() => { const t = ${find(`${H}.signC`, 'hardTick', 'none')}; return !!t && t.visible })()`));
await goCard(1);
pk = await peek();
ok('the next card is ARIES', pk && pk.id === 'aries', pk && pk.id);
ok('ARIES shows its OWN state — unticked (per sign, not global)',
  await ev(`(() => { const t = ${find(`${H}.signC`, 'hardTick', 'aries')}; return !!t && !t.visible && !SS.prof.hardPick.aries })()`));
ok('a real tap ticks ARIES', await tapUntil(find(`${H}.signC`, 'hardBox'), `SS.prof.hardPick.aries === 1`, 5));
await goCard(-1);
ok('back on THE OPEN SKY the tick still stands', await ev(`(() => { const t = ${find(`${H}.signC`, 'hardTick', 'none')}; return !!t && t.visible })()`));
// the control keeps to its band: below the art frame, above the power desc
const lay = await evj(`(() => { const t = ${find(`${H}.signC`, 'hardTick', 'none')};
  const card = ${find(`${H}.signC`, 'zodCard', 'none')};
  const d = ${find(`${H}.signC`, 'zodDesc', 'none')};
  const tb = t.getBounds(), db = d.getBounds(), cb = card.getBounds();
  return JSON.stringify({ tickBot: tb.bottom, descTop: db.top, inCard: tb.top > cb.top && tb.bottom < cb.bottom }) })()`);
ok('the box sits inside the card, clear of the power text', lay.inCard && lay.tickBot <= lay.descTop + 1, JSON.stringify(lay));
await shot('picker-hard-ticked');
// sharpness at dpr 3: the control region through crisp-check's shrink-stretch
const rect = await evj(`(() => { const t = ${find(`${H}.signC`, 'hardTick', 'none')};
  const b = t.getBounds(), cam = ${H}.cameras.main;
  return JSON.stringify([{ x: b.x - cam.scrollX - 30, y: b.y - cam.scrollY - 8, w: b.width + 90, h: b.height + 16 }]) })()`);
const png = await send('Page.captureScreenshot', { format: 'png' });
const sharp = await evj(`(() => new Promise((res) => { const img = new Image();
  img.onload = () => { try {
    const k = img.width / game.canvas.width, S = Math.max(1, devicePixelRatio), out = [];
    const lap = (im) => { const { width: w, height: h, data: d } = im; let sum = 0, n = 0;
      const L = new Float32Array(w * h);
      for (let i = 0, p = 0; i < w * h; i++, p += 4) L[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x;
        sum += Math.abs(4 * L[i] - L[i - 1] - L[i + 1] - L[i - w] - L[i + w]); n++; }
      return n ? sum / n : 0; };
    for (const r of ${JSON.stringify(rect)}) {
      const x = Math.max(0, Math.floor(r.x * k)), y = Math.max(0, Math.floor(r.y * k));
      const w = Math.ceil(r.w * k), h = Math.ceil(r.h * k);
      const A = document.createElement('canvas'); A.width = w; A.height = h;
      const a = A.getContext('2d'); a.drawImage(img, x, y, w, h, 0, 0, w, h);
      const e1 = lap(a.getImageData(0, 0, w, h));
      const sw = Math.max(2, Math.round(w / S)), sh = Math.max(2, Math.round(h / S));
      const Bc = document.createElement('canvas'); Bc.width = sw; Bc.height = sh;
      const b = Bc.getContext('2d'); b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high'; b.drawImage(A, 0, 0, sw, sh);
      const C = document.createElement('canvas'); C.width = w; C.height = h;
      const c = C.getContext('2d'); c.imageSmoothingEnabled = true; c.drawImage(Bc, 0, 0, w, h);
      const e0 = lap(c.getImageData(0, 0, w, h));
      out.push(Math.round((e0 ? e1 / e0 : 0) * 100) / 100);
    }
    res(JSON.stringify(out)); } catch (e) { res(JSON.stringify(['ERR ' + e.message])); } };
  img.onerror = () => res(JSON.stringify(['ERR image']));
  img.src = 'data:image/png;base64,${png.data}'; }))()`);
ok('the drawn control is pixel-sharp at dpr 3 (ratio ≥ 1.4)',
  Array.isArray(sharp) && sharp.length === 1 && typeof sharp[0] === 'number' && sharp[0] >= 1.4, JSON.stringify(sharp));
// persistence across a full reload — the prof remembers per sign
await reboot('');
ok('meadow back (same sky)', await until(HOME, 60000));
ok('the picker reopens', await tapUntil(`${H}.rowBtns.newcamp`, `!!${H}.signC && !!${H}.signPeek`, 6));
await goCard(1);
ok('ARIES still ticked after the reload (prof.hardPick persists)',
  await ev(`(() => { const t = ${find(`${H}.signC`, 'hardTick', 'aries')}; return !!t && t.visible && SS.prof.hardPick.aries === 1 })()`));

/* ================= 3. BEGIN pins it — and the clock runs ================= */
console.log('\n— THE CLOCK: 10 SECONDS OF VISIBLE TIME, RESET BY THE CAST —');
// BEGIN is the gold button at the sheet's foot — tap it for real
ok('BEGIN pins sign AND hard, opens the chart', await tapUntil(
  `${H}.signC.list.filter((o) => o.input && o.texture && /btn@/.test(o.texture.key)).pop()`,
  `!!${H}.mapC && localStorage.getItem('beta3.campsign') === 'aries' && localStorage.getItem('beta3.camphard') === '1'`, 6));
const mapNode = (root) => `(() => { let r = null;
  const scan = (ls) => ls.forEach((o) => { if (!r && o.getData && o.getData('mapZone')) r = o; if (o.list) scan(o.list); });
  scan(${root}.list); return r ? r.getData('mapZone') : null })()`;
ok('the chart node rises into a HARD battle', await tapUntil(mapNode(`${H}.mapC`), PICK, 6) || await until(PICK, 60000));
ok('Battle.hard is on, read from the pin', await ev(`${B}.hard === true`));
ok('the ember ring stands (badge + telegraph in one)', await ev(`!!${B}.hardG && !!${B}.hardT && ${B}.hardT.visible`));
ok('the clock opens full at startFight (drains only once play holds it)', await ev(`${B}.hardLeft > 8200 && ${B}.hardLeft <= SS_HARD.strikeMs`), await ev(`${B}.hardLeft`));
ok('…and the numeral reads 10', await ev(`${B}.hardT ? ${B}.hardT.text : '?'`) === '10', await ev(`${B}.hardT ? ${B}.hardT.text : '?'`));
// the ring stays clear of its header neighbors (the badge must not collide)
const ringLay = await evj(`(() => { const b = ${B};
  const t = b.hardT.getBounds(), h = b.homeB.getBounds();
  return JSON.stringify({ apart: t.left > h.right + 2, onScreen: t.top > 0 && t.left > 0 }) })()`);
ok('the ring keeps clear of the back arrow, on screen', ringLay.apart && ringLay.onScreen, JSON.stringify(ringLay));
await shot('hard-battle-ring');
// the beast cannot die and never strikes by count while the clock is probed
await ev(`${B}.beast.hpNow = 99999; ${B}.beast.count = 5; ${B}.run.sigils = []; ${B}.shieldLeft = 0; ${B}.updateBars(); 'ok'`);
const hp0 = await ev(`${B}.run.hp`);
const cnt0 = await ev(`${B}.beast.count`);
await advance(10600);
ok('at 10s of visible time with no cast, the beast STRIKES (hp falls)',
  await until(`${B}.run.hp < ${hp0}`, 15000, 250), (await ev(`${B}.run.hp`)) + ' vs ' + hp0);
ok('the cast counter is untouched — both threats live', await ev(`${B}.beast.count === ${cnt0}`), await ev(`${B}.beast.count`));
ok('the board comes back and the clock is re-armed near the top', await until(`${B}.state === 'pick' && ${B}.hardLeft > 8200`, 15000, 250), await ev(`${B}.hardLeft`));
// the reset: burn ~5s, then a REAL cast winds it back
await advance(5000);
const midLeft = await ev(`${B}.hardLeft`);
ok('the clock has burned to the middle', midLeft < 6200 && midLeft > 2500, midLeft);
const w1 = await findWord([], [], 2, 7);
ok('a castable word stands', Array.isArray(w1) && w1.length >= 2, JSON.stringify(w1));
ok('the cast lands (real taps)', await castWord(w1));
ok('…and the clock is wound back to the top', await ev(`${B}.hardLeft > 8800`), await ev(`${B}.hardLeft`));
ok('…while the cast ticked the counted strike (both threats)', await ev(`${B}.beast.count === ${cnt0} - 1`), await ev(`${B}.beast.count`));
// paused while hidden — the active-play law
await ev(`window.__vis = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); 'ok'`);
const hidLeft = await ev(`${B}.hardLeft`);
await advance(6000);
ok('hidden: six skewed seconds move NOTHING', Math.abs((await ev(`${B}.hardLeft`)) - hidLeft) < 250, (await ev(`${B}.hardLeft`)) + ' vs ' + hidLeft);
await ev(`window.__vis = null; document.dispatchEvent(new Event('visibilitychange')); 'ok'`);
await sleep(400);
// paused on a real blur — the second gate
await ev(`window.__foc = false; window.dispatchEvent(new Event('blur')); 'ok'`);
const blrLeft = await ev(`${B}.hardLeft`);
await advance(4000);
ok('blurred: four skewed seconds move NOTHING', Math.abs((await ev(`${B}.hardLeft`)) - blrLeft) < 250, (await ev(`${B}.hardLeft`)) + ' vs ' + blrLeft);
await ev(`window.__foc = null; window.dispatchEvent(new Event('focus')); 'ok'`);
await sleep(400);
// the frozen-tab law: ONE 10s jump lands in one delta and is dropped whole
const frzLeft = await ev(`${B}.hardLeft`);
await ev(`window.__skew += 10000; 'ok'`);
await sleep(400);
ok('a single 10s jump is dropped whole (the frozen-tab law)',
  (await ev(`${B}.hardLeft`)) > frzLeft - 900, (await ev(`${B}.hardLeft`)) + ' vs ' + frzLeft);
// held through the non-play beats: the pick screen's state gate
await ev(`${B}.state = 'sigil'; 'ok'`);
const sigLeft = await ev(`${B}.hardLeft`);
await advance(4000);
ok('held during a sigil pick (state gate)', Math.abs((await ev(`${B}.hardLeft`)) - sigLeft) < 250, (await ev(`${B}.hardLeft`)) + ' vs ' + sigLeft);
ok('…and the ring reads DIMMED while held', await ev(`${B}.hardG.alpha < 0.6`), await ev(`${B}.hardG.alpha`));
await ev(`${B}.state = 'pick'; 'ok'`);
await sleep(300);
// the warn dress: under warnMs the numeral burns and the halo breathes
await ev(`${B}.hardLeft = 2400; 'ok'`);
await sleep(350);
ok('inside the last 3s the numeral burns crimson', await ev(`${B}.hardT.style.color === '#ff3860'`), await ev(`${B}.hardT.style.color`));
ok('…and the warn halo glows', await ev(`${B}.hardGlow.alpha > 0.1`), await ev(`${B}.hardGlow.alpha`));
await shot('hard-ring-warn');
await ev(`${B}.hardLeft = SS_HARD.strikeMs; 'ok'`);

/* ================= 4. the tally, the books, the retry ================= */
console.log('\n— THE TALLY: ×1.5 AT THE END, THE BOOKS, THE RETRY —');
// a hard fall first: the clock kills at 1 health — endRun(false)
await ev(`${B}.run.hp = 1; ${B}.run.sigils = []; ${B}.shieldLeft = 0; ${B}.hardLeft = 300; 'ok'`);
ok('the clock strike fells the mage — the run ends', await until(`${B}.state === 'end'`, 20000, 300));
ok('the ⚑ ×1.5 row stands on the fall\'s window too', await ev(
  `${B}.children.list.some((o) => o.text && o.text.indexOf('⚑') === 0 && o.text.indexOf('1.5') > 0)
   || ${B}.overlayC.list.some((o) => o.text && o.text.indexOf('⚑') === 0 && o.text.indexOf('1.5') > 0)`));
await shot('hard-loss-window');
// TRY AGAIN keeps the challenge: the books wiped the pin, the retry re-pins
ok('TRY AGAIN re-pins hard and restarts hard', await tapUntil(
  `${B}.overlayC.list.filter((o) => o.input && o.texture && /btn@/.test(o.texture.key)).slice(-2)[0]`,
  `${PICK} && ${B}.hard === true && localStorage.getItem('beta3.camphard') === '1'`, 6));
// now a hard CLEAR, with the submits captured
await ev(`window.__subs = []; SSNET.submitScore = (s, w, l, m, h) => { __subs.push(['score', s, m, !!h]); };
  SSNET.submitHard = (s, w) => { __subs.push(['hard', s, w]); }; 'ok'`);
await ev(`${B}.run.fightIdx = ${B}.fights.length - 1; ${B}.startFight(); 'ok'`);
await until(PICK, 20000, 250);
ok('teleported to the summit fight, still hard', await ev(`${B}.hard === true && ${B}.run.fightIdx === ${B}.fights.length - 1`));
await ev(`${B}.run.sigils = []; 'ok'`);   // no tome — the ×1.5 is the only bend on the tally
const st = await fell();
ok('the summit falls — the run ends won', st === 'end', st);
const expect = await evj(`JSON.stringify((() => { const b = ${B};
  const r = b.run.totalDmg + b.run.longest.length * 15 + b.run.fightIdx * 50;
  return { raw: r, amp: Math.round(r * SS_HARD.scoreMult) } })())`);
const subs = await evj(`JSON.stringify(window.__subs)`);
ok('the FINAL tally is amplified ×1.5 — the weekly submit carries it + the hard flag',
  subs.some(([k, s, m, h]) => k === 'score' && m === 'campaign' && h === true && s === expect.amp), JSON.stringify(subs) + ' vs ' + expect.amp);
ok('…and the hard board takes the same amplified clear', subs.some(([k, s]) => k === 'hard' && s === expect.amp));
ok('the ⚑ ×1.5 row stands beside the score', await ev(
  `${B}.overlayC.list.some((o) => o.text && o.text.indexOf('⚑') === 0 && o.text.indexOf('1.5') > 0)`));
ok('the sign\'s ledger: aries hardClears 1', await ev(`SS.prof.signs.aries.hardClears === 1`));
ok('EMBER-SWORN · ARIES rang (prof.ach hard-aries)', await ev(`!!SS.prof.ach['hard-aries']`));
ok('the zodiac crown waits (one sign is not twelve)', await ev(`!SS.prof.ach['hard-zodiac']`));
await shot('hard-win-window');

/* ================= 5. the achievements, driven ================= */
console.log('\n— ACHIEVEMENTS: ONCE PER SIGN, ONCE FOR ALL TWELVE —');
const drive = await evj(`JSON.stringify((() => {
  const stamps = {};
  const at0 = SS.prof.ach['hard-aries'];
  ssHardAward('aries', game);                          // again — must not re-fire
  const once = SS.prof.ach['hard-aries'] === at0 && SS.prof.signs.aries.hardClears === 2;
  for (const z of SS_ZODIAC) if (z.id !== 'aries') ssHardAward(z.id, game);
  const all = SS_ZODIAC.every((z) => !!SS.prof.ach['hard-' + z.id]);
  const crown = !!SS.prof.ach['hard-zodiac'];
  ssHardAward('none', game);                           // the open sky: a no-op, never a throw
  const clean = !SS.prof.ach['hard-none'] && !SS.prof.signs.none;
  return { once, all, crown, clean };
})())`);
ok('a second clear moves the ledger but never re-rings the sign', drive.once);
ok('all twelve signs ring once each', drive.all);
ok('the twelfth crowns THE EMBER ZODIAC', drive.crown);
ok('the open sky (\'none\') is a quiet no-op', drive.clean);
// the profile grid: walk the player's road there (end screen → HOME → chip)
ok('HOME from the end screen', await tapUntil(
  `${B}.overlayC.list.filter((o) => o.input && o.texture && /btndark@/.test(o.texture.key)).pop()`, HOME, 6));
ok('the profile opens by its chip', await tapUntil(`${H}.profileChip`,
  `game.scene.getScene('profile').sys.isActive()`, 6));
const P = `game.scene.getScene('profile')`;
await sleep(800);
const gridRead = `JSON.stringify((() => { const p = ${P};
  const texts = p.children.list.filter((o) => o.text).map((o) => ({ t: o.text, y: o.y / (game.scale.width / innerWidth) }));
  const head = texts.find((x) => x.t.indexOf('ACHIEVEMENTS') >= 0);
  const famRow = texts.find((x) => x.t.indexOf(' / 12') >= 0);
  const crownRow = texts.find((x) => x.t.indexOf('EMBER ZODIAC') >= 0);
  const swornRow = texts.find((x) => x.t.indexOf('EMBER-SWORN') >= 0);
  const low = Math.max(...texts.filter((x) => x.t.length > 2).map((x) => x.y));
  return { head: head && head.t, fam: famRow && famRow.t, crown: !!crownRow, sworn: !!swornRow, low } })())`;
let grid = await evj(gridRead);
ok('the grid header counts DISPLAY rows (never 13 loose embers)', /26/.test(grid.head || ''), grid.head);
ok('all twelve earned: the family row wears THE EMBER ZODIAC crown', grid.crown && !grid.sworn, JSON.stringify({ c: grid.crown, s: grid.sworn }));
ok('the grid keeps its 13 rows above the seal', grid.low <= 786, grid.low);
await shot('profile-hard-achs');
// un-crown two embers and rebuild: the row returns to EMBER-SWORN · 11 / 12
await ev(`delete SS.prof.ach['hard-zodiac']; delete SS.prof.ach['hard-pisces']; SS.save(); ${P}.scene.restart(); 'ok'`);
await until(`${P}.sys.isActive()`, 10000);
await sleep(700);
grid = await evj(gridRead);
ok('short of the crown the row reads EMBER-SWORN with its 11 / 12 progress',
  grid.sworn && !grid.crown && /11 \/ 12/.test(grid.fam || ''), JSON.stringify({ s: grid.sworn, fam: grid.fam }));
await ev(`ssHardAward('pisces', game); 'ok'`);

/* ================= 6. the checkpoint: hard resumes hard ================= */
console.log('\n— THE CHECKPOINT: A CLIMB BEGUN HARD STAYS HARD —');
await boot('', `localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000, hardPick: { taurus: 1 } }));`);
ok('meadow up', await until(HOME, 60000));
ok('picker open', await tapUntil(`${H}.rowBtns.newcamp`, `!!${H}.signC && !!${H}.signPeek`, 6));
await goCard(1); await goCard(1);
pk = await peek();
ok('TAURUS wears its remembered tick', pk && pk.id === 'taurus' && await ev(`(() => { const t = ${find(`${H}.signC`, 'hardTick', 'taurus')}; return !!t && t.visible })()`), pk && pk.id);
ok('BEGIN → chart → hard battle', await tapUntil(
  `${H}.signC.list.filter((o) => o.input && o.texture && /btn@/.test(o.texture.key)).pop()`, `!!${H}.mapC`, 6)
  && (await tapUntil(mapNode(`${H}.mapC`), PICK, 6) || await until(PICK, 60000)));
ok('hard on, taurus vessel intact (the sign law untouched)', await ev(`${B}.hard === true && ${B}.sign === 'taurus'`));
const plan0 = await evj(`JSON.stringify([...${B}.sigPlan].sort((a, b) => a - b))`);
const st2 = await fell();
ok('fight 0 fell pays the hook', st2 === 'sigil' || st2 === 'upgrade', st2);
if (st2 === 'sigil' || st2 === 'upgrade') await takeCard();
await until(`${B}.state === 'map'`, 15000, 250);
await tapUntil(mapNode(`${B}.overlayC`), PICK, 6);
ok('fight 1 under way, checkpoint carries hard', await evj(`JSON.stringify(!!(JSON.parse(localStorage.getItem('beta3.campaign')) || {}).hard)`) === true);
await reboot('');
ok('meadow back', await until(HOME, 60000));
ok('CONTINUE resumes the hard climb by real taps', await tapUntil(`${H}.rowBtns.campaign`, `!!${H}.mapC`, 6)
  && (await tapUntil(mapNode(`${H}.mapC`), PICK, 6) || await until(PICK, 60000)));
ok('resumed hard: flag, ring, a fresh 10s (fight-start semantics)',
  await ev(`${B}.hard === true && !!${B}.hardG && ${B}.hardLeft > 7600 && ${B}.hardLeft <= SS_HARD.strikeMs`), await ev(`${B}.hardLeft`));
const plan1 = await evj(`JSON.stringify([...${B}.sigPlan].sort((a, b) => a - b))`);
ok('the resumed plan is the same plan', JSON.stringify(plan0) === JSON.stringify(plan1), JSON.stringify(plan1));
// a pre-v0.70 checkpoint (no hard field) resumes NORMAL — the truth is the save
const stripped = await ev(`(() => { const ck = JSON.parse(localStorage.getItem('beta3.campaign'));
  delete ck.hard; localStorage.setItem('beta3.campaign', JSON.stringify(ck)); return 'ok' })()`);
await reboot('');
await until(HOME, 60000);
await tapUntil(`${H}.rowBtns.campaign`, `!!${H}.mapC`, 6);
await tapUntil(mapNode(`${H}.mapC`), PICK, 6);
ok('a checkpoint without the field resumes NORMAL (pre-v0.70 save)',
  await ev(`${B}.hard === false && ${B}.hardG === undefined && ${B}.hardLeft === undefined`));

/* ================= 7. normal runs untouched ================= */
console.log('\n— NORMAL RUNS: THE TIMER IS NEVER CREATED —');
await boot('quick=1');
ok('a quick run stands', await until(PICK, 60000));
ok('no flag, no ring, no clock — nothing hard exists', await ev(
  `${B}.hard === false && ${B}.hardG === undefined && ${B}.hardT === undefined && ${B}.hardLeft === undefined`));
const pm0 = await ev(`${B}.run.playMs | 0`);
await advance(4000);
ok('the run clock still counts (update untouched for normal play)', (await ev(`${B}.run.playMs | 0`)) >= pm0 + 3600, await ev(`${B}.run.playMs | 0`));
const hpQ = await ev(`${B}.run.hp`);
await advance(8000);
ok('…and eight more visible seconds bring NO strike', await ev(`${B}.run.hp === ${hpQ}`), await ev(`${B}.run.hp`));
ok('an unhard campaign resumes free of it too (beastFor knobs idle at 1.0/+0: bosses unchanged)', await ev(
  `(() => { const b = ${B}; const base = SS_BEASTS.draco;
    const f = { id: 'draco', actIdx: 0, mult: 1, atkAdd: 0, umbral: false };
    const n = b.beastFor(f);
    return n.hp === base.hp && n.atk === base.atk })()`));

/* ================= 8. the boards ================= */
console.log('\n— THE BOARDS: THE FOURTH TAB, THE ⚑ MARK, THE GHOSTS —');
// the seed layer on paper first: deterministic, banded, capped
const ghost = await evj(`JSON.stringify((() => {
  const DAY = 86400000, at = Date.UTC(2026, 8, 1) + 35 * DAY;
  const a = SS_SEED.ghosts('hard', 'all', null, at);
  const b = SS_SEED.ghosts('hard', 'all', null, at);
  const T = SS_SEED_TUNE.hard;
  const band = a.every((g) => g.score >= 1000 && g.score <= T.hi);
  const flagged = a.every((g) => g.ghost === true && g.id.indexOf('sg_') === 0);
  const firstAt = a.length ? Math.min(...a.map((g) => g.at)) : 0;
  const dawn = firstAt - Date.UTC(2026, 8, 1);
  // the champion law: a real 5000 clear stays champion; a real 2000 squeezes every ghost under it
  const m1 = SS_SEED.merge([{ id: 'me', name: 'Zed', score: 5000 }], 'hard', 'all', null, at, 'Zed');
  const m2 = SS_SEED.merge([{ id: 'me', name: 'Zed', score: 2000 }], 'hard', 'all', null, at, 'Zed');
  return { n: a.length, det: JSON.stringify(a) === JSON.stringify(b), band, flagged,
    dawnHours: Math.round(dawn / 3600000),
    cap1: m1[0].id === 'me' && m1.slice(1).every((r) => r.score < 5000),
    cap2: m2[0].id === 'me' && m2.slice(1).every((r) => r.score < 2000) };
})())`);
ok('the hard cast: ' + ghost.n + ' ghosts, deterministic, all flagged', ghost.n >= 5 && ghost.n <= 9 && ghost.det && ghost.flagged, JSON.stringify(ghost));
ok('scores in the believable band, under the weakest real clear', ghost.band);
ok('the first ghost lands hours after launch, never minutes', ghost.dawnHours >= 2 && ghost.dawnHours <= 24, ghost.dawnHours + 'h');
ok('the champion law holds at 5000 and squeezes at 2000', ghost.cap1 && ghost.cap2);
// plant local rows, then walk the player's road to the board
await ev(`(() => { const wk = SSNET.weekKey();
  const t = JSON.parse(localStorage.getItem('starspellLocalDb') || '{}');
  t.weekly = t.weekly || {}; t.weekly[wk] = {
    za: { name: 'Emberhand', score: 902, word: 'LANTERN', at: Date.now(), m: 'campaign', h: 1 },
    zb: { name: 'Plainsong', score: 640, word: 'RIVER', at: Date.now(), m: 'quick' },
  };
  t.hard = { all: { zc: { name: 'Emberhand', score: 5210, word: 'WHISPER', at: Date.now(), h: 1 } } };
  localStorage.setItem('starspellLocalDb', JSON.stringify(t)); return 'ok' })()`);
const gb = await evj(`SSNET.getBoard('hard').then((b) => JSON.stringify({ n: b.rows.length, top: b.rows[0] && b.rows[0].name, sc: b.rows[0] && b.rows[0].score }))`);
ok('getBoard(hard) reads the all-time clears, the real row champion', gb.n >= 1 && gb.top === 'Emberhand' && gb.sc === 5210, JSON.stringify(gb));
const gw = await evj(`SSNET.getBoard('weekly').then((b) => JSON.stringify({ hardRow: !!(b.rows.find((r) => r.name === 'Emberhand') || {}).hard,
  plain: !(b.rows.find((r) => r.name === 'Plainsong') || {}).hard }))`);
ok('the weekly rows carry the hard flag through getBoard', gw.hardRow && gw.plain, JSON.stringify(gw));
// the Board scene by real taps: leave the battle for the meadow first, then
// profile → leaderboard door (walk the player's own road — the v0.68 lesson)
await tapUntil(`${B}.homeB`, HOME, 6);
ok('profile from the meadow', await tapUntil(`${H}.profileChip`,
  `game.scene.getScene('profile').sys.isActive()`, 6));
ok('the leaderboard door opens the Board', await tapUntil(`game.scene.getScene('profile').leaderB`,
  `game.scene.getScene('board').sys.isActive()`, 6));
const BD = `game.scene.getScene('board')`;
await sleep(900);
ok('four pills: daily · weekly · endless · hard', await ev(`Object.keys(${BD}.tabBtns).join() === 'daily,weekly,endless,hard'`),
  await ev(`Object.keys(${BD}.tabBtns).join()`));
const tabFit = await evj(`(() => { const t = ${BD}.tabBtns.hard.bg; const D = game.scale.width / innerWidth;
  const a = t.input.hitArea; return JSON.stringify({ w: Math.round(a.width * t.scaleX / D), h: Math.round(a.height * t.scaleY / D) }) })()`);
ok('the hard pill keeps the 44-pt law', tabFit.w >= 44 && tabFit.h >= 44, JSON.stringify(tabFit));
ok('a real tap opens the HARD tab', await tapUntil(`${BD}.tabBtns.hard.bg`, `${BD}.tab === 'hard'`, 6));
await sleep(1200);
ok('the hard tab speaks its OWN all-time line (never the endless ledger\'s)', await ev(`${BD}.cdT.text === '✦ ' + SS_T('lbHardTime')`), await ev(`${BD}.cdT.text`));
ok('the planted clear crowns the hard podium', await until(`${BD}.rowsC.list.some((o) => o.text && o.text === 'Emberhand')`, 12000, 300));
await shot('board-hard-tab');
ok('the weekly tab wears the ⚑ mark on its hard row', await tapUntil(`${BD}.tabBtns.weekly.bg`, `${BD}.tab === 'weekly'`, 6)
  && await until(`${BD}.rowsC.list.some((o) => o.text === '⚑')`, 12000, 300));
await shot('board-weekly-flag');

/* ================= 9. the es dress ================= */
console.log('\n— THE SPANISH DRESS —');
await boot('lang=es');
await until(HOME, 60000);
ok('picker abre', await tapUntil(`${H}.rowBtns.newcamp`, `!!${H}.signC && !!${H}.signPeek`, 6));
ok('the box speaks DIFÍCIL', await ev(`${H}.signC.list.some((o) => { let hit = false;
  const scan = (ls) => ls.forEach((x) => { if (x.text === 'DIFÍCIL') hit = true; if (x.list) scan(x.list); });
  scan([o]); return hit })`));
await ev(`${H}.signC.list.forEach(() => {}); 'ok'`);
ok('the Board pill speaks it too', await (async () => {
  await ev(`game.scene.getScene('home').scene.start('board'); 'ok'`);
  await until(`game.scene.getScene('board').sys.isActive()`, 10000);
  await sleep(600);
  return ev(`game.scene.getScene('board').tabBtns.hard.lab.text === 'DIFÍCIL'`);
})());

console.log('\n' + pass + ' passed · ' + fail + ' failed');
if (errs.length) { console.log('page exceptions:'); errs.slice(0, 8).forEach((e) => console.log('  · ' + e)); }
else console.log('zero page exceptions');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail || errs.length ? 1 : 0);
