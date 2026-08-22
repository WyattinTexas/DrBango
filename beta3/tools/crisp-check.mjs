// CRISP-CHECK — portrait fidelity on EVERY phone (v0.50.x, task 39).
// Wyatt's phone rendered v0.49.0 uniformly soft (ref/wyatt-blur-*.jpg) and
// headless Chrome at his size was pixel-crisp. His standing order: "make
// sure the game looks good in portrait no matter what the device is." This
// is the proof. A matrix of real phones, each emulated over CDP
// (Emulation.setDeviceMetricsOverride: mobile + touch, the real css size and
// devicePixelRatio, the notch insets through ?inset=T,B), and on each the
// four surfaces — home, a battle board, CHOOSE A SIGIL, the daily share card
// — walked with REAL TOUCHES (Input.dispatchTouchEvent, never a screenshot):
//
//   geometry   canvas buffer === css × dpr on both axes, game.scale === the
//              buffer, no CSS transform on the canvas, visualViewport scale 1,
//              and the v0.50.0 sentinel agreeing (crisp:true, zero heals)
//   sharpness  the frame as the renderer holds it, cropped to the title /
//              button-label regions; mean |Laplacian| of luminance against
//              the SAME region downscaled to 1× and bilinearly upscaled back
//              (what a small buffer stretched over the screen looks like —
//              Wyatt's phone). The ratio crisp/upscaled must clear a floor
//              pinned from the measured values (PIN below); a ?dpr=1 control
//              run proves the metric falls through that floor on a blur
//   layout     every Text and every tap target inside the SAFE band (the
//              v0.36.2 inset law), nothing under the bottom edge on the short
//              SE, tap targets ≥ 44 css pt, no two Texts overlapping, and the
//              one-line law (no Text holds a newline or would wrap)
//   taps       a menu button, a tile, a sigil card and the share button —
//              each a real touch, each asserted by what the scene did
//
// Run from beta3/ with the folder served on :8899; the Chrome is its own:
//
//   python3 -m http.server 8899 &
//   node tools/crisp-check.mjs               # all devices
//   node tools/crisp-check.mjs --only=se,16   # a subset (substring of the id)
//   node tools/crisp-check.mjs --gl           # swiftshader GL instead of Canvas
//   SHOTS=/tmp/crisp node tools/crisp-check.mjs   # keep a PNG per surface
//
// Always --mute-audio, /tmp/cdp-crisp, killed on exit (and on Ctrl-C).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:8899/index.html';
const PORT = 9449;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const SHOTS = process.env.SHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

/* THE MATRIX. css size, devicePixelRatio, the safe-area insets the hardware
   imposes (CSS px; headless env() is always 0 so ?inset= carries them). */
const DEVICES = [
  { id: 'se',     name: 'iPhone SE (2nd/3rd)', w: 375, h: 667,  dpr: 2,     inset: [0, 0] },
  { id: '8plus',  name: 'iPhone 8 Plus',       w: 414, h: 736,  dpr: 3,     inset: [0, 0] },
  { id: 'xr',     name: 'iPhone XR / 11',      w: 414, h: 896,  dpr: 2,     inset: [48, 34] },
  { id: '13mini', name: 'iPhone 13 mini',      w: 375, h: 812,  dpr: 3,     inset: [50, 34] },
  { id: '16',     name: 'iPhone 15 / 16',      w: 393, h: 852,  dpr: 3,     inset: [59, 34] },
  { id: '16max',  name: 'iPhone 16 Pro Max',   w: 440, h: 956,  dpr: 3,     inset: [59, 34] },
  { id: 'ipad',   name: 'iPad portrait',       w: 820, h: 1180, dpr: 2,     inset: [24, 20] },
  { id: 'droid',  name: 'small Android',       w: 360, h: 800,  dpr: 2.625, inset: [0, 0] },
];
/* THE PIN. Sharpness ratio floors by DPR class, set from the measured values
   (first run, v0.50.1, Canvas renderer — see tools/README.md for the table).
   A blur (the ?dpr=1 control) measures ~1.0 on every device; a crisp frame
   sits far above these. Re-pin from the printed table if the art changes. */
const PIN = (dpr) => (dpr >= 3 ? 1.55 : dpr > 2.2 ? 1.4 : 1.3);
const CONTROL_CEIL = 1.35;   // the ?dpr=1 control must read like a blur (measured 1.22–1.27)

let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r2 = (v) => Math.round(v * 100) / 100;

/* ---- the Chrome ---------------------------------------------------------- */
const flags = ['--headless=new', '--no-sandbox', '--mute-audio', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/cdp-crisp', '--window-size=500,1000'];
if (args.gl) flags.push('--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader');
else flags.push('--disable-gpu');
const chrome = spawn(CHROME, flags.concat('about:blank'), { stdio: 'ignore' });
const bye = () => { try { chrome.kill('SIGKILL'); } catch (e) { } };
process.on('exit', bye); process.on('SIGINT', () => { bye(); process.exit(130); });
let list = null;
for (let i = 0; i < 40 && !list; i++) { await sleep(250); try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch (e) { } }
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
// the intro is skipped (the harness is after layout, not the overture); the
// clipboard and share are stubbed on every document — a real navigator.share
// inside a user activation opens the native sheet and freezes the browser
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
  try { sessionStorage.setItem('beta3.skipIntro', '1'); } catch (e) { }
  window.__copied = null; window.__shared = false;
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (t) => { window.__copied = t; return Promise.resolve(); } } });
  Object.defineProperty(navigator, 'share', { configurable: true, value: () => { window.__shared = true; return Promise.resolve(); } });` });
const ev = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r?.result?.value;
};
const evj = async (e) => JSON.parse(await ev(e));
const until = async (e, cap = 60000) => {
  for (let i = 0; i < cap / 250; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(250); }
  return false;
};
// a REAL touch at a css point, start then end, a finger's dwell between
const touch = async (x, y) => {
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 6, radiusY: 6, force: 1 }] });
  await sleep(70);
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
// tap REPEATS until the scene answers: interactive objects built in one
// frame are registered with the input plugin on the next, and at software
// frame rates one touch fired the instant a surface appears is simply lost
const touchUntil = async (pt, done, tries = 8) => {
  for (let i = 0; i < tries; i++) { await touch(pt.x, pt.y); if (await until(done, 2500)) return true; }
  return false;
};
const snap = async (name) => {
  if (!SHOTS) return;
  const data = await ev(`new Promise(res => game.renderer.snapshot(img => res(img.src)))`);
  writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(data.split(',')[1], 'base64'));
};

/* ---- the page-side library: geometry, sharpness, layout, taps -----------
   Installed once per document as window.__cc. Bounds are WORLD px (the
   camera never scrolls on these surfaces, and the battle's own scroll is
   subtracted where it matters). */
function LIB() {
  if (window.__cc) return 'lib';
  const D = DPR;   // game.js's top-level const (a script binding, not a window property)
  const vis = (o) => { for (let p = o; p; p = p.parentContainer) { if (!p.visible || p.alpha < 0.05) return false; } return true; };
  const walk = (root, fn) => { const w = (ls) => ls.forEach((o) => { fn(o); if (o.list) w(o.list); }); w(root); };
  const scene = () => { const ss = game.scene.getScenes(true); return ss.find((s) => s.scene.key === 'battle') || ss[0]; };
  const bnd = (o) => { const b = o.getBounds(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
  const geometry = () => {
    const c = game.canvas, cs = getComputedStyle(c), vv = window.visualViewport;
    let anc = 'none';
    for (let e = c.parentElement; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.transform !== 'none' || (s.zoom && s.zoom !== '1' && s.zoom !== 'normal')) anc = e.tagName + ':' + s.transform + '/' + s.zoom; }
    const dev = window.__ssdev && window.__ssdev.last;
    return { iw: innerWidth, ih: innerHeight, dpr: devicePixelRatio, DPR: D, cw: c.width, ch: c.height,
      cc: [c.clientWidth, c.clientHeight], style: [parseFloat(cs.width), parseFloat(cs.height)],
      gw: game.scale.width, gh: game.scale.height, tf: cs.transform, anc,
      vv: vv ? [Math.round(vv.width), Math.round(vv.height), vv.scale] : null,
      rend: game.renderer.type === Phaser.WEBGL ? 'gl' : 'cv', verdict: SS_REND.why,
      crisp: dev ? dev.crisp : null, heals: dev ? dev.heals : null, inset: [SS_INSET.top, SS_INSET.bottom] };
  };
  /* sharpness: mean |Laplacian| of luminance over a buffer-px rect, and the
     same for that rect shrunk to 1× and bilinearly stretched back */
  const lap = (im) => {
    const { width: w, height: h, data: d } = im; let sum = 0, n = 0;
    const L = new Float32Array(w * h);
    for (let i = 0, p = 0; i < w * h; i++, p += 4) L[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x; sum += Math.abs(4 * L[i] - L[i - 1] - L[i + 1] - L[i - w] - L[i + w]); n++;
    }
    return n ? sum / n : 0;
  };
  /* the frame AS THE SCREEN SHOWS IT (Page.captureScreenshot at device px —
     a small buffer stretched by CSS arrives stretched, exactly what a phone
     shows); rects come in buffer px and are mapped by screen/buffer. The
     reference is the region shrunk to 1 css px per px and stretched back. */
  const sharpFrom = (url, rects) => new Promise((res) => {
    const img = new Image();
    img.onload = () => { try {
      const k = img.width / game.canvas.width;            // screen px per buffer px (1 normally; 3 on the ?dpr=1 control)
      const S = Math.max(1, devicePixelRatio);            // the shrink: screen px per css px
      const out = [];
      for (const r of rects) {
        const x = Math.max(0, Math.floor(r.x * k)), y = Math.max(0, Math.floor(r.y * k));
        const w = Math.min(img.width - x, Math.ceil(r.w * k)), h = Math.min(img.height - y, Math.ceil(r.h * k));
        if (w < 8 || h < 8) { out.push({ tag: r.tag, e1: 0, e0: 0, ratio: 0, w, h }); continue; }
        const A = document.createElement('canvas'); A.width = w; A.height = h;
        const a = A.getContext('2d'); a.drawImage(img, x, y, w, h, 0, 0, w, h);
        const e1 = lap(a.getImageData(0, 0, w, h));
        const sw = Math.max(2, Math.round(w / S)), sh = Math.max(2, Math.round(h / S));
        const B = document.createElement('canvas'); B.width = sw; B.height = sh;
        const b = B.getContext('2d'); b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high'; b.drawImage(A, 0, 0, sw, sh);
        const C = document.createElement('canvas'); C.width = w; C.height = h;
        const c = C.getContext('2d'); c.imageSmoothingEnabled = true; c.drawImage(B, 0, 0, w, h);
        const e0 = lap(c.getImageData(0, 0, w, h));
        out.push({ tag: r.tag, e1: Math.round(e1 * 100) / 100, e0: Math.round(e0 * 100) / 100, ratio: e0 ? Math.round(e1 / e0 * 100) / 100 : 0, w, h });
      }
      res(JSON.stringify(out));
    } catch (e) { res(JSON.stringify([{ tag: 'ERR ' + e.message, ratio: 0, e1: 0, e0: 0 }])); } };
    img.onerror = () => res(JSON.stringify([{ tag: 'ERR image', ratio: 0, e1: 0, e0: 0 }]));
    img.src = url;
  });
  // the renderer's own buffer (for --gl, where captureScreenshot hands back a
  // stale frame): the same arithmetic with the game's DPR as the shrink
  const sharp = (rects) => new Promise((res) => game.renderer.snapshot((img) => {
    const S0 = devicePixelRatio; Object.defineProperty(window, '__S', { value: D, configurable: true });
    sharpFrom(img.src, rects).then(res);
  }));
  // the regions a surface is judged by: named Texts (by their string), text
  // blocks (by data key) and any object handed in
  const texts = (s, strs) => { const out = []; walk(s.children.list, (o) => { if (o.type === 'Text' && vis(o) && strs.some((t) => o.text === t || (t instanceof RegExp && t.test(o.text)))) out.push(o); }); return out; };
  const rectsOf = (objs) => objs.map((o) => { const b = bnd(o); const pad = 4 * D; return { tag: (o.text || (o.texture && o.texture.key) || o.type || '').slice(0, 18), x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad }; });
  /* layout: every Text and every tap target on the live scenes, the full-
     screen blockers (veils, skies) set aside by size */
  const layout = () => {
    const H = game.scale.height, W = game.scale.width, it = SS_INSET.top * D, ib = SS_INSET.bottom * D;
    const tol = 1.5 * D;
    const out = { band: [], clip: [], small: [], overlap: [], law: [], texts: 0, targets: 0 };
    const items = []; let covered = 0;
    for (const s of game.scene.getScenes(true)) {
      const cam = s.cameras.main;
      walk(s.children.list, (o) => {
        if (!vis(o) || !o.getBounds) return;
        const isText = o.type === 'Text', hit = !!(o.input && o.input.enabled);
        if (!isText && !hit) return;
        const b = bnd(o);
        if (o.scrollFactorX !== 0) { b.x -= cam.scrollX; b.y -= cam.scrollY; b.r -= cam.scrollX; b.b -= cam.scrollY; }
        if (b.w >= W * 0.9 && b.h >= H * 0.9) {                  // a veil / the sky / an end panel's blocker:
          if (o.alpha >= 0.5 && o.type !== 'Text') covered = items.length;   // everything drawn before an opaque veil is under it
          return;
        }
        const name = (isText ? o.text : (o.texture && o.texture.key) || o.type).slice(0, 22);
        items.push({ o, b, isText, hit, name, s: s.scene.key });
      });
    }
    items.splice(0, covered);                                  // under the veil: neither tappable nor read
    for (const it2 of items) {
      const { b, isText, hit, name } = it2;
      if (isText) out.texts++; if (hit) out.targets++;
      // a Text's canvas carries its shadow/glow padding; the glyph itself sits
      // well inside, so the band is judged on the ink box (padding stripped)
      const p = isText ? (it2.o.padding ? Math.max(it2.o.padding.top || 0, it2.o.padding.bottom || 0) : 0) : 0;
      const top = b.y + p, bot = b.b - p;
      if (top < it - tol || bot > H - ib + tol) out.band.push(name + '@' + Math.round(top / D) + '-' + Math.round(bot / D));
      if (bot > H + tol || b.r > W + tol || b.x < -tol) out.clip.push(name);
      if (hit) {
        // the hit area is what a finger meets: a zone/container's setSize or an
        // image's display size, in css pt
        const ha = it2.o.input.hitArea;
        const sx = Math.abs(it2.o.scaleX || 1), sy = Math.abs(it2.o.scaleY || 1);
        const hw = ha && ha.width ? ha.width * sx : b.w, hh = ha && ha.height ? ha.height * sy : b.h;
        if (Math.min(hw, hh) / D < 43.5) out.small.push(name + ' ' + Math.round(hw / D) + 'x' + Math.round(hh / D));
      }
      if (isText) {
        const t = it2.o.text || '';
        if (t.includes('\n')) out.law.push('nl:' + t.slice(0, 20));
        else if (it2.o.style.wordWrapWidth) { const w = it2.o.getWrappedText(t); if ((Array.isArray(w) ? w.length : String(w).split('\n').length) > 1) out.law.push('wrap:' + t.slice(0, 20)); }
      }
    }
    const tx = items.filter((i) => i.isText && i.o.alpha > 0.3);
    for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) {
      const a = tx[i], c = tx[j];
      if (a.o.parentContainer && a.o.parentContainer === c.o.parentContainer && a.o.parentContainer.getData && a.o.parentContainer.getData('textBlock')) continue;
      // ink boxes: the baked canvas carries shadow padding on every side
      const pa = a.o.padding ? Math.max(a.o.padding.left || 0, a.o.padding.top || 0) : 0, pc = c.o.padding ? Math.max(c.o.padding.left || 0, c.o.padding.top || 0) : 0;
      const ax = a.b.x + pa, ay = a.b.y + pa, ar = a.b.r - pa, ab = a.b.b - pa;
      const cx = c.b.x + pc, cy = c.b.y + pc, cr = c.b.r - pc, cb = c.b.b - pc;
      const iw = Math.min(ar, cr) - Math.max(ax, cx), ih = Math.min(ab, cb) - Math.max(ay, cy);
      if (iw <= 0 || ih <= 0) continue;
      const small = Math.min((ar - ax) * (ab - ay), (cr - cx) * (cb - cy));
      if (iw * ih > small * 0.12) out.overlap.push(a.name + ' × ' + c.name);
    }
    return out;
  };
  // a buffer-px world point as a css touch point
  const css = (o) => { const s = scene(), cam = s.cameras.main, b = bnd(o);
    const sx = o.scrollFactorX === 0 ? 0 : cam.scrollX, sy = o.scrollFactorY === 0 ? 0 : cam.scrollY;
    const rc = game.canvas.getBoundingClientRect();
    return { x: rc.left + (b.x + b.w / 2 - sx) / game.canvas.width * rc.width, y: rc.top + (b.y + b.h / 2 - sy) / game.canvas.height * rc.height }; };
  window.__cc = { geometry, sharp, sharpFrom, texts, rectsOf, layout, css, walk, vis, bnd };
  return 'lib';
}
const lib = async () => ev(`(${LIB.toString()})()`);
const HOME_REST = `!!window.game && game.scene.isActive('home') && !game.scene.getScene('home').introPlaying && !!game.scene.getScene('home').lanternB && !!window.__ssdev && !!window.__ssdev.last`;

/* ---- one device, four surfaces ------------------------------------------ */
const rows = [];
async function device(dv, control) {
  const tag = dv.id + (control ? '·dpr1-control' : '');
  console.log(`\n━━ ${dv.name} — ${dv.w}×${dv.h} @${dv.dpr}${dv.inset[0] || dv.inset[1] ? ' · inset ' + dv.inset.join('/') : ''}${control ? '  (CONTROL: ?dpr=1 — a deliberate blur)' : ''}`);
  await send('Emulation.setDeviceMetricsOverride', { width: dv.w, height: dv.h, deviceScaleFactor: dv.dpr, mobile: true, screenWidth: dv.w, screenHeight: dv.h, screenOrientation: { type: 'portraitPrimary', angle: 0 } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const uid = 'crisp' + Math.floor(Math.random() * 1e6);
  const q = `?rend=cv&fps=0&mpuid=${uid}&inset=${dv.inset.join(',')}${control ? '&dpr=1' : ''}`;
  await send('Page.navigate', { url: BASE + q });
  const row = { id: tag, name: dv.name, css: dv.w + 'x' + dv.h, dpr: dv.dpr, sharp: {}, taps: {}, lay: {} };
  rows.push(row);
  ok('home stands', await until(HOME_REST, 90000));
  await lib();
  await sleep(900);
  // --- geometry (the same on every surface: the canvas never changes) ---
  const g = await evj(`JSON.stringify(window.__cc.geometry())`);
  row.buf = g.cw + 'x' + g.ch; row.rend = g.rend;
  const want = [Math.round(dv.w * (control ? 1 : dv.dpr)), Math.round(dv.h * (control ? 1 : dv.dpr))];
  ok(`canvas buffer ${g.cw}x${g.ch} === css ${g.cc.join('x')} × dpr ${g.DPR}` + (control ? ' (forced 1)' : ''),
    g.cc[0] === dv.w && g.cc[1] === dv.h && g.cw === want[0] && g.ch === want[1] && g.cw === Math.round(g.cc[0] * g.DPR) && g.ch === Math.round(g.cc[1] * g.DPR),
    `inner ${g.iw}x${g.ih} devicePixelRatio ${g.dpr} style ${g.style.join('x')}`);
  ok('game.scale === the buffer', g.gw === g.cw && g.gh === g.ch, g.gw + 'x' + g.gh);
  ok('no CSS transform on the canvas or its ancestors, visualViewport scale 1', g.tf === 'none' && g.anc === 'none' && (!g.vv || g.vv[2] === 1), `tf ${g.tf} anc ${g.anc} vv ${JSON.stringify(g.vv)}`);
  ok('the sentinel agrees: crisp, zero heals' + (control ? ' (a forced dpr reads dprOff → crisp:false, no heal)' : ''), control ? (g.crisp === false && g.heals === 0) : (g.crisp === true && g.heals === 0), `crisp ${g.crisp} heals ${g.heals} · ${g.rend} ${g.verdict} · insets ${g.inset.join('/')}`);
  const floor = control ? 0 : PIN(dv.dpr);
  const judge = async (surface, rectsExpr) => {
    let res;
    if (args.gl) res = await evj(`window.__cc.sharp(${rectsExpr})`);
    else {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      res = await evj(`window.__cc.sharpFrom('data:image/png;base64,${shot.data}', ${rectsExpr})`);
    }
    const lay = await evj(`JSON.stringify(window.__cc.layout())`);
    const min = res.length ? Math.min(...res.map((r) => r.ratio)) : 0;
    row.sharp[surface] = min; row.lay[surface] = lay;
    const detail = res.map((r) => `${r.tag}:${r.ratio}`).join(' ');
    if (control) ok(`${surface} sharpness reads as a BLUR (min ratio ${min} ≤ ${CONTROL_CEIL})`, res.length >= 1 && min > 0 && min <= CONTROL_CEIL, detail);
    else ok(`${surface} sharpness: min ratio ${min} ≥ ${floor} over ${res.length} regions`, res.length >= 1 && min >= floor, detail);
    if (control) { await snap(`${tag}-${surface}`); return; }
    ok(`${surface} layout: ${lay.texts} texts + ${lay.targets} targets in the safe band, none clipped`, lay.band.length === 0 && lay.clip.length === 0, (lay.band.concat(lay.clip)).slice(0, 6).join(', '));
    ok(`${surface} tap targets ≥ 44 pt`, lay.small.length === 0, lay.small.slice(0, 6).join(', '));
    ok(`${surface} no text overlaps, one-line law`, lay.overlap.length === 0 && lay.law.length === 0, lay.overlap.concat(lay.law).slice(0, 6).join(', '));
    await snap(`${tag}-${surface}`);
  };
  // --- HOME ---
  await judge('home', `window.__cc.rectsOf(window.__cc.texts(game.scene.getScene('home'), [SS_T('quick'), SS_T('versus'), SS_T('newCamp'), SS_T('tagline')]).concat([game.scene.getScene('home').profileChip]))`);
  // --- a real touch on QUICK PLAY takes the meadow into a battle ---
  const qp = await evj(`JSON.stringify(window.__cc.css(game.scene.getScene('home').rowBtns.quick))`);
  const BOARD = `(() => { const b = game.scene.getScene('battle'); return game.scene.isActive('battle') && !!b && !!b.board && b.board.filter(Boolean).length === 16 && b.state === 'pick' })()`;
  row.taps.menu = await touchUntil(qp, BOARD, 10);
  ok('a real touch on QUICK PLAY opens the board (16 tiles, state pick)', row.taps.menu, `touch at ${Math.round(qp.x)},${Math.round(qp.y)} css`);
  if (!row.taps.menu) { await ev(`(() => { game.scene.getScene('home').scene.start('battle', { mode: 'quick', resume: null }); return 1 })()`); await until(BOARD, 60000); }
  await lib();
  await sleep(1500);   // the tiles' bounce settles
  // --- BATTLE: the board's letters and the beast's name ---
  await judge('battle', `(() => { const b = game.scene.getScene('battle'); const tiles = b.board.filter(Boolean).slice(0, 8).map(s => s.c);
    const names = window.__cc.texts(b, [/^[A-Z][A-Z ]{3,}$/]).slice(0, 2); return window.__cc.rectsOf(tiles.concat(names)) })()`);
  const tp = await evj(`JSON.stringify(window.__cc.css(game.scene.getScene('battle').board[5].c))`);
  row.taps.tile = await touchUntil(tp, `game.scene.getScene('battle').sel.length === 1 && game.scene.getScene('battle').sel[0] === 5`, 6);
  ok('a real touch on a tile selects it (sel = [5])', row.taps.tile, `touch at ${Math.round(tp.x)},${Math.round(tp.y)} css`);
  // --- CHOOSE A SIGIL: three two-line cards ---
  await ev(`(() => { const b = game.scene.getScene('battle'); if (b.sel.length) b.unselectFrom(0);
    b.rollSigilOpts = () => [SS_SIG_BY.first, SS_SIG_BY.blood, SS_SIG_BY.roots]; b.showSigilPick(); return 1 })()`);
  ok('the sigil sheet stands (3 cards)', await until(`(() => { const b = game.scene.getScene('battle'); let a = 0; b.overlayC.list.forEach(o => { if (o.getData && o.getData('sigilCard') && o.alpha >= 0.99) a++; }); return a === 3 })()`, 30000));
  await sleep(700);
  await judge('sigils', `(() => { const b = game.scene.getScene('battle'); const cards = b.overlayC.list.filter(o => o.getData && o.getData('sigilCard'));
    return window.__cc.rectsOf(window.__cc.texts(b, [SS_T('sigilHead')]).concat(cards)) })()`);
  const cp = await evj(`JSON.stringify(window.__cc.css(game.scene.getScene('battle').overlayC.list.filter(o => o.getData && o.getData('sigilCard'))[1]))`);
  row.taps.card = await touchUntil(cp, `game.scene.getScene('battle').run.sigils.includes('blood')`, 6);
  ok('a real touch on the middle card takes BLOOD INK', row.taps.card, `touch at ${Math.round(cp.x)},${Math.round(cp.y)} css`);
  // --- the DAILY SHARE CARD: a daily played to its end screen ---
  await ev(`(() => { SSNET.__sub = SSNET.submitScore; SSNET.submitScore = () => Promise.resolve();
    SSNET.setDayKey('20260812'); SS.prof.streak = { n: 13, last: 20260811, best: 13, g: 1, gp: 0, gd: [], mk: 7, pend: 0 }; SS.prof.daily = {};
    game.scene.getScene('battle').scene.start('battle', { mode: 'daily', resume: null }); return 1 })()`);
  ok('a daily stands for the share card', await until(`(() => { const b = game.scene.getScene('battle'); return game.scene.isActive('battle') && !!b && b.mode === 'daily' && !!b.board && b.board.length === 16 && b.state === 'pick' })()`, 60000));
  await lib();
  await ev(`(() => { const b = game.scene.getScene('battle'); b.state = 'anim'; b.run.words = 7; b.run.letters = 31; b.run.longest = 'moonlight'; b.run.fightIdx = 3; b.endRun(false); return 1 })()`);
  const SHARE = `window.__cc.texts(game.scene.getScene('battle'), [SS_T('shareBtn')]).length === 1`;
  ok('the share button is on the end screen', await until(SHARE, 30000));
  await sleep(2500);   // the end screen's fan-in finishes before the frame is judged
  await judge('share', `window.__cc.rectsOf(window.__cc.texts(game.scene.getScene('battle'), [SS_T('shareBtn'), /^🔥/, /^\\d/]))`);
  const sp = await evj(`JSON.stringify(window.__cc.css(window.__cc.texts(game.scene.getScene('battle'), [SS_T('shareBtn')])[0]))`);
  row.taps.share = await touchUntil(sp, `typeof window.__copied === 'string' && window.__copied.length > 0 && window.__shared === false`, 8);
  ok('a real touch on SHARE copies the card (and never calls navigator.share)', row.taps.share, `touch at ${Math.round(sp.x)},${Math.round(sp.y)} css`);
  await ev(`(() => { SSNET.submitScore = SSNET.__sub || SSNET.submitScore; return 1 })()`);
}

const only = args.only ? String(args.only).split(',') : null;
const picked = DEVICES.filter((d) => !only || only.some((o) => d.id.includes(o)));
for (const dv of picked) await device(dv, false);
// the control: the 15/16 at a forced ?dpr=1 — a 3× stretch of a 393×852
// buffer, which is what Wyatt's screenshots look like. The metric must say so.
if (!args.nocontrol) await device(picked.find((d) => d.id === '16') || picked[0], true);
ok('no page exceptions across the matrix', errs.length === 0, errs.slice(0, 3).join(' | '));

/* ---- the table ---------------------------------------------------------- */
console.log('\nSHARPNESS (min crisp/upscaled ratio per surface · floor by dpr) — taps: menu tile card share');
for (const r of rows) {
  const s = r.sharp;
  console.log(`  ${r.id.padEnd(16)} ${r.css.padEnd(9)} @${String(r.dpr).padEnd(5)} buf ${r.buf.padEnd(9)} ${r.rend}  home ${s.home}  battle ${s.battle}  sigils ${s.sigils}  share ${s.share}` +
    `  · taps ${['menu', 'tile', 'card', 'share'].map((k) => r.taps[k] ? '✓' : '✗').join('')}`);
}
const line = rows.filter((r) => !/control/.test(r.id)).map((r) => `${r.id} ${Math.min(...Object.values(r.sharp))}`).join(', ');
console.log(`one line: min ratio per device — ${line}; control ${rows.find((r) => /control/.test(r.id))?.sharp.home}`);
console.log('\n' + pass + '/' + (pass + fail) + ' passed');
bye();
process.exit(fail ? 1 : 0);
