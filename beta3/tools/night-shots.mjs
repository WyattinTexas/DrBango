// NIGHT-SHOTS — proof captures for the 10/8 night-sky round (preview branch).
// Boots the WORKTREE copy fresh (no skipIntro), lets the opening descent play,
// and captures: a filmstrip of the zenith→meadow transition, the settled home
// (painted title + sky), and the same settled home with ?art=0 for a true
// before/after. DPR 3, 390x844, Firebase blocked, /tmp/cdp-night wiped first.
//   node tools/night-shots.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const PORT = 9484, SRV = 8903;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.cwd() + '/tools/shots-night';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
try { rmSync('/tmp/cdp-night', { recursive: true, force: true }); } catch (e) { }
try { rmSync(OUT, { recursive: true, force: true }); } catch (e) { }
mkdirSync(OUT, { recursive: true });
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-night', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const until = async (e, cap = 30000, step = 200) => {
  for (let i = 0; i < cap / step; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(step); }
  return false;
};
const shot = async (n) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(OUT + '/' + n + '.png', Buffer.from(r.data, 'base64'));
};
const H = `game.scene.getScene('home')`;
const nudge = () => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 195, y: 820 });

async function boot(q) {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(400);
  // a returning player (chip-check's seed), so the home dresses its real UI
  await ev(`localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0&ftue=0' + (q ? '&' + q : '') });
  await nudge();
  await until(`!!window.game && !!${H} && ${H}.sys.isActive()`, 40000);
}

// ---- run 1: the painted build, intro descent filmed (pure-shot burst) ----
await boot('');
await nudge();
for (let i = 0; i < 34; i++) await shot('burst-' + String(i).padStart(2, '0'));
console.log('burst done');
await sleep(1400); await nudge(); await sleep(200);
await shot('home-painted');
const artState = await ev(`(() => { const h = ${H}; return [SSART.ready, !!SSART.img.nightsky, !!SSART.img.title, h.textures.exists('nightskyart'), h.textures.exists('title@art')].join(',') })()`);
console.log('art state [ready,nightskyImg,titleImg,skyTex,titleTex]:', artState);

// a deterministic filmstrip of the transition: the camera driven through the
// same positions the live descent traverses (p 1 = zenith … 0 = meadow)
try {
  for (const p of [1, 0.8, 0.6, 0.4, 0.2, 0]) {
    await ev(`(() => { const h = ${H}; h.sky.setP(${p}, 0); return 'ok' })()`); await sleep(320);
    await shot('strip-p' + String(p).replace('.', '_'));
  }
} catch (e) { console.log('strip drive failed:', e.message); }

// ---- run 2: ?art=0 — the procedural before, same framing ----
await boot('art=0');
await until(`(() => { const h = ${H}; return h.introPlaying === false })()`, 20000);
await sleep(1400); await nudge(); await sleep(200);
await shot('home-today');
try {
  await ev(`(() => { const h = ${H}; h.sky.setP(1, 0); return 'ok' })()`); await sleep(350);
  await shot('zenith-today');
} catch (e) { }

console.log('page exceptions:', errs.length ? errs.slice(0, 4) : 'none');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(0);
