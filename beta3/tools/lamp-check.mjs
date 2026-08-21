// LAMP-CHECK — the streak lantern's PIXELS (v0.45.0). streak-check.mjs pins
// what the lamp IS (texture key, count, halo); this pins what it LOOKS LIKE,
// which is the only thing a phone can complain about. TestFlight v0.43.0:
// Wyatt's first daily lit the end screen's "the lantern is lit" and the
// meadow then wore the COLD lamp — half-transparent dark iron against the
// dusk at 26x36 CSS px, i.e. a gray rectangle. This suite snapshots the
// lamp's on-screen rect in every dress and asserts it is a LAMP: a warm
// glass in the lit dresses, visible iron in the cold one, and nothing
// missing.
//
// It runs the same checks on three boots:
//   1. as shipped (native roundRect — Safari 16.4+ / Chrome 99+)
//   2. roundRect DELETED before compat.js — that IS iOS 15, the shell's
//      floor; compat's polyfill must carry every bake
//   3. roundRect killed AFTER compat.js, so every painter that calls it
//      THROWS — ssBake must wipe, fall back, DIAG and carry on; no texture
//      may be missing and the meadow must still show a lamp
//
// Run from beta3/ with the folder served on :8899. Pass the CDP port and the
// renderer; run it ONCE PER RENDERER with a Chrome that can honour it:
//
//   node tools/lamp-check.mjs 9444 cv     # --disable-gpu Chrome is fine
//   node tools/lamp-check.mjs 9446 gl     # needs the three swiftshader flags
//
// ⚠ Under swiftshader ?rend=gl can run at 1 fps; every wait POLLS.
// Page.captureScreenshot hands back a stale WebGL frame — the snapshots here
// go through game.renderer.snapshotArea, which reads the buffer properly.
// SHOTS=<dir> keeps the crops.
import { writeFileSync, mkdirSync } from 'node:fs';
const PORT = process.argv[2] || '9444', REND = process.argv[3] || 'cv';
const SHOTS = process.env.SHOTS || '';
const BASE = 'http://localhost:8899/index.html';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') {
    const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200);
    if (!/WebGL context/.test(t)) errs.push(t);
  }
};
await new Promise(r => ws.onopen = r);
const send = (m, p) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const ev = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r?.result?.value;
};
const until = async (e, cap = 90000) => {
  for (let i = 0; i < cap / 500; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(500); }
  return false;
};
const HOME_REST = `!!window.game && game.scene.isActive('home')
  && !game.scene.getScene('home').introPlaying && !!game.scene.getScene('home').lanternB`;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

// the lamp's on-screen rect, read off the renderer. Pixels are sorted into
// WARM (the lit glass and brass: red over green over blue), IRON (cool, pale
// — the cold pewter: lighter than the sky and bluish) and SKY (whatever the
// dusk is at that corner, sampled from the crop's own border).
const peek = (n, tag) => ev(`new Promise(res => { const h = game.scene.getScene('home');
  SS.prof.streak = { n:${n}, last: SSNET.dayKey(), best:${n}, g:1, gp:0, gd:[], mk:0, pend:0 }; h.updateLantern();
  const go = () => { const b = h.lanternB.getBounds(), cam = h.cameras.main;
    const x0 = Math.max(0, Math.floor(b.left - cam.scrollX) - 4), y0 = Math.max(0, Math.floor(b.top - cam.scrollY) - 4);
    const w = Math.ceil(b.width) + 8, hh = Math.ceil(b.height) + 8;
    game.renderer.snapshotArea(x0, y0, w, hh, img => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      // the sky: the crop's outer 2px ring
      let sr = 0, sg = 0, sb = 0, sn = 0;
      for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
        if (px > 1 && px < c.width - 2 && py > 1 && py < c.height - 2) continue;
        const i = (py * c.width + px) * 4; sr += d[i]; sg += d[i+1]; sb += d[i+2]; sn++; }
      sr /= sn; sg /= sn; sb /= sn;
      let warm = 0, iron = 0, diff = 0, tot = 0, opaque = 0;
      for (let i = 0; i < d.length; i += 4) { const R = d[i], G = d[i+1], B = d[i+2]; tot++;
        if (d[i+3] > 250) opaque++;
        const dl = Math.abs(R - sr) + Math.abs(G - sg) + Math.abs(B - sb);
        if (dl > 60) diff++;
        if (R > G + 25 && G > B + 15 && R > 170) warm++;
        if (B > R + 8 && (R + G + B) > (sr + sg + sb) + 90) iron++; }
      res(JSON.stringify({ tex: h.lanternB.texture.key, alpha: h.lanternB.alpha, count: h.lanternT.text, frameW: h.lanternB.frame.width,
        tot, warm, iron, diff, opaque, sky: [sr, sg, sb].map(Math.round), png: ${SHOTS ? 'c.toDataURL()' : '""'} })); }); };
  // give the renderer a frame with the new dress on it before reading it back
  let f = 0; const tick = () => { if (++f >= 3) go(); else requestAnimationFrame(tick); }; requestAnimationFrame(tick); })`).then(JSON.parse).then(r => {
    if (SHOTS && r.png) writeFileSync(`${SHOTS}/${tag}-n${n}.png`, Buffer.from(r.png.split(',')[1], 'base64'));
    delete r.png; return r;
  });

const dresses = async (tag) => {
  const L = {};
  for (const n of [0, 1, 2, 7, 30, 100]) L[n] = await peek(n, tag);
  const brief = (n) => `${L[n].tex} warm=${L[n].warm} iron=${L[n].iron} diff=${L[n].diff}/${L[n].tot}`;
  // the cold lamp: enough pale iron against the sky to read as a thing with a shape
  ok(`${tag}: no streak — a COLD lamp that still reads as a lamp (iron, not a gray box)`,
    L[0].tex === 'lantern-cold' && L[0].iron >= 400 && L[0].diff >= 1200 && L[0].alpha > 0.75, brief(0));
  // THE bug: night one is LIT — warm glass on the meadow, not the cold dress
  ok(`${tag}: the FIRST night lights it — warm glass on the grass, no number yet`,
    L[1].tex === 'lantern-lit' && L[1].warm >= 800 && L[1].count === '' && L[1].alpha === 1, brief(1) + ' count=' + JSON.stringify(L[1].count));
  ok(`${tag}: night two carries the count`, L[2].tex === 'lantern-lit' && L[2].warm >= 800 && L[2].count === '2', brief(2));
  for (const [n, k] of [[7, 'lantern-m1'], [30, 'lantern-m2'], [100, 'lantern-m3']])
    ok(`${tag}: night ${n} → ${k}, painted warm`, L[n].tex === k && L[n].warm >= 800 && L[n].diff >= 1500, brief(n));
  // every dress is a real bake at the resolution factor, not a 32px stand-in
  ok(`${tag}: every dress is a full-resolution bake`, [0, 1, 2, 7, 30, 100].every(n => L[n].frameW >= 60), [0, 1, 2, 7, 30, 100].map(n => L[n].frameW).join(','));
  return L;
};
const bakes = () => ev(`(() => { const out = {}; for (const k of ['lantern-cold','lantern-lit','lantern-m1','lantern-m2','lantern-m3','panel','btn','btndark','chipred','endpanel','ribbon','veil']) {
  if (!game.textures.exists(k)) { out[k] = 'MISSING'; continue; }
  const s = game.textures.get(k).getSourceImage(); if (!s.getContext) { out[k] = 'img'; continue; }
  const d = s.getContext('2d').getImageData(0, 0, s.width, s.height).data; let a = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) a++;
  out[k] = Math.round(100 * a / (d.length / 4)); } return JSON.stringify(out) })()`).then(JSON.parse);

// ================================================================
// 1. AS SHIPPED
// ================================================================
console.log(`\n— ${REND}: as shipped —`);
await send('Page.navigate', { url: `${BASE}?rend=${REND}&fps=0` }); await sleep(8000);
ok('the meadow stands up', await until(HOME_REST));
ok('the renderer is the one asked for', await ev(`game.renderer.type === (${JSON.stringify(REND)} === 'cv' ? Phaser.CANVAS : Phaser.WEBGL)`) === true,
  await ev(`game.renderer.type === Phaser.CANVAS ? 'CANVAS' : 'WEBGL'`) + ' at dpr ' + await ev('devicePixelRatio'));
ok('roundRect is native here (the baseline)', await ev(`!/arcTo/.test(String(CanvasRenderingContext2D.prototype.roundRect))`) === true);
const shipped = await dresses('shipped');
let b = await bakes();
ok('no bake failed and none is missing', (await ev('(window.__ssBakeFail || []).length')) === 0 && !Object.values(b).includes('MISSING'), JSON.stringify(b));
// the sheet agrees with the meadow on night one
await ev(`(() => { SS.prof.streak = { n:1, last: SSNET.dayKey(), best:1, g:1, gp:0, gd:[], mk:0, pend:0 }; game.scene.getScene('home').streakSheet(); return 1 })()`);
// the sheet's items rise in on a tween — wait for the lamp to ARRIVE, never shoot early
ok('the lantern sheet opens and its lamp arrives', await until(`(() => { const c = game.scene.getScene('home').streakC; if (!c) return false;
  let a = 0; const w = (ls) => ls.forEach(o => { if (o.texture && /^lantern-/.test(o.texture.key)) a = o.alpha; if (o.list) w(o.list); }); w(c.list); return a >= 0.999 })()`));
const sheet = JSON.parse(await ev(`(() => { const c = game.scene.getScene('home').streakC; const imgs = [], txt = [];
  const w = (ls) => ls.forEach(o => { if (o.texture && o.texture.key) imgs.push(o.texture.key + '@' + o.alpha.toFixed(2)); if (o.type === 'Text') txt.push(o.text); if (o.list) w(o.list); }); w(c.list);
  return JSON.stringify({ imgs, txt }) })()`));
ok('the sheet wears the LIT lamp at full strength on night one, with its halo, and says night 1',
  sheet.imgs.includes('lantern-lit@1.00') && sheet.imgs.some(k => /^glowbig/.test(k)) && sheet.txt.some(t => /night 1/.test(t)) && !sheet.txt.includes('1'),
  sheet.imgs.filter(k => /lantern|glow/.test(k)).join(',') + ' ' + JSON.stringify(sheet.txt.filter(t => /night|1/.test(t))));
await ev(`(() => { const h = game.scene.getScene('home'); if (h.streakC) { h.streakC.destroy(); h.streakC = null; } return 1 })()`);

// ================================================================
// 2. iOS 15: NO roundRect AT ALL — compat.js must polyfill every bake
// ================================================================
console.log(`\n— ${REND}: roundRect deleted before boot (iOS 15) —`);
const { identifier: pre } = await send('Page.addScriptToEvaluateOnNewDocument', { source: `delete CanvasRenderingContext2D.prototype.roundRect; window.__noRR = true;` });
await send('Page.navigate', { url: `${BASE}?rend=${REND}&fps=0` }); await sleep(8000);
ok('the meadow stands up without a native roundRect', await until(HOME_REST));
ok('the polyfill carried it (arcTo path)', await ev(`window.__noRR === true && /arcTo/.test(String(CanvasRenderingContext2D.prototype.roundRect))`) === true);
const polyfilled = await dresses('ios15');
b = await bakes();
ok('no bake failed and none is missing on the polyfill', (await ev('(window.__ssBakeFail || []).length')) === 0 && !Object.values(b).includes('MISSING'), JSON.stringify(b));
ok('the polyfilled lamp paints the same picture (warm / iron counts within 10%)',
  [1, 7, 100].every(n => Math.abs(polyfilled[n].warm - shipped[n].warm) <= Math.max(40, shipped[n].warm * 0.1)) && Math.abs(polyfilled[0].iron - shipped[0].iron) <= Math.max(40, shipped[0].iron * 0.1),
  [0, 1, 7, 100].map(n => shipped[n].warm + '/' + polyfilled[n].warm + ' ' + shipped[n].iron + '/' + polyfilled[n].iron).join(' · '));
await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: pre });

// ================================================================
// 3. A PAINTER THAT THROWS — ssBake wipes, falls back, DIAGs, carries on
// ================================================================
console.log(`\n— ${REND}: roundRect killed after compat.js (every bake that uses it throws) —`);
const { identifier: post } = await send('Page.addScriptToEvaluateOnNewDocument', { source: `
  document.addEventListener('DOMContentLoaded', () => { CanvasRenderingContext2D.prototype.roundRect = function () { throw new TypeError('roundRect is not a function (harness)'); }; });` });
await send('Page.navigate', { url: `${BASE}?rend=${REND}&fps=0&diag=1` }); await sleep(8000);
ok('the meadow still stands up when painters throw', await until(HOME_REST));
const fails = await ev(`JSON.stringify(window.__ssBakeFail || [])`).then(JSON.parse);
ok('the failures are counted and named', fails.length >= 5 && fails.some(f => /^lantern-lit/.test(f)) && fails.every(f => /roundRect/.test(f)), fails.length + ' · ' + fails.slice(0, 3).join(' | '));
ok('…and DIAG said so on the phone-debug overlay', await ev(`/bake failed: lantern/.test(document.getElementById('diagbox') ? document.getElementById('diagbox').textContent : '') || (JSON.parse(localStorage.getItem('beta3.diaglog') || '[]').some(l => /bake failed/.test(l)))`) === true);
b = await bakes();
ok('no texture is missing — every failed bake was finished by a fallback or a wipe', !Object.values(b).includes('MISSING'), JSON.stringify(b));
const T = {};
for (const n of [0, 1, 7, 100]) T[n] = await peek(n, 'throw');
ok('the stand-in lamp is still a LAMP: warm glass lit, iron cold, nothing blank',
  T[1].warm >= 500 && T[7].warm >= 500 && T[100].warm >= 500 && T[0].iron >= 250 && T[1].tex === 'lantern-lit',
  [0, 1, 7, 100].map(n => T[n].tex + ' warm=' + T[n].warm + ' iron=' + T[n].iron).join(' · '));
ok('the baked-texture factories ran to the END (panel/btn after the lamps exist)', b.panel !== 'MISSING' && b.btn !== 'MISSING' && b.endpanel !== 'MISSING', JSON.stringify(b));
await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: post });

console.log('\n' + pass + ' passed, ' + fail + ' failed');
console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors');
process.exit(fail ? 1 : 0);
