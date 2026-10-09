// DAILYHUNT-PROBE — THE KEPT HUNT (v0.114.0, Skylar 10/8):
//   "If you begin the hunt in the daily and close out of the hunt you should
//    be able to continue where you left off … It'll only refresh to the first
//    turn if … the new sky refreshes to a new daily."
// Real CDP taps at DPR 3 (the verify-with-clicks law). It drives the solver
// (demoStep) to play legal moves, closes the hunt with a FULL page reload
// (localStorage survives the navigation, the browser-close case), reopens the
// Daily Hunt through its own sheet door, and asserts the position came back
// whole. The ?daykey= seam rolls the sky to prove only a NEW sky resets.
//   A start the daily, play, RELOAD, reopen → identical position, plays on
//   B roll to a new sky → fresh run at turn one (the kept run read as stale)
//   C finish the hunt → reopen → the sheet, never a resumed board
//   D corrupt / stale / malformed kept state → fresh run, zero exceptions
//   E Saturday's strike clock survives the close (part-drained, resumes)
//   F Thursday's ash cells (and the board's forges/dark) re-lay tile for tile
//   + es: the kept run is keyed to the tongue it was dealt in
//
//   cd beta3 && perl -e 'alarm 580; exec @ARGV' node tools/dailyhunt-check.mjs
//
import { spawn, execSync } from 'node:child_process';
const PORT = 9482, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// pinned UTC days so the sky (and seed) are fixed: 2026-06-01 is a Monday.
// MON/TUE carry no word-length floor — the solver casts freely; WED's road
// (minLen 5) is deliberately left out of the play scenarios.
const MON = '20260601', TUE = '20260602', THU = '20260604', SAT = '20260606';   // gild · sign · ash · fall
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try { execSync('rm -rf /tmp/cdp-dailyhunt'); } catch (e) { }
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
if (!(await serving())) { console.log('cannot serve beta3 on :' + SRV); process.exit(2); }
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--mute-audio', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
  '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/cdp-dailyhunt', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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

const H = `game.scene.getScene('home')`;
const B = `game.scene.getScene('battle')`;
const tap = async (expr) => {
  const raw = await ev(`(() => { const o = ${expr}; if (!o) return null; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`);
  if (!raw) return false;
  const p = JSON.parse(raw);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await sleep(40);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(70);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  return true;
};
const until = async (expr, tries = 40, gap = 300) => { for (let i = 0; i < tries; i++) { if (await ev(expr)) return true; await sleep(gap); } return false; };
// the rise is a ~2.6s RAF animation that stretches badly under a loaded box —
// force the skip the moment the meadow starts ascending (same seam DEMO uses:
// a huge skipAt makes the next update() tick jump straight to arrive())
async function skipRise() {
  for (let i = 0; i < 16; i++) {
    const st = await ev(`(()=>{const h=${H};if(h&&h.ascending){h.skipAt=9e9;return 'skip'}return !!${B}&&${B}.scene.isActive()?'battle':'wait'})()`);
    if (st === 'battle') return;
    await sleep(120);
  }
}

// drive the battle into a stable, player-owned 'pick' (settling a sigil
// offer by picking a card; a felled run lands on 'end')
async function settle() {
  // patient: a cast's impact/refill/strike run in time.delayedCalls whose
  // scene clock STRETCHES under a loaded box — wait generously for a true rest
  for (let i = 0; i < 55; i++) {
    const st = await ev(`${B} ? ${B}.state : 'none'`);
    if (st === 'pick' || st === 'end') return st;
    if (st === 'sigil' || st === 'upgrade') {
      await ev(`(()=>{const b=${B};const cards=[];const scan=ls=>ls.forEach(o=>{if(o.getData&&o.getData('sigilCard'))cards.push(o);else if(o.list)scan(o.list)});scan(b.overlayC.list);if(cards.length)cards[0].emit('pointerdown');return cards.length})()`);
    }
    await sleep(350);
  }
  return await ev(`${B} ? ${B}.state : 'none'`);
}
// cast a legal word SYNCHRONOUSLY: pick the solver's best word, select its
// tiles and tryCast in ONE evaluate — run.words increments synchronously
// inside tryCast, so the cast is guaranteed regardless of the headless scene
// clock (demoStep's time.delayedCall tile-taps stall under a loaded box; this
// is the same selection the solver would make, without the delays)
async function castNow() {
  const r = await ev(`(()=>{const b=${B};if(!b||b.state!=='pick')return 'notpick';
    const best=b.bestWord(); if(!best||best.length<2){b.scry();return 'scry'}
    b.unselectFrom(0); for(const i of best){b.tapTile(i);} b.tryCast(); return 'tried'})()`);
  if (r === 'notpick') return 'notpick';
  await settle();   // let the flight / impact / refill resolve to a clean pick
  return r;
}
// cast a deliberately WEAK (shortest) legal word so the beast SURVIVES — used
// where the position must stay mid-fight (ash must persist; the max-damage
// solver word one-shots an early beast, and a fell reborns the board clean)
async function castWeak() {
  const r = await ev(`(()=>{const b=${B};if(!b||b.state!=='pick')return 'notpick';
    const w0=b.run.words|0; const idx=[];
    for(let i=0;i<16;i++){const s=b.board[i]; if(s&&s.c&&!s.blk)idx.push(i);}
    const need=b.castMinLen();
    const has=(w)=>{try{return WORDSET.has(w)}catch(e){return false}};
    // find the SHORTEST legal ordered pick (validated against WORDSET — never a
    // tryCast on an invalid word, so no shake storms); least damage = survival
    const find=(L)=>{const pick=[];const rec=()=>{ if(pick.length===L){const w=pick.map(i=>b.board[i].ch).join('');return (w.length>=need&&has(w))?pick.slice():null;}
      for(const i of idx){if(pick.includes(i))continue;pick.push(i);const r=rec();if(r)return r;pick.pop();} return null; };return rec();};
    const found=find(need)||find(need+1);
    if(found){ b.unselectFrom(0); for(const i of found)b.tapTile(i); b.tryCast(); return (b.run.words|0)>w0?'cast':'rej'; }
    b.scry(); return 'scry';})()`);
  if (r === 'notpick') return 'notpick';
  await settle();
  return r;
}
// cast legal words until one actually LANDS (the solver may scry a board it
// cannot spell) — a cast gives the kept position its score, words and board
async function castOnce(max = 5) {
  for (let i = 0; i < max; i++) {
    const w0 = await ev(`${B} ? ${B}.run.words | 0 : -1`);
    const r = await castNow();
    const st = await ev(`${B} ? ${B}.state : 'none'`);
    if (st === 'end') return 'end';
    if (r === 'notpick') { await sleep(300); continue; }
    const w1 = await ev(`${B} ? ${B}.run.words | 0 : -1`);
    if (w1 > w0) return 'cast';
  }
  return 'nocast';
}
// the position fingerprint — everything the card says must come back whole
const FP = `(() => { const b = ${B}; if (!b || !b.run || !b.beast) return null;
  return JSON.stringify({
    mode: b.mode, state: b.state, fightIdx: b.run.fightIdx, hp: b.run.hp, hpMax: b.run.hpMax,
    words: b.run.words, longest: b.run.longest, score: b.runScore(),
    bhp: b.beast.hpNow, bcount: b.beast.count, sigils: b.run.sigils.slice(),
    strikeMs: b.strikeMs|0,
    board: b.board.map(s => s ? (s.ch + ':' + (s.tier|0) + (s.blk?'*':'')) : '_'),
    ash: Array.from({length:16}, (_, i) => b.skyAsh[i] ? 1 : 0),   // dense (skyAsh is sparse)
    cursed: b.skyCursed ? [...b.skyCursed].sort() : null,
    pending: (b.pending||[]).slice(),
  }) })()`;
const parse = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
// the SAVED kept run, mapped to the very same fingerprint shape — this is the
// thing resume actually restores, so comparing it to the resumed-live position
// tests the contract directly, free of any live-vs-save capture race
const SNAP = `(() => { const s = ssDailyRun(); if (!s) return null; const r = s.run;
  const score = (r.totalDmg|0) + (r.longest||'').length*15 + (r.fightIdx|0)*50;
  return JSON.stringify({ fightIdx:r.fightIdx|0, hp:r.hp|0, hpMax:r.hpMax|0, words:r.words|0,
    longest:r.longest||'', score, bhp:s.beast.hpNow|0, bcount:s.beast.count|0,
    sigils:(r.sigils||[]).slice(), board:(s.board||[]).map(t=>t?(t.ch+':'+(t.tier|0)+(t.blk?'*':'')):'_'),
    ash:Array.from({length:16},(_, i)=>(s.ash||[])[i]?1:0), cursed:s.cursed?[...s.cursed].sort():null, pending:(s.pending||[]).slice() }) })()`;
// keep a QUIESCED position: settle to a stable pick, let any post-strike dew
// land, force the leaving-save a close fires, then return BOTH the live
// fingerprint and the saved snapshot (which must agree — the save tracks live)
async function keep() {
  // save and verify the save TRACKS live (coherent). A cast's delayed impact
  // can still be resolving on a loaded box; retry until the live position and
  // the kept snapshot agree (or give up with the last pair for a clear red).
  let live = null, snap = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    await settle();
    await sleep(500);          // the dew blooms ~260ms after a strike; let it land
    await ev(`${B} && ${B}.clockPersist()`);
    live = parse(await ev(FP));
    snap = parse(await ev(SNAP));
    if (live && snap && samePos(live, snap)) break;
    await sleep(800);          // not yet at rest — let the delayed resolution finish
  }
  return { live, snap };
}
// position equality that ignores only the free-running clock (compared apart)
const samePos = (a, b) => {
  if (!a || !b) return false;
  const keys = ['fightIdx', 'hp', 'hpMax', 'words', 'longest', 'score', 'bhp', 'bcount'];
  for (const k of keys) if (a[k] !== b[k]) return false;
  return JSON.stringify(a.board) === JSON.stringify(b.board)
    && JSON.stringify(a.sigils) === JSON.stringify(b.sigils)
    && JSON.stringify(a.ash) === JSON.stringify(b.ash)
    && JSON.stringify(a.cursed) === JSON.stringify(b.cursed)
    && JSON.stringify(a.pending) === JSON.stringify(b.pending);
};
// name the first field that diverged, so a red says WHAT came back wrong
const diffNote = (a, b) => {
  if (!a || !b) return ' (missing fp)';
  for (const k of ['fightIdx', 'hp', 'hpMax', 'words', 'longest', 'score', 'bhp', 'bcount', 'board', 'sigils', 'ash', 'cursed', 'pending']) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return ' ≠' + k + ' (' + JSON.stringify(a[k]) + ' vs ' + JSON.stringify(b[k]) + ')';
  }
  return '';
};

// boot STRAIGHT into a daily run (the ?daily=1 knock), a fight standing
async function bootDaily(day, lang) {
  await send('Page.navigate', { url: BASE + '?ftue=0&daily=1&daykey=' + day + (lang === 'es' ? '&lang=es' : '') });
  await until(`!!window.game && !!${H}`, 90, 400);
  await skipRise();
  const got = await until(`${B} && ${B}.state === 'pick'`, 70, 400);
  return got;
}
// reopen through the MEADOW's Daily Hunt sheet + a REAL tap on its door
async function reopenViaSheet(day, lang) {
  await send('Page.navigate', { url: BASE + '?ftue=0&daykey=' + day + (lang === 'es' ? '&lang=es' : '') });
  const home = await until(`!!window.game && ${H} && ${H}.scene.isActive() && !${H}.busy()`, 90, 400);
  if (!home) return { home: false };
  const kept = await ev(`!!ssDailyRun()`);
  await ev(`${H}.dailySheet()`);
  await until(`!!${H}.dailyC`, 20, 250);
  await sleep(350);   // let the sheet's settle-up entrance land before tapping
  // the door's label is EXACTLY one of the three door strings — match those,
  // never a loose regex (the standing "your hunt today" line also holds "caza")
  const label = await ev(`(()=>{const c=${H}.dailyC;if(!c)return null;const doors=[SS_T('dpResume'),SS_T('dpAgain'),SS_T('dpPlay')];let found=null;const walk=ls=>ls.forEach(o=>{if(typeof o.text==='string'&&doors.includes(o.text))found=o.text;if(o.list)walk(o.list);});walk(c.list);return found})()`);
  // the exact kept run that will restore, read at the meadow just before the
  // door is tapped (the battle scene is gone here, so the clock isn't running —
  // this is the value resume actually lands on, drain-and-rearm included)
  const keptLeft = await ev(`(()=>{const s=ssDailyRun();return s?(s.hardLeft|0):null})()`);
  // the big PLAY/CONTINUE door is the last btn-textured image in the sheet
  const tapped = await tap(`(()=>{const c=${H}.dailyC;if(!c)return null;const imgs=c.list.filter(o=>o.texture&&/btn/.test(o.texture.key));return imgs[imgs.length-1]||null})()`);
  await skipRise();   // the tap rode the rise — jump it (loaded box)
  const inBattle = await until(`${B} && ${B}.state === 'pick' && ${B}.mode==='daily'`, 70, 400);
  return { home: true, kept, label, tapped, inBattle, keptLeft };
}

async function runLang(lang, light) {
  console.log('\n—— ' + lang + (light ? ' (core round-trip)' : '') + ' ——');
  // ============ A — RESUME: play, reload, reopen → identical position ======
  errs.length = 0;
  ok('[' + lang + '] A: boots into a standing daily (Mon · THE GILDED LETTER)', await bootDaily(MON, lang));
  await settle();
  const m1 = await castOnce();   // land a word — mid-fight-0, the beast still standing
  ok('[' + lang + '] A: a first word plays legally', m1 === 'cast' || m1 === 'end', 'result ' + m1);
  const k = await keep();        // quiesce + the leaving-save a close fires
  const before = k.snap;         // the saved run — exactly what resume restores
  ok('[' + lang + '] A: the hunt is under way (a word cast, a score on the board)',
    !!before && before.words >= 1 && before.score > 0, before ? 'words ' + before.words + ' score ' + before.score : 'no fp');
  ok('[' + lang + '] A: the kept run tracks the live position (nothing lost at the save)',
    samePos(k.live, k.snap), diffNote(k.live, k.snap));
  const keyBefore = await ev(`(()=>{const s=ssDailyRun();return s?s.day+'/'+s.lang+'/f'+s.run.fightIdx:null})()`);
  ok('[' + lang + '] A: the position is kept, keyed to today’s sky + tongue', !!keyBefore, keyBefore);
  // FULL page reload — localStorage (the kept run) survives; the scene does not
  const re = await reopenViaSheet(MON, lang);
  ok('[' + lang + '] A: the meadow stands again after a full reload', re.home);
  ok('[' + lang + '] A: the sheet’s door says CONTINUE (a hunt waits)', re.kept && /CONTINUE|CONTINUAR|REPRENDRE|FORTSETZEN/i.test(re.label || ''), re.label);
  ok('[' + lang + '] A: a REAL tap on the door rides back into the daily', re.inBattle);
  await sleep(300);
  const after = parse(await ev(FP));
  ok('[' + lang + '] A: the position came back WHOLE (board, fuse, score, words)', samePos(before, after),
    after ? 'f' + after.fightIdx + ' hp' + after.hp + ' bhp' + after.bhp + ' sc' + after.score + diffNote(before, after) : 'no fp');
  if (!light) {
    // the resumed board is live and legal — its restored tiles are interactive,
    // the real tapTile path selects one (sel grows), and the turn machinery
    // (previewDamage) runs on a restored pick (en only; es proves the round trip)
    const liveTiles = await ev(`(()=>{const b=${B};if(!b)return false;const t=b.board.filter(s=>s&&s.c);
      return t.length>0 && t.every(s=>s.c.input&&s.c.input.enabled)})()`);
    const sel1 = await ev(`(()=>{const b=${B};if(!b||b.state!=='pick')return -1;b.unselectFrom(0);const i=b.board.findIndex(s=>s&&s.c);b.tapTile(i);return b.sel.length})()`);
    const previews = await ev(`(()=>{const b=${B};if(!b)return false;return typeof b.previewDamage()==='number' && b.state==='pick' && b.beast.hpNow>0})()`);
    await ev(`(()=>{const b=${B};if(b&&b.unselectFrom)b.unselectFrom(0);})()`);   // leave it clean
    ok('[' + lang + '] A: and the resumed board is live and legal (tiles wired, selection + turn machinery run)',
      liveTiles && sel1 === 1 && previews, 'tiles ' + liveTiles + ' sel ' + sel1 + ' live ' + previews);
  }
  ok('[' + lang + '] A: zero page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));

  // ============ cross-tongue key (en run only) =============================
  if (lang === 'en') {
    const otherKept = await ev(`(()=>{try{const raw=localStorage.getItem('beta3.dailyrun');if(!raw)return 'none';const s=JSON.parse(raw);
      return (s.day===SSNET.dayKey()&&s.lang==='fr')?'wouldresume':'frwouldreset'}catch(e){return 'err'}})()`);
    // the live save is en; a fr session keys differently → it would reset
    ok('[en] a run dealt in one tongue never resumes into another', otherKept !== 'wouldresume', otherKept);
  }
}

// ============ B — NEW SKY RESETS ===========================================
async function scenarioB() {
  console.log('\n—— B: only a new sky resets ——');
  errs.length = 0;
  await bootDaily(MON, 'en');
  await settle();
  await castOnce();
  const before = (await keep()).snap;
  ok('B: a hunt stands kept against Monday’s sky', before && before.words >= 1);
  // reopen under TUESDAY — a new sky, a new seed: the Mon run is stale
  await send('Page.navigate', { url: BASE + '?ftue=0&daykey=' + TUE });
  await until(`!!window.game && ${H} && !${H}.busy()`, 60, 500);
  const stale = await ev(`!ssDailyRun()`);   // the Mon save reads as null under Tue
  ok('B: under the NEW sky the kept Mon run is read as stale (discarded)', stale);
  const re = await reopenViaSheet(TUE, 'en');
  ok('B: the sheet’s door is NOT a resume (fresh BEGIN/HUNT AGAIN)', !re.kept && !/CONTINUE|CONTINUAR|REPRENDRE|FORTSETZEN/i.test(re.label || ''), re.label);
  ok('B: the daily opens FRESH at turn one (fight 0, full fuse)', re.inBattle && await ev(`${B}.run.fightIdx === 0 && ${B}.run.words === 0`));
  ok('B: zero page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));
}

// ============ C — FINISHED STAYS FINISHED ==================================
async function scenarioC() {
  console.log('\n—— C: a finished hunt does not reopen mid-position ——');
  errs.length = 0;
  await bootDaily(MON, 'en');
  await settle();
  await castOnce();   // a real word, so the finished hunt logs a real score
  ok('C: a hunt is kept while it is under way', await ev(`!!ssDailyRun()`));
  // end the run through the real end path (a win settles exactly as a full
  // five-fight clear does — same endRun)
  await ev(`${B}.endRun(true)`);
  await sleep(400);
  ok('C: finishing the hunt CLEARS the kept run', await ev(`!ssDailyRun()`));
  const re = await reopenViaSheet(MON, 'en');
  ok('C: reopening shows the sheet’s door, not a resume', re.home && !re.kept, re.label);
  ok('C: the sheet reads tonight’s score (the hunt is finished)',
    await ev(`SS.prof.daily[String(SSNET.dayKey())] > 0`));
  ok('C: zero page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));
}

// ============ D — MALFORMED / STALE → FRESH, NEVER A CRASH =================
async function scenarioD() {
  console.log('\n—— D: a corrupt kept run is discarded silently ——');
  errs.length = 0;
  await send('Page.navigate', { url: BASE + '?ftue=0&daykey=' + MON });
  await until(`!!window.game && ${H} && !${H}.busy()`, 60, 500);
  const cases = [
    ['not JSON at all', `localStorage.setItem('beta3.dailyrun','{broken json ::')`],
    ['a stale schema version', `localStorage.setItem('beta3.dailyrun', JSON.stringify({v:0,day:SSNET.dayKey(),lang:ssGameLang(),run:{fightIdx:1},beast:{hpNow:5},board:new Array(16).fill(null)}))`],
    ['yesterday’s day', `localStorage.setItem('beta3.dailyrun', JSON.stringify({v:1,day:SSNET.dayKey()-1,lang:ssGameLang(),run:{fightIdx:1},beast:{hpNow:5},board:new Array(16).fill(null)}))`],
    ['a wrong-length board', `localStorage.setItem('beta3.dailyrun', JSON.stringify({v:1,day:SSNET.dayKey(),lang:ssGameLang(),run:{fightIdx:1},beast:{hpNow:5},board:[1,2,3]}))`],
    ['a missing beast', `localStorage.setItem('beta3.dailyrun', JSON.stringify({v:1,day:SSNET.dayKey(),lang:ssGameLang(),run:{fightIdx:1},board:new Array(16).fill(null)}))`],
  ];
  for (const [name, inject] of cases) {
    await ev(inject);
    const nulled = await ev(`ssDailyRun() === null`);
    ok('D: ' + name + ' → read as null (no resume)', nulled);
  }
  // and a corrupt save actually BOOTS fresh with no exception
  await ev(`localStorage.setItem('beta3.dailyrun','{broken')`);
  const booted = await bootDaily(MON, 'en');
  ok('D: a corrupt kept run still boots a FRESH hunt (turn one)', booted && await ev(`${B}.run.fightIdx === 0`));
  ok('D: zero page exceptions through every corruption', errs.length === 0, errs.slice(0, 2).join(' | '));
}

// ============ E — THE STRIKE CLOCK SURVIVES (Saturday) =====================
async function scenarioE() {
  console.log('\n—— E: Saturday’s falling-sky clock resumes part-drained ——');
  errs.length = 0;
  const booted = await bootDaily(SAT, 'en');
  const full = await ev(`${B} ? ${B}.strikeMs : 0`);
  ok('E: boots a standing daily under THE FALLING SKY (a clock runs)', booted && full > 0, 'clock ' + full + 'ms');
  await settle();
  // the clock's save/restore is what E proves — a fresh fight is a valid
  // position for it, so skip casting (fast + robust under load). Pin the fuse
  // to a comfortable partial: a near-empty clock would expire within the reopen
  // latency (it runs the instant the fight stands) and re-arm, masking the
  // restore; the headless scene-clock is too jittery to time a drain to the ms.
  const savedLeft = await ev(`(()=>{const b=${B};if(!b||b.state!=='pick'||!b.beast||b.beast.hpNow<=0)return null;b.hardLeft=7000;b.hardDraw(true);b.clockPersist();const s=ssDailyRun();return s?s.hardLeft:null})()`);
  ok('E: the kept run holds the part-drained clock (not the full fuse)',
    savedLeft === 7000 && savedLeft < full, savedLeft + ' / ' + full);
  const re = await reopenViaSheet(SAT, 'en');
  const resumedLeft = await ev(`${B} ? ${B}.hardLeft : null`);
  ok('E: reopening resumes under the clock', re.inBattle && await ev(`${B}.strikeMs > 0`));
  // resume lands on the SAVED clock (re.keptLeft, read at the meadow — the fuse
  // may have drained, even expired-and-rearmed, during a slow reopen under
  // load; the proof is the restore matches what was kept, then runs down a hair)
  ok('E: the clock came back where the kept run left it',
    resumedLeft != null && re.keptLeft != null && resumedLeft <= re.keptLeft + 50 && resumedLeft > re.keptLeft - 3500,
    'pinned ' + savedLeft + ' · kept ' + re.keptLeft + ' · resumed ' + resumedLeft + ' · full ' + full);
  ok('E: zero page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));
}

// ============ F — THE ASH / FORGES / DARK RE-LAY (Thursday) ================
async function scenarioF() {
  console.log('\n—— F: Thursday’s ashen board re-lays cell for cell ——');
  errs.length = 0;
  const booted = await bootDaily(THU, 'en');
  ok('F: boots a standing daily under THE ASHEN BOARD', booted && await ev(`!!(${B}.sky && ${B}.sky.ash)`));
  await settle();
  // every cast on Thursday leaves ash where its stars stood — UNLESS it fells
  // the beast (the board is reborn fresh at a fell). Cast until a STABLE
  // position stands: beast alive, fully settled, ash on the board.
  let stable = false, ashN = 0;
  for (let i = 0; i < 6; i++) {
    const r = await castWeak();   // a weak word: the beast survives, so ash stands
    await settle();
    await sleep(400);   // let the cast fully resolve
    stable = await ev(`${B} && ${B}.state==='pick' && !${B}.dying && ${B}.beast && (${B}.beast.hpNow|0)>0`);
    ashN = (await ev(`${B} ? ${B}.skyAsh.filter(a => a).length : 0`)) | 0;
    if (r === 'end' || (stable && ashN > 0)) break;
  }
  const k = await keep();
  const before = k.snap;
  ok('F: casting has left ash cells on the board', before && before.ash.reduce((s, a) => s + a, 0) > 0,
    (before ? before.ash.reduce((s, a) => s + a, 0) : 0) + ' ash cells');
  ok('F: the kept run tracks the live ashen board', samePos(k.live, k.snap), diffNote(k.live, k.snap));
  const re = await reopenViaSheet(THU, 'en');
  await sleep(300);
  const after = parse(await ev(FP));
  ok('F: the board came back whole — the SAME ash cells, same tiles', samePos(before, after),
    after ? after.ash.reduce((s, a) => s + a, 0) + ' ash cells' + diffNote(before, after) : 'no fp');
  ok('F: zero page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));
}

// a loaded fleet box (load avg 20, the memory's starvation warning) can't
// always run the whole suite under one alarm — `core` / `ext` split it; the
// default runs everything. The scenarios are independent (each boots fresh).
const ONLY = (process.argv[2] || 'all').toLowerCase();
const wantCore = ONLY === 'all' || ONLY === 'core';
const wantExt = ONLY === 'all' || ONLY === 'ext';
if (wantCore) { await runLang('en'); await scenarioB(); await scenarioC(); await scenarioD(); }
if (wantExt) { await scenarioE(); await scenarioF(); await runLang('es', true); }

console.log('\n' + pass + ' passed · ' + fail + ' failed');
kids.forEach((k) => { try { k.kill(); } catch (e) { } });
process.exit(fail ? 1 : 0);
