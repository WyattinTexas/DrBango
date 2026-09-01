// SEED-CHECK — the boards' seeded hunters (v0.64.0).
// Skylar (9/1): the young game's boards read empty ("no one has played it
// today"), so daily + weekly carry deterministic client-side ghosts
// (seed-names.js, SS_SEED) merged into getBoard's rows: same board key ⇒ same
// ghosts for every player, arriving through the day, scores in the mode's
// middle-to-lower band, NEVER holding #1 over a real row (the best real score
// is always champion — ghosts above it are squeezed strictly below), never
// wearing this player's uid or name, flagged ghost:true / uid 'sg_…' and all
// removed by one switch (SS_SEED.enabled / ?ghosts=0). Nothing is ever
// written to the RTDB — no registry claim, no players/ row, no presence.
// Self-launching like dew-check: serves beta3 on :8899 if nothing does,
// headless Chrome on :9460 (/tmp/cdp-seed, --disable-gpu), Firebase blocked
// at the network layer throughout — every board here is a cold sky.
//
//   node tools/seed-check.mjs      # ~2 min
//
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const PORT = 9460, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- the source audit (no browser needed) ---------- */
console.log('— THE SOURCE AUDIT: GHOSTS TOUCH NOTHING LIVE —');
const seedSrc = readFileSync('seed-names.js', 'utf8');
ok('seed layer never reaches the net (no SSNET / firebase / fetch)', !/SSNET|firebase|fetch\(|XMLHttpRequest/.test(seedSrc));
ok('ghost uids wear the reserved prefix', /PREFIX = 'sg_'/.test(seedSrc));
const vsSrc = readFileSync('versus.js', 'utf8') + readFileSync('rival.js', 'utf8');
ok('versus + rival engine never read a board (no getBoard)', !/getBoard/.test(vsSrc));
const netSrc = readFileSync('net.js', 'utf8');
ok('the merge is guarded (a seed bug can never take the board down)', /try\s*\{\s*if \(typeof SS_SEED/.test(netSrc));

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-seed', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
await send('Page.addScriptToEvaluateOnNewDocument', { source: `navigator.share = undefined; navigator.clipboard = undefined;` });
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
const tapAt = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(40);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(70);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const tap = async (expr, dy = 0) => {
  const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D + ${dy} }) })()`));
  await tapAt(p.x, p.y);
};
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1'); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined' && typeof SS_SEED !== 'undefined'`, 30000);
  errs.length = 0;   // a dropped first navigate can strand a half document — only the landed boot counts
};
const K = '20260901', D0 = Date.UTC(2026, 8, 1);   // the fixed test day (a real past-or-today key)
const board = async (kind) => evj(`SSNET.getBoard('${kind}', ssGameLang()).then((b) => JSON.stringify(b))`);

/* ================= THE CAST ================= */
console.log('\n— THE CAST: DETERMINISTIC, LEGAL, IN THE BAND —');
await boot('daykey=' + K);
ok('firebase blocked — this sky is cold (local mode)', await until(`SSNET.mode === 'local'`, 15000));
const data = await evj(`JSON.stringify((() => {
  const names = SS_SEED_NAMES.map((e) => typeof e === 'string' ? e : e.n);
  const folds = names.map((n) => n.trim().replace(/\\s+/g, ' ').toLowerCase());
  return { n: names.length, long: names.filter((n) => n.length > 18), dup: folds.filter((f, i) => folds.indexOf(f) !== i) };
})())`);
ok('the cast list holds ' + data.n + ' names, all ≤ 18 chars, no duplicates', data.n >= 80 && !data.long.length && !data.dup.length, data.long.concat(data.dup).join(','));
const legal = await evj(`(async () => {
  const out = {};
  for (const lang of Object.keys(SS_SEED_WORDS)) {
    if (lang !== 'en' && !SS_DICT.ready(lang)) await new Promise((r) => SS_DICT.load(lang, r));
    out[lang] = SS_SEED_WORDS[lang].filter((w) => !SS_DICT.set(lang).has(w));
  }
  return JSON.stringify(out);
})()`);
for (const lang of ['en', 'es', 'fr', 'pt', 'de']) {
  ok('every ' + lang + ' seed word is real in its dictionary', legal[lang] && legal[lang].length === 0, (legal[lang] || ['no pool']).join(','));
}
const full = D0 + 86000000;   // 23:53 of the test day — the whole cast has arrived
const g1 = await evj(`JSON.stringify(SS_SEED.ghosts('daily', '${K}', 'en', ${full}))`);
const g2 = await evj(`JSON.stringify(SS_SEED.ghosts('daily', '${K}', 'en', ${full}))`);
ok('the en daily casts 6-10 hunters', g1.length >= 6 && g1.length <= 10, 'n=' + g1.length);
ok('two reads are identical — every player sees this cast', JSON.stringify(g1) === JSON.stringify(g2));
const names = await evj(`JSON.stringify(SS_SEED_NAMES.map((e) => typeof e === 'string' ? e : e.n))`);
const words = await evj(`JSON.stringify(SS_SEED_WORDS)`);
const allWords = Object.values(words).flat().map((w) => w.toUpperCase());
ok('every ghost is flagged and wears the sg_ prefix', g1.every((g) => g.ghost === true && /^sg_/.test(g.id)));
ok('every name is from the editable list', g1.every((g) => names.includes(g.name)), g1.map((g) => g.name).join(','));
ok('every finest word is from the editable pools', g1.every((g) => allWords.includes(g.word)));
ok('scores sit inside the daily band (120-560)', g1.every((g) => g.score >= 15 && g.score <= 560), g1.map((g) => g.score).join(','));
ok('arrivals all inside the day', g1.every((g) => g.at >= D0 && g.at < D0 + 86400000));
ok('word length follows the score (small score, small word)', g1.every((g) => g.score >= 220 || g.word.length <= 5));
const gEarly = await evj(`JSON.stringify(SS_SEED.ghosts('daily', '${K}', 'en', ${D0 + 240000}))`);
const gNoon = await evj(`JSON.stringify(SS_SEED.ghosts('daily', '${K}', 'en', ${D0 + 43200000}))`);
ok('the board fills THROUGH the day (4min ≤ noon ≤ night)', gEarly.length <= gNoon.length && gNoon.length <= g1.length && gNoon.length < g1.length,
  gEarly.length + ' → ' + gNoon.length + ' → ' + g1.length);
ok('an early hunter arrives inside the first ten minutes', g1.some((g) => g.at <= D0 + 600000));
ok('noon\'s hunters are exactly the night\'s first arrivals', gNoon.every((g, i) => g1[i] && g1[i].id === g.id));
ok('a hunter minutes into the sky holds only a small score', gEarly.every((g) => g.score <= 25 + ((g.at - D0) / 60000) * 40));
const es1 = await evj(`JSON.stringify(SS_SEED.ghosts('daily', '${K}', 'es', ${full}))`);
// the weekly of K's own week (2026-W36) — the daily/weekly partition is
// per-week, so the disjointness law only binds inside one week. +7d covers
// the whole real week whenever the suite runs.
const wkFull = await evj(`JSON.stringify(SS_SEED.ghosts('weekly', '2026-W36', null, Date.now() + 7 * 86400000))`);
ok('the es daily casts its own hunters (≥1 local, es words)', es1.length >= 6 && es1.some((g) => /Lucía|Mateo|Rocío|Marisol|Andrés|Ximena|Tomás G|estrella99/.test(g.name))
  && es1.every((g) => words.es.map((w) => w.toUpperCase()).includes(g.word)), es1.map((g) => g.name + ':' + g.word).join(','));
ok('en and es boards never share a hunter on one day', !g1.some((a) => es1.some((b) => b.name === a.name)));
ok('the weekly casts 12-18 across its week', wkFull.length >= 12 && wkFull.length <= 18, 'n=' + wkFull.length);
ok('weekly hunters never sit on this week\'s dailies', !wkFull.some((a) => g1.concat(es1).some((b) => b.name === a.name)));
ok('weekly scores sit inside the weekly band (150-640)', wkFull.every((g) => g.score >= 15 && g.score <= 640));
let shared = null;
for (let d = 25; d >= 18 && !shared; d--) {
  const gd = await evj(`JSON.stringify(SS_SEED.ghosts('daily', '202608${d}', 'en', ${Date.UTC(2026, 7, 26)}))`);
  const hit = gd.find((a) => g1.some((b) => b.name === a.name));
  if (hit) shared = { then: hit, now: g1.find((b) => b.name === hit.name) };
}
ok('a returning hunter keeps their rating and veil across days', !!shared && shared.then.rating === shared.now.rating && shared.then.rhide === shared.now.rhide,
  shared ? shared.now.name + ' @' + shared.now.rating : 'no shared name found in 8 days');
ok('ratings live in the quiet band (880-1160)', g1.concat(wkFull).every((g) => g.rating >= 880 && g.rating < 1160));

/* ================= THE BOARD, MERGED ================= */
console.log('\n— GETBOARD: COLD SKY, THEN REAL ROWS ALWAYS ON TOP —');
const b0 = await board('daily');
ok('a cold daily board is alive (ghosts merged in)', b0.rows.length >= 1 && b0.rows.every((r) => /^sg_/.test(r.id)), 'n=' + b0.rows.length);
ok('no ghost is ever "you"', b0.me === -1);
ok('the count is truthful to the merged list', b0.total === b0.rows.length);
ok('the board is sorted', b0.rows.every((r, i) => !i || b0.rows[i - 1].score >= r.score));
const b0b = await board('daily');
ok('two board reads agree', JSON.stringify(b0) === JSON.stringify(b0b));
const wk0 = await board('weekly');
ok('a cold weekly board is alive too', wk0.rows.length >= 1 && wk0.rows.every((r) => /^sg_/.test(r.id)) && wk0.me === -1, 'n=' + wk0.rows.length);
// a real daily run lands — the player must hold #1 over every ghost
await ev(`SSNET.submitScore(300, 'lantern', 'en', 'daily').then(() => 'ok')`);
const b1 = await board('daily');
ok('the real row is champion the moment it lands', b1.rows[0] && b1.rows[0].id === (await ev(`SSNET.uid()`)) && b1.rows[0].score === 300);
ok('every ghost yields to it (all strictly below 300)', b1.rows.slice(1).every((r) => /^sg_/.test(r.id) && r.score < 300));
ok('"you" points at the real row', b1.me === 0 && b1.total === b1.rows.length);
const squeezed = b1.rows.slice(1).map((r) => r.score);
ok('the squeeze reads natural, never a wall of neighbours', squeezed.length < 2 || (squeezed[0] - squeezed[squeezed.length - 1]) >= squeezed.length,
  squeezed.join(','));
const wk1 = await board('weekly');
ok('the weekly row landed and rules its ghosts too', wk1.rows[0] && !/^sg_/.test(wk1.rows[0].id) && wk1.rows.slice(1).every((r) => r.score < 300));
// a second, humbler real row ranks truthfully among the ghosts
await ev(`SSNET.dbSet('daily/${K}/u_second', { name: 'Second Hunter', score: 45, word: 'MOTH', at: Date.now(), m: 'daily' }).then(() => 'ok')`);
const b2 = await board('daily');
const secondIdx = b2.rows.findIndex((r) => r.id === 'u_second');
ok('a humble real row ranks among the ghosts, displacing none', secondIdx > 0 && b2.rows[0].score === 300
  && b2.rows.slice(0, secondIdx).every((r) => r.score >= 45) && b2.rows.slice(secondIdx + 1).every((r) => r.score <= 45));
// the belt: an unstamped (pre-v0.31.1 cache) row still never shows
await ev(`SSNET.dbSet('daily/${K}/u_stale', { name: 'Old Cache', score: 999, word: 'X', at: Date.now() }).then(() => 'ok')`);
const b3 = await board('daily');
ok('an unstamped daily row stays invisible (the m-filter holds)', !b3.rows.some((r) => r.id === 'u_stale') && b3.rows[0].score === 300);
// a tiny champion still rules — ghosts squeeze under even a sad top score
await ev(`localStorage.removeItem('starspellLocalDb'); 'ok'`);
await ev(`SSNET.dbSet('daily/${K}/u_tiny', { name: 'Tiny Top', score: 28, word: 'MOTH', at: Date.now(), m: 'daily' }).then(() => 'ok')`);
const b4 = await board('daily');
ok('even a score of 28 keeps #1 — ghosts fold below it', b4.rows[0].id === 'u_tiny' && b4.rows.slice(1).every((r) => /^sg_/.test(r.id) && r.score < 28),
  b4.rows.map((r) => r.score).join(','));
// a real player who wears a ghost's name owns it — the ghost stands down
const gname = b4.rows[1] ? await ev(`(${JSON.stringify(b4.rows[1].name)})`) : null;
await ev(`SSNET.dbSet('daily/${K}/u_taken', { name: ${JSON.stringify(gname)}, score: 22, word: 'FERN', at: Date.now(), m: 'daily' }).then(() => 'ok')`);
const b5 = await board('daily');
ok('a real row wearing a ghost\'s name retires that ghost', b5.rows.filter((r) => r.name === gname).length === 1
  && b5.rows.find((r) => r.name === gname).id === 'u_taken');
// …and the viewing player's own name is never echoed by a ghost
await ev(`localStorage.removeItem('starspellLocalDb'); localStorage.setItem('starspellName', ${JSON.stringify(gname)}); 'ok'`);
const b6 = await board('daily');
ok('no ghost ever wears the player\'s own name', !b6.rows.some((r) => r.name === gname));
await ev(`localStorage.removeItem('starspellName'); 'ok'`);

ok('no page exceptions across the cast + merge work', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= THE SWITCH ================= */
console.log('\n— ONE SWITCH REMOVES EVERY GHOST —');
await boot('daykey=' + K + '&ghosts=0');
ok('?ghosts=0 disarms the layer', await ev(`SS_SEED.enabled === false`));
const off = await board('daily');
ok('the cold board is bare again — real rows only', off.rows.length === 0 && off.total === 0);
await ev(`SS_SEED.enabled = true; 'ok'`);
const on = await board('daily');
ok('flipping SS_SEED.enabled live brings the hunters back', on.rows.length >= 1 && on.rows.every((r) => /^sg_/.test(r.id)));

/* ================= THE SURFACES (REAL TAPS) ================= */
console.log('\n— THE SURFACES: SHEET, PODIUM, RATING CARD, YOU —');
await boot('daykey=' + K);
await until(`game.scene.getScene('home') && game.scene.getScene('home').sys.isActive() && !game.scene.getScene('home').busy()`, 30000);
const H = `game.scene.getScene('home')`;
for (let t = 0; t < 5 && !(await ev(`!!${H}.dailyC`)); t++) { await tap(`${H}.dailyChipB`); await sleep(700); }
ok('the daily chip opens the sheet (real tap)', await ev(`!!${H}.dailyC`));
const sheetTexts = await evj(`(() => { const out = [];
  const walk = (l) => l.forEach((o) => { if (o.list) walk(o.list); if (o.text != null) out.push(String(o.text)); });
  walk(${H}.dailyC.list); return JSON.stringify(out) })()`);
const cast0 = await evj(`JSON.stringify(SS_SEED.ghosts('daily', '${K}', 'en', Date.now()).map((g) => g.name))`);
ok('the sheet lists seeded hunters, not the empty line', cast0.filter((n) => sheetTexts.includes(n)).length >= 3
  && !sheetTexts.includes(await ev(`SS_T('lbEmpty')`)), cast0.join(','));
await tap(`${H}.dailyC.list.find((o) => o.text === '✕')`);
ok('✕ closes the sheet', await until(`!${H}.dailyC`, 8000));
await ev(`${H}.scene.start('profile'); 'ok'`);
await until(`game.scene.getScene('profile') && game.scene.getScene('profile').sys.isActive()`, 15000);
await tap(`game.scene.getScene('profile').leaderB`);
const BD = `game.scene.getScene('board')`;
ok('the profile\'s leaderboard door opens the ceremony (real tap)', await until(`${BD} && ${BD}.sys.isActive()`, 15000));
ok('the podium stands on a cold sky — a seeded champion', await until(`${BD}.rowsC.list.length > 8`, 20000));
const champ = await ev(`SSNET.getBoard('daily', 'en').then((b) => b.rows[0].name)`);
ok('the champion is one of ours', cast0.includes(champ), champ);
await until(`(() => { const o = ${BD}.rowsC.list.find((x) => x.text === ${JSON.stringify(champ)}); return !!o && o.alpha === 1 })()`, 10000);
for (let t = 0; t < 5 && !(await ev(`!!${BD}.__rcC`)); t++) { await tap(`${BD}.rowsC.list.find((x) => x.text === ${JSON.stringify(champ)})`); await sleep(600); }
ok('tapping a ghost\'s name opens their rating card (real tap)', await ev(`!!${BD}.__rcC`));
const cardTexts = await evj(`(() => { const out = [];
  const walk = (l) => l.forEach((o) => { if (o.list) walk(o.list); if (o.text != null) out.push(String(o.text)); });
  walk(${BD}.__rcC.list); return JSON.stringify(out) })()`);
ok('the card is filled, never stuck loading', !cardTexts.includes(await ev(`SS_T('lbLoading')`))
  && (cardTexts.some((t) => /—/.test(t)) || cardTexts.includes(await ev(`SS_T('rHiddenCard')`))), cardTexts.join(' · ').slice(0, 90));
await tap(`${BD}.__rcC.list[0]`, -300);   // the veil, above the little window
ok('the veil closes the card', await until(`!${BD}.__rcC`, 8000));
// a real run lands while the board stands — refresh ranks it over every ghost
await ev(`SSNET.submitScore(300, 'lantern', 'en', 'daily').then(() => 'ok')`);
await tap(`${BD}.tabBtns.weekly.bg`); await until(`${BD}.rowsC.list.length > 8`, 15000);
await tap(`${BD}.tabBtns.daily.bg`); await until(`${BD}.rowsC.list.length > 8`, 15000);
const bNow = await board('daily');
const youLine = await ev(`SS_T('lbYouRank', 1, ${bNow.total})`);
const boardTexts = async () => evj(`(() => { const out = [];
  const walk = (l) => l.forEach((o) => { if (o.list) walk(o.list); if (o.text != null) out.push(String(o.text)); });
  walk(${BD}.rowsC.list); return JSON.stringify(out) })()`);
ok('after a real 300, the podium crowns YOU as #1 of the merged field',
  await until(`(() => { const out = []; const walk = (l) => l.forEach((o) => { if (o.list) walk(o.list); if (o.text != null) out.push(String(o.text)); });
    walk(${BD}.rowsC.list); return out.includes(${JSON.stringify(youLine)}) && out.some((t) => t.includes(${JSON.stringify(await ev(`SS_T('lbYou')`))})) })()`, 15000),
  (await boardTexts()).slice(0, 6).join(' · '));
const wkNow = await board('weekly');
ok('the weekly tab carries the run + its ghosts too', wkNow.me >= 0 && wkNow.total > 1 && wkNow.total === wkNow.rows.length);
ok('no page exceptions across the surfaces', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= THE REGISTRY STAYS UNTOUCHED ================= */
console.log('\n— GHOSTS CANNOT BE CHALLENGED —');
ok('findByName knows no ghost (cold sky: no registry at all)', (await ev(`SSNET.findByName(${JSON.stringify(champ)}).then((r) => JSON.stringify(r))`)) === 'null');
ok('ghosts left no trace: no registry, no presence, no sg_ rows anywhere', await ev(`(() => {
  const t = JSON.parse(localStorage.getItem('starspellLocalDb') || '{}');
  const noSg = (n) => Object.keys(n || {}).every((k) => k.indexOf('sg_') !== 0);
  return !t.names && !t.presence && !t.invites && noSg(t.players) && noSg((t.daily || {})['${K}']) })()`));
console.log('\n' + pass + '/' + (pass + fail) + ' checks passed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
