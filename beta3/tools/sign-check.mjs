// SIGN-CHECK — the sign picker as CARDS (v0.57.0, task 46).
// One full-size card at a time (THE OPEN SKY first, then the twelve), ‹ ›
// arrows in the margins, a real swipe on the card with a settle tween and
// wrap at both ends, BEGIN always live. Everything here is REAL input at
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
const boot = async (dv, inset) => {
  await send('Emulation.setDeviceMetricsOverride', { width: dv.w, height: dv.h, deviceScaleFactor: dv.dpr, mobile: true, screenWidth: dv.w, screenHeight: dv.h, screenOrientation: { type: 'portraitPrimary', angle: 0 } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: BASE + `?rend=cv&fps=0&diag=1&mpuid=sign${Math.floor(Math.random() * 1e6)}&inset=${inset}` });
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
ok('the counter reads 13 / 13', await ev(`${H}.signC.list.some(o => o.type === 'Text' && o.text === '13 / 13')`));
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
