// SIGN-CHECK — the sign picker as CARDS (v0.57.0, task 46; FULL-BLEED
// since v0.79.0: the frame/headline/subtitle/pager are gone, the card
// takes the whole design box with the plate cover-filling it, and the
// ‹ › arrows + ✕ ride ON the card over the swipe zone — topOnly law;
// LIVING SKY since v0.84.0: the unsigned card's wash carries a seeded
// twinkle field + occasional card-local shooting star — sprites only,
// the Graphics census stays pinned, sign cards stay dead still, and
// ?twinkle=0 / reduced motion freeze the layer).
// One full-size card at a time (THE OPEN SKY first, then the twelve), a
// real swipe on the card with a settle tween and wrap at both ends,
// BEGIN always live. Everything here is REAL input at
// DPR 3 through Input.dispatchTouchEvent (taps) and dispatchMouseEvent
// (drags — a pressed pointer moved in steps, then released), never a call
// into the scene. Walks the iPhone 16 geometry for the behaviour, then the
// SE and iPad geometries for layout (safe band, clip, overlap, one-line
// law, 44-pt targets). Self-launching: serves beta3 on :8899 if nothing
// does, opens a headless Chrome on :9458 (/tmp/cdp-sign, Canvas renderer,
// Firebase blocked at the network layer) and kills both at the end.
//
//   node tools/sign-check.mjs
//
// ⚠ Every wait POLLS — the software renderer runs the scene clock anywhere
// from 12 to 60fps and a fixed sleep reads as a bug that isn't there.
import { spawn } from 'node:child_process';
const PORT = 9458, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-sign', '--window-size=393,852', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const evj = async (e) => JSON.parse(await ev(e));
const until = async (e, cap = 45000, step = 200) => {
  for (let i = 0; i < cap / step; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(step); }
  return false;
};
const H = `game.scene.getScene('home')`;
const HOME_REST = `!!window.game && game.scene.isActive('home') && !${H}.introPlaying && !!${H}.lanternB && !!window.__ssdev && !!window.__ssdev.last`;
const SHEET = `!!${H}.signC && !!${H}.signPeek`;
const STILL = `${SHEET} && !${H}.signPeek().moving`;
// css point of a game object (bounds centre, camera-corrected)
const css = async (expr) => evj(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
  const D = game.scale.width / innerWidth; return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`);
const touch = async (x, y) => {
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 6, radiusY: 6, force: 1 }] });
  await sleep(70);
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
const touchUntil = async (pt, done, tries = 8) => {
  for (let i = 0; i < tries; i++) { await touch(pt.x, pt.y); if (await until(done, 2500)) return true; }
  return false;
};
// a REAL drag: press, move in steps (the strip must follow), release
const drag = async (x, y, dx, steps = 8, dwell = 22) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  const mid = [];
  for (let i = 1; i <= steps; i++) {
    await sleep(dwell);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + dx * i / steps, y, button: 'left', buttons: 1 });
    if (i === Math.floor(steps / 2)) mid.push(await evj(`JSON.stringify((() => { const p = ${H}.signPeek(); const cs = ${H}.signC; let peek = 0;
      cs.list.forEach(o => { if (o.list) o.list.forEach(k => { if (k.getData && k.getData('zodCard') && k !== p.card && k.visible) peek++; }); });
      return { x: p.x, peek } })())`));
  }
  await sleep(dwell);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + dx, y, button: 'left', clickCount: 1 });
  return mid[0];
};
const peek = async () => evj(`JSON.stringify((() => { const p = ${H}.signPeek(); return { id: p.id, cur: p.cur, n: p.n, moving: p.moving, x: p.x } })())`);
const cardTexts = async () => evj(`JSON.stringify((() => { const out = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text' && o.visible) out.push(o.text); if (o.list) w(o.list); });
  w(${H}.signPeek().card.list); return out })())`);
// the crisp-check layout law, scoped to the sheet: safe band, clip, small
// targets, text overlap, the one-line law
const LAYOUT = `(() => { const s = ${H}; const D = game.scale.width / innerWidth; const HH = game.scale.height, W = game.scale.width, it = SS_INSET.top * D, ib = SS_INSET.bottom * D, tol = 1.5 * D;
  const out = { band: [], clip: [], small: [], overlap: [], law: [], texts: 0, targets: 0, hits: {} };
  const items = []; const vis = (o) => { for (let p = o; p; p = p.parentContainer) if (!p.visible || p.alpha < 0.05) return false; return true; };
  const walk = (ls) => ls.forEach(o => { if (o.list && !(o.getData && o.getData('textBlock'))) { if (o.visible) walk(o.list); }
    if (!vis(o) || !o.getBounds) return; const isText = o.type === 'Text', hit = !!(o.input && o.input.enabled); if (!isText && !hit) return;
    const b = o.getBounds(); const bb = { x: b.x, y: b.y, r: b.right, b: b.bottom, w: b.width, h: b.height };
    if (bb.w >= W * 0.9 && bb.h >= HH * 0.9) return; const name = (isText ? o.text : (o.texture && o.texture.key) || o.type).slice(0, 22);
    items.push({ o, b: bb, isText, hit, name }); });
  walk(s.signC.list);
  for (const it2 of items) { const { b, isText, hit, name } = it2; if (isText) out.texts++; if (hit) out.targets++;
    const p = isText ? (it2.o.padding ? Math.max(it2.o.padding.top || 0, it2.o.padding.bottom || 0) : 0) : 0; const top = b.y + p, bot = b.b - p;
    if (top < it - tol || bot > HH - ib + tol) out.band.push(name + '@' + Math.round(top / D) + '-' + Math.round(bot / D));
    if (bot > HH + tol || b.r > W + tol || b.x < -tol) out.clip.push(name);
    if (hit) { const ha = it2.o.input.hitArea; const sx = Math.abs(it2.o.scaleX || 1), sy = Math.abs(it2.o.scaleY || 1);
      const hw = ha && ha.width ? ha.width * sx : b.w, hh = ha && ha.height ? ha.height * sy : b.h; out.hits[name] = Math.round(Math.min(hw, hh) / D);
      if (Math.min(hw, hh) / D < 43.5) out.small.push(name + ' ' + Math.round(hw / D) + 'x' + Math.round(hh / D)); }
    if (isText) { const t = it2.o.text || ''; if (t.includes('\\n')) out.law.push('nl:' + t.slice(0, 20));
      else if (it2.o.style.wordWrapWidth) { const w = it2.o.getWrappedText(t); if ((Array.isArray(w) ? w.length : String(w).split('\\n').length) > 1) out.law.push('wrap:' + t.slice(0, 20)); } } }
  const tx = items.filter(i => i.isText && i.o.alpha > 0.3);
  for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) { const a = tx[i], c = tx[j];
    if (a.o.parentContainer && a.o.parentContainer === c.o.parentContainer && a.o.parentContainer.getData && a.o.parentContainer.getData('textBlock')) continue;
    const pa = a.o.padding ? Math.max(a.o.padding.left || 0, a.o.padding.top || 0) : 0, pc = c.o.padding ? Math.max(c.o.padding.left || 0, c.o.padding.top || 0) : 0;
    const ax = a.b.x + pa, ay = a.b.y + pa, ar = a.b.r - pa, ab = a.b.b - pa; const cx = c.b.x + pc, cy = c.b.y + pc, cr = c.b.r - pc, cb = c.b.b - pc;
    const iw = Math.min(ar, cr) - Math.max(ax, cx), ih = Math.min(ab, cb) - Math.max(ay, cy); if (iw > tol && ih > tol) out.overlap.push(a.name + '×' + c.name); }
  return JSON.stringify(out) })()`;
const judge = async (tag) => {
  const lay = await evj(LAYOUT);
  ok(`${tag}: ${lay.texts} texts + ${lay.targets} targets in the safe band, none clipped`, lay.band.length === 0 && lay.clip.length === 0, lay.band.concat(lay.clip).slice(0, 6).join(', '));
  ok(`${tag}: tap targets ≥ 44 pt (arrows, BEGIN, ✕)`, lay.small.length === 0 && lay.hits['‹'] >= 44 && lay.hits['›'] >= 44 && lay.hits['✕'] >= 44, lay.small.slice(0, 6).join(', ') + ' · ‹' + lay.hits['‹'] + ' ›' + lay.hits['›'] + ' ✕' + lay.hits['✕']);
  ok(`${tag}: no text overlaps, one-line law`, lay.overlap.length === 0 && lay.law.length === 0, lay.overlap.concat(lay.law).slice(0, 6).join(', '));
};
const open = async () => {
  const qp = await css(`${H}.rowBtns.newcamp`);
  const r = await touchUntil(qp, SHEET, 10);
  await until(STILL, 5000);
  await sleep(450);   // the entrance settles
  return r;
};
const boot = async (dv, inset, extra) => {
  await send('Emulation.setDeviceMetricsOverride', { width: dv.w, height: dv.h, deviceScaleFactor: dv.dpr, mobile: true, screenWidth: dv.w, screenHeight: dv.h, screenOrientation: { type: 'portraitPrimary', angle: 0 } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: BASE + `?rend=cv&fps=0&diag=1&mpuid=sign${Math.floor(Math.random() * 1e6)}&inset=${inset}` + (extra || '') });
  await sleep(1500);
  const up = await until(HOME_REST, 90000);
  if (!up) return false;
  errs.length = 0;
  // a history under LEO, a clean campaign, a fake TAURUS plate (the seam's
  // exists() precedence), and — since v0.58.0 ships real art for all 12 —
  // ARIES's plate BLOCKED once it lands, so the asterism fallback still walks
  await until(`typeof SSART !== 'undefined' && !!SSART.img.zod_aries`, 20000);
  await ev(`(() => { ssClearCampaign(); SS.prof.signs = SS.prof.signs || {}; SS.prof.signs.leo = { best: 1234, clears: 2, runs: 3 }; SS.save();
    const s = ${H}; if (!s.textures.exists('zod_taurus')) { const t = s.textures.createCanvas('zod_taurus', 40, 60); t.context.fillStyle = '#ff00aa'; t.context.fillRect(0, 0, 40, 60); t.refresh(); }
    delete SSART.img.zod_aries; if (s.textures.exists('zod_aries')) s.textures.remove('zod_aries'); return 1 })()`);
  await sleep(600);
  return true;
};

/* ---------- iPhone 16 · the behaviour ---------- */
console.log('\n━━ iPhone 15/16 — 393×852 @3 · inset 59/34');
ok('home stands', await boot({ w: 393, h: 852, dpr: 3 }, '59,34'));
ok('a real touch on NEW GAME opens the sign sheet', await open());
let p = await peek();
ok('the FIRST card is THE OPEN SKY (id none, 1 of 13)', p.id === 'none' && p.cur === 0 && p.n === 13, JSON.stringify(p));
let tx = await cardTexts();
ok('the open-sky card carries its name, title and the plain desc', tx.includes('THE OPEN SKY') && tx.includes('THE UNSIGNED CLIMB') && tx.some(t => /classic climb/.test(t)), tx.join(' | ').slice(0, 160));
// graphics counts carry +1 since v0.70.0: every campaign-picker card draws
// the HARD tick box (one Graphics) beside its frame work
ok('no asterism and no record on the open-sky card', await ev(`(() => { const k = ${H}.signPeek().card; return k.list.filter(o => o.type === 'Graphics').length === 3 && !k.list.some(o => o.type === 'Text' && /★/.test(o.text)) })()`));
await judge('16 · open sky');
// --- a real swipe LEFT (finger moves left → next card) ---
const cp = await css(`${H}.signPeek().card`);
let mid = await drag(cp.x, cp.y, -150);
ok('mid-drag the strip follows the finger and the neighbor peeks in', mid && mid.x < -30 && mid.peek >= 1, JSON.stringify(mid));
ok('the swipe settles on ARIES', await until(`${STILL} && ${H}.signPeek().id === 'aries' && Math.abs(${H}.signPeek().x) < 1`, 4000), JSON.stringify(await peek()));
tx = await cardTexts();
ok('ARIES · THE RAM with its power at the card bottom', tx.includes('ARIES') && tx.includes('THE RAM') && tx.some(t => /headlong ram/.test(t)), tx.join(' | ').slice(0, 160));
ok('the aries card draws the asterism placeholder (plate blocked — the not-loaded fallback)', await ev(`(() => { const k = ${H}.signPeek().card; return !k.list.some(o => o.texture && o.texture.key === 'zod_aries') && k.list.some(o => o.texture && o.texture.key === 'zodsky') && k.list.filter(o => o.type === 'Graphics').length === 4 })()`));
await judge('16 · aries');
// --- a short drag settles back ---
mid = await drag(cp.x, cp.y, -40, 4);
ok('a short drag settles back on the same card', await until(`${STILL} && ${H}.signPeek().id === 'aries' && Math.abs(${H}.signPeek().x) < 1`, 4000), JSON.stringify(await peek()));
// --- swipe RIGHT twice: back to the open sky, then WRAP to pisces ---
await drag(cp.x, cp.y, 150);
ok('a swipe right returns to THE OPEN SKY', await until(`${STILL} && ${H}.signPeek().id === 'none'`, 4000), JSON.stringify(await peek()));
await drag(cp.x, cp.y, 150);
ok('a swipe right from the first card WRAPS to PISCES (13 of 13)', await until(`${STILL} && ${H}.signPeek().id === 'pisces' && ${H}.signPeek().cur === 12`, 4000), JSON.stringify(await peek()));
// --- the arrows: › from pisces wraps to the open sky; ‹ back to pisces ---
const ar = await css(`${H}.signC.list.find(o => o.type === 'Text' && o.text === '›')`);
const al = await css(`${H}.signC.list.find(o => o.type === 'Text' && o.text === '‹')`);
ok('a real tap on › from the last card WRAPS to the open sky', await touchUntil(ar, `${STILL} && ${H}.signPeek().id === 'none'`, 6), JSON.stringify(await peek()));
ok('a real tap on ‹ wraps back to PISCES', await touchUntil(al, `${STILL} && ${H}.signPeek().id === 'pisces'`, 6), JSON.stringify(await peek()));
ok('only three card containers live in the strip', await ev(`(() => { let n = 0; ${H}.signC.list.forEach(o => { if (o.list) o.list.forEach(k => { if (k.getData && k.getData('zodCard')) n++; }); }); return n === 3 })()`));

/* ---------- v0.79.0 FULL-BLEED: the chrome is dead, the card is the sheet ---------- */
console.log('\n━━ FULL-BLEED (v0.79.0) — the frame, headline, subtitle and pager are gone; the card takes the safe band');
const fb = await evj(`JSON.stringify((() => { const s = ${H}; const l = ssLayout(s); const p = s.signPeek();
  const cb = p.card.getBounds();
  const art = p.card.list.find(o => o.texture && (o.texture.key.indexOf('zod_') === 0 || o.texture.key === 'zodsky'));
  const texts = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text') texts.push(o.text); if (o.list) w(o.list); }); w(s.signC.list);
  return { cw: Math.round(cb.width / l.u(1)), chh: Math.round(cb.height / l.u(1)),
    ah: art ? Math.round(art.displayHeight / l.u(1)) : 0,
    win: s.signC.list.some(o => o.texture && o.texture.key === 'endpanel'),
    pager: texts.some(t => /\\d+ \\/ 13/.test(t)),
    title: texts.some(t => /CHOOSE YOUR SIGN|born beneath one sky/.test(t)),
    zpT: typeof SS_STR.en.zpTitle, zpS: typeof SS_STR.es.zpSub, zpTde: typeof SS_STR.de.zpTitle } })())`);
ok('the dead chrome is gone — no framed window, no headline/subtitle, no pager', !fb.win && !fb.pager && !fb.title, JSON.stringify(fb));
ok('zpTitle/zpSub are culled from the table (no tongue carries them)', fb.zpT === 'undefined' && fb.zpS === 'undefined' && fb.zpTde === 'undefined');
ok('the card takes the design box (≥400×700 of 420×800) and the plate stands ≥700 tall (was 240)', fb.cw >= 400 && fb.chh >= 700 && fb.ah >= 700, `card ${fb.cw}×${fb.chh} · art h ${fb.ah}`);
// the HARD control at the new geometry: a swipe ACROSS the box turns the
// deck and never flips it; a tap toggles it both ways (still on PISCES)
const hz = await css(`${H}.signC.list.find(o => o.getData && o.getData('hardBox'))`);
const hp0 = await ev(`JSON.stringify(SS.prof.hardPick || {})`);
await drag(hz.x, hz.y, -150);
ok('a real swipe STARTING on the HARD box turns the deck (pisces → open sky)', await until(`${STILL} && ${H}.signPeek().id === 'none'`, 4000), JSON.stringify(await peek()));
ok('…and the swipe never flips the box', await ev(`JSON.stringify(SS.prof.hardPick || {}) === '${hp0}'`), await ev(`JSON.stringify(SS.prof.hardPick)`));
ok('a real tap on HARD ticks the standing card (none)', await touchUntil(hz, `SS.prof.hardPick.none === 1`, 5));
ok('a second tap unticks it clean', await touchUntil(hz, `!SS.prof.hardPick.none`, 5));
// the quiet band above BEGIN: a near-miss lands on the catch zone, never the veil
const nearMiss = await evj(`JSON.stringify((() => { const l = ssLayout(${H}); const D = game.scale.width / innerWidth;
  return { x: l.x(0) / D, y: l.y(723) / D } })())`);
await touch(nearMiss.x, nearMiss.y);
await sleep(350);
ok('a near-miss just above BEGIN is absorbed — the sheet stands', await ev(SHEET));
ok('…and back on top: ‹ returns to PISCES for the walk ahead', await touchUntil(al, `${STILL} && ${H}.signPeek().id === 'pisces'`, 6), JSON.stringify(await peek()));
// --- walk to TAURUS (2) by arrows: the art seam ---
for (let i = 0; i < 3; i++) { await touch(ar.x, ar.y); await until(STILL, 3000); }
p = await peek();
ok('three › taps from pisces land on TAURUS', p.id === 'taurus', JSON.stringify(p));
ok('the TAURUS card takes the zod_taurus plate (the seam) and skips the asterism', await ev(`(() => { const k = ${H}.signPeek().card; return k.list.some(o => o.texture && o.texture.key === 'zod_taurus') && !k.list.some(o => o.texture && o.texture.key === 'zodsky') && k.list.filter(o => o.type === 'Graphics').length === 3 })()`));
// --- LEO (5): the record renders ---
for (let i = 0; i < 3; i++) { await touch(ar.x, ar.y); await until(STILL, 3000); }
p = await peek();
tx = await cardTexts();
ok('three more › land on LEO with its record styled in', p.id === 'leo' && tx.includes('★ ' + 'cleared ×2 · best 1234'), JSON.stringify(p) + ' ' + tx.join(' | ').slice(0, 120));
await judge('16 · leo');
ok('every desc line is single (ssTextBlock, one Text per line)', await ev(`(() => { const k = ${H}.signPeek().card; const b = k.list.find(o => o.getData && o.getData('zodDesc')); return !!b && b.lines.length >= 1 && b.lines.every(t => !t.text.includes('\\n')) })()`));
// --- BEGIN on LEO: pins leo, opens the chart; the run carries the power ---
const bp = await css(`${H}.signC.list.find(o => o.texture && /^btn/.test(o.texture.key) && o.displayWidth > 200)`);
ok('a real tap on BEGIN under LEO pins beta3.campsign=leo and opens the star chart', await touchUntil(bp, `!${H}.signC && !!${H}.mapC && localStorage.getItem('beta3.campsign') === 'leo'`, 6), await ev(`localStorage.getItem('beta3.campsign')`));
await ev(`${H}.scene.start('battle', { mode: 'campaign', resume: null })`);
ok('the campaign run stands under LEO (b.sign = leo, the sign glyph beside the score)', await until(`(() => { const b = game.scene.getScene('battle'); return game.scene.isActive('battle') && b.state === 'pick' && b.sign === 'leo' && !!b.signZ && b.signZ.id === 'leo' && !!b.signG })()`, 60000));
// --- back home: BEGIN on the first card starts an unsigned run ---
await ev(`game.scene.getScene('battle').scene.start('home')`);
ok('home stands again', await until(HOME_REST, 60000));
await ev(`ssClearCampaign()`);
await sleep(400);
ok('NEW GAME opens the sheet again, on THE OPEN SKY', await open() && (await peek()).id === 'none');
const bp2 = await css(`${H}.signC.list.find(o => o.texture && /^btn/.test(o.texture.key) && o.displayWidth > 200)`);
ok('BEGIN on the first card pins none and opens the chart', await touchUntil(bp2, `!${H}.signC && !!${H}.mapC && localStorage.getItem('beta3.campsign') === 'none'`, 6), await ev(`localStorage.getItem('beta3.campsign')`));
await ev(`${H}.scene.start('battle', { mode: 'campaign', resume: null })`);
ok('the unsigned classic run stands (b.sign null, no glyph)', await until(`(() => { const b = game.scene.getScene('battle'); return game.scene.isActive('battle') && b.state === 'pick' && b.sign === null && !b.signZ && !(b.signG && b.signG.active && b.signG.scene === b) })()`, 60000));
// --- ✕ and the veil close ---
await ev(`game.scene.getScene('battle').scene.start('home')`);
ok('home stands (3)', await until(HOME_REST, 60000));
await ev(`ssClearCampaign()`); await sleep(400);
ok('the sheet opens (3)', await open());
const xp = await css(`${H}.signC.list.find(o => o.type === 'Text' && o.text === '✕')`);
ok('a real tap on ✕ closes the sheet', await touchUntil(xp, `!${H}.signC`, 6));
ok('the sheet opens (4)', await open());
ok('a real touch on the veil closes the sheet', await touchUntil({ x: 20, y: 30 }, `!${H}.signC`, 6));
ok('no page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ---------- v0.84.0 THE LIVING SKY: the open sky twinkles, a star crosses ---------- */
console.log('\n━━ THE LIVING SKY (v0.84.0) — the unsigned card breathes; sign cards stay dead still');
ok('the sheet opens on THE OPEN SKY (living-sky walk)', await open() && (await peek()).id === 'none');
const SKY = `JSON.stringify(window.__ssopensky)`;
let sky = await evj(SKY);
ok('the layer beacon stands: 25 seeded sprites, live (not stilled), the manual door open', sky.stars === 25 && sky.still === false && sky.builds >= 1 && await ev(`typeof window.__ssopensky.poke === 'function'`), JSON.stringify(sky));
// ⚠ under ?rend=cv the tint shim (ssCanvasTintShim) swaps a tinted image's
// texture to a cached '<base>#<hex>' copy and stamps __ssBaseTex — read the
// BASE key, or every tinted star is invisible to a raw key match
const BK = `const bk = (o) => o.__ssBaseTex || (o.texture && o.texture.key);`;
const COUNT = `(() => { ${BK} const k = ${H}.signPeek().card; let dots = 0, sparks = 0; const w = (ls) => ls.forEach(o => { if (o.list) w(o.list); if (bk(o) === 'dot') dots++; if (bk(o) === 'spark4') sparks++; }); w(k.list); return { dots, sparks, gfx: k.list.filter(o => o.type === 'Graphics').length } })()`;
let cnt = await evj(`JSON.stringify(${COUNT})`);
ok('the field hangs on the card — 22 dots + 3 hero sparks, Graphics census still 3', cnt.dots >= 22 && cnt.dots <= 30 && cnt.sparks === 3 && cnt.gfx === 3, JSON.stringify(cnt));
const order = await evj(`JSON.stringify((() => { const k = ${H}.signPeek().card;
  const pi = k.list.findIndex(o => o.texture && o.texture.key === 'zodsky');
  const li = k.list.findIndex(o => o.list && o.list.some(ch => ch.texture && ch.texture.key === 'spark4'));
  const si = k.list.findIndex(o => o.texture && o.texture.key === 'zodscrim');
  return { pi, li, si } })())`);
ok('the layer rides between the wash plate and the reading scrims', order.pi >= 0 && order.li === order.pi + 1 && order.si > order.li, JSON.stringify(order));
// the breathing: deal a baseline of the field's 25 alphas, then poll until
// enough of them have moved off it (the batched start lands 400ms after the
// build, each star on its own rhythm and delay)
const ALPHAS = `JSON.stringify((() => { ${BK} const k = ${H}.signPeek().card; const out = []; const w = (ls) => ls.forEach(o => { if (o.list) w(o.list); if (bk(o) === 'dot' || bk(o) === 'spark4') out.push(Math.round(o.alpha * 1000)); }); w(k.list); return out.slice(0, 25) })())`;
await sleep(900);
const a0 = await evj(ALPHAS);
ok('the stars breathe on their own rhythms (≥8 of 25 alphas move off the deal)', await until(`(() => { const a = JSON.parse(${ALPHAS}); const p = JSON.parse(${JSON.stringify(JSON.stringify(a0))}); let m = 0; for (let i = 0; i < 25; i++) if (a[i] !== p[i]) m++; return m >= 8 })()`, 9000, 300));
// the shooting star, deterministically: wait for a clear sky, poke the
// manual door, watch the head + chained trail live and sweep themselves
ok('the sky sits clear between crossings', await until(`(${COUNT}).dots === 22`, 12000));
sky = await evj(SKY);
await ev(`(window.__ssopensky.poke(), 1)`);
ok('a poked shooting star crosses the card (head + chained trail live)', await until(`(${COUNT}).dots >= 30`, 2500, 60), JSON.stringify(await evj(`JSON.stringify(${COUNT})`)));
ok('…and burns out clean (the flight sweeps itself)', await until(`(${COUNT}).dots === 22`, 12000), JSON.stringify(await evj(`JSON.stringify(${COUNT})`)));
ok('the beacon counted the crossing', (await evj(SKY)).shots >= sky.shots + 1);
sky = await evj(SKY);
ok('the sky looses one on its OWN clock (natural cadence ≤ ~15s + flight)', await until(`window.__ssopensky.shots >= ${sky.shots + 1}`, 22000, 500));
// deck turns rebuild all three cards — the tween ledger must sit flat or
// the twinkles are orphaned on every turn. Scope the count to tweens whose
// targets live under the SHEET: the meadow keeps cycling its showcase
// constellation beneath the veil, so the scene-wide total drifts on its own
await until(`(${COUNT}).dots === 22`, 12000);
const TWN = `(() => { const s = ${H}; const inSheet = (o) => { for (let p = o && o.parentContainer; p; p = p.parentContainer) if (p === s.signC) return true; return false; };
  return s.tweens.getTweens().filter(t => { try { return (t.targets || []).some(inSheet); } catch (e) { return false; } }).length })()`;
const stableTw = async () => { let prev = -1; for (let i = 0; i < 16; i++) { const v = await ev(TWN); if (v === prev) return v; prev = v; await sleep(450); } return prev; };
await drag(cp.x, cp.y, -150);
await until(`${STILL} && ${H}.signPeek().id === 'aries'`, 4000);
await drag(cp.x, cp.y, 150);
await until(`${STILL} && ${H}.signPeek().id === 'none'`, 4000);
await sleep(900);
const t1 = await stableTw();
await drag(cp.x, cp.y, -150);
await until(`${STILL} && ${H}.signPeek().id === 'aries'`, 4000);
await drag(cp.x, cp.y, 150);
await until(`${STILL} && ${H}.signPeek().id === 'none'`, 4000);
await sleep(900);
const t2 = await stableTw();
ok('two more deck turns leave the sheet\'s tween ledger flat (~28 twinkles, no orphans across rebuilds)', t1 >= 26 && Math.abs(t2 - t1) <= 4, t1 + ' → ' + t2);
// the gate: sign cards stay dead still — ARIES rides the SAME shared wash
// (its plate is blocked in this boot) and hangs nothing; TAURUS (real art)
// hangs nothing either
await drag(cp.x, cp.y, -150);
await until(`${STILL} && ${H}.signPeek().id === 'aries'`, 4000);
cnt = await evj(`JSON.stringify(${COUNT})`);
ok('ARIES (the shared-wash fallback) hangs NO living layer — its wash stays dead still', cnt.dots === 0 && cnt.sparks === 0 && cnt.gfx === 4, JSON.stringify(cnt));
const ar2 = await css(`${H}.signC.list.find(o => o.type === 'Text' && o.text === '›')`);
await touch(ar2.x, ar2.y); await until(STILL, 3000);
cnt = await evj(`JSON.stringify(${COUNT})`);
ok('TAURUS (the real-art plate) hangs NO living layer either', (await peek()).id === 'taurus' && cnt.dots === 0 && cnt.sparks === 0, JSON.stringify(cnt));
ok('…and with no open-sky card among the three, the manual door is closed (cleanup proof)', await ev(`window.__ssopensky.poke === null`));
// close the sheet with a flight mid-air: the layer's destroy sweeps it
const al2 = await css(`${H}.signC.list.find(o => o.type === 'Text' && o.text === '‹')`);
await touch(al2.x, al2.y); await until(STILL, 3000);
await touch(al2.x, al2.y);
await until(`${STILL} && ${H}.signPeek().id === 'none'`, 4000);
await ev(`(window.__ssopensky.poke(), 1)`);
const xp2 = await css(`${H}.signC.list.find(o => o.type === 'Text' && o.text === '✕')`);
ok('✕ closes the sheet with a star mid-flight — swept clean, the door nulled', await touchUntil(xp2, `!${H}.signC`, 6) && await until(`window.__ssopensky.poke === null`, 2000));
// ⚠ scoped to the layer's own __ssAlive mark: the MEADOW leaks orphan
// twinkle tweens on every showcase-constellation turnover (~14-24 each
// ~10s, pre-existing, surfaced with v0.84.0) — a scene-wide scan reds on
// ambient behaviour this suite does not own
ok('…and no tween anywhere rides a destroyed layer sprite (the orphan scan)', await until(`(() => { const s = ${H}; return s.tweens.getTweens().filter(t => { try { return (t.targets || []).some(o => o && o.active === false && o.__ssAlive); } catch (e) { return false; } }).length === 0 })()`, 4000));
ok('no page exceptions through the living walk', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ---------- the seams: ?twinkle=0 and reduced motion still the layer ---------- */
console.log('\n━━ THE STILLED SKY — ?twinkle=0 and reduced motion keep the field, drop the movement');
ok('home stands (?twinkle=0)', await boot({ w: 393, h: 852, dpr: 3 }, '59,34', '&twinkle=0'));
ok('the sheet opens on THE OPEN SKY (stilled)', await open() && (await peek()).id === 'none');
sky = await evj(SKY);
cnt = await evj(`JSON.stringify(${COUNT})`);
ok('the field survives the stilling — 25 sprites, still flag up, no door, no crossings', sky.stars === 25 && sky.still === true && sky.shots === 0 && await ev(`window.__ssopensky.poke === null`) && cnt.dots === 22 && cnt.sparks === 3 && cnt.gfx === 3, JSON.stringify(sky) + ' ' + JSON.stringify(cnt));
const f0 = await evj(ALPHAS);
await sleep(1400);
const f1 = await evj(ALPHAS);
ok('…and the sky is FROZEN (25 alphas byte-equal across 1.4s)', JSON.stringify(f0) === JSON.stringify(f1) && f0.length === 25);
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
ok('home stands (reduced motion)', await boot({ w: 393, h: 852, dpr: 3 }, '59,34'));
ok('the sheet opens on THE OPEN SKY (reduced)', await open() && (await peek()).id === 'none');
sky = await evj(SKY);
ok('reduced motion stills the layer the same way (field up, movement gone)', sky.stars === 25 && sky.still === true && await ev(`window.__ssopensky.poke === null`), JSON.stringify(sky));
const r0 = await evj(ALPHAS);
await sleep(1400);
const r1 = await evj(ALPHAS);
ok('…frozen under reduced motion too', JSON.stringify(r0) === JSON.stringify(r1) && r0.length === 25);
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: '' }] });
ok('no page exceptions through the stilled walks', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ---------- the geometries: SE and iPad, layout only ---------- */
for (const dv of [{ name: 'iPhone SE', w: 375, h: 667, dpr: 2, inset: '0,0' }, { name: 'iPad portrait', w: 820, h: 1180, dpr: 2, inset: '24,20' }]) {
  console.log(`\n━━ ${dv.name} — ${dv.w}×${dv.h} @${dv.dpr}`);
  ok('home stands', await boot(dv, dv.inset));
  ok('NEW GAME opens the sheet', await open());
  await judge(dv.name + ' · open sky');
  const c2 = await css(`${H}.signPeek().card`);
  await drag(c2.x, c2.y, -Math.round(dv.w * 0.4));
  ok('a swipe lands on ARIES', await until(`${STILL} && ${H}.signPeek().id === 'aries'`, 4000), JSON.stringify(await peek()));
  await judge(dv.name + ' · aries');
  const a2 = await css(`${H}.signC.list.find(o => o.type === 'Text' && o.text === '›')`);
  for (let i = 0; i < 5; i++) { await touch(a2.x, a2.y); await until(STILL, 3000); }
  ok('five › taps land on VIRGO (the longest desc)', (await peek()).id === 'virgo', JSON.stringify(await peek()));
  await judge(dv.name + ' · virgo');
  ok('no page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));
}

console.log(`\n${pass} passed, ${fail} failed`);
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
