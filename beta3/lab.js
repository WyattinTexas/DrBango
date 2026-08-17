'use strict';
/* ============================================================
   STARSPELL PERF LAB — ?lab=1 (debug surface, English-only)

   The iOS hunt so far: JS idle, fill rate healthy, GPU real —
   yet every scene runs 11-16fps on the afflicted iPhone in both
   Safari and Firefox. A uniform ~60-90ms per frame that no
   emulator shows = something our frame does every frame that
   stalls WebKit. This lab bisects it ON the device: 20 stages,
   ~6s each — empty scene under the boot config, then one config
   flag flipped per stage, then content layers added one at a
   time, then the full home scene under GL and Canvas. Median
   fps + worst frame per stage, painted on screen at the end AND
   written to RTDB (starspell/perflab/<deviceId>/<ts>) after
   every stage, so a partial run still reports home and the next
   session reads results without screenshots.

   Loaded by index.html only when ?lab=1; game.js sees LAB and
   stands its own boot + viewport machinery down. Nothing here
   runs without the flag. Crispness law respected: the dpr2/dpr1
   stages are probes only — no ladder, no stored caps.
   ============================================================ */
(() => {
  if (typeof QS === 'undefined' || QS.get('lab') !== '1') return;

  const FAST = QS.get('labfast') === '1';   // harness mode: short samples, same 20 stages
  const MS = FAST
    ? { cfg: 600, content: 600, home: 800, settle: 250, homeSettle: 1200 }
    : { cfg: 4000, content: 4000, home: 6000, settle: 900, homeSettle: 3200 };

  // freeze the viewport at lab start: the iOS URL bar collapses on the first
  // tap and must not hand later stages a different back-buffer than earlier ones
  const LW = window.innerWidth, LH = window.innerHeight;
  const UA = navigator.userAgent || '';
  const BROWSER = /FxiOS/i.test(UA) ? 'fxios' : /CriOS/i.test(UA) ? 'crios' : /EdgiOS/i.test(UA) ? 'edgios'
    : /HeadlessChrome/i.test(UA) ? 'headless' : /iPhone|iPad|iPod/i.test(UA) ? 'safari'
      : /Chrome/i.test(UA) ? 'chrome' : /Firefox/i.test(UA) ? 'firefox' : /Safari/i.test(UA) ? 'safari' : 'other';
  const LATE = SS_LATE_SCENES.slice();   // versus scenes, queued at load — home stages want them registered

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const runKey = String(Date.now());
  const payload = {
    v: 2, build: BUILD, ua: UA.slice(0, 160), browser: BROWSER,
    id: BROWSER + '-' + SSNET.uid(), runKey, fast: FAST,
    dpr: DPR, deviceDpr: window.devicePixelRatio || 1,
    vw: LW, vh: LH, screen: (screen.width || 0) + 'x' + (screen.height || 0),
    raster: {
      glMs: SS_REND.p ? SS_REND.p.glMs : -1, cvMs: SS_REND.p ? SS_REND.p.cvMs : -1,
      gpu: (SS_REND.p && SS_REND.p.gpu) || '', mode: SS_REND.mode, why: SS_REND.why,
      // frames sampled + how each probe ended: an unmeasurable renderer is a
      // finding, and the RTDB row must carry WHICH way it failed
      glN: SS_REND.p ? SS_REND.p.glN : -1, cvN: SS_REND.p ? SS_REND.p.cvN : -1,
      glHow: (SS_REND.p && SS_REND.p.glHow) || '', cvHow: (SS_REND.p && SS_REND.p.cvHow) || '',
    },
    stages: [], errors: [], startedAt: 0, updatedAt: 0, completed: 0, total: 0,
    done: false, uploaded: false,
  };
  window.__sslab = payload;
  window.addEventListener('error', (e) => {
    if (payload.errors.length < 20) payload.errors.push('werr: ' + String(e.message || e).slice(0, 120));
  });

  async function upload() {
    payload.updatedAt = Date.now();
    try {
      if (SSNET.mode !== 'firebase') { payload.uploaded = false; return; }
      await SSNET.dbSet('perflab/' + payload.id + '/' + payload.runKey, payload);
      payload.uploaded = true;
    } catch (e) { payload.uploaded = false; }
  }

  /* ---------------- UI ---------------- */
  const UI = {};
  function buildUi() {
    const d = document.createElement('div');
    d.id = 'sslab';
    d.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;' +
      'justify-content:center;background:#0a0d1c;color:#f3e5b4;font:15px/1.5 ui-monospace,Menlo,monospace;' +
      'text-align:center;padding:20px;overflow:auto';
    d.innerHTML =
      '<div style="font:italic bold 26px Georgia,serif;color:#ffe9a8;letter-spacing:1px">STARSPELL PERF LAB</div>' +
      '<div style="margin:14px 0 4px;max-width:340px;color:#c9c2a8">20 stages &middot; about 2 minutes.<br>' +
      'Keep the screen awake &mdash; tapping it now and then is fine. Don’t switch apps.</div>' +
      '<div style="margin:4px 0 22px;color:#8a94c4;font-size:13px">please run me once in Safari and once in Firefox</div>' +
      '<button id="sslab-go" style="font:bold 22px Georgia,serif;color:#241a38;background:#ffd77a;border:0;' +
      'border-radius:14px;padding:16px 42px;letter-spacing:1px">TAP TO BEGIN</button>' +
      '<div style="margin-top:18px;font-size:12px;color:#666f9c">' + BUILD + ' · ' + BROWSER + ' · dpr' + DPR + '</div>';
    document.body.appendChild(d);
    UI.root = d;
    document.getElementById('sslab-go').addEventListener('click', () => run().catch(fatal), { once: true });
  }
  function stripUi() {
    UI.root.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:60;background:rgba(6,8,20,.78);' +
      'color:#ffe9a8;font:bold 13px/1.5 ui-monospace,Menlo,monospace;text-align:center;padding:6px 8px;' +
      'padding-top:calc(env(safe-area-inset-top,0px) + 6px);pointer-events:none';
    UI.root.innerHTML = '<span id="sslab-line">lab starting…</span>' +
      '<span style="display:block;font-weight:normal;font-size:10px;color:#8a94c4">tap = ok · keeps the screen awake</span>';
    UI.line = document.getElementById('sslab-line');
  }
  function status(t) { if (UI.line) UI.line.textContent = t; }
  function paintResults() {
    const p = payload;
    const col = (fps) => (fps >= 50 ? '#7ec96f' : fps >= 30 ? '#e6c229' : '#e74c3c');
    const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    // display labels drop the group prefixes — the phone screen is 428pt and
    // the renderer column must survive on the right
    const short = (s) => s.label.replace(/^empty · /, '').replace(/^content /, '').replace(/^FULL HOME · /, 'HOME · ');
    const rows = p.stages.map((s, i) =>
      '<tr><td style="text-align:left;padding:2px 5px 2px 0;color:#c9c2a8;white-space:nowrap">' + (i + 1) + '. ' + esc(short(s)) + '</td>' +
      '<td style="font-weight:bold;font-size:15px;color:' + col(s.fps || 0) + ';padding:2px 4px">' + (s.err ? '✗' : s.fps) + '</td>' +
      '<td style="color:#8a94c4;padding:2px 4px;white-space:nowrap">' + (s.err ? esc(s.err) : Math.round(s.med) + 'ms·w' + s.worst) + '</td>' +
      '<td style="color:#39406b">' + (s.rend || '') + (s.hid ? '⚠' : '') + '</td></tr>').join('');
    UI.root.style.cssText = 'position:fixed;inset:0;z-index:60;background:#0a0d1c;color:#f3e5b4;overflow:auto;' +
      'font:14px/1.45 ui-monospace,Menlo,monospace;padding:16px 8px 40px;' +
      'padding-top:calc(env(safe-area-inset-top,0px) + 12px)';
    UI.root.innerHTML =
      '<div style="font:italic bold 22px Georgia,serif;color:#ffe9a8;text-align:center">PERF LAB — RESULTS</div>' +
      '<div style="text-align:center;margin:6px 0;font-weight:bold;color:' + (p.uploaded ? '#7ec96f' : '#e74c3c') + '">' +
      (p.uploaded ? '✓ UPLOADED — results are already home' : '✗ OFFLINE — please screenshot this table') + '</div>' +
      '<div style="text-align:center;color:#8a94c4;font-size:11px;margin-bottom:10px">' +
      BROWSER + ' · dpr' + DPR + ' · gl ' + p.raster.glMs + ' · cv ' + p.raster.cvMs + ' ms/f · ' + esc(p.raster.gpu || '') +
      '<br>maxTex ' + (p.maxTex || '?') + ' · ctx ' + esc(p.ctxStr || '?') + ' · winner: ' + esc(p.winner || 'base') +
      (p.tex && p.tex.over && p.tex.over.length ? '<br><b style="color:#e74c3c">OVERSIZED TEXTURES: ' + esc(JSON.stringify(p.tex.over)) + '</b>' : '') +
      '</div>' +
      '<table style="margin:0 auto;border-collapse:collapse;font-size:13px">' + rows + '</table>' +
      '<div style="text-align:center;margin-top:14px;color:#666f9c;font-size:11px">' + p.id + ' · ' + p.runKey + '</div>';
  }
  function fatal(e) {
    payload.errors.push('fatal: ' + String((e && e.message) || e).slice(0, 200));
    payload.done = true;
    window.__sslabDone = true;
    upload();
    try { paintResults(); } catch (e2) { }
  }

  /* ---------------- measurement ---------------- */
  function sample(gm, ms, disp) {
    return new Promise((res) => {
      const f = []; let hid = false;
      const onVis = () => { if (document.hidden) hid = true; };
      document.addEventListener('visibilitychange', onVis);
      const onStep = () => { const d = gm.loop.rawDelta; if (d > 0 && d < 2000) f.push(d); };
      gm.events.on('prestep', onStep);
      const live = setInterval(() => { try { status(disp + ' · ' + Math.round(gm.loop.actualFps) + ' fps'); } catch (e) { } }, 500);
      setTimeout(() => {
        clearInterval(live);
        document.removeEventListener('visibilitychange', onVis);
        try { gm.events.off('prestep', onStep); } catch (e) { }
        f.sort((a, b) => a - b);
        const n = f.length, med = n ? f[n >> 1] : 0;
        const out = {
          frames: n,
          med: n ? +med.toFixed(1) : 0,
          fps: med ? Math.round(1000 / med) : 0,
          avg: n ? +(f.reduce((a, b) => a + b, 0) / n).toFixed(1) : 0,
          p95: n ? Math.round(f[Math.min(n - 1, Math.floor(n * 0.95))]) : 0,
          worst: n ? Math.round(f[n - 1]) : 0,
        };
        if (hid) out.hid = true;   // stage ran while the tab was hidden — distrust it
        res(out);
      }, ms);
    });
  }
  async function waitFor(fn, ms, what) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { if (fn()) return; } catch (e) { } await wait(100); }
    throw new Error(what + ' timeout');
  }
  async function teardown(g) {
    if (!g) return;
    let gl = null;
    try { gl = g.renderer && g.renderer.gl; } catch (e) { }
    await new Promise((res) => {
      let done = false; const fin = () => { if (!done) { done = true; res(); } };
      try { g.events.once('destroy', fin); g.destroy(true); } catch (e) { fin(); }
      setTimeout(fin, 1500);
    });
    // Phaser leaves the GL context alive after destroy; a dozen live contexts
    // in a row would hit the browser's cap and start killing earlier ones
    try { const ext = gl && gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (e) { }
    document.querySelectorAll('canvas').forEach((c) => { try { c.remove(); } catch (e) { } });
    await wait(220);
  }

  /* ---------------- stage scenes ---------------- */
  function labScene(build) {
    return class extends Phaser.Scene {
      constructor() { super('lab'); }
      create() {
        try { build(this); } catch (e) { payload.errors.push('build: ' + String((e && e.message) || e).slice(0, 120)); }
        this.game.__labReady = true;
      }
    };
  }
  const emptyBuild = (sc) => {
    sc.add.rectangle(sc.scale.width / 2, sc.scale.height / 2,
      Math.round(sc.scale.width * 0.4), Math.round(sc.scale.height * 0.22), 0x1c2350);
  };
  // dot + glowbig, byte-for-byte the ssMakeTextures recipes — the content
  // stages need just these two, not the full 40-texture bake
  function labCore(sc) {
    ssSkyTextures(sc, false);
    const mk = (key, w, h, fn) => {
      if (sc.textures.exists(key)) return;
      const t = sc.textures.createCanvas(key, w, h);
      fn(t.context, w, h); t.refresh();
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
  }
  // the home meadow's real layers, one per stage, copied from ssSkyWorld
  // (meadow frame: camera at scroll 0, worldY d -> l.y(d - 1600))
  const wy = (l, d) => l.y(d - 1600);
  const CONTENT_LAYERS = [
    ['skygrad', (sc, l) => {
      sc.add.image(l.W / 2, wy(l, 0), 'skygrad').setOrigin(0.5, 0).setDisplaySize(l.W, 2400 * l.s);
      sc.add.rectangle(l.W / 2, l.y(800), l.W, Math.max(1, l.H - l.y(800)) + 120 * l.s, 0x070510).setOrigin(0.5, 0);
    }],
    ['stars233', (sc, l) => {
      const T = 1600 * l.s;
      const tier = (fac, n, s0, s1, twinkle) => {
        const out = [], top = -T * fac, span = T * fac + l.H;
        for (let i = 0; i < n; i++) {
          const y = top + Math.pow(Math.random(), 1.8) * span;
          const scl = (s0 + Math.random() * (s1 - s0)) * l.s;
          const baseA = 0.25 + Math.random() * 0.55;
          const st = sc.add.image(Math.random() * l.W, y, 'dot')
            .setScale(scl).setAlpha(baseA)
            .setTint(SS_STAR_COLORS[(Math.random() * SS_STAR_COLORS.length) | 0])
            .setScrollFactor(1, fac);
          st.baseA = baseA;
          if (twinkle && Math.random() < 0.5) sc.__tw.push(st);
          out.push(st);
        }
        return out;
      };
      tier(0.55, 110, 0.28, 0.5, true);
      tier(0.70, 75, 0.42, 0.68, true);
      tier(0.85, 48, 0.66, 0.95, false).forEach((st) => st.setBlendMode('ADD'));
    }],
    ['aurora', (sc, l) => {
      for (const [tint, dx, dy, a] of [[0x2fe0d0, -120, 160, 0.055], [0x8a5ae0, 130, 120, 0.055], [0xd7b45c, 0, 640, 0.055], [0x2fe0d0, 40, 1660, 0.03]]) {
        const g = sc.add.image(l.x(dx), wy(l, dy), 'glowbig').setScale(l.u(2.6)).setTint(tint).setAlpha(a).setBlendMode('ADD');
        sc.tweens.add({ targets: g, x: g.x + l.u(30), y: g.y - l.u(20), scale: l.u(3.1), duration: 7000 + Math.random() * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }],
    ['grain', (sc, l) => {
      // the dieted grain the game now ships (task 24): baked half-res static
      // image, not a live TileSprite — the lab prices what players get
      ssGrainOverlay(sc, l.W, l.H);
    }],
    ['twinkle', (sc) => {
      for (const st of sc.__tw)
        sc.tweens.add({ targets: st, alpha: st.baseA * 0.35, duration: 1600 + Math.random() * 2600, yoyo: true, repeat: -1, delay: Math.random() * 2500 });
    }],
    ['meadow', (sc, l) => {
      if (ART && SSART.ready && SSART.img.meadow) {
        if (!sc.textures.exists('meadowart')) sc.textures.addImage('meadowart', SSART.img.meadow);
        const src = sc.textures.get('meadowart').getSourceImage();
        const bot = Math.max(l.y(800), l.H) + l.u(30);
        const h = bot - l.y(398);
        sc.add.image(l.W / 2, bot, 'meadowart').setOrigin(0.5, 1)
          .setDisplaySize(Math.max(l.W, h * src.width / src.height), h);
      } else {
        sc.add.ellipse(l.x(-108), l.y(545), l.u(432), l.u(250), 0x141026);
        sc.add.ellipse(l.x(150), l.y(588), l.u(620), l.u(340), 0x0c0918);
        sc.add.rectangle(l.W / 2, l.y(553), l.W, Math.max(1, l.H - l.y(553)) + 120 * l.s, 0x0a0714).setOrigin(0.5, 0);
        const grassY = Math.max(l.y(772), l.H - l.u(30));
        for (const [off, ph] of [[0, 0], [l.u(5), 1300]]) {
          const gr = sc.add.tileSprite(l.W / 2, grassY + off, l.W, l.u(32), 'grasstrip').setOrigin(0.5, 0);
          gr.setTileScale(l.s / 2); gr.tilePositionX = off * 20;
          sc.tweens.add({ targets: gr, x: gr.x + l.u(1.5), duration: 2600, yoyo: true, repeat: -1, delay: ph, ease: 'Sine.easeInOut' });
        }
      }
    }],
    ['text20hz', (sc, l) => {
      const t = sc.add.text(l.x(0), l.y(730), '0', {
        fontFamily: 'Georgia, serif', fontSize: Math.max(12, Math.round(l.u(18))) + 'px', color: '#ffe9a8',
      }).setOrigin(0.5);
      sc.time.addEvent({ delay: 50, loop: true, callback: () => t.setText(String((Math.random() * 99999) | 0)) });
    }],
    ['particles', (sc, l) => {
      sc.add.particles(0, 0, 'dot', {
        x: { min: 0, max: l.W }, y: -l.u(20),
        quantity: 1, frequency: 70, lifespan: 2800,
        speedY: { min: l.u(40), max: l.u(90) }, speedX: { min: -l.u(8), max: l.u(8) },
        scale: { start: 0.55, end: 0 }, alpha: { start: 0.8, end: 0 },
        blendMode: 'ADD', tint: 0xffe9a8,
      });
    }],
  ];
  function contentBuild(n) {
    return (sc) => {
      labCore(sc);
      const l = ssLayout(sc);
      sc.__tw = [];
      for (let i = 0; i <= n; i++) CONTENT_LAYERS[i][1](sc, l);
    };
  }

  /* ---------------- configs ---------------- */
  function cfgFor(over, build) {
    over = over || {};
    const dpr = over.dpr || DPR;
    const cfg = {
      // base = ssBoot's type expression verbatim (probe-driven AUTO/CANVAS)
      type: over.type != null ? over.type
        : (SS_REND.mode === 'cv' ? Phaser.CANVAS : SS_REND.mode === 'gl' ? Phaser.WEBGL : Phaser.AUTO),
      width: Math.round(LW * dpr), height: Math.round(LH * dpr),
      backgroundColor: '#0a0d1c',
      scale: over.scale || { mode: Phaser.Scale.NONE },
      render: Object.assign({ antialias: dpr < 2, powerPreference: 'high-performance' }, over.render || {}),
      scene: [labScene(build)],
    };
    if (over.transparent) cfg.transparent = true;
    return cfg;
  }
  function homeCfg(type) {
    return {
      type,
      width: Math.round(LW * DPR), height: Math.round(LH * DPR),
      backgroundColor: '#0a0d1c',
      scale: { mode: Phaser.Scale.NONE },
      // canvas keeps smoothing on, GL drops MSAA at retina — ssBoot's rule
      render: { antialias: type === Phaser.CANVAS ? true : DPR < 2, powerPreference: 'high-performance' },
      scene: [Home, Battle, Profile, Board],
    };
  }
  function ctxProbe(g) {
    try {
      const gl = g.renderer && g.renderer.gl;
      if (!gl) { payload.ctxStr = 'no-gl (canvas renderer)'; return; }
      payload.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const a = gl.getContextAttributes() || {};
      payload.ctx = {
        alpha: !!a.alpha, antialias: !!a.antialias, depth: !!a.depth, stencil: !!a.stencil,
        premultipliedAlpha: !!a.premultipliedAlpha, preserveDrawingBuffer: !!a.preserveDrawingBuffer,
        powerPreference: a.powerPreference || '?', desynchronized: !!a.desynchronized,
      };
      payload.ctxStr = Object.entries(payload.ctx)
        .filter(([, v]) => v !== false)
        .map(([k, v]) => (v === true ? k : k + ':' + v)).join(' ');
    } catch (e) { }
  }
  function texScan(g) {
    const out = [];
    try {
      const list = g.textures.list;
      for (const k in list) {
        const s = list[k].source && list[k].source[0];
        if (s && s.width) out.push({ k, w: s.width, h: s.height });
      }
    } catch (e) { }
    out.sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));
    const cap = payload.maxTex || 4096;
    return { top: out.slice(0, 6), over: out.filter((t) => Math.max(t.w, t.h) > cap) };
  }

  /* ---------------- stage plan ---------------- */
  let WIN = null;
  function winnerOver(S) {
    if (!WIN) {
      const base = S.find((s) => s.id === 'empty-base');
      let best = base;
      for (const s of S) {
        if (!s.eligible || !s.row || s.row.err || !(s.row.fps > 0)) continue;
        if (!best.row || !best.row.fps || s.row.fps > best.row.fps) best = s;
      }
      // a variant must beat base by 8%+ to carry the content stages — noise doesn't
      if (best !== base && base.row && base.row.fps && !(best.row.fps >= base.row.fps * 1.08)) best = base;
      WIN = best;
      payload.winner = best.id + (best !== base && base.row && base.row.fps
        ? ' (+' + Math.round((best.row.fps / base.row.fps - 1) * 100) + '%)' : '');
    }
    return WIN.over || {};
  }
  function planStages() {
    const S = [];
    const cfgStage = (id, label, over, opts) => S.push(Object.assign({
      id, label, over: over || {}, eligible: true,
      config: () => cfgFor(over, emptyBuild),
      fit: !(over && over.fit === false),
      settle: MS.settle, sample: MS.cfg,
      readyWhen: (g) => g.__labReady,
    }, opts || {}));

    // -- stage 1: empty scene, boot config verbatim. THE key datum. --
    cfgStage('empty-base', 'empty · boot config verbatim', null, { eligible: false, probe: ctxProbe });
    // -- stage 2: one flag flipped per boot --
    cfgStage('aa-on', 'empty · antialias ON', { render: { antialias: true } });
    cfgStage('roundpx', 'empty · roundPixels ON', { render: { roundPixels: true } });
    cfgStage('scale-fit', 'empty · Scale.FIT', {
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: Math.round(LW * DPR), height: Math.round(LH * DPR) },
      fit: false,
    });
    cfgStage('power-def', 'empty · default powerPreference', { render: { powerPreference: 'default' } });
    // boot already requests alpha:false (transparent defaults off) — the
    // informative flip is alpha:TRUE, a different compositing path on iOS
    cfgStage('alpha-on', 'empty · context alpha:true', { transparent: true });
    cfgStage('desync', 'empty · desynchronized hint', { render: { desynchronized: true } });
    cfgStage('dpr2', 'empty · dpr2 (probe only)', { dpr: 2 }, { eligible: false });
    cfgStage('dpr1', 'empty · dpr1 (probe only)', { dpr: 1 }, { eligible: false });
    // Runefall's boot verbatim (same Phaser 3.90, 60fps on-device): AUTO,
    // dpr cap 2, antialias off, Scale.NONE + zoom — no manual CSS fit
    const rfDpr = Math.min(window.devicePixelRatio || 1, 2);
    S.push({
      id: 'runefall', label: 'empty · Runefall config (dpr' + rfDpr + '+zoom)', eligible: false,
      config: () => ({
        type: Phaser.AUTO, backgroundColor: '#0a0d1c',
        render: { antialias: rfDpr < 1.5, powerPreference: 'high-performance' },
        scale: { mode: Phaser.Scale.NONE, width: Math.round(LW * rfDpr), height: Math.round(LH * rfDpr), zoom: 1 / rfDpr },
        scene: [labScene(emptyBuild)],
      }),
      fit: false, settle: MS.settle, sample: MS.cfg, readyWhen: (g) => g.__labReady,
    });
    // -- stage 3: the meadow's content layers, one at a time, on the winner --
    const meadowNote = (ART && SSART.ready) ? 'art' : 'proc';
    const names = ['+skygrad', '+233 stars', '+aurora glows', '+grain tilesprite', '+twinkle tweens',
      '+meadow (' + meadowNote + ')', '+text @20Hz', '+particles'];
    for (let n = 0; n < CONTENT_LAYERS.length; n++) {
      (function (n) {
        S.push({
          id: 'content-' + CONTENT_LAYERS[n][0], label: 'content ' + names[n], eligible: false,
          config: () => cfgFor(winnerOver(S), contentBuild(n)),
          fit: () => winnerOver(S).fit !== false,
          settle: MS.settle, sample: MS.content, readyWhen: (g) => g.__labReady,
        });
      })(n);
    }
    // -- stage 4: the full home scene, forced GL then forced Canvas.
    //    Canvas LAST: the tint shim patches the Image prototype for good,
    //    and a GL stage after it would bake instead of GPU-tint. --
    const post = (g) => { for (const [k, c] of LATE) { try { g.scene.add(k, c); } catch (e) { } } };
    S.push({
      id: 'home-gl', label: 'FULL HOME · WebGL', eligible: false,
      config: () => homeCfg(Phaser.WEBGL), post, global: true,
      readyWhen: (g) => g.scene && g.scene.isActive('home'),
      settle: MS.homeSettle, sample: MS.home,
      probeLate: (g) => { const t = texScan(g); if (t.top.length) payload.tex = t; },
    });
    S.push({
      id: 'home-cv', label: 'FULL HOME · Canvas', eligible: false,
      config: () => homeCfg(Phaser.CANVAS), post, global: true, shim: true,
      readyWhen: (g) => g.scene && g.scene.isActive('home'),
      settle: MS.homeSettle, sample: MS.home,
      probeLate: (g) => { if (!payload.tex) { const t = texScan(g); if (t.top.length) payload.tex = t; } },
    });
    return S;
  }

  /* ---------------- runner ---------------- */
  async function runStage(st, disp) {
    const row = { id: st.id, label: st.label };
    let g = null;
    try {
      g = new Phaser.Game(st.config());
      if (st.post) st.post(g);
      if (st.global) { game = g; window.game = g; }
      if (st.shim) {
        try { ssCanvasTintShim(); } catch (e) { }
        g.events.once('ready', () => { try { ssCanvasTintShim(); } catch (e) { } });
      }
      await waitFor(() => g.isBooted, 15000, 'boot');
      const doFit = typeof st.fit === 'function' ? st.fit() : st.fit !== false;
      if (doFit && g.canvas) {
        g.canvas.style.width = LW + 'px';
        g.canvas.style.height = LH + 'px';
        try { g.scale.refresh(); } catch (e) { }
      }
      await waitFor(() => st.readyWhen(g), 20000, 'scene');
      row.rend = g.renderer && g.renderer.type === Phaser.WEBGL ? 'gl' : 'cv';
      row.buf = g.scale.width + 'x' + g.scale.height;
      try {   // granted attrs per stage — proves whether a hint actually took
        const glx = g.renderer && g.renderer.gl;
        if (glx) {
          const a = glx.getContextAttributes() || {};
          row.attrs = (a.alpha ? 'A' : 'a') + (a.antialias ? 'M' : 'm') + (a.desynchronized ? 'D' : 'd') + ((a.powerPreference || '?')[0]);
        }
      } catch (e) { }
      if (st.probe) { try { st.probe(g); } catch (e) { } }
      await wait(st.settle);
      if (st.probeLate) { try { st.probeLate(g); } catch (e) { } }
      Object.assign(row, await sample(g, st.sample, disp));
    } catch (e) {
      row.err = String((e && e.message) || e).slice(0, 120);
      payload.errors.push(st.id + ': ' + row.err);
    }
    try { await teardown(g); } catch (e) { }
    if (game === g) { game = null; window.game = null; }
    return row;
  }
  async function run() {
    stripUi();
    status('warming up…');
    try { if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request('screen').catch(() => { }); } catch (e) { }
    try { await SSNET.connect(); } catch (e) { }
    // fresh workload-probe verdict so the base stage boots the config a real
    // visit would get, and the payload carries today's numbers
    try {
      await ssRenderVerdict();
      payload.raster = {
        glMs: SS_REND.p ? SS_REND.p.glMs : -1, cvMs: SS_REND.p ? SS_REND.p.cvMs : -1,
        gpu: (SS_REND.p && SS_REND.p.gpu) || '', mode: SS_REND.mode, why: SS_REND.why,
        glN: SS_REND.p ? SS_REND.p.glN : -1, cvN: SS_REND.p ? SS_REND.p.cvN : -1,
        glHow: (SS_REND.p && SS_REND.p.glHow) || '', cvHow: (SS_REND.p && SS_REND.p.cvHow) || '',
      };
    } catch (e) { }
    try { await ssLoadArt(); } catch (e) { }
    INTRO_SEEN = true;   // home stages land straight on the interactive meadow
    payload.startedAt = Date.now();
    const S = planStages();
    payload.total = S.length;
    DIAG('perflab start · ' + S.length + ' stages');
    for (let i = 0; i < S.length; i++) {
      const st = S[i];
      const disp = 'LAB ' + (i + 1) + '/' + S.length + ' · ' + st.label;
      status(disp + ' · booting…');
      st.row = await runStage(st, disp);
      payload.stages.push(st.row);
      payload.completed = i + 1;
      upload();   // progressive: a run the phone kills mid-way still reports home
    }
    payload.done = true;
    await upload();
    window.__sslabDone = true;
    paintResults();
    DIAG('perflab done · uploaded ' + payload.uploaded);
  }

  if (document.body) buildUi(); else window.addEventListener('DOMContentLoaded', buildUi);
})();
