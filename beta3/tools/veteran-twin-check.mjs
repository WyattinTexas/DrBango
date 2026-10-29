// VETERAN-TWIN-CHECK — a returning player's runs are the shipped ones, move
// for move (v0.125.0, THE FIRST NIGHT, LIVE).
// The scripted First Night rides Battle.f5Night — a stranger's first open
// and the settings door's replay, nothing else. This check proves the other
// side of that gate the strong way: not by looking for missing beats, but by
// playing the SAME veteran run on two trees and comparing every move — the
// TWIN (a shipped commit's beta3, `git archive`d to a scratch folder; default
// the last `STARSPELL v…` build before HEAD) and THIS tree. Quick, daily,
// endless and campaign, each from a fresh veteran device (a stored profile:
// the first open closed), on the same seeds:
//   • the run's seed draws are pinned — the run's one setSeed (Battle.create)
//     takes RUN_SEED, once (quick/campaign; the daily's is the day's own),
//     the campaign roster is one stored roll, and the climb is a level-1
//     checkpoint on a fixed eseed — so both trees deal from the same streams;
//     every later draw is the game's seeded rng() (cosmetics use
//     Math.random — the house law; Math.random is never touched here). ONE
//     shipped cosmetic breaks the law on a timer: the cast flight's landing
//     sparks draw rng() in their tween's onComplete, and a stalled frame can
//     land them after the refill (the same draws, reordered — a diverged deal
//     on IDENTICAL bytes, caught by the ledger below on 10/29). On both trees
//     alike, that one line's draws come from Math.random.
//   • every rng() draw is counted (`rn`, compared) and booked to its caller
//     (printed for the moves around a mismatch)
//   • every move is the same deterministic choice — two casts of the WEAKEST
//     word on the board (the solver's own walk, least damage — so fights run
//     long enough for the beast's strikes, the dew, the refills), then the
//     solver's best (bestWord); SCRY by its own button when there is no word; the first card
//     at a sigil/upgrade pick, the gate and the chart entered by their zones
//     — made only once the fight has stood settled (nothing selected, no
//     blow in flight, no bar held) for SETTLE ms, so a timer-born draw (the
//     dew after a strike) can never land on different sides of a move
//   • each move logs the board (letters, tiers, blacked cells), the fight
//     and its beast (hp, fuse), the player's hp, the score and the move —
//     the two logs must agree entry for entry; THIS tree's run must also
//     stay dark (f5Night false, no script, no rig, no pocket, no night flag)
// Playwright's Chromium only (a headless GOOGLE Chrome hijacks AppleScript's
// session with the real one on this Mac); playwright-core from PW_DIR.
//
//   cd beta3 && PW_DIR=<dir holding node_modules/playwright-core> node tools/veteran-twin-check.mjs
//   TWIN_REF=<commit> MODES=quick,daily MOVES=28 …   (defaults: last shipped build · all four · 28)
//
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const { chromium } = createRequire(process.env.PW_DIR ? process.env.PW_DIR.replace(/\/?$/, '/') : import.meta.url)('playwright-core');
const CH = '/Users/admin/Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
const ROOT = resolve('..');   // the repo root (this runs from beta3/)
const TWIN_REF = process.env.TWIN_REF
  || execSync("git log -1 --format=%H --grep='^STARSPELL v[0-9]' HEAD~1", { cwd: ROOT }).toString().trim();
const MODES = (process.env.MODES || 'quick,daily,endless,campaign').split(',');
const MOVES = +process.env.MOVES || 28;
const TWIN_PORT = 8936, CAND_PORT = 8937;
const RUN_SEED = 777777, ROSTER_SEED = 424242, ESEED = 424242;
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) pass++; else fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d !== undefined && d !== '' ? '  [' + d + ']' : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const buildOf = (src) => (src.match(/const BUILD = '([^']+)'/) || [])[1];

/* ---------- the twin, extracted; both trees served ---------- */
const twinLabel = execSync('git log -1 --format="%h %s" ' + TWIN_REF, { cwd: ROOT }).toString().trim().slice(0, 90);
const scratch = mkdtempSync(join(tmpdir(), 'ss-twin-'));
execSync('git archive --format=tar ' + TWIN_REF + ':beta3 | tar -x -C ' + JSON.stringify(scratch), { cwd: ROOT });
const twinBuild = buildOf(readFileSync(join(scratch, 'game.js'), 'utf8'));
const candBuild = buildOf(readFileSync('game.js', 'utf8'));
console.log('  twin: ' + twinLabel + '  (' + twinBuild + ')');
console.log('  this: ' + process.cwd() + '  (' + candBuild + ')');
const kids = [];
const serve = async (dir, port) => {
  // a killed run can orphan its servers — never let a stale one stand in for a tree
  try { await fetch('http://127.0.0.1:' + port + '/'); console.log('  :' + port + ' is already serving something — stop it first (lsof -iTCP:' + port + ')'); return false; } catch (e) { }
  kids.push(spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: dir, stdio: 'ignore' }));
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + port + '/game.js')).ok) return true; } catch (e) { } await sleep(200); }
  return false;
};
const servedBuild = async (port) => buildOf(await (await fetch('http://127.0.0.1:' + port + '/game.js?b=' + Date.now())).text());
ok('both trees served, each its own bytes (twin ' + twinBuild + ' · this ' + candBuild + ')',
  await serve(scratch, TWIN_PORT) && await serve(process.cwd(), CAND_PORT)
  && await servedBuild(TWIN_PORT) === twinBuild && await servedBuild(CAND_PORT) === candBuild);

/* ---------- one veteran run, logged move by move ---------- */
const b = await chromium.launch({ executablePath: CH, args: ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--mute-audio'] });
const until = async (p, fn, ms) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await p.evaluate(fn)) return true; } catch (e) { } await sleep(250); } return false; };
async function play(port, mode) {
  const base = 'http://127.0.0.1:' + port + '/';
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => { if (!/WebGL context/.test(String(e))) errs.push(String(e).slice(0, 200)); });
  await p.route(/firebase|gstatic/, (r) => r.abort());
  await p.goto(base + 'ascent.html');
  await p.evaluate(([mode, eseed]) => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('beta3.profile', JSON.stringify({ ftue: 1, runs: 12, rating: 1000 }));
    localStorage.setItem('beta3.lang', 'en');
    sessionStorage.setItem('beta3.skipIntro', '1');
    // the climb's ladder is its eseed: a level-1 checkpoint on a fixed one (CONTINUE the climb)
    if (mode === 'endless') localStorage.setItem('beta3.endless', JSON.stringify({ fightIdx: 0, eseed, hp: 50, hpMax: 50, sigils: [], tiers: {},
      words: 0, longest: '', totalDmg: 0, scried: 0, featherUsed: false, letters: 0, bigHit: 0, playMs: 0, overkill: 0, clockV: 2 }));
  }, [mode, ESEED]);
  await p.goto(base + 'index.html?fps=0');
  const rested = await until(p, "(() => { const h = window.game && game.scene.getScene('home'); return !!h && h.sys.isActive() && !!h.rowBtns && !h.busy() })()", 60000);
  if (!rested) { await ctx.close(); return { moves: [], errs, fail: 'the meadow never rested' }; }
  // pin the seeds: the campaign's roster is one stored roll; the run's one
  // setSeed (Battle.create) takes RUN_SEED, once — the daily keeps the day's
  const cosmetic = await p.evaluate(async ([mode, runSeed, rosterSeed, sparkLine]) => {
    if (mode === 'campaign') localStorage.setItem('beta3.camproster', JSON.stringify(ssRollRoster(rosterSeed)));
    const S = window.setSeed;
    window.__twinSeed = mode === 'daily' ? undefined : runSeed;
    window.setSeed = function (s) { if (window.__twinSeed !== undefined) { const v = window.__twinSeed; window.__twinSeed = undefined; return S(v); } return S(s); };
    // THE ONE TIMED COSMETIC ON THE SEEDED STREAM (shipped since the cast
    // flight's v0.104.0 slow-down, in both trees): each flying letter's
    // landing sparks draw rng() in its tween's onComplete — 310+ ms before the
    // refill, but a stalled frame can land them after it and reorder the deal.
    // That line's draws come from Math.random here, on both trees alike.
    const src = await (await fetch(document.querySelector('script[src*="game.js"]').src)).text();
    const ln = src.split('\n').findIndex((l) => l.includes(sparkLine)) + 1;
    const tag = ln > 0 ? 'game.js?v=' : null, at = ':' + ln + ':';
    // the seeded stream's ledger: every rng() draw counted (compared move by
    // move) and booked to its caller (printed at a mismatch)
    const R = window.rng;
    window.__rngN = 0; window.__rngBy = {};
    window.rng = function () {
      const fr = String(new Error().stack || '').split('\n');
      if (tag && (fr[2] || '').includes(tag) && (fr[2] || '').includes(at)) return Math.random();
      window.__rngN++;
      const st = fr.slice(2, 4).map((x) => x.trim().replace(/^at /, '').split(' ')[0]).join('<');
      window.__rngBy[st] = (window.__rngBy[st] | 0) + 1;
      return R();
    };
    return ln;
  }, [mode, RUN_SEED, ROSTER_SEED, 'onComplete: () => { this.starBurst.emitParticleAt(this.beastC.x + (rng() - 0.5)']);
  if (!(cosmetic > 0)) { await ctx.close(); return { moves: [], errs, fail: "the cast flight's landing-spark line was not found in game.js (the harness's one cosmetic exemption)" }; }
  await p.evaluate((m) => game.scene.getScene('home').startMode(m), mode);
  const moves = [];
  const t0 = Date.now();
  let readyKey = '', readySince = 0, ended = false;
  while (moves.length < MOVES && Date.now() - t0 < 300000) {
    const st = await p.evaluate(() => {
      const b = game.scene.getScene('battle');
      if (!b || !b.sys.isActive() || !b.run || !b.board) return { s: 'none' };
      return { s: b.state, sel: b.sel.length, dying: !!b.dying, pend: (b.hitPend || []).length, hold: b.hpHold | 0, words: b.run.words, f: b.run.fightIdx };
    }).catch(() => ({ s: 'none' }));
    if (st.s === 'end') { ended = true; break; }
    const actionable = (st.s === 'pick' && !st.sel && !st.dying && !st.pend && !st.hold) || st.s === 'sigil' || st.s === 'upgrade' || st.s === 'gate' || st.s === 'map';
    const key = actionable ? st.s + ':' + st.f + ':' + st.words : '';
    if (!actionable || key !== readyKey) { readyKey = key; readySince = Date.now(); await sleep(150); continue; }
    if (Date.now() - readySince < (st.s === 'pick' ? 1500 : 2400)) { await sleep(150); continue; }
    const mv = await p.evaluate((weak) => {
      const b = game.scene.getScene('battle');
      const f = b.fights[b.run.fightIdx];
      // the solver's own walk (bestWord's), keeping the LEAST damage — short words only
      const weakest = () => {
        b.buildTrie();
        const tiles = b.board.map((s, i) => ({ i, s })).filter((x) => x.s);
        const used = new Array(tiles.length).fill(false), pick = [], need = b.castMinLen();
        let best = null, low = Infinity;
        const dive = (node) => {
          if (node.$ && pick.length >= 2 && (need <= 2 || pick.reduce((a, k) => a + tiles[k].s.ch.length, 0) >= need)) {
            const dmg = b.wordDamage(pick.map((k) => tiles[k].s));
            if (dmg < low) { low = dmg; best = pick.map((k) => tiles[k].i); }
          }
          if (pick.length >= Math.max(5, need)) return;
          const seen = new Set();
          for (let k = 0; k < tiles.length; k++) {
            if (used[k]) continue;
            const key = tiles[k].s.ch + ':' + tiles[k].s.tier + (tiles[k].s.blk ? ':b' : '');
            if (seen.has(key)) continue;
            seen.add(key);
            let n = node, ok = true;
            for (const ch of tiles[k].s.ch) { n = n[ch]; if (!n) { ok = false; break; } }
            if (!ok) continue;
            used[k] = true; pick.push(k); dive(n); used[k] = false; pick.pop();
          }
        };
        dive(b.trie);
        return best;
      };
      const snap = {
        f: b.run.fightIdx, beast: f ? f.id : null, hp: b.beast ? b.beast.hpNow : null, cnt: b.beast ? b.beast.count : null,
        php: b.run.hp, score: b.runScore(), sig: b.run.sigils.join(','),
        board: b.board.map((s) => (s ? s.ch + (s.tier || '') + (s.blk ? '#' : '') : '_')).join(' '),
        rn: window.__rngN, _by: window.__rngBy,
      };
      window.__rngBy = {};
      if (b.state === 'pick') {
        const best = weak ? weakest() : b.bestWord();
        if (!best) { snap.mv = 'scry'; b.scryB.emit('pointerdown'); return snap; }
        snap.mv = 'cast:' + best.map((i) => b.board[i].ch).join('');
        for (const i of best) b.tapTile(i);
        return snap;
      }
      if (b.state === 'sigil' || b.state === 'upgrade') {
        const cards = [];
        const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('sigilCard')) cards.push(o); else if (o.list) scan(o.list); });
        scan(b.overlayC.list);
        const idOf = (c) => { let id = null; const s = (ls) => ls.forEach((o) => { if (!id && o.getData && o.getData('sigilDesc')) id = o.getData('sigilDesc'); if (o.list) s(o.list); }); s(c.list || []); return id || '?'; };
        snap.mv = b.state + ':' + cards.map(idOf).join('/');
        if (cards[0]) cards[0].emit('pointerdown');
        return snap;
      }
      if (b.state === 'gate') { snap.mv = 'gate'; if (b.gateZone && b.gateZone.active) b.gateZone.emit('pointerdown'); return snap; }
      if (b.state === 'map') {
        const ch = b.overlayC.list.find((o) => o.getData && o.getData('mapZone'));
        const z = ch && ch.getData('mapZone');
        snap.mv = 'map'; if (z && z.active) z.emit('pointerdown'); return snap;
      }
      snap.mv = 'none:' + b.state; return snap;
    }, moves.filter((m) => m.mv.startsWith('cast:') || m.mv === 'scry').length % 3 !== 2);
    if (mv.mv.startsWith('cast:')) { await sleep(420); await p.evaluate(() => game.scene.getScene('battle').tryCast()); }
    moves.push(mv);
    readyKey = ''; readySince = 0;
  }
  const dark = await p.evaluate(() => {
    const b = game.scene.getScene('battle');
    return { f5Night: b.f5Night, f5G: !!b.f5G, rig: b.f5Queue ? b.f5Queue.length : null, rungs: b.f5Rungs === undefined ? 'n/a' : b.f5Rungs,
      ftue: b.ftue, quickck: localStorage.getItem('beta3.quickck'), f5night: !!(SS.prof && SS.prof.f5night), f5lit: !!(SS.prof && SS.prof.f5lit) };
  }).catch(() => null);
  await ctx.close();
  return { moves, errs, ended, dark };
}

/* ---------- the four modes, both trees side by side ---------- */
for (const mode of MODES) {
  console.log('— ' + mode + ' —');
  const [tw, cd] = await Promise.all([play(TWIN_PORT, mode), play(CAND_PORT, mode)]);
  if (tw.fail || cd.fail) { ok(mode + ': both runs started', false, tw.fail || cd.fail); continue; }
  const n = Math.min(tw.moves.length, cd.moves.length);
  const pub = (m) => m && JSON.stringify(m, (k, v) => (k[0] === '_' ? undefined : v));   // the ledger's caller book is diagnosis, not the compared move
  let first = -1;
  for (let i = 0; i < Math.max(tw.moves.length, cd.moves.length); i++) {
    if (pub(tw.moves[i]) !== pub(cd.moves[i])) { first = i; break; }
  }
  if (first >= 0) for (let i = Math.max(0, first - 2); i <= first; i++) {
    console.log('    move #' + i + ' draws since the last move — twin ' + JSON.stringify(tw.moves[i] && tw.moves[i]._by) + ' · this ' + JSON.stringify(cd.moves[i] && cd.moves[i]._by));
  }
  const casts = cd.moves.filter((m) => m.mv.startsWith('cast:')).length;
  const scries = cd.moves.filter((m) => m.mv === 'scry').length;
  const fights = new Set(cd.moves.map((m) => m.f)).size;
  const picks = cd.moves.filter((m) => /^(sigil|upgrade):/.test(m.mv)).length;
  // the beast's blows, read off the log: the player's hp falling between two moves of one fight
  const blows = cd.moves.filter((m, i) => i && m.f === cd.moves[i - 1].f && m.php < cd.moves[i - 1].php).length;
  const dew = cd.moves.filter((m) => /[a-z]3/.test(m.board)).length;
  ok(mode + ': a real run was played on both trees (' + cd.moves.length + ' moves · ' + casts + ' casts · ' + scries + ' scries · ' + blows + ' blows · '
    + dew + ' boards with dew · ' + fights + ' fights · ' + picks + ' picks' + (cd.ended ? ' · to its end' : '') + ')',
    n >= Math.min(MOVES, 8) && casts >= 4);
  ok(mode + ': every move identical — board, beast, fuse, hp, score, move' + (first < 0 ? ' (' + n + '/' + n + ')' : ''),
    first < 0, first < 0 ? '' : '#' + first + ' twin ' + pub(tw.moves[first]) + ' · this ' + pub(cd.moves[first]));
  const d = cd.dark || {};
  ok(mode + ': this tree\'s run stayed dark (f5Night false, no script, no rig, no rungs, no pocket, no night flag, nothing lit)',
    d.f5Night === false && !d.f5G && d.rig === 0 && d.rungs === null && d.ftue === false && d.quickck === null && !d.f5night && !d.f5lit, JSON.stringify(d));
  ok(mode + ': zero page exceptions on either tree', !tw.errs.length && !cd.errs.length, tw.errs.concat(cd.errs).slice(0, 2).join(' | '));
}

await b.close();
for (const k of kids) { try { k.kill(); } catch (e) { } }
try { rmSync(scratch, { recursive: true, force: true }); } catch (e) { }
console.log('\n' + pass + ' passed · ' + fail + ' failed');
process.exit(fail ? 1 : 0);
