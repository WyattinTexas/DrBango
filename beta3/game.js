'use strict';
/* ============================================================
   STARSPELL — word-roguelite (Corkscrew Games)
   v0.2: Home / Campaign (3 acts) / Quick Play / Daily Hunt with
   share + leaderboards (daily & weekly) / Profile with stats and
   achievements / 10 constellation beasts / 24 tiered sigils / ambient
   music and a heavy coat of star-magic. Versus: next moon.
   ?demo=1 — self-playing solver   ?daily=1 — jump into the Daily
   ============================================================ */

const BUILD = 'STARSPELL v0.57.0';
// Full-DPR back-buffer: capping at 2 left 3x phones upscaling 1.5x — text
// went soft (Runefall's v0.18 blur, same cause). MSAA off at retina instead.
const QS = new URLSearchParams(location.search);
/* ---- back-buffer resolution --------------------------------------------
   Full-DPR always: the v0.32.0 adaptive ladder is DEAD. On-device evidence
   (Wyatt's overlay screenshots) showed dpr1 running 28-49fps — a 9x pixel
   cut bought nothing, so the game is CPU-bound, not fill-rate-bound, and
   the ladder just reload-thrashed the phone down to mush for zero fps.
   ?dpr= stays as a manual probe. The removeItems purge caps the ladder
   stored on phones that ran v0.32.0. */
localStorage.removeItem('beta3.dprCap'); localStorage.removeItem('beta3.dprCapTs');
const DPR = QS.has('dpr')
  ? Math.max(1, Math.min(parseFloat(QS.get('dpr')) || 1, 3))
  : Math.min(window.devicePixelRatio || 1, 3);
const DIAG = (m) => { if (window.SSDIAG) window.SSDIAG(m); };
const DEMO = QS.get('demo') === '1';
// ?lab=1 — the on-device perf bisection lab (lab.js, loaded by index.html only
// under the flag). The lab boots and destroys its own staged Phaser games, so
// the normal boot and the viewport machinery below stand down entirely.
const LAB = QS.get('lab') === '1';

/* ---- workload probe + renderer verdict ---------------------------------
   The v0.33.0 fill-rate probe asked "how fast can this device fill pixels?"
   and the afflicted iPhone answered honestly: very (gl 2212 Mpx/s — the GPU
   is real). Yet the perf lab (v0.34.0, run fxios-…/1786853475034) showed the
   full home scene at 6fps/154ms on WebGL and 59fps on Canvas ON THAT SAME
   PHONE: its iOS WebKit WebGL path collapses with OBJECT COUNT (per-draw /
   GPU-process overhead piling up per content layer), which a fill-rate
   number can never see. So the probe now runs the workload the game actually
   is: ~300 small tinted alpha-blended sprites, a tilesprite, a per-frame
   text, a modest emitter — a handful of real Phaser frames on BOTH real
   renderers at full DPR, near-invisible during boot. Better median frame
   time wins ON THIS DEVICE. No per-browser/UA rules (Safari's Canvas2D may
   genuinely lose; next year's WebKit may flip again) — measure, decide,
   cache 7 days. ?rend=cv / ?rend=gl force either path; ?glprobe=1
   re-measures. Crispness untouched: same resolution either way. */
const SS_REND = { mode: 'auto', why: 'auto', p: null };
window.__ssraster = SS_REND;
function ssProbeScene() {
  return class extends Phaser.Scene {
    constructor() { super('probe'); }
    create() {
      const W = this.scale.width, H = this.scale.height, u = W / 428;
      let t = this.textures.createCanvas('pdot', 16, 16);
      const g = t.context.createRadialGradient(8, 8, 0, 8, 8, 8);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      t.context.fillStyle = g; t.context.fillRect(0, 0, 16, 16); t.refresh();
      t = this.textures.createCanvas('pnoise', 64, 64);   // POT — WebGL1 REPEAT
      const im = t.context.createImageData(64, 64), d = im.data;
      for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      t.context.putImageData(im, 0, 0); t.refresh();
      // ~300 small tinted alpha sprites, a third ADD-blended, a third alpha-
      // tweened — the meadow's composition (stars/aurora/fireflies) in miniature
      for (let i = 0; i < 300; i++) {
        const s = this.add.image(Math.random() * W, Math.random() * H, 'pdot')
          .setScale((0.3 + Math.random() * 0.7) * u).setAlpha(0.08 + Math.random() * 0.3)
          .setTint(SS_STAR_COLORS[i % SS_STAR_COLORS.length]);
        if (i % 3 === 0) s.setBlendMode('ADD');
        if (i % 3 === 1) this.tweens.add({ targets: s, alpha: 0.04, duration: 700 + (i % 7) * 150, yoyo: true, repeat: -1 });
      }
      // one full-screen tilesprite — the game's TileSprite class of work
      this.add.tileSprite(W / 2, H / 2, W, H, 'pnoise').setAlpha(0.05);
      // one text rewritten every frame — score count-ups, countdowns
      const tx = this.add.text(W / 2, H * 0.8, '0', {
        fontFamily: 'Georgia, serif', fontSize: Math.max(12, Math.round(18 * u)) + 'px', color: '#1c2350',
      }).setOrigin(0.5).setAlpha(0.3);
      let n = 0;
      this.events.on('update', () => tx.setText(String(n = (n + 7) % 99999)));
      // one modest steady emitter — the burst machinery, priced at steady state
      this.add.particles(0, 0, 'pdot', {
        x: { min: 0, max: W }, y: -10, quantity: 1, frequency: 90, lifespan: 2400,
        speedY: { min: 40 * u, max: 90 * u }, scale: { start: 0.5 * u, end: 0 },
        alpha: { start: 0.2, end: 0 }, blendMode: 'ADD', tint: 0x2a3355,
      });
      this.game.__pready = true;
    }
  };
}
// boots one throwaway Phaser game on `type`, samples real frame deltas, and
// resolves {ms: median, n: frames, how, gpu} — ms -1 when the renderer failed
// to boot/sample, and `how` says WHICH so the verdict (and the overlay) can
// tell "this renderer is broken" from "this renderer was never tried"
function ssProbeRun(type) {
  // While this window is open, Phaser's async "Cannot create WebGL context"
  // throw is the PROBE failing to sample — a verdict, not a crisis — and
  // compat.js must not paint it at the player (ssBoot closes the window).
  window.__ssProbing = true;
  return new Promise((resolve) => {
    const out = { ms: -1, n: 0, how: 'noboot', gpu: '' };
    const f = [];                                    // sampled frame deltas
    let g = null, fin = false, armed = false, sawBoot = false;
    const finish = () => {
      if (fin) return; fin = true;
      // whatever frames we got by now ARE the answer — a 150ms/frame
      // renderer that only managed 4 samples before the cap still reports
      out.n = f.length;
      if (out.ms < 0 && f.length >= 3) { f.sort((a, b) => a - b); out.ms = +f[f.length >> 1].toFixed(1); }
      // a renderer that cannot boot, or boots but cannot paint three frames
      // inside the failsafe, has told us something decisive — not nothing
      // 'nosample' = it painted, just not 3 frames · 'nocreate' = the renderer
      // came up but building the workload outlasted the failsafe · 'noboot' =
      // no context at all. All three are verdicts against the renderer.
      if (out.how !== 'throw') {
        out.how = out.ms > 0 ? 'ok' : armed ? 'nosample' : sawBoot ? 'nocreate' : 'noboot';
      }
      let gl = null;
      try { gl = g && g.renderer && g.renderer.gl; } catch (e) { }
      const gone = () => {
        try { const ext = gl && gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (e) { }
        // ⚠ strip the probe's styling BEFORE this element can be recycled.
        // Phaser POOLS game canvases: destroy(true) frees this exact <canvas>,
        // and the next Phaser.Game — the real one — is handed the same element
        // back with its inline style intact (verified: same node, style
        // preserved). v0.37.0 shipped that leak to TestFlight. The game wore
        // the probe's `opacity:0.05` and the whole sky came up at 5% over the
        // page's #0a0d1c: Wyatt's phone frame is the browser frame at a
        // best-fit alpha of 0.049, under 1/255 error across 3.5M pixels.
        // `pointer-events:none` rode along too — a dark game is a dead one.
        try { if (g && g.canvas) g.canvas.style.cssText = ''; } catch (e) { }
        try { if (g && g.canvas && g.canvas.parentNode) g.canvas.parentNode.removeChild(g.canvas); } catch (e) { }
        resolve(out);
      };
      if (!g) return gone();
      let done = false; const once = () => { if (!done) { done = true; gone(); } };
      try { g.events.once('destroy', once); g.destroy(true); } catch (e) { once(); }
      setTimeout(once, 500);
    };
    setTimeout(finish, 3000);                        // absolute per-renderer failsafe
    try {
      g = new Phaser.Game({
        type, banner: false,
        width: Math.round(window.innerWidth * DPR), height: Math.round(window.innerHeight * DPR),
        backgroundColor: '#0a0d1c',
        scale: { mode: Phaser.Scale.NONE },
        render: { antialias: type === Phaser.CANVAS ? true : DPR < 2, powerPreference: 'high-performance' },
        scene: [ssProbeScene()],
      });
    } catch (e) { out.how = 'throw'; finish(); return; }
    const arm = () => {
      if (fin) return;
      if (g.isBooted) sawBoot = true;
      if (!g.isBooted || !g.__pready) { setTimeout(arm, 30); return; }
      armed = true;
      try {   // near-invisible: real draws, real compositing, faint on screen
        g.canvas.style.cssText += ';position:fixed;left:0;top:0;opacity:0.05;pointer-events:none;' +
          'width:' + window.innerWidth + 'px;height:' + window.innerHeight + 'px';
      } catch (e) { }
      try {
        const gl = g.renderer && g.renderer.gl;
        if (gl) {
          const dbg = gl.getExtension('WEBGL_debug_renderer_info');
          out.gpu = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER)).slice(0, 48);
        }
      } catch (e) { }
      // the measurement cap starts HERE, not at boot — a slow renderer's 1s
      // boot must not eat the sampling window (the failsafe above still rules)
      setTimeout(finish, 1600);
      let warm = 2;
      const t0 = performance.now();
      const onStep = () => {
        if (warm-- > 0) return;                       // compiles/uploads stay out of the clock
        const d = g.loop.rawDelta;
        if (d > 0 && d < 2000) f.push(d);
        // a handful of frames or ~900ms of sampling, whichever first — a
        // 50ms/frame renderer still yields 12+ frames for a stable median
        if (f.length >= 20 || performance.now() - t0 > 900) {
          try { g.events.off('prestep', onStep); } catch (e) { }
          finish();
        }
      };
      g.events.on('prestep', onStep);
    };
    arm();
  });
}
// the decision itself, pure and testable from two probe results — kept out of
// the async boot chain so the harness can assert every branch without booting
function ssVerdictFrom(gl, cv) {
  const out = {
    v: 4, t: Date.now(), glMs: gl.ms, cvMs: cv.ms, gpu: gl.gpu || '',
    glN: gl.n, cvN: cv.n, glHow: gl.how, cvHow: cv.how,
    why: 'workload', mode: 'auto',
  };
  // canvas must beat WebGL by >10% frame time to unseat it: status-quo bias
  // keeps healthy devices off the shim path and stops coin-flip flip-flops.
  if (gl.ms > 0 && cv.ms > 0 && cv.ms < gl.ms * 0.9) out.mode = 'cv';
  // ⚠ v0.35.0 shipped this branch as "either renderer missing → AUTO", and
  // Wyatt's phone read `gl — · cv 17 ms/f · GL (workload)` at 8fps: its GL
  // probe never painted three frames inside the 3s failsafe, so `gl.ms > 0`
  // was false, the comparison never ran, and AUTO handed the game straight
  // back to the WebGL path the probe had just failed on. A renderer too
  // broken to sample is the STRONGEST evidence against it, not a null
  // result — so a measured renderer always beats an unmeasurable one.
  else if (gl.ms <= 0 && cv.ms > 0) { out.mode = 'cv'; out.why = 'gl-unmeasurable'; }
  else if (cv.ms <= 0 && gl.ms > 0) { out.mode = 'gl'; out.why = 'cv-unmeasurable'; }
  // both unmeasurable → AUTO, and Phaser makes its own fallback as before
  return out;
}
// resolves SS_REND in place (cached / forced: immediately; else ~1-1.5s probe)
function ssRenderVerdict() {
  const q = QS.get('rend');
  if (q === 'cv' || q === 'canvas') { SS_REND.mode = 'cv'; SS_REND.why = 'forced'; return Promise.resolve(SS_REND); }
  if (q === 'gl' || q === 'webgl') { SS_REND.mode = 'gl'; SS_REND.why = 'forced'; return Promise.resolve(SS_REND); }
  if (QS.get('glprobe') !== '1') {
    try {
      const c = JSON.parse(localStorage.getItem('beta3.raster') || 'null');
      // v bump = every device re-probes on next load. REQUIRED this time: the
      // v3 records already cached on real phones hold the bad AUTO verdict for
      // up to 7 days, so shipping the fix without the bump fixes nobody.
      if (c && c.v === 4 && Date.now() - c.t < 7 * 864e5) {
        SS_REND.mode = c.mode; SS_REND.why = c.why; SS_REND.p = c;
        return Promise.resolve(SS_REND);
      }
    } catch (e) { }
  }
  const t0 = performance.now();
  return ssProbeRun(Phaser.WEBGL).then((gl) => ssProbeRun(Phaser.CANVAS).then((cv) => {
    const out = ssVerdictFrom(gl, cv);
    out.probeMs = Math.round(performance.now() - t0);
    try { localStorage.setItem('beta3.raster', JSON.stringify(out)); } catch (e) { }
    SS_REND.mode = out.mode; SS_REND.why = out.why; SS_REND.p = out;
    window.__ssprobeMs = out.probeMs;
    DIAG('workload probe gl ' + gl.ms + '/' + gl.how + ' · cv ' + cv.ms + '/' + cv.how +
      ' ms/f → ' + out.mode + '/' + out.why + ' (' + out.probeMs + 'ms)');
    return SS_REND;
  }));
}

/* Canvas renderer: setTint is a silent no-op (long-standing project rule) —
   under the canvas fallback every tinted image would draw white. Rather than
   bake 38 call sites by hand, patch Image.setTint once: serve a cached
   tint-multiplied copy of the texture (the ssFxTex trick, generalized).
   Same pixel dimensions, so setDisplaySize/setScale consumers are untouched. */
function ssCanvasTintShim() {
  if (!game || !game.renderer || game.renderer.type !== Phaser.CANVAS) return;
  const IP = Phaser.GameObjects.Image.prototype;
  if (IP.__ssTintShim) return;
  IP.__ssTintShim = true;
  const orig = IP.setTint;
  IP.setTint = function (t) {
    orig.call(this, t);
    if (typeof t !== 'number' || t === 0xffffff || arguments.length > 1 || !this.scene) return this;
    try {
      const base = this.__ssBaseTex || this.texture.key;
      const tk = base + '#' + t.toString(16);
      const T = this.scene.textures;
      if (!T.exists(tk)) {
        const src = T.get(base).getSourceImage();
        if (!src || !src.width) return this;
        const ct = T.createCanvas(tk, src.width, src.height);
        const c = ct.context;
        c.drawImage(src, 0, 0);
        c.globalCompositeOperation = 'multiply';
        c.fillStyle = '#' + t.toString(16).padStart(6, '0');
        c.fillRect(0, 0, src.width, src.height);
        c.globalCompositeOperation = 'destination-in';
        c.drawImage(src, 0, 0);
        ct.refresh();
      }
      const dw = this.displayWidth, dh = this.displayHeight;
      this.__ssBaseTex = base;
      this.setTexture(tk);
      this.setDisplaySize(dw, dh);
    } catch (e) { }
    return this;
  };
}

/* ---- frame-time probe (part of ?diag=1) --------------------------------
   The rise and the descent are the game's signature moves and must stay
   silky, so they self-report: start() at motion begin, stop() at motion end,
   and every RAF-to-RAF delta in between is recorded raw (loop.rawDelta, not
   Phaser's smoothed delta — smoothing is exactly what hides a hitch). The
   first recorded delta is split out as `entry`: it covers the game step that
   ran the previous scene's shutdown + this scene's create, which is where
   texture bakes and uploads land. Summaries go to the diag box and pile up
   on window.__ssperf so a headless run can read them programmatically.
   Costs one array push per frame while a flight is live, nothing otherwise. */
const PERF = {
  rec: null,
  // limit: auto-stop after that many frames — for flights with no natural end
  // marker in this scene (the arrival handoff runs in the next scene's create)
  start(label, scene, limit) {
    if (!this.hooked) {
      this.hooked = true;
      const loop = scene.game.loop;
      scene.game.events.on('prestep', () => {
        if (!this.rec) return;
        this.rec.f.push(loop.rawDelta);
        if (this.rec.limit && this.rec.f.length >= this.rec.limit) this.stop();
      });
    }
    this.rec = { label, f: [], limit };
  },
  stop() {
    const r = this.rec;
    this.rec = null;
    if (!r || r.f.length < 3) return;
    // start() runs inside a game step (create or input handler), after that
    // step's prestep fired — so f[0] is the first delta measured AFTER the
    // heavy entry work, i.e. it spans it. That's the shutdown+create frame.
    const entry = r.f[0];
    const flight = r.f.slice(1);
    const n = flight.length, total = flight.reduce((a, b) => a + b, 0);
    const sorted = flight.slice().sort((a, b) => b - a);
    const sum = {
      label: r.label, entryMs: Math.round(entry), frames: n,
      avgMs: +(total / n).toFixed(1),
      worst: sorted.slice(0, 4).map((v) => Math.round(v)),
      over25: flight.filter((v) => v > 25).length,
      over40: flight.filter((v) => v > 40).length,
    };
    (window.__ssperf = window.__ssperf || []).push(sum);
    DIAG('perf ' + sum.label + ': entry ' + sum.entryMs + 'ms · ' + n + 'f avg ' + sum.avgMs +
      ' · worst ' + sum.worst.join('/') + ' · >25ms ' + sum.over25 + ' · >40ms ' + sum.over40);
  },
};
window.SSPERF = PERF;   // the headless perf harness reads/starts probes through this

/* ---- fps overlay + the ladder's detector -------------------------------
   A tiny DOM readout in the top-left (Wyatt's debugging ask): fps, worst
   frame of the last half-second, renderer (GL/CV — a phone screenshot
   instantly tells us if WebGL failed over to Canvas), back-buffer size and
   dpr. DOM, not a Phaser object: zero render cost, survives scene changes.
   OPT-IN as of v0.36.1: ?fps=1 shows it. It was default-ON through the iPhone
   perf saga (v0.32-v0.36) and earned its place — the v0.36.0 verdict bug was
   diagnosed entirely from one screenshot of line 2 — but that investigation is
   closed, and it sat on top of the QUICK PLAY header for every player. The
   measurement machinery below always runs; only the readout is gated. */
/* (v0.37.0's five-tap footer gesture lived here so the readout was reachable
   inside the iOS shell, which loads a fixed URL. It confirmed the TestFlight
   build on 8/19 — 60fps/17ms on the full 1284×2778 dpr3 buffer, CV verdict,
   brightness right — and was removed as promised the same day.) */
let SS_FPS_EL = null;
function ssFpsShow(on) {
  if (on && !SS_FPS_EL) {
    SS_FPS_EL = document.createElement('div');
    SS_FPS_EL.style.cssText = 'position:fixed;left:4px;top:calc(env(safe-area-inset-top,0px) + 4px);' +
      'z-index:40;pointer-events:none;font:600 10px/1.5 ui-monospace,Menlo,monospace;' +
      'color:#7ec96f;background:rgba(6,8,20,.55);padding:2px 7px;border-radius:7px;letter-spacing:.3px;' +
      'white-space:pre-line';
    document.body.appendChild(SS_FPS_EL);
  } else if (!on && SS_FPS_EL) {
    SS_FPS_EL.remove();
    SS_FPS_EL = null;
  }
  return !!SS_FPS_EL;
}
function ssFpsOn() {
  // the gesture's sticky `beta3.fps` is retired with it — purge it, or a phone
  // that toggled the readout on during the TestFlight check keeps it FOREVER
  // with no gesture left to turn it off (Wyatt's phone was in that state)
  try { localStorage.removeItem('beta3.fps'); } catch (e) { }
  return QS.get('fps') === '1';
}
function ssPerfWatch(gm) {
  if (ssFpsOn()) ssFpsShow(true);
  let worst = 0;
  gm.events.on('prestep', () => { const d = gm.loop.rawDelta; if (d > worst) worst = d; });
  // ?prof=1: update-vs-render main-thread split, read on-device from a screenshot
  const PROF = QS.get('prof') === '1';
  let pT = 0, updSum = 0, rendSum = 0, pN = 0;
  if (PROF) {
    gm.events.on('prestep', () => { pT = performance.now(); });
    gm.events.on('poststep', () => { updSum += performance.now() - pT; });
    gm.events.on('prerender', () => { pT = performance.now(); });
    gm.events.on('postrender', () => { rendSum += performance.now() - pT; pN++; });
  }
  // 2nd line: what the workload probe measured + which renderer won and by
  // what ms. On the afflicted phone one screenshot names the verdict outright.
  const P = window.__ssraster || {}, pp = P.p || {};
  const r1 = (v) => (v > 0 ? Math.round(v * 10) / 10 : '—');
  let verdict = 'auto';
  if (P.why === 'forced') verdict = (P.mode === 'cv' ? 'CV' : 'GL') + ' (forced)';
  else if (P.why === 'gl-unmeasurable') verdict = 'CV (gl ' + (pp.glHow || 'failed') + ')';
  else if (P.why === 'cv-unmeasurable') verdict = 'GL (cv ' + (pp.cvHow || 'failed') + ')';
  else if (P.why === 'workload') {
    verdict = P.mode === 'cv'
      ? 'CV (workload' + (pp.glMs > 0 && pp.cvMs > 0 ? ' −' + Math.round((pp.glMs - pp.cvMs) * 10) / 10 + 'ms' : '') + ')'
      : 'GL (workload)';
  }
  // a failed probe prints its frame count, not a bare em dash — one screenshot
  // then distinguishes "never booted" from "booted but painted nothing"
  const pr = (ms, n) => (ms > 0 ? r1(ms) : '—(' + (n || 0) + 'f)');
  const probeLine = (pp.glMs != null ? 'gl ' + pr(pp.glMs, pp.glN) + ' · cv ' + pr(pp.cvMs, pp.cvN) + ' ms/f · ' : '') +
    verdict + (pp.gpu ? ' · ' + pp.gpu.slice(0, 30) : '');
  setInterval(() => {
    const fps = Math.round(gm.loop.actualFps);
    const el = SS_FPS_EL;
    if (el) {
      el.style.color = fps >= 50 ? '#7ec96f' : fps >= 30 ? '#e6c229' : '#e74c3c';
      let txt = fps + ' FPS · ' + Math.round(worst) + 'ms · ' +
        (gm.renderer.type === Phaser.WEBGL ? 'GL ' : 'CV ') +
        gm.scale.width + '×' + gm.scale.height + ' · dpr' + (Math.round(DPR * 10) / 10);
      if (PROF && pN > 0) { txt += '\nupd ' + (updSum / pN).toFixed(1) + ' · draw ' + (rendSum / pN).toFixed(1) + 'ms'; updSum = rendSum = 0; pN = 0; }
      txt += '\n' + probeLine;
      el.textContent = txt;
    }
    worst = 0;
  }, 500);
}

/* ---- painted art (buttons + letter tiles + meadow plate), DEFAULT ON -----
   Everything else in this game is drawn to canvas at boot; these five files
   are the only downloaded images (webp, ~230 KB total — the PNGs were 1.5 MB,
   which is why default-on waited for the conversion). Buttons/tiles swap in
   at texture-build time under the SAME texture keys, so nothing downstream
   changes; the meadow is a landscape plate ssSkyWorld lays over the
   procedural ground. If any file fails, is slow, or the browser predates
   webp, ART stays off and the procedural art draws as before — and ?art=0
   forces that fallback for debugging. */
const ART = QS.get('art') !== '0';
const SSART = { ready: false, img: {} };
// sign-card art that ships (art/zod_<id>.webp) — see ssZodArtKey; empty until
// Wyatt's MJ set lands, one id per line then
const SS_ZOD_ART = [];
function ssLoadArt() {
  const names = ['btn', 'btndark', 'tile_face', 'tile_over', 'meadow'];
  // the sign cards' art rides the same fetch, but is never required: a missing
  // plate falls back to the asterism, and never turns the whole set off
  const zod = SS_ZOD_ART.map((id) => 'zod_' + id);
  zod.forEach((n) => { const im = new Image(); im.onload = () => { SSART.img[n] = im; }; im.src = 'art/' + n + '.webp?v=' + encodeURIComponent(BUILD); });
  return Promise.all(names.map((n) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { SSART.img[n] = im; res(true); };
    im.onerror = () => { DIAG('art MISSING ' + n); res(false); };
    im.src = 'art/' + n + '.webp?v=' + encodeURIComponent(BUILD);
  }))).then((r) => { SSART.ready = r.every(Boolean); DIAG('art ' + (SSART.ready ? 'loaded' : 'FAILED — procedural')); });
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

// seeded RNG (mulberry32); reseeded per run — daily runs share a date seed
let _seed = Math.floor(Math.random() * 1e9);
function setSeed(s) { _seed = s | 0; }
function rng() {
  _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rpick = (arr) => arr[Math.floor(rng() * arr.length)];

/* The active gameplay pack (bag, point values, vowels, dictionary) — see
   packs.js. Solo battles use the player's own language; a versus battle uses
   the ROOM's language so both duelists deal from one bag against one
   dictionary. ssUsePack flips all four globals together and falls back to
   English as a unit if a pack's dictionary isn't resident (solo can't hit
   that — SS_DICT.boot loads it synchronously — only a failed versus fetch). */
let PACK, WORDSET, VALS, BAG, VOWELS;
function ssUsePack(lang) {
  const ok = SS_PACKS[lang] && SS_DICT.ready(lang);
  PACK = ok ? SS_PACKS[lang] : SS_PACKS.en;
  WORDSET = SS_DICT.set(PACK.lang);
  VALS = PACK.vals; BAG = ssBagArr(PACK); VOWELS = PACK.vowels;
}
ssUsePack(ssGameLang());
const LEN_MULT = [0, 0, 0.6, 1, 1.15, 1.35, 1.6, 1.9, 2.3];
// THE DEW TILE (Wyatt, 8/26): the forged family's third member — orange +6,
// blue x1.5, GREEN heals. A beast's strike leaves dew on one plain tile; it
// heals DEW_HEAL when it rides the very next cast (use it or lose it, same
// sweep as the others), still scoring its letter for damage. Not in versus.
const DEW_HEAL = 6;      // the dial: hp restored per green tile in a cast word
const DEW_CHANCE = 1.0;  // the dial: odds a landed strike leaves a dew tile
const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

/* ============================================================
   Profile, stats, achievements (local-first; best-effort sync)
   ============================================================ */
/* THE LANTERN'S LAW — the two numbers the streak rules turn on. They live
   here rather than down in the streak section because SS.load() runs during
   module evaluation and a `const` further down the file is still in its dead
   zone at that moment.
   GRACE_EARN: nights hunted to walk a spent grace back. MILESTONES: the marks
   at which the lantern itself grows (ember → true lantern → comet-crowned). */
const SS_GRACE_EARN = 5;
const SS_MILESTONES = [7, 30, 100];
const SS_MS_ACH = { 7: 'flame-7', 30: 'flame-30', 100: 'flame-100' };

const SS = {
  prof: null,
  load() {
    try { this.prof = JSON.parse(localStorage.getItem('beta3.profile')) || {}; } catch (e) { this.prof = {}; }
    const p = this.prof;
    p.runs = p.runs | 0; p.wins = p.wins | 0; p.words = p.words | 0; p.beasts = p.beasts | 0;
    p.longest = p.longest || ''; p.bigHit = p.bigHit | 0; p.bestQuick = p.bestQuick | 0;
    p.bestCampaign = p.bestCampaign | 0;
    p.vsWords = p.vsWords | 0; p.vsWins = p.vsWins | 0;
    p.daily = p.daily || {}; p.ach = p.ach || {};
    p.signs = p.signs || {};   // per-zodiac campaign records: id → {best, clears, runs}
    // star rating: every profile that predates it starts at the baseline
    p.rating = Number.isFinite(p.rating) ? Math.round(p.rating) : 1000;
    p.rhide = !!p.rhide;                                   // veil my rating from others
    p.rday = (p.rday && typeof p.rday === 'object') ? p.rday : { d: 0, g: 0 };   // PvE daily-cap ledger
    /* THE STREAK — consecutive days on which the daily hunt was run.
       Stored as {n, last, best}, never a bare number: `last` is the day key
       that was counted, so the CURRENT streak is always derivable from today
       (a number alone can't tell a live streak from a cold one), and a later
       grace night can forgive a one-day gap by reading the same two fields.
       No migration will be needed for it — only new rules. */
    if (!p.streak || typeof p.streak !== 'object') {
      // Profiles that predate the lantern seed from the score log they already
      // kept: those days genuinely were hunted, and the daily sheet has been
      // showing that very number since v0.19.0. Starting everyone at zero
      // would take something away that the game already granted.
      const seed = ssSeedStreak(p);
      p.streak = { n: seed.n, last: seed.last, best: seed.n };
    }
    p.streak.n = Math.max(0, p.streak.n | 0);
    p.streak.last = p.streak.last | 0;
    p.streak.best = Math.max(p.streak.best | 0, p.streak.n);
    /* THE GRACE NIGHT (v0.40.0) — one safety net, and never more than one.
       `g` is whether it is in hand, `gp` how many nights of the five that
       re-earn a spent one are already walked, `gd` the day keys a grace has
       actually bridged (the week strip draws its ◌ rings from these, so it
       keeps a fortnight and no more). Everyone alive when this shipped — and
       every player who ever starts fresh — wakes holding one: the net is
       generous on day one, but it is still only ever ONE.
       `mk` is the highest mark this run of the streak has already celebrated,
       so a crossing rings once; `pend` is a mark that has been earned but not
       yet honoured on the meadow (the ceremony survives an app that was
       closed on the end screen). */
    if (typeof p.streak.g !== 'number') { p.streak.g = 1; p.streak.gp = 0; }
    p.streak.g = clamp(p.streak.g | 0, 0, 1);
    p.streak.gp = clamp(p.streak.gp | 0, 0, SS_GRACE_EARN);
    p.streak.gd = Array.isArray(p.streak.gd) ? p.streak.gd.map((k) => k | 0).filter((k) => k > 0).slice(-14) : [];
    p.streak.pend = p.streak.pend | 0;
    // marks already passed are seeded, not re-run: a profile arriving with a
    // 40-night flame must not be told "SEVEN NIGHTS" on its next hunt
    if (typeof p.streak.mk !== 'number') {
      p.streak.mk = SS_MILESTONES.reduce((a, m) => (p.streak.n >= m ? m : a), 0);
    }
    p.streak.mk = p.streak.mk | 0;
    /* THE SIGIL DRIP (v0.42.0) — see ssSigilCheck & co. The `sig` object is
       created exactly once, and creating it is also the moment the
       grandfather decision is made and written down: a profile with ANY prior
       play recorded takes all twenty-four with it, a genuinely empty one
       enters the drip with the open twelve. Saved on the spot, so the
       decision cannot be re-made against a profile the session has since
       changed. */
    if (!p.sig || typeof p.sig !== 'object') {
      p.sig = { u: {}, c: {}, pend: [] };
      if (ssSigilPlayedBefore(p)) {
        for (const sg of SS_SIGILS) if (sg.lock) p.sig.u[sg.id] = 1;
        p.sig.gf = 1;
      }
      this.save();
    }
    p.sig.u = (p.sig.u && typeof p.sig.u === 'object') ? p.sig.u : {};
    p.sig.c = (p.sig.c && typeof p.sig.c === 'object') ? p.sig.c : {};
    p.sig.pend = Array.isArray(p.sig.pend) ? p.sig.pend.filter((id) => !!SS_SIG_BY[id]) : [];
    return p;
  },
  save() { try { localStorage.setItem('beta3.profile', JSON.stringify(this.prof)); } catch (e) { } },
  sync() {
    SSNET.syncProfile({
      runs: this.prof.runs, wins: this.prof.wins, words: this.prof.words, beasts: this.prof.beasts,
      longest: this.prof.longest, bigHit: this.prof.bigHit, bestQuick: this.prof.bestQuick,
      vsWins: this.prof.vsWins,
      achCount: Object.keys(this.prof.ach).length,
      rating: this.prof.rating, rhide: this.prof.rhide ? 1 : 0,
      // the flame rides along with the rest of the profile: `streakDay` is the
      // day key it was last fed, so the number can be read back honestly (a
      // bare count would say nothing about whether it is still burning)
      streak: this.prof.streak.n, streakDay: this.prof.streak.last, streakBest: this.prof.streak.best,
      // the grace in hand and the highest mark reached ride along too, so a
      // read of the synced profile tells the whole lantern, not half of it
      streakGrace: this.prof.streak.g, streakMark: this.prof.streak.mk,
    });
  },
  has(id) { return !!this.prof.ach[id]; },
  award(id, game) {
    if (this.prof.ach[id]) return;
    this.prof.ach[id] = Date.now();
    this.save();
    const def = SS_ACH.find((a) => a.id === id);
    if (def && game) game.events.emit('ss-ach', def);
    if (SFX.ok) SFX.ach();
  },
};
SS.load();

/* ---- the star rating: one number for how well you weave ------------------
   Baseline 1000, hard floor 600 — a new player can never be beaten into the
   ground. Versus moves it Elo-style: expected-score math at K=32, so felling
   a higher-rated rival pays big, farming a lower one pays little, and losses
   mirror. Solo play only ever RAISES it — wins and mighty words pay a pinch
   that diminishes to nothing as the rating climbs toward PVE_SOFT and is
   capped per UTC day, so grinding beasts can seed a rating but never inflate
   one past what versus play supports. Mutates SS.prof only; every call site
   already rides an SS.save()/SS.sync() moments later. */
const SS_RATING = {
  BASE: 1000, FLOOR: 600, K: 32, PVE_DAY_CAP: 30, PVE_SOFT: 1250,
  expected(mine, opp) { return 1 / (1 + Math.pow(10, (opp - mine) / 400)); },
  // versus: standard Elo against the rival (or the field's average). score is
  // 1 for a win, 0 for a loss. Returns the applied delta (floor-aware).
  duel(opp, score) {
    return this.apply(Math.round(this.K * (score - this.expected(SS.prof.rating, opp))));
  },
  // solo: never negative, diminishing above BASE, capped per day
  pve(base) {
    const p = SS.prof, today = SSNET.dayKey();
    if (!p.rday || p.rday.d !== today) p.rday = { d: today, g: 0 };
    const scale = clamp((this.PVE_SOFT - p.rating) / (this.PVE_SOFT - this.BASE), 0, 1);
    const d = Math.min(Math.ceil(base * scale), Math.max(0, this.PVE_DAY_CAP - p.rday.g));
    if (d <= 0) return 0;
    p.rday.g += d;
    return this.apply(d);
  },
  apply(d) {
    const p = SS.prof, before = p.rating;
    p.rating = Math.max(this.FLOOR, Math.round(p.rating + d));
    return p.rating - before;
  },
};
// the star-classes: named tiers at thresholds so the number has flavor.
// min is inclusive; baseline 1000 wakes as a RISING STAR.
const SS_RATING_TIERS = [
  { min: 0, key: 'rt0', glyph: '✧', color: '#8a94c4', tint: 0x8a94c4 },
  { min: 850, key: 'rt1', glyph: '✦', color: '#e8a87f', tint: 0xe8a87f },
  { min: 1000, key: 'rt2', glyph: '✦', color: '#cfd8ff', tint: 0xcfd8ff },
  { min: 1150, key: 'rt3', glyph: '✦', color: '#ffd77a', tint: 0xffd77a },
  { min: 1300, key: 'rt4', glyph: '★', color: '#ffe9a8', tint: 0xffe9a8 },
  { min: 1450, key: 'rt5', glyph: '★', color: '#9fe8ff', tint: 0x9fe8ff },
  { min: 1600, key: 'rt6', glyph: '✸', color: '#fff6d8', tint: 0xfff6d8 },
];
function ssRatingTier(r) { let t = SS_RATING_TIERS[0]; for (const x of SS_RATING_TIERS) if (r >= x.min) t = x; return t; }

/* ============================================================
   Shared drawing helpers (textures + constellation rendering)
   ============================================================ */
// Texture crispness factor: box art (buttons, tiles, panels) is authored in a
// small design-space canvas; on retina the upscale smeared every edge. Draw
// those canvases at R x and let setDisplaySize map them 1:1-ish to device px.
function ssTexRes(scene) {
  return Math.min(Math.max(Math.min(scene.scale.width / 420, scene.scale.height / 800), 1), 3);
}
// The device's texture ceiling (WebGL MAX_TEXTURE_SIZE), cached once. An
// upload past it silently white-boxes on WebGL1 — the two mk() factories
// clamp against it defensively. Nothing today comes near (largest bake
// ~1.3k px vs a 4096 floor on any real GPU), so the clamp is pure armor:
// when it never fires, output is byte-identical.
let SS_MAXTEX = 0;
function ssMaxTex(scene) {
  if (!SS_MAXTEX) {
    try {
      const gl = scene.game.renderer.gl;
      SS_MAXTEX = (gl && gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 8192;
    } catch (e) { SS_MAXTEX = 8192; }
    SS_MAXTEX = Math.max(2048, SS_MAXTEX | 0);
  }
  return SS_MAXTEX;
}
/* Run one texture painter on its canvas, and never ship half a picture.
   Phaser registers the key the moment createCanvas returns, so a painter
   that throws partway (a canvas API the phone's WebKit lacks — roundRect is
   polyfilled in compat.js precisely because iOS 15 has none) used to leave a
   registered texture with whatever was drawn before the throw, and every
   bake queued after it never ran at all: one bad line, silently, and the
   meadow wears it. Now the canvas is wiped, the fallback painter (if the
   bake offers one) draws a plain stand-in, the DIAG names the key, and the
   factory carries on to the next texture. `window.__ssBakeFail` counts them
   for the harness. */
function ssBake(t, key, w, h, fn, fb) {
  const c = t.context;
  // the factory's resolution scale, so the fallback paints in the same units
  const base = c.getTransform ? c.getTransform() : null;
  try { fn(c, w, h); }
  catch (e) {
    const m = key + ' · ' + ((e && e.message) || e);
    DIAG('bake failed: ' + m);
    (window.__ssBakeFail = window.__ssBakeFail || []).push(m);
    try {
      // a painter that threw after save()/translate()/clip()/'lighter' left
      // all of it on the context; restore() past the stack is a no-op
      for (let i = 0; i < 16; i++) c.restore();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.setLineDash([]);
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height);
      if (base) c.setTransform(base);
      if (fb) fb(c, w, h);
    } catch (e2) { DIAG('bake fallback failed: ' + key + ' · ' + ((e2 && e2.message) || e2)); }
  }
  t.refresh();
}
function ssMakeTextures(scene) {
  const R = ssTexRes(scene);
  const ARTON = ART && SSART.ready;
  const mk = (key, w, h, fn, r, fb) => {
    if (scene.textures.exists(key)) return;
    r = r || 1;
    const cap = Math.min(1, ssMaxTex(scene) / Math.max(w * r, h * r));
    const t = scene.textures.createCanvas(key, Math.round(w * r * cap), Math.round(h * r * cap));
    t.context.scale(r * cap, r * cap);
    ssBake(t, key, w, h, fn, fb);
  };
  mk('dot', 16, 16, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  mk('glowbig', 256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.8)'); g.addColorStop(0.55, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const tileTex = (key, top, bottom, edge) => mk(key, 128, 128, (c) => {
    const r = 24;
    c.beginPath(); c.roundRect(6, 6, 116, 116, r);
    const g = c.createLinearGradient(0, 6, 0, 122);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = edge; c.stroke();
    c.beginPath(); c.roundRect(12, 11, 104, 30, 16);
    const g2 = c.createLinearGradient(0, 11, 0, 41);
    g2.addColorStop(0, 'rgba(255,255,255,0.5)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g2; c.fill();
    c.beginPath(); c.roundRect(10, 92, 108, 28, 14);
    const g3 = c.createLinearGradient(0, 92, 0, 120);
    g3.addColorStop(0, 'rgba(0,0,0,0)'); g3.addColorStop(1, 'rgba(60,40,10,0.22)');
    c.fillStyle = g3; c.fill();
  }, R);
  // Painted tiles: one neutral glass face multiplied by the tier colour, with the gold rim
  // composited on top untinted — a straight setTint would colour the rim too, and tint is a
  // silent no-op under the Canvas renderer (the game boots Phaser.AUTO). Adding a bonus
  // colour stays one line, same as the procedural path below.
  // The 6px inset matches the procedural tile's roundRect(6,6,116,116): board and word-line
  // gaps were tuned against that ~5% breathing room, and a full-bleed painted tile ate it —
  // the board rows and the staged word visibly overlapped.
  const tileArt = (key, color) => mk(key, 128, 128, (c, w, h) => {
    const f = SSART.img.tile_face, o = SSART.img.tile_over;
    c.drawImage(f, 6, 6, w - 12, h - 12);
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = color; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'destination-in';   // multiply floods the box; restore alpha
    c.drawImage(f, 6, 6, w - 12, h - 12);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(o, 6, 6, w - 12, h - 12);
  }, R);
  if (ARTON) {
    tileArt('tile0', '#e2deec');   // plain
    tileArt('tile1', '#ffcd6e');   // +6 value
    tileArt('tile2', '#96d7ff');   // 1.5x word
    tileArt('tile3', '#b4e698');   // dew — heals on the next cast
    tileArt('tileblk', '#494263'); // blackout curse — the void face
  } else {
    tileTex('tile0', '#f7f1e2', '#dfd3b8', '#b8a67f');
    tileTex('tile1', '#ffe9a8', '#e8b84b', '#a97c1c');
    tileTex('tile2', '#e6f6ff', '#a8d9f2', '#5f9fc4');
    tileTex('tile3', '#e9f8dc', '#a8e08a', '#5f9a48');
    tileTex('tileblk', '#453f63', '#28233f', '#6b5fa8');
  }
  mk('veil', 8, 8, (c, w, h) => { c.fillStyle = '#060812'; c.fillRect(0, 0, w, h); });
  // battle chrome, in the wordmark's dress: a ribbon behind the strikes line and
  // framed troughs + gradient fills for the health bars (progress = setCrop)
  mk('ribbon', 256, 40, (c, w, h) => {
    c.beginPath(); c.roundRect(2, 2, w - 4, h - 4, (h - 4) / 2);
    c.fillStyle = 'rgba(16,12,34,0.62)'; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(215,180,92,0.40)'; c.stroke();
  }, R);
  mk('bartrough', 256, 24, (c, w, h) => {
    c.beginPath(); c.roundRect(1, 1, w - 2, h - 2, (h - 2) / 2);
    c.fillStyle = '#10142a'; c.fill();
    const g = c.createLinearGradient(0, 1, 0, h * 0.5);            // inner top shadow
    g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(215,180,92,0.5)'; c.stroke();
  }, R);
  const barFill = (key, top, bottom) => mk(key, 256, 16, (c, w, h) => {
    c.beginPath(); c.roundRect(0, 0, w, h, h / 2);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    c.fillStyle = g; c.fill();
    c.beginPath(); c.roundRect(3, 1.5, w - 6, h * 0.4, h * 0.2);   // top sheen
    const g2 = c.createLinearGradient(0, 0, 0, h * 0.45);
    g2.addColorStop(0, 'rgba(255,255,255,0.45)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g2; c.fill();
  }, R);
  barFill('barfill-gold', '#ffe08d', '#b9924a');
  barFill('barfill-rose', '#f2969b', '#b34d55');
  // End-of-run window: midnight glass in a double gold frame. Drawn at the
  // display aspect (~372x580) so the corners stay true when stretched.
  mk('endpanel', 186, 290, (c, w, h) => {
    c.beginPath(); c.roundRect(2.5, 2.5, w - 5, h - 5, 13);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#161d3e'); g.addColorStop(0.5, '#0f142c'); g.addColorStop(1, '#0b0f21');
    c.fillStyle = g; c.fill();
    c.lineWidth = 1.8; c.strokeStyle = '#c9a84c'; c.stroke();
    c.beginPath(); c.roundRect(6, 6, w - 12, h - 12, 10);
    c.lineWidth = 0.7; c.strokeStyle = 'rgba(215,180,92,0.45)'; c.stroke();
    const g2 = c.createLinearGradient(0, 2.5, 0, 46);      // faint starlight sheen
    g2.addColorStop(0, 'rgba(159,176,232,0.11)'); g2.addColorStop(1, 'rgba(159,176,232,0)');
    c.beginPath(); c.roundRect(2.5, 2.5, w - 5, h - 5, 13); c.fillStyle = g2; c.fill();
  }, R);
  // the daily herald's chip — a small crimson pill with an ember rim, up in
  // the home screen's corner where notifications live
  mk('chipred', 128, 32, (c, w, h) => {
    c.beginPath(); c.roundRect(1.5, 1.5, w - 3, h - 3, (h - 3) / 2);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#a32433'); g.addColorStop(0.55, '#7c1626'); g.addColorStop(1, '#570e1b');
    c.fillStyle = g; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,138,110,0.6)'; c.stroke();
    c.beginPath(); c.roundRect(6, 3.5, w - 12, h * 0.4, h * 0.22);
    const g2 = c.createLinearGradient(0, 3, 0, h * 0.5);
    g2.addColorStop(0, 'rgba(255,255,255,0.28)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g2; c.fill();
  }, R);
  /* THE STREAK LANTERN — the little iron-and-glass lamp that stands beside the
     daily herald and carries the number of nights. FIVE baked textures rather
     than one tinted image, because setTint is a silent no-op under the Canvas
     renderer and the game boots either:

       tier -1  cold          no streak — dark glass, dull iron
       tier  0  lit           two nights and up — warm pane, ember bloom
       tier  1  ember         SEVEN nights — embers drift up off the glass
       tier  2  true lantern  THIRTY nights — gilded filigree, white-hot core,
                              light spilling out in rays
       tier  3  comet-crowned ONE HUNDRED nights — a comet arcs over the whole
                              lamp, trailing sparks

     The canvas is 60x84 for every tier and the lamp body itself is drawn into
     the same 44x62 box at (8, 22) it always occupied — the extra margin exists
     purely so the crowns have air to live in. Consumers display at 35x49,
     which puts the lamp back at exactly the 26x36 it has been since v0.39.0.
     No new art files: everything here is baked, like the rest of the game. */
  const lantern = (key, tier) => mk(key, 60, 84, (c, W, H) => {
    const lit = tier >= 0;
    c.save();
    c.translate(8, 22);                       // …into the original 44x62 box
    const w = 44, h = 62;
    // the iron warms as the flame grows: pewter cold, brass lit, pale gold at
    // the marks. The cold pewter is deliberately pale: the lamp is 26x36 on a
    // phone, against a dusk sky, and dark iron there simply disappears.
    const iron = ['#8d96bd', '#c9a84c', '#d8b955', '#eccb6c', '#f6e08e'][tier + 1];
    const irons = ['#4d5680', '#8a6a22', '#9b7826', '#b08c2e', '#c9a84c'][tier + 1];
    // the ring and the hook it hangs from
    c.lineWidth = 2.4; c.strokeStyle = iron;
    c.beginPath(); c.arc(w / 2, 8, 4.6, Math.PI * 0.15, Math.PI * 0.85, true); c.stroke();
    c.beginPath(); c.moveTo(w / 2 - 9, 15); c.lineTo(w / 2 + 9, 15); c.stroke();
    // the cap
    c.beginPath(); c.moveTo(w / 2 - 13, 20); c.lineTo(w / 2 + 13, 20); c.lineTo(w / 2 + 9, 14.5);
    c.lineTo(w / 2 - 9, 14.5); c.closePath();
    c.fillStyle = iron; c.fill();
    // the glass: a tall pane between two posts
    const gx = w / 2 - 12, gw = 24, gy = 20, gh = 30;
    c.beginPath(); c.roundRect(gx, gy, gw, gh, 3.5);
    if (lit) {
      const g = c.createLinearGradient(0, gy, 0, gy + gh);
      // each mark burns a shade whiter at the top — the same flame, fed longer
      g.addColorStop(0, ['#fff0b8', '#fff6d2', '#fffdf0', '#ffffff'][tier]);
      g.addColorStop(0.45, ['#ffb547', '#ffc45e', '#ffd980', '#ffe9a8'][tier]);
      g.addColorStop(1, ['#e0761f', '#e88a26', '#f0a032', '#f6b648'][tier]);
      c.fillStyle = g;
    } else {
      const g = c.createLinearGradient(0, gy, 0, gy + gh);
      g.addColorStop(0, '#1b2140'); g.addColorStop(1, '#101534');
      c.fillStyle = g;
    }
    c.fill();
    if (!lit) {                                         // a cold pane is still GLASS: one slant of sky on it
      c.save();
      c.beginPath(); c.roundRect(gx, gy, gw, gh, 3.5); c.clip();
      c.beginPath(); c.moveTo(gx + 3, gy); c.lineTo(gx + 10, gy); c.lineTo(gx + 3, gy + gh); c.lineTo(gx, gy + gh); c.closePath();
      c.fillStyle = 'rgba(150,170,230,0.22)'; c.fill();
      c.beginPath(); c.moveTo(gx + 13, gy); c.lineTo(gx + 16, gy); c.lineTo(gx + 9, gy + gh); c.lineTo(gx + 6, gy + gh); c.closePath();
      c.fillStyle = 'rgba(150,170,230,0.1)'; c.fill();
      c.restore();
    }
    if (lit) {                                          // the flame's bloom inside the pane
      const b = c.createRadialGradient(w / 2, gy + gh * 0.62, 1, w / 2, gy + gh * 0.62, 15);
      b.addColorStop(0, 'rgba(255,255,235,0.95)');
      b.addColorStop(0.5, 'rgba(255,196,96,' + (0.45 + tier * 0.09) + ')');
      b.addColorStop(1, 'rgba(255,150,60,0)');
      c.beginPath(); c.roundRect(gx, gy, gw, gh, 3.5); c.fillStyle = b; c.fill();
    }
    c.lineWidth = 2; c.strokeStyle = iron;
    c.beginPath(); c.roundRect(gx, gy, gw, gh, 3.5); c.stroke();
    c.lineWidth = 1.6; c.strokeStyle = irons;           // corner posts
    c.beginPath(); c.moveTo(gx + 1.2, gy + 1); c.lineTo(gx + 1.2, gy + gh - 1); c.stroke();
    c.beginPath(); c.moveTo(gx + gw - 1.2, gy + 1); c.lineTo(gx + gw - 1.2, gy + gh - 1); c.stroke();
    // the base
    c.beginPath(); c.moveTo(w / 2 - 14, 56); c.lineTo(w / 2 + 14, 56); c.lineTo(w / 2 + 10, 49.5);
    c.lineTo(w / 2 - 10, 49.5); c.closePath();
    c.fillStyle = iron; c.fill();
    // ---- tier 2+: gilded filigree on cap and base, and the light gets out ----
    if (tier >= 2) {
      c.lineWidth = 1.2; c.strokeStyle = '#ffe9a8';
      for (const [cy, dir] of [[17.5, 1], [52.5, -1]]) {
        c.beginPath();
        c.moveTo(w / 2 - 15, cy); c.quadraticCurveTo(w / 2 - 7, cy + dir * 3.4, w / 2, cy);
        c.quadraticCurveTo(w / 2 + 7, cy + dir * 3.4, w / 2 + 15, cy);
        c.stroke();
      }
      c.save();                                          // rays of spilled light
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(255,214,132,0.4)'; c.lineWidth = 1.6;
      for (const a of [-0.62, -0.24, 0.24, 0.62]) {
        const dx = Math.sin(a), dy = Math.cos(a);
        c.beginPath();
        c.moveTo(w / 2 + dx * 15, gy + gh * 0.55 + dy * 2);
        c.lineTo(w / 2 + dx * 27, gy + gh * 0.55 + dy * 13);
        c.stroke();
      }
      c.restore();
    }
    c.restore();
    /* ---- tier 1+: the lamp throws EMBERS ----
       The first mark's whole job is to be legible at 26x36 in the corner of a
       phone. A flame tuft on the cap was tried and failed: at that size it sat
       inside the hanging ring and read as a smudge. Embers drifting up out of
       the crown margin change the lamp's SILHOUETTE, which is the only thing
       that survives being small. */
    if (tier >= 1) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const motes = [[-11, 14, 3.2, 0.85], [9, 8.5, 2.6, 0.7], [1.5, 2.8, 2.1, 0.5], [13.5, 17.5, 1.8, 0.45]];
      for (const [dx, my, r, a] of motes.slice(0, tier >= 2 ? 4 : 3)) {
        const ex = W / 2 + dx;
        const g = c.createRadialGradient(ex, my, 0.2, ex, my, r);
        g.addColorStop(0, 'rgba(255,255,236,' + a + ')');
        g.addColorStop(0.42, 'rgba(255,196,96,' + (a * 0.62) + ')');
        g.addColorStop(1, 'rgba(255,140,50,0)');
        c.beginPath(); c.arc(ex, my, r, 0, Math.PI * 2); c.fillStyle = g; c.fill();
      }
      c.restore();
    }
    // ---- tier 3: the comet crown, arcing over the whole lamp ----
    if (tier >= 3) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      // the tail: an arc that thins and fades as it sweeps back to the left
      for (let i = 0; i < 26; i++) {
        const t = i / 25;
        const a = Math.PI * (1.06 - t * 0.62);           // left-to-right over the cap
        const rx = 26, ry = 15;
        const x = W / 2 + Math.cos(a) * rx, y = 27 + -Math.sin(a) * ry;
        c.beginPath();
        c.arc(x, y, 0.5 + t * 1.9, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,' + Math.round(214 + t * 34) + ',' + Math.round(120 + t * 110) + ',' + (0.06 + t * 0.62) + ')';
        c.fill();
      }
      // the head, with its own little bloom
      const hx = W / 2 + Math.cos(Math.PI * 0.44) * 26, hy = 27 - Math.sin(Math.PI * 0.44) * 15;
      const hg = c.createRadialGradient(hx, hy, 0.4, hx, hy, 6.5);
      hg.addColorStop(0, 'rgba(255,255,255,1)'); hg.addColorStop(0.42, 'rgba(255,236,168,0.75)');
      hg.addColorStop(1, 'rgba(255,190,90,0)');
      c.beginPath(); c.arc(hx, hy, 6.5, 0, Math.PI * 2); c.fillStyle = hg; c.fill();
      c.restore();
    }
  }, R, (c, W) => {
    // the stand-in, should the painter above throw: straight lines only —
    // a ring, cap, pane and base in the tier's colours, no gradients, no
    // roundRect, nothing newer than the first canvas spec. A lamp, still.
    const lit = tier >= 0, x = W / 2;
    const iron = ['#8d96bd', '#c9a84c', '#d8b955', '#eccb6c', '#f6e08e'][tier + 1];
    c.lineWidth = 2.4; c.strokeStyle = iron;
    c.beginPath(); c.arc(x, 30, 4.6, Math.PI * 0.15, Math.PI * 0.85, true); c.stroke();
    c.fillStyle = iron; c.fillRect(x - 13, 36.5, 26, 5.5);
    c.fillStyle = lit ? ['#ffb547', '#ffc45e', '#ffd070', '#ffd980'][tier] : '#151a3a';
    c.fillRect(x - 12, 42, 24, 30);
    c.strokeStyle = iron; c.lineWidth = 2; c.strokeRect(x - 12, 42, 24, 30);
    c.fillStyle = iron; c.fillRect(x - 14, 71.5, 28, 6.5);
  });
  lantern('lantern-cold', -1);
  lantern('lantern-lit', 0);
  lantern('lantern-m1', 1);
  lantern('lantern-m2', 2);
  lantern('lantern-m3', 3);
  mk('panel', 256, 256, (c) => {
    c.beginPath(); c.roundRect(4, 4, 248, 248, 22);
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#f8f2e4'); g.addColorStop(1, '#e4d7ba');
    c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#a98d51'; c.stroke();
    c.lineWidth = 1.5; c.strokeStyle = '#ffffffaa';
    c.beginPath(); c.roundRect(8, 8, 240, 240, 18); c.stroke();
  }, R);
  // Painted buttons are authored 627x344, so the slot is 256x140 rather than the procedural
  // 256x96 — that keeps the frame's vertical detail instead of pre-squashing it. Actual
  // button consumers go through ssBtn(), which bakes an aspect-correct 9-slice per display
  // size; this base texture remains for anything that grabs 'btn' directly.
  if (ARTON) {
    mk('btn', 256, 140, (c, w, h) => { c.drawImage(SSART.img.btn, 0, 0, w, h); }, R);
    mk('btndark', 256, 140, (c, w, h) => { c.drawImage(SSART.img.btndark, 0, 0, w, h); }, R);
  } else {
    mk('btn', 256, 96, (c) => {
      c.beginPath(); c.roundRect(4, 4, 248, 88, 46);
      const g = c.createLinearGradient(0, 4, 0, 92);
      g.addColorStop(0, '#ffdf8f'); g.addColorStop(0.5, '#f0b93e'); g.addColorStop(1, '#c98f1d');
      c.fillStyle = g; c.fill();
      c.lineWidth = 3; c.strokeStyle = '#8a6210'; c.stroke();
      c.beginPath(); c.roundRect(14, 10, 228, 34, 20);
      const g2 = c.createLinearGradient(0, 10, 0, 44);
      g2.addColorStop(0, 'rgba(255,255,255,0.65)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g2; c.fill();
    }, R);
    mk('btndark', 256, 96, (c) => {
      c.beginPath(); c.roundRect(4, 4, 248, 88, 46);
      c.fillStyle = '#161d38'; c.fill();
      c.lineWidth = 2.5; c.strokeStyle = '#4a5a8c'; c.stroke();
    }, R);
  }
}

// Label colour for text sitting on a 'btn'. The procedural button is light gold, the painted
// one is dark navy — every gold-button label has to flip with it.
const BTN_INK = () => (ART && SSART.ready ? '#f4e6bd' : '#4a3305');
const BTN_INK2 = () => (ART && SSART.ready ? '#c9b48a' : '#7a6535');

// Time until the next daily, worded by the current language. Minutes round UP
// so the label never sits on "0m" — it reads 1m, then the sky turns over.
// Each language owns cdHM/cdH/cdM: ja wants no space, de wants 'Std', fr spaces 'min'.
function ssCountdown(ms) {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  if (!h) return SS_T('cdM', m);
  return m ? SS_T('cdHM', h, m) : SS_T('cdH', h);   // "1h", not "1h 0m"
}

// The live countdown for the leaderboard / daily pre-screen — same wording at
// hour scale, but under an hour it ticks in seconds so the deadline visibly
// moves, and above a day it speaks in days (the weekly board needs them).
function ssCountdownLive(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, sec = s % 60;
  if (d) return h ? SS_T('cdDH', d, h) : SS_T('cdD', d);
  if (h) return m ? SS_T('cdHM', h, m) : SS_T('cdH', h);
  if (m) return SS_T('cdMS', m, sec);
  return SS_T('cdS', sec);
}

// The daily chip's clock: bare digits, H:MM:SS — reads in every language and
// visibly moves every second, which is the whole point of a live herald.
function ssClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n) => String(n).padStart(2, '0');
  return Math.floor(s / 3600) + ':' + p(Math.floor(s / 60) % 60) + ':' + p(s % 60);
}

/* ---- THE STREAK: the lantern's fuel ---------------------------------------
   One number the player built, and the only thing in the game that a missed
   night can take away. Every calendar day (SSNET.dayKey — the game's one day
   clock, UTC, the same one that chooses the sky) on which a daily hunt run is
   completed feeds it. Twice in a night counts once; a missed night puts it
   out.
   Day keys are YYYYMMDD integers, so the distance between two of them is
   calendar arithmetic, not a subtraction — 20260901 minus 20260831 is 70. */
function ssDayKeyMs(k) {
  k = k | 0;
  return Date.UTC(Math.floor(k / 10000), (Math.floor(k / 100) % 100) - 1, k % 100);
}
// whole days from key `a` to key `b` (negative if b is earlier). Infinity when
// there is no `a` at all — "never hunted" is not a one-day gap.
function ssDayGap(a, b) {
  if (!a || !b) return Infinity;
  return Math.round((ssDayKeyMs(b) - ssDayKeyMs(a)) / 86400000);
}
// the day key `d` days from `k` — calendar arithmetic again, never +/- 1 on
// the integer (20260901 - 1 is not a date)
function ssDayKeyStep(k, d) { return SSNET.dayKey(new Date(ssDayKeyMs(k) + d * 86400000)); }

/* The streak AS IT STANDS TODAY, and how it is standing. A flame last fed
   yesterday is still burning — tonight's sky is up, go keep it. One night
   older and it is the GRACE NIGHT holding it up: the net is not spent by the
   miss, it is spent by the hunt that needs it, so the lantern must show the
   flame alive while the player still has a chance to come back for it.
   Anything older than that is cold — grace bridges a night, never a vacation
   — and the stored count is simply not shown (it stays put until the next
   hunt overwrites it, which is what let the grace reach it in the first
   place). A clock that ran backwards (gap < 0) is never punished.
   Returns {n, grace, held, gp}: n as it should be READ tonight, grace true
   when only the net is keeping it, held whether one is in hand, gp how far
   along the five nights that re-earn a spent one. */
function ssStreakState(dk) {
  const s = SS.prof && SS.prof.streak;
  const out = { n: 0, grace: false, held: 0, gp: 0 };
  if (!s) return out;
  out.held = s.g | 0; out.gp = s.gp | 0;
  if (!(s.n > 0) || !s.last) return out;
  const gap = ssDayGap(s.last, dk || SSNET.dayKey());
  if (gap <= 1) out.n = s.n;
  else if (gap === 2 && out.held > 0) { out.n = s.n; out.grace = true; }
  return out;
}
function ssStreakCount(dk) { return ssStreakState(dk).n; }
/* Tonight's hunt is done: feed the flame. Returns
   {n, ev, grace, ms, marks, held, gp} where ev is 'lit' (the very first
   night), 'extended', 'graced' (a missed night bridged by the safety net),
   'relit' (a cold flame started over) or 'same' (already counted tonight —
   playing twice is still one day); grace is true when this hunt SPENT the
   net; ms is the mark this hunt just crossed (0 for none) and marks every
   mark the streak now satisfies (the caller awards those, so a player who
   arrives already deep into a streak collects what they earned). */
function ssStreakNote() {
  const s = SS.prof.streak, dk = SSNET.dayKey(), gap = ssDayGap(s.last, dk);
  let ev, grace = false;
  if (gap <= 0) ev = 'same';                                  // today, or a clock that slipped back
  else if (gap === 1) { s.n = (s.n | 0) + 1; ev = 'extended'; }
  else if (gap === 2 && (s.g | 0) > 0) {
    // THE GRACE NIGHT, spent. The bridged day is written down so the week
    // strip can own up to it — the streak survived, but not untouched.
    const bridged = ssDayKeyStep(s.last, 1);
    s.gd = (s.gd || []).filter((k) => k !== bridged);
    s.gd.push(bridged); s.gd = s.gd.slice(-14);
    s.g = 0; s.gp = 0;
    s.n = (s.n | 0) + 1; ev = 'graced'; grace = true;
  } else {
    // A streak that is BORN starts holding a grace — the very first hunt ever,
    // and equally the one that restarts a flame that went out. The night after
    // a break is exactly when a player walks away for good, and handing the
    // net back there is the whole point of this feature. Never two, ever: it
    // is SET, not incremented, and a streak already holding one is unchanged.
    ev = s.last ? 'relit' : 'lit'; s.n = 1; s.mk = 0; s.g = 1; s.gp = 0;
  }
  if (ev !== 'same') {
    s.last = dk;
    // five nights hunted walk a spent grace back. The bridging hunt itself is
    // not one of them: the net is re-earned AFTER it saves you, not by it.
    if (!(s.g | 0) && !grace) {
      s.gp = (s.gp | 0) + 1;
      if (s.gp >= SS_GRACE_EARN) { s.g = 1; s.gp = 0; }
    }
  }
  if (s.n > (s.best | 0)) s.best = s.n;
  // THE MARKS. mk is the highest one this run of the streak has celebrated,
  // so each crossing rings exactly once — and a streak that broke may earn
  // its marks again on the climb back up, because that climb was real too.
  let ms = 0;
  for (const m of SS_MILESTONES) if (s.n >= m && (s.mk | 0) < m) { ms = m; s.mk = m; }
  if (ms) s.pend = ms;                       // honoured on the meadow, not here
  return { n: s.n, ev, grace, ms, held: s.g | 0, gp: s.gp | 0,
    marks: SS_MILESTONES.filter((m) => s.n >= m) };
}
/* THE GRACE NIGHT, in one sentence, wherever it is read — the lantern sheet,
   the daily notice board and the end screen all borrow this so the game never
   tells the story two ways. Three states, and the wording never pretends:
     held    · one is in hand, a missed night will not put the flame out
     bridge  · last night WAS missed and the net is what is holding it up
     spent   · "grace night held — re-earned in N more hunts" */
function ssGraceLine(st) {
  st = st || ssStreakState();
  if (st.grace) return { text: '◌ ' + SS_T('stkGraceBridge'), color: '#ffb457', glow: '#a8520d' };
  if (st.held > 0) return { text: '◌ ' + SS_T('stkGraceHeld'), color: '#c9b676' };
  const left = Math.max(1, SS_GRACE_EARN - (st.gp | 0));
  return { text: '◌ ' + SS_T(left === 1 ? 'stkGraceSpent1' : 'stkGraceSpent', left), color: '#8a94c4' };
}
// a mark's own words: its name and what the lantern just grew
function ssMarkCopy(m) {
  return { name: SS_T('stkMs' + m), sub: SS_T('stkMsSub' + m), ach: SS_MS_ACH[m] };
}
/* which dress the lamp wears: -1 cold, 0 lit, 1/2/3 the marks.
   Lit from the FIRST night. The end screen says "the lantern is lit" after
   the very first hunt and the cold sheet promises "tonight's hunt lights it",
   and until v0.45.0 the meadow then showed the COLD lamp for a night — at
   phone size, half-transparent iron against the dusk is a gray rectangle
   (TestFlight v0.43.0, Wyatt's first daily). The count in the glass still
   starts at two; a lone "1" is not a number worth printing. */
function ssLanternTier(n) {
  if (!(n >= 1)) return -1;
  let t = 0;
  SS_MILESTONES.forEach((m, i) => { if (n >= m) t = i + 1; });
  return t;
}
const SS_LANTERN_TEX = ['lantern-cold', 'lantern-lit', 'lantern-m1', 'lantern-m2', 'lantern-m3'];
/* How the lamp is worn. The texture is 60x84 with the lamp body itself drawn
   into a 44x62 box at (8, 22); 35x49 puts that body back at exactly the 26x36
   it has been since v0.39.0, and the 13 units above it are the crowns' room.
   SS_LANTERN_TY is where the glass pane's middle sits relative to the IMAGE's
   centre, which is where the night count rides at any scale.
   ⚠ SS_LANTERN_Y (the meadow's anchor) is 25 — exactly half the height, so
   the sprite's top edge lands ON the design box's top and never above it. The
   box centres in the phone's SAFE band, and a lamp hanging even half a unit
   proud of it would be wearing its comet under the notch on a real handset. */
const SS_LANTERN_W = 35, SS_LANTERN_H = 49, SS_LANTERN_Y = 25, SS_LANTERN_TY = 8.75;
/* THE LAST SEVEN NIGHTS, oldest first — what the week strip draws.
   Each entry is {k, state} with state 'lit' (the daily log holds a score for
   that day), 'grace' (a grace night bridged it), 'open' (tonight, still
   unhunted — the one ring the player can still change) or 'dark'. The local
   daily score log IS the completion list, which is why this needs nothing
   from the network. */
function ssStreakWeek(dk) {
  const today = dk || SSNET.dayKey();
  const s = (SS.prof && SS.prof.streak) || {};
  const gd = s.gd || [];
  const log = (SS.prof && SS.prof.daily) || {};
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const k = i ? ssDayKeyStep(today, -i) : today;
    const state = log[String(k)] ? 'lit' : gd.indexOf(k) >= 0 ? 'grace' : i === 0 ? 'open' : 'dark';
    out.push({ k, state });
  }
  return out;
}
/* ---- THE SHARE CARD: the run as a spoiler-free sky -------------------------
   What the daily's SHARE button puts on the clipboard, and what lands in a
   group chat. Wordle's lesson is that the SHAPE of a result travels further
   than the result itself: the beasts are stars in fight order (felled ✶,
   left standing 🌑), and the finest word is one 🟨 tile per letter — the
   COUNT is the hook, the letters would be the spoiler. Nothing personal is in
   it: two hunters who walked the same sky to the same numbers copy the very
   same card.
   The three glyphs are chosen to read on a light chat bubble AND a dark one
   — the star is a text glyph and takes the bubble's own ink, the two emoji
   carry their own colour with them.
   Line order is fixed in every language, and the streak line is simply absent
   when there is no flame, so the card never has a hole in it. Pure and
   argument-fed, so the end screen and the harness read the same function. */
const SS_SHARE_URL = 'https://drbango.com/beta3/?daily=1';
function ssShareCard(o) {
  o = o || {};
  const beasts = Math.max(0, o.beasts | 0);
  const felled = Math.max(0, Math.min(beasts, o.felled | 0));
  const tiles = Math.max(0, o.wordLen | 0);
  const n = Math.max(0, o.streak | 0);
  const lines = [SS_T('shHead', SSNET.dayKeyISO())];
  // the sky: one mark per beast, spaced so the narrow star and the wide moon
  // still read as a row of equals rather than a ragged line
  if (beasts) lines.push(Array.from({ length: beasts }, (_, i) => (i < felled ? '✶' : '🌑')).join(' '));
  // one square per LETTER — which is the count the score itself pays on, so a
  // digraph tile (qu, ch, ll, rr) shows as the two letters it spells
  if (tiles) lines.push('🟨'.repeat(tiles));
  lines.push(SS_T('shScore', o.score | 0) + ' · '
    + (tiles ? SS_T(tiles === 1 ? 'shFinest1' : 'shFinest', tiles) : SS_T('shNoWord')));
  if (n >= 1) lines.push('🔥 ' + SS_T(n === 1 ? 'shStreak1' : 'shStreak', n));
  lines.push(SS_SHARE_URL);
  return lines.join('\n');
}
/* ---- THE COPY THAT TELLS THE TRUTH ----------------------------------------
   Every clipboard write in the game funnels through here — the daily share
   card, versus's invite and friend links (vsShare). Two laws TestFlight
   1.0 (1) taught the hard way:
   1. In the WKWebView shell navigator.clipboard EXISTS but writeText REJECTS
      (NotAllowedError). A fire-and-forget write there puts NOTHING on the
      board while the button claims success — so the write is awaited, and any
      refusal falls through to the textarea + execCommand path, which the
      shell still honours inside a tap. (WebKit carries the user-gesture token
      across the promise rejection, so the fallback still counts as gestured.)
   2. The textarea is readonly (no keyboard flash on iOS) and its selection is
      set explicitly — iOS ignores a bare select() on a textarea.
   Resolves true only when a path ACTUALLY copied, so a caller can never show
   COPIED over an empty clipboard. */
async function ssCopyText(txt) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(txt);
      return true;
    }
  } catch (e) { }
  try {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-1000px;top:0;opacity:0';
    document.body.appendChild(ta);
    ta.select(); ta.setSelectionRange(0, txt.length);
    const ok = document.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch (e) { return false; }
}
// One-time seed for profiles that predate the streak fields: walk the local
// daily score log backwards from today. A log that stops at YESTERDAY still
// seeds a live streak (same rule as ssStreakCount), one that stops earlier
// seeds nothing. Called from SS.load(), so it must not touch SS.prof.
function ssSeedStreak(p) {
  try { return ssSeedStreakFrom(p); } catch (e) { return { n: 0, last: 0 }; }
}
function ssSeedStreakFrom(p) {
  const log = (p && p.daily) || {};
  const today = SSNET.dayKey();
  let dk = log[String(today)] ? today : 0;
  if (!dk) {
    const y = SSNET.dayKey(new Date(ssDayKeyMs(today) - 86400000));
    if (log[String(y)]) dk = y;
  }
  if (!dk) return { n: 0, last: 0 };
  let n = 0, walk = dk;
  while (log[String(walk)]) { n++; walk = SSNET.dayKey(new Date(ssDayKeyMs(walk) - 86400000)); }
  return { n, last: dk };
}

/* ---- THE SIGIL DRIP: half the sky is earned -------------------------------
   A new hunter starts with twelve of the twenty-four sigils and DISCOVERS the
   rest by playing. Every locked sigil carries one condition (data.js, `lock`)
   matched to what it does, and every condition is counted from play — not
   from winning. A run that ends in defeat and advanced a condition advanced
   it; that is the whole point of the mechanic.

   The whole ledger is `prof.sig`:
     u   · id → the timestamp it was unlocked (the only permanent record)
     c   · the cheap counters this file feeds (w6/w7/w8/frg/scry/ovk/hit/brnk)
     pend· unlocked but not yet ANNOUNCED — the notice survives an app closed
           on the end screen, exactly like the lantern's `pend`
     gf  · this profile was grandfathered (see below), kept for the record

   GRANDFATHERING. Nobody who already plays loses anything: the first boot
   after this ships reads any evidence of prior play at all and hands that
   profile all twenty-four, permanently. Only a genuinely empty profile enters
   the drip. This runs ONCE — `sig` existing afterwards is the record of the
   decision, so a grandfathered player who then wipes their stats keeps their
   sigils.

   Versus is untouched by every line of this: it draws from its own VS_OK
   allowlist in versus.js and always has. */

// the stats a lock may name. Four are the profile's own lifetime figures; the
// rest are counters this file keeps, fed at the moment the thing happens.
function ssSigilStat(key) {
  const p = SS.prof;
  if (key === 'word') return p.words | 0;
  if (key === 'fell') return p.beasts | 0;
  if (key === 'wins') return p.wins | 0;
  if (key === 'big') return p.bigHit | 0;
  return ((p.sig && p.sig.c) || {})[key] | 0;
}
// a sigil with no lock has always been yours
function ssSigilUnlocked(id) {
  const sg = SS_SIG_BY[id];
  if (!sg) return false;
  if (!sg.lock) return true;
  return !!(SS.prof.sig && SS.prof.sig.u && SS.prof.sig.u[id]);
}
// THE POOL every solo pick draws from — quick, campaign and daily alike
function ssSigilOpen() { return SS_SIGILS.filter((s) => ssSigilUnlocked(s.id)); }
// {have, need, done} for one sigil, for any surface that wants to draw it
// (the locked gallery is the next task; this is what it will read)
function ssSigilProgress(sg) {
  if (!sg || !sg.lock) return { have: 1, need: 1, done: true };
  const have = ssSigilStat(sg.lock.s);
  return { have: Math.min(have, sg.lock.n), need: sg.lock.n, done: have >= sg.lock.n };
}
/* Feed a counter. Deliberately does NOT write to storage itself: every call
   site sits immediately in front of a save that was going to happen anyway (a
   word cast, a beast felled) or adds one where the event is rare enough to
   afford it (a scry, a strike weathered). The rule the call sites keep is
   that no counter may end a battle unsaved — the whole mechanic is progress
   ACROSS runs, and a count that dies with an abandoned run is a lie. */
function ssSigilBump(key, n) {
  const p = SS.prof;
  if (!p.sig) return;
  p.sig.c[key] = (p.sig.c[key] | 0) + (n === undefined ? 1 : n | 0);
}
/* Settle up: every locked sigil whose condition is now met becomes yours.
   Called at the safe beats only (a run's end, the meadow), never mid-volley.
   Returns the ids unlocked by THIS call; the announcement reads `pend`, which
   also holds anything an earlier call never got to say out loud. */
function ssSigilCheck() {
  const p = SS.prof, fresh = [];
  if (!p.sig) return fresh;
  for (const sg of SS_SIGILS) {
    if (!sg.lock || p.sig.u[sg.id]) continue;
    if (ssSigilStat(sg.lock.s) < sg.lock.n) continue;
    p.sig.u[sg.id] = Date.now();
    p.sig.pend.push(sg.id);
    fresh.push(sg.id);
  }
  if (fresh.length) { p.sig.pend = p.sig.pend.slice(-8); SS.save(); }
  return fresh;
}
// what is waiting to be announced, as a plain array of ids
function ssSigilPending() { return (((SS.prof || {}).sig || {}).pend || []).slice(); }
// evidence that this profile was played before the drip existed. Deliberately
// wide: every counter, every book, every ledger. A false positive costs a new
// player nothing they would ever notice; a false NEGATIVE would take twelve
// sigils off a TestFlight tester, which is the one outcome that is not allowed.
function ssSigilPlayedBefore(p) {
  return !!(p.runs || p.wins || p.words || p.beasts || p.longest || p.bigHit
    || p.bestQuick || p.bestCampaign || p.vsWords || p.vsWins
    || (p.streak && p.streak.n) || (p.rating && p.rating !== 1000)
    || Object.keys(p.daily || {}).length || Object.keys(p.ach || {}).length
    || Object.keys(p.signs || {}).length);
}

// Button texture for a given display size. The painted source is 627x344 but consumers
// display buttons anywhere from ~3.2:1 to ~6.5:1, and a flat stretch smears the braided
// frame corners ~3x wide. So under ?art=1 each aspect gets its own baked 9-slice
// ('btn@300x58', created on demand): corners keep the painting's proportions, the braid
// runs are mirror-tiled (alternate tiles flipped so the pattern joins seamlessly at the
// cuts) rather than stretched, and only the plain face stretches. Baking beats Phaser's
// NineSlice object here because that object is WebGL-only and the game boots Phaser.AUTO.
// The procedural path keeps the shared 'btn'/'btndark' — its plain rounded rect never
// minded the stretch.
function ssBtn(scene, dark, w, h) {
  const base = dark ? 'btndark' : 'btn';
  if (!(ART && SSART.ready)) return base;
  const key = base + '@' + w + 'x' + h;
  if (scene.textures.exists(key)) return key;
  const img = SSART.img[base], sw = img.width, sh = img.height;
  const R = ssTexRes(scene);
  // All dest maths in integer DEVICE pixels: at R=3 the slice boundaries land on
  // fractions otherwise (corner height 18.5u = 55.5px), and the antialiased edges
  // of adjacent draws let the background peek through as bright hairline seams.
  const W = Math.round(w * R), H = Math.round(h * R);
  const t = scene.textures.createCanvas(key, W, H);
  const c = t.context;
  const cs = 110;                                     // source corner block, > the 96px rim radius
  const s = H / sh;                                   // uniform frame scale follows height
  const CW = Math.min(Math.round(cs * s), Math.floor(W * 0.33));  // corner dest (capped: never collide)
  const CH = Math.round(cs * s);
  const mx = sw - 2 * cs, my = sh - 2 * cs;           // source middle spans
  // corners — the only pieces drawn at the painting's own aspect
  c.drawImage(img, 0, 0, cs, cs, 0, 0, CW, CH);
  c.drawImage(img, sw - cs, 0, cs, cs, W - CW, 0, CW, CH);
  c.drawImage(img, 0, sh - cs, cs, cs, 0, H - CH, CW, CH);
  c.drawImage(img, sw - cs, sh - cs, cs, cs, W - CW, H - CH, CW, CH);
  // horizontal braid runs — mirror-tiled at the corner scale (alternate tiles are
  // flipped so the pattern joins seamlessly at the cuts), never stretched
  const tileX = (sy, dy) => {
    const tw = Math.max(1, Math.round(mx * s));
    for (let x = CW, i = 0; x < W - CW; x += tw, i++) {
      const dw = Math.min(tw, W - CW - x), sW = (dw / tw) * mx;
      c.save();
      if (i % 2) { c.translate(x + dw, 0); c.scale(-1, 1); c.drawImage(img, cs + mx - sW, sy, sW, cs, 0, dy, dw, CH); }
      else c.drawImage(img, cs, sy, sW, cs, x, dy, dw, CH);
      c.restore();
    }
  };
  tileX(0, 0); tileX(sh - cs, H - CH);
  // vertical braid runs — same treatment
  const tileY = (sx, dx) => {
    const th = Math.max(1, Math.round(my * s));
    for (let y = CH, i = 0; y < H - CH; y += th, i++) {
      const dh = Math.min(th, H - CH - y), sH = (dh / th) * my;
      c.save();
      if (i % 2) { c.translate(0, y + dh); c.scale(1, -1); c.drawImage(img, sx, cs + my - sH, cs, sH, dx, 0, CW, dh); }
      else c.drawImage(img, sx, cs, cs, sH, dx, y, CW, dh);
      c.restore();
    }
  };
  tileY(0, 0); tileY(sw - cs, W - CW);
  // the face — plain navy with a soft vignette; a stretch keeps the vignette whole
  // where tiling would repeat its speckle clusters
  c.drawImage(img, cs, cs, mx, my, CW, CH, W - 2 * CW, H - 2 * CH);
  t.refresh();
  return key;
}

function ssStarfield(scene, count) {
  const W = scene.scale.width, H = scene.scale.height;
  for (let i = 0; i < count; i++) {
    const st = scene.add.image(Math.random() * W, Math.random() * H, 'dot')
      .setScale(0.3 + Math.random() * 0.8).setAlpha(0.15 + Math.random() * 0.5).setTint(0xcfd8ff);
    scene.tweens.add({ targets: st, alpha: 0.08 + Math.random() * 0.2, duration: 1200 + Math.random() * 2600, yoyo: true, repeat: -1, delay: Math.random() * 2000 });
  }
}

// one shooting star, fired now — the ambient loop below uses it, and the
// boot intro calls it directly (its 4-8s cadence would miss a 3s intro)
function ssShootingStar(scene) {
  if (!scene.scene.isActive()) return;
  const W = scene.scale.width, H = scene.scale.height;
  const x = Math.random() * W * 0.8, y = scene.cameras.main.scrollY + Math.random() * H * 0.35;
  const s = scene.add.image(x, y, 'dot').setScale(1.1).setTint(0xfff2c9).setBlendMode('ADD').setDepth(1);
  const trail = [];
  for (let i = 0; i < 7; i++) trail.push(scene.add.image(x, y, 'dot').setScale(0.7 - i * 0.08).setAlpha(0.5 - i * 0.06).setTint(0xcfe0ff).setBlendMode('ADD').setDepth(1));
  const dx = 200 + Math.random() * 240, dy = 90 + Math.random() * 120;
  scene.tweens.add({
    targets: s, x: x + dx, y: y + dy, alpha: 0, duration: 800, ease: 'Cubic.easeOut',
    onUpdate: () => { for (let i = trail.length - 1; i > 0; i--) { trail[i].x = trail[i - 1].x; trail[i].y = trail[i - 1].y; } trail[0].x = s.x; trail[0].y = s.y; },
    onComplete: () => { s.destroy(); trail.forEach((t) => t.destroy()); },
  });
}

function ssShootingStars(scene) {
  scene.time.addEvent({ delay: 4200 + Math.random() * 4000, loop: true, callback: () => ssShootingStar(scene) });
}

/* ============================================================
   THE ASCENT — one vertical world, meadow at the bottom, the
   battle sky at the zenith. Camera rises 2 frames (design
   worldY 0..2400; home frame = 1600..2400; zenith = 0..800,
   drawn at l.y(d) - 1600s so the battle handoff is invisible).
   Spec: SKY-DESIGN.md · demo: ascent.html (curve ported 1:1).
   ============================================================ */
const ASC = { DIP_MS: 260, TOTAL_MS: 2600, DESCEND_MS: 1150 };
const ssReduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
// dip → rise → settle with overshoot; p: 0 = meadow, 1 = zenith
function ssAscentP(ms) {
  const easeOutSine = (t) => Math.sin(t * Math.PI / 2);
  const quint = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
  if (ms <= ASC.DIP_MS) return -0.011 * easeOutSine(ms / ASC.DIP_MS);
  const u = Math.min(1, (ms - ASC.DIP_MS) / (ASC.TOTAL_MS - ASC.DIP_MS));
  const q = quint(u);
  const bump = u > 0.82 ? 0.009 * Math.sin(Math.min(1, (u - 0.82) / 0.18) * Math.PI) : 0;
  return -0.011 * (1 - Math.min(1, u * 3)) + q + bump;
}

function ssSkyTextures(scene, dawn) {
  const mk = (key, w, h, fn, r, fb) => {
    if (scene.textures.exists(key)) return;
    r = r || 1;
    // same defensive ceiling clamp as ssMakeTextures (see ssMaxTex)
    const cap = Math.min(1, ssMaxTex(scene) / Math.max(w * r, h * r));
    const t = scene.textures.createCanvas(key, Math.round(w * r * cap), Math.round(h * r * cap));
    t.context.scale(r * cap, r * cap);
    ssBake(t, key, w, h, fn, fb);
  };
  const gradTex = (key, stops) => mk(key, 64, 1024, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    stops.forEach(([p, col]) => g.addColorStop(p, col));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // banding law: ±1.5 RGB scanline dither — grain is what makes it look expensive
    const im = c.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) {
      const row = (Math.random() - 0.5) * 3;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, px = row + (Math.random() - 0.5) * 1.5;
        d[i] += px; d[i + 1] += px; d[i + 2] += px;
      }
    }
    c.putImageData(im, 0, 0);
  });
  // With the painted meadow plate on, the gradient must not bake its own razor
  // horizon (bright line + plunge to dark ground): the plate's ridge sits lower
  // than the old procedural hills in places, and the baked edge shows above the
  // painted forest as a straight grey band. The plate brings the ground; the
  // gradient's tail becomes a dusk haze settling behind the painted mountains.
  const artHz = ART && SSART.ready;
  gradTex('skygrad', artHz ? [
    [0, '#0a0d1c'], [0.09, '#0a0d1c'], [0.27, '#10142e'], [0.43, '#1c2350'], [0.575, '#3a3068'],
    [0.685, '#6b4585'], [0.76, '#a05a8c'], [0.805, '#c96a8e'], [0.83, '#f0997a'], [0.846, '#ffc98a'],
    [0.852, '#ffd095'], [0.88, '#b06080'], [0.93, '#4a3560'], [1, '#241a38']] : [
    [0, '#0a0d1c'], [0.09, '#0a0d1c'], [0.27, '#10142e'], [0.43, '#1c2350'], [0.575, '#3a3068'],
    [0.685, '#6b4585'], [0.76, '#a05a8c'], [0.805, '#c96a8e'], [0.83, '#f0997a'], [0.846, '#ffc98a'],
    [0.852, '#ffe4b0'], [0.86, '#0c0918'], [1, '#070510']]);
  // the Act III payoff sky: you rose at dusk, fought one long night,
  // and come down at sunrise. Zenith still matches the battle bg.
  if (dawn) gradTex('skygrad-dawn', [
    [0, '#0a0d1c'], [0.09, '#0a0d1c'], [0.27, '#141c40'], [0.43, '#28376e'], [0.575, '#4d5da4'],
    [0.685, '#8f7cb8'], [0.76, '#d9a0ac'], [0.805, '#f2bd9c'], [0.83, '#ffd9a0'], [0.846, '#ffedc4'],
    [0.852, '#fff7dc'], [0.86, '#120d22'], [1, '#0b0716']]);
  mk('grain', 128, 128, (c, w, h) => {
    const im = c.createImageData(w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    c.putImageData(im, 0, 0);
  });
  mk('moon', 144, 144, (c, w, h) => {
    c.translate(w / 2, h / 2);
    c.fillStyle = 'rgba(247,232,200,0.07)';                       // earthshine disk
    c.beginPath(); c.arc(0, 0, 54, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f7e8c8';
    c.beginPath(); c.arc(0, 0, 54, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'destination-out';                // bite = the crescent
    c.beginPath(); c.arc(31, -24, 53, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(247,232,200,0.06)';
    c.beginPath(); c.arc(0, 0, 54, 0, Math.PI * 2); c.fill();
  }, 2);
  mk('cloudwisp', 256, 80, (c, w, h) => {
    const blob = (cx, cy, rx, ry, col, a) => {
      c.save(); c.translate(cx, cy); c.scale(rx / 40, ry / 40);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 40);
      g.addColorStop(0, col.replace('A', String(a))); g.addColorStop(1, col.replace('A', '0'));
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 40, 0, Math.PI * 2); c.fill(); c.restore();
    };
    blob(128, 46, 120, 26, 'rgba(20,16,40,A)', 0.9);               // dark body
    blob(88, 50, 70, 18, 'rgba(20,16,40,A)', 0.7);
    blob(120, 30, 90, 12, 'rgba(255,228,176,A)', 0.16);            // moonlit top edge
  });
  mk('spark4', 64, 64, (c, w, h) => {                              // hero-star diffraction cross
    const arm = (ang) => {
      c.save(); c.translate(w / 2, h / 2); c.rotate(ang);
      const g = c.createLinearGradient(-30, 0, 30, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(-30, -1.2, 60, 2.4); c.restore();
    };
    arm(0); arm(Math.PI / 2);
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 7);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(w / 2 - 7, h / 2 - 7, 14, 14);
  }, 2);
  mk('grasstrip', 512, 32, (c, w, h) => {   // 512x32: POT both ways — WebGL1 iPhones can't REPEAT an NPOT texture
    c.fillStyle = '#050310';
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 9) c.lineTo(x + Math.random() * 5, 8 + Math.random() * 19);
    c.lineTo(w, h); c.closePath(); c.fill();
    for (let i = 0; i < 4; i++) {                                  // wildflower silhouettes
      const x = 30 + Math.random() * (w - 60), top = 2 + Math.random() * 6;
      c.strokeStyle = '#050310'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(x, h); c.quadraticCurveTo(x + 3, h - 14, x, top + 5); c.stroke();
      c.fillStyle = '#050310'; c.beginPath(); c.arc(x, top + 4, 3.2, 0, Math.PI * 2); c.fill();
    }
  }, 2);   // 1024x64 — still power-of-two both ways for WebGL1 REPEAT
}

/* Film grain, dieted (perf-lab task 24): the full-screen grain TileSprite
   cost 16fps on the afflicted iPhone — a live TileSprite keeps a full
   back-buffer-sized internal pattern canvas and runs the tile pipeline every
   frame for what is a completely STATIC effect at alpha 0.04. Now the tiled
   noise is baked ONCE at half back-buffer res and drawn as a single
   stretched Image: one plain quad per frame on both renderers, and the 2x
   coarsening is imperceptible at 4% opacity (side-by-side verified).
   Rebaked only when a reshape (rotation) changes the target size. */
function ssGrainOverlay(scene, W, H) {
  const gw = Math.max(64, Math.round(W / 2)), gh = Math.max(64, Math.round(H / 2));
  const key = 'grainbake';
  const ex = scene.textures.exists(key) ? scene.textures.get(key).getSourceImage() : null;
  if (ex && (ex.width !== gw || ex.height !== gh)) scene.textures.remove(key);
  if (!scene.textures.exists(key)) {
    const t = scene.textures.createCanvas(key, gw, gh);
    const src = scene.textures.get('grain').getSourceImage();
    for (let y = 0; y < gh; y += 128) for (let x = 0; x < gw; x += 128) t.context.drawImage(src, x, y);
    t.refresh();
  }
  return scene.add.image(W / 2, H / 2, key).setDisplaySize(W, H).setScrollFactor(0).setAlpha(0.04).setDepth(500);
}

const SS_STAR_COLORS = [0xcfd8ff, 0xcfd8ff, 0xcfd8ff, 0xffe9c9, 0xffd1dc, 0xc9fff2];
// Small standalone mulberry32 — seeded skies (versus: shared seed = same sky)
function ssMulberry(seed) {
  let s = (seed | 0) || 1;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// opts: { dawn }        — sunrise palette, no moon/fireflies, washed stars
//       { seed }        — deterministic star placement (shared versus sky)
//       { zenithAtZero }— zenith frame sits at scrollY 0, meadow at +T
//                         (for single-scene flows like versus; Home uses the
//                          default: meadow at 0, zenith at -T)
function ssSkyWorld(scene, opts) {
  opts = opts || {};
  const l = ssLayout(scene);
  ssSkyTextures(scene, opts.dawn);
  const T = 1600 * l.s;                                  // camera travel, px
  const B = opts.zenithAtZero ? 1600 : 0;                // design-unit shift
  const my = (m, f) => l.y(m + B * (f == null ? 1 : f)); // meadow-frame coord (factor-aware)
  const wy = (d) => l.y(d - 1600 + B);                   // worldY (0..2400) → scene y
  const rnd = opts.seed ? ssMulberry(opts.seed) : Math.random;
  const starDim = opts.dawn ? 0.5 : 1;

  // master gradient: spans the whole column, zenith top pinned to the game bg
  scene.add.image(l.W / 2, wy(0), opts.dawn ? 'skygrad-dawn' : 'skygrad').setOrigin(0.5, 0).setDisplaySize(l.W, 2400 * l.s);
  scene.add.rectangle(l.W / 2, my(800), l.W, Math.max(1, l.H - l.y(800)) + 120 * l.s, opts.dawn ? 0x0b0716 : 0x070510).setOrigin(0.5, 0);

  // aurora — lives at the zenith; one faint teal tease bleeds into the meadow sky
  for (const [tint, dx, dy, a] of [[0x2fe0d0, -120, 160, 0.055], [0x8a5ae0, 130, 120, 0.055], [0xd7b45c, 0, 640, 0.055], [0x2fe0d0, 40, 1660, 0.03]]) {
    const g = scene.add.image(l.x(dx), wy(dy), 'glowbig').setScale(l.u(2.6)).setTint(tint).setAlpha(a).setBlendMode('ADD');
    scene.tweens.add({ targets: g, x: g.x + l.u(30), y: g.y - l.u(20), scale: l.u(3.1), duration: 7000 + rnd() * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // star tiers — density ramps toward the zenith end of each parallax span
  const tier = (f, n, s0, s1, twinkle) => {
    const out = [], top = opts.zenithAtZero ? 0 : -T * f, span = T * f + l.H;
    for (let i = 0; i < n; i++) {
      const y = top + Math.pow(rnd(), 1.8) * span;
      const sc = (s0 + rnd() * (s1 - s0)) * l.s;
      const baseA = (0.25 + rnd() * 0.55) * starDim;
      const st = scene.add.image(rnd() * l.W, y, 'dot')
        .setScale(sc).setAlpha(baseA).setTint(SS_STAR_COLORS[Math.floor(rnd() * SS_STAR_COLORS.length)])
        .setScrollFactor(1, f);
      st.baseS = sc; st.baseA = baseA;
      if (twinkle && rnd() < 0.5) twinkles.push(st);
      out.push(st);
    }
    return out;
  };
  // ~90 twinkle tweens were a real slice of a create that sometimes opens a
  // descent — starting them a beat later is invisible and off the entry frame
  const twinkles = [];
  scene.time.delayedCall(400, () => {
    for (const st of twinkles)
      scene.tweens.add({ targets: st, alpha: st.baseA * 0.35, duration: 1600 + rnd() * 2600, yoyo: true, repeat: -1, delay: rnd() * 2500 });
  });
  tier(0.55, 110, 0.28, 0.5, true);
  const tierM = tier(0.70, 75, 0.42, 0.68, true);
  const tierN = tier(0.85, 48, 0.66, 0.95, false);
  tierN.forEach((st) => st.setBlendMode('ADD'));

  // hero stars — the ones a player would wish on, in the meadow's dusk sky
  for (let i = 0; i < 6; i++) {
    const hsz = l.u(14 + rnd() * 10);
    const hs = scene.add.image(l.x(-190 + rnd() * 380), my(50 + rnd() * 320, 0.85), 'spark4')
      .setDisplaySize(hsz, hsz).setAlpha(0.6 * starDim).setBlendMode('ADD').setScrollFactor(1, 0.85);
    scene.tweens.add({ targets: hs, angle: 360, duration: 42000 + rnd() * 40000, repeat: -1 });
    scene.tweens.add({ targets: hs, alpha: 0.45 * starDim, duration: 2200 + rnd() * 1800, yoyo: true, repeat: -1, delay: rnd() * 2000 });
  }

  // moon — low on the horizon's left shoulder; at dawn it has already set
  if (!opts.dawn) {
    const moon = scene.add.image(l.x(-140), my(425, 0.85), 'moon').setDisplaySize(l.u(104), l.u(104)).setAngle(24).setScrollFactor(1, 0.85);
    const halo = scene.add.image(moon.x, moon.y, 'glowbig').setScale(l.u(0.95)).setTint(0xf7e8c8).setAlpha(0.14).setBlendMode('ADD').setScrollFactor(1, 0.85);
    scene.tweens.add({ targets: halo, alpha: 0.1, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // clouds — parked in the climb band, crossed mid-flight
  for (const [cx, cy, cw, chh] of [[-51, -650, 242, 43], [108, -475, 280, 50], [-121, -313, 229, 38]]) {
    const c = scene.add.image(l.x(cx), my(cy), 'cloudwisp').setDisplaySize(l.u(cw), l.u(chh)).setAlpha(opts.dawn ? 0.35 : 0.55);
    scene.tweens.add({ targets: c, x: c.x + l.u(20), duration: 6000 + rnd() * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // the meadow: hills, ground, swaying grass, fireflies
  // (near hill raised + widened so the bright horizon band can't peek
  //  through the saddle between the two silhouettes)
  // painted meadow plate (?art=1, dusk only — the cut is graded for dusk): the MJ
  // landscape with its own sky keyed out at the ridge, so the painted mountains
  // stand against the procedural horizon glow. The procedural silhouettes and
  // grass strip stand down — anything drawn under the ridge's feathered alpha
  // shows through it as a phantom hump. Height is pinned (ridge ~horizon, foot
  // just past the screen bottom so the anticipation dip can't peek under it);
  // width follows the screen, so very wide frames stretch the painting rather
  // than run out of it.
  const artMeadow = ART && SSART.ready && !opts.dawn;
  if (artMeadow) {
    if (!scene.textures.exists('meadowart')) scene.textures.addImage('meadowart', SSART.img.meadow);
    const src = scene.textures.get('meadowart').getSourceImage();
    const bot = Math.max(my(800), l.H + B * l.s) + l.u(30);
    const h = bot - my(398);
    scene.add.image(l.W / 2, bot, 'meadowart').setOrigin(0.5, 1)
      .setDisplaySize(Math.max(l.W, h * src.width / src.height), h);
  } else {
    scene.add.ellipse(l.x(-108), my(545), l.u(432), l.u(250), opts.dawn ? 0x1a1430 : 0x141026);
    scene.add.ellipse(l.x(150), my(588), l.u(620), l.u(340), opts.dawn ? 0x120d22 : 0x0c0918);
    scene.add.rectangle(l.W / 2, my(553), l.W, Math.max(1, l.H - l.y(553)) + 120 * l.s, opts.dawn ? 0x0f0a1c : 0x0a0714).setOrigin(0.5, 0);
    const grassY = Math.max(l.y(772), l.H - l.u(30)) + B * l.s;
    for (const [off, ph] of [[0, 0], [l.u(5), 1300]]) {
      const gr = scene.add.tileSprite(l.W / 2, grassY + off, l.W, l.u(32), 'grasstrip').setOrigin(0.5, 0);
      gr.setTileScale(l.s / 2); gr.tilePositionX = off * 20;   // texture is drawn at 2x
      scene.tweens.add({ targets: gr, x: gr.x + l.u(1.5), duration: 2600, yoyo: true, repeat: -1, delay: ph, ease: 'Sine.easeInOut' });
    }
  }
  const flies = [];
  const flyTweens = (f) => {
    scene.tweens.add({ targets: f, alpha: 0.85, duration: 1700 + rnd() * 1700, yoyo: true, repeat: -1, delay: rnd() * 3000 });
    scene.tweens.add({ targets: f, x: f.baseX + l.u(-14 + rnd() * 28), y: f.baseY - l.u(6 + rnd() * 10), duration: 2600 + rnd() * 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };
  if (!opts.dawn) {
    for (let i = 0; i < 12; i++) {
      const f = scene.add.image(l.x(-180 + rnd() * 360), my(600 + rnd() * 165), 'dot')
        .setScale(l.u(0.22 + rnd() * 0.14)).setTint(0xffdf8f).setBlendMode('ADD').setAlpha(0);
      f.baseX = f.x; f.baseY = f.y;
      flyTweens(f);
      flies.push(f);
    }
  }

  // film grain over everything — fixed to the camera. The rise/descent hides
  // it: at alpha 0.04 it is invisible over a fast-scrolling sky, and it is a
  // full back-buffer of blended fill per frame at DPR 3 — exactly the frames
  // that must not drop. Baked static image, not a TileSprite (see ssGrainOverlay).
  const grain = ssGrainOverlay(scene, l.W, l.H);

  // camera driver: p 0 = meadow · 1 = zenith; vel drives the star-stretch
  const setP = (p, vel) => {
    scene.cameras.main.scrollY = opts.zenithAtZero ? (1 - p) * T : -p * T;
    const kN = Math.min(2.2, 1 + (vel || 0) * 560), kM = Math.min(1.6, 1 + (vel || 0) * 280);
    for (const st of tierN) { st.setScale(st.baseS, st.baseS * kN); if (kN > 1.01) st.setAlpha(Math.min(1, st.baseA + (kN - 1) * 0.17)); }
    for (const st of tierM) st.setScale(st.baseS, st.baseS * kM);
  };
  const scatterFlies = () => {
    for (const f of flies) {
      scene.tweens.killTweensOf(f);
      scene.tweens.add({ targets: f, y: f.y - l.u(90 + Math.random() * 80), alpha: 0, duration: 700 + Math.random() * 500, ease: 'Sine.easeOut' });
    }
  };
  // the wake path (descending home without a re-create) puts them back
  const restoreFlies = () => {
    for (const f of flies) {
      scene.tweens.killTweensOf(f);
      f.setPosition(f.baseX, f.baseY).setAlpha(0);
      flyTweens(f);
    }
  };
  return { setP, scatterFlies, restoreFlies, grain, T };
}

// Assemble a constellation inside a container: stars fly in, lines fade up.
function ssAssembleBeast(scene, cont, beast, unitScale, onDone) {
  cont.removeAll(true);
  // scale must match ssBeastFx's, which owns star homes once it arms
  const sc = unitScale * (beast.boss ? 1.15 : beast.tier === 'mini' ? 1.06 : 1);
  const g = scene.add.graphics().setAlpha(0);
  g.lineStyle(unitScale * 1.25, 0xffffff, 0.35);
  for (const [a, b] of beast.edges) g.lineBetween(beast.stars[a][0] * sc, beast.stars[a][1] * sc, beast.stars[b][0] * sc, beast.stars[b][1] * sc);
  cont.add(g);
  const stars = [];
  beast.stars.forEach((p, i) => {
    // star magnitudes: five brightness classes so the figure reads like a real
    // constellation — a few blazing anchors, a scatter of faint companions.
    // Faint stars twinkle in alpha as well as size; anchors burn steadier.
    const mag = [1.18, 0.62, 0.88, 0.5, 0.98][i % 5];
    const ang = Math.random() * Math.PI * 2, d = 260 * unitScale + Math.random() * 200;
    const st = scene.add.image(p[0] * sc + Math.cos(ang) * d, p[1] * sc + Math.sin(ang) * d, 'dot')
      .setScale(0.1).setAlpha(0).setTint(beast.tint).setBlendMode('ADD');
    cont.add(st); stars.push(st);
    scene.tweens.add({
      targets: st, x: p[0] * sc, y: p[1] * sc, alpha: 1, scale: mag,
      delay: i * 40, duration: 620, ease: 'Cubic.easeOut',
      onComplete: () => scene.tweens.add({
        targets: st, scale: mag * (mag < 0.8 ? 0.6 : 0.78), alpha: mag < 0.8 ? 0.55 : 0.85,
        duration: 700 + (i * 137) % 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      }),
    });
  });
  const eyes = [];
  scene.time.delayedCall(beast.stars.length * 40 + 500, () => {
    scene.tweens.add({ targets: g, alpha: 1, duration: 500 });
    for (const e of beast.eyes) {
      const eye = scene.add.image(e[0] * sc, e[1] * sc, 'dot').setScale(0.9).setTint(beast.eye).setBlendMode('ADD').setAlpha(0);
      cont.add(eye); eyes.push(eye);
      scene.tweens.add({ targets: eye, alpha: 1, duration: 400 });
      scene.tweens.add({ targets: eye, alpha: 0.5, duration: 700, yoyo: true, repeat: -1, delay: 500 });
    }
    if (SFX.ok) SFX.noise(0.7, 800, 2, 0.05, 2600);
    if (onDone) onDone();
  });
  return { lines: g, stars, eyes };
}

/* ============================================================
   Beast presence & attack fx — ssBeastFx
   Gives every constellation a body (nebula aura, breathing,
   shimmering edges, traveling glints), a creature-specific idle,
   a telegraph that charges as the strike counter fills, and a
   signature attack. Everything is archetype-driven off the fx
   block in SS_BEASTS (data.js) so new beasts are data-only.
   ============================================================ */

// Baked colour textures: setTint is a silent no-op under the Canvas renderer,
// so every coloured fx sprite gets a small baked texture, cached per (kind,
// colour). A handful of tiny canvases per beast palette, kept for the session.
function ssFxTex(scene, kind, tint) {
  const key = 'fx' + kind + '-' + tint.toString(16);
  if (scene.textures.exists(key)) return key;
  const rgb = ((tint >> 16) & 255) + ',' + ((tint >> 8) & 255) + ',' + (tint & 255);
  const S = { dot: 32, glow: 160, ring: 192, vig: 256 }[kind];
  const t = scene.textures.createCanvas(key, S, S), c = t.context, h = S / 2;
  let g;
  if (kind === 'dot') {
    g = c.createRadialGradient(h, h, 0, h, h, h);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(' + rgb + ',0.9)');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
  } else if (kind === 'glow') {
    g = c.createRadialGradient(h, h, 0, h, h, h);
    g.addColorStop(0, 'rgba(' + rgb + ',0.6)');
    g.addColorStop(0.55, 'rgba(' + rgb + ',0.18)');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
  } else if (kind === 'ring') {
    g = c.createRadialGradient(h, h, 0, h, h, h);
    g.addColorStop(0.55, 'rgba(' + rgb + ',0)');
    g.addColorStop(0.72, 'rgba(' + rgb + ',0.85)');
    g.addColorStop(0.88, 'rgba(' + rgb + ',0)');
  } else {   // vig — edge vignette: transparent centre, colour pooling at the frame
    g = c.createRadialGradient(h, h, 0, h, h, h * 1.42);
    g.addColorStop(0.55, 'rgba(' + rgb + ',0)');
    g.addColorStop(1, 'rgba(' + rgb + ',0.85)');
  }
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  t.refresh();
  return key;
}

// Screen-edge impact wash — the player-side "you were hit" feedback. One
// full-screen vignette image per colour, reused across flashes.
function ssEdgeFlash(scene, tint, peak, dur) {
  const key = ssFxTex(scene, 'vig', tint);
  scene._edgeVigs = scene._edgeVigs || {};
  let v = scene._edgeVigs[key];
  if (!v || !v.scene) {
    v = scene._edgeVigs[key] = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, key)
      .setDisplaySize(scene.scale.width, scene.scale.height).setAlpha(0).setDepth(95);
  }
  scene.tweens.killTweensOf(v);
  v.setAlpha(peak);
  scene.tweens.add({ targets: v, alpha: 0, duration: dur || 460, ease: 'Sine.easeOut' });
}

/* ============================================================
   THE WIN FANFARE — the celebration beat that lands BEFORE the
   end window arrives. One helper, three sizes of triumph:
     tier 1 · a quick or daily hunt won
     tier 2 · a rival bested in versus
     tier 3 · the whole campaign conquered
   Spectacle is motion and light — a banner landing with weight,
   blooms, expanding rings, stardust, one slow camera swell —
   never strobing. Reduced-motion keeps only the banner's gentle
   fade. Returns the ms the caller should wait before settling
   the stats window into place.
   ============================================================ */
function ssWinFanfare(scene, tier, opts) {
  opts = opts || {};
  const l = scene.L || ssLayout(scene);
  const cx = l.x(0), cy = l.y(opts.cy != null ? opts.cy : 330);
  const D = opts.depth || 250;
  const reduced = ssReduceMotion();
  try { SFX.fanfare(tier); } catch (e) { }
  window.__ssfan = { tier, text: opts.text || '', reduced, t: Date.now() };   // verification beacon
  const hold = tier >= 3 ? 1500 : tier === 2 ? 1000 : 800;
  const wait = hold + 420;
  const kill = [];                        // the banner party, swept together at the exit

  // the banner — the word of triumph, condensing with real weight
  const gt = ssGoldTex(scene, opts.text || SS_T('fanWin'), tier >= 3 ? 34 : 29);
  const bsc = Math.min(1, 344 / gt.w);
  const bw = gt.w * bsc, bh = gt.h * bsc;
  const glow = scene.add.image(cx, cy, 'glowbig').setDisplaySize(l.u(bw * 2.2), l.u(bh * 3.4))
    .setTint(0xffd77a).setAlpha(0).setBlendMode('ADD').setDepth(D);
  const banner = scene.add.image(cx, cy, gt.key).setDisplaySize(l.u(bw * 0.55), l.u(bh * 0.55)).setAlpha(0).setDepth(D + 2);
  kill.push(glow, banner);
  if (opts.sub) {
    const sub = ssTxt(scene, cx, cy + l.u(bh / 2 + 20), opts.sub, l.u(13), '#ffe9a8', 'italic').setOrigin(0.5).setAlpha(0).setDepth(D + 2)
      .setShadow(0, 0, '#c9b676', l.u(7), true, true);
    kill.push(sub);
    scene.tweens.add({ targets: sub, alpha: 1, duration: 320, delay: reduced ? 250 : 300, ease: 'Sine.easeOut' });
  }

  if (reduced) {
    // stillness for sensitive eyes: the words simply glow in and pass
    scene.tweens.add({ targets: banner, displayWidth: l.u(bw), displayHeight: l.u(bh), alpha: 1, duration: 450, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: glow, alpha: 0.3, duration: 500, ease: 'Sine.easeOut' });
    scene.time.delayedCall(hold + 60, () => {
      scene.tweens.add({ targets: kill, alpha: 0, duration: 420, ease: 'Sine.easeIn', onComplete: () => kill.forEach((o) => o.destroy()) });
    });
    return wait;
  }

  // banner entrance — Back-eased into full size, glow swelling behind it
  scene.tweens.add({ targets: banner, displayWidth: l.u(bw), displayHeight: l.u(bh), alpha: 1, duration: 340, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: glow, alpha: 0.55, duration: 380, ease: 'Sine.easeOut' });
  scene.tweens.add({ targets: glow, alpha: 0.25, duration: 600, delay: 400, ease: 'Sine.easeInOut' });

  // one slow golden wash pooling at the frame — a swell, not a flash
  const vig = scene.add.image(l.W / 2, l.H / 2, ssFxTex(scene, 'vig', 0xffd77a))
    .setDisplaySize(l.W, l.H).setAlpha(0).setDepth(D - 3);
  scene.tweens.add({ targets: vig, alpha: tier >= 3 ? 0.4 : 0.26, duration: 480, ease: 'Sine.easeOut', yoyo: true, hold: 260, onComplete: () => vig.destroy() });

  // rings of light expanding from the word — one per tier
  for (let i = 0; i < tier; i++) {
    const ring = scene.add.image(cx, cy, ssFxTex(scene, 'ring', 0xffe9a8)).setDisplaySize(l.u(56), l.u(56)).setAlpha(0).setDepth(D + 1);
    scene.time.delayedCall(120 + i * 210, () => {
      if (!ring.scene) return;
      ring.setAlpha(0.85);
      const rw = l.u(400 + i * 90);
      scene.tweens.add({ targets: ring, displayWidth: rw, displayHeight: rw, alpha: 0, duration: 950, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    });
  }

  // stardust kicked out radially from the landing
  const motes = tier >= 3 ? 30 : tier === 2 ? 22 : 16;
  for (let i = 0; i < motes; i++) {
    const a = (i / motes) * Math.PI * 2 + rng() * 0.4, r = l.u(60 + rng() * 130) * (tier >= 3 ? 1.5 : 1);
    const m = scene.add.image(cx, cy, 'dot').setScale(0.5 + rng() * 0.7)
      .setTint(i % 3 ? 0xffe9a8 : 0xfff6d8).setBlendMode('ADD').setDepth(D + 1);
    scene.tweens.add({
      targets: m, x: cx + Math.cos(a) * r * 1.6, y: cy + Math.sin(a) * r, alpha: 0, scale: 0.1,
      duration: 800 + rng() * 600, ease: 'Cubic.easeOut', onComplete: () => m.destroy(),
    });
  }

  // the rival tier: two comets cross the banner — the duel written in the sky
  if (tier === 2) for (let i = 0; i < 2; i++) {
    const dir = i ? 1 : -1, y0 = cy + l.u(i ? 130 : -150);
    const comet = scene.add.image(cx - dir * l.u(250), y0, 'dot').setScale(1.3).setTint(0xfff2c9).setBlendMode('ADD').setAlpha(0).setDepth(D + 1);
    scene.time.delayedCall(260 + i * 300, () => {
      if (!comet.scene) return;
      comet.setAlpha(1);
      scene.tweens.add({
        targets: comet, x: cx + dir * l.u(250), y: y0 - dir * l.u(30), duration: 620, ease: 'Sine.easeIn',
        onUpdate: () => {
          if (Math.random() < 0.55) {
            const tr = scene.add.image(comet.x, comet.y, 'dot').setScale(0.5).setTint(0xffe9a8).setBlendMode('ADD').setDepth(D);
            scene.tweens.add({ targets: tr, alpha: 0, scale: 0.05, duration: 420, onComplete: () => tr.destroy() });
          }
        },
        onComplete: () => { comet.destroy(); },
      });
    });
  }

  // the campaign tier: firework blooms across the sky and a rain of gold
  if (tier >= 3) {
    for (let b = 0; b < 5; b++) {
      scene.time.delayedCall(340 + b * 250, () => {
        const bx = cx + (rng() - 0.5) * l.u(300), by = cy + (rng() - 0.5) * l.u(340);
        const pop = scene.add.image(bx, by, 'glowbig').setDisplaySize(l.u(70), l.u(70)).setTint(0xfff2c9).setBlendMode('ADD').setAlpha(0.8).setDepth(D);
        scene.tweens.add({ targets: pop, alpha: 0, displayWidth: l.u(160), displayHeight: l.u(160), duration: 540, ease: 'Cubic.easeOut', onComplete: () => pop.destroy() });
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2 + rng() * 0.5, r = l.u(34 + rng() * 40);
          const d = scene.add.image(bx, by, 'dot').setScale(0.45 + rng() * 0.4).setTint(0xffe9a8).setBlendMode('ADD').setDepth(D + 1);
          scene.tweens.add({ targets: d, x: bx + Math.cos(a) * r, y: by + Math.sin(a) * r, alpha: 0, scale: 0.05, duration: 600 + rng() * 300, ease: 'Cubic.easeOut', onComplete: () => d.destroy() });
        }
        try { SFX.chime(3 + (b % 4)); } catch (e) { }
      });
    }
    const rain = scene.add.particles(0, 0, 'dot', {
      x: { min: 0, max: scene.scale.width }, y: -20,
      speedY: { min: 140, max: 300 }, speedX: { min: -30, max: 30 },
      lifespan: 2000, scale: { start: 0.75, end: 0.1 }, quantity: 3,
      tint: [0xffd77a, 0xfff2c9, 0xd7b45c], blendMode: 'ADD',
    }).setDepth(D - 1);
    scene.time.delayedCall(1700, () => { rain.stop(); scene.time.delayedCall(2100, () => rain.destroy()); });
  }

  // one slow breath of the whole sky (returns to rest well before the window)
  scene.tweens.add({ targets: scene.cameras.main, zoom: tier >= 3 ? 1.045 : 1.025, duration: tier >= 3 ? 600 : 400, yoyo: true, ease: 'Sine.easeInOut' });

  // the banner gives way — lifts into the night as the window rises beneath it
  scene.time.delayedCall(hold, () => {
    scene.tweens.add({ targets: kill, y: '-=' + l.u(46), alpha: 0, duration: 480, ease: 'Sine.easeIn', onComplete: () => kill.forEach((o) => o.destroy()) });
  });
  return wait;
}

const ssQBez = (a, c, b, t) => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});

/* ---- idle archetypes -------------------------------------------------------
   Each writes a star's offset into o (screen px via fx.k). hx/hy are the
   star's home in beast design units, i its index — geometry-driven regioning
   (head = top, wings = far |x|, claws = far |x| on the crab) so any beast
   built in the same 200x160 box can borrow any idle. */
const SS_IDLE_FX = {
  // the fox slinks — the figure slides in a lazy S, nose leading
  prowl(fx, T, i, hx, hy, o) {
    o.x += (Math.sin(T * 0.8 - hx * 0.012) * 3.4 + Math.sin(T * 0.47 + 1.3) * 2.2) * fx.k;
    o.y += Math.sin(T * 1.6 + hx * 0.02) * 1.5 * fx.k;
  },
  // the hare sits alert, then springs a quick double-bounce; ears flick mid-hop
  bob(fx, T, i, hx, hy, o) {
    o.y += Math.sin(T * 1.15) * 1.8 * fx.k;
    const hop = T % 4.6;
    if (hop < 0.42) {
      const p = Math.sin((hop / 0.42) * Math.PI);
      o.y -= p * 9 * fx.k;
      if (hy < fx.topY) o.x += Math.sin(T * 26) * p * 1.6 * fx.k;
    }
  },
  // the serpent coils — a wave travels down the star chain
  coil(fx, T, i, hx, hy, o) {
    o.y += Math.sin(T * 2.1 - i * 0.75) * 3.6 * fx.k;
    o.x += Math.cos(T * 1.05 - i * 0.75) * 1.8 * fx.k;
  },
  // the crab works its claws and skitters its legs
  pinch(fx, T, i, hx, hy, o) {
    if (Math.abs(hx) > 55) {
      const sq = 0.5 + 0.5 * Math.sin(T * 1.5 + (hx > 0 ? 0 : 1.1));
      o.x -= Math.sign(hx) * sq * 4.5 * fx.k;
      o.y -= sq * 1.5 * fx.k;
    } else if (hy > 20) o.x += Math.sin(T * 3.1 + hx * 0.2) * 1.1 * fx.k;
    else o.y += Math.sin(T * 1.5) * 0.8 * fx.k;
  },
  // the owl's head turns — quick swivel, long unblinking hold
  headturn(fx, T, i, hx, hy, o) {
    if (hy < -18) {
      const step = T / 2.4, a = Math.floor(step), f = step - a;
      const r = (n) => Math.sin(n * 127.1 + 311.7) * 0.9;
      const e = f < 0.22 ? (1 - Math.cos((f / 0.22) * Math.PI)) / 2 : 1;
      o.x += (r(a - 1) + (r(a) - r(a - 1)) * e) * 7 * fx.k;
    } else o.y += Math.sin(T * 1.2) * 1.2 * fx.k;
  },
  // the bear shifts its weight paw to paw
  lumber(fx, T, i, hx, hy, o) {
    o.x += Math.sin(T * 0.65) * 2.6 * fx.k;
    o.y += Math.sin(T * 1.3 + (hx > 0 ? 0 : Math.PI)) * 1.6 * fx.k;
  },
  // the widow's legs ripple — motion grows toward the tips
  ripple(fx, T, i, hx, hy, o) {
    const d = Math.min(1, Math.hypot(hx - fx.cx, hy - fx.cy) / 55);
    o.x += Math.sin(T * 2.6 + i * 2.1) * 2.1 * d * fx.k;
    o.y += Math.cos(T * 3.2 + i * 1.3) * 2.1 * d * fx.k;
  },
  // wings flex — the far spans rise and sweep together (dragon, phoenix)
  flex(fx, T, i, hx, hy, o) {
    const amp = fx.def.amp || 1;
    const w = Math.max(0, Math.abs(hx) - 34) / 46;
    if (w > 0) {
      o.y -= Math.sin(T * 1.25) * 7.5 * w * amp * fx.k;
      o.x -= Math.sin(T * 1.25 + 0.5) * 2.2 * w * Math.sign(hx) * fx.k;
    } else o.y += Math.sin(T * 1.25 + 1.2) * 1.4 * fx.k;
  },
};

/* ---- attack archetypes -----------------------------------------------------
   Each animates the beast + projectiles, calls impact(mult) exactly once at
   the blow's landing (Battle applies damage + player-side feedback there,
   scaled by mult), and finish() once the beast is home again. */
const SS_ATK_FX = {
  // crouch and spring at the board (hops: 2 = the hare's stutter-bounce)
  pounce(scene, fx, impact, finish) {
    const l = scene.L, c = fx.cont, hops = fx.def.hops | 0;
    SFX.noise(0.25, 500, 1, 0.05, 1200);
    const drop = l.u(150);
    const leap = (toY, dur, last, cb) => scene.tweens.add({
      targets: c, y: toY, duration: dur, ease: last ? 'Cubic.easeIn' : 'Quad.easeOut',
      onUpdate: () => { if (Math.random() < 0.5) scene.starBurst.emitParticleAt(c.x + (Math.random() - 0.5) * l.u(50), c.y - l.u(10), 1); },
      onComplete: cb,
    });
    scene.tweens.add({
      targets: c, scaleX: 1.07, scaleY: 0.88, y: fx.homeY + l.u(10), duration: 210, ease: 'Sine.easeOut',
      onComplete: () => {
        const strike = () => leap(fx.homeY + drop, 140, true, () => {
          impact(1);
          scene.starBurst.emitParticleAt(c.x, c.y + l.u(30), 10);
          scene.tweens.add({ targets: c, y: fx.homeY, scaleX: 1, scaleY: 1, duration: 430, ease: 'Sine.easeOut', onComplete: finish });
        });
        if (hops >= 2) leap(fx.homeY + drop * 0.4, 110, false, () => leap(fx.homeY + drop * 0.22, 90, false, strike));
        else strike();
      },
    });
  },
  // rear tall, then bring the whole weight down — shockwave on landing
  slam(scene, fx, impact, finish) {
    const l = scene.L, c = fx.cont;
    SFX.noise(0.45, 200, 1, 0.06, 80);
    scene.tweens.add({
      targets: c, y: fx.homeY - l.u(46), scaleX: 1.05, scaleY: 1.14, duration: 340, ease: 'Sine.easeOut',
      onComplete: () => scene.tweens.add({
        targets: c, y: fx.homeY + l.u(150), scaleY: 0.94, duration: 130, ease: 'Quad.easeIn',
        onComplete: () => {
          impact(1.2);
          const ring = scene.add.image(c.x, c.y + l.u(40), ssFxTex(scene, 'ring', fx.beast.tint))
            .setBlendMode('ADD').setAlpha(0.8).setScale(0.3).setDepth(58);
          scene.tweens.add({ targets: ring, scale: l.u(2.7), alpha: 0, duration: 480, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
          scene.starBurst.emitParticleAt(c.x, c.y + l.u(40), 14);
          scene.tweens.add({ targets: c, y: fx.homeY, scaleX: 1, scaleY: 1, duration: 520, ease: 'Sine.easeOut', onComplete: finish });
        },
      }),
    });
  },
  // whip a line of stars at the board (strands: the widow throws three silks)
  lash(scene, fx, impact, finish) {
    const l = scene.L, c = fx.cont, strands = Math.max(1, fx.def.strands | 0);
    SFX.noise(0.3, 900, 1.4, 0.06, 2600);
    scene.tweens.add({ targets: c, x: fx.homeX - l.u(14), duration: 90, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => c.setX(fx.homeX) });
    const headE = fx.beast.eyes[0];
    const from = { x: c.x + headE[0] * fx.sc, y: c.y + headE[1] * fx.sc };
    const tgt = { x: l.x(0), y: l.y(470) };
    const dotK = ssFxTex(scene, 'dot', fx.beast.tint);
    let landed = 0;
    for (let s = 0; s < strands; s++) {
      const to = { x: tgt.x + (s - (strands - 1) / 2) * l.u(64), y: tgt.y + Math.abs(s - (strands - 1) / 2) * l.u(18) };
      const ctrl = { x: (from.x + to.x) / 2 + (s % 2 ? -1 : 1) * l.u(90), y: (from.y + to.y) / 2 };
      const dots = [];
      for (let k = 0; k < 7; k++) dots.push(scene.add.image(from.x, from.y, dotK).setBlendMode('ADD').setDepth(58).setAlpha(0).setScale(1 - k * 0.09));
      const pr = { t: 0 };
      scene.tweens.add({
        targets: pr, t: 1, delay: 160 + s * 90, duration: 300, ease: 'Cubic.easeIn',
        onUpdate: () => dots.forEach((d, k) => {
          const tt = clamp(pr.t * 1.35 - k * 0.055, 0, 1);
          const p = ssQBez(from, ctrl, to, tt);
          d.x = p.x; d.y = p.y; d.alpha = tt > 0 ? 1 - k * 0.11 : 0;
        }),
        onComplete: () => {
          scene.starBurst.emitParticleAt(to.x, to.y, 6);
          dots.forEach((d) => scene.tweens.add({ targets: d, alpha: 0, duration: 160, onComplete: () => d.destroy() }));
          if (++landed === 1) impact(1);
          if (landed === strands) finish();
        },
      });
    }
  },
  // both claws sweep in from the sides and meet in a scissor of light
  snap(scene, fx, impact, finish) {
    const l = scene.L, c = fx.cont;
    SFX.noise(0.22, 700, 1.6, 0.06, 1600);
    scene.tweens.add({ targets: c, scaleX: 1.12, duration: 160, yoyo: true, ease: 'Sine.easeOut' });
    const tgt = { x: l.x(0), y: l.y(460) };
    const dotK = ssFxTex(scene, 'dot', fx.beast.tint);
    let met = 0;
    [-1, 1].forEach((side) => {
      const from = { x: c.x + side * l.u(110), y: c.y + l.u(30) };
      const ctrl = { x: tgt.x + side * l.u(150), y: (from.y + tgt.y) / 2 + l.u(30) };
      const dots = [];
      for (let k = 0; k < 5; k++) dots.push(scene.add.image(from.x, from.y, dotK).setBlendMode('ADD').setDepth(58).setAlpha(0).setScale(1.1 - k * 0.14));
      const pr = { t: 0 };
      scene.tweens.add({
        targets: pr, t: 1, delay: 220, duration: 280, ease: 'Cubic.easeIn',
        onUpdate: () => dots.forEach((d, k) => {
          const tt = clamp(pr.t * 1.3 - k * 0.06, 0, 1);
          const p = ssQBez(from, ctrl, tgt, tt);
          d.x = p.x; d.y = p.y; d.alpha = tt > 0 ? 1 - k * 0.14 : 0;
        }),
        onComplete: () => {
          dots.forEach((d) => scene.tweens.add({ targets: d, alpha: 0, duration: 140, onComplete: () => d.destroy() }));
          if (++met === 2) {
            impact(1);
            const bg = scene.add.graphics().setDepth(58).setBlendMode('ADD');
            bg.lineStyle(l.u(3.5), fx.beast.eye, 0.9);
            bg.lineBetween(tgt.x - l.u(60), tgt.y - l.u(40), tgt.x + l.u(60), tgt.y + l.u(40));
            bg.lineBetween(tgt.x - l.u(60), tgt.y + l.u(40), tgt.x + l.u(60), tgt.y - l.u(40));
            scene.starBurst.emitParticleAt(tgt.x, tgt.y, 10);
            scene.tweens.add({ targets: bg, alpha: 0, duration: 260, onComplete: () => bg.destroy() });
            finish();
          }
        },
      });
    });
  },
  // the whole constellation dives across the board in a wing-trailed arc
  swoop(scene, fx, impact, finish) {
    const l = scene.L, c = fx.cont, boss = !!fx.beast.boss;
    SFX.noise(0.5, 400, 1, 0.07, 900);
    const tgt = { x: l.x(0), y: l.y(440) };
    const side = Math.random() < 0.5 ? -1 : 1;
    scene.tweens.add({
      targets: c, y: fx.homeY - l.u(26), duration: 240, ease: 'Sine.easeOut',
      onComplete: () => {
        const p0 = { x: c.x, y: c.y };
        const c1 = { x: fx.homeX + side * l.u(170), y: (fx.homeY + tgt.y) / 2 };
        const pr = { t: 0 };
        scene.tweens.add({
          targets: pr, t: 1, duration: 380, ease: 'Quad.easeIn',
          onUpdate: () => {
            const p = ssQBez(p0, c1, tgt, pr.t);
            c.x = p.x; c.y = p.y;
            if (Math.random() < 0.6) scene.starBurst.emitParticleAt(c.x - side * l.u(30), c.y - l.u(16), 1);
          },
          onComplete: () => {
            impact(boss ? 1.25 : 1);
            scene.starBurst.emitParticleAt(c.x, c.y + l.u(20), boss ? 14 : 8);
            const c2 = { x: fx.homeX - side * l.u(170), y: (fx.homeY + tgt.y) / 2 + l.u(30) };
            const back = { t: 0 };
            scene.tweens.add({
              targets: back, t: 1, duration: 520, ease: 'Sine.easeOut',
              onUpdate: () => { const p = ssQBez(tgt, c2, { x: fx.homeX, y: fx.homeY }, back.t); c.x = p.x; c.y = p.y; },
              onComplete: finish,
            });
          },
        });
      },
    });
  },
  // the dragon rears and pours a comet stream onto the board
  breath(scene, fx, impact, finish) {
    const l = scene.L, c = fx.cont;
    SFX.noise(0.5, 300, 1, 0.07, 1500);
    const headE = fx.beast.eyes[0];
    scene.tweens.add({
      targets: c, y: fx.homeY - l.u(22), rotation: -0.05, scaleX: 1.05, scaleY: 1.05, duration: 320, ease: 'Sine.easeOut',
      onComplete: () => {
        SFX.noise(1.0, 600, 0.9, 0.09, 150);
        const tgt = { x: l.x(0), y: l.y(480) };
        const dotK = ssFxTex(scene, 'dot', fx.beast.eye);
        const dot2K = ssFxTex(scene, 'dot', fx.beast.tint);
        const N = 16;
        for (let k = 0; k < N; k++) {
          scene.time.delayedCall(k * 42, () => {
            if (fx.dead) return;
            const f = { x: c.x + headE[0] * fx.sc, y: c.y + headE[1] * fx.sc };
            const to = { x: tgt.x + (Math.random() - 0.5) * l.u(120), y: tgt.y + (Math.random() - 0.5) * l.u(60) };
            const ctrl = { x: (f.x + to.x) / 2 + l.u(40), y: f.y - l.u(30) };
            const d = scene.add.image(f.x, f.y, k % 3 ? dotK : dot2K).setBlendMode('ADD').setDepth(58).setScale(0.8 + Math.random() * 0.7);
            const pr = { t: 0 };
            scene.tweens.add({
              targets: pr, t: 1, duration: 230, ease: 'Quad.easeIn',
              onUpdate: () => { const p = ssQBez(f, ctrl, to, pr.t); d.x = p.x; d.y = p.y; },
              onComplete: () => {
                scene.starBurst.emitParticleAt(d.x, d.y, 2);
                d.destroy();
                if (k === 9) impact(1.35);
                else if (k % 4 === 0) scene.cameras.main.shake(50, 0.002);
              },
            });
          });
        }
        scene.time.delayedCall(N * 42 + 300, () => scene.tweens.add({
          targets: c, y: fx.homeY, rotation: 0, scaleX: 1, scaleY: 1, duration: 420, ease: 'Sine.easeOut', onComplete: finish,
        }));
      },
    });
  },
  // rear back, then gallop low across the board — hoofbeat bob, a stardust
  // wake, and a trampling ground-ring (unicorn, bull; amp = the centaur's cut)
  charge(scene, fx, impact, finish) {
    const l = scene.L, c = fx.cont, amp = fx.def.amp || 1;
    SFX.noise(0.5, 220, 1, 0.07, 260);
    const side = Math.random() < 0.5 ? -1 : 1;
    const tgt = { x: l.x(0), y: l.y(452) };
    scene.tweens.add({
      targets: c, y: fx.homeY - l.u(30), scaleX: 1.06, scaleY: 1.06, duration: 300, ease: 'Sine.easeOut',
      onComplete: () => {
        SFX.noise(0.7, 160, 1.1, 0.08, 90);
        const p0 = { x: c.x, y: c.y };
        const c1 = { x: fx.homeX + side * l.u(150), y: (fx.homeY + tgt.y) / 2 + l.u(20) };
        const pr = { t: 0 };
        scene.tweens.add({
          targets: pr, t: 1, duration: 420, ease: 'Quad.easeIn',
          onUpdate: () => {
            const p = ssQBez(p0, c1, tgt, pr.t);
            c.x = p.x;
            c.y = p.y - Math.abs(Math.sin(pr.t * Math.PI * 3)) * l.u(10);   // gallop bob
            if (Math.random() < 0.7) scene.starBurst.emitParticleAt(c.x - side * l.u(26), c.y + l.u(24), 1);
          },
          onComplete: () => {
            impact(amp > 1 ? 1.3 : 1.15);
            const ring = scene.add.image(c.x, c.y + l.u(30), ssFxTex(scene, 'ring', fx.beast.tint))
              .setBlendMode('ADD').setAlpha(0.85).setScale(0.3).setDepth(58);
            scene.tweens.add({ targets: ring, scale: l.u(2.4), alpha: 0, duration: 460, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
            scene.starBurst.emitParticleAt(c.x, c.y + l.u(26), 12);
            scene.cameras.main.shake(120, 0.004);
            const c2 = { x: fx.homeX - side * l.u(170), y: (fx.homeY + tgt.y) / 2 };
            const back = { t: 0 };
            scene.tweens.add({
              targets: back, t: 1, duration: 540, ease: 'Sine.easeOut',
              onUpdate: () => { const p = ssQBez(tgt, c2, { x: fx.homeX, y: fx.homeY }, back.t); c.x = p.x; c.y = p.y; },
              onComplete: finish,
            });
          },
        });
      },
    });
  },
  // draw and hold... then a fan of light-arrows streaks onto the board, each
  // with its own thud (the archer's signature; the peacock's feather-darts)
  volley(scene, fx, impact, finish) {
    const l = scene.L, c = fx.cont, bolts = Math.max(3, fx.def.bolts | 0);
    SFX.noise(0.35, 1200, 1.6, 0.05, 3000);
    const headE = fx.beast.eyes[0];
    scene.tweens.add({ targets: c, y: fx.homeY - l.u(14), scaleX: 0.965, duration: 340, ease: 'Sine.easeOut' });
    const dotK = ssFxTex(scene, 'dot', fx.beast.eye);
    const tgt = { x: l.x(0), y: l.y(470) };
    let flown = 0;
    for (let k = 0; k < bolts; k++) {
      scene.time.delayedCall(430 + k * 120, () => {
        if (fx.dead) return;
        SFX.noise(0.12, 1800, 2.2, 0.03, 4200);
        const f = { x: c.x + headE[0] * fx.sc, y: c.y + headE[1] * fx.sc };
        const to = { x: tgt.x + (k - (bolts - 1) / 2) * l.u(52), y: tgt.y + Math.abs(k - (bolts - 1) / 2) * l.u(14) };
        const darts = [];
        for (let j = 0; j < 4; j++) darts.push(scene.add.image(f.x, f.y, dotK).setBlendMode('ADD').setDepth(58).setScale(1 - j * 0.18).setAlpha(0));
        const pr = { t: 0 };
        scene.tweens.add({
          targets: pr, t: 1, duration: 170, ease: 'Linear',
          onUpdate: () => darts.forEach((d, j) => {
            const tt = clamp(pr.t - j * 0.07, 0, 1);
            d.x = f.x + (to.x - f.x) * tt; d.y = f.y + (to.y - f.y) * tt;
            d.alpha = tt > 0 ? 1 - j * 0.2 : 0;
          }),
          onComplete: () => {
            darts.forEach((d) => scene.tweens.add({ targets: d, alpha: 0, duration: 120, onComplete: () => d.destroy() }));
            scene.starBurst.emitParticleAt(to.x, to.y, 4);
            scene.cameras.main.shake(60, 0.0024);
            if (++flown === 1) impact(fx.beast.boss ? 1.3 : 1.05);
            if (flown === bolts) scene.tweens.add({ targets: c, y: fx.homeY, scaleX: 1, duration: 380, ease: 'Sine.easeOut', onComplete: finish });
          },
        });
      });
    }
  },
  // the phoenix rises, whitens, and detonates in rings of dawn-fire
  nova(scene, fx, impact, finish) {
    const l = scene.L, c = fx.cont;
    SFX.noise(0.9, 250, 1, 0.07, 2400);
    scene.tweens.add({
      targets: c, y: fx.homeY - l.u(46), scaleX: 1.1, scaleY: 1.1, duration: 430, ease: 'Sine.easeOut',
      onComplete: () => {
        const ringK = ssFxTex(scene, 'ring', fx.beast.eye);
        const dotK = ssFxTex(scene, 'dot', fx.beast.tint);
        scene.cameras.main.flash(360, 255, 200, 120, false);
        for (let w = 0; w < 2; w++) {
          const ring = scene.add.image(c.x, c.y, ringK).setBlendMode('ADD').setAlpha(0.85 - w * 0.25).setScale(0.3).setDepth(58);
          scene.tweens.add({ targets: ring, scale: l.u(3.6 + w * 0.8), alpha: 0, delay: w * 130, duration: 620, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
        }
        for (let k = 0; k < 22; k++) {
          const a = (k / 22) * Math.PI * 2;
          const d = scene.add.image(c.x, c.y, dotK).setBlendMode('ADD').setDepth(58).setScale(0.7 + Math.random() * 0.6);
          scene.tweens.add({ targets: d, x: c.x + Math.cos(a) * l.u(240), y: c.y + Math.sin(a) * l.u(240), alpha: 0, duration: 560 + Math.random() * 200, ease: 'Cubic.easeOut', onComplete: () => d.destroy() });
        }
        scene.time.delayedCall(210, () => impact(1.5));
        scene.tweens.add({ targets: c, y: fx.homeY, scaleX: 1, scaleY: 1, delay: 420, duration: 480, ease: 'Sine.easeOut', onComplete: finish });
      },
    });
  },
};

// The factory. asm = ssAssembleBeast's return. opts.lite (home showcase):
// presence only — no threat, no attacks, dimmer aura, no boss fanfare.
function ssBeastFx(scene, cont, beast, unitScale, asm, opts) {
  opts = opts || {};
  const sc = unitScale * (beast.boss ? 1.15 : beast.tier === 'mini' ? 1.06 : 1);
  const def = beast.fx || {};
  const stars = asm.stars, eyes = asm.eyes, g = asm.lines;
  const xs = beast.stars.map((p) => p[0]), ys = beast.stars.map((p) => p[1]);
  const homes = beast.stars.map((p) => ({ x: p[0] * sc, y: p[1] * sc }));
  const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
  const fx = {
    scene, cont, beast, sc, def, k: sc, ready: false, dead: false, attacking: false,
    threat: 0, bright: 0, charged: false, armT: Infinity,
    cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, topY: minY + (maxY - minY) * 0.3,
    homeX: cont.x, homeY: cont.y,
  };
  const idles = String(def.idle || '').split('+').map((n) => SS_IDLE_FX[n]).filter(Boolean);
  const lw = unitScale * 1.25;

  // eyes ride the idle field of their nearest star
  const eyeMeta = beast.eyes.map((e) => {
    let bi = 0, bd = 1e9;
    beast.stars.forEach((p, i) => {
      const dx = p[0] - e[0], dy = p[1] - e[1], d = dx * dx + dy * dy;
      if (d < bd) { bd = d; bi = i; }
    });
    return { hx: e[0], hy: e[1], i: bi, x0: e[0] * sc, y0: e[1] * sc };
  });

  // ---- the nebula body: soft glow blobs behind the lines, breathing slowly
  const glowKey = ssFxTex(scene, 'glow', beast.tint);
  const anchors = [{ x: fx.cx, y: fx.cy, s: 1.25 }];
  const stepN = Math.max(2, Math.floor(beast.stars.length / (beast.boss ? 4 : 5)));
  for (let i = 0; i < beast.stars.length; i += stepN) anchors.push({ x: xs[i], y: ys[i], s: 0.62 });
  const baseA = (opts.lite ? 0.07 : beast.boss ? 0.13 : beast.tier === 'mini' ? 0.115 : 0.1);
  const aura = anchors.map((a, i) => {
    const im = scene.add.image(a.x * sc, a.y * sc, glowKey).setBlendMode('ADD').setAlpha(0);
    im.hx = a.x * sc; im.hy = a.y * sc;
    im.baseS = 0.69 * a.s * sc * (beast.boss ? 1.3 : 1);
    im.baseA = baseA * (i === 0 ? 1.4 : 1);
    im.w = 0.55 + (i * 0.37) % 0.6; im.ph = i * 1.93;
    cont.addAt(im, 0);
    return im;
  });
  // bosses wear a slow-turning halo ring — the tier marker
  let halo = null;
  if (beast.boss && !opts.lite) {
    halo = scene.add.image(fx.cx * sc, fx.cy * sc, ssFxTex(scene, 'ring', beast.tint)).setBlendMode('ADD').setAlpha(0);
    halo.baseS = 1.5 * sc;
    cont.addAt(halo, 0);
  }

  // ---- traveling glints: starlight running along the edges
  const glints = [];
  const spawnGlint = () => {
    if (fx.dead || !fx.ready || glints.length >= (beast.boss ? 3 : 2)) return;
    const e = beast.edges[Math.floor(Math.random() * beast.edges.length)];
    const gi = scene.add.image(stars[e[0]].x, stars[e[0]].y, 'dot').setBlendMode('ADD').setScale(0.45).setAlpha(0);
    cont.add(gi); glints.push(gi);
    const pr = { t: 0 };
    scene.tweens.add({
      targets: pr, t: 1, duration: 420 + Math.random() * 260, ease: 'Sine.easeInOut',
      onUpdate: () => {
        const a = stars[e[0]], b = stars[e[1]];
        gi.x = a.x + (b.x - a.x) * pr.t; gi.y = a.y + (b.y - a.y) * pr.t;
        gi.alpha = Math.sin(pr.t * Math.PI) * 0.9;
      },
      onComplete: () => { glints.splice(glints.indexOf(gi), 1); gi.destroy(); },
    });
  };
  const glintTimer = scene.time.addEvent({
    delay: 640, loop: true,
    callback: () => { if (Math.random() < 0.35 + fx.threat * 0.5 + (beast.boss ? 0.2 : 0)) spawnGlint(); },
  });

  // ---- arm once the assembly finishes (fly-in tweens own the stars until then)
  const armTimer = scene.time.delayedCall(beast.stars.length * 40 + 760, () => {
    fx.ready = true; fx.armT = scene.time.now;
    scene.tweens.killTweensOf(g); g.setAlpha(1);   // fx owns line alpha per-edge now
    if (beast.boss && !opts.lite) {                // the boss announces its tier
      scene.cameras.main.flash(300, 60, 50, 90);
      SFX.noise(0.8, 120, 1, 0.08, 50);
      const rk = scene.add.image(cont.x, cont.y, ssFxTex(scene, 'ring', beast.tint))
        .setBlendMode('ADD').setDepth(55).setAlpha(0.7).setScale(0.4 * sc);
      scene.tweens.add({ targets: rk, scale: 2.6 * sc, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => rk.destroy() });
    }
  });

  // ---- per-frame: idle field, live line redraw (shimmer), aura breath
  const upd = (time, delta) => {
    if (fx.dead) return;
    const T = time / 1000;
    fx.bright *= Math.exp(-(delta || 16) / 150);
    const gain = clamp((time - fx.armT) / 900, 0, 1);
    const heat = 1 + fx.threat * 1.1 + fx.bright * 1.6;
    for (let i = 0; i < aura.length; i++) {
      const b = aura[i];
      b.alpha = Math.min(0.5, gain * b.baseA * (0.7 + 0.3 * Math.sin(T * b.w + b.ph)) * heat);
      b.setScale(b.baseS * (1 + 0.08 * Math.sin(T * b.w * 1.3 + b.ph)));
      b.x = b.hx + Math.sin(T * 0.4 + b.ph) * 3 * sc;
      b.y = b.hy + Math.cos(T * 0.31 + b.ph) * 2 * sc;
    }
    if (halo) {
      halo.alpha = Math.min(0.6, gain * (0.16 + fx.threat * 0.2 + fx.bright * 0.3) * (0.8 + 0.2 * Math.sin(T * 0.9)));
      halo.rotation = T * 0.12;
      halo.setScale(halo.baseS * (1 + 0.06 * Math.sin(T * 0.7)));
    }
    if (!fx.ready) return;
    // idle: creature-specific offsets over the authored homes
    for (let i = 0; i < stars.length; i++) {
      const o = { x: 0, y: 0 };
      for (let f = 0; f < idles.length; f++) idles[f](fx, T, i, xs[i], ys[i], o);
      stars[i].x = homes[i].x + o.x * gain;
      stars[i].y = homes[i].y + o.y * gain;
    }
    for (let i = 0; i < eyeMeta.length; i++) {
      const em = eyeMeta[i], eye = eyes[i];
      if (!eye) continue;
      const o = { x: 0, y: 0 };
      for (let f = 0; f < idles.length; f++) idles[f](fx, T, em.i, em.hx, em.hy, o);
      eye.x = em.x0 + o.x * gain; eye.y = em.y0 + o.y * gain;
      if (fx.charged) eye.setScale(0.9 + Math.max(0, Math.sin(T * 7)) * 0.5);
    }
    // edges redrawn from live star positions — starlight shimmer, per edge
    g.clear();
    for (let ei = 0; ei < beast.edges.length; ei++) {
      const e = beast.edges[ei], a = stars[e[0]], b = stars[e[1]];
      const al = 0.3 + Math.sin(T * 1.35 + ei * 1.71) * 0.13 + fx.threat * 0.18 + fx.bright * 0.6;
      g.lineStyle(lw, 0xffffff, clamp(al, 0.12, 1));
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
    // the body breathes (container scale) unless an attack owns the transform
    if (!fx.attacking) {
      const s = 0.5 + 0.5 * Math.sin(T * 1.96);
      cont.setScale(1 + s * 0.035, 1 - s * 0.028);
    }
  };
  scene.events.on('update', upd);

  // ---- api ----
  fx.setThreat = (v) => {
    fx.threat = clamp(v || 0, 0, 1);
    const ch = fx.threat >= 0.999;
    if (ch && !fx.charged) {
      fx.charged = true;
      fx.bright = Math.max(fx.bright, 0.5);
      SFX.noise(0.6, 160, 1.1, 0.05, 60);   // low rumble — the sky tenses
    } else if (!ch && fx.charged) {
      fx.charged = false;
      eyes.forEach((e) => e.setScale(0.9));
    }
  };
  fx.hitFlash = () => { fx.bright = 1; };
  fx.attack = (onImpact) => {
    const name = SS_ATK_FX[def.atk] ? def.atk : 'pounce';
    window.__SSFX = window.__SSFX || { atk: {} };
    window.__SSFX.atk[name] = (window.__SSFX.atk[name] | 0) + 1;
    fx.attacking = true;
    let hit = false;
    const impact = (mult) => { if (!hit) { hit = true; onImpact(mult || 1); } };
    // watchdog: a strike must always land — a stalled archetype ends the run's turn
    scene.time.delayedCall(2600, () => impact(1));
    SS_ATK_FX[name](scene, fx, impact, () => {
      fx.attacking = false;
      if (!fx.dead) { cont.setPosition(fx.homeX, fx.homeY); cont.setRotation(0); }
    });
  };
  fx.die = () => {
    if (fx.dead) return;
    fx.dead = true;
    glintTimer.remove();
    const parts = halo ? aura.concat([halo]) : aura;
    parts.forEach((b) => scene.tweens.add({
      targets: b, x: fx.cx * sc, y: fx.cy * sc, alpha: 0, scale: b.baseS * 0.2, duration: 550, ease: 'Cubic.easeIn',
    }));
  };
  fx.destroy = () => {
    fx.dead = true;
    scene.events.off('update', upd);
    glintTimer.remove();
    if (armTimer) armTimer.remove(false);
  };
  scene.events.once('shutdown', fx.destroy);
  return fx;
}

/* ---- tile glyph cache ----------------------------------------------------
   Board tiles used to carry two live Text objects each — 32 fresh canvas
   rasters + GPU uploads landing in the single frame that builds a board,
   the biggest slice of the arrival hitch at the top of the rise (and a
   smaller one on every mid-battle refill and word-line tap). Letters and
   values bake once per (glyph, ink) into small canvas textures — idle-
   prewarmed from the meadow — and tiles just point images at them.
   Box is 64x48 design units with the letter at font 36 (Qu at 30); consumers
   scale the box, so the word-line's font-20 look is the same texture at
   20/36 scale. */
const SS_TILE_INK = ['#3a3020', '#5a3c05', '#1d4a66', '#1f4d22'];    // letter ink per tier (3 = dew)
// value ink per tier — deliberately near the letter ink's darkness: the old
// pale inks made the worth unreadable at arm's length (Wyatt's call)
const SS_TILE_VINK = ['#655636', '#5f420a', '#215a7c', '#22572a'];
// the dew's value chip is ♥6, never the letter's points — orange↔green is the
// classic colorblind pair and the heart is the tell (SS_TILE_VINK[3] ink)
const SS_DEW_CHIP = () => '♥' + DEW_HEAL;
// the blackout curse: inked letters read in pale ash on the void face —
// still legible, clearly cursed, and the flat 0 says what they're worth
const SS_BLK_INK = '#b9b0d8';
const SS_TIER_GLOW = [0xffd77a, 0xffd77a, 0x9fd8ff, 0xa8e88a];   // bloom tint per tier
const SS_BLK_VINK = '#9a90c4';
const SS_LINE_GREEN = '#1d6a35';                          // word-line "valid" ink
function ssGlyph(scene, ch, color) {
  const key = 'gl-' + ch + '-' + color;
  if (!scene.textures.exists(key)) {
    // multi-letter tiles (Qu, and CH/LL/RR in Spanish) drop to 30 to fit the
    // box; accented caps (Ñ Ä Ö Ü Ç) drop to 32 with no downward nudge so the
    // tilde/umlaut keeps headroom instead of clipping at the canvas top
    const R = ssTexRes(scene), acc = ch.length === 1 && /[ñäöüç]/.test(ch);
    const fs = ch.length > 1 ? 30 : acc ? 32 : 36;
    const t = scene.textures.createCanvas(key, Math.round(64 * R), Math.round(48 * R));
    const c = t.context;
    c.scale(R, R);
    c.font = 'bold ' + fs + 'px ' + SERIF;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = color;
    // caps sit a touch above the em middle in serifs — nudge to optical centre
    c.fillText(ch === 'qu' ? 'Qu' : ch.toUpperCase(), 32, 24 + fs * (acc ? 0.02 : 0.06));
    t.refresh();
  }
  return key;
}
function ssGlyphVal(scene, v, color) {
  const key = 'gv-' + v + '-' + color;
  if (!scene.textures.exists(key)) {
    const R = ssTexRes(scene);
    const t = scene.textures.createCanvas(key, Math.round(30 * R), Math.round(20 * R));
    const c = t.context;
    c.scale(R, R);
    // 15px, up from 12 — the point value has to read at arm's length on a
    // phone without shouldering the main letter aside
    c.font = 'bold 15px ' + SERIF;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = color;
    c.fillText(String(v), 15, 10.7);
    t.refresh();
  }
  return key;
}
function ssPrewarmGlyphs(scene) {
  const jobs = [];
  for (const base of Object.keys(PACK.bag)) {
    const ch = PACK.digraph[base] || base;
    for (let tier = 0; tier < 4; tier++) {
      const v = tier === 3 ? SS_DEW_CHIP() : (VALS[ch] || VALS[ch[0]] || 1) + (tier === 1 ? 6 : 0);
      jobs.push(() => { ssGlyph(scene, ch, SS_TILE_INK[tier]); ssGlyphVal(scene, v, SS_TILE_VINK[tier]); });
    }
    jobs.push(() => ssGlyph(scene, ch, SS_LINE_GREEN));
  }
  // a few per tick — baking all ~130 in one frame would itself hitch the idle
  const ev = scene.time.addEvent({
    delay: 40, loop: true, callback: () => {
      for (let i = 0; i < 6 && jobs.length; i++) jobs.shift()();
      if (!jobs.length) ev.remove();
    },
  });
}

function ssTxt(scene, x, y, str, size, color, style) {
  // shadow stays tight — a soft wide black blur turned small text to smear on
  // gold buttons at retina; a crisp 1px-ish drop keeps contrast without mush
  return scene.add.text(x, y, str, {
    fontFamily: SERIF, fontSize: size + 'px', color: color || '#f0e8d2', fontStyle: style || 'bold',
  }).setShadow(0, Math.max(1, size * 0.05), 'rgba(0,0,0,0.45)', size * 0.09);
}

/* ---- ONE LINE PER TEXT -----------------------------------------------------
   TestFlight v0.43.0 (8/21): FIRST LIGHT, BLOOD INK and LEYLINE ROOTS reached
   Wyatt's phone with their effect text BLANK — and v0.38's MOONWARD before
   them. Every victim is a desc that WRAPS TO A SECOND LINE; every one-line
   desc renders. A Phaser multi-line wrapped-italic bake produces an inkless
   canvas on iOS WebKit for these strings, every time, and the healer's
   RE-bake fails the same way — so the fix is to never ask Phaser to bake a
   multi-line Text on these surfaces at all. Phaser's own wrap measurement is
   still used (so the breaks land exactly where wordWrap put them), but each
   line becomes its OWN single-line Text object, stacked at the same
   lineSpacing. Single-line bakes are proven good on his device.
   Scripts: ja/zh wrap without spaces, so they take Phaser's char-level
   (advanced) wrap; Arabic/Hindi split only at spaces, and each line is shaped
   and bidi-ordered by the canvas on its own, exactly as the line would have
   been inside one canvas. A word that cannot break inside the width shrinks
   the whole block's font (to 70%) rather than ever baking a multi-line Text.
   Returns { lines, size } — the line strings and the font size that fit. */
function ssWrapLines(scene, str, style, wrapW) {
  const s = String(str == null ? '' : str);
  const cjk = SS_LANG === 'ja' || SS_LANG === 'zh' || /[぀-ヿ㐀-鿿]/.test(s);
  const size0 = parseFloat(style.fontSize) || 12;
  let size = size0, lines = [s];
  for (let tries = 0; tries < 12; tries++) {
    const probe = scene.make.text({
      text: s, style: Object.assign({}, style, { fontSize: size + 'px', wordWrap: { width: wrapW, useAdvancedWrap: cjk } }),
    }, false);
    let fits = true;
    try {
      const w = probe.getWrappedText(s);
      lines = Array.isArray(w) ? w.slice() : String(w).split('\n');
      probe.style.syncFont(probe.canvas, probe.context);
      for (const ln of lines) if (probe.context.measureText(ln).width > wrapW + 0.5) { fits = false; break; }
    } catch (e) { fits = true; }
    probe.destroy();
    if (fits || size <= size0 * 0.7) break;
    size = Math.max(size0 * 0.7, size - Math.max(0.5, size0 * 0.06));
  }
  return { lines, size };
}
// A wrapped paragraph as a container of single-line Texts. `o` carries the
// Text style (fontSize/color/fontStyle, SERIF by default) plus wrapW (px),
// lineSpacing (px), align ('left'|'center'), ox/oy (origin), shadow (the
// ssTxt drop) and sf (scrollFactor 0 on EVERY child — inside a container the
// camera consults the child's, see tools/README.md). Sizes itself so
// `.height` reads like a Text's for the rite's measured ladder; `.lines` are
// the children, `setBlockText` rebuilds them in place. No child ever holds
// a newline: that is the law the suites pin.
function ssTextBlock(scene, x, y, str, o) {
  const c = scene.add.container(x, y);
  c.setData('textBlock', true);
  c.lines = [];
  c.blockOpts = o;
  const build = (txt) => {
    for (const t of c.lines) t.destroy();
    c.lines = [];
    const style = { fontFamily: o.fontFamily || SERIF, fontSize: o.fontSize, color: o.color, fontStyle: o.fontStyle || 'normal' };
    const wrapW = o.wrapW, sp = o.lineSpacing || 0, ox = o.ox || 0, oy = o.oy || 0;
    const r = ssWrapLines(scene, txt, style, wrapW);
    style.fontSize = r.size + 'px';
    const made = r.lines.map((ln) => {
      const t = scene.add.text(0, 0, ln, style);
      if (o.shadow) t.setShadow(0, Math.max(1, r.size * 0.05), 'rgba(0,0,0,0.45)', r.size * 0.09);
      if (o.sf) t.setScrollFactor(0);
      return t;
    });
    const lh = made.length ? made[0].height : 0;
    const n = made.length, totalH = n * lh + Math.max(0, n - 1) * sp;
    const blockW = Math.max(wrapW || 0, ...made.map((t) => t.width));
    made.forEach((t, k) => {
      const ly = -oy * totalH + k * (lh + sp);
      if (o.align === 'center') t.setOrigin(0.5, 0).setPosition((0.5 - ox) * blockW, ly);
      else t.setOrigin(0, 0).setPosition(-ox * blockW, ly);
      c.add(t);
    });
    c.lines = made;
    c.setSize(blockW, totalH);
    c.text = txt;
  };
  c.setBlockText = (txt) => { if (c.active) build(String(txt == null ? '' : txt)); return c; };
  // the Text verbs call sites already use, so a wrapped label can swap in
  c.setText = c.setBlockText;
  c.setColor = (col) => { o.color = col; return c.setBlockText(c.text); };
  if (o.sf) c.setScrollFactor(0);
  build(String(str == null ? '' : str));
  return c;
}

/* ---- blank-text self-healing ---------------------------------------------
   TestFlight, 8/19: a rare sigil card reached Wyatt's screen with its rarity
   ribbon painted and its effect text BLANK — the one Text object on the card
   that drew nothing, unreproducible in headless Chrome AND real WebKit (both
   renderers, notch insets and all). Every Phaser Text bakes its string into a
   private canvas ONCE and blits that canvas each frame, so a single failed or
   purged bake (iOS reclaims canvas backing stores under pressure and in the
   background) is INVISIBLE to the game and permanent on screen. This sweeps a
   scene's live Texts, samples each canvas's alpha, and re-bakes any that hold
   a non-empty string but zero ink. Runs after the surfaces where a silent
   blank costs the player information (sigil cards, inspector, end screen) and
   whenever the app returns to the foreground. DIAG counts every save. */
function ssHasInk(o) {
  const cw = o.canvas.width, ch = o.canvas.height;
  if (!cw || !ch) return false;
  const ctx = o.context || o.canvas.getContext('2d');
  const d = ctx.getImageData(0, 0, Math.min(cw, 512), Math.min(ch, 256)).data;
  for (let i = 3; i < d.length; i += 32) if (d[i] > 8) return true;
  return false;
}
/* A heal is only a heal once the RE-bake has been checked for ink too. On
   Wyatt's phone (v0.43.0) this sweep was "healing" the two-line sigil descs
   on every pick and shipping blanks, because the re-bake failed exactly as
   the first bake had; now a Text that stays inkless is reported as
   `unhealable: <first words>` instead of counted, so the DIAG tells the
   truth and the next bug has a name. */
function ssHealBlankTexts(scene, tag) {
  let healed = 0;
  const stuck = [];
  const walk = (list) => list.forEach((o) => {
    if (o.list) walk(o.list);
    if (o.type !== 'Text' || !o.canvas || !o.visible || !(o.text || '').trim()) return;
    try {
      if (ssHasInk(o)) return;
      o.updateText();
      if (ssHasInk(o)) healed++;
      else stuck.push(String(o.text).replace(/\s+/g, ' ').trim().split(' ').slice(0, 4).join(' '));
    } catch (e) { }
  });
  if (scene && scene.children) walk(scene.children.list);
  if (healed) DIAG('healed ' + healed + ' blank text(s) · ' + (tag || '?'));
  for (const s of stuck) DIAG('unhealable: ' + s + ' · ' + (tag || '?'));
  return healed;
}
// a return from the background is when iOS is most likely to have purged
// canvas backing stores — sweep every live scene as the game wakes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !window.game || !game.isBooted) return;
  try { for (const sc of game.scene.getScenes(true)) ssHealBlankTexts(sc, 'wake'); } catch (e) { }
});

// The title wordmark — live text drawn once into a canvas texture in the palette
// of the painted set. Latin titles get the hand-set treatment (gentle arch,
// bookend letters a touch larger, tight tracking, per-letter tilt along the
// curve); any non-Latin title falls back to a single run, because per-letter
// transforms would break Arabic shaping and RTL ordering. Layers, in paint
// order: warm halo · letterpress drop · outer gold hairline · navy rim ·
// per-letter gold gradient · inner bevel · dust speckle · top sheen.
// Returns { key, w, h, anchors } in design units; anchors are letter-tip
// points (relative to the texture centre) where the home scene sets sparkles.
function ssTitleTex(scene) {
  const R = Math.max(2, ssTexRes(scene));
  const key = 'title@' + SS_LANG;
  const text = SS_T('title'), px = 46 * R;
  const font = (s) => '900 ' + Math.round(s) + 'px ' + SERIF;
  if (scene.textures.exists(key)) {
    const tex = scene.textures.get(key), f = tex.getSourceImage();
    return { key, w: f.width / R, h: f.height / R, anchors: tex.ssAnchors || [] };
  }
  const latin = !/[^\u0000-ɏ\s]/.test(text);
  const meas = document.createElement('canvas').getContext('2d');
  const A = latin ? px * 0.16 : 0;             // arch height
  let letters = null, tw = 0, asc = 0, desc = 0;
  if (latin) {
    letters = [];
    const n = text.length;
    let x = 0;
    for (let i = 0; i < n; i++) {
      const lt = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;      // -1 .. 1 across the word
      const sc = 1 + 0.09 * lt * lt;                     // bookends slightly larger
      meas.font = font(px * sc);
      const m = meas.measureText(text[i]);
      letters.push({ ch: text[i], x, lw: m.width, sc, lt });
      x += m.width - px * 0.015;                         // tight tracking
      asc = Math.max(asc, Math.ceil(m.actualBoundingBoxAscent || px * 0.8));
      desc = Math.max(desc, Math.ceil(m.actualBoundingBoxDescent || px * 0.05));
    }
    tw = x + px * 0.015;
  } else {
    meas.font = font(px);
    const m = meas.measureText(text);
    tw = m.width;
    asc = Math.ceil(m.actualBoundingBoxAscent || px * 0.8);
    desc = Math.ceil(m.actualBoundingBoxDescent || px * 0.25);
  }
  const padX = Math.ceil(px * 0.42), padY = Math.ceil(px * 0.40);
  const W = Math.ceil(tw) + padX * 2, H = Math.ceil(asc + desc + A) + padY * 2;
  const t = scene.textures.createCanvas(key, W, H);
  const c = t.context, by = padY + A + asc;    // baseline of an unarched letter
  c.textBaseline = 'alphabetic';
  // each(fn) walks the word with the arch transform applied; every layer below
  // paints through it, so the layers stay registered. fn draws at (0,0) on the
  // letter's baseline centre and gets that letter's scale for local gradients.
  const each = (fn) => {
    if (!latin) {
      c.save(); c.translate(W / 2, by);
      c.font = font(px); c.textAlign = 'center';
      if (SS_LANG === 'ar') c.direction = 'rtl';
      fn(text, 1);
      c.restore(); return;
    }
    for (const L of letters) {
      c.save();
      c.translate(padX + L.x + L.lw / 2, by - A * (1 - L.lt * L.lt));
      c.rotate(Math.atan((2 * A * L.lt) / (tw / 2)) * 0.8);   // tilt along the curve
      c.font = font(px * L.sc); c.textAlign = 'center';
      fn(L.ch, L.sc);
      c.restore();
    }
  };
  // warm halo
  c.shadowColor = 'rgba(201,169,79,0.5)'; c.shadowBlur = px * 0.28;
  c.fillStyle = '#c9a94f';
  each((ch) => { c.fillText(ch, 0, 0); c.fillText(ch, 0, 0); });
  c.shadowColor = 'transparent'; c.shadowBlur = 0;
  // letterpress drop
  c.fillStyle = 'rgba(16,12,34,0.85)';
  each((ch) => c.fillText(ch, 0, px * 0.05));
  // outer gold hairline, then the navy rim the buttons taught us
  c.lineJoin = 'round';
  c.strokeStyle = '#e6c87e'; c.lineWidth = px * 0.085;
  each((ch) => c.strokeText(ch, 0, 0));
  c.strokeStyle = '#241c40'; c.lineWidth = px * 0.055;
  each((ch) => c.strokeText(ch, 0, 0));
  // gold gradient fill, per letter so the tone is uniform along the arch
  each((ch, sc) => {
    const g = c.createLinearGradient(0, -asc * sc, 0, desc + px * 0.04);
    g.addColorStop(0, '#fff7dc'); g.addColorStop(0.35, '#ffe08d');
    g.addColorStop(0.62, '#d7b45c'); g.addColorStop(1, '#9c7a28');
    c.fillStyle = g;
    c.fillText(ch, 0, 0);
  });
  // inner bevel — clipped strokes: light under the top edges, shade above the bottom
  c.globalCompositeOperation = 'source-atop';
  c.strokeStyle = 'rgba(255,252,240,0.28)'; c.lineWidth = px * 0.03;
  each((ch) => c.strokeText(ch, 0, px * 0.014));
  c.strokeStyle = 'rgba(60,32,4,0.30)';
  each((ch) => c.strokeText(ch, 0, -px * 0.014));
  // dust speckle, like the button faces wear
  if (latin) {
    for (const L of letters) {
      const cx = padX + L.x + L.lw / 2, cy = by - A * (1 - L.lt * L.lt);
      for (let i = 0; i < 9; i++) {
        const dark = i % 3 === 0;
        c.fillStyle = dark ? 'rgba(50,30,6,0.22)' : 'rgba(255,246,220,0.20)';
        c.beginPath();
        c.arc(cx + (Math.random() - 0.5) * L.lw * 0.8, cy - Math.random() * asc * L.sc * 0.9 + Math.random() * desc,
          px * (0.008 + Math.random() * 0.014), 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  // top sheen across the whole mark
  const sh = c.createLinearGradient(0, by - A - asc, 0, by - A - asc + (asc + desc + A) * 0.42);
  sh.addColorStop(0, 'rgba(255,255,255,0.34)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sh;
  c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'source-over';
  t.refresh();
  // sparkle anchors: letter-tip points, so the sky feels like it owns the mark
  let anchors = [];
  if (latin && letters.length > 2) {
    const n = letters.length;
    const pick = [[1, 0.8, -1], [Math.round(n * 0.55), 0.5, -1], [n - 1, 0.9, 0.35]];
    anchors = pick.map(([i, fx, fy]) => {
      const L = letters[Math.min(i, n - 1)];
      const cy = by - A * (1 - L.lt * L.lt);
      return { x: (padX + L.x + L.lw * fx - W / 2) / R, y: (cy + (fy < 0 ? fy * asc * L.sc : fy * desc + px * 0.04) - H / 2) / R };
    });
  }
  t.ssAnchors = anchors;
  return { key, w: W / R, h: H / R, anchors };
}

// The divider under the title. With the painted art on it is a strip of the
// actual button braid — the title and the buttons literally share material —
// with a ✦ set in the middle; the procedural build gets a plain gold hairline
// so the layout doesn't jump between modes. Both ends fade out.
function ssBraidTex(scene) {
  const key = 'titlebraid';
  const R = Math.max(2, ssTexRes(scene));
  if (scene.textures.exists(key)) {
    const f = scene.textures.get(key).getSourceImage();
    return { key, w: f.width / R, h: f.height / R };
  }
  const W = Math.round(250 * R), H = Math.round(16 * R);
  const t = scene.textures.createCanvas(key, W, H);
  const c = t.context, mid = W / 2, gap = 13 * R;
  if (ART && SSART.ready) {
    const img = SSART.img.btn;
    const bh = 7 * R, byy = (H - bh) / 2;
    // the button's top braid run, between the corners
    c.drawImage(img, 130, 10, img.width - 260, 30, 0, byy, mid - gap / 2, bh);
    c.save(); c.translate(W, 0); c.scale(-1, 1);       // mirrored right half
    c.drawImage(img, 130, 10, img.width - 260, 30, 0, byy, mid - gap / 2, bh);
    c.restore();
  } else {
    const line = (x0, x1) => {
      const g = c.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, 'rgba(215,180,92,0)'); g.addColorStop(1, 'rgba(215,180,92,0.9)');
      c.fillStyle = g; c.fillRect(Math.min(x0, x1), H / 2 - R * 0.6, Math.abs(x1 - x0), R * 1.2);
    };
    line(0, mid - gap / 2); line(W, mid + gap / 2);
  }
  // fade the outer ends
  for (const [x0, x1] of [[0, 26 * R], [W, W - 26 * R]]) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = g; c.fillRect(Math.min(x0, x1), 0, Math.abs(x1 - x0), H);
    c.globalCompositeOperation = 'source-over';
  }
  // the ✦, in the same gold-on-navy dress as the letters
  c.font = '900 ' + Math.round(11 * R) + 'px serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = 2.2 * R; c.strokeStyle = '#241c40';
  c.strokeText('✦', mid, H / 2 + R * 0.5);
  const g = c.createLinearGradient(0, H / 2 - 6 * R, 0, H / 2 + 6 * R);
  g.addColorStop(0, '#fff7dc'); g.addColorStop(0.6, '#ffe08d'); g.addColorStop(1, '#c9a057');
  c.fillStyle = g;
  c.fillText('✦', mid, H / 2 + R * 0.5);
  t.refresh();
  return { key, w: W / R, h: H / R };
}

// Small gold-lettered texture in the wordmark's dress — single run, no arch:
// beast nameplates, flying damage numbers. Cached by text+size; battle removes
// its number textures on shutdown so a long session doesn't hoard canvases.
function ssGoldTex(scene, text, sizeU) {
  const R = Math.max(2, ssTexRes(scene));
  const key = 'gold@' + sizeU + '@' + text;
  if (scene.textures.exists(key)) {
    const f = scene.textures.get(key).getSourceImage();
    return { key, w: f.width / R, h: f.height / R };
  }
  const px = sizeU * R;
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = '900 ' + Math.round(px) + 'px ' + SERIF;
  const m = meas.measureText(text);
  const asc = Math.ceil(m.actualBoundingBoxAscent || px * 0.8), desc = Math.ceil(m.actualBoundingBoxDescent || px * 0.25);
  const padX = Math.ceil(px * 0.30), padY = Math.ceil(px * 0.26);
  const W = Math.ceil(m.width) + padX * 2, H = asc + desc + padY * 2;
  const t = scene.textures.createCanvas(key, W, H);
  const c = t.context, bx = W / 2, by = padY + asc;
  c.font = meas.font; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
  c.shadowColor = 'rgba(201,169,79,0.45)'; c.shadowBlur = px * 0.22;
  c.fillStyle = '#c9a94f'; c.fillText(text, bx, by);
  c.shadowColor = 'transparent'; c.shadowBlur = 0;
  c.fillStyle = 'rgba(16,12,34,0.85)'; c.fillText(text, bx, by + px * 0.05);
  c.strokeStyle = '#e6c87e'; c.lineWidth = px * 0.085; c.strokeText(text, bx, by);
  c.strokeStyle = '#241c40'; c.lineWidth = px * 0.055; c.strokeText(text, bx, by);
  const g = c.createLinearGradient(0, by - asc, 0, by + desc + px * 0.04);
  g.addColorStop(0, '#fff7dc'); g.addColorStop(0.35, '#ffe08d');
  g.addColorStop(0.62, '#d7b45c'); g.addColorStop(1, '#9c7a28');
  c.fillStyle = g; c.fillText(text, bx, by);
  c.globalCompositeOperation = 'source-atop';
  const sh = c.createLinearGradient(0, by - asc, 0, by - asc + (asc + desc) * 0.42);
  sh.addColorStop(0, 'rgba(255,255,255,0.34)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sh; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'source-over';
  t.refresh();
  return { key, w: W / R, h: H / R };
}

/* ---- leaderboard medals -------------------------------------------------
   Gold / silver / bronze medallions for the podium — a metallic disc in the
   sigil-medallion's language (rim, inner hairline, compass points), with rays
   baked around the gold. The rank numeral is drawn over it by the scene in
   the matching ink. Consumed via setDisplaySize (R-scaled texture rule). */
const SS_MEDAL_INK = ['#3a2a08', '#2c3350', '#3a2408'];
function ssMedalTex(scene, tier) {
  const key = 'lbmedal' + tier;
  if (scene.textures.exists(key)) return key;
  const R = ssTexRes(scene), S = 96;
  const t = scene.textures.createCanvas(key, Math.round(S * R), Math.round(S * R));
  const c = t.context;
  c.scale(R, R);
  const cx = S / 2, cy = S / 2, r = S / 2 - 10;
  const M = [
    { hi: '#fff3c9', mid: '#ffd77a', lo: '#9c7a28', rim: '#e6c87e', faint: 'rgba(255,215,122,' },
    { hi: '#f4f7ff', mid: '#c9d4e8', lo: '#6a7590', rim: '#dfe6f4', faint: 'rgba(201,212,232,' },
    { hi: '#ffd9b0', mid: '#d29a5f', lo: '#7a4d20', rim: '#e8b57f', faint: 'rgba(232,181,127,' },
  ][tier];
  if (tier === 0) {                                  // the champion's rays
    c.strokeStyle = M.faint + '0.35)'; c.lineWidth = 1.4;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.26;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * (r + 2), cy + Math.sin(a) * (r + 2));
      c.lineTo(cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9)); c.stroke();
    }
  }
  const g = c.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, M.hi); g.addColorStop(0.5, M.mid); g.addColorStop(1, M.lo);
  c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = g; c.fill();
  c.lineWidth = 3; c.strokeStyle = M.rim; c.stroke();
  c.lineWidth = 1.2; c.strokeStyle = 'rgba(16,12,34,0.4)';
  c.beginPath(); c.arc(cx, cy, r - 5.5, 0, Math.PI * 2); c.stroke();
  c.fillStyle = M.rim;                               // compass points on the ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.beginPath(); c.arc(cx + Math.cos(a) * (r - 5.5), cy + Math.sin(a) * (r - 5.5), 1.5, 0, Math.PI * 2); c.fill();
  }
  const sh = c.createLinearGradient(0, cy - r, 0, cy);   // top sheen
  sh.addColorStop(0, 'rgba(255,255,255,0.4)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  c.beginPath(); c.arc(cx, cy, r - 2, 0, Math.PI * 2); c.fillStyle = sh; c.fill();
  t.refresh();
  return key;
}

/* ---- sigil rarity dress ------------------------------------------------
   Three tiers, unmistakable at a glance: basic wears the house gold, rare a
   cool gem-blue frame with an icy glow, legendary a gold radiance with rays
   baked around its medallion (the scene adds particles and an arrival flash
   on top). Card chrome is baked per tier+size like ssBtn's slices. */
const SS_RARITY = [
  { glow: 0xd7b45c, ink: '#e6d9ac', shadow: '#c9b676', label: null, labelColor: '' },
  { glow: 0x6fa8ff, ink: '#d4e4ff', shadow: '#6fa8ff', label: 'rarityRare', labelColor: '#9fc8ff' },
  { glow: 0xffd77a, ink: '#ffe9a8', shadow: '#ffc94d', label: 'rarityLegendary', labelColor: '#ffdf8f' },
];

// Baked card chrome: midnight glass, tier frame + hairline, corner ornaments,
// and a medallion socket on the left for the glyph. Returns { key, mx, mr } —
// medallion centre/radius in design units (recomputed on cache hits).
function ssSigilCardTex(scene, tier, w, h) {
  const mr = Math.min(h * 0.30, 40), mx = Math.max(mr + 14, h * 0.42);
  const key = 'sigcard' + tier + '@' + w + 'x' + h;
  if (scene.textures.exists(key)) return { key, mx, mr };
  const R = ssTexRes(scene);
  const t = scene.textures.createCanvas(key, Math.round(w * R), Math.round(h * R));
  const c = t.context;
  c.scale(R, R);
  const frame = ['#c9a84c', '#7fb4ff', '#ffd77a'][tier];
  const faint = ['rgba(215,180,92,', 'rgba(127,180,255,', 'rgba(255,215,122,'][tier];
  const rad = Math.min(16, h * 0.2);
  const rr = (inset, r) => { c.beginPath(); c.roundRect(inset, inset, w - inset * 2, h - inset * 2, r); };
  // midnight glass — cooler for rare, a warmer dusk-violet for legendary
  rr(2.5, rad);
  const g = c.createLinearGradient(0, 0, 0, h);
  if (tier === 1) { g.addColorStop(0, '#152247'); g.addColorStop(0.55, '#0e1530'); g.addColorStop(1, '#0a0f24'); }
  else if (tier === 2) { g.addColorStop(0, '#2a2142'); g.addColorStop(0.55, '#171129'); g.addColorStop(1, '#100c1e'); }
  else { g.addColorStop(0, '#171d3c'); g.addColorStop(0.55, '#10142c'); g.addColorStop(1, '#0b0f21'); }
  c.fillStyle = g; c.fill();
  const g2 = c.createLinearGradient(0, 2.5, 0, h * 0.4);        // starlight sheen
  g2.addColorStop(0, tier === 2 ? 'rgba(255,224,141,0.13)' : 'rgba(159,176,232,0.11)');
  g2.addColorStop(1, 'rgba(159,176,232,0)');
  rr(2.5, rad); c.fillStyle = g2; c.fill();
  c.lineWidth = 2; c.strokeStyle = frame; rr(2.5, rad); c.stroke();
  c.lineWidth = 0.8; c.strokeStyle = faint + '0.5)'; rr(6.5, rad * 0.72); c.stroke();
  // corner ornaments: a small diamond with two trailing ticks, mirrored 4x
  const orn = (x, y, sx, sy) => {
    c.save(); c.translate(x, y); c.scale(sx, sy);
    c.fillStyle = frame;
    c.beginPath(); c.moveTo(11, 15); c.lineTo(15, 11); c.lineTo(19, 15); c.lineTo(15, 19); c.closePath(); c.fill();
    c.strokeStyle = faint + '0.7)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(15, 19); c.lineTo(15, 26); c.moveTo(19, 15); c.lineTo(26, 15); c.stroke();
    c.restore();
  };
  orn(0, 0, 1, 1); orn(w, 0, -1, 1); orn(0, h, 1, -1); orn(w, h, -1, -1);
  // the medallion socket
  const my = h / 2;
  if (tier === 2) {                                              // legendary rays
    c.strokeStyle = 'rgba(255,215,122,0.20)'; c.lineWidth = 1.2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.26;
      c.beginPath(); c.moveTo(mx + Math.cos(a) * (mr + 3), my + Math.sin(a) * (mr + 3));
      c.lineTo(mx + Math.cos(a) * (mr + 12), my + Math.sin(a) * (mr + 12)); c.stroke();
    }
  }
  const rg = c.createRadialGradient(mx, my, 2, mx, my, mr);
  rg.addColorStop(0, faint + '0.30)'); rg.addColorStop(0.75, faint + '0.10)'); rg.addColorStop(1, faint + '0)');
  c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fillStyle = rg; c.fill();
  c.lineWidth = 1.6; c.strokeStyle = frame; c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 0.8; c.strokeStyle = faint + '0.5)'; c.beginPath(); c.arc(mx, my, mr - 3.5, 0, Math.PI * 2); c.stroke();
  c.fillStyle = frame;                                           // compass points on the ring
  for (const [dx, dy] of [[0, -mr], [0, mr], [-mr, 0], [mr, 0]]) {
    c.beginPath(); c.arc(mx + dx, my + dy, 1.6, 0, Math.PI * 2); c.fill();
  }
  t.refresh();
  return { key, mx, mr };
}

/* The sleeping card (v0.43.0): the same chrome, asleep. Slate glass instead
   of midnight, a dashed frame instead of the tier's gold hairline, and an
   EMPTY socket — the silhouette must give away the rarity dress and nothing
   else, so a player can want a sigil without having been shown it. Same
   {key, mx, mr} contract as the waking card, so both draw off one layout. */
function ssSleepCardTex(scene, w, h) {
  const mr = Math.min(h * 0.30, 40), mx = Math.max(mr + 14, h * 0.42);
  const key = 'sigsleep@' + w + 'x' + h;
  if (scene.textures.exists(key)) return { key, mx, mr };
  const R = ssTexRes(scene);
  const t = scene.textures.createCanvas(key, Math.round(w * R), Math.round(h * R));
  const c = t.context;
  c.scale(R, R);
  const rad = Math.min(16, h * 0.2);
  const rr = (inset, r) => { c.beginPath(); c.roundRect(inset, inset, w - inset * 2, h - inset * 2, r); };
  rr(2.5, rad);
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#111634'); g.addColorStop(0.55, '#0c1027'); g.addColorStop(1, '#080b1c');
  c.fillStyle = g; c.fill();
  c.lineWidth = 1.4; c.strokeStyle = 'rgba(90,99,144,0.55)';
  c.setLineDash([5, 5]); rr(2.5, rad); c.stroke(); c.setLineDash([]);
  // the empty socket: a dim ring with a soft hollow, no compass points
  const my = h / 2;
  const rg = c.createRadialGradient(mx, my, 2, mx, my, mr);
  rg.addColorStop(0, 'rgba(90,99,144,0.16)'); rg.addColorStop(1, 'rgba(90,99,144,0)');
  c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fillStyle = rg; c.fill();
  c.lineWidth = 1.3; c.strokeStyle = 'rgba(90,99,144,0.6)';
  c.setLineDash([3, 4]);
  c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.stroke();
  c.setLineDash([]);
  t.refresh();
  return { key, mx, mr };
}

// One ornate pick card: baked chrome, glyph in the medallion, gold-letterpress
// nameplate, rarity ribbon, italic desc. Interactive container, w x h design
// units; heights under 100 lay out as the compact (versus) one-liner.
function ssSigilCard(scene, l, sg, w, h) {
  const tier = sg.rarity | 0;
  const RC = SS_RARITY[tier];
  const loc = SS_SIG(sg);
  const tex = ssSigilCardTex(scene, tier, w, h);
  const c = scene.add.container(0, 0);
  c.add(scene.add.image(0, 0, tex.key).setDisplaySize(l.u(w), l.u(h)));
  const gx = -w / 2 + tex.mx;
  c.add(ssTxt(scene, l.u(gx), 0, sg.icon, l.u(tex.mr * 0.98), RC.ink).setOrigin(0.5)
    .setShadow(0, 0, RC.shadow, l.u(5), true, true));
  const lx = gx + tex.mr + 14, maxW = w / 2 - lx - 12;
  const compact = h < 100;
  const gk = ssGoldTex(scene, loc.name, compact ? 12 : 15);
  const nsc = Math.min(1, maxW / gk.w);
  const nameY = compact ? -h / 2 + 16 : (RC.label ? -h / 2 + 42 : -h / 2 + 52);
  c.add(scene.add.image(l.u(lx), l.u(nameY), gk.key).setOrigin(0, 0.5)
    .setDisplaySize(l.u(gk.w * nsc), l.u(gk.h * nsc)));
  if (RC.label) {
    const lab = compact
      ? ssTxt(scene, l.u(w / 2 - 24), l.u(-h / 2 + 19), SS_T(RC.label), l.u(9), RC.labelColor).setOrigin(1, 0.5)
      : ssTxt(scene, l.u(lx), l.u(nameY + 19), '✦ ' + SS_T(RC.label) + ' ✦', l.u(10), RC.labelColor).setOrigin(0, 0.5);
    c.add(lab.setLetterSpacing(l.u(2)).setShadow(0, 0, RC.shadow, l.u(6), true, true));
  }
  const descY = compact ? 0 : (RC.label ? nameY + 30 : nameY + 15);
  c.add(ssTextBlock(scene, l.u(lx), l.u(descY), loc.desc, {
    fontSize: l.u(compact ? 10 : 12.5) + 'px', color: '#c3c6da', fontStyle: 'italic',
    wrapW: l.u(maxW + 4), lineSpacing: l.u(2),
  }).setData('sigilDesc', sg.id));
  c.setSize(l.u(w), l.u(h)).setInteractive({ useHandCursor: true });
  c.setData('sigilCard', true);
  return c;
}

/* ---- the sigil inspector -------------------------------------------------
   Powers must be readable in a proper box, never text floating over the game.
   One panel serves solo and versus: a midnight/gold window (the end screens'
   language) listing the birth sign and every held sigil — icon in its
   medallion, gold nameplate, rarity ribbon, full effect text. The veil
   beneath is interactive, so every tap on the board under the window dies at
   the veil; tapping it (or ✕) minimizes the panel back to the compact dock.
   Drag-scrolls when a long run has collected more than one window holds.
   Returns { c, close } — callers stash it and may force-close on battle end. */
function ssSigilPanel(scene, opts) {
  const l = ssLayout(scene);
  // depth 95 rides over play; the end screen (overlayC, 100) needs the panel
  // above itself, so callers may raise it
  const c = scene.add.container(0, 0).setDepth(opts.depth || 95);
  const veil = scene.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
  scene.tweens.add({ targets: veil, alpha: 0.72, duration: 200 });
  c.add(veil);
  const close = () => {
    if (c.getData('closed') || !c.active) return;
    c.setData('closed', true);
    scene.tweens.add({ targets: c, alpha: 0, duration: 150, onComplete: () => { if (c.active) c.destroy(); } });
    if (opts.onClose) opts.onClose();
  };
  veil.on('pointerdown', () => { SFX.ui(); close(); });

  /* Rows are heterogeneous now (v0.43.0): the birth sign, the sigils you
     hold, then — when the caller asks for it — a STILL SLEEPING section, the
     locked half of the sky drawn as silhouettes with the bar that is filling
     toward each one. Heights differ per kind, so the layout runs off a
     prefix sum rather than k * (RH + GAP); the mask and the drag-scroll below
     read contentH exactly as they always did.
     THE LAW: a sigil is in ONE state or the other, never both. `asleep` is
     computed from ssSigilUnlocked, which is the same truth ssSigilOpen()
     draws the pick boards from, so the moment a rite hands one over it leaves
     this list and appears above it on the next open. */
  const RW = 340, RH = 84, GAP = 8, HEAD = 56, FOOT = 30, HDR = 44, SH = 74;
  const rows = [];
  if (opts.sign) rows.push({ sign: opts.sign, h: RH });
  for (const id of opts.sigils || []) {
    const sg = SS_SIG_BY[id] || SS_SIGILS.find((s) => s.id === id);
    if (sg) rows.push({ sg, h: RH });
  }
  if (opts.sleeping) {
    const asleep = SS_SIGILS.filter((s) => s.lock && !ssSigilUnlocked(s.id));
    rows.push({ head: 1, n: asleep.length, h: HDR });
    for (const sg of asleep) rows.push({ sg, sleep: 1, h: SH });
  }
  const ys = [];
  let acc = 0;
  for (const r of rows) { ys.push(acc + r.h / 2); acc += r.h + GAP; }
  const contentH = Math.max(0, acc - GAP);
  const viewH = Math.min(contentH, 552);
  const winH = HEAD + viewH + FOOT;
  const top = 400 - winH / 2;

  // the window rides in its own container so it can rise in as one piece
  const wc = scene.add.container(0, 0);
  const win = scene.add.image(l.x(0), l.y(top + winH / 2), 'endpanel')
    .setDisplaySize(l.u(372), l.u(winH)).setInteractive();
  wc.add(win);
  const tk = ssGoldTex(scene, SS_T(opts.title || 'inspTitle'), 16);
  const tsc = Math.min(1, 250 / tk.w);
  wc.add(scene.add.image(l.x(-6), l.y(top + 30), tk.key).setDisplaySize(l.u(tk.w * tsc), l.u(tk.h * tsc)));
  const xT = ssTxt(scene, l.x(164), l.y(top + 29), '✕', l.u(17), '#8a94c4').setOrigin(0.5);
  const xZ = scene.add.zone(l.x(164), l.y(top + 29), l.u(46), l.u(46)).setOrigin(0.5).setInteractive({ useHandCursor: true });
  xZ.on('pointerdown', () => { SFX.ui(); close(); });
  wc.add([xT, xZ]);
  wc.add(ssTxt(scene, l.x(0), l.y(top + winH - 15), SS_T('inspSub'), l.u(9.5), '#5a6390', 'italic').setOrigin(0.5));

  // rows live in a masked container; dragging the window scrolls them
  const rc = scene.add.container(0, 0);
  rows.forEach((r, k) => {
    const yk = top + HEAD + ys[k];
    // ---- the section rule: what is still out there, and how much of it ----
    if (r.head) {
      rc.add(ssTxt(scene, l.x(0), l.y(yk - 6), '—  ' + SS_T('slpHead') + '  —', l.u(11), '#8a94c4')
        .setOrigin(0.5).setLetterSpacing(l.u(2)));
      rc.add(ssTxt(scene, l.x(0), l.y(yk + 12), r.n ? SS_T(r.n === 1 ? 'slpSub1' : 'slpSub', r.n) : SS_T('slpNone'),
        l.u(9.5), r.n ? '#5a6390' : '#c9b676', 'italic').setOrigin(0.5));
      return;
    }
    // ---- a sleeping sigil: a silhouette, its condition, and its bar ----
    if (r.sleep) {
      const tex = ssSleepCardTex(scene, RW, SH);
      rc.add(scene.add.image(l.x(0), l.y(yk), tex.key).setDisplaySize(l.u(RW), l.u(SH)));
      const gx = -RW / 2 + tex.mx;
      rc.add(ssTxt(scene, l.x(gx), l.y(yk), '?', l.u(tex.mr * 1.05), '#4a5480').setOrigin(0.5, 0.56));
      const lx = gx + tex.mr + 14, maxW = RW / 2 - lx - 16;
      const RCs = SS_RARITY[r.sg.rarity | 0];
      if (RCs.label) {
        rc.add(ssTxt(scene, l.x(RW / 2 - 16), l.y(yk - SH / 2 + 15), SS_T(RCs.label), l.u(8), RCs.labelColor)
          .setOrigin(1, 0.5).setLetterSpacing(l.u(1.5)).setAlpha(0.42));
      }
      // the condition sits on the row's own centre line, so a one-line English
      // sentence and a two-line German one both hang level over the bar
      rc.add(ssTextBlock(scene, l.x(lx), l.y(yk - 12), SS_SIG_HOW(r.sg), {
        fontSize: l.u(11.5) + 'px', color: '#9aa3cc', fontStyle: 'italic',
        wrapW: l.u(maxW - (RCs.label ? 58 : 6)), lineSpacing: l.u(1.5), oy: 0.5,
      }).setData('sigilHow', r.sg.id));
      /* the bar: a dim track with a gold run across it, and the plain count.
         barW leaves 72 design units at the right for "100 / 400" — and the
         panel's mask ends at x 186, so a bar wider than the row does not just
         look wrong, it is CUT by the mask at the window's edge. */
      const pr = ssSigilProgress(r.sg);
      const frac = Math.max(0, Math.min(1, pr.need ? pr.have / pr.need : 0));
      const barW = Math.max(40, maxW - 72), by = yk + SH / 2 - 16;
      rc.add(scene.add.rectangle(l.x(lx), l.y(by), l.u(barW), l.u(3.5), 0x2b3157, 1).setOrigin(0, 0.5));
      if (frac > 0) {
        const fill = scene.add.rectangle(l.x(lx), l.y(by), l.u(Math.max(2, barW * frac)), l.u(3.5), 0xd7b45c, 1).setOrigin(0, 0.5);
        rc.add(fill);
        if (frac > 0.04) {
          rc.add(scene.add.image(l.x(lx + barW * frac), l.y(by), 'glowbig').setDisplaySize(l.u(26), l.u(16))
            .setTint(0xffd77a).setAlpha(0.30).setBlendMode('ADD'));
        }
      }
      rc.add(ssTxt(scene, l.x(RW / 2 - 16), l.y(by), pr.have + ' / ' + pr.need, l.u(9.5), '#8a94c4')
        .setOrigin(1, 0.5));
      return;
    }
    // ---- what is already yours ----
    const tier = r.sg ? (r.sg.rarity | 0) : 0;
    const RC = SS_RARITY[tier];
    const tex = ssSigilCardTex(scene, tier, RW, RH);
    rc.add(scene.add.image(l.x(0), l.y(yk), tex.key).setDisplaySize(l.u(RW), l.u(RH)));
    const gx = -RW / 2 + tex.mx;
    let name, desc, ribbon, ribbonColor;
    if (r.sg) {
      rc.add(ssTxt(scene, l.x(gx), l.y(yk), r.sg.icon, l.u(tex.mr * 0.95), RC.ink).setOrigin(0.5)
        .setShadow(0, 0, RC.shadow, l.u(5), true, true));
      const loc = SS_SIG(r.sg);
      name = loc.name; desc = loc.desc;
      ribbon = RC.label ? SS_T(RC.label) : ''; ribbonColor = RC.labelColor;
    } else {
      const g = ssZodiacGlyph(scene, r.sign, l.u(0.145), l.x(gx), l.y(yk));
      rc.add(g);
      const loc = SS_ZOD(r.sign);
      name = r.sign.name + ' · ' + loc.title; desc = loc.desc;
      ribbon = SS_T('inspSign'); ribbonColor = '#ffdf8f';
    }
    const lx = gx + tex.mr + 14, maxW = RW / 2 - lx - 12;
    const gk = ssGoldTex(scene, name, 13);
    const nsc = Math.min(1, (maxW - (ribbon ? 66 : 0)) / gk.w);
    rc.add(scene.add.image(l.x(lx), l.y(yk - RH / 2 + 19), gk.key).setOrigin(0, 0.5)
      .setDisplaySize(l.u(gk.w * nsc), l.u(gk.h * nsc)));
    if (ribbon) rc.add(ssTxt(scene, l.x(RW / 2 - 30), l.y(yk - RH / 2 + 19), ribbon, l.u(8.5), ribbonColor)
      .setOrigin(1, 0.5).setLetterSpacing(l.u(1.5)).setShadow(0, 0, RC.shadow, l.u(6), true, true));
    rc.add(ssTextBlock(scene, l.x(lx), l.y(yk - RH / 2 + 31), desc, {
      fontSize: l.u(12) + 'px', color: '#c9ccde', fontStyle: 'italic',
      wrapW: l.u(maxW + 6), lineSpacing: l.u(1.5),
    }).setData('sigilDesc', r.sg ? r.sg.id : 'sign'));
  });
  wc.add(rc);

  const maxOff = Math.max(0, l.u(contentH - viewH));
  if (maxOff > 0) {
    const mg = scene.make.graphics();
    mg.fillRect(l.x(-186), l.y(top + HEAD), l.u(372), l.u(viewH));
    rc.setMask(mg.createGeometryMask());
    // a slim gold thumb tracks where you are in the list
    const trackH = l.u(viewH), thumbH = trackH * (l.u(viewH) / l.u(contentH));
    const thumb = scene.add.rectangle(l.x(172), l.y(top + HEAD) + thumbH / 2, l.u(3), thumbH, 0xd7b45c, 0.45).setOrigin(0.5);
    wc.add(thumb);
    let drag = null, off = 0;
    win.on('pointerdown', (p) => { drag = { y: p.y, off }; });
    const mv = (p) => {
      if (!drag) return;
      if (!p.isDown) { drag = null; return; }
      off = clamp(drag.off + (drag.y - p.y), 0, maxOff);
      rc.y = -off;
      thumb.y = l.y(top + HEAD) + thumbH / 2 + (off / maxOff) * (trackH - thumbH);
    };
    const up = () => { drag = null; };
    scene.input.on('pointermove', mv);
    scene.input.on('pointerup', up);
    c.once('destroy', () => { scene.input.off('pointermove', mv); scene.input.off('pointerup', up); mg.destroy(); });
  }

  c.add(wc);
  wc.y = l.u(14); wc.alpha = 0;
  scene.tweens.add({ targets: wc, y: 0, alpha: 1, duration: 240, ease: 'Cubic.easeOut' });
  SFX.ui();
  ssHealBlankTexts(scene, 'sigil-panel');
  return { c, close };
}

// The dock's vertical glass pill, baked per height like the card chrome.
function ssDockTex(scene, hU) {
  const key = 'sigdock@' + Math.round(hU);
  if (scene.textures.exists(key)) return key;
  const R = ssTexRes(scene), w = 34;
  const t = scene.textures.createCanvas(key, Math.round(w * R), Math.round(hU * R));
  const c = t.context;
  c.scale(R, R);
  c.beginPath(); c.roundRect(1.5, 1.5, w - 3, hU - 3, (w - 3) / 2);
  const g = c.createLinearGradient(0, 0, 0, hU);
  g.addColorStop(0, 'rgba(22,29,62,0.92)'); g.addColorStop(1, 'rgba(11,15,33,0.92)');
  c.fillStyle = g; c.fill();
  c.lineWidth = 1.2; c.strokeStyle = 'rgba(201,168,76,0.55)'; c.stroke();
  t.refresh();
  return key;
}

// Layout: 420 x 800 design space, scaled + centered
/* ---- safe-area insets ---------------------------------------------------
   In a browser the chrome absorbs the notch and the home indicator, so the
   layout never had to know they exist. In a full-screen WKWebView shell it
   does: index.html already sets viewport-fit=cover + apple-mobile-web-app-
   capable, so the canvas owns EVERY pixel. Measured at 393x852 (iPhone 14/15
   Pro) the 420x800 design box landed 7px under the Dynamic Island, and on a
   no-notch SE — where the box is height-bound and fills the screen exactly —
   the daily chip and the profile chip sat squarely beneath the status bar,
   both of them tappable. Read once at boot from CSS env(); `?inset=T,B` forces
   values so the harness can prove this without a device (headless reports 0).
   Values are CSS px; the design box works in buffer px, hence the DPR. */
const SS_INSET = { top: 0, bottom: 0 };
function ssReadInsets() {
  const q = QS.get('inset');
  if (q) {
    const p = String(q).split(',').map(parseFloat);
    if (isFinite(p[0])) SS_INSET.top = Math.max(0, p[0]);
    if (isFinite(p[1])) SS_INSET.bottom = Math.max(0, p[1]);
    return SS_INSET;
  }
  try {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;' +
      'padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
    document.body.appendChild(d);
    const cs = getComputedStyle(d);
    SS_INSET.top = parseFloat(cs.paddingTop) || 0;
    SS_INSET.bottom = parseFloat(cs.paddingBottom) || 0;
    d.remove();
  } catch (e) { }
  return SS_INSET;
}
/* The design box is 420x800 and used to centre in the raw viewport. It now
   centres in the SAFE band instead, so nothing authored at the top or bottom
   of the box can land under the hardware. With zero insets — every desktop
   browser, and every phone with browser chrome — the arithmetic is identical
   to before, which is why this does not move a single existing layout. */
function ssLayout(scene) {
  const W = scene.scale.width, H = scene.scale.height;
  const it = SS_INSET.top * DPR, ib = SS_INSET.bottom * DPR;
  const availH = Math.max(1, H - it - ib);
  const s = Math.min(W / 420, availH / 800);
  const cy = it + availH / 2;
  return { W, H, s, x: (d) => W / 2 + d * s, y: (d) => cy + (d - 400) * s, u: (d) => d * s };
}

/* ---- tap targets: the 44-pt law (v0.50.1) --------------------------------
   tools/crisp-check.mjs walked eight phones and found fingers meeting hit
   areas far under Apple's 44 pt: the 🔊/🌐 glyphs at 13×15, the ‹ back at
   8×23, the ✕ closes, the profile chip / rating pill / daily chip, and — on
   the narrow phones, where the 420-wide design box scales to 0.83–0.94 css
   px per design pt — every 44- and 46-pt button. The ART keeps its size;
   only the hit RECTANGLE grows: setInteractive() is wrapped so every
   rectangular hit area is padded, centred, to at least 44 css pt on each
   axis (local space, origin handled by the input plugin; the first rect is
   kept on the object so a re-pad is never cumulative). Custom shapes and
   pixel-perfect areas are left alone. ssHitPad(o, css, anchor) re-pads a
   single object with an anchor — 'up' keeps the bottom edge and grows
   upward, 'down' the reverse — for a stacked pair like the profile chip over
   the rating pill, where centred growth would let the lower one steal the
   upper one's taps. */
function ssHitPad(o, minCss, anchor) {
  try {
    const ha = o && o.input && o.input.hitArea;
    if (!ha || !(ha instanceof Phaser.Geom.Rectangle) || o.input.customHitArea) return o;
    // a swapped texture (the lantern lighting up) brings a new frame size and a
    // new display scale: the base rect is the frame again, not the old pad
    const fw = o.frame ? o.frame.realWidth : 0, fh = o.frame ? o.frame.realHeight : 0;
    if (o.__ha0 && fw && (o.__ha0.fw !== fw || o.__ha0.fh !== fh)) o.__ha0 = { x: 0, y: 0, w: fw, h: fh, fw, fh };
    if (!o.__ha0) o.__ha0 = { x: ha.x, y: ha.y, w: ha.width, h: ha.height, fw, fh };
    const h0 = o.__ha0, need = (minCss || 44) * DPR;
    const sx = Math.abs(o.scaleX) || 1, sy = Math.abs(o.scaleY) || 1;
    const w = Math.max(h0.w, need / sx), h = Math.max(h0.h, need / sy);
    const x = h0.x + (h0.w - w) * (anchor === 'left' ? 0 : anchor === 'right' ? 1 : 0.5);
    const y = h0.y + (h0.h - h) * (anchor === 'down' ? 0 : anchor === 'up' ? 1 : 0.5);
    if (w !== ha.width || h !== ha.height || x !== ha.x || y !== ha.y) ha.setTo(x, y, w, h);
  } catch (e) { }
  return o;
}
(function () {
  const P = Phaser.GameObjects.GameObject.prototype, orig = P.setInteractive;
  P.setInteractive = function (a, b, c) {
    const r = orig.call(this, a, b, c);
    // a caller's own shape (a circle, a polygon, a callback) is its own law
    if (this.input && !(a && typeof a === 'object' && (a.hitArea || a.pixelPerfect)) && !(a && a.type !== undefined && !(a instanceof Phaser.Geom.Rectangle)) && !(b && typeof b === 'function' && b !== Phaser.Geom.Rectangle.Contains)) ssHitPad(this, 44);
    return r;
  };
})();

/* ---- the campaign star chart --------------------------------------------
   The whole long night on one window of sky: every fight of every act is a
   constellation node on a winding path that climbs from the meadow's edge
   (bottom) to the crown of dawn (top). Felled beasts burn gold, the next one
   breathes under a glow and waits for a tap, the ones ahead hang dim in their
   own colors, and the final boss stands haloed at the summit as the visible
   destination. Data-driven: pass any acts array (SS_ACTS today; more acts or
   whole alternate campaigns later just work). Returns { c, zone } — zone is
   the tappable current node (null when the campaign is complete); the
   container carries it as data 'mapZone' for the demo driver. */
/* Campaign roster — the drawn sky. Each campaign rolls its acts' open slots
   from the tier pools in SS_ACTS (fixed ids stay fixed) and the draw is
   pinned in localStorage, so the chart, the battles, and a resumed
   checkpoint all march the same road. It lives and dies with the
   checkpoint (ssClearCampaign wipes both). */
function ssRollRoster(seed) {
  const r = ssMulberry(seed);
  const used = new Set();
  const roster = [];
  for (const act of SS_ACTS) {
    const local = new Set();
    for (const sl of act.slots) {
      let id = sl;
      if (sl === 'b' || sl === 'm' || sl === 'B') {
        const pool = sl === 'b' ? act.basics : sl === 'm' ? act.minis : act.bosses;
        // prefer beasts this campaign has not drawn yet, then at least
        // beasts this act has not drawn yet
        let cand = pool.filter((p) => !local.has(p) && !used.has(p));
        if (!cand.length) cand = pool.filter((p) => !local.has(p));
        if (!cand.length) cand = pool;
        id = cand[Math.floor(r() * cand.length)];
      }
      local.add(id); used.add(id);
      roster.push(id);
    }
  }
  return roster;
}
function ssCampaignLen() { return SS_ACTS.reduce((a, act) => a + act.slots.length, 0); }
function ssCampaignRoster() {
  try {
    const r = JSON.parse(localStorage.getItem('beta3.camproster'));
    if (Array.isArray(r) && r.length === ssCampaignLen() && r.every((id) => SS_BEASTS[id])) return r;
  } catch (e) { }
  const roster = ssRollRoster(Math.floor(Math.random() * 1e9));
  try { localStorage.setItem('beta3.camproster', JSON.stringify(roster)); } catch (e) { }
  return roster;
}
function ssClearCampaign() {
  localStorage.removeItem('beta3.campaign');
  localStorage.removeItem('beta3.camproster');
  localStorage.removeItem('beta3.campsign');
}

/* ---- the zodiac ----------------------------------------------------------
   The campaign's birth sign is chosen on the picker sheet and pinned in
   localStorage alongside the roster — it lives and dies with the campaign
   (ssClearCampaign wipes all three). 'none' = the player chose the classic,
   unsigned climb; an ABSENT key means the picker has not been answered yet. */
function ssCampSign() {
  const v = localStorage.getItem('beta3.campsign');
  return SS_ZODIAC_BY[v] ? v : null;
}
function ssCampSignChosen() { return localStorage.getItem('beta3.campsign') != null; }

// A sign's constellation, drawn small — picker cells, the battle emblem, the
// profile strip. Signs that share a beast draw the beast's own stars; k maps
// star units (±100 box) to css px.
function ssZodiacGlyph(scene, z, k, x, y, tint, alpha) {
  const src = z.stars ? z : SS_BEASTS[z.beast];
  const col = tint != null ? tint : SS_ELEMENTS[z.el];
  const a = alpha == null ? 1 : alpha;
  const g = scene.add.graphics({ x, y });
  g.lineStyle(Math.max(1, k * 6.5), col, 0.5 * a);
  for (const [e1, e2] of src.edges) {
    g.lineBetween(src.stars[e1][0] * k, src.stars[e1][1] * k, src.stars[e2][0] * k, src.stars[e2][1] * k);
  }
  g.fillStyle(col, Math.min(1, 0.95 * a));
  for (let i = 0; i < src.stars.length; i++) {
    g.fillCircle(src.stars[i][0] * k, src.stars[i][1] * k, Math.max(0.8, k * (i % 3 === 0 ? 10 : 7)));
  }
  return g;
}

/* ---- zodiac card art: the seam (v0.57.0) ------------------------------
   The sign cards ask for texture `zod_<id>` — Wyatt's MJ card art
   (art/ZODIAC-ART.md, portrait 2:3). SS_ZOD_ART lists the ids whose
   art/zod_<id>.webp ships; ssLoadArt fetches them beside the other plates and
   ssZodArtKey hands the card a texture key, or null → the card draws the
   sign's asterism large on the night-sky wash. Dropping real art in is one
   id per line here plus the webp. */
function ssZodArtKey(scene, id) {
  const key = 'zod_' + id;
  if (scene.textures.exists(key)) return key;
  const im = SSART.img[key];
  if (!im) return null;
  scene.textures.addImage(key, im);
  return key;
}
// the placeholder art: the game's own twilight gradient with a scatter of
// faint stars, baked once at texture res — rounded, portrait 2:3
function ssZodSkyTex(scene) {
  const key = 'zodsky';
  if (scene.textures.exists(key)) return key;
  const R = Math.max(2, ssTexRes(scene));
  const W = Math.round(160 * R), H = Math.round(240 * R);
  const t = scene.textures.createCanvas(key, W, H);
  const c = t.context;
  c.beginPath(); c.roundRect(0, 0, W, H, 6 * R);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0c1030'); g.addColorStop(0.42, '#2a2558'); g.addColorStop(0.72, '#4d3a72'); g.addColorStop(0.92, '#7a4a7c'); g.addColorStop(1, '#9a5f7e');
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 46; i++) {
    const x = rnd() * W, y = rnd() * H * 0.9, r = (0.5 + rnd() * 1.1) * R;
    c.fillStyle = 'rgba(232,226,255,' + (0.18 + rnd() * 0.5).toFixed(2) + ')';
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  // the meadow's dark ridge along the foot of the sky
  c.fillStyle = '#0e0c22';
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += W / 16) c.lineTo(x, H - (10 + 5 * Math.sin(x / W * 9.4) + 3 * Math.cos(x / W * 21)) * R);
  c.lineTo(W, H); c.closePath(); c.fill();
  c.restore();
  t.refresh();
  return key;
}

function ssStarChart(scene, opts) {
  const l = ssLayout(scene);
  const acts = opts.acts || SS_ACTS;
  const roster = opts.roster || ssCampaignRoster();
  const fightIdx = opts.fightIdx | 0;
  const c = scene.add.container(0, 0);
  const fights = [];   // flattened in the exact order Battle marches them
  let ri = 0;
  acts.forEach((act, ai) => act.slots.forEach((sl, fi) => fights.push({ id: roster[ri++], actIdx: ai, fi, len: act.slots.length, umbral: act.umbral, boss: fi === act.slots.length - 1 })));
  const N = fights.length;

  // the window + header
  c.add(scene.add.image(l.x(0), l.y(400), 'endpanel').setDisplaySize(l.u(384), l.u(664)).setInteractive());
  const hk = ssGoldTex(scene, SS_T('mapTitle'), 20);
  const hsc = Math.min(1, 300 / hk.w);
  c.add(scene.add.image(l.x(0), l.y(106), hk.key).setDisplaySize(l.u(hk.w * hsc), l.u(hk.h * hsc)));
  const complete = fightIdx >= N;
  const cur = complete ? null : fights[fightIdx];
  c.add(ssTxt(scene, l.x(0), l.y(132), complete ? SS_T('endWinSub') : SS_ACT_N(acts[cur.actIdx]) + '  ·  ' + SS_T('fightN', cur.fi + 1),
    l.u(10.5), '#8a94c4', 'italic').setOrigin(0.5));

  // node positions: a serpentine sweep per act, mirrored on alternate acts so
  // the path braids left-right-left as it climbs; act bosses stand centered.
  // Step adapts to the fight count so a four-act road still fits the window.
  const pos = [];
  const wob = [0, 22, -16, 10];                       // organic jitter on the sweep
  let y = 632;
  const step = Math.min(29, (632 - 172) / Math.max(1, (N - 1) + (acts.length - 1) * 0.86));
  const actGap = Math.round(step * 0.86);
  const cramp = clamp(step / 29, 0.72, 1);           // nodes shrink with the tighter road
  for (let i = 0; i < N; i++) {
    const f = fights[i];
    if (i > 0 && f.actIdx !== fights[i - 1].actIdx) {
      y -= actGap;                                    // breathing room for the act label
    }
    const dir = f.actIdx % 2 === 0 ? 1 : -1;
    let x = 0;
    if (!f.boss) {
      const t = f.len > 2 ? f.fi / (f.len - 2) : 0;
      x = (-118 + t * 218 + wob[f.fi % 4]) * dir;
    }
    pos.push({ x, y });
    y -= step;
  }
  // act labels sit in the gaps, offset off the path's diagonal
  acts.forEach((act, ai) => {
    if (ai === 0) return;
    const first = fights.findIndex((f) => f.actIdx === ai);
    const gy = (pos[first].y + pos[first - 1].y) / 2;
    const gx = -Math.sign(pos[first].x || 1) * 62;
    c.add(ssTxt(scene, l.x(gx), l.y(gy), SS_ACT_N(act), l.u(8.5), '#6a74a4').setOrigin(0.5).setAlpha(0.9));
  });
  c.add(ssTxt(scene, l.x(0), l.y(656), SS_ACT_N(acts[0]), l.u(8.5), '#6a74a4').setOrigin(0.5).setAlpha(0.9));

  // the path: dotted starlight between nodes — gold where you have walked
  const pathG = scene.add.graphics();
  for (let i = 0; i < N - 1; i++) {
    const a = pos[i], b = pos[i + 1];
    const walked = i < fightIdx;
    pathG.fillStyle(walked ? 0xd7b45c : 0x4a5480, walked ? 0.5 : 0.28);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(3, Math.round(dist / 9));
    for (let k = 2; k <= n - 2; k++) {
      const t = k / n;
      pathG.fillCircle(l.x(a.x + (b.x - a.x) * t), l.y(a.y + (b.y - a.y) * t), l.u(1.2));
    }
  }
  c.add(pathG);

  // the nodes: little constellations in the beasts' own stars
  const staticG = scene.add.graphics();
  c.add(staticG);
  let zone = null;
  for (let i = 0; i < N; i++) {
    const f = fights[i], p = pos[i];
    const b = SS_BEASTS[f.id];
    const um = f.umbral && f.id !== 'phoenix';       // beastFor's umbral rule
    const name = (um ? SS_UMBRAL.prefix : '') + b.name;
    const state = i < fightIdx ? 'won' : i === fightIdx ? 'now' : 'far';
    const last = i === N - 1;
    const sc = (b.boss ? 0.20 : b.tier === 'mini' ? 0.165 : 0.145) * (last ? 1.3 : 1) * cramp;
    const k = l.u(sc);
    const tint = state === 'won' ? 0xd7b45c : state === 'now' ? 0xffe9a8 : (um ? SS_UMBRAL.tint : b.tint);
    const aLine = state === 'won' ? 0.4 : state === 'now' ? 0.85 : 0.2;
    const aStar = state === 'won' ? 0.85 : state === 'now' ? 1 : 0.5;

    // the summit halo: the destination is visible from the very first step
    if (last) {
      c.add(scene.add.image(l.x(p.x), l.y(p.y), 'glowbig').setDisplaySize(l.u(120), l.u(96))
        .setTint(state === 'won' ? 0xffd77a : 0xffc46b).setAlpha(0.13).setBlendMode('ADD'));
    }
    const drawInto = (g, gx, gy) => {
      g.lineStyle(l.u(0.9), tint, aLine);
      for (const [e1, e2] of b.edges) {
        g.lineBetween(gx + b.stars[e1][0] * k, gy + b.stars[e1][1] * k, gx + b.stars[e2][0] * k, gy + b.stars[e2][1] * k);
      }
      g.fillStyle(tint, aStar);
      for (let s = 0; s < b.stars.length; s++) {
        g.fillCircle(gx + b.stars[s][0] * k, gy + b.stars[s][1] * k, l.u(s % 3 === 0 ? 1.5 : 1.0));
      }
    };
    if (state === 'now') {
      // the breathing node: its own container so it can pulse and be tapped
      const nc = scene.add.container(l.x(p.x), l.y(p.y));
      nc.add(scene.add.image(0, 0, 'glowbig').setDisplaySize(l.u(96), l.u(78)).setTint(0xffd77a).setAlpha(0.17).setBlendMode('ADD'));
      const ng = scene.add.graphics();
      drawInto(ng, 0, 0);
      for (const e of b.eyes) {
        const eye = scene.add.image(e[0] * k, e[1] * k, 'dot').setScale(0.32).setTint(b.eye).setBlendMode('ADD');
        scene.tweens.add({ targets: eye, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
        nc.add(eye);
      }
      nc.add(ng);
      scene.tweens.add({ targets: nc, scaleX: 1.09, scaleY: 1.09, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      c.add(nc);
      // the waiting ring, swelling like a held breath
      const ring = scene.add.graphics({ x: l.x(p.x), y: l.y(p.y) });
      ring.lineStyle(l.u(1.4), 0xffd77a, 0.55);
      ring.strokeCircle(0, 0, l.u(b.boss ? 27 : 23));
      scene.tweens.add({ targets: ring, scaleX: 1.16, scaleY: 1.16, alpha: 0.15, duration: 1100, repeat: -1, ease: 'Sine.easeOut' });
      c.add(ring);
      zone = scene.add.zone(l.x(p.x), l.y(p.y), l.u(88), l.u(66)).setOrigin(0.5).setInteractive({ useHandCursor: true });
      let entered = false;
      zone.on('pointerdown', () => { if (entered) return; entered = true; SFX.ensure(); SFX.ui(); opts.onEnter(); });
      c.add(zone);
    } else {
      drawInto(staticG, l.x(p.x), l.y(p.y));
    }

    // the name beside each node, hugging the path's inside edge
    const off = b.boss ? 32 : 27;
    const nx = p.x > 8 ? p.x - off : p.x + off;
    const t = ssTxt(scene, l.x(nx), l.y(p.y), name,
      l.u(state === 'now' ? 9.5 : 8.5),
      state === 'won' ? '#8f7f4e' : state === 'now' ? '#ffe9a8' : '#5a6390')
      .setOrigin(p.x > 8 ? 1 : 0, 0.5);
    if (state === 'now') t.setShadow(0, 0, '#c9b676', l.u(6), true, true);
    c.add(t);
    if (last) {
      c.add(ssTxt(scene, l.x(nx), l.y(p.y + 12), SS_T('mapDest'), l.u(7.5), '#c98f4d', 'italic')
        .setOrigin(p.x > 8 ? 1 : 0, 0.5));
    }
  }
  if (!complete) c.add(ssTxt(scene, l.x(0), l.y(680), SS_T('mapHint'), l.u(10), '#c9b676', 'italic').setOrigin(0.5).setAlpha(0.9));
  c.setData('mapZone', zone);
  return { c, zone };
}

/* ---- THE FORGE CEREMONY --------------------------------------------------
   v0.43.0. A sigil coming out of the drip is an EVENT, not a line of text.
   The sky goes dark, the anvil rings, and the glyph rises in its own rarity
   medallion with the name struck in gold beneath it — the same ceremony
   language as the lamp's mark rite and the v0.18 sigil pick: a deep veil (the
   meadow's gold buttons read straight THROUGH anything lighter), the forge
   chime, a tiered arrival, and letterpress copy that lands in beats.

   Four laws it keeps, and every one of them is pinned by a check:
   · IT NEVER TRAPS. One tap anywhere dismisses it, and it lets itself out on
     its own after a hold long enough to read — the end screen's NEW RUN and
     HOME buttons are sitting underneath it.
   · IT NEVER STACKS. Two discoveries in one run queue: the second is BUILT
     when the first has closed, never drawn on top of it (SS_RITE.busy, which
     also gates the meadow so a mark rite and a forge rite cannot collide).
   · IT IS CANVAS-SAFE. Baked canvas textures, plain images, shapes and text —
     nothing WebGL-only, because Wyatt's phone boots the CV renderer.
   · EVERY CHILD CARRIES scrollFactor 0. The meadow's camera sits ~4200px down
     the sky world, and inside a Container it is the CHILD's scroll factor the
     camera consults, not the container's — a rite drawn in world space there
     is drawn nowhere at all.
*/
const SS_RITE = { busy: false };

// The ceremony's medallion — the pick card's socket, alone and five times the
// size: tier ring, inner hairline, the four compass points, and the
// legendary's ring of rays. Baked once per tier+size like every other piece of
// chrome in this file.
function ssSigilMedalTex(scene, tier, d) {
  const key = 'sigmedal' + tier + '@' + Math.round(d);
  if (scene.textures.exists(key)) return key;
  const R = ssTexRes(scene);
  const t = scene.textures.createCanvas(key, Math.round(d * R), Math.round(d * R));
  const c = t.context;
  c.scale(R, R);
  const frame = ['#c9a84c', '#7fb4ff', '#ffd77a'][tier];
  const faint = ['rgba(215,180,92,', 'rgba(127,180,255,', 'rgba(255,215,122,'][tier];
  const cx = d / 2, cy = d / 2, r = d / 2 - d * 0.11;
  if (tier === 2) {                                   // the legendary's rays
    c.strokeStyle = 'rgba(255,215,122,0.28)';
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + 0.13, lng = i % 2 ? d * 0.045 : d * 0.085;
      c.lineWidth = i % 2 ? 1 : 1.8;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * (r + d * 0.018), cy + Math.sin(a) * (r + d * 0.018));
      c.lineTo(cx + Math.cos(a) * (r + lng), cy + Math.sin(a) * (r + lng)); c.stroke();
    }
  }
  const rg = c.createRadialGradient(cx, cy, 2, cx, cy, r);
  rg.addColorStop(0, faint + '0.34)'); rg.addColorStop(0.72, faint + '0.12)'); rg.addColorStop(1, faint + '0.02)');
  c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = rg; c.fill();
  c.lineWidth = d * 0.016; c.strokeStyle = frame;
  c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  c.lineWidth = d * 0.006; c.strokeStyle = faint + '0.55)';
  c.beginPath(); c.arc(cx, cy, r - d * 0.035, 0, Math.PI * 2); c.stroke();
  c.fillStyle = frame;
  for (const [dx, dy] of [[0, -r], [0, r], [-r, 0], [r, 0]]) {
    c.beginPath(); c.arc(cx + dx, cy + dy, d * 0.017, 0, Math.PI * 2); c.fill();
  }
  t.refresh();
  return key;
}

/* One discovery, held like a rite. Returns the container; calls onDone once
   the sky is clear again (which is how the queue knows to bring the next). */
function ssSigilRite(scene, sg, onDone) {
  const l = ssLayout(scene);
  const tier = sg.rarity | 0, RC = SS_RARITY[tier], loc = SS_SIG(sg);
  SS_RITE.busy = true;
  // spend this one from the queue the moment it is SHOWN — not when it was
  // scheduled (a rite the scene died before building must survive to be said
  // on the grass) and not when it closes (being told twice reads as a bug)
  const p = SS.prof;
  if (p.sig && p.sig.pend.length) { p.sig.pend = p.sig.pend.filter((id) => id !== sg.id); SS.save(); }

  const c = scene.add.container(0, 0).setDepth(680).setScrollFactor(0);
  c.setData('sigilRite', sg.id);          // the harness reads WHICH rite is up
  const sf = (o) => o.setScrollFactor(0);
  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    scene.tweens.add({
      targets: c, alpha: 0, duration: 420, ease: 'Sine.easeIn',
      onComplete: () => { if (c.active) c.destroy(); SS_RITE.busy = false; if (onDone) onDone(); },
    });
  };
  scene.events.once('shutdown', () => { SS_RITE.busy = false; });

  const veil = sf(scene.add.image(l.W / 2, l.H / 2, 'veil')).setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
  veil.on('pointerdown', () => { SFX.ui(); close(); });
  // 0.985, not the mark rite's 0.9: this beat puts its copy across the middle
  // of the screen, where the meadow's own gold buttons sit, and at anything
  // lighter their letters read straight THROUGH the sigil's name
  scene.tweens.add({ targets: veil, alpha: 0.985, duration: 380 });
  c.add(veil);

  // the anvil, then the award arpeggio for anything above a common
  SFX.ensure(); SFX.forge();
  if (tier > 0) scene.time.delayedCall(340, () => { if (SFX.ok && c.active) SFX.ach(); });

  // ---- the glyph, rising in its medallion ----
  const MY = 296, MD = tier === 2 ? 216 : 196;
  const glow = sf(scene.add.image(l.x(0), l.y(MY), 'glowbig')).setDisplaySize(l.u(80), l.u(80))
    .setTint(RC.glow).setAlpha(0).setBlendMode('ADD');
  const medal = sf(scene.add.image(l.x(0), l.y(MY), ssSigilMedalTex(scene, tier, MD)))
    .setDisplaySize(l.u(MD * 0.55), l.u(MD * 0.55)).setAlpha(0);
  const glyph = sf(ssTxt(scene, l.x(0), l.y(MY), sg.icon, l.u(MD * 0.44), RC.ink)).setOrigin(0.5)
    .setShadow(0, 0, RC.shadow, l.u(16), true, true).setAlpha(0);
  c.add([glow, medal, glyph]);
  scene.tweens.add({ targets: medal, alpha: 1, duration: 560, ease: 'Cubic.easeOut' });
  scene.tweens.add({
    targets: medal, displayWidth: l.u(MD), displayHeight: l.u(MD), duration: 700, ease: 'Back.easeOut',
  });
  scene.tweens.add({ targets: glyph, alpha: 1, duration: 520, delay: 200 });
  scene.tweens.add({
    targets: glow, alpha: tier === 2 ? 0.34 : tier === 1 ? 0.26 : 0.19,
    displayWidth: l.u(MD * 1.9), displayHeight: l.u(MD * 1.9), duration: 700, ease: 'Cubic.easeOut',
    onComplete: () => {
      if (!glow.active || ssReduceMotion()) return;
      scene.tweens.add({ targets: glow, alpha: tier === 2 ? 0.15 : 0.09, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    },
  });

  // ---- the arrival: a rare announces itself, a legendary shakes the sky ----
  if (!ssReduceMotion()) {
    const em = sf(scene.add.particles(0, 0, 'dot', {
      speed: { min: 20, max: 210 }, lifespan: { min: 700, max: 1700 }, gravityY: -22,
      scale: { start: 0.75, end: 0 }, alpha: { start: 0.95, end: 0 }, blendMode: 'ADD',
      tint: tier === 1 ? [0x9fc8ff, 0xd4e4ff, 0xfff2c9] : [0xffd77a, 0xfff2c9, 0xffb457],
      emitting: false,
    }));
    c.add(em);
    const burst = (n) => {
      if (!em.active) return;
      for (let k = 0; k < n; k++) {
        em.emitParticleAt(l.x(0) + (Math.random() - 0.5) * l.u(MD * 0.8), l.y(MY) + (Math.random() - 0.5) * l.u(MD * 0.8));
      }
    };
    scene.time.delayedCall(240, () => burst(tier === 2 ? 40 : tier === 1 ? 26 : 16));
    if (tier > 0) scene.time.delayedCall(760, () => burst(tier === 2 ? 26 : 14));
    if (tier === 2) scene.time.delayedCall(1220, () => burst(22));
    scene.time.delayedCall(260, () => {
      if (!c.active) return;
      if (tier === 2) scene.cameras.main.flash(340, 255, 214, 120, false);
      else if (tier === 1) scene.cameras.main.flash(260, 150, 190, 255, false);
    });
  }

  // ---- the words ----
  const head = sf(ssTxt(scene, l.x(0), l.y(146), '✦  ' + SS_T('unlHead') + '  ✦', l.u(14), '#ffd77a')).setOrigin(0.5)
    .setLetterSpacing(l.u(3)).setShadow(0, 0, '#c9b676', l.u(10), true, true).setAlpha(0);
  const gk = ssGoldTex(scene, loc.name, 25);
  const gsc = Math.min(1, 340 / gk.w);
  const name = sf(scene.add.image(l.x(0), l.y(452), gk.key)).setDisplaySize(l.u(gk.w * gsc), l.u(gk.h * gsc)).setAlpha(0);
  const words = [head, name];
  if (RC.label) {
    words.push(sf(ssTxt(scene, l.x(0), l.y(488), '✦ ' + SS_T(RC.label) + ' ✦', l.u(11.5), RC.labelColor)).setOrigin(0.5)
      .setLetterSpacing(l.u(2.5)).setShadow(0, 0, RC.shadow, l.u(8), true, true).setAlpha(0));
  }
  /* The three lines under the nameplate stack on MEASURED heights, not fixed
     rows: a two-line effect and a two-line condition are both common once the
     copy is German, and a fixed ladder either overlaps there or leaves a hole
     under the English. `dh` converts a Text's pixel height back to design. */
  const dh = (o) => o.height / l.s;
  const descY = RC.label ? 520 : 498;
  // one single-line Text per line (ssTextBlock): sf rides on every child
  const desc = ssTextBlock(scene, l.x(0), l.y(descY), loc.desc, {
    fontSize: l.u(13.5) + 'px', color: '#e6dfc6', fontStyle: 'italic',
    align: 'center', wrapW: l.u(330), lineSpacing: l.u(3), ox: 0.5, oy: 0, sf: true,
  }).setData('sigilDesc', sg.id).setAlpha(0);
  words.push(desc);
  let ny = descY + dh(desc) + 26;
  const how = SS_SIG_HOW(sg);
  if (how) {
    const hw = ssTextBlock(scene, l.x(0), l.y(ny), '✓ ' + how, {
      fontSize: l.u(10) + 'px', color: '#8a94c4', fontStyle: 'italic',
      align: 'center', wrapW: l.u(320), ox: 0.5, oy: 0, sf: true,
    }).setData('sigilHow', sg.id).setAlpha(0);
    words.push(hw);
    ny += dh(hw) + 28;
  }
  const skies = sf(ssTxt(scene, l.x(0), l.y(ny + 6), SS_T('unlSkies'), l.u(12), '#ffe9a8', 'italic')).setOrigin(0.5).setAlpha(0);
  const hint = sf(ssTxt(scene, l.x(0), l.y(694), SS_T('unlTap'), l.u(9.5), '#8a94c4', 'italic')).setOrigin(0.5).setAlpha(0);
  words.push(skies, hint);
  c.add(words);
  // head, then the nameplate, then every line under it in its own beat
  const beats = [[head, 540], [name, 760]];
  words.slice(2).forEach((o, i) => beats.push([o, 940 + i * 170]));
  beats.forEach(([o, d]) => {
    if (!o) return;
    o.y += l.u(10);
    scene.tweens.add({ targets: o, y: o.y - l.u(10), alpha: o === hint ? 0.85 : 1, duration: 420, delay: d, ease: 'Cubic.easeOut' });
  });

  ssHealBlankTexts(scene, 'sigil-rite');
  // it holds long enough to be read — a legendary a beat longer — then lets
  // whatever is underneath have the screen back, tapped or not
  scene.time.delayedCall(tier === 2 ? 6600 : tier === 1 ? 6000 : 5400, close);
  return c;
}

/* Say out loud whatever is waiting, one rite at a time. The queue is spent
   rite by rite as each one is BUILT (see ssSigilRite), so two discoveries in
   one run arrive in sequence and a scene that dies mid-queue leaves the rest
   in `pend` for the meadow to hold instead. A second caller arriving while a
   rite is on screen is turned away rather than allowed to stack — its ids are
   still in `pend`, so nothing is lost. Returns the milliseconds the whole
   sequence will take. */
const SS_RITE_MS = [5400, 6000, 6600];
function ssSigilAnnounce(scene, ids) {
  ids = (ids || []).filter((id) => !!SS_SIG_BY[id]);
  if (!ids.length || !scene || !scene.scene.isActive() || SS_RITE.busy) return 0;
  const q = ids.slice();
  const step = () => {
    if (!scene.scene.isActive()) return;
    const sg = SS_SIG_BY[q.shift()];
    if (!sg) return;
    ssSigilRite(scene, sg, () => { if (q.length) scene.time.delayedCall(420, step); });
  };
  step();
  return ids.reduce((a, id) => a + SS_RITE_MS[SS_SIG_BY[id].rarity | 0] + 840, 0);
}

// achievement toast, usable from any scene
function ssAchToast(scene, def) {
  const l = ssLayout(scene);
  const c = scene.add.container(l.x(0), l.y(-40)).setDepth(400);
  const bg = scene.add.image(0, 0, ssBtn(scene, false, 300, 58)).setDisplaySize(l.u(300), l.u(58));
  const t1 = ssTxt(scene, 0, -l.u(10), '✦ ' + def.name + ' ✦', l.u(15), BTN_INK()).setOrigin(0.5);
  const t2 = ssTxt(scene, 0, l.u(12), def.desc, l.u(10), BTN_INK2(), 'italic').setOrigin(0.5);
  c.add([bg, t1, t2]);
  scene.tweens.add({ targets: c, y: l.y(52), duration: 450, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: c, alpha: 0, delay: 2600, duration: 400, onComplete: () => c.destroy() });
}

/* ---- the rename notice: a name the stars already knew ----------------------
   Unique names (net.js): a player whose standing name was claimed first by
   somebody else is re-minted at connect, and a rename to a taken name keeps
   the old one. Either way they are told ONCE, here, in the achievement
   toast's frame: the title one line, the body an ssTextBlock (never a
   multi-line bake — the desc law). Shown by whichever scene is live when
   the ss-renamed event lands, else by the meadow when it next builds. */
function ssRenameNotice(scene, rec) {
  rec = rec || SSNET.renameNotice(true);
  if (!rec || !scene || !scene.sys || !scene.sys.isActive()) return null;
  SSNET.renameNotice(true);
  const l = ssLayout(scene);
  const held = rec.kind === 'held';
  const c = scene.add.container(l.x(0), l.y(-60)).setDepth(400);
  const body = ssTextBlock(scene, 0, l.u(8), SS_T(held ? 'nameHeldBody' : 'nameTakenBody', rec.from, rec.to),
    { fontSize: l.u(10) + 'px', color: BTN_INK2(), fontStyle: 'italic', wrapW: l.u(272), lineSpacing: l.u(1), align: 'center', ox: 0.5, oy: 0 });
  const H = Math.max(58, 36 + body.height / l.u(1));
  const bg = scene.add.image(0, 0, ssBtn(scene, false, 300, Math.round(H))).setDisplaySize(l.u(300), l.u(H));
  const t1 = ssTxt(scene, 0, -l.u(H / 2 - 14), SS_T(held ? 'nameHeldTitle' : 'nameTakenTitle'), l.u(13), BTN_INK()).setOrigin(0.5);
  body.y = -l.u(H / 2 - 24);
  c.add([bg, t1, body]);
  c.setData('renameNotice', true);
  if (scene.nameT && scene.nameT.active) scene.nameT.setText(rec.to);
  scene.tweens.add({ targets: c, y: l.y(52 + (H - 58) / 2), duration: 450, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: c, alpha: 0, delay: 6500, duration: 500, onComplete: () => c.destroy() });
  return c;
}
window.addEventListener('ss-renamed', (e) => {
  try {
    const live = (window.game && game.scene.getScenes(true) || []).filter((sc) => sc.scene.key !== 'boot');
    const sc = live.find((x) => x.scene.key === 'home' || x.scene.key === 'profile') || live[0];
    if (sc) ssRenameNotice(sc, e.detail);
  } catch (err) { }
});

/* ---- the rating card: tap any stargazer's name, see their standing -------
   One small window of sky: the name, the star-class glyph burning in its
   tier's color over a breathing glow, the number in gold letterpress. Pass
   {own:true} for yourself, {rating,rhide,name} when the numbers are already
   in hand (versus room records), or {uid,name} to fetch the synced profile.
   A player who veiled their rating shows as "veiled in starlight" to
   everyone but themselves. Works in any scene that ran ssMakeTextures. */
function ssRatingCard(scene, o) {
  if (scene.__rcC && scene.__rcC.scene) return;   // one card at a time; a destroyed ref self-heals
  scene.__rcC = null;
  SFX.ui();
  const l = ssLayout(scene);
  const c = scene.__rcC = scene.add.container(0, 0).setDepth(950);
  const close = () => { if (scene.__rcC !== c) return; scene.__rcC = null; c.destroy(); };
  const veil = scene.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
  scene.tweens.add({ targets: veil, alpha: 0.6, duration: 180 });
  veil.on('pointerdown', () => { SFX.ui(); close(); });
  c.add(veil);
  const PH = 250, py = (d) => l.y(400 - PH / 2 + d);
  const items = [];
  // the window swallows its own taps so a press inside never hits the veil
  items.push(scene.add.image(l.x(0), py(PH / 2), 'endpanel').setDisplaySize(l.u(300), l.u(PH)).setInteractive());
  const own = !!o.own || (!!o.uid && o.uid === SSNET.uid());
  const nm = ssTxt(scene, l.x(0), py(38), o.name || (own ? SSNET.myName() : '…'), l.u(16), '#f0e8d2').setOrigin(0.5);
  while (nm.width > l.u(252) && nm.text.length > 2) nm.setText(nm.text.slice(0, -2) + '…');
  items.push(nm);
  items.push(scene.add.rectangle(l.x(0), py(60), l.u(240), Math.max(1, l.u(1)), 0xc9a84c, 0.35));
  const body = scene.add.container(0, 0);
  items.push(body);
  const fill = (rating, hidden) => {
    if (scene.__rcC !== c || !body.scene) return;
    if (hidden && !own) {
      body.add(ssTxt(scene, l.x(0), py(118), '☾', l.u(30), '#5a6390').setOrigin(0.5).setAlpha(0.9));
      body.add(ssTxt(scene, l.x(0), py(160), SS_T('rHiddenCard'), l.u(12), '#8a94c4', 'italic').setOrigin(0.5));
      return;
    }
    const tier = ssRatingTier(rating);
    const g = scene.add.image(l.x(0), py(114), 'glowbig').setDisplaySize(l.u(160), l.u(160))
      .setTint(tier.tint).setAlpha(0.13).setBlendMode('ADD');
    body.add(g);
    scene.tweens.add({ targets: g, alpha: 0.05, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    body.add(ssTxt(scene, l.x(0), py(96), tier.glyph, l.u(26), tier.color).setOrigin(0.5)
      .setShadow(0, 0, tier.color, l.u(12), true, true));
    const gk = ssGoldTex(scene, String(rating), 26);
    body.add(scene.add.image(l.x(0), py(140), gk.key).setDisplaySize(l.u(gk.w), l.u(gk.h)));
    body.add(ssTxt(scene, l.x(0), py(176), '— ' + SS_T(tier.key) + ' —', l.u(12), tier.color).setOrigin(0.5)
      .setShadow(0, 0, tier.color, l.u(6), true, true));
    if (own && SS.prof.rhide) {
      body.add(ssTxt(scene, l.x(0), py(204), '☾ ' + SS_T('rYourVeil'), l.u(9), '#5a6390', 'italic').setOrigin(0.5));
    }
  };
  if (own) fill(SS.prof.rating, SS.prof.rhide);
  else if (o.rating != null || !o.uid) fill(Number.isFinite(o.rating) ? o.rating : SS_RATING.BASE, !!o.rhide);
  else {
    const loadT = ssTxt(scene, l.x(0), py(130), SS_T('lbLoading'), l.u(10.5), '#5a6390', 'italic').setOrigin(0.5);
    body.add(loadT);
    SSNET.dbGet('players/' + o.uid).catch(() => null).then((p) => {
      if (scene.__rcC !== c || !loadT.scene) return;
      loadT.destroy();
      if (p && p.name && !o.name && nm.active) nm.setText(p.name);
      fill(p && Number.isFinite(p.rating) ? p.rating : SS_RATING.BASE, !!(p && p.rhide));
    });
  }
  c.add(items);
  // entrance: the little window settles up into place like every other sheet
  items.forEach((it) => { if (it !== body) it.y += l.u(12); it.alpha = 0; });
  scene.tweens.add({ targets: items, alpha: 1, duration: 240, ease: 'Cubic.easeOut' });
  scene.tweens.add({ targets: items.filter((it) => it !== body), y: '-=' + l.u(12), duration: 240, ease: 'Back.easeOut' });
}

/* Every DOM element the game floats above the canvas (rename input, seal-code
   input) goes through here. Phaser preventDefaults canvas touches, so tapping
   '‹ HOME' never blurs a focused input — left to its own devices the element
   outlives its scene and sits on top of whatever screen comes next. This ties
   its life to the scene: Enter/blur commit, Escape cancels, and scene shutdown
   (back link, scene.start, resize-restart) always removes it — committing only
   if commitOnShutdown says the commit is safe to run against a dead scene.
   One shared id doubles as a belt-and-suspenders sweep: a second overlay
   replaces the first instead of stacking. */
function ssDomInput(scene, inp, commit, commitOnShutdown) {
  // removing a FOCUSED input fires its blur synchronously, whose close()
  // detaches it mid-remove — Chrome then throws NotFoundError on the outer
  // call. Harmless (the element is gone either way), so swallow it.
  const prev = document.getElementById('ss-overlay-input');
  if (prev) { try { prev.remove(); } catch (e) { } }
  inp.id = 'ss-overlay-input';
  let open = true;
  const close = (save) => {
    if (!open) return;
    open = false;
    scene.events.off('shutdown', onShut);
    try { inp.remove(); } catch (e) { }
    if (save) commit(inp.value);
  };
  const onShut = () => close(!!commitOnShutdown);
  scene.events.once('shutdown', onShut);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(true); if (e.key === 'Escape') close(false); });
  inp.addEventListener('blur', () => close(true));
  document.body.appendChild(inp);
  inp.focus();
}

/* ============================================================
   HOME — a twilight meadow at the bottom of the world column.
   Entering a battle rises through the dusk to the zenith.
   A cold boot opens at the zenith and settles down (playIntro).
   ============================================================ */
let PENDING_ASCENT = null;   // survives a mid-ascent resize-restart: finish to battle
let INTRO_SEEN = false;      // once per page load — a rotation restart must not replay it
// The language sheet reloads the page to re-render every baked string; sitting
// through the intro again for each language tried would be miserable, so that
// reload sets a one-shot flag this consumes.
function ssIntroBypassed() {
  try {
    if (sessionStorage.getItem('beta3.skipIntro')) { sessionStorage.removeItem('beta3.skipIntro'); return true; }
  } catch (e) { }
  return false;
}
class Home extends Phaser.Scene {
  constructor() { super('home'); }
  create() {
    if (PENDING_ASCENT) { DIAG('restart mid-ascent → straight to battle'); const d = PENDING_ASCENT; PENDING_ASCENT = null; this.scene.start('battle', d); return; }
    const tCr = performance.now();
    const l = ssLayout(this);
    ssMakeTextures(this);
    this.isDawn = !!((this.scene.settings.data || {}).dawn) || QS.get('dawn') === '1';
    this.sky = ssSkyWorld(this, { dawn: this.isDawn });
    ssShootingStars(this);
    const tSky = performance.now();
    this.uiItems = [];
    this.ascending = false; this.descending = false; this.arrived = false; this.introPlaying = false;
    // scene instances persist across restarts — a rotation mid-sheet would
    // otherwise leave these truthy forever and the sheets could never reopen
    this.langC = null; this.dailyC = null; this.mapC = null; this.confirmC = null; this.signC = null;
    this.streakC = null; this.riteC = null; this.riteTimer = null; this.sigTimer = null;
    this.lanternShown = null; this.lanternSwell = null;   // a restart re-renders, it does not celebrate

    // Everything at the meadow (showcase, title, buttons, chip, footer) is a
    // full frame's work on a slow phone, and a descent-by-create (the dawn
    // return, or any fallback) starts with the camera at the ZENITH — none of
    // it is visible yet. Building it one frame later halves the entry hitch of
    // those descents; on a plain boot it builds inline as before.
    const entry = (this.scene.settings.data || {}).from;
    // the cinematic opening plays on a cold boot only: restarts (rotation),
    // battle/defeat returns, demo/daily/vsdemo runs and the lang-switch reload
    // all land straight on the interactive meadow
    const deep = typeof vsDeepPending === 'function' && vsDeepPending();   // ?join= / ?friend= (versus.js)
    const intro = !entry && !INTRO_SEEN && !DEMO && QS.get('vsdemo') !== '1' && !QS.get('frdemo') && !QS.get('botduel') && QS.get('daily') !== '1' && QS.get('quick') !== '1' && !deep && !ssIntroBypassed();
    if (entry) this.time.delayedCall(0, () => { if (this.sys.isActive()) this.buildMeadowUi(l); });
    else if (intro) this.playIntro(l);
    else this.buildMeadowUi(l);
    // the daily chip's clock ticks every second while the meadow sits open.
    // Ticking also carries it across midnight UTC on its own: dayKey() moves,
    // today's score stops matching, and the chip lights back up for the new
    // sky without a reload.
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.updateDailyChip() });

    this.input.once('pointerdown', () => SFX.ensure());
    this.events.on('ss-achproxy', (def) => ssAchToast(this, def));

    // crickets sing while we stand in the grass — at dawn, the birds do.
    // During the intro we're still up at the zenith; they start on landing.
    if (!this.introPlaying) { SFX.crickets(!this.isDawn); SFX.birds(this.isDawn); }
    this.events.once('shutdown', () => { SFX.crickets(false); SFX.birds(false); });

    // the ascent puts this scene to SLEEP, not to rest — returning from battle
    // wakes it and glides down, skipping the 200-370ms create() freeze that
    // used to open every descent (see arrive())
    this.createdW = this.scale.width; this.createdH = this.scale.height;
    this.events.on('wake', (sys, data) => this.onWake(data || {}));
    // pre-bake the dawn gradient while the meadow idles: the campaign-win
    // descent re-creates the scene with the other sky, and baking + uploading
    // skygrad-dawn inside that create was a measurable slice of its entry hitch
    if (!this.isDawn) this.time.delayedCall(600, () => { if (this.scene.isActive()) ssSkyTextures(this, true); });
    // …and the tile glyphs, so the board build at the top of the rise is
    // sprite reuse instead of 32 live text rasters (see ssGlyph)
    this.time.delayedCall(700, () => { if (this.scene.isActive()) ssPrewarmGlyphs(this); });

    // arriving from a battle: descend home · from defeat: wake up on the grass
    // a mark earned in the battle we just came home from (or on a night the
    // app was closed before it could be honoured) waits for still grass
    this.milestoneCheck();
    this.sigilNotice();          // …and a sigil the drip handed over may still be unsaid
    if (entry === 'battle') this.descendHome();
    else if (entry === 'defeat') {
      const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setDepth(600);
      this.tweens.add({ targets: veil, alpha: 0, duration: 350, onComplete: () => veil.destroy() });
    }

    DIAG('home create sky ' + Math.round(tSky - tCr) + 'ms' + (entry ? ' · ui deferred (' + entry + ')' : ''));
    localStorage.setItem('beta3.boot', BUILD);
    console.log(BUILD);
    DIAG(BUILD + ' · ' + (this.game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas') + ' ' + this.game.scale.width + 'x' + this.game.scale.height + ' dprCap ' + DPR);
    // the summons overlay rides above every screen for the whole visit — a
    // friend's challenge banner and the friends-layer toasts live there
    if (this.scene.get('summons') && !this.scene.isActive('summons')) { this.scene.launch('summons'); this.scene.bringToTop('summons'); }
    if (deep) this.time.delayedCall(300, () => vsDeepRun(this));
    else if (QS.get('botduel') && typeof ssBotDuelBoot === 'function') this.time.delayedCall(500, () => ssBotDuelBoot(this));   // the rival engine's dev seam (rival.js) — before vsdemo, which may ride along to play the human seat
    else if (QS.get('vsdemo') === '1' || QS.get('frdemo') === 'host' || QS.get('frdemo') === 'invite') this.time.delayedCall(500, () => this.scene.start('vsmenu'));
    // ?quick=1 — the harnesses' door into a quick run since the QUICK PLAY
    // button left the meadow (v0.51.0): the mode lives on, the meadow just
    // doesn't offer it
    else if (DEMO || QS.get('daily') === '1' || QS.get('quick') === '1') this.time.delayedCall(400, () => this.startMode(DEMO ? (QS.get('mode') === 'campaign' ? 'campaign' : 'quick') : QS.get('quick') === '1' ? 'quick' : 'daily'));
  }
  buildMeadowUi(l) {
    // a name the stars already knew (net.js, unique names): told once, here
    this.time.delayedCall(700, () => { if (this.sys.isActive() && SSNET.renameNotice()) ssRenameNotice(this); });
    // baseAlpha: the ascent fades all ui to 0 — the wake path (return from
    // battle without a re-create) restores each item to the alpha it was born
    // with, which is not 1 for sparkles, braid, mute/lang buttons
    const ui = (o) => { o.baseAlpha = o.alpha; this.uiItems.push(o); return o; };
    const tUi = performance.now();

    // beast showcase — tonight's hunt, rising in the dusk sky
    this.showC = this.add.container(l.x(0), l.y(150));
    const ids = Object.keys(SS_BEASTS);
    let showIdx = Math.floor(Math.random() * ids.length);
    const cycle = () => {
      if (!this.scene.isActive()) return;
      if (this.showFx) { this.showFx.destroy(); this.showFx = null; }
      const b = SS_BEASTS[ids[showIdx % ids.length]];
      const asm = ssAssembleBeast(this, this.showC, b, l.u(0.8));
      this.showFx = ssBeastFx(this, this.showC, b, l.u(0.8), asm, { lite: true });
      showIdx++;
    };
    cycle();
    this.time.addEvent({ delay: 9000, loop: true, callback: () => { this.tweens.add({ targets: this.showC, alpha: 0, duration: 500, onComplete: () => { this.showC.setAlpha(1); cycle(); } }); } });

    // title — the painted wordmark, just above the horizon glow. Sparkles are
    // separate sprites so they can twinkle without redrawing the texture.
    const tk = ssTitleTex(this);
    const tScale = Math.min(1, 384 / tk.w);           // long localized titles fit the frame
    const title = this.titleT = ui(this.add.image(l.x(0), l.y(300), tk.key)
      .setDisplaySize(l.u(tk.w * tScale), l.u(tk.h * tScale)));
    this.titleBase = { sx: title.scaleX, sy: title.scaleY };
    // sparkles sit on letter-tip anchors from the renderer; fractional fallback
    // covers a non-Latin title, which reports no anchors
    const spots = tk.anchors.length
      ? tk.anchors.map((a, i) => [a.x * tScale, a.y * tScale, [15, 11, 13][i % 3]])
      : [[-0.36 * tk.w * tScale, -0.30 * tk.h * tScale, 15], [0.30 * tk.w * tScale, -0.38 * tk.h * tScale, 11], [0.42 * tk.w * tScale, 0.24 * tk.h * tScale, 13]];
    this.sparkles = [];
    for (const [fx, fy, fs] of spots) {
      this.sparkles.push(ui(this.add.image(l.x(fx), l.y(300 + fy), 'spark4')
        .setDisplaySize(l.u(fs), l.u(fs)).setAlpha(0.75).setBlendMode('ADD')));
    }
    // the breath and sparkle idle tweens are re-armed on wake (beginAscent
    // kills them so its fade-to-0 doesn't fight the alpha yoyos)
    this.idleTweens = () => {
      title.setScale(this.titleBase.sx, this.titleBase.sy);
      this.tweens.add({ targets: title, scaleX: this.titleBase.sx * 1.02, scaleY: this.titleBase.sy * 1.02, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      for (const sp of this.sparkles) {
        this.tweens.add({ targets: sp, angle: 360, duration: 36000 + Math.random() * 20000, repeat: -1 });
        this.tweens.add({ targets: sp, alpha: 0.3, duration: 1600 + Math.random() * 1400, yoyo: true, repeat: -1, delay: Math.random() * 1500 });
      }
      // the daily herald's ember breath (guarded: the first idleTweens call
      // runs before the chip is built; the wake path re-arms it here)
      if (this.dailyGlow) {
        this.dailyGlow.setAlpha(0.13);
        this.tweens.add({ targets: this.dailyGlow, alpha: 0.05, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // the lantern owns its own breath (it depends on whether it's lit at
      // all), so the wake path just asks it to redress itself
      if (this.lanternB) this.updateLantern();
    };
    this.idleTweens();
    const bk = ssBraidTex(this);
    ui(this.add.image(l.x(0), l.y(300 + tk.h * tScale * 0.5 + 6), bk.key).setDisplaySize(l.u(bk.w), l.u(bk.h)).setAlpha(0.9));
    // the tagline wears the crest's own dress in miniature (v0.51.0, Wyatt:
    // the old #8a94c4 vanished into the rose band — measured at 1.04:1, i.e.
    // invisible): parchment-gold ink in the crest's navy rim over a soft navy
    // letterpress glow — never flat white, never a box. The RIM is what
    // carries it on the bright dawn band, where gold ink alone melts in;
    // tools/tagline-check.mjs measures both skies.
    ui(ssTxt(this, l.x(0), l.y(358), SS_T('tagline'), l.u(12), '#f2e0a8', 'italic').setOrigin(0.5)
      .setStroke('#241c40', l.u(1.25))
      .setShadow(0, l.u(1.2), 'rgba(16,12,34,0.92)', l.u(4), true, true));

    // buttons
    /* v0.46.0: the four play buttons lost their flavour sublines ("four acts
       · one long night" and kin — Wyatt). What remains under a label is only
       ever INFORMATION that is live right now: the campaign's "fight N of 5"
       while a checkpoint stands, and versus's "✦ N of your friends online"
       while any are. With nothing to say, the label sits dead-centre in its
       button; when a line arrives the label glides up 9 to make room (a
       200ms tween, so the meadow never jumps). The buttons keep their 58
       height either way — the meadow's rhythm is set by them. */
    /* v0.47.0 — THE CAMPAIGN DOORS (Wyatt). NEW GAME is the only way into a
       fresh climb, and warns first when a climb would be lost (newCampaign).
       v0.51.0 — THE HOME RESHAPE (Wyatt, 8/25): CONTINUE GAME exists ONLY
       while a checkpoint stands — no checkpoint, no button (the grey dead
       dress is retired), and the column closes ranks below. QUICK PLAY's
       button left the meadow (the mode, its daily chip and its leaderboard
       rows all live on — ?quick=1 is the harnesses' door). */
    const campRow = () => {
      const ck = this.campaignCheckpoint();
      return {
        label: SS_T('contCamp'), alive: !!ck,
        sub: ck ? SS_ACT_N(SS_ACTS[ck.actIdx]).split('·')[0].trim() + '  ·  ' + SS_T('fightN', ck.fightIdx % 5 + 1) : '',
      };
    };
    this.campRow = campRow;
    const cr = campRow();
    const rows = [
      // CONTINUE GAME opens the star chart at the standing checkpoint —
      // rendered only while one stands (refreshCampDoor is the one door)
      { y: 420, h: 58, label: cr.label, sub: cr.sub, key: 'campaign', fn: () => this.campaignDoor() },
      // NEW GAME: a fresh climb (warned first when a checkpoint stands)
      { y: 488, h: 58, label: SS_T('newCamp'), key: 'newcamp', dark: true, fn: () => this.newCampaign() },
      // LEADERBOARD left the meadow for the profile (v0.52.0): the column is
      // play modes only — the profile chip up in the corner is the door to
      // the night's finest now.
      // PROFILE moved to the chip up in the corner, which frees this row for
      // VERSUS — it is a play mode, so it gets a real button like the rest.
      // Its sub-line is the live friends counter, and nothing else.
      { y: 556, h: 58, label: SS_T('versus'), sub: '', key: 'versus', fn: () => { SFX.ui(); this.scene.start('vsmenu'); } },
    ];
    this.rowSubs = {};
    this.rowLabels = {};
    this.rowBtns = {};
    this.menuRows = [];
    for (const r of rows) {
      const b = ui(this.add.image(l.x(0), l.y(r.y), ssBtn(this, r.dark, 300, r.h)).setDisplaySize(l.u(300), l.u(r.h)).setInteractive({ useHandCursor: true }));
      const live = !!r.sub;
      const lab = ui(ssTxt(this, l.x(0), l.y(r.y - (live ? 9 : 0)), r.label, l.u(16), r.dark ? '#9fb0e8' : BTN_INK()).setOrigin(0.5));
      lab.rowY = r.y;
      if (r.sub !== undefined) {
        // a slot for live information (campaign progress, friends online):
        // hidden and empty until there is something to say
        const sub = ui(ssTxt(this, l.x(0), l.y(r.y + 13), r.sub, l.u(10), r.dark ? '#5a6390' : BTN_INK2(), 'italic').setOrigin(0.5).setVisible(live));
        this.rowSubs[r.key] = sub;
      }
      if (r.key) { this.rowBtns[r.key] = b; this.rowLabels[r.key] = lab; }
      this.menuRows.push({ key: r.key, b, lab, sub: this.rowSubs[r.key] });
      b.on('pointerdown', () => { if (this.busy() || (r.key === 'campaign' && !this.campAlive)) return; SFX.ensure(); this.bloomBtn = b; r.fn(); });
      b.on('pointerover', () => b.setScale(b.scaleX * 1.03, b.scaleY * 1.03));
      b.on('pointerout', () => b.setDisplaySize(l.u(300), l.u(r.h)));
    }
    /* the column owns its shape (v0.51.0): the rows that stand are laid 68
       apart, centred on the band's middle (522) — three rows read 454..590,
       two read 488..556, and no gap is ever left where a hidden door
       would be. `snap` skips the glide (first paint, any change under a
       veil); a live change slides the meadow's furniture, never jumps it. */
    this.layoutMenu = (snap) => {
      const vis = this.menuRows.filter((m) => m.b.visible);
      let ry = 522 - (vis.length - 1) * 34;
      for (const m of vis) {
        m.lab.rowY = ry;
        const lift = m.sub && m.sub.visible ? 9 : 0;
        const move = [[m.b, l.y(ry)], [m.lab, l.y(ry - lift)]];
        if (m.sub) move.push([m.sub, l.y(ry + 13)]);
        for (const [o, ty] of move) {
          this.tweens.killTweensOf(o);
          if (snap || Math.abs(o.y - ty) < 0.5) o.setY(ty);
          else this.tweens.add({ targets: o, y: ty, duration: 220, ease: 'Sine.easeInOut' });
        }
        ry += 68;
      }
    };
    /* set (or clear) a row's live sub-line. The label re-centres when the
       line is empty and lifts 9 when one is live; `snap` skips the glide
       (first paint, the wake path under a veil). */
    this.setRowSub = (key, text, color, snap) => {
      const sub = this.rowSubs[key], lab = this.rowLabels[key];
      if (!sub || !sub.active || !lab || !lab.active) return;
      const live = !!text;
      sub.setText(text || '');
      if (color) sub.setColor(color);
      sub.setVisible(live);
      const ty = l.y(lab.rowY - (live ? 9 : 0));
      this.tweens.killTweensOf(lab);
      if (snap || Math.abs(lab.y - ty) < 0.5) lab.setY(ty);
      else this.tweens.add({ targets: lab, y: ty, duration: 200, ease: 'Sine.easeInOut' });
    };
    /* the CONTINUE GAME door re-reads the checkpoint: alive (full dress,
       hand cursor, live progress line) or NOT RENDERED AT ALL (v0.51.0 —
       the grey dead dress retired; the column reflows). Called on first
       paint, on every return from a battle (a win or loss clears the
       checkpoint → the door goes) and after a restart wipes it. visible is
       the state's carrier here because the intro and the wake path restore
       every ui item's ALPHA to baseAlpha — a hidden door must stay hidden
       through both. */
    this.campAlive = cr.alive;
    this.refreshCampDoor = (snap) => {
      const b = this.rowBtns.campaign, lab = this.rowLabels.campaign, sub = this.rowSubs.campaign;
      if (!b || !b.active || !lab || !lab.active) return;
      const r = this.campRow();
      this.campAlive = r.alive;
      lab.setText(r.label);
      this.tweens.killTweensOf(b);
      b.setDisplaySize(l.u(300), l.u(58));
      if (r.alive) {
        b.setVisible(true).setInteractive({ useHandCursor: true });
        lab.setVisible(true);
        b.setAlpha(b.baseAlpha = 1); lab.setAlpha(lab.baseAlpha = 1);
        if (sub) { sub.setText(r.sub); sub.setVisible(!!r.sub); }
      } else {
        b.setVisible(false).disableInteractive();
        lab.setVisible(false);
        b.setAlpha(b.baseAlpha = 1); lab.setAlpha(lab.baseAlpha = 1);
        if (sub) { sub.setText(''); sub.setVisible(false); }
      }
      this.layoutMenu(snap);
    };
    this.refreshCampDoor(true);
    // Profile chip — the stargazer's name, up in the corner on the same line as
    // every other scene's back link. Long or non-Latin names are trimmed to the
    // chip rather than sized to it, so the pill keeps one baked texture.
    const CW = 152, CH = 30;
    const chip = this.profileChip = ui(this.add.image(l.x(195), l.y(26), ssBtn(this, true, CW, CH))
      .setDisplaySize(l.u(CW), l.u(CH)).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));
    ssHitPad(chip, 44, 'up');       // the pill sits 26 beneath: grow toward the sky, never over the pill
    const chipT = ui(ssTxt(this, l.x(195 - CW / 2), l.y(26), '✦ ' + SSNET.myName(), l.u(11), '#9fb0e8').setOrigin(0.5));
    let nm = SSNET.myName();
    while (chipT.width > l.u(CW - 18) && nm.length > 2) { nm = nm.slice(0, -1); chipT.setText('✦ ' + nm + '…'); }
    chip.on('pointerdown', () => { if (this.busy()) return; SFX.ensure(); SFX.ui(); this.scene.start('profile'); });
    chip.on('pointerover', () => chip.setScale(chip.scaleX * 1.04, chip.scaleY * 1.04));
    chip.on('pointerout', () => chip.setDisplaySize(l.u(CW), l.u(CH)));

    // Star rating — the standing beside the stargazer's name: a small pill
    // under the chip wearing the tier's glyph and color, the star-class named
    // beneath it. Tap → your own rating card (always visible to yourself,
    // veiled or not). Refreshed on wake — a battle can move the number.
    const RW = 108, RH = 22;
    const rpill = this.ratingPill = ui(this.add.image(l.x(195), l.y(52), ssBtn(this, true, RW, RH))
      .setDisplaySize(l.u(RW), l.u(RH)).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));
    ssHitPad(rpill, 44, 'down');    // and the pill grows toward the meadow
    this.ratingT = ui(ssTxt(this, l.x(195 - RW / 2), l.y(52), '', l.u(11), '#cfd8ff').setOrigin(0.5));
    this.ratingTierT = ui(ssTxt(this, l.x(195), l.y(68), '', l.u(8.5), '#cfd8ff', 'italic').setOrigin(1, 0.5).setAlpha(0.85));
    this.refreshRatingPill = () => {
      if (!this.ratingT || !this.ratingT.active) return;
      const tier = ssRatingTier(SS.prof.rating);
      this.ratingT.setText(tier.glyph + ' ' + SS.prof.rating).setColor(tier.color)
        .setShadow(0, 0, tier.color, l.u(5), true, true);
      this.ratingTierT.setText(SS_T(tier.key)).setColor(tier.color);
    };
    this.refreshRatingPill();
    rpill.on('pointerdown', () => { if (this.busy()) return; SFX.ensure(); ssRatingCard(this, { own: true }); });
    rpill.on('pointerover', () => rpill.setScale(rpill.scaleX * 1.04, rpill.scaleY * 1.04));
    rpill.on('pointerout', () => rpill.setDisplaySize(l.u(RW), l.u(RH)));

    // Daily hunt herald — a small red chip in the top-left corner, counting
    // tonight's sky down second by second. Alive while the hunt is unplayed
    // (ember glow breathing behind it), quiet with a ✓ once you've hunted.
    // Tapping it opens the daily pre-screen, same door as the old button.
    const DW = 108, DH = 26;
    this.dailyGlow = ui(this.add.image(l.x(-195 + DW / 2), l.y(26), 'glowbig')
      .setDisplaySize(l.u(DW * 1.8), l.u(62)).setTint(0xff5e4d).setAlpha(0.13).setBlendMode('ADD'));
    const dchip = this.dailyChipB = ui(this.add.image(l.x(-195), l.y(26), 'chipred')
      .setDisplaySize(l.u(DW), l.u(DH)).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }));
    this.dailyChipT = ui(ssTxt(this, l.x(-195 + DW / 2), l.y(26), '', l.u(10.5), '#ffe2c9').setOrigin(0.5)
      .setShadow(0, l.u(1), 'rgba(40,4,10,0.8)', l.u(1.5)));
    dchip.on('pointerdown', () => { if (this.busy()) return; SFX.ensure(); this.dailySheet(); });
    dchip.on('pointerover', () => dchip.setScale(dchip.scaleX * 1.05, dchip.scaleY * 1.05));
    dchip.on('pointerout', () => dchip.setDisplaySize(l.u(DW), l.u(DH)));
    this.tweens.add({ targets: this.dailyGlow, alpha: 0.05, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    /* THE STREAK LANTERN — it hangs beside the herald, and it is the only
       thing on this screen the player made themselves. Cold and quiet with no
       streak; lit from the first night, and from the second it carries the
       count in its glass and breathes. Never louder than the chip: the halo tops out well under the
       daily's ember, and nothing here moves fast. */
    // 35x49 of texture, of which the lamp body is the same 26x36 it has been
    // since v0.39.0 — the margin is the crowns' room (see ssMakeTextures).
    const LW = SS_LANTERN_W, LH = SS_LANTERN_H, lx = -62;
    this.lanternGlow = ui(this.add.image(l.x(lx), l.y(SS_LANTERN_Y + 5), 'glowbig')
      .setDisplaySize(l.u(52), l.u(52)).setTint(0xffb457).setAlpha(0).setBlendMode('ADD'));
    const lamp = this.lanternB = ui(this.add.image(l.x(lx), l.y(SS_LANTERN_Y), 'lantern-cold')
      .setDisplaySize(l.u(LW), l.u(LH)).setInteractive({ useHandCursor: true }));
    // the count rides in the pane itself, shrunk to fit rather than clipped —
    // a hundred-night flame is a problem worth rendering properly
    this.lanternT = ui(ssTxt(this, l.x(lx), l.y(SS_LANTERN_Y + SS_LANTERN_TY), '', l.u(11), '#3a2408').setOrigin(0.5));
    // the honest mark: a dashed ring under the glass while the flame is
    // standing on its grace night and nothing else
    this.lanternG = ui(ssTxt(this, l.x(lx), l.y(SS_LANTERN_Y + 26), '◌', l.u(9), '#ffb457').setOrigin(0.5).setAlpha(0));
    // the lantern's own door now: the streak sheet, where the week of nights
    // and the grace night are read (a HUNT button there keeps the daily one
    // tap away, the way tapping the lamp used to be)
    lamp.on('pointerdown', () => { if (this.busy()) return; SFX.ensure(); this.streakSheet(); });
    lamp.on('pointerover', () => lamp.setScale(lamp.scaleX * 1.06, lamp.scaleY * 1.06));
    lamp.on('pointerout', () => lamp.setDisplaySize(l.u(LW), l.u(LH)));
    this.updateDailyChip();

    // the VERSUS door knows who's waiting behind it: with friends online a
    // gold sub-line counts them (live from the presence layer); with none,
    // the label sits alone, centred (v0.46.0 — the old flavour line is gone)
    if (this.frOff) this.frOff();
    this.frOff = SSNET.FR.on((FR) => {
      const n = FR.onlineCount();
      this.setRowSub('versus', n > 0 ? SS_T('vsFriendsOn', n) : '', '#ffe9a8');
    });
    this.events.once('shutdown', () => { if (this.frOff) { this.frOff(); this.frOff = null; } });
    const verT = ssTxt(this, l.x(0), l.y(784), BUILD + ' · Corkscrew Games' + (SSNET.mode === 'local' ? ' · offline' : ''), l.u(9), '#39406b').setOrigin(0.5);
    ui(verT);
    this.muteB = ui(ssTxt(this, l.x(-195), l.y(784), SFX.muted ? '🔇' : '🔊', l.u(14)).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7));
    this.muteB.on('pointerdown', () => { SFX.ensure(); SFX.setMuted(!SFX.muted); this.muteB.setText(SFX.muted ? '🔇' : '🔊'); });
    // language switcher — opposite the mute toggle; opens the sheet of native names
    this.langB = ui(ssTxt(this, l.x(195), l.y(784), '🌐', l.u(14)).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7));
    this.langB.on('pointerdown', () => this.langSheet());
    DIAG('meadow ui built ' + Math.round(performance.now() - tUi) + 'ms');
  }

  /* ---------- the opening: born at the zenith (cold boot only) ----------
     The first thing a player ever sees is the top of the sky — deep twilight,
     the aurora, the dense star field, shooting stars — then the wordmark
     condenses out of stardust and the whole column settles down into the
     meadow: the intro IS the home scene arriving, not a page before it.
     Always tappable-through — one tap settles straight onto the grass (the
     listener is armed a beat late via delayedCall: the v0.3.3 lesson, a
     listener added during a dispatch sees the tap that created it).
     prefers-reduced-motion swaps the flight for a veil fade on the grass.
     No new assets: every texture here already exists for the ascent. */
  playIntro(l) {
    INTRO_SEEN = true;
    this.buildMeadowUi(l);
    if (ssReduceMotion()) {
      // gentle: open on the grass under a lifting veil. introPlaying never
      // sticks on this path, so create() starts the crickets as usual.
      DIAG('intro: reduce-motion → veil fade');
      const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setDepth(650);
      this.tweens.add({ targets: veil, alpha: 0, duration: 700, onComplete: () => veil.destroy() });
      window.__ssintro = 'reduced';
      return;
    }
    try {
      this.introPlaying = true;
      this.introFx = [];              // landing flourishes; finish() sweeps them
      window.__ssintro = 'playing';   // headless verification reads this
      DIAG('intro begin');
      // the meadow ui waits at alpha 0 for the camera to come down
      for (const o of this.uiItems) { this.tweens.killTweensOf(o); o.setAlpha(0); }
      this.sky.grain.setVisible(false);          // never during a flight
      // a shade below the true zenith: the violet dusk band peeks in at the
      // bottom edge — deeper twilight than the battle sky's flat navy, and a
      // hint that there is a world below to settle into
      this.introP = 0.92;
      this.sky.setP(this.introP, 0);
      // wordmark + halo, fixed to the camera at the zenith; they fade on the
      // way down and hand off to the real title waiting in the meadow
      const tk = ssTitleTex(this);
      const tScale = Math.min(1, 384 / tk.w);
      const t = this.add.image(l.W / 2, l.H * 0.4, tk.key)
        .setDisplaySize(l.u(tk.w * tScale), l.u(tk.h * tScale)).setScrollFactor(0).setDepth(610).setAlpha(0);
      const bs = { sx: t.scaleX, sy: t.scaleY };
      t.setScale(bs.sx * 1.12, bs.sy * 1.12);
      const glow = this.add.image(t.x, t.y, 'glowbig').setScale(l.u(2.1)).setTint(0xf3e5b4)
        .setBlendMode('ADD').setScrollFactor(0).setDepth(605).setAlpha(0);
      const em = this.add.particles(0, 0, 'dot', {
        speed: { min: 6, max: 46 }, lifespan: { min: 500, max: 1100 }, gravityY: -14,
        scale: { start: 0.5, end: 0 }, alpha: { start: 0.85, end: 0 },
        blendMode: 'ADD', tint: [0xf3e5b4, 0xffe9c9, 0xcfd8ff], emitting: false,
      }).setScrollFactor(0).setDepth(612);
      // fade up from black — the page was black a moment ago; meet it there
      const bootVeil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setDepth(650);
      this.tweens.add({ targets: bootVeil, alpha: 0, duration: 450, onComplete: () => bootVeil.destroy() });

      const timers = [];
      const at = (ms, fn) => timers.push(this.time.delayedCall(ms, fn));
      const finish = (skipped) => {
        if (!this.introPlaying) return;
        this.introPlaying = false;
        for (const tm of timers) tm.remove(false);
        if (this.introSkipFn) { this.input.off('pointerdown', this.introSkipFn); this.introSkipFn = null; }
        this.tweens.killTweensOf([t, glow]);
        for (const fx of this.introFx) if (fx && fx.active) { this.tweens.killTweensOf(fx); fx.destroy(); }
        this.introFx = [];
        t.destroy(); glow.destroy(); em.destroy();
        this.sky.setP(0, 0);
        this.sky.grain.setVisible(true);
        for (const o of this.uiItems) { this.tweens.killTweensOf(o); o.setAlpha(o.baseAlpha); }
        this.idleTweens();
        SFX.crickets(!this.isDawn); SFX.birds(this.isDawn);
        window.__ssintro = skipped ? 'skipped' : 'done';
        DIAG('intro ' + (skipped ? 'SKIPPED' : 'done'));
      };
      // the pan down into the meadow — the sky settling IS the scene change.
      // Re-entrant on purpose: a skip mid-glide re-calls it with a short ms to
      // accelerate from wherever introP currently is.
      const settle = (ms, skipped) => {
        if (this.introGlide) { this.introGlide.stop(); this.introGlide = null; }
        this.tweens.killTweensOf([t, glow]);
        this.tweens.add({ targets: [t, glow], alpha: 0, duration: Math.min(500, ms * 0.55), delay: ms * 0.2 });
        // the meadow's own wordmark (and its sparkles) wake ahead of the rest:
        // the zenith word dissolves while this one comes up, so the title reads
        // as riding the descent down rather than cutting from one to the other
        const early = new Set([this.titleT, ...(this.sparkles || [])]);
        for (const o of this.uiItems) { this.tweens.killTweensOf(o); this.tweens.add({ targets: o, alpha: o.baseAlpha, duration: 450, delay: Math.max(0, ms - (early.has(o) ? 690 : 420)) }); }
        this.introGlide = this.tweens.addCounter({
          from: this.introP, to: 0, duration: ms, ease: 'Cubic.easeInOut',
          onUpdate: (tw) => { this.introP = tw.getValue(); this.sky.setP(this.introP, 0); },
          onComplete: () => finish(skipped),
        });
      };
      // the show, beats overlapping like weather: a star streaks while the boot
      // veil is still lifting, the word condenses and LANDS (scale settles with
      // a Back overshoot into a swell of light and kicked stardust), a second
      // star crosses the landing itself, and the descent begins on the
      // landing's afterglow — no beat waits for the last one to end
      at(200, () => ssShootingStar(this));
      at(320, () => {
        if (!this.introPlaying) return;
        this.tweens.add({ targets: glow, alpha: 0.32, duration: 550, yoyo: true, hold: 200 });
        this.tweens.add({ targets: t, alpha: 1, duration: 750, ease: 'Sine.easeOut' });
        this.tweens.add({
          targets: t, scaleX: bs.sx, scaleY: bs.sy, duration: 950, ease: 'Back.easeOut',
          onComplete: () => {
            // the landing: the halo swells, a ring of light blooms outward,
            // stardust kicks up from the word's baseline
            if (!this.introPlaying) return;
            this.tweens.killTweensOf(glow);
            this.tweens.add({
              targets: glow, alpha: 0.5, duration: 150, yoyo: true,
              onComplete: () => { if (this.introPlaying) this.tweens.add({ targets: glow, alpha: 0.18, duration: 450 }); },
            });
            const ring = this.add.image(t.x, t.y, 'glowbig').setScale(l.u(0.9)).setTint(0xffe9c9)
              .setBlendMode('ADD').setScrollFactor(0).setDepth(604).setAlpha(0.3);
            this.introFx.push(ring);
            this.tweens.add({ targets: ring, scale: l.u(3.1), alpha: 0, duration: 420, ease: 'Sine.easeOut', onComplete: () => { if (ring.active) ring.destroy(); } });
            const rb = t.getBounds();
            for (let k = 0; k < 18; k++) em.emitParticleAt(rb.x + Math.random() * rb.width, rb.y + rb.height * (0.72 + Math.random() * 0.3));
          },
        });
        const b = t.getBounds();
        for (let k = 0; k < 42; k++) em.emitParticleAt(b.x + Math.random() * b.width, b.y + b.height * 0.2 + Math.random() * b.height * 0.6);
      });
      at(1000, () => ssShootingStar(this));
      at(1350, () => settle(1000, false));
      at(300, () => {
        if (!this.introPlaying) return;
        this.input.on('pointerdown', this.introSkipFn = () => {
          if (!this.introPlaying) return;
          for (const tm of timers) tm.remove(false);
          settle(Math.max(240, 340 * this.introP), true);
        });
      });
    } catch (e) {
      // the opening must never strand the player above their own meadow
      DIAG('intro FALLBACK: ' + (e && e.message || '?'));
      this.introPlaying = false;
      this.sky.setP(0, 0);
      this.sky.grain.setVisible(true);
      for (const o of this.uiItems) { this.tweens.killTweensOf(o); o.setAlpha(o.baseAlpha); }
      this.idleTweens();
    }
  }
  // Subtitle under DAILY HUNT. Unplayed, it invites and shows how long the sky
  // stays up; played, it shows today's score and when the next one lands.
  // the herald's second-by-second clock; also flips the chip between its
  // alive (unplayed — ember glow) and quiet (✓ hunted) dress
  updateDailyChip() {
    if (this.dailyChipT && this.dailyChipT.active) {
      const played = !!SS.prof.daily[String(SSNET.dayKey())];
      this.dailyChipT.setText((played ? '✓ ' : '☀ ') + ssClock(SSNET.msToNextDay()));
      if (this.dailyGlow && this.dailyGlow.active) this.dailyGlow.setVisible(!played);
    }
    // the lantern rides the herald's clock: when midnight UTC turns under a
    // player standing in the grass, a flame that just went cold must go dark
    // on the same tick the chip lights back up
    this.updateLantern();
  }
  // the lantern's whole state, in one place: cold glass with no streak, warm
  // glass from the first night, the count from the second. Idempotent — every
  // caller (build, the 1s tick, the wake from a finished hunt) runs it whole.
  updateLantern() {
    if (!this.lanternB || !this.lanternB.active) return;
    const l = ssLayout(this);
    const st = ssStreakState();
    const n = st.n;
    const lit = n >= 1;
    const tier = ssLanternTier(n);
    const grew = this.lanternShown != null && n > this.lanternShown;
    this.lanternShown = n;
    // setTexture resets the frame size, so the display size is re-asserted.
    // A cold lantern steps back a little (it must not outweigh the herald
    // beside it) but no further: at 0.5 its iron vanished into the dusk and
    // only the dark pane survived — a gray box, not a lamp.
    this.lanternB.setTexture(SS_LANTERN_TEX[tier + 1])
      .setDisplaySize(l.u(SS_LANTERN_W), l.u(SS_LANTERN_H));
    ssHitPad(this.lanternB, 44);     // the new frame's scale: re-pad to the 44-pt law
    this.lanternB.baseAlpha = lit ? 1 : 0.82;
    const g = this.lanternGlow;
    // the halo grows with the marks but still never reaches the daily chip's
    // own ember at its brightest (0.13) — the herald leads this corner
    if (g && g.active) {
      g.baseAlpha = lit ? [0.12, 0.125, 0.13, 0.13][tier] : 0;
      g.setDisplaySize(l.u(lit ? [52, 58, 64, 72][tier] : 52), l.u(lit ? [52, 58, 64, 72][tier] : 52));
      g.setTint(tier >= 2 ? 0xffd77a : 0xffb457);
    }
    // a flame standing on its grace night says so, right on the meadow
    const gm = this.lanternG;
    if (gm && gm.active) gm.baseAlpha = st.grace ? 0.9 : 0;
    const t = this.lanternT;
    if (t && t.active) {
      t.setFontSize(l.u(11));                  // start from full size every time…
      t.setText(n >= 2 ? String(n) : '');      // the flame shows at one, the count from two
      // …then shrink to the pane rather than spill over its iron posts
      let fs = 11;
      while (t.width > l.u(12.5) && fs > 6) { fs -= 0.75; t.setFontSize(l.u(fs)); }
    }
    /* ⚠ The herald tick keeps running through the ascent and the opening, and
       both of those own every ui item's alpha for their duration. Writing
       alpha here mid-flight would pop the lantern back over the rising sky —
       and killTweensOf() below would take the whole group fade with it, since
       that fade is ONE tween over all of uiItems. So: record the resting
       alphas above (the restore paths read baseAlpha) and touch nothing else
       until the meadow is standing still. */
    if (this.ascending || this.introPlaying) return;
    this.lanternB.setAlpha(this.lanternB.baseAlpha);
    if (gm && gm.active) gm.setAlpha(gm.baseAlpha);
    if (g && g.active) {
      // The wake path runs this twice (idleTweens re-arms the breathers, then
      // the herald tick refreshes both heralds). A swell already in flight for
      // this same count must survive the second call, or the celebration is
      // killed 0ms after it starts.
      if (lit && !grew && this.lanternSwell && this.lanternSwell.isPlaying()) return;
      this.tweens.killTweensOf(g);
      g.setAlpha(g.baseAlpha);
      // a lantern breathes; it does not blink. Slower and dimmer than the
      // daily chip's ember (0.13↔0.05 over a far bigger sprite) on purpose —
      // the herald still leads this corner.
      const breathe = () => { if (g.active) this.tweens.add({ targets: g, alpha: 0.04, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); };
      if (!lit) return;
      // one soft swell the first time you come home with a longer flame,
      // and the steady breath picks up where it lands
      if (grew) this.lanternSwell = this.tweens.add({ targets: g, alpha: 0.30, duration: 420, yoyo: true, ease: 'Sine.easeOut', onComplete: breathe });
      else breathe();
    }
  }
  /* ---------- THE MARKS: the lantern grows ----------
     Crossing 7 / 30 / 100 nights re-dresses the lamp, and a change that big
     is not allowed to happen behind the player's back. `streak.pend` carries
     the earned mark from the battle that earned it all the way to the grass —
     it survives an app closed on the end screen, which is exactly where a
     player who just finished a hunt tends to close it.
     The beat waits for a meadow that is standing still: the ascent and the
     descent own the camera and every ui alpha for their duration, and a sheet
     open over the grass owns the player's attention. */
  milestoneCheck() {
    const m = SS.prof.streak.pend | 0;
    if (!m || !SS_MS_ACH[m] || this.riteC) return;
    if (this.riteTimer) { this.riteTimer.remove(false); this.riteTimer = null; }
    let tries = 0;
    const settled = () => !this.busy() && !this.streakC && !this.dailyC && !this.langC
      && !this.mapC && !this.confirmC && !this.signC && !!this.lanternB && this.lanternB.active;
    const armed = () => {
      if (!this.scene.isActive()) return;
      if (settled()) { this.riteTimer = null; this.milestoneRite(m); return; }
      if (++tries > 40) { this.riteTimer = null; return; }   // ~16s of grass, then let it lie for next time
      this.riteTimer = this.time.delayedCall(400, armed);
    };
    this.riteTimer = this.time.delayedCall(700, armed);
  }
  /* THE DRIP'S SAFETY NET. The end screen says a discovery out loud the
     moment it happens, but a player can leave before it does — tap NEW RUN on
     the beat, close the app on the end window, or abandon a run whose last
     word finished a condition. Anything still in `pend` is therefore said on
     the grass instead, on the same terms as the lantern's ceremony: it waits
     for a meadow that is standing still, and it never cuts in front of a mark
     (riteTimer/riteC are part of `settled`, so the lamp's rite goes first). */
  sigilNotice() {
    if (this.sigTimer || !ssSigilPending().length) return;
    let tries = 0;
    const settled = () => !this.busy() && !this.riteC && !this.riteTimer && !this.streakC
      && !this.dailyC && !this.langC && !this.mapC && !this.confirmC && !this.signC;
    const armed = () => {
      if (!this.scene.isActive()) return;
      const pend = ssSigilPending();
      if (!pend.length) { this.sigTimer = null; return; }
      if (settled()) { this.sigTimer = null; ssSigilAnnounce(this, pend); return; }
      if (++tries > 60) { this.sigTimer = null; return; }   // ~24s, then let it lie for next time
      this.sigTimer = this.time.delayedCall(400, armed);
    };
    this.sigTimer = this.time.delayedCall(900, armed);
  }
  milestoneRite(m) {
    if (this.riteC) return;
    const copy = ssMarkCopy(m);
    const tier = SS_MILESTONES.indexOf(m) + 1;
    // spend the mark the moment it is honoured, not when it is scheduled — an
    // app closed mid-wait must still get its ceremony on the next visit
    SS.prof.streak.pend = 0; SS.save();
    const l = ssLayout(this);
    const c = this.riteC = this.add.container(0, 0).setDepth(660);
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      this.tweens.add({
        targets: c, alpha: 0, duration: 520, ease: 'Sine.easeIn',
        onComplete: () => { if (this.riteC === c) this.riteC = null; c.destroy(); },
      });
      // and the corner lamp takes its new dress, with one swell of its own
      this.lanternShown = null;
      this.updateLantern();
    };

    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H)
      .setScrollFactor(0).setAlpha(0).setInteractive();
    veil.on('pointerdown', () => { SFX.ui(); close(); });
    // deep, like the sigil pick — anything lighter and the meadow's own gold
    // buttons keep reading THROUGH the ceremony and the words land on them
    this.tweens.add({ targets: veil, alpha: 0.9, duration: 420 });
    c.add(veil);

    // the forge/award language: the anvil chime, then the award arpeggio
    SFX.ensure(); SFX.forge();
    this.time.delayedCall(360, () => { if (SFX.ok) SFX.ach(); });

    // the lamp, in its new dress, rising out of the dark at the sky's middle
    const LS = 3.4, ly = 288;
    const glow = this.add.image(l.x(0), l.y(ly), 'glowbig').setDisplaySize(l.u(60), l.u(60))
      .setTint(tier >= 2 ? 0xffd77a : 0xffb457).setAlpha(0).setBlendMode('ADD').setScrollFactor(0);
    const lamp = this.add.image(l.x(0), l.y(ly), SS_LANTERN_TEX[tier + 1])
      .setDisplaySize(l.u(SS_LANTERN_W * LS * 0.6), l.u(SS_LANTERN_H * LS * 0.6))
      .setAlpha(0).setScrollFactor(0);
    c.add([glow, lamp]);
    this.tweens.add({ targets: lamp, alpha: 1, duration: 620, ease: 'Cubic.easeOut' });
    this.tweens.add({
      targets: lamp, displayWidth: l.u(SS_LANTERN_W * LS), displayHeight: l.u(SS_LANTERN_H * LS),
      duration: 760, ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: glow, alpha: 0.34, displayWidth: l.u(250), displayHeight: l.u(250), duration: 760, ease: 'Cubic.easeOut',
      onComplete: () => { if (glow.active) this.tweens.add({ targets: glow, alpha: 0.16, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); },
    });
    // the number, riding in the pane the way it does on the meadow
    const nT = ssTxt(this, l.x(0), l.y(ly + SS_LANTERN_TY * LS), String(SS.prof.streak.n | 0), l.u(30), '#3a2408').setOrigin(0.5).setScrollFactor(0).setAlpha(0);
    let fs = 30;
    while (nT.width > l.u(12.5 * LS) && fs > 11) { fs -= 2; nT.setFontSize(l.u(fs)); }
    c.add(nT);
    this.tweens.add({ targets: nT, alpha: 1, duration: 500, delay: 300 });

    // sparks off the glass — the forge's own particles
    if (!ssReduceMotion()) {
      const em = this.add.particles(0, 0, 'dot', {
        speed: { min: 20, max: 190 }, lifespan: { min: 700, max: 1700 }, gravityY: -26,
        scale: { start: 0.7, end: 0 }, alpha: { start: 0.95, end: 0 },
        blendMode: 'ADD', tint: [0xffd77a, 0xfff2c9, 0xffb457], emitting: false,
      }).setScrollFactor(0);
      c.add(em);
      const burst = (n2) => { for (let k = 0; k < n2; k++) em.emitParticleAt(l.x(0) + (Math.random() - 0.5) * l.u(52), l.y(ly) + (Math.random() - 0.5) * l.u(60)); };
      this.time.delayedCall(220, () => { if (em.active) burst(38); });
      this.time.delayedCall(700, () => { if (em.active) burst(22); });
      if (tier >= 3) this.time.delayedCall(1150, () => { if (em.active) burst(26); });
    }

    // the words
    const head = ssTxt(this, l.x(0), l.y(452), SS_T('stkMsHead'), l.u(12), '#c9b676').setOrigin(0.5).setScrollFactor(0).setAlpha(0);
    const gk = ssGoldTex(this, copy.name, 26);
    const gsc = Math.min(1, 330 / gk.w);
    const name = this.add.image(l.x(0), l.y(494), gk.key).setDisplaySize(l.u(gk.w * gsc), l.u(gk.h * gsc)).setScrollFactor(0).setAlpha(0);
    const sub = ssTxt(this, l.x(0), l.y(534), copy.sub, l.u(12), '#ffe9a8', 'italic').setOrigin(0.5).setScrollFactor(0).setAlpha(0);
    const hint = ssTxt(this, l.x(0), l.y(596), SS_T('inspSub'), l.u(9.5), '#8a94c4', 'italic').setOrigin(0.5).setScrollFactor(0).setAlpha(0);
    c.add([head, name, sub, hint]);
    [[head, 620], [name, 800], [sub, 1060], [hint, 1600]].forEach(([o, d]) => {
      o.y += l.u(10);
      this.tweens.add({ targets: o, y: o.y - l.u(10), alpha: o === hint ? 0.85 : 1, duration: 420, delay: d, ease: 'Cubic.easeOut' });
    });

    ssHealBlankTexts(this, 'lantern-rite');
    // it holds long enough to be read, then lets the meadow back
    this.time.delayedCall(5200, close);
    this.events.once('shutdown', () => { if (this.riteC === c) this.riteC = null; });
  }

  /* ---------- THE LANTERN SHEET ----------
     Tapping the lamp opens its own story rather than the daily's: the lantern
     at whatever size it has grown to, the number of nights, THE WEEK STRIP —
     the last seven nights as small rings, lit ✓, grace ◌, dark for a miss —
     and the plain truth about the grace night. The daily is still one tap
     away at the bottom, which is the door the lamp used to be. */
  streakSheet() {
    if (this.busy() || this.streakC || this.dailyC || this.langC || this.mapC || this.confirmC || this.signC || this.riteC) return;
    SFX.ensure(); SFX.ui();
    const l = ssLayout(this);
    const c = this.streakC = this.add.container(0, 0).setDepth(700);
    const closeSheet = () => {
      if (this.streakC !== c) return;
      this.streakC = null;
      c.destroy();
    };
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.72, duration: 220 });
    veil.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    c.add(veil);

    const PH = 486, top = 400 - PH / 2;
    const py = (d) => l.y(top + d);
    /* One ordered list, because z-order here is the halo BEHIND the lamp and
       the rings ABOVE the window. Anything that owns its own alpha (the
       breathing halo, tonight's pulsing ring) is flagged __fx and skipped by
       the entrance tween — a fade-to-1 over one of those kills the repeating
       yoyo the moment it starts. */
    const items = [];
    const fx = (o) => { o.__fx = true; return o; };
    const win = this.add.image(l.x(0), py(PH / 2), 'endpanel').setDisplaySize(l.u(340), l.u(PH)).setInteractive();
    items.push(win);
    const xB = ssTxt(this, l.x(148), py(26), '✕', l.u(15), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xB.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    items.push(xB);

    const st = ssStreakState();
    const n = st.n, tier = ssLanternTier(n);
    const hk = ssGoldTex(this, SS_T('stkSheet'), 19);
    const hsc = Math.min(1, 276 / hk.w);
    items.push(this.add.image(l.x(0), py(42), hk.key).setDisplaySize(l.u(hk.w * hsc), l.u(hk.h * hsc)));

    // the lamp itself, at twice its corner size — this is the one screen where
    // the thing the player built is allowed to be the subject
    if (n >= 1) {
      const gl = this.add.image(l.x(0), py(108), 'glowbig').setDisplaySize(l.u(160), l.u(160))
        .setTint(tier >= 2 ? 0xffd77a : 0xffb457).setAlpha(0).setBlendMode('ADD');
      items.push(fx(gl));
      this.tweens.add({ targets: gl, alpha: 0.2, duration: 500, onComplete: () => {
        if (gl.active) this.tweens.add({ targets: gl, alpha: 0.09, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } });
    }
    const LS = 2;
    const lamp = this.add.image(l.x(0), py(108), SS_LANTERN_TEX[tier + 1])
      .setDisplaySize(l.u(SS_LANTERN_W * LS), l.u(SS_LANTERN_H * LS)).setAlpha(n >= 1 ? 1 : 0.82);
    items.push(lamp);
    if (n >= 2) {
      const cT = ssTxt(this, l.x(0), py(108 + SS_LANTERN_TY * LS), String(n), l.u(24), '#3a2408').setOrigin(0.5);
      let fs = 24;
      while (cT.width > l.u(12.5 * LS) && fs > 9) { fs -= 1.5; cT.setFontSize(l.u(fs)); }
      items.push(cT);
    }

    // the count, in the same words the end screen and the daily sheet use
    items.push(ssTxt(this, l.x(0), py(176), n >= 1 ? '🔥 ' + SS_T('stkNight', n) : SS_T('stkCold'),
      l.u(n >= 1 ? 16 : 14), n >= 1 ? '#ffb457' : '#5a6390', n >= 1 ? null : 'italic').setOrigin(0.5)
      .setShadow(0, 0, n >= 1 ? '#a8520d' : 'rgba(0,0,0,0)', l.u(n >= 1 ? 9 : 0), true, true));
    if (n < 1) items.push(ssTxt(this, l.x(0), py(198), SS_T('stkColdSub'), l.u(10.5), '#8a94c4', 'italic').setOrigin(0.5));
    else if (SS.prof.streak.best > n) items.push(ssTxt(this, l.x(0), py(198), SS_T('stkBest', SS.prof.streak.best | 0), l.u(10), '#8a94c4', 'italic').setOrigin(0.5));

    items.push(this.add.rectangle(l.x(0), py(216), l.u(288), Math.max(1, l.u(1)), 0xc9a84c, 0.35));

    // ---- THE WEEK STRIP: the last seven nights, oldest first ----
    items.push(ssTxt(this, l.x(0), py(236), SS_T('stkWeekHead'), l.u(10.5), '#c9b676').setOrigin(0.5));
    const week = ssStreakWeek();
    const RY = 268, RR = 11, GAP = 41;
    week.forEach((d, i) => {
      const x = l.x((i - 3) * GAP), y = py(RY);
      const g = this.add.graphics({ x, y });
      if (d.state === 'lit') {
        // a night that was hunted: a warm disc with a gold rim, and a tick
        g.fillStyle(0xffb457, 0.9); g.fillCircle(0, 0, l.u(RR - 1));
        g.lineStyle(l.u(1.6), 0xffe9a8, 1); g.strokeCircle(0, 0, l.u(RR));
        items.push(g, ssTxt(this, x, y, '✓', l.u(11), '#3a2408').setOrigin(0.5, 0.55));
      } else if (d.state === 'grace') {
        // THE GRACE NIGHT, owned up to: a dashed ring, hollow where a hunt
        // should have been. Twelve arcs with twelve gaps.
        g.lineStyle(l.u(1.7), 0xffb457, 0.95);
        for (let k = 0; k < 12; k++) {
          const a0 = (k / 12) * Math.PI * 2, a1 = a0 + (Math.PI * 2 / 12) * 0.55;
          g.beginPath(); g.arc(0, 0, l.u(RR), a0, a1); g.strokePath();
        }
        items.push(g, ssTxt(this, x, y, '◌', l.u(11), '#ffb457').setOrigin(0.5, 0.52).setAlpha(0.95));
      } else if (d.state === 'open') {
        // tonight, still unhunted — the one ring the player can still change
        g.lineStyle(l.u(1.5), 0xffb457, 0.55); g.strokeCircle(0, 0, l.u(RR));
        items.push(fx(g));
        this.tweens.add({ targets: g, alpha: 0.35, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else {
        g.lineStyle(l.u(1.4), 0x39406b, 1); g.strokeCircle(0, 0, l.u(RR));
        items.push(g);
      }
      // the date under each ring — digits read in every language
      items.push(ssTxt(this, x, py(RY + 20), String(d.k % 100), l.u(9),
        d.state === 'lit' || d.state === 'grace' ? '#c9b676' : '#4a5480').setOrigin(0.5));
    });
    items.push(ssTxt(this, l.x(0), py(RY + 40), SS_T('stkLegend'), l.u(8.5), '#5a6390', 'italic').setOrigin(0.5));

    items.push(this.add.rectangle(l.x(0), py(340), l.u(288), Math.max(1, l.u(1)), 0xc9a84c, 0.35));

    // ---- the grace night, said plainly ----
    const gr = ssGraceLine(st);
    items.push(ssTxt(this, l.x(0), py(360), gr.text, l.u(11), gr.color).setOrigin(0.5)
      .setShadow(0, 0, gr.glow || 'rgba(0,0,0,0)', l.u(gr.glow ? 6 : 0), true, true));
    // ---- the next mark ----
    const next = SS_MILESTONES.find((m) => m > n);
    if (next) items.push(ssTxt(this, l.x(0), py(382), SS_T('stkNextMark', next), l.u(10), '#8a94c4', 'italic').setOrigin(0.5));
    else items.push(ssTxt(this, l.x(0), py(382), SS_T('stkMs100'), l.u(10), '#ffd77a', 'italic').setOrigin(0.5));

    // ---- the door the lamp used to be ----
    const played = !!SS.prof.daily[String(SSNET.dayKey())];
    const pb = this.add.image(l.x(0), py(434), ssBtn(this, false, 240, 52)).setDisplaySize(l.u(240), l.u(52)).setInteractive({ useHandCursor: true });
    const pbT = ssTxt(this, l.x(0), py(434), SS_T(played ? 'dpAgain' : 'dpPlay'), l.u(15), BTN_INK()).setOrigin(0.5);
    items.push(pb, pbT);
    pb.on('pointerover', () => pb.setScale(pb.scaleX * 1.03, pb.scaleY * 1.03));
    pb.on('pointerout', () => pb.setDisplaySize(l.u(240), l.u(52)));
    pb.on('pointerdown', () => { if (this.busy()) return; SFX.ui(); closeSheet(); this.dailySheet(); });

    c.add(items);
    // the week strip is a dozen small Texts on one screen — exactly the shape
    // that lost a bake on Wyatt's phone in v0.38.0 (see ssHealBlankTexts)
    ssHealBlankTexts(this, 'lantern-sheet');
    // entrance: the same settle-up the daily notice board uses
    const rise = items.filter((it) => !it.__fx);
    rise.forEach((it) => { it.__a = it.alpha; it.y += l.u(14); it.alpha = 0; });
    rise.forEach((it) => this.tweens.add({ targets: it, y: it.y - l.u(14), alpha: it.__a, duration: 300, ease: 'Back.easeOut' }));
  }
  // the language sheet — a parchment list of native names. Picking one rewrites
  // ?lang= and reloads: strings.js saves the choice, and every string plus the
  // baked wordmark texture re-render in the new language. Rewriting the URL
  // (rather than only saving) matters because a ?lang= already in the address
  // would out-rank the saved preference on the next load.
  langSheet() {
    if (this.busy() || this.langC || this.dailyC || this.mapC || this.confirmC || this.signC || this.streakC || this.riteC) return;
    SFX.ensure(); SFX.ui();
    const l = ssLayout(this);
    const c = this.langC = this.add.container(0, 0).setDepth(700);
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.55).setInteractive();
    veil.on('pointerdown', () => { c.destroy(); this.langC = null; });
    const keys = Object.keys(SS_STR);
    const rowH = 30, ph = keys.length * rowH + 34;
    c.add(veil);
    c.add(this.add.image(l.x(0), l.y(400), 'panel').setDisplaySize(l.u(232), l.u(ph)));
    keys.forEach((k, i) => {
      const y = 400 - ph / 2 + 32 + i * rowH;
      const cur = k === SS_LANG;
      const t = ssTxt(this, l.x(0), l.y(y), (cur ? '✦  ' : '') + (SS_LANGS[k] || k) + (cur ? '  ✦' : ''),
        l.u(15), cur ? '#8a6210' : '#4a3305').setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        SFX.ui();
        // this reload is navigation, not a fresh visit — don't replay the intro
        try { sessionStorage.setItem('beta3.skipIntro', '1'); } catch (e) { }
        const u = new URL(location.href);
        u.searchParams.set('lang', k);
        location.replace(u.toString());
      });
      c.add(t);
    });
  }
  /* ---------- the daily pre-screen ----------
     Tapping DAILY opens tonight's notice board instead of dropping straight
     into the game: today's top hunters (live from RTDB), the reset countdown
     ticking in seconds, whether you've already hunted, your completion streak,
     and one big PLAY that rides the full ascent. This is also the home of the
     daily-challenge leaderboard — everyone on it completed today's sky. (A
     separate "completed the daily" board would list the same names: the score
     list IS the completion list, and RTDB prunes past days, so the streak
     shown here is the player's own, kept in the local profile log.) */
  dailySheet() {
    if (this.busy() || this.dailyC || this.langC || this.mapC || this.confirmC || this.signC || this.streakC || this.riteC) return;
    SFX.ensure(); SFX.ui();
    const l = ssLayout(this);
    const c = this.dailyC = this.add.container(0, 0).setDepth(700);
    let tick = null;
    const closeSheet = () => {
      if (this.dailyC !== c) return;
      this.dailyC = null;
      if (tick) { tick.remove(false); tick = null; }
      c.destroy();
    };
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.72, duration: 220 });
    veil.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    c.add(veil);

    const PH = 560, top = 400 - PH / 2;
    const py = (d) => l.y(top + d);
    const items = [];
    // the window swallows its own taps so a press inside never falls through to the veil
    const win = this.add.image(l.x(0), py(PH / 2), 'endpanel').setDisplaySize(l.u(372), l.u(PH)).setInteractive();
    items.push(win);
    const xB = ssTxt(this, l.x(164), py(28), '✕', l.u(15), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xB.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    items.push(xB);

    // header: the hunt's name in gold, tonight's date, the shared-sky line
    const hk = ssGoldTex(this, '☀ ' + SS_T('daily'), 21);
    const hsc = Math.min(1, 300 / hk.w);
    items.push(this.add.image(l.x(0), py(46), hk.key).setDisplaySize(l.u(hk.w * hsc), l.u(hk.h * hsc)));
    items.push(ssTxt(this, l.x(0), py(76), SSNET.dayKeyISO() + ' · ' + SS_T('dpOneSky'), l.u(11), '#8a94c4', 'italic').setOrigin(0.5));
    const cdT = ssTxt(this, l.x(0), py(98), '', l.u(12), '#c9b676').setOrigin(0.5);
    // The countdown IS the streak's clock once a flame stands and tonight is
    // still unhunted — same seconds, but they now measure something you own.
    // Once you've hunted (or have no flame to lose) it goes back to heralding
    // the next sky.
    const tickCd = () => {
      if (!cdT.active) return;
      const cd = ssCountdownLive(SSNET.msToNextDay());
      const atRisk = ssStreakCount() >= 1 && !SS.prof.daily[String(SSNET.dayKey())];
      cdT.setText(atRisk ? '🔥 ' + SS_T('stkKeep', cd) : '☾ ' + SS_T('lbNewSky', cd));
      cdT.setColor(atRisk ? '#ffb457' : '#c9b676');
    };
    tickCd();
    tick = this.time.addEvent({ delay: 1000, loop: true, callback: tickCd });
    items.push(cdT);
    const rule = (d) => items.push(this.add.rectangle(l.x(0), py(d), l.u(316), Math.max(1, l.u(1)), 0xc9a84c, 0.35));
    rule(116);

    // your standing under today's sky
    const played = SS.prof.daily[String(SSNET.dayKey())] | 0;
    items.push(ssTxt(this, l.x(0), py(140), played ? SS_T('dpPlayed', played) : SS_T('dpAwait'),
      l.u(13.5), played ? '#f0e8d2' : '#ffe9a8').setOrigin(0.5)
      .setShadow(0, 0, played ? 'rgba(0,0,0,0.45)' : '#c9b676', l.u(played ? 2 : 8), true, true));
    // the lantern's own number, in the same words the end screen uses, and —
    // when there is anything to say — where the grace night stands. Tapping
    // either opens the lantern sheet, where the week of nights is drawn.
    const sState = ssStreakState();
    const streak = sState.n;
    if (streak >= 2) {
      items.push(ssTxt(this, l.x(0), py(158), '🔥 ' + SS_T('stkNight', streak), l.u(11), '#ffb457').setOrigin(0.5)
        .setShadow(0, 0, '#a8520d', l.u(6), true, true));
    }
    if (streak >= 1 || !sState.held) {
      const gl = ssGraceLine(sState);
      const gT = ssTxt(this, l.x(0), py(streak >= 2 ? 176 : 164), gl.text, l.u(9.5), gl.color, 'italic')
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      gT.on('pointerdown', () => { SFX.ui(); closeSheet(); this.streakSheet(); });
      items.push(gT);
    }
    rule(190);

    // today's board — live from RTDB while the sheet stands open
    items.push(ssTxt(this, l.x(0), py(206), '— ' + SS_T('dpTop') + ' —', l.u(12), '#c9b676').setOrigin(0.5));
    const loadT = ssTxt(this, l.x(0), py(300), SS_T('lbLoading'), l.u(11.5), '#5a6390', 'italic').setOrigin(0.5);
    items.push(loadT);
    SSNET.getBoard('daily', ssGameLang()).then((b) => {
      if (this.dailyC !== c || !this.scene.isActive()) return;
      loadT.destroy();
      const meId = SSNET.uid();
      const rows = [];
      if (!b.rows.length) {
        rows.push(ssTxt(this, l.x(0), py(300), SS_T('lbEmpty'), l.u(11.5), '#5a6390', 'italic').setOrigin(0.5));
      }
      b.rows.slice(0, 6).forEach((r, i) => {
        const y = py(230 + i * 34);
        const me = r.id === meId;
        if (me) rows.push(this.add.rectangle(l.x(0), y, l.u(324), l.u(28), 0xd7b45c, 0.13));
        if (i < 3) {
          rows.push(this.add.image(l.x(-146), y, ssMedalTex(this, i)).setDisplaySize(l.u(24), l.u(24)));
          rows.push(ssTxt(this, l.x(-146), y, String(i + 1), l.u(12), SS_MEDAL_INK[i]).setOrigin(0.5, 0.52));
        } else {
          rows.push(ssTxt(this, l.x(-146), y, '#' + (i + 1), l.u(11), '#8a94c4').setOrigin(0.5));
        }
        const nm = ssTxt(this, l.x(-124), y, r.name, l.u(12.5), me ? '#ffe9a8' : '#e8e0c8').setOrigin(0, 0.5)
          .setInteractive({ useHandCursor: true });
        while (nm.width > l.u(190) && nm.text.length > 2) nm.setText(nm.text.slice(0, -2) + '…');
        nm.on('pointerdown', () => ssRatingCard(this, { uid: r.id, name: r.name }));
        rows.push(nm);
        rows.push(ssTxt(this, l.x(146), y, String(r.score), l.u(13), me ? '#ffe9a8' : '#d8d2bd').setOrigin(1, 0.5));
      });
      if (b.me >= 0) {
        const mine = b.me >= 6 && b.rows[b.me]
          ? '#' + (b.me + 1) + ' · ' + b.rows[b.me].name + ' · ' + b.rows[b.me].score + '   ·   '
          : '';
        rows.push(ssTxt(this, l.x(0), py(438), mine + SS_T('lbYouRank', b.me + 1, b.total), l.u(11), '#ffd77a').setOrigin(0.5));
      }
      rows.forEach((o, i) => { o.alpha = 0; this.tweens.add({ targets: o, alpha: 1, duration: 260, delay: i * 24 }); });
      c.add(rows);
    }).catch(() => { });

    // the big door: PLAY — closes the sheet and rides the ascent
    const pb = this.add.image(l.x(0), py(492), ssBtn(this, false, 260, 58)).setDisplaySize(l.u(260), l.u(58)).setInteractive({ useHandCursor: true });
    const pbT = ssTxt(this, l.x(0), py(492), played ? SS_T('dpAgain') : SS_T('dpPlay'), l.u(17), BTN_INK()).setOrigin(0.5);
    items.push(pb, pbT);
    pb.on('pointerover', () => pb.setScale(pb.scaleX * 1.03, pb.scaleY * 1.03));
    pb.on('pointerout', () => pb.setDisplaySize(l.u(260), l.u(58)));
    pb.on('pointerdown', () => {
      if (this.busy()) return;
      SFX.ui();
      closeSheet();
      this.bloomBtn = this.dailyChipB;   // the corner chip blooms as we lift off
      this.startMode('daily');
    });

    c.add(items);
    // entrance: the notice board settles up into place like the end-run window
    items.forEach((it) => { it.y += l.u(14); it.alpha = 0; });
    this.tweens.add({ targets: items, y: '-=' + l.u(14), alpha: 1, duration: 300, ease: 'Back.easeOut' });
  }

  /* ---------- the campaign map sheet ----------
     The campaign's only door: CAMPAIGN/CONTINUE opens the star chart over the
     meadow — the whole climb laid out, the checkpoint breathing — and tapping
     the glowing constellation closes the sheet and rides the full ascent into
     that fight. Fresh campaigns enter the same way, at the first node. */
  mapSheet() {
    if (this.busy() || this.mapC || this.dailyC || this.langC || this.confirmC || this.signC) return;
    SFX.ensure(); SFX.ui();
    const l = ssLayout(this);
    const c = this.mapC = this.add.container(0, 0).setDepth(700);
    const closeSheet = () => {
      if (this.mapC !== c) return;
      this.mapC = null;
      c.destroy();
    };
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.72, duration: 220 });
    veil.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    c.add(veil);
    const ck = this.campaignCheckpoint();
    const chart = ssStarChart(this, {
      fightIdx: ck ? ck.fightIdx : 0,
      onEnter: () => {
        closeSheet();
        this.bloomBtn = this.rowBtns && this.rowBtns.campaign;
        this.startMode('campaign');
      },
    });
    const xB = ssTxt(this, l.x(170), l.y(96), '✕', l.u(15), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xB.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    chart.c.add(xB);
    c.add(chart.c);
    // entrance: the chart settles up into place like the other sheets
    chart.c.y = l.u(14); chart.c.alpha = 0;
    this.tweens.add({ targets: chart.c, y: 0, alpha: 1, duration: 300, ease: 'Back.easeOut' });
  }

  /* NEW CAMPAIGN — with a checkpoint standing, warn first (v0.47.0, Wyatt's
     words): "This will restart your current campaign in progress." BACK
     dismisses to the meadow with nothing lost; NEW wipes the checkpoint and
     runs the normal fresh-campaign flow, sign choice included. With no
     checkpoint there is nothing to lose: it is simply the door. */
  newCampaign() {
    if (this.busy() || this.mapC || this.dailyC || this.langC || this.confirmC || this.signC) return;
    const ck = this.campaignCheckpoint();
    // no checkpoint → nothing to abandon: wipe any half-made choice (a rolled
    // roster, a pinned sign never entered) and offer the stars afresh
    if (!ck) { ssClearCampaign(); this.signSheet(); return; }
    SFX.ensure(); SFX.ui();
    const l = ssLayout(this);
    const c = this.confirmC = this.add.container(0, 0).setDepth(720);
    const closeSheet = () => {
      if (this.confirmC !== c) return;
      this.confirmC = null;
      c.destroy();
    };
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.66, duration: 200 });
    veil.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    c.add(veil);
    const items = [];
    items.push(this.add.image(l.x(0), l.y(400), 'endpanel').setDisplaySize(l.u(336), l.u(272)).setInteractive());
    const tk = ssGoldTex(this, SS_T('restartTitle'), 17);
    const tsc = Math.min(1, 280 / tk.w);
    items.push(this.add.image(l.x(0), l.y(304), tk.key).setDisplaySize(l.u(tk.w * tsc), l.u(tk.h * tsc)));
    items.push(ssTextBlock(this, l.x(0), l.y(352), SS_T('restartBody'), {
      fontSize: l.u(12) + 'px', color: '#c9c3ae', fontStyle: 'italic', shadow: true,
      wrapW: l.u(280), align: 'center', ox: 0.5, oy: 0.5,
    }));
    // where the climb stands, so the player knows exactly what NEW costs
    items.push(ssTxt(this, l.x(0), l.y(388), SS_ACT_N(SS_ACTS[ck.actIdx]).split('·')[0].trim() + '  ·  ' + SS_T('fightN', ck.fightIdx % 5 + 1), l.u(10.5), '#8a94c4', 'italic').setOrigin(0.5));
    // BACK wears the gold — restarting a climb should never be the brightest
    // thing on screen
    const backB = this.add.image(l.x(0), l.y(438), ssBtn(this, false, 250, 50)).setDisplaySize(l.u(250), l.u(50)).setInteractive({ useHandCursor: true });
    const backT = ssTxt(this, l.x(0), l.y(438), SS_T('restartBack'), l.u(15), BTN_INK()).setOrigin(0.5);
    const newB = this.add.image(l.x(0), l.y(492), ssBtn(this, true, 250, 40)).setDisplaySize(l.u(250), l.u(40)).setInteractive({ useHandCursor: true });
    const newT = ssTxt(this, l.x(0), l.y(492), SS_T('restartNew'), l.u(13), '#e6a2a2').setOrigin(0.5);
    items.push(backB, backT, newB, newT);
    backB.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    newB.on('pointerdown', () => {
      SFX.ui();
      ssClearCampaign();          // the old climb is gone — the door greys
      this.refreshCampDoor();
      closeSheet();
      this.signSheet();           // the fresh climb opens under fresh stars
    });
    c.add(items);
    items.forEach((it) => { it.y += l.u(12); it.alpha = 0; });
    this.tweens.add({ targets: items, y: '-=' + l.u(12), alpha: 1, duration: 260, ease: 'Back.easeOut' });
  }

  /* The campaign's front door. A standing checkpoint (or an already-answered
     picker — sign chosen, map opened, fight not yet entered) goes straight to
     the chart; a truly fresh campaign asks the stars first. */
  campaignDoor() {
    if (!this.campaignCheckpoint()) return;   // the door is dead without a climb to continue
    this.mapSheet();
  }

  /* ---------- the zodiac picker: THE CARDS (v0.57.0, Wyatt 8/26) ----------
     Before a fresh campaign: one full-size card at a time — the sign's name
     and title, a portrait art region, its power at the card's bottom and
     the player's record under that sign — with ‹ › arrows in the margins
     and a real swipe on the card (the neighbor peeks in as you drag, a
     settle tween finishes the move; wraps at both ends). The FIRST card is
     THE OPEN SKY, the unsigned classic climb; the twelve follow in
     SS_ZODIAC order. BEGIN is always live — the card you are looking at IS
     the choice. Only three card containers ever exist (prev/cur/next),
     recycled on every move — the Canvas renderer never carries a 13-card
     stack. The art region asks ssZodArtKey() for `zod_<id>` (the MJ card
     art, ZODIAC-ART.md) and falls back to the asterism drawn large on a
     night-sky wash, so the real art drops in per sign with no relayout.
     The choice is pinned for the whole campaign (beta3.campsign) and
     cleared with it. */
  signSheet() {
    if (this.busy() || this.signC || this.mapC || this.dailyC || this.langC || this.confirmC) return;
    SFX.ensure(); SFX.ui();
    const l = ssLayout(this);
    const c = this.signC = this.add.container(0, 0).setDepth(700);
    const closeSheet = () => {
      if (this.signC !== c) return;
      this.signC = null;
      c.destroy();
    };
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.72, duration: 220 });
    veil.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    c.add(veil);

    const items = [];
    const win = this.add.image(l.x(0), l.y(400), 'endpanel').setDisplaySize(l.u(384), l.u(664)).setInteractive();
    items.push(win);
    const xB = ssTxt(this, l.x(170), l.y(96), '✕', l.u(15), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xB.on('pointerdown', () => { SFX.ui(); closeSheet(); });
    items.push(xB);
    const hk = ssGoldTex(this, SS_T('zpTitle'), 20);
    const hsc = Math.min(1, 300 / hk.w);
    items.push(this.add.image(l.x(0), l.y(106), hk.key).setDisplaySize(l.u(hk.w * hsc), l.u(hk.h * hsc)));
    items.push(ssTxt(this, l.x(0), l.y(132), SS_T('zpSub'), l.u(10.5), '#8a94c4', 'italic').setOrigin(0.5));

    /* the deck: THE OPEN SKY first, then the twelve. Each entry is what a
       card needs — id, name, title, desc, tint, and the sign (null = open) */
    const deck = [{ id: 'none', z: null, name: SS_T('zpOpenName'), title: SS_T('zpOpenTitle'), desc: SS_T('zpOpenDesc'), tint: 0xb9c2e6 }]
      .concat(SS_ZODIAC.map((z) => { const t = SS_ZOD(z); return { id: z.id, z, name: z.name, title: t.title, desc: t.desc, tint: SS_ELEMENTS[z.el] }; }));
    const N = deck.length;
    // geometry (design units): the card, its stride, and the window the
    // deck shows through — the margins either side belong to the arrows
    const CW = 272, CH = 424, CY = 362, STRIDE = 300, ART_W = 160, ART_H = 240;
    const hex = (n) => '#' + ('000000' + n.toString(16)).slice(-6);

    const mkCard = (i) => {
      const d = deck[((i % N) + N) % N];
      const k = this.add.container(0, 0);
      const tint = d.tint;
      // the card's face: a dark pane with the element's rim
      const g = this.add.graphics();
      g.fillStyle(0x0a0e1f, 0.78);
      g.fillRoundedRect(-l.u(CW / 2), -l.u(CH / 2), l.u(CW), l.u(CH), l.u(14));
      g.lineStyle(l.u(1.4), tint, 0.7);
      g.strokeRoundedRect(-l.u(CW / 2), -l.u(CH / 2), l.u(CW), l.u(CH), l.u(14));
      g.lineStyle(l.u(0.7), tint, 0.28);
      g.strokeRoundedRect(-l.u(CW / 2 - 4), -l.u(CH / 2 - 4), l.u(CW - 8), l.u(CH - 8), l.u(11));
      k.add(g);
      // name + title
      k.add(ssTxt(this, 0, -l.u(CH / 2 - 26), d.name, l.u(19), hex(tint)).setOrigin(0.5)
        .setShadow(0, 0, hex(tint), l.u(8), true, true));
      k.add(ssTxt(this, 0, -l.u(CH / 2 - 47), d.title, l.u(10.5), '#c9c3ae', 'italic').setOrigin(0.5));
      // the art region: 2:3 portrait. The real card art when it is loaded,
      // else the sign's own stars drawn large over a night-sky wash
      const ay = -l.u(CH / 2 - 62 - ART_H / 2);
      const artKey = ssZodArtKey(this, d.id);
      if (artKey) {
        k.add(this.add.image(0, ay, artKey).setDisplaySize(l.u(ART_W), l.u(ART_H)));
      } else {
        k.add(this.add.image(0, ay, ssZodSkyTex(this)).setDisplaySize(l.u(ART_W), l.u(ART_H)));
        if (d.z) {
          k.add(this.add.image(0, ay, 'glowbig').setDisplaySize(l.u(ART_W * 1.2), l.u(ART_H * 0.8)).setTint(tint).setBlendMode('ADD').setAlpha(0.16));
          k.add(ssZodiacGlyph(this, d.z, l.u(0.6), 0, ay));
        }
      }
      const af = this.add.graphics();
      af.lineStyle(l.u(0.9), tint, 0.45);
      af.strokeRoundedRect(-l.u(ART_W / 2), ay - l.u(ART_H / 2), l.u(ART_W), l.u(ART_H), l.u(6));
      k.add(af);
      // the power, at the card's bottom — one Text per line (ssTextBlock)
      const desc = ssTextBlock(this, 0, l.u(CH / 2 - 92), d.desc, {
        fontSize: l.u(11) + 'px', color: '#e6dfc8', fontStyle: 'italic', shadow: true,
        wrapW: l.u(CW - 36), align: 'center', ox: 0.5, oy: 0,
      });
      desc.setData('zodDesc', d.id);
      k.add(desc);
      // the record under this sign, styled in
      const sr = d.z ? SS.prof.signs[d.id] : null;
      if (sr && sr.clears > 0) {
        k.add(ssTxt(this, 0, l.u(CH / 2 - 18), '★ ' + SS_T('zpRec', sr.clears, sr.best), l.u(9.5), '#d7b45c').setOrigin(0.5));
      }
      k.setData('zodCard', d.id);
      return k;
    };

    /* the deck's window: three live cards ride a strip that the finger drags;
       a geometry mask keeps neighbors to a peek at the card's edges */
    const strip = this.add.container(l.x(0), l.y(CY));
    const mg = this.make.graphics();
    mg.fillRect(l.x(-(CW / 2 + 8)), l.y(CY - CH / 2 - 6), l.u(CW + 16), l.u(CH + 12));
    strip.setMask(mg.createGeometryMask());
    let cur = 0, moving = false;
    const cards = { prev: null, cur: null, next: null };
    const place = () => {
      cards.prev.x = -l.u(STRIDE); cards.cur.x = 0; cards.next.x = l.u(STRIDE);
      cards.prev.setVisible(false); cards.next.setVisible(false); cards.cur.setVisible(true);
    };
    const build = () => {
      for (const key of ['prev', 'cur', 'next']) if (cards[key]) cards[key].destroy();
      cards.prev = mkCard(cur - 1); cards.cur = mkCard(cur); cards.next = mkCard(cur + 1);
      strip.add([cards.prev, cards.cur, cards.next]);
      strip.x = l.x(0);
      place();
    };
    build();
    const counter = ssTxt(this, l.x(0), l.y(CY + CH / 2 + 14), '', l.u(9), '#5a6390').setOrigin(0.5);
    const setCounter = () => counter.setText((cur + 1) + ' / ' + N);
    setCounter();
    items.push(counter);

    // a move: the strip slides one stride (settle tween), then the three
    // cards are recycled around the new index and the strip snaps home
    const go = (dir, fromX) => {
      if (moving) return;
      moving = true;
      cards.prev.setVisible(true); cards.next.setVisible(true);
      if (fromX != null) strip.x = fromX;
      this.tweens.add({
        targets: strip, x: l.x(0) - dir * l.u(STRIDE), duration: 240, ease: 'Cubic.easeOut',
        onComplete: () => {
          if (this.signC !== c) return;
          cur = ((cur + dir) % N + N) % N;
          build(); setCounter();
          moving = false;
        },
      });
    };
    const settle = () => {
      if (moving) return;
      moving = true;
      this.tweens.add({ targets: strip, x: l.x(0), duration: 200, ease: 'Cubic.easeOut', onComplete: () => { if (this.signC === c) { place(); moving = false; } } });
    };
    // the harness seams: which card stands, and a programmatic move
    this.signGo = (dir) => go(dir);
    this.signPeek = () => ({ id: deck[cur].id, cur, n: N, moving, x: strip.x - l.x(0), card: cards.cur });

    // the arrows, in the margins the card leaves free (44-pt law via ssHitPad)
    const mkArrow = (dx, glyph, dir) => {
      const a = ssTxt(this, l.x(dx), l.y(CY), glyph, l.u(30), '#d7b45c').setOrigin(0.5)
        .setShadow(0, 0, '#c9a94f', l.u(8), true, true).setInteractive({ useHandCursor: true });
      ssHitPad(a, 48);
      a.on('pointerdown', () => { if (moving) return; SFX.ui(); go(dir); });
      return a;
    };
    const arrowL = mkArrow(-168, '‹', -1), arrowR = mkArrow(168, '›', 1);
    items.push(arrowL, arrowR);

    // the swipe: a real drag anywhere on the card. Past a third of the card
    // (or a quick flick) it commits to the neighbor; short of that it settles
    const zone = this.add.zone(l.x(0), l.y(CY), l.u(CW + 16), l.u(CH + 12)).setOrigin(0.5).setInteractive({ useHandCursor: true });
    let drag = null;
    zone.on('pointerdown', (p) => { if (moving) return; drag = { x: p.x, t: performance.now() }; cards.prev.setVisible(true); cards.next.setVisible(true); });
    const mv = (p) => {
      if (!drag) return;
      if (!p.isDown) { drag = null; settle(); return; }
      strip.x = l.x(0) + clamp(p.x - drag.x, -l.u(STRIDE), l.u(STRIDE));
    };
    const up = (p) => {
      if (!drag) return;
      const dx = p.x - drag.x, dt = Math.max(1, performance.now() - drag.t);
      drag = null;
      const flick = Math.abs(dx) > l.u(18) && Math.abs(dx) / dt > 0.45;
      if (Math.abs(dx) > l.u(CW / 3) || flick) { SFX.ui(); go(dx < 0 ? 1 : -1, strip.x); }
      else settle();
    };
    this.input.on('pointermove', mv);
    this.input.on('pointerup', up);
    c.once('destroy', () => { this.input.off('pointermove', mv); this.input.off('pointerup', up); mg.destroy(); this.signGo = null; this.signPeek = null; });

    // BEGIN — always live: the visible card is the choice
    const enter = (id) => {
      // pin the choice and open the chart — the map is the campaign's own door
      try { localStorage.setItem('beta3.campsign', id); } catch (e) { }
      closeSheet();
      this.mapSheet();
    };
    const beginB = this.add.image(l.x(0), l.y(650), ssBtn(this, false, 260, 50)).setDisplaySize(l.u(260), l.u(50))
      .setInteractive({ useHandCursor: true });
    const beginT = ssTxt(this, l.x(0), l.y(650), SS_T('zpBegin'), l.u(15), BTN_INK()).setOrigin(0.5);
    beginB.on('pointerover', () => beginB.setScale(beginB.scaleX * 1.03, beginB.scaleY * 1.03));
    beginB.on('pointerout', () => beginB.setDisplaySize(l.u(260), l.u(50)));
    beginB.on('pointerdown', () => { if (moving) return; SFX.ui(); enter(deck[cur].id); });
    items.push(beginB, beginT);

    c.add(items);
    c.add(strip);
    c.add(zone);
    // entrance: the sky of signs settles up into place like the other sheets.
    // Zones are pure hit areas (no alpha component) — they stay where they are.
    for (const it of items.concat([strip])) {
      if (it.type === 'Zone') continue;
      const baseA = it.alpha;
      it.y += l.u(14); it.alpha = 0;
      this.tweens.add({ targets: it, y: it.y - l.u(14), alpha: baseA, duration: 300, ease: 'Back.easeOut' });
    }
  }

  /* the standing checkpoint, or null. A checkpoint from an older build is
     welcome as long as it knows which fight it stands on; an act index it
     lacks (or one past the roster) is re-derived from the fight, so the
     door never throws on a save it did not write. */
  campaignCheckpoint() {
    let ck = null;
    try { ck = JSON.parse(localStorage.getItem('beta3.campaign')); } catch (e) { return null; }
    if (!ck || typeof ck !== 'object' || typeof ck.fightIdx !== 'number' || !(ck.fightIdx >= 0)) return null;
    if (!SS_ACTS[ck.actIdx]) ck.actIdx = Math.min(SS_ACTS.length - 1, Math.floor(ck.fightIdx / 5));
    return ck;
  }
  busy() { return this.ascending || this.descending || this.introPlaying || SS_RITE.busy; }
  startMode(mode) {
    if (this.busy()) return;
    SFX.ui();
    const resume = mode === 'campaign' ? this.campaignCheckpoint() : null;
    this.beginAscent({ mode, resume, ascended: true });
  }

  /* ---------- the rise (SKY-DESIGN §5) ---------- */
  beginAscent(data) {
    this.ascending = true;
    PENDING_ASCENT = data;
    DIAG('ascent begin (' + data.mode + ')');
    try {
      const l = ssLayout(this);
      SFX.crickets(false); SFX.birds(false); SFX.riser();
      this.sky.scatterFlies();
      for (const o of this.uiItems) this.tweens.killTweensOf(o);
      // BUGFIX: this tweened `scale`, whose setter writes BOTH axes — a setDisplaySize'd
      // button (scaleX ~1.17, scaleY ~0.60) had its height snapped to the scaleX value, so
      // the pressed button doubled in height for 130ms and never came back. Drive the axes
      // separately. (Same trap as the Runefall note: never tween `scale` on these.)
      if (this.bloomBtn) {
        const b = this.bloomBtn;
        this.tweens.add({
          targets: b, duration: 130, yoyo: true,
          scaleX: { from: b.scaleX, to: b.scaleX * 1.08 },
          scaleY: { from: b.scaleY, to: b.scaleY * 1.08 },
        });
      }
      this.tweens.add({ targets: this.uiItems, alpha: 0, duration: 300 });
      this.dissolveTitle();
      if (ssReduceMotion()) {
        DIAG('ascent: reduce-motion is ON → veil crossfade instead of the rise');
        // kept on this.ascVeil: if the scene sleeps and later wakes, the wake
        // path lands under this veil instead of gliding (respects the setting)
        const veil = this.ascVeil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setAlpha(0).setDepth(600);
        this.tweens.add({ targets: veil, alpha: 1, duration: 200, onComplete: () => this.arrive() });
        return;
      }
      this.sky.grain.setVisible(false);   // full-screen blended fill — not during the flight
      PERF.start('ascent', this);
      this.ascentStart = this.time.now;
      this.skipAt = null; this.lastP = 0; this.lastT = this.time.now;
      // arm the tap-to-skip only after the launching tap has fully cleared —
      // Phaser delivers the button's own pointerdown to scene listeners added
      // during dispatch, so arming immediately made every real tap self-skip
      this.time.delayedCall(400, () => {
        if (!this.ascending || this.arrived) return;
        this.input.on('pointerdown', this.skipFn = () => { if (this.ascending && !this.skipAt) this.skipAt = ASC.TOTAL_MS - 220; });
      });
      if (DEMO) this.skipAt = ASC.TOTAL_MS - 220;   // the solver has no time for wonder
    } catch (e) {
      this.fallbackToBattle(e);                      // the rise must never strand the player
    }
  }
  // the title doesn't just fade — it comes apart into stardust as the
  // world starts to fall away (SKY-DESIGN P3)
  dissolveTitle() {
    if (ssReduceMotion()) return;
    this.time.delayedCall(340, () => {
      if (!this.ascending || this.arrived || !this.titleT) return;
      const b = this.titleT.getBounds();
      const em = this.add.particles(0, 0, 'dot', {
        speed: { min: 8, max: 60 }, lifespan: { min: 700, max: 1500 }, gravityY: -30,
        scale: { start: 0.55, end: 0 }, alpha: { start: 0.9, end: 0 },
        blendMode: 'ADD', tint: [0xf3e5b4, 0xffe9c9, 0xcfd8ff], emitting: false,
      }).setDepth(60);
      for (let k = 0; k < 46; k++) em.emitParticleAt(b.x + Math.random() * b.width, b.y + b.height * 0.15 + Math.random() * b.height * 0.7);
      this.time.delayedCall(1700, () => em.destroy());
    });
  }
  fallbackToBattle(e) {
    DIAG('ascent FALLBACK: ' + (e && e.message || '?'));
    const data = PENDING_ASCENT || { mode: 'quick', resume: null };
    PENDING_ASCENT = null;
    this.arrived = true;
    this.scene.start('battle', data);
  }
  update(time) {
    if (!this.ascending || this.arrived || !this.ascentStart) return;
    try {
      let ms = time - this.ascentStart;
      if (this.skipAt && ms < this.skipAt) { this.ascentStart = time - this.skipAt; ms = this.skipAt; }
      if (ms >= ASC.TOTAL_MS) { this.arrive(); return; }
      const p = ssAscentP(ms);
      const vel = Math.max(0, (p - this.lastP) / Math.max(1, time - this.lastT));
      this.sky.setP(p, vel);
      this.lastP = p; this.lastT = time;
    } catch (e) {
      this.fallbackToBattle();
    }
  }
  arrive() {
    if (this.arrived) return;
    this.arrived = true;
    PERF.stop();
    DIAG('ascent arrive' + (this.skipAt ? ' (skipped)' : ''));
    if (this.skipFn) this.input.off('pointerdown', this.skipFn);
    SFX.arriveChime();                              // the hush, then the forge voice
    const data = PENDING_ASCENT; PENDING_ASCENT = null;
    try {
      this.sky.setP(1, 0);
      localStorage.setItem('beta3.ascent', JSON.stringify({ v: BUILD, skipped: !!this.skipAt, t: Date.now() }));
      // sleep (don't stop): the meadow keeps its 300+ objects alive so the trip
      // home is a wake + camera glide instead of a full re-create — the create
      // ran 200-370ms on a throttled phone profile, a visible freeze exactly at
      // the "leave battle" moment. Dawn returns still restart the scene (other
      // sky); rotation is caught on wake by the layout check there.
      this.scene.transition({ target: 'battle', duration: 450, data, moveAbove: true, sleep: true });
      // the handoff frame runs Battle.create — probe it (auto-stops)
      PERF.start('arrive', this, 30);
    } catch (e) {
      this.scene.start('battle', data);
    }
  }

  /* ---------- the way back down ---------- */
  descendHome() {
    this.descending = true;
    PERF.start('descend' + (this.isDawn ? '-dawn' : ''), this);
    this.sky.grain.setVisible(false);
    this.sky.setP(1, 0);
    SFX.descendSweep();
    this.tweens.addCounter({
      from: 1, to: 0, duration: ASC.DESCEND_MS, ease: 'Cubic.easeInOut',
      onUpdate: (tw) => this.sky.setP(tw.getValue(), 0),
      onComplete: () => { this.descending = false; PERF.stop(); this.sky.grain.setVisible(true); this.sky.setP(0, 0); if (this.isDawn) SFX.birds(true); else SFX.crickets(true); },
    });
  }
  /* the woken meadow: everything still exists, so returning is bookkeeping —
     restore what the ascent faded/killed, refresh what battle changed, glide */
  onWake(data) {
    // rotated while asleep: the viewport loop only restarts ACTIVE scenes, so
    // a stale layout lands here — rebuild rather than glide a broken frame
    if (this.scale.width !== this.createdW || this.scale.height !== this.createdH) { this.scene.restart(data); return; }
    // the dawn meadow is a once-per-campaign-win moment: if the sleeping scene
    // and the return disagree about it, rebuild with the sky the return wants
    // (matches the old create-path behavior — dusk again on the next descent)
    if (this.isDawn !== !!data.dawn) { this.scene.restart(data); return; }
    this.ascending = false; this.arrived = false; this.ascentStart = null;
    // the outgoing transition disabled this scene's input for the crossfade;
    // a stopped scene would re-enable it in create, a slept one must here
    this.input.enabled = true;
    for (const o of this.uiItems) { this.tweens.killTweensOf(o); o.setAlpha(o.baseAlpha); }
    this.idleTweens();
    this.sky.restoreFlies();
    this.refreshCampDoor(true);  // battle moved (or cleared) the campaign checkpoint
    this.updateDailyChip();
    this.milestoneCheck();       // the hunt we just came home from may have grown the lamp
    this.sigilNotice();
    if (this.refreshRatingPill) this.refreshRatingPill();   // the battle may have moved the number
    const l = ssLayout(this);
    if (this.ascVeil) {          // reduce-motion rise → reduce-motion return
      this.sky.setP(0, 0);
      this.sky.grain.setVisible(true);
      const veil = this.ascVeil; this.ascVeil = null;
      this.tweens.add({ targets: veil, alpha: 0, duration: 350, onComplete: () => veil.destroy() });
      SFX.crickets(true);
    } else if (data.from === 'battle') this.descendHome();
    else {                       // defeat: wake up on the grass under a lifting veil
      this.sky.setP(0, 0);
      this.sky.grain.setVisible(true);
      const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setDepth(600);
      this.tweens.add({ targets: veil, alpha: 0, duration: 350, onComplete: () => veil.destroy() });
      SFX.crickets(true);
    }
  }
}

/* ============================================================
   BATTLE — one scene, three modes
   ============================================================ */
class Battle extends Phaser.Scene {
  constructor() { super('battle'); }
  init(data) { this.mode = data.mode || 'quick'; this.resume = data.resume || null; this.ascended = !!data.ascended; }

  create() {
    const tCr = performance.now();
    const l = this.L = ssLayout(this);
    ssMakeTextures(this);
    // solo always fights in the player's own tongue (a versus battle may have
    // left the globals on the room's pack — flip them back)
    ssUsePack(ssGameLang());
    if (this.ascended) {   // arriving from the rise: fade in over the zenith — bg matches, no pop
      this.cameras.main.setAlpha(0);
      this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 420, ease: 'Sine.easeOut' });
    }
    ssStarfield(this, 110);
    ssShootingStars(this);
    const tSky = performance.now();
    for (const [tint, dx, dy] of [[0x2fe0d0, -140, 140], [0x8a5ae0, 140, 620]]) {
      const a = this.add.image(l.x(dx), l.y(dy), 'glowbig').setScale(l.u(2.2)).setTint(tint).setAlpha(0.04).setBlendMode('ADD');
      this.tweens.add({ targets: a, x: a.x + l.u(24), scale: l.u(2.6), duration: 8000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ---- build the fight list ----
    // daily: same-language hunters share one seeded sky; the pack salt keeps
    // a language switch from replaying today's English board with new letters
    if (this.mode === 'daily') setSeed(SSNET.dayKey() ^ ssPackSeed(PACK.lang));
    else setSeed(Math.floor(Math.random() * 1e9));
    this.fights = [];
    if (this.mode === 'campaign') {
      this.fights = SS_CAMPAIGN_FIGHTS(ssCampaignRoster());
    } else {
      const pool = [...SS_QUICK_POOL];
      for (let i = 0; i < 4; i++) this.fights.push({ id: pool.splice(Math.floor(rng() * pool.length), 1)[0], actIdx: 0, mult: 1 + i * 0.12, atkAdd: Math.floor(i / 2), umbral: false });
      this.fights.push({ id: SS_QUICK_BOSS, actIdx: 0, mult: 1, atkAdd: 0, umbral: false });
    }

    // ---- run state ----
    this.run = this.resume ? {
      fightIdx: this.resume.fightIdx, hpMax: this.resume.hpMax, hp: this.resume.hp,
      sigils: this.resume.sigils || [], words: this.resume.words | 0, longest: this.resume.longest || '',
      totalDmg: this.resume.totalDmg | 0, scried: !!this.resume.scried, featherUsed: !!this.resume.featherUsed,
      letters: this.resume.letters | 0, bigHit: this.resume.bigHit | 0, playMs: this.resume.playMs | 0,
      overkill: this.resume.overkill | 0,
    } : { fightIdx: 0, hpMax: 50, hp: 50, sigils: [], words: 0, longest: '', totalDmg: 0, scried: false, featherUsed: false, letters: 0, bigHit: 0, playMs: 0, overkill: 0 };
    this.run.startAt = Date.now();
    this.run.firstUsed = false;
    // the birth sign — campaign only, pinned for the whole climb. TAURUS's
    // endurance lands once at the run's start and rides the checkpoint's hpMax.
    this.sign = this.mode === 'campaign' ? ssCampSign() : null;
    this.signZ = this.sign ? SS_ZODIAC_BY[this.sign] : null;
    if (this.sign === 'taurus' && !this.resume) { this.run.hpMax += 15; this.run.hp = this.run.hpMax; }
    this.state = 'boot';
    this.board = []; this.sel = []; this.lineTiles = [];
    SS.prof.runs++; SS.save();

    const tState = performance.now();
    this.buildUi();
    const tUi = performance.now();
    this.startFight();
    const tEnd = performance.now();
    DIAG('battle create ' + Math.round(tEnd - tCr) + 'ms (sky ' + Math.round(tSky - tCr) +
      ' · state ' + Math.round(tState - tSky) + ' · ui ' + Math.round(tUi - tState) + ' · fight ' + Math.round(tEnd - tUi) + ')');

    if (DEMO) this.demoTimer = this.time.addEvent({ delay: 1400, loop: true, callback: () => this.demoStep() });
    this.input.on('pointerdown', () => SFX.ensure());
    this.game.events.on('ss-ach', this.onAch, this);
    this.events.once('shutdown', () => this.game.events.off('ss-ach', this.onAch, this));
  }
  onAch(def) { ssAchToast(this, def); }

  // Wake the sleeping meadow instead of re-creating it — the descent must
  // start on the very next frame. The dawn return (campaign win) needs the
  // other sky so it takes the full re-create, and so does a home that a
  // mid-ascent resize restart already stopped.
  goHome(data) {
    const h = this.scene.get('home');
    if (!data.dawn && h && h.sys.isSleeping()) { this.scene.wake('home', data); this.scene.stop(); }
    else this.scene.start('home', data);
  }

  // ---------- ui ----------
  buildUi() {
    const l = this.L;
    const txt = (x, y, s, size, color, style) => ssTxt(this, x, y, s, l.u(size), color, style);

    this.headT = txt(l.x(0), l.y(24), this.modeTitle(), 13, '#c9b676').setOrigin(0.5).setAlpha(0.9);
    this.pips = [];
    const nP = this.mode === 'campaign' ? 5 : this.fights.length;
    for (let i = 0; i < nP; i++) this.pips.push(this.add.image(l.x(-40 + i * 20), l.y(46), 'dot').setScale(0.6).setTint(0x4a5480));
    this.scoreT = txt(l.x(190), l.y(24), '0', 15).setOrigin(1, 0.5);

    // the birth sign keeps watch beside the score. Tapping it speaks the
    // power — except VIRGO, whose tap IS the power (arm purify, tap a tile).
    if (this.signZ) {
      this.signGlow = this.add.image(l.x(172), l.y(48), 'glowbig').setDisplaySize(l.u(64), l.u(50))
        .setTint(SS_ELEMENTS[this.signZ.el]).setAlpha(0).setBlendMode('ADD');
      this.signG = ssZodiacGlyph(this, this.signZ, l.u(0.14), l.x(172), l.y(48));
      const zn = this.add.zone(l.x(172), l.y(48), l.u(52), l.u(42)).setOrigin(0.5).setInteractive({ useHandCursor: true });
      zn.on('pointerdown', () => this.signTap());
      this.updateSignGlow();
    }

    txt(l.x(-190), l.y(68), 'YOU', 12, '#c9b676').setOrigin(0, 0.5);
    // framed troughs + gradient fills; progress is a setCrop in updateBars
    this.add.image(l.x(-152), l.y(68), 'bartrough').setOrigin(0, 0.5).setDisplaySize(l.u(254), l.u(15));
    this.hpBar = this.add.image(l.x(-150), l.y(68), 'barfill-gold').setOrigin(0, 0.5).setDisplaySize(l.u(250), l.u(9));
    this.hpT = txt(l.x(190), l.y(68), '', 12).setOrigin(1, 0.5);

    this.beastC = this.add.container(l.x(0), l.y(170));
    this.beastNameI = null;   // gold nameplate image, built per beast in setBeastName
    this.beastTitle = txt(l.x(0), l.y(301), '', 10, '#8a94c4').setOrigin(0.5).setLetterSpacing(l.u(2));
    // trough + fill + numbers live in one container so a heavy hit can shake
    // the whole bar as a unit
    this.ehpC = this.add.container(0, 0);
    const eTrough = this.add.image(l.x(-112), l.y(322), 'bartrough').setOrigin(0, 0.5).setDisplaySize(l.u(224), l.u(13));
    this.ehpBar = this.add.image(l.x(-110), l.y(322), 'barfill-rose').setOrigin(0, 0.5).setDisplaySize(l.u(220), l.u(8));
    // numeric HP on the bar itself — players plan lethal ("15 left, build 15+")
    this.ehpT = txt(l.x(0), l.y(321), '', 11, '#ffe9e0')
      .setOrigin(0.5).setShadow(0, l.u(1), 'rgba(16,4,12,0.95)', l.u(2.5));
    this._ehpStr = null;   // scene restarts reuse this instance — never let a stale cache mute the fresh text
    this.ehpC.add([eTrough, this.ehpBar, this.ehpT]);
    this.strikeRib = this.add.image(l.x(0), l.y(342), 'ribbon').setAlpha(0);
    this.strikeT = txt(l.x(0), l.y(342), '', 12, '#e6a2a2').setOrigin(0.5);

    this.lineC = this.add.container(l.x(0), l.y(372));
    this.lineHint = txt(l.x(0), l.y(372), 'tap letters to weave a word', 12, '#5a6390').setOrigin(0.5).setAlpha(0.9);

    this.boardC = this.add.container(0, 0);
    this.tileSize = l.u(78); this.tileGap = l.u(8);
    this.slotPos = (i) => ({
      x: l.x(0) + ((i % 4) - 1.5) * (this.tileSize + this.tileGap),
      y: l.y(556) + (Math.floor(i / 4) - 1.5) * (this.tileSize + this.tileGap),
    });

    this.castB = this.add.image(l.x(70), l.y(754), ssBtn(this, false, 180, 56)).setDisplaySize(l.u(180), l.u(56)).setInteractive({ useHandCursor: true });
    this.castT = txt(l.x(70), l.y(754), 'CAST', 20, BTN_INK()).setOrigin(0.5)
      .setShadow(0, l.u(1), ART && SSART.ready ? '#2a1c05' : '#ffe9b0', l.u(1));
    this.castB.on('pointerdown', () => this.tryCast());
    // scry + hint wear the painted dark button (aspect-correct via ssBtn), same
    // as the home screen's LEADERBOARD/PROFILE — no more bare dev rectangles
    this.scryB = this.add.image(l.x(-150), l.y(754), ssBtn(this, true, 100, 50)).setDisplaySize(l.u(100), l.u(50)).setInteractive({ useHandCursor: true });
    txt(l.x(-150), l.y(754), 'SCRY ↻', 14, '#9fb0e8').setOrigin(0.5);
    this.scryB.on('pointerdown', () => this.scry());
    this.hintB = this.add.image(l.x(-62), l.y(754), ssBtn(this, true, 50, 50)).setDisplaySize(l.u(50), l.u(50)).setInteractive({ useHandCursor: true }).setVisible(false);
    this.hintT = txt(l.x(-62), l.y(754), '◉', 18, '#d7b45c').setOrigin(0.5).setVisible(false);
    this.hintB.on('pointerdown', () => this.useHint());

    this.homeB = txt(l.x(-195), l.y(24), '‹', 22, '#5a6390').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    this.homeB.on('pointerdown', () => { SFX.ui(); this.goHome({ from: 'battle' }); });
    this.muteB = txt(l.x(-195), l.y(784), SFX.muted ? '🔇' : '🔊', 14).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7);
    this.muteB.on('pointerdown', () => { SFX.ensure(); SFX.setMuted(!SFX.muted); this.muteB.setText(SFX.muted ? '🔇' : '🔊'); });
    // version stamp lives beside the mute icon — right-aligned it collided with
    // the widened painted CAST button
    txt(l.x(-172), l.y(784), BUILD, 9, '#39406b').setOrigin(0, 0.5);
    // flying damage numbers mint one texture per distinct value; drop them when
    // the battle ends so a long session doesn't hoard canvases
    this.events.once('shutdown', () => {
      for (const k of this.textures.getTextureKeys()) if (k.indexOf('gold@') === 0) this.textures.remove(k);
    });

    this.fxC = this.add.container(0, 0).setDepth(50);
    this.starBurst = this.add.particles(0, 0, 'dot', {
      speed: { min: 60, max: 320 }, lifespan: { min: 300, max: 800 }, scale: { start: 0.9, end: 0 },
      blendMode: 'ADD', emitting: false,
    }).setDepth(60);
    this.goldRain = this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: this.scale.width }, y: -20,
      speedY: { min: 120, max: 260 }, speedX: { min: -30, max: 30 },
      lifespan: 2200, scale: { start: 0.7, end: 0.1 }, quantity: 2,
      tint: [0xffd77a, 0xfff2c9, 0xd7b45c], blendMode: 'ADD', emitting: false,
    }).setDepth(55);
    this.overlayC = this.add.container(0, 0).setDepth(100);

    // ---- the sigil dock ----
    // Held sigils keep watch on the right edge, below the birth sign — the
    // beast's authoring box never reaches past x ±115, so the column is clear.
    // Tapping it opens the inspector window; the run resumes untouched when
    // the window closes (strikes are cast-counted, so reading costs nothing).
    this.dockC = this.add.container(0, 0).setDepth(40);
    this.refreshDock();
  }

  // Rebuilds the compact dock from run.sigils; newIdx blooms the arrival.
  // Six icons show, then the tail folds into a +N — the window lists them all.
  refreshDock(newIdx) {
    const l = this.L;
    this.dockC.removeAll(true);
    const ids = this.run.sigils;
    if (!ids.length) return;
    const X = 187, TOP = 100, STEP = 30;
    const slots = ids.length <= 6 ? ids.length : 6;
    const shown = ids.length <= 6 ? ids : ids.slice(0, 5);
    const pillH = slots * STEP + 6;
    this.dockC.add(this.add.image(l.x(X), l.y(TOP + pillH / 2), ssDockTex(this, pillH))
      .setDisplaySize(l.u(34), l.u(pillH)));
    shown.forEach((id, k) => {
      const sg = SS_SIGILS.find((s) => s.id === id);
      if (!sg) return;
      const RC = SS_RARITY[sg.rarity | 0];
      const t = ssTxt(this, l.x(X), l.y(TOP + 18 + k * STEP), sg.icon, l.u(15), RC.ink).setOrigin(0.5)
        .setShadow(0, 0, RC.shadow, l.u(4), true, true);
      this.dockC.add(t);
      if (newIdx === k) {         // the newest sigil lands with a small bloom
        const b = this.add.image(t.x, t.y, 'glowbig').setDisplaySize(l.u(70), l.u(54))
          .setTint(RC.glow).setAlpha(0.5).setBlendMode('ADD');
        this.dockC.add(b);
        this.tweens.add({ targets: b, alpha: 0, duration: 900, ease: 'Sine.easeOut', onComplete: () => b.destroy() });
        t.setScale(1.7);
        this.tweens.add({ targets: t, scale: 1, duration: 380, ease: 'Back.easeOut' });
      }
    });
    if (ids.length > 6) this.dockC.add(ssTxt(this, l.x(X), l.y(TOP + 18 + 5 * STEP), '+' + (ids.length - 5), l.u(12), '#c9b676').setOrigin(0.5));
    const zone = this.add.zone(l.x(X), l.y(TOP + pillH / 2), l.u(46), Math.max(l.u(pillH + 18), l.u(48)))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.openInspect());
    this.dockC.add(zone);
  }

  // The inspector: freeze the fight (every action gates on state 'pick' and
  // strikes are cast-counted, so nothing can punish the reader), then raise
  // the window. Closing hands the turn straight back.
  openInspect() {
    if (this.state !== 'pick' || this.inspectP) return;
    if (!this.run.sigils.length && !this.signZ) return;
    this.state = 'inspect';
    this.dockC.setVisible(false);          // the compact form yields to the window
    this.inspectP = ssSigilPanel(this, {
      sigils: this.run.sigils, sign: this.signZ, sleeping: true,
      onClose: () => {
        this.inspectP = null;
        this.dockC.setVisible(true);
        if (this.state === 'inspect') this.state = 'pick';
      },
    });
  }
  modeTitle() {
    if (this.mode === 'campaign') return SS_ACT_N(SS_ACTS[this.fights[this.run.fightIdx].actIdx]);
    if (this.mode === 'daily') return '☀ DAILY HUNT · ' + SSNET.dayKeyISO();
    return 'QUICK PLAY';
  }

  // ---------- board ----------
  boardVowels() { return this.board.filter((s) => s && VOWELS.includes(s.ch[0])).length; }
  fillBoard(initial) {
    for (let i = 0; i < 16; i++) {
      if (this.board[i]) continue;
      let ch = rpick(BAG);
      if (this.boardVowels() < 5 && !VOWELS.includes(ch)) ch = rpick(['a', 'e', 'i', 'o', 'u']);
      ch = PACK.digraph[ch] || ch;
      let tier = this.pendingTier || 0;
      this.pendingTier = 0;
      this.spawnTile(i, ch, tier, initial);
    }
  }
  spawnTile(i, ch, tier, initial) {
    const l = this.L, p = this.slotPos(i);
    const c = this.add.container(p.x, p.y - (initial ? l.u(500) + i * l.u(14) : l.u(420)));
    const img = this.add.image(0, 0, 'tile' + tier).setDisplaySize(this.tileSize, this.tileSize);
    const letter = this.add.image(0, -l.u(2), ssGlyph(this, ch, SS_TILE_INK[tier]))
      .setDisplaySize(l.u(64), l.u(48));
    const val = this.add.image(l.u(24), l.u(21), ssGlyphVal(this, this.tileChip(ch, tier), SS_TILE_VINK[tier]))
      .setDisplaySize(l.u(30), l.u(20));
    c.add([img, letter, val]);
    let glow = null;
    if (tier > 0) {
      glow = this.add.image(0, 0, 'dot').setScale(this.tileSize / 9).setAlpha(tier === 2 ? 0.35 : 0.25)
        .setTint(SS_TIER_GLOW[tier]).setBlendMode('ADD');
      c.addAt(glow, 0);
    }
    c.setSize(this.tileSize, this.tileSize).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => this.tapTile(i));
    this.boardC.add(c);
    this.board[i] = { ch, tier, blk: false, c, img, letter, val, glow };
    this.tweens.add({ targets: c, y: p.y, duration: initial ? 550 : 420, ease: 'Bounce.easeOut', delay: initial ? i * 45 : Math.random() * 90 });
  }
  tileVal(ch, tier) { return (VALS[ch] || VALS[ch[0]] || 1) + (tier === 1 ? 6 : 0); }
  // what the value chip prints: the points, or ♥6 on a dew tile
  tileChip(ch, tier) { return tier === 3 ? SS_DEW_CHIP() : this.tileVal(ch, tier); }

  /* THE DEW (Wyatt): where the blow fell, dew gathers — one random plain
     tile (tier 0, never a forged special or an inked one) turns green after
     a strike lands. Seeded rng, not Math.random: the daily must deal the same
     dew to everyone. Returns the slot, or -1 when no tile could take it.
     `at` pins the slot (harness seam; a taken or inked slot is refused). */
  dewTile(at) {
    const l = this.L;
    if (at === undefined && rng() >= DEW_CHANCE) return -1;
    const open = [];
    for (let i = 0; i < 16; i++) { const s = this.board[i]; if (s && s.tier === 0 && !s.blk && s.c.active) open.push(i); }
    if (!open.length) return -1;
    const i = at === undefined ? open[Math.floor(rng() * open.length)] : at, s = this.board[i];
    if (!open.includes(i)) return -1;
    s.tier = 3;
    SFX.dew();
    // the settle: green glass crossfades in under cooling inks, the chip
    // turns to ♥6, a soft glow blooms and three droplets sink onto the face
    const g = this.add.image(0, 0, 'tile3').setDisplaySize(this.tileSize, this.tileSize).setAlpha(0);
    s.c.addAt(g, s.c.list.indexOf(s.img) + 1);
    const old = s.img;
    s.img = g;
    this.tweens.add({ targets: g, alpha: 1, duration: 420, ease: 'Sine.easeOut', onComplete: () => { if (old.active) old.destroy(); } });
    if (s.glow) { this.tweens.killTweensOf(s.glow); s.glow.destroy(); }
    s.glow = this.add.image(0, 0, 'dot').setScale(this.tileSize / 9).setAlpha(0).setTint(SS_TIER_GLOW[3]).setBlendMode('ADD');
    s.c.addAt(s.glow, 0);
    this.tweens.add({ targets: s.glow, alpha: 0.5, duration: 260, ease: 'Sine.easeOut',
      onComplete: () => { if (s.glow && s.glow.active) this.tweens.add({ targets: s.glow, alpha: 0.25, duration: 500 }); } });
    for (let k = 0; k < 3; k++) {
      const drop = this.add.image(s.c.x + (Math.random() - 0.5) * l.u(30), s.c.y - l.u(30 + Math.random() * 12), 'dot')
        .setScale(0.45 + Math.random() * 0.3).setTint(SS_TIER_GLOW[3]).setAlpha(0).setBlendMode('ADD').setDepth(60);
      this.boardC.add(drop);
      this.tweens.add({ targets: drop, y: s.c.y + (Math.random() - 0.5) * l.u(10), alpha: { from: 0.8, to: 0 }, delay: 80 + k * 110, duration: 460, ease: 'Sine.easeIn', onComplete: () => drop.destroy() });
    }
    this.tweens.add({ targets: s.c, scaleX: 1.08, scaleY: 1.08, duration: 130, yoyo: true, ease: 'Sine.easeOut', delay: 60 });
    this.time.delayedCall(200, () => {
      if (!s.c.active) return;
      s.letter.setTexture(ssGlyph(this, s.ch, SS_TILE_INK[3])).setDisplaySize(l.u(64), l.u(48));
      s.val.setTexture(ssGlyphVal(this, SS_DEW_CHIP(), SS_TILE_VINK[3])).setDisplaySize(l.u(30), l.u(20));
    });
    window.__ssdew = { i, ch: s.ch, fight: this.run.fightIdx, t: Date.now() };   // verification beacon
    return i;
  }

  // USE IT OR LOSE IT (Wyatt): a bonus tile must ride the very next cast or
  // its power drains away — the letter stays, the shimmer goes. Swept after a
  // cast's impact and BEFORE the refill drops the newly earned tile, so every
  // reward is live for exactly one cast. The beast's strike is not a cast and
  // never wastes a tile; only the player's own word can.
  expireSpecials() {
    const l = this.L;
    let drained = false;
    for (const s of this.board) {
      if (!s || !s.tier || !s.c.active) continue;
      drained = true;
      const wasTier = s.tier, tint = SS_TIER_GLOW[wasTier];
      s.tier = 0;
      // the goodbye: the glow swells once and drains, gold dust sinks out of
      // the letter, and the plain face crossfades in under cooling inks
      if (s.glow) {
        this.tweens.killTweensOf(s.glow);
        this.tweens.add({
          targets: s.glow, alpha: 0.55, scaleX: s.glow.scaleX * 1.3, scaleY: s.glow.scaleY * 1.3,
          duration: 150, ease: 'Sine.easeOut',
          onComplete: () => this.tweens.add({ targets: s.glow, alpha: 0, duration: 420, onComplete: () => { if (s.glow.active) s.glow.destroy(); } }),
        });
      }
      const plain = this.add.image(0, 0, 'tile0').setDisplaySize(this.tileSize, this.tileSize).setAlpha(0);
      s.c.addAt(plain, s.c.list.indexOf(s.img) + 1);
      const old = s.img;
      s.img = plain;
      this.tweens.add({ targets: plain, alpha: 1, duration: 480, delay: 120, onComplete: () => { if (old.active) old.destroy(); } });
      // pure cosmetics use Math.random, never rng() — the seeded stream deals
      // the tiles and must not be nudged by an animation
      for (let k = 0; k < 3; k++) {
        const mote = this.add.image(s.c.x + (Math.random() - 0.5) * l.u(34), s.c.y + (Math.random() - 0.5) * l.u(20), 'dot')
          .setScale(0.5 + Math.random() * 0.4).setTint(tint).setAlpha(0.5).setBlendMode('ADD').setDepth(60);
        this.boardC.add(mote);
        this.tweens.add({ targets: mote, y: mote.y + l.u(16 + Math.random() * 10), alpha: 0, delay: k * 90, duration: 520, ease: 'Sine.easeIn', onComplete: () => mote.destroy() });
      }
      this.time.delayedCall(280, () => {
        if (!s.c.active) return;
        s.letter.setTexture(ssGlyph(this, s.ch, SS_TILE_INK[0])).setDisplaySize(l.u(64), l.u(48));
        s.val.setTexture(ssGlyphVal(this, this.tileVal(s.ch, 0), SS_TILE_VINK[0])).setDisplaySize(l.u(30), l.u(20));
      });
      // teach it once per run — after that the drain speaks for itself
      if (!this.run.fadeShown) {
        this.run.fadeShown = true;
        const ft = ssTxt(this, s.c.x, s.c.y - l.u(52), SS_T('tileFade'), l.u(12), '#c9b676', 'italic')
          .setOrigin(0.5).setDepth(70).setShadow(0, 0, '#0a0d1c', l.u(8), true, true);
        this.tweens.add({ targets: ft, alpha: 0, y: ft.y - l.u(20), delay: 1400, duration: 500, onComplete: () => ft.destroy() });
      }
    }
    if (drained) SFX.fizzle();
  }

  /* THE BLACKOUT (Wyatt): void-fictioned bosses ink letters as they charge.
     An inked tile stays readable and stays usable in words — it is simply
     worth NOTHING when the points are added up (base value, tier bonus and
     letter bonuses all void; the rest of the word scores normally and the
     word-level multipliers still apply to the others). It rides the existing
     boss telegraph: the volley flies at "strikes in 1 cast", the same beat
     the eyes charge and the sky rumbles, so the word woven under the gun is
     the word that must route around the dark. The curse holds until the tile
     leaves the board — spend it for nothing, scry the board away, or purify
     it (VIRGO cleanses) — because those valves already exist, "until used"
     plays better than a timed lift. Targets are the highest-value clean
     tiles (the boss eats your best letters, freshly forged specials first —
     a blacked special loses its shimmer outright: blackout wins). Never more
     than 6 dark at once, and an inked letter still spells, so a board is
     never uncastable. */
  blackoutAttack(done) {
    const l = this.L;
    const dark = this.board.filter((s) => s && s.blk).length;
    const n = Math.min(this.beast.fx.ink || 2, Math.max(0, 6 - dark));
    const targets = this.board.map((s, i) => ({ s, i })).filter((x) => x.s && !x.s.blk && x.s.c.active)
      .sort((a, b) => this.inkWorth(b.s) - this.inkWorth(a.s) || a.i - b.i)
      .slice(0, n);
    if (!targets.length) { done(); return; }
    let fin = false;
    const finish = () => { if (!fin) { fin = true; done(); } };
    this.time.delayedCall(2200, finish);            // watchdog — the turn must always return
    window.__ssink = { n: targets.length, tiles: targets.map((t) => t.i), fight: this.run.fightIdx, t: Date.now() };
    SFX.curse();
    // the windup: the boss shudders with gathered dark — strike-tremble language
    const c = this.beastC;
    this.tweens.add({ targets: c, x: l.x(0) - l.u(6), duration: 90, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: () => c.setX(l.x(0)) });
    ssEdgeFlash(this, 0x6b5fa8, 0.3, 700);
    // the telegraph line borrows the word-line hint's spot — dip the hint so
    // the two never overprint, and hand its alpha back when the line passes
    this.tweens.killTweensOf(this.lineHint);
    this.tweens.add({ targets: this.lineHint, alpha: 0, duration: 150 });
    const tt = ssTxt(this, l.x(0), l.y(384), SS_T('inkTele'), l.u(13), '#b9b0d8', 'italic')
      .setOrigin(0.5).setDepth(70).setAlpha(0).setShadow(0, 0, '#0a0d1c', l.u(8), true, true);
    this.tweens.add({ targets: tt, alpha: 0.95, duration: 220 });
    this.tweens.add({
      targets: tt, alpha: 0, y: tt.y - l.u(14), delay: 1350, duration: 450,
      onComplete: () => { tt.destroy(); if (this.lineHint.active) this.lineHint.setAlpha(this.sel.length ? 0 : 0.9); },
    });
    // ink bolts: dark motes streak from the beast's gaze onto the chosen letters
    const eye = (this.beast.eyes && this.beast.eyes[0]) || [0, 0];
    const from = { x: c.x + eye[0] * l.u(1.32), y: c.y + eye[1] * l.u(1.32) };
    const dotK = ssFxTex(this, 'dot', 0x8a76e8);
    let landed = 0;
    targets.forEach((tg, k) => {
      this.time.delayedCall(380 + k * 150, () => {
        const s = this.board[tg.i];
        const settle = () => { if (++landed === targets.length) this.time.delayedCall(240, finish); };
        if (!s || !s.c.active || s.blk) { settle(); return; }
        SFX.noise(0.14, 700, 1.6, 0.05, 220);
        const to = { x: s.c.x, y: s.c.y };
        const ctrl = { x: (from.x + to.x) / 2 + (k % 2 ? -1 : 1) * l.u(70), y: (from.y + to.y) / 2 };
        const dots = [];
        for (let j = 0; j < 6; j++) dots.push(this.add.image(from.x, from.y, dotK).setBlendMode('ADD').setDepth(58).setScale(1.05 - j * 0.12).setAlpha(0));
        const pr = { t: 0 };
        this.tweens.add({
          targets: pr, t: 1, duration: 290, ease: 'Cubic.easeIn',
          onUpdate: () => dots.forEach((d, j) => {
            const t2 = clamp(pr.t * 1.3 - j * 0.055, 0, 1);
            const p = ssQBez(from, ctrl, to, t2);
            d.x = p.x; d.y = p.y; d.alpha = t2 > 0 ? 0.9 - j * 0.13 : 0;
          }),
          onComplete: () => {
            dots.forEach((d) => this.tweens.add({ targets: d, alpha: 0, duration: 150, onComplete: () => d.destroy() }));
            this.blackTile(tg.i);
            settle();
          },
        });
      });
    });
  }
  // what the blackout weighs: points, with the dew's balm counted as the +6 it is
  inkWorth(s) { return this.tileVal(s.ch, s.tier) + (s.tier === 3 ? DEW_HEAL : 0); }
  blackTile(i) {
    const s = this.board[i];
    if (!s || !s.c.active || s.blk) return;
    const l = this.L;
    s.blk = true;
    // blackout wins: a gilded or forged letter is simply dark now
    s.tier = 0;
    if (s.glow) {
      const gg = s.glow;
      s.glow = null;
      this.tweens.killTweensOf(gg);
      this.tweens.add({ targets: gg, alpha: 0, duration: 260, onComplete: () => { if (gg.active) gg.destroy(); } });
    }
    // the ink pools: the void face crossfades in under a pale letter and a flat 0
    const inked = this.add.image(0, 0, 'tileblk').setDisplaySize(this.tileSize, this.tileSize).setAlpha(0);
    s.c.addAt(inked, s.c.list.indexOf(s.img) + 1);
    const old = s.img;
    s.img = inked;
    this.tweens.add({ targets: inked, alpha: 1, duration: 300, onComplete: () => { if (old.active) old.destroy(); } });
    this.time.delayedCall(150, () => {
      if (!s.c.active) return;
      s.letter.setTexture(ssGlyph(this, s.ch, SS_BLK_INK)).setDisplaySize(l.u(64), l.u(48));
      s.val.setTexture(ssGlyphVal(this, 0, SS_BLK_VINK)).setDisplaySize(l.u(30), l.u(20));
    });
    const ring = this.add.image(s.c.x, s.c.y, ssFxTex(this, 'ring', 0x8a76e8)).setBlendMode('ADD').setAlpha(0.7).setScale(0.2).setDepth(59);
    this.tweens.add({ targets: ring, scale: l.u(0.85), alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    this.tweens.add({ targets: s.c, angle: -3, duration: 60, yoyo: true, repeat: 2, onComplete: () => s.c.setAngle(0) });
    this.cameras.main.shake(60, 0.0022);
    // teach it once per run — after that the flat 0 speaks
    if (!this.run.inkShown) {
      this.run.inkShown = true;
      const ft = ssTxt(this, s.c.x, s.c.y - l.u(52), SS_T('inkHint'), l.u(12), '#b9b0d8', 'italic')
        .setOrigin(0.5).setDepth(70).setShadow(0, 0, '#0a0d1c', l.u(8), true, true);
      this.tweens.add({ targets: ft, alpha: 0, y: ft.y - l.u(20), delay: 1500, duration: 500, onComplete: () => ft.destroy() });
    }
  }

  // ---------- selection ----------
  tapTile(i) {
    if (this.state !== 'pick') return;
    SFX.ensure();
    if (this.purifyArmed) { this.purifyTile(i); return; }
    const k = this.sel.indexOf(i);
    if (k >= 0) { this.unselectFrom(k); return; }
    if (this.sel.length >= 8) return;
    this.sel.push(i);
    this.board[i].c.setAlpha(0.28);
    SFX.chime(this.sel.length - 1);
    this.layoutLine();
  }
  unselectFrom(k) {
    if (!this.sel.length) return;
    SFX.unchime();
    const removed = this.sel.splice(k);
    for (const i of removed) if (this.board[i]) this.board[i].c.setAlpha(1);
    this.layoutLine();
  }
  currentWord() { return this.sel.map((i) => this.board[i].ch).join(''); }
  layoutLine() {
    const l = this.L;
    for (const t of this.lineTiles) t.destroy();
    this.lineTiles = [];
    const n = this.sel.length;
    this.lineHint.setAlpha(n ? 0 : 0.9);
    const word = this.currentWord();
    const valid = n >= 2 && WORDSET.has(word);
    const sz = l.u(44), gap = l.u(6);
    const w = n * sz + (n - 1) * gap;
    this.sel.forEach((bi, k) => {
      const s = this.board[bi];
      const mc = this.add.container(-w / 2 + sz / 2 + k * (sz + gap), 0);
      const img = this.add.image(0, 0, s.blk ? 'tileblk' : 'tile' + s.tier).setDisplaySize(sz, sz);
      // same glyph texture as the board, at the line's font-16/20 proportions;
      // an inked letter keeps its ash ink in the staged word — it spells, but
      // the player should see it carrying no weight
      const gsc = s.ch.length > 1 ? 16 / 30 : 20 / 36;
      const letter = this.add.image(0, 0, ssGlyph(this, s.ch, s.blk ? SS_BLK_INK : valid ? SS_LINE_GREEN : SS_TILE_INK[0]))
        .setDisplaySize(l.u(64 * gsc), l.u(48 * gsc));
      mc.add([img, letter]);
      mc.setSize(sz, sz).setInteractive({ useHandCursor: true });
      mc.on('pointerdown', () => this.unselectFrom(k));
      this.lineC.add(mc);
      this.lineTiles.push(mc);
      mc.setScale(0.6); this.tweens.add({ targets: mc, scale: 1, duration: 140, ease: 'Back.easeOut' });
    });
    this.castB.setAlpha(valid ? 1 : 0.45);
    this.castT.setAlpha(valid ? 1 : 0.5);
    this.castT.setText(valid ? 'CAST ' + this.previewDamage() : 'CAST');
  }

  // ---------- the birth sign ----------
  signTap() {
    if (!this.signZ) return;
    if (this.sign === 'virgo') {
      if (this.state !== 'pick' || this.purifyUsed) return;
      SFX.ensure(); SFX.ui();
      this.setPurifyArmed(!this.purifyArmed);
      return;
    }
    SFX.ensure();
    // the sign's power reads in the inspector window — never as text over the
    // board (it was an unreadable toast once; Wyatt called it)
    this.openInspect();
  }
  // VIRGO's ember: charged = a soft breath behind the emblem, armed = bright
  updateSignGlow() {
    if (!this.signGlow) return;
    this.tweens.killTweensOf(this.signGlow);
    if (this.sign !== 'virgo') { this.signGlow.setAlpha(0); return; }
    if (this.purifyArmed) {
      this.signGlow.setAlpha(0.32);
      this.tweens.add({ targets: this.signGlow, alpha: 0.14, duration: 500, yoyo: true, repeat: -1 });
    } else if (!this.purifyUsed) {
      this.signGlow.setAlpha(0.10);
      this.tweens.add({ targets: this.signGlow, alpha: 0.04, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else this.signGlow.setAlpha(0);
  }
  setPurifyArmed(on) {
    this.purifyArmed = on;
    if (this.purifyHintT) { this.purifyHintT.destroy(); this.purifyHintT = null; }
    if (on) {
      this.purifyHintT = ssTxt(this, this.L.x(0), this.L.y(452), SS_T('zpPurify'), this.L.u(12), '#cfe8b0', 'italic')
        .setOrigin(0.5).setDepth(70).setShadow(0, 0, '#3a5a2a', this.L.u(8), true, true);
    }
    this.updateSignGlow();
  }
  purifyTile(i) {
    const s = this.board[i];
    if (!s) return;
    this.purifyUsed = true;
    this.setPurifyArmed(false);
    const k = this.sel.indexOf(i);
    if (k >= 0) this.unselectFrom(k);
    const p = this.slotPos(i);
    this.starBurst.emitParticleAt(p.x, p.y, 8);
    SFX.forge();
    s.c.destroy(); this.board[i] = null;
    let ch = rpick(BAG);
    ch = PACK.digraph[ch] || ch;
    this.spawnTile(i, ch, s.tier, false);
  }

  // ---------- damage ----------
  hasSigil(id) { return this.run.sigils.includes(id); }
  wordDamage(tiles) {
    let base = 0, starMult = 1, vowelsN = 0, vowelsPaid = 0, letters = 0;
    for (const s of tiles) {
      letters += s.ch.length;
      const c0 = s.ch[0];
      if (VOWELS.includes(c0)) vowelsN++;      // structural — LIBRA's balance sees even inked vowels
      if (s.blk) continue;                     // blackout: the letter spells, but pays NOTHING
      base += this.tileVal(s.ch, s.tier);
      if (s.tier === 2) starMult = 1.5;
      if (VOWELS.includes(c0)) vowelsPaid++;
      if (this.hasSigil('runes') && 'sret'.includes(c0)) base += 2;
    }
    if (this.hasSigil('choir')) base += vowelsPaid * 2;
    let dmg = base * (LEN_MULT[Math.min(letters, 8)] || 2.3) * starMult;
    if (this.hasSigil('quill')) dmg += 4;
    if (this.hasSigil('longbow') && letters >= 6) dmg += 12;
    if (this.hasSigil('roots')) dmg += 2 * this.run.sigils.length;
    if (this.hasSigil('verse')) dmg += this.run.words;
    // birth-sign angles (campaign only; this.sign is null elsewhere)
    if (this.sign === 'gemini') {
      const twice = {};
      for (const s of tiles) twice[s.ch] = (twice[s.ch] | 0) + 1;
      for (const ch in twice) if (twice[ch] >= 2) { dmg += 10; break; }
    }
    if (this.sign === 'leo' && letters >= 6) dmg += 8;
    if (this.sign === 'libra' && tiles.length && vowelsN * 2 === tiles.length) dmg += 10;
    if (this.sign === 'capricorn') dmg += this.run.fightIdx;
    if (this.sign === 'pisces' && this.beast && this.beast.count === 1 && this.beast.hpNow > 0) dmg *= 1.3;
    if (this.hasSigil('blood')) dmg *= 1.25;
    if (this.hasSigil('nova') && letters >= 7) dmg *= 2;
    if (this.hasSigil('storm') && this.run.words % 3 === 2) dmg *= 2;   // every 3rd cast
    if (this.hasSigil('first') && !this.run.firstUsed) dmg *= 2;
    return Math.round(dmg);
  }
  previewDamage() { return this.wordDamage(this.sel.map((i) => this.board[i])); }

  // ---------- fights ----------
  beastFor(f) {
    const base = SS_BEASTS[f.id];
    const b = { ...base };
    b.hp = Math.round(base.hp * f.mult);
    b.atk = base.atk + f.atkAdd;
    if (this.hasSigil('blood')) b.atk = Math.round(b.atk * 1.25);
    if (f.umbral && !base.boss) { b.tint = SS_UMBRAL.tint; b.eye = SS_UMBRAL.eye; b.name = SS_UMBRAL.prefix + base.name; }
    if (f.umbral && base.boss && f.id !== 'phoenix') { b.tint = SS_UMBRAL.tint; b.eye = SS_UMBRAL.eye; b.name = SS_UMBRAL.prefix + base.name; }
    return b;
  }
  startFight() {
    const l = this.L;
    const f = this.fights[this.run.fightIdx];
    this.beast = this.beastFor(f);
    if (this.hasSigil('hush')) this.beast.timer += 1;
    this.beast.hpNow = this.beast.hp;
    if ((this.run.overkill | 0) > 0) {                 // ECHO OF RUIN carries the surplus
      const carve = Math.min(this.run.overkill | 0, this.beast.hp - 1);
      this.beast.hpNow -= carve;
      this.run.overkill = 0;
      const et = ssTxt(this, l.x(0), l.y(238), '☍ −' + carve, l.u(18), '#d9b0ff').setOrigin(0.5).setDepth(70)
        .setShadow(0, 0, '#a86be0', l.u(8), true, true);
      this.tweens.add({ targets: et, alpha: 0, y: l.y(214), delay: 1100, duration: 500, onComplete: () => et.destroy() });
    }
    // the birth sign wakes with the battle
    this.venom = 0;
    this.shellUsed = false;
    this.watersUsed = false;
    this.purifyUsed = false;
    if (this.purifyArmed) this.setPurifyArmed(false);
    else this.updateSignGlow && this.updateSignGlow();
    if (this.sign === 'aries') {                       // the opening ram
      const ram = Math.min(8, this.beast.hpNow - 1);
      if (ram > 0) {
        this.beast.hpNow -= ram;
        this.run.totalDmg += ram;
        const rt = ssTxt(this, l.x(0), l.y(214), '−' + ram, l.u(18), '#ffb066').setOrigin(0.5).setDepth(70)
          .setShadow(0, 0, '#e05e2a', l.u(9), true, true);
        this.tweens.add({ targets: rt, alpha: 0, y: l.y(190), delay: 1000, duration: 500, onComplete: () => rt.destroy() });
        this.cameras.main.shake(120, 0.004);
      }
    }
    // what the bar/numbers SHOW — trails hpNow, catching up when a flying
    // damage number lands on the bar
    this.ehpShown = { v: this.beast.hpNow };
    this.dying = false;
    this.beast.count = this.beast.timer;
    this.run.firstUsed = false;
    this.struckThisBattle = false;
    this.shieldUsed = false;
    this.hintUsed = false;
    this.clearHintFx();
    this.headT.setText(this.modeTitle());
    const pipBase = this.mode === 'campaign' ? Math.floor(this.run.fightIdx / 5) * 5 : 0;
    this.pips.forEach((p, i) => {
      const gi = pipBase + i;
      p.setTint(gi < this.run.fightIdx ? 0xd7b45c : gi === this.run.fightIdx ? 0xffffff : 0x4a5480)
        .setScale(gi === this.run.fightIdx ? 0.9 : 0.6);
    });
    this.setBeastName(''); this.beastTitle.setText('');
    if (this.beastFx) this.beastFx.destroy();
    this.beastC.setPosition(l.x(0), l.y(170)).setScale(1).setRotation(0);
    const asm = ssAssembleBeast(this, this.beastC, this.beast, l.u(1.15), () => {
      this.setBeastName(this.beast.name);
      const tag = this.beast.boss ? ' · ' + SS_T('tBoss') : this.beast.tier === 'mini' ? ' · ' + SS_T('tElite') : '';
      this.beastTitle.setText((SS_BEAST_T(this.beast) + tag).toUpperCase());
    });
    this.beastLines = asm.lines; this.beastStars = asm.stars;
    // presence + attack fx (aura, idle, shimmer, telegraph, signature strikes);
    // it also owns the body's breathing, so no more breathTween here
    this.beastFx = ssBeastFx(this, this.beastC, this.beast, l.u(1.15), asm);

    this.sel = [];
    for (const s of this.board) if (s) s.c.destroy();
    this.board = [];
    this.tweens.killTweensOf([this.boardC, this.lineC]);
    this.boardC.setAlpha(1); this.lineC.setAlpha(1);
    this.layoutLine();
    if (this.hasSigil('gilded')) this.pendingTier = 1;
    this.fillBoard(true);
    this.hintB.setVisible(this.hasSigil('tome')); this.hintT.setVisible(this.hasSigil('tome'));
    this.hintB.setAlpha(1); this.hintT.setAlpha(1);
    this.updateBars();
    this.state = 'pick';
  }
  updateBars() {
    const l = this.L;
    const crop = (bar, f) => bar.setCrop(0, 0, bar.frame.width * clamp(f, 0, 1), bar.frame.height);
    crop(this.hpBar, this.run.hp / this.run.hpMax);
    this.hpT.setText(this.run.hp + ' / ' + this.run.hpMax);
    this.drawEhp();
    this.strikeT.setText(this.beast.hpNow > 0 ? '✦ strikes in ' + this.beast.count + (this.beast.count === 1 ? ' cast ✦' : ' casts ✦') : '');
    this.strikeT.setColor(this.beast.count === 1 && this.beast.hpNow > 0 ? '#ff8a70' : '#e6a2a2');
    this.strikeRib.setAlpha(this.strikeT.text ? 0.9 : 0);
    if (this.strikeT.text) this.strikeRib.setDisplaySize(this.strikeT.width + l.u(26), l.u(19));
    // telegraph: the constellation charges as the strike counter fills
    if (this.beastFx) this.beastFx.setThreat(this.beast.hpNow > 0
      ? (this.beast.timer - this.beast.count) / Math.max(1, this.beast.timer - 1) : 0);
    // while a damage number is in flight the tally animation owns the counter
    if (!this.scoreAnim) this.scoreT.setText(String(this.runScore()));
  }
  // enemy bar + numbers render the SHOWN hp (which trails hpNow during a
  // damage flight); numbers count down as the drain tween runs
  drawEhp() {
    const shown = Math.max(0, Math.round(this.ehpShown.v));
    this.ehpBar.setCrop(0, 0, this.ehpBar.frame.width * clamp(shown / this.beast.hp, 0, 1), this.ehpBar.frame.height);
    // setText re-rasterizes and re-uploads the text texture — at dpr3 a
    // per-frame repaint during the 300ms drain eats the frame budget. The
    // bar crop stays per-frame (cheap, carries the smoothness); the numeral
    // repaints at ~20Hz and always lands exact on the drain's endpoints.
    const s = shown + ' / ' + this.beast.hp;
    if (s === this._ehpStr) return;
    const now = performance.now();
    const atRest = shown === Math.max(0, this.beast.hpNow) || shown === 0;
    if (!atRest && now - (this._ehpTextAt || 0) < 45) return;
    this._ehpStr = s; this._ehpTextAt = now;
    this.ehpT.setText(s);
  }
  runScore() { return this.run.totalDmg + this.run.longest.length * 15 + this.run.fightIdx * 50; }
  setBeastName(name) {
    if (this.beastNameI) { this.beastNameI.destroy(); this.beastNameI = null; }
    if (!name) return;
    const gk = ssGoldTex(this, name, 19);
    const sc = Math.min(1, 340 / gk.w);   // umbral prefixes get long
    this.beastNameI = this.add.image(this.L.x(0), this.L.y(280), gk.key)
      .setDisplaySize(this.L.u(gk.w * sc), this.L.u(gk.h * sc));
  }

  // ---------- casting ----------
  tryCast() {
    if (this.state !== 'pick') return;
    const word = this.currentWord();
    const l = this.L;
    if (this.sel.length < 2 || !WORDSET.has(word)) {
      SFX.invalid();
      this.cameras.main.shake(120, 0.004);
      this.tweens.add({ targets: this.lineC, x: this.lineC.x + l.u(8), duration: 50, yoyo: true, repeat: 3, onComplete: () => this.lineC.setX(l.x(0)) });
      return;
    }
    this.state = 'anim';
    this.clearHintFx(true);
    if (this.purifyArmed) this.setPurifyArmed(false);
    const tiles = this.sel.map((i) => this.board[i]);
    const dmg = this.wordDamage(tiles);
    const letters = tiles.reduce((a, s) => a + s.ch.length, 0);
    const stormProc = this.hasSigil('storm') && this.run.words % 3 === 2;   // before words++
    this.run.words++; this.run.firstUsed = true;
    this.run.letters += letters;
    if (dmg > this.run.bigHit) this.run.bigHit = dmg;
    SS.prof.words++;
    if (letters > this.run.longest.length) this.run.longest = word;
    if (word.length > SS.prof.longest.length) SS.prof.longest = word;
    if (dmg > SS.prof.bigHit) SS.prof.bigHit = dmg;
    // the drip's word counters. Length is counted in LETTERS (a digraph tile
    // spells two), which is the same figure the score and the share card pay
    // on — never tiles, or a Qu word would be short-changed.
    if (letters >= 6) ssSigilBump('w6');
    if (letters >= 7) ssSigilBump('w7');
    if (letters >= 8) ssSigilBump('w8');
    // …and the tile this word forges. `letters >= 5` is the very test the
    // drop below makes (tier = 7+ ? 2 : 5+ ? 1 : 0), read here so the count
    // lands inside the save that already runs on every cast.
    if (letters >= 5) ssSigilBump('frg');
    SS.save();
    if (letters >= 7) SS.award('lexicon-7', this.game);
    if (letters >= 8) SS.award('grand-weaver', this.game);
    if (dmg >= 60) SS.award('heavy-hit', this.game);
    if (tiles.some((t) => t.ch === 'qu')) SS.award('q-mage', this.game);
    if (SS.prof.words >= 100) SS.award('century', this.game);
    SFX.cast(this.sel.length);
    if (letters >= 6) {
      SFX.bigWord();
      this.cameras.main.flash(260, 240, 210, 120, false);
      const word6 = letters >= 8 ? 'CELESTIAL!' : letters >= 7 ? 'MAGNIFICENT!' : 'SPLENDID!';
      const bt = ssTxt(this, l.x(0), l.y(430), word6, l.u(24), '#ffe9a8').setOrigin(0.5).setDepth(70).setScale(0.5);
      this.tweens.add({ targets: bt, scale: 1, duration: 200, ease: 'Back.easeOut' });
      this.tweens.add({ targets: bt, alpha: 0, y: l.y(410), delay: 800, duration: 400, onComplete: () => bt.destroy() });
    }
    if (stormProc) {                                   // STORMBINDER doubles this one
      const st = ssTxt(this, l.x(0), l.y(498), '↯ ×2', l.u(18), '#bfe0ff').setOrigin(0.5).setDepth(70)
        .setShadow(0, 0, '#6fa8ff', l.u(9), true, true);
      this.tweens.add({ targets: st, alpha: 0, y: l.y(474), delay: 650, duration: 400, onComplete: () => st.destroy() });
    }

    const tx = this.beastC.x - this.lineC.x, ty = this.beastC.y - this.lineC.y;
    this.lineTiles.forEach((mc, k) => {
      this.tweens.add({
        targets: mc, x: tx + (rng() - 0.5) * l.u(60), y: ty + (rng() - 0.5) * l.u(40),
        scale: 0.25, alpha: 0.9, delay: k * 55, duration: 280, ease: 'Cubic.easeIn',
        onUpdate: () => { if (Math.random() < 0.3) this.starBurst.emitParticleAt(this.lineC.x + mc.x, this.lineC.y + mc.y, 1); },
        onComplete: () => { this.starBurst.emitParticleAt(this.beastC.x + (rng() - 0.5) * l.u(60), this.beastC.y + (rng() - 0.5) * l.u(40), 4); mc.destroy(); },
      });
    });

    this.time.delayedCall(this.sel.length * 55 + 320, () => {
      SFX.impact();
      this.cameras.main.shake(140, 0.006);
      if (this.hasSigil('salve') && letters >= 5) this.heal(4);
      if (this.hasSigil('leech')) this.heal(1);
      // the dew rides the cast: every green in the word heals DEW_HEAL (they
      // sum), in addition to the letter's own points already in dmg
      const dews = this.sel.filter((i) => this.board[i] && this.board[i].tier === 3 && !this.board[i].blk).length;
      if (dews > 0) {
        const before = this.run.hp;
        this.heal(DEW_HEAL * dews);
        SFX.dew();
        const ht = ssTxt(this, l.x(-150), l.y(94), '♥ +' + (this.run.hp - before) + ' ♥', l.u(16), '#9fe87a').setOrigin(0.5).setDepth(70)
          .setShadow(0, 0, '#2a7a3a', l.u(8), true, true);
        this.tweens.add({ targets: ht, alpha: 0, y: l.y(74), delay: 700, duration: 450, onComplete: () => ht.destroy() });
        window.__ssdewHeal = { n: dews, healed: this.run.hp - before, hp: this.run.hp, t: Date.now() };
      }
      if (this.sign === 'scorpio') this.venom = (this.venom | 0) + 1;   // the sting settles in
      const used = [...this.sel];
      this.sel = [];
      this.lineTiles = [];
      let tier = letters >= 7 ? 2 : letters >= 5 ? 1 : 0;
      if (tier > 0 && this.hasSigil('forge')) tier = 2;
      for (const i of used) { this.board[i].c.destroy(); this.board[i] = null; }
      if (tier > 0) { this.pendingTier = tier; SFX.forge(); }
      this.layoutLine();
      this.beastHit(dmg);
      this.time.delayedCall(200, () => {
        if (this.beast.hpNow <= 0) return;   // board rebuilds next fight — nothing to drain
        this.expireSpecials();               // unspent bonuses fade BEFORE the new reward drops
        this.fillBoard(false);
        this.tickEnemy(() => { this.state = 'pick'; });
      });
    });
  }

  beastHit(dmg) {
    const l = this.L;
    this.beast.hpNow -= dmg;
    const from = parseInt(this.scoreT.text, 10) || 0;
    this.run.totalDmg += dmg;
    const to = this.runScore();
    this.scoreAnim = (this.scoreAnim || 0) + 1;
    // beast recoil + hull flash read instantly; the bar waits for the number
    this.tweens.add({ targets: this.beastC, x: l.x(0) + l.u(10), duration: 60, yoyo: true, repeat: 1, onComplete: () => this.beastC.setX(l.x(0)) });
    if (this.beastFx && this.beastFx.ready) this.beastFx.hitFlash();
    else if (this.beastLines) { this.beastLines.setAlpha(1); this.tweens.add({ targets: this.beastLines, alpha: 0.35, duration: 300 }); }
    this.updateBars();

    // the hit beat: the damage pops big at center screen, slams up into the
    // enemy HP bar, and only when it lands does the bar drain + count down.
    // Then the same value arcs on from the bar to the score tally.
    const big = dmg >= 25;
    const gk = ssGoldTex(this, String(dmg), 34);
    const nI = this.add.image(l.x(0), l.y(468), gk.key)
      .setDisplaySize(l.u(gk.w), l.u(gk.h)).setDepth(70);
    const sx = nI.scaleX, sy = nI.scaleY;
    nI.setScale(sx * 0.2, sy * 0.2).setAlpha(0);
    const pop = big ? 1.45 : 1.18;
    this.tweens.add({ targets: nI, scaleX: sx * pop, scaleY: sy * pop, alpha: 1, duration: 190, ease: 'Back.easeOut' });
    this.tweens.add({ targets: nI, scaleX: sx, scaleY: sy, delay: 190, duration: 130 });
    const start = { x: nI.x, y: nI.y }, dst = { x: l.x(0), y: l.y(322) };
    const pt = { t: 0 };
    this.tweens.add({
      targets: pt, t: 1, delay: 430, duration: 340, ease: 'Cubic.easeIn',
      onUpdate: () => {
        nI.x = start.x + (dst.x - start.x) * pt.t;
        nI.y = start.y + (dst.y - start.y) * pt.t;
        const k = 1 - pt.t * 0.55;
        nI.setScale(sx * k, sy * k);
        if (Math.random() < 0.3) this.starBurst.emitParticleAt(nI.x, nI.y, 1);
      },
      onComplete: () => {
        nI.destroy();
        this.starBurst.emitParticleAt(dst.x, dst.y, big ? 6 : 3);
        // small bar shake — only when the hit is worth bragging about
        if (big) {
          this.tweens.killTweensOf(this.ehpC);
          this.ehpC.setX(0);
          this.tweens.add({ targets: this.ehpC, x: l.u(3), duration: 40, yoyo: true, repeat: 3, onComplete: () => this.ehpC.setX(0) });
        }
        // drain now — the number has landed. Landing always retargets the
        // latest hpNow so chained casts stay truthful.
        this.tweens.killTweensOf(this.ehpShown);
        this.tweens.add({
          targets: this.ehpShown, v: Math.max(0, this.beast.hpNow), duration: 300, ease: 'Cubic.easeOut',
          onUpdate: () => this.drawEhp(),
          onComplete: () => {
            this.drawEhp();
            if (this.beast.hpNow <= 0 && !this.dying) { this.dying = true; this.beastDeath(); }
          },
        });
        this.flyScore(dst, dmg, from, to);
      },
    });
  }

  // the tally beat (v0.9.0), re-anchored: a smaller +N lifts off the enemy bar
  // where the damage landed, arcs up to the score trailing stars, and the score
  // counts up when it lands. The counter is read from the label (not runScore)
  // so back-to-back casts chain smoothly.
  flyScore(startPt, dmg, from, to) {
    const l = this.L;
    const gk = ssGoldTex(this, '+' + dmg, 22);
    const nI = this.add.image(startPt.x, startPt.y, gk.key)
      .setDisplaySize(l.u(gk.w), l.u(gk.h)).setDepth(70);
    const sx = nI.scaleX, sy = nI.scaleY;
    const dst = { x: this.scoreT.x - l.u(16), y: this.scoreT.y };
    const ctrl = { x: (startPt.x + dst.x) / 2 + l.u(40), y: Math.min(startPt.y, dst.y) - l.u(52) };
    const pt = { t: 0 };
    this.tweens.add({
      targets: pt, t: 1, duration: 430, ease: 'Cubic.easeIn',
      onUpdate: () => {
        const u = pt.t, v = 1 - u;
        nI.x = v * v * startPt.x + 2 * v * u * ctrl.x + u * u * dst.x;
        nI.y = v * v * startPt.y + 2 * v * u * ctrl.y + u * u * dst.y;
        const k = 1 - u * 0.45;
        nI.setScale(sx * k, sy * k);
        if (Math.random() < 0.35) this.starBurst.emitParticleAt(nI.x, nI.y, 1);
      },
      onComplete: () => {
        nI.destroy();
        this.starBurst.emitParticleAt(dst.x, dst.y, 3);
        this.tweens.add({ targets: this.scoreT, scale: 1.3, duration: 110, yoyo: true });
        const cnt = { v: from, at: 0 };
        this.tweens.add({
          targets: cnt, v: to, duration: Math.min(700, 90 + (to - from) * 6), ease: 'Cubic.easeOut',
          // same texture-repaint economy as drawEhp: count at ~20Hz, land exact
          onUpdate: () => {
            const now = performance.now();
            if (now - cnt.at < 45) return;
            cnt.at = now;
            this.scoreT.setText(String(Math.round(cnt.v)));
          },
          onComplete: () => {
            this.scoreT.setText(String(Math.round(to)));
            this.scoreAnim--; if (!this.scoreAnim) this.updateBars();
          },
        });
      },
    });
  }

  beastDeath() {
    this.state = 'anim';
    SFX.victory();
    const l = this.L;
    if (this.beastFx) this.beastFx.die();   // stops idle/shimmer, implodes the aura
    this.beastC.setScale(1);
    for (const st of this.beastStars) {
      this.tweens.killTweensOf(st);
      const ang = Math.atan2(st.y, st.x) + (rng() - 0.5);
      this.tweens.add({ targets: st, x: st.x + Math.cos(ang) * l.u(140), y: st.y + Math.sin(ang) * l.u(140), alpha: 0, scale: 0.1, duration: 900, ease: 'Cubic.easeOut' });
    }
    this.starBurst.emitParticleAt(this.beastC.x, this.beastC.y, 26);
    this.goldRain.start();
    this.time.delayedCall(1300, () => this.goldRain.stop());
    if (this.beastLines) this.tweens.add({ targets: this.beastLines, alpha: 0, duration: 350 });
    this.strikeT.setText(''); this.strikeRib.setAlpha(0);
    SS.prof.beasts++;
    SS.award('first-blood', this.game);
    if (this.fights[this.run.fightIdx].id === 'draco') SS.award('dragonfall', this.game);
    if (this.fights[this.run.fightIdx].id === 'phoenix') SS.award('first-flame', this.game);
    if (this.signZ && this.signZ.beast === this.fights[this.run.fightIdx].id) SS.award('star-crossed', this.game);
    if (!this.struckThisBattle) SS.award('untouched', this.game);
    // the drip counts the surplus whether or not ECHO OF RUIN is there to
    // spend it, and counts a kill made on the brink BEFORE the fell's heal
    ssSigilBump('ovk', Math.max(0, -this.beast.hpNow));
    if (this.run.hp <= 10) ssSigilBump('brnk');
    SS.save();
    if (this.hasSigil('echo')) this.run.overkill = Math.max(0, -this.beast.hpNow);
    this.run.fightIdx++;
    this.heal(this.hasSigil('meteor') ? this.run.hpMax : 6);
    if (this.mode === 'campaign') this.saveCheckpoint();
    this.time.delayedCall(1150, () => {
      if (this.run.fightIdx >= this.fights.length) this.endRun(true);
      else this.showSigilPick();
    });
  }
  saveCheckpoint() {
    if (this.run.fightIdx >= this.fights.length) { ssClearCampaign(); return; }
    const f = this.fights[this.run.fightIdx];
    localStorage.setItem('beta3.campaign', JSON.stringify({
      fightIdx: this.run.fightIdx, actIdx: f.actIdx, hp: this.run.hp, hpMax: this.run.hpMax,
      sigils: this.run.sigils, words: this.run.words, longest: this.run.longest,
      totalDmg: this.run.totalDmg, scried: this.run.scried, featherUsed: this.run.featherUsed,
      letters: this.run.letters, bigHit: this.run.bigHit, playMs: this.runElapsed(),
      overkill: this.run.overkill | 0,
    }));
  }
  runElapsed() { return (this.run.playMs | 0) + Math.max(0, Date.now() - this.run.startAt); }

  heal(n) { this.run.hp = clamp(this.run.hp + n, 0, this.run.hpMax); this.updateBars(); }

  tickEnemy(done) {
    const l = this.L;
    // SCORPIO's venom seeps first — over a long fight it can fell the beast
    // before the strike ever lands
    if (this.sign === 'scorpio' && (this.venom | 0) > 0 && this.beast.hpNow > 0) {
      const vd = Math.min(6, this.venom | 0);
      this.beast.hpNow -= vd;
      this.run.totalDmg += vd;
      const vt = ssTxt(this, l.x(64), l.y(214), '−' + vd, l.u(15), '#9fe87a').setOrigin(0.5).setDepth(70)
        .setShadow(0, 0, '#3a8a2a', l.u(8), true, true);
      this.tweens.add({ targets: vt, alpha: 0, y: l.y(190), delay: 500, duration: 450, onComplete: () => vt.destroy() });
      this.tweens.killTweensOf(this.ehpShown);
      this.tweens.add({ targets: this.ehpShown, v: Math.max(0, this.beast.hpNow), duration: 240, onUpdate: () => this.drawEhp() });
      if (this.beast.hpNow <= 0) {
        if (!this.dying) { this.dying = true; this.updateBars(); this.beastDeath(); }
        return;
      }
    }
    this.beast.count--;
    this.updateBars();
    if (this.beast.count > 0) {
      // void bosses ink letters at the very beat the telegraph charges —
      // "strikes in 1 cast" and the board goes dark under the gun
      if (this.beast.count === 1 && this.beast.fx && this.beast.fx.curse === 'blackout' && this.beast.hpNow > 0) {
        this.blackoutAttack(done);
        return;
      }
      done(); return;
    }
    this.beast.count = this.beast.timer;
    if (this.hasSigil('shield') && !this.shieldUsed) {
      this.shieldUsed = true;
      SFX.blocked();
      const bt = ssTxt(this, l.x(0), l.y(240), '✦ BLOCKED ✦', l.u(20), '#9fd8ff').setOrigin(0.5).setDepth(70);
      this.tweens.add({ targets: bt, alpha: 0, y: l.y(220), delay: 600, duration: 400, onComplete: () => bt.destroy() });
      this.updateBars();
      done();
      return;
    }
    // the blow itself: the beast's signature attack (archetype from data.js)
    // telegraphs, strikes, and calls land() at the moment of contact — where
    // the player-side feedback (shake, red flash, screen-edge wash) fires
    const land = (mult) => {
      mult = mult || 1;
      const boss = !!this.beast.boss;
      SFX.hurt();
      this.cameras.main.shake(Math.round(260 * (boss ? 1.35 : 1)), 0.012 * (boss ? 1.3 : 1) * mult);
      this.cameras.main.flash(220, 120, 20, 30);
      ssEdgeFlash(this, this.beast.eye, Math.min(0.85, 0.42 * mult * (boss ? 1.25 : 1)));
      this.struckThisBattle = true;
      ssSigilBump('hit'); SS.save();
      let atk = this.beast.atk;
      if (this.hasSigil('eclipse')) atk = Math.ceil(atk / 2);
      if (this.sign === 'cancer' && !this.shellUsed) {   // the shell takes the first blow
        this.shellUsed = true;
        atk = Math.ceil(atk / 2);
        SFX.blocked();
        const st = ssTxt(this, l.x(0), l.y(240), '◈ ' + SS_T('zShell') + ' ◈', l.u(16), '#9fd8ff').setOrigin(0.5).setDepth(70);
        this.tweens.add({ targets: st, alpha: 0, y: l.y(220), delay: 700, duration: 400, onComplete: () => st.destroy() });
      }
      if (this.hasSigil('ward')) atk = Math.max(1, atk - 3);
      this.run.hp -= atk;
      const dt = ssTxt(this, l.x(-160), l.y(68), '-' + atk, l.u(22), '#ff8a8a').setOrigin(0.5).setDepth(70);
      this.tweens.add({ targets: dt, y: dt.y + l.u(30), alpha: 0, duration: 800, onComplete: () => dt.destroy() });
      if (this.run.hp <= 0 && this.hasSigil('feather') && !this.run.featherUsed) {
        this.run.featherUsed = true;
        this.run.hp = 1;
        this.cameras.main.flash(500, 255, 160, 60);
        SFX.bigWord();
        const ft = ssTxt(this, l.x(0), l.y(400), '🔥 THE FEATHER BURNS 🔥', l.u(20), '#ffa94d').setOrigin(0.5).setDepth(70);
        this.tweens.add({ targets: ft, alpha: 0, delay: 1200, duration: 500, onComplete: () => ft.destroy() });
      }
      // AQUARIUS: the first stumble below half health pours the waters
      if (this.sign === 'aquarius' && !this.watersUsed && this.run.hp > 0 && this.run.hp < this.run.hpMax / 2) {
        this.watersUsed = true;
        this.time.delayedCall(430, () => {
          if (this.state === 'end' || !this.scene.isActive()) return;
          this.heal(8);
          SFX.forge();
          const wt = ssTxt(this, l.x(-150), l.y(94), '≈ +8 ≈', l.u(16), '#7ae0d8').setOrigin(0.5).setDepth(70)
            .setShadow(0, 0, '#2a8a8a', l.u(8), true, true);
          this.tweens.add({ targets: wt, alpha: 0, y: l.y(74), delay: 700, duration: 450, onComplete: () => wt.destroy() });
        });
      }
      this.updateBars();
      if (this.run.hp <= 0) this.endRun(false);
      else {
        // dew gathers where the blow fell — one plain tile greens, a beat
        // after the hit reads (never in versus: VsBattle has its own strike)
        this.time.delayedCall(260, () => { if (this.state !== 'end' && this.scene.isActive()) this.dewTile(); });
        done();
      }
    };
    if (this.beastFx && this.beastFx.ready) this.beastFx.attack(land);
    else {   // struck before the constellation finished assembling — plain lunge
      this.tweens.add({ targets: this.beastC, y: l.y(170) + l.u(60), duration: 160, yoyo: true, ease: 'Cubic.easeIn', onComplete: () => this.beastC.setY(l.y(170)) });
      this.time.delayedCall(220, () => land(1));
    }
  }

  scry() {
    if (this.state !== 'pick') return;
    SFX.ensure(); SFX.noise(0.4, 600, 1, 0.12, 1800);
    this.state = 'anim';
    this.run.scried = true;
    ssSigilBump('scry'); SS.save();
    this.clearHintFx();
    if (this.purifyArmed) this.setPurifyArmed(false);
    this.unselectFrom(0);
    for (let i = 0; i < 16; i++) { if (this.board[i]) { this.board[i].c.destroy(); this.board[i] = null; } }
    this.fillBoard(false);
    // SAGITTARIUS: the scry is also a loosed arrow
    if (this.sign === 'sagittarius' && this.beast.hpNow > 0) {
      const l = this.L;
      const ar = ssTxt(this, l.x(0), l.y(470), '➳', l.u(24), '#ffd77a').setOrigin(0.5).setDepth(70).setRotation(-Math.PI / 2);
      this.tweens.add({
        targets: ar, y: this.beastC.y, duration: 240, ease: 'Cubic.easeIn',
        onComplete: () => { this.starBurst.emitParticleAt(ar.x, ar.y, 6); ar.destroy(); },
      });
      this.beastHit(6);
      if (this.beast.hpNow <= 0) return;   // the arrow felled it — the death sequence takes over
    }
    if (this.hasSigil('comet')) { this.time.delayedCall(300, () => { this.state = 'pick'; }); return; }
    this.tickEnemy(() => { this.state = 'pick'; });
  }

  // The hint teaches the ORDER, not just the letters: tiles light one at a
  // time in word order, a gold thread grows from tile to tile as it goes, the
  // finished path holds long enough to read and start tracing, then fades.
  // A simultaneous highlight told you WHICH letters but never WHAT word.
  // Pacing is deliberately unhurried (Wyatt: the old beat was "way too fast")
  // — and holding is free: only a successful cast clears the fx, so the
  // player can trace the lit path while it stands.
  useHint() {
    if (this.state !== 'pick' || !this.hasSigil('tome') || this.hintUsed) return;
    const best = this.bestWord();
    if (!best) return;
    this.hintUsed = true;
    this.hintB.setAlpha(0.3); this.hintT.setAlpha(0.3);
    SFX.forge();
    const l = this.L;
    this.clearHintFx();
    const fx = this.hintFx = this.add.container(0, 0).setDepth(45);
    const line = this.add.graphics().setBlendMode('ADD');
    fx.add(line);
    // slot positions, not live containers — tiles may pop/shift under the fx
    const pts = best.map((bi) => ({ x: this.board[bi].c.x, y: this.board[bi].c.y, bi }));
    const segs = [];
    const drawAll = (a, b, t) => {
      line.clear();
      line.lineStyle(l.u(4), 0xffd77a, 0.7);
      for (const [p1, p2] of segs) { line.beginPath(); line.moveTo(p1.x, p1.y); line.lineTo(p2.x, p2.y); line.strokePath(); }
      if (a && t > 0) {
        line.beginPath(); line.moveTo(a.x, a.y);
        line.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); line.strokePath();
      }
    };
    const step = (k) => {
      if (this.hintFx !== fx) return;   // cancelled mid-reveal
      const p = pts[k];
      SFX.chime(k);   // same rising scale the taps will make — ear learns it too
      // soft halo, not a floodlight — the letter has to stay readable so the
      // player can read the word off the board as the path grows
      const g = this.add.image(p.x, p.y, 'dot').setScale(this.tileSize / 14)
        .setTint(0xffc95c).setAlpha(0).setBlendMode('ADD');
      fx.add(g);
      this.tweens.add({ targets: g, alpha: 0.55, duration: 260, ease: 'Sine.easeOut', yoyo: true, hold: 120, repeat: 0, onComplete: () => g.setAlpha(0.35) });
      const bc = this.board[p.bi] && this.board[p.bi].c;
      if (bc) this.tweens.add({ targets: bc, scale: 1.1, duration: 200, yoyo: true });
      if (k > 0) {
        const a = pts[k - 1], seg = { t: 0 };
        this.tweens.add({
          targets: seg, t: 1, duration: 440, ease: 'Sine.easeOut',
          onUpdate: () => { if (this.hintFx === fx) drawAll(a, p, seg.t); },
          onComplete: () => { if (this.hintFx === fx) { segs.push([a, p]); drawAll(null, null, 0); } },
        });
      }
      if (k + 1 < pts.length) this.time.delayedCall(650, () => step(k + 1));
      else this.time.delayedCall(5000, () => { if (this.hintFx === fx) this.clearHintFx(900); });
    };
    step(0);
  }
  clearHintFx(fade) {
    if (!this.hintFx) return;
    const fx = this.hintFx;
    this.hintFx = null;
    if (fade) this.tweens.add({ targets: fx, alpha: 0, duration: fade === true ? 450 : fade, onComplete: () => fx.destroy() });
    else fx.destroy();
  }

  // ---------- sigil pick ----------
  // Rarity gating. Campaign: rares surface from late Act I and climb with the
  // ascent, legendaries from mid Act II — power arrives with the difficulty.
  // Quick/daily: any tier can appear anywhere, but at LOW odds, so an early
  // lucky legendary stays a story, not a strategy (the legendary effects are
  // also tuned to scale — none of them flat-nukes an early beast).
  sigilChances() {
    if (this.mode === 'campaign') {
      const p = this.run.fightIdx / Math.max(1, this.fights.length - 1);
      return {
        rare: this.run.fightIdx >= 3 ? 0.12 + 0.28 * p : 0,
        leg: this.run.fightIdx >= 7 ? 0.04 + 0.14 * Math.max(0, p - 0.5) / 0.5 : 0,
      };
    }
    return { rare: 0.10, leg: 0.03 };
  }
  rollSigilOpts() {
    const { rare, leg } = this.sigilChances();
    /* THE DRIP'S ONE GATE. Every solo pick — quick, campaign and daily alike
       — draws from ssSigilOpen(), so a locked sigil can never be offered.
       The tier-fall below is what makes a thin pool safe: a dry legendary or
       rare tier falls DOWNWARD into the fat basic tier, and only a run that
       has already taken everything it is allowed to hold can come back with
       fewer than three cards (showSigilPick then centres what there is). */
    const open = ssSigilOpen();
    const pools = [0, 1, 2].map((r) => open.filter((s) => (s.rarity | 0) === r && !this.run.sigils.includes(s.id)));
    const opts = [];
    for (let k = 0; k < 3; k++) {
      const roll = rng();
      let tier = roll < leg ? 2 : roll < leg + rare ? 1 : 0;
      while (tier > 0 && !pools[tier].length) tier--;          // pool dry → fall a tier
      const pool = pools[tier].length ? pools[tier] : pools.find((p) => p.length);
      if (!pool || !pool.length) break;
      opts.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
    return opts;
  }
  showSigilPick() {
    const l = this.L;
    this.state = 'sigil';
    const opts = this.rollSigilOpts();
    if (!opts.length) { this.afterSigil(); return; }           // every sigil owned — ride on
    this.tweens.add({ targets: [this.boardC, this.lineC], alpha: 0.1, duration: 300 });
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.86, duration: 300 });
    const head = ssTxt(this, l.x(0), l.y(128), SS_T('sigilHead'), l.u(18), '#c9b676').setOrigin(0.5)
      .setShadow(0, 0, '#c9b676', l.u(10), true, true);
    const items = [veil, head];
    // pick-screen sparkles ride above the cards (added to overlayC last)
    const sparks = this.add.particles(0, 0, 'dot', {
      speed: { min: 40, max: 240 }, lifespan: { min: 300, max: 900 }, scale: { start: 0.8, end: 0 },
      tint: [0xffd77a, 0xfff2c9], blendMode: 'ADD', emitting: false,
    });
    // a short board (the drip's pool exhausted by a long climb) centres on the
    // same middle row a full one uses, rather than hanging from the top
    const cy0 = 268 + (3 - opts.length) * 84;
    opts.forEach((sg, k) => {
      const cy = l.y(cy0 + k * 168);
      const tier = sg.rarity | 0;
      const glow = this.add.image(l.x(0), cy, 'glowbig').setDisplaySize(l.u(470), l.u(240))
        .setTint(SS_RARITY[tier].glow).setAlpha(0).setBlendMode('ADD');
      const card = ssSigilCard(this, l, sg, 336, 146).setPosition(l.x(0), cy + l.u(26)).setAlpha(0);
      items.push(glow, card);
      const delay = 160 + k * 150;
      this.tweens.add({ targets: card, alpha: 1, y: cy, delay, duration: 320, ease: 'Cubic.easeOut' });
      if (tier > 0) {
        // arrival glow settles into a slow breathing pulse
        this.tweens.add({
          targets: glow, alpha: tier === 2 ? 0.22 : 0.12, delay, duration: 400,
          onComplete: () => this.tweens.add({ targets: glow, alpha: tier === 2 ? 0.10 : 0.05, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
        });
        this.time.delayedCall(delay + 280, () => {
          if (this.state !== 'sigil') return;
          if (tier === 2) {                                    // the legendary announces itself
            SFX.forge();
            this.cameras.main.flash(300, 255, 214, 120, false);
            sparks.emitParticleAt(l.x(0), cy, 22);
          } else sparks.emitParticleAt(l.x(0), cy, 8);
        });
      }
      card.on('pointerover', () => { if (this.state === 'sigil') this.tweens.add({ targets: card, scale: 1.03, duration: 120 }); });
      card.on('pointerout', () => this.tweens.add({ targets: card, scale: 1, duration: 120 }));
      card.on('pointerdown', () => {
        if (this.state !== 'sigil') return;
        this.state = 'anim';
        SFX.sigil();
        this.run.sigils.push(sg.id);
        if (sg.id === 'aegis') { this.run.hpMax += 20; this.run.hp = this.run.hpMax; }
        if (this.mode === 'campaign') this.saveCheckpoint();
        sparks.emitParticleAt(card.x, card.y, tier === 2 ? 26 : 12);
        this.tweens.add({ targets: card, scale: 1.05, duration: 130, yoyo: true });
        for (const it of items) if (it !== card && it !== sparks) this.tweens.add({ targets: it, alpha: 0, duration: 200 });
        this.time.delayedCall(260, () => {
          sparks.destroy(); for (const it of items) it.destroy();
          this.refreshDock(this.run.sigils.length - 1);   // the dock receives it with a bloom
          this.afterSigil();
        });
      });
    });
    items.push(sparks);
    this.overlayC.add(items);
    ssHealBlankTexts(this, 'sigil-pick');
  }

  // ---------- the map between fights ----------
  // Campaign only: after the sigil settles, the star chart rises — where the
  // night stands, what has been felled, what waits above — and the player
  // taps the breathing constellation to march on. Quick/daily keep their
  // straight fight → sigil → fight rhythm.
  afterSigil() {
    if (this.mode === 'campaign') this.showMap();
    else this.startFight();
  }
  showMap() {
    const l = this.L;
    this.state = 'map';
    this.tweens.add({ targets: [this.boardC, this.lineC], alpha: 0.1, duration: 300 });
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.86, duration: 300 });
    const chart = ssStarChart(this, {
      fightIdx: this.run.fightIdx,
      onEnter: () => {
        if (this.state !== 'map') return;
        this.state = 'anim';
        this.tweens.add({ targets: [veil, chart.c], alpha: 0, duration: 220 });
        this.time.delayedCall(240, () => { veil.destroy(); chart.c.destroy(); this.startFight(); });
      },
    });
    this.overlayC.add([veil, chart.c]);
    chart.c.y = l.u(16); chart.c.alpha = 0;
    this.tweens.add({ targets: chart.c, y: 0, alpha: 1, duration: 320, ease: 'Back.easeOut' });
  }

  // ---------- run end ----------
  endRun(won) {
    const l = this.L;
    this.state = 'end';
    if (this.inspectP) this.inspectP.close();   // no window may outlive the run
    // THE TOME'S PRICE — holding the Whispering Tome taxes the final score by
    // 25%. Applied here, before the books: bests, sign records, the daily
    // ledger, the beacon and the submitted leaderboard score all pay it.
    const rawScore = this.runScore();
    const tomeTax = this.hasSigil('tome');
    const score = tomeTax ? Math.round(rawScore * 0.75) : rawScore;
    const elapsed = this.runElapsed();
    if (!won) SFX.defeat();
    // best-run reference, captured before the books are updated below
    const dk = String(SSNET.dayKey());
    let prevBest = -1;                                     // -1 = no best line for this mode/result
    if (won && this.mode === 'quick') prevBest = SS.prof.bestQuick;
    if (won && this.mode === 'campaign') prevBest = SS.prof.bestCampaign;
    if (this.mode === 'daily') prevBest = SS.prof.daily[dk] | 0;
    if (won && this.mode === 'quick') {
      SS.award('star-caller', this.game);
      if (!this.run.scried) SS.award('no-scry', this.game);
      if (score > SS.prof.bestQuick) SS.prof.bestQuick = score;
    }
    if (won && this.mode === 'campaign') {
      SS.award('sky-sweeper', this.game);
      if (score > SS.prof.bestCampaign) SS.prof.bestCampaign = score;
    }
    // the sign's own ledger — best is a winning-run score, like bestCampaign
    if (this.mode === 'campaign' && this.sign) {
      const sr = SS.prof.signs[this.sign] || (SS.prof.signs[this.sign] = { best: 0, clears: 0, runs: 0 });
      sr.runs++;
      if (won) {
        sr.clears++;
        if (score > sr.best) sr.best = score;
        SS.award('sign-born', this.game);
        const cleared = Object.keys(SS.prof.signs).filter((k) => SS.prof.signs[k].clears > 0).length;
        if (cleared >= 3) SS.award('wheel-walker', this.game);
        if (cleared >= 12) SS.award('grand-zodiac', this.game);
      }
    }
    if (this.mode === 'campaign') ssClearCampaign();
    let streak = null;
    if (this.mode === 'daily') {
      SS.award('daily-devout', this.game);
      if (!SS.prof.daily[dk] || score > SS.prof.daily[dk]) SS.prof.daily[dk] = score;
      // THE FLAME — tonight's hunt feeds the lantern. Win or lose, like the
      // daily's own ledger: this counts having HUNTED, not having won. A
      // second run tonight is the same night and changes nothing.
      streak = ssStreakNote();
      // the marks the flame now satisfies. award() is idempotent, so this
      // both rings a fresh crossing and quietly settles up with a player who
      // arrived already deep into a streak the marks did not exist for yet.
      streak.marks.forEach((m) => SS.award(SS_MS_ACH[m], this.game));
    }
    // the rating stirs: a win pays by mode, a mighty word pays a pinch — all
    // through the PvE gate (daily cap + diminishing), so solo play can seed a
    // rating but never inflate one past what versus supports
    let rDelta = 0;
    if (won) rDelta += SS_RATING.pve(this.mode === 'campaign' ? 10 : 5);
    if (this.run.bigHit >= 60) rDelta += SS_RATING.pve(3);
    else if (this.run.bigHit >= 40) rDelta += SS_RATING.pve(1);
    if (won) SS.prof.wins++;
    SS.save(); SS.sync();
    /* THE DRIP settles here and nowhere else in a battle: the volley is over,
       the books are closed, and a LOSS that finished a condition finishes it
       exactly as a win would. `pend` is read rather than the fresh ids, so a
       notice an earlier run never got to say is said now. */
    ssSigilCheck();
    const unlocked = ssSigilPending();
    // mode rides along: only daily runs may land on the daily board (the
    // weekly takes any run; campaign still only when the whole climb is won)
    if (this.mode !== 'campaign' || won) SSNET.submitScore(score, this.run.longest, PACK.lang, this.mode);

    this.tweens.add({ targets: [this.boardC, this.lineC], alpha: 0.1, duration: 300 });
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: won ? 0.7 : 0.8, duration: won ? 300 : 550 });
    // THE FANFARE — a triumph beat lands before the window; the window waits
    // it out. A campaign win (the whole long night) reads biggest. Losses
    // keep their quiet veil.
    let fanWait = 0;
    if (won) fanWait = ssWinFanfare(this, this.mode === 'campaign' ? 3 : 1,
      { text: SS_T(this.mode === 'campaign' ? 'fanCamp' : 'fanWin') });
    const items = [];

    // the window: an opaque midnight/gold panel, sized to its contents (the
    // daily carries two extra rows: the flame line and the share button)
    // (the daily carries three extra rows now: the flame, the lantern's own
    // note — a mark crossed, or where the grace night stands — and the share)
    const ph = this.mode === 'daily' ? 672 : 566;
    const top = 410 - ph / 2;
    const py = (d) => l.y(top + d);
    items.push(this.add.image(l.x(0), py(ph / 2), 'endpanel').setDisplaySize(l.u(372), l.u(ph)));

    const title = ssTxt(this, l.x(0), py(42), SS_T(won ? 'endWin' : 'endLose'), l.u(24), won ? '#ffe9a8' : '#e66a6a').setOrigin(0.5)
      .setShadow(0, 0, won ? '#c9b676' : '#802020', l.u(12), true, true);
    items.push(title);
    items.push(ssTxt(this, l.x(0), py(70), SS_T(won ? 'endWinSub' : 'endLoseSub'), l.u(12), won ? '#c9b676' : '#8f8090', 'italic').setOrigin(0.5));
    const rule = (d) => items.push(this.add.rectangle(l.x(0), py(d), l.u(316), Math.max(1, l.u(1)), 0xc9a84c, 0.35));
    rule(92);

    // the score, in gold letterpress, with the best-run reference under it
    items.push(ssTxt(this, l.x(0), py(112), SS_T('stScore'), l.u(11), '#8f8873').setOrigin(0.5));
    const gk = ssGoldTex(this, String(score), 30);
    items.push(this.add.image(l.x(0), py(140), gk.key).setDisplaySize(l.u(gk.w), l.u(gk.h)));
    // the bargain stated where it bit — the score shown already paid it
    if (tomeTax) items.push(ssTxt(this, l.x(0), py(163), SS_T('endTomeTax'), l.u(9.5), '#cf8fa0', 'italic').setOrigin(0.5));
    const bestY = tomeTax ? 178 : 170;
    if (prevBest >= 0 && score > prevBest && prevBest > 0) {
      const nb = ssTxt(this, l.x(0), py(bestY), SS_T('newBest'), l.u(14), '#ffe9a8').setOrigin(0.5)
        .setShadow(0, 0, '#c9b676', l.u(10), true, true);
      items.push(nb);
      this.tweens.add({ targets: nb, alpha: 0.55, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1000 });
    } else if (prevBest > 0) {
      items.push(ssTxt(this, l.x(0), py(bestY), SS_T('stBest', prevBest), l.u(12), '#8f8873').setOrigin(0.5));
    }

    // the finest word gets the nameplate treatment
    items.push(ssTxt(this, l.x(0), py(196), SS_T('stFinest'), l.u(11), '#8f8873').setOrigin(0.5));
    if (this.run.longest) {
      const wk = ssGoldTex(this, this.run.longest.toUpperCase(), 20);
      const sc = Math.min(1, 300 / wk.w);
      items.push(this.add.image(l.x(0), py(222), wk.key).setDisplaySize(l.u(wk.w * sc), l.u(wk.h * sc)));
    } else {
      items.push(ssTxt(this, l.x(0), py(222), '—', l.u(18), '#d8d2bd').setOrigin(0.5));
    }
    rule(246);

    // the ledger: label left, value right
    const mins = Math.floor(elapsed / 60000), secs = Math.floor(elapsed / 1000) % 60;
    const rows = [
      [SS_T('stBeasts'), this.run.fightIdx + ' / ' + this.fights.length],
      [SS_T('stWords'), String(this.run.words)],
      [SS_T('stLetters'), String(this.run.letters)],
      [SS_T('stBigHit'), this.run.bigHit ? String(this.run.bigHit) : '—'],
      [SS_T('stTime'), mins + ':' + String(secs).padStart(2, '0')],
    ];
    rows.forEach(([k, v], i) => {
      items.push(ssTxt(this, l.x(-150), py(266 + i * 26), k, l.u(13), '#a89f85').setOrigin(0, 0.5));
      items.push(ssTxt(this, l.x(150), py(266 + i * 26), v, l.u(13.5), '#e8e0c8').setOrigin(1, 0.5));
    });

    // sigils held, as their icons — and TAPPABLE: the whole row opens the
    // inspector so a finished run can still be read (Wyatt's TestFlight ask).
    // The panel must outrank overlayC (100), hence the depth.
    items.push(ssTxt(this, l.x(-150), py(400), SS_T('stSigils'), l.u(13), '#a89f85').setOrigin(0, 0.5));
    const glyphs = this.run.sigils.map((id) => (SS_SIGILS.find((s) => s.id === id) || {}).icon || '✦');
    items.push(ssTxt(this, l.x(150), py(400), glyphs.length ? glyphs.join(' ') : '—', l.u(glyphs.length > 10 ? 12 : 14), '#d7b45c').setOrigin(1, 0.5)
      .setShadow(0, 0, '#c9b676', l.u(6), true, true));
    if (this.run.sigils.length || this.signZ) {
      const sigZone = this.add.zone(l.x(0), py(400), l.u(384), l.u(34)).setOrigin(0.5).setInteractive({ useHandCursor: true });
      sigZone.on('pointerdown', () => {
        if (this.endInspectP) return;
        SFX.ui();
        this.endInspectP = ssSigilPanel(this, {
          sigils: this.run.sigils, sign: this.signZ, sleeping: true, depth: 130,
          onClose: () => { this.endInspectP = null; },
        });
      });
      items.push(sigZone);
    }

    // the rating readout — when the number moved, show it move
    if (rDelta) {
      const rTier = ssRatingTier(SS.prof.rating);
      items.push(ssTxt(this, l.x(0), py(this.mode === 'daily' ? 421 : 428), '✦ +' + rDelta + '  ·  ' + SS.prof.rating + ' ' + SS_T(rTier.key), l.u(11), '#ffd77a').setOrigin(0.5)
        .setShadow(0, 0, '#c9b676', l.u(6), true, true));
    }

    let by = 470;
    if (this.mode === 'daily') {
      // THE ONE LINE: what tonight did to the flame. The first night lights
      // the lantern; every night after names its number.
      const sn = (streak && streak.n) || 1;
      const flame = ssTxt(this, l.x(0), py(448), '🔥 ' + (sn <= 1 ? SS_T('stkLit') : SS_T('stkNight', sn)),
        l.u(15), '#ffb457').setOrigin(0.5).setShadow(0, 0, '#a8520d', l.u(9), true, true);
      items.push(flame);
      // it breathes like the lantern it feeds
      this.tweens.add({ targets: flame, alpha: 0.72, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: (fanWait || 0) + 700 });
      /* …and one line beneath it for what the flame's own night cost or won:
         a mark just crossed (the meadow will hold the ceremony), the grace
         night this very hunt spent, or simply where the safety net stands. */
      let note;
      if (streak && streak.ms) {
        note = ssTxt(this, l.x(0), py(470), '✦ ' + ssMarkCopy(streak.ms).name + ' ✦', l.u(12.5), '#ffd77a').setOrigin(0.5)
          .setShadow(0, 0, '#c9b676', l.u(8), true, true);
      } else if (streak && streak.ev === 'graced') {
        note = ssTxt(this, l.x(0), py(470), '◌ ' + SS_T('stkGraced'), l.u(11.5), '#ffb457').setOrigin(0.5)
          .setShadow(0, 0, '#a8520d', l.u(6), true, true);
      } else {
        const gl2 = ssGraceLine();
        note = ssTxt(this, l.x(0), py(470), gl2.text, l.u(10.5), gl2.color, 'italic').setOrigin(0.5);
      }
      items.push(note);
      const share = this.add.image(l.x(0), py(508), ssBtn(this, true, 240, 44)).setDisplaySize(l.u(240), l.u(44)).setInteractive({ useHandCursor: true });
      const shareT = ssTxt(this, l.x(0), py(508), SS_T('shareBtn'), l.u(13), '#9fb0e8').setOrigin(0.5);
      items.push(share, shareT);
      /* Fires on the UP, not the down: iOS grants the clipboard only inside
         a user activation, and Phaser's pointerdown comes from touchstart,
         which is not one — touchend is (versus's share buttons learned this
         first; vsOnTap is their arm-on-down/fire-on-up pattern). */
      vsOnTap(share, () => {
        // the spoiler-free card (ssShareCard). The streak line rides on
        // tonight's own count when the lantern exists at all, and the card
        // simply omits it otherwise — nothing here may depend on it.
        const txt = ssShareCard({
          score, felled: this.run.fightIdx, beasts: this.fights.length,
          wordLen: (this.run.longest || '').length,
          streak: (streak && streak.n) || (typeof ssStreakCount === 'function' ? ssStreakCount() : 0),
        });
        ssCopyText(txt).then((okd) => {
          if (shareT.active) shareT.setText(SS_T(okd ? 'shareCopied' : 'shareFail'));
        });
      });
      by = 564;
    }
    const again = this.add.image(l.x(0), py(by), ssBtn(this, false, 240, 56)).setDisplaySize(l.u(240), l.u(56)).setInteractive({ useHandCursor: true });
    const againT = ssTxt(this, l.x(0), py(by), SS_T(won || this.mode !== 'campaign' ? 'newRun' : 'tryAgain'), l.u(17), BTN_INK()).setOrigin(0.5);
    const homeB = this.add.image(l.x(0), py(by + 58), ssBtn(this, true, 240, 46)).setDisplaySize(l.u(240), l.u(46)).setInteractive({ useHandCursor: true });
    const homeT = ssTxt(this, l.x(0), py(by + 58), SS_T('home'), l.u(14), '#9fb0e8').setOrigin(0.5);
    items.push(again, againT, homeB, homeT);
    again.on('pointerdown', () => {
      SFX.ui();
      // a campaign retry keeps the sign you climbed under; only the meadow's
      // NEW CAMPAIGN asks the stars again
      if (this.mode === 'campaign' && this.sign) { try { localStorage.setItem('beta3.campsign', this.sign); } catch (e) { } }
      this.scene.restart({ mode: this.mode, resume: null });
    });
    // the Act III payoff: win the campaign and you descend into sunrise
    homeB.on('pointerdown', () => { SFX.ui(); this.goHome({ from: won ? 'battle' : 'defeat', dawn: won && this.mode === 'campaign' }); });
    this.overlayC.add([veil, ...items]);
    ssHealBlankTexts(this, 'end-screen');

    // while the fanfare plays, the window's (invisible) buttons can't eat taps
    if (fanWait) {
      const lock = items.filter((o) => o.input);
      lock.forEach((o) => { o.input.enabled = false; });
      this.time.delayedCall(fanWait, () => lock.forEach((o) => { if (o.active && o.input) o.input.enabled = true; }));
    }
    // entrance: the window settles up into place; a defeat sinks in more slowly
    items.forEach((it) => { it.y += l.u(16); it.alpha = 0; });
    this.tweens.add({ targets: items, y: '-=' + l.u(16), alpha: 1, duration: won ? 380 : 600, ease: won ? 'Back.easeOut' : 'Sine.easeOut', delay: won ? fanWait : 250 });
    if (won) this.time.delayedCall(fanWait + 180, () => {  // gold motes crown a victory
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, r = l.u(30 + rng() * 40);
        const m = this.add.image(title.x, title.y - l.u(16), 'dot').setScale(0.5 + rng() * 0.5)
          .setTint(0xffe9a8).setBlendMode('ADD').setDepth(101);
        this.overlayC.add(m);
        this.tweens.add({ targets: m, x: title.x + Math.cos(a) * r * 2.4, y: title.y - l.u(16) + Math.sin(a) * r, alpha: 0, scale: 0.1, duration: 900 + rng() * 500, ease: 'Cubic.easeOut', onComplete: () => m.destroy() });
      }
    });

    // the discovery rides in after the window has settled (and after any
    // fanfare) — never over the top of a triumph beat
    if (unlocked.length) this.time.delayedCall((fanWait || 0) + 1400, () => ssSigilAnnounce(this, unlocked));

    if (DEMO) {
      localStorage.setItem('beta3.result', JSON.stringify({ won, mode: this.mode, score, words: this.run.words, longest: this.run.longest, letters: this.run.letters, bigHit: this.run.bigHit, elapsed, rating: SS.prof.rating, rd: rDelta }));
      this.time.delayedCall(2500, () => again.emit('pointerdown'));
    }
  }

  // ---------- solver (hint + demo) ----------
  buildTrie() {
    // one trie per language, cached for the session — a versus battle in
    // another tongue must not hint from the solo language's words
    Battle.tries = Battle.tries || {};
    if (!Battle.tries[PACK.lang]) {
      const root = {};
      for (const w of WORDSET) {
        if (w.length > 8) continue;
        let n = root;
        for (const ch of w) n = n[ch] || (n[ch] = {});
        n.$ = true;
      }
      Battle.tries[PACK.lang] = root;
    }
    this.trie = Battle.tries[PACK.lang];
  }
  bestWord() {
    this.buildTrie();
    const tiles = this.board.map((s, i) => ({ i, s })).filter((x) => x.s);
    let best = null, bestScore = -1;
    const used = new Array(tiles.length).fill(false);
    const pick = [];
    const dive = (node) => {
      if (node.$ && pick.length >= 2) {
        const dmg = this.wordDamage(pick.map((k) => tiles[k].s));
        if (dmg > bestScore) { bestScore = dmg; best = pick.map((k) => tiles[k].i); }
      }
      if (pick.length >= 8) return;
      const seen = new Set();
      for (let k = 0; k < tiles.length; k++) {
        if (used[k]) continue;
        const key = tiles[k].s.ch + ':' + tiles[k].s.tier + (tiles[k].s.blk ? ':b' : '');
        if (seen.has(key)) continue;
        seen.add(key);
        let n = node, ok = true;
        for (const ch of tiles[k].s.ch) { n = n[ch]; if (!n) { ok = false; break; } }
        if (!ok) continue;
        used[k] = true; pick.push(k);
        dive(n);
        used[k] = false; pick.pop();
      }
    };
    dive(this.trie);
    return best;
  }
  demoStep() {
    if (this.state === 'map') {
      const ch = this.overlayC.list.find((o) => o.getData && o.getData('mapZone'));
      const z = ch && ch.getData('mapZone');
      if (z && z.active) z.emit('pointerdown');
      return;
    }
    if (this.state === 'sigil') {
      if (!this.sigilShownAt) this.sigilShownAt = this.time.now;
      if (this.time.now - this.sigilShownAt > 2200) {
        this.sigilShownAt = 0;
        const cards = this.overlayC.list.filter((o) => o.getData && o.getData('sigilCard'));
        if (cards.length) cards[Math.floor(Math.random() * cards.length)].emit('pointerdown');
      }
      return;
    }
    if (this.state !== 'pick' || this.sel.length) return;
    const best = this.bestWord();
    if (!best) { this.scry(); return; }
    best.forEach((bi, k) => this.time.delayedCall(k * 120, () => this.tapTile(bi)));
    this.time.delayedCall(best.length * 120 + 320, () => this.tryCast());
    localStorage.setItem('beta3.stat', JSON.stringify({
      v: BUILD, mode: this.mode, fight: this.run.fightIdx, hp: this.run.hp,
      words: this.run.words, longest: this.run.longest, score: this.runScore(), t: Date.now(),
    }));
  }
}

/* ============================================================
   PROFILE
   ============================================================ */
class Profile extends Phaser.Scene {
  constructor() { super('profile'); }
  create() {
    const l = ssLayout(this);
    this.skiesP = null;          // scene instances persist across restarts

    ssMakeTextures(this);
    ssStarfield(this, 90);

    const back = ssTxt(this, l.x(-195), l.y(24), '‹ HOME', l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.ui(); this.scene.start('home'); });

    ssTxt(this, l.x(0), l.y(60), '— STARGAZER —', l.u(13), '#8a94c4').setOrigin(0.5);
    this.nameT = ssTxt(this, l.x(0), l.y(92), SSNET.myName(), l.u(26), '#f3e5b4').setOrigin(0.5)
      .setShadow(0, 0, '#c9a94f', l.u(12), true, true).setInteractive({ useHandCursor: true });
    ssTxt(this, l.x(0), l.y(120), 'tap your name to change it', l.u(10), '#5a6390', 'italic').setOrigin(0.5);
    this.nameT.on('pointerdown', () => this.editName(l));

    const p = SS.prof;

    // the star rating, right under the name — tap it for your own card; the
    // line below veils/unveils it from other stargazers (you always see yours)
    const rTier = ssRatingTier(p.rating);
    const ratingT = ssTxt(this, l.x(0), l.y(139), rTier.glyph + ' ' + p.rating + ' · ' + SS_T(rTier.key), l.u(12.5), rTier.color).setOrigin(0.5)
      .setShadow(0, 0, rTier.color, l.u(6), true, true).setInteractive({ useHandCursor: true });
    ratingT.on('pointerdown', () => ssRatingCard(this, { own: true }));
    const veilT = ssTxt(this, l.x(0), l.y(156), '', l.u(8.5), '#5a6390', 'italic').setOrigin(0.5).setInteractive({ useHandCursor: true });
    const dressVeil = () => veilT.setText(SS_T('rVeilRow') + ':  ' + (SS.prof.rhide ? '☾ ' + SS_T('rVeiled') : '✦ ' + SS_T('rShown')));
    dressVeil();
    veilT.on('pointerdown', () => { SFX.ui(); SS.prof.rhide = !SS.prof.rhide; SS.save(); SS.sync(); dressVeil(); });

    /* THE DOOR TO THE NIGHT'S FINEST (v0.52.0, Wyatt 8/25): the leaderboard
       left the meadow's column and lives here, right under your standing —
       the same dress as the sky door below. The Board is told where it was
       opened from so its back link returns HERE, never to the meadow. */
    const lbB = this.leaderB = this.add.image(l.x(0), l.y(179), ssBtn(this, true, 236, 34)).setDisplaySize(l.u(236), l.u(34))
      .setInteractive({ useHandCursor: true });
    const lbT = this.leaderT = ssTxt(this, l.x(0), l.y(179), '✦  ' + SS_T('board') + '  ›', l.u(12.5), '#e8c86a')
      .setOrigin(0.5).setShadow(0, 0, '#c9a94f', l.u(7), true, true);
    // a long word for it (CLASIFICACIÓN, لوحة الصدارة) fits the door, never spills it
    if (lbT.width > l.u(216)) lbT.setScale(l.u(216) / lbT.width);
    const openBoard = () => { SFX.ui(); this.scene.start('board', { from: 'profile' }); };
    lbB.on('pointerdown', openBoard);
    lbT.setInteractive({ useHandCursor: true }).on('pointerdown', openBoard);

    const rows = [
      ['runs begun', p.runs], ['runs won', p.wins], ['beasts felled', p.beasts],
      ['words woven', p.words], ['finest word', p.longest ? p.longest.toUpperCase() : '—'],
      ['mightiest hit', p.bigHit || '—'], ['best quick play', p.bestQuick || '—'],
      ['versus victories', p.vsWins || '—'],
    ];
    // 23 apart, not 26: the leaderboard's door had to come from somewhere,
    // and the ledger's own rows were the only slack above the sky door
    rows.forEach(([k, v], i) => {
      const y = l.y(205 + i * 23);
      ssTxt(this, l.x(-150), y, k, l.u(13), '#8a94c4').setOrigin(0, 0.5);
      ssTxt(this, l.x(150), y, String(v), l.u(13), '#f0e8d2').setOrigin(1, 0.5);
    });

    // the zodiac strip: every campaign sign, burning gold once cleared under.
    // Cleared glyphs wear their element color's glow; the rest hang dim.
    SS_ZODIAC.forEach((z, i) => {
      const x = l.x(-165 + i * 30), y = l.y(386);
      const sr = p.signs[z.id];
      const cleared = !!(sr && sr.clears > 0);
      ssZodiacGlyph(this, z, l.u(0.085), x, y, cleared ? 0xffd77a : 0x39406b, cleared ? 1 : 0.8);
    });

    /* THE DOOR TO THE SKY (v0.43.0). The gallery has to be reachable from
       somewhere that is not a battle, because the whole point of the sleeping
       list is the bar you are chasing between runs. It reads out how much of
       the sky you hold, and opens the same panel the inspector does — held
       above, STILL SLEEPING below. */
    const doorB = this.add.image(l.x(0), l.y(412), ssBtn(this, true, 236, 34)).setDisplaySize(l.u(236), l.u(34))
      .setInteractive({ useHandCursor: true });
    const doorT = ssTxt(this, l.x(0), l.y(412), '', l.u(12.5), '#e8c86a')
      .setOrigin(0.5).setShadow(0, 0, '#c9a94f', l.u(7), true, true);
    // the count is DRESSED, never baked: a rite can hand a sigil over while
    // this scene is alive, and a door still reading 12 / 24 would be a lie
    const dressDoor = () => doorT.setText('✦  ' + SS_T('skiesTitle') + '  ' + ssSigilOpen().length + ' / ' + SS_SIGILS.length + '  ›');
    dressDoor();
    const openSkies = () => {
      if (this.skiesP) return;
      SFX.ui();
      // read the sky as it stands RIGHT NOW — what the drip handed over since
      // this scene was built belongs above the STILL SLEEPING rule, not under
      this.skiesP = ssSigilPanel(this, {
        sigils: ssSigilOpen().map((s) => s.id), sleeping: true, title: 'skiesTitle', depth: 120,
        onClose: () => { this.skiesP = null; dressDoor(); },
      });
    };
    doorB.on('pointerdown', openSkies);
    doorT.setInteractive({ useHandCursor: true }).on('pointerdown', openSkies);

    ssTxt(this, l.x(0), l.y(441), '— ACHIEVEMENTS  ' + Object.keys(p.ach).length + ' / ' + SS_ACH.length + ' —', l.u(13), '#c9b676').setOrigin(0.5);
    // the grid is 23 deep now (the lantern's three marks) — 12 rows at 27
    // apart is the last spacing that keeps the whole ledger above the seal
    // (and 25 under the heading: at 20 the first row's names kissed it)
    SS_ACH.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = l.x(col === 0 ? -100 : 100), y = l.y(466 + row * 27);
      const got = !!p.ach[a.id];
      ssTxt(this, x - l.u(88), y, a.icon, l.u(14), got ? '#ffd77a' : '#39406b').setOrigin(0.5);
      ssTxt(this, x - l.u(68), y - l.u(7.5), a.name, l.u(10.5), got ? '#f0e8d2' : '#4a5480').setOrigin(0, 0.5);
      ssTxt(this, x - l.u(68), y + l.u(8.5), a.desc, l.u(8), got ? '#8a94c4' : '#39406b', 'italic').setOrigin(0, 0.5);
    });

    ssTxt(this, l.x(0), l.y(784), 'seal: ' + SSNET.uid().slice(0, 12) + ' · ' + (SSNET.mode === 'local' ? 'offline' : 'synced'), l.u(9), '#39406b').setOrigin(0.5);
  }
  editName(l) {
    SFX.ui();
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.maxLength = 18;
    inp.value = SSNET.myName();
    inp.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:9999;font:700 ' +
      Math.round(l.u(20)) + 'px Georgia,serif;text-align:center;background:#141a33;color:#f3e5b4;border:2px solid #c9a94f;border-radius:10px;padding:8px 14px;outline:none;width:70%;max-width:320px;';
    // commitOnShutdown: backing out mid-rename still keeps what was typed
    ssDomInput(this, inp, (v) => {
      const n = SSNET.setName(v);
      if (this.nameT.active) this.nameT.setText(n);
      SS.sync();
    }, true);
    inp.select();
  }
}

/* ============================================================
   LEADERBOARD — the night's finest, held like a ceremony:
   a medallion podium for the top three, glass pills for the
   roll below, your own row in gold wherever you stand, and
   the reset clock ticking over both boards.
   ============================================================ */
class Board extends Phaser.Scene {
  constructor() { super('board'); }
  create(data) {
    const l = ssLayout(this);
    ssMakeTextures(this);
    ssStarfield(this, 110);
    // a faint gold dawn crowns the summit of the list
    this.add.image(l.x(0), l.y(160), 'glowbig').setScale(l.u(2.6)).setTint(0xd7b45c).setAlpha(0.05).setBlendMode('ADD');

    // back goes to whoever opened the board — the profile since v0.52.0 —
    // and the meadow when nobody said (a scene restart, a stray call)
    this.from = data && data.from === 'profile' ? 'profile' : 'home';
    // Phaser keeps a scene's last start data for a start() that passes none
    // — spend it, so a bare restart of the board comes home, not somewhere stale
    this.scene.settings.data = {};
    const back = ssTxt(this, l.x(-195), l.y(24), '‹ ' + SS_T(this.from), l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.ui(); this.scene.start(this.from); });

    // the title in the wordmark's gold letterpress, flanked by flourishes
    const tk = ssGoldTex(this, SS_T('lbTitle'), 19);
    const tsc = Math.min(1, 320 / tk.w);
    this.add.image(l.x(0), l.y(58), tk.key).setDisplaySize(l.u(tk.w * tsc), l.u(tk.h * tsc));
    for (const s of [-1, 1]) {
      ssTxt(this, l.x(s * (tk.w * tsc / 2 + 20)), l.y(58), '✦', l.u(12), '#c9b676').setOrigin(0.5)
        .setShadow(0, 0, '#c9b676', l.u(6), true, true);
    }

    // tabs: two pills — the active board wears the gold
    this.tab = 'daily';
    this.tabBtns = {};
    const mkTab = (key, dx, label) => {
      const bg = this.add.image(l.x(dx), l.y(104), ssBtn(this, true, 150, 38)).setDisplaySize(l.u(150), l.u(38)).setInteractive({ useHandCursor: true });
      const lab = ssTxt(this, l.x(dx), l.y(104), label, l.u(14), '#5a6390').setOrigin(0.5);
      bg.on('pointerdown', () => this.setTab(key));
      this.tabBtns[key] = { bg, lab };
    };
    mkTab('daily', -80, SS_T('lbDaily'));
    mkTab('weekly', 80, SS_T('lbWeekly'));
    this.dressTabs(l);

    // the reset clock, ticking every second. Both flips are UTC (daily 00:00,
    // weekly Monday 00:00) so the countdown is the same for the whole planet,
    // worded in the player's own units.
    this.cdT = ssTxt(this, l.x(0), l.y(138), '', l.u(11.5), '#c9b676').setOrigin(0.5);
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tickCd() });
    this.tickCd();

    if (SSNET.mode === 'local') {
      ssTxt(this, l.x(0), l.y(772), '· ' + SS_T('lbLocal') + ' ·', l.u(9.5), '#8c5a5a', 'italic').setOrigin(0.5);
    }
    this.rowsC = this.add.container(0, 0);
    this.loadingT = ssTxt(this, l.x(0), l.y(340), SS_T('lbLoading'), l.u(13), '#5a6390', 'italic').setOrigin(0.5);
    this.refresh();
  }
  dressTabs(l) {
    for (const [key, t] of Object.entries(this.tabBtns)) {
      const on = key === this.tab;
      t.bg.setTexture(ssBtn(this, !on, 150, 38)).setDisplaySize(l.u(150), l.u(38));
      t.lab.setColor(on ? BTN_INK() : '#5a6390');
    }
  }
  tickCd() {
    if (!this.cdT || !this.cdT.active) return;
    const daily = this.tab === 'daily';
    const ms = daily ? SSNET.msToNextDay() : SSNET.msToNextWeek();
    this.cdT.setText((daily ? '☾ ' : '✦ ') + SS_T(daily ? 'lbNewSky' : 'lbWeekEnds', ssCountdownLive(ms)));
  }
  setTab(t) {
    if (this.tab === t) return;
    SFX.ui();
    this.tab = t;
    this.dressTabs(ssLayout(this));
    this.tickCd();
    this.refresh();
  }
  async refresh() {
    const l = ssLayout(this);
    if (this.rowsC.list.length) this.tweens.killTweensOf(this.rowsC.list);
    this.rowsC.removeAll(true);
    this.loadingT.setVisible(true);
    const tab = this.tab;
    const b = await SSNET.getBoard(tab, ssGameLang());
    if (this.tab !== tab || !this.scene.isActive()) return;
    this.loadingT.setVisible(false);
    if (!b.rows.length) {
      this.rowsC.add(ssTxt(this, l.x(0), l.y(340), SS_T('lbEmpty'), l.u(13), '#5a6390', 'italic').setOrigin(0.5));
      return;
    }
    const meId = SSNET.uid();
    const ent = [];                       // entrance-animated, in cascade order
    const trim = (t2, w) => { while (t2.width > l.u(w) && t2.text.length > 2) t2.setText(t2.text.slice(0, -2) + '…'); return t2; };

    // ---- the podium: three medallions afloat in the dusk, champion highest ----
    const POD = [
      { dx: 0, my: 216, r: 38, big: 18, glow: 0xffd77a, ga: 0.2 },
      { dx: -132, my: 240, r: 29, big: 14, glow: 0xcfd8ff, ga: 0.11 },
      { dx: 132, my: 248, r: 26, big: 13, glow: 0xe8b57f, ga: 0.1 },
    ];
    b.rows.slice(0, 3).forEach((r, i) => {
      const P = POD[i], me = r.id === meId;
      const glow = this.add.image(l.x(P.dx), l.y(P.my), 'glowbig').setDisplaySize(l.u(P.r * 5.2), l.u(P.r * 5.2))
        .setTint(P.glow).setAlpha(P.ga).setBlendMode('ADD');
      this.rowsC.add(glow);
      if (i === 0) this.tweens.add({ targets: glow, alpha: P.ga * 0.45, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const grp = [];
      grp.push(this.add.image(l.x(P.dx), l.y(P.my), ssMedalTex(this, i)).setDisplaySize(l.u(P.r * 2), l.u(P.r * 2)));
      grp.push(ssTxt(this, l.x(P.dx), l.y(P.my), String(i + 1), l.u(P.r * 0.95), SS_MEDAL_INK[i]).setOrigin(0.5, 0.55));
      if (me) grp.push(ssTxt(this, l.x(P.dx), l.y(P.my - P.r - 14), '✦ ' + SS_T('lbYou') + ' ✦', l.u(10), '#ffe9a8').setOrigin(0.5)
        .setShadow(0, 0, '#c9b676', l.u(6), true, true));
      const pnm = trim(ssTxt(this, l.x(P.dx), l.y(P.my + P.r + 15), r.name, l.u(i === 0 ? 13.5 : 12), me ? '#ffe9a8' : '#e8e0c8').setOrigin(0.5), 124)
        .setInteractive({ useHandCursor: true });
      pnm.on('pointerdown', () => ssRatingCard(this, { uid: r.id, name: r.name }));
      grp.push(pnm);
      const gk = ssGoldTex(this, String(r.score), P.big);
      grp.push(this.add.image(l.x(P.dx), l.y(P.my + P.r + 37), gk.key).setDisplaySize(l.u(gk.w), l.u(gk.h)));
      if (r.word) grp.push(trim(ssTxt(this, l.x(P.dx), l.y(P.my + P.r + 56), r.word, l.u(9), '#8a94c4', 'italic').setOrigin(0.5), 124));
      ent.push(...grp);
      this.rowsC.add(grp);
    });
    // gold motes crown the champion as the podium settles
    this.time.delayedCall(280, () => {
      if (this.tab !== tab || !this.scene.isActive()) return;
      const em = this.add.particles(0, 0, 'dot', {
        speed: { min: 20, max: 90 }, lifespan: { min: 400, max: 1000 }, scale: { start: 0.6, end: 0 },
        alpha: { start: 0.9, end: 0 }, tint: [0xffd77a, 0xfff2c9], blendMode: 'ADD', emitting: false,
      });
      this.rowsC.add(em);
      em.emitParticleAt(l.x(0), l.y(216), 16);
      this.time.delayedCall(1200, () => em.destroy());
    });

    // ---- the roll: ranks 4-10 on glass pills ----
    b.rows.slice(3, 10).forEach((r, k) => {
      const y = l.y(392 + k * 40), me = r.id === meId;
      const grp = [];
      grp.push(this.add.image(l.x(0), y, 'ribbon').setDisplaySize(l.u(384), l.u(34)));
      if (me) grp.push(this.add.rectangle(l.x(0), y, l.u(376), l.u(28), 0xd7b45c, 0.13));
      grp.push(ssTxt(this, l.x(-172), y, '#' + (k + 4), l.u(11), me ? '#ffd77a' : '#8a94c4').setOrigin(0, 0.5));
      const rnm = trim(ssTxt(this, l.x(-140), y, r.name, l.u(13), me ? '#ffe9a8' : '#f0e8d2').setOrigin(0, 0.5), 176)
        .setInteractive({ useHandCursor: true });
      rnm.on('pointerdown', () => ssRatingCard(this, { uid: r.id, name: r.name }));
      grp.push(rnm);
      if (r.word) grp.push(ssTxt(this, l.x(64), y, r.word, l.u(9.5), '#5a6390', 'italic').setOrigin(0, 0.5));
      grp.push(ssTxt(this, l.x(172), y, String(r.score), l.u(13.5), me ? '#ffe9a8' : '#d8d2bd').setOrigin(1, 0.5));
      ent.push(...grp);
      this.rowsC.add(grp);
    });

    // ---- you, wherever you stand ----
    if (b.me >= 0) {
      const grp = [];
      if (b.me >= 10 && b.rows[b.me]) {
        const y = l.y(688), r = b.rows[b.me];
        grp.push(this.add.image(l.x(0), y, 'ribbon').setDisplaySize(l.u(384), l.u(34)));
        grp.push(this.add.rectangle(l.x(0), y, l.u(376), l.u(28), 0xd7b45c, 0.13));
        grp.push(ssTxt(this, l.x(-172), y, '#' + (b.me + 1), l.u(11), '#ffd77a').setOrigin(0, 0.5));
        const ynm = trim(ssTxt(this, l.x(-130), y, r.name, l.u(13), '#ffe9a8').setOrigin(0, 0.5), 166)
          .setInteractive({ useHandCursor: true });
        ynm.on('pointerdown', () => ssRatingCard(this, { own: true }));
        grp.push(ynm);
        if (r.word) grp.push(ssTxt(this, l.x(64), y, r.word, l.u(9.5), '#8a94c4', 'italic').setOrigin(0, 0.5));
        grp.push(ssTxt(this, l.x(172), y, String(r.score), l.u(13.5), '#ffe9a8').setOrigin(1, 0.5));
      }
      grp.push(ssTxt(this, l.x(0), l.y(b.me >= 10 ? 718 : 700), SS_T('lbYouRank', b.me + 1, b.total), l.u(11.5), '#c9b676').setOrigin(0.5));
      ent.push(...grp);
      this.rowsC.add(grp);
    }

    // entrance: the podium pops first, the roll follows in a soft cascade
    ent.forEach((o, i) => {
      const ty = o.y;
      o.y = ty + l.u(10); o.alpha = 0;
      this.tweens.add({ targets: o, y: ty, alpha: 1, duration: 300, delay: Math.min(620, i * 22), ease: 'Cubic.easeOut' });
    });
  }
}

/* ============================================================
   Boot
   ============================================================ */
let game = null;
// versus.js registers its scenes at load time, which now happens before the game exists on
// the ?art=1 path. Queue them until boot.
const SS_LATE_SCENES = [];
function ssAddScene(key, cls) {
  if (game) game.scene.add(key, cls); else SS_LATE_SCENES.push([key, cls]);
}
function ssBoot() {
  // the probes are over: from here the same GL throw would be the REAL game
  // dying, and compat.js must stay loud about it
  window.__ssProbing = false;
  game = new Phaser.Game({
    // CANVAS only when the raster probe proved this device's GL is a software
    // rasterizer and its Canvas2D is faster (see SS_REND) — same resolution,
    // same art, just the rasterizer that actually has a GPU behind it.
    type: SS_REND.mode === 'cv' ? Phaser.CANVAS : SS_REND.mode === 'gl' ? Phaser.WEBGL : Phaser.AUTO,
    width: Math.round(window.innerWidth * DPR),
    height: Math.round(window.innerHeight * DPR),
    backgroundColor: '#0a0d1c',
    scale: { mode: Phaser.Scale.NONE },
    // canvas mode keeps smoothing on: no MSAA to pay for, and NEAREST-scaled
    // painted art goes crunchy. The DPR<2 rule is the GL/MSAA-at-retina one.
    render: { antialias: SS_REND.mode === 'cv' ? true : DPR < 2, powerPreference: 'high-performance' },
    scene: [Home, Battle, Profile, Board],
  });
  window.game = game;
  DIAG('rend ' + SS_REND.mode + '/' + SS_REND.why + (SS_REND.p ? ' gl ' + SS_REND.p.glMs + ' cv ' + SS_REND.p.cvMs + ' ms/f' : ''));
  // renderer may not exist until Phaser's own boot — install the shim both
  // ways (it no-ops unless the renderer really is Canvas; AUTO can land there
  // too, e.g. headless without GPU)
  ssCanvasTintShim();
  game.events.once('ready', ssCanvasTintShim);
  while (SS_LATE_SCENES.length) { const [k, c] = SS_LATE_SCENES.shift(); game.scene.add(k, c); }
  game.events.once('ready', fitCanvas);
  game.events.once('ready', () => ssPerfWatch(game));
  game.events.once('ready', () => ssDeviceBeat('ready'));
}
function fitCanvas() {
  const c = game && game.canvas;
  if (!c) return;
  ssReadInsets();          // rotation moves the notch: re-measure before laying out
  // the stage is ours: whatever a POOLED canvas arrived wearing, the real game
  // is opaque, in normal flow and takes taps. Belt to the probe's braces (see
  // gone()) — this runs on 'ready' and on every viewport settle, so a recycled
  // canvas can never leave the game faint or untappable again.
  c.style.opacity = ''; c.style.pointerEvents = '';
  c.style.position = ''; c.style.left = ''; c.style.top = '';
  c.style.width = window.innerWidth + 'px';
  c.style.height = window.innerHeight + 'px';
  // We own the canvas CSS size (Scale.NONE), and Phaser caches the canvas bounding rect to
  // map pointer coords into game space. It must be told after we change that rect or
  // displayScale stays 1 while the canvas is really 1/DPR of the back-buffer — every tap
  // then lands at a third of where it should and nothing is clickable. Latent until the
  // ?art=1 deferred boot ran ssBoot() after document-complete and flipped the order.
  if (game.scale) game.scale.refresh();
}
/* ---- the device report + the crisp sentinel (v0.50.0) ------------------
   Wyatt's phone rendered v0.49.0 uniformly SOFT in the TestFlight app —
   every surface a 2–3× upscale of a small buffer — and headless Chrome at
   the same CSS size and DPR is pixel-crisp. Nothing in the game told us a
   single number about his device, so this is the instrument, not a fix:
   one compact object built after `ready` and after every viewport settle,
   written to devices/<uid> in the RTDB (the same channel SS.sync rides,
   the same uid as players/<uid>), kept in a 5-deep localStorage ring
   (`beta3.devlog`), painted into the ?diag=1 box, and read back with
   `node tools/device-rows.mjs`. No player-facing strings, no secrets.
   The sentinel: the back-buffer must be round(css × DPR) on both axes, and
   under WebGL the drawing buffer must match the canvas (iOS can silently
   allocate a smaller one — Phaser never checks). A miss is DIAGed, recorded
   (`crisp:false` with the numbers as found) and healed ONCE per beat by
   re-running the resize/fit path; on every desktop browser and every
   harness the measure simply agrees and nothing moves. */
const SS_DEV = { last: null, heals: 0, found: null, sentAt: 0, sentSig: '', diagSig: '' };
window.__ssdev = SS_DEV;
function ssCrispMeasure() {
  const c = game && game.canvas;
  if (!c || !game.isBooted) return null;
  const r = (v) => Math.round(v);
  const m = { cw: c.width, ch: c.height, cc: [c.clientWidth, c.clientHeight], ok: true, why: '' };
  m.ew = r(m.cc[0] * DPR); m.eh = r(m.cc[1] * DPR);
  if (m.cw !== m.ew || m.ch !== m.eh) { m.ok = false; m.why = 'buffer ' + m.cw + 'x' + m.ch + ' ≠ css×dpr ' + m.ew + 'x' + m.eh; }
  try {
    const gl = game.renderer && game.renderer.type === Phaser.WEBGL ? game.renderer.gl : null;
    if (gl) {
      m.db = [gl.drawingBufferWidth, gl.drawingBufferHeight];
      if (m.db[0] !== m.cw || m.db[1] !== m.ch) { m.ok = false; m.why += (m.why ? ' · ' : '') + 'drawingBuffer ' + m.db[0] + 'x' + m.db[1] + ' ≠ canvas ' + m.cw + 'x' + m.ch; }
    }
  } catch (e) { }
  // a forced ?dpr= (a stale Home-Screen bookmark would carry one) is not a
  // buffer fault the fit path can heal — named separately, never "healed"
  const want = Math.min(window.devicePixelRatio || 1, 3);
  if (Math.abs(DPR - want) > 0.01) m.dprOff = want;
  return m;
}
function ssTextCount() {
  let n = 0;
  const walk = (list) => { for (const o of list || []) { if (o.type === 'Text') n++; if (o.list) walk(o.list); } };
  try { for (const sc of game.scene.getScenes(true)) walk(sc.children.list); } catch (e) { }
  return n;
}
function ssDeviceReport(tag, m) {
  const c = game.canvas, P = SS_REND, pp = P.p || {}, vv = window.visualViewport;
  let cs = null;
  try { const s = getComputedStyle(c); cs = [parseFloat(s.width), parseFloat(s.height)]; } catch (e) { }
  let sa = false;
  try { sa = !!navigator.standalone || !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches); } catch (e) { }
  const rep = {
    ts: Date.now(), build: BUILD, tag,
    ua: String(navigator.userAgent || '').replace(/Mozilla\/5\.0 |\(KHTML, like Gecko\) /g, '').slice(0, 150),
    shell: (window.__STARSHELL && (window.__STARSHELL.platform + ' ' + window.__STARSHELL.build)) || '',
    sa, q: String(location.search || '').slice(0, 80),
    iw: window.innerWidth, ih: window.innerHeight,
    vv: vv ? [Math.round(vv.width), Math.round(vv.height), Math.round((vv.scale || 1) * 100) / 100] : null,
    dpr: window.devicePixelRatio || 1, DPR,
    cw: m.cw, ch: m.ch, cc: m.cc, cs,
    gw: game.scale.width, gh: game.scale.height,
    rend: game.renderer.type === Phaser.WEBGL ? 'gl' : 'cv', mode: P.mode, why: P.why,
    probe: pp.glMs != null ? [pp.glMs, pp.cvMs, pp.probeMs || 0, (pp.glHow || '') + '/' + (pp.cvHow || '')] : null,
    gpu: String(pp.gpu || '').slice(0, 40),
    db: m.db || null,
    mem: navigator.deviceMemory || 0, hc: navigator.hardwareConcurrency || 0,
    inset: [SS_INSET.top, SS_INSET.bottom],
    ncv: document.querySelectorAll('canvas').length, ntx: ssTextCount(),
    ntex: Object.keys(game.textures.list).length,
    crisp: m.ok && !m.dprOff, heals: SS_DEV.heals,
  };
  if (SS_DEV.found) rep.found = SS_DEV.found;   // the last miss as found, sticky for the session
  if (m.dprOff) rep.dprOff = m.dprOff;
  if (!m.ok) rep.miss = m.why;
  return rep;
}
function ssDeviceDiag(rep) {
  DIAG('dev ' + rep.tag + ' · ' + rep.ua.slice(0, 90) + (rep.shell ? ' · ' + rep.shell : '') + (rep.sa ? ' · standalone' : '') + (rep.q ? ' · q ' + rep.q : ''));
  DIAG('dev vp ' + rep.iw + 'x' + rep.ih + (rep.vv ? ' vv ' + rep.vv[0] + 'x' + rep.vv[1] + '@' + rep.vv[2] : '') +
    ' dpr ' + rep.dpr + ' chose ' + rep.DPR + ' inset ' + rep.inset[0] + '/' + rep.inset[1] + ' mem ' + rep.mem + ' hc ' + rep.hc);
  DIAG('dev buf ' + rep.cw + 'x' + rep.ch + ' css ' + rep.cc[0] + 'x' + rep.cc[1] + (rep.cs ? ' style ' + rep.cs[0] + 'x' + rep.cs[1] : '') +
    ' game ' + rep.gw + 'x' + rep.gh + (rep.db ? ' gl ' + rep.db[0] + 'x' + rep.db[1] : '') + ' · canvases ' + rep.ncv + ' texts ' + rep.ntx + ' tex ' + rep.ntex);
  DIAG('dev rend ' + rep.rend + ' ' + rep.mode + '/' + rep.why + (rep.probe ? ' probe gl ' + rep.probe[0] + ' cv ' + rep.probe[1] + ' ' + rep.probe[2] + 'ms' : '') +
    (rep.gpu ? ' · ' + rep.gpu : '') + ' · ' + (rep.crisp ? 'CRISP' : 'NOT CRISP ' + (rep.miss || '') + (rep.dprOff ? ' dpr forced ' + rep.DPR + ' vs ' + rep.dprOff : '')) +
    (rep.heals ? ' heals ' + rep.heals : ''));
}
function ssDeviceSend(rep) {
  // never the harnesses' shared test identities (unless a run asks for it)
  if (/^test_/.test(SSNET.uid()) && QS.get('devreport') !== '1') return;
  const sig = JSON.stringify(Object.assign({}, rep, { ts: 0, tag: '' }));
  if (sig === SS_DEV.sentSig && rep.ts - SS_DEV.sentAt < 60000) return;
  SS_DEV.sentSig = sig; SS_DEV.sentAt = rep.ts;
  SSNET.connect().then((m) => { if (m === 'firebase') return SSNET.dbSet('devices/' + SSNET.uid(), SS_DEV.last); }).catch(() => { });
}
// `found` is the measure taken BEFORE the fit path ran (a settle measures
// the canvas as the viewport left it); the beat measures again after it
function ssDeviceBeat(tag, found) {
  if (!game || !game.isBooted || !game.canvas) return null;
  let m = ssCrispMeasure();
  if (!m) return null;
  if (found && !found.ok) { DIAG('crisp: found ' + found.why + ' before the fit'); SS_DEV.found = [tag, found.cw, found.ch, found.cc[0], found.cc[1]].concat(found.db || []); }
  if (!m.ok) {
    DIAG('crisp: ' + m.why + ' — healing');
    SS_DEV.heals++;
    const asFound = m;
    try { game.scale.resize(Math.round(window.innerWidth * DPR), Math.round(window.innerHeight * DPR)); fitCanvas(); } catch (e) { }
    m = ssCrispMeasure() || asFound;
    SS_DEV.found = [tag, asFound.cw, asFound.ch, asFound.cc[0], asFound.cc[1]].concat(asFound.db || []);
    DIAG('crisp: ' + (m.ok ? 'healed → ' + m.cw + 'x' + m.ch : 'STILL ' + m.why));
  }
  const rep = ssDeviceReport(tag, m);
  SS_DEV.last = rep;
  try {
    const K = 'beta3.devlog';
    let a = JSON.parse(localStorage.getItem(K) || '[]'); a.push(rep);
    if (a.length > 5) a = a.slice(a.length - 5);
    localStorage.setItem(K, JSON.stringify(a));
  } catch (e) { }
  // the settle loop re-polls a kick four times: paint the four lines only
  // when something in them changed, or the 14-line box is all chatter
  const dsig = JSON.stringify(Object.assign({}, rep, { ts: 0, tag: '' }));
  if (tag === 'ready' || dsig !== SS_DEV.diagSig) ssDeviceDiag(rep);
  SS_DEV.diagSig = dsig;
  ssDeviceSend(rep);
  return rep;
}
window.__ssDevBeat = ssDeviceBeat;
// Textures are built inside the first scene's create(), so the art has to be decoded before
// Phaser starts. Capped at 2.5s — a slow or dead image never blocks the game, it just falls
// back to the procedural art. Without ?art=1 this is a straight synchronous boot as before.
if (LAB) {
  /* ?lab=1: lab.js owns boot — it builds and destroys its own Phaser games
     stage by stage, and the fixed-size stages must not be restarted under
     the meter, so the viewport machinery below stands down too. SSNET still
     connects: the lab reports home through it. */
} else {
  // renderer verdict first (cached or forced: resolves instantly; first boot:
  // ~1-1.5s of workload probing, hard-capped), then the art gate as before
  ssReadInsets();
  ssRenderVerdict().then(() => {
    if (ART) {
      let booted = false;
      const go = () => { if (!booted) { booted = true; ssBoot(); } };
      setTimeout(() => { if (!booted) DIAG('art TIMEOUT — procedural'); go(); }, 2500);
      ssLoadArt().then(go);
    } else ssBoot();
  });
}
// a profile row for everyone who ever opened the game — friend links and
// rating cards look names up there, and a first-time inviter has played nothing
SSNET.connect().then((m) => { if (m === 'firebase') SS.sync(); });
/* ---------- viewport: resize + rotation ----------
   iOS Safari can fire resize while innerWidth/Height still report the OLD
   orientation, and doesn't always fire again once they settle — trusting the
   event's numbers once left the canvas laid out landscape in a portrait
   window, bottom half cut off. So any viewport signal starts a short settle
   loop: re-fit now, keep re-checking until the numbers hold still, and only
   relayout against the dims the scenes were actually built for.
   The game is portrait-only on phones: while the CSS rotate-veil covers a
   landscape coarse-pointer screen, the loop just sleeps the game and waits —
   no landscape relayout, nothing to mangle — then lays out once, upright,
   when the device turns back.
   iOS also fires resize when the URL bar collapses (height-only, ~50-115px)
   — that must NOT restart scenes or it cuts the ascent and resets battles;
   only a real reshape (rotation / window drag) relays out. */
let vpW = window.innerWidth, vpH = window.innerHeight;   // the dims the scenes are laid out for
let vpTimer = null, vpPolls = 0;
function ssVeiled() {
  try { return window.matchMedia('(orientation: landscape) and (pointer: coarse)').matches; } catch (e) { return false; }
}
function ssVpSettle() {
  vpTimer = null;
  // not made yet (?art=1 defers boot until the art decodes) or mid-boot
  // (scale.resize before the renderer exists throws) — come back shortly
  if (!game || !game.isBooted) { vpTimer = setTimeout(ssVpSettle, 300); return; }
  if (ssVeiled()) {
    if (game.loop.running) game.loop.sleep();
    vpPolls = Math.max(vpPolls, 2);      // relayout checks still owed once we're upright
    vpTimer = setTimeout(ssVpSettle, 350);
    return;
  }
  if (!game.loop.running) game.loop.wake();
  const w = window.innerWidth, h = window.innerHeight;
  const found = ssCrispMeasure();   // the canvas as the viewport left it
  game.scale.resize(Math.round(w * DPR), Math.round(h * DPR));
  fitCanvas();
  ssDeviceBeat('settle', found);
  const major = Math.abs(w - vpW) > 4 || Math.abs(h - vpH) > 200;
  DIAG('vp ' + w + 'x' + h + (major ? ' MAJOR → scene restart' : ' minor'));
  if (major) {
    vpW = w; vpH = h;
    // every active scene, versus included — restart() with no args keeps the
    // original scene data, so a vsbattle rejoins its room by seal code
    for (const sc of game.scene.getScenes(true)) sc.scene.restart();
  }
  if (vpPolls-- > 0) vpTimer = setTimeout(ssVpSettle, 300);
}
function ssVpKick() {
  vpPolls = 4;                           // ~1.3s of re-checks outlasts iOS's stale reports
  clearTimeout(vpTimer);
  vpTimer = setTimeout(ssVpSettle, 60);
}
if (!LAB) {
  window.addEventListener('resize', ssVpKick);
  window.addEventListener('orientationchange', ssVpKick);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', ssVpKick);
  ssVpKick();   // opened in landscape? park under the veil from the very start
}
