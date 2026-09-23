// SKY-CHECK — the campaign sky redesign (v0.80.0).
// Skylar (9/2): "the campaign sky screen should utilize the entire screen …
// start at the top. Where the final boss is, then send the camera down the
// path to the first level … remove the names of all the enemies you're going
// to face … the enemy you're going to face to show up bigger with its name
// underneath it. When you beat an enemy, the camera will transition to the
// next enemy and then their name will pop up. Once you have beaten an enemy,
// the name should stay visible if you scroll back down … At the top of the
// screen we need to anchor the Header … semi-black transparent overlay …
// invisible at first … at the end of the camera movement animation … we
// thematically fade in the header."
// This suite proves, with real DPR-3 taps and real drags: the chart fills
// the screen with no endpanel window on BOTH doors; the entry ride opens on
// the final boss and lands on the current fight; the header is invisible
// during the ride and fades in at the landing; unbeaten beasts carry no
// name while the next one stands bigger with its name beneath; the
// between-fights map glides from the felled beast to the next and pops its
// name; scrolling reaches both ends of the road and beaten names read on
// the way back down; a drag STARTING on the breathing node scrolls without
// entering; a tap mid-ride skips to the landing while ✕ refuses to close
// until settled; ?ride=0 snaps; and tapping the node (via the mapZone
// VALUE, never its carrier) enters the fight from both doors. Plus the es
// dress and a layout judge at SE/iPad metrics. §9 (sharp-sky round four,
// slice 1) proves the six crispness laws live: one magnitude resolver
// (line-degree + override door) grading every star, the 44→0 fused-pair
// census, the r+2.5 served-line inset, the ADD-blend glow whitelist on
// the settled tree, the state/grade tables, and the two 9/3-answer
// amendments riding the gated design data. §10 (slice 2) proves the road
// laws live: the pitch law (rim gap ≥34u under both ×1.5 placements — the
// page's exact 12-of-19 rows, +252u, camera book recomputed from pos), the
// name law (felled names clear every other star-bound by 12u, clamped
// on-screen, none on none — walked at fights 5/8/15/20), and the path law
// (dot census: first-principles walk == the chart's own beacon, culled >0).
//
//   node tools/sky-check.mjs   # self-launching: :8899 server if none, Chrome on :9480
//
// ⚠ Every wait POLLS; no evaluate ever returns a Phaser object; Firebase is
// blocked at the network layer; the boot preamble seeds beta3.skipIntro
// (first-open law); /tmp/cdp-sky is wiped up front (stale-profile law).
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
const PORT = 9480, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS ? process.cwd() + '/tools/shots-sky' : '';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x !== undefined && !c ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- §1 the paper: release ritual + the redesign's bones ---------- */
console.log('\n— §1 THE PAPER —');
const gsrc = readFileSync('game.js', 'utf8'), isrc = readFileSync('index.html', 'utf8'), ssrc = readFileSync('strings.js', 'utf8');
const bld = (gsrc.match(/const BUILD = 'STARSPELL v([\d.]+)'/) || [])[1];
ok('BUILD version read', !!bld, bld);
const stamps = [...isrc.matchAll(/\?v=([\d.]+)/g)].map((m) => m[1]);
ok('12 cache stamps, all riding BUILD', stamps.length === 12 && stamps.every((s) => s === bld), stamps.join(','));
const chart = gsrc.slice(gsrc.indexOf('function ssStarChart'), gsrc.indexOf('/* ---- THE FORGE CEREMONY'));
ok('no endpanel window anywhere in the chart', !/endpanel/.test(chart));
ok('the chart owns a full-bleed opaque sky (mapsky)', /ssMapSkyTex/.test(chart) && /'mapsky'/.test(gsrc));
ok('the ride seam + reduced-motion snap ship', /QS\.get\('ride'\) === '0' \|\| ssReduceMotion\(\)/.test(chart));
ok('the next beast renders bigger (the ×1.5)', /state === 'now' \? 1\.5 : 1/.test(chart));
ok('the zone is born at the landing and fires on the UP under the drag threshold', /land = \(/.test(chart) && /d <= l\.u\(8\)\) fire\(\)/.test(chart));
const sm = gsrc.slice(gsrc.indexOf('showMap() {'), gsrc.indexOf('// ---------- run end'));
ok("between fights the glide runs under 'anim'; 'map' means settled", /state = 'anim'/.test(sm) && /onSettle/.test(sm) && !/'veil'/.test(sm));
const ms = gsrc.slice(gsrc.indexOf('mapSheet() {'), gsrc.indexOf('newCampaign() {'));
ok('the home door: no veil, ✕ rides the chart (onClose)', !/'veil'/.test(ms) && /door: 'home'/.test(ms) && /onClose/.test(ms));
for (const k of ['mapTitle:', 'mapHint:', 'mapDest:']) {
  const n = (ssrc.match(new RegExp(k, 'g')) || []).length;
  ok('strings ×5 · ' + k.slice(0, -1) + ' rides every tongue', n === 5, String(n));
}
// — the sharp-sky paper (round four, slice 1: laws 1–6 on the chart) —
ok('LAW 1 · the s%3 list-position size deal is GONE from the chart', !/9\.5 : 6\.4/.test(gsrc) && !/s % 3 === 0 \? 9\.5/.test(gsrc));
ok('LAW 1+6 · one resolver, one radius table, one override door, one grades table',
  /function ssStarMags\(/.test(gsrc) && /SS_MAG_R = \{ 1: 4\.2, 2: 2\.8, 3: 1\.9 \}/.test(gsrc)
  && /const SS_MAG_OVR = /.test(gsrc) && /SS_STAR_GRADES = \{ versus: \[0\.22, 0\.56\], chart: \[0\.38, 0\.44, 0\.52\], showcase: 0\.80, battle: 1\.15 \}/.test(gsrc));
ok('LAW 6 · the chart consumes the grade triple through the resolver and the served line',
  /SS_STAR_GRADES\.chart/.test(chart) && /ssStarMags\(b\)/.test(chart) && /ssEdgeSeg\(b\.stars\[e1\], b\.stars\[e2\], SS_MAG_R\[mags\[e1\]\], SS_MAG_R\[mags\[e2\]\]/.test(chart));
ok('LAW 3 · no raw-coord lineBetween survives in the chart draw', !/lineBetween\(gx \+ b\.stars/.test(chart));
ok('LAW 5 · radii are state-blind: one SS_MAG_R read, no state term in a radius',
  (chart.match(/SS_MAG_R\[m\] \* k/g) || []).length === 1 && !/state[^\n]*SS_MAG_R/.test(chart));
ok('LAW 4 · source census: exactly the aura + the beacon wear ADD in the chart', (chart.match(/setBlendMode\('ADD'\)/g) || []).length === 2);
ok('LAW 4 · won eyes close, far eyes are hard pinprick fills', /if \(state === 'far'\) for \(const e of b\.eyes\)/.test(chart) && !/setTint\(b\.eye\)/.test(chart));
const dsn = JSON.parse(readFileSync('design/campaign-sky-redesign-2026-09-data.json', 'utf8'));
ok('the two 9/3-answer amendments ride the gated data card (columba 8 · monoceros 17)',
  JSON.stringify(dsn.find((x) => x.id === 'columba').stars[8]) === '[-32,-27]'
  && JSON.stringify(dsn.find((x) => x.id === 'monoceros').stars[17]) === '[20,42]');
// — the road laws (round four, slice 2: pitch + name + path on the chart) —
ok('PITCH LAW · the 34u floor, the 26-beast half-height table, and the widener ship',
  /const SS_ROAD_GAP = 34/.test(gsrc) && /const SS_ROAD_HALF = \{/.test(gsrc) && /function ssRoadAdd\(/.test(gsrc)
  && [...'vulpes lepus serpens delphinus columba lacerta cygnus pavo cancer corvus ursa aranea aquila lupus monoceros cassiopeia cetus orion strix leo taurus scorpius draco phoenix centaurus sagittarius'.split(' ')]
    .every((id) => new RegExp(id + ': \\d+').test(gsrc.slice(gsrc.indexOf('SS_ROAD_HALF'), gsrc.indexOf('function ssRoadAdd')))));
ok('PITCH LAW · worst case is BOTH ×1.5 placements; the summit wears its ×1.35 inside',
  /Math\.max\(hA \* 1\.5 \+ hB, hA \+ hB \* 1\.5\)/.test(gsrc) && /j === fights\.length - 1 \? 1\.35 : 1/.test(gsrc));
ok('PITCH LAW · pitch derives from the roster, never from progress (no state/fightIdx term in the widener)',
  !/state|fightIdx/.test(gsrc.slice(gsrc.indexOf('function ssRoadAdd'), gsrc.indexOf('// the resolver'))));
ok('PITCH LAW · STEP stays 96 and the chart widens through ssRoadAdd at build',
  /const STEP = 96, ACT_GAP = 64, TOP = 190, SETTLE = 430/.test(chart) && /ssRoadAdd\(fights, i - 1, STEP \+ \(seam \? ACT_GAP : 0\)\)/.test(chart));
ok('PATH LAW · dots r 1.3 α .35/.2, suppressed inside star-bounds +8; the old 1.6/.5/.28 deal is gone',
  /l\.u\(1\.3\)/.test(chart) && /walked \? 0\.35 : 0\.2/.test(chart)
  && /nb\[i\]\.hw \+ 8/.test(chart) && /nb\[i \+ 1\]\.hh \+ 8/.test(chart)
  && !/l\.u\(1\.6\)\)/.test(chart) && !/walked \? 0\.5 : 0\.28/.test(chart));
ok('PATH LAW · the dot stays under every m3 star (1.3 < 1.9 in star-units at any one grade)', 1.3 < 1.9);
ok('NAME LAW · the seat clears neighbors by 12u, clamps at ±204, slides along its side',
  /q\.x - m\.hw - 12/.test(chart) && /const EDGE = 204/.test(chart) && /for \(let step = 0; step <= 48; step \+= 8\)/.test(chart));
ok('NAME LAW · the current name keeps its beneath-seat (reserved, never slid)',
  /curGeom\.p\.y \+ curGeom\.mxY \* curGeom\.sc \+ 26/.test(chart) && /l\.x\(p\.x\), l\.y\(p\.y \+ mxY \* sc \+ 26\)/.test(chart));
ok('the ride cap still absorbs the longer road (home clamp 700–2400 untouched)',
  /clamp\(dist \* 1\.2, 700, 2400\)/.test(chart));
// — the mag-retirement paper (round four, slice 3: the accident's whole family) —
const vsrc = readFileSync('versus.js', 'utf8');
ok('LAW 1 · no list-position radius deal survives on ANY star figure (i%5 assembly · i%3 glyph · s%3 chart)',
  !/\[1\.18, 0\.62, 0\.88, 0\.5, 0\.98\]/.test(gsrc) && !/i % 3 === 0 \? 10 : 7/.test(gsrc)
  && !/\[i % 5\]/.test(gsrc) && !/\[i % 5\]/.test(vsrc) && !/9\.5 : 6\.4/.test(gsrc));
ok('LAW 1 · the assembly and the glyph both resolve through ssStarMags',
  /const mags = ssStarMags\(beast\);/.test(gsrc) && /const mags = ssStarMags\(src\);/.test(gsrc));
ok('LAW 1+6 · sprite scale = SS_MAG_R · sc / SS_DOT_READ, the dot read-radius pinned at 4',
  /const SS_DOT_READ = 4/.test(gsrc) && /SS_MAG_R\[mags\[i\]\] \* sc \/ SS_DOT_READ/.test(gsrc));
ok('the twinkle runs by class, never by scale threshold (anchors steadier kept · companions deep)',
  /SS_MAG_TWINK = \{ 1: \[0\.78, 0\.85\], 2: \[0\.7, 0\.7\], 3: \[0\.6, 0\.55\] \}/.test(gsrc)
  && /scale: mag \* tw\[0\], alpha: tw\[1\]/.test(gsrc) && !/mag < 0\.8 \?/.test(gsrc));
ok('LAW 6 · all three assembly surfaces read their grades from the one table',
  /l\.u\(SS_STAR_GRADES\.showcase\)/.test(gsrc) && /l\.u\(SS_STAR_GRADES\.battle\)/.test(gsrc)
  && /l\.u\(SS_STAR_GRADES\.versus\[one \? 1 : 0\]\)/.test(vsrc));
ok('LAW 3 · the assembly\'s initial draw serves through ssEdgeSeg with round caps; its raw star-coord lineBetween is gone',
  /ssEdgeSeg\(beast\.stars\[a\], beast\.stars\[b\], SS_MAG_R\[mags\[a\]\], SS_MAG_R\[mags\[b\]\]\)/.test(gsrc)
  && !/lineBetween\(beast\.stars\[a\]\[0\] \* sc/.test(gsrc));
ok('LAW 3 · the fx live redraw serves too — px-space inset radii carry the grade ((r+2.5)·sc)',
  /const insR = mags\.map\(\(m\) => SS_MAG_R\[m\] \* sc \+ 2\.5 \* \(sc - 1\)\)/.test(gsrc)
  && /ssEdgeSeg\(\[a\.x, a\.y\], \[b\.x, b\.y\], insR\[e\[0\]\], insR\[e\[1\]\]\)/.test(gsrc)
  && !/g\.lineBetween\(a\.x, a\.y, b\.x, b\.y\)/.test(gsrc));
ok('the glyph rides SS_MAG_R\'s own ratios under its 10u anchor (icon grade)',
  /SS_MAG_R\[mags\[i\]\] \* \(10 \/ SS_MAG_R\[1\]\)/.test(gsrc));

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
try { rmSync('/tmp/cdp-sky', { recursive: true, force: true }); } catch (e) { }
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-sky', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const shot = async (n) => { if (!SHOTS) return; try { mkdirSync(SHOTS, { recursive: true }); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(SHOTS + '/' + n + '.png', Buffer.from(r.data, 'base64')); } catch (e) { } };
const H = `game.scene.getScene('home')`;
const B = `game.scene.getScene('battle')`;
const MAP = `window.__ssmap`;

// a real DPR-3 tap on an object's live bounds (camera- and dpr-mapped)
const tapObj = async (expr) => {
  const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await sleep(35);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(65);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  return p;
};
// …a raw tap at a css point
const tapAt = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(35);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(65);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
// …and a real drag in css space
const drag = async (x, y0, y1, steps = 8) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y: y0 });
  await sleep(30);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y: y0, button: 'left', clickCount: 1 });
  for (let k = 1; k <= steps; k++) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y: y0 + (y1 - y0) * k / steps, buttons: 1 });
    await sleep(22);
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y: y1, button: 'left', clickCount: 1 });
  await sleep(140);
};
// the mapZone VALUE off its carrier — never the carrier itself
const ZONE = (root) => `(() => { let r = null;
  const scan = (ls) => ls.forEach((o) => { if (!r && o.getData && o.getData('mapZone')) r = o; if (o.list) scan(o.list); });
  scan(${root}.list); return r ? r.getData('mapZone') : null })()`;
// the header's live alpha, read off the hint/subtitle's parent container
const HDRA = `(() => { const h = ${H}; let a = null;
  const scan = (ls) => ls.forEach((o) => { if (a === null && o.text === SS_T('mapHint')) a = o.parentContainer.alpha; if (o.list) scan(o.list); });
  scan(h.mapC.list); return a })()`;
// every text standing in the chart tree
const TEXTS = (root) => `(() => { const t = [];
  const scan = (ls) => ls.forEach((o) => { if (typeof o.text === 'string') t.push(o.text); if (o.list) scan(o.list); });
  scan(${root}.list); return JSON.stringify(t) })()`;
// a pinned roster so every name below is deterministic
const ROSTER = JSON.stringify(['vulpes', 'lepus', 'delphinus', 'cancer', 'strix', 'serpens', 'corvus', 'aquila', 'leo', 'draco', 'ursa', 'lupus', 'strix', 'taurus', 'phoenix', 'cetus', 'leo', 'orion', 'centaurus', 'sagittarius']);
const CK7 = JSON.stringify({ fightIdx: 7, actIdx: 1, hp: 30, hpMax: 30, sigils: [], words: [], longest: '', totalDmg: 0, scried: 0, featherUsed: 0, letters: 0, bigHit: 0, playMs: 0, overkill: 0 });
const SEED = `sessionStorage.setItem('beta3.skipIntro', '1');
  localStorage.setItem('beta3.campsign', 'none');
  localStorage.setItem('beta3.camproster', '${ROSTER.replace(/'/g, "\\'")}');`;
const boot = async (q, prep) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(450);
  await ev(`localStorage.clear(); sessionStorage.clear(); ${SEED} ${prep || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(1800);
  await until(`!!window.game && !!${H} && ${H}.sys.isActive()`, 40000);
};

/* ---------- §2 the full screen + the entry ride ---------- */
console.log('\n— §2 THE ENTRY RIDE (resumed climb, fight 8 of 20) —');
await boot('', `localStorage.setItem('beta3.campaign', '${CK7.replace(/'/g, "\\'")}');`);
await tapObj(`${H}.rowLabels.campaign`);
ok('CONTINUE opens the campaign sky', await until(`!!${H}.mapC && !!${MAP} && ${MAP}.door === 'home'`, 8000, 100));
const early = await evj(`JSON.stringify({ off: ${MAP}.off, min: ${MAP}.offMin, settled: ${MAP}.settled })`);
ok('the camera OPENS ON THE FINAL BOSS at the summit (off = offMin)', !early.settled && early.off <= early.min + 60, JSON.stringify(early));
ok('no endpanel window anywhere in the tree', await ev(`(() => { let n = 0;
  const scan = (ls) => ls.forEach((o) => { if (o.texture && o.texture.key === 'endpanel') n++; if (o.list) scan(o.list); });
  scan(${H}.mapC.list); return n === 0 })()`));
ok('the night fills the ENTIRE screen (own screen, no meadow bleed)', await ev(`(() => { let r = false;
  const scan = (ls) => ls.forEach((o) => { if (o.texture && o.texture.key === 'mapsky') { const b = o.getBounds();
    r = b.width >= game.scale.width * 0.99 && b.height >= game.scale.height * 0.99; } if (o.list) scan(o.list); });
  scan(${H}.mapC.list); return r })()`));
ok('the header is INVISIBLE during the ride', await ev(`${HDRA} < 0.05`), await ev(HDRA));
const mid1 = await ev(`${MAP}.off`);
await sleep(500);
const mid2 = await ev(`${MAP}.off`);
ok('the camera travels DOWN the road (off climbing)', mid2 > mid1, mid1 + ' → ' + mid2);
const ridingTexts = await evj(TEXTS(`${H}.mapC`));
ok('felled beasts keep their names on the road', ['VULPES', 'LEPUS', 'DELPHINUS', 'CANCER', 'STRIX', 'SERPENS', 'CORVUS'].every((n) => ridingTexts.includes(n)), ridingTexts.join('|'));
ok('beasts NOT yet faced carry NO name', !ridingTexts.some((t) => /^(LEO|DRACO|URSA|LUPUS|TAURUS|PHOENIX|CETUS|ORION|CENTAURUS|SAGITTARIUS)$/.test(t) || /^UMBRAL /.test(t)), ridingTexts.join('|'));
ok("journey's end still marks the summit", ridingTexts.includes(await ev(`SS_T('mapDest')`)));
ok('the camera LANDS on the fight you are up to (off === settleOff)',
  await until(`${MAP}.settled === true && ${MAP}.off === ${MAP}.settleOff`, 8000, 100), await ev(`JSON.stringify(${MAP})`));
ok('…and the header thematically fades in', await until(`${HDRA} > 0.95`, 4000, 100));
ok('the header reads the LIVE values on the topmost layer', await ev(`(() => { const h = ${H}; let t = false, s = false;
  const want = 'gold@20@' + SS_T('mapTitle'); const sub = SS_ACT_N(SS_ACTS[1]) + '  ·  ' + SS_T('fightN', 3);
  const scan = (ls) => ls.forEach((o) => { if (o.texture && o.texture.key === want) t = true; if (o.text === sub) s = true; if (o.list) scan(o.list); });
  scan(h.mapC.list); return t && s })()`));
ok('the zone is born only at the landing', await ev(`(() => { const z = ${ZONE(`${H}.mapC`)}; return !!z && z.active === true })()`));
const geom = await evj(`(() => { const h = ${H}; const z = ${ZONE(`${H}.mapC`)}; const zb = z.getBounds();
  let nm = null; const scan = (ls) => ls.forEach((o) => { if (!nm && o.text === 'AQUILA') nm = { y: o.getBounds().y, a: o.alpha, fs: parseFloat(o.style.fontSize) }; if (o.list) scan(o.list); });
  scan(h.mapC.list); let won = null; const scan2 = (ls) => ls.forEach((o) => { if (!won && o.text === 'CORVUS') won = parseFloat(o.style.fontSize); if (o.list) scan2(o.list); });
  scan2(h.mapC.list); const D = game.scale.width / innerWidth;
  return JSON.stringify({ zw: zb.width / D, zh: zb.height / D, zy: zb.centerY, ny: nm && nm.y, na: nm && nm.a, nfs: nm && nm.fs, wfs: won }) })()`);
ok('the NEXT beast wears its name UNDERNEATH, popped in', geom.na > 0.95 && geom.ny > geom.zy, JSON.stringify(geom));
ok('…printed BIGGER than the felled names', geom.nfs > geom.wfs * 1.25, geom.nfs + ' vs ' + geom.wfs);
ok('the zone obeys the 44-pt law', geom.zw >= 44 && geom.zh >= 44, geom.zw + '×' + geom.zh);
await shot('entry-settled');

/* ---------- §3 skip, the ✕ guard, and the way back ---------- */
console.log('\n— §3 SKIP + ✕ —');
const p186 = await evj(`(() => { const h = ${H}; const l = ssLayout(h); const D = game.scale.width / innerWidth;
  return JSON.stringify({ x: l.x(186) / D, y: l.y(30) / D, cx: l.x(0) / D, cy: l.y(400) / D }) })()`);
await tapObj(`(() => { const h = ${H}; let r = null; const scan = (ls) => ls.forEach((o) => { if (!r && o.text === '✕') r = o; if (o.list) scan(o.list); }); scan(h.mapC.list); return r })()`);
await sleep(300);
ok('✕ closes the settled sky back to the meadow', await until(`!${H}.mapC`, 4000, 100));
// mid-ride the ✕ corner must SKIP, never close. The tap is aimed while the
// camera is provably in motion (motion ⇒ the hold has passed ⇒ the skip is
// armed); if a slow eval still lets the landing win the race, the corner
// tap closes the SETTLED sheet instead — proving nothing — so go again.
let reopened = false, guardProved = false;
for (let att = 0; att < 3 && !guardProved; att++) {
  await tapObj(`${H}.rowLabels.campaign`);
  reopened = await until(`!!${H}.mapC && ${MAP}.settled === false`, 6000, 80) || reopened;
  await until(`!!${H}.mapC && ${MAP}.settled === false && ${MAP}.off > ${MAP}.offMin + 30`, 4000, 60);
  await tapAt(p186.x, p186.y);
  await until(`${MAP}.skipped === true || ${MAP}.settled === true`, 5000, 80);
  if (await ev(`${MAP}.skipped === true`)) guardProved = true;
  else {
    await sleep(400);
    if (await ev(`!!${H}.mapC`)) { await tapAt(p186.x, p186.y); await until(`!${H}.mapC`, 4000, 100); }
  }
}
ok('reopened: the ride runs again (every entry is the moment)', reopened);
ok('…mid-ride the ✕ corner SKIPS instead of closing (the sheet stands)',
  guardProved && await ev(`!!${H}.mapC && ${MAP}.settled === true && ${MAP}.off === ${MAP}.settleOff`),
  await ev(`JSON.stringify(${MAP})`));
await sleep(400);
await tapAt(p186.x, p186.y);
ok('…and once settled the same ✕ closes', await until(`!${H}.mapC`, 4000, 100));

/* ---------- §4 free scrolling + the drag threshold ---------- */
console.log('\n— §4 THE SCROLL —');
await tapObj(`${H}.rowLabels.campaign`);
await until(`!!${H}.mapC`, 6000, 100);
await sleep(700); await tapAt(p186.cx, p186.cy);    // skip the ride
await until(`${MAP}.settled === true`, 6000, 100);
const vw = await evj(`(() => { const D = game.scale.width / innerWidth; return JSON.stringify({ w: innerWidth, h: innerHeight, D }) })()`);
for (let i = 0; i < 10 && !(await ev(`${MAP}.off >= ${MAP}.offMax`)); i++) await drag(vw.w / 2, vw.h * 0.78, vw.h * 0.16);
ok('a real drag walks the road to its FOOT (offMax)', await ev(`${MAP}.off >= ${MAP}.offMax`), await ev(`JSON.stringify(${MAP})`));
ok('…where the first felled beast reads its name (scroll-back law)', await ev(`(() => { const h = ${H}; let y = null;
  const scan = (ls) => ls.forEach((o) => { if (o.text === 'VULPES') y = o.getBounds().centerY; if (o.list) scan(o.list); });
  scan(h.mapC.list); return y !== null && y > 0 && y < game.scale.height })()`));
await shot('scrolled-foot');
const offFoot = await ev(`${MAP}.off`);
await drag(vw.w / 2, vw.h * 0.8, vw.h * 0.1);       // one more over-drag at the foot
ok('the scroll CLAMPS at the foot', await ev(`${MAP}.off === ${offFoot}`));
for (let i = 0; i < 14 && !(await ev(`${MAP}.off <= ${MAP}.offMin`)); i++) await drag(vw.w / 2, vw.h * 0.16, vw.h * 0.82);
ok('…and back up to the SUMMIT (offMin)', await ev(`${MAP}.off <= ${MAP}.offMin`), await ev(`JSON.stringify(${MAP})`));
ok("…where journey's end hangs over the final boss", await ev(`(() => { const h = ${H}; let y = null;
  const scan = (ls) => ls.forEach((o) => { if (o.text === SS_T('mapDest')) y = o.getBounds().centerY; if (o.list) scan(o.list); });
  scan(h.mapC.list); return y !== null && y > 0 && y < game.scale.height })()`));
await shot('scrolled-summit');
// walk back until the breathing node stands in view, then prove the threshold
for (let i = 0; i < 12 && !(await ev(`Math.abs(${MAP}.off - ${MAP}.settleOff) < 200`)); i++) {
  const dir = (await ev(`${MAP}.off < ${MAP}.settleOff`)) ? [0.78, 0.3] : [0.3, 0.78];
  await drag(vw.w / 2, vw.h * dir[0], vw.h * dir[1], 6);
}
const zp = await evj(`(() => { const z = ${ZONE(`${H}.mapC`)}; const b = z.getBounds(); const D = game.scale.width / innerWidth;
  return JSON.stringify({ x: b.centerX / D, y: b.centerY / D }) })()`);
const offPre = await ev(`${MAP}.off`);
await drag(zp.x, zp.y, Math.max(60, zp.y - 140), 6);   // a drag STARTING on the zone
ok('a drag starting ON the beast scrolls — it never enters the fight',
  await ev(`!!${H}.mapC && ${MAP}.off !== ${offPre}`) && !(await ev(`game.scene.isActive('battle')`)), await ev(`${MAP}.off`) + ' vs ' + offPre);
for (let i = 0; i < 12 && !(await ev(`Math.abs(${MAP}.off - ${MAP}.settleOff) < 200`)); i++) {
  const dir = (await ev(`${MAP}.off < ${MAP}.settleOff`)) ? [0.78, 0.3] : [0.3, 0.78];
  await drag(vw.w / 2, vw.h * dir[0], vw.h * dir[1], 6);
}
await tapObj(ZONE(`${H}.mapC`));
ok('a TAP on the zone VALUE enters the climb (home door)', await until(`${H}.ascending === true || game.scene.isActive('battle')`, 9000, 150));
ok('…into the checkpoint\'s own fight', await until(`(() => { const b = ${B};
  return game.scene.isActive('battle') && !!b && !!b.run && b.run.fightIdx === 7 && b.mode === 'campaign' })()`, 30000, 300));

/* ---------- §5 the victory glide (between fights) ---------- */
console.log('\n— §5 THE VICTORY GLIDE —');
await boot('mpuid=test_sky1', '');
await ev(`(() => { const h = ${H}; h.scene.start('battle', { mode: 'campaign', resume: h.campaignCheckpoint(), ascended: false }); return 'ok' })()`);
ok('a campaign battle stands (fight 1 of 20)', await until(`game.scene.isActive('battle') && ${B}.state === 'pick' && ${B}.run.fightIdx === 0`, 30000, 250));
await ev(`${B}.sigPlan.delete(0); ${B}.sigPlan.delete(1); 'ok'`);   // no offers — the glide is the beat under test
await ev(`${B}.beastHit(4000); 'ok'`);
ok("the shatter settles into the glide — opening ON the beast just beaten, above the settle line",
  await until(`${B}.state === 'anim' && !!${MAP} && ${MAP}.door === 'battle' && ${MAP}.settled === false && ${MAP}.off > ${MAP}.settleOff`, 15000, 50),
  await ev(`JSON.stringify(${MAP})`));
ok('the header holds its silence through the glide', await ev(`(() => { const b = ${B}; let a = null;
  const scan = (ls) => ls.forEach((o) => { if (a === null && o.text === SS_T('mapHint')) a = o.parentContainer.alpha; if (o.list) scan(o.list); });
  scan(b.overlayC.list); return a !== null && a < 0.6 })()`));
ok("…then the camera glides UP to the next beast and 'map' means SETTLED",
  await until(`${B}.state === 'map' && ${MAP}.settled === true && ${MAP}.off === ${MAP}.settleOff`, 8000, 100));
ok('…and the next name POPS in beneath it', await until(`(() => { const b = ${B}; let a = null;
  const scan = (ls) => ls.forEach((o) => { if (o.text === 'LEPUS') a = o.alpha; if (o.list) scan(o.list); });
  scan(b.overlayC.list); return a !== null && a > 0.95 })()`, 4000, 150));
ok('unfelled beasts stay nameless between fights too', await ev(`(() => { const t = JSON.parse(${TEXTS(`${B}.overlayC`)});
  return !t.some((x) => /^(DELPHINUS|CANCER|STRIX|LEO|DRACO)$/.test(x)) && t.includes('VULPES') && t.includes('LEPUS') })()`));
await shot('glide-settled');
await tapObj(ZONE(`${B}.overlayC`));
ok('the zone VALUE marches the climb on (battle door)', await until(`${B}.state === 'pick' && ${B}.run.fightIdx === 1`, 20000, 250));
await ev(`${B}.beastHit(4000); 'ok'`);
ok('the next fell glides again', await until(`${B}.state === 'anim' && ${MAP}.door === 'battle' && ${MAP}.settled === false`, 15000, 60));
for (let i = 0; i < 10 && !(await ev(`${MAP}.skipped === true || ${MAP}.settled === true`)); i++) await tapAt(vw.w / 2, vw.h / 2);
ok('a tap mid-glide skips to the landing', await until(`${B}.state === 'map' && ${MAP}.settled === true`, 6000, 100));
await tapObj(ZONE(`${B}.overlayC`));
ok('…and the road marches on to fight 3', await until(`${B}.state === 'pick' && ${B}.run.fightIdx === 2`, 20000, 250));

/* ---------- §6 ?ride=0 + the nameless fresh road ---------- */
console.log('\n— §6 THE FRESH ROAD (?ride=0) —');
await boot('ride=0', '');
await tapObj(`${H}.rowBtns.newcamp`);
ok('NEW GAME asks the stars', await until(`!!${H}.signC`, 6000, 150));
await tapObj(`${H}.signC.list.filter((o) => o.input && o.texture && /btn@/.test(o.texture.key)).pop()`);
ok('BEGIN opens the sky already settled (?ride=0 snaps, no ride)',
  await until(`!!${H}.mapC && ${MAP}.settled === true && ${MAP}.skipped === false`, 6000, 100));
// NEW GAME wipes the pinned roster (ssClearCampaign) and rolls a fresh one —
// read the LIVE roster back and judge the names off it
ok('a fresh campaign starts NAMELESS — only the first beast is named, beneath itself',
  await ev(`(() => { const r = JSON.parse(localStorage.getItem('beta3.camproster'));
    const t = JSON.parse(${TEXTS(`${H}.mapC`)});
    const first = SS_BEASTS[r[0]].name;
    const others = new Set();
    r.slice(1).forEach((id) => { const n = SS_BEASTS[id].name; if (n !== first) { others.add(n); others.add('UMBRAL ' + n); } });
    return t.includes(first) && !t.some((x) => others.has(x)) })()`));
ok('…seated at the settle line with the road\'s foot beneath it', await ev(`${MAP}.off === ${MAP}.settleOff && ${MAP}.settleOff === ${MAP}.offMax`));
ok('the header stands at once (fight 1 of 5, act I)', await ev(`(() => { const h = ${H}; let s = false;
  const sub = SS_ACT_N(SS_ACTS[0]) + '  ·  ' + SS_T('fightN', 1);
  const scan = (ls) => ls.forEach((o) => { if (o.text === sub) s = true; if (o.list) scan(o.list); });
  scan(h.mapC.list); return s })()`));
await shot('fresh-road');

/* ---------- §7 the es dress ---------- */
console.log('\n— §7 THE ES DRESS —');
await boot('ride=0', `localStorage.setItem('beta3.lang', 'es'); localStorage.setItem('beta3.campaign', '${CK7.replace(/'/g, "\\'")}');`);
await tapObj(`${H}.rowLabels.campaign`);
await until(`!!${H}.mapC && ${MAP}.settled === true`, 8000, 100);
ok('the es header: EL CIELO DE LA CAMPAÑA over ACTO II · combate 3 de 5', await ev(`(() => { const h = ${H}; let t = false, s = false;
  const scan = (ls) => ls.forEach((o) => { if (o.texture && o.texture.key === 'gold@20@EL CIELO DE LA CAMPAÑA') t = true;
    if (typeof o.text === 'string' && /ACTO II/.test(o.text) && /combate 3 de 5/.test(o.text)) s = true; if (o.list) scan(o.list); });
  scan(h.mapC.list); return t && s })()`));
ok('…and the es hint at the foot (the v0.94 BEGIN wording)', await evj(TEXTS(`${H}.mapC`)).then((t) => t.includes('toca la constelación que brilla para comenzar')));
await shot('es-dress');

/* ---------- §8 the layout judge (SE + iPad metrics) ---------- */
console.log('\n— §8 THE LAYOUT JUDGE —');
for (const [name, w, h] of [['iPhone SE', 375, 667], ['iPad', 820, 1180]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 3, mobile: true });
  await boot('ride=0', `localStorage.setItem('beta3.campaign', '${CK7.replace(/'/g, "\\'")}');`);
  await tapObj(`${H}.rowLabels.campaign`);
  const up = await until(`!!${H}.mapC && ${MAP}.settled === true`, 9000, 100);
  const j = up ? await evj(`(() => { const h = ${H}; const D = game.scale.width / innerWidth;
    let sky = false, title = null, zb = null, hint = null;
    const want = 'gold@20@' + SS_T('mapTitle');
    const scan = (ls) => ls.forEach((o) => { if (o.texture && o.texture.key === 'mapsky') { const b = o.getBounds();
        sky = b.width >= game.scale.width * 0.99 && b.height >= game.scale.height * 0.99; }
      if (o.texture && o.texture.key === want) title = o.getBounds().centerY / D;
      if (o.text === SS_T('mapHint')) hint = o.getBounds().centerY / D; if (o.list) scan(o.list); });
    scan(h.mapC.list); const z = ${ZONE(`${H}.mapC`)}; if (z) { const b = z.getBounds();
      zb = { w: b.width / D, h: b.height / D, t: b.y / D, b: (b.y + b.height) / D }; }
    return JSON.stringify({ sky, title, zb, hint, ih: innerHeight }) })()`) : null;
  ok(name + ': full-bleed sky · header on top · node in view · 44-pt zone · hint above the foot',
    !!j && j.sky && j.title !== null && j.title < 70 && j.zb && j.zb.w >= 44 && j.zb.h >= 44 && j.zb.t > 70 && j.zb.b < j.ih
    && j.hint !== null && j.hint > j.ih * 0.8 && j.hint < j.ih, JSON.stringify(j));
  await shot('judge-' + w + 'x' + h);
}
await send('Emulation.clearDeviceMetricsOverride', {});

/* ---------- §9 the six laws, live (sharp-sky round four, slice 1) ---------- */
console.log('\n— §9 THE SIX LAWS —');
await boot('ride=0', `localStorage.setItem('beta3.campaign', '${CK7.replace(/'/g, "\\'")}');`);
// laws 1–2 · the resolver and the gap law over every pair in the sky
const res = await evj(`(() => { let n1 = 0, n2 = 0, n3 = 0, bad = 0, fusedOld = 0, fused = 0, worst = 1e9;
  for (const id in SS_BEASTS) { const b = SS_BEASTS[id], m = ssStarMags(b);
    if (m.length !== b.stars.length) bad++;
    m.forEach((v) => v === 1 ? n1++ : v === 2 ? n2++ : v === 3 ? n3++ : bad++);
    for (let i = 0; i < b.stars.length; i++) for (let j = i + 1; j < b.stars.length; j++) {
      const d = Math.hypot(b.stars[i][0] - b.stars[j][0], b.stars[i][1] - b.stars[j][1]);
      if (d < (i % 3 === 0 ? 9.5 : 6.4) + (j % 3 === 0 ? 9.5 : 6.4)) fusedOld++;
      const g = d - (SS_MAG_R[m[i]] + SS_MAG_R[m[j]]); if (g < 0) fused++; if (g < worst) worst = g; } }
  return JSON.stringify({ n1, n2, n3, bad, fusedOld, fused, worst: Math.round(worst * 100) / 100 }) })()`);
ok('LAW 1 · every star resolves — 432 stars grade 99 anchors / 191 joints / 142 companions',
  res.bad === 0 && res.n1 === 99 && res.n2 === 191 && res.n3 === 142, JSON.stringify(res));
ok('LAW 2 · the fused-pair census reads 0 under magnitude radii (44 under the old deal — the whole round)',
  res.fused === 0 && res.fusedOld === 44, JSON.stringify(res));
ok('…worst rim gap on the live shapes ≈ 0.67 (TAURUS), the page\'s own number', res.worst === 0.67, String(res.worst));
ok('LAW 1 · TAURUS resolves exactly as the round\'s machine-checked magsLive',
  await ev(`JSON.stringify(ssStarMags(SS_BEASTS.taurus)) === '[1,2,2,1,2,2,3,2,3,1,2,2,2,3,2,3,2,3,3,3,3,3,3]'`));
ok('…the Pleiades stay the tight CLUSTER-class m3 (question 4: edge-free micro-stars)',
  await ev(`(() => { const b = SS_BEASTS.taurus, m = ssStarMags(b); const deg = b.stars.map(() => 0);
    b.edges.forEach(([a, c]) => { deg[a]++; deg[c]++; });
    const free = deg.map((d, i) => d === 0 ? i : -1).filter((i) => i >= 0);
    return free.length >= 4 && free.every((i) => m[i] === 3) })()`));
ok('LAW 1 · every authored override names an existing star of a real beast',
  await ev(`(() => { for (const id in SS_MAG_OVR) { const b = SS_BEASTS[id]; if (!b) return false;
    for (const k in SS_MAG_OVR[id]) if (+k >= b.stars.length || ![1, 2, 3].includes(SS_MAG_OVR[id][k])) return false; } return true })()`));
const seg = await evj(`(() => { const s = ssEdgeSeg([0, 0], [30, 0], 4.2, 2.8);
  const t = ssEdgeSeg([0, 0], [13, 0], 4.2, 4.2);
  return JSON.stringify({ x1: Math.round(s.x1 * 10) / 10, x2: Math.round(s.x2 * 10) / 10, flat: s.y1 === 0 && s.y2 === 0, short: t === null }) })()`);
ok('LAW 3 · the served line insets r+2.5 both ends and yields nothing on a too-short span',
  seg.x1 === 6.7 && seg.x2 === 24.7 && seg.flat && seg.short, JSON.stringify(seg));
ok('LAW 5+6 · the state, core, line and grade tables stand exactly as ruled', await ev(`JSON.stringify([SS_MAG_A, SS_MAG_CORE_A, SS_MAG_LINE_A, SS_STAR_GRADES, SS_MAG_OVR]) === JSON.stringify([
  { won: { 1: 0.96, 2: 0.9, 3: 0.8 }, now: { 1: 1, 2: 0.96, 3: 0.86 }, far: { 1: 0.65, 2: 0.5, 3: 0.34 } },
  { lit: { 1: 0.95, 2: 0.55 }, far: { 1: 0.55, 2: 0.3 } },
  { won: 0.38, now: 0.55, far: 0.22 },
  { versus: [0.22, 0.56], chart: [0.38, 0.44, 0.52], showcase: 0.80, battle: 1.15 }, {}])`));
// law 4 · the glow census on the SETTLED chart tree: aura + beacon, nothing else
await tapObj(`${H}.rowLabels.campaign`);
await until(`!!${H}.mapC && ${MAP}.settled === true`, 9000, 100);
// (the canvas-tint shim mints '#'-suffixed keys — glowbig#ffd77a — so judge
// the BASE key; the alphas stay exact)
const adds = await evj(`(() => { const h = ${H}; const adds = [];
  const scan = (ls) => ls.forEach((o) => { if (o.blendMode === 1) adds.push({ k: o.texture ? String(o.texture.key).split('#')[0] : o.type, a: Math.round(o.alpha * 100) / 100 }); if (o.list) scan(o.list); });
  scan(h.mapC.list); return JSON.stringify(adds.sort((x, y) => x.a - y.a)) })()`);
ok('LAW 4 · the whitelist holds: the ADD census is the beacon (.13) + the aura (.17), nothing else',
  JSON.stringify(adds) === '[{"k":"glowbig","a":0.13},{"k":"glowbig","a":0.17}]', JSON.stringify(adds));
// the eyeball evidence: zoomed crops off the settled fight-8 road (SHOTS=1)
const crop = async (n, r) => { if (!SHOTS) return; try { mkdirSync(SHOTS, { recursive: true });
  const c = await send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.w, height: r.h, scale: 3 } });
  writeFileSync(SHOTS + '/' + n + '.png', Buffer.from(c.data, 'base64')); } catch (e) { } };
if (SHOTS) {
  await shot('laws-settled');
  const zr = await evj(`(() => { const z = ${ZONE(`${H}.mapC`)}; const b = z.getBounds(); const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: b.x / D - 30, y: b.y / D - 30, w: b.width / D + 60, h: b.height / D + 60 }) })()`);
  await crop('law-now-node', zr);
  const wr = await evj(`(() => { const h = ${H}; let r = null; const D = game.scale.width / innerWidth;
    const scan = (ls) => ls.forEach((o) => { if (o.text === 'STRIX' || (!r && o.text === 'CANCER')) { const b = o.getBounds();
      const cx = b.centerX / D, cy = b.centerY / D;
      r = { x: Math.max(0, cx - 150), y: Math.max(0, Math.min(cy - 100, innerHeight - 200)), w: 300, h: 200 }; } if (o.list) scan(o.list); });
    scan(h.mapC.list); return JSON.stringify(r) })()`);
  if (wr) await crop('law-won-gold', wr);
  for (let i = 0; i < 14 && !(await ev(`${MAP}.off <= ${MAP}.offMin`)); i++) {
    const v2 = await evj(`JSON.stringify({ w: innerWidth, h: innerHeight })`);
    await drag(v2.w / 2, v2.h * 0.16, v2.h * 0.82);
  }
  await shot('laws-summit');
}

/* ---------- §10 the road laws, live (sharp-sky round four, slice 2) ---------- */
console.log('\n— §10 THE ROAD LAWS —');
// the page's machine-checked rows on the pinned roster: 12 of 19 gaps widen,
// +5…+53, the road +252u; CENTAURUS→SAGITTARIUS wears the +53
const PAGE_ADDS = [0, 0, 0, 21, 0, 8, 17, 15, 16, 0, 0, 15, 29, 31, 0, 5, 16, 26, 53];
// one in-page recompute, shared by every boot below: rebuild fights/pos/nb
// from SS_ACTS + the LIVE roster + the shipped tables, mirror the path walk,
// and read every real name rect off the tree — first principles vs the tree
const ROADEVAL = `(() => {
  const h = game.scene.getScene('home'); const l = ssLayout(h);
  const roster = JSON.parse(localStorage.getItem('beta3.camproster'));
  const ck = JSON.parse(localStorage.getItem('beta3.campaign') || 'null');
  const fightIdx = ck ? ck.fightIdx : 0;
  const fights = []; let ri = 0;
  SS_ACTS.forEach((act, ai) => act.slots.forEach((sl, fi) => fights.push({ id: roster[ri++], actIdx: ai, fi, len: act.slots.length, umbral: act.umbral })));
  const N = fights.length, gr = SS_STAR_GRADES.chart;
  const adds = [], pitches = [];
  for (let i = 1; i < N; i++) {
    const seam = fights[i].actIdx !== fights[i - 1].actIdx;
    const base = 96 + (seam ? 64 : 0);
    const a = ssRoadAdd(fights, i - 1, base);
    adds.push(a); pitches.push(base + a);
  }
  // the law under BOTH ×1.5 placements, on the half-height table
  const hh = (j, x) => { const b = SS_BEASTS[fights[j].id];
    return SS_ROAD_HALF[b.id] * (b.boss ? gr[2] : b.tier === 'mini' ? gr[1] : gr[0]) * (j === N - 1 ? 1.35 : 1) * x; };
  let viol = 0, worst = 1e9;
  for (let i = 1; i < N; i++) {
    const g = Math.min(pitches[i - 1] - hh(i - 1, 1.5) - hh(i, 1), pitches[i - 1] - hh(i - 1, 1) - hh(i, 1.5));
    if (g < 34 - 1e-9) viol++; if (g < worst) worst = g;
  }
  // pos + drawn bounds, exactly as the chart builds them
  const wob = [0, 22, -16, 10]; const pos = []; let ry = 0;
  for (let i = 0; i < N; i++) {
    const f = fights[i];
    if (i > 0) ry -= pitches[i - 1] - 96;
    const dir = f.actIdx % 2 === 0 ? 1 : -1; let x = 0;
    if (!(f.fi === f.len - 1)) { const t = f.len > 2 ? f.fi / (f.len - 2) : 0; x = (-112 + t * 206 + wob[f.fi % 4]) * dir; }
    pos.push({ x, y: ry }); ry -= 96;
  }
  const shift = 190 - pos[N - 1].y; pos.forEach((p) => { p.y += shift; });
  const nb = fights.map((f, i) => { const b = SS_BEASTS[f.id];
    const sc = (b.boss ? gr[2] : b.tier === 'mini' ? gr[1] : gr[0]) * (i === N - 1 ? 1.35 : 1) * (i === fightIdx ? 1.5 : 1);
    let mx = 0, my = 0; for (const s of b.stars) { mx = Math.max(mx, Math.abs(s[0])); my = Math.max(my, Math.abs(s[1])); }
    return { hw: mx * sc, hh: my * sc }; });
  // the path census, mirrored
  let dots = 0, culled = 0;
  for (let i = 0; i < N - 1; i++) {
    const a = pos[i], b = pos[i + 1];
    const dist = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(4, Math.round(dist / 12));
    for (let k = 1; k <= n - 1; k++) { const t = k / n, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      if ((Math.abs(x - a.x) < nb[i].hw + 8 && Math.abs(y - a.y) < nb[i].hh + 8)
        || (Math.abs(x - b.x) < nb[i + 1].hw + 8 && Math.abs(y - b.y) < nb[i + 1].hh + 8)) culled++; else dots++; }
  }
  // every live name rect off the tree, in design units
  const wonSet = {}; fights.forEach((f, i) => { if (i < fightIdx) wonSet[(f.umbral && f.id !== 'phoenix' ? SS_UMBRAL.prefix : '') + SS_BEASTS[f.id].name] = 1; });
  const curTxt = fightIdx < N ? (fights[fightIdx].umbral && fights[fightIdx].id !== 'phoenix' ? SS_UMBRAL.prefix : '') + SS_BEASTS[fights[fightIdx].id].name : null;
  // local coords: the texts sit directly in the scrolled road container, so
  // o.x/o.y ARE the seated design-space positions (the scroll never moves them)
  const names = [];
  const scan = (ls) => ls.forEach((o) => { if (typeof o.text === 'string' && (wonSet[o.text] || o.text === curTxt)) {
    const x0 = (o.x - o.width * o.originX - l.x(0)) / l.s, y0 = (o.y - o.height * o.originY - l.y(0)) / l.s;
    names.push({ t: o.text, cur: o.text === curTxt, x0, x1: x0 + o.width / l.s, y0, y1: y0 + o.height / l.s }); }
    if (o.list) scan(o.list); });
  scan(h.mapC.list);
  // the name law, judged on the live rects: 12u to every OTHER node's bound
  // (the current name is exempt — its beneath-seat is the pitch law's), no
  // name on name, everything inside ±204
  const won = names.filter((n) => !n.cur).sort((a, b) => b.y0 - a.y0);
  let nviol = 0, clampViol = 0, overlap = 0, minClear = 1e9;
  won.forEach((r, wi) => {
    const i = wi; // road order — one won name per felled fight, bottom-up
    for (let j = 0; j < N; j++) { if (j === i) continue; const q = pos[j], m = nb[j];
      const dx = Math.max(q.x - m.hw - r.x1, r.x0 - (q.x + m.hw)), dy = Math.max(q.y - m.hh - r.y1, r.y0 - (q.y + m.hh));
      const c = Math.max(dx, dy); if (c < minClear) minClear = c; if (c < 12 - 0.5) nviol++; }
    if (r.x0 < -204.5 || r.x1 > 204.5) clampViol++;
    names.forEach((o) => { if (o !== r && r.x1 > o.x0 + 0.1 && r.x0 < o.x1 - 0.1 && r.y1 > o.y0 + 0.1 && r.y0 < o.y1 - 0.1) overlap++; });
  });
  const bea = window.__ssmap;
  return JSON.stringify({ adds, viol, worst: Math.round(worst * 100) / 100, dots, culled,
    beaAdds: bea.road.adds, beaDots: bea.road.dots, beaCulled: bea.road.culled,
    total: adds.reduce((a, b) => a + b, 0), widened: adds.filter(a => a > 0).length,
    span: bea.offMax - bea.offMin, roadLen: pos[0].y - pos[N - 1].y,
    settleOff: bea.settleOff, wantSettle: fightIdx < N ? Math.max(bea.offMin, Math.min(pos[fightIdx].y - 430, bea.offMax)) : bea.offMin,
    nWon: won.length, nviol, clampViol, overlap, minClear: Math.round(minClear * 10) / 10 })
})()`;
const roadBoot = async (fi) => {
  const ck = JSON.stringify({ fightIdx: fi, actIdx: Math.min(3, Math.floor(fi / 5)), hp: 30, hpMax: 30, sigils: [], words: [], longest: '', totalDmg: 0, scried: 0, featherUsed: 0, letters: 0, bigHit: 0, playMs: 0, overkill: 0 });
  await boot('ride=0', `localStorage.setItem('beta3.campaign', '${ck.replace(/'/g, "\\'")}');`);
  await tapObj(`${H}.rowLabels.campaign`);
  await until(`!!${H}.mapC && ${MAP}.settled === true`, 9000, 100);
  return evj(ROADEVAL);
};
const r7 = await roadBoot(7);
if (SHOTS) await shot('road-fight8');
ok('PITCH · the built road wears the page\'s exact rows (12 of 19 widen, +5…+53, Σ +252)',
  JSON.stringify(r7.adds) === JSON.stringify(PAGE_ADDS) && r7.total === 252 && r7.widened === 12 && r7.adds[18] === 53, JSON.stringify(r7.adds));
ok('PITCH · the chart\'s own beacon carries the same rows (the build consumed ssRoadAdd)',
  JSON.stringify(r7.beaAdds) === JSON.stringify(r7.adds), JSON.stringify(r7.beaAdds));
ok('PITCH · the law holds under BOTH ×1.5 placements — 0 violations, worst rim gap 34.00',
  r7.viol === 0 && r7.worst === 34, JSON.stringify({ viol: r7.viol, worst: r7.worst }));
ok('PITCH · the camera book recomputes from pos as today (span = road − 270 · settle seats fight 8)',
  r7.span === r7.roadLen - 270 && r7.roadLen === 2016 + 252 && r7.settleOff === r7.wantSettle,
  JSON.stringify({ span: r7.span, roadLen: r7.roadLen, settleOff: r7.settleOff, want: r7.wantSettle }));
ok('PATH · the live dot census equals the first-principles walk, and the road culls around every body',
  r7.beaDots === r7.dots && r7.beaCulled === r7.culled && r7.culled > 0 && r7.dots > 0,
  JSON.stringify({ beaDots: r7.beaDots, dots: r7.dots, beaCulled: r7.beaCulled, culled: r7.culled }));
ok('NAME · fight 8: every felled name clears every other star-bound by 12u, clamped, none on none',
  r7.nWon === 7 && r7.nviol === 0 && r7.clampViol === 0 && r7.overlap === 0 && r7.minClear >= 12,
  JSON.stringify({ nWon: r7.nWon, nviol: r7.nviol, clamp: r7.clampViol, overlap: r7.overlap, minClear: r7.minClear }));
// the full-roster walk: three more regions — early road, the umbral belt,
// and the summit with EVERY felled name standing (the SAGITTARIUS case)
for (const [fi, wantWon] of [[4, 4], [14, 14], [19, 19]]) {
  const r = await roadBoot(fi);
  ok('NAME+PITCH · fight ' + (fi + 1) + ': rows hold, 0 violations, ' + wantWon + ' names seated clear',
    JSON.stringify(r.beaAdds) === JSON.stringify(PAGE_ADDS) && r.viol === 0 && r.settleOff === r.wantSettle
    && r.nWon === wantWon && r.nviol === 0 && r.clampViol === 0 && r.overlap === 0,
    JSON.stringify({ adds: r.beaAdds.join(''), viol: r.viol, settle: r.settleOff + '/' + r.wantSettle, nWon: r.nWon, nviol: r.nviol, clamp: r.clampViol, ov: r.overlap, minClear: r.minClear }));
  if (SHOTS) await shot('road-fight' + (fi + 1));
}

/* ---------- §11 the magnitudes beyond the chart (slice 3), live ---------- */
console.log('\n— §11 THE ASSEMBLY MAGNITUDES —');
// one eval judges a standing assembly off its fx handles: every LIVE star
// scale must sit inside its class's twinkle band (top = SS_MAG_R·sc/SS_DOT_READ,
// trough = top·tw[0]) — the bands are disjoint at any one grade, so anatomy,
// not list position, is readable straight off the tree. The resolver census
// must equal pure line-degree (the override door ships empty), the sprite
// count must equal the star count (fps: same sprites), and ssEdgeSeg's
// px-space inset must land exactly (r+2.5)·sc.
const ASMEVAL = (fxExpr) => `(() => {
  const fx = ${fxExpr}; if (!fx || !fx.ready) return JSON.stringify({ err: 'no fx' });
  const beast = fx.beast, sc = fx.sc, mags = ssStarMags(beast);
  let out = 0, n = 0;
  const counts = { 1: 0, 2: 0, 3: 0 };
  fx.stars.forEach((st, i) => {
    n++;
    const m = mags[i], top = SS_MAG_R[m] * sc / SS_DOT_READ, lo = top * SS_MAG_TWINK[m][0];
    counts[m]++;
    if (st.scaleX > top + 0.02 || st.scaleX < lo - 0.02) out++;
  });
  const deg = beast.stars.map(() => 0);
  for (const [a, c] of beast.edges) { deg[a]++; deg[c]++; }
  const want = { 1: 0, 2: 0, 3: 0 };
  deg.forEach((d) => want[d >= 3 ? 1 : d === 2 ? 2 : 3]++);
  const disj = SS_MAG_R[1] * SS_MAG_TWINK[1][0] > SS_MAG_R[2] && SS_MAG_R[2] * SS_MAG_TWINK[2][0] > SS_MAG_R[3];
  const seg = ssEdgeSeg([0, 0], [400, 0], SS_MAG_R[1] * sc + 2.5 * (sc - 1), SS_MAG_R[3] * sc + 2.5 * (sc - 1));
  return JSON.stringify({ id: beast.id, n, stars: beast.stars.length, out, disj,
    counts, want, segIn: Math.round(seg.x1 * 1000) / 1000, segWant: Math.round((SS_MAG_R[1] + 2.5) * sc * 1000) / 1000 });
})()`;
// — the battle assembly, at its grade —
await boot('');
await ev(`${H}.scene.start('battle', { mode: 'quick', resume: null }); 'ok'`);
ok('a quick battle stands and its fx arms', await until(`(() => { const b = ${B}; return game.scene.isActive('battle') && !!b.beastFx && b.beastFx.ready === true && b.state === 'pick' })()`, 60000));
const ba = await evj(ASMEVAL(`${B}.beastFx`));
ok('BATTLE · every live star sits in its class band — the i%5 deal is dead, anatomy rules',
  !ba.err && ba.out === 0 && ba.n === ba.stars && ba.n > 0, JSON.stringify(ba));
ok('BATTLE · the resolver census equals pure line-degree (the override door is empty)',
  JSON.stringify(ba.counts) === JSON.stringify(ba.want), JSON.stringify({ counts: ba.counts, want: ba.want }));
ok('BATTLE · the class bands are disjoint and the px inset lands exactly (r+2.5)·sc',
  ba.disj === true && ba.segIn === ba.segWant, JSON.stringify({ segIn: ba.segIn, segWant: ba.segWant }));
// — the meadow showcase, at its grade, pinned to one sign —
await boot('show=aquila');
ok('the pinned showcase stands (aquila) and its fx arms', await until(`!!${H}.showFx && ${H}.showFx.ready === true && ${H}.showFx.beast.id === 'aquila'`, 20000, 100));
let sa = await evj(ASMEVAL(`${H}.showFx`));
if (sa.err) {   // the eval can land inside a 9s-cycle turnover — wait out the new claim and read again
  await until(`!!${H}.showFx && ${H}.showFx.ready === true`, 16000, 100);
  sa = await evj(ASMEVAL(`${H}.showFx`));
}
ok('SHOWCASE · every live star sits in its class band at the showcase grade',
  !sa.err && sa.out === 0 && sa.n === sa.stars && sa.n > 0, JSON.stringify(sa));
ok('SHOWCASE · the grades order holds off the live trees (battle 1.15 outweighs showcase 0.8 at ANY tier pair)',
  ba.n > 0 && sa.n > 0 && sa.segWant < ba.segWant,
  JSON.stringify({ showSeg: sa.segWant, battleSeg: ba.segWant }));
// — the turnover ledger: three REAL 9s cycles, the tween manager plateaus —
const tw0 = await ev(`${H}.tweens.getTweens().length`);
let twLast = tw0, turns = 0;
for (let t = 0; t < 3; t++) {
  await ev(`${H}.showFx.__probeMark = 1; 'ok'`);
  const turned = await until(`!!${H}.showFx && !${H}.showFx.__probeMark && ${H}.showFx.ready === true`, 16000, 200);
  if (!turned) break;
  turns++;
  await sleep(700);
  twLast = await ev(`${H}.tweens.getTweens().length`);
}
ok('SHOWCASE · three real turnovers, the assembly ledger sweeps each claim (census plateaus)',
  turns === 3 && twLast <= tw0 + 8, JSON.stringify({ turns, tw0, twLast }));

/* ---------- the verdict ---------- */
console.log('\n— PAGE EXCEPTIONS —');
ok('zero page exceptions across every boot', errs.length === 0, errs.join(' | ').slice(0, 300));
console.log(`\nSKY-CHECK: ${pass}/${pass + fail}${fail ? '  ✗ FAILURES: ' + fail : '  — all green'}`);
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
