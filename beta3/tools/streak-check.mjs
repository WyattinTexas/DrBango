// STREAK-CHECK — the Daily Hunt streak lantern, end to end (v0.39.0 core +
// v0.40.0 grace night and marks). fps-check.mjs pins the LAWS; this pins the
// SURFACES and the real player flow, which is too long to bolt onto that
// suite. Run from beta3/ with the folder served on :8899 and a headless
// Chrome on :9444 (see README.md — a different port from fps-check's 9333 on
// purpose, so the two suites can run side by side; --disable-gpu is fine here
// because nothing in this file forces the WebGL renderer):
//
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --no-sandbox --disable-gpu --mute-audio \
//     --remote-debugging-port=9444 --user-data-dir=/tmp/cdp-streak \
//     --window-size=390,844 --force-device-scale-factor=3 about:blank &
//   node tools/streak-check.mjs
//
// ⚠ Every wait POLLS. The software renderer runs this at ~12-60fps depending
// on the day, which stretches every scene-clock timer, and a fixed sleep
// reads as a bug that isn't there.
// ⚠ A stale Chrome eventually stops running the game loop entirely (scenes
// never start, busy() sticks true). If everything suddenly fails at once,
// kill the browser and launch a fresh one before believing the harness.
const BASE = 'http://localhost:8899/index.html';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const list = await (await fetch('http://127.0.0.1:9444/json/list')).json();
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') {
    const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200);
    if (!/WebGL context/.test(t)) errs.push(t);   // --disable-gpu says this on every boot; it is not news
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
const nav = async (u, w) => { await send('Page.navigate', { url: u }); await sleep(w); };
const until = async (e, cap = 45000) => {
  for (let i = 0; i < cap / 500; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(500); }
  return false;
};
// a REAL press+release on a Phaser object. World coords minus the camera
// scroll (the meadow's camera sits ~4200px down the sky), divided by the
// buffer:CSS ratio, and aimed at getBounds().center rather than (x, y) —
// a left-anchored text's origin sits exactly on its hit-area edge.
const tap = async (expr) => {
  const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
const HOME_REST = `!!window.game && game.scene.isActive('home')
  && !game.scene.getScene('home').introPlaying && !!game.scene.getScene('home').lanternB`;


// ---------------------------------------------------------------- boot
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands up with a lantern beside the daily herald', await until(HOME_REST));

// ================================================================
// 1. THE RULES — pure, no pixels. The whole grace + marks law.
// ================================================================
// ---- the grace rules, pure ----
const r = JSON.parse(await ev(`(() => {
  const keep = JSON.stringify(SS.prof.streak), keepD = JSON.stringify(SS.prof.daily);
  const out = {};
  const set = (o) => { SS.prof.streak = Object.assign({ n:0,last:0,best:0,g:1,gp:0,gd:[],mk:0,pend:0 }, o); };
  // 1. a streak of 6, one night missed, then a hunt: the grace bridges it
  SSNET.setDayKey('20260610'); set({ n:6, last:20260609, best:6, g:1 });
  out.aliveOnGrace = 0;
  SSNET.setDayKey('20260611');                 // 20260610 was MISSED
  out.aliveOnGrace = ssStreakCount();          // the flame reads alive: the net holds it
  out.bridgeFlag = ssStreakState().grace;
  const n1 = ssStreakNote();
  out.ev1 = n1.ev; out.n1 = n1.n; out.heldAfter = SS.prof.streak.g; out.gd = JSON.stringify(SS.prof.streak.gd);
  // 2. a SECOND consecutive miss with no grace in hand → reset
  SSNET.setDayKey('20260614');                 // 12 and 13 both missed
  out.cold = ssStreakCount();
  const n2 = ssStreakNote();
  out.ev2 = n2.ev; out.n2 = n2.n; out.best2 = SS.prof.streak.best;
  // 3. five dailies after a spent grace re-earn it
  set({ n:6, last:20260609, best:6, g:1 });
  SSNET.setDayKey('20260611'); ssStreakNote();  // spends the grace
  out.gpAfterSpend = SS.prof.streak.gp; out.gAfterSpend = SS.prof.streak.g;
  const walk = [];
  for (let d = 12; d <= 16; d++) { SSNET.setDayKey('202606' + d); const nn = ssStreakNote(); walk.push(SS.prof.streak.gp + '/' + SS.prof.streak.g); }
  out.walk = walk.join(' ');
  out.reEarned = SS.prof.streak.g;
  // 4. two missed nights are a vacation, grace or not
  set({ n:20, last:20260601, best:20, g:1 });
  SSNET.setDayKey('20260604');
  out.vacationRead = ssStreakCount();
  const n4 = ssStreakNote();
  out.vacationEv = n4.ev; out.vacationN = n4.n; out.vacationGrace = SS.prof.streak.g;  // unspent, still held
  // 5. twice in a graced night is still one night
  set({ n:3, last:20260609, best:3, g:1 });
  SSNET.setDayKey('20260611');
  const a = ssStreakNote(), b = ssStreakNote();
  out.twice = a.ev + '/' + a.n + ' ' + b.ev + '/' + b.n;
  // 6. milestones fire once each
  set({ n:6, last:20260609, best:6, g:1, mk:0 });
  const ms = [];
  SSNET.setDayKey('20260610'); ms.push(ssStreakNote().ms);          // n=7  → 7
  SSNET.setDayKey('20260611'); ms.push(ssStreakNote().ms);          // n=8  → 0
  set({ n:29, last:20260611, best:29, g:1, mk:7 });
  SSNET.setDayKey('20260612'); ms.push(ssStreakNote().ms);          // n=30 → 30
  SSNET.setDayKey('20260613'); ms.push(ssStreakNote().ms);          // n=31 → 0
  set({ n:99, last:20260613, best:99, g:1, mk:30 });
  SSNET.setDayKey('20260614'); const m100 = ssStreakNote(); ms.push(m100.ms);
  out.ms = ms.join(',');
  out.marks100 = m100.marks.join(',');
  out.pend = SS.prof.streak.pend;
  // 7. a broken streak may earn its marks again on the way back up
  SSNET.setDayKey('20260620'); ssStreakNote();                      // reset to 1
  out.mkAfterReset = SS.prof.streak.mk;
  // 8. the lantern's dress
  out.tiers = [0,1,2,6,7,29,30,99,100,365].map(ssLanternTier).join(',');
  SSNET.setDayKey(''); SS.prof.streak = JSON.parse(keep); SS.prof.daily = JSON.parse(keepD);
  return JSON.stringify(out);
})()`));
ok('a missed night reads ALIVE while a grace is in hand', r.aliveOnGrace === 6 && r.bridgeFlag === true, r.aliveOnGrace + '/' + r.bridgeFlag);
ok('the hunt after spends the grace exactly once and extends the streak',
  r.ev1 === 'graced' && r.n1 === 7 && r.heldAfter === 0 && r.gd === '[20260610]', JSON.stringify([r.ev1, r.n1, r.heldAfter, r.gd]));
ok('two missed nights in a row still reset', r.cold === 0 && r.ev2 === 'relit' && r.n2 === 1 && r.best2 === 7, JSON.stringify([r.cold, r.ev2, r.n2, r.best2]));
ok('the bridging hunt does not count toward re-earning', r.gpAfterSpend === 0 && r.gAfterSpend === 0);
ok('five dailies after a spent grace re-earn it', r.walk === '1/0 2/0 3/0 4/0 0/1' && r.reEarned === 1, r.walk);
ok('a vacation is never bridged, and never eats the unspent grace',
  r.vacationRead === 0 && r.vacationEv === 'relit' && r.vacationN === 1 && r.vacationGrace === 1, JSON.stringify([r.vacationRead, r.vacationEv, r.vacationN, r.vacationGrace]));
ok('twice on a graced night is still one night', r.twice === 'graced/4 same/4', r.twice);
ok('each mark fires exactly once', r.ms === '7,0,30,0,100', r.ms);
ok('every mark reached is offered for awarding', r.marks100 === '7,30,100' && r.pend === 100, r.marks100 + ' pend=' + r.pend);
ok('a broken streak clears its marks and may earn them again', r.mkAfterReset === 0, String(r.mkAfterReset));
ok('the lamp dresses by the marks', r.tiers === '-1,-1,0,0,1,1,2,2,3,3', r.tiers);

// ================================================================
// 2. THE LAMP AND ITS SHEET — the surfaces the rules drive
// ================================================================
// ---- the lamp's five dresses on the meadow ----
const lamp = (n, extra) => ev(`(() => { const h = game.scene.getScene('home');
  SS.prof.streak = Object.assign({ n:${n}, last: SSNET.dayKey(), best:${n}, g:1, gp:0, gd:[], mk:0, pend:0 }, ${extra || '{}'});
  h.updateLantern();
  return JSON.stringify({ tex: h.lanternB.texture.key, count: h.lanternT.text, glow: h.lanternGlow.baseAlpha,
    lamp: h.lanternB.alpha, grace: h.lanternG.baseAlpha,
    fits: h.lanternT.width <= ssLayout(h).u(12.5) + 0.5,
    beside: h.lanternB.getBounds().left > h.dailyChipB.getBounds().right,
    clearOfChip: h.lanternB.getBounds().right < h.profileChip.getBounds().left,
    onScreen: h.lanternB.getBounds().top > 0 }) })()`).then(JSON.parse);
const L = {};
for (const n of [0, 1, 2, 6, 7, 30, 100, 365]) L[n] = await lamp(n);
ok('cold below two nights', L[0].tex === 'lantern-cold' && L[1].tex === 'lantern-cold' && L[0].count === '' && L[0].glow === 0);
ok('lit and numbered from night two', L[2].tex === 'lantern-lit' && L[6].count === '6' && L[6].glow > 0, JSON.stringify(L[6]));
ok('night 7 → the ember crown', L[7].tex === 'lantern-m1', L[7].tex);
ok('night 30 → the true lantern', L[30].tex === 'lantern-m2', L[30].tex);
ok('night 100 → comet-crowned, and it stays there', L[100].tex === 'lantern-m3' && L[365].tex === 'lantern-m3', L[100].tex + '/' + L[365].tex);
ok('a three-digit flame still fits the pane', L[365].count === '365' && L[365].fits, JSON.stringify(L[365]));
ok('the halo never outshines the daily ember (0.13)', Math.max(...[2,6,7,30,100,365].map(n => L[n].glow)) <= 0.13);
ok('the grown lamp still stands clear of both corner chips and the status bar',
  L[365].beside && L[365].clearOfChip && L[365].onScreen, JSON.stringify([L[365].beside, L[365].clearOfChip, L[365].onScreen]));

// the grace mark on the meadow: only while the net is actually holding it
const gm1 = await lamp(6, `{ last: ssDayKeyStep(SSNET.dayKey(), -2), g: 1 }`);
const gm2 = await lamp(6, `{ last: ssDayKeyStep(SSNET.dayKey(), -1), g: 1 }`);
ok('a flame standing on its grace night wears the ◌ mark, and only then',
  gm1.grace > 0 && gm1.tex === 'lantern-lit' && gm2.grace === 0, gm1.grace + '/' + gm2.grace);

// ---- the lantern sheet, opened by a REAL tap on the lamp ----
await ev(`(() => { const h = game.scene.getScene('home');
  SSNET.setDayKey('20260620');
  SS.prof.daily = { 20260615: 300, 20260616: 250, 20260618: 410, 20260619: 500 };
  SS.prof.streak = { n: 9, last: 20260619, best: 21, g: 0, gp: 2, gd: [20260617], mk: 7, pend: 0 };
  h.updateDailyChip(); return 'set' })()`);
await tap(`game.scene.getScene('home').lanternB`);
ok('a real tap on the lamp opens the lantern sheet', await until(`!!game.scene.getScene('home').streakC`));
const sheet = JSON.parse(await ev(`(() => { const h = game.scene.getScene('home'), c = h.streakC;
  const txt = [], imgs = [], gfx = [];
  const w = (ls) => ls.forEach(o => { if (o.type === 'Text') txt.push(o.text); if (o.texture && o.texture.key) imgs.push(o.texture.key);
    if (o.type === 'Graphics') gfx.push(1); if (o.list) w(o.list); });
  w(c.list);
  let win = null, lo = 1e9, hi = -1e9;
  const w2 = (ls) => ls.forEach(o => { if (o.texture && o.texture.key === 'endpanel') win = o;
    else if (o.visible && o.getBounds && !(o.texture && o.texture.key === 'veil')) { const b = o.getBounds(); if (b.height) { lo = Math.min(lo, b.top); hi = Math.max(hi, b.bottom); } }
    if (o.list) w2(o.list); });
  w2(c.list);
  const wb = win ? win.getBounds() : {top:0,bottom:0};
  return JSON.stringify({ txt, imgs, gfx: gfx.length, lo, hi, winTop: wb.top, winBot: wb.bottom, screenH: game.scale.height }) })()`));
ok('the sheet wears the lamp at the tier the streak earned', sheet.imgs.includes('lantern-m1'), sheet.imgs.join(','));
ok('the week strip draws seven rings', sheet.gfx === 7, String(sheet.gfx));
ok('the strip owns up to the grace night with a ◌', sheet.txt.filter(t => t === '◌').length === 1, JSON.stringify(sheet.txt.filter(t => t.length < 3)));
ok('the strip ticks the four hunted nights', sheet.txt.filter(t => t === '✓').length === 4, String(sheet.txt.filter(t => t === '✓').length));
ok('the quiet line names the re-earn cost', sheet.txt.some(t => /re-earned in 3 more hunts/.test(t)), sheet.txt.find(t => /re-earn/.test(t)) || '—');
ok('the sheet names the night, the longest flame and the next mark',
  sheet.txt.some(t => /night 9/.test(t)) && sheet.txt.some(t => /21/.test(t) && /longest/.test(t)) && sheet.txt.some(t => /next mark · night 30/.test(t)),
  JSON.stringify(sheet.txt.filter(t => /night|longest/.test(t))));
ok('every item on the sheet sits inside its window, and the window on screen',
  sheet.lo >= sheet.winTop - 2 && sheet.hi <= sheet.winBot + 2 && sheet.winBot <= sheet.screenH && sheet.winTop >= 0,
  Math.round(sheet.lo) + '..' + Math.round(sheet.hi) + ' in ' + Math.round(sheet.winTop) + '..' + Math.round(sheet.winBot) + ' of ' + sheet.screenH);
// the daily door is still one tap away
await tap(`game.scene.getScene('home').streakC.list.find(o => o.texture && /^btn/.test(o.texture.key))`);
ok('the sheet keeps the daily one tap away', await until(`!game.scene.getScene('home').streakC && !!game.scene.getScene('home').dailyC`));
await ev(`(() => { const h = game.scene.getScene('home'); if (h.dailyC) { h.dailyC.destroy(); h.dailyC = null; } SSNET.setDayKey(''); return 'closed' })()`);

// ---- the ceremony ----
await ev(`(() => { const h = game.scene.getScene('home');
  SS.prof.streak = { n: 30, last: SSNET.dayKey(), best: 30, g: 1, gp: 0, gd: [], mk: 30, pend: 30 };
  h.lanternShown = null; h.milestoneCheck(); return 'armed' })()`);
ok('a pending mark holds a ceremony on the meadow', await until(`!!game.scene.getScene('home').riteC`, 25000));
const rite = JSON.parse(await ev(`(() => { const h = game.scene.getScene('home'), c = h.riteC;
  const txt = [], imgs = [];
  const w = (ls) => ls.forEach(o => { if (o.type === 'Text') txt.push(o.text); if (o.texture && o.texture.key) imgs.push(o.texture.key); if (o.list) w(o.list); });
  w(c.list);
  return JSON.stringify({ txt, imgs, pend: SS.prof.streak.pend, stored: JSON.parse(localStorage.getItem('beta3.profile')).streak.pend,
    parts: c.list.some(o => o.type === 'ParticleEmitter'), depth: c.depth }) })()`));
ok('the ceremony shows the lamp in its new dress', rite.imgs.includes('lantern-m2'), rite.imgs.join(','));
ok('the ceremony names the mark and what grew', rite.txt.some(t => /LANTERN GROWS/i.test(t)) && rite.txt.some(t => /gilded/.test(t)), JSON.stringify(rite.txt));
ok('sparks fly', rite.parts);
ok('the mark is spent the moment it is honoured — and saved', rite.pend === 0 && rite.stored === 0, rite.pend + '/' + rite.stored);
ok('it rides above the meadow', rite.depth >= 660, String(rite.depth));
/* ⚠ 45s, not 20: the rite holds for 5.2s on the SCENE clock, and a software
   renderer running this at ~12fps stretches that ~5x. */
ok('the ceremony lets the meadow back', await until(`!game.scene.getScene('home').riteC`, 45000));
ok('and the corner lamp is wearing the new dress',
  await ev(`game.scene.getScene('home').lanternB.texture.key === 'lantern-m2'`) === true,
  await ev(`game.scene.getScene('home').lanternB.texture.key`));

// ================================================================
// 3. THE DAILY END SCREEN, MIGRATION, AND THE LEDGER
// ================================================================
// ---- the end screen: a hunt that spends the grace, and one that crosses a mark ----
const runDaily = async (setup) => {
  await nav(BASE + '?fps=0', 11000);
  await until(`!!window.game && game.scene.isActive('home')`);
  await ev(`(() => { SSNET.__sub = SSNET.submitScore; SSNET.submitScore = () => Promise.resolve();
    ${setup}
    game.scene.getScene('home').scene.start('battle', { mode: 'daily', resume: null }); return 'armed' })()`);
  await until(`(() => { const b = game.scene.getScene('battle'); return game.scene.isActive("battle") && !!b && !!b.run && !!b.board && b.board.length === 16 })()`);
  await ev(`(() => { const b = game.scene.getScene('battle');
    b.state = 'anim'; b.run.words = 9; b.run.letters = 40; b.run.longest = 'moonlight'; b.run.fightIdx = 6;
    b.endRun(true); return 'ended' })()`);
  await sleep(1200);
  return JSON.parse(await ev(`(() => { const b = game.scene.getScene('battle');
    const txt = []; const w = (ls) => ls.forEach(o => { if (o.type === 'Text') txt.push(o.text); if (o.list) w(o.list); });
    w(b.overlayC.list);
    let win = null, lo = 1e9, hi = -1e9;
    const w2 = (ls) => ls.forEach(o => { if (o.texture && o.texture.key === 'endpanel') win = o;
      else if (o.visible && o.getBounds && !(o.texture && o.texture.key === 'veil')) { const bb = o.getBounds(); if (bb.height) { lo = Math.min(lo, bb.top); hi = Math.max(hi, bb.bottom); } }
      if (o.list) w2(o.list); });
    w2(b.overlayC.list);
    const wb = win ? win.getBounds() : { top: 0, bottom: 0 };
    SSNET.submitScore = SSNET.__sub; SSNET.setDayKey('');
    return JSON.stringify({ txt, streak: JSON.parse(JSON.stringify(SS.prof.streak)), ach: Object.keys(SS.prof.ach),
      win: !!win, lo, hi, winTop: wb.top, winBot: wb.bottom, screenH: game.scale.height }) })()`));
};

const graced = await runDaily(`SSNET.setDayKey('20260812');
  SS.prof.streak = { n: 13, last: 20260810, best: 13, g: 1, gp: 0, gd: [], mk: 7, pend: 0 };
  SS.prof.daily = {}; SS.prof.ach = {};`);
ok('a hunt after one missed night spends the grace and extends to 14',
  graced.streak.n === 14 && graced.streak.g === 0 && graced.streak.gd.join() === '20260811',
  JSON.stringify(graced.streak));
ok('the end screen owns up to the grace it just spent',
  graced.txt.some(t => /night 14/.test(t)) && graced.txt.some(t => /grace night held the flame/.test(t)),
  JSON.stringify(graced.txt.filter(t => /night|grace/.test(t))));
ok('nothing on the taller daily window falls outside it',
  graced.win && graced.lo >= graced.winTop - 2 && graced.hi <= graced.winBot + 2 && graced.winBot <= graced.screenH,
  Math.round(graced.lo) + '..' + Math.round(graced.hi) + ' in ' + Math.round(graced.winTop) + '..' + Math.round(graced.winBot) + ' of ' + graced.screenH);

const marked = await runDaily(`SSNET.setDayKey('20260812');
  SS.prof.streak = { n: 6, last: 20260811, best: 6, g: 1, gp: 0, gd: [], mk: 0, pend: 0 };
  SS.prof.daily = {}; SS.prof.ach = {};`);
ok('crossing seven names the mark on the end screen and queues its ceremony',
  marked.txt.some(t => /SEVEN NIGHTS/.test(t)) && marked.streak.pend === 7 && marked.streak.mk === 7,
  JSON.stringify([marked.txt.find(t => /NIGHTS/.test(t)), marked.streak.pend]));
ok('and the achievement is awarded', marked.ach.includes('flame-7') && !marked.ach.includes('flame-30'), marked.ach.join(','));

const deep = await runDaily(`SSNET.setDayKey('20260812');
  SS.prof.streak = { n: 99, last: 20260811, best: 99, g: 1, gp: 0, gd: [], mk: 30, pend: 0 };
  SS.prof.daily = {}; SS.prof.ach = {};`);
ok('a player arriving already deep collects every mark they earned',
  deep.ach.includes('flame-7') && deep.ach.includes('flame-30') && deep.ach.includes('flame-100'), deep.ach.join(','));

// a plain daily with the net in hand: the quiet line
const plain = await runDaily(`SSNET.setDayKey('20260812');
  SS.prof.streak = { n: 3, last: 20260811, best: 3, g: 1, gp: 0, gd: [], mk: 0, pend: 0 };
  SS.prof.daily = {}; SS.prof.ach = {};`);
ok('an ordinary night still says where the net stands',
  plain.txt.some(t => /a grace night is held for you/.test(t)), plain.txt.find(t => /grace/.test(t)) || '—');

// ---- migration: a v0.39.0 profile has no grace fields at all ----
await ev(`(() => { const p = JSON.parse(localStorage.getItem('beta3.profile') || '{}');
  p.streak = { n: 40, last: SSNET.dayKey(), best: 40 };
  localStorage.setItem('beta3.profile', JSON.stringify(p)); return 'aged' })()`);
await nav(BASE + '?fps=0', 11000);
const mig = JSON.parse(await ev(`JSON.stringify(SS.prof.streak)`));
ok('a v0.39.0 profile wakes holding one grace, with its marks already seeded',
  mig.g === 1 && mig.gp === 0 && mig.mk === 30 && Array.isArray(mig.gd) && mig.pend === 0, JSON.stringify(mig));
// …and a profile from before the streak entirely
await ev(`(() => { const p = JSON.parse(localStorage.getItem('beta3.profile') || '{}');
  delete p.streak; p.daily = { 20260101: 500 };
  localStorage.setItem('beta3.profile', JSON.stringify(p)); return 'aged' })()`);
await nav(BASE + '?fps=0', 11000);
const mig2 = JSON.parse(await ev(`JSON.stringify(SS.prof.streak)`));
ok('a profile predating the lantern still reads 0 — and still gets its net',
  mig2.n === 0 && mig2.last === 0 && mig2.g === 1 && mig2.mk === 0, JSON.stringify(mig2));

// ---- the profile ledger holds 23 achievements ----
await ev(`(() => { SS.prof.daily = {}; SS.prof.streak = { n:0,last:0,best:0,g:1,gp:0,gd:[],mk:0,pend:0 }; SS.save();
  game.scene.getScene('home').scene.start('profile'); return 'go' })()`);
ok('the profile scene stands up', await until(`game.scene.isActive('profile')`));
/* ⚠ measure the LEDGER, not the scene: ssStarfield sprinkles stars to the very
   bottom edge, so a max-bounds-of-everything sweep just re-measures the
   starfield and passes or fails at random. */
const prof = JSON.parse(await ev(`(() => { const p = game.scene.getScene('profile');
  const names = new Set(SS_ACH.map(a => a.name)), descs = new Set(SS_ACH.map(a => a.desc));
  let rows = 0, hi = -1e9, seal = 1e9; const shown = [];
  p.children.list.forEach(o => {
    if (o.type !== 'Text') return;
    if (names.has(o.text)) { shown.push(o.text); rows++; hi = Math.max(hi, o.getBounds().bottom); }
    else if (descs.has(o.text)) hi = Math.max(hi, o.getBounds().bottom);
    else if (/^seal: /.test(o.text)) seal = o.getBounds().top;
  });
  return JSON.stringify({ rows, hi, seal, total: SS_ACH.length, screenH: game.scale.height,
    hasMarks: ['SEVEN NIGHTS','THE LONG BURN','THE COMET CROWN'].every(n => shown.includes(n)) }) })()`));
ok('all 23 achievements are listed, the three marks among them',
  prof.total === 23 && prof.rows === 23 && prof.hasMarks, prof.rows + '/' + prof.total);
ok('and the grown ledger still clears the seal at the foot of the page',
  prof.hi <= prof.seal && prof.seal < prof.screenH,
  Math.round(prof.hi) + ' → seal ' + Math.round(prof.seal) + ' of ' + prof.screenH);

// ================================================================
// 4. THE REAL FLOW — play a daily that crosses a mark, tap HOME,
//    and watch the ceremony arrive on the grass by itself
// ================================================================
await nav(BASE + '?fps=0', 4000);
await ev(`(() => { const p = JSON.parse(localStorage.getItem('beta3.profile') || '{}');
  p.streak = { n:6, last:20260811, best:6, g:1, gp:0, gd:[], mk:0, pend:0 }; p.daily = {}; p.ach = {};
  localStorage.setItem('beta3.profile', JSON.stringify(p)); return 1 })()`);
await nav(BASE + '?fps=0&daykey=20260811', 11000);
ok('the meadow stands, lamp lit at six nights',
  await until(`!!window.game && game.scene.isActive('home') && !game.scene.getScene('home').introPlaying
    && game.scene.getScene('home').lanternB.texture.key === 'lantern-lit'`),
  await ev(`game.scene.getScene('home').lanternB.texture.key`));
await ev(`(() => { SSNET.submitScore = () => Promise.resolve(); SSNET.setDayKey('20260812');
  game.scene.getScene('home').scene.start('battle', { mode:'daily', resume:null }); return 1 })()`);
ok('the daily stands up', await until(`(() => { const b = game.scene.getScene('battle');
  return game.scene.isActive('battle') && !!b && !!b.run && !!b.board && b.board.length === 16 })()`));
await ev(`(() => { const b = game.scene.getScene('battle');
  b.state='anim'; b.run.words=9; b.run.letters=40; b.run.longest='moonlight'; b.run.fightIdx=6; b.endRun(true); return 1 })()`);
ok('the end screen names the seventh night', await until(`(() => { const b = game.scene.getScene('battle');
  const t = []; const w = ls => ls.forEach(o => { if (o.type==='Text') t.push(o.text); if (o.list) w(o.list); });
  w(b.overlayC.list); return t.some(x => /SEVEN NIGHTS/.test(x)) })()`));
// …and now the player taps HOME, like a player would
await sleep(2500);
await tap(`(() => { const b = game.scene.getScene('battle');
  let hit = null; const w = ls => ls.forEach(o => { if (o.type==='Text' && o.text === SS_T('home')) hit = o; if (o.list) w(o.list); });
  w(b.overlayC.list); return hit })()`);
ok('HOME lands us back on the grass', await until(`game.scene.isActive('home') && !game.scene.getScene('home').descending`, 40000));
ok('and the ceremony arrives on its own, no prodding',
  await until(`!!game.scene.getScene('home').riteC`, 40000));
const flowRite = JSON.parse(await ev(`(() => { const c = game.scene.getScene('home').riteC;
  const t = [], im = []; const w = ls => ls.forEach(o => { if (o.type==='Text') t.push(o.text); if (o.texture&&o.texture.key) im.push(o.texture.key); if (o.list) w(o.list); });
  w(c.list); return JSON.stringify({ t, im, pend: SS.prof.streak.pend, ach: Object.keys(SS.prof.ach) }) })()`));
ok('it is the SEVEN NIGHTS rite, with the grown lamp, and the mark is spent',
  flowRite.im.includes('lantern-m1') && flowRite.im.some(x => /SEVEN NIGHTS/.test(x)) && flowRite.pend === 0 && flowRite.ach.includes('flame-7'),
  JSON.stringify(flowRite.t) + ' ' + flowRite.im.filter(x => /gold@/.test(x)));
ok('the meadow comes back with the grown lamp in the corner',
  await until(`!game.scene.getScene('home').riteC && game.scene.getScene('home').lanternB.texture.key === 'lantern-m1'
    && game.scene.getScene('home').lanternB.alpha === 1`, 30000),
  await ev(`game.scene.getScene('home').lanternB.texture.key`));
// a second visit must NOT re-run the ceremony
await ev(`SSNET.setDayKey('')`);
await nav(BASE + '?fps=0', 11000);
await until(`!!window.game && game.scene.isActive('home') && !game.scene.getScene('home').introPlaying`);
await sleep(6000);
ok('and a later boot does NOT hold the ceremony again',
  await ev(`!game.scene.getScene('home').riteC && SS.prof.streak.pend === 0`) === true);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors');
process.exit(fail ? 1 : 0);
