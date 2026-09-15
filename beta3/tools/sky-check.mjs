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
// amendments riding the gated design data.
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
  && /const SS_MAG_OVR = /.test(gsrc) && /SS_STAR_GRADES = \{ versus: \[0\.20, 0\.35\], chart: \[0\.38, 0\.44, 0\.52\], showcase: 0\.80, battle: 1\.15 \}/.test(gsrc));
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
  { versus: [0.20, 0.35], chart: [0.38, 0.44, 0.52], showcase: 0.80, battle: 1.15 }, {}])`));
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

/* ---------- the verdict ---------- */
console.log('\n— PAGE EXCEPTIONS —');
ok('zero page exceptions across every boot', errs.length === 0, errs.join(' | ').slice(0, 300));
console.log(`\nSKY-CHECK: ${pass}/${pass + fail}${fail ? '  ✗ FAILURES: ' + fail : '  — all green'}`);
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
