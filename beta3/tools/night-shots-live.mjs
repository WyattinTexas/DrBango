// NIGHT-SHOTS-LIVE — the same two captures (zenith hold + settled home) off
// the MAIN tree (= what ships today), for the honest before/after pair.
//   node tools/night-shots-live.mjs   (run from the worktree; serves ~/DrBango/beta3)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
const PORT = 9486, SRV = 8904;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.cwd() + '/tools/shots-night';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kids = [];
kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: homedir() + '/DrBango/beta3', stdio: 'ignore' }));
for (let i = 0; i < 40; i++) { try { if ((await fetch(BASE)).ok) break; } catch (e) { } await sleep(250); }
try { rmSync('/tmp/cdp-night2', { recursive: true, force: true }); } catch (e) { }
mkdirSync(OUT, { recursive: true });
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-night2', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
let list = null;
for (let i = 0; i < 60 && !list; i++) { try { list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); } catch (e) { await sleep(500); } }
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
await new Promise((r) => ws.onopen = r);
const send = (m, p) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Network.setBlockedURLs', { urls: ['*firebaseio.com*', '*firebasedatabase.app*', '*firebase*', '*gstatic.com*'] });
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;
const until = async (e, cap = 30000) => { for (let i = 0; i < cap / 250; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(250); } return false; };
const shot = async (n) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(OUT + '/' + n + '.png', Buffer.from(r.data, 'base64')); };
const nudge = () => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 195, y: 820 });
await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(400);
await ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); 'ok'`);
await send('Page.navigate', { url: BASE + '?fps=0&ftue=0' });
await nudge();
await until(`!!window.game && !!game.scene.getScene('home') && game.scene.getScene('home').sys.isActive()`, 40000);
await sleep(900); await nudge();
await shot('live-zenith');
await until(`game.scene.getScene('home').introPlaying === false`, 20000);
await sleep(1400); await nudge(); await sleep(200);
await shot('live-home');
console.log('live shots done');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(0);
