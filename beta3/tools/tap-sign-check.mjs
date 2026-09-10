// TAP-SIGN-CHECK — tappable sky signs: the centaur rears, the archer looses
// (v0.76.0, re-aimed v0.81.0).
// Skylar (9/2): "if you tap on the horse star sign when it's on the screen,
// it does a little animation where the horse is rearing." — and (9/3): the
// horse signs meant are CENTAURUS and SAGITTARIUS, and "Sagittarius should
// shoot a shooting star when you click on his constellation if it pops up
// on the main page." The meadow's beast showcase arms ONE tap zone while a
// sign in the SS_SKY_TAPS registry stands; a real tap plays that sign's own
// flourish — CENTAURUS rears on his hind hooves with both drawn forelegs
// pawing sparks; SAGITTARIUS lifts his aim, draws his authored bowstring
// and looses a shooting star down his own arrow line (the house
// ssShootingStar head-and-trail, made deliberate) — and every other sign
// (monoceros again included) stays pure presence. This suite proves: the
// registry resolves exactly the two; each zone's 44-pt law + star coverage
// + a live census that nothing interactive shares the showcase band; a REAL
// DPR-3 tap plays each flourish (rotation watched frame by frame, the
// figure never leaves the sky, no camera shake, transform restored exact;
// the star seen actually flying leftward down the aim line); mid-flourish
// taps are ignored, later taps play again; the 9s cycle catching a flourish
// mid-beat cuts it clean; a tap on unregistered monoceros does nothing; the
// home controls still hear their own taps; the wordless first open never
// arms; a scene restart mid-flourish leaves no stale state. ?show=<id> pins
// the showcase deal (the raw 9s rotation is random).
//
//   node tools/tap-sign-check.mjs        # self-launching: :8899 server if none, Chrome on :9476
//   SRV=8901 node tools/tap-sign-check.mjs   # serve+test on another port (a busy rig)
//
// ⚠ Every wait POLLS — never sleep-and-assert on scene-clock effects; no
// evaluate ever returns a Phaser object. Firebase blocked at the network
// layer. New-suite law: the boot preamble seeds beta3.skipIntro (the
// first-open gate would otherwise swallow a virgin boot) — §7 clears it on
// purpose to see the wordless meadow. Cold-boot law (A/B-proven on v0.75
// bytes): create-time cycle() bails on !isActive (status CREATING), so the
// sky stands empty until the first 9s tick — always WAIT for __SSSKY.armed.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const PORT = 9476, SRV = +(process.env.SRV || 8899);
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- §1 the paper: release ritual + the registry ---------- */
console.log('\n— §1 THE PAPER —');
const gsrc = readFileSync('game.js', 'utf8'), isrc = readFileSync('index.html', 'utf8');
const bld = (gsrc.match(/const BUILD = 'STARSPELL v([\d.]+)'/) || [])[1];
const stamps = [...isrc.matchAll(/\?v=([\d.]+)/g)].map((m) => m[1]);
ok('BUILD version read', !!bld, bld);
ok('12 cache stamps, all riding BUILD', stamps.length === 12 && stamps.every((s) => s === bld), stamps.join(','));
const reg = gsrc.match(/const SS_SKY_TAPS = \{([^}]*)\}/);
ok('the registry ships exactly the two horse signs', !!reg && reg[1].trim() === 'centaurus: ssSkyRearCentaur, sagittarius: ssSkyLooseStar', reg && reg[1].trim());

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-tapsign', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
await send('Page.addScriptToEvaluateOnNewDocument', { source: `navigator.share = undefined; navigator.clipboard = undefined;` });
const ev = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r?.result?.value;
};
const evj = async (e) => JSON.parse(await ev(e));
const until = async (e, cap = 30000, step = 250) => {
  for (let i = 0; i < cap / step; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(step); }
  return false;
};
const H = `game.scene.getScene('home')`;
const SKY = `window.__SSSKY`;
// a real DPR-3 tap on an object (its bounds' centre, camera- and dpr-mapped)
const tapObj = async (expr) => {
  const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await sleep(30);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(60);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  return p;
};
// …a raw tap at a design-space point (the layout's own mapping)
const tapAt = async (dx, dy) => {
  const p = JSON.parse(await ev(`(() => { const h = ${H}; const l = ssLayout(h); const cam = h.cameras.main;
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (l.x(${dx}) - cam.scrollX) / D, y: (l.y(${dy}) - cam.scrollY) / D }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await sleep(30);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(60);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
// …and one at the showcase container's own centre (no zone needed)
const tapShow = () => tapAt(0, 150);
const boot = async (q, prep) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(400);
  await ev(`localStorage.clear(); sessionStorage.clear(); ${prep} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2000);
  await until(`!!window.game && !!${H} && ${H}.sys.isActive()`, 30000);
};
const SEED = `sessionStorage.setItem('beta3.skipIntro', '1');
  localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 }));`;
// wait for a fresh 9s turn: the fade, then the rebuilt sign standing ready —
// leaves ~7s of clean runway so a ≤2s flourish can never collide with a cycle
const freshTurn = async (id2) => {
  if (!(await until(`${H}.showC.alpha < 0.9`, 14000, 25))) return false;
  return until(`${H}.showC.alpha === 1 && !!${H}.showFx && ${H}.showFx.ready === true && ${SKY}.armed === '${id2}'`, 9000, 100);
};
const restored = async () => evj(`(() => { const h = ${H};
  return JSON.stringify({ rot: h.showC.rotation, dx: Math.abs(h.showC.x - h.showFx.homeX), dy: Math.abs(h.showC.y - h.showFx.homeY), a: h.showC.alpha }) })()`);
// the zone laws, for whichever sign is pinned: 44-pt, star coverage, census
const zoneLaws = async (id2) => {
  const geo = await evj(`(() => { const h = ${H}, z = h.showZone, l = ssLayout(h);
    const b = SS_BEASTS['${id2}'], sc = l.u(0.8) * (b.boss ? 1.15 : b.tier === 'mini' ? 1.06 : 1);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of b.stars) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const D = game.scale.width / innerWidth, zb = z.getBounds();
    return JSON.stringify({ wCss: z.input.hitArea.width / D, hCss: z.input.hitArea.height / D,
      zx0: zb.x, zx1: zb.right, zy0: zb.y, zy1: zb.bottom,
      sx0: h.showC.x + x0 * sc, sx1: h.showC.x + x1 * sc, sy0: h.showC.y + y0 * sc, sy1: h.showC.y + y1 * sc }) })()`);
  ok(id2 + ': zone honours the 44-pt law', geo.wCss >= 44 && geo.hCss >= 44, Math.round(geo.wCss) + 'x' + Math.round(geo.hCss) + ' css pt');
  ok(id2 + ': zone covers the standing constellation', geo.zx0 <= geo.sx0 && geo.zx1 >= geo.sx1 && geo.zy0 <= geo.sy0 && geo.zy1 >= geo.sy1);
  const census = await evj(`(() => { const h = ${H}, zb = h.showZone.getBounds(); const hits = [];
    const walk = (list) => { for (const o of list) { if (o.list) walk(o.list);
      if (o !== h.showZone && o.input && o.input.enabled && o.getBounds) { const b = o.getBounds();
        if (b.x < zb.right && b.right > zb.x && b.y < zb.bottom && b.bottom > zb.y) hits.push((o.type || '?') + '@' + Math.round(b.x) + ',' + Math.round(b.y)); } } };
    walk(h.children.list); return JSON.stringify(hits) })()`);
  ok(id2 + ': census — nothing interactive shares the showcase band', census.length === 0, census.join(' '));
};

/* ---------- §2 the centaur stands, the zone obeys the laws, a real tap rears ---------- */
console.log('\n— §2 THE CENTAUR STANDS AND REARS —');
await boot('show=centaurus', SEED);
ok('meadow up with the centaur pinned', await until(`${SKY}.armed === 'centaurus' && !!${H}.showZone`, 25000));
ok('the live registry resolves exactly the two', await ev(
  `Object.keys(SS_SKY_TAPS).sort().join(',') === 'centaurus,sagittarius' && typeof SS_SKY_TAPS.centaurus === 'function' && typeof SS_SKY_TAPS.sagittarius === 'function'`));
ok('the standing sign really is centaurus, boss tier', await ev(`${H}.showFx.beast.id === 'centaurus' && ${H}.showFx.beast.boss === true`));
await zoneLaws('centaurus');
await until(`${H}.showFx.ready === true`, 9000, 100);
await freshTurn('centaurus');
const base = await evj(`(() => { const h = ${H}; return JSON.stringify({ x: h.showC.x, y: h.showC.y, s: ssLayout(h).s }) })()`);
await tapObj(`${H}.showZone`);
ok('the tap starts a rear', await until(`${SKY}.plays === 1`, 3000, 50));
let rotSeen = 0, dyMax = 0, dxMax = 0, shake = false;
for (let i = 0; i < 80; i++) {
  const s = await evj(`(() => { const h = ${H}; return JSON.stringify({ r: h.showC.rotation,
    dy: h.showC.y - ${base.y}, dx: h.showC.x - ${base.x}, sh: h.cameras.main.shakeEffect.isRunning, d: ${SKY}.done }) })()`);
  rotSeen = Math.max(rotSeen, s.r); dyMax = Math.max(dyMax, Math.abs(s.dy)); dxMax = Math.max(dxMax, Math.abs(s.dx));
  shake = shake || s.sh;
  if (s.d >= 1) break;
  await sleep(30);
}
ok('the figure visibly rears (rotation ridden up)', rotSeen > 0.2, 'peak ' + rotSeen.toFixed(3) + ' rad');
ok('it stays in the sky — never dives at the meadow', dyMax < 100 * base.s && dxMax < 100 * base.s,
  'Δ ' + Math.round(dxMax / base.s) + ',' + Math.round(dyMax / base.s) + ' design px');
ok('no camera shake — a flourish, not an attack', !shake);
ok('the rear finishes on its own', await until(`${SKY}.done === 1`, 4000, 50));
let r = await restored();
ok('the transform comes home exact', r.rot === 0 && r.dx < 0.5 && r.dy < 0.5, JSON.stringify(r));
await tapObj(`${H}.showZone`);
ok('a later tap plays it again — the sign stays alive', await until(`${SKY}.plays === 2 && ${SKY}.done === 2`, 5000, 50));

/* ---------- §3 repeated taps stay graceful ---------- */
console.log('\n— §3 REPEATED TAPS —');
await freshTurn('centaurus');
await tapObj(`${H}.showZone`);
await until(`${SKY}.plays === 3`, 3000, 50);
const blk0 = await ev(`${SKY}.blocked`);
await tapObj(`${H}.showZone`);   // mid-rear — the centaur is busy being a horse
ok('a mid-rear tap is ignored, never stacked', await until(`${SKY}.blocked === ${blk0} + 1 && ${SKY}.plays === 3`, 3000, 50));
ok('…and the rear still lands clean', await until(`${SKY}.done === 3`, 4000, 50));
r = await restored();
ok('no deformation after the ignored tap', r.rot === 0 && r.dx < 0.5 && r.dy < 0.5, JSON.stringify(r));

/* ---------- §6 the zone never steals; the guards hold under a sheet ---------- */
console.log('\n— §6 THE HOME CONTROLS KEEP THEIR TAPS —');
await tapObj(`${H}.dailyChipB`);
ok('the daily chip still opens its sheet with the zone armed', await until(`!!${H}.dailyC`, 5000));
const rr0 = await ev(`${SKY}.plays`);
await ev(`${H}.showZone.emit('pointerdown'); 'ok'`);   // the guard line itself, on the live objects
ok('the sheet guard turns a zone tap away', await ev(`${SKY}.plays === ${rr0} && ${SKY}.blocked >= 2`));
await tapShow();   // over the sign: the sheet's window (y120..680) stands above the zone there
await sleep(500);
ok('a real tap under the sheet never plays — the layer above owns it',
  await ev(`${SKY}.plays === ${rr0} && !!${H}.dailyC`));
await tapAt(0, 60);   // the veil above the window top — the sheet's own close door
ok('…and the sheet still closes by its veil', await until(`!${H}.dailyC`, 4000));
// (the streak lantern left the meadow in v0.86.0 — the daily chip above is
// the corner control that proves the sheets-over-zone law now)
ok('no lantern stands on the meadow to steal a tap', await ev(`!${H}.lanternB`) === true);
await freshTurn('centaurus');
const rr1 = await ev(`${SKY}.plays`);
await tapObj(`${H}.showZone`);
ok('after the sheets, the centaur still rears', await until(`${SKY}.plays === ${rr1 + 1}`, 3000, 50));
await until(`${SKY}.done === ${rr1 + 1}`, 5000, 50);   // let it settle before §4
await until(`${H}.showFx && !${H}.showFx.attacking`, 5000, 50);

/* ---------- §4 the 9s cycle catches a rear mid-beat ---------- */
console.log('\n— §4 THE CYCLE CUT —');
let cutProven = false, tries = 0;
while (!cutProven && tries < 3) {
  tries++;
  const c0 = await evj(`JSON.stringify({ r: ${SKY}.plays, c: ${SKY}.cut })`);
  if (!(await until(`${H}.showC.alpha < 0.9 && ${H}.showC.alpha > 0.2`, 14000, 20))) break;
  await tapObj(`${H}.showZone`);   // rear starts under the closing fade…
  const started = await until(`${SKY}.plays === ${c0.r} + 1`, 1200, 30);
  if (!started) continue;         // the race lost — the deal already turned; go again
  ok('a rear can start under the closing fade', true, 'try ' + tries);
  ok('…and the cycle cuts it clean', await until(`${SKY}.cut === ${c0.c} + 1`, 3000, 40));
  cutProven = true;
}
ok('cycle-cut path exercised', cutProven, tries + ' tries');
ok('the next deal stands undeformed and re-armed', await until(`(() => { const h = ${H};
  return h.showC.rotation === 0 && h.showC.alpha === 1 && ${SKY}.armed === 'centaurus' && !!h.showZone && !!h.showFx && !h.showFx.attacking })()`, 8000, 100));
ok('…and reaches ready for the next tap', await until(`${H}.showFx.ready === true`, 9000, 100));
const orphans = await ev(`${H}.showC.list.filter((o) => !o.active).length`);
ok('no orphaned fx ride the container', orphans === 0, String(orphans));

/* ---------- §8 a scene restart mid-rear leaves no stale state ---------- */
console.log('\n— §8 RESTART HYGIENE —');
await freshTurn('centaurus');
const rr2 = await ev(`${SKY}.plays`);
await tapObj(`${H}.showZone`);
await until(`${SKY}.plays === ${rr2} + 1`, 3000, 50);
await ev(`${H}.scene.restart(); 'ok'`);   // rotation-style rebuild, mid-rear
ok('the meadow rebuilds', await until(`${H}.sys.isActive() && !!${H}.showZone && ${SKY}.armed === 'centaurus'`, 20000));
ok('the rebuilt showcase stands level', await until(`${H}.showC.rotation === 0 && ${H}.showC.alpha === 1`, 5000, 100));
ok('…and rears again on a fresh tap', await (async () => {
  await until(`${H}.showFx && ${H}.showFx.ready === true`, 9000, 100);
  await freshTurn('centaurus');
  const n = await ev(`${SKY}.plays`);
  await tapObj(`${H}.showZone`);
  return until(`${SKY}.plays === ${n} + 1`, 3000, 50);
})());

/* ---------- §9 the archer looses a shooting star ---------- */
console.log('\n— §9 THE ARCHER LOOSES —');
await boot('show=sagittarius', SEED);
ok('meadow up with the archer pinned', await until(`${SKY}.armed === 'sagittarius' && !!${H}.showZone`, 25000));
ok('the standing sign really is sagittarius, boss tier', await ev(`${H}.showFx.beast.id === 'sagittarius' && ${H}.showFx.beast.boss === true`));
await zoneLaws('sagittarius');
await until(`${H}.showFx.ready === true`, 9000, 100);
await freshTurn('sagittarius');
const sbase = await evj(`(() => { const h = ${H}; return JSON.stringify({ x: h.showC.x, y: h.showC.y, s: ssLayout(h).s }) })()`);
await tapObj(`${H}.showZone`);
ok('the tap starts the loose', await until(`${SKY}.plays === 1`, 3000, 50));
let leanSeen = 0, sdyMax = 0, sdxMax = 0, sshake = false; const sxs = [];
for (let i = 0; i < 110; i++) {
  const s = await evj(`(() => { const h = ${H}; return JSON.stringify({ r: h.showC.rotation,
    dy: h.showC.y - ${sbase.y}, dx: h.showC.x - ${sbase.x}, sh: h.cameras.main.shakeEffect.isRunning,
    st: ${SKY}.stars, sx: ${SKY}.sx, d: ${SKY}.done }) })()`);
  leanSeen = Math.max(leanSeen, s.r); sdyMax = Math.max(sdyMax, Math.abs(s.dy)); sdxMax = Math.max(sdxMax, Math.abs(s.dx));
  sshake = sshake || s.sh;
  if (s.st > 0 && (sxs.length === 0 || s.sx !== sxs[sxs.length - 1])) sxs.push(s.sx);
  if (s.d >= 1) break;
  await sleep(30);
}
ok('the aim lifts (the draw seen)', leanSeen > 0.03, 'peak ' + leanSeen.toFixed(3) + ' rad');
ok('one star loosed', await ev(`${SKY}.stars === 1`));
const travel = sxs.length >= 2 ? sxs[0] - sxs[sxs.length - 1] : 0;
const leftward = sxs.every((v, i) => i === 0 || v < sxs[i - 1]);
ok('the star flies leftward down the aim line', sxs.length >= 3 && leftward && travel > 120 * sbase.s,
  sxs.length + ' samples, ' + Math.round(travel / sbase.s) + ' design px left, monotonic ' + leftward);
ok('the archer stays in the sky', sdyMax < 100 * sbase.s && sdxMax < 100 * sbase.s,
  'Δ ' + Math.round(sdxMax / sbase.s) + ',' + Math.round(sdyMax / sbase.s) + ' design px');
ok('no camera shake', !sshake);
ok('the loose finishes on its own (settle + flight both landed)', await until(`${SKY}.done === 1`, 5000, 50));
r = await restored();
ok('the transform comes home exact', r.rot === 0 && r.dx < 0.5 && r.dy < 0.5, JSON.stringify(r));
const sblk = await ev(`${SKY}.blocked`);
await tapObj(`${H}.showZone`);
ok('a later tap looses again', await until(`${SKY}.plays === 2 && ${SKY}.stars === 2`, 4000, 50));
await tapObj(`${H}.showZone`);   // mid-flight — the archer is busy
ok('a mid-loose tap is ignored', await until(`${SKY}.blocked === ${sblk} + 1 && ${SKY}.plays === 2`, 3000, 50));
ok('…and the second loose lands clean', await until(`${SKY}.done === 2`, 5000, 50));

/* ---------- §5 an unregistered sign stays pure presence (the swap proof) ---------- */
console.log('\n— §5 NOT A REGISTERED SIGN (MONOCEROS AGAIN UNARMED) —');
await boot('show=monoceros', SEED);
ok('monoceros pinned and standing', await until(`!!${H}.showFx && ${H}.showFx.beast.id === 'monoceros'`, 25000));
ok('no zone, nothing armed — the old horse is pure presence again', await ev(`${SKY}.armed === null && !${H}.showZone`));
await until(`${H}.showFx.ready === true`, 9000, 100);
await tapShow();
await sleep(700);
const vs = await evj(`JSON.stringify({ t: ${SKY}.taps, p: ${SKY}.plays, sheets: !!(${H}.dailyC || ${H}.streakC || ${H}.langC || ${H}.setC || ${H}.mapC || ${H}.signC),
  rot: ${H}.showC.rotation, home: ${H}.scene.isActive() })`);
ok('a tap on it does nothing at all', vs.t === 0 && vs.p === 0 && !vs.sheets && vs.rot === 0 && vs.home, JSON.stringify(vs));

/* ---------- §7 the wordless first open never arms the zone ---------- */
console.log('\n— §7 THE FIRST OPEN —');
await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(400);
await ev(`localStorage.clear(); sessionStorage.clear(); 'ok'`);   // a true virgin boot
await send('Page.navigate', { url: BASE + '?fps=0&ftue=1&show=centaurus' }); await sleep(1500);
ok('the wordless meadow rises', await until(`!!window.game && !!${H} && ${H}.sys.isActive() && ${H}.ftueBare === true && window.__ssftue && window.__ssftue.on === true`, 25000));
// the bare meadow keeps its showcase SLOT and never a zone (cold-boot law:
// the sky may stand empty pre-tick — the gate is what's ours to prove)
let bareClean = true;
for (let i = 0; i < 10 && bareClean; i++) {
  bareClean = await ev(`(() => { const h = ${H};
    return !!h.showC && !h.showZone && ${SKY}.armed === null && ${SKY}.taps === 0 })()`);
  await sleep(280);
}
ok('the showcase slot stands, the zone never arms while bare', bareClean);

ok('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
console.log(`\n${pass} passed, ${fail} failed`);
ws.close();
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
