// FIRST5-CHECK — the stage (batch ss-2026-10-07-first-night, card 01).
// Proves the first5 sandbox is a true first night that cannot touch live
// beta3: static seams (script order, no Firebase, repointed shared assets),
// then live boots in headless Chrome at DPR 3 — fresh first open with the
// FTUE gate open, storage fully namespaced 'first5.', a ?demo=1 solver run
// that actually plays, and ?reset=1 restoring the virgin first open.
//
// Serves the REPO ROOT (first5 reaches ../vendor, ../words.js, ../art) on
// :8901 if nothing does — NOT the standing :8899 beta3 server, which roots
// at beta3/ and cannot serve ../. Chrome on :9476, /tmp/cdp-first5 wiped.
//
//   cd beta3/first5 && perl -e 'alarm 420; exec @ARGV' node tools/first5-check.mjs
//
import { spawn, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const PORT = 9476, SRV = 8901;
const BASE = 'http://localhost:' + SRV + '/beta3/first5/index.html';
const ROOT = '../..'; // repo root, relative to first5/ where this runs
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= §1 the seams on paper ================= */
console.log('— §1 the seams on paper —');
const html = readFileSync('index.html', 'utf8');
const shim = readFileSync('first5.js', 'utf8');
const gameSrc = readFileSync('game.js', 'utf8');
const packSrc = readFileSync('packs.js', 'utf8');

const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
ok('first5.js is the FIRST script', scripts[0] && scripts[0].startsWith('first5.js'));
ok('compat.js rides second (Safari canvas law)', scripts[1] && scripts[1].startsWith('compat.js'));
ok('NO Firebase SDK anywhere (local mode by construction)', !html.includes('firebase'));
ok('phaser + words.js shared from ../', scripts.some((s) => s === '../vendor/phaser.min.js') && scripts.some((s) => s.startsWith('../words.js?v=')));
ok('every local copy stamps ?v=f5-*', scripts.filter((s) => !s.startsWith('../') && !s.includes('phaser')).every((s) => /\?v=f5-[\d.]+$/.test(s)));
const stamps = new Set(scripts.map((s) => (s.match(/\?v=(f5-[\d.]+)/) || [])[1]).filter(Boolean));
ok('one f5 stamp on every copy (release ritual)', stamps.size === 1, [...stamps].join());
ok('shim prefixes get/set/remove on Storage.prototype', ['getItem', 'setItem', 'removeItem'].every((m) => shim.includes('P.' + m)));
ok('shim handles ?reset=1 and scrubs it from the URL', shim.includes("searchParams.delete('reset')"));
ok("game.js art repointed to ../art (2 sites)", (gameSrc.match(/im\.src = '\.\.\/art\//g) || []).length === 2 && !/im\.src = 'art\//.test(gameSrc));
ok('packs.js dictionary writes ../words-<lang>.js', packSrc.includes('src="../words-'));
for (let n = 1; n <= 7; n++) ok('F5-GRAFT-' + n + ' seam present in game.js', gameSrc.includes('F5-GRAFT-' + n));
const BUILD = (gameSrc.match(/const BUILD = '([^']+)'/) || [])[1];
ok('game.js copy carries a BUILD', !!BUILD, BUILD);
try {
  const liveBuild = (readFileSync('../game.js', 'utf8').match(/const BUILD = '([^']+)'/) || [])[1];
  console.log('  i  live beta3 is ' + liveBuild + ' — first5 copy is ' + BUILD + (liveBuild === BUILD ? ' (in step)' : ' (DRIFTED — re-seed when the batch integrates)'));
} catch (e) { }

/* ================= server + browser ================= */
try { execSync('rm -rf /tmp/cdp-first5'); } catch (e) { }
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: ROOT, stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
if (!(await serving())) { console.log('cannot serve repo root on :' + SRV); process.exit(2); }
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--mute-audio', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-first5', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
let list = null;
for (let i = 0; i < 60 && !list; i++) { try { list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); } catch (e) { await sleep(500); } }
if (!list) { console.log('no Chrome on :' + PORT); process.exit(2); }
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || '').split('\n')[0]);
};
const send = (method, params) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r?.result?.value; };
await new Promise((r) => { ws.onopen = r; });
await send('Runtime.enable', {});
await send('Page.enable', {});
const go = async (url) => { errs.length = 0; await send('Page.navigate', { url }); await sleep(1500); };

/* ================= §2 the true first open ================= */
console.log('— §2 the true first open —');
await go(BASE);
// NOTE: harness evaluates run in the page, so localStorage.getItem rides the
// shim — ask with the GAME's key names and the prefix lands underneath.
let booted = false;
for (let i = 0; i < 40 && !booted; i++) { booted = await ev("localStorage.getItem('beta3.boot') !== null"); if (!booted) await sleep(1000); }
ok('boot beacon lands under the first5 prefix', booted, await ev("localStorage.getItem('beta3.boot')"));
ok('the canvas stands', await ev("document.querySelector('canvas') !== null"));
ok('every storage key wears the prefix — zero bare beta3.* keys', await ev("(()=>{const ks=[];for(let i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));return ks.length>0&&ks.every(k=>k.startsWith('first5.'))})()"),
  await ev("(()=>{const ks=[];for(let i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));return ks.filter(k=>!k.startsWith('first5.')).join()||'(all prefixed, '+ks.length+' keys)'})()"));
ok('the FTUE gate is OPEN — this device reads virgin (ftue 0 = owed)', (await ev('typeof SS !== "undefined" && SS.prof ? SS.prof.ftue : "no SS.prof"')) === 0, String(await ev('typeof SS !== "undefined" && SS.prof ? SS.prof.ftue : "no SS.prof"')));
ok('net rides local mode (no firebase global)', await ev("typeof firebase === 'undefined'"));
// the first open rises BY ITSELF into the battle. The game's own headless
// beacon (window.__ssftue) is the truth; swiftshader stretches the intro
// well past its real ~10s, so the window is generous.
let rose = null;
for (let i = 0; i < 150 && !rose; i++) {
  const st = await ev("window.__ssftue ? window.__ssftue.state : null");
  if (st === 'rise' || st === 'board' || st === 'done' || await ev("typeof game !== 'undefined' && game.scene ? game.scene.isActive('battle') : false")) rose = st || 'battle';
  if (!rose) await sleep(1000);
}
ok('the ascent rises by itself into the first fight', !!rose, 'ftue state ' + rose);
let f1 = null; // graft 1: the battle scene stands moments after the rise
for (let i = 0; i < 30 && !f1; i++) { f1 = await ev("(()=>{try{const b=game.scene.getScene('battle');return b&&b.fights&&b.fights[0]?b.fights[0].id:null}catch(e){return null}})()"); if (!f1) await sleep(1000); }
ok('fight one is pinned VULPES, every day of the week (graft 1)', f1 === 'vulpes', String(f1));
ok('zero page exceptions through the open', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ================= §3 the run engine plays (demo solver) ================= */
console.log('— §3 the run engine plays —');
await go(BASE + '?reset=1&demo=1');
let stat = null;
for (let i = 0; i < 120 && !stat; i++) { const s = await ev("localStorage.getItem('beta3.stat')"); if (s) { const j = JSON.parse(s); if (j.words >= 1) stat = j; } if (!stat) await sleep(1500); }
ok('the solver weaves real words in the sandbox', !!stat, stat && ('fight ' + stat.fight + ' · ' + stat.words + ' words · score ' + stat.score));
ok('demo stat rides the prefix too', await ev("localStorage.getItem('beta3.stat') === null || true") && await ev("(()=>{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k==='beta3.stat')return false}return true})()"));
let qk = null; // graft 4: the first fell writes the held fight
for (let i = 0; i < 150 && !qk; i++) { const c = await ev("localStorage.getItem('beta3.quickck')"); if (c) { const j = JSON.parse(c); if (j.fightIdx >= 1) qk = j; } if (!qk) await sleep(1500); }
ok('the fell writes the held fight (graft 4: beta3.quickck)', !!qk, qk && ('fight ' + qk.fightIdx + ' · qseed kept ' + Number.isFinite(qk.qseed)));
ok('zero exceptions mid-run', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ======== §3b the pocket, the glint, the two refusals ======== */
console.log('— §3b the pocket, the glint, the two refusals —');
await go(BASE); // an app kill mid-run: plain reopen, held fight standing
let resumed = false;
for (let i = 0; i < 90 && !resumed; i++) { resumed = await ev("(()=>{try{const b=game.scene.getScene('battle');return !!(b&&b.scene.isActive()&&b.mode==='quick'&&b.state==='pick')}catch(e){return false}})()"); if (!resumed) await sleep(1000); }
const rIdx = await ev("(()=>{try{return game.scene.getScene('battle').run.fightIdx}catch(e){return -1}})()");
ok('a pocketed phone relaunches into the held fight (graft 4)', resumed && qk && rIdx === qk.fightIdx, 'resumed at fight ' + rIdx + ' (held ' + (qk && qk.fightIdx) + ')');
ok('the intro was NOT replayed over the held run (graft 4)', await ev("window.__ssftue && window.__ssftue.on === false"));
await sleep(2500); // the deal's bounce settles before probe taps (house law)
await ev("(()=>{const b=game.scene.getScene('battle');b.f5LastTap=b.time.now-11000;b.f5Glinted=false;return 1})()");
let glinted = false;
for (let i = 0; i < 10 && !glinted; i++) { glinted = (await ev('window.__f5glint | 0')) >= 1; if (!glinted) await sleep(500); }
ok('the stalled speller is fed — one viable-tile glint (graft 5)', glinted);
await ev("(()=>{const b=game.scene.getScene('battle');b.tapTile(0);b.tryCast();return 1})()");
await sleep(600);
ok('a single tile BOUNCES HOME (graft 6: too short)', (await ev('window.__f5refusal')) === 'home' && await ev("game.scene.getScene('battle').sel.length === 0"));
const pair = await ev("(()=>{const b=game.scene.getScene('battle');for(let i=0;i<16;i++)for(let j=0;j<16;j++){if(i===j)continue;const w=b.board[i].ch+b.board[j].ch;if(!WORDSET.has(w))return [i,j]}return null})()");
ok('a non-word pair exists on the board to refuse', !!pair, String(pair));
if (pair) {
  await ev("(()=>{const b=game.scene.getScene('battle');b.tapTile(" + pair[0] + ");b.tapTile(" + pair[1] + ");b.tryCast();return 1})()");
  await sleep(700);
  ok('a word the sky never heard CRUMBLES TO DUST (graft 6)', (await ev('window.__f5refusal')) === 'dust' && await ev("game.scene.getScene('battle').sel.length === 0"));
}
ok('zero exceptions through the pocket round', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ================= §4 the reset door ================= */
console.log('— §4 the reset door —');
await go(BASE + '?reset=1');
await sleep(4000);
ok('?reset=1 wiped the night — stat gone', await ev("localStorage.getItem('beta3.stat') === null"));
ok('?reset=1 scrubbed itself from the URL', await ev("!location.search.includes('reset')"), await ev('location.search'));
let reborn = false;
for (let i = 0; i < 20 && !reborn; i++) { reborn = (await ev('typeof SS !== "undefined" && SS.prof ? SS.prof.ftue : null')) === 0; if (!reborn) await sleep(1000); }
ok('the first open is VIRGIN again (ftue gate re-open)', reborn);
ok('zero exceptions on the reborn open', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log('\n' + pass + ' passed · ' + fail + ' failed');
kids.forEach((k) => { try { k.kill(); } catch (e) { } });
process.exit(fail ? 1 : 0);
