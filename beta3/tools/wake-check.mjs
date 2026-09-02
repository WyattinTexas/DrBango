// WAKE-CHECK — the sigil unlock's progress meters and the in-run waking
// moment (v0.67.0). Skylar (9/1): "we need to have a way that they can track
// it. Maybe in your player profile screen it shows you how close you are to
// unlocking a Sigil. Also if you unlock a Sigil during a run, there should be
// a reward screen that … says whatever Sigil was just unlocked."
// The game side: a condition met DURING a run settles the moment the board
// hands the turn back (Battle.sigilMoment — the cast resolved, the strike
// weathered, the scry settled; state 'rite' holds the board) or at the
// fight's own end (beastDeath, BEFORE payOffer rolls, so the fresh sigil is
// draw-eligible in the very offer that win pays); the forge ceremony itself
// (ssSigilRite) is REUSED, spends `pend` as it shows, and so can never be
// repeated by endRun or the meadow — both kept as the safety net. The
// sleeping gallery sorts CLOSEST TO WAKING FIRST (ssSigilAsleep), and the
// profile's skies door says "n awake · m nearly there" (skiesNear ×5 langs,
// SS_SIG_NEAR = 0.6) whenever something sleeping is close.
// Self-launching like comet-check: serves beta3 on :8899 if nothing does,
// headless Chrome on :9466 (/tmp/cdp-wake, --disable-gpu), Firebase blocked
// at the network layer throughout.
//
//   node tools/wake-check.mjs      # ~4 min
//
// ⚠ Every wait POLLS (the software renderer can run 12fps); taps re-tap
// until their effect shows; the crossing scry is confirmed by the drip's own
// counter, never by state (comet-check's law).
import { spawn } from 'node:child_process';
const PORT = 9466, SRV = 8899;
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
  '--user-data-dir=/tmp/cdp-wake', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
// a press+release at a DESIGN coordinate (the rite's children and the meadow's
// doors live in screen space — drip-check's helper, verbatim law)
const tapD = async (dx, dy) => {
  const p = JSON.parse(await ev(`(() => { const s = game.scene.getScenes(true)[0], l = ssLayout(s);
    const b = game.canvas.getBoundingClientRect();
    return JSON.stringify({ x: b.left + l.x(${dx}) / game.canvas.width * b.width,
                            y: b.top + l.y(${dy}) / game.canvas.height * b.height }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
const tapUntil = async (dx, dy, done, tries = 10) => {
  for (let i = 0; i < tries; i++) { await tapD(dx, dy); await sleep(450); if (await ev(done) === true) return true; }
  return false;
};
const B = `game.scene.getScene('battle')`;
const PICK = `!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`;
const HOME_REST = `!!window.game && game.scene.isActive('home')
  && !game.scene.getScene('home').introPlaying && !!game.scene.getScene('home').lanternB`;
const RITE = `(() => { const o = game.scene.getScenes(true).flatMap(s => s.children.list)
  .find(x => x.getData && x.getData('sigilRite')); return o ? o.getData('sigilRite') : 'none' })()`;
const RITES = `game.scene.getScenes(true).flatMap(s => s.children.list).filter(x => x.getData && x.getData('sigilRite')).length`;
// dismiss THE RITE ON SCREEN with a real tap on its own veil, and wait for
// that one to leave — never for the whole queue (the next discovery follows
// 840ms later and must be met by its own assert, not swallowed here)
const dismissRite = async () => {
  const cur = await ev(RITE);
  if (cur === 'none') return true;
  for (let t = 0; t < 6; t++) {
    if (await ev(`${RITE} !== '${cur}'`)) break;
    await tap(`game.scene.getScenes(true).flatMap(s => s.children.list).find(x => x.getData && x.getData('sigilRite')).list[0]`);
    await sleep(700);
  }
  return until(`${RITE} !== '${cur}'`, 12000, 200);
};
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  return until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
const findWord = async (must, avoid, minLen = 2, maxLen = 8) => evj(`(() => {
  const b = ${B}, must = ${JSON.stringify(must)}, avoid = ${JSON.stringify(avoid)}; b.buildTrie();
  const tiles = b.board.map((s, i) => ({ s, i })).filter((x) => x.s && !avoid.includes(x.i));
  let best = null;
  const used = tiles.map(() => false), pick = [];
  const dive = (node) => {
    const idx = pick.map((k) => tiles[k].i);
    if (node.$ && idx.length >= ${minLen} && must.every((m) => idx.includes(m)) && (!best || idx.length > best.length)) best = idx.slice();
    if (pick.length >= ${maxLen}) return;
    for (let k = 0; k < tiles.length; k++) {
      if (used[k]) continue;
      let n = node, okk = true;
      for (const ch of tiles[k].s.ch) { n = n[ch]; if (!n) { okk = false; break; } }
      if (!okk) continue;
      used[k] = true; pick.push(k); dive(n); used[k] = false; pick.pop();
    }
  };
  dive(b.trie);
  return JSON.stringify(best);
})()`);

/* ================= 1. the laws on paper ================= */
console.log('\nWAKE-CHECK · progress you can track, a waking you can watch\n');
console.log('— THE LAWS ON PAPER —');
ok('booted', await boot('quick=1'));
ok('quick run at pick', await until(PICK, 60000));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
ok('SS_SIG_NEAR is one dial in (0, 1)', await ev(`SS_SIG_NEAR > 0 && SS_SIG_NEAR < 1`), String(await ev(`SS_SIG_NEAR`)));
ok('ssSigilAnnounce carries the onAll seam', await ev(`ssSigilAnnounce.length === 3`));
const i18n = await evj(`JSON.stringify(Object.keys(SS_STR).map((l) => [l,
  /%1/.test(SS_STR[l].skiesNear || '') && /%2/.test(SS_STR[l].skiesNear || '')]))`);
ok('skiesNear exists in all five languages, %1 and %2 both', i18n.length === 5 && i18n.every(([, g]) => g),
  i18n.filter(([, g]) => !g).map(([l]) => l).join(',') || '5');

/* ================= 2. the moment — a real scry crosses ================= */
console.log('\n— THE MOMENT: A REAL SCRY CROSSES ITS THRESHOLD —');
await ev(`SS.prof.sig.c.scry = 19; SS.save(); 'ok'`);
let pr = await evj(`JSON.stringify(ssSigilProgress(SS_SIG_BY.comet))`);
ok('the meter before: 19 / 20, not done', pr.have === 19 && pr.need === 20 && pr.done === false, JSON.stringify(pr));
ok('COMET TRAIL still asleep, the pool still 12', await ev(`!ssSigilUnlocked('comet') && ssSigilOpen().length === 12`));
ok('…and the sleeping sort already leads with it (19/20 tops every zero)',
  await ev(`ssSigilAsleep()[0].id === 'comet'`), await ev(`ssSigilAsleep()[0].id`));
await ev(`${B}.run.sigils = []; ${B}.beast.hpNow = 99999; ${B}.beast.count = 5; ${B}.updateBars(); 'ok'`);
const n0 = await ev(`SS.prof.sig.c.scry | 0`);
let tapped = false;
for (let t = 0; t < 5 && !tapped; t++) { await tap(`${B}.scryB`); await sleep(200); tapped = await ev(`(SS.prof.sig.c.scry | 0) > ${n0}`); }
ok('the twentieth SCRY — a real tap', tapped);
ok('the rite rises right there, mid-run, naming COMET TRAIL', await until(`${RITE} === 'comet'`, 15000, 200), await ev(RITE));
ok('the board is held: state \'rite\', never \'pick\' under the veil', await ev(`${B}.state === 'rite'`), await ev(`${B}.state`));
ok('one rite on screen, never a stack', await ev(`${RITES} === 1`));
ok('the queue was spent as it showed — pend empty, the stamp down',
  await ev(`SS.prof.sig.pend.length === 0 && !!SS.prof.sig.u.comet`));
ok('a tap lets it out and the turn comes back', (await dismissRite()) && await until(`${B}.state === 'pick'`, 12000, 200), await ev(`${B}.state`));
pr = await evj(`JSON.stringify(ssSigilProgress(SS_SIG_BY.comet))`);
ok('the meter after: done', pr.done === true && pr.have === 20, JSON.stringify(pr));
ok('the sky grew: 13 open', await ev(`ssSigilOpen().length === 13`));
ok('draw-eligible in the next roll: holding all-but-comet, the roll returns exactly it',
  (await evj(`(() => { ${B}.run.sigils = ssSigilOpen().map((s) => s.id).filter((i) => i !== 'comet');
    return JSON.stringify(${B}.rollSigilOpts().map((s) => s.id)) })()`)).join() === 'comet');
// the run ends — the end screen must NOT say it again (pend is already spent)
await ev(`${B}.state = 'anim'; ${B}.run.words = 5; ${B}.run.fightIdx = 1; ${B}.endRun(false); 'ok'`);
ok('the run ends (a loss)', await until(`${B}.state === 'end'`, 20000, 250));
let repeat = false;
for (let i = 0; i < 15; i++) { await sleep(300); if (await ev(`${RITES} > 0`)) { repeat = true; break; } }
ok('endRun does NOT announce it again — the no-double law', !repeat && await ev(`SS.prof.sig.pend.length === 0`));

/* ================= 3. the fight's end wakes — before the offer ================= */
console.log('\n— THE FIGHT\'S END WAKES, AND THE OFFER CAN HOLD IT —');
ok('fresh boot', await boot('quick=1'));
ok('quick run at pick', await until(PICK, 60000));
await ev(`SS.prof.beasts = 29; SS.save();
  ${B}.run.sigils = ssSigilOpen().map((s) => s.id); 'ok'`);
ok('WHISPERING TOME one fell short, every open sigil already held',
  await ev(`!ssSigilUnlocked('tome') && ${B}.run.sigils.length === 12 && ${B}.sigPlan.has(0)`));
await ev(`(() => { const b = ${B}; b.beast.hpNow = -1; b.dying = true; b.beastDeath(); return 'ok' })()`);
// the rite must arrive AFTER the shatter beat and BEFORE the pick opens
let sawPickFirst = false, sawRite = false;
for (let i = 0; i < 60; i++) {
  const s = await evj(`JSON.stringify({ r: ${RITE}, cards: ${B}.overlayC.list.filter((o) => o.getData && o.getData('sigilCard')).length, st: ${B}.state })`);
  if (s.r === 'tome') { sawRite = true; if (s.cards > 0 || s.st === 'sigil') sawPickFirst = true; break; }
  if (s.st === 'sigil' || s.cards > 0) { sawPickFirst = true; break; }
  await sleep(200);
}
ok('the thirtieth fell wakes the TOME at the fight\'s end', sawRite, sawRite ? 'rite up' : 'never rose');
ok('…BEFORE the offer opens (no card under the rite)', !sawPickFirst);
ok('one rite, held', await ev(`${RITES} === 1 && ${B}.state === 'anim'`));
await dismissRite();
ok('the rite closes into the offer this very win pays', await until(`${B}.state === 'sigil'`, 20000, 250), await ev(`${B}.state`));
const offer = await evj(`(() => {
  const cards = []; const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('sigilCard')) cards.push(o); if (o.list) scan(o.list); });
  scan(${B}.overlayC.list); return JSON.stringify({ n: cards.length, roll: ${B}.rollSigilOpts().map((s) => s.id) }) })()`);
ok('and the offer holds exactly the sigil that just woke', offer.n === 1 && offer.roll.join() === 'tome', JSON.stringify(offer));
for (let t = 0; t < 6; t++) {
  await tap(`${B}.overlayC.list.find((o) => o.getData && o.getData('sigilCard'))`);
  await sleep(450);
  if (await ev(`${B}.state !== 'sigil'`)) break;
}
ok('a real tap takes it — the woken sigil rides the run', await ev(`${B}.run.sigils.includes('tome')`));
ok('the next fight deals', await until(PICK, 25000));
ok('nothing left pending, nothing repeated', await ev(`SS.prof.sig.pend.length === 0 && ${RITES} === 0`));

/* ================= 4. never mid-animation, and two queue ================= */
console.log('\n— NEVER MID-ANIMATION · TWO DISCOVERIES QUEUE —');
ok('fresh boot', await boot('quick=1'));
ok('quick run at pick', await until(PICK, 60000));
await ev(`SS.prof.sig.c.frg = 25; SS.save(); ${B}.run.sigils = []; ${B}.beast.hpNow = 99999; ${B}.beast.count = 9; ${B}.updateBars(); 'ok'`);
// the board must have LANDED before a tile is tapped — a falling tile's
// bounds are somewhere else entirely (comet-check's settle law)
await until(`${B}.board.every((s, i) => !s || Math.abs(s.c.y - ${B}.slotPos(i).y) < 0.5)`, 8000, 100);
// capped at SEVEN letters: this cast must cross the forge counter alone —
// the board's longest can be a real 8-letter word, and casting it would
// also wake NOVA (w8 n1), a fourth waking the tallies below never budgeted
const w = await findWord([], [], 2, 7);
ok('a real word to cast', !!w, JSON.stringify(w));
for (const i of w) {
  for (let t = 0; t < 4; t++) { await tap(`${B}.board[${i}].c`); await sleep(140); if (await ev(`${B}.sel.includes(${i})`)) break; }
}
ok('the taps built the word', await ev(`${B}.sel.length === ${w.length}`), await ev(`JSON.stringify(${B}.sel)`));
for (let t = 0; t < 4; t++) { await tap(`${B}.castB`); await sleep(150); if (await ev(`${B}.state !== 'pick'`)) break; }
// sample the whole resolution: the rite must never share a frame with 'anim'
// (this boot fells nothing, so the only legal rite state here is 'rite')
let animSeen = 0, animRite = 0, riteUp = false;
for (let i = 0; i < 80; i++) {
  const s = await evj(`JSON.stringify({ st: ${B}.state, r: ${RITES} })`);
  if (s.st === 'anim') { animSeen++; if (s.r > 0) animRite++; }
  if (s.r > 0 && s.st === 'rite') { riteUp = true; break; }
  await sleep(120);
}
ok('the cast animation was sampled', animSeen >= 1, animSeen + ' anim frames');
ok('no rite ever rose mid-animation', animRite === 0);
ok('GILDED DAWN wakes only when the cast has resolved', riteUp && await ev(`${RITE} === 'gilded'`), await ev(RITE));
await dismissRite();
await until(`${B}.state === 'pick'`, 12000, 200);
// two crossed at once — the queue, one rite at a time, in roster order
await ev(`SS.prof.sig.c.scry = 20; SS.prof.sig.c.w6 = 8; SS.save(); ${B}.beast.count = 5; 'ok'`);
const n1 = await ev(`SS.prof.sig.c.scry | 0`);
for (let t = 0; t < 5; t++) { await tap(`${B}.scryB`); await sleep(200); if (await ev(`(SS.prof.sig.c.scry | 0) > ${n1}`)) break; }
ok('COMET TRAIL speaks first (the roster\'s order)', await until(`${RITE} === 'comet'`, 15000, 200), await ev(RITE));
ok('…alone', await ev(`${RITES} === 1`));
await dismissRite();
ok('STARRY LONGBOW follows, never stacked', await until(`${RITE} === 'longbow'`, 15000, 200) && await ev(`${RITES} === 1`), await ev(RITE));
await dismissRite();
ok('the queue empties back into play', await until(`${B}.state === 'pick'`, 12000, 200) && await ev(`SS.prof.sig.pend.length === 0`));
ok('three woke this run — all stamped, all open', await ev(`!!SS.prof.sig.u.gilded && !!SS.prof.sig.u.comet && !!SS.prof.sig.u.longbow && ssSigilOpen().length === 15`),
  await ev(`JSON.stringify({ n: ssSigilOpen().length, u: Object.keys(SS.prof.sig.u) })`));
const achP = await evj(`(() => { const k = 'first-blood'; delete SS.prof.ach[k];
  SS.award(k, game); const once = Object.keys(SS.prof.ach).length;
  SS.award(k, game); const twice = Object.keys(SS.prof.ach).length;
  return JSON.stringify({ once, twice, has: !!SS.prof.ach[k] }) })()`);
ok('achievements untouched by the waking — award still fires once', achP.has && achP.once === achP.twice, JSON.stringify(achP));

/* ================= 5. the gallery: sort, meters, the door ================= */
console.log('\n— THE GALLERY: CLOSEST FIRST · THE DOOR SAYS HOW CLOSE —');
ok('meadow boot', await boot(''));
ok('meadow at rest', await until(HOME_REST, 45000));
ok('a bare fresh profile still greets the old door form (m = 0)', await ev(`ssSigilNearCount() === 0`));
await ev(`Object.assign(SS.prof.sig.c, { frg: 24, scry: 15, hit: 40, w6: 2 }); SS.save(); 'ok'`);
ok('two now count as nearly there (96% and 75%; 50% does not)', await ev(`ssSigilNearCount() === 2`), String(await ev(`ssSigilNearCount()`)));
const ORDER = await evj(`JSON.stringify(ssSigilAsleep().map((s) => s.id))`);
ok('the sleeping sort: closest first, ties in the roster\'s own order',
  ORDER.join() === 'gilded,comet,eclipse,longbow,forge,blood,tome,storm,echo,nova,verse,meteor', ORDER.join(' '));
ok('the profile opens', await tapUntil(195, 26, `game.scene.isActive('profile')`));
const door1 = await ev(`(() => { const t = game.scene.getScene('profile').children.list
  .find(o => o.type === 'Text' && o.text.indexOf(SS_T('skiesTitle')) >= 0); return t ? t.text : 'no door' })()`);
ok('the door says how close: "12 awake · 2 nearly there"',
  door1.indexOf(await ev(`SS_T('skiesNear', 12, 2)`)) >= 0 && door1.indexOf('12 / 24') < 0, door1);
ok('…and the longer line fits its button (scaled, never clipped)', await ev(`(() => { const t = game.scene.getScene('profile').children.list
  .find(o => o.type === 'Text' && o.text.indexOf(SS_T('skiesTitle')) >= 0); const l = ssLayout(t.scene);
  return t.scaleX <= 1.001 && t.width * t.scaleX <= l.u(218) })()`));
ok('the door opens the gallery', await tapUntil(0, 412, `!!game.scene.getScene('profile').skiesP`));
await sleep(900);
const drawn = await evj(`(() => { const p = game.scene.getScene('profile').skiesP; if (!p) return '[]';
  const rows = []; const w = (ls) => ls.forEach((o) => { if (o.getData && o.getData('sigilHow')) rows.push({ id: o.getData('sigilHow'), y: o.y }); if (o.list) w(o.list); });
  w(p.c.list); rows.sort((a, b) => a.y - b.y); return JSON.stringify(rows.map((r) => r.id)) })()`);
ok('the drawn rows keep that order — the chased bar tops the list', drawn.join() === ORDER.join(), drawn.join(' '));
ok('each row still reads its own true fraction', await ev(`(() => { const p = game.scene.getScene('profile').skiesP;
  const txt = []; const w = (ls) => ls.forEach((o) => { if (o.type === 'Text') txt.push(o.text); if (o.list) w(o.list); });
  w(p.c.list); return txt.includes('24 / 25') && txt.includes('15 / 20') && txt.includes('40 / 80') && txt.includes('2 / 8') })()`));
// wake one (the forge's own settle path) and read the surfaces again
await tapUntil(0, 60, `!game.scene.getScene('profile').skiesP`);
await ev(`SS.prof.sig.c.scry = 20; SS.save(); ssSigilCheck(); SS.prof.sig.pend = []; SS.save(); 'ok'`);
await ev(`game.scene.getScene('profile').scene.restart(); 'ok'`);
await sleep(1200);
const door2 = await ev(`(() => { const t = game.scene.getScene('profile').children.list
  .find(o => o.type === 'Text' && o.text.indexOf(SS_T('skiesTitle')) >= 0); return t ? t.text : 'no door' })()`);
ok('a waking re-counts the door: "13 awake · 1 nearly there"',
  door2.indexOf(await ev(`SS_T('skiesNear', 13, 1)`)) >= 0, door2);
ok('…and the woken sigil left the sleeping sort', await ev(`ssSigilAsleep().every((s) => s.id !== 'comet') && ssSigilAsleep()[0].id === 'gilded'`));
await ev(`SS.prof.sig.c = {}; SS.save(); game.scene.getScene('profile').scene.restart(); 'ok'`);
await sleep(1200);
const door3 = await ev(`(() => { const t = game.scene.getScene('profile').children.list
  .find(o => o.type === 'Text' && o.text.indexOf(SS_T('skiesTitle')) >= 0); return t ? t.text : 'no door' })()`);
ok('with nothing near, the plain fraction returns: 13 / 24', door3.indexOf('13 / 24') >= 0, door3);

/* ================= 6. the door speaks Spanish ================= */
console.log('\n— EN ESPAÑOL —');
ok('es boot', await boot('lang=es', `localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000,
  sig: { u: {}, c: { frg: 24 }, pend: [], gf: 0 } }));`));
ok('meadow at rest', await until(HOME_REST, 45000));
ok('the profile opens', await tapUntil(195, 26, `game.scene.isActive('profile')`));
const doorEs = await ev(`(() => { const t = game.scene.getScene('profile').children.list
  .find(o => o.type === 'Text' && o.text.indexOf(SS_T('skiesTitle')) >= 0); return t ? t.text : 'no door' })()`);
ok('the door counts in Spanish: "12 despiertos · 1 a punto"',
  doorEs.indexOf('12 despiertos') >= 0 && doorEs.indexOf('1 a punto') >= 0, doorEs);

// ---------------------------------------------------------------- sweep
await ev(`(() => { localStorage.removeItem('beta3.profile'); return 'swept' })()`);
ok('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
console.log(`\n${pass} passed, ${fail} failed`);
ws.close();
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
