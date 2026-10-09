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
ok('the row carries the dress: submitEndless takes colour + veil, dressFlag redresses, getWeekFlags reads the week',
  /submitEndless\(level, score, finestWord, color, veiled\)/.test(src.net) &&
  /async function dressFlag\(color, veiled\)/.test(src.net) && /async function getWeekFlags\(\)/.test(src.net) &&
  /dressFlag, getWeekFlags,/.test(src.net));
// the fan reads the WEEK (v0.115.0): the endless/<isoWeek> slice, never all-time
ok('getWeekFlags reads endless/<isoWeek> (the weekly slice, not all-time)',
  /const wk = weekKey\(\);/.test(src.net) && /dbGet\('endless\/' \+ wk\)/.test(src.net));
ok('getWeekFlags is real players only (sg_ filtered at the source)', /!\/\^sg_\/\.test\(id\)/.test(src.net));
ok('the jar ships with the profile (flagColor in the sync payload)', /flagColor: this\.prof\.flag/.test(src.game));
// v0.115.0: in-climb plantFlags/flagBeats RETIRE — the gate owns the flags now
ok('the in-climb flags are gone (plantFlags/flagBeats/__ssflags retired)',
  !/plantFlags/.test(src.game) && !/flagBeats/.test(src.game) && !/__ssflags/.test(src.game));
// the FRONTIER re-seats on the gate; its latch rides the checkpoint alone now
// (the pass-beat family + run.fpassLv retired)
ok('the frontier rides the checkpoint (ffront saved + resumed; fpassLv retired)',
  /ffront: this\.run\.ffront \? 1 : undefined/.test(src.game) &&
  /ffront: !!this\.resume\.ffront/.test(src.game) &&
  !/fpassLv: this\.run\.fpassLv/.test(src.game) && !/fpassLv: this\.resume\.fpassLv/.test(src.game));
ok('the retired pass strings are gone ×5 (flagPass/flagPassMore/flagPassSub)',
  !/\bflagPass:/.test(src.strings) && !/\bflagPassMore:/.test(src.strings) && !/\bflagPassSub:/.test(src.strings));
// the MONUMENT strings stay (the profile sheet + rating card keep their
// all-time voice) — flagFront/flagFrontSub + the gate strings are gate-check's
const KEYS = ['flagTitle', 'flagStands', 'flagJars', 'flagJarsHint', 'flagAt'];
const SLOT = { flagStands: ['%1'], flagAt: ['%1'] };
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
ok('the five monument flag strings ride in all five tongues, slots intact', strOk, strWhy);

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
// v0.115.0: the in-climb fan (plantFlags/flagBeats/__ssflags) + the rival-sky
// seeding + climbTo RETIRED to gate-check — flag-check keeps the MONUMENTS
// (the board row the reckoning writes, the profile flag sheet, the rating card,
// the flag art), which this build leaves untouched.
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

/* ================= 2. the ledger: a run plants ONE flag ================= */
// the MONUMENT board row (endless/all) — untouched by the gate build; the
// gate is skipped (?gate=0) so the reckoning is reached straight off pick
console.log('— THE LEDGER (one flag, moved never multiplied) —');
await boot('endless=1&gate=0');
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

/* ================= 3. the veil on the row (the MONUMENT) ================= */
// The in-climb fan + the frontier ceremony moved to the gate — that whole
// story is gate-check's now. What stays here is the board ROW the reckoning
// writes: it still carries the veil, and getWeekFlags still reports it for the
// fan's veil=vanish filter to honour. A fresh orange-flag climb, veiled, fell.
console.log('— THE VEIL ON THE ROW —');
await boot('endless=1&gate=0', `localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000, flag: 'orange' }));`);
ok('a fresh orange-flag climb rises', await until(PICK, 60000));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
await ev(`(() => { SS.prof.rhide = true; SS.save(); return 'ok' })()`);
await ev(`(() => { const b = ${B}; b.run.fightIdx = 8; b.endRun(false); return 'ok' })()`);
await until(`${B}.state === 'end'`, 15000);
await sleep(800);
row = await evj(`SSNET.dbGet('endless/all/' + SSNET.uid()).then((r) => JSON.stringify(r || {}))`);
ok('a veiled mage\'s reckoning stamps the veil on the all-time row (v:1, orange, level 9)',
  row.v === 1 && row.lvl === 9 && row.c === 'orange', JSON.stringify(row));
ok('…and getWeekFlags reports the veil for the gate fan\'s veil=vanish filter',
  await ev(`SSNET.getWeekFlags().then((res) => ((res.rows.find((x) => x.id === SSNET.uid()) || {}).veiled === true)
    && ((res.rows.find((x) => x.id === SSNET.uid()) || {}).mine === true))`));

/* ================= 4. the profile: the flag and the ten jars ================= */
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

/* ================= 5. the rating card's flag, and the veil ================= */
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

/* ================= 6. the spanish dress (the MONUMENT sheet words) ================= */
// the gate's own es dress (flagFront/gateLevel/…) is gate-check's; here the
// profile flag sheet's all-time words stay Spanish
console.log('— THE SPANISH DRESS —');
await boot('endless=1&gate=0&lang=es');
ok('the spanish climb rises', await until(PICK, 60000));
const esT = await evj(`JSON.stringify({ t: SS_T('flagTitle'), j: SS_T('flagJars') })`);
ok('the sheet\'s words are Spanish (TU BANDERA · EL COLOR DE TU BANDERA)', esT.t === 'TU BANDERA' && esT.j === 'EL COLOR DE TU BANDERA');
ok('no page errors anywhere', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= the verdict ================= */
console.log('\n' + pass + ' passed · ' + fail + ' failed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
try { ws.close(); } catch (e) { }
process.exit(fail ? 1 : 0);
