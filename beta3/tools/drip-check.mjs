// DRIP-CHECK — the sigil drip, both halves (v0.43.0).
// fps-check.mjs pins the three LAWS that must never break (the pool never
// starves, nobody who already plays loses a sigil, and no sigil is ever
// listed asleep and awake at once); this walks the whole mechanic — the
// twelve, the conditions, the counters under real play, the unlock at the
// run's end, the FORGE CEREMONY and its queue, the SLEEPING GALLERY and its
// bars, persistence, and versus's immunity.
// Run from beta3/ with the folder served on :8899 and a headless Chrome on
// :9445 (its own port, so this can run beside fps-check's 9333 and
// streak-check's 9444; --disable-gpu is fine — nothing here forces WebGL):
//
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --no-sandbox --disable-gpu --mute-audio \
//     --remote-debugging-port=9445 --user-data-dir=/tmp/cdp-drip \
//     --window-size=390,844 --force-device-scale-factor=3 about:blank &
//   node tools/drip-check.mjs
//
// ⚠ Every wait POLLS. The software renderer runs the scene clock anywhere
// from 12 to 60fps, and a fixed sleep reads as a bug that isn't there.
const BASE = 'http://localhost:8899/index.html';
const PORT = 9445;
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') {
    const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200);
    if (!/WebGL context/.test(t)) errs.push(t);   // --disable-gpu says this on every boot; not news
  }
};
await new Promise(r => ws.onopen = r);
const send = (m, p) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const ev = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r?.result?.value;
};
const evj = async (e) => JSON.parse(await ev(e));
const nav = async (u, w) => { await send('Page.navigate', { url: u }); await sleep(w); };
const until = async (e, cap = 45000) => {
  for (let i = 0; i < cap / 500; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(500); }
  return false;
};
const HOME_REST = `!!window.game && game.scene.isActive('home')
  && !game.scene.getScene('home').introPlaying && !!game.scene.getScene('home').lanternB`;
// a fresh profile, from nothing — the only way into the drip
const wipe = async () => { await ev(`(()=>{ localStorage.removeItem('beta3.profile'); localStorage.removeItem('beta3.campaign'); return 'wiped' })()`); };
/* THE CEREMONY, found by the id its container stamps on itself. `RITE` is
   which discovery is on screen right now, `RITES` how many are — and the
   second number is a law, not a curiosity: two unlocks in one run must queue,
   never stack. */
const RITE = `(() => { const o = game.scene.getScenes(true).flatMap(s => s.children.list)
  .find(x => x.getData && x.getData('sigilRite')); return o ? o.getData('sigilRite') : 'none' })()`;
const RITES = `game.scene.getScenes(true).flatMap(s => s.children.list).filter(x => x.getData && x.getData('sigilRite')).length`;
// every string the ceremony is currently printing, flattened
const RITE_TEXT = `(() => { const c = game.scene.getScenes(true).flatMap(s => s.children.list)
    .find(x => x.getData && x.getData('sigilRite'));
  if (!c) return '[]';
  const out = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text') out.push(o.text); if (o.list) w(o.list); });
  w(c.list); return JSON.stringify(out) })()`;
/* A press+release at a DESIGN coordinate, straight on the canvas. The
   ceremony's veil covers the screen and every child of it is drawn in SCREEN
   space (scrollFactor 0), so the camera scroll that a world-object tap has to
   subtract must NOT be subtracted here — on the meadow the camera sits ~4200px
   down the sky and the tap would land in the dirt.
   ⚠ A tap on a JUST-BUILT surface is dropped: Phaser registers new
   interactive objects on the NEXT update, and the software renderer runs the
   loop as slowly as 12fps. Every caller re-taps until the effect shows. */
const tapD = async (dx, dy) => {
  const p = JSON.parse(await ev(`(() => { const s = game.scene.getScenes(true)[0], l = ssLayout(s);
    const b = game.canvas.getBoundingClientRect();
    return JSON.stringify({ x: b.left + l.x(${dx}) / game.canvas.width * b.width,
                            y: b.top + l.y(${dy}) / game.canvas.height * b.height }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
// tap until `done` reads true (or we run out of patience)
const tapUntil = async (dx, dy, done, tries = 10) => {
  for (let i = 0; i < tries; i++) { await tapD(dx, dy); await sleep(450); if (await ev(done) === true) return true; }
  return false;
};
// drag the gallery's window up, which is how its rows scroll
const dragUp = async (px = 260) => {
  const b = JSON.parse(await ev(`(() => { const r = game.canvas.getBoundingClientRect();
    return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height * 0.62, h: r.height }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  for (let i = 1; i <= 8; i++) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x, y: b.y - px * i / 8, buttons: 1 });
    await sleep(40);
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y - px, button: 'left', clickCount: 1 });
};
/* THE GALLERY, read back as data. Held rows carry a real sigil id; sleeping
   rows carry a `?` in an empty socket and a bar. Both are read off the panel's
   own row container so the NO-DOUBLE-LISTING law can be checked on what is
   actually drawn, not on what the model says should be. */
const GALLERY = `(() => { const s = game.scene.getScenes(true).find(x => x.skiesP || x.inspectP || x.endInspectP);
  const p = s && (s.skiesP || s.endInspectP || s.inspectP);
  if (!p) return 'none';
  const txt = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text') txt.push(o.text); if (o.list) w(o.list); });
  w(p.c.list);
  const held = SS_SIGILS.filter(g => txt.includes(SS_SIG(g).desc)).map(g => g.id);
  const asleep = SS_SIGILS.filter(g => g.lock && txt.includes(SS_SIG_HOW(g))).map(g => g.id);
  return JSON.stringify({ head: txt.includes('—  ' + SS_T('slpHead') + '  —'), held, asleep,
    bars: txt.filter(t => t.indexOf(' / ') >= 0), both: held.filter(i => asleep.includes(i)) }) })()`;

console.log('\nDRIP-CHECK · the sigil drip, both halves\n');

// ================================================================
// 1. THE TWELVE — who starts in the pool, and who is locked
// ================================================================
console.log('1. the starting pool');
await nav(BASE + '?fps=0', 12000);
await wipe();
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands up on a wiped profile', await until(HOME_REST));
const pool = await evj(`JSON.stringify({
  build: BUILD,
  open: ssSigilOpen().map(s => s.id),
  tiers: [0,1,2].map(r => ssSigilOpen().filter(s => (s.rarity|0) === r).length),
  lockedTiers: [0,1,2].map(r => SS_SIGILS.filter(s => s.lock && (s.rarity|0) === r).length),
  total: SS_SIGILS.length,
  locks: SS_SIGILS.filter(s => s.lock).map(s => [s.id, s.lock.s, s.lock.n]),
  stats: SS_SIGILS.filter(s => s.lock).map(s => ssSigilStat(s.lock.s)),
})`);
ok('exactly HALF the sky starts open', pool.open.length === 12 && pool.total === 24, pool.open.join(' '));
ok('every tier keeps unlocked members (9 basic · 2 rare · 1 legendary)',
  pool.tiers.join('/') === '9/2/1', 'open ' + pool.tiers.join('/') + ' · locked ' + pool.lockedTiers.join('/'));
ok('every locked sigil names a stat the game can read, and a target above zero',
  pool.locks.length === 12 && pool.locks.every(([, s, n]) => n > 0 && ['w6','w7','w8','frg','scry','ovk','hit','brnk','word','fell','wins','big'].includes(s))
  && pool.stats.every((v) => v === 0),
  pool.locks.map(([i, s, n]) => i + '=' + s + ':' + n).join(' '));
ok('the twelve conditions are twelve DIFFERENT stats (no two sigils chase the same number)',
  new Set(pool.locks.map(([, s]) => s)).size === 12);
const how = await evj(`JSON.stringify(SS_SIGILS.filter(s => s.lock).map(s => SS_SIG_HOW(s)))`);
ok('every condition has an English sentence with its number in it',
  how.length === 12 && how.every((t, i) => t.length > 8 && !/%1/.test(t)
    && (pool.locks[i][2] === 1 || t.includes(String(pool.locks[i][2])))),
  JSON.stringify(how[0]));

// ================================================================
// 2. THE POOL NEVER STARVES — rollSigilOpts against the thinnest pool
// ================================================================
console.log('\n2. the pick board, mid-drip');
await nav(BASE + '?fps=0&daily=1', 22000);
ok('a daily battle stands up to roll against',
  await until(`(() => { const b = game.scene.getScene('battle');
    return game.scene.isActive('battle') && !!b && !!b.run })()`));
/* Nineteen picks is a whole campaign. Each roll is judged against what the
   run may still be offered: a FULL board of three whenever three unlocked
   sigils remain unheld, and exactly what is left after that — never a locked
   card, never a repeat, never an undefined, and never a throw when the rare
   or legendary tier has gone dry under it. */
const roll = async (unlockIds) => evj(`(() => {
  const b = game.scene.getScene('battle');
  const keep = JSON.stringify(SS.prof.sig), keepRun = b.run.sigils.slice();
  SS.prof.sig.u = {}; ${JSON.stringify(unlockIds || [])}.forEach(i => { SS.prof.sig.u[i] = 1 });
  b.run.sigils = [];
  const openN = ssSigilOpen().length;
  const out = { openN, rolls: [], locked: 0, dupe: 0, bad: 0, short: [], threw: null };
  try {
    for (let k = 0; k < 19; k++) {
      const left = openN - b.run.sigils.length;
      const o = b.rollSigilOpts();
      if (o.some(s => !s || !s.id)) out.bad++;
      if (o.some(s => s && s.lock && !SS.prof.sig.u[s.id])) out.locked++;
      if (new Set(o.map(s => s && s.id)).size !== o.length) out.dupe++;
      if (o.some(s => b.run.sigils.includes(s.id))) out.dupe++;
      if (o.length !== Math.min(3, Math.max(0, left))) out.short.push(k + ':' + o.length + '/' + left);
      out.rolls.push(o.length);
      if (o.length) b.run.sigils.push(o[Math.floor(o.length / 2)].id);
    }
  } catch (e) { out.threw = String(e); }
  out.held = b.run.sigils.length;
  SS.prof.sig = JSON.parse(keep); b.run.sigils = keepRun;
  return JSON.stringify(out);
})()`);
const thin = await roll([]);
ok('19 campaign picks off the STARTING twelve: never a locked card, never a repeat, never a throw',
  thin.openN === 12 && !thin.locked && !thin.dupe && !thin.bad && !thin.threw,
  'locked ' + thin.locked + ' dupe ' + thin.dupe + ' bad ' + thin.bad + ' ' + (thin.threw || ''));
ok('a FULL board of three for every pick the pool can still fill, and exactly what is left after',
  !thin.short.length && thin.rolls.slice(0, 10).every(n => n === 3),
  'boards ' + thin.rolls.join(',') + (thin.short.length ? ' short@' + thin.short.join(' ') : ''));
// the tier-fall under the thinnest possible exotic tiers: one legendary and
// two rares, both of which a run will take early and leave dry behind it
const mid = await roll(['longbow', 'gilded', 'comet', 'forge', 'blood', 'tome']);
const all = await roll(['longbow', 'gilded', 'comet', 'forge', 'blood', 'tome', 'storm', 'echo', 'eclipse', 'nova', 'verse', 'meteor']);
ok('the same holds mid-drip (18 open) and at the full sky (24 open)',
  mid.openN === 18 && all.openN === 24
  && !mid.locked && !mid.dupe && !mid.bad && !mid.threw && !mid.short.length
  && !all.locked && !all.dupe && !all.bad && !all.threw && !all.short.length,
  'mid ' + mid.rolls.join(',') + ' · full ' + all.rolls.join(','));
// the tier-fall itself: a dry legendary tier must fall into rare, a dry rare
// into basic, and a wholly dry pool must return nothing rather than undefined
const fall = await evj(`(() => {
  const b = game.scene.getScene('battle');
  const keep = JSON.stringify(SS.prof.sig), keepRun = b.run.sigils.slice(), keepCh = b.sigilChances;
  b.sigilChances = () => ({ rare: 0, leg: 1 });          // every roll asks for a legendary
  SS.prof.sig.u = {};
  b.run.sigils = ['feather'];                            // …and the only open one is already held
  const legDry = b.rollSigilOpts().map(s => s.rarity | 0);
  b.run.sigils = ['feather', 'roots', 'ward'];           // rare tier dry too
  const rareDry = b.rollSigilOpts().map(s => s.rarity | 0);
  b.run.sigils = ssSigilOpen().map(s => s.id);           // everything held
  const allDry = b.rollSigilOpts();
  b.sigilChances = keepCh; SS.prof.sig = JSON.parse(keep); b.run.sigils = keepRun;
  return JSON.stringify({ legDry, rareDry, allDry: allDry.length });
})()`);
/* 1,1,0 is the whole tier-fall in one line: three legendary rolls against a
   pool holding ONE legendary (already taken) and TWO rares — the first two
   cards fall one tier into the rares, and the third, with the rares now spent
   by this very board, falls the second tier down into the basics. */
ok('a dry legendary tier falls to rare, a dry rare falls to basic, a dry pool returns nothing',
  fall.legDry.join('') === '110'
  && fall.rareDry.length === 3 && fall.rareDry.every(r => r === 0)
  && fall.allDry === 0,
  'leg→' + fall.legDry.join('') + ' rare→' + fall.rareDry.join('') + ' dry=' + fall.allDry);
ok('a board with nothing left rides on rather than hanging the run',
  await ev(`(() => { const b = game.scene.getScene('battle');
    const keep = b.run.sigils.slice(); b.run.sigils = ssSigilOpen().map(s => s.id);
    const before = b.state; b.showSigilPick(); const after = b.state;
    b.run.sigils = keep; return before !== 'sigil' || after !== 'sigil' })()`) === true);

// ================================================================
// 3. VERSUS IS UNTOUCHED
// ================================================================
console.log('\n3. versus');
const vsrc = await (await fetch('http://localhost:8899/versus.js')).text();
const vline = (vsrc.match(/const avail = SS_SIGILS[^\n]*/) || [''])[0];
ok('the versus picker still draws from SS_SIGILS through its own VS_OK allowlist',
  /VS_OK/.test(vline) && /SS_SIGILS/.test(vline) && !/ssSigilOpen|ssSigilUnlocked/.test(vsrc),
  vline.trim().slice(0, 96));
ok('and its allowlist offers sigils that are LOCKED in solo — proof the locks never reached it',
  /'forge'/.test(vsrc) && /'blood'/.test(vsrc) && /'longbow'/.test(vsrc)
  && await ev(`['forge','blood','longbow'].every(i => !ssSigilUnlocked(i))`) === true);

// ================================================================
// 4. THE COUNTERS, UNDER REAL PLAY
// ================================================================
console.log('\n4. the counters, under real play');
await wipe();
await nav(BASE + '?fps=0&demo=1', 20000);
// the solver plays a whole quick run by itself: words, scries, strikes, forges
const played = await until(`(() => { const c = (SS.prof.sig && SS.prof.sig.c) || {};
  return SS.prof.words > 6 && (c.frg | 0) > 0 && (c.ovk | 0) > 0 })()`, 180000);
const ctr = await evj(`JSON.stringify({ c: SS.prof.sig.c, words: SS.prof.words, beasts: SS.prof.beasts })`);
ok('a real demo run feeds the drip: long words, forged tiles and spilt overkill are counted',
  played && (ctr.c.frg | 0) > 0 && (ctr.c.ovk | 0) > 0 && (ctr.c.w6 | 0) > 0,
  JSON.stringify(ctr.c) + ' · ' + ctr.words + ' words');
ok('the long-word counters are letters, not tiles, and nest correctly',
  (ctr.c.w6 | 0) >= (ctr.c.w7 | 0) && (ctr.c.w7 | 0) >= (ctr.c.w8 | 0)
  && (ctr.c.frg | 0) >= (ctr.c.w6 | 0),
  'frg ' + (ctr.c.frg | 0) + ' ≥ w6 ' + (ctr.c.w6 | 0) + ' ≥ w7 ' + (ctr.c.w7 | 0) + ' ≥ w8 ' + (ctr.c.w8 | 0));
/* The solver never gets hit — it fells everything before the timer runs out —
   so the two counters a demo cannot reach are driven through their REAL code
   paths instead: the beast's own strike, and a fell on the brink. */
await nav(BASE + '?fps=0&daily=1', 22000);
ok('a daily battle stands up to be struck by',
  await until(`(() => { const b = game.scene.getScene('battle');
    return game.scene.isActive('battle') && !!b && !!b.beast && b.state === 'pick' })()`));
const before4 = await evj(`(() => { const b = game.scene.getScene('battle');
  SS.prof.sig.c = {}; SS.save();
  b.run.hpMax = 900; b.run.hp = 900;              // survive it, so the run does not end
  b.shieldUsed = true; b.beast.count = 1;
  b.tickEnemy(() => {});                           // the beast's own strike, for real
  return JSON.stringify(SS.prof.sig.c) })()`);
ok('a real beast strike is weathered and counted',
  await until(`(SS.prof.sig.c.hit | 0) === 1`, 30000),
  'before ' + JSON.stringify(before4) + ' after ' + await ev(`JSON.stringify(SS.prof.sig.c)`));
const fell = await evj(`(() => { const b = game.scene.getScene('battle');
  b.run.hp = 9; b.beast.hpNow = -64;               // felled on the brink, 64 wasted
  b.beastDeath();
  return JSON.stringify({ c: SS.prof.sig.c, beasts: SS.prof.beasts }) })()`);
ok('a fell on the brink counts the brink AND the overkill it spilt',
  (fell.c.brnk | 0) === 1 && (fell.c.ovk | 0) === 64,
  JSON.stringify(fell.c));
// and every one of them SURVIVES — the whole mechanic is progress across runs
const snap = await evj(`(() => { SS.save(); return JSON.stringify(SS.prof.sig.c) })()`);
await nav(BASE + '?fps=0', 12000);
const kept = await evj(`JSON.stringify(SS.prof.sig.c)`);
ok('and no counter dies with the run: every one of them reloads exactly',
  JSON.stringify(kept) === JSON.stringify(snap), JSON.stringify(kept));

// ================================================================
// 5. THE UNLOCK — at the run's end, on a LOSS, and it sticks
// ================================================================
console.log('\n5. the unlock');
await wipe();
await nav(BASE + '?fps=0&daily=1', 22000);
ok('a daily battle stands up for the unlock', await until(`(() => { const b = game.scene.getScene('battle');
  return game.scene.isActive('battle') && !!b && !!b.run && !!b.board && b.board.length === 16 })()`));
const brink = await evj(`(() => {
  const b = game.scene.getScene('battle');
  SS.prof.sig.u = {}; SS.prof.sig.pend = [];
  SS.prof.sig.c.w6 = 7;                       // STARRY LONGBOW wants eight
  SS.save();
  const before = { open: ssSigilOpen().length, longbow: ssSigilUnlocked('longbow') };
  ssSigilBump('w6');                          // …the eighth, woven
  return JSON.stringify(before) })()`);
ok('one short of a condition, the sigil is still locked', brink.open === 12 && brink.longbow === false);
await ev(`(() => { const b = game.scene.getScene('battle');
  b.state = 'anim'; b.run.words = 9; b.run.longest = 'moonlight'; b.run.fightIdx = 2;
  b.endRun(false);                            // A LOSS. It counts exactly the same.
  return 'ended' })()`);
const after = await evj(`JSON.stringify({ open: ssSigilOpen().length, longbow: ssSigilUnlocked('longbow'),
  pend: SS.prof.sig.pend, stamp: !!SS.prof.sig.u.longbow })`);
ok('a LOSS that finished the condition unlocks it all the same',
  after.longbow === true && after.open === 13 && after.stamp === true,
  'open ' + after.open + ' pend ' + JSON.stringify(after.pend));
ok('the FORGE CEREMONY arrives at the run’s end, over the settled window',
  await until(`${RITE} === 'longbow'`, 40000), await ev(RITE));
const rite = JSON.parse(await ev(RITE_TEXT));
const sgHow = await ev(`SS_SIG_HOW(SS_SIG_BY.longbow)`);
const sgDesc = await ev(`SS_SIG(SS_SIG_BY.longbow).desc`);
const sgIcon = await ev(`SS_SIG_BY.longbow.icon`);
const rHead = await ev(`SS_T('unlHead')`), rSkies = await ev(`SS_T('unlSkies')`), rTap = await ev(`SS_T('unlTap')`);
ok('it wears the whole rite: the head, the glyph in its medallion, the effect, the condition, and the promise',
  rite.some(t => t.includes(rHead)) && rite.includes(sgIcon) && rite.includes(sgDesc)
  && rite.some(t => t.includes(sgHow)) && rite.includes(rSkies) && rite.includes(rTap),
  rite.map(t => t.slice(0, 22)).join(' | '));
ok('it is drawn in SCREEN space over everything else — a rite in world space on the meadow is drawn nowhere',
  await ev(`(() => { const c = game.scene.getScenes(true).flatMap(s => s.children.list)
    .find(x => x.getData && x.getData('sigilRite'));
    return c.depth === 680 && c.list.every(o => (o.scrollFactorY | 0) === 0) })()`) === true);
ok('the name is struck in the wordmark’s gold, not typed as text',
  await ev(`(() => { const c = game.scene.getScenes(true).flatMap(s => s.children.list)
    .find(x => x.getData && x.getData('sigilRite'));
    return c.list.some(o => o.type === 'Image' && /^gold@/.test(o.texture.key)) })()`) === true);
ok('ONE TAP dismisses it — it never traps the player on the end screen',
  await tapUntil(0, 146, `${RITE} === 'none'`), 'rite ' + await ev(RITE));
ok('saying it out loud spends the queue — nobody is told twice',
  await until(`SS.prof.sig.pend.length === 0`, 20000), JSON.stringify(await evj(`JSON.stringify(SS.prof.sig.pend)`)));
await nav(BASE + '?fps=0', 12000);
const persist = await evj(`JSON.stringify({ longbow: ssSigilUnlocked('longbow'), open: ssSigilOpen().length,
  inPool: ssSigilOpen().some(s => s.id === 'longbow') })`);
ok('the unlock survives a reload and the sigil has joined the pool',
  persist.longbow === true && persist.open === 13 && persist.inPool === true, JSON.stringify(persist));
ok('…and it can now be offered by a real roll',
  await ev(`(() => { const opens = ssSigilOpen().map(s => s.id); return opens.includes('longbow') })()`) === true);

// ================================================================
// 6. THE CEREMONY ON THE GRASS — the safety net, and the queue
// ================================================================
console.log('\n6. the ceremony on the grass');
await ev(`(() => { SS.prof.sig.u.nova = 1; SS.prof.sig.pend = ['nova']; SS.save(); return 'planted' })()`);
/* ⚠ the poll starts BEFORE the boot settles. The rite arrives about a second
   after the grass does; a harness that waits out a 12-second navigation and
   then looks may find it already gone and call a working feature broken. */
await nav(BASE + '?fps=0', 1500);
ok('a discovery that was never said out loud is held on still grass',
  await until(`(() => { try { return ${RITE} === 'nova' } catch (e) { return false } })()`, 60000));
/* The meadow is the reason every child of the rite carries scrollFactor 0:
   inside a Container it is the CHILD's scroll factor the camera consults, not
   the container's, and the meadow's camera can sit thousands of pixels down
   the sky world. Assert the factor, and assert the result — every piece of
   the rite inside the visible frame. */
ok('…in screen space, wholly inside the frame, over a meadow whose camera has climbed the sky',
  await ev(`(() => { const h = game.scene.getScene('home');
    const c = h.children.list.find(x => x.getData && x.getData('sigilRite'));
    if (!c) return false;
    const fixed = c.list.every(o => (o.scrollFactorY | 0) === 0);
    const inside = c.list.filter(o => o.type === 'Text').every(o => o.y > 0 && o.y < game.canvas.height);
    return fixed && inside })()`) === true,
  'camera scrollY ' + await ev(`String(Math.round(game.scene.getScene('home').cameras.main.scrollY || 0))`));
ok('the meadow is held while it plays — no run may begin under a ceremony',
  await ev(`game.scene.getScene('home').busy() === true`) === true);
ok('and the meadow spends the queue too', await until(`SS.prof.sig.pend.length === 0`, 20000));
ok('one tap lets the meadow back', await tapUntil(0, 146, `${RITE} === 'none'`));
ok('the meadow is standing normally underneath it', await until(HOME_REST));
ok('…and it is free again the moment the rite is gone', await until(`game.scene.getScene('home').busy() === false`, 15000));

/* TWO IN ONE RUN. A long word can finish two conditions at once, and the two
   ceremonies must arrive one after the other — never drawn on top of each
   other, and never one swallowing the other. */
await ev(`(() => { SS.prof.sig.u.nova = 1; SS.prof.sig.u.longbow = 1;
  SS.prof.sig.pend = ['nova', 'longbow']; SS.save();
  ssSigilAnnounce(game.scene.getScene('home'), ['nova', 'longbow']); return 'queued' })()`);
ok('two discoveries queue: the legendary is held first, alone',
  await until(`${RITE} === 'nova' && ${RITES} === 1`, 25000), 'on screen ' + await ev(RITES));
let stacked = 0;
for (let i = 0; i < 26; i++) { if (await ev(RITES) > 1) stacked++; await sleep(500); if (await ev(RITE) === 'longbow') break; }
ok('…then the second follows it', await until(`${RITE} === 'longbow'`, 25000), 'now ' + await ev(RITE));
ok('and NEVER two at once', stacked === 0, stacked + ' frame(s) with two rites up');
ok('the queue empties itself', await until(`SS.prof.sig.pend.length === 0`, 25000));
await until(`${RITE} === 'none'`, 25000);

// ================================================================
// 7. GRANDFATHERING — nobody who already plays loses anything
// ================================================================
console.log('\n7. grandfathering');
const gf = async (label, prof, expect) => {
  await ev(`localStorage.setItem('beta3.profile', ${JSON.stringify(JSON.stringify(prof))}); 'planted'`);
  await nav(BASE + '?fps=0', 11000);
  const r = await evj(`JSON.stringify({ open: ssSigilOpen().length, gf: SS.prof.sig.gf | 0,
    stored: JSON.parse(localStorage.getItem('beta3.profile')).sig ? 1 : 0 })`);
  ok(label, r.open === expect && r.stored === 1 && r.gf === (expect === 24 ? 1 : 0),
    'open ' + r.open + '/' + expect + ' gf=' + r.gf);
};
await gf('a profile with runs behind it wakes holding all 24', { runs: 4, words: 60 }, 24);
await gf('…so does one whose only trace is a daily score', { daily: { 20260101: 300 } }, 24);
await gf('…or a single achievement', { ach: { 'first-blood': 1 } }, 24);
await gf('…or a versus win, or a longest word', { vsWins: 1, longest: 'moonlight' }, 24);
await gf('…or a rating that ever moved', { rating: 1012 }, 24);
await gf('a genuinely EMPTY profile enters the drip with twelve', {}, 12);
await gf('and a zeroed-out profile is empty, not "played"', { runs: 0, wins: 0, words: 0, daily: {}, ach: {}, rating: 1000 }, 12);
// the decision is made ONCE and written down: wiping the stats afterwards
// must not take a grandfathered player's sigils away
await ev(`(() => { const p = JSON.parse(localStorage.getItem('beta3.profile'));
  localStorage.setItem('beta3.profile', JSON.stringify({ runs: 9, sig: undefined })); return 'x' })()`);
await nav(BASE + '?fps=0', 11000);
await ev(`(() => { SS.prof.runs = 0; SS.prof.words = 0; SS.prof.wins = 0; SS.save(); return 'zeroed' })()`);
await nav(BASE + '?fps=0', 11000);
ok('the grandfather decision is permanent — zeroing the stats later takes nothing back',
  await ev(`ssSigilOpen().length === 24 && (SS.prof.sig.gf | 0) === 1`) === true,
  await ev(`ssSigilOpen().length`) + ' open');

// ================================================================
// 8. TEN LANGUAGES
// ================================================================
console.log('\n8. the copy');
const i18n = await evj(`JSON.stringify({
  langs: Object.keys(SS_STR),
  head: Object.keys(SS_STR).filter(l => (SS_STR[l].unlHead || '').length > 2),
  full: Object.keys(SS_STR).filter(l => l === 'en'
    || SS_SIGILS.filter(s => s.lock).every(s => ((SS_STR[l].unl || {})[s.id] || '').length > 4)),
})`);
ok('all ten languages carry the notice header and all twelve conditions',
  i18n.langs.length === 10 && i18n.head.length === 10 && i18n.full.length === 10,
  i18n.langs.join(' '));
await nav(BASE + '?fps=0&lang=es', 11000);
const es = await evj(`JSON.stringify({ head: SS_T('unlHead'), how: SS_SIG_HOW(SS_SIG_BY.longbow) })`);
ok('a Spanish boot reads the condition in Spanish, number and all',
  /SIGILO/.test(es.head) && /seis letras/.test(es.how) && es.how.includes('8'), es.how);
await nav(BASE + '?fps=0&lang=en', 11000);

// ================================================================
// 9. THE SLEEPING GALLERY — the bars there is always one more of
// ================================================================
console.log('\n9. the sleeping gallery');
await wipe();
await nav(BASE + '?fps=0', 12000);
await until(HOME_REST);
// plant real, partial progress so the bars have honest fractions to draw
await ev(`(() => { Object.assign(SS.prof.sig.c, { scry: 5, w6: 2, frg: 19, w7: 1, ovk: 60, hit: 40, brnk: 1 });
  SS.prof.words = 100; SS.prof.beasts = 15; SS.prof.wins = 1; SS.prof.bigHit = 30; SS.save(); return 'planted' })()`);
await nav(BASE + '?fps=0', 12000);
await until(HOME_REST);
ok('the profile carries a door to the sky, and it reads how much of it is yours',
  await tapUntil(195, 26, `game.scene.isActive('profile')`)
  && await ev(`(() => { const t = game.scene.getScene('profile').children.list
      .find(o => o.type === 'Text' && o.text.indexOf(SS_T('skiesTitle')) >= 0);
    return !!t && t.text.indexOf('12 / 24') >= 0 })()`) === true,
  await ev(`(() => { const t = game.scene.getScene('profile').children.list
    .find(o => o.type === 'Text' && o.text.indexOf(SS_T('skiesTitle')) >= 0); return t ? t.text : 'no door' })()`));
ok('the door opens the gallery', await tapUntil(0, 398, `!!game.scene.getScene('profile').skiesP`));
await sleep(900);
for (let i = 0; i < 12; i++) await dragUp();     // all the way to the bottom
await sleep(600);
const gal = await evj(GALLERY);
ok('it holds the STILL SLEEPING section, and every locked sigil is in it',
  gal !== 'none' && gal.head === true && gal.asleep.length === 12,
  'asleep ' + gal.asleep.length + ' · held ' + gal.held.length);
ok('THE LAW: no sigil is ever listed asleep AND awake',
  gal.both.length === 0, gal.both.join(',') || 'none in both');
ok('the twelve you hold are all above it, in full dress',
  gal.held.length === 12 && await ev(`(() => { const p = game.scene.getScene('profile').skiesP;
    const txt = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text') txt.push(o.text); if (o.list) w(o.list); });
    w(p.c.list);
    return SS_SIGILS.filter(g => g.lock && !ssSigilUnlocked(g.id)).every(g => !txt.includes(SS_SIG(g).desc)) })()`) === true,
  gal.held.join(' '));
// the bars, read against the counters that feed them
const bars = await evj(`(() => { const out = {};
  for (const g of SS_SIGILS) if (g.lock && !ssSigilUnlocked(g.id)) {
    const pr = ssSigilProgress(g); out[g.id] = pr.have + ' / ' + pr.need;
  } return JSON.stringify(out) })()`);
const want = ['5 / 20', '2 / 8', '19 / 25', '1 / 5', '30 / 60', '15 / 30', '1 / 3', '60 / 120', '40 / 80', '0 / 1', '100 / 400', '1 / 3'];
ok('every bar reads the real counter behind it, capped at its target',
  JSON.stringify(Object.values(bars)) === JSON.stringify(want), Object.values(bars).join(' · '));
ok('…and every one of those fractions is drawn on its own row',
  want.every(w => gal.bars.includes(w)), gal.bars.join(' · '));
ok('a silhouette gives away the rarity dress and NOTHING else — no name, no glyph',
  await ev(`(() => { const p = game.scene.getScene('profile').skiesP;
    const txt = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text') txt.push(o.text); if (o.list) w(o.list); });
    w(p.c.list);
    const locked = SS_SIGILS.filter(g => g.lock && !ssSigilUnlocked(g.id));
    return locked.every(g => !txt.includes(SS_SIG(g).name) && !txt.includes(SS_SIG(g).desc) && !txt.includes(g.icon))
      && txt.filter(t => t === '?').length === locked.length })()`) === true);

/* THE MIGRATION. A sigil that has just been through its ceremony must be in
   the held list and out of the sleeping one the very next time the gallery is
   opened — this is the rule the whole surface lives or dies by. */
await tapUntil(0, 60, `!game.scene.getScene('profile').skiesP`);
await ev(`(() => { SS.prof.sig.c.scry = 20; SS.save(); ssSigilCheck(); SS.prof.sig.pend = []; SS.save(); return 'forged' })()`);
await tapUntil(0, 398, `!!game.scene.getScene('profile').skiesP`);
await sleep(900);
for (let i = 0; i < 12; i++) await dragUp();
await sleep(600);
const gal2 = await evj(GALLERY);
ok('after the forge, COMET TRAIL has moved from sleeping to held — and is in exactly one of them',
  gal2.held.includes('comet') && !gal2.asleep.includes('comet') && gal2.both.length === 0,
  'held ' + gal2.held.length + ' asleep ' + gal2.asleep.length);
ok('and the count above the list came down with it',
  gal2.asleep.length === 11 && await ev(`(() => { const p = game.scene.getScene('profile').skiesP;
    const txt = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text') txt.push(o.text); if (o.list) w(o.list); });
    w(p.c.list); return txt.includes(SS_T('slpSub', 11)) })()`) === true);
ok('…and the door itself re-counts the sky on the way out',
  await tapUntil(0, 60, `!game.scene.getScene('profile').skiesP`)
  && await ev(`(() => { const t = game.scene.getScene('profile').children.list
      .find(o => o.type === 'Text' && o.text.indexOf(SS_T('skiesTitle')) >= 0);
    return !!t && t.text.indexOf('13 / 24') >= 0 })()`) === true,
  await ev(`(() => { const t = game.scene.getScene('profile').children.list
    .find(o => o.type === 'Text' && o.text.indexOf(SS_T('skiesTitle')) >= 0); return t ? t.text : 'no door' })()`));

// the in-battle inspector carries the same section — the bar to chase is
// readable from inside the fight that is filling it
await ev(`(() => { localStorage.removeItem('beta3.campaign'); return 'x' })()`);
await nav(BASE + '?fps=0&daily=1', 20000);
await until(`(() => { const b = game.scene.getScene('battle'); return game.scene.isActive('battle') && !!b && !!b.run })()`);
await ev(`(() => { const b = game.scene.getScene('battle');
  b.run.sigils = ['quill', 'choir']; b.state = 'pick'; b.openInspect(); return 'opened' })()`);
await sleep(800);
const gal3 = await evj(GALLERY);
ok('the in-battle inspector shows the same sleeping list under what you hold',
  gal3 !== 'none' && gal3.head === true && gal3.asleep.length === 11 && gal3.both.length === 0,
  'held ' + gal3.held.join(' ') + ' · asleep ' + gal3.asleep.length);
ok('…and it still shows only the sigils this run actually holds above it',
  gal3.held.length === 2 && gal3.held.includes('quill') && gal3.held.includes('choir'), gal3.held.join(' '));

// ================================================================
// 10. THE WHOLE SKY — the gallery with nothing left asleep
// ================================================================
console.log('\n10. the whole sky');
await ev(`localStorage.setItem('beta3.profile', JSON.stringify({ runs: 5, words: 90 })); 'planted'`);
await nav(BASE + '?fps=0', 12000);
await until(HOME_REST);
await tapUntil(195, 26, `game.scene.isActive('profile')`);
await tapUntil(0, 398, `!!game.scene.getScene('profile').skiesP`);
await sleep(900);
const full = await evj(GALLERY);
ok('a grandfathered sky lists all 24 held and none asleep',
  full !== 'none' && full.held.length === 24 && full.asleep.length === 0 && full.both.length === 0,
  'held ' + full.held.length + ' asleep ' + full.asleep.length);
ok('and the section says so rather than standing empty',
  await ev(`(() => { const p = game.scene.getScene('profile').skiesP;
    const txt = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text') txt.push(o.text); if (o.list) w(o.list); });
    w(p.c.list); return txt.includes(SS_T('slpNone')) })()`) === true);

// ================================================================
// 11. THE COPY OF PART TWO — ten languages, again
// ================================================================
console.log('\n11. the copy of the ceremony and the gallery');
const i18n2 = await evj(`JSON.stringify(['unlHead','unlSkies','unlTap','slpHead','slpSub','slpSub1','slpNone','skiesTitle']
  .map(k => [k, Object.keys(SS_STR).filter(l => (SS_STR[l][k] || '').length > 1).length]))`);
ok('every new line of the ceremony and the gallery exists in all ten languages',
  i18n2.every(([, n]) => n === 10), i18n2.map(([k, n]) => k + ':' + n).join(' '));
ok('and the two plural forms of the sleeping count really differ',
  await ev(`Object.keys(SS_STR).every(l => SS_STR[l].slpSub !== SS_STR[l].slpSub1 && /%1/.test(SS_STR[l].slpSub))`) === true);
await nav(BASE + '?fps=0&lang=de', 12000);
const de = await evj(`JSON.stringify({ head: SS_T('unlHead'), skies: SS_T('unlSkies'), sleep: SS_T('slpHead'), door: SS_T('skiesTitle') })`);
ok('a German boot reads the whole rite in German',
  /SIGEL/.test(de.head) && /Himmel/.test(de.skies) && /SCHLAFEND/.test(de.sleep) && /HIMMEL/.test(de.door),
  [de.head, de.sleep, de.door].join(' · '));
await nav(BASE + '?fps=0&lang=en', 12000);

// ---------------------------------------------------------------- sweep
await ev(`(() => { localStorage.removeItem('beta3.profile'); return 'swept' })()`);
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (errs.length) { console.log('EXCEPTIONS:'); errs.slice(0, 6).forEach(e => console.log('  ' + e.split('\n')[0])); }
else console.log('zero page exceptions');
process.exit(fail || errs.length ? 1 : 0);
