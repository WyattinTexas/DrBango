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
ok('F5-CARD-04 seams: the rig, the kind bag, the beats, the ember tune', ['SS_F5_RIG', 'SS_F5_FLOOR', 'SS_F5_EMBER_MULT', 'f5Kind(', 'f5CastBeats(', 'f5StarWrite(', 'f5Encore('].every((t) => gameSrc.includes(t)));
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

/* ======== §2b the lure — the rise, heard (card 03) ======== */
console.log('— §2b the lure: the rise is heard —');
await go(BASE + '?reset=1');
let lure = false;
for (let i = 0; i < 180 && !lure; i++) { lure = (await ev("window.__ssftue ? window.__ssftue.state : null")) === 'lure'; if (!lure) await sleep(1000); }
ok('one firefly asks — the lure stands after the settle', lure);
// a REAL tap, anywhere on screen (the verify-with-clicks law)
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 195, y: 420, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 195, y: 420, button: 'left', clickCount: 1 });
let lured = null;
for (let i = 0; i < 20 && !lured; i++) { const st = await ev("window.__ssftue ? window.__ssftue.state : null"); if (st === 'lured' || st === 'rise' || st === 'board') lured = st; if (!lured) await sleep(400); }
ok('the tap launches the ascent (lure → rise)', !!lured, String(lured));
ok('…and the same gesture ARMED THE SOUND (riser audible)', await ev("typeof SFX !== 'undefined' && SFX.ok === true && SFX.ctx && SFX.ctx.state === 'running'"), String(await ev("typeof SFX !== 'undefined' && SFX.ctx ? SFX.ctx.state : 'no ctx'")));
ok('zero exceptions through the lure', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ======== §2c THE SKY LEANS IN (card 04) ======== */
console.log('— §2c the sky leans in —');
let b1 = false; // ride the lure-tapped ascent into the first fight
for (let i = 0; i < 90 && !b1; i++) { b1 = await ev("(()=>{try{const b=game.scene.getScene('battle');return !!(b&&b.scene.isActive()&&b.state==='pick')}catch(e){return false}})()"); if (!b1) await sleep(1000); }
ok('the first fight stands after the lure', b1);
const ehp = await ev("(()=>{try{const b=game.scene.getScene('battle');return b.beast?b.beast.hp:null}catch(e){return null}})()");
ok('THE EMBER MINUTE tuning: pinned VULPES at 33 hp', ehp === 33, String(ehp));
ok('the en rig letters are all in the en bag', await ev("['m','o','n','s','e','a'].every(c=>SS_PACKS.en.bag[c])"));
ok('the en floor word stands in the dictionary', await ev("WORDSET.has('moons')"));
await sleep(2500); // the deal's bounce settles before probe taps (house law)
const cast1 = await ev("(()=>{const b=game.scene.getScene('battle');const deal=['s','t','a','r'];const used=[];for(const ch of deal){let f=-1;for(let i=0;i<16;i++){if(used.includes(i))continue;if(b.board[i]&&b.board[i].ch===ch){f=i;break}}if(f<0)return 'missing '+ch;used.push(f)}used.forEach(i=>b.tapTile(i));b.tryCast();return 'cast'})()");
ok('the first cast flies (S·T·A·R, real scene taps)', cast1 === 'cast', String(cast1));
let sw = false;
for (let i = 0; i < 12 && !sw; i++) { sw = (await ev('window.__f5starwrite | 0')) >= 1; if (!sw) await sleep(400); }
ok('THE WORD WRITTEN IN STARS hangs on the first cast', sw);
await sleep(3200); // the rigged refill lands and settles
const dens = await ev("(()=>{const b=game.scene.getScene('battle');const counts={};for(const s of b.board)if(s&&!s.blk)counts[s.ch]=(counts[s.ch]|0)+1;const fits=(w)=>{if(w.includes('q'))return false;const c=Object.assign({},counts);for(const ch of w){if(!c[ch])return false;c[ch]--}return true};let n4=0,n5=0,n6=0;for(const w of WORDSET){const L=w.length;if(L===4&&n4<9&&fits(w))n4++;else if(L===5&&n5<9&&fits(w))n5++;else if(L===6&&n6<9&&fits(w))n6++;if(n4>8&&n5>8&&n6>8)break}return [n4,n5,n6]})()");
ok('THE DENSITY GATE: >=3 findable words at 4/5/6 after the rig (en)', dens && dens[0] >= 3 && dens[1] >= 3 && dens[2] >= 3, String(dens));
const trio = await ev("(()=>{const b=game.scene.getScene('battle');return b.rollSigilOpts().map(o=>o.id).join()})()");
ok('the first-ever sigil trio is curated: QUILL / SALVE / FIRST LIGHT', trio === 'quill,salve,first', trio);
await ev("(()=>{const b=game.scene.getScene('battle');b.f5LastTap=b.time.now-31000;b.f5Glinted=true;b.f5Encored=false;return 1})()");
let enc = false;
for (let i = 0; i < 10 && !enc; i++) { enc = (await ev('window.__f5encore | 0')) >= 1; if (!enc) await sleep(500); }
ok('the 30s rescue encore walks the best word (idle rescue)', enc);
const w5 = await ev("(()=>{const b=game.scene.getScene('battle');if(b.state!=='pick')return 'state '+b.state;const tiles=b.board.map((s,i)=>s&&!s.blk?{i,ch:s.ch}:null).filter(Boolean);const pick=(w)=>{const used=[];for(const ch of w){let f=-1;for(const t of tiles){if(used.includes(t.i))continue;if(t.ch===ch){f=t.i;break}}if(f<0)return null;used.push(f)}return used};for(const w of WORDSET){if(w.length!==5||w.includes('q'))continue;const u=pick(w);if(u){u.forEach(i=>b.tapTile(i));b.tryCast();return w}}return 'none'})()");
ok('a 5-letter word stands on the rigged board and CASTS', !!w5 && w5 !== 'none' && !String(w5).startsWith('state'), String(w5));
let r5 = false;
for (let i = 0; i < 10 && !r5; i++) { r5 = (await ev('window.__f5ladder5 | 0')) === 1; if (!r5) await sleep(400); }
ok('the first 5+ pays the shooting star (ladder rung 5)', r5);
await ev("(()=>{const b=game.scene.getScene('battle');b.f5CastBeats('zzzzzzz', 7);return 1})()");
await sleep(1200);
ok('rungs 6 and 7 cue and draw clean (sky swell + gold rain)', ((await ev('window.__f5ladder6 | 0')) + (await ev('window.__f5ladder7 | 0'))) === 2);
ok('zero exceptions through the leaning sky', errs.length === 0, errs.slice(0, 2).join(' | '));

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
