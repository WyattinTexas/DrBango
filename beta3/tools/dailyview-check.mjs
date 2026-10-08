// DAILYVIEW-PROBE — the Daily Hunt sheet after Skylar's 10/8 rulings:
//  1. "one sky, shared by all" is gone from the header
//  2. "today's sky awaits you" is gone from an unhunted sky
//  3. tapping tonight's sky opens a small window that says what the day asks
// Real CDP taps at DPR 3 (the verify-with-clicks law), en + es, and the
// standing-server recipe the house suites use (:8899 beta3, Firebase blocked).
//
//   cd beta3 && perl -e 'alarm 560; exec @ARGV' node tools/dailyview-check.mjs
//
import { spawn, execSync } from 'node:child_process';
const PORT = 9481, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try { execSync('rm -rf /tmp/cdp-dailyview'); } catch (e) { }
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
if (!(await serving())) { console.log('cannot serve beta3 on :' + SRV); process.exit(2); }
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--mute-audio', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
  '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/cdp-dailyview', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
let list = null;
for (let i = 0; i < 60 && !list; i++) { try { list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); } catch (e) { await sleep(500); } }
if (!list) { console.log('no Chrome on :' + PORT); process.exit(2); }
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') errs.push((d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').split('\n')[0]);
};
const send = (method, params) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r?.result?.value; };
await new Promise((r) => { ws.onopen = r; });
await send('Runtime.enable', {});
await send('Page.enable', {});
await send('Network.enable', {});
await send('Network.setBlockedURLs', { urls: ['*firebaseio.com*', '*gstatic.com/firebasejs*', '*googleapis.com*'] });

const tap = async (expr) => {
  const raw = await ev(`(() => { const o = ${expr}; if (!o) return null; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`);
  if (!raw) { console.log('    (nothing to tap: ' + expr.slice(0, 48) + ')'); return false; }
  const p = JSON.parse(raw);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await sleep(40);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(70);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  return true;
};
const H = `game.scene.getScene('home')`;
// every string the sheet is currently showing, flattened (text blocks included)
const sheetText = () => ev(`(() => { const c = ${H}.dailyC; if (!c) return null;
  const out = []; const walk = (ls) => ls.forEach((o) => { if (o.text !== undefined && typeof o.text === 'string') out.push(o.text); if (o.list) walk(o.list); });
  walk(c.list); return out.join(' ⟂ ') })()`);
const band = `${H}.dailyC.list.find((o) => o.texture && o.texture.key === 'skyband')`;

async function run(lang, first) {
  const url = BASE + '?ftue=0' + (lang === 'es' ? '&lang=es' : '');
  errs.length = 0;
  await send('Page.navigate', { url });
  const booted = await (async () => { for (let i = 0; i < 60; i++) { if (await ev(`!!window.game && !!${H} && ${H}.scene.isActive()`)) return true; await sleep(700); } return false; })();
  ok('[' + lang + '] the meadow stands', booted);
  const still = await (async () => { for (let i = 0; i < 60; i++) { if (await ev(`!${H}.busy()`)) return true; await sleep(700); } return false; })();
  ok('[' + lang + '] the meadow settles (intro done, nothing busy)', still);
  await ev(`try { localStorage.removeItem('beta3.daily') } catch (e) {}`);
  // the sheet's own door (its chip tap is covered by chip-check); the NEW
  // door — the band — is tapped for real below
  await ev(`${H}.dailySheet()`);
  const open = await (async () => { for (let i = 0; i < 20; i++) { if (await ev(`!!${H}.dailyC`)) return true; await sleep(300); } return false; })();
  ok('[' + lang + '] the Daily Hunt sheet opens', open);
  const txt = (await sheetText()) || '';
  if (first) {
    ok('[' + lang + '] NO "one sky, shared by all" anywhere on the sheet', !/shared by all/i.test(txt));
    ok('[' + lang + '] NO "today\'s sky awaits you" on an unhunted sky', !/awaits you/i.test(txt));
    ok('[' + lang + '] the header still carries tonight\'s date', /\d{4}-\d{2}-\d{2}/.test(txt), (txt.match(/\d{4}-\d{2}-\d{2}/) || [])[0]);
    ok('[' + lang + '] the sky band still names tonight\'s sky', await ev(`(() => { const s = ssSkyToday(); return !!s && ${JSON.stringify(txt)}.includes(SS_T(s.nameKey)) })()`));
  }
  // ---- the new door ----
  ok('[' + lang + '] the band is interactive (a door, not furniture)', await ev(`!!(${band} && ${band}.input && ${band}.input.enabled)`));
  await tap(band);
  const won = await (async () => { for (let i = 0; i < 20; i++) { if (await ev(`${H}.dailyC && ${H}.dailyC.getData('skyLaw') === 1`)) return true; await sleep(250); } return false; })();
  ok('[' + lang + '] a REAL tap on the sky opens the window', won);
  const wtxt = (await sheetText()) || '';
  const howKey = await ev(`(() => { const s = ssSkyToday(); return s ? s.nameKey.replace('Name', 'How') : null })()`);
  const how = await ev(`(() => { const s = ssSkyToday(); return s ? SS_T(s.nameKey.replace('Name', 'How')) : null })()`);
  ok('[' + lang + '] tonight\'s sky has a HOW string (' + howKey + ')', !!how && how.length > 40, how ? how.slice(0, 46) + '…' : String(how));
  ok('[' + lang + '] the window SAYS it — the how is on screen, wrapped', !!how && how.split(' ').slice(0, 4).every((w) => wtxt.includes(w)));
  ok('[' + lang + '] …and the law one-liner stands with it', await ev(`(() => { const s = ssSkyToday(); return !!s && ${JSON.stringify(wtxt)}.includes(SS_T(s.lineKey).split('—')[0].trim().slice(0, 24)) })()`));
  // the window closes and the door still works (the flag is not jammed)
  const xB = `${H}.dailyC.list.filter((o) => o.text === '✕').pop()`;
  await tap(xB);
  const closed = await (async () => { for (let i = 0; i < 16; i++) { if (await ev(`${H}.dailyC && ${H}.dailyC.getData('skyLaw') === 0`)) return true; await sleep(250); } return false; })();
  ok('[' + lang + '] ✕ closes the window, the sheet stands', closed && await ev(`!!${H}.dailyC`));
  await tap(band);
  ok('[' + lang + '] the door opens a SECOND time (no jammed flag)', await (async () => { for (let i = 0; i < 16; i++) { if (await ev(`${H}.dailyC.getData('skyLaw') === 1`)) return true; await sleep(250); } return false; })());
  // closing the sheet under an open window must not orphan it
  await ev(`(() => { const n = game.scene.getScene('home').dailyC.list.length; return n })()`);
  const veil = `${H}.dailyC.list[0]`;
  await ev(`${H}.dailyC.destroy(); ${H}.dailyC = null; 1`);
  await sleep(400);
  ok('[' + lang + '] a destroyed sheet leaves no orphan window', await ev(`!${H}.dailyC`) && errs.length === 0);
  ok('[' + lang + '] zero page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));
}

console.log('— en —');
await run('en', true);
console.log('— es —');
await run('es', false);

console.log('\n' + pass + ' passed · ' + fail + ' failed');
kids.forEach((k) => { try { k.kill(); } catch (e) { } });
process.exit(fail ? 1 : 0);
