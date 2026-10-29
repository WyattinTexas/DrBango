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
// Self-launching: serves beta3 on :8899 if nothing does; headless Chromium on
// :9501 (/tmp/cdp-settings wiped first) — Playwright's own Chromium when it
// is installed (a headless GOOGLE Chrome hijacks AppleScript's session with
// the real one on this Mac), CHROME=… overrides — pinned to an iPhone's
// 390 × 844 at DPR 3 by one device-metrics override; Firebase blocked
// throughout.
//
//   perl -e 'alarm 580; exec @ARGV' node tools/settings-check.mjs   # ~5 min
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
ok("replayTutorial rides ftueRise's own rise (quick, no resume, ftue 1)",
  replaySrc.includes("this.beginAscent({ mode: 'quick', resume: null, ascended: true, ftue: 1 });"));
ok('…writes nothing to the first-open flag', !!replaySrc && !/prof\.ftue|ssFtueDone|SS\.save/.test(replaySrc));
ok('…and stands behind the whole one-sheet guard family', ['this.busy()', 'this.setC', 'this.langC', 'this.dailyC', 'this.mapC',
  'this.confirmC', 'this.signC', 'this.streakC', 'this.riteC'].every((t) => replaySrc.includes(t)));
const buildV = (gameSrc.match(/const BUILD = 'STARSPELL v([\d.]+)'/) || [])[1];
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
  try {
    mkdirSync(SHOTS, { recursive: true });
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(SHOTS + '/' + name + '.png', Buffer.from(r.data, 'base64'));
  } catch (e) { }
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
  && await ev(`${B}.mode === 'quick' && ${B}.ftue === false`) === true);
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
