// DOOR-SHOTS — proof captures for the home doors (B3 Gold Face v3, Skylar 10/20).
// Boots the WORKTREE copy fresh (no skipIntro), lets the opening descent play,
// and captures: a filmstrip of the zenith→meadow transition, the settled home
// (painted title + sky), and the same settled home with ?art=0 for a true
// before/after. DPR 3, 390x844, Firebase blocked, /tmp/cdp-doors wiped first.
//   node tools/night-shots.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const PORT = 9492, SRV = 8904;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.cwd() + '/tools/shots-doorart';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
try { rmSync('/tmp/cdp-doors', { recursive: true, force: true }); } catch (e) { }
try { rmSync(OUT, { recursive: true, force: true }); } catch (e) { }
mkdirSync(OUT, { recursive: true });
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-doors', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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

await boot('');
await until(`(() => { const h = ${H}; return h.introPlaying === false })()`, 30000);
await sleep(1600); await nudge(); await sleep(300);
await shot('home-doors');
const st = await ev(`(() => { const h = ${H}; return { door: DOOR_ART(), keys: Object.keys(h.rowBtns).map((k) => k + ':' + h.rowBtns[k].texture.key + ':' + h.rowBtns[k].visible) } })()`);
console.log('doors:', JSON.stringify(st));
// the live sub-lines both doors can carry
await ev(`(() => { const h = ${H}; h.setRowSub('versus', SS_T('vsFriendsOn', 2), '#ffe9a8', true); h.setRowSub('endless', SS_T('endlessBest', 14, 23810), DOOR_INK2(false), true); return 'ok' })()`);
await sleep(400);
await shot('home-doors-subs');
await boot('lang=fr');
await until(`(() => { const h = ${H}; return h.introPlaying === false })()`, 30000);
await sleep(1600);
await ev(`(() => { const h = ${H}; h.rowBtns.campaign.setVisible(true); h.rowLabels.campaign.setVisible(true); h.setRowSub('campaign', 'ACTE II  ·  combat 3', null, true); h.rowSubs.campaign.setVisible(true); h.layoutMenu(true); return 'ok' })()`);
await nudge(); await sleep(400);
await shot('home-doors-fr');
await ev(`localStorage.removeItem('beta3.lang'); 'ok'`);
await boot('art=0');
await until(`(() => { const h = ${H}; return h.introPlaying === false })()`, 30000);
await sleep(1600); await nudge(); await sleep(300);
await shot('home-art0');
console.log('page exceptions:', errs.length ? errs.slice(0, 4) : 'none');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(0);
