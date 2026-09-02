// SIGNLEVEL-CHECK — sign levels 1-50, every zodiac power grows with play
// (v0.69.0). Skylar (9/1): "All the signs' powers should be at level one
// and should be weaker than what they are right now … go from level one to
// level 50 … Right now the powers should be kind of like the middle ground
// … start off weaker, eventually get to where they are now, and then be
// even stronger. The farther you get into the levels, we will also add
// rewards into that as well … we should have that framework in place."
// The game side: SS_ZODIAC defs carry `pw` breakpoint ladders resolved by
// ssSignVal (data.js — ONE resolver, the ssSigilVal law); SS_SIGNLV is the
// XP curve (cum pins L5 320 · L10 990 · L20 3230 · L30 6670 · L40 11286 ·
// L50 16286); SS_SIGN_XP {fell 12, boss +15, clear 120} settles LIVE at
// beastDeath / endRun's campaign book; SS_SIGN_REWARDS is the typed
// framework (+5 hp @10, +10 @25, a gilded opening tile @40); prof.signs
// grows xp/ack with the veteran's seed capped at L20; descs are GENERATED
// per level (SS_ZOD(z, lv), template %k + wording bands); the picker cards
// wear LEVEL + an XP bar, the profile wheel tiny numerals, the inspector
// row the levelled line; ssSignRite says a level-up in the forge
// ceremony's dress (ack spent at show), chained BEHIND the sigil queue at
// endRun with Home.signNotice as the meadow safety net. Quick/daily/versus
// run unsigned — no XP, no power, nothing moved.
// LAWS pinned here: L1 weaker than today for every dial EXCEPT
// virgo.charges (once per battle has no smaller step — the stated
// exception); today's numbers hold across the WHOLE 22-28 band; L50
// strictly stronger; capricorn's fractional `per` floors the PRODUCT.
// Self-launching like endless-check: serves beta3 on :8899 if nothing
// does, headless Chrome on :9468 (/tmp/cdp-signlv, --disable-gpu),
// Firebase blocked at the network layer throughout (local sky), real CDP
// taps at dpr 3, poll-never-sleep.
//
//   perl -e 'alarm 580; exec @ARGV' node tools/signlevel-check.mjs
//
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
const PORT = 9468, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS || '';
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
  '--user-data-dir=/tmp/cdp-signlv', '--window-size=393,852', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
await send('Page.addScriptToEvaluateOnNewDocument', { source: 'navigator.share = undefined;' });
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
const tapUntil = async (expr, cond, tries = 6) => {
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
const PICK = `!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`;
const HOME = `!!window.game && ${H} && ${H}.sys.isActive() && !!${H}.rowBtns && !!${H}.rowBtns.newcamp`;
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1');
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
// endless-check's proven fell + card helpers (the real death path)
const fell = async () => {
  await until(`!!${B} && !${B}.dying && ${B}.state === 'pick'`, 20000, 250);
  const armed = await ev(`(() => { const b = ${B}; if (b.dying) return 'busy';
    b.beast.hpNow = -1; b.dying = true; b.beastDeath(); return 'ok' })()`);
  if (armed !== 'ok') return 'lost';
  const landed = await until(`(${B}.state === 'sigil' && ${B}.overlayC.list.some((o) => o.getData && o.getData('sigilCard') && o.alpha === 1))
    || ${B}.state === 'upgrade' || ${B}.state === 'map' || ${B}.state === 'end' || ${B}.state === 'rite' || (${B}.state === 'pick' && !${B}.dying)`, 30000, 250);
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
// tier-check's board tools: settle, then plant known tiles by real spawns
const settle = async () => until(`${B}.board.every((s, i) => !s || Math.abs(s.c.y - ${B}.slotPos(i).y) < 0.5)`, 8000, 100);
const place = async (arr) => {
  await ev(`(() => { const b = ${B}; b.unselectFrom(0);
    for (const [i, ch, tier] of ${JSON.stringify(arr)}) {
      if (b.board[i]) { b.board[i].c.destroy(); b.board[i] = null; }
      b.spawnTile(i, ch, tier, false);
    } return 'ok' })()`);
  await settle();
};
// seed a sign's record at a level (xp = the level's cum; ack quiet)
const seedLv = (sid, L) => `SS.prof.signs['${sid}'] = { best: 0, clears: 0, runs: 0, xp: SS_SIGNLV.cum[${L}], ack: ${L} }; SS.save();`;

/* THE LADDER, PINNED — the balance sheet of the card (a def that drifts
   from this table is a finding, not a re-pin). Column 22 IS today's live
   number at v0.68.0. */
const TODAY = {
  aries: ['ram', 8], taurus: ['hp', 15], gemini: ['add', 10], cancer: ['cut', 50],
  leo: ['add', 8], virgo: ['charges', 1], libra: ['add', 10], scorpio: ['cap', 6],
  sagittarius: ['arrow', 6], capricorn: ['per', 1], aquarius: ['heal', 8], pisces: ['pct', 30],
};
const LADDER = {
  'aries.ram': [[1, 4], [6, 5], [11, 6], [16, 7], [22, 8], [29, 9], [36, 10], [43, 11], [50, 13]],
  'taurus.hp': [[1, 8], [8, 10], [15, 12], [22, 15], [30, 18], [37, 21], [44, 24], [50, 28]],
  'gemini.add': [[1, 5], [8, 6], [14, 8], [22, 10], [29, 12], [36, 14], [43, 16], [50, 18]],
  'cancer.cut': [[1, 30], [10, 35], [16, 40], [22, 50], [30, 55], [36, 60], [43, 65], [50, 70]],
  'leo.add': [[1, 4], [9, 5], [15, 6], [22, 8], [29, 9], [36, 10], [43, 12], [50, 14]],
  'virgo.charges': [[1, 1], [29, 2], [46, 3]],
  'libra.add': [[1, 5], [8, 6], [14, 8], [22, 10], [29, 12], [36, 14], [43, 16], [50, 18]],
  'scorpio.cap': [[1, 4], [14, 5], [22, 6], [29, 7], [36, 8], [43, 9], [50, 10]],
  'scorpio.venomAdd': [[1, 1], [40, 2]],
  'sagittarius.arrow': [[1, 3], [10, 4], [16, 5], [22, 6], [29, 7], [36, 8], [43, 10], [50, 12]],
  'capricorn.per': [[1, 0.5], [22, 1], [50, 2]],
  'aquarius.heal': [[1, 5], [12, 6], [17, 7], [22, 8], [30, 10], [38, 12], [44, 14], [50, 16]],
  'aquarius.charges': [[1, 1], [42, 2]],
  'pisces.pct': [[1, 15], [10, 20], [16, 25], [22, 30], [30, 35], [38, 40], [44, 45], [50, 50]],
};

console.log('\nSIGNLEVEL-CHECK · sign levels 1-50\n');

/* ================= 1. the curve on paper ================= */
console.log('— THE CURVE ON PAPER —');
await boot('quick=1');
ok('quick run at pick', await until(PICK, 60000));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
ok('the XP curve pins hold (L5 320 · L10 990 · L20 3230 · L30 6670 · L40 11286 · L50 16286), max 50, cum monotone',
  await ev(`SS_SIGNLV.max === 50 && SS_SIGNLV.cum[5] === 320 && SS_SIGNLV.cum[10] === 990 && SS_SIGNLV.cum[20] === 3230
    && SS_SIGNLV.cum[30] === 6670 && SS_SIGNLV.cum[40] === 11286 && SS_SIGNLV.cum[50] === 16286
    && SS_SIGNLV.cum.slice(2).every((v, i) => v > SS_SIGNLV.cum[i + 1])`),
  await ev(`JSON.stringify([SS_SIGNLV.cum[5], SS_SIGNLV.cum[10], SS_SIGNLV.cum[20], SS_SIGNLV.cum[50]])`));
const dataBad = await evj(`(() => { const pin = ${JSON.stringify(LADDER)}; const bad = [];
  for (const z of SS_ZODIAC) {
    if (!z.pw) { bad.push(z.id + ': no pw'); continue; }
    for (const f in z.pw) {
      const key = z.id + '.' + f, want = pin[key];
      if (!want) { bad.push(key + ': unpinned'); continue; }
      if (JSON.stringify(z.pw[f]) !== JSON.stringify(want)) bad.push(key + ' drifted: ' + JSON.stringify(z.pw[f]));
      const tab = z.pw[f];
      for (let i = 1; i < tab.length; i++) if (tab[i][0] <= tab[i - 1][0] || tab[i][1] < tab[i - 1][1]) bad.push(key + ' non-monotone');
    }
  }
  for (const key in pin) { const [zid, f] = key.split('.'); if (!SS_ZODIAC_BY[zid].pw[f]) bad.push(key + ': missing'); }
  return JSON.stringify(bad) })()`);
ok('all 14 dials match the pinned balance sheet, every table monotone', dataBad.length === 0, dataBad.slice(0, 3).join(' · '));
const laws = await evj(`(() => { const today = ${JSON.stringify(TODAY)}; const bad = [];
  for (const z of SS_ZODIAC) {
    const [tf, tv] = today[z.id];
    if (ssSignVal(z.id, tf, 22) !== tv) bad.push(z.id + ' today ' + ssSignVal(z.id, tf, 22) + ' != ' + tv);
    for (const f in z.pw) {
      for (let L = 22; L <= 28; L++) if (ssSignVal(z.id, f, L) !== ssSignVal(z.id, f, 22)) bad.push(z.id + '.' + f + ' band moves @' + L);
      if (ssSignVal(z.id, f, 50) <= ssSignVal(z.id, f, 1)) bad.push(z.id + '.' + f + ' L50 not stronger');
      // count dials have no smaller nonzero step — virgo's purify (the
      // card's stated exception) and the secondary charge dials open flat
      // at 1 and grow only PAST the band (scorpio 40, aquarius 42)
      const flat = (z.id === 'virgo' && f === 'charges') || (z.id === 'scorpio' && f === 'venomAdd') || (z.id === 'aquarius' && f === 'charges');
      if (flat) { if (ssSignVal(z.id, f, 1) !== 1 || ssSignVal(z.id, f, 22) !== 1) bad.push(z.id + '.' + f + ' flat dial not 1@1/22'); }
      else if (ssSignVal(z.id, f, 1) >= ssSignVal(z.id, f, 22)) bad.push(z.id + '.' + f + ' L1 not weaker');
    }
  }
  return JSON.stringify(bad) })()`);
ok('the three laws: value@22 IS today\'s number, the whole 22-28 band constant, L1 weaker (virgo\'s count the stated exception), L50 stronger',
  laws.length === 0, laws.slice(0, 3).join(' · '));

/* ================= 2. the resolver ================= */
console.log('\n— THE RESOLVER —');
ok('ssSignVal walks breakpoints (between rungs, clamped both ends, unknown undefined)',
  await ev(`ssSignVal('aries', 'ram', 1) === 4 && ssSignVal('aries', 'ram', 8) === 5 && ssSignVal('aries', 'ram', 0) === 4
    && ssSignVal('aries', 'ram', 999) === 13 && ssSignVal('aries', 'ram') === 4
    && ssSignVal('aries', 'nope', 22) === undefined && ssSignVal('nope', 'ram', 22) === undefined`));
ok('capricorn\'s fractional per survives the resolver raw (0.5, never |0\'d)',
  await ev(`ssSignVal('capricorn', 'per', 1) === 0.5 && ssSignVal('capricorn', 'per', 21) === 0.5 && ssSignVal('capricorn', 'per', 50) === 2`));
ok('ssSignLvFor at the threshold edges: 0→1, 989→9, 990→10, 16285→49, 16286→50, huge→50',
  await ev(`ssSignLvFor(0) === 1 && ssSignLvFor(989) === 9 && ssSignLvFor(990) === 10
    && ssSignLvFor(16285) === 49 && ssSignLvFor(16286) === 50 && ssSignLvFor(9e9) === 50`));
ok('rewards supersede, never stack: 0 at 9 · hp 5 at 10 · hp 10 (not 15) at 25 · hp 10 + gilded 1 at 40+',
  await ev(`(() => { const a = ssSignRewards('aries', 9), b = ssSignRewards('aries', 10), c = ssSignRewards('aries', 25), d = ssSignRewards('aries', 40), e = ssSignRewards('aries', 50);
    return a.hp === 0 && a.gilded === 0 && b.hp === 5 && c.hp === 10 && c.gilded === 0 && d.hp === 10 && d.gilded === 1 && e.hp === 10 && e.gilded === 1 })()`));
ok('ssSignRewardAt names only the exact row (10 vessel, 11 null, 40 gilded)',
  await ev(`(() => { const r = ssSignRewardAt('leo', 10); return r && r.t === 'vessel' && r.hp === 5
    && ssSignRewardAt('leo', 11) === null && ssSignRewardAt('leo', 40).t === 'gilded' })()`));
ok('the levelled descs cannot drift: SS_ZOD substitutes the dial (aries 4/8/13) and bands the wording (virgo once/twice/thrice, capricorn second/every/+2)',
  await evj(`JSON.stringify((() => { const a1 = SS_ZOD(SS_ZODIAC_BY.aries, 1).desc, a22 = SS_ZOD(SS_ZODIAC_BY.aries, 22).desc, a50 = SS_ZOD(SS_ZODIAC_BY.aries, 50).desc;
    const v1 = SS_ZOD(SS_ZODIAC_BY.virgo, 1).desc, v29 = SS_ZOD(SS_ZODIAC_BY.virgo, 29).desc, v46 = SS_ZOD(SS_ZODIAC_BY.virgo, 46).desc;
    const c1 = SS_ZOD(SS_ZODIAC_BY.capricorn, 1).desc, c22 = SS_ZOD(SS_ZODIAC_BY.capricorn, 22).desc, c50 = SS_ZOD(SS_ZODIAC_BY.capricorn, 50).desc;
    return /takes 4/.test(a1) && /takes 8/.test(a22) && /takes 13/.test(a50) && !/%1/.test(a1)
      && /^Once/.test(v1) && /^Twice/.test(v29) && /^Three/.test(v46)
      && /every second beast/.test(c1) && /\\+1 for every beast/.test(c22) && /\\+2 for every beast/.test(c50) })())`) === true);

/* ================= 3. every power through the real hooks ================= */
console.log('\n— EVERY POWER AT L1 / 22 / 50 —');
// the aries ram through a REAL startFight at each rung
ok('the opening ram: 4 / 8 / 13 off the beast\'s fresh vessel', await (async () => {
  for (const [L, want] of [[1, 4], [22, 8], [50, 13]]) {
    await ev(`${seedLv('aries', L)} ${B}.sign = 'aries'; ${B}.run.overkill = 0; ${B}.run.sigils = []; ${B}.startFight(); 'ok'`);
    await until(PICK, 20000);
    const d = await evj(`JSON.stringify({ lv: ${B}.signLv, delta: ${B}.beast.hp - ${B}.beast.hpNow })`);
    if (d.lv !== L || d.delta !== want) { console.log('    ram@' + L + ':', JSON.stringify(d)); return false; }
  }
  return true;
})());
// the word dials through wordDamage on crafted stubs (the tier-check probe)
const VALS = await evj(`JSON.stringify(VALS)`);
const LEN = await evj(`JSON.stringify(LEN_MULT)`);
const base = (w) => w.split('').reduce((a, c) => a + (VALS[c] || 1), 0) * (LEN[Math.min(w.length, 8)] || 2.3);
const sdmg = (sid, L, w, extra) => evj(`(() => { const b = ${B};
  b.run.sigils = []; b.run.tiers = {}; b.sign = '${sid}'; b.signLv = ${L};
  b.run.firstUsed = true; b.run.words = 1; ${extra || ''}
  return JSON.stringify(b.wordDamage('${w}'.split('').map((ch) => ({ ch, tier: 0, blk: false })))) })()`);
ok('gemini\'s twins pay +5/+10/+18 on a twinned word, nothing untwinned', await (async () => {
  for (const [L, add] of [[1, 5], [22, 10], [50, 18]]) {
    if (await sdmg('gemini', L, 'oo') !== Math.round(base('oo') + add)) return false;
  }
  return (await sdmg('gemini', 50, 'so')) === Math.round(base('so'));
})());
ok('leo\'s roar pays +4/+8/+14 on 6 letters, nothing on 5', await (async () => {
  for (const [L, add] of [[1, 4], [22, 8], [50, 14]]) {
    if (await sdmg('leo', L, 'abcdef') !== Math.round(base('abcdef') + add)) return false;
  }
  return (await sdmg('leo', 50, 'abcde')) === Math.round(base('abcde'));
})());
ok('libra\'s balance pays +5/+10/+18 on a balanced word', await (async () => {
  for (const [L, add] of [[1, 5], [22, 10], [50, 18]]) {
    if (await sdmg('libra', L, 'so') !== Math.round(base('so') + add)) return false;
  }
  return true;
})());
ok('capricorn floors the PRODUCT: 3 fells pay +1 / +3 / +6 (per 0.5 / 1 / 2)', await (async () => {
  const fi = await ev(`${B}.run.fightIdx`);
  for (const [L, add] of [[1, 1], [22, 3], [50, 6]]) {
    if (await sdmg('capricorn', L, 'so', `b.run.fightIdx = 3;`) !== Math.round(base('so') + add)) return false;
  }
  await ev(`${B}.run.fightIdx = ${fi}; 'ok'`);
  return true;
})());
ok('pisces\' current pays ×1.15 / ×1.30 / ×1.50 at one cast from the strike', await (async () => {
  for (const [L, pct] of [[1, 15], [22, 30], [50, 50]]) {
    const got = await sdmg('pisces', L, 'so', `b.beast.count = 1; b.beast.hpNow = 100;`);
    if (got !== Math.round(base('so') * (1 + pct / 100))) return false;
  }
  await ev(`${B}.beast.count = ${await ev(`${B}.beast.timer`)}; 'ok'`);
  return true;
})());
// cancer by a REAL strike (atk pinned at 20; ceil is player-hostile)
ok('cancer\'s shell: a 20 strike lands 14 / 10 / 6 (cut 30/50/70, ceil keeps ≥1)', await (async () => {
  for (const [L, land] of [[1, 14], [22, 10], [50, 6]]) {
    await ev(`(() => { const b = ${B}; b.sign = 'cancer'; b.signLv = ${L}; b.shellUsed = false; b.shieldLeft = 0;
      b.run.sigils = []; b.run.hpMax = 200; b.run.hp = 100; b.beast.atk = 20; b.beast.hpNow = 99999; b.beast.count = 1; b.tickEnemy(() => {}); return 'ok' })()`);
    if (!(await until(`${B}.run.hp !== 100`, 15000, 250))) return false;
    const hp = await ev(`${B}.run.hp`);
    if (hp !== 100 - land) { console.log('    cancer@' + L + ': hp', hp); return false; }
  }
  return true;
})());
ok('…and cut 50 is byte-identical to the old ceil-half for every integer strike', await ev(
  `(() => { for (let a = 1; a <= 60; a++) if (Math.ceil(a * 0.5) !== Math.ceil(a / 2)) return false; return true })()`));
// scorpio: the seep cap by a real tickEnemy, the venomAdd by a REAL cast
ok('scorpio\'s seep caps at 4 / 6 / 10 over a 12-deep venom', await (async () => {
  for (const [L, cap] of [[1, 4], [22, 6], [50, 10]]) {
    await ev(`(() => { const b = ${B}; b.sign = 'scorpio'; b.signLv = ${L}; b.venom = 12;
      b.beast.hpNow = 500; b.beast.count = 3; b.tickEnemy(() => {}); return 'ok' })()`);
    if (!(await until(`${B}.beast.hpNow === ${500 - cap}`, 8000, 200))) { console.log('    seep@' + L + ':', await ev(`${B}.beast.hpNow`)); return false; }
  }
  return true;
})());
ok('the sting settles +1 at L1 and +2 at L40 through a REAL cast', await (async () => {
  await ev(`${B}.sign = 'scorpio'; ${B}.signLv = 1; ${B}.venom = 0; ${B}.run.sigils = []; ${B}.beast.hpNow = 99999; ${B}.beast.count = 9; 'ok'`);
  await place([[0, 's', 0], [1, 'k', 0], [2, 'a', 0], [3, 't', 0], [4, 'e', 0]]);
  for (const i of [4, 2, 0, 3]) await ev(`${B}.tapTile(${i}); 'ok'`);   // EAST
  await ev(`${B}.tryCast(); 'ok'`);
  if (!(await until(`${B}.state === 'pick' && ${B}.venom === 1`, 15000, 250))) return false;
  await ev(`${B}.signLv = 40; 'ok'`);
  await place([[0, 's', 0], [1, 'k', 0], [2, 'a', 0], [3, 't', 0], [4, 'e', 0]]);
  for (const i of [4, 2, 0, 3]) await ev(`${B}.tapTile(${i}); 'ok'`);
  await ev(`${B}.tryCast(); 'ok'`);
  return until(`${B}.state === 'pick' && ${B}.venom === 3`, 15000, 250);
})());
// sagittarius by REAL-TAP scries (poll the drip counter, never the state)
ok('the archer\'s arrow strikes 3 / 6 / 12 on real-tap scries', await (async () => {
  await ev(`${B}.run.sigils = []; 'ok'`);
  for (const [L, arrow] of [[1, 3], [22, 6], [50, 12]]) {
    await ev(`${B}.sign = 'sagittarius'; ${B}.signLv = ${L}; ${B}.venom = 0; ${B}.beast.hpNow = 500; ${B}.beast.count = 9; ${B}.updateBars(); 'ok'`);
    const n0 = await ev(`SS.prof.sig.c.scry | 0`);
    let hit = false;
    for (let t = 0; t < 4 && !hit; t++) {
      await tap(`${B}.scryB`);
      await sleep(200);
      hit = await ev(`(SS.prof.sig.c.scry | 0) > ${n0}`);
    }
    if (!hit) return false;
    if (!(await until(`${B}.beast.hpNow === ${500 - arrow}`, 8000, 200))) { console.log('    arrow@' + L + ':', await ev(`${B}.beast.hpNow`)); return false; }
    await until(`${B}.state === 'pick'`, 15000, 250);
  }
  return true;
})());
// aquarius on real sub-half strikes; TWO waters in one battle at L42
ok('the waters heal 5 / 8 / 16 on a real sub-half strike', await (async () => {
  for (const [L, heal] of [[1, 5], [22, 8], [50, 16]]) {
    await ev(`(() => { const b = ${B}; b.sign = 'aquarius'; b.signLv = ${L}; b.watersLeft = 1; b.shellUsed = true; b.shieldLeft = 0;
      b.run.sigils = []; b.run.hpMax = 200; b.run.hp = 105; b.beast.atk = 10; b.beast.hpNow = 99999; b.beast.count = 1; b.tickEnemy(() => {}); return 'ok' })()`);
    if (!(await until(`${B}.run.hp === ${95 + heal}`, 15000, 250))) { console.log('    waters@' + L + ':', await ev(`${B}.run.hp`)); return false; }
  }
  return true;
})());
ok('at L42 the waters pour TWICE in one battle, and never a third time', await (async () => {
  await ev(`(() => { const b = ${B}; b.sign = 'aquarius'; b.signLv = 42; b.watersLeft = ssSignVal('aquarius', 'charges', 42);
    b.run.hpMax = 200; b.run.hp = 105; b.beast.atk = 10; b.beast.hpNow = 99999; b.beast.count = 1; b.tickEnemy(() => {}); return 'ok' })()`);
  if (!(await until(`${B}.run.hp === 107`, 15000, 250))) return false;         // 95 + 12 (heal@42)
  await ev(`${B}.beast.count = 1; ${B}.tickEnemy(() => {}); 'ok'`);
  if (!(await until(`${B}.run.hp === 109`, 15000, 250))) return false;         // 97 + 12
  await ev(`${B}.beast.count = 1; ${B}.tickEnemy(() => {}); 'ok'`);
  await until(`${B}.run.hp === 99`, 15000, 250);                               // 109 − 10, no pour
  await sleep(800);
  return (await ev(`${B}.run.hp`)) === 99 && (await ev(`${B}.watersLeft`)) === 0;
})());

/* ---- taurus + virgo need the battle CREATED under the sign ---- */
ok('the bull\'s vessel at create: hpMax 58 / 70 / 88 (dial + the reward its level holds)', await (async () => {
  for (const [L, hpMax] of [[1, 58], [22, 70], [50, 88]]) {
    await ev(`${seedLv('taurus', L)} localStorage.setItem('beta3.campsign', 'taurus'); localStorage.removeItem('beta3.campaign'); localStorage.removeItem('beta3.camproster'); 'ok'`);
    await ev(`${B}.scene.restart({ mode: 'campaign', resume: null }); 'ok'`);
    await until(PICK, 30000);
    const d = await evj(`JSON.stringify({ sign: ${B}.sign, max: ${B}.run.hpMax, hp: ${B}.run.hp })`);
    if (d.sign !== 'taurus' || d.max !== hpMax || d.hp !== hpMax) { console.log('    taurus@' + L + ':', JSON.stringify(d)); return false; }
  }
  return true;
})());
ok('the maiden purifies TWICE at L29 by real handler taps — arm, tile, arm, tile, and the third tap is dead', await (async () => {
  await ev(`${seedLv('virgo', 29)} localStorage.setItem('beta3.campsign', 'virgo'); localStorage.removeItem('beta3.campaign'); localStorage.removeItem('beta3.camproster'); 'ok'`);
  await ev(`${B}.scene.restart({ mode: 'campaign', resume: null }); 'ok'`);
  await until(PICK, 30000);
  if (await ev(`${B}.purifyLeft`) !== 2) return false;
  const ch0 = await ev(`${B}.board[0].ch`);
  await ev(`${B}.signTap(); 'ok'`);
  if (await ev(`${B}.purifyArmed`) !== true) return false;
  await ev(`${B}.tapTile(0); 'ok'`);
  await settle();
  if (await ev(`${B}.purifyLeft`) !== 1 || await ev(`${B}.purifyArmed`) !== false) return false;
  // the glow keeps its charged breath while a charge stands (the counter law)
  if (!(await until(`${B}.signGlow.alpha > 0.02`, 5000, 200))) return false;
  await ev(`${B}.signTap(); 'ok'`);
  if (await ev(`${B}.purifyArmed`) !== true) return false;
  await ev(`${B}.tapTile(1); 'ok'`);
  await settle();
  if (await ev(`${B}.purifyLeft`) !== 0) return false;
  await ev(`${B}.signTap(); 'ok'`);
  return (await ev(`${B}.purifyArmed`)) === false;
})());

/* ================= 4. XP accrual ================= */
console.log('\n— XP ACCRUAL —');
ok('a campaign fell pays 12 AT the fell (before the pick resolves)', await (async () => {
  await ev(`${seedLv('leo', 1)} SS.prof.signs.leo.xp = 0; localStorage.setItem('beta3.campsign', 'leo'); localStorage.removeItem('beta3.campaign'); localStorage.removeItem('beta3.camproster'); 'ok'`);
  await ev(`${B}.scene.restart({ mode: 'campaign', resume: null }); 'ok'`);
  await until(PICK, 30000);
  const st = await fell();
  const xp = await ev(`SS.prof.signs.leo.xp`);
  if (xp !== 12) { console.log('    xp:', xp, 'state:', st); return false; }
  if (st === 'sigil' || st === 'upgrade') await takeCard();
  return true;
})());
ok('a boss-TIER fell pays 27 (12 + 15 — STRIX, the act-I closer)', await (async () => {
  await ev(`${B}.run.fightIdx = 4; ${B}.startFight(); 'ok'`);
  await until(PICK, 20000);
  const before = await ev(`SS.prof.signs.leo.xp`);
  const st = await fell();
  const xp = await ev(`SS.prof.signs.leo.xp`);
  if (xp !== before + 27) { console.log('    xp:', before, '→', xp, st); return false; }
  if (st === 'sigil' || st === 'upgrade') await takeCard();
  return true;
})());
ok('the campaign clear pays +120 at endRun, and a loss right after moves nothing more', await (async () => {
  const before = await ev(`SS.prof.signs.leo.xp`);
  await ev(`${B}.endRun(true); 'ok'`);
  await sleep(700);
  const won = await ev(`SS.prof.signs.leo.xp`);
  if (won !== before + 120) { console.log('    clear xp:', before, '→', won); return false; }
  // silence the pending rite for the next probes: this book is XP only
  await ev(`SS.prof.signs.leo.ack = ssSignLvFor(SS.prof.signs.leo.xp); SS.save(); 'ok'`);
  return true;
})());
ok('an endless fell pays the same 12 through its own ladder', await (async () => {
  await ev(`localStorage.removeItem('beta3.endless'); localStorage.setItem('beta3.endsign', 'aries'); ${seedLv('aries', 22)} SS.prof.signs.aries.xp = SS_SIGNLV.cum[22]; SS.save(); 'ok'`);
  await ev(`${B}.scene.restart({ mode: 'endless', resume: null }); 'ok'`);
  await until(PICK, 30000);
  const before = await ev(`SS.prof.signs.aries.xp`);
  const st = await fell();
  const xp = await ev(`SS.prof.signs.aries.xp`);
  if (xp !== before + 12) { console.log('    endless xp:', before, '→', xp, st); return false; }
  if (st === 'sigil' || st === 'upgrade') await takeCard();
  return true;
})());
ok('a LOSS keeps its fells\' XP (endRun(false) moves nothing)', await (async () => {
  const before = await ev(`SS.prof.signs.aries.xp`);
  await ev(`SS.prof.signs.aries.ack = ssSignLvFor(${before}); ${B}.endRun(false); 'ok'`);
  await sleep(700);
  return (await ev(`SS.prof.signs.aries.xp`)) === before;
})());
ok('a QUICK fell moves no sign record (unsigned by construction)', await (async () => {
  await boot('quick=1');
  await until(PICK, 60000);
  const st = await fell();
  if (st === 'sigil' || st === 'upgrade') await takeCard();
  return ev(`Object.keys(SS.prof.signs || {}).length === 0`);
})());
ok('a DAILY fell moves no sign record either', await (async () => {
  await boot('daily=1');
  await until(PICK, 60000);
  if (await ev(`${B}.mode`) !== 'daily') return false;
  const st = await fell();
  if (st === 'sigil' || st === 'upgrade') await takeCard();
  return ev(`Object.keys(SS.prof.signs || {}).length === 0`);
})());
const vsrc = readFileSync('versus.js', 'utf8') + readFileSync('rival.js', 'utf8');
ok('versus + rival carry ZERO sign-level references (asserted from source)',
  !/signXp|ssSignVal|ssSignLv|signLv|SS_SIGN_XP/.test(vsrc));

/* ================= 5. the moment ================= */
console.log('\n— THE LEVEL-UP MOMENT —');
ok('one fell short of L2, a real fell crosses, and the END SCREEN plays the sign rite — ack spent AT SHOW', await (async () => {
  await ev(`${seedLv('leo', 1)} SS.prof.signs.leo.xp = SS_SIGNLV.cum[2] - 12; SS.prof.signs.leo.ack = 1; SS.save();
    localStorage.setItem('beta3.campsign', 'leo'); localStorage.removeItem('beta3.campaign'); localStorage.removeItem('beta3.camproster'); 'ok'`);
  await ev(`${B}.scene.restart({ mode: 'campaign', resume: null }); 'ok'`);
  await until(PICK, 30000);
  const st = await fell();
  if (st === 'sigil' || st === 'upgrade') await takeCard();
  if (await ev(`ssSignLvFor(SS.prof.signs.leo.xp)`) !== 2) return false;
  await ev(`${B}.endRun(false); 'ok'`);
  const rose = await until(`(() => { const c = ${B}.children.list.find((o) => o.getData && o.getData('signRite'));
    return !!c && c.getData('signRite') === 'leo' && c.getData('signRiteLv') === 2 })()`, 15000, 250);
  if (!rose) return false;
  // spend-at-show: ack moved the moment the rite BUILT, rite still up
  if (await ev(`SS.prof.signs.leo.ack`) !== 2) return false;
  await shot('rite-leo-2');
  // the rite carries the LEVELLED desc (leo add@2 = 4) and a real tap lets it out
  const hasDesc = await ev(`(() => { const c = ${B}.children.list.find((o) => o.getData && o.getData('signRite'));
    let hit = false; const w = (ls) => ls.forEach((o) => { if (o.getData && o.getData('textBlock') && o.getData('signDesc')) hit = true; if (o.list) w(o.list); });
    w(c.list); return hit })()`);
  if (!hasDesc) return false;
  await tap(`${B}.children.list.find((o) => o.getData && o.getData('signRite')).list[0]`);
  await until(`!${B}.children.list.some((o) => o.getData && o.getData('signRite'))`, 8000, 250);
  return ev(`ssSignPending().length === 0`);
})());
ok('a sigil discovery AND a level-up in one run: the forge rite says its piece, THEN the sign rite — never stacked', await (async () => {
  await ev(`${seedLv('leo', 2)} SS.prof.signs.leo.xp = SS_SIGNLV.cum[3] + 5; SS.prof.signs.leo.ack = 2;
    SS.prof.sig.pend = ['storm']; SS.prof.sig.u.storm = 1; SS.save(); 'ok'`);
  await ev(`${B}.scene.restart({ mode: 'campaign', resume: null }); 'ok'`);
  await until(PICK, 30000);
  await ev(`${B}.endRun(false); 'ok'`);
  const forge = await until(`(() => { const c = ${B}.children.list.find((o) => o.getData && o.getData('sigilRite'));
    return !!c && c.getData('sigilRite') === 'storm' })()`, 15000, 250);
  if (!forge) return false;
  if (await ev(`${B}.children.list.some((o) => o.getData && o.getData('signRite'))`)) return false;   // never together
  await tap(`${B}.children.list.find((o) => o.getData && o.getData('sigilRite')).list[0]`);
  const sign = await until(`(() => { const c = ${B}.children.list.find((o) => o.getData && o.getData('signRite'));
    return !!c && c.getData('signRiteLv') === 3 && !${B}.children.list.some((o) => o.getData && o.getData('sigilRite')) })()`, 15000, 250);
  if (!sign) return false;
  await tap(`${B}.children.list.find((o) => o.getData && o.getData('signRite')).list[0]`);
  await until(`!${B}.children.list.some((o) => o.getData && o.getData('signRite'))`, 8000, 250);
  return true;
})());
ok('an end screen never seen → the MEADOW says it once (signNotice), after the sigil queue', await (async () => {
  await ev(`SS.prof.signs.leo.xp = SS_SIGNLV.cum[5]; SS.prof.signs.leo.ack = 4; SS.save(); 'ok'`);
  await ev(`${B}.goHome({ from: 'defeat' }); 'ok'`);
  const rose = await until(`(() => { const h = ${H}; if (!h.sys.isActive()) return false;
    const c = h.children.list.find((o) => o.getData && o.getData('signRite'));
    return !!c && c.getData('signRite') === 'leo' && c.getData('signRiteLv') === 5 })()`, 30000, 300);
  if (!rose) return false;
  if (await ev(`SS.prof.signs.leo.ack`) !== 5) return false;
  await tap(`${H}.children.list.find((o) => o.getData && o.getData('signRite')).list[0]`);
  await until(`!${H}.children.list.some((o) => o.getData && o.getData('signRite'))`, 8000, 250);
  await sleep(2500);
  return ev(`ssSignPending().length === 0 && !${H}.children.list.some((o) => o.getData && o.getData('signRite'))`);
})());
ok('no page exceptions (the moment)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 6. migration ================= */
console.log('\n— THE VETERAN\'S SEED —');
ok('a pre-v0.69 profile (leo 3 clears · 5 runs) wakes at xp 1560 = L13, ack 13, and the meadow stays SILENT', await (async () => {
  await boot('', `localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000,
    signs: { leo: { best: 1234, clears: 3, runs: 5, eBest: 0 } } }));`);
  await until(HOME, 60000);
  const d = await evj(`JSON.stringify({ xp: SS.prof.signs.leo.xp, ack: SS.prof.signs.leo.ack, lv: ssSignLv('leo') })`);
  if (d.xp !== 1560 || d.ack !== 13 || d.lv !== 13) { console.log('    ', JSON.stringify(d)); return false; }
  await sleep(5000);
  return ev(`!${H}.children.list.some((o) => o.getData && o.getData('signRite'))`);
})());
ok('ten clears seed EXACTLY the cap: 3230 = L20, never past the today-band\'s foot', await (async () => {
  await boot('', `localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000,
    signs: { aries: { best: 5000, clears: 10, runs: 40, eBest: 30 } } }));`);
  await until(HOME, 60000);
  return (await evj(`JSON.stringify(SS.prof.signs.aries.xp === 3230 && ssSignLv('aries') === 20)`)) === true;
})());
ok('a fresh profile seeds nothing (every sign level 1); a planted xp-less record reads L1 without throwing', await (async () => {
  await boot('');
  await until(HOME, 60000);
  return ev(`(() => { if (ssSignLv('leo') !== 1) return false;
    SS.prof.signs.virgo = { best: 0, clears: 0, runs: 0 };
    return ssSignLv('virgo') === 1 && ssSignPending().length === 0 })()`);
})());

/* ================= 7. rewards ================= */
console.log('\n— THE REWARD FRAMEWORK —');
ok('crossing 10 by a real fell → the rite names the vessel', await (async () => {
  await boot('', `localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 }));
    localStorage.setItem('beta3.campsign', 'aries');`);
  await until(HOME, 60000);
  await ev(`SS.prof.signs.aries = { best: 0, clears: 0, runs: 0, xp: SS_SIGNLV.cum[10] - 12, ack: 9 }; SS.save(); 'ok'`);
  await ev(`${H}.scene.start('battle', { mode: 'campaign', resume: null }); 'ok'`);
  await until(PICK, 60000);
  const st = await fell();
  if (st === 'sigil' || st === 'upgrade') await takeCard();
  if (await ev(`ssSignLvFor(SS.prof.signs.aries.xp)`) !== 10) return false;
  await ev(`${B}.endRun(false); 'ok'`);
  const rose = await until(`(() => { const c = ${B}.children.list.find((o) => o.getData && o.getData('signRite'));
    return !!c && c.getData('signRiteLv') === 10 })()`, 15000, 250);
  if (!rose) return false;
  await shot('rite-aries-10-reward');
  const named = await ev(`(() => { const c = ${B}.children.list.find((o) => o.getData && o.getData('signRite'));
    let hit = false; const w = (ls) => ls.forEach((o) => { if (o.getData && o.getData('textBlock') && o.getData('signReward')) hit = true; if (o.list) w(o.list); });
    w(c.list); return hit })()`);
  if (!named) return false;
  await tap(`${B}.children.list.find((o) => o.getData && o.getData('signRite')).list[0]`);
  await until(`!${B}.children.list.some((o) => o.getData && o.getData('signRite'))`, 8000, 250);
  return true;
})());
ok('the NEXT signed run opens with +5 max health (55) — and at L25 it is +10 (60), not +15', await (async () => {
  // endRun's books wiped the campaign pin (ssClearCampaign) — re-pin the
  // sign the way the picker (or the end screen's TRY AGAIN) would
  await ev(`localStorage.setItem('beta3.campsign', 'aries'); 'ok'`);
  await ev(`${B}.scene.restart({ mode: 'campaign', resume: null }); 'ok'`);
  await until(PICK, 30000);
  if (await ev(`${B}.run.hpMax`) !== 55) { console.log('    @10:', await ev(`${B}.run.hpMax`)); return false; }
  await ev(`${seedLv('aries', 25)} localStorage.removeItem('beta3.campaign'); 'ok'`);
  await ev(`${B}.scene.restart({ mode: 'campaign', resume: null }); 'ok'`);
  await until(PICK, 30000);
  return (await ev(`${B}.run.hpMax`)) === 60;
})());
ok('at L40+ the OPENING battle deals one gilded tile through the pending queue — and stacks with GILDED DAWN', await (async () => {
  await ev(`${seedLv('aries', 40)} localStorage.setItem('beta3.campsign', 'aries'); localStorage.removeItem('beta3.campaign'); 'ok'`);
  await ev(`${B}.scene.restart({ mode: 'campaign', resume: null }); 'ok'`);
  await until(PICK, 30000);
  await settle();
  const g1 = await evj(`JSON.stringify(${B}.board.filter(Boolean).filter((s) => s.tier === 1).length)`);
  if (g1 !== 1) { console.log('    solo gilded:', g1); return false; }
  // GILDED DAWN alongside: re-deal fight 0 with the sigil held → the sum
  await ev(`${B}.run.sigils = ['gilded']; ${B}.run.tiers = { gilded: 1 }; ${B}.run.fightIdx = 0; ${B}.startFight(); 'ok'`);
  await until(PICK, 20000);
  await settle();
  const g2 = await evj(`JSON.stringify(${B}.board.filter(Boolean).filter((s) => s.tier === 1).length)`);
  if (g2 !== 2) { console.log('    stacked gilded:', g2); return false; }
  // …and fight 1+ deals none from the reward (fight-0 only)
  await ev(`${B}.run.sigils = []; ${B}.run.fightIdx = 1; ${B}.startFight(); 'ok'`);
  await until(PICK, 20000);
  await settle();
  return (await evj(`JSON.stringify(${B}.board.filter(Boolean).filter((s) => s.tier === 1).length)`)) === 0;
})());
ok('a QUICK run gets no vessel at any level (sign null)', await (async () => {
  await ev(`${B}.scene.restart({ mode: 'quick', resume: null }); 'ok'`);
  await until(PICK, 30000);
  return (await ev(`${B}.run.hpMax`)) === 50 && (await ev(`${B}.sign`)) === null;
})());

/* ================= 8. the picker by real taps ================= */
console.log('\n— THE PICKER —');
await boot('', `localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000,
  signs: { aries: { best: 0, clears: 0, runs: 2, eBest: 0, xp: 250, ack: 4 },
           leo: { best: 9000, clears: 40, runs: 40, eBest: 0, xp: 16286, ack: 50 } } }));`);
ok('the meadow stands', await until(HOME, 60000));
const SHEET = `!!${H}.signC && !!${H}.signPeek`;
ok('a real tap on NEW GAME opens the picker on THE OPEN SKY', await tapUntil(`${H}.rowBtns.newcamp`, `${SHEET} && ${H}.signPeek().id === 'none'`, 8));
ok('THE OPEN SKY carries NO level row and no bar', await ev(`(() => { const k = ${H}.signPeek().card;
  return !k.list.some((o) => o.getData && o.getData('signLvRow')) && !k.list.some((o) => o.getData && o.getData('signLvFill')) })()`));
const arrowR = `${H}.signC.list.find((o) => o.type === 'Text' && o.text === '›')`;
ok('› lands on ARIES wearing LEVEL 4 and a bar at its true fraction (xp 250)', await (async () => {
  if (!(await tapUntil(arrowR, `${SHEET} && !${H}.signPeek().moving && ${H}.signPeek().id === 'aries'`, 6))) return false;
  const d = await evj(`JSON.stringify((() => { const k = ${H}.signPeek().card;
    const t = k.list.find((o) => o.getData && o.getData('signLvRow'));
    const f = k.list.find((o) => o.getData && o.getData('signLvFill'));
    return { label: t && t.text, frac: f && f.getData('signLvFill'), cropW: f && f.frame.cutWidth } })())`);
  const want = (250 - 222) / (320 - 222);   // cum[4]=222, cum[5]=320
  if (!d.label || d.label !== 'LEVEL 4') { console.log('    ', JSON.stringify(d)); return false; }
  return Math.abs(d.frac - want) < 0.02;
})());
ok('the aries desc speaks at LEVEL 4\'s number (ram 4 — the L1 rung holds to 5)', await ev(
  `(() => { const k = ${H}.signPeek().card; const b = k.list.find((o) => o.getData && o.getData('zodDesc'));
    return !!b && b.lines.map((t) => t.text).join(' ').includes('takes 4') })()`));
await shot('picker-aries-lv4');
ok('the LIVE DIAL cannot drift: bump aries.pw.ram in-page → the rebuilt card prints the new number', await (async () => {
  await ev(`SS_ZODIAC_BY.aries.pw.ram[0][1] = 7; 'ok'`);
  await tapUntil(arrowR, `${SHEET} && !${H}.signPeek().moving && ${H}.signPeek().id === 'taurus'`, 6);
  await tapUntil(`${H}.signC.list.find((o) => o.type === 'Text' && o.text === '‹')`, `${SHEET} && !${H}.signPeek().moving && ${H}.signPeek().id === 'aries'`, 6);
  const drift = await ev(`(() => { const k = ${H}.signPeek().card; const b = k.list.find((o) => o.getData && o.getData('zodDesc'));
    return b.lines.map((t) => t.text).join(' ').includes('takes 7') })()`);
  await ev(`SS_ZODIAC_BY.aries.pw.ram[0][1] = 4; 'ok'`);
  return drift;
})());
ok('LEO at the summit wears LEVEL 50 · AT ITS HEIGHT over a solid bar', await (async () => {
  for (let i = 0; i < 4; i++) await tapUntil(arrowR, `${SHEET} && !${H}.signPeek().moving`, 3);
  if ((await evj(`JSON.stringify(${H}.signPeek().id)`)) !== 'leo') return false;
  const d = await evj(`JSON.stringify((() => { const k = ${H}.signPeek().card;
    const t = k.list.find((o) => o.getData && o.getData('signLvRow'));
    const f = k.list.find((o) => o.getData && o.getData('signLvFill'));
    return { label: t && t.text, frac: f && f.getData('signLvFill') } })())`);
  return d.label === 'LEVEL 50 · AT ITS HEIGHT' && d.frac === 1;
})());
await shot('picker-leo-50');
ok('BEGIN under LEO pins the sign and opens the chart (the campaign door still rises)', await tapUntil(
  `${H}.signC.list.find((o) => o.texture && /^btn/.test(o.texture.key) && o.displayWidth > 200)`,
  `!${H}.signC && !!${H}.mapC && localStorage.getItem('beta3.campsign') === 'leo'`, 6));
ok('…and the ENDLESS door serves the same picker whose BEGIN rises at once', await (async () => {
  await ev(`(() => { const h = ${H}; if (h.mapC) { h.mapC.destroy(); h.mapC = null; } ssClearCampaign(); ssClearEndless(); return 'ok' })()`);
  await sleep(600);
  if (!(await tapUntil(`${H}.rowBtns.endless`, SHEET, 8))) return false;
  const okRow = await ev(`(() => { const k = ${H}.signPeek().card; return !k.list.some((o) => o.getData && o.getData('signLvRow')) })()`);
  if (!okRow) return false;   // open sky leads the endless deck too
  return tapUntil(`${H}.signC.list.find((o) => o.texture && /^btn/.test(o.texture.key) && o.displayWidth > 200)`,
    `!!${B} && ${B}.scene.isActive() && ${B}.mode === 'endless'`, 6);
})());
ok('no page exceptions (the picker)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 9. profile + geometry ================= */
console.log('\n— THE PROFILE WHEEL + THE LAYOUT LAW —');
// sign-check's LAYOUT judge, verbatim shape, root parameterized
const LAYOUT = (root) => `(() => { const s = ${H}; const D = game.scale.width / innerWidth; const HH = game.scale.height, W = game.scale.width, it = SS_INSET.top * D, ib = SS_INSET.bottom * D, tol = 1.5 * D;
  const out = { band: [], clip: [], small: [], overlap: [], law: [], texts: 0, targets: 0 };
  const items = []; const vis = (o) => { for (let p = o; p; p = p.parentContainer) if (!p.visible || p.alpha < 0.05) return false; return true; };
  const walk = (ls) => ls.forEach(o => { if (o.list && !(o.getData && o.getData('textBlock'))) { if (o.visible) walk(o.list); }
    if (!vis(o) || !o.getBounds) return; const isText = o.type === 'Text', hit = !!(o.input && o.input.enabled); if (!isText && !hit) return;
    const b = o.getBounds(); const bb = { x: b.x, y: b.y, r: b.right, b: b.bottom, w: b.width, h: b.height };
    if (bb.w >= W * 0.9 && bb.h >= HH * 0.9) return; const name = (isText ? o.text : (o.texture && o.texture.key) || o.type).slice(0, 22);
    items.push({ o, b: bb, isText, hit, name }); });
  walk(${root});
  for (const it2 of items) { const { b, isText, hit, name } = it2; if (isText) out.texts++; if (hit) out.targets++;
    const p = isText ? (it2.o.padding ? Math.max(it2.o.padding.top || 0, it2.o.padding.bottom || 0) : 0) : 0; const top = b.y + p, bot = b.b - p;
    if (top < it - tol || bot > HH - ib + tol) out.band.push(name + '@' + Math.round(top / D) + '-' + Math.round(bot / D));
    if (bot > HH + tol || b.r > W + tol || b.x < -tol) out.clip.push(name);
    if (hit) { const ha = it2.o.input.hitArea; const sx = Math.abs(it2.o.scaleX || 1), sy = Math.abs(it2.o.scaleY || 1);
      const hw = ha && ha.width ? ha.width * sx : b.w, hh = ha && ha.height ? ha.height * sy : b.h;
      if (Math.min(hw, hh) / D < 43.5) out.small.push(name + ' ' + Math.round(hw / D) + 'x' + Math.round(hh / D)); }
    if (isText) { const t = it2.o.text || ''; if (t.includes('\\n')) out.law.push('nl:' + t.slice(0, 20));
      else if (it2.o.style.wordWrapWidth) { const w = it2.o.getWrappedText(t); if ((Array.isArray(w) ? w.length : String(w).split('\\n').length) > 1) out.law.push('wrap:' + t.slice(0, 20)); } } }
  const tx = items.filter(i => i.isText && i.o.alpha > 0.3);
  for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) { const a = tx[i], c = tx[j];
    if (a.o.parentContainer && a.o.parentContainer === c.o.parentContainer && a.o.parentContainer.getData && a.o.parentContainer.getData('textBlock')) continue;
    const pa = a.o.padding ? Math.max(a.o.padding.left || 0, a.o.padding.top || 0) : 0, pc = c.o.padding ? Math.max(c.o.padding.left || 0, c.o.padding.top || 0) : 0;
    const ax = a.b.x + pa, ay = a.b.y + pa, ar = a.b.r - pa, ab = a.b.b - pa; const cx = c.b.x + pc, cy = c.b.y + pc, cr = c.b.r - pc, cb = c.b.b - pc;
    const iw = Math.min(ar, cr) - Math.max(ax, cx), ih = Math.min(ab, cb) - Math.max(ay, cy); if (iw > tol && ih > tol) out.overlap.push(a.name + '×' + c.name); }
  return JSON.stringify(out) })()`;
const judge = async (tag, root) => {
  const lay = await evj(LAYOUT(root || `s.signC.list`));
  ok(`${tag}: ${lay.texts} texts + ${lay.targets} targets in the safe band, none clipped, no overlap, one-line law, 44-pt targets`,
    lay.band.length === 0 && lay.clip.length === 0 && lay.overlap.length === 0 && lay.law.length === 0 && lay.small.length === 0,
    lay.band.concat(lay.clip, lay.overlap, lay.law, lay.small).slice(0, 5).join(', '));
};
ok('the profile wheel wears level numerals on the PLAYED signs only, matching ssSignLv', await (async () => {
  await ev(`(() => { const b = ${B}; if (b && b.scene.isActive()) b.goHome({ from: 'defeat' }); return 'ok' })()`).catch(() => { });
  await until(HOME, 30000);
  await ev(`SS.prof.signs = { leo: { best: 1234, clears: 2, runs: 3, xp: SS_SIGNLV.cum[13], ack: 13 },
    aries: { best: 0, clears: 0, runs: 1, xp: 40, ack: 1 } }; SS.save(); 'ok'`);
  const opened = await tapUntil(`${H}.profileChip`, `!!game.scene.getScene('profile') && game.scene.getScene('profile').sys.isActive()`, 8);
  if (!opened) return false;
  await sleep(700);
  const d = await evj(`JSON.stringify((() => { const p = game.scene.getScene('profile');
    const nums = p.children.list.filter((o) => o.getData && o.getData('signWheelLv')).map((o) => ({ id: o.getData('signWheelLv'), t: o.text }));
    return nums })())`);
  const leo = d.find((n) => n.id === 'leo'), ar = d.find((n) => n.id === 'aries');
  await shot('profile-wheel');
  return d.length === 2 && leo && leo.t === '13' && ar && ar.t === '1';
})());
ok('the profile scene holds the layout law with the numerals on', await (async () => {
  const lay = await evj(LAYOUT(`game.scene.getScene('profile').children.list`).replace(`const s = ${H};`, `const s = game.scene.getScene('profile');`));
  const okAll = lay.band.length === 0 && lay.clip.length === 0 && lay.overlap.length === 0 && lay.law.length === 0;
  if (!okAll) console.log('    ', JSON.stringify({ band: lay.band, clip: lay.clip, overlap: lay.overlap, law: lay.law }).slice(0, 300));
  return okAll;
})());
// the picker geometry at the three glasses, over the stops the plan names
for (const dv of [{ name: 'iPhone 16', w: 393, h: 852, dpr: 3, inset: '59,34' },
  { name: 'iPhone SE', w: 375, h: 667, dpr: 2, inset: '0,0' },
  { name: 'iPad', w: 820, h: 1180, dpr: 2, inset: '24,20' }]) {
  console.log(`\n━━ ${dv.name} — ${dv.w}×${dv.h} @${dv.dpr}`);
  await send('Emulation.setDeviceMetricsOverride', { width: dv.w, height: dv.h, deviceScaleFactor: dv.dpr, mobile: true, screenWidth: dv.w, screenHeight: dv.h, screenOrientation: { type: 'portraitPrimary', angle: 0 } });
  await boot('inset=' + dv.inset, `localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000,
    signs: { leo: { best: 1234, clears: 2, runs: 3, eBest: 0, xp: 1560, ack: 13 },
             virgo: { best: 0, clears: 0, runs: 1, eBest: 0, xp: ${16286}, ack: 50 } } }));`);
  ok('home stands', await until(HOME, 90000));
  ok('the picker opens', await tapUntil(`${H}.rowBtns.newcamp`, SHEET, 8));
  await sleep(500);
  await judge(dv.name + ' · open sky');
  ok('› to ARIES', await tapUntil(arrowR, `${SHEET} && !${H}.signPeek().moving && ${H}.signPeek().id === 'aries'`, 6));
  await judge(dv.name + ' · aries (level row on)');
  for (let i = 0; i < 5; i++) await tapUntil(arrowR, `${SHEET} && !${H}.signPeek().moving`, 3);
  ok('five more › land on VIRGO at her summit (the longest desc + the crown label)', (await evj(`JSON.stringify(${H}.signPeek().id)`)) === 'virgo');
  await judge(dv.name + ' · virgo L50');
  await shot('picker-virgo-' + dv.name.replace(/\s/g, ''));
}
await send('Emulation.clearDeviceMetricsOverride');
ok('no page exceptions (geometry)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 10. i18n ================= */
console.log('\n— THE TONGUES —');
for (const lang of ['es', 'de']) {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(400);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1');
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000, signs: { aries: { best: 0, clears: 1, runs: 1, eBest: 0, xp: 990, ack: 10 } } })); 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0&lang=' + lang }); await sleep(2500);
  ok(lang + ': home stands', await until(HOME, 90000));
  ok(lang + ': the picker card speaks the levelled desc with real numbers (no %1 residue)', await (async () => {
    if (!(await tapUntil(`${H}.rowBtns.newcamp`, SHEET, 8))) return false;
    if (!(await tapUntil(arrowR, `${SHEET} && !${H}.signPeek().moving && ${H}.signPeek().id === 'aries'`, 6))) return false;
    const d = await evj(`JSON.stringify((() => { const k = ${H}.signPeek().card;
      const b = k.list.find((o) => o.getData && o.getData('zodDesc'));
      const t = k.list.find((o) => o.getData && o.getData('signLvRow'));
      return { desc: b.lines.map((x) => x.text).join(' '), label: t && t.text } })())`);
    // aries at L10 reads ram 5 in its own tongue, and the row wears the pack's level word
    const wantLv = lang === 'es' ? 'NIVEL 10' : 'STUFE 10';
    return d.desc.includes('5') && !/%\d/.test(d.desc) && d.label === wantLv;
  })());
  ok(lang + ': the rite wears the pack\'s dress — head, nameplate level word, levelled desc, no %k', await (async () => {
    await ev(`(() => { const h = ${H}; if (h.signC) { h.signC.destroy(); h.signC = null; } return 'ok' })()`);
    await sleep(400);
    await ev(`ssSignRite(${H}, SS_ZODIAC_BY.aries, 22, null); 'ok'`);
    const up = await until(`!!${H}.children.list.find((o) => o.getData && o.getData('signRite'))`, 8000, 250);
    if (!up) return false;
    await sleep(1600);
    const d = await evj(`JSON.stringify((() => { const c = ${H}.children.list.find((o) => o.getData && o.getData('signRite'));
      const texts = []; const w = (ls) => ls.forEach((o) => { if (o.type === 'Text') texts.push(o.text); if (o.list) w(o.list); }); w(c.list);
      return texts })())`);
    await shot('rite-' + lang);
    await tap(`${H}.children.list.find((o) => o.getData && o.getData('signRite')).list[0]`);
    await until(`!${H}.children.list.some((o) => o.getData && o.getData('signRite'))`, 8000, 250);
    const joined = d.join(' | ');
    const head = lang === 'es' ? 'TU SIGNO ASCIENDE' : 'DEIN ZEICHEN STEIGT AUF';
    return joined.includes(head) && !/%\d/.test(joined) && joined.includes('8');   // ram@22 = 8 in the desc
  })());
}
ok('no page exceptions (the tongues)', errs.length === 0, errs.join(' | ').slice(0, 200));

console.log(`\n${pass} passed, ${fail} failed`);
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
