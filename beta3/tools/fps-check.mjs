// v0.36.1 verification: fps overlay (OPT-IN via ?fps=1), full-DPR law, WORKLOAD probe + renderer
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
    if (d.method === 'Runtime.exceptionThrown')
      errs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
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
  // a canvas scene that lost its tiles/buttons reads 30+
  const bd = gridDiff(dGL.grid, dCV.grid, 16);
  ok('canvas-parity: battle board matches WebGL (grid diff < 14)', bd < 14, bd + ' avg channel diff');

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
