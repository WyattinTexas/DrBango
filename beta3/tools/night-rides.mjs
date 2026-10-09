// NIGHT-RIDES — proof captures for THE PAINTED NIGHT on every sky ride (v0.118.0).
// Boots the tree fresh at DPR 3 (390x844, Firebase blocked, /tmp/cdp-rides wiped) and
// captures: a burst of the QUICK PLAY rise out of the meadow (the same beginAscent every
// home door fires), the dueling ground's still frame (versus dress over the plate), and
// the campaign-win DAWN home with a zenith→meadow strip, plus the ?art=0 dawn for a true
// before/after. Every capture follows a throwaway mouseMoved (the idle-clock law).
//   node tools/night-rides.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const PORT = 9485, SRV = 8903;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.cwd() + '/tools/shots-rides';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
try { rmSync('/tmp/cdp-rides', { recursive: true, force: true }); } catch (e) { }
try { rmSync(OUT, { recursive: true, force: true }); } catch (e) { }
mkdirSync(OUT, { recursive: true });
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-rides', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
  await ev(`localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0&ftue=0' + (q ? '&' + q : '') });
  await nudge();
  await until(`!!window.game && !!${H} && ${H}.sys.isActive()`, 40000);
  await until(`${H}.introPlaying === false`, 20000);
  await sleep(600); await nudge();
}

// ---- 1. the QUICK PLAY rise: the ascent every home door fires, burst-filmed ----
await boot('');
console.log('sky art on the home:', await ev(`!!${H}.sky.art`));
await ev(`${H}.beginAscent({ mode: 'quick', resume: null, ascended: true }); 'ok'`);
for (let i = 0; i < 16; i++) { await nudge(); await shot('rise-' + String(i).padStart(2, '0')); await sleep(60); }
console.log('rise burst done; arrived:', await ev(`${H}.arrived === true || game.scene.isActive('battle')`));

// ---- 2. the dueling ground: the versus dress standing on the plate ----
await boot('');
await ev(`${H}.scene.start('vsmenu'); 'ok'`);
await until(`game.scene.isActive('vsmenu')`, 15000);
await sleep(900); await nudge(); await sleep(150);
await shot('versus-ground');
console.log('versus ground sky art:', await ev(`!!game.scene.getScene('vsmenu').sky.art`));

// ---- 3. the campaign-win DAWN: painted night overhead, the sunrise below ----
await boot('dawn=1');
console.log('dawn sky art:', await ev(`!!${H}.sky.art`), '· dawn:', await ev(`${H}.isDawn === true`));
await shot('dawn-home');
for (const p of [1, 0.7, 0.5, 0.3]) {
  await ev(`${H}.sky.setP(${p}, 0); 'ok'`); await nudge(); await sleep(300);
  await shot('dawn-p' + String(p).replace('.', '_'));
}
// the dawn as it was (no plate), same framing, for the before/after
await boot('dawn=1&art=0');
await shot('dawn-today');
for (const p of [1, 0.5]) {
  await ev(`${H}.sky.setP(${p}, 0); 'ok'`); await nudge(); await sleep(300);
  await shot('dawn-today-p' + String(p).replace('.', '_'));
}
console.log('page exceptions:', errs.length ? errs.slice(0, 4) : 'none');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(0);
