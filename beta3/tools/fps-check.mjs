// v0.34.0 verification: fps overlay v2, full-DPR law, raster probe + renderer
// choice (auto-CANVAS on software-GL devices), canvas tint shim, counter
// throttles, and the ?lab=1 on-device perf bisection lab (boots, runs all 20
// stages, writes its RTDB report, leaves normal boot untouched).
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

async function main() {
  const c = await cdp();

  // ---- boot: overlay present, live, reporting the real buffer ----
  await c.nav(BASE + '?diag=1', 9000);
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
  ok('overlay exists on default boot', st.overlay, st.text);
  ok('overlay names renderer', st.text && (st.text.includes('GL') || st.text.includes('CV')), st.renderer);
  ok('overlay carries buffer size', st.text && st.text.includes(st.w + '×' + st.h));
  const t1 = await c.ev(`[...document.querySelectorAll('div')].find(d=>/FPS ·/.test(d.textContent)).textContent`);
  await sleep(1200);
  const t2 = await c.ev(`[...document.querySelectorAll('div')].find(d=>/FPS ·/.test(d.textContent)).textContent`);
  ok('overlay is live (reports a numeric fps)', /^\d+ FPS/.test(t2), t2);

  // ---- ?fps=0 hides it ----
  await c.nav(BASE + '?fps=0', 8000);
  const hidden = await c.ev(`![...document.querySelectorAll('div')].some(d => /FPS ·/.test(d.textContent||''))`);
  ok('?fps=0 hides the overlay', hidden === true);

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

  // ---- v0.33.0: raster probe + renderer choice ----
  const ras = JSON.parse(await c.ev(`JSON.stringify(window.__ssraster)`));
  ok('raster probe beacon present with numeric rates', ras && ras.p && ras.p.gl >= 0 && ras.p.cv >= 0,
    JSON.stringify(ras && ras.p));
  ok('probe verdict cached', await c.ev(`!!localStorage.getItem('beta3.raster')`) === true);
  // ?rend=cv forces the canvas renderer and the tint shim bakes tinted copies
  await c.nav(BASE + '?rend=cv', 9000);
  const cvb = JSON.parse(await c.ev(`JSON.stringify({
    cv: game.renderer.type === Phaser.CANVAS,
    shim: !!Phaser.GameObjects.Image.prototype.__ssTintShim,
    baked: Object.keys(game.textures.list).filter(k => /^(dot|glowbig)#[0-9a-f]+$/.test(k)).length })`));
  ok('?rend=cv boots the CANVAS renderer', cvb.cv);
  ok('canvas tint shim installed and baking (stars/aurora keep their colors)', cvb.shim && cvb.baked >= 3,
    cvb.baked + ' baked tints');
  // ?rend=gl forces WebGL
  await c.nav(BASE + '?rend=gl', 9000);
  ok('?rend=gl boots the WEBGL renderer', await c.ev(`game.renderer.type === Phaser.WEBGL`) === true);
  // same-day daily board must deal identical letters on both renderers
  const dailyLetters = async (rend) => {
    await c.nav(BASE + '?rend=' + rend + '&daily=1&mpuid=fpscheck', 12000);
    return await c.ev(`(async () => {
      for (let i = 0; i < 40; i++) {
        const b = game.scene.getScene('battle');
        if (game.scene.isActive('battle') && b && b.board && b.board.length === 16 && b.board.every(s => s && s.ch))
          return b.board.map(s => s.ch).join('');
        await new Promise(r => setTimeout(r, 1000));
      }
      return 'TIMEOUT';
    })()`);
  };
  const dGL = await dailyLetters('gl'), dCV = await dailyLetters('cv');
  ok('daily board letters identical across renderers (seed untouched)', dGL === dCV && dGL !== 'TIMEOUT',
    dGL + ' vs ' + dCV);

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

  console.log('\\n' + pass + ' passed, ' + fail + ' failed');
  if (c.errs.length) { console.log('EXCEPTIONS:'); c.errs.slice(0, 5).forEach(e => console.log('  ' + e.split('\\n')[0])); }
  else console.log('zero page exceptions');
  process.exit(fail || c.errs.length ? 1 : 0);
}
main().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
