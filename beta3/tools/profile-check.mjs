// PROFILE-CHECK — the profile page redesign (v0.78.0).
// Skylar (9/2): "REDESIGN OF THE PROFILE PAGE … get rid of the rating button
// and the text underneath it that says 'Rising Star' … It just needs to be
// the profile [chip] that opens you into your profile … put the achievements
// into an achievement button … they could be much bigger and you can scroll
// through them … Your Skies needs to be renamed to your Sigils … put the
// stats from runs begun all the way down to versus victories into a button
// that says 'Stats' … the leaderboard button, the Your Skies button, the new
// stats button, and the new achievement buttons in a 2x2 grid that is
// underneath Veil My Rating … the rest of the screen to be taken up by all
// the different signs in a 3x4 grid … bigger and they look more like
// badges." The game side: the meadow chip stands alone (the rating pill and
// tier text are gone; the rating lives on inside the profile — its line,
// the card, the veil); the profile page is name + rating + veil, the 2×2
// door grid (LEADERBOARD · YOUR SIGILS / STATS · ACHIEVEMENTS), and twelve
// sign badges in 3×4 (per-sign fitted asterisms in glass shields, gold when
// cleared, the level in a roundel wearing the signWheelLv tag); STATS is a
// sheet carrying the nine-row ledger with the v0.77.0 frontier-flag door on
// its endless row (flag sheet opens ABOVE it); ACHIEVEMENTS is a masked
// drag-scroll sheet — one BIG row per achievement, the hard family still
// ONE evolving row, the tally counting display rows.
// Self-launching like flag-check: serves beta3 on :8899 if nothing does,
// headless Chrome on :9478 (/tmp/cdp-profile, --disable-gpu), Firebase
// blocked at the network layer throughout (local sky, no cleanup owed).
//
//   node tools/profile-check.mjs      # ~4 min
//
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
const PORT = 9478, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= 1. the paper (source, no browser) ================= */
console.log('\nPROFILE-CHECK · the page behind the chip\n');
console.log('— THE PAPER —');
const src = {
  game: readFileSync('game.js', 'utf8'), strings: readFileSync('strings.js', 'utf8'),
  index: readFileSync('index.html', 'utf8'),
};
const build = (src.game.match(/const BUILD = 'STARSPELL v([\d.]+)'/) || [])[1];
const stamps = [...src.index.matchAll(/\?v=([\d.]+)/g)].map((m) => m[1]);
ok('release ritual: BUILD ' + build + ' and all ' + stamps.length + ' ?v= stamps agree',
  !!build && stamps.length >= 12 && stamps.every((s) => s === build));
const blocks = {};
for (const lang of ['en', 'es', 'fr', 'pt', 'de']) {
  const m = src.strings.match(new RegExp('  ' + lang + ': \\{([\\s\\S]*?)\\n  \\},'));
  blocks[lang] = m ? m[1] : '';
}
const keyOf = (lang, k) => {
  const m = blocks[lang].match(new RegExp("\\b" + k + ": '((?:[^'\\\\]|\\\\.)*)'"));
  return m ? m[1] : null;
};
const SIGILS = { en: 'YOUR SIGILS', es: 'TUS SIGILOS', fr: 'TES SCEAUX', pt: 'OS TEUS SÍGILOS', de: 'DEINE SIGEL' };
const OLD = { en: 'YOUR SKIES', es: 'TUS CIELOS', fr: 'TES CIEUX', pt: 'OS TEUS CÉUS', de: 'DEIN HIMMEL' };
ok('YOUR SKIES is YOUR SIGILS in all five tongues (the old titles gone)',
  Object.keys(SIGILS).every((l2) => keyOf(l2, 'skiesTitle') === SIGILS[l2] && !blocks[l2].includes("'" + OLD[l2] + "'")),
  Object.keys(SIGILS).map((l2) => keyOf(l2, 'skiesTitle')).join(' · '));
const NEWKEYS = ['pfStats', 'pfAch', 'stRuns', 'stRunsWon', 'stBestQuick', 'stEndless', 'stVsWins'];
let missing = '';
for (const l2 of ['en', 'es', 'fr', 'pt', 'de']) for (const k of NEWKEYS) if (!keyOf(l2, k)) missing = l2 + '.' + k;
ok('the seven new door/ledger keys ride in all five tongues', !missing, missing);
ok('the meadow pill left the source — no ratingPill, tier text or refresher anywhere',
  !/ratingPill|ratingTierT|refreshRatingPill/.test(src.game));
ok('the nine ledger labels are SS_T keys now, never raw literals',
  !/'runs begun'|'versus victories'|'best quick play'/.test(src.game) &&
  /\['stRuns', p\.runs\]/.test(src.game) && /\['stVsWins', p\.vsWins/.test(src.game));
ok('the flag row still rides the stats sheet (flagRow zone + rowFlag repaint, sheet-parented)',
  /fz\.setData\('flagRow', 1\)/.test(src.game) && /parent\.add\(this\.rowFlag\)/.test(src.game));
ok('the badge shield is baked per dress — no setTint near it (Canvas law)', (() => {
  const i = src.game.indexOf('function ssZodBadgeTex');
  const j = src.game.indexOf('/* ---- zodiac card art');
  return i > 0 && j > i && !/setTint/.test(src.game.slice(i, j));
})());
ok('the achievements sheet scrolls the sigil panel\'s own way (mask + drag + thumb)', (() => {
  const i = src.game.indexOf('achSheet() {');
  const j = src.game.indexOf('flagSheet() {');
  const s = src.game.slice(i, j);
  return i > 0 && /createGeometryMask/.test(s) && /pointermove/.test(s) && /thumb/.test(s);
})());

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
try { rmSync('/tmp/cdp-profile', { recursive: true, force: true }); } catch (e) { }
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-profile', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const H = `game.scene.getScene('home')`;
const P = `game.scene.getScene('profile')`;
const HOME = `!!window.game && ${H} && ${H}.sys.isActive() && !!${H}.menuRows`;
const PON = `!!${P} && ${P}.sys.isActive()`;
// the seeded stargazer every section reads: two signs played (one cleared),
// a standing endless best wearing the orange jar, a filled ledger, three
// embers + two plain achievements
const PROF = JSON.stringify({
  rating: 1000, flag: 'orange', runs: 14, wins: 6, beasts: 57, words: 180,
  longest: 'sparkle', bigHit: 88, bestQuick: 1234, vsWins: 3,
  endless: { bestLevel: 9, bestScore: 4321, runs: 2 },
  ach: { 'first-blood': 1, 'star-caller': 1, 'hard-aries': 1, 'hard-taurus': 1, 'hard-gemini': 1 },
  signs: { leo: { best: 1234, clears: 2, runs: 3, eBest: 0, xp: 1560, ack: 13 },
           aries: { best: 0, clears: 0, runs: 1, eBest: 0, xp: 40, ack: 1 } },
});
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1');
    localStorage.setItem('beta3.profile', '${PROF.replace(/'/g, "\\'")}'); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};

/* ================= 2. the meadow: the chip stands alone ================= */
console.log('— THE MEADOW (no pill, the chip alone opens the page) —');
await boot('');
ok('home stands', await until(HOME, 60000));
ok('no rating pill, no tier text — the chip stands alone in the corner', await ev(`(() => { const h = ${H};
  if (h.ratingPill || h.ratingTierT || h.refreshRatingPill) return false;
  // nothing interactive lives in the old pill band (top-right, under the chip)
  const D = game.scale.width / innerWidth, l = ssLayout(h);
  const stray = h.children.list.filter((o) => o.input && o.input.enabled && o.visible
    && o.y > l.y(40) && o.y < l.y(90) && o.x > l.x(60));
  return !!h.profileChip && stray.length === 0 })()`));
ok('no tier name anywhere on the meadow (RISING STAR and kin gone)', await ev(`(() => { const h = ${H};
  const tiers = SS_RATING_TIERS.map((t) => SS_T(t.key));
  let hit = false; h.children.list.forEach((o) => { if (o.text && tiers.includes(o.text)) hit = true; });
  return !hit })()`));
await shot('meadow-no-pill');
ok('the chip alone opens the profile (real tap)', await tapUntil(`${H}.profileChip`, PON));
await sleep(900);

/* ================= 3. the page: 2×2 doors + 3×4 badges ================= */
console.log('— THE PAGE (the four doors, the twelve badges) —');
const page = await evj(`JSON.stringify((() => { const p = ${P}; const l = ssLayout(p);
  const D = game.scale.width / innerWidth;
  const d = (o) => o ? { x: Math.round((o.x - l.x(0)) / l.s), y: Math.round((o.y - l.y(0)) / l.s + 400),
    hw: o.input ? o.input.hitArea.width * Math.abs(o.scaleX) / D : 0,
    hh: o.input ? o.input.hitArea.height * Math.abs(o.scaleY) / D : 0 } : null;
  const veil = p.children.list.find((o) => o.text && o.text.indexOf(SS_T('rVeilRow')) >= 0);
  return { lb: d(p.leaderB), sk: d(p.skiesB), st: d(p.statsB), ac: d(p.achB),
    veilY: veil ? Math.round((veil.y - l.y(0)) / l.s + 400) : -1,
    skSub: p.skiesSubT ? p.skiesSubT.text : null, acSub: p.achSubT ? p.achSubT.text : null } })())`);
ok('the four doors stand in a 2×2 grid under the veil row', !!(page.lb && page.sk && page.st && page.ac) &&
  page.lb.y === page.sk.y && page.st.y === page.ac.y && page.lb.y < page.st.y &&
  page.lb.x === page.st.x && page.sk.x === page.ac.x && page.lb.x < page.sk.x &&
  page.veilY > 0 && page.lb.y > page.veilY, JSON.stringify(page).slice(0, 200));
ok('every door honors the 44-pt law', [page.lb, page.sk, page.st, page.ac]
  .every((b) => b.hw >= 43.5 && b.hh >= 43.5), [page.lb, page.sk, page.st, page.ac].map((b) => Math.round(b.hw) + 'x' + Math.round(b.hh)).join(' '));
ok('the doors speak their names — YOUR SIGILS among them', await ev(`(() => { const p = ${P};
  const has = (t) => p.children.list.some((o) => o.text && o.text.indexOf(t) >= 0);
  return has(SS_T('board')) && has(SS_T('skiesTitle')) && has(SS_T('pfStats')) && has(SS_T('pfAch'))
    && SS_T('skiesTitle') === '${SIGILS.en}' })()`));
ok('the sigils door keeps its counting voice (plain fraction on this sky)',
  page.skSub === (await ev(`ssSigilOpen().length + ' / ' + SS_SIGILS.length`)), page.skSub);
ok('the achievements door carries the display tally: 3 / 26', page.acSub === '3 / 26', page.acSub);
ok('no always-on ledger, no always-on grid — the page below the doors belongs to the signs',
  await ev(`(() => { const p = ${P};
    const bad = ['stRuns', 'stVsWins', 'stBestQuick'].some((k) => p.children.list.some((o) => o.text === SS_T(k)));
    const ach = p.children.list.some((o) => o.text === 'FIRST BLOOD' || (o.text || '').indexOf('— ACHIEVEMENTS') >= 0);
    return !bad && !ach })()`));
const badges = await evj(`JSON.stringify((() => { const p = ${P}; const l = ssLayout(p);
  const bs = p.children.list.filter((o) => o.texture && /^zbadge/.test(o.texture.key));
  const xs = [...new Set(bs.map((o) => Math.round((o.x - l.x(0)) / l.s)))].sort((a, b) => a - b);
  const ys = [...new Set(bs.map((o) => Math.round((o.y - l.y(0)) / l.s + 400)))].sort((a, b) => a - b);
  const nums = p.children.list.filter((o) => o.getData && o.getData('signWheelLv')).map((o) => ({ id: o.getData('signWheelLv'), t: o.text }));
  return { n: bs.length, gold: bs.filter((o) => o.texture.key === 'zbadge-g').length,
    xs, ys, wMin: Math.min(...bs.map((o) => o.displayWidth / l.s)), nums } })())`);
ok('twelve badges in a 3×4 grid', badges.n === 12 && badges.xs.length === 3 && badges.ys.length === 4,
  badges.n + ' at ' + badges.xs.join(',') + ' × ' + badges.ys.join(','));
ok('badge-big, not strip-tiny: every shield at least 110 design units wide (the strip drew ~10)',
  badges.wMin >= 110, String(Math.round(badges.wMin)));
ok('the cleared sign burns gold (leo\'s shield), the rest hang dim', badges.gold === 1, badges.gold + ' gold');
ok('played signs wear their level in the roundel — leo 13, aries 1, nobody else',
  badges.nums.length === 2 && badges.nums.some((n2) => n2.id === 'leo' && n2.t === '13')
  && badges.nums.some((n2) => n2.id === 'aries' && n2.t === '1'), JSON.stringify(badges.nums));
// sign-check's layout judge, the profile page under the law
const LAYOUT = `(() => { const s = ${P}; const D = game.scale.width / innerWidth; const HH = game.scale.height, W = game.scale.width, it = SS_INSET.top * D, ib = SS_INSET.bottom * D, tol = 1.5 * D;
  const out = { band: [], clip: [], small: [], overlap: [], law: [] };
  const items = []; const vis = (o) => { for (let q = o; q; q = q.parentContainer) if (!q.visible || q.alpha < 0.05) return false; return true; };
  const walk = (ls) => ls.forEach(o => { if (o.list && !(o.getData && o.getData('textBlock'))) { if (o.visible) walk(o.list); }
    if (!vis(o) || !o.getBounds) return; const isText = o.type === 'Text', hit = !!(o.input && o.input.enabled); if (!isText && !hit) return;
    const b = o.getBounds(); const bb = { x: b.x, y: b.y, r: b.right, b: b.bottom, w: b.width, h: b.height };
    if (bb.w >= W * 0.9 && bb.h >= HH * 0.9) return; const name = (isText ? o.text : (o.texture && o.texture.key) || o.type).slice(0, 22);
    items.push({ o, b: bb, isText, hit, name }); });
  walk(s.children.list);
  for (const it2 of items) { const { b, isText, hit, name } = it2;
    const q = isText ? (it2.o.padding ? Math.max(it2.o.padding.top || 0, it2.o.padding.bottom || 0) : 0) : 0; const top = b.y + q, bot = b.b - q;
    if (top < it - tol || bot > HH - ib + tol) out.band.push(name);
    if (bot > HH + tol || b.r > W + tol || b.x < -tol) out.clip.push(name);
    if (hit) { const ha = it2.o.input.hitArea; const sx = Math.abs(it2.o.scaleX || 1), sy = Math.abs(it2.o.scaleY || 1);
      const hw = ha && ha.width ? ha.width * sx : b.w, hh = ha && ha.height ? ha.height * sy : b.h;
      if (Math.min(hw, hh) / D < 43.5) out.small.push(name + ' ' + Math.round(hw / D) + 'x' + Math.round(hh / D)); }
    if (isText) { const t = it2.o.text || ''; if (t.includes('\\n')) out.law.push('nl:' + t.slice(0, 20));
      else if (it2.o.style.wordWrapWidth) { const w = it2.o.getWrappedText(t); if ((Array.isArray(w) ? w.length : String(w).split('\\n').length) > 1) out.law.push('wrap:' + t.slice(0, 20)); } } }
  const tx = items.filter(i => i.isText && i.o.alpha > 0.3);
  for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) { const a = tx[i], c = tx[j];
    const pa = a.o.padding ? Math.max(a.o.padding.left || 0, a.o.padding.top || 0) : 0, pc = c.o.padding ? Math.max(c.o.padding.left || 0, c.o.padding.top || 0) : 0;
    const ax = a.b.x + pa, ay = a.b.y + pa, ar = a.b.r - pa, ab = a.b.b - pa; const cx = c.b.x + pc, cy = c.b.y + pc, cr = c.b.r - pc, cb = c.b.b - pc;
    const iw = Math.min(ar, cr) - Math.max(ax, cx), ih = Math.min(ab, cb) - Math.max(ay, cy); if (iw > tol && ih > tol) out.overlap.push(a.name + '×' + c.name); }
  return JSON.stringify(out) })()`;
const lay = await evj(LAYOUT);
ok('the page holds the layout law — safe band, no clips, no overlap, one line, 44-pt',
  lay.band.length === 0 && lay.clip.length === 0 && lay.overlap.length === 0 && lay.law.length === 0 && lay.small.length === 0,
  lay.band.concat(lay.clip, lay.overlap, lay.law, lay.small).slice(0, 5).join(', '));
await shot('profile-page');
ok('the rating line still opens the rating card', await tapUntil(
  `${P}.children.list.find((o) => o.text && o.text.indexOf(String(SS.prof.rating)) >= 0 && o.input)`,
  `!!${P}.__rcC`));
await ev(`(() => { if (${P}.__rcC) { ${P}.__rcC.destroy(); ${P}.__rcC = null; } return 'ok' })()`);

/* ================= 4. the stats sheet ================= */
console.log('— STATS (nine rows, the flag door riding along) —');
ok('STATS opens its sheet (real tap)', await tapUntil(`${P}.statsB`, `!!${P}.statsP`));
await sleep(700);
const stats = await evj(`JSON.stringify((() => { const p = ${P}; const out = {}; let labs = 0;
  const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('stVal')) out[o.getData('stVal')] = o.text;
    if (o.style && ['stRuns','stRunsWon','stBeasts','stWords','stFinest','stBigHit','stBestQuick','stEndless','stVsWins'].some((k) => o.text === SS_T(k))) labs++;
    if (o.list) scan(o.list); });
  scan(p.statsP.list); return { out, labs } })())`);
const wantStats = { stRuns: '14', stRunsWon: '6', stBeasts: '57', stWords: '180', stFinest: 'SPARKLE', stBigHit: '88', stBestQuick: '1234', stVsWins: '3' };
ok('all nine stats stand, every value exact', stats.labs === 9 &&
  Object.keys(wantStats).every((k) => stats.out[k] === wantStats[k]) &&
  stats.out.stEndless === (await ev(`SS_T('endLvlShort', 9)`)) + ' · 4321  ›',
  JSON.stringify(stats).slice(0, 220));
const frow = await evj(`JSON.stringify((() => { const p = ${P}; const D = game.scale.width / innerWidth;
  let z = null, tex = null;
  const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('flagRow')) z = o;
    if (o.list && o.list.some((x) => x.texture && /^flag-/.test(x.texture.key))) tex = o.list.find((x) => x.texture && /^flag-/.test(x.texture.key)).texture.key;
    if (o.list) scan(o.list); });
  scan(p.statsP.list);
  return { tex, zone: !!z, hitH: z ? z.input.hitArea.height / D : 0 } })())`);
ok('the endless row wears the little flag in this mage\'s jar', frow.tex === 'flag-orange', frow.tex);
ok('…and the row is a 44-pt door', frow.zone && frow.hitH >= 43.5, Math.round(frow.hitH) + 'pt');
await shot('stats-sheet');
ok('a real tap opens the flag sheet ABOVE the stats sheet', await tapUntil(
  `(() => { let z = null; const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('flagRow')) z = o; if (o.list) scan(o.list); }); scan(${P}.statsP.list); return z })()`,
  `!!${P}.flagP && !!${P}.statsP`));
await shot('flag-over-stats');
ok('the flag sheet closes back onto the stats sheet (its ✕)', await tapUntil(
  `(() => { let x = null; const scan = (ls) => ls.forEach((o) => { if (o.text === '✕') x = o; if (o.list) scan(o.list); }); scan(${P}.flagP.list); return x })()`,
  `!${P}.flagP && !!${P}.statsP`));
ok('the stats sheet closes by its ✕ (rowFlag swept)', await tapUntil(
  `(() => { let x = null; const scan = (ls) => ls.forEach((o) => { if (o.text === '✕') x = o; if (o.list) scan(o.list); }); scan(${P}.statsP.list); return x })()`,
  `!${P}.statsP && !${P}.rowFlag`));

/* ================= 5. the achievements sheet ================= */
console.log('— ACHIEVEMENTS (big, scrolling, the family folded) —');
ok('ACHIEVEMENTS opens its sheet (real tap)', await tapUntil(`${P}.achB`, `!!${P}.achP`));
await sleep(700);
const ach = await evj(`JSON.stringify((() => { const p = ${P}; const l = ssLayout(p);
  const names = [], descs = []; let tally = null;
  const scan = (ls) => ls.forEach((o) => {
    if (o.getData && o.getData('achName')) names.push({ id: o.getData('achName'), t: o.text, fs: parseFloat(o.style.fontSize) / l.s, c: o.style.color });
    if (o.getData && o.getData('achDesc')) descs.push({ id: o.getData('achDesc'), t: o.text, fs: parseFloat(o.style.fontSize) / l.s });
    if (o.getData && o.getData('achTally')) tally = o.text;
    if (o.list) scan(o.list); });
  scan(p.achP.list); return { n: names.length, d: descs.length, tally,
    nameFs: names[0] ? names[0].fs : 0, descFs: descs[0] ? descs[0].fs : 0,
    fb: names.find((x) => x.id === 'first-blood'), un: names.find((x) => x.id === 'sky-sweeper'),
    fam: descs.find((x) => x.id === 'hard-sign'), famName: names.find((x) => x.id === 'hard-sign') } })())`);
ok('all 26 display rows stand, the tally counting them', ach.n === 26 && ach.d === 26 && ach.tally === '3 / 26',
  ach.n + ' rows · ' + ach.tally);
ok('the entries are BIG — names and stories half again v0.70\'s grid (10.5 → 14, 8 → 11)',
  ach.nameFs >= 13.5 && ach.descFs >= 10.5, 'name u' + ach.nameFs.toFixed(1) + ' · desc u' + ach.descFs.toFixed(1));
ok('earned wears parchment, unearned hangs dim', ach.fb && ach.fb.c === '#f0e8d2' && ach.un && ach.un.c === '#4a5480',
  JSON.stringify({ fb: ach.fb && ach.fb.c, un: ach.un && ach.un.c }));
ok('the hard family keeps its ONE evolving row — EMBER-SWORN · 3 / 12', ach.famName && ach.famName.t === 'EMBER-SWORN'
  && ach.fam && /3 \/ 12$/.test(ach.fam.t), ach.fam && ach.fam.t);
// the scroll, for real: press the window, drag up, the rows ride
const before = await evj(`JSON.stringify((() => { const p = ${P};
  let y = null; const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('achName') === 'end-20') y = o.getBounds().centerY; if (o.list) scan(o.list); });
  scan(p.achP.list); return { y } })())`);
const mid = await evj(`JSON.stringify((() => { const D = game.scale.width / innerWidth;
  return { x: innerWidth / 2, y: innerHeight / 2 } })())`);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: mid.x, y: mid.y + 120, button: 'left', clickCount: 1 });
for (let i = 1; i <= 10; i++) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: mid.x, y: mid.y + 120 - i * 28, button: 'left' });
  await sleep(30);
}
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: mid.x, y: mid.y - 160, button: 'left', clickCount: 1 });
await sleep(400);
const after = await evj(`JSON.stringify((() => { const p = ${P};
  let y = null, rc = null; const scanC = (ls) => ls.forEach((o) => { if (o.getData && o.getData('achName') === 'end-20') y = o.getBounds().centerY; if (o.list) scanC(o.list); });
  scanC(p.achP.list); return { y } })())`);
ok('a real drag scrolls the list (the far rows ride up)', before.y !== null && after.y !== null && before.y - after.y > 100,
  Math.round(before.y) + ' → ' + Math.round(after.y));
await shot('ach-sheet-scrolled');
ok('one sheet at a time: STATS under an open ACHIEVEMENTS is refused', await (async () => {
  await tap(`${P}.statsB`).catch(() => { });
  await sleep(500);
  return ev(`!${P}.statsP && !!${P}.achP`);
})());
ok('the sheet closes by its ✕ zone', await tapUntil(
  `(() => { const l = ssLayout(${P}); let z = null; const scan = (ls) => ls.forEach((o) => { if (o.type === 'Zone' && o.input && o.width < l.u(60)) z = o; if (o.list) scan(o.list); }); scan(${P}.achP.list); return z })()`,
  `!${P}.achP`));
// the crown: all twelve embers → the family row wears THE EMBER ZODIAC whole
await ev(`(() => { for (const z of SS_ZODIAC) SS.prof.ach['hard-' + z.id] = 1; SS.prof.ach['hard-zodiac'] = 1; SS.save();
  ${P}.scene.restart(); return 'ok' })()`);
await until(PON, 10000); await sleep(800);
ok('crowned: the family row wears THE EMBER ZODIAC (sheet reopened)', await (async () => {
  if (!(await tapUntil(`${P}.achB`, `!!${P}.achP`))) return false;
  await sleep(500);
  return ev(`(() => { const p = ${P}; let t = null;
    const scan = (ls) => ls.forEach((o) => { if (o.getData && o.getData('achName') === 'hard-sign') t = o.text; if (o.list) scan(o.list); });
    scan(p.achP.list); return t === 'THE EMBER ZODIAC' })()`);
})());
ok('…and the family still counts ONCE in the tally (crowned is not a 14th row)',
  await ev(`(() => { const p = ${P}; return p.achSubT.text === '3 / 26' })()`));

/* ================= 6. the sigils door still opens the gallery ================= */
console.log('— YOUR SIGILS (the gallery behind its renamed door) —');
ok('YOUR SIGILS opens the gallery (real tap)', await (async () => {
  await ev(`(() => { const p = ${P}; if (p.achP) { p.achP.destroy(); p.achP = null; } return 'ok' })()`);
  await sleep(300);
  return tapUntil(`${P}.skiesB`, `!!${P}.skiesP`);
})());
ok('the gallery wears the new name across its head (the baked gold title)', await ev(`(() => { const p = ${P};
  let hit = false; const scan = (ls) => ls.forEach((o) => { if (o.texture && o.texture.key === 'gold@16@' + SS_T('skiesTitle')) hit = true; if (o.list) scan(o.list); });
  scan(p.skiesP.c.list); return hit && SS_T('skiesTitle') === 'YOUR SIGILS' })()`));
ok('…and closes by its ✕ zone', await tapUntil(
  `(() => { const l = ssLayout(${P}); let z = null; const scan = (ls) => ls.forEach((o) => { if (o.type === 'Zone' && o.input && o.width < l.u(60)) z = o; if (o.list) scan(o.list); }); scan(${P}.skiesP.c.list); return z })()`,
  `!${P}.skiesP`));

/* ================= 7. the doors that leave the page ================= */
console.log('— THE ROADS OUT —');
ok('LEADERBOARD opens the Board, told where it came from', await tapUntil(`${P}.leaderB`,
  `game.scene.isActive('board') && game.scene.getScene('board').from === 'profile'`));
ok('…and the Board\'s back link returns here', await tapUntil(
  `game.scene.getScene('board').children.list.find((o) => o.text && o.text.indexOf('‹') === 0)`,
  `${PON} && !game.scene.isActive('board')`));
ok('‹ HOME leaves for the meadow', await tapUntil(
  `${P}.children.list.find((o) => o.text && o.text.indexOf('‹') === 0)`, HOME));

/* ================= 8. five tongues ================= */
console.log('— THE FIVE TONGUES —');
for (const lang of ['es', 'fr', 'pt', 'de']) {
  await boot('lang=' + lang);
  const okBoot = await until(HOME, 60000);
  const opened = okBoot && await tapUntil(`${H}.profileChip`, PON);
  await sleep(700);
  const d = opened ? await evj(`JSON.stringify((() => { const p = ${P};
    const has = (t) => p.children.list.some((o) => o.text && o.text.indexOf(t) >= 0);
    return { sig: has(SS_T('skiesTitle')), st: has(SS_T('pfStats')), ac: has(SS_T('pfAch')),
      title: SS_T('skiesTitle') } })())`) : { sig: false };
  ok(lang + ': the doors speak — ' + (d.title || '?'), d.sig && d.st && d.ac && d.title === SIGILS[lang], JSON.stringify(d));
}
// the Spanish ledger, deep: the stats sheet's rows in their own words
ok('es: the stats sheet speaks the ledger (partidas iniciadas · 14)', await (async () => {
  await boot('lang=es');
  if (!(await until(HOME, 60000))) return false;
  if (!(await tapUntil(`${H}.profileChip`, PON))) return false;
  if (!(await tapUntil(`${P}.statsB`, `!!${P}.statsP`))) return false;
  await sleep(500);
  return ev(`(() => { const p = ${P}; let lab = false, val = false;
    const scan = (ls) => ls.forEach((o) => { if (o.text === 'partidas iniciadas') lab = true;
      if (o.getData && o.getData('stVal') === 'stRuns' && o.text === '14') val = true; if (o.list) scan(o.list); });
    scan(p.statsP.list); return lab && val })()`);
})());
await shot('stats-es');

// ---------------------------------------------------------------- wrap
ok('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
console.log(`\n${pass} passed, ${fail} failed`);
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
