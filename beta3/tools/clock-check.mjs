// CLOCK-CHECK — the active-play run clock (v0.61.0).
// The run timer counts only what is actually played: visible + focused +
// inside a live run screen. A locked phone / backgrounded tab freezes the
// loop and its whole absence lands as ONE giant delta on the way back —
// dropped by the heartbeat (SS_CLOCK_STEP_MAX), never back-filled. Focus
// stops the clock only on a real blur EVENT; a false document.hasFocus()
// alone is never trusted (headless boots report false with nobody gone).
// Every stop signal folds playMs into the campaign checkpoint (clockV 2);
// an unversioned (pre-v0.61) checkpoint's playMs migrates through a cap of
// 15 min per fight reached.
//
// The rig: Date.now is skewed by window.__skew (installed before any page
// script), visibilityState/hidden read window.__vis, hasFocus reads
// window.__foc (null = focused — the stub hands the test the wheel, since
// bare headless would report false forever). Advancing __skew while the
// loop runs lands the whole jump in ONE delta — exactly what a frozen tab
// does on wake. Firebase is blocked at the network layer throughout.
//
//   node tools/clock-check.mjs      # self-launching: :8899 server if none, Chrome on :9457
//
// ⚠ Every wait POLLS — never sleep-and-assert on scene-clock effects.
import { spawn } from 'node:child_process';
const PORT = 9457, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-clock', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
// the rig rides every navigation: a skewable clock, a steerable visibility
// state and a steerable hasFocus — installed before any page script parses
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => {
    const _now = Date.now; window.__skew = 0;
    Date.now = () => _now.call(Date) + window.__skew;
    window.__vis = null;
    Object.defineProperty(document, 'visibilityState', { get: () => window.__vis || 'visible', configurable: true });
    Object.defineProperty(document, 'hidden', { get: () => (window.__vis || 'visible') === 'hidden', configurable: true });
    window.__foc = null;
    document.hasFocus = () => window.__foc == null ? true : window.__foc;
    navigator.share = undefined; navigator.clipboard = undefined;
  })();`,
});
const ev = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r?.result?.value;
};
const evj = async (e) => JSON.parse(await ev(e));
const until = async (e, cap = 45000, step = 300) => {
  for (let i = 0; i < cap / step; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(step); }
  return false;
};
const B = `game.scene.getScene('battle')`;
const PICK = `!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`;
const pm = async () => await ev(`${B}.run.playMs | 0`);
const ck = async () => evj(`JSON.stringify(JSON.parse(localStorage.getItem('beta3.campaign')))`);
// event dispatchers — these run the page's real listeners
const hide = async () => ev(`window.__vis = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); 'ok'`);
const show = async () => ev(`window.__vis = null; document.dispatchEvent(new Event('visibilitychange')); 'ok'`);
const blur = async () => ev(`window.__foc = false; window.dispatchEvent(new Event('blur')); 'ok'`);
const focus = async () => ev(`window.__foc = null; window.dispatchEvent(new Event('focus')); 'ok'`);
const skew = async (ms) => ev(`window.__skew += ${ms}; 'ok'`);
// every text on the battle scene, containers walked too (the end window
// lives inside overlayC)
const texts = async () => evj(`(() => { const out = [];
  const walk = (l) => l.forEach((o) => { if (o.list) walk(o.list); if (o.text != null) out.push(String(o.text)); });
  walk(${B}.children.list); return JSON.stringify(out) })()`);
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1');
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
// start a campaign battle straight from the meadow — the clock does not care
// how the scene was entered, and the ascent is the flows' own suites' job
const startCampaign = async () => {
  await until(`game.scene.getScene('home') && game.scene.getScene('home').sys.isActive()`, 20000);
  await ev(`(() => { const h = game.scene.getScene('home');
    h.scene.start('battle', { mode: 'campaign', resume: h.campaignCheckpoint(), ascended: false }); return 'ok' })()`);
  return until(PICK, 60000);
};

/* ================= the live clock, quick run ================= */
console.log('\n— THE CLOCK RUNS ONLY WHILE PLAYED —');
await boot('quick=1');
ok('quick run at pick', await until(PICK, 60000));
ok('the wall-clock anchor is gone from the run', await ev(`${B}.run.startAt === undefined`));
ok('runElapsed reads the accumulator, nothing else', await ev(`${B}.runElapsed() === (${B}.run.playMs | 0)`));
let p0 = await pm();
await sleep(2500);
let p1 = await pm();
ok('visible + focused: the clock ticks with the wall', p1 - p0 >= 1600 && p1 - p0 <= 5000, p0 + ' → ' + p1);

console.log('\n— THE FROZEN TAB: ONE GIANT DELTA, DROPPED —');
p0 = await pm();
await skew(3600000);   // an hour vanishes between two frames — a lock, an app switch
await sleep(800);
p1 = await pm();
ok('the hour lands in one delta and is dropped', p1 - p0 < 3000, p0 + ' → ' + p1);
await sleep(1400);
ok('…and the clock resumes where it stopped', (await pm()) - p1 >= 700, p1 + ' → ' + await pm());

console.log('\n— HIDDEN (visibilitychange) —');
p0 = await pm();
await hide(); await sleep(400);
await skew(30000);
await sleep(1200);
await show(); await sleep(600);
p1 = await pm();
ok('a hidden span adds nothing', p1 - p0 < 1500, p0 + ' → ' + p1);
await sleep(1500);
ok('…and the return resumes it', (await pm()) - p1 >= 900, p1 + ' → ' + await pm());

console.log('\n— BLUR / FOCUS (the loop keeps running) —');
p0 = await pm();
await blur();
for (let i = 0; i < 5; i++) { await skew(2000); await sleep(250); }   // deltas under the cap — the focus gate must hold alone
p1 = await pm();
ok('a blurred span adds nothing, even in small steps', p1 - p0 < 600, p0 + ' → ' + p1);
await ev(`window.__foc = null; 'ok'`);   // hasFocus() turns true again, but NO focus event fires
await sleep(1300);
ok('a live hasFocus() heals a missed focus event', (await pm()) - p1 >= 700, p1 + ' → ' + await pm());
p0 = await pm();
await ev(`window.__foc = false; 'ok'`);  // hasFocus() lies false with NO blur event
await sleep(1300);
ok('a false hasFocus() alone never stops the clock', (await pm()) - p0 >= 700, p0 + ' → ' + await pm());
await focus();

console.log('\n— THE END SCREEN —');
await ev(`${B}.run.playMs = 754321; ${B}.endRun(false); 'ok'`);
ok('the run ends', await until(`${B}.state === 'end'`, 15000));
let tx = await texts();
ok('the ledger tells the honest mm:ss', tx.includes('12:34'), tx.filter((t) => /^\d+:\d\d$/.test(t)).join(','));
p0 = await pm();
await sleep(1600);
ok('the end screen never ticks', (await pm()) === p0, p0 + ' → ' + await pm());

/* ================= the seam: a demo run with an absence ================= */
console.log('\n— ?demo=1: A RUN WITH A 2-MINUTE ABSENCE IN IT —');
await boot('demo=1');
ok('demo battle up', await until(`!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state !== 'boot'`, 60000));
const w0 = Date.now();
ok('the solver cast a word', await until(`${B}.run.words >= 1`, 60000));
await hide(); await sleep(300);
await skew(120000);
await sleep(1000);
await show();
ok('the run finishes', await until(`!!localStorage.getItem('beta3.result')`, 240000, 500));
const res = await evj(`localStorage.getItem('beta3.result')`);
const wall = Date.now() - w0 + 15000;   // generous: boot ticks before w0 + the flips
ok('beta3.result carries elapsed', typeof res.elapsed === 'number' && res.elapsed >= 4000, String(res.elapsed));
ok('the absence is not in it', res.elapsed < 120000 && res.elapsed < wall, res.elapsed + ' vs skew 120000, wall ' + wall);

/* ================= campaign: resume · persist · migrate ================= */
console.log('\n— THE CHECKPOINT ROUND-TRIP —');
const CK2 = `localStorage.setItem('beta3.campaign', JSON.stringify({ fightIdx: 2, actIdx: 0, hp: 40, hpMax: 50,
  sigils: [], words: 5, longest: 'stone', totalDmg: 120, scried: false, featherUsed: false, letters: 25,
  bigHit: 20, playMs: 120000, overkill: 0, clockV: 2 })); localStorage.setItem('beta3.campsign', 'none');`;
await boot('', CK2);
ok('campaign resumed at fight 2', await startCampaign() && await ev(`${B}.run.fightIdx === 2 && ${B}.mode === 'campaign'`));
p0 = await pm();
ok('a clockV 2 playMs is trusted whole', p0 >= 120000 && p0 <= 123000, String(p0));
await sleep(1500);
p1 = await pm();
ok('active play grows it', p1 > p0, p0 + ' → ' + p1);
await blur(); await sleep(300);
let c = await ck();
ok('blur folds the count into the checkpoint', c.playMs >= p1 && c.playMs < p1 + 3000 && c.clockV === 2, String(c.playMs));
ok('…and ONLY the count — the run state stands', c.fightIdx === 2 && c.hp === 40 && c.longest === 'stone');
await focus(); await sleep(800);
await hide(); await sleep(300);
const c2 = await ck();
ok('hidden folds it too', c2.playMs > c.playMs, c.playMs + ' → ' + c2.playMs);
await show(); await sleep(800);
await ev(`window.dispatchEvent(new Event('pagehide')); 'ok'`);
const c3 = await ck();
ok('pagehide folds it too', c3.playMs > c2.playMs, c2.playMs + ' → ' + c3.playMs);
await ev(`window.dispatchEvent(new Event('pageshow')); 'ok'`); await sleep(1000);
ok('pageshow lets it tick again', (await pm()) > c3.playMs);
const stopped = await evj(`(() => { const v = ${B}.run.playMs | 0; ${B}.scene.stop(); return JSON.stringify(v) })()`);
await sleep(400);
const c4 = await ck();
ok('scene shutdown folds it', c4.playMs >= stopped, stopped + ' → ' + c4.playMs);
await ev(`game.scene.start('home'); 'ok'`);
ok('the resume round-trip carries the count', await startCampaign() && (p0 = await pm()) >= c4.playMs && p0 < c4.playMs + 3000, c4.playMs + ' → ' + p0);
const saved = await evj(`(() => { ${B}.saveCheckpoint();
  return JSON.stringify([${B}.run.playMs | 0, JSON.parse(localStorage.getItem('beta3.campaign'))]) })()`);
ok('saveCheckpoint writes the honest count under the new law', saved[1].clockV === 2 && saved[1].playMs === saved[0], JSON.stringify([saved[0], saved[1].playMs, saved[1].clockV]));

console.log('\n— MIGRATION: THE OLD CHECKPOINT\'S DAYS BECOME MINUTES —');
const OLD = (ms) => `localStorage.setItem('beta3.campaign', JSON.stringify({ fightIdx: 2, actIdx: 0, hp: 40, hpMax: 50,
  sigils: [], words: 5, longest: 'stone', totalDmg: 120, scried: false, featherUsed: false, letters: 25,
  bigHit: 20, playMs: ${ms}, overkill: 0 })); localStorage.setItem('beta3.campsign', 'none');`;
await boot('', OLD(259200000));   // three days on the old wall clock
ok('three days migrate to the 45-minute cap', await startCampaign() && (p0 = await pm()) >= 2700000 && p0 <= 2703000, String(p0));
await boot('', OLD(300000));      // five honest minutes
ok('a modest old value rides untouched', await startCampaign() && (p0 = await pm()) >= 300000 && p0 <= 303000, String(p0));
await ev(`${B}.run.playMs = 334000; ${B}.endRun(false); 'ok'`);
await until(`${B}.state === 'end'`, 15000);
tx = await texts();
ok('a campaign over many nights reads as minutes', tx.includes('5:34'), tx.filter((t) => /^\d+:\d\d$/.test(t)).join(','));

ok('no page errors', errs.length === 0, errs.join(' | '));
console.log(`\n${pass} passed, ${fail} failed`);
ws.close();
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
