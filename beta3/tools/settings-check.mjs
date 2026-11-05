// SETTINGS-CHECK — the gear's sheet and its TUTORIAL door (v0.124.0).
// Skylar (10/29): "Lets put a tutorial button in the settings page. That way
// if someone wants to replay the tutorial they can."
// The game side: settingsSheet() (the gear's sheet, v0.96.0) grows a third
// row on its 52-unit pitch — SOUND · LANGUAGE · TUTORIAL — and the window
// grows with it (endpanel 300×300 at y400; the version line still 26 off the
// foot). The row is a whole-band zone (c.tutZone) whose tap closes the sheet
// the way the language row does and calls Home.replayTutorial(): the very
// rise ftueRise makes (beginAscent { mode: 'quick', ftue: 1 }), so the
// curated first board and the friendly finger come back, while prof.ftue
// stays down. The way back is every quick run's own (‹, the end screen's
// HOME and NEW RUN).
// Proven by real DPR-3 taps on a veteran's meadow: the five tongues' labels;
// the sheet's census (three rows in order, the window's height, the version
// line at the foot, nothing overlapping, everything inside the window and the
// window inside the viewport, plain and under ?inset=59,34); the one-sheet
// guard family both ways (settings ⇄ daily by real taps, language and the
// tutorial refused over an open sheet); the TUTORIAL tap reaching the
// tutorial (sheet gone, an unsigned quick run, ftue, the authored board tile
// for tile, the finger on the first letter and walking); the round trip (‹ to
// the full meadow with the gear and the row answering again; a replay played
// to its end screen, NEW RUN dealing a PLAIN quick game, ‹ home again); a
// standing campaign checkpoint and endless climb byte-identical through all
// of it (CONTINUE GAME still lit); prof.ftue never re-owed; the Spanish
// tutorial too; zero page exceptions.
// v0.125.0 (THE FIRST NIGHT, LIVE): the door now replays the whole scripted
// night — the replay carries Battle.f5Night (it keys on ftue) and is marked
// a replay (f5Replay). §5b walks it start to farewell by REAL taps on the
// finger's road: STAR · MOONS → the orange (+6: 16, not 10) → SKY → the scry
// gate (SCRY tapped, the fuse stepping 3 → 2) → TONIGHT → the blue (×1.5: 12,
// not 8) → HALO → the beast's strike (50 → 42) → the green dew → DAWN → the
// mend (42 → 48) → the hand's farewell, each showcase released by a real
// tap past its floor (SHOTS: night-orange · night-scry-gate · night-blue ·
// night-strike · night-strike-drain · night-heal). §5c proves the replay
// keeps no pocket: no beta3.quickck through the night, the fell or the pick,
// and a COLD reboot wakes on the meadow (no resume, nothing owed) — and the
// veteran's meadow wears no lit-sky mark though the replay lit VULPES.
// v0.126.0 (THE TILE ECONOMY, card ss-2026-10-29-scripted-tutorial/02): §1
// pins the two new held lessons on paper (they interpose in f5GuideNext the
// way the scry gate does; the dials; the arrivals quiet under the script; no
// seeded draws; all nine lines in all five tongues) and §5b walks them on the
// replayed night: HOW EACH TILE WAS EARNED, held the moment it lands and
// before its POINT — the orange ("5 letters", "MOONS had 5 letters, so it
// earned this ORANGE tile.", released by a real tap AIMED AT A BOARD TILE,
// which never takes the tile), the blue ("7 letters", TONIGHT, released by a
// tap), the green (the blow's "−8", "The beast hit you, so you earned this
// GREEN tile.", left untapped to let go by its own dwell) — each POINT then
// saying what its tile does, once; and USE IT OR LOSE IT after the mend: the
// night's three colored tiles held (S · H · D), a tap before the drain and
// one inside its floor both refused, the colours DRAINING to plain faces and
// fallen chips (7 → 1 · 4 · ♥6 → 2) with the loss said, and the untapped
// beat holding its slowed duration (1.2 s, then 4.2 s from the drain) before
// the farewell (SHOTS: night-orange-earned · night-blue-earned ·
// night-green-earned · night-fade · night-fade-drained).
// v0.127.0 (THE BOSS BLACKOUT, card ss-2026-10-29-scripted-tutorial/03): §1
// pins the blackout on paper (it interposes in f5GuideNext after the fade,
// before the step; the volley IS blackoutAttack, whose targeting and
// wordDamage's blackout law stay byte-kept; the dials; the shipped ink prompt
// quiet under the script; the hand asking for the black tile; fight 2's taste
// standing down, its fallback on the bosses' rule; no seeded draws; the word,
// the refill and three lines in all five tongues, the zero said in words) and
// §5b walks it on the replayed night: after the fade the beast throws the
// bosses' OWN volley — the scripted letters blacked, P (cell 2) and M (cell
// 15), the same two for everyone, each keeping its letter on the dark face
// with a flat 0 (the shipped prompt quiet, the live hint spoken) — then the
// lesson HOLDS (the two black tiles lifted into the light at their own seats,
// "Some bosses can black out a few of your letters." and the rule on the row
// the ink left alone, the hand on the M, then resting on the P), a tap inside
// its floor refused and the untapped beat holding its slowed duration (4.4 s)
// before it lets go; PEN is walked through the black P (a tap on the other
// black tile refused; CAST says 2), and THE ZERO holds: 2 damage, the clean
// word's 5 — the P's 3 points void, wordDamage's own law — "+0", "That black
// tile added nothing: 2 damage, not 5."; then the farewell on the authored
// board, the M still dark (SHOTS: night-ink-volley · night-ink ·
// night-ink-lesson · night-ink-zero). Probe taps meant to land INSIDE a floor
// go through floorProbe (a tight poll; a late harness skips the tap rather
// than letting the beat go), and every capture sleeps the game loop while its
// frame is taken (the fade's capture now comes first, before its two timed taps).
// Self-launching: serves beta3 on :8899 if nothing does; headless Chromium on
// :9501 (/tmp/cdp-settings wiped first) — Playwright's own Chromium when it
// is installed (a headless GOOGLE Chrome hijacks AppleScript's session with
// the real one on this Mac), CHROME=… overrides — pinned to an iPhone's
// 390 × 844 at DPR 3 by one device-metrics override; Firebase blocked
// throughout.
//
//   perl -e 'alarm 900; exec @ARGV' node tools/settings-check.mjs   # ~8 min
//   SHOTS=tools/shots-tutorial node tools/settings-check.mjs        # + DPR-3 captures
//   ORIGIN=https://drbango.com/beta3 node tools/settings-check.mjs  # the PUBLISHED bytes
//                                     (no local serve; §2 proves the served BUILD is this tree's)
//
import { spawn, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
const PORT = 9501, SRV = 8899;
const ORIGIN = (process.env.ORIGIN || 'http://localhost:' + SRV).replace(/\/$/, '');
const BASE = ORIGIN + '/index.html';
const pwChromium = () => {
  try {
    const root = homedir() + '/Library/Caches/ms-playwright';
    const d = readdirSync(root).filter((n) => /^chromium-\d+$/.test(n)).sort((a, b) => b.slice(9) - a.slice(9))[0];
    const p = d && root + '/' + d + '/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
    return p && existsSync(p) ? p : null;
  } catch (e) { return null; }
};
const CHROME = process.env.CHROME || pwChromium() || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= §1 ON PAPER (no browser) ================= */
console.log('— §1 on paper —');
const gameSrc = readFileSync('game.js', 'utf8');
const dataSrc = readFileSync('data.js', 'utf8');
const FTUE = eval('(' + dataSrc.match(/const SS_FTUE = (\{[\s\S]*?\n\});/)[1] + ')');
const WANT = { en: 'TUTORIAL', es: 'TUTORIAL', fr: 'TUTORIEL', pt: 'TUTORIAL', de: 'TUTORIAL' };
const sheetSrc = (gameSrc.match(/\n  settingsSheet\(\) \{[\s\S]*?\n  \}\n/) || [''])[0];
ok('the sheet builds the TUTORIAL row as a whole-band zone that steps aside, then replays',
  /c\.tutZone = row\(rowY\(2\), SS_T\('setTut'\)/.test(sheetSrc) && /closeSheet\(\);\s*this\.replayTutorial\(\);/.test(sheetSrc));
ok('…on a window sized to three rows (PH 300, one 52-unit pitch)',
  /const PH = 300, top = 400 - PH \/ 2;/.test(sheetSrc) && /const rowY = \(i\) => top \+ 96 \+ 52 \* i;/.test(sheetSrc));
ok('…and its mark is a plain › (no emoji — the no-emoji-as-game-art law)', /const tuT = ssTxt\(this, l\.x\(124\), l\.y\(rowY\(2\)\), '›'/.test(sheetSrc));
const replaySrc = (gameSrc.match(/\n  replayTutorial\(\) \{[\s\S]*?\n  \}\n/) || [''])[0];
ok("replayTutorial rides ftueRise's own rise (quick, no resume, ftue 1), marked a replay",
  replaySrc.includes("this.beginAscent({ mode: 'quick', resume: null, ascended: true, ftue: 1, replay: 1 });"));
// v0.125.0: the night rides ftue, the replay rides `replay` — and keeps no pocket
ok('the First Night keys on ftue (so the door replays the scripted night), the replay on its own flag',
  /this\.f5Night = this\.mode === 'quick' && \(this\.ftue \|\|/.test(gameSrc) && gameSrc.includes('this.f5Replay = this.f5Night && !!data.replay;'));
const ckSrc = (gameSrc.match(/\n  saveCheckpoint\(\) \{[\s\S]*?\n  \}\n/) || [''])[0];
ok("…a replay writes no pocket (saveCheckpoint's quick branch steps aside first)", /if \(this\.mode === 'quick'\) \{\s*if \(this\.f5Replay\) return;/.test(ckSrc));
ok("…the meadow's lit sky is its owner's alone (a veteran's replay never marks it)",
  /function ssF5DrawLitSky\(scene\) \{[^]*?if \(!ssF5LitOwner\(scene\)\) return;\s*for \(const id of ssF5LitList\(\)\)/.test(gameSrc));
ok('…and the hand dies with the scene (a ‹-abandoned replay leaves no stale glove for the next)',
  /this\.ftueHand = null; this\.ftueTimer = null;\s*this\.f5G = null;[^\n]*\n\s*if \(this\.ftue\) this\.ftueStart\(\);/.test(gameSrc));
ok('…writes nothing to the first-open flag', !!replaySrc && !/prof\.ftue|ssFtueDone|SS\.save/.test(replaySrc));
ok('…and stands behind the whole one-sheet guard family', ['this.busy()', 'this.setC', 'this.langC', 'this.dailyC', 'this.mapC',
  'this.confirmC', 'this.signC', 'this.streakC', 'this.riteC'].every((t) => replaySrc.includes(t)));
// v0.126.0 THE TILE ECONOMY: the two new held lessons ride the script's own door
const nextSrc = (gameSrc.match(/\n  f5GuideNext\(\) \{[\s\S]*?\n  \}\n/) || [''])[0];
ok('THE TILE ECONOMY (v0.126.0): the how-it-was-earned beat and the use-it-or-lose-it pause interpose in f5GuideNext exactly as the scry gate does (before the step, once each), so THE POINT and the farewell follow as shipped',
  /if \(g\.idx \+ 1 === g\.scryAt && !g\.scried\) \{ this\.f5GuideScry\(\); return; \}[\s\S]*?if \(nk && !\(g\.earned && g\.earned\[nk\]\) && this\.f5GuideEarn\(nk\)\) return;\s*if \(g\.idx \+ 1 >= g\.words\.length && !g\.faded && this\.f5GuideFade\(\)\) return;\s*(\/\*[\s\S]*?\*\/\s*)?if \(g\.idx \+ 1 >= g\.words\.length && !g\.inked && this\.f5GuideInk\(\)\) return;\s*g\.idx\+\+;/.test(nextSrc));
// card 02's own beats run from f5GuideEarn up to card 03's F5-INK block (v0.127.0 seats the blackout after them)
const econAll = (gameSrc.match(/\n  f5GuideEarn\(kind\) \{[\s\S]*?\n  (?=\/\* ---- F5-INK|\/\/ ---------- board ----------)/) || [''])[0];
ok('…its dials are declared and wired: the earned beat dwells 4400 · the fade stands 1200, then dwells 4200 from the drain · both floors the showcase\'s 900, the fade\'s armed at the drain',
  ['const SS_F5_EARN_SHOW_MS = 4400;', 'const SS_F5_FADE_AT_MS = 1200;', 'const SS_F5_FADE_SHOW_MS = 4200;'].every((t) => gameSrc.includes(t))
  && econAll.includes("const dwell = this.time.delayedCall(SS_F5_EARN_SHOW_MS, () => release('dwell'));")
  && econAll.includes('this.time.delayedCall(SS_F5_FADE_AT_MS, () => this.f5GuideFadeDrain(g));')
  && econAll.includes("const dwell = this.time.delayedCall(SS_F5_FADE_SHOW_MS, () => release('dwell'));")
  && (econAll.match(/this\.time\.delayedCall\(SS_F5_SHOW_FLOOR_MS, \(\) => \{/g) || []).length === 2
  && /f5GuideFadeDrain\(g\) \{[\s\S]*?const dwell = this\.time\.delayedCall\(SS_F5_FADE_SHOW_MS/.test(econAll));
ok('…a forged tile\'s and the dew\'s arrival stay quiet while the script stands (THE POINT says what it does, after the earned beat says how)',
  gameSrc.includes('if (this.f5Night && (tier === 1 || tier === 2) && !this.f5GuideLocked()) {') && gameSrc.includes('if (this.f5Night && !this.f5GuideLocked()) this.time.delayedCall(520,'));
const econSrc = (gameSrc.match(/\n  f5GuideEarn\(kind\) \{[\s\S]*?\n  (?=\/\* ---- F5-INK|\/\/ ---------- board ----------)/) || [''])[0];
const econCode = econSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');   // the code alone (its comments SAY "never rng()")
ok('…the new beats draw nothing from the seeded stream (their cosmetics on Math.random — the house law) and are reached only from the script (two call sites, both in f5GuideNext)',
  econCode.length > 2000 && !/\brng\(\)/.test(econCode) && /Math\.random\(\)/.test(econCode) && (gameSrc.match(/this\.f5GuideEarn\(|this\.f5GuideFade\(\)/g) || []).length === 2
  && /this\.f5GuideEarn\(nk\)/.test(nextSrc) && /this\.f5GuideFade\(\)/.test(nextSrc));
const P5 = eval('(' + gameSrc.match(/const SS_F5_PROMPTS = (\{[\s\S]*?\n\});/)[1] + ')');
const ECON = ['earnCount', 'orangeHow', 'orangeRule', 'blueHow', 'blueRule', 'greenHow', 'greenRule', 'fadeRule', 'fadeLoss'];
ok('…every lesson line authored in all five tongues (es/fr/pt/de drafts) with the en placeholders kept ({w} {n} on the how lines, {n} on the count)',
  ['en', 'es', 'fr', 'pt', 'de'].every((t) => ECON.every((k) => typeof P5[t][k] === 'string' && P5[t][k].length > 4))
  && ['es', 'fr', 'pt', 'de'].every((t) => ['orangeHow', 'blueHow'].every((k) => P5[t][k].includes('{w}') && P5[t][k].includes('{n}')) && P5[t].earnCount.includes('{n}')),
  ECON.filter((k) => !['en', 'es', 'fr', 'pt', 'de'].every((t) => P5[t] && P5[t][k])).join(',') || 'all 9 × 5');
// v0.127.0 THE BOSS BLACKOUT: the bosses' own volley, held, then walked
const inkAll = (gameSrc.match(/\n  \/\* ---- F5-INK \(card ss-2026-10-29-scripted-tutorial\/03\)[\s\S]*?\n  \/\/ ---------- board ----------/) || [''])[0];
const inkCode = inkAll.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
ok('THE BOSS BLACKOUT (v0.127.0): the beat interposes in f5GuideNext right after the use-it-or-lose-it pause and before the step, once — its lift adds the black tile\'s word, which the step walks',
  /if \(g\.idx \+ 1 >= g\.words\.length && !g\.faded && this\.f5GuideFade\(\)\) return;\s*(\/\*[\s\S]*?\*\/\s*)?if \(g\.idx \+ 1 >= g\.words\.length && !g\.inked && this\.f5GuideInk\(\)\) return;\s*g\.idx\+\+;/.test(nextSrc)
  && inkCode.includes('g.words.push(ink.word.slice()); g.ink = g.words.length - 1;') && inkCode.includes('this.f5Queue.push(...ink.refill);'));
ok('…the volley IS the bosses\' own (blackoutAttack — real speed, real targets, real blackTile), and the live law it teaches stays byte-kept: an inked letter spells but pays nothing; two a volley unless the beast says more; the best plain letters first, the lowest cell on a tie',
  inkCode.includes('this.blackoutAttack(() => {') && gameSrc.includes('if (s.blk) continue;                     // blackout: the letter spells, but pays NOTHING')
  && gameSrc.includes('const n = Math.min(this.beast.fx.ink || 2, Math.max(0, 6 - dark));')
  && gameSrc.includes('.sort((a, b) => (a.s.tier > 0) - (b.s.tier > 0) || this.inkWorth(b.s) - this.inkWorth(a.s) || a.i - b.i)'));
ok('…its dials declared and wired: the lesson rises 1500 after the volley and dwells 4400 (the showcase\'s 900 floor), the hand moves between the black tiles at 1400; THE ZERO dwells the showcase\'s 3600 on the same floor',
  ['const SS_F5_INK_AT_MS = 1500;', 'const SS_F5_INK_SHOW_MS = 4400;', 'const SS_F5_INK_TOUR_MS = 1400;'].every((t) => gameSrc.includes(t))
  && inkAll.includes('this.time.delayedCall(SS_F5_INK_AT_MS, () => this.f5GuideInkHold(g));')
  && inkAll.includes("const dwell = this.time.delayedCall(SS_F5_INK_SHOW_MS, () => release('dwell'));")
  && inkAll.includes('tour.slice(1).forEach((i, k) => this.time.delayedCall(SS_F5_INK_TOUR_MS * (k + 1), () => {')
  && inkAll.includes('const dwell = this.time.delayedCall(SS_F5_SHOW_MS, release);')
  && (inkAll.match(/this\.time\.delayedCall\(SS_F5_SHOW_FLOOR_MS, \(\) => \{/g) || []).length === 2);
ok('…the shipped ink prompt stays quiet while the script stands (the lesson says it), and on the black tile\'s word the hand asks for the BLACK tile itself',
  gameSrc.includes("if (this.f5Night && !this.f5GuideLocked()) this.time.delayedCall(560, () => { if (this.scene.isActive()) ssF5Prompt(this, 'ink', l.x(0), l.y(374)); });")
  && gameSrc.includes('if (g && g.idx === g.ink && !this.sel.length) for (let i = 0; i < 16; i++) { const s = this.board[i]; if (s && s.c.active && s.blk && s.ch === need) return i; }')
  && gameSrc.includes("if (g.beat === 'ink') return g.pose ? 'pose' : 'wait';"));
const tasteSrc = (gameSrc.match(/if \(this\.f5Night && this\.run\.fightIdx === 1 && !this\.f5InkTaught\) \{[\s\S]*?\n      \}\n/) || [''])[0];
ok('…fight 2\'s random ink taste stands down behind the lesson (f5GuideInk marks f5InkTaught) and its fallback inks by the bosses\' rule — no Math.random left in it',
  inkCode.includes('this.f5InkTaught = true;') && tasteSrc.includes('open.sort((a, b) => this.inkWorth(this.board[b]) - this.inkWorth(this.board[a]) || a - b)[0]')
  && !/Math\.random/.test(tasteSrc));
ok('…the new beats draw nothing from the seeded stream and are reached only from the script (f5GuideInk from f5GuideNext; THE ZERO armed in f5GuideCast, shown from f5GuideShow)',
  inkCode.length > 3000 && !/\brng\(\)/.test(inkCode) && (gameSrc.match(/this\.f5GuideInk\(\)/g) || []).length === 1 && /this\.f5GuideInk\(\)/.test(nextSrc)
  && (gameSrc.match(/this\.f5InkArm\(/g) || []).length === 1 && (gameSrc.match(/this\.f5InkShow\(/g) || []).length === 1
  && gameSrc.includes('if (sh.ink) { this.f5InkShow(g); return; }'));
const INK = eval('(' + gameSrc.match(/const SS_F5_INK = (\{[\s\S]*?\n\});/)[1] + ')');
const INKL = ['inkWho', 'inkRule', 'inkHit'];
ok('…every tongue carries the black tile\'s word (three letters: LEN_MULT 1.0, so the ink costs exactly its letter) and its authored refill, and all three lines (es/fr/pt/de drafts, {d} {p} kept) — the zero said in WORDS, never a bare 0 (the house serif draws it as an "o")',
  ['en', 'es', 'fr', 'pt', 'de'].every((t) => INK[t] && INK[t].word.length === 3 && INK[t].refill.length === 3
    && INKL.every((k) => typeof P5[t][k] === 'string' && P5[t][k].length > 8 && !/\b0\b/.test(P5[t][k])) && P5[t].inkHit.includes('{d}') && P5[t].inkHit.includes('{p}')),
  ['en', 'es', 'fr', 'pt', 'de'].map((t) => t + ' ' + (INK[t] ? INK[t].word.join('').toUpperCase() : '?')).join(' · '));
const buildV =(gameSrc.match(/const BUILD = 'STARSPELL v([\d.]+)'/) || [])[1];
const html = readFileSync('index.html', 'utf8');
ok('the release ritual held (BUILD ' + buildV + ' on every ?v= stamp)', !!buildV
  && (html.match(/\?v=[\d.]+/g) || []).length >= 12 && !html.match(new RegExp('\\?v=(?!' + buildV.replace(/\./g, '\\.') + ')[\\d.]+')));

/* ================= server + browser ================= */
try { execSync('rm -rf /tmp/cdp-settings'); } catch (e) { }
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!process.env.ORIGIN && !(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
console.log('  (browser: ' + CHROME.split('/').slice(-1)[0] + ' · bytes: ' + ORIGIN + ')');
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-settings', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
// the phone itself, pinned once for the whole run (an iPhone's 390 × 844 at
// DPR 3; the headless window alone leaves a shorter viewport) — set once,
// never changed mid-run (the boss-herald law: a re-armed override skews Input)
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Network.setBlockedURLs', { urls: ['*firebaseio.com*', '*firebasedatabase.app*', '*firebase*', '*gstatic.com*'] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: 'navigator.share = undefined; navigator.clipboard = undefined;' });
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
// a real tap at the centre of a live game object (css px; the camera's
// scroll and the canvas's DPR folded out)
const tap = async (expr) => {
  const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
  await tapAt(p.x, p.y);
};
const tapUntil = async (expr, cond, tries = 6) => {
  for (let t = 0; t < tries; t++) {
    try { await tap(expr); } catch (e) { }
    await sleep(650);
    try { if (await ev(cond) === true) return true; } catch (e) { }
  }
  return false;
};
const shot = async (name) => {
  if (!SHOTS) return;
  // the game holds still while its frame is taken: a DPR-3 capture can outlast a
  // beat's timed window (1.75 s on a loaded box, v0.127.0), and a probe timed
  // around it would come late — the loop sleeps (every timer keeps its place;
  // Phaser smooths the gap away on wake) and wakes once the frame is taken
  let slept = false;
  try { slept = await ev(`!!(window.game && game.loop && game.loop.running && (game.loop.sleep(), true))`); } catch (e) { }
  try {
    mkdirSync(SHOTS, { recursive: true });
    const r = await send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
    writeFileSync(SHOTS + '/' + name + '.png', Buffer.from(r.data, 'base64'));
  } catch (e) { }
  if (slept) { try { await ev(`(game.loop.wake(), true)`); } catch (e) { } }
};
const B = `game.scene.getScene('battle')`;
const H = `game.scene.getScene('home')`;
const PICK = `!!window.game && !!${B} && ${B}.scene.isActive() && ${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`;
// ftue-check's FULL meadow (doors, chip, crest, the one gear) — and resting:
// no rise, no descent, no intro, no sheet
const CHROME_FULL = `!!window.game && ${H} && ${H}.sys.isActive() && !!${H}.menuRows && ${H}.menuRows.length >= 3
  && !!${H}.dailyChipB && !${H}.lanternB && !!${H}.setB && !${H}.langB && !${H}.muteB && !!${H}.profileChip && !${H}.ratingPill`;
const RESTING = CHROME_FULL + ` && !${H}.busy() && !${H}.setC && !${H}.dailyC && !${H}.langC && !${H}.signC && !${H}.confirmC`;
const SHEETS_SHUT = `!${H}.setC && !${H}.dailyC && !${H}.langC && !${H}.signC && !${H}.confirmC && !${H}.mapC && !${H}.streakC`;
// a VETERAN's device: a stored profile (prof.ftue writes 1 on sight) with a
// standing campaign checkpoint (CONTINUE GAME lit) and an endless climb —
// the saved play the tutorial must never touch
const CAMP = JSON.stringify({ fightIdx: 2, actIdx: 0, hp: 41, hpMax: 50, sigils: [], tiers: {}, words: 9, longest: 'stars',
  totalDmg: 120, scried: 1, featherUsed: false, letters: 40, bigHit: 22, playMs: 90000, overkill: 0, clockV: 2 });
const ENDL = JSON.stringify({ fightIdx: 3, eseed: 424242, hp: 38, hpMax: 50, sigils: [], tiers: {}, words: 14, score: 610 });
const boot = async (q, seed) => {
  await send('Page.navigate', { url: ORIGIN + '/ascent.html' }); await sleep(450);
  await ev(`localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('beta3.profile', JSON.stringify({ runs: 3 }));
    localStorage.setItem('beta3.campaign', ${JSON.stringify(CAMP)});
    localStorage.setItem('beta3.endless', ${JSON.stringify(ENDL)});
    sessionStorage.setItem('beta3.skipIntro', '1'); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') });
  await until(`window.__ssftue !== undefined`, 20000, 150);
  return until(RESTING, 60000);
};
const saved = () => evj(`JSON.stringify({ camp: localStorage.getItem('beta3.campaign'), endl: localStorage.getItem('beta3.endless'),
  daily: localStorage.getItem('beta3.dailyrun'), ftue: SS.prof.ftue, ftueLS: JSON.parse(localStorage.getItem('beta3.profile')).ftue,
  cont: !!(${H}.rowBtns && ${H}.rowBtns.campaign && ${H}.rowBtns.campaign.visible),
  contSub: ${H}.rowSubs && ${H}.rowSubs.campaign ? ${H}.rowSubs.campaign.text : null })`);
const openSheet = async () => {
  const opened = await tapUntil(`${H}.setB`, `!!${H}.setC`);
  await sleep(600);   // the window's 260 ms entrance and the veil's 200 ms
  return opened;
};
// the sheet, measured in design units: x off the frame's centre line, y down
// from the design frame's top (the window's centre is y 400)
const census = () => evj(`JSON.stringify((() => {
  const h = ${H}, c = h.setC, l = ssLayout(h), U = l.u(1);
  const box = (o) => { const b = o.getBounds(); return { l: (b.left - l.x(0)) / U, r: (b.right - l.x(0)) / U,
    t: (b.top - l.y(0)) / U, b: (b.bottom - l.y(0)) / U }; };
  const panel = c.list.find((o) => o.texture && o.texture.key === 'endpanel');
  const texts = c.list.filter((o) => o.type === 'Text');
  const labels = texts.filter((t) => t.originX === 0).sort((a, b) => a.y - b.y);
  const values = texts.filter((t) => t.originX === 1).sort((a, b) => a.y - b.y);
  const zones = [c.sndZone, c.langZone, c.tutZone];
  const title = c.list.find((o) => o.type === 'Image' && o.texture && /^gold/.test(o.texture.key));
  const x = texts.find((t) => t.text === '✕');
  const pb = panel.getBounds();
  // each zone's padded hit rectangle (the 44-pt law), in design units
  const hit = zones.map((z) => z && z.input ? z.input.hitArea.height * z.scaleY / U : 0);
  return { ph: panel.displayHeight / U, pw: panel.displayWidth / U, pcy: (panel.y - l.y(0)) / U,
    panel: box(panel), inView: pb.top >= 0 && pb.bottom <= l.H && pb.left >= 0 && pb.right <= l.W,
    safe: { it: SS_INSET.top * DPR, ib: SS_INSET.bottom * DPR, top: pb.top, bottom: pb.bottom, H: l.H },
    zones: zones.map((z) => z ? (z.y - l.y(0)) / U : null), zh: zones.map((z) => z ? z.height / U : null), hit,
    labels: labels.map((t) => ({ s: t.text, ...box(t) })), values: values.map((t) => ({ s: t.text, ...box(t) })),
    title: title ? box(title) : null, x: x ? box(x) : null,
    ver: c.verT ? { s: c.verT.text, cy: (c.verT.y - l.y(0)) / U, inert: !(c.verT.input && c.verT.input.enabled), ...box(c.verT) } : null,
    labelKeys: [SS_T('setSound'), SS_T('setLang'), SS_T('setTut')] };
})())`);
const judge = (tag, s) => {
  const r1 = (v) => Math.round(v * 10) / 10;
  ok(tag + ': three rows, in order — SOUND · LANGUAGE · TUTORIAL (the tongue\'s own words)',
    s.labels.length === 3 && s.labels.map((t) => t.s).join('|') === s.labelKeys.join('|'), s.labels.map((t) => t.s).join(' · '));
  ok(tag + ': the window is 300 × 300 at y400 (grew one row: 248 → 300)', Math.abs(s.ph - 300) < 0.6 && Math.abs(s.pw - 300) < 0.6
    && Math.abs(s.pcy - 400) < 0.6, r1(s.pw) + '×' + r1(s.ph) + ' @' + r1(s.pcy));
  ok(tag + ': the rows stand on one 52-unit pitch (346 · 398 · 450)', s.zones.map(r1).join(',') === '346,398,450', s.zones.map(r1).join(','));
  const zb = s.zones.map((y, i) => ({ t: y - s.zh[i] / 2, b: y + s.zh[i] / 2 }));
  const hb = s.zones.map((y, i) => ({ t: y - s.hit[i] / 2, b: y + s.hit[i] / 2 }));
  ok(tag + ': no two rows overlap — bands or their padded hit rectangles', zb[0].b <= zb[1].t && zb[1].b <= zb[2].t
    && hb[0].b <= hb[1].t + 0.01 && hb[1].b <= hb[2].t + 0.01, 'hit ' + s.hit.map(r1).join('/'));
  ok(tag + ': every label clears its own value (no collision on the line)', s.labels.every((t, i) => s.values[i] && t.r + 6 <= s.values[i].l),
    s.labels.map((t, i) => r1(t.r) + '<' + r1(s.values[i] ? s.values[i].l : NaN)).join(' '));
  ok(tag + ': the version line keeps the foot (26 off the bottom, below the last row, inside the window) and stays INERT', !!s.ver && s.ver.inert
    && Math.abs(s.ver.cy - (s.panel.b - 26)) < 0.6 && s.ver.t >= zb[2].b && s.ver.t >= s.labels[2].b && s.ver.b <= s.panel.b - 8
    && /STARSPELL v[\d.]+ · Corkscrew Games/.test(s.ver.s), s.ver ? r1(s.ver.t) + '..' + r1(s.ver.b) + ' / ' + r1(s.panel.b) : 'none');
  ok(tag + ': the title sits above the first row, the ✕ inside the window', !!s.title && !!s.x && s.title.b <= zb[0].t
    && s.x.t >= s.panel.t && s.x.r <= s.panel.r, s.title ? r1(s.title.b) + '<=' + r1(zb[0].t) : 'none');
  const all = [...s.labels, ...s.values, s.ver, s.title, s.x].filter(Boolean);
  ok(tag + ': every word and mark stands inside the window', all.every((o) => o.l >= s.panel.l && o.r <= s.panel.r && o.t >= s.panel.t && o.b <= s.panel.b));
  ok(tag + ': the window stands inside the viewport', s.inView === true);
};

/* ================= §2 THE SHEET (en) ================= */
console.log('— §2 the sheet, by a real tap on the gear —');
ok("a veteran's meadow stands (CONTINUE GAME lit, full chrome)", await boot());
ok('the served game is this tree\'s (BUILD ' + buildV + ')', await ev(`BUILD`) === 'STARSPELL v' + buildV, await ev(`BUILD`));
const vp = await evj(`JSON.stringify({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio, cw: game.scale.width, ch: game.scale.height })`);
ok('on the phone: 390 × 844 css at DPR 3 (a 1170 × 2532 canvas)', vp.w === 390 && vp.h === 844 && vp.dpr === 3 && vp.cw === 1170 && vp.ch === 2532,
  JSON.stringify(vp));
const tables = await evj(`JSON.stringify(Object.keys(SS_STR).map((k) => [k, SS_STR[k].setTut]))`);
ok('the five tongues carry setTut: ' + tables.map(([k, v]) => k + ' ' + v).join(' · '),
  tables.length === 5 && tables.every(([k, v]) => v === WANT[k]));
const before = await saved();
ok('the device stands as seeded: no first open owed, the climb and the campaign kept', before.ftue === 1 && before.ftueLS === 1
  && before.camp === CAMP && before.endl === ENDL && before.cont === true, JSON.stringify({ f: before.ftue, c: before.cont, s: before.contSub }));
ok('a real tap on the gear opens the sheet', await openSheet());
const en = await census();
judge('en', en);
await shot('sheet-en');

/* ================= §3 ONE SHEET AT A TIME ================= */
console.log('— §3 the one-sheet guard family —');
const guard = await evj(`JSON.stringify((() => { const h = ${H}, c0 = h.setC;
  h.dailySheet(); const daily = !!h.dailyC;
  h.langSheet(); const lang = !!h.langC;
  h.replayTutorial(); const rose = !!h.ascending;
  h.settingsSheet(); const same = h.setC === c0;
  return { daily, lang, rose, same } })())`);
ok('over the open sheet the daily sheet is refused', guard.daily === false);
ok('…the language sheet is refused', guard.lang === false);
ok('…the tutorial is refused (no rise under a sheet)', guard.rose === false);
ok('…and a second settings sheet is refused (the same one stands)', guard.same === true);
await tapAt(70, 40);   // the veil, well clear of the window
ok('a real tap on the veil closes the sheet', await until(SHEETS_SHUT, 4000));
ok('the daily sheet opens', await ev(`(() => { ${H}.dailySheet(); return !!${H}.dailyC })()`) === true);
await sleep(500);
ok('…and over it the settings sheet is refused', await ev(`(() => { ${H}.settingsSheet(); return !${H}.setC })()`) === true);
ok('…the tutorial is refused there too', await ev(`(() => { ${H}.replayTutorial(); return !${H}.ascending })()`) === true);
await tap(`${H}.setB`);
await sleep(600);
ok('a REAL tap on the gear under the daily sheet lands on its veil: daily closes, settings never opens',
  await ev(`!${H}.dailyC && !${H}.setC && !${H}.ascending`) === true);
ok('the meadow rests again', await until(RESTING, 8000));

/* ================= §4 THE TUTORIAL DOOR ================= */
console.log('— §4 the TUTORIAL row replays the tutorial —');
ok('the gear, then a real tap on the TUTORIAL row', await openSheet() && await ev(`(window.__tsc = ${H}.setC, true)`) === true
  && await tapUntil(`(${H}.setC && ${H}.setC.tutZone) || ${H}.setB`, `!${H}.setC && (${H}.ascending || game.scene.isActive('battle'))`, 3));
ok('the sheet stepped aside whole (its container — window, rows and veil — destroyed)',
  await ev(`!${H}.setC && !!window.__tsc && !window.__tsc.active && !window.__tsc.list.length`) === true);
ok('the rise began on the tap (the first open\'s own ascent)', await ev(`!!${H}.ascending || game.scene.isActive('battle')`) === true);
ok('…and lands in a battle on the opening deal', await until(PICK, 40000));
ok('an unsigned QUICK run carrying the tutorial (ftue), fight 1', await ev(`(() => { const b = ${B};
  return b.mode === 'quick' && b.ftue === true && b.sign === null && b.run.fightIdx === 0 && !b.resume })()`) === true);
ok('the opening deal is the authored English board, tile for tile', await ev(`${B}.board.map((s) => s.ch).join(' ')`) === FTUE.en.board.join(' '));
ok('the beacon marks it a replay of STAR', await ev(`window.__ssftue.replay === 1 && window.__ssftue.word === 'star'`) === true);
const night = await evj(`JSON.stringify((() => { const b = ${B}; return { on: b.f5Night, replay: b.f5Replay, beast: b.fights[0].id,
  words: b.f5G ? b.f5G.words.map((w) => w.join('')).join(',') : null, rig: b.f5Queue ? b.f5Queue.length : 0 } })())`);
ok('…and it is THE FIRST NIGHT (v0.125.0): f5Night on, marked a replay, VULPES pinned, the whole script standing, the rig loaded',
  night.on === true && night.replay === true && night.beast === 'vulpes' && night.words === 'star,moons,sky,tonight,halo,dawn' && night.rig > 0, JSON.stringify(night));
ok('the friendly finger rises on the first letter (S)', await until(`window.__ssftue.point === 'slot:9'`, 15000)
  && await until(`(() => { const h = ${B}.ftueHand; return !!h && h.alpha > 0.5 })()`, 6000));
await sleep(900);   // let the hand finish its rise for the capture
await shot('tutorial-board');
ok('…and walks: S taken, it glides to T', await tapUntil(`${B}.board[9].c`, `window.__ssftue.point === 'slot:7' && ${B}.sel.length === 1`));
await shot('tutorial-walk');
ok('nothing was re-owed: prof.ftue is still 1, in memory and on disk', await ev(`SS.prof.ftue === 1
  && JSON.parse(localStorage.getItem('beta3.profile')).ftue === 1`) === true);

/* ================= §5 THE WAY BACK: ‹ ================= */
console.log('— §5 the way back: the ‹ abandon —');
ok('a real tap on ‹ wakes the FULL meadow', await tapUntil(`${B}.homeB`, CHROME_FULL, 6) && await until(RESTING, 15000));
ok('…the standard one: no bare open, every door alive', await ev(`!${H}.ftueBare && ${H}.rowBtns.newcamp.visible
  && ${H}.rowBtns.endless.visible && ${H}.rowBtns.daily.visible && ${H}.setB.alpha > 0.5`) === true);
const back1 = await saved();
ok('CONTINUE GAME still lit, the campaign checkpoint byte-identical', back1.cont === true && back1.camp === CAMP && back1.contSub === before.contSub,
  back1.contSub);
ok('the endless climb byte-identical, no daily hunt invented', back1.endl === ENDL && back1.daily === before.daily);
ok('the first-open flag still down', back1.ftue === 1 && back1.ftueLS === 1);
await shot('home-after');
ok('the gear answers again, the TUTORIAL row in its place', await openSheet() && await ev(`!!${H}.setC.tutZone`) === true);
ok('…and its ✕ closes it', await tapUntil(`${H}.setC.list.find((o) => o.text === '✕')`, SHEETS_SHUT, 4));

/* ================= §5b THE NIGHT, REPLAYED (v0.125.0) ================= */
console.log('— §5b the TUTORIAL door replays the whole scripted night (real taps, start to farewell) —');
// the headless clock idles when input goes quiet — a harmless move keeps it ticking (first5-check's poke)
const poke = (i) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 30 + (i % 5), y: 30 + (i % 7) });
const NIGHT = `JSON.stringify((() => { const b = ${B}, g = window.__f5guide || {}, f = window.__ssftue || {};
  return { state: b.state, sel: b.sel.join(','), beat: g.beat, idx: g.idx, word: f.word, ft: f.state, pt: f.point,
    oc: g.orangeCell, bc: g.blueCell, gc: g.greenCell, shown: g.shown | 0, released: g.released | 0, ended: g.ended | 0, show: g.show || null,
    hp: b.beast ? b.beast.hpNow : null, cnt: b.beast ? b.beast.count : null, php: b.run.hp, words: b.run.words,
    gone: !!b.ftueGone, hand: !!(b.ftueHand && b.ftueHand.active), f5G: !!b.f5G, pill: b.strikeT.text, alarm: !!b.strikeAlarm,
    board: b.board.map((s) => (s ? s.ch + (s.tier ? '*' : '') : '_')).join(' '),
    strike: window.__f5strike || {}, mend: window.__f5mend || {}, scry: window.__f5scry || {},
    earn: window.__f5earn || {}, fade: window.__f5fade || {}, pr: window.__f5prompt || {},
    ink: window.__f5ink || {}, ssink: window.__ssink || null, blk: b.board.map((s, i) => (s && s.blk ? i : -1)).filter((i) => i >= 0).join(','),
    castT: b.castT.text, inkTaught: !!b.f5InkTaught, pose: b.f5G && b.f5G.pose ? { x: b.f5G.pose.x, y: b.f5G.pose.y, flip: !!b.f5G.pose.flip } : null,
    hpShown: Math.round(b.hpShown.v), hpHold: b.hpHold | 0, quickck: localStorage.getItem('beta3.quickck') } })())`;
const gs = () => evj(NIGHT);
// v0.126.0 THE TILE ECONOMY: what a held lesson DRAWS — the veil, the container
// (tagged f5earn / f5fade at the showcase's 950), its big cause text, its
// one-line frames (text + alpha, in order), the tile faces inside, the hand
const LESSON = (tag) => evj(`JSON.stringify((() => { const b = ${B}, l = b.L;
  const veil = b.children.list.find((o) => o.active && o.type === 'Image' && o.depth === 900 && o.texture && o.texture.key === 'veil');
  const c = b.children.list.find((o) => o.active && o.getData && o.getData('${tag}'));
  if (!c) return { c: false, veil: !!veil };
  const frames = c.list.filter((o) => o.f5W).map((f) => ({ s: f.list.find((t) => t.type === 'Text').text, a: +f.alpha.toFixed(2) }));
  const causeT = c.list.find((o) => o.type === 'Text');
  const faces = []; const scan = (ls) => ls.forEach((o) => { if (o.type === 'Image' && o.texture && /^tile\\d$/.test(o.texture.key)) faces.push(o.texture.key); if (o.list && !o.f5W) scan(o.list); });
  scan(c.list);
  const cb = causeT ? causeT.getBounds() : null, h = b.ftueHand;
  return { c: true, tag: c.getData('${tag}'), depth: c.depth, a: +c.alpha.toFixed(2), veil: !!veil, veilA: veil ? +veil.alpha.toFixed(2) : null,
    veilLive: !!(veil && veil.input && veil.input.enabled), cause: causeT ? causeT.text : null, causeIn: cb ? cb.left >= 0 && cb.right <= l.W : null,
    frames, faces, handDepth: h ? h.depth : null };
})())`);
// v0.127.0 THE BOSS BLACKOUT: what the lesson DRAWS — the veil, the two black
// tiles' twins (at their own seats, above it), the lines' container (its row,
// its frames, whether it covers a black tile), the hand's depth
const INKLESSON = () => evj(`JSON.stringify((() => { const b = ${B}, l = b.L, U = l.u(1);
  const veil = b.children.list.find((o) => o.active && o.type === 'Image' && o.depth === 900 && o.texture && o.texture.key === 'veil');
  const c = b.children.list.find((o) => o.active && o.getData && o.getData('f5ink'));
  const twins = b.children.list.filter((o) => o.active && o.getData && o.getData('f5inktile') != null);
  const frames = c ? c.list.filter((o) => o.f5W).map((f) => ({ s: f.list.find((t) => t.type === 'Text').text, a: +f.alpha.toFixed(2) })) : [];
  const fb = c ? c.getBounds() : null;
  const over = fb ? twins.some((t) => Phaser.Geom.Rectangle.Overlaps(fb, t.getBounds())) : null;
  const h = b.ftueHand;
  return { c: !!c, depth: c ? c.depth : null, cy: c ? Math.round((c.y - l.y(0)) / U) : null, row1: Math.round((b.slotPos(4).y - l.y(0)) / U), frames, over,
    inView: fb ? fb.left >= 0 && fb.right <= l.W : null, veil: !!veil, veilA: veil ? +veil.alpha.toFixed(2) : null, veilLive: !!(veil && veil.input && veil.input.enabled),
    twins: twins.map((t) => { const i = t.getData('f5inktile'), p = b.slotPos(i), s = b.board[i];
      return { i, d: t.depth, seat: Math.abs(t.x - p.x) < 1 && Math.abs(t.y - p.y) < 1, face: t.list[0].texture.key, size: Math.abs(t.list[0].displayWidth - b.tileSize) < 1,
        ch: s ? s.ch : null, blk: !!(s && s.blk) }; }).sort((x, y) => x.i - y.i),
    handDepth: h ? h.depth : null };
})())`);
// the hand's pose on a board cell, the walk's own geometry (tip beside the tile, a tenth of a tile up)
const poseOn = (s, i, flip) => evj(`JSON.stringify((() => { const b = ${B}, p = b.slotPos(${i}), ts = b.tileSize, q = ${JSON.stringify(s.pose)};
  return !!q && Math.abs(q.x - (p.x + (${flip} ? -1 : 1) * ts * 0.36)) < 1 && Math.abs(q.y - (p.y - ts * 0.10)) < 1 && q.flip === ${flip}; })())`);
// a probe tap that must land INSIDE a beat's floor: the beacon's stamp caught by
// a light, tight poll, the tap made only while the floor still stands (the
// page's own clock) — a harness that comes late (a DPR-3 capture, a loaded
// box) SKIPS the tap (one honest red) rather than letting the beat go and
// shifting every beat after it: v0.127.0's first published-bytes run sent the
// fade's probe 996 ms after the drain, past the 900 floor, and it released the
// night 3 s early (8 reds from one late tap)
const floorProbe = async (stamp, cap, room) => {
  const t0 = Date.now();
  while (Date.now() - t0 < cap) { if (await ev(`!!(${stamp})`)) break; await sleep(40); }
  const late = await ev(`(${stamp}) ? Date.now() - (${stamp}) : null`);
  const at = Date.now();
  if (late == null || late > room) return { tapped: false, late, at };
  await tapAt(195, 500);
  return { tapped: true, late, at };
};
const waitFor = async (pred, cap = 30000) => {
  const t = Date.now(); let i = 0;
  while (Date.now() - t < cap) { await poke(i++); try { const s = await gs(); if (pred(s)) return s; } catch (e) { } await sleep(250); }
  return null;
};
// follow the finger with REAL taps: the tile it points at, then CAST when it moves there
const walk = async (max = 40) => {
  for (let i = 0; i < max; i++) {
    await poke(i);
    const pt = await ev(`window.__ssftue ? window.__ssftue.point : null`);
    if (pt === 'cast') { await tap(`${B}.castB`); await sleep(300); return 'cast'; }
    if (pt && pt.startsWith('slot:')) { await tap(`${B}.board[${+pt.slice(5)}].c`); await sleep(420); continue; }
    await sleep(300);
  }
  return 'stuck';
};
const letGo = async () => { await sleep(400); await tapAt(195, 500); };   // a real tap on the lesson's veil, past its floor
await ev(`(window.__f5guide = null, window.__f5strike = null, window.__f5mend = null, window.__f5scry = null, window.__f5earn = null, window.__f5fade = null, window.__f5prompt = null, window.__f5ink = null, window.__ssink = null, 1)`);
ok('a fresh replay by real taps: the gear, TUTORIAL, the rise, the night\'s fight', await openSheet()
  && await tapUntil(`(${H}.setC && ${H}.setC.tutZone) || ${H}.setB`, `!${H}.setC && (${H}.ascending || game.scene.isActive('battle'))`, 3)
  && await until(PICK, 40000));
const n0 = await evj(`JSON.stringify((() => { const b = ${B}; return { on: b.f5Night, replay: b.f5Replay, ftue: b.ftue, beast: b.fights[0].id,
  hp: b.beast.hp, cnt: b.beast.count } })())`);
ok('…VULPES of the first night (84 hp, a six-cast fuse), the replay flagged', n0.on && n0.replay && n0.ftue && n0.beast === 'vulpes'
  && n0.hp === 84 && n0.cnt === 6, JSON.stringify(n0));
ok('…the finger rises on S again: a second replay in one visit, after §5\'s ‹ left the first mid-lesson (no stale hand — the v0.125.0 fix)',
  !!(await waitFor((s) => s.pt === 'slot:9' && s.hand, 15000)));
await sleep(2500);   // the deal's bounce settles before probe taps (house law)
ok('STAR, by real taps on the finger\'s road', await walk() === 'cast' && !!(await waitFor((s) => s.words === 1, 8000)));
const n1 = await waitFor((s) => s.beat === 'word' && s.idx === 1 && s.state === 'pick' && s.pt === 'slot:0', 20000);
ok('…the hand STAYS (no free-typing gap): word two is MOONS, the finger on its M', !!n1 && n1.word === 'moons' && n1.hand && !n1.gone,
  n1 ? n1.word + ' ' + n1.pt : 'never');
ok('MOONS, by real taps', await walk() === 'cast');
/* v0.126.0 THE TILE ECONOMY — how the ORANGE was earned, held before THE POINT */
let e1 = await waitFor((s) => s.beat === 'earn' && !!s.earn[1], 25000);
await sleep(1000); e1 = await gs();   // the pop-in, and the rule line rising 700 ms in
const v1 = await LESSON('f5earn');
ok('HOW THE ORANGE WAS EARNED (v0.126.0): the moment MOONS\'s refill lands it the fight HOLDS, before THE POINT — the tile as it landed (the S at cell 0, tier 1), "5 letters" in its own colour, the how line tied to the word just cast, then the rule',
  !!e1 && e1.idx === 1 && e1.ft === 'earn' && e1.oc === null && e1.earn[1].at === 0 && e1.earn[1].ch === 's' && e1.earn[1].tier === 1
  && e1.earn[1].word === 'MOONS' && e1.earn[1].letters === 5 && v1.c && v1.tag === 1 && v1.depth === 950 && v1.cause === '5 letters' && v1.causeIn
  && v1.faces.join() === 'tile1' && v1.frames.map((f) => f.s).join('|') === 'MOONS had 5 letters, so it earned this ORANGE tile.|Words of 5 or 6 letters earn an orange tile.'
  && v1.frames.every((f) => f.a >= 0.99), JSON.stringify({ idx: e1 && e1.idx, ft: e1 && e1.ft, earn: e1 && e1.earn[1], v1 }));
ok('…the light veil holds the board, the hand rests on the tile above it, and the orange\'s "+6" line waits for THE POINT (its arrival stayed quiet)',
  v1.veil && v1.veilA >= 0.3 && v1.veilLive && v1.handDepth === 960 && /^pose:/.test(e1.pt) && !(e1.pr.tile1 | 0),
  JSON.stringify({ veilA: v1.veilA, live: v1.veilLive, hand: v1.handDepth, pt: e1.pt, tile1: e1.pr.tile1 }));
await shot('night-orange-earned');
await tap(`${B}.board[5].c`);   // past the floor: a real tap AIMED AT A BOARD TILE
const e1b = await waitFor((s) => (s.earn.lifted | 0) >= 1 && s.beat === 'point', 8000);
ok('…a real tap past its floor lets it go without touching the board (the tile under the veil never taken) — THE POINT follows as shipped and says the +6 there, once',
  !!e1b && e1b.earn[1].released === 'tap' && e1b.earn[1].holdMs >= 900 && e1b.sel === '' && (e1b.pr.tile1 | 0) === 1 && e1b.idx === 2,
  e1b ? JSON.stringify({ released: e1b.earn[1].released, holdMs: e1b.earn[1].holdMs, sel: e1b.sel, tile1: e1b.pr.tile1, idx: e1b.idx }) : 'never');
let n2 = await waitFor((s) => s.beat === 'point' && s.idx === 2, 25000);
await sleep(700); n2 = await gs();
ok('THE ORANGE: MOONS forged it onto cell 0, the hand resting on it, its +6 said — the word SKY, VULPES 70',
  n2.oc === 0 && n2.pt === 'slot:0' && n2.ft === 'orange' && n2.word === 'sky' && n2.hp === 70, JSON.stringify({ oc: n2.oc, pt: n2.pt, ft: n2.ft, word: n2.word, hp: n2.hp }));
await shot('night-orange-arrives');
await tap(`${B}.board[0].c`);
ok('…the pointed orange IS SKY\'s first tap', !!(await waitFor((s) => s.beat === 'word' && s.sel === '0', 5000)));
ok('SKY, by real taps', await walk() === 'cast');
let n3 = await waitFor((s) => s.shown >= 1, 20000);
await sleep(700); n3 = await gs();
ok('THE ORANGE SHOWCASE holds the fight: SKY hit 16, the same word plain 10 — the orange +6 — the hand on the number',
  !!n3.show && n3.show.dmg === 16 && n3.show.plain === 10 && n3.show.extra === 6 && n3.show.tier === 1 && n3.state === 'anim' && /^pose:/.test(n3.pt), JSON.stringify(n3.show));
await shot('night-orange');
await letGo();
ok('…a real tap past its floor lets it go', !!(await waitFor((s) => s.released >= 1, 6000)));
let n4 = await waitFor((s) => s.beat === 'scry' && (s.scry.armed | 0) >= 1, 25000);
await sleep(800); n4 = await gs();
ok('THE SCRY GATE on the script\'s own beat: the screen grayed, SCRY alone lit, the finger ON it, the fuse at 3',
  n4.pt === 'scry' && (n4.scry.scripted | 0) === 1 && n4.cnt === 3 && / 3 /.test(n4.pill), JSON.stringify({ pt: n4.pt, scripted: n4.scry.scripted, cnt: n4.cnt, pill: n4.pill }));
await shot('night-scry-gate');
await tap(`${B}.scryB`);
const n5 = await waitFor((s) => !!s.scry.down, 8000);
ok('…a real tap on SCRY: a fresh board, and the fuse STEPS 3 → 2 in the light (its cost, shown)', !!n5 && n5.scry.down[0] === 3 && n5.scry.down[1] === 2,
  n5 ? JSON.stringify(n5.scry.down) : 'never');
await sleep(1500); await tapAt(195, 500);   // past the reveal's 1.4 s floor
ok('…the gate lifts and the hand stays: word four is TONIGHT', !!(await waitFor((s) => (s.scry.lifted | 0) >= 1, 8000))
  && !!(await waitFor((s) => s.beat === 'word' && s.idx === 3 && s.state === 'pick' && s.word === 'tonight', 15000)));
ok('TONIGHT, by real taps (seven letters — the forge of a BLUE)', await walk() === 'cast');
/* v0.126.0 THE TILE ECONOMY — how the BLUE was earned, held before its POINT */
let e2 = await waitFor((s) => s.beat === 'earn' && !!s.earn[2], 25000);
await sleep(1000); e2 = await gs();
const v2 = await LESSON('f5earn');
ok('HOW THE BLUE WAS EARNED (v0.126.0): TONIGHT\'s refill lands the blue (the H at cell 1, tier 2) and the fight HOLDS before its POINT — "7 letters" in blue, the how line tied to TONIGHT, then the orange/blue rule in one breath; the hand on the tile, the ×1.5 line still unsaid',
  !!e2 && e2.idx === 3 && e2.ft === 'earn' && e2.bc === null && e2.earn[2].at === 1 && e2.earn[2].ch === 'h' && e2.earn[2].tier === 2
  && e2.earn[2].word === 'TONIGHT' && e2.earn[2].letters === 7 && v2.c && v2.tag === 2 && v2.depth === 950 && v2.cause === '7 letters' && v2.causeIn
  && v2.faces.join() === 'tile2' && v2.frames.map((f) => f.s).join('|') === 'TONIGHT had 7 letters, so it earned this BLUE tile.|5 or 6 letters earn orange. 7 or more earn blue.'
  && v2.frames.every((f) => f.a >= 0.99) && v2.veil && v2.handDepth === 960 && /^pose:/.test(e2.pt) && !(e2.pr.tile2 | 0),
  JSON.stringify({ idx: e2 && e2.idx, ft: e2 && e2.ft, earn: e2 && e2.earn[2], v2, tile2: e2 && e2.pr.tile2 }));
await shot('night-blue-earned');
await letGo();
const e2b = await waitFor((s) => (s.earn.lifted | 0) >= 2 && s.beat === 'point' && s.idx === 4, 8000);
ok('…a real tap past its floor lets it go — the blue\'s POINT follows and says the ×1.5 there, once',
  !!e2b && e2b.earn[2].released === 'tap' && (e2b.pr.tile2 | 0) === 1, e2b ? JSON.stringify({ released: e2b.earn[2].released, tile2: e2b.pr.tile2 }) : 'never');
let n6 = await waitFor((s) => s.beat === 'point' && s.idx === 4, 25000);
await sleep(700); n6 = await gs();
ok('THE BLUE: TONIGHT forged it onto cell 1 as the fuse burned 2 → 1 (the ember alarm), the hand on it — the word HALO, VULPES 33',
  n6.bc === 1 && n6.pt === 'slot:1' && n6.word === 'halo' && n6.hp === 33 && n6.cnt === 1 && n6.alarm, JSON.stringify({ bc: n6.bc, pt: n6.pt, word: n6.word, hp: n6.hp, cnt: n6.cnt, alarm: n6.alarm }));
await tap(`${B}.board[1].c`);
ok('…the pointed blue IS HALO\'s first tap', !!(await waitFor((s) => s.beat === 'word' && s.sel === '1', 5000)));
ok('HALO, by real taps', await walk() === 'cast');
let n7 = await waitFor((s) => s.shown >= 2, 20000);
await sleep(1100); n7 = await gs();
ok('THE BLUE SHOWCASE: HALO hit 12, the same word plain 8 — the WHOLE word ×1.5 — the hand on the number',
  !!n7.show && n7.show.dmg === 12 && n7.show.plain === 8 && n7.show.tier === 2 && n7.state === 'anim' && /^pose:/.test(n7.pt), JSON.stringify(n7.show));
await shot('night-blue');
await letGo();
ok('…a real tap past its floor lets it go — and the blue word\'s own tick IS the strike', !!(await waitFor((s) => s.released >= 2, 6000)));
let n8 = await waitFor((s) => (s.strike.shown | 0) >= 1, 20000);
await sleep(900); n8 = await gs();
ok('THE BEAST STRIKES, held: VULPES\'s 8 lands in truth (50 → 42) while the bar HOLDS at 50, the crimson −8 lit above the veil, the hand on it',
  !!n8 && n8.strike.hit === 8 && n8.strike.before === 50 && n8.strike.after === 42 && n8.php === 42 && n8.hpShown === 50 && n8.hpHold === 1 && /^pose:/.test(n8.pt),
  JSON.stringify({ strike: n8.strike, php: n8.php, hpShown: n8.hpShown, pt: n8.pt }));
await shot('night-strike');
let n9 = await waitFor((s) => (s.strike.landed | 0) >= 1, 12000);
await sleep(600); n9 = await gs();
ok('…the number lands and the bar DRAINS 50 → 42 in the light, the hand onto it', !!n9 && n9.hpShown === 42 && n9.hpHold === 0 && /^pose:/.test(n9.pt),
  JSON.stringify({ hpShown: n9.hpShown, hpHold: n9.hpHold, pt: n9.pt }));
await shot('night-strike-drain');
await letGo();
ok('…a real tap past its floor lifts it (the fuse re-armed at 6)', !!(await waitFor((s) => (s.strike.lifted | 0) >= 1 && s.cnt === 6, 8000)));
/* v0.126.0 THE TILE ECONOMY — how the GREEN was earned (Skylar's point 7: "It's because he got attacked by the beast") */
let e3 = await waitFor((s) => s.beat === 'earn' && !!s.earn[3], 20000);
await sleep(1000); e3 = await gs();
const v3 = await LESSON('f5earn');
ok('HOW THE GREEN WAS EARNED (v0.126.0): the dew the blow left (the D at cell 1, tier 3) holds the fight before its POINT — the blow\'s "−8" in crimson beside it, "The beast hit you, so you earned this GREEN tile." then the rule; the hand on the tile, the heal line still unsaid',
  !!e3 && e3.idx === 4 && e3.ft === 'earn' && e3.gc === null && e3.earn[3].at === 1 && e3.earn[3].ch === 'd' && e3.earn[3].tier === 3 && e3.earn[3].hit === 8
  && v3.c && v3.tag === 3 && v3.cause === '−8' && v3.faces.join() === 'tile3'
  && v3.frames.map((f) => f.s).join('|') === 'The beast hit you, so you earned this GREEN tile.|Every time the beast hits you, you get a green tile.'
  && v3.frames.every((f) => f.a >= 0.99) && v3.veil && v3.handDepth === 960 && /^pose:/.test(e3.pt) && !(e3.pr.tile3 | 0),
  JSON.stringify({ idx: e3 && e3.idx, ft: e3 && e3.ft, earn: e3 && e3.earn[3], v3, tile3: e3 && e3.pr.tile3 }));
await shot('night-green-earned');
const e3b = await waitFor((s) => (s.earn.lifted | 0) >= 3 && s.beat === 'point' && s.idx === 5, 9000);
const earnMs = await ev('SS_F5_EARN_SHOW_MS');
ok('…untapped, it lets go by its own dwell (' + earnMs + ' ms of game-loop time, §1 pins it to its dial) — the green\'s POINT follows and says the heal there, once',
  !!e3b && e3b.earn[3].released === 'dwell' && e3b.earn[3].holdMs >= earnMs * 0.95 && (e3b.pr.tile3 | 0) === 1,
  e3b ? JSON.stringify({ released: e3b.earn[3].released, holdMs: e3b.earn[3].holdMs, tile3: e3b.pr.tile3 }) : 'never');
let n10 = await waitFor((s) => s.beat === 'point' && s.idx === 5, 20000);
await sleep(700); n10 = await gs();
ok('THE GREEN: the dew the blow earned, pinned on DAWN\'s D at cell 1, the hand on it — the player at 42',
  n10.gc === 1 && n10.pt === 'slot:1' && n10.word === 'dawn' && n10.php === 42, JSON.stringify({ gc: n10.gc, pt: n10.pt, word: n10.word, php: n10.php }));
await tap(`${B}.board[1].c`);
ok('…the pointed green IS DAWN\'s first tap', !!(await waitFor((s) => s.beat === 'word' && s.sel === '1', 5000)));
ok('DAWN, by real taps', await walk() === 'cast');
const n11 = await waitFor((s) => s.shown >= 3, 20000);
ok('THE MEND holds the fight: DAWN healed ♥6 in truth (42 → 48) while the bar HOLDS at 42',
  !!n11 && !!n11.show && n11.show.tier === 3 && n11.show.heal === 6 && n11.show.before === 42 && n11.show.after === 48 && n11.php === 48 && n11.hpShown === 42,
  n11 ? JSON.stringify({ show: n11.show, php: n11.php, hpShown: n11.hpShown }) : 'never');
let n12 = await waitFor((s) => (s.mend.risen | 0) >= 1, 12000);
await sleep(500); n12 = await gs();
ok('…the bar RISES 42 → 48 in the light, the hand onto it', !!n12 && n12.hpShown === 48 && /^pose:/.test(n12.pt), JSON.stringify({ hpShown: n12.hpShown, pt: n12.pt }));
await shot('night-heal');
await letGo();
/* v0.126.0 THE TILE ECONOMY — use it or lose it: the words spent, the hand holds the night once more before it lets go */
const fadeAt = await ev('SS_F5_FADE_AT_MS'), fadeMs = await ev('SS_F5_FADE_SHOW_MS'), floorMs = await ev('SS_F5_SHOW_FLOOR_MS');
let f1 = await waitFor((s) => s.beat === 'fade' && (s.fade.shown | 0) >= 1, 20000);
// the capture FIRST, the game asleep while its frame is taken (the colours
// standing, the drain still SS_F5_FADE_AT_MS of game time away) — so it can
// never carry the two timed taps below past their windows (it did, taken
// between them, on a loaded box: v0.127.0)
await shot('night-fade');
const vf1 = await LESSON('f5fade');   // read at once: the colours drain SS_F5_FADE_AT_MS in
f1 = await gs();
const tTap1 = Date.now();
const tapped1 = await ev(`!(window.__f5fade && window.__f5fade.drainAt)`);   // still before the drain?
if (tapped1) await tapAt(195, 500);   // too soon: before the drain (and its floor) a tap is nothing
ok('USE IT OR LOSE IT (v0.126.0): after the mend, before the farewell, the fight HOLDS on the night\'s three colored tiles as the player used them (the orange S, the blue H, the green D) and the rule — Skylar\'s words, made exact',
  !!f1 && f1.ft === 'fade' && f1.hand && !f1.gone && f1.idx === 5 && f1.fade.tiles === 's1 h2 d3' && (f1.fade.drained | 0) === 0
  && vf1.c && vf1.tag === 3 && vf1.depth === 950 && vf1.faces.join() === 'tile1,tile2,tile3' && vf1.veil && vf1.veilLive && vf1.handDepth === 960 && /^pose:/.test(f1.pt)
  && vf1.frames.length === 2 && vf1.frames[0].s === 'If you don\'t use a colored tile on your turn…' && vf1.frames[0].a >= 0.99 && vf1.frames[1].a === 0,
  JSON.stringify({ ft: f1 && f1.ft, idx: f1 && f1.idx, fade: f1 && f1.fade, vf1 }));
// the drain begins — still too soon: a tap inside the drain's floor
const p2 = await floorProbe(`window.__f5fade && window.__f5fade.drainAt`, 8000, floorMs - 300);
const tTap2 = p2.at;
const f2 = await waitFor((s) => (s.fade.drained | 0) === 3, 6000);
const f2b = await gs();
ok('…the colours DRAIN in the light; a real tap before the drain and another inside its floor were both refused (the beat holds)',
  !!f2 && tapped1 && p2.tapped && f2b.beat === 'fade' && !f2b.fade.released && f2b.fade.drainAt > tTap1 && tTap2 - f2b.fade.drainAt < floorMs,
  f2 ? JSON.stringify({ beat: f2b.beat, released: f2b.fade.released, tapped: [tapped1, p2.tapped], tap1BeforeDrain: f2b.fade.drainAt - tTap1, tap2AfterDrain: tTap2 - f2b.fade.drainAt, probeLate: p2.late }) : 'never');
await sleep(900);   // the loss line rises 600 ms after the drain
const vf2 = await LESSON('f5fade');
const f3 = await gs();
ok('…each replica wears its plain face now, the chips fell to the letters\' own worth (S 7 → 1 · H 4 · D ♥6 → 2), and the loss is said: "…its color disappears. The letter stays, plain."',
  vf2.c && vf2.faces.filter((k) => k === 'tile0').length === 3 && f3.fade.chips === '7→1 4→4 ♥6→2'
  && vf2.frames.map((f) => f.s).join('|') === 'If you don\'t use a colored tile on your turn…|…its color disappears. The letter stays, plain.' && vf2.frames.every((f) => f.a >= 0.99),
  JSON.stringify({ faces: vf2.faces, chips: f3.fade.chips, frames: vf2.frames }));
await shot('night-fade-drained');
const f4 = await waitFor((s) => (s.fade.lifted | 0) >= 1, fadeMs + 6000);
// the dwell is game-loop time (§1 pins it to its dial): Phaser's smoothed frame
// delta can run a few % off the raw clock on a loaded headless box (4127–4384 ms
// measured for the 4200), so the clocks are held to 95% of the dial
ok('…untapped, it HOLDS its slowed duration — ' + fadeAt + ' ms before the drain, then ' + fadeMs + ' ms from it — and lets go by its own dwell',
  !!f4 && f4.fade.released === 'dwell' && f4.fade.holdMs >= fadeMs * 0.95 && f4.fade.liftedAt - f4.fade.drainAt >= fadeMs * 0.95
  && f4.fade.drainAt - f4.fade.shownAt >= fadeAt * 0.95, f4 ? JSON.stringify({ released: f4.fade.released, holdMs: f4.fade.holdMs,
    wallFromDrain: f4.fade.liftedAt - f4.fade.drainAt, wallToDrain: f4.fade.drainAt - f4.fade.shownAt }) : 'never');
/* v0.127.0 THE BOSS BLACKOUT — the bosses' own volley, the lesson held, the black tile's word, THE ZERO */
const inkAtMs = await ev('SS_F5_INK_AT_MS'), inkMs = await ev('SS_F5_INK_SHOW_MS'), tourMs = await ev('SS_F5_INK_TOUR_MS');
const k0 = await waitFor((s) => s.beat === 'ink' && (s.ink.armed | 0) >= 1, 20000);
ok('THE BOSS BLACKOUT (v0.127.0): the colours spent, the fight does not let go — the beast throws the bosses\' volley, the hand backed off to wait it out (the lock holds)',
  !!k0 && k0.ft === 'ink' && k0.idx === 5 && k0.hand && !k0.gone && k0.pt === 'wait' && k0.ink.word === 'pen',
  k0 ? JSON.stringify({ ft: k0.ft, idx: k0.idx, pt: k0.pt, word: k0.ink.word }) : 'never');
await sleep(450);
await shot('night-ink-volley');
const k1 = await waitFor((s) => !!s.ink.volley && s.blk === '2,15', 8000);
const inked = k1 ? await evj(`JSON.stringify([2, 15].map((i) => { const b = ${B}, s = b.board[i];
  return { ch: s.ch, blk: !!s.blk, tier: s.tier, face: s.img.texture.key, chip0: s.val.texture.key === ssGlyphVal(b, 0, SS_BLK_VINK), ink: s.letter.texture.key === ssGlyph(b, s.ch, SS_BLK_INK) }; }))`) : [];
ok('…the scripted letters are BLACKED, the same two for every player — P (cell 2) and M (cell 15), the two the bosses\' rule picks on this board (its best plain letters, 3 points each); real blackTile: each keeps its letter in the pale ink on the dark face, its chip a flat 0',
  !!k1 && !!k1.ssink && k1.ssink.n === 2 && k1.ssink.tiles.join(',') === '2,15' && k1.ink.volley.tiles.join(',') === '2,15'
  && inked.map((t) => t.ch).join('') === 'pm' && inked.every((t) => t.blk && t.tier === 0 && t.face === 'tileblk' && t.chip0 && t.ink),
  JSON.stringify({ volley: k1 && k1.ink.volley, blk: k1 && k1.blk, inked }));
ok('…the shipped ink prompt stayed quiet under the script (the lesson says it), and the live "inked · worth nothing" spoke over the first one',
  !!k1 && !(k1.pr.ink | 0) && await ev(`${B}.run.inkShown === true`) === true, JSON.stringify({ ink: k1 && k1.pr.ink }));
const pK = await floorProbe(`window.__f5ink && window.__f5ink.shownAt`, inkAtMs + 9000, floorMs - 300);   // too soon: inside the lesson's floor
const k2 = pK.late != null;
await sleep(450);   // the pop-in (the rule line rises 700 ms in)
const vk1 = await INKLESSON();
const k2b = await gs();
ok('THE LESSON holds once the ink has pooled: the light veil, the two black tiles lifted into the light where they stand (twins at their own seats, the dark face at the board\'s size, above the veil), "Some bosses can black out a few of your letters." on the row the ink left alone (row 1), covering neither black tile',
  !!k2 && vk1.c && vk1.depth === 950 && vk1.veil && vk1.veilA >= 0.3 && vk1.veilLive && vk1.twins.length === 2
  && vk1.twins.map((t) => t.i + t.ch).join(' ') === '2p 15m' && vk1.twins.every((t) => t.d === 905 && t.seat && t.face === 'tileblk' && t.size && t.blk)
  && vk1.cy === vk1.row1 && k2b.ink.row === 1 && vk1.over === false && vk1.inView && vk1.frames.length === 2
  && vk1.frames[0].s === 'Some bosses can black out a few of your letters.' && vk1.frames[0].a >= 0.99 && vk1.handDepth === 960,
  JSON.stringify({ vk1, row: k2b.ink.row }));
ok('…the hand points at the black tiles in turn — first the M (cell 15, from its left)', /^pose:/.test(k2b.pt) && (k2b.ink.tour || []).join(',') === '15,2'
  && await poseOn(k2b, 15, true) === true, JSON.stringify({ pt: k2b.pt, tour: k2b.ink.tour, pose: k2b.pose }));
await shot('night-ink');
const k3 = await waitFor((s) => (s.ink.toured | 0) >= 1, tourMs + 6000);
await sleep(600);
const vk2 = await INKLESSON();
const k3b = await gs();
const floorK = await ev('SS_F5_SHOW_FLOOR_MS');
ok('…then rests on the P (cell 2), PEN\'s first tap, with the rule beneath: "You can still use them in words, but they score no points." — a tap inside its floor refused, the lesson holding',
  !!k3 && k3b.beat === 'ink' && !k3b.ink.released && await poseOn(k3b, 2, true) === true
  && vk2.frames.map((f) => f.s).join('|') === 'Some bosses can black out a few of your letters.|You can still use them in words, but they score no points.'
  && vk2.frames.every((f) => f.a >= 0.99) && pK.tapped && pK.at - k2b.ink.shownAt < floorK,
  JSON.stringify({ beat: k3b.beat, released: k3b.ink.released, pose: k3b.pose, frames: vk2.frames, tapped: pK.tapped, tapAfterRise: pK.at - k2b.ink.shownAt }));
await shot('night-ink-lesson');
const k4 = await waitFor((s) => (s.ink.lifted | 0) >= 1, inkMs + 6000);
ok('…untapped, it HOLDS its slowed duration (' + inkMs + ' ms of game-loop time, §1 pins it to its dial) and lets go by its own dwell',
  !!k4 && k4.ink.released === 'dwell' && k4.ink.holdMs >= inkMs * 0.95 && k4.ink.liftedAt - k4.ink.shownAt >= inkMs * 0.95,
  k4 ? JSON.stringify({ released: k4.ink.released, holdMs: k4.ink.holdMs, wall: k4.ink.liftedAt - k4.ink.shownAt }) : 'never');
const k5 = await waitFor((s) => s.beat === 'word' && s.idx === 6 && s.state === 'pick' && s.pt === 'slot:2', 10000);
ok('THE BLACK TILE\'S WORD: the lift adds PEN to the script, the finger on the BLACK P (cell 2) — the black tile first',
  !!k5 && k5.word === 'pen' && k5.hand && !k5.gone, k5 ? JSON.stringify({ word: k5.word, pt: k5.pt, idx: k5.idx }) : 'never');
const ref0 = await ev(`(window.__f5guide || {}).refused | 0`);
await tap(`${B}.board[15].c`);
await sleep(500);
ok('…a real tap on the OTHER black tile is refused (the road is the P)', await ev(`(window.__f5guide || {}).refused | 0`) === ref0 + 1
  && await ev(`${B}.sel.length === 0`) === true);
for (let i = 0; i < 8; i++) {
  await poke(i);
  const pt = await ev(`window.__ssftue ? window.__ssftue.point : null`);
  if (pt === 'cast') break;
  if (pt && pt.startsWith('slot:')) { await tap(`${B}.board[${+pt.slice(5)}].c`); await sleep(420); } else await sleep(300);
}
const k6 = await gs();
ok('…PEN woven by real taps on the finger\'s road (P · E · N = cells 2 · 9 · 6), and CAST tells the truth before it flies: 2',
  k6.sel === '2,9,6' && k6.pt === 'cast' && k6.castT === 'CAST 2', JSON.stringify({ sel: k6.sel, pt: k6.pt, castT: k6.castT }));
await tap(`${B}.castB`);
let z1 = await waitFor((s) => !!s.ink.zero, 20000);
await sleep(700); z1 = await gs();
const vz = await evj(`JSON.stringify((() => { const b = ${B}; const c = b.children.list.find((o) => o.active && o.getData && o.getData('f5inkshow'));
  if (!c) return { c: false };
  const faces = []; const scan = (ls) => ls.forEach((o) => { if (o.type === 'Image' && o.texture && /^tile/.test(o.texture.key)) faces.push(o.texture.key); if (o.list && !o.f5W) scan(o.list); });
  scan(c.list);
  return { c: true, depth: c.depth, num: (c.list.find((o) => o.type === 'Text') || {}).text || null, faces,
    frames: c.list.filter((o) => o.f5W).map((f) => f.list.find((t) => t.type === 'Text').text) } })())`);
ok('THE ZERO holds the fight: PEN hit 2 where the clean word hits 5 — the black P\'s 3 points void, wordDamage\'s own blackout law (the letter spelled, it paid nothing) — VULPES 12 → 10',
  !!z1 && z1.ink.zero.word === 'pen' && z1.ink.zero.ch === 'p' && z1.ink.zero.dmg === 2 && z1.ink.zero.plain === 5 && z1.hp === 10 && z1.state === 'anim' && !!z1.show && z1.show.ink === 1,
  z1 ? JSON.stringify({ zero: z1.ink.zero, hp: z1.hp, state: z1.state }) : 'never');
ok('…"+0" beside the black tile in the ink\'s own pale voice, "That black tile added nothing: 2 damage, not 5.", the hand on the number',
  vz.c && vz.depth === 950 && vz.num === '+0' && vz.faces.join() === 'tileblk' && vz.frames.join('|') === 'That black tile added nothing: 2 damage, not 5.' && /^pose:/.test(z1.pt),
  JSON.stringify({ vz, pt: z1.pt }));
await shot('night-ink-zero');
await letGo();
ok('…a real tap past its floor lets it go', !!(await waitFor((s) => s.released >= 4, 6000)));
const n13 = await waitFor((s) => s.ended >= 1 && s.gone && s.state === 'pick', 20000);
ok('THE FAREWELL: the hand retires for good (the script done) — VULPES 10, the player 48, the fuse at 4, the first fight the player\'s after seven words',
  !!n13 && !n13.f5G && n13.ft === 'done' && n13.hp === 10 && n13.php === 48 && n13.words === 7 && n13.cnt === 4,
  n13 ? JSON.stringify({ f5G: n13.f5G, ft: n13.ft, hp: n13.hp, php: n13.php, words: n13.words, cnt: n13.cnt }) : 'never');
ok('…on the board the script authored for everyone (S O H R · A L N I · G O T E · D E A M — NIGHT and LIGHT stand in it), the M still black: the real curse, there to route around; fight 2\'s taste stood down',
  !!n13 && n13.board === 's o h r a l n i g o t e d e a m' && n13.blk === '15' && n13.inkTaught,
  n13 ? JSON.stringify({ board: n13.board, blk: n13.blk, taught: n13.inkTaught }) : 'never');
ok('…and the whole night wrote no pocket (beta3.quickck absent)', !!n13 && n13.quickck === null);

/* ================= §5c THE REPLAY KEEPS NO POCKET ================= */
console.log('— §5c the replay keeps no pocket: the fell, the pick, a cold reboot —');
const fellNight = async () => {
  await until(`!!${B} && !${B}.dying && ${B}.state === 'pick'`, 25000, 250);
  await ev(`(() => { const b = ${B}; b.beast.hpNow = -1; b.dying = true; b.beastDeath(); return 1 })()`);
  return until(`${B}.state === 'sigil' && ${B}.overlayC.list.some((o) => o.getData && o.getData('sigilCard') && o.alpha === 1)`, 40000, 250);
};
ok('VULPES falls by the real death path — the lighting rite, then the pick', await fellNight());
ok('…no pocket at the fell (a first night\'s own run would hold fight two here)', await ev(`localStorage.getItem('beta3.quickck') === null && ${B}.run.fightIdx === 1`) === true);
const trio = await ev(`(() => { const ids = []; const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('sigilDesc')) ids.push(o.getData('sigilDesc'));
  if (o.list) scan(o.list); }); scan(${B}.overlayC.list); return ids.slice().sort().join(',') })()`);
ok('…the first pick is the night\'s curated trio (QUILL / SALVE / FIRST LIGHT)', trio === 'first,quill,salve', trio);
await tap(`(() => { let r = null; const scan = (ls) => ls.forEach((o) => { if (!r && o.getData && o.getData('sigilCard')) r = o; if (o.list) scan(o.list); }); scan(${B}.overlayC.list); return r })()`);
ok('…the card taken (a curated one), fight two dealt — and still no pocket', await until(`${B}.state === 'pick' && ${B}.run.fightIdx === 1`, 30000)
  && await ev(`['quill', 'salve', 'first'].includes(${B}.run.sigils[0]) && localStorage.getItem('beta3.quickck') === null`) === true,
  await ev(`${B}.run.sigils.join(',')`));
const lit = await ev(`JSON.stringify((SS.prof && SS.prof.f5lit) || [])`);
// an app killed mid-replay: a COLD boot (no skip flag — the pocket door is read on a cold open)
await send('Page.navigate', { url: ORIGIN + '/ascent.html' }); await sleep(450);
await ev(`sessionStorage.removeItem('beta3.skipIntro'); 'ok'`);
await send('Page.navigate', { url: BASE + '?fps=0' });
await until(`window.__ssftue !== undefined`, 20000, 150);
ok('a cold reboot after the killed replay wakes on the full meadow — no first open, no pocket resume', await until(RESTING, 60000)
  && await ev(`window.__ssftue.on === false && !game.scene.isActive('battle') && localStorage.getItem('beta3.quickck') === null`) === true);
await sleep(3000);
ok('…and stays there (nothing knocks a held night back in)', await ev(`!game.scene.isActive('battle') && !${H}.ascending`) === true);
const back4 = await saved();
ok('…the campaign and the climb byte-identical, CONTINUE GAME lit, nothing owed', back4.camp === CAMP && back4.endl === ENDL
  && back4.cont === true && back4.ftue === 1 && back4.ftueLS === 1);
ok('the veteran\'s meadow wears no lit-sky mark, though the replay lit ' + lit + ' (the lit sky is its first night\'s owner\'s)',
  /vulpes/.test(lit) && await ev(`!SS.prof.f5night && ${H}.children.list.filter((o) => o.getData && o.getData('f5mark')).length === 0`) === true);
await shot('home-after-night');

/* ================= §6 A REPLAY PLAYED OUT, THEN NORMAL PLAY ================= */
console.log('— §6 a replay played to its end, then normal play —');
const fell = async () => {
  await until(`!!${B} && !${B}.dying && ${B}.state === 'pick'`, 25000, 250);
  const armed = await ev(`(() => { const b = ${B}; if (b.dying) return 'busy';
    b.beast.hpNow = -1; b.dying = true; b.beastDeath(); return 'ok' })()`);
  if (armed !== 'ok') return 'lost';
  const landed = await until(`(${B}.state === 'sigil' && ${B}.overlayC.list.some((o) => o.getData && o.getData('sigilCard') && o.alpha === 1))
    || ${B}.state === 'upgrade' || ${B}.state === 'end' || (${B}.state === 'pick' && !${B}.dying)`, 30000, 250);
  if (!landed) return 'lost';
  return ev(`${B}.state`);
};
const takeCard = async () => {
  for (let t = 0; t < 6; t++) {
    await tap(`(() => { let r = null; const scan = (ls) => ls.forEach((o) => { if (!r && o.getData && o.getData('sigilCard')) r = o; if (o.list) scan(o.list); }); scan(${B}.overlayC.list); return r })()`);
    await sleep(450);
    if (await ev(`${B}.state !== 'sigil' && ${B}.state !== 'upgrade'`)) return true;
  }
  return ev(`${B}.state !== 'sigil' && ${B}.state !== 'upgrade'`);
};
const endText = (s) => `(() => { let r = null; const scan = (ls) => ls.forEach((o) => { if (!r && o.text === ${JSON.stringify(s)}) r = o;
  if (o.list) scan(o.list); }); scan(${B}.overlayC.list); return r })()`;
// a replay by real taps, played through the real death path to its end screen
const replayToEnd = async (n) => {
  ok('replay ' + n + ', by real taps: the tutorial board again', await openSheet()
    && await tapUntil(`(${H}.setC && ${H}.setC.tutZone) || ${H}.setB`, `!${H}.setC && (${H}.ascending || game.scene.isActive('battle'))`, 3)
    && await until(PICK, 40000) && await ev(`${B}.ftue === true && ${B}.board.map((s) => s.ch).join(' ')`) === FTUE.en.board.join(' '));
  let state = '', fells = 0;
  while (state !== 'end' && fells++ < 9) {
    state = await fell();
    if (state === 'sigil' || state === 'upgrade') { await takeCard(); state = await ev(`${B}.state`); }
    if (state === 'lost') break;
  }
  ok('replay ' + n + ' reaches its end screen (' + fells + ' fells) and still owes nothing (prof.ftue 1)',
    state === 'end' && await ev(`SS.prof.ftue === 1`) === true);
  await sleep(2500);   // the fanfare holds the window's buttons inert
};
await replayToEnd(2);
await shot('tutorial-end');
const homeT = await ev(`SS_T('home')`);
ok("the end screen's HOME — the tutorial's own exit — brings the full meadow down", await tapUntil(endText(homeT), CHROME_FULL, 8)
  && await until(RESTING, 30000));
const back2 = await saved();
ok('…CONTINUE GAME lit, the campaign and the climb byte-identical, nothing owed',
  back2.camp === CAMP && back2.endl === ENDL && back2.cont === true && back2.ftue === 1 && back2.ftueLS === 1);
await replayToEnd(3);
const newRun = await ev(`SS_T('newRun')`);
ok('NEW RUN deals a PLAIN quick game: no tutorial, no finger, the bag\'s own deal', await tapUntil(endText(newRun),
  `${B}.state !== 'end' && ${B}.run && ${B}.run.fightIdx === 0`, 8) && await until(PICK, 40000)
  && await ev(`${B}.mode === 'quick' && ${B}.ftue === false && ${B}.f5Night === false && !${B}.f5Replay && !${B}.f5G`) === true);
await sleep(2600);   // the finger would have risen by 1.5 s
ok('…and the finger never comes', await ev(`!${B}.ftueHand && ${B}.board.map((s) => s.ch).join(' ') !== ${JSON.stringify(FTUE.en.board.join(' '))}`) === true);
ok('‹ home from the plain game: the full meadow', await tapUntil(`${B}.homeB`, CHROME_FULL, 6) && await until(RESTING, 15000));
const back3 = await saved();
ok('after it all: the campaign and the climb byte-identical, CONTINUE GAME lit, nothing owed',
  back3.camp === CAMP && back3.endl === ENDL && back3.cont === true && back3.ftue === 1 && back3.ftueLS === 1);

/* ================= §7 THE FIVE TONGUES ================= */
console.log('— §7 the five tongues —');
for (const k of ['es', 'fr', 'pt', 'de']) {
  ok(k + ': the meadow stands', await boot('', `localStorage.setItem('beta3.lang', '${k}');`)
    && await ev(`SS_LANG === '${k}'`) === true);
  ok(k + ': the gear opens the sheet', await openSheet());
  const s = await census();
  judge(k, s);
  await shot('sheet-' + k);
  if (k === 'es') {
    ok('es: the TUTORIAL row replays the Spanish tutorial (the authored LUNA board, the finger on L)',
      await tapUntil(`(${H}.setC && ${H}.setC.tutZone) || ${H}.setB`, `!${H}.setC && (${H}.ascending || game.scene.isActive('battle'))`, 3)
      && await until(PICK, 40000) && await ev(`${B}.ftue === true && ${B}.board.map((s) => s.ch).join(' ')`) === FTUE.es.board.join(' ')
      && await until(`window.__ssftue.point === 'slot:2'`, 15000));
    await sleep(600);
    await shot('tutorial-es');
    ok('es: ‹ home to the full meadow', await tapUntil(`${B}.homeB`, CHROME_FULL, 6) && await until(RESTING, 15000));
  }
}

/* ================= §8 THE SAFE BAND ================= */
console.log('— §8 the safe band (?inset=59,34) —');
ok('the inset meadow stands', await boot('inset=59,34'));
ok('the gear opens the sheet', await openSheet());
const ins = await census();
judge('inset', ins);
ok('inset: the window stands inside the safe band (clear of the notch and the home bar)',
  ins.safe.top >= ins.safe.it && ins.safe.bottom <= ins.safe.H - ins.safe.ib, JSON.stringify(ins.safe));
await shot('sheet-inset');

/* ================= the ledger ================= */
if (errs.length) { console.log('PAGE EXCEPTIONS:'); errs.slice(0, 12).forEach((e) => console.log('  ' + e)); }
ok('zero page exceptions', errs.length === 0, errs.length ? errs[0] : '');
await ev(`localStorage.clear(); sessionStorage.clear(); 'x'`).catch(() => { });
console.log('\n' + pass + ' passed · ' + fail + ' failed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
