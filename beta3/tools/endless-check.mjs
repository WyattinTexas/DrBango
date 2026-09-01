// ENDLESS-CHECK — fight until you fall, see how far you climb (v0.68.0).
// Skylar (9/1): "the players will keep playing, getting random enemies and
// then sometimes bosses mixed in, and it just keeps getting progressively
// harder and harder to see how far they can make it. At the end it should
// read what level they got to, if that's their highest level … if that's
// high score … There should be a leaderboard for endless showing what the
// highest level that person got to and what was their score … If you ever
// lose to a beast, your run should end and then it should give you stats on
// that endless run." The game side: SS_ENDLESS (data.js) is the curve —
// boss every 5th level, hp/atk/clock/curse dials, lvl-banded pools —
// walked by ssEndlessFights (game.js) off a per-run seed that rides the
// beta3.endless checkpoint (the ladder is UNBOUNDED: it extends itself
// deterministically before anyone can touch its edge). The meadow's
// ENDLESS door resumes a standing climb, offers CONTINUE/BEGIN ANEW when
// one stands, and opens the zodiac picker for a fresh one (powers apply
// exactly as in the campaign; the sign pins to beta3.endsign). A fall ends
// the climb — PHOENIX FEATHER's survive-once still counts — and the
// reckoning window reads the LEVEL REACHED with its own NEW BEST flag, the
// score with its own, and every stat the campaign summary shows.
// prof.endless {bestLevel, bestScore, runs} migrates in SS.load; the
// endless board (endless/all, ranked level then score, a weekly slice
// riding along) gets its own Board tab, seeded through the v0.64 ghost
// layer (levels 3-14, scores following the level, never above the best
// real climb). Endless pays NO rating (the ladder is its own ledger) and
// does not feed the daily lantern.
// Self-launching like cadence-check: serves beta3 on :8899 if nothing
// does, headless Chrome on :9467 (/tmp/cdp-endless, --disable-gpu),
// Firebase blocked at the network layer throughout (local sky).
//
//   node tools/endless-check.mjs      # ~5 min
//
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const PORT = 9467, SRV = 8899;
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
  '--user-data-dir=/tmp/cdp-endless', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
// is sometimes eaten (the v0.23 lesson) — tap until the condition lands
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
const PICK = `!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`;
const HOME = `!!window.game && ${H} && ${H}.sys.isActive() && !!${H}.menuRows`;
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1');
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
// keep the standing sky (profile, checkpoint) — a reload, not a wipe
const reboot = async (q) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`sessionStorage.setItem('beta3.skipIntro', '1'); 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
// fell the standing beast through the REAL death path (cadence-check's
// proven helper — wait for the board in hand first or the kill lands on
// the previous fight's corpse)
const fell = async () => {
  await until(`!!${B} && !${B}.dying && ${B}.state === 'pick'`, 20000, 250);
  const armed = await ev(`(() => { const b = ${B}; if (b.dying) return 'busy';
    b.beast.hpNow = -1; b.dying = true; b.beastDeath(); return 'ok' })()`);
  if (armed !== 'ok') return 'lost';
  const landed = await until(`(${B}.state === 'sigil' && ${B}.overlayC.list.some((o) => o.getData && o.getData('sigilCard') && o.alpha === 1))
    || ${B}.state === 'upgrade' || ${B}.state === 'map' || ${B}.state === 'end' || (${B}.state === 'pick' && !${B}.dying)`, 30000, 250);
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
// die where the run stands: no shield, 1 health, the strike due — the
// beast's own signature attack lands it (feather intercepts if held)
const die = async () => {
  await until(`!!${B} && !${B}.dying && ${B}.state === 'pick'`, 20000, 250);
  await ev(`(() => { const b = ${B}; b.shieldLeft = 0; b.run.hp = 1; b.beast.count = 1; b.tickEnemy(() => {}); return 'ok' })()`);
  return until(`${B}.state === 'end'`, 20000, 300);
};

console.log('\nENDLESS-CHECK · fight until you fall, see how far you climb\n');

/* ================= 1. the curve and the ladder ================= */
console.log('— THE CURVE (the card\'s balance sheet) —');
await boot('endless=1');
ok('endless battle at pick (?endless=1 seam)', await until(PICK, 60000));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
const curve = await evj(`JSON.stringify({
  be: SS_ENDLESS.bossEvery, hz: SS_ENDLESS.horizon,
  m: [1, 5, 10, 15, 20, 25, 30, 40, 50].map((l) => SS_ENDLESS.hpMult(l)),
  a: [1, 10, 20, 30, 50].map((l) => SS_ENDLESS.atkAdd(l)),
  t: [1, 15, 16, 35, 36].map((l) => SS_ENDLESS.timerCut(l)),
})`);
console.log('    · hpMult ' + curve.m.join(' / ') + ' @ L1/5/10/15/20/25/30/40/50');
console.log('    · atkAdd ' + curve.a.join(' / ') + ' @ L1/10/20/30/50 · timerCut ' + curve.t.join('/') + ' @ L1/15/16/35/36');
ok('a boss every 5th level', curve.be === 5);
ok('level 1 is a campaign opening (mult 1 · +0 atk)', curve.m[0] === 1 && curve.a[0] === 0);
ok('level 10 ≈ end of campaign act II (mult 1.35-1.8 · atk +2-5)', curve.m[2] >= 1.35 && curve.m[2] <= 1.8 && curve.a[1] >= 2 && curve.a[1] <= 5, 'mult ' + curve.m[2] + ' · atk +' + curve.a[1]);
ok('level 20 ≈ the campaign finale (mult 1.8-2.2 · atk +6-8)', curve.m[4] >= 1.8 && curve.m[4] <= 2.2 && curve.a[2] >= 6 && curve.a[2] <= 8, 'mult ' + curve.m[4] + ' · atk +' + curve.a[2]);
ok('level 30+ outgrows anything the campaign asks, no ceiling', curve.m[6] > 2.6 && curve.m[8] > curve.m[6] * 1.8 && curve.a[4] > curve.a[2] * 2, 'mult@30 ' + curve.m[6] + ' · @50 ' + curve.m[8]);
ok('the curve never dips (monotone in every dial)', await ev(`(() => {
  for (let l = 2; l <= 120; l++) {
    if (SS_ENDLESS.hpMult(l) < SS_ENDLESS.hpMult(l - 1)) return false;
    if (SS_ENDLESS.atkAdd(l) < SS_ENDLESS.atkAdd(l - 1)) return false;
    if (SS_ENDLESS.timerCut(l) < SS_ENDLESS.timerCut(l - 1)) return false;
  } return true })()`));
ok('the clock tightens at 16 and again at 36', curve.t.join() === '0,0,1,1,2');
const ladder = await evj(`(() => {
  const a = ssEndlessFights(777, 60), b = ssEndlessFights(777, 60), c = ssEndlessFights(777, 400);
  const out = { det: true, prefix: true, boss: true, tier: true, legal: true, rep: true,
    umbEarly: 0, umbDeep: 0, curseEarly: 0, curseDeep: 0, ink3: 0, caps: true };
  for (let i = 0; i < 60; i++) {
    if (a[i].id !== b[i].id || a[i].mult !== b[i].mult || a[i].umbral !== b[i].umbral) out.det = false;
    if (a[i].id !== c[i].id) out.prefix = false;
  }
  for (let i = 0; i < 400; i++) {
    const f = c[i], lv = i + 1, bz = SS_BEASTS[f.id];
    if (!bz) { out.legal = false; continue; }
    if ((lv % 5 === 0) !== (bz.tier === 'boss')) out.boss = false;
    if (lv % 5 !== 0 && bz.tier === 'boss') out.tier = false;
    if (i > 0 && f.id === c[i - 1].id) out.rep = false;
    if (lv < SS_ENDLESS.umbralFrom && f.umbral) out.umbEarly++;
    if (lv >= 15 && lv <= 60 && f.umbral) out.umbDeep++;
    if (lv % 5 === 0) {
      if (lv < SS_ENDLESS.curseFrom && f.curse) out.curseEarly++;
      if (lv >= SS_ENDLESS.curseFrom && f.curse !== 'blackout') out.curseDeep++;
      if (lv >= SS_ENDLESS.curseDeep && f.ink !== 3) out.ink3++;
      if (lv === 5 && (bz.lvl || 1) > 1) out.caps = false;
      if (lv === 10 && (bz.lvl || 1) > 2) out.caps = false;
    }
    if (lv <= 3 && (bz.lvl || 1) > 1) out.caps = false;
  }
  return JSON.stringify(out) })()`);
ok('the ladder is deterministic per seed', ladder.det);
ok('a longer build keeps its prefix exactly (the extension law)', ladder.prefix);
ok('bosses land on every 5th level and nowhere else', ladder.boss && ladder.tier);
ok('every rung draws a real beast, never twice running', ladder.legal && ladder.rep);
ok('the umbral dress waits for the deep sky, then mixes in', ladder.umbEarly === 0 && ladder.umbDeep > 3, ladder.umbDeep + ' umbral in L15-60');
ok('bosses take the void\'s curse from L' + 21 + ' (ink 3 from 41), never before', ladder.curseEarly === 0 && ladder.curseDeep === 0 && ladder.ink3 === 0);
ok('the early rungs stay a meadow (lvl-banded pools)', ladder.caps);
const plan = await evj(`(() => {
  const f = ssEndlessFights(31, 400);
  const p = [...ssSigilPlan('endless', f, 31)].sort((a, b) => a - b);
  const out = { hook: p[0] === 0, boss: true, gaps: true, band: 0 };
  for (let i = 4; i < 399; i += 5) if (!p.includes(i)) out.boss = false;
  for (let k = 1; k < p.length; k++) { const g = p[k] - p[k - 1]; if (g < 2 || g > 4) out.gaps = false; }
  out.band = Math.round(p.filter((i) => i < 100).length / 10);
  return JSON.stringify(out) })()`);
ok('the cadence pays the hook, every boss, gaps 2-4 forever', plan.hook && plan.boss && plan.gaps, '~' + plan.band + ' offers per 10 levels');
ok('the cadence row keeps its dials (gap 2-3 · up 0.35)', await ev(`SS_CADENCE.endless.gap.join() === '2,3' && SS_CADENCE.endless.up === 0.35 && SS_CADENCE.endless.actBoss === true`));
// beastFor pays the curve on the LIVE scene — and never poisons the def
const bf = await evj(`(() => { const b = ${B};
  const probe = (id, lv, curse) => {
    const f = { id, mult: SS_ENDLESS.hpMult(lv), atkAdd: SS_ENDLESS.atkAdd(lv), umbral: false };
    const tc = SS_ENDLESS.timerCut(lv);
    if (tc) f.tcut = tc;
    if (curse) { f.curse = 'blackout'; f.ink = lv >= SS_ENDLESS.curseDeep ? 3 : 2; }
    const base = SS_BEASTS[id], z = b.beastFor(f);
    return { hpOk: z.hp === Math.round(base.hp * f.mult), atkOk: z.atk === base.atk + f.atkAdd,
      timer: z.timer, baseTimer: base.timer, curse: z.fx && z.fx.curse, ink: z.fx && z.fx.ink };
  };
  const l25 = probe('leo', 25, true);
  const l45 = probe('serpens', 45, false);
  const draco = probe('draco', 25, true);
  return JSON.stringify({ l25, l45, draco, clean: SS_BEASTS.leo.fx.curse === undefined && SS_BEASTS.serpens.timer === 3 && SS_BEASTS.draco.fx.ink === 3 }) })()`);
ok('a deep boss pays the curve (leo @25: hp ×mult · atk +add · cursed ink 2 · clock −1)',
  bf.l25.hpOk && bf.l25.atkOk && bf.l25.curse === 'blackout' && bf.l25.ink === 2 && bf.l25.timer === bf.l25.baseTimer - 1,
  JSON.stringify(bf.l25));
ok('the deep clock squeezes to the floor of 2 (serpens @45: timer 3−2→2)', bf.l45.hpOk && bf.l45.atkOk && bf.l45.timer === 2 && !bf.l45.curse, JSON.stringify(bf.l45));
ok('a beast that carries its own deeper curse keeps it (draco ink 3 over 2)', bf.draco.ink === 3);
ok('the defs never learn what one fight dressed them in', bf.clean);
ok('no page errors (the curve)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 2. the door, the sign, the rise ================= */
console.log('\n— THE MEADOW DOOR —');
errs.length = 0;
await boot('');
ok('the meadow stands', await until(HOME, 30000));
await sleep(1200);
const menu = await evj(`JSON.stringify(${H}.menuRows.filter((m) => m.b.visible).map((m) => ({ k: m.key, y: Math.round(m.lab.rowY) })))`);
ok('no climb standing: NEW GAME · ENDLESS · VERSUS at 454/522/590', JSON.stringify(menu) === JSON.stringify([{ k: 'newcamp', y: 454 }, { k: 'endless', y: 522 }, { k: 'versus', y: 590 }]), JSON.stringify(menu));
ok('the virgin door speaks its verb', await ev(`${H}.rowSubs.endless.text === SS_T('endlessSub')`), await ev(`${H}.rowSubs.endless.text`));
const doorFit = await evj(`(() => { const h = ${H}; const D = game.scale.width / innerWidth;
  const b = h.rowBtns.endless;
  return JSON.stringify({ w: b.input.hitArea.width * b.scaleX / D, h: b.input.hitArea.height * b.scaleY / D }) })()`);
ok('the door\'s tap target holds 44pt', doorFit.w >= 43.5 && doorFit.h >= 43.5, Math.round(doorFit.w) + 'x' + Math.round(doorFit.h));
await shot('meadow-endless-door');
await tap(`${H}.rowBtns.endless`);
ok('the door opens the sign picker', await until(`!!${H}.signC`, 15000), 'signC');
ok('…the campaign\'s own picker, serving the endless climb', await ev(`${H}.signFor === 'endless'`));
// BEGIN on THE OPEN SKY — the visible card is the choice
await tap(`(() => { const h = ${H}; let r = null; const scan = (ls) => ls.forEach((o) => { if (!r && o.text === SS_T('zpBegin')) r = o; if (o.list) scan(o.list); }); scan(h.signC.list); return r })()`);
ok('BEGIN rises into the endless sky', await until(PICK, 60000));
ok('level 1, the header speaking it', await ev(`${B}.mode === 'endless' && ${B}.run.fightIdx === 0 && ${B}.headT.text === SS_T('endlessTitle') + ' · ' + SS_T('endLvl', 1)`), await ev(`${B}.headT.text`));
ok('the open sky pinned unsigned', await ev(`localStorage.getItem('beta3.endsign') === 'none' && ${B}.sign === null`));
ok('five pips band the levels, boss the last', await ev(`${B}.pips.length === 5`));
ok('no page errors (the door)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 3. the climb, twelve levels for real ================= */
console.log('\n— THE CLIMB (12+ levels, a mid-climb resume) —');
errs.length = 0;
const eseed = await ev(`${B}.eseed`);
const eplan = await evj(`JSON.stringify([...${B}.sigPlan].sort((a, b) => a - b).filter((i) => i < 14))`);
ok('the live ladder IS the pure function of its seed', await ev(`(() => { const b = ${B};
  const again = ssEndlessFights(b.eseed, 15);
  return b.fights.slice(0, 15).every((f, i) => f.id === again[i].id && f.mult === again[i].mult) })()`));
let walkOk = true, resumed = false, resumeKept = false, resumeClock = false, resumeLadder = false;
const offered = [], bosses = [];
const RESUME_AT = 7;
for (let i = 0; i < 12; i++) {
  const paying = eplan.includes(i);
  // the standing beast pays the curve exactly, at its own level
  const truth = await evj(`(() => { const b = ${B}; const f = b.fights[${i}]; const base = SS_BEASTS[f.id];
    return JSON.stringify({ lvl: f.level, boss: !!base.boss, hpOk: b.beast.hp === Math.round(base.hp * f.mult), head: b.headT.text === SS_T('endlessTitle') + ' · ' + SS_T('endLvl', ${i} + 1) }) })()`);
  if (!truth.hpOk || !truth.head || truth.lvl !== i + 1) { walkOk = false; console.log('    · level ' + (i + 1) + ' broke the curve/header ' + JSON.stringify(truth)); }
  if (truth.boss) bosses.push(i + 1);
  const st = await fell();
  if (st === 'lost') { walkOk = false; console.log('    · level ' + (i + 1) + ' never settled'); break; }
  if (st === 'sigil' || st === 'upgrade') offered.push(i);
  if (paying !== (st === 'sigil' || st === 'upgrade')) { walkOk = false; console.log('    · level ' + (i + 1) + ': plan says ' + paying + ', got ' + st); }
  if (st === 'sigil' || st === 'upgrade') {
    if (!(await takeCard())) { walkOk = false; console.log('    · the pick would not take at level ' + (i + 1)); break; }
  }
  if (!(await until(`${B}.run.fightIdx === ${i + 1} && ${B}.state === 'pick'`, 30000, 250))) { walkOk = false; console.log('    · level ' + (i + 2) + ' never dealt'); break; }
  if (i + 1 === RESUME_AT) {
    // ---- the climb survives an app kill (Skylar's checkpoint law) ----
    // (an offer may have been an UPGRADE — compare held sigils, not offers)
    const heldBefore = await ev(`${B}.run.sigils.length`);
    await sleep(400);
    await reboot('');
    if (!(await until(HOME, 30000))) { walkOk = false; break; }
    await sleep(1000);
    resumed = await ev(`${H}.rowSubs.endless.text === SS_T('endlessCont', ${RESUME_AT + 1})`);
    await tap(`${H}.rowBtns.endless`);
    await until(`!!${H}.confirmC`, 15000);
    await tap(`(() => { const h = ${H}; let r = null; const scan = (ls) => ls.forEach((o) => { if (!r && o.text === SS_T('endContBtn')) r = o; if (o.list) scan(o.list); }); scan(h.confirmC.list); return r })()`);
    if (!(await until(PICK, 60000))) { walkOk = false; console.log('    · the resume never rose'); break; }
    resumeKept = await ev(`${B}.run.fightIdx === ${RESUME_AT} && ${B}.run.sigils.length === ${heldBefore} && ${B}.eseed === ${eseed}`);
    resumeClock = await ev(`${B}.run.playMs > 0`);
    resumeLadder = await ev(`(() => { const b = ${B}; const again = ssEndlessFights(${eseed}, 15);
      return b.fights.slice(0, 15).every((f, i) => f.id === again[i].id) })()`);
  }
}
ok('twelve levels climbed — offers exactly on the plan', walkOk, 'plan ' + eplan.join(' ') + ' · offered ' + offered.join(' '));
ok('the bosses stood at levels 5 and 10', bosses.includes(5) && bosses.includes(10) && bosses.length === 2, bosses.join(' '));
ok('a killed app resumes at its level — the door says so', resumed);
ok('…same ladder, same seed, sigils held, CONTINUE by real tap', resumeKept && resumeLadder);
ok('…and the active-play clock rode the checkpoint', resumeClock);
ok('no page errors (the climb)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 4. the fall ends the climb ================= */
console.log('\n— THE FALL (death ends it · the feather\'s one grace) —');
errs.length = 0;
// the feather's survive-once still counts: grant it, die once, live
await ev(`(() => { const b = ${B}; b.run.sigils.push('feather'); return 'ok' })()`);
await ev(`(() => { const b = ${B}; b.shieldLeft = 0; b.run.hp = 1; b.beast.count = 1; b.tickEnemy(() => {}); return 'ok' })()`);
ok('the feather burns — the climb survives its one death', await until(`${B}.run.featherUsed === true && ${B}.run.hp > 0 && ${B}.state !== 'end'`, 20000, 300), 'hp ' + await ev(`${B}.run.hp`));
ok('the second fall ends the run — no feather-less continue', await die());
const level1 = await ev(`${B}.run.fightIdx + 1`);
const end1 = await evj(`(() => { const b = ${B}; const texts = [];
  const scan = (ls) => ls.forEach((o) => { if (o.text) texts.push(o.text); if (o.list) scan(o.list); });
  scan(b.overlayC.list);
  const p = SS.prof;
  return JSON.stringify({
    title: texts.includes(SS_T('endEndTitle')), lvlLabel: texts.includes(SS_T('endLvlReached')),
    score: texts.includes(SS_T('stScore')), newBest: texts.filter((t) => t === SS_T('newBest')).length,
    beasts: texts.includes(String(b.run.fightIdx)), noDenom: !texts.some((t) => t === b.run.fightIdx + ' / ' + b.fights.length),
    words: texts.includes(SS_T('stWords')), time: texts.includes(SS_T('stTime')), big: texts.includes(SS_T('stBigHit')), sig: texts.includes(SS_T('stSigils')),
    finest: texts.includes(SS_T('stFinest')), again: texts.includes(SS_T('endAgain')),
    noRating: !texts.some((t) => /^✦ \\+/.test(t)),
    prof: p.endless, ckGone: !localStorage.getItem('beta3.endless') && !localStorage.getItem('beta3.endsign'),
    wins: p.wins, rating: p.rating,
  }) })()`);
ok('the reckoning reads THE CLIMB ENDS + LEVEL REACHED', end1.title && end1.lvlLabel);
ok('…and every stat the campaign summary shows', end1.score && end1.words && end1.time && end1.big && end1.sig && end1.finest);
ok('beasts felled counts plain — no denominator on an unbounded ladder', end1.beasts && end1.noDenom);
ok('a first climb pulses no NEW BEST (nothing stood before)', end1.newBest === 0);
ok('the books: bestLevel · bestScore · runs', end1.prof.bestLevel === level1 && end1.prof.bestScore > 0 && end1.prof.runs === 1, JSON.stringify(end1.prof));
ok('the fall spends the checkpoint and the sign', end1.ckGone);
ok('no win counted, no rating moved, no rating line', end1.wins === 0 && end1.rating === 1000 && end1.noRating);
ok('CLIMB AGAIN is the door back up', end1.again);
await shot('endless-first-fall');
ok('no page errors (the fall)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 5. a better climb wears both NEW BEST flags ================= */
console.log('\n— NEW BEST, BOTH FLAGS —');
errs.length = 0;
const best1 = end1.prof;
await reboot('endless=1');
ok('a second climb rises (profile kept)', await until(PICK, 60000) && await ev(`SS.prof.endless.runs === 1`));
// climb past the standing bests the honest way: march the ladder high, then fall
await ev(`(() => { const b = ${B}; b.run.fightIdx = 20; b.run.totalDmg = 2600; b.run.words = 34; b.run.letters = 150;
  b.run.longest = 'starlight'; b.run.bigHit = 55; b.startFight(); return 'ok' })()`);
await until(`!${B}.dying && ${B}.state === 'pick'`, 20000, 250);
ok('level 21 stands (the ladder holds deep rungs)', await ev(`${B}.run.fightIdx === 20 && ${B}.headT.text === SS_T('endlessTitle') + ' · ' + SS_T('endLvl', 21)`));
ok('…and reaching 10 and 20 rang both climb achievements', await ev(`!!SS.prof.ach['end-10'] && !!SS.prof.ach['end-20']`));
ok('the fall ends it', await die());
const end2 = await evj(`(() => { const b = ${B}; const texts = [];
  const scan = (ls) => ls.forEach((o) => { if (o.text) texts.push(o.text); if (o.list) scan(o.list); });
  scan(b.overlayC.list);
  return JSON.stringify({ newBest: texts.filter((t) => t === SS_T('newBest')).length, prof: SS.prof.endless }) })()`);
ok('a better level AND score pulse both NEW BEST flags', end2.newBest === 2, end2.newBest + ' flags');
ok('the books moved to the new marks', end2.prof.bestLevel === 21 && end2.prof.bestScore > best1.bestScore && end2.prof.runs === 2, JSON.stringify(end2.prof));
await shot('endless-new-best');
// …and a worse climb pulses nothing, the books standing
await reboot('endless=1');
await until(PICK, 60000);
ok('a worse climb ends quiet — the books stand', await die() && await evj(`(() => { const b = ${B}; const texts = [];
  const scan = (ls) => ls.forEach((o) => { if (o.text) texts.push(o.text); if (o.list) scan(o.list); });
  scan(b.overlayC.list);
  return JSON.stringify({ n: texts.filter((t) => t === SS_T('newBest')).length, keep: SS.prof.endless.bestLevel === 21 && SS.prof.endless.runs === 3 }) })()`).then((r) => r.n === 0 && r.keep));
ok('no page errors (the bests)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 6. the sign climbs too ================= */
console.log('\n— THE SIGN ON THE LADDER —');
errs.length = 0;
await ev(`localStorage.setItem('beta3.endsign', 'aries'); 'ok'`);
await reboot('endless=1');
await until(PICK, 60000);
const ram = await evj(`JSON.stringify({ sign: ${B}.sign, rammed: ${B}.beast.hpNow === ${B}.beast.hp - 8 })`);
ok('the ram opens an endless battle — zodiac powers apply', ram.sign === 'aries' && ram.rammed, JSON.stringify(ram));
ok('the fall writes the sign\'s own endless mark', await die() && await ev(`(SS.prof.signs.aries && SS.prof.signs.aries.eBest) === 1`),
  await ev(`JSON.stringify(SS.prof.signs.aries || null)`));
ok('…without touching its campaign ledger', await ev(`(() => { const sr = SS.prof.signs.aries; return (sr.clears | 0) === 0 && (sr.best | 0) === 0 })()`));
// the profile ledger speaks the climb — by the player's own road: the end
// screen's HOME, the meadow's profile chip (a direct scene.start would
// leave the battle rendering under everything — the harness artifact the
// first cut's screenshots caught)
ok('HOME leaves the reckoning for the meadow', await tapUntil(
  `(() => { const b = ${B}; let r = null; const scan = (ls) => ls.forEach((o) => { if (!r && o.text === SS_T('home')) r = o; if (o.list) scan(o.list); }); scan(b.overlayC.list); return r })()`,
  `!!game.scene.getScene('home') && game.scene.getScene('home').sys.isActive()`));
await until(HOME, 20000);
await sleep(1800);
await tapUntil(`${H}.profileChip`, `!!game.scene.getScene('profile') && game.scene.getScene('profile').sys.isActive()`);
await until(`game.scene.getScene('profile') && game.scene.getScene('profile').sys.isActive()`, 20000);
await sleep(1200);
ok('the profile ledger reads the endless high-water mark', await ev(`(() => { const p = game.scene.getScene('profile');
  let hit = false; p.children.list.forEach((o) => { if (o.text === SS_T('endLvlShort', SS.prof.endless.bestLevel) + ' · ' + SS.prof.endless.bestScore) hit = true; });
  return hit })()`));
ok('…and the 25-deep achievement grid holds the climb\'s rungs above the seal', await evj(`(() => { const p = game.scene.getScene('profile');
  let ten = null, seal = null; p.children.list.forEach((o) => { if (o.text === 'TEN RUNGS UP') ten = o.y; if (o.text && /^seal:/.test(o.text)) seal = o.y; });
  const ys = []; p.children.list.forEach((o) => { if (o.text && o.y > (seal || 1e9) - 5) ys.push(o.text); });
  return JSON.stringify({ ten: ten !== null, below: p.children.list.filter((o) => o.text && seal && o.y > seal + 5).length }) })()`).then((r) => r.ten && r.below === 0));
ok('no page errors (the sign)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 7. the board: level first, score the tiebreak ================= */
console.log('\n— THE ENDLESS BOARD —');
errs.length = 0;
const sub = await evj(`(async () => {
  // the submit law: better level wins; same level, better score wins; worse
  // never. The real climbs above already own this uid's row — clear it so
  // the ladder of test submits starts from a bare sky.
  await SSNET.dbSet('endless/all/' + SSNET.uid(), null);
  await SSNET.dbSet('endless/' + SSNET.weekKey() + '/' + SSNET.uid(), null);
  await SSNET.submitEndless(9, 900, 'moth');
  const a = await SSNET.dbGet('endless/all/' + SSNET.uid());
  await SSNET.submitEndless(8, 4000, 'lark');
  const b = await SSNET.dbGet('endless/all/' + SSNET.uid());
  await SSNET.submitEndless(9, 1200, 'fern');
  const c = await SSNET.dbGet('endless/all/' + SSNET.uid());
  await SSNET.submitEndless(11, 500, 'dusk');
  const d = await SSNET.dbGet('endless/all/' + SSNET.uid());
  const wk = await SSNET.dbGet('endless/' + SSNET.weekKey() + '/' + SSNET.uid());
  return JSON.stringify({ a, b, c, d, wk: !!wk && wk.lvl === 11 }) })()`);
ok('the row carries level + score + word', sub.a.lvl === 9 && sub.a.score === 900 && sub.a.word === 'MOTH' && !!sub.a.name);
ok('a lower level never replaces (even 4000 points of it)', sub.b.lvl === 9 && sub.b.score === 900);
ok('the same level takes the better score', sub.c.lvl === 9 && sub.c.score === 1200);
ok('a deeper climb takes the row outright', sub.d.lvl === 11 && sub.d.score === 500);
ok('the weekly slice rides along', sub.wk);
const gh = await evj(`(() => {
  const T0 = Date.UTC(2026, 8, 1) + 40 * 86400000;   // the field, fully arrived
  const g1 = SS_SEED.ghosts('endless', 'all', null, T0);
  const g2 = SS_SEED.ghosts('endless', 'all', null, T0);
  const coh = g1.every((x) => x.level >= 2 && x.level <= 14 && x.score / x.level >= 60 && x.score / x.level <= 150 && x.word);
  const det = JSON.stringify(g1) === JSON.stringify(g2);
  const m9 = SS_SEED.merge([{ id: 'r1', name: 'Real', level: 9, score: 950 }], 'endless', 'all', null, T0, 'Me');
  const cap9 = m9[0].id === 'r1' && m9.slice(1).every((x) => x.level < 9);
  const sorted = m9.every((x, i) => i === 0 || (m9[i - 1].level > x.level || (m9[i - 1].level === x.level && m9[i - 1].score >= x.score)));
  const m2 = SS_SEED.merge([{ id: 'r2', name: 'Real', level: 2, score: 100 }], 'endless', 'all', null, T0, 'Me');
  const onlyReal = m2.length === 1 && m2[0].id === 'r2';
  const bare = (() => { const was = SS_SEED.enabled; SS_SEED.enabled = false;
    const r = SS_SEED.merge([{ id: 'r1', name: 'Real', level: 9, score: 950 }], 'endless', 'all', null, T0, 'Me');
    SS_SEED.enabled = was; return r.length === 1; })();
  return JSON.stringify({ n: g1.length, coh, det, cap9, sorted, onlyReal, bare }) })()`);
ok('the seeded field: 8-13 hunters, levels 3-14, scores following the level', gh.n >= 8 && gh.n <= 13 && gh.coh && gh.det, gh.n + ' ghosts');
ok('the champion law by (level, score): no ghost at or above the best real climb', gh.cap9 && gh.sorted);
ok('a level-2 champion stands alone — every ghost stands down', gh.onlyReal);
ok('one switch restores the bare board', gh.bare);
// the Board scene wears its third tab — by real tap. A handful of seeded
// real rows fill the roll below the podium (launch-day ghost arrivals are
// honestly thin — the render must not depend on the wall clock).
await ev(`(async () => {
  const rows = [['test_b1', 8, 830, 'DUSK'], ['test_b2', 7, 700, 'FERN'], ['test_b3', 6, 655, 'MOTH'], ['test_b4', 5, 540, 'LARK'], ['test_b5', 4, 391, 'GLOW']];
  for (const [u, lvl, score, word] of rows) await SSNET.dbSet('endless/all/' + u, { name: 'Hunter ' + lvl, lvl, score, word, at: Date.now() });
  return 'ok' })()`);
await tapUntil(`game.scene.getScene('profile').leaderB`,
  `!!game.scene.getScene('board') && game.scene.getScene('board').sys.isActive()`);
await until(`game.scene.getScene('board') && game.scene.getScene('board').sys.isActive()`, 20000);
await sleep(1500);
const BD = `game.scene.getScene('board')`;
ok('three pills: daily · weekly · endless', await ev(`Object.keys(${BD}.tabBtns).join() === 'daily,weekly,endless'`));
const tabFit = await evj(`(() => { const t = ${BD}.tabBtns.endless.bg; const D = game.scale.width / innerWidth;
  return JSON.stringify({ w: t.input.hitArea.width * t.scaleX / D, h: t.input.hitArea.height * t.scaleY / D }) })()`);
ok('the tab\'s tap target holds 44pt', tabFit.w >= 43.5 && tabFit.h >= 43.5, Math.round(tabFit.w) + 'x' + Math.round(tabFit.h));
await tap(`${BD}.tabBtns.endless.bg`);
await until(`${BD}.tab === 'endless' && ${BD}.rowsC.list.length > 0`, 20000, 300);
await sleep(1200);
const brd = await evj(`(() => { const b = ${BD}; const texts = [];
  const scan = (ls) => ls.forEach((o) => { if (o.text) texts.push(o.text); if (o.list) scan(o.list); });
  scan(b.children.list);
  return JSON.stringify({
    cd: texts.includes('✦ ' + SS_T('lbAllTime')),
    me: texts.some((t) => t === '✦ ' + SS_T('lbYou') + ' ✦') || texts.some((t) => /^#\\d+/.test(t)),
    lrow: texts.some((t) => t.indexOf(SS_T('endLvlShort', 11).replace(' 11', '')) === 0 && t.indexOf('·') > 0),
    you: texts.some((t) => /your place|#/.test(t)),
  }) })()`);
ok('the still line stands where the countdown ticks elsewhere', brd.cd);
ok('rows read level · score', brd.lrow);
ok('the climber stands on their own board', brd.me);
await shot('endless-board-tab');
ok('no page errors (the board)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 8. four doors when a campaign stands ================= */
console.log('\n— THE COLUMN OF FOUR —');
errs.length = 0;
await ev(`localStorage.setItem('beta3.campaign', JSON.stringify({ fightIdx: 3, actIdx: 0, hp: 40, hpMax: 50, sigils: [], words: 5, longest: 'moth', totalDmg: 120, scried: false, featherUsed: false, letters: 20, bigHit: 20, playMs: 60000, clockV: 2 })); 'ok'`);
await reboot('');
await until(HOME, 30000);
await sleep(1200);
const menu4 = await evj(`JSON.stringify(${H}.menuRows.filter((m) => m.b.visible).map((m) => ({ k: m.key, y: Math.round(m.lab.rowY) })))`);
ok('a standing campaign makes four doors — 62 apart, 429..615', JSON.stringify(menu4) === JSON.stringify([{ k: 'campaign', y: 429 }, { k: 'newcamp', y: 491 }, { k: 'endless', y: 553 }, { k: 'versus', y: 615 }]), JSON.stringify(menu4));
ok('the endless door remembers the best', await ev(`${H}.rowSubs.endless.text === SS_T('endlessBest', SS.prof.endless.bestLevel)`), await ev(`${H}.rowSubs.endless.text`));
await shot('meadow-four-doors');
// the Spanish dress fits the door and the tab
await ev(`localStorage.setItem('beta3.lang', 'es'); 'ok'`);
await reboot('');
await until(HOME, 30000);
await sleep(1200);
ok('the door in Spanish (SIN FIN · record line)', await ev(`${H}.rowLabels.endless.text === 'SIN FIN' && ${H}.rowSubs.endless.text.indexOf('récord') === 0`),
  await ev(`${H}.rowLabels.endless.text + ' / ' + ${H}.rowSubs.endless.text`));
await ev(`(() => { ${H}.scene.start('board', { from: 'home' }); return 'ok' })()`);
await until(`game.scene.getScene('board') && game.scene.getScene('board').sys.isActive()`, 20000);
await sleep(1200);
ok('the Spanish tab fits its pill', await evj(`(() => { const t = ${BD}.tabBtns.endless; const l = { u: (n) => n * (game.scale.width / 420) };
  return JSON.stringify({ txt: t.lab.text, fits: t.lab.width * t.lab.scaleX <= l.u(104) }) })()`).then((r) => r.txt === 'SIN FIN' && r.fits));
ok('no page errors (the column)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= the verdict ================= */
console.log('\n' + pass + ' passed · ' + fail + ' failed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
try { ws.close(); } catch (e) { }
process.exit(fail ? 1 : 0);
