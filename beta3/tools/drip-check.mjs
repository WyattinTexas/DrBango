// DRIP-CHECK — the sigil drip (v0.42.0, part 1: locks, conditions, discovery).
// fps-check.mjs pins the two LAWS that must never break (the pool never
// starves, and nobody who already plays loses a sigil); this walks the whole
// mechanic — the twelve, the conditions, the counters under real play, the
// unlock at the run's end, the notice, persistence, and versus's immunity.
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
// the unlock notice, found by its header wherever it is on the display list
const NOTICE = `(() => { let f = 0;
  const w = (ls) => ls.forEach(o => { if (o.type === 'Text' && o.text === SS_T('unlHead')) f++; if (o.list) w(o.list); });
  w(game.scene.getScenes(true).flatMap(s => s.children.list)); return f })()`;
// the notice's own container, read back in DESIGN units — the one number the
// lane law is about (nothing above 94, nothing below 262)
const LANE = `(() => { let c = null;
  const w = (ls) => ls.forEach(o => { if (o.list && o.list.some(k => k.type === 'Text' && k.text === SS_T('unlHead'))) c = o; else if (o.list) w(o.list); });
  w(game.scene.getScenes(true).flatMap(s => s.children.list));
  if (!c) return 'none';
  const l = ssLayout(game.scene.getScenes(true)[0]);
  return JSON.stringify({ y: Math.round((c.y - l.y(0)) / l.s), sf: c.scrollFactorY,
    h: Math.round(c.list.find(o => o.type === 'Image' && o.texture.key === 'endpanel').displayHeight / l.s) }) })()`;

console.log('\nDRIP-CHECK · the sigil drip, part 1\n');

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
ok('the notice arrives at the run’s end, over the settled window',
  await until(`${NOTICE} === 1`, 30000), await ev(NOTICE) + ' notice(s)');
const card = await evj(`(() => { const found = [];
  const w = (ls) => ls.forEach(o => { if (o.type === 'Text') found.push(o.text); if (o.list) w(o.list); });
  w(game.scene.getScenes(true).flatMap(s => s.children.list));
  const sg = SS_SIG_BY.longbow;
  return JSON.stringify({ head: found.includes(SS_T('unlHead')), glyph: found.includes(sg.icon),
    rarity: found.some(t => /RARE|LEGENDARY/.test(t)) || (sg.rarity | 0) === 0,
    desc: found.some(t => t === SS_SIG(sg).desc), how: found.some(t => t.includes(SS_SIG_HOW(sg))) }) })()`);
ok('and it carries the name-plate, the glyph, the effect and the condition that earned it',
  card.head && card.glyph && card.desc && card.how, JSON.stringify(card));
/* THE LANE. The notice must never be able to print over the achievement toast
   (y 52, 58 tall → it owns 23..81) — the two land together constantly, since
   a long word both earns LEXICON and finishes a drip condition. */
await until(`(() => { const r = ${LANE}; return r !== 'none' && JSON.parse(r).y === SS_SIG_TOAST_Y })()`, 25000);
const lane = await evj(LANE);
ok('the notice keeps its own lane, clear of the achievement toast above it',
  lane !== 'none' && lane.y === 178 && lane.y - lane.h / 2 > 81,
  'band ' + (lane.y - lane.h / 2) + '..' + (lane.y + lane.h / 2));
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
// 6. THE NOTICE ON THE GRASS — the safety net for an app closed early
// ================================================================
console.log('\n6. the notice on the grass');
await ev(`(() => { SS.prof.sig.u.nova = 1; SS.prof.sig.pend = ['nova']; SS.save(); return 'planted' })()`);
/* ⚠ the poll starts BEFORE the boot settles. The notice arrives about a
   second after the grass does and lives ~4s; a harness that waits out a
   12-second navigation and looks afterwards finds an empty meadow and calls
   a working feature broken. */
await nav(BASE + '?fps=0', 1500);
ok('a discovery that was never said out loud is said on still grass',
  await until(`(() => { try { return ${NOTICE} >= 1 } catch (e) { return false } })()`, 60000));
await until(`(() => { const r = ${LANE}; return r !== 'none' && JSON.parse(r).y === SS_SIG_TOAST_Y })()`, 25000);
const mlane = await evj(LANE);
ok('…in the same lane, clear of the meadow’s chips above and its title below',
  mlane !== 'none' && mlane.sf === 0 && mlane.y - mlane.h / 2 > 81 && mlane.y + mlane.h / 2 < 276,
  'band ' + (mlane.y - mlane.h / 2) + '..' + (mlane.y + mlane.h / 2) + ' scrollFactor ' + mlane.sf);
ok('and the meadow spends the queue too', await until(`SS.prof.sig.pend.length === 0`, 20000));
ok('the meadow is standing normally underneath it', await until(HOME_REST));

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

// ---------------------------------------------------------------- sweep
await ev(`(() => { localStorage.removeItem('beta3.profile'); return 'swept' })()`);
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (errs.length) { console.log('EXCEPTIONS:'); errs.slice(0, 6).forEach(e => console.log('  ' + e.split('\n')[0])); }
else console.log('zero page exceptions');
process.exit(fail || errs.length ? 1 : 0);
