// FLARE-FILM — screencast the settled home (the wordmark's flare) for ~7s.
// Frames land in tools/film-flare/ as jpg + times.json.   node tools/flare-film.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const PORT = 9489, SRV = 8903;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.cwd() + '/tools/film-flare';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
try { rmSync('/tmp/cdp-flare', { recursive: true, force: true }); } catch (e) { }
try { rmSync(OUT, { recursive: true, force: true }); } catch (e) { }
mkdirSync(OUT, { recursive: true });
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-flare', '--window-size=390,844', '--force-device-scale-factor=2', 'about:blank'], { stdio: 'ignore' }));
let list = null;
for (let i = 0; i < 60 && !list; i++) { try { list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); } catch (e) { await sleep(500); } }
if (!list) { console.log('no Chrome'); process.exit(2); }
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); let fn = 0; const times = []; const errs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') { const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200); if (!/WebGL context/.test(t)) errs.push(t); }
  if (d.method === 'Page.screencastFrame') {
    const p = d.params;
    writeFileSync(OUT + '/f' + String(fn).padStart(4, '0') + '.jpg', Buffer.from(p.data, 'base64'));
    times.push(p.metadata.timestamp); fn++;
    ws.send(JSON.stringify({ id: ++id, method: 'Page.screencastFrameAck', params: { sessionId: p.sessionId } }));
  }
};
await new Promise((r) => ws.onopen = r);
const send = (m, p) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Network.setBlockedURLs', { urls: ['*firebaseio.com*', '*firebasedatabase.app*', '*firebase*', '*gstatic.com*'] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `navigator.share = undefined; navigator.clipboard = undefined;` });
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r?.result?.value; };
const until = async (e, cap = 30000, step = 200) => { for (let i = 0; i < cap / step; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(step); } return false; };
await send('Page.navigate', { url: BASE + '/../ascent.html' }); await sleep(400);
await ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); 'ok'`);
await send('Page.navigate', { url: BASE + '?fps=0&ftue=0' });
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 195, y: 820 });
const H = `game.scene.getScene('home')`;
await until(`!!window.game && !!${H} && ${H}.sys.isActive()`, 40000);
console.log('intro done:', await until(`window.__ssintro === 'done' || window.__ssintro === 'skipped' || window.__ssintro === 'reduced'`, 30000));
await sleep(600);
await send('Page.startScreencast', { format: 'jpeg', quality: 86, maxWidth: 780, maxHeight: 1688, everyNthFrame: 2 });
await sleep(7500);
await send('Page.stopScreencast');
writeFileSync(OUT + '/times.json', JSON.stringify(times));
console.log('frames:', fn, 'span s:', fn ? (times[fn - 1] - times[0]).toFixed(2) : 0, 'exceptions:', errs.length ? errs.slice(0, 3) : 'none');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(0);
