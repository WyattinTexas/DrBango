// ZOD-ART-CHECK — the zodiac card art seam, with the real plates in it
// (v0.58.0, task 47). sign-check.mjs pins the CARDS (swipe, arrows, layout,
// one-line law — and the asterism fallback, by blocking aries's plate);
// this one pins the ART: every one of the twelve sign cards renders its
// shipped `zod_<id>` texture — proven by SAMPLING SCREEN PIXELS in the art
// region against the placeholder wash at the same relative points, not by
// reading a texture key alone — THE OPEN SKY keeps its quiet empty sky,
// a blocked plate still falls back to the asterism, and BEGIN still pins
// the sign. Real touches at DPR 3 (iPhone 16 geometry), Canvas renderer,
// Firebase blocked at the network layer. Self-launching, foreground.
//
//   node tools/zod-art-check.mjs
//   SHOTS=/tmp/zodshots node tools/zod-art-check.mjs   # keep a PNG + card
//                                                      # rect per card (the
//                                                      # review sheet's cut)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const PORT = 9459, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
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
  '--user-data-dir=/tmp/cdp-zodart', '--window-size=393,852', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const HOME_REST = `!!window.game && game.scene.isActive('home') && !${H}.introPlaying && !!${H}.lanternB`;
const SHEET = `!!${H}.signC && !!${H}.signPeek`;
const STILL = `${SHEET} && !${H}.signPeek().moving`;
const ARTLOADED = `typeof SSART !== 'undefined' && SS_ZOD_ART.every((i) => !!SSART.img['zod_' + i])`;
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

/* the art plate on the current card (zod_<id> or zodsky), its SCREEN rect in
   device px, and the card's rect derived from it (art = 160×240 of the card's
   272×424, its top 62 under the card's) — for the pixel probes and the shot */
const RECTS = `JSON.stringify((() => { const s = ${H}; const p = s.signPeek(); const cam = s.cameras.main;
  const im = p.card.list.find((o) => o.texture && (o.texture.key.indexOf('zod_') === 0 || o.texture.key === 'zodsky'));
  if (!im) return { none: true };
  const b = im.getBounds(); const u = b.width / 160;
  const art = { x: b.x - cam.scrollX, y: b.y - cam.scrollY, w: b.width, h: b.height };
  return { key: im.texture.key, art, card: { x: art.x - 56 * u, y: art.y - 62 * u, w: 272 * u, h: 424 * u } } })())`;
// screen pixel via the renderer's own buffer (the crisp law: never trust a
// stale captureScreenshot frame), at art-region fractions (fx, fy)
const probe = async (fx, fy) => evj(`(() => { const r = JSON.parse(${RECTS});
  const x = Math.round(r.art.x + r.art.w * ${fx}), y = Math.round(r.art.y + r.art.h * ${fy});
  return new Promise((res) => game.renderer.snapshotPixel(x, y, (c) => res(JSON.stringify({ r: c.red, g: c.green, b: c.blue })))) })()`);
// the placeholder wash at the same relative point, read from the zodsky
// texture itself (canvas texture — getPixel is exact)
const wash = async (fx, fy) => evj(`(() => { const s = ${H}; const src = s.textures.get('zodsky').getSourceImage();
  const t = s.textures.get('zodsky'); const c = t.context.getImageData(Math.round(src.width * ${fx}), Math.round(src.height * ${fy}), 1, 1).data;
  return JSON.stringify({ r: c[0], g: c[1], b: c[2] }) })()`);
const PTS = [[0.5, 0.35], [0.5, 0.5], [0.3, 0.62], [0.7, 0.62], [0.5, 0.82]];
const artDiff = async () => {
  let mx = 0;
  for (const [fx, fy] of PTS) {
    const a = await probe(fx, fy), w = await wash(fx, fy);
    mx = Math.max(mx, Math.abs(a.r - w.r), Math.abs(a.g - w.g), Math.abs(a.b - w.b));
  }
  return mx;
};
const shot = async (name) => {
  if (!SHOTS) return;
  const r = await evj(RECTS);
  const png = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(SHOTS + '/' + name + '.png', Buffer.from(png.data, 'base64'));
  writeFileSync(SHOTS + '/' + name + '.json', JSON.stringify(r));
};
const open = async () => {
  const qp = await css(`${H}.rowBtns.newcamp`);
  const r = await touchUntil(qp, SHEET, 10);
  await until(STILL, 5000);
  await sleep(450);
  return r;
};
const boot = async (block) => {
  await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 3, mobile: true, screenWidth: 393, screenHeight: 852, screenOrientation: { type: 'portraitPrimary', angle: 0 } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  // no ?diag=1 — the harness reads game objects directly, and the diag box
  // would paint over the card's foot in the SHOTS the review sheet crops
  await send('Page.navigate', { url: BASE + `?rend=cv&fps=0&inset=59,34&mpuid=zart${Math.floor(Math.random() * 1e6)}` });
  await sleep(1500);
  if (!(await until(HOME_REST, 90000))) return false;
  errs.length = 0;
  // all 12 plates must ARRIVE before the sheet opens — this is itself the law
  const loaded = await until(ARTLOADED, 20000);
  ok('all 12 art/zod_<id>.webp plates load beside the other art', loaded, await ev(`typeof SSART === 'undefined' ? 'no SSART' : SS_ZOD_ART.filter((i) => !SSART.img['zod_' + i]).join(',')`));
  await ev(`(() => { ssClearCampaign(); ${block ? `delete SSART.img.zod_${block}; if (${H}.textures.exists('zod_${block}')) ${H}.textures.remove('zod_${block}');` : ''} return 1 })()`);
  await sleep(400);
  return true;
};

/* ---------- all thirteen cards wear their art ---------- */
console.log('\n━━ the thirteen cards — iPhone 16 · 393×852 @3');
ok('home stands', await boot());
ok('NEW GAME opens the sign sheet', await open());
let r = await evj(RECTS);
ok('THE OPEN SKY keeps its quiet empty sky (zodsky, no plate, no glyph)', r.key === 'zodsky' &&
  await ev(`(() => { const k = ${H}.signPeek().card; return !k.list.some((o) => o.texture && o.texture.key.indexOf('zod_') === 0) && k.list.filter((o) => o.type === 'Graphics').length === 2 })()`), r.key);
await shot('card_none');
const ar = await css(`${H}.signC.list.find(o => o.type === 'Text' && o.text === '›')`);
const IDS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
for (const sid of IDS) {
  await touch(ar.x, ar.y);
  const there = await until(`${STILL} && ${H}.signPeek().id === '${sid}'`, 5000);
  if (!there) { ok(`› lands on ${sid}`, false, JSON.stringify(await evj(`JSON.stringify(${H}.signPeek ? { id: ${H}.signPeek().id } : {})`))); continue; }
  r = await evj(RECTS);
  const d = r.key === 'zod_' + sid ? await artDiff() : -1;
  ok(`${sid}: the card wears zod_${sid} — no wash, pixels differ from the placeholder (Δ${d})`,
    r.key === 'zod_' + sid && d > 30 &&
    await ev(`(() => { const k = ${H}.signPeek().card; return !k.list.some((o) => o.texture && o.texture.key === 'zodsky') && k.list.filter((o) => o.type === 'Graphics').length === 2 })()`),
    'key=' + r.key + ' Δ' + d);
  await shot('card_' + sid);
}
ok('no page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ---------- the fallback and the pin ---------- */
console.log('\n━━ a blocked plate falls back · BEGIN pins');
ok('home stands with zod_aries blocked', await boot('aries'));
ok('the sheet opens', await open());
const ar2 = await css(`${H}.signC.list.find(o => o.type === 'Text' && o.text === '›')`);
ok('› lands on ARIES', await (async () => { await touch(ar2.x, ar2.y); return until(`${STILL} && ${H}.signPeek().id === 'aries'`, 5000); })());
r = await evj(RECTS);
ok('the blocked card still renders — the asterism on the night-sky wash', r.key === 'zodsky' &&
  await ev(`(() => { const k = ${H}.signPeek().card; return !k.list.some((o) => o.texture && o.texture.key === 'zod_aries') && k.list.filter((o) => o.type === 'Graphics').length === 3 })()`), r.key);
ok('its neighbors still wear THEIR art (taurus, one › on)', await (async () => {
  await touch(ar2.x, ar2.y); if (!(await until(`${STILL} && ${H}.signPeek().id === 'taurus'`, 5000))) return false;
  return (await evj(RECTS)).key === 'zod_taurus';
})());
const bp = await css(`${H}.signC.list.find(o => o.texture && /^btn/.test(o.texture.key) && o.displayWidth > 200)`);
ok('BEGIN under TAURUS pins beta3.campsign and opens the chart', await touchUntil(bp, `!${H}.signC && !!${H}.mapC && localStorage.getItem('beta3.campsign') === 'taurus'`, 6), await ev(`localStorage.getItem('beta3.campsign')`));
ok('no page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(`\n${pass} passed, ${fail} failed`);
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
