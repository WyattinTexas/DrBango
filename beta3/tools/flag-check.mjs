// FLAG-CHECK — the endless frontier flags: plant your name in the sky (v0.77.0).
// Skylar (9/3): "When someone hits that number, they get a flag on top of it
// with their user name across it. The next person who passes that number …
// gets their flag planted above that. There's going to be always a
// leaderboard of the endless guy that people don't really know about. …
// If they've played the Endless mode, have a flag with how far they've
// gotten. You should also be able to see how far other players have gotten,
// unless their stats are vieled. Allow the player in the character's
// profile screen to change the color of their flag. They can choose from
// all of the GVT colors of troops. We want players to have an iconic moment
// if they pass a flag of another player … They see their flag and they see
// their name." The game side: SS_FLAG_COLORS (data.js) is the ten-jar GVT
// ARMIES roster hex-exact, default classic green, contrast ink law; the
// flag is DRAWN art baked per colour (ssFlagTex/ssFlag, game.js — never
// setTint); prof.flag persists + syncs (flagColor) and rides the endless
// board row (submitEndless c/v, SSNET.dressFlag redress, SSNET.getFlags
// the one climb-start read — real players only, sg_ never). In the climb
// (Battle.plantFlags/flagBeats): rival flags stand at exactly their level,
// the own flag at the standing best and riding past it, pass beats once
// per climb per rung (fpassLv/ffront ride the checkpoint), the frontier's
// big beat when the highest flag falls. Profile: the endless row wears the
// little flag and opens the flag sheet (big flag + ten 44-pt jars); the
// rating card seats the flag at its foot — veiled mages show NOTHING to
// others, everything to themselves.
// Self-launching like endless-check: serves beta3 on :8899 if nothing
// does, headless Chrome on :9477 (/tmp/cdp-flag, --disable-gpu), Firebase
// blocked at the network layer throughout (local sky, no cleanup owed).
//
//   node tools/flag-check.mjs      # ~5 min
//
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
const PORT = 9477, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= 1. the paper (source, no browser) ================= */
console.log('\nFLAG-CHECK · plant your name in the sky\n');
console.log('— THE PAPER —');
const src = {
  game: readFileSync('game.js', 'utf8'), data: readFileSync('data.js', 'utf8'),
  net: readFileSync('net.js', 'utf8'), strings: readFileSync('strings.js', 'utf8'),
  index: readFileSync('index.html', 'utf8'),
};
const build = (src.game.match(/const BUILD = 'STARSPELL v([\d.]+)'/) || [])[1];
const stamps = [...src.index.matchAll(/\?v=([\d.]+)/g)].map((m) => m[1]);
ok('release ritual: BUILD ' + build + ' and all ' + stamps.length + ' ?v= stamps agree',
  !!build && stamps.length >= 12 && stamps.every((s) => s === build));
// the ten GVT ARMIES troop colours, hex-exact (the plan's roster; camo excluded)
const WANT = { green: '#55793E', tan: '#C09E6C', blue: '#5B84C4', red: '#C05A4A', gold: '#D9A544', black: '#4A4A4A', white: '#E8E8E8', purple: '#8E6BAE', orange: '#D07A3A', teal: '#4AA5A0' };
const jarRows = [...src.data.matchAll(/\{ id: '(\w+)', hex: '(#[0-9A-F]{6})' \}/g)].map((m) => [m[1], m[2]]);
ok('ten jars, the GVT ARMIES hexes exact, camo nowhere', jarRows.length === 10 &&
  jarRows.every(([id, hex]) => WANT[id] === hex) && Object.keys(WANT).every((id) => jarRows.some(([j]) => j === id)) &&
  !/5C6B3A/i.test(src.data), jarRows.map(([i]) => i).join(' '));
ok('the factory default is classic green', /SS_FLAG_DEF = 'green'/.test(src.data));
ok('the contrast ink law: navy on white/tan/gold, parchment on the rest',
  /'white' \|\| id === 'tan' \|\| id === 'gold' \? '#26281f' : '#f6ecd2'/.test(src.data));
ok('the flag is baked per colour — no setTint anywhere near it (Canvas law)', (() => {
  const i = src.game.indexOf('function ssFlagTex');
  const j = src.game.indexOf('/* ---- sigil rarity dress');
  return i > 0 && j > i && !/setTint/.test(src.game.slice(i, j));
})());
ok('the row carries the dress: submitEndless takes colour + veil, dressFlag redresses, getFlags reads',
  /submitEndless\(level, score, finestWord, color, veiled\)/.test(src.net) &&
  /async function dressFlag\(color, veiled\)/.test(src.net) && /async function getFlags\(\)/.test(src.net) &&
  /dressFlag, getFlags,/.test(src.net));
ok('getFlags is real players only (sg_ filtered at the source)', /!\/\^sg_\/\.test\(id\)/.test(src.net));
ok('the jar ships with the profile (flagColor in the sync payload)', /flagColor: this\.prof\.flag/.test(src.game));
ok('one read at climb start, never per level (getFlags absent from startFight)', (() => {
  const i = src.game.indexOf('startFight() {');
  const j = src.game.indexOf('modeTitle() {');
  const one = (src.game.match(/SSNET\.getFlags\(\)/g) || []).length === 1;
  return one && !(i > 0 && src.game.slice(i, j).includes('getFlags'));
})());
ok('the ceremonies ride the checkpoint (fpassLv + ffront saved and resumed)',
  /fpassLv: this\.run\.fpassLv \| 0, ffront: this\.run\.ffront \? 1 : undefined/.test(src.game) &&
  /fpassLv: this\.resume\.fpassLv \| 0, ffront: !!this\.resume\.ffront/.test(src.game));
// strings ×5, every key, the right slots
const KEYS = ['flagTitle', 'flagStands', 'flagJars', 'flagJarsHint', 'flagPass', 'flagPassMore', 'flagPassSub', 'flagFront', 'flagFrontSub', 'flagAt'];
const SLOT = { flagStands: ['%1'], flagPass: ['%1'], flagPassMore: ['%1', '%2'], flagPassSub: ['%1'], flagFrontSub: ['%1', '%2'], flagAt: ['%1'] };
let strOk = true, strWhy = '';
for (const lang of ['en', 'es', 'fr', 'pt', 'de']) {
  const m = src.strings.match(new RegExp("  " + lang + ": \\{([\\s\\S]*?)\\n  \\},"));
  const blk = m ? m[1] : '';
  for (const k of KEYS) {
    const km = blk.match(new RegExp("\\b" + k + ": '((?:[^'\\\\]|\\\\.)*)'"));
    if (!km) { strOk = false; strWhy = lang + ' misses ' + k; break; }
    for (const s of SLOT[k] || []) if (!km[1].includes(s)) { strOk = false; strWhy = lang + '.' + k + ' misses ' + s; }
  }
}
ok('all ten flag strings ride in all five tongues, slots intact', strOk, strWhy);

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
try { rmSync('/tmp/cdp-flag', { recursive: true, force: true }); } catch (e) { }
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-flag', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const tap = async (expr) => {
  const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await sleep(40);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(70);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
// the verified retry-tap: the first synthesized click after a scene change
// is sometimes eaten — tap until the condition lands
const tapUntil = async (expr, cond, tries = 5) => {
  for (let t = 0; t < tries; t++) {
    try { await tap(expr); } catch (e) { }
    await sleep(700);
    try { if (await ev(cond) === true) return true; } catch (e) { }
  }
  return false;
};
const shot = async (name) => {
  if (!SHOTS) return;
  try {
    mkdirSync(SHOTS, { recursive: true });
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(SHOTS + '/' + name + '.png', Buffer.from(r.data, 'base64'));
  } catch (e) { }
};
const B = `game.scene.getScene('battle')`;
const H = `game.scene.getScene('home')`;
const P = `game.scene.getScene('profile')`;
const PICK = `!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`;
const HOME = `!!window.game && ${H} && ${H}.sys.isActive() && !!${H}.menuRows`;
const FLAGS = `JSON.stringify(window.__ssflags || {})`;
// what stands in the climb's flag ground: per flag container, the baked
// texture (the jar) and any name text on the cloth
const STAND = `JSON.stringify((() => { const b = ${B}; const out = [];
  for (const c of b.flagC.list) { if (!c.list) continue;
    const img = c.list.find((o) => o.texture && /^flag-/.test(o.texture.key));
    const txt = c.list.find((o) => o.style && o.text);
    out.push({ tex: img ? img.texture.key : null, name: txt ? txt.text : '' }); }
  return out })())`;
const INTERACTIVE_FLAGS = `(() => { let n = 0; const scan = (ls) => ls.forEach((o) => {
  if (o.input && o.input.enabled) n++; if (o.list) scan(o.list); }); scan(${B}.flagC.list); return n })()`;
// the rival sky, seeded through the REAL channel (the local tree IS the
// local sky — SSNET reads it through the same dbGet the live sky uses)
const SKY = JSON.stringify({
  endless: {
    all: {
      test_r1: { name: 'Velvet Fox', lvl: 2, score: 400, word: 'MOON', at: 1, c: 'blue' },
      test_r2: { name: 'Astral Owl', lvl: 3, score: 300, word: 'STAR', at: 2, c: 'red' },
      test_r3: { name: 'Quiet Hare', lvl: 3, score: 500, word: 'DUSK', at: 3, c: 'teal' },
      test_veil: { name: 'Umbral Widow', lvl: 2, score: 900, word: 'VEIL', at: 4, c: 'purple', v: 1 },
      sg_fake: { name: 'Seeded Ghost', lvl: 4, score: 200, word: 'FAKE', at: 5, c: 'gold' },
      test_top: { name: 'Gilded Fox', lvl: 5, score: 9000, word: 'CROWN', at: 6, c: 'green' },
    },
  },
});
const PROF3 = JSON.stringify({ rating: 1000, endless: { bestLevel: 3, bestScore: 777, runs: 1 }, flag: 'orange' });
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1');
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
// keep the standing sky (profile, checkpoint, local tree) — a reload, not a wipe
const reboot = async (q) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`sessionStorage.setItem('beta3.skipIntro', '1'); 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
// enter level N (fights[N-1]) through the level's own beat, and wait for
// the flag ground to speak for it
const climbTo = async (lv) => {
  await until(`!!${B} && ${B}.state === 'pick'`, 20000, 250);
  await ev(`(() => { const b = ${B}; b.run.fightIdx = ${lv - 1}; b.startFight(); return 'ok' })()`);
  return until(`(window.__ssflags || {}).level === ${lv}`, 15000, 250);
};

/* ================= 2. the ledger: a run plants ONE flag ================= */
console.log('— THE LEDGER (one flag, moved never multiplied) —');
await boot('endless=1');
ok('endless battle at pick (?endless=1 seam)', await until(PICK, 60000));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
// first completed run: fall on level 3
await ev(`(() => { const b = ${B}; b.run.fightIdx = 2; b.endRun(false); return 'ok' })()`);
await until(`${B}.state === 'end'`, 15000);
await sleep(800);
let row = await evj(`SSNET.dbGet('endless/all/' + SSNET.uid()).then((r) => JSON.stringify(r || {}))`);
const led1 = await evj(`JSON.stringify({ best: SS.prof.endless.bestLevel, n: 0 })`);
ok('a first completed run plants the flag (best level 3, the row stands)', led1.best === 3 && row.lvl === 3, JSON.stringify(row));
ok('…wearing the factory jar and this mage\'s name', row.c === 'green' && row.name === await ev(`SSNET.myName()`), row.c + ' · ' + row.name);
// a better run MOVES it — never a second flag
await ev(`${B}.scene.restart({ mode: 'endless', resume: null }); 'ok'`);
ok('a fresh climb rises', await until(PICK, 30000));
await ev(`(() => { const b = ${B}; b.run.fightIdx = 6; b.endRun(false); return 'ok' })()`);
await until(`${B}.state === 'end'`, 15000);
await sleep(800);
row = await evj(`SSNET.dbGet('endless/all/' + SSNET.uid()).then((r) => JSON.stringify(r || {}))`);
const allN = await ev(`SSNET.dbGet('endless/all').then((a) => Object.keys(a || {}).length)`);
ok('a better run MOVES the flag (level 7), never a trail (one row)', row.lvl === 7 && allN === 1, 'lvl ' + row.lvl + ' · rows ' + allN);
// a worse run leaves the mark standing
await ev(`${B}.scene.restart({ mode: 'endless', resume: null }); 'ok'`);
await until(PICK, 30000);
await ev(`(() => { const b = ${B}; b.run.fightIdx = 1; b.endRun(false); return 'ok' })()`);
await until(`${B}.state === 'end'`, 15000);
await sleep(800);
row = await evj(`SSNET.dbGet('endless/all/' + SSNET.uid()).then((r) => JSON.stringify(r || {}))`);
ok('a worse run never lowers it', row.lvl === 7 && (await evj(`JSON.stringify(SS.prof.endless)`)).bestLevel === 7);

/* ================= 3. the climb: the iconic moment ================= */
console.log('— THE CLIMB (their flag is THERE) —');
await boot('endless=1', `localStorage.setItem('beta3.profile', '${PROF3.replace(/'/g, "\\'")}');
  localStorage.setItem('starspellLocalDb', '${SKY.replace(/'/g, "\\'")}');`);
ok('the rival sky stands and a fresh climb rises', await until(PICK, 60000));
ok('the ledger was read once at climb start (4 real unveiled rivals)',
  await until(`(window.__ssflags || {}).rows === 4`, 15000), await ev(FLAGS));
let f = await evj(FLAGS);
ok('level 1: no flag stands, nothing drawn', f.level === 1 && f.drawn === 0 && !f.mine);
ok('the flag ground is pure presence — nothing interactive in it', await ev(INTERACTIVE_FLAGS) === 0);
// level 2: Velvet Fox's blue flag is THERE — the veiled widow's is NOT
ok('level 2 reached', await climbTo(2));
await sleep(1200);
let st = await evj(STAND);
f = await evj(FLAGS);
ok('level 2: Velvet Fox\'s flag is THERE — blue cloth, name across it',
  f.drawn === 1 && st.some((x) => x.tex === 'flag-blue' && x.name === 'VELVET FOX'), JSON.stringify(st));
ok('the veiled mage\'s flag stands NOWHERE (their stats are veiled)',
  !st.some((x) => x.tex === 'flag-purple') && !JSON.stringify(f.names || []).includes('Umbral'), 'level-2 field clean');
ok('no pass beat yet (nothing stood at level 1)', !(f.passes | 0), 'passes ' + (f.passes | 0));
await shot('climb-l2-velvet-fox');
// level 3: two rivals fan + the own flag at its standing best; the pass beat rings for level 2
ok('level 3 reached', await climbTo(3));
await sleep(1400);
st = await evj(STAND);
f = await evj(FLAGS);
ok('level 3: both rival flags fan legibly beside the own (3 drawn)', f.drawn === 3 &&
  st.some((x) => x.tex === 'flag-red') && st.some((x) => x.tex === 'flag-teal'), JSON.stringify(st.map((x) => x.tex)));
const myNm = (await ev(`SSNET.myName()`)).toUpperCase();
ok('the own flag stands at the standing best — orange, this mage\'s own name',
  f.mine && st.some((x) => x.tex === 'flag-orange' && x.name === myNm));
ok('the pass beat rang once, naming Velvet Fox', (f.passes | 0) === 1 && String(f.beat).includes('Velvet Fox') && f.passedLv === 2, f.beat);
// the beat is once per climb per rung: re-entering the level never re-rings
await ev(`(() => { const b = ${B}; b.startFight(); return 'ok' })()`);
await sleep(1200);
f = await evj(FLAGS);
ok('re-entering the level never re-rings the beat (once per climb)', (f.passes | 0) === 1);
// level 4: the seeded ghost's flag must NOT stand — the moment is real players only
ok('level 4 reached', await climbTo(4));
await sleep(1200);
st = await evj(STAND);
f = await evj(FLAGS);
ok('level 4: the seeded ghost plants NO flag (real players only)',
  !st.some((x) => x.tex === 'flag-gold') && f.drawn === 1, JSON.stringify(st.map((x) => x.tex)));
ok('…passing the two level-3 flags rang ONE beat naming the finest + more', (f.passes | 0) === 2 &&
  String(f.beat).includes('Quiet Hare') && /\+\s*1|\+1/.test(String(f.beat)), f.beat);
// level 5: the frontier flag stands; level 6: THE FRONTIER IS YOURS
ok('level 5 reached — the record flag stands highest', await climbTo(5));
await sleep(1200);
st = await evj(STAND);
f = await evj(FLAGS);
ok('level 5: Gilded Fox\'s green record flag is THERE', st.some((x) => x.tex === 'flag-green' && x.name === 'GILDED FOX'));
ok('…and no beat rang for the ghost\'s rung below', (f.passes | 0) === 2);
await shot('climb-l5-frontier-stands');
ok('level 6 reached — past the record', await climbTo(6));
await sleep(1400);
f = await evj(FLAGS);
ok('THE FRONTIER IS YOURS — the big beat rang', f.front === true && String(f.beat) === await ev(`SS_T('flagFront')`), f.beat);
ok('…and the own flag rides above it (planted at level 6)', f.mine && f.level === 6);
await shot('climb-l6-frontier-taken');
const ck1 = await evj(`localStorage.getItem('beta3.endless')`);
ok('the ceremonies rode the checkpoint (fpassLv 5, the frontier spent)', ck1.fpassLv === 5 && ck1.ffront === 1, JSON.stringify({ f: ck1.fpassLv, fr: ck1.ffront }));
// a resumed climb re-reads, never duplicates, never re-rings
await reboot('endless=1');
ok('the climb resumes at level 6 by its checkpoint', await until(`(window.__ssflags || {}).level === 6`, 60000));
await sleep(1500);
f = await evj(FLAGS);
st = await evj(STAND);
ok('the resumed climb re-read the ledger (4 rivals again, flags re-planted)', f.rows === 4 && f.mine);
ok('…and repeats NO ceremony (fpassLv/ffront resumed, zero fresh passes)', !(f.passes | 0) && await ev(`${B}.run.fpassLv === 5 && ${B}.run.ffront === true`));
// the reckoning writes the new frontier for the next climber
await ev(`(() => { const b = ${B}; b.endRun(false); return 'ok' })()`);
await until(`${B}.state === 'end'`, 15000);
await sleep(800);
row = await evj(`SSNET.dbGet('endless/all/' + SSNET.uid()).then((r) => JSON.stringify(r || {}))`);
ok('the fall plants the flag at level 6 for the next climber — above the old record', row.lvl === 6 && row.c === 'orange', JSON.stringify(row));
const flagsNow = await evj(`SSNET.getFlags().then((r) => JSON.stringify(r))`);
ok('getFlags ranks it the frontier now, ghost rows invisible',
  flagsNow[0] && flagsNow[0].level === 6 && !flagsNow.some((r) => /^sg_/.test(r.id)), JSON.stringify(flagsNow.map((r) => r.level)));
// ?ghosts=0 sweeps seeded flags too — trivially: none ever stand
await reboot('endless=1&ghosts=0');
await until(PICK, 60000);
ok('?ghosts=0: the flag ledger reads identically (real names only, never sg_)',
  await ev(`SSNET.getFlags().then((r) => r.length === 6 && !r.some((x) => /^sg_/.test(x.id)))`));

/* ================= 4. the veil on the row ================= */
console.log('— THE VEIL ON THE ROW —');
await ev(`(() => { SS.prof.rhide = true; SS.save(); return 'ok' })()`);
await ev(`(() => { const b = ${B}; b.run.fightIdx = 8; b.endRun(false); return 'ok' })()`);
await until(`${B}.state === 'end'`, 15000);
await sleep(800);
row = await evj(`SSNET.dbGet('endless/all/' + SSNET.uid()).then((r) => JSON.stringify(r || {}))`);
ok('a veiled mage\'s reckoning stamps the veil on the row (v: 1, level moved)', row.v === 1 && row.lvl === 9, JSON.stringify(row));
ok('…and getFlags reports the veil for the climb-side filter to honour',
  await ev(`SSNET.getFlags().then((r) => ((r.find((x) => x.id === 'test_veil') || {}).veiled === true)
    && ((r.find((x) => x.id === SSNET.uid()) || {}).veiled === true))`));

/* ================= 5. the profile: the flag and the ten jars ================= */
console.log('— THE PROFILE (the flag sheet, ten jars by real taps) —');
await ev(`(() => { SS.prof.rhide = false; SS.save(); SS.sync(); SSNET.dressFlag(SS.prof.flag, false); return 'ok' })()`);
await reboot('');
ok('home stands', await until(HOME, 60000));
await ev(`${H}.scene.start('profile'); 'ok'`);
ok('the profile stands', await until(`!!${P} && ${P}.sys.isActive() && !!${P}.statsB`, 30000));
// v0.78.0: the ledger lives behind the STATS door now — the flag row rides
// its endless row inside the stats sheet, dress and door unchanged
ok('STATS opens the ledger sheet (real tap)', await tapUntil(`${P}.statsB`, `!!${P}.statsP && !!${P}.rowFlag`));
await sleep(500);
let pr = await evj(`JSON.stringify((() => { const p = ${P};
  const img = p.rowFlag.list.find((o) => o.texture && /^flag-/.test(o.texture.key));
  let zone = null; const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('flagRow')) zone = o; if (o.list) scan(o.list); });
  scan(p.statsP.list);
  const D = game.scale.width / innerWidth;
  return { tex: img ? img.texture.key : null, zone: !!zone,
    hitH: zone ? zone.input.hitArea.height / D : 0 } })())`);
ok('the endless row wears the little flag in this mage\'s jar', pr.tex === 'flag-orange', pr.tex);
ok('…and the row is a 44-pt door', pr.zone && pr.hitH >= 43.5, Math.round(pr.hitH) + 'pt');
ok('a real tap opens the flag sheet', await tapUntil(
  `(() => { let z = null; const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('flagRow')) z = o; if (o.list) scan(o.list); }); scan(${P}.statsP.list); return z })()`,
  `!!${P}.flagP`));
await sleep(600);
let sh = await evj(`JSON.stringify((() => { const p = ${P}; const D = game.scale.width / innerWidth;
  const jars = []; const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('flagJar')) jars.push({
    id: o.getData('flagJar'), w: o.input.hitArea.width / D, h: o.input.hitArea.height / D }); if (o.list) scan(o.list); });
  scan(p.flagP.list);
  // the cloth's own name and roundel live INSIDE the flag's container —
  // read them there, not from whatever text the sheet lists first
  let tex = null, nm = '', lvl = '';
  const deep = (ls) => ls.forEach((o) => {
    if (o.list && o.list.some((x) => x.texture && /^flag-/.test(x.texture.key))) {
      const img = o.list.find((x) => x.texture && /^flag-/.test(x.texture.key));
      tex = img.texture.key;
      for (const x of o.list) { if (x.style && x.text && x.text.length > 2) nm = x.text; if (x.style && /^\\d+$/.test(x.text || '')) lvl = x.text; }
    }
    if (o.list) deep(o.list); });
  deep(p.flagP.list);
  return { jars, tex, nm, lvl } })())`);
ok('the sheet flies the big flag — jar, name across the cloth, the level roundel',
  sh.tex === 'flag-orange' && sh.nm === (await ev(`SSNET.myName()`)).toUpperCase() && sh.lvl === '9',
  sh.tex + ' · ' + sh.nm + ' · L' + sh.lvl);
ok('all ten jars stand, every one a 44-pt tap', sh.jars.length === 10 &&
  sh.jars.every((j) => j.w >= 43.5 && j.h >= 43.5) && Object.keys(WANT).every((id) => sh.jars.some((j) => j.id === id)),
  sh.jars.map((j) => j.id).join(' '));
await shot('profile-flag-sheet');
// a real tap on the RED jar repaints everything, everywhere
ok('a real tap on the red jar takes it', await tapUntil(
  `(() => { let r = null; const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('flagJar') === 'red') r = o; if (o.list) scan(o.list); }); scan(${P}.flagP.list); return r })()`,
  `SS.prof.flag === 'red'`));
await sleep(700);
const paint = await evj(`JSON.stringify((() => { const p = ${P};
  let tex = null; const deep = (ls) => ls.forEach((o) => { if (o.texture && /^flag-/.test(o.texture.key)) tex = o.texture.key; if (o.list) deep(o.list); });
  deep(p.flagP.list);
  const rowImg = p.rowFlag.list.find((o) => o.texture && /^flag-/.test(o.texture.key));
  return { sheet: tex, row: rowImg ? rowImg.texture.key : null } })())`);
ok('the sheet flag and the row flag repaint LIVE', paint.sheet === 'flag-red' && paint.row === 'flag-red', JSON.stringify(paint));
await sleep(900);
const synced = await evj(`Promise.all([
  SSNET.dbGet('players/' + SSNET.uid()), SSNET.dbGet('endless/all/' + SSNET.uid()),
]).then(([p, r]) => JSON.stringify({ pc: p && p.flagColor, rc: r && r.c }))`);
ok('the choice reaches the synced profile AND redresses the standing row', synced.pc === 'red' && synced.rc === 'red', JSON.stringify(synced));
await shot('profile-jar-red');
// persistence across a reload
await reboot('');
await until(HOME, 60000);
ok('the jar persists across a reload', await ev(`SS.prof.flag`) === 'red');

/* ================= 6. the rating card's flag, and the veil ================= */
console.log('— THE RATING CARD (veiled to others, never to self) —');
await ev(`(() => {
  const t = JSON.parse(localStorage.getItem('starspellLocalDb'));
  t.players = t.players || {};
  t.players.test_open = { name: 'Rune Bear', rating: 1100, rhide: 0, endlessBest: 9, endlessScore: 4000, flagColor: 'teal', at: 1 };
  t.players.test_hid = { name: 'Quiet Widow', rating: 1200, rhide: 1, endlessBest: 12, endlessScore: 5000, flagColor: 'gold', at: 1 };
  localStorage.setItem('starspellLocalDb', JSON.stringify(t)); return 'ok' })()`);
await ev(`${H}.scene.start('profile'); 'ok'`);
await until(`!!${P} && ${P}.sys.isActive()`, 30000);
const card = async (o) => {
  await ev(`(() => { if (${P}.__rcC) { ${P}.__rcC.destroy(); ${P}.__rcC = null; } ssRatingCard(${P}, ${o}); return 'ok' })()`);
  await sleep(1000);
  return evj(`JSON.stringify((() => { const c = ${P}.__rcC; if (!c) return { none: true };
    let tex = null, veilTxt = false, flagTxt = '';
    const deep = (ls) => ls.forEach((x) => { if (x.texture && /^flag-/.test(x.texture.key)) tex = x.texture.key;
      if (x.style && x.text === SS_T('rHiddenCard')) veilTxt = true;
      if (x.style && x.text && (x.text === SS_T('flagAt', 9) || x.text === SS_T('flagStands', 9) || x.text === SS_T('flagAt', 12))) flagTxt = x.text;
      if (x.list) deep(x.list); });
    deep(c.list);
    return { tex, veilTxt, flagTxt } })())`);
};
let cd = await card(`{ uid: 'test_open', name: 'Rune Bear' }`);
ok('an unveiled mage\'s card seats their flag — teal, their level named', cd.tex === 'flag-teal' && cd.flagTxt === await ev(`SS_T('flagAt', 9)`), JSON.stringify(cd));
cd = await card(`{ uid: 'test_hid', name: 'Quiet Widow' }`);
ok('a veiled mage shows NOTHING: no rating, no flag, no level', cd.veilTxt && !cd.tex && !cd.flagTxt, JSON.stringify(cd));
await ev(`(() => { SS.prof.rhide = true; SS.save(); return 'ok' })()`);
cd = await card(`{ own: true }`);
ok('the veil never veils you from yourself — the own card keeps the flag', cd.tex === 'flag-red' && !cd.veilTxt, JSON.stringify(cd));
cd = await card(`{ name: 'Some Ghost', rating: 990, rhide: false }`);
ok('a board ghost\'s card carries no flag (nothing in the registry)', !cd.tex && !cd.flagTxt);
await ev(`(() => { SS.prof.rhide = false; SS.save(); return 'ok' })()`);

/* ================= 7. the spanish dress ================= */
console.log('— THE SPANISH DRESS —');
await boot('endless=1&lang=es', `localStorage.setItem('beta3.profile', '${PROF3.replace(/'/g, "\\'")}');
  localStorage.setItem('starspellLocalDb', '${SKY.replace(/'/g, "\\'")}');`);
ok('the spanish climb rises', await until(PICK, 60000));
await until(`(window.__ssflags || {}).rows === 4`, 15000);
await climbTo(3);
await sleep(1200);
f = await evj(FLAGS);
ok('the pass beat speaks Spanish', String(f.beat).includes('pasaste la bandera de Velvet Fox'), f.beat);
ok('…and the sub-line too', String(f.beatSub).includes('nivel 2'), f.beatSub);
const esT = await evj(`JSON.stringify({ t: SS_T('flagTitle'), j: SS_T('flagJars') })`);
ok('the sheet\'s words are Spanish (TU BANDERA · EL COLOR DE TU BANDERA)', esT.t === 'TU BANDERA' && esT.j === 'EL COLOR DE TU BANDERA');
ok('no page errors anywhere', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= the verdict ================= */
console.log('\n' + pass + ' passed · ' + fail + ' failed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
try { ws.close(); } catch (e) { }
process.exit(fail ? 1 : 0);
