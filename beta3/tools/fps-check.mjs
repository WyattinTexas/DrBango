// v0.43.1 verification: the honest share copy (WKWebView's rejecting
// clipboard falls through to execCommand; COPIED only when a path REALLY
// copied; COPY FAILED otherwise) + the banner policy (unhandled rejections
// never paint for players — beta3.diaglog ring + ?diag=1 replay; the probe's
// GL-less throw gated; real errors stay loud), plus
// v0.43.0 verification: the sigil drip's three laws (the pool never starves ·
// nobody who already plays loses a sigil · no sigil is ever listed asleep and
// awake at once — the whole mechanic, both halves, is walked by
// tools/drip-check.mjs) + the daily share card + the streak lantern (part 2 —
// the grace night and the
// marks) + part 1's streak core + fps overlay (OPT-IN via ?fps=1), full-DPR law, WORKLOAD probe + renderer
// verdict (~300-sprite/tilesprite/text/emitter run on BOTH real renderers at
// boot — the fill-rate probe is dead; perf-lab run fxios-…/1786853475034 proved
// object-count collapse that fill rate can't see), canvas tint shim, counter
// throttles, grain diet (static baked image, no TileSprite), canvas-parity
// snapshots for home + battle, and the ?lab=1 on-device perf bisection lab.
// Drives a real headless Chrome over CDP (port 9333). Run from beta3/:
//   node tools/fps-check.mjs
const BASE = 'http://localhost:8899/index.html';
let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (extra ? '  [' + extra + ']' : ''));
  cond ? pass++ : fail++;
};

async function cdp() {
  const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map(); const errs = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const t = d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text;
      // the banner drill REJECTS on purpose (that is the test); not a page error
      if (!/banner drill/.test(t || '')) errs.push(t);
    }
  };
  await new Promise(r => ws.onopen = r);
  const send = (method, params) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
    return r?.result?.value;
  };
  const nav = async (url, waitMs) => { await send('Page.navigate', { url }); await new Promise(r => setTimeout(r, waitMs)); };
  return { send, ev, nav, errs };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// a verdict that came from an actual probe run, however each renderer ended
const PROBED = (w) => ['workload', 'gl-unmeasurable', 'cv-unmeasurable'].includes(w);
const PROBED_JS = `((w) => ['workload','gl-unmeasurable','cv-unmeasurable'].includes(w))`;

async function main() {
  const c = await cdp();

  // ---- boot: overlay opt-in, live, reporting the real buffer ----
  // (a fresh profile runs the workload probe before boot — allow for it)
  await c.nav(BASE + '?diag=1&fps=1', 15000);
  let st = await c.ev(`(()=>{
    const el = [...document.querySelectorAll('div')].find(d => /FPS ·/.test(d.textContent||''));
    const g = window.game;
    return JSON.stringify({
      overlay: !!el, text: el ? el.textContent : null,
      w: g && g.scale.width, h: g && g.scale.height,
      dprInText: el ? /dpr([\\d.]+)/.exec(el.textContent)?.[1] : null,
      renderer: g ? (g.renderer.type === Phaser.WEBGL ? 'GL' : 'CV') : null,
    });
  })()`);
  st = JSON.parse(st);
  ok('?fps=1 shows the overlay', st.overlay, st.text);
  ok('overlay names renderer', st.text && (st.text.includes('GL') || st.text.includes('CV')), st.renderer);
  ok('overlay carries buffer size', st.text && st.text.includes(st.w + '×' + st.h));
  const t1 = await c.ev(`[...document.querySelectorAll('div')].find(d=>/FPS ·/.test(d.textContent)).textContent`);
  await sleep(1200);
  const t2 = await c.ev(`[...document.querySelectorAll('div')].find(d=>/FPS ·/.test(d.textContent)).textContent`);
  ok('overlay is live (reports a numeric fps)', /^\d+ FPS/.test(t2), t2);

  // ---- v0.36.1: the overlay is OPT-IN — a plain boot shows players nothing ----
  // (it was default-ON through the perf saga and sat on the QUICK PLAY header)
  const noFlag = `![...document.querySelectorAll('div')].some(d => /FPS ·/.test(d.textContent||''))`;
  // hygiene: a `beta3.fps` left by the retired five-tap gesture would trip the
  // next line — the game purges it on boot now, but clear it here too
  await c.ev(`(() => { try { localStorage.removeItem('beta3.fps') } catch (e) {}; 'cleared' })()`);
  await c.nav(BASE, 9000);
  ok('DEFAULT boot has no overlay (players get a clean screen)', await c.ev(noFlag) === true);
  await c.nav(BASE + '?fps=0', 8000);
  ok('?fps=0 still hides it (old habit keeps working)', await c.ev(noFlag) === true);
  ok('perf machinery runs even with the readout off (measurement is not gated)',
    await c.ev(`!!window.game && game.loop.actualFps > 0`) === true);

  // ---- v0.32.1 law: the ladder is dead — stored caps purge, full-DPR always ----
  await c.ev(`localStorage.setItem('beta3.dprCap','1.5');localStorage.setItem('beta3.dprCapTs',String(Date.now()));'set'`);
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await c.nav(BASE + '?diag=1', 8000);
  let lad = JSON.parse(await c.ev(`JSON.stringify({w: game.scale.width, iw: innerWidth, dpr: window.devicePixelRatio,
    cap: localStorage.getItem('beta3.dprCap')})`));
  ok('touch boot ignores + purges a stored v0.32.0 cap (full-DPR law)',
    lad.w === Math.round(lad.iw * Math.min(lad.dpr, 3)) && lad.cap === null,
    'w=' + lad.w + ' cap=' + lad.cap);
  // ?dpr=1 still pins (manual probe)
  await c.nav(BASE + '?diag=1&dpr=1', 8000);
  lad = JSON.parse(await c.ev(`JSON.stringify({w: game.scale.width, iw: innerWidth})`));
  ok('?dpr=1 pins buffer to 1x', lad.w === Math.round(lad.iw * 1), 'w=' + lad.w);
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: false });

  // ---- v0.35.0: workload probe + renderer verdict ----
  // force a fresh probe run: both renderers measured, verdict cached, budget held
  await c.ev(`localStorage.removeItem('beta3.raster');'cleared'`);
  await c.nav(BASE + '?glprobe=1&fps=0', 16000);
  const ras = JSON.parse(await c.ev(`JSON.stringify(window.__ssraster)`));
  // ⚠ do NOT assert both renderers measured. On a software-GL box (and on the
  // afflicted iPhone) the GL probe legitimately fails to sample — that IS the
  // signal, and demanding two numbers is what made v0.35.0 blind to it. Assert
  // instead that the probe ran, both sides reported HOW they ended, and at
  // least one produced a usable number.
  ok('workload probe ran and both renderers reported an outcome',
    ras && PROBED(ras.why) && ras.p && ras.p.glHow && ras.p.cvHow &&
    (ras.p.glMs > 0 || ras.p.cvMs > 0),
    JSON.stringify(ras && ras.p && { glMs: ras.p.glMs, glHow: ras.p.glHow, cvMs: ras.p.cvMs, cvHow: ras.p.cvHow, mode: ras.mode }));
  // Budget is generous on purpose: a renderer that blocks the main thread hard
  // enough can outrun its own setTimeout failsafe (a timer cannot preempt
  // synchronous driver work), and SwiftShader here does exactly that — 10s runs
  // observed under load. The caps bound the common case, not the pathological one.
  ok('probe boot cost bounded (caps hold even on software GL)',
    await c.ev(`window.__ssprobeMs > 0 && window.__ssprobeMs < 12000`) === true,
    (await c.ev(`window.__ssprobeMs`)) + 'ms');
  const cache = JSON.parse(await c.ev(`localStorage.getItem('beta3.raster')`) || 'null');
  ok('verdict cached as a v4 probe record', cache && cache.v === 4 && PROBED(cache.why)
    && typeof cache.mode === 'string', JSON.stringify(cache && { v: cache.v, mode: cache.mode, why: cache.why }));
  // every probe names its outcome, and a measured one carries >=3 frames — the
  // pairing that lets one screenshot say WHICH way a renderer failed
  const HOWS = ['ok', 'nosample', 'nocreate', 'noboot', 'throw'];
  ok('probe records frame count + how per renderer (a failure names itself)',
    cache && HOWS.includes(cache.glHow) && HOWS.includes(cache.cvHow) &&
    (cache.glHow === 'ok' ? cache.glN >= 3 && cache.glMs > 0 : cache.glMs === -1) &&
    (cache.cvHow === 'ok' ? cache.cvN >= 3 && cache.cvMs > 0 : cache.cvMs === -1),
    JSON.stringify(cache && { glN: cache.glN, glHow: cache.glHow, cvN: cache.cvN, cvHow: cache.cvHow }));
  // ⚠ v0.35.0's bug, now a standing law: an UNMEASURABLE GL probe must fall to
  // Canvas, never to AUTO (which hands the game back to the failing renderer).
  // Wyatt's phone read `gl — · cv 17 ms/f · GL (workload)` at 8fps because of it.
  const vd = (gl, cv) => c.ev(`(() => { const o = ssVerdictFrom(${gl}, ${cv}); return o.mode + '/' + o.why })()`);
  ok('gl unmeasurable + cv measured → CV (the 8fps regression)',
    await vd(`{ms:-1,n:0,how:'nosample'}`, `{ms:17,n:12,how:'ok'}`) === 'cv/gl-unmeasurable');
  ok('cv unmeasurable + gl measured → GL',
    await vd(`{ms:9,n:20,how:'ok'}`, `{ms:-1,n:1,how:'noboot'}`) === 'gl/cv-unmeasurable');
  ok('both unmeasurable → AUTO (Phaser picks its own fallback)',
    await vd(`{ms:-1,n:0,how:'noboot'}`, `{ms:-1,n:0,how:'noboot'}`) === 'auto/workload');
  ok('both measured keeps the >10% status-quo rule (no flip-flop)',
    await vd(`{ms:10,n:20,how:'ok'}`, `{ms:9.5,n:20,how:'ok'}`) === 'auto/workload' &&
    await vd(`{ms:10,n:20,how:'ok'}`, `{ms:8,n:20,how:'ok'}`) === 'cv/workload');
  // cached verdict is USED on the next boot (no re-probe)
  await c.nav(BASE + '?fps=0', 10000);
  ok('next boot rides the cached verdict (no re-probe)',
    await c.ev(`window.__ssprobeMs === undefined && ${PROBED_JS}(window.__ssraster.why)`) === true);
  // a stale v3 record (the bad-verdict generation) must be discarded, not ridden
  await c.ev(`(() => { const r = JSON.parse(localStorage.getItem('beta3.raster'));
    r.v = 3; r.mode = 'auto'; localStorage.setItem('beta3.raster', JSON.stringify(r)); return 'aged' })()`);
  await c.nav(BASE + '?fps=0', 16000);
  ok('stale v3 cache is discarded and re-probed (phones in the wild get the fix)',
    await c.ev(`window.__ssprobeMs > 0 && JSON.parse(localStorage.getItem('beta3.raster')).v === 4`) === true);

  // ---- v0.37.1: THE PROBE MUST NOT DRESS THE GAME (the TestFlight blackout) ----
  // Phaser POOLS game canvases: destroy(true) frees the element and the next
  // Phaser.Game is handed the SAME node back, inline style and all. The probe
  // wears `opacity:0.05; pointer-events:none` while it measures, so v0.37.0's
  // first TestFlight build came up at 5% brightness AND untappable on any phone
  // whose verdict was `cv` (a forced/cached verdict skips the probe, which is
  // why every browser run looked perfect). Wyatt's screenshot solved to a
  // best-fit canvas alpha of 0.049 over #0a0d1c, <1/255 error.
  // Assert the shipped sequence itself: probe a renderer, then boot on it.
  const recycled = JSON.parse(await c.ev(`new Promise((res) => {
    ssProbeRun(Phaser.CANVAS).then(() => setTimeout(() => {
      const g2 = new Phaser.Game({ type: Phaser.CANVAS, width: 64, height: 64, banner: false, scene: { create(){} } });
      setTimeout(() => {
        const o = { opacity: getComputedStyle(g2.canvas).opacity, pe: getComputedStyle(g2.canvas).pointerEvents };
        try { g2.destroy(true) } catch (e) { }
        res(JSON.stringify(o));
      }, 400);
    }, 400));
  })`));
  ok('a game booted after a probe inherits NO probe styling (opaque + tappable)',
    recycled.opacity === '1' && recycled.pe !== 'none', JSON.stringify(recycled));
  // and the belt: fitCanvas owns the real canvas CSS, so even a canvas that
  // arrives dirty is healed on the next 'ready'/viewport settle
  const healed = JSON.parse(await c.ev(`(() => {
    game.canvas.style.cssText += ';position:fixed;opacity:0.05;pointer-events:none;';
    const dirty = getComputedStyle(game.canvas).opacity;
    fitCanvas();
    return JSON.stringify({ dirty, opacity: getComputedStyle(game.canvas).opacity,
      pe: getComputedStyle(game.canvas).pointerEvents, pos: getComputedStyle(game.canvas).position });
  })()`));
  ok('fitCanvas heals a dirty canvas (opacity, pointer-events, position)',
    healed.dirty === '0.05' && healed.opacity === '1' && healed.pe === 'auto' && healed.pos === 'static',
    JSON.stringify(healed));
  // ?rend=cv forces the canvas renderer and the tint shim bakes tinted copies
  await c.nav(BASE + '?rend=cv', 9000);
  const cvb = JSON.parse(await c.ev(`JSON.stringify({
    cv: game.renderer.type === Phaser.CANVAS,
    why: window.__ssraster.why, probed: window.__ssprobeMs !== undefined,
    shim: !!Phaser.GameObjects.Image.prototype.__ssTintShim,
    baked: Object.keys(game.textures.list).filter(k => /^(dot|glowbig)#[0-9a-f]+$/.test(k)).length })`));
  ok('?rend=cv forces CANVAS, skips the probe, wins over the cache', cvb.cv && cvb.why === 'forced' && !cvb.probed);
  ok('canvas tint shim installed and baking (stars/aurora keep their colors)', cvb.shim && cvb.baked >= 3,
    cvb.baked + ' baked tints');
  // ?rend=gl forces WebGL
  await c.nav(BASE + '?rend=gl', 9000);
  ok('?rend=gl forces the WEBGL renderer over the cache',
    await c.ev(`game.renderer.type === Phaser.WEBGL && window.__ssraster.why === 'forced'`) === true);
  // grain diet: the film grain is a single baked half-res Image, not a TileSprite
  const gr = JSON.parse(await c.ev(`(()=>{ const h = game.scene.getScene('home');
    const g = h && h.sky && h.sky.grain;
    return JSON.stringify({ type: g && g.type, key: g && g.texture.key,
      halfres: game.textures.exists('grainbake') &&
        Math.abs(game.textures.get('grainbake').getSourceImage().width - game.scale.width / 2) <= 1 }); })()`));
  ok('film grain is a baked static Image at half res (TileSprite diet)',
    gr.type === 'Image' && gr.key === 'grainbake' && gr.halfres, JSON.stringify(gr));
  // a 24x48 grid of averaged colors from a real renderer snapshot — coarse
  // enough to forgive twinkle phase, sharp enough to catch a scene that lost
  // its buttons/tiles (canvas-parity law)
  const gridSnap = () => c.ev(`(async () => {
    const img = await new Promise(res => game.renderer.snapshot(res));
    const cv = document.createElement('canvas'); cv.width = 24; cv.height = 48;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, 24, 48);
    return Array.from(cx.getImageData(0, 0, 24, 48).data);
  })()`);
  const gridDiff = (a, b, fromRow) => {
    let sum = 0, n = 0;
    for (let r = fromRow; r < 48; r++) for (let x = 0; x < 24; x++) {
      const i = (r * 24 + x) * 4;
      sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      n += 3;
    }
    return +(sum / n).toFixed(2);
  };
  // home parity: meadow under GL vs CV (lower 2/3 — the showcase beast up top
  // is random per boot; buttons/title/meadow below are deterministic). The
  // intro is bypassed (software-GL runs it at 6fps and never settles in time).
  const homeGrid = async (rend) => {
    await c.ev(`sessionStorage.setItem('beta3.skipIntro','1');'armed'`);
    await c.nav(BASE + '?rend=' + rend + '&fps=0', 12000);
    await c.ev(`(async()=>{ for (let i=0;i<24;i++){ if (window.game && game.scene.isActive('home') && game.scene.getScene('home').titleT) return; await new Promise(r=>setTimeout(r,500)); } })()`);
    await sleep(2000);
    return gridSnap();
  };
  const hGL = await homeGrid('gl'), hCV = await homeGrid('cv');
  const hd = gridDiff(hGL, hCV, 16);
  ok('canvas-parity: home meadow matches WebGL (grid diff < 10)', hd < 10, hd + ' avg channel diff');
  // battle parity + seed law: same-day daily board on both renderers
  const dailyBoard = async (rend) => {
    await c.nav(BASE + '?rend=' + rend + '&daily=1&mpuid=fpscheck', 12000);
    const letters = await c.ev(`(async () => {
      for (let i = 0; i < 40; i++) {
        const b = game.scene.getScene('battle');
        if (game.scene.isActive('battle') && b && b.board && b.board.length === 16 && b.board.every(s => s && s.ch))
          return b.board.map(s => s.ch).join('');
        await new Promise(r => setTimeout(r, 1000));
      }
      return 'TIMEOUT';
    })()`);
    await sleep(2500);
    return { letters, grid: await gridSnap() };
  };
  const dGL = await dailyBoard('gl'), dCV = await dailyBoard('cv');
  ok('daily board letters identical across renderers (seed untouched)',
    dGL.letters === dCV.letters && dGL.letters !== 'TIMEOUT', dGL.letters + ' vs ' + dCV.letters);
  // measured 8.1 healthy (random bg stars + software-GL gradient dither);
  // a canvas scene that lost its tiles/buttons reads 30+.
  // ⚠ BEST OF TWO on purpose (v0.39.0): the background stars are re-rolled per
  // boot and the beast idles are mid-animation, so this number is noisy — on
  // Chrome 150 + swiftshader a GL-vs-GL comparison of the SAME build measured
  // 8.76, while GL-vs-CV over three identical rounds read 8.07 / 8.10 / 18.39.
  // One sample was tripping the threshold at random. The law it guards is "a
  // renderer that lost its tiles reads 30+", and best-of-two keeps that intact.
  let bd = gridDiff(dGL.grid, dCV.grid, 16);
  if (bd >= 14) {
    const rGL = await dailyBoard('gl'), rCV = await dailyBoard('cv');
    const bd2 = gridDiff(rGL.grid, rCV.grid, 16);
    console.log('    (parity re-roll: ' + bd + ' → ' + bd2 + ')');
    bd = Math.min(bd, bd2);
  }
  ok('canvas-parity: battle board matches WebGL (grid diff < 14, best of two)', bd < 14, bd + ' avg channel diff');

  // ---- counters: drain lands exact, throttle really skips repaints ----
  await c.nav(BASE + '?diag=1', 9000);
  const battle = await c.ev(`(async ()=>{
    const g = window.game;
    const home = g.scene.getScene('home');
    // demo boot lands on home; ride straight into a quick battle
    home.scene.start('battle', { mode: 'quick' });
    await new Promise(r => setTimeout(r, 5000));
    const b = g.scene.getScene('battle');
    if (!b || !b.beast) return JSON.stringify({ err: 'no battle' });
    // count real texture repaints during a forced 300ms drain
    let paints = 0;
    const orig = b.ehpT.setText.bind(b.ehpT);
    b.ehpT.setText = (s) => { paints++; return orig(s); };
    b.tweens.killTweensOf(b.ehpShown);
    b.ehpShown.v = b.beast.hp; b.drawEhp();
    b.beast.hpNow = 1;
    await new Promise(done => b.tweens.add({
      targets: b.ehpShown, v: b.beast.hpNow, duration: 300, ease: 'Cubic.easeOut',
      onUpdate: () => b.drawEhp(), onComplete: () => { b.drawEhp(); done(); },
    }));
    b.ehpT.setText = orig;
    return JSON.stringify({ paints, final: b.ehpT.text, want: Math.max(0, b.beast.hpNow) + ' / ' + b.beast.hp });
  })()`);
  const bt = JSON.parse(battle);
  ok('battle reachable for counter test', !bt.err, bt.err);
  if (!bt.err) {
    ok('hp numeral lands exactly on the drain endpoint', bt.final === bt.want, bt.final + ' vs ' + bt.want);
    ok('hp repaints throttled (~20Hz: 2-9 paints for 300ms, was ~18)', bt.paints >= 2 && bt.paints <= 9, bt.paints + ' paints');
  }

  // ---- score counter exactness: the count-up ends truth-synced (updateBars
  // rewrites scoreT with runScore() the moment the last pending anim lands —
  // that final overwrite IS the "always land exact" law) ----
  const sc = await c.ev(`(async ()=>{
    const b = window.game.scene.getScene('battle');
    if (!b || !b.scoreT) return JSON.stringify({ err: 'no battle' });
    b.scoreAnim = (b.scoreAnim || 0) + 1;
    b.flyScore({ x: 100, y: 300 }, 37, 0, 137);
    await new Promise(r => setTimeout(r, 3000));
    return JSON.stringify({ text: b.scoreT.text, truth: String(b.runScore()), pending: b.scoreAnim });
  })()`);
  const scr = JSON.parse(sc);
  ok('score counter truth-syncs exactly after the count', !scr.err && scr.pending === 0 && scr.text === scr.truth,
    JSON.stringify(scr));

  // ---- ascent perf probe still records (PERF untouched) ----
  const perf = await c.ev(`(window.__ssperf||[]).length`);
  ok('PERF probe machinery intact', typeof perf === 'number');

  // ---- v0.34.0: the perf lab ----
  ok('normal boot carries no lab UI', await c.ev(`!document.getElementById('sslab')`) === true);
  // ?lab=1 opens the lab door and does NOT boot the game
  await c.nav(BASE + '?lab=1&labfast=1&mpuid=lab', 6000);
  const lab0 = JSON.parse(await c.ev(`JSON.stringify({ui: !!document.getElementById('sslab'),
    btn: !!document.getElementById('sslab-go'), game: !!window.game,
    canvases: document.querySelectorAll('canvas').length})`));
  ok('?lab=1 shows the lab door, no game booted', lab0.ui && lab0.btn && !lab0.game && lab0.canvases === 0,
    JSON.stringify(lab0));
  // a REAL synthesized tap on TAP TO BEGIN (screenshots never click)
  const br = JSON.parse(await c.ev(`JSON.stringify(document.getElementById('sslab-go').getBoundingClientRect())`));
  const bx = br.x + br.width / 2, by = br.y + br.height / 2;
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bx, y: by });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bx, y: by, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bx, y: by, button: 'left', clickCount: 1 });
  let labDone = false;
  for (let i = 0; i < 90 && !labDone; i++) { await sleep(2000); labDone = await c.ev(`!!window.__sslabDone`) === true; }
  ok('lab runs to completion (labfast)', labDone);
  const lb = JSON.parse(await c.ev(`JSON.stringify(window.__sslab)`) || 'null');
  ok('lab ran all 20 stages', lb && lb.stages && lb.stages.length === 20 && lb.total === 20,
    lb && lb.stages && lb.stages.length + ' stages');
  ok('every stage carries a measurement or an explicit error',
    lb && lb.stages.every(s => s.err || (typeof s.fps === 'number' && s.frames > 0)),
    lb && JSON.stringify(lb.stages.filter(s => !s.err && !(s.frames > 0)).map(s => s.id)));
  ok('once-per-run probes present (maxTex + granted ctx attrs, or explicit no-gl)',
    lb && ((lb.maxTex > 0 && !!lb.ctx) || /no-gl/.test(lb.ctxStr || '')), lb && ('maxTex=' + lb.maxTex + ' ctx=' + lb.ctxStr));
  ok('texture scan ran on the full home scene', lb && lb.tex && Array.isArray(lb.tex.top) && lb.tex.top.length > 0,
    lb && lb.tex && JSON.stringify(lb.tex.top[0]));
  ok('no baked texture exceeds the device ceiling (defensive clamp holds)',
    lb && lb.tex && lb.tex.over.length === 0, lb && lb.tex && JSON.stringify(lb.tex.over));
  ok('winner recorded for the content stages', lb && typeof lb.winner === 'string' && lb.winner.length > 0,
    lb && lb.winner);
  ok('results table painted on screen', await c.ev(`document.querySelectorAll('#sslab table tr').length`) === 20);
  // the report landed in RTDB under perflab/<deviceId>/<runKey>
  const rtUrl = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/perflab/' + lb.id + '/' + lb.runKey + '.json';
  let rt = null;
  try { rt = await (await fetch(rtUrl)).json(); } catch (e) { }
  ok('lab report landed in RTDB (' + lb.id + ')', rt && rt.done === true && rt.stages && rt.stages.length === 20);
  // sweep the test row
  try {
    await fetch('https://testroom-75200-default-rtdb.firebaseio.com/starspell/perflab/' + lb.id + '.json', { method: 'DELETE' });
  } catch (e) { }
  // and a normal boot afterwards is untouched
  await c.nav(BASE + '?fps=0', 9000);
  ok('normal boot unaffected after lab (game boots, no lab UI)',
    await c.ev(`!!window.game && !document.getElementById('sslab')`) === true);

  // ---- v0.37.2: the five-tap gesture is GONE (it was temporary, and it left) ----
  // It confirmed the TestFlight build on 8/19 (60fps/17ms, full dpr3 buffer, CV
  // verdict) and Wyatt asked for it removed once the shell was clear. Assert the
  // removal is total: no gesture target, no persistence, and the stale sticky
  // key is purged on boot — a phone that toggled the readout on during the
  // check must not wear it forever now that no gesture can turn it off.
  ok('the version footer is INERT (the five-tap gesture is gone)',
    await c.ev(`(() => { const h = game.scene.getScene('home');
      const t = h.children.list.find(o => o.text && /Corkscrew Games/.test(o.text));
      return !!t && !(t.input && t.input.enabled) })()`) === true);
  ok('ssArmFpsTap no longer exists',
    await c.ev(`typeof ssArmFpsTap === 'undefined'`) === true);
  ok('ssFpsShow never persists',
    await c.ev(`(() => { try { localStorage.removeItem('beta3.fps') } catch (e) {}
      ssFpsShow(true, true); const after = localStorage.getItem('beta3.fps');
      ssFpsShow(false); return after === null } )()`) === true);
  await c.ev(`localStorage.setItem('beta3.fps', '1'); 'planted'`);
  await c.nav(BASE, 9000);
  ok('a stale sticky beta3.fps is purged on boot and shows NO overlay',
    await c.ev(`localStorage.getItem('beta3.fps') === null &&
      ![...document.querySelectorAll('div')].some(d => /FPS ·/.test(d.textContent||''))`) === true);

  // ---- v0.38.0: blank-text healing + the end screen's readable sigils ----
  // TestFlight 8/19: a rare card reached Wyatt's phone with its effect text
  // BLANK (one Text object, everything around it fine) — unreproducible in
  // Chrome AND real WebKit. Texts bake into a private canvas once and blit it
  // forever, so one failed/purged bake is permanent. The healer re-bakes any
  // visible non-empty Text whose canvas holds no ink.
  ok('healer reports zero blanks on a healthy scene (no false positives)',
    await c.ev(`ssHealBlankTexts(game.scene.getScenes(true)[0], 'suite') === 0`) === true);
  await c.ev(`(() => { game.scene.getScenes(true).find(s=>s.scene.key==='home')
    .scene.start('battle', { mode: 'quick', resume: null }); return 1 })()`);
  await sleep(6000);
  const heal = JSON.parse(await c.ev(`(() => {
    const b = game.scene.getScenes(true).find(s => s.scene.key === 'battle');
    b.rollSigilOpts = () => [SS_SIGILS.find(s=>(s.rarity|0)===0), SS_SIGILS.find(s=>s.id==='ward'), SS_SIGILS.find(s=>(s.rarity|0)===2)];
    b.showSigilPick();
    let target = null;
    const walk = (ls) => ls.forEach(o => { if (o.type==='Text' && /deal 3 less/.test(o.text||'')) target = o; if (o.list) walk(o.list); });
    walk(b.children.list);
    if (!target) return '{"found":false}';
    (target.context || target.canvas.getContext('2d')).clearRect(0, 0, target.canvas.width, target.canvas.height);
    const healed = ssHealBlankTexts(b, 'suite-forced');
    const d = (target.context || target.canvas.getContext('2d')).getImageData(0, 0, target.canvas.width, Math.min(256, target.canvas.height)).data;
    let ink = false; for (let i = 3; i < d.length; i += 32) if (d[i] > 8) { ink = true; break; }
    return JSON.stringify({ found: true, healed, ink });
  })()`));
  ok('a force-blanked sigil desc is detected and re-baked (the TestFlight blank)',
    heal.found && heal.healed === 1 && heal.ink, JSON.stringify(heal));
  // the end screen: the sigils-held row is a doorway to the full inspector
  await c.ev(`(() => { const b = game.scene.getScenes(true).find(s => s.scene.key === 'battle');
    b.state = 'anim'; b.run.sigils = ['quill','ward','tome'];
    b.run.words = 9; b.run.letters = 40; b.run.longest = 'manage'; b.run.fightIdx = 5;
    b.endRun(true); return 1 })()`);
  await sleep(4500);
  const insp = JSON.parse(await c.ev(`(() => {
    const b = game.scene.getScenes(true).find(s => s.scene.key === 'battle');
    let z = null; const walk = (ls) => ls.forEach(o => { if (o.type==='Zone' && o.input && o.input.enabled) z = o; if (o.list) walk(o.list); });
    walk(b.overlayC.list);
    if (!z) return '{"zone":false}';
    z.emit('pointerdown');
    if (!b.endInspectP) return '{"zone":true,"open":false}';
    const texts = []; const w2 = (ls) => ls.forEach(o => { if (o.type==='Text') texts.push(o.text||''); if (o.list) w2(o.list); });
    w2(b.endInspectP.c.list);
    const hasDescs = texts.some(t => /deal 3 less/.test(t)) && texts.some(t => /\\+4 damage/.test(t));
    const depth = b.endInspectP.c.depth;
    b.endInspectP.close();
    return JSON.stringify({ zone: true, open: true, depth, hasDescs });
  })()`));
  ok('end-screen sigils row opens the inspector ABOVE the window, descs readable',
    insp.zone && insp.open && insp.depth > 100 && insp.hasDescs, JSON.stringify(insp));
  await c.nav(BASE + '?fps=0', 9000);   // leave a clean home for the sections below


  // ---- v0.39.0: THE STREAK LANTERN (part 1 — the streak itself) ----
  // Consecutive days on which the daily hunt was RUN, counted on the game's
  // one day clock (SSNET.dayKey, UTC). Stored as {n, last, best} rather than a
  // bare number: `last` is what makes a live streak distinguishable from a
  // cold one, and what will let a grace night forgive a gap with no migration.
  // ⚠ `?daykey=`/SSNET.setDayKey() is the dev time-travel seam — without it
  // none of this is testable, since a test cannot wait a day. ⚠ every wait
  // here POLLS: on a software renderer this suite runs at ~12fps, which
  // stretches the meadow's 1s scene timer ~5x, and a fixed sleep reads as a
  // bug that isn't there.
  const until = async (expr, capMs = 40000) => {
    for (let i = 0; i < capMs / 500; i++) {
      try { if (await c.ev(expr) === true) return true; } catch (e) { }
      await sleep(500);
    }
    return false;
  };
  const HOME_REST = `!!window.game && game.scene.isActive('home')
    && !game.scene.getScene('home').introPlaying && !!game.scene.getScene('home').lanternB`;

  const rules = JSON.parse(await c.ev(`(() => {
    const keep = JSON.stringify(SS.prof.streak);
    const out = {};
    out.gapMonth = ssDayGap(20260831, 20260901);   // day keys are dates, not numbers
    out.gapYear = ssDayGap(20251231, 20260101);
    SSNET.setDayKey('20260601'); SS.prof.streak = { n: 0, last: 0, best: 0 };
    out.first = ssStreakNote().ev;                 // the very first daily ever
    out.twice = ssStreakNote().ev + ':' + SS.prof.streak.n;   // twice a night is one night
    SSNET.setDayKey('20260602'); out.alive = ssStreakCount();  // yesterday's flame still burns
    out.second = ssStreakNote().n;
    // ⚠ v0.40.0: the CORE law is "a missed night is out", and it only shows
    // with no safety net in hand — a lit streak now starts holding a grace,
    // and that grace would bridge exactly this gap. The bridging is the
    // v0.40.0 section's business; this line is still part 1's.
    SS.prof.streak.g = 0;
    SSNET.setDayKey('20260604'); out.cold = ssStreakCount();   // a missed night is out…
    out.relit = ssStreakNote().n;                              // …and starts over at 1
    out.best = SS.prof.streak.best;                            // but the longest is kept
    SSNET.setDayKey(''); SS.prof.streak = JSON.parse(keep);
    return JSON.stringify(out);
  })()`));
  ok('day gaps are calendar arithmetic (month + year boundaries)',
    rules.gapMonth === 1 && rules.gapYear === 1, rules.gapMonth + '/' + rules.gapYear);
  ok('first daily lights it, twice-a-night counts once, the next night extends',
    rules.first === 'lit' && rules.twice === 'same:1' && rules.alive === 1 && rules.second === 2,
    JSON.stringify(rules));
  ok('a missed night puts it out and starts over at 1, keeping the best',
    rules.cold === 0 && rules.relit === 1 && rules.best === 2, JSON.stringify(rules));

  // the lantern on the meadow: cold with no streak, lit from night 1 (v0.45.0),
  // numbered from night 2
  ok('the meadow settles with a lantern beside the daily chip', await until(HOME_REST));
  const lamp = (n) => c.ev(`(() => { const h = game.scene.getScene('home');
    SS.prof.streak = { n: ${n}, last: SSNET.dayKey(), best: ${n} }; h.updateLantern();
    return JSON.stringify({ tex: h.lanternB.texture.key, count: h.lanternT.text,
      glow: h.lanternGlow.baseAlpha, lamp: h.lanternB.alpha,
      fits: h.lanternT.width <= ssLayout(h).u(12.5) + 0.5,
      beside: h.lanternB.getBounds().centerX > h.dailyChipB.getBounds().right }) })()`)
    .then(JSON.parse);
  // ⚠ the sample is 5, not 9: from v0.40.0 the seventh night re-dresses the
  // lamp, so a plain 'lantern-lit' assertion has to stay under the first mark
  const l0 = await lamp(0), l1 = await lamp(1), l5 = await lamp(5), l365 = await lamp(365);
  ok('no streak leaves the lantern COLD and unnumbered; the first night LIGHTS it, still unnumbered',
    l0.tex === 'lantern-cold' && l0.count === '' && l0.glow === 0 && l1.tex === 'lantern-lit' && l1.count === '' && l1.glow > 0,
    l0.tex + '/' + l1.tex + ' count=' + JSON.stringify(l1.count));
  ok('from the second night it is LIT and carries the count',
    l5.tex === 'lantern-lit' && l5.count === '5' && l5.glow > 0 && l5.lamp === 1, JSON.stringify(l5));
  ok('the halo never outshines the daily chip ember (0.13)', l5.glow <= 0.13, String(l5.glow));
  ok('a three-digit flame shrinks to fit the pane', l365.count === '365' && l365.fits, JSON.stringify(l365));
  ok('the lantern stands beside the herald, not on top of it', l5.beside);

  // midnight turning UNDER a standing player: the herald tick carries both
  await c.ev(`(() => { const h = game.scene.getScene('home');
    SS.prof.streak = { n: 5, last: 20260610, best: 5 };
    SS.prof.daily = { 20260610: 400 }; SSNET.setDayKey('20260610'); h.updateDailyChip();
    return 'set' })()`);
  const was = await c.ev(`game.scene.getScene('home').dailyChipT.text.slice(0,1)`);
  await c.ev(`SSNET.setDayKey('20260611')`);                    // one night on: still alive
  const relit = await until(`game.scene.getScene('home').dailyChipT.text.slice(0,1) === '☀'`);
  const mid = await c.ev(`game.scene.getScene('home').lanternB.texture.key`);
  await c.ev(`SSNET.setDayKey('20260612')`);                    // a night MISSED: out
  const wentOut = await until(`game.scene.getScene('home').lanternB.texture.key === 'lantern-cold'`);
  const out = JSON.parse(await c.ev(`(() => { const h = game.scene.getScene('home');
    SSNET.setDayKey('');
    return JSON.stringify({ count: h.lanternT.text, stored: SS.prof.streak.n }) })()`));
  ok('midnight relights the daily chip on its own tick (no reload)', was === '✓' && relit,
    was + ' → ' + (relit ? '☀' : 'stuck'));
  ok('the lantern follows that clock: alive one night on, out the next',
    mid === 'lantern-lit' && wentOut && out.count === '', mid + ' → ' + (wentOut ? 'lantern-cold' : 'stuck'));
  ok('going cold on screen does not destroy the stored count (a grace night can still reach it)',
    out.stored === 5, String(out.stored));

  // the daily end screen's one line, and the copy it shares with the sheet.
  // submitScore is stubbed for the beat: this asserts the LINE, and leaving a
  // fake day's row on the live daily board would be litter.
  await c.ev(`(() => { SSNET.__sub = SSNET.submitScore; SSNET.submitScore = () => Promise.resolve();
    SSNET.setDayKey('20260812'); SS.prof.streak = { n: 13, last: 20260811, best: 13 }; SS.prof.daily = {};
    game.scene.getScene('home').scene.start('battle', { mode: 'daily', resume: null }); return 'armed' })()`);
  ok('a daily battle stands up for the end-screen check',
    await until(`(() => { const b = game.scene.getScene('battle');
      return game.scene.isActive("battle") && !!b && !!b.run && !!b.board && b.board.length === 16 })()`));
  await c.ev(`(() => { const b = game.scene.getScene('battle');
    b.state = 'anim'; b.run.words = 9; b.run.letters = 40; b.run.longest = 'moonlight'; b.run.fightIdx = 6;
    b.endRun(true); return 'ended' })()`);
  const flame = JSON.parse(await c.ev(`(() => {
    const b = game.scene.getScene('battle');
    const txt = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text' || (o.getData && o.getData('textBlock'))) txt.push(o.text); if (o.list) w(o.list); });
    w(b.overlayC.list);
    // nothing may fall outside the (taller) daily window
    let win = null, lo = 1e9, hi = -1e9;
    const w2 = (ls) => ls.forEach(o => {
      if (o.texture && o.texture.key === 'endpanel') win = o;
      else if (o.visible && o.getBounds && !(o.texture && o.texture.key === 'veil')) {
        const bb = o.getBounds(); if (bb.height) { lo = Math.min(lo, bb.top); hi = Math.max(hi, bb.bottom); }
      }
      if (o.list) w2(o.list);
    });
    w2(b.overlayC.list);
    const wb = win ? win.getBounds() : { top: 0, bottom: 0 };
    SSNET.submitScore = SSNET.__sub; SSNET.setDayKey('');
    return JSON.stringify({ line: txt.find(t => /🔥/.test(t)) || null, streak: SS.prof.streak.n,
      win: !!win, lo, hi, winTop: wb.top, winBot: wb.bottom, screenH: game.scale.height });
  })()`));
  ok('the daily end screen names the night the hunt just fed',
    flame.streak === 14 && flame.line && /14/.test(flame.line), flame.line + ' n=' + flame.streak);
  ok('every end-screen item still sits inside the (taller) daily window',
    flame.win && flame.lo >= flame.winTop - 2 && flame.hi <= flame.winBot + 2 && flame.winBot <= flame.screenH,
    Math.round(flame.lo) + '..' + Math.round(flame.hi) + ' in ' + Math.round(flame.winTop) + '..' + Math.round(flame.winBot));
  ok('all 10 languages carry the lantern copy',
    await c.ev(`Object.keys(SS_STR).every(k => SS_STR[k].stkLit && SS_STR[k].stkNight && SS_STR[k].stkKeep)`) === true);

  // ⚠ the ascent owns every ui item's alpha for 2.6s while the 1s herald tick
  // keeps firing — a tick that re-asserted its own alpha would hang the
  // lantern over the rising sky, and killTweensOf would take the group fade
  // (ONE tween over all of uiItems) with it
  await c.nav(BASE + '?fps=0', 9000);
  ok('meadow back for the ascent check', await until(HOME_REST));
  const flight = JSON.parse(await c.ev(`(async () => {
    const h = game.scene.getScene('home');
    SS.prof.streak = { n: 6, last: SSNET.dayKey(), best: 6 }; h.updateLantern();
    const rest = h.lanternB.alpha;
    h.beginAscent({ mode: 'quick' });
    await new Promise(r => setTimeout(r, 1200));
    const during = h.lanternB.alpha;
    h.updateDailyChip();
    return JSON.stringify({ rest: +rest.toFixed(3), during: +during.toFixed(3),
      after: +h.lanternB.alpha.toFixed(3) });
  })()`));
  ok('a herald tick mid-ascent leaves the lantern faded with the sky',
    flight.rest === 1 && flight.after <= flight.during + 0.01 && flight.after < 0.9, JSON.stringify(flight));

  // a profile from before the lantern: no fields, no crash, no invented streak
  await c.ev(`(() => { const p = JSON.parse(localStorage.getItem('beta3.profile') || '{}');
    delete p.streak; p.daily = { 20260101: 500 };
    localStorage.setItem('beta3.profile', JSON.stringify(p)); return 'aged' })()`);
  await c.nav(BASE + '?fps=0', 10000);
  ok('a profile predating the streak boots clean and reads 0',
    await c.ev(`!!window.game && ssStreakCount() === 0 && SS.prof.streak.n === 0 && SS.prof.streak.last === 0`) === true,
    await c.ev(`JSON.stringify(SS.prof.streak)`));
  await c.ev(`(() => { SS.prof.daily = {}; SS.prof.streak = { n: 0, last: 0, best: 0 }; SS.save(); return 'reset' })()`);
  await c.nav(BASE + '?fps=0', 9000);   // clean home again for the sections below


  /* ---- v0.40.0: THE GRACE NIGHT AND THE MARKS (the lantern, part 2) ----
     The grace night is ONE safety net, earned by playing, spent by the hunt
     that needs it rather than by the miss — which is what lets the lantern
     keep showing the flame while the player still has a night to come back
     for it. Two missed nights in a row are a vacation and still reset. Five
     dailies walk a spent grace back. The marks at 7 / 30 / 100 re-dress the
     lamp and hold a ceremony on the grass.
     Every wait here POLLS for the same reason the part-1 section does. */
  const graceRules = JSON.parse(await c.ev(`(() => {
    const keep = JSON.stringify(SS.prof.streak), keepD = JSON.stringify(SS.prof.daily);
    const out = {};
    const set = (o) => { SS.prof.streak = Object.assign({ n:0,last:0,best:0,g:1,gp:0,gd:[],mk:0,pend:0 }, o); };
    // a streak of 6, one night missed, then a hunt: the net bridges it
    set({ n:6, last:20260609, best:6 });
    SSNET.setDayKey('20260611');                          // 20260610 was MISSED
    out.aliveOnGrace = ssStreakCount();                   // …and the flame still reads alive
    out.bridging = ssStreakState().grace;
    const n1 = ssStreakNote();
    out.ev1 = n1.ev; out.n1 = n1.n; out.held = SS.prof.streak.g; out.gd = SS.prof.streak.gd.join();
    out.gp0 = SS.prof.streak.gp;                          // the bridging hunt is not one of the five
    // …and five nights walk it back
    const walk = [];
    for (let d = 12; d <= 16; d++) { SSNET.setDayKey('202606' + d); ssStreakNote(); walk.push(SS.prof.streak.gp + '/' + SS.prof.streak.g); }
    out.walk = walk.join(' ');
    // two missed nights are a vacation: grace bridges a night, never a holiday
    set({ n:20, last:20260601, best:20 });
    SSNET.setDayKey('20260604');
    out.vacRead = ssStreakCount();
    const n4 = ssStreakNote();
    out.vacEv = n4.ev; out.vacN = n4.n; out.vacHeld = SS.prof.streak.g;   // unspent, so still in hand
    // a streak that is BORN starts holding one — including one born out of a
    // break that had already spent the last net
    set({ n:9, last:20260601, best:9, g:0, gp:3 });
    SSNET.setDayKey('20260605');
    const n5 = ssStreakNote();
    out.rebornEv = n5.ev; out.rebornHeld = SS.prof.streak.g; out.rebornGp = SS.prof.streak.gp;
    set({ n:0, last:0, best:0, g:0, gp:0 });
    SSNET.setDayKey('20260605'); ssStreakNote();
    out.firstEverHeld = SS.prof.streak.g;
    // twice on a graced night is still one night
    set({ n:3, last:20260609, best:3 });
    SSNET.setDayKey('20260611');
    const a = ssStreakNote(), b = ssStreakNote();
    out.twice = a.ev + '/' + a.n + ' ' + b.ev + '/' + b.n;
    // the marks fire once each, and a reset lets them be earned again
    const ms = [];
    set({ n:6, last:20260609, best:6 });
    SSNET.setDayKey('20260610'); ms.push(ssStreakNote().ms);
    SSNET.setDayKey('20260611'); ms.push(ssStreakNote().ms);
    set({ n:29, last:20260611, best:29, mk:7 });
    SSNET.setDayKey('20260612'); ms.push(ssStreakNote().ms);
    SSNET.setDayKey('20260613'); ms.push(ssStreakNote().ms);
    set({ n:99, last:20260613, best:99, mk:30 });
    SSNET.setDayKey('20260614'); const m100 = ssStreakNote();
    ms.push(m100.ms);
    out.ms = ms.join(); out.marks = m100.marks.join(); out.pend = SS.prof.streak.pend;
    SSNET.setDayKey('20260620'); ssStreakNote();
    out.mkAfterReset = SS.prof.streak.mk;
    out.tiers = [0,1,2,6,7,29,30,99,100,365].map(ssLanternTier).join();
    SSNET.setDayKey(''); SS.prof.streak = JSON.parse(keep); SS.prof.daily = JSON.parse(keepD);
    return JSON.stringify(out);
  })()`));
  ok('a missed night reads ALIVE while a grace is in hand',
    graceRules.aliveOnGrace === 6 && graceRules.bridging === true, graceRules.aliveOnGrace + '/' + graceRules.bridging);
  ok('the next hunt spends the grace ONCE, extends the streak, and writes the bridged night down',
    graceRules.ev1 === 'graced' && graceRules.n1 === 7 && graceRules.held === 0 && graceRules.gd === '20260610' && graceRules.gp0 === 0,
    JSON.stringify([graceRules.ev1, graceRules.n1, graceRules.held, graceRules.gd]));
  ok('five dailies after a spent grace re-earn it — and only then',
    graceRules.walk === '1/0 2/0 3/0 4/0 0/1', graceRules.walk);
  ok('two missed nights in a row still reset, and never eat the unspent grace',
    graceRules.vacRead === 0 && graceRules.vacEv === 'relit' && graceRules.vacN === 1 && graceRules.vacHeld === 1,
    JSON.stringify([graceRules.vacRead, graceRules.vacEv, graceRules.vacN, graceRules.vacHeld]));
  ok('a streak that is BORN starts holding a grace — the first ever, and one relit after a break',
    graceRules.rebornEv === 'relit' && graceRules.rebornHeld === 1 && graceRules.rebornGp === 0
    && graceRules.firstEverHeld === 1,
    JSON.stringify([graceRules.rebornEv, graceRules.rebornHeld, graceRules.firstEverHeld]));
  ok('twice on a graced night is still one night', graceRules.twice === 'graced/4 same/4', graceRules.twice);
  ok('each mark fires exactly once, and a reset lets them be earned again',
    graceRules.ms === '7,0,30,0,100' && graceRules.mkAfterReset === 0, graceRules.ms + ' mk=' + graceRules.mkAfterReset);
  ok('every mark reached is offered for awarding, and the ceremony is queued',
    graceRules.marks === '7,30,100' && graceRules.pend === 100, graceRules.marks + ' pend=' + graceRules.pend);
  // v0.45.0: lit from the FIRST night (the cold lamp read as a gray box on
  // the phone after an end screen that had already said "the lantern is lit")
  ok('the lamp dresses by the marks (cold/lit-from-one/7/30/100)',
    graceRules.tiers === '-1,0,0,0,1,1,2,2,3,3', graceRules.tiers);

  // the five dresses, on the meadow, at the size the corner actually shows
  ok('meadow back for the lamp dresses', await until(HOME_REST));
  const dress = (n, extra) => c.ev(`(() => { const h = game.scene.getScene('home');
    SS.prof.streak = Object.assign({ n:${n}, last: SSNET.dayKey(), best:${n}, g:1, gp:0, gd:[], mk:0, pend:0 }, ${extra || '{}'});
    h.updateLantern();
    return JSON.stringify({ tex: h.lanternB.texture.key, glow: h.lanternGlow.baseAlpha, grace: h.lanternG.baseAlpha,
      beside: h.lanternB.getBounds().left > h.dailyChipB.getBounds().right,
      clearOfChip: h.lanternB.getBounds().right < h.profileChip.getBounds().left,
      inSafeBand: h.lanternB.getBounds().top >= ssLayout(h).y(0) - 0.5 }) })()`).then(JSON.parse);
  const d7 = await dress(7), d30 = await dress(30), d100 = await dress(100), d365 = await dress(365);
  ok('night 7 grows the lamp, 30 grows it again, 100 crowns it — and it stays crowned',
    d7.tex === 'lantern-m1' && d30.tex === 'lantern-m2' && d100.tex === 'lantern-m3' && d365.tex === 'lantern-m3',
    [d7.tex, d30.tex, d100.tex].join(' → '));
  ok('even the grown halo never outshines the daily chip ember (0.13)',
    Math.max(d7.glow, d30.glow, d100.glow) <= 0.13, String(d100.glow));
  /* ⚠ the crowns need headroom the corner does not have to spare: the design
     box centres in the phone's SAFE band, so a lamp whose sprite reaches above
     y=0 is wearing its comet under the notch on a real handset. */
  ok('the crowned lamp stays inside the safe band and clear of both corner chips',
    d365.inSafeBand && d365.beside && d365.clearOfChip,
    JSON.stringify([d365.inSafeBand, d365.beside, d365.clearOfChip]));
  const gOn = await dress(6, `{ last: ssDayKeyStep(SSNET.dayKey(), -2) }`);
  const gOff = await dress(6, `{ last: ssDayKeyStep(SSNET.dayKey(), -1) }`);
  ok('a flame standing on its grace night wears the ◌ mark, and only then',
    gOn.grace > 0 && gOn.tex === 'lantern-lit' && gOff.grace === 0, gOn.grace + '/' + gOff.grace);

  // THE WEEK STRIP — opened by a REAL tap on the lamp (screenshots never click)
  await c.ev(`(() => { const h = game.scene.getScene('home');
    SSNET.setDayKey('20260620');
    SS.prof.daily = { 20260615: 300, 20260616: 250, 20260618: 410, 20260619: 500 };
    SS.prof.streak = { n: 9, last: 20260619, best: 21, g: 0, gp: 2, gd: [20260617], mk: 7, pend: 0 };
    h.updateDailyChip(); return 'set' })()`);
  const lampPt = JSON.parse(await c.ev(`(() => { const o = game.scene.getScene('home').lanternB;
    const cam = o.scene.cameras.main, b = o.getBounds(), D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: lampPt.x, y: lampPt.y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: lampPt.x, y: lampPt.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: lampPt.x, y: lampPt.y, button: 'left', clickCount: 1 });
  ok('a real tap on the lamp opens the lantern sheet', await until(`!!game.scene.getScene('home').streakC`));
  const strip = JSON.parse(await c.ev(`(() => { const h = game.scene.getScene('home'), c = h.streakC;
    const txt = [], imgs = []; let rings = 0;
    const w = (ls) => ls.forEach(o => { if (o.type === 'Text' || (o.getData && o.getData('textBlock'))) txt.push(o.text); if (o.texture && o.texture.key) imgs.push(o.texture.key);
      if (o.type === 'Graphics') rings++; if (o.list) w(o.list); });
    w(c.list);
    let win = null, lo = 1e9, hi = -1e9;
    const w2 = (ls) => ls.forEach(o => { if (o.texture && o.texture.key === 'endpanel') win = o;
      else if (o.visible && o.getBounds && !(o.texture && o.texture.key === 'veil')) { const b = o.getBounds(); if (b.height) { lo = Math.min(lo, b.top); hi = Math.max(hi, b.bottom); } }
      if (o.list) w2(o.list); });
    w2(c.list);
    const wb = win ? win.getBounds() : { top: 0, bottom: 0 };
    return JSON.stringify({ txt, imgs, rings, lo, hi, winTop: wb.top, winBot: wb.bottom, screenH: game.scale.height }) })()`));
  ok('the sheet wears the lamp at the tier the streak earned', strip.imgs.includes('lantern-m1'));
  ok('the week strip draws the last SEVEN nights', strip.rings === 7, String(strip.rings));
  ok('it ticks every hunted night and owns up to the graced one',
    strip.txt.filter(t => t === '✓').length === 4 && strip.txt.filter(t => t === '◌').length === 1,
    JSON.stringify(strip.txt.filter(t => t.length <= 2)));
  ok('the quiet line names the exact cost of getting the net back',
    strip.txt.some(t => /re-earned in 3 more hunts/.test(t)), strip.txt.find(t => /re-earn/.test(t)) || '—');
  ok('the sheet names the night, the longest flame and the next mark',
    strip.txt.some(t => /night 9/.test(t)) && strip.txt.some(t => /longest/.test(t) && /21/.test(t))
    && strip.txt.some(t => /next mark · night 30/.test(t)),
    JSON.stringify(strip.txt.filter(t => /night|longest/.test(t))));
  ok('every item on the lantern sheet sits inside its window, and the window on screen',
    strip.lo >= strip.winTop - 2 && strip.hi <= strip.winBot + 2 && strip.winTop >= 0 && strip.winBot <= strip.screenH,
    Math.round(strip.lo) + '..' + Math.round(strip.hi) + ' in ' + Math.round(strip.winTop) + '..' + Math.round(strip.winBot));
  await c.ev(`(() => { const h = game.scene.getScene('home'); if (h.streakC) { h.streakC.destroy(); h.streakC = null; }
    SSNET.setDayKey(''); return 'closed' })()`);

  // THE CEREMONY — a mark waits on `streak.pend` until the grass is still
  await c.ev(`(() => { const h = game.scene.getScene('home');
    SS.prof.streak = { n: 30, last: SSNET.dayKey(), best: 30, g: 1, gp: 0, gd: [], mk: 30, pend: 30 };
    h.lanternShown = null; h.milestoneCheck(); return 'armed' })()`);
  ok('a pending mark holds a ceremony on the meadow', await until(`!!game.scene.getScene('home').riteC`, 25000));
  const rite = JSON.parse(await c.ev(`(() => { const h = game.scene.getScene('home'), c = h.riteC;
    const txt = [], imgs = [];
    const w = (ls) => ls.forEach(o => { if (o.type === 'Text' || (o.getData && o.getData('textBlock'))) txt.push(o.text); if (o.texture && o.texture.key) imgs.push(o.texture.key); if (o.list) w(o.list); });
    w(c.list);
    return JSON.stringify({ txt, imgs, depth: c.depth, parts: c.list.some(o => o.type === 'ParticleEmitter'),
      pend: SS.prof.streak.pend, stored: JSON.parse(localStorage.getItem('beta3.profile')).streak.pend }) })()`));
  ok('the ceremony shows the lamp in its new dress, names the mark, and throws sparks',
    rite.imgs.includes('lantern-m2') && rite.txt.some(t => /LANTERN GROWS/i.test(t)) && rite.parts && rite.depth >= 660,
    JSON.stringify(rite.txt));
  ok('the mark is spent the moment it is honoured — and written down, so a closed app still gets its ceremony once',
    rite.pend === 0 && rite.stored === 0, rite.pend + '/' + rite.stored);
  /* ⚠ 45s, not 20: the rite holds for 5.2s on the SCENE clock, and a
     software renderer running this at ~12fps stretches that ~5x. The lamp
     below is already right at 20s — it is only the close that is late. */
  ok('the ceremony lets the meadow back, wearing the new lamp',
    await until(`!game.scene.getScene('home').riteC && game.scene.getScene('home').lanternB.texture.key === 'lantern-m2'`, 45000),
    await c.ev(`game.scene.getScene('home').lanternB.texture.key`));

  // the daily end screen's second line: the grace it spent, or the mark it crossed
  const daily = async (setup) => {
    await c.nav(BASE + '?fps=0', 9000);
    await until(`!!window.game && game.scene.isActive('home')`);
    await c.ev(`(() => { SSNET.__sub = SSNET.submitScore; SSNET.submitScore = () => Promise.resolve();
      ${setup}
      game.scene.getScene('home').scene.start('battle', { mode: 'daily', resume: null }); return 'armed' })()`);
    await until(`(() => { const b = game.scene.getScene('battle');
      return game.scene.isActive("battle") && !!b && !!b.run && !!b.board && b.board.length === 16 })()`);
    await c.ev(`(() => { const b = game.scene.getScene('battle');
      b.state = 'anim'; b.run.words = 9; b.run.letters = 40; b.run.longest = 'moonlight'; b.run.fightIdx = 6;
      b.endRun(true); return 'ended' })()`);
    await sleep(900);
    return JSON.parse(await c.ev(`(() => { const b = game.scene.getScene('battle');
      const txt = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text' || (o.getData && o.getData('textBlock'))) txt.push(o.text); if (o.list) w(o.list); });
      w(b.overlayC.list);
      let win = null, lo = 1e9, hi = -1e9;
      const w2 = (ls) => ls.forEach(o => { if (o.texture && o.texture.key === 'endpanel') win = o;
        else if (o.visible && o.getBounds && !(o.texture && o.texture.key === 'veil')) { const bb = o.getBounds(); if (bb.height) { lo = Math.min(lo, bb.top); hi = Math.max(hi, bb.bottom); } }
        if (o.list) w2(o.list); });
      w2(b.overlayC.list);
      const wb = win ? win.getBounds() : { top: 0, bottom: 0 };
      SSNET.submitScore = SSNET.__sub; SSNET.setDayKey('');
      return JSON.stringify({ txt, streak: JSON.parse(JSON.stringify(SS.prof.streak)), ach: Object.keys(SS.prof.ach),
        win: !!win, lo, hi, winTop: wb.top, winBot: wb.bottom, screenH: game.scale.height }) })()`));
  };
  const gEnd = await daily(`SSNET.setDayKey('20260812');
    SS.prof.streak = { n: 13, last: 20260810, best: 13, g: 1, gp: 0, gd: [], mk: 7, pend: 0 };
    SS.prof.daily = {}; SS.prof.ach = {};`);
  ok('a hunt one night late spends the grace, and the end screen owns up to it',
    gEnd.streak.n === 14 && gEnd.streak.g === 0 && gEnd.txt.some(t => /night 14/.test(t))
    && gEnd.txt.some(t => /grace night held the flame/.test(t)),
    JSON.stringify(gEnd.txt.filter(t => /night|grace/.test(t))));
  ok('nothing on the (taller again) daily window falls outside it',
    gEnd.win && gEnd.lo >= gEnd.winTop - 2 && gEnd.hi <= gEnd.winBot + 2 && gEnd.winBot <= gEnd.screenH,
    Math.round(gEnd.lo) + '..' + Math.round(gEnd.hi) + ' in ' + Math.round(gEnd.winTop) + '..' + Math.round(gEnd.winBot));
  const mEnd = await daily(`SSNET.setDayKey('20260812');
    SS.prof.streak = { n: 6, last: 20260811, best: 6, g: 1, gp: 0, gd: [], mk: 0, pend: 0 };
    SS.prof.daily = {}; SS.prof.ach = {};`);
  ok('crossing seven names the mark, queues its ceremony and awards its achievement',
    mEnd.txt.some(t => /SEVEN NIGHTS/.test(t)) && mEnd.streak.pend === 7 && mEnd.ach.includes('flame-7') && !mEnd.ach.includes('flame-30'),
    mEnd.ach.join());
  const dEnd = await daily(`SSNET.setDayKey('20260812');
    SS.prof.streak = { n: 99, last: 20260811, best: 99, g: 1, gp: 0, gd: [], mk: 30, pend: 0 };
    SS.prof.daily = {}; SS.prof.ach = {};`);
  ok('a player already deep into a streak collects every mark they earned',
    ['flame-7', 'flame-30', 'flame-100'].every((a) => dEnd.ach.includes(a)), dEnd.ach.join());

  // migration: v0.39.0 profiles carry no grace fields at all
  await c.ev(`(() => { const p = JSON.parse(localStorage.getItem('beta3.profile') || '{}');
    p.streak = { n: 40, last: SSNET.dayKey(), best: 40 };
    localStorage.setItem('beta3.profile', JSON.stringify(p)); return 'aged' })()`);
  await c.nav(BASE + '?fps=0', 9000);
  const mig = JSON.parse(await c.ev(`JSON.stringify(SS.prof.streak)`));
  ok('a v0.39.0 profile wakes holding one grace, its marks seeded — not re-run',
    mig.g === 1 && mig.gp === 0 && mig.mk === 30 && mig.pend === 0 && Array.isArray(mig.gd), JSON.stringify(mig));

  // …and the mark PERSISTS: a hundred-night lantern comes back comet-crowned
  await c.ev(`(() => { SS.prof.streak = { n: 120, last: SSNET.dayKey(), best: 120, g: 0, gp: 3, gd: [], mk: 100, pend: 0 };
    SS.save(); return 'saved' })()`);
  await c.nav(BASE + '?fps=0', 9000);
  ok('the meadow settles for the persistence check', await until(HOME_REST));
  const reboot = JSON.parse(await c.ev(`(() => { const h = game.scene.getScene('home');
    return JSON.stringify({ tex: h.lanternB.texture.key, count: h.lanternT.text,
      mk: SS.prof.streak.mk, g: SS.prof.streak.g, gp: SS.prof.streak.gp }) })()`));
  ok('a hundred-night lantern comes back comet-crowned on a later boot, its grace ledger intact',
    reboot.tex === 'lantern-m3' && reboot.count === '120' && reboot.mk === 100 && reboot.g === 0 && reboot.gp === 3,
    JSON.stringify(reboot));

  // the ledger grew by three and still has to fit one screen
  await c.ev(`(() => { SS.prof.daily = {}; SS.prof.streak = { n:0,last:0,best:0,g:1,gp:0,gd:[],mk:0,pend:0 }; SS.save();
    game.scene.getScene('home').scene.start('profile'); return 'go' })()`);
  ok('the profile ledger stands up', await until(`game.scene.isActive('profile')`));
  /* ⚠ measure the LEDGER, not the scene: ssStarfield sprinkles stars to the
     very bottom edge, so a max-bounds-of-everything sweep just re-measures
     the starfield and passes or fails at random. */
  const led = JSON.parse(await c.ev(`(() => { const p = game.scene.getScene('profile');
    const names = new Set(SS_ACH.map(a => a.name)), descs = new Set(SS_ACH.map(a => a.desc));
    let rows = 0, hi = -1e9, seal = 1e9, shown = [];
    p.children.list.forEach(o => {
      if (o.type !== 'Text') return;
      if (names.has(o.text)) { shown.push(o.text); rows++; hi = Math.max(hi, o.getBounds().bottom); }
      else if (descs.has(o.text)) hi = Math.max(hi, o.getBounds().bottom);
      else if (/^seal: /.test(o.text)) seal = o.getBounds().top;
    });
    return JSON.stringify({ rows, hi, seal, total: SS_ACH.length, screenH: game.scale.height,
      marks: ['SEVEN NIGHTS','THE LONG BURN','THE COMET CROWN'].every(n => shown.includes(n)) }) })()`));
  ok('all 23 achievements are listed, the lantern’s three marks among them',
    led.total === 23 && led.rows === 23 && led.marks, led.rows + '/' + led.total);
  ok('and the grown ledger still clears the seal at the foot of the page',
    led.hi <= led.seal && led.seal < led.screenH,
    Math.round(led.hi) + ' → seal ' + Math.round(led.seal) + ' of ' + led.screenH);
  ok('all 10 languages carry the grace + marks copy',
    await c.ev(`Object.keys(SS_STR).every(k => ['stkSheet','stkWeekHead','stkLegend','stkCold','stkColdSub','stkBest','stkNextMark','stkGraceHeld','stkGraceBridge','stkGraceSpent','stkGraceSpent1','stkGraced','stkMsHead','stkMs7','stkMs30','stkMs100','stkMsSub7','stkMsSub30','stkMsSub100'].every(s => !!SS_STR[k][s]))`) === true);
  await c.ev(`(() => { SS.prof.daily = {}; SS.prof.ach = {}; SS.prof.streak = { n:0,last:0,best:0,g:1,gp:0,gd:[],mk:0,pend:0 }; SS.save(); return 'reset' })()`);
  await c.nav(BASE + '?fps=0', 9000);   // clean home again for the sections below

  /* ---- v0.41.0: THE DAILY SHARE CARD (the spoiler-free sky) ----
     What the daily's SHARE button puts on the clipboard is the whole feature:
     a card that travels to a group chat and gives NOTHING away. The laws it
     must obey, in order of how badly breaking them would hurt:
       1. the finest word's LETTERS never appear — the tile row is a count
       2. one mark per beast, in fight order, so the row IS the run's shape
       3. nothing personal: two hunters with the same numbers copy the same card
       4. the clipboard mechanics stay WKWebView-safe (no navigator.share, no
          dialogs) — the payload changed, the plumbing did not.
     The pure builder is asserted first, then the REAL button is clicked with
     the clipboard stubbed, because a screenshot of a share button proves
     nothing about what it copies. */
  const CARD_URL = 'https://drbango.com/beta3/?daily=1';
  const card = async (o) => c.ev(`(() => { SSNET.setDayKey('20260812');
    const t = ssShareCard(${JSON.stringify(o)}); SSNET.setDayKey(''); return t })()`);
  const c14 = await card({ score: 719, felled: 4, beasts: 5, wordLen: 7, streak: 14 });
  ok('the card is built line for line, and nothing else is in it',
    c14 === ['STARSPELL Daily · 2026-08-12', '✶ ✶ ✶ ✶ 🌑', '🟨'.repeat(7),
      '719 pts · finest word: 7 tiles', '🔥 14-night streak', CARD_URL].join('\n'),
    JSON.stringify(c14));
  const rows = (t) => t.split('\n');
  const c0 = await card({ score: 88, felled: 0, beasts: 5, wordLen: 3, streak: 0 });
  const c1 = await card({ score: 1240, felled: 9, beasts: 5, wordLen: 1, streak: 1 });
  const cNo = await card({ score: 0, felled: 0, beasts: 5, wordLen: 0, streak: 0 });
  ok('the sky is one mark per beast in fight order — felled ✶ first, then 🌑',
    rows(c14)[1] === '✶ ✶ ✶ ✶ 🌑' && rows(c0)[1] === '🌑 🌑 🌑 🌑 🌑'
    && rows(c1)[1] === '✶ ✶ ✶ ✶ ✶' && rows(c14)[1].split(' ').length === 5,
    rows(c0)[1] + ' | ' + rows(c1)[1]);
  ok('the finest word is a tile COUNT: one 🟨 per letter, and only 🟨',
    rows(c14)[2] === '🟨🟨🟨🟨🟨🟨🟨' && rows(c0)[2] === '🟨🟨🟨' && rows(c1)[2] === '🟨',
    rows(c0)[2] + ' | ' + rows(c1)[2]);
  ok('a run that cast no word drops the tile row rather than leaving a hole',
    rows(cNo).length === 4 && !/🟨/.test(cNo) && /no word cast/.test(cNo), JSON.stringify(cNo));
  ok('the flame line appears only when there is a flame, and reads plainly at 1',
    !/🔥/.test(c0) && /🔥 night one/.test(c1) && /🔥 14-night streak/.test(c14),
    rows(c1)[4]);
  ok('the play link is the last line, always', rows(c14).pop() === CARD_URL
    && rows(c0).pop() === CARD_URL && rows(cNo).pop() === CARD_URL);

  // the card in another language: the WORDS change, the shape and the line
  // order do not. ?lang= also SAVES the choice, so it is put back after.
  await c.nav(BASE + '?fps=0&lang=de', 11000);
  const de = await card({ score: 719, felled: 4, beasts: 5, wordLen: 7, streak: 14 });
  await c.nav(BASE + '?fps=0&lang=en', 11000);
  ok('a German hunter shares the same six lines in the same order',
    de === ['STARSPELL Tagesjagd · 2026-08-12', '✶ ✶ ✶ ✶ 🌑', '🟨'.repeat(7),
      '719 Punkte · bestes Wort: 7 Steine', '🔥 14-Nächte-Serie', CARD_URL].join('\n'),
    JSON.stringify(de));
  ok('all 10 languages carry the share-card copy',
    await c.ev(`Object.keys(SS_STR).every(k => ['shHead','shScore','shFinest','shFinest1','shNoWord','shStreak','shStreak1'].every(s => !!SS_STR[k][s]))`) === true);
  ok('every language keeps the %1 the card fills in',
    await c.ev(`Object.keys(SS_STR).every(k => ['shHead','shScore','shFinest','shStreak'].every(s => SS_STR[k][s].includes('%1')))`) === true);

  /* THE REAL BUTTON. A daily is played to its end screen and the share button
     is CLICKED — the clipboard stubbed on the navigator so the payload can be
     read back. submitScore is stubbed too: a fake day's row on the live daily
     board would be litter. */
  await c.ev(`(() => { SSNET.__sub = SSNET.submitScore; SSNET.submitScore = () => Promise.resolve();
    SSNET.setDayKey('20260812'); SS.prof.streak = { n: 13, last: 20260811, best: 13, g: 1, gp: 0, gd: [], mk: 7, pend: 0 };
    SS.prof.daily = {}; window.__copied = null; window.__shared = false;
    Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { writeText: (t) => { window.__copied = t; return Promise.resolve(); } } });
    // a TRIPWIRE, not a convenience: headless Chrome really has navigator.share,
    // and reaching it inside a user-activation window opens the native macOS
    // sheet and freezes the whole browser process (README). This both proves
    // the game never calls it and makes sure it cannot.
    Object.defineProperty(navigator, 'share', { configurable: true,
      value: () => { window.__shared = true; return Promise.resolve(); } });
    game.scene.getScene('home').scene.start('battle', { mode: 'daily', resume: null }); return 'armed' })()`);
  ok('a daily battle stands up for the share check',
    await until(`(() => { const b = game.scene.getScene('battle');
      return game.scene.isActive("battle") && !!b && !!b.run && !!b.board && b.board.length === 16 })()`));
  const run = JSON.parse(await c.ev(`(() => { const b = game.scene.getScene('battle');
    b.state = 'anim'; b.run.words = 7; b.run.letters = 31; b.run.longest = 'moonlight'; b.run.fightIdx = 3;
    b.endRun(false);
    return JSON.stringify({ beasts: b.fights.length, felled: b.run.fightIdx,
      word: b.run.longest, streak: SS.prof.streak.n }) })()`));
  ok('the share button is on the daily end screen',
    await until(`(() => { const b = game.scene.getScene('battle'); let f = false;
      const w = (ls) => ls.forEach(o => { if (o.type === 'Text' && o.text === SS_T('shareBtn')) f = true; if (o.list) w(o.list); });
      w(b.overlayC.list); return f })()`));
  const btn = JSON.parse(await c.ev(`(() => { const b = game.scene.getScene('battle'); let t = null;
    const w = (ls) => ls.forEach(o => { if (o.type === 'Text' && o.text === SS_T('shareBtn')) t = o; if (o.list) w(o.list); });
    w(b.overlayC.list);
    const cam = b.cameras.main, bb = t.getBounds(), D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (bb.centerX - cam.scrollX) / D, y: (bb.centerY - cam.scrollY) / D }) })()`));
  /* ⚠ the tap REPEATS until it takes. The end screen's buttons are built and
     made interactive in one frame, and Phaser registers them with its input
     plugin on the NEXT one — at the ~12fps a software renderer imposes here,
     a single click fired the instant the label appears is simply dropped, and
     that reads as a broken share button. Clicking again costs nothing: the
     handler only copies. */
  const tapUntil = async (pt, cond, cap = 24000) => {
    for (let i = 0; i < cap / 3000; i++) {
      await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
      await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
      await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
      if (await until(cond, 3000)) return true;
    }
    return false;
  };
  const tapped = await tapUntil(btn, `typeof window.__copied === 'string' && window.__copied.length > 0`);
  ok('a REAL tap on it copies something and says so', tapped
    && await c.ev(`(() => { const b = game.scene.getScene('battle'); let f = false;
      const w = (ls) => ls.forEach(o => { if (o.type === 'Text' && o.text === SS_T('shareCopied')) f = true; if (o.list) w(o.list); });
      w(b.overlayC.list); return f })()`) === true);
  const paste = await c.ev(`window.__copied`);
  // the score the end screen actually used: the daily log is written with it
  // (beta3.result is only stamped on the way HOME, so it would be a stale read)
  const score = await c.ev(`SS.prof.daily['20260812']`);
  const pl = rows(paste);
  ok('the pasted card is EXACTLY the run that was just played',
    paste === ['STARSPELL Daily · 2026-08-12', '✶ ✶ ✶ 🌑 🌑', '🟨'.repeat(9),
      score + ' pts · finest word: 9 tiles', '🔥 14-night streak', CARD_URL].join('\n'),
    JSON.stringify(paste));
  ok('grid width is the beast count, tile count is the finest word’s length',
    pl[1].split(' ').length === run.beasts && (pl[2].match(/🟨/gu) || []).length === run.word.length,
    pl[1].split(' ').length + ' beasts · ' + (pl[2].match(/🟨/gu) || []).length + ' tiles for ' + run.word.length);
  ok('THE SPOILER LAW: not one letter of the finest word is in the card',
    !new RegExp(run.word, 'i').test(paste)
    && !run.word.toUpperCase().split('').some((ch) => pl[2].includes(ch)),
    run.word.toUpperCase() + ' vs ' + JSON.stringify(pl[2]));
  const me = JSON.parse(await c.ev(`JSON.stringify({ name: SSNET.myName(), uid: SSNET.uid(), rating: SS.prof.rating })`));
  ok('nothing personal rides along: no name, no uid, no rating',
    !paste.includes(me.name) && !paste.includes(me.uid) && !/✦/.test(paste),
    me.name + ' / ' + String(me.uid).slice(0, 10) + '… absent');

  /* THE WKWEBVIEW PATH — as the shell REALLY behaves (v0.43.1). TestFlight
     1.0 (1) proved navigator.clipboard EXISTS there but writeText REJECTS
     (NotAllowedError). The old fire-and-forget write painted two red PROMISE
     banners over the end screen, the button read COPIED — GO BOAST, and the
     board was empty. So the rejection is emulated here — never assume
     Chrome's grant — the tap is real, and COPIED may show only because the
     textarea + execCommand fallback ACTUALLY carried the identical payload. */
  const resetShareT = () => c.ev(`(() => { const b = game.scene.getScene('battle');
    const w = (ls) => ls.forEach(o => { if (o.type === 'Text' && (o.text === SS_T('shareCopied') || o.text === SS_T('shareFail'))) o.setText(SS_T('shareBtn')); if (o.list) w(o.list); });
    w(b.overlayC.list); return 'reset' })()`);
  const shareSays = (key) => `(() => { const b = game.scene.getScene('battle'); let f = false;
    const w = (ls) => ls.forEach(o => { if (o.type === 'Text' && o.text === SS_T('${key}')) f = true; if (o.list) w(o.list); });
    w(b.overlayC.list); return f })()`;
  await resetShareT();
  await c.ev(`(() => {
    localStorage.removeItem('beta3.diaglog');
    Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { writeText: () => Promise.reject(Object.assign(
        new Error('The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.'),
        { name: 'NotAllowedError' })) } });
    window.__exec = null; window.__realExec = document.execCommand;
    document.execCommand = function (cmd) {
      if (cmd === 'copy') window.__exec = document.activeElement && document.activeElement.value;
      return true;
    };
    return 'wk' })()`);
  const gotFb = await tapUntil(btn, `typeof window.__exec === 'string' && window.__exec.length > 0`);
  const fb = JSON.parse(await c.ev(`(() => {
    const out = { grabbed: window.__exec, leftovers: document.querySelectorAll('textarea').length,
      shared: !!window.__shared, banner: !!document.getElementById('errbox') };
    return JSON.stringify(out) })()`));
  ok('a REJECTED clipboard falls through: the fallback copies the very same card, no textarea left behind',
    gotFb && fb.grabbed === paste && fb.leftovers === 0,
    JSON.stringify((fb.grabbed || '').slice(0, 28)) + ' · ' + fb.leftovers + ' left');
  ok('…and the button still says COPIED, because a path REALLY ran',
    await until(shareSays('shareCopied'), 8000));
  ok('the shell’s refusal paints no red banner over the player', fb.banner === false);
  ok('neither path ever reaches navigator.share (it freezes the shell)', fb.shared === false);

  /* BOTH PATHS BROKEN. The button must confess — COPY FAILED — because a
     button that lies costs a player who just boasted an empty paste. And
     still no red banner: the failure is the game's to report, not compat's. */
  await resetShareT();
  await c.ev(`(() => { window.__exec = null; document.execCommand = function () { return false; }; return 'dead' })()`);
  ok('with the fallback dead too, the button confesses COPY FAILED',
    await tapUntil(btn, shareSays('shareFail')));
  const dead = JSON.parse(await c.ev(`(() => {
    const out = { banner: !!document.getElementById('errbox'), leftovers: document.querySelectorAll('textarea').length };
    document.execCommand = window.__realExec; delete navigator.clipboard; delete navigator.share;
    return JSON.stringify(out) })()`));
  ok('a total failure still paints no banner and leaves no textarea', dead.banner === false && dead.leftovers === 0);

  /* THE RED BANNER POLICY (compat.js, v0.43.1). An unhandled rejection is
     ROUTINE on a phone — the player never sees one. Without ?diag=1 the line
     goes silently to the beta3.diaglog ring; with the flag the banner paints
     as before, and the history stored by quieter sessions is replayed into
     the readout. */
  await c.ev(`(() => { Promise.reject(new Error('banner drill NotAllowedError')); return 'fired' })()`);
  ok('an unhandled rejection paints NOTHING without ?diag=1, but is logged for later',
    await until(`(JSON.parse(localStorage.getItem('beta3.diaglog') || '[]')).some((l) => l.includes('banner drill'))`, 8000)
    && await c.ev(`!document.getElementById('errbox')`) === true);
  /* The workload probe's forced-WebGL boot throws "Cannot create WebGL
     context" ASYNC on a GL-less box — outside the probe's try/catch. The
     probe survives (that failure IS its verdict) and the game runs on
     canvas, so painting it is a red box over a WORKING game. Gated to the
     probe window; a real error must stay loud for everyone. */
  ok('the probe’s GL-less throw is gated — a working canvas game never wears a red box',
    await c.ev(`(() => { window.__ssProbing = true;
      window.dispatchEvent(new ErrorEvent('error', { message: 'Cannot create WebGL context, aborting.', filename: 'phaser.min.js', lineno: 1 }));
      window.__ssProbing = false;
      return !document.getElementById('errbox') })()`) === true);
  ok('a REAL uncaught error still paints for everyone (a visible line beats a silent black screen)',
    await c.ev(`(() => { window.dispatchEvent(new ErrorEvent('error', { message: 'genuine boom', filename: 'game.js', lineno: 1 }));
      const d = document.getElementById('errbox'); const up = !!d && d.textContent.includes('genuine boom');
      if (d) d.remove(); return up })()`) === true);
  await c.ev(`(() => { SSNET.submitScore = SSNET.__sub; SSNET.setDayKey('');
    SS.prof.daily = {}; SS.prof.streak = { n:0,last:0,best:0,g:1,gp:0,gd:[],mk:0,pend:0 }; SS.save(); return 'swept' })()`);
  // the replay lands in the tap-to-dismiss box (slate, persists until tapped)
  // — NOT the rolling diagbox, whose 14-line window the boot's own chatter
  // floods in seconds
  await c.nav(BASE + '?fps=0&diag=1', 2500);
  ok('?diag=1 replays the stored history from the quiet session',
    await until(`(() => { const d = document.getElementById('errbox'); return !!d && d.textContent.includes('banner drill') })()`, 15000));
  await c.ev(`(() => { Promise.reject(new Error('banner drill two')); return 'fired' })()`);
  ok('…and a live rejection paints the red banner again under the flag',
    await until(`(() => { const d = document.getElementById('errbox'); return !!d && d.textContent.includes('banner drill two') })()`, 8000));
  await c.ev(`(() => { localStorage.removeItem('beta3.diaglog'); return 'clean' })()`);
  await c.nav(BASE + '?fps=0', 9000);


  /* ---- v0.42.0: THE SIGIL DRIP — the two laws it may never break ----
     Half the twenty-four sigils are now locked on a fresh profile, so every
     solo pick draws from a pool of TWELVE.
     1. THE POOL NEVER STARVES. rollSigilOpts falls DOWNWARD through the
        tiers, which only works while the fat tier is tier 0 — the starting
        twelve are 9 basic / 2 rare / 1 legendary for exactly that reason. A
        board must be full whenever three unlocked sigils remain unheld, a
        locked sigil may never appear on any board in any solo mode, and a
        pool run dry by a long climb must return nothing rather than throw.
     2. GRANDFATHERING. A profile with prior play wakes holding all 24. This
        is the law that would otherwise take twelve sigils off a TestFlight
        tester on the first boot after this shipped.
     The whole mechanic — conditions, counters, the notice, ten languages —
     is walked by tools/drip-check.mjs. */
  /* v0.47.0 — THE CAMPAIGN DOORS, the two laws (tools/tagline-check.mjs walks
     every state on real taps): without a checkpoint CONTINUE CAMPAIGN is DEAD
     (input off, 0.45) and NEW CAMPAIGN opens no warning; with one the door is
     alive and NEW CAMPAIGN must warn before a climb is lost. */
  await c.ev(`(() => { localStorage.removeItem('beta3.profile'); localStorage.removeItem('beta3.campaign'); localStorage.removeItem('beta3.campsign'); return 'wiped' })()`);
  await c.nav(BASE + '?fps=0', 12000);
  await until(`(() => { const h = game.scene.getScene('home'); return game.scene.isActive('home') && !!h.rowBtns && !h.introPlaying && !h.busy() })()`);
  const DOOR = `(() => { const h = game.scene.getScene('home'), b = h.rowBtns.campaign, t = h.rowLabels.campaign;
    return JSON.stringify({ label: t.text, hit: !!b.input && b.input.enabled, a: +b.alpha.toFixed(2), alive: h.campAlive, sheet: !!h.confirmC, sign: !!h.signC }) })()`;
  let door = JSON.parse(await c.ev(DOOR));
  ok('NO CHECKPOINT → CONTINUE CAMPAIGN is dead: input off, 0.45, reads contCamp',
    !door.hit && door.a === 0.45 && !door.alive && door.label === await c.ev(`SS_T('contCamp')`), JSON.stringify(door));
  await c.ev(`game.scene.getScene('home').newCampaign(); 1`);
  await sleep(300);
  door = JSON.parse(await c.ev(DOOR));
  ok('NO CHECKPOINT → NEW CAMPAIGN opens no warning, straight to the stars', !door.sheet && door.sign, JSON.stringify(door));
  await c.ev(`localStorage.setItem('beta3.campaign', JSON.stringify({ fightIdx: 4, actIdx: 0, hp: 10, hpMax: 12, sigils: [], words: [] })); 1`);
  await c.nav(BASE + '?fps=0', 12000);
  await until(`(() => { const h = game.scene.getScene('home'); return game.scene.isActive('home') && !!h.rowBtns && !h.introPlaying && !h.busy() })()`);
  door = JSON.parse(await c.ev(DOOR));
  ok('A CHECKPOINT → the door is alive and lit', door.hit && door.a === 1 && door.alive, JSON.stringify(door));
  await c.ev(`game.scene.getScene('home').newCampaign(); 1`);
  await sleep(300);
  door = JSON.parse(await c.ev(DOOR));
  ok('A CHECKPOINT → NEW CAMPAIGN warns before the climb is lost (sheet up, checkpoint untouched)',
    door.sheet && !door.sign && await c.ev(`JSON.parse(localStorage.getItem('beta3.campaign')).fightIdx === 4`) === true, JSON.stringify(door));
  ok('the restart copy is in every language', await c.ev(`Object.keys(SS_STR).every(L => ['contCamp','restartTitle','restartBody','restartBack','restartNew'].every(k => typeof SS_STR[L][k] === 'string' && SS_STR[L][k].length > 0)) && Object.keys(SS_STR).every(L => !('abandonTitle' in SS_STR[L]))`) === true);

  await c.ev(`(() => { localStorage.removeItem('beta3.profile'); localStorage.removeItem('beta3.campaign'); return 'wiped' })()`);
  await c.nav(BASE + '?fps=0&daily=1', 20000);
  ok('a fresh profile boots into the drip holding twelve, 9 basic / 2 rare / 1 legendary',
    await c.ev(`ssSigilOpen().length === 12 && [0,1,2].map(r => ssSigilOpen().filter(s => (s.rarity|0) === r).length).join('/') === '9/2/1'`) === true,
    await c.ev(`ssSigilOpen().map(s => s.id).join(' ')`));
  await until(`(() => { const b = game.scene.getScene('battle');
    return game.scene.isActive('battle') && !!b && !!b.run })()`);
  const drip = JSON.parse(await c.ev(`(() => {
    const b = game.scene.getScene('battle'), keep = b.run.sigils.slice();
    const out = { openN: ssSigilOpen().length, boards: [], locked: 0, dupe: 0, bad: 0, short: 0, threw: null };
    b.run.sigils = [];
    try {
      for (let k = 0; k < 19; k++) {                     // a whole campaign's worth of picks
        const left = out.openN - b.run.sigils.length;
        const o = b.rollSigilOpts();
        if (o.some(s => !s || !s.id)) out.bad++;
        if (o.some(s => s.lock && !SS.prof.sig.u[s.id])) out.locked++;
        if (new Set(o.map(s => s.id)).size !== o.length || o.some(s => b.run.sigils.includes(s.id))) out.dupe++;
        if (o.length !== Math.min(3, Math.max(0, left))) out.short++;
        out.boards.push(o.length);
        if (o.length) b.run.sigils.push(o[0].id);
      }
    } catch (e) { out.threw = String(e); }
    b.run.sigils = keep;
    return JSON.stringify(out) })()`));
  ok('THE POOL NEVER STARVES: 19 daily/campaign picks off the starting twelve, no locked card, no repeat, no throw',
    drip.openN === 12 && !drip.locked && !drip.dupe && !drip.bad && !drip.short && !drip.threw,
    'boards ' + drip.boards.join(',') + ' · locked ' + drip.locked + ' dupe ' + drip.dupe + (drip.threw || ''));
  await c.ev(`localStorage.setItem('beta3.profile', JSON.stringify({ runs: 3, words: 40 })); 'planted'`);
  await c.nav(BASE + '?fps=0', 10000);
  ok('GRANDFATHERED: a profile with prior play wakes holding all 24, and it is written down',
    await c.ev(`ssSigilOpen().length === 24 && (SS.prof.sig.gf | 0) === 1
      && SS_SIGILS.every(s => ssSigilUnlocked(s.id))`) === true,
    await c.ev(`ssSigilOpen().length`) + ' open · gf=' + await c.ev(`SS.prof.sig.gf | 0`));

  /* 3. NO SIGIL IS EVER LISTED TWICE (v0.43.0). The gallery draws what you
     hold in full dress above a STILL SLEEPING rule and the locked half as
     silhouettes below it. Both lists come from ssSigilUnlocked — the same
     truth ssSigilOpen() draws the pick boards from — so a discovery leaves
     one list the instant it joins the other. If the two ever came from
     different sources (a cached id list, a count taken at scene build) a
     freshly forged sigil would be shown in full dress AND as a silhouette
     still asking to be found, which is the one thing this surface may never
     do. Built and read directly, so the law is checked on what is DRAWN. */
  await c.ev(`(() => { localStorage.removeItem('beta3.profile'); return 'wiped' })()`);
  await c.nav(BASE + '?fps=0', 10000);
  await until(`game.scene.isActive('home')`);
  const dbl = JSON.parse(await c.ev(`(() => {
    const s = game.scene.getScene('home');
    const read = () => {
      const p = ssSigilPanel(s, { sigils: ssSigilOpen().map(g => g.id), sleeping: true, depth: 900 });
      const txt = [];
      const w = (ls) => ls.forEach(o => { if (o.type === 'Text' || (o.getData && o.getData('textBlock'))) txt.push(o.text); if (o.list) w(o.list); });
      w(p.c.list);
      const kill = (o) => { s.tweens.killTweensOf(o); if (o.list) o.list.forEach(kill); };
      kill(p.c); p.c.destroy();
      const held = SS_SIGILS.filter(g => txt.includes(SS_SIG(g).desc)).map(g => g.id);
      const asleep = SS_SIGILS.filter(g => g.lock && txt.includes(SS_SIG_HOW(g))).map(g => g.id);
      return { held, asleep, both: held.filter(i => asleep.includes(i)) };
    };
    const before = read();
    SS.prof.sig.c.w8 = 1; SS.save(); ssSigilCheck(); SS.prof.sig.pend = []; SS.save();
    const after = read();
    return JSON.stringify({ before, after }) })()`));
  ok('NO DOUBLE LISTING: a forged sigil leaves the sleeping list the instant it joins the held one',
    dbl.before.held.length === 12 && dbl.before.asleep.length === 12 && !dbl.before.both.length
    && dbl.after.held.length === 13 && dbl.after.asleep.length === 11 && !dbl.after.both.length
    && dbl.after.held.includes('nova') && !dbl.after.asleep.includes('nova'),
    'held/asleep ' + dbl.before.held.length + '/' + dbl.before.asleep.length
    + ' → ' + dbl.after.held.length + '/' + dbl.after.asleep.length
    + (dbl.after.both.length ? ' BOTH: ' + dbl.after.both.join(',') : ''));

  await c.ev(`(() => { localStorage.removeItem('beta3.profile'); return 'swept' })()`);
  await c.nav(BASE + '?fps=0', 9000);


  // ---- v0.36.2: SAFE-AREA LAW (the TestFlight prerequisite) ----
  // In a browser the chrome hides the notch. In a full-screen WKWebView shell
  // the canvas owns every pixel, and the 420x800 design box was landing its top
  // row under the hardware: -7px on iPhone 14/15 Pro, and on a no-notch SE the
  // daily chip + profile chip sat squarely beneath the status bar, both tappable.
  // The box now centres in the SAFE band. ?inset=T,B forces values (headless
  // env() always reports 0, so without it this is untestable).
  const box = async (qs) => JSON.parse(await c.ev(`(() => {
    const l = ssLayout(game.scene.getScenes(true)[0]);
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ top: l.y(0) / D, bot: l.y(800) / D, s: l.s,
      vh: innerHeight, inset: SS_INSET });
  })()`.replace(/\s+/g, ' ')));
  await c.nav(BASE + '?fps=0&inset=59,34', 12000);
  const inset = await box();
  ok('insets are read and applied to the design box',
    inset.inset.top === 59 && inset.inset.bottom === 34, JSON.stringify(inset.inset));
  ok('content box clears the notch AND the home indicator',
    inset.top >= 59 && inset.bot <= inset.vh - 34,
    `box ${inset.top.toFixed(1)}..${inset.bot.toFixed(1)} in viewport ${inset.vh}`);
  // and with no insets the arithmetic must be EXACTLY the old centred formula —
  // this is what keeps the fix from quietly moving every desktop layout
  await c.nav(BASE + '?fps=0', 12000);
  const plain = await box();
  const legacy = await c.ev(`(() => { const H = game.scale.height, W = game.scale.width,
    D = W / innerWidth, s = Math.min(W / 420, H / 800);
    return JSON.stringify({ top: (H / 2 - 400 * s) / D, bot: (H / 2 + 400 * s) / D }); })()`);
  const lg = JSON.parse(legacy);
  ok('zero insets reproduce the original layout exactly (no silent reflow)',
    plain.inset.top === 0 && Math.abs(plain.top - lg.top) < 0.01 && Math.abs(plain.bot - lg.bot) < 0.01,
    `now ${plain.top.toFixed(2)}..${plain.bot.toFixed(2)} vs was ${lg.top.toFixed(2)}..${lg.bot.toFixed(2)}`);

  // ---- v0.36.0: THE PHONE REPRO (end to end) ----
  // v0.35.0's verdict only compared two MEASURED numbers, so when Wyatt's
  // iPhone failed to sample WebGL at all it fell through to AUTO and booted
  // the very renderer that had just failed — `gl — · cv 17 ms/f · GL
  // (workload)` at 8 FPS. Deny WebGL here and assert the whole boot chain, not
  // just the decision function, lands on Canvas. (ssProbeRun can't be stubbed:
  // it's a function declaration and game.js calls ssRenderVerdict()
  // synchronously on load. Phaser arrives by assignment, so an accessor
  // installed before any script runs catches it.)
  const deny = await c.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => { let P = null;
      Object.defineProperty(window, 'Phaser', { configurable: true,
        get() { return P; },
        set(v) { P = v;
          if (v && v.Game && !v.__glDenied) { const Real = v.Game;
            v.Game = function (cfg) {
              if (cfg && cfg.type === v.WEBGL) throw new Error('simulated: no WebGL context');
              return new Real(cfg);
            };
            v.Game.prototype = Real.prototype; v.__glDenied = true; } },
      });
      localStorage.removeItem('beta3.raster');
    })()`,
  });
  await c.nav(BASE + '?glprobe=1&fps=1', 13000);
  const ph = JSON.parse(await c.ev(`JSON.stringify({
    rend: game.renderer.type === Phaser.CANVAS ? 'CANVAS' : 'WEBGL',
    mode: window.__ssraster.mode, why: window.__ssraster.why,
    glMs: window.__ssraster.p.glMs, glHow: window.__ssraster.p.glHow, cvMs: window.__ssraster.p.cvMs,
    overlay: ([...document.querySelectorAll('div')].map(d => d.textContent).find(t => /FPS/.test(t)) || '').slice(0, 160),
    shim: !!Phaser.GameObjects.Image.prototype.__ssTintShim,
    scene: game.scene.getScenes(true).map(s => s.scene.key).join(','),
  })`));
  ok('unmeasurable GL + measured CV → the GAME BOOTS CANVAS (the 8 FPS regression)',
    ph.rend === 'CANVAS' && ph.mode === 'cv' && ph.why === 'gl-unmeasurable',
    ph.rend + ' ' + ph.mode + '/' + ph.why + ' gl=' + ph.glMs + '/' + ph.glHow);
  ok('the canvas tint shim comes along on that path', ph.shim && /home|intro/i.test(ph.scene), ph.scene);
  ok('overlay names the failure, not a bare em dash', /—\(0f\)/.test(ph.overlay) && /CV \(gl \w+\)/.test(ph.overlay),
    ph.overlay.replace(/\n/g, ' | '));
  await c.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: deny.identifier });
  await c.ev(`localStorage.removeItem('beta3.raster');'swept'`);
  await c.nav(BASE + '?fps=0', 12000);
  ok('WebGL restored afterwards: a healthy device is untouched by all this',
    await c.ev(`!!window.game && ${PROBED_JS}(window.__ssraster.why)`) === true);

  console.log('\\n' + pass + ' passed, ' + fail + ' failed');
  if (c.errs.length) { console.log('EXCEPTIONS:'); c.errs.slice(0, 5).forEach(e => console.log('  ' + e.split('\\n')[0])); }
  else console.log('zero page exceptions');
  process.exit(fail || c.errs.length ? 1 : 0);
}
main().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
