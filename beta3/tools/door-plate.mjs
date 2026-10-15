// DOOR-PLATE — a settled home at DPR 3 with the door column hidden (a clean plate
// for true-size button mocks) + the doors' device-pixel bounds + labels (json).
//   node tools/door-plate.mjs      → tools/shots-doors/{home-nodoors.png,home-doors.png,doors.json}
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const PORT = 9490, SRV = 8903;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.cwd() + '/tools/shots-doors';
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
if (!list) { console.log('no Chrome'); process.exit(2); }
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') { const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200); if (!/WebGL context/.test(t)) errs.push(t); }
};
await new Promise((r) => ws.onopen = r);
const send = (m, p) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Network.setBlockedURLs', { urls: ['*firebaseio.com*', '*firebasedatabase.app*', '*firebase*', '*gstatic.com*'] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `navigator.share = undefined; navigator.clipboard = undefined;` });
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed'); return r?.result?.value; };
const until = async (e, cap = 30000, step = 200) => { for (let i = 0; i < cap / step; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(step); } return false; };
const shot = async (n) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + n + '.png', Buffer.from(r.data, 'base64')); };
await send('Page.navigate', { url: BASE + '/../ascent.html' }); await sleep(400);
await ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); 'ok'`);
await send('Page.navigate', { url: BASE + '?fps=0&ftue=0' });
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 195, y: 820 });
const H = `game.scene.getScene('home')`;
await until(`!!window.game && !!${H} && ${H}.sys.isActive()`, 40000);
await until(`window.__ssintro === 'done' || window.__ssintro === 'skipped' || window.__ssintro === 'reduced'`, 30000);
await sleep(900);
await shot('home-doors');
const doors = await ev(`(() => { const h = ${H}; const out = []; for (const m of h.menuRows) { if (!m.b.visible) continue; const b = m.b.getBounds(); out.push({ key: m.key, x: b.x, y: b.y, w: b.width, h: b.height, label: m.lab.text, labelPx: m.lab.style.fontSize, color: m.lab.style.color, sub: m.sub && m.sub.visible ? m.sub.text : '', dark: m.key === 'newcamp' }); } return JSON.stringify({ W: h.scale.width, H: h.scale.height, doors: out }); })()`);
writeFileSync(OUT + '/doors.json', doors);
await ev(`(() => { const h = ${H}; for (const m of h.menuRows) { m.b.setVisible(false); m.lab.setVisible(false); if (m.sub) m.sub.setVisible(false); if (m.lab.vsGlyphs) m.lab.vsGlyphs.forEach((g) => g.setVisible(false)); } return 'ok' })()`);
await sleep(300);
await shot('home-nodoors');
console.log(doors.slice(0, 400)); console.log('exceptions:', errs.length ? errs.slice(0, 3) : 'none');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(0);
