// SKY-STAYS — proof captures for THE SKY STAYS (v0.119.0): a fight's ground is the
// painted night at its zenith and it never hands off to the procedural dot field.
// Boots the tree fresh at DPR 3 (390x844, Firebase blocked, /tmp/cdp-stays wiped) and
// captures: the settled home held at the zenith (the reference frame the rise lands
// on), QUICK PLAY by the real rise (beginAscent — the call every home door fires) at
// the battle's entry and ~5s into the fight, a DAILY fight, an ENDLESS climb with the
// level gate up and after the tap, and a CAMPAIGN fight (cadence-check's proven door).
// Every capture follows a throwaway mouseMoved (the idle-clock law). Beside the PNGs it
// reads the scene: the plate (skyPlate · 'nightskyart' · the zenith frame · the lowest
// child) stands at entry AND at +5s as the SAME object, no soft-dot field over it, and
// zero page exceptions. tools/shots-stays/compare.py judges the pixels afterwards.
//   node tools/sky-stays.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const PORT = 9487, SRV = 8905;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.cwd() + '/tools/shots-stays';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kids = [];
let pass = 0, fail = 0;
const ok = (name, cond, note) => { if (cond) pass++; else fail++; console.log((cond ? '  ✓ ' : '  ✗ ') + name + (note !== undefined && !cond ? '  [' + note + ']' : '')); };
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
// the served bytes are THIS tree's (a server rooted elsewhere would test the wrong game)
const served = await (await fetch('http://localhost:' + SRV + '/game.js')).text();
const servedV = (served.match(/const BUILD = 'STARSPELL v([\d.]+)'/) || [])[1];
console.log('serving :' + SRV + ' · BUILD ' + servedV + ' · ssZenithSky ' + (/function ssZenithSky/.test(served) ? 'present' : 'MISSING'));
try { rmSync('/tmp/cdp-stays', { recursive: true, force: true }); } catch (e) { }
try { rmSync(OUT, { recursive: true, force: true }); } catch (e) { }
mkdirSync(OUT, { recursive: true });
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-stays', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Network.setBlockedURLs', { urls: ['*firebaseio.com*', '*firebasedatabase.app*', '*firebase*', '*gstatic.com*'] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `navigator.share = undefined; navigator.clipboard = undefined;` });
const ev = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r?.result?.value;
};
const evj = async (e) => JSON.parse(await ev(e));
const until = async (e, cap = 30000, step = 200) => {
  for (let i = 0; i < cap / step; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(step); }
  return false;
};
const shot = async (n) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(OUT + '/' + n + '.png', Buffer.from(r.data, 'base64'));
};
const H = `game.scene.getScene('home')`, B = `game.scene.getScene('battle')`;
const nudge = () => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 195, y: 820 });
// the headless clock idles without input: ride it forward with a nudge every half second
const ride = async (ms) => { for (let t = 0; t < ms; t += 500) { await nudge(); await sleep(500); } };
const PICK = `!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`;
// the plate census: what the battle stands on
const PLATE = `JSON.stringify((() => { const b = ${B}; if (!b || !b.sys.isActive()) return null;
  const L = b.L, p = b.skyPlate, base = (o) => o.__ssBaseTex || (o.texture && o.texture.key || '').split('#')[0];
  // the standalone star dots (pips excluded): the thinned tiers are 27+16+8 at
  // scale ≤ 0.24·l.s (the home's over-art law); the old field was 110 at a raw
  // 0.3–1.1, never tied to l.s — count + the l.s-relative cap tell them apart
  const pips = new Set(b.pips || []);
  const dots = b.children.list.filter((o) => o.type === 'Image' && !o.parentContainer && !pips.has(o) && base(o) === 'dot');
  const maxS = dots.length ? +Math.max(...dots.map((o) => o.scaleX)).toFixed(3) : 0;
  return { plate: !!p && p.active, tex: p ? base(p) : null, y: p ? +p.y.toFixed(2) : null, y0: +L.y(0).toFixed(2),
    h: p ? +p.displayHeight.toFixed(2) : null, h0: +(2400 * L.s).toFixed(2), w: p ? +p.displayWidth.toFixed(2) : null, W: L.W,
    lowest: !!p && b.children.list.indexOf(p) === 0, same: !!p && window.__ssplate === p,
    dots: dots.length, add: dots.filter((o) => o.blendMode === 1).length, maxS, cap: +(0.24 * L.s).toFixed(3), state: b.state, mode: b.mode } })())`;
const plateOk = (c) => !!c && c.plate && c.tex === 'nightskyart' && c.y === c.y0 && c.h === c.h0 && c.w === c.W && c.lowest && c.dots === 51 && c.add === 8 && c.maxS <= c.cap;
async function boot(q, seed) {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(400);
  await ev(`localStorage.clear(); sessionStorage.clear(); ${seed || ''}
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0&ftue=0' + (q ? '&' + q : '') });
  await nudge();
  await until(`!!window.game && !!${H} && ${H}.sys.isActive()`, 40000);
}
const settleHome = async () => { await until(`${H}.introPlaying === false`, 20000); await sleep(600); await nudge(); };

console.log('\nSKY-STAYS · the fight stands on the painted night and never hands off\n');
// ---- 0. the reference: the settled home held at the zenith (the frame the rise lands on) ----
await boot(''); await settleHome();
ok('the home rides the painted plate (sky.art)', await ev(`!!${H}.sky.art`));
// grain hidden, as the rise hides it (beginAscent): the frame the landing actually blends from
await ev(`${H}.sky.grain.setVisible(false); ${H}.sky.setP(1, 0); 'ok'`); await nudge(); await sleep(400); await nudge();
await shot('home-zenith');

// ---- 1. QUICK PLAY by the real rise: entry, then five seconds in ----
console.log('— QUICK PLAY —');
await ev(`${H}.beginAscent({ mode: 'quick', resume: null, ascended: true }); 'ok'`);
ok('the rise lands in the battle', await until(`game.scene.isActive('battle') && !!${B}.skyPlate`, 12000, 100));
await nudge(); await shot('quick-entry');
let c = await evj(PLATE);
ok('entry: the painted plate stands under the fight (nightskyart · top at l.y(0) · 2400u tall · full width · lowest child)', plateOk(c), JSON.stringify(c));
ok('entry: no soft-dot field — the thinned 27/16/8 tiers only, all at or under 0.24·l.s, the near eight on ADD', !!c && c.dots === 51 && c.add === 8 && c.maxS <= c.cap, JSON.stringify(c));
await ev(`window.__ssplate = ${B}.skyPlate; 'ok'`);
ok('the board deals (state pick)', await until(PICK, 30000));
await ride(5000);
await shot('quick-5s');
c = await evj(PLATE);
ok('+5s: the SAME plate object stands, unmoved — no swap, no crossfade to the dot field', plateOk(c) && c.same, JSON.stringify(c));
ok('+5s: still no soft-dot field', !!c && c.dots === 51 && c.maxS <= c.cap, JSON.stringify(c));
ok('the home sleeps behind it (not stopped): the trip home stays a wake', await ev(`${H}.sys.isSleeping()`));

// ---- 2. DAILY: today's sky-of-the-day dress stands ON the plate ----
console.log('— DAILY —');
await boot(''); await settleHome();
await ev(`${H}.beginAscent({ mode: 'daily', resume: null, dailyResume: null, ascended: true }); 'ok'`);
ok('the rise lands in the daily', await until(`game.scene.isActive('battle') && ${B}.mode === 'daily' && !!${B}.skyPlate`, 12000, 100));
ok('the daily board deals', await until(PICK, 30000));
await ride(1200);
await shot('daily-fight');
c = await evj(PLATE);
ok('daily: the painted plate under the fight, no soft field', plateOk(c), JSON.stringify(c));
const sky = await evj(`JSON.stringify({ sky: ${B}.sky ? ${B}.sky.id : null, rib: window.__ssskyrib ? { shown: window.__ssskyrib.shown, id: window.__ssskyrib.id } : null })`);
console.log('    today\'s sky: ' + JSON.stringify(sky) + ' (a built sky heralds its ribbon over the plate; null = the stock daily)');
ok('a built sky still heralds its ribbon over the plate (or today is the stock daily)', !sky.sky || (sky.rib && sky.rib.shown), JSON.stringify(sky));

// ---- 3. ENDLESS: the level gate stands over the plate, then the fight ----
console.log('— ENDLESS —');
await boot('endless=1');
ok('the ?endless=1 door rises into the climb and deals the LEVEL 1 gate', await until(`game.scene.isActive('battle') && ${B}.mode === 'endless' && ${B}.state === 'gate'`, 60000, 200));
await ride(1500);
await shot('endless-gate');
c = await evj(PLATE);
ok('gate up: the painted plate under the card, no soft field', plateOk(c), JSON.stringify(c));
ok('the gate card stands over it (gateC active, the HUD dark, the score + ‹ kept)', await ev(`!!${B}.gateC && ${B}.gateC.active && ${B}.boardC.alpha === 0 && ${B}.scoreT.alpha === 1 && ${B}.homeB.alpha === 1`));
await ev(`window.__ssplate = ${B}.skyPlate; ${B}.gateZone.emit('pointerdown'); 'ok'`);
ok('a tap enters level 1', await until(PICK, 30000));
await ride(1200);
await shot('endless-fight');
c = await evj(PLATE);
ok('after the tap: the same plate, the board back at full', plateOk(c) && c.same && await ev(`${B}.boardC.alpha === 1`), JSON.stringify(c));

// ---- 4. CAMPAIGN: a fresh climb's first fight (cadence-check's door) ----
console.log('— CAMPAIGN —');
await boot('', `sessionStorage.setItem('beta3.skipIntro', '1');`);
await until(`${H}.introPlaying === false`, 20000);
await ev(`(() => { const h = ${H}; h.scene.start('battle', { mode: 'campaign', resume: h.campaignCheckpoint(), ascended: false }); return 'ok' })()`);
ok('the campaign fight deals', await until(PICK, 60000));
await ride(1200);
await shot('campaign-fight');
c = await evj(PLATE);
ok('campaign: the painted plate under the fight, no soft field', plateOk(c), JSON.stringify(c));
ok('the act name still heads the fight (modeTitle over the plate)', await ev(`${B}.headT.text.length > 0 && ${B}.headT.alpha > 0`), await ev(`${B}.headT.text`));

// ---- 5. the fallback: ?art=0 keeps the procedural field of old, byte-for-byte ----
console.log('— ?art=0 (the procedural fallback) —');
await boot('art=0&quick=1', `sessionStorage.setItem('beta3.skipIntro', '1');`);
ok('?art=0 quick fight deals', await until(PICK, 60000));
c = await evj(PLATE);
ok('no plate, the 110 soft dots as before (skyPlate null, raw scales past the cap)', !!c && !c.plate && c.dots === 110 && c.maxS > c.cap, JSON.stringify(c));

ok('zero page exceptions', errs.length === 0, errs.slice(0, 4).join(' | '));
console.log('\n' + pass + ' passed · ' + fail + ' failed · shots in tools/shots-stays');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
