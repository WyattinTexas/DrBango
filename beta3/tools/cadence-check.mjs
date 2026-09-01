// CADENCE-CHECK — sigils arrive every 2-3 fights, not every fight (v0.65.0).
// Skylar (9/1): "Right now you're getting sigils too fast. You should get a
// sigil after every turn. Maybe every two or three turns…" — and it applies
// to every mode, the daily hunt included. The game side: SS_CADENCE in
// data.js (one row per mode: first / gap [min,max] / actBoss / type, plus
// versus's per-cast row and the RESERVED endless + hard rows), walked once
// per run by ssSigilPlan into Battle.sigPlan — the Set of fight indices
// whose WIN pays an offer. The hook (fight 0) always pays, act-closing
// bosses always pay, a due offer one fight before such a boss folds into
// it (offers never land back to back), and the run's final fight never
// pays. Seeds: campaign hashes its pinned roster (ssStrSeed — a resumed
// climb keeps its schedule with no new checkpoint field), the daily draws
// from the shared day seed (every hunter meets offers at the same fights),
// quick rolls fresh. beastDeath routes a paying fight through payOffer()
// — 'sigil' opens the pick, 'upgrade' (SS_OFFER_TYPES) is reserved for the
// coming sigil-tier card and never rolled today. The rarity ramp keys on
// FIGHTS FOUGHT (run.fightIdx), not offers made, so the sparser cadence
// never slows it. Campaign: 7-9 offers per full 20-fight climb (was 19);
// quick/daily: exactly 2 across their 5.
// Self-launching like dew-check: serves beta3 on :8899 if nothing does,
// headless Chrome on :9464 (/tmp/cdp-cadence, --disable-gpu — nothing here
// forces WebGL), Firebase blocked at the network layer throughout.
//
//   node tools/cadence-check.mjs      # ~4 min
//
// Harness seam: Battle.sigPlan is a plain Set — a suite that needs an offer
// on a specific fight pins it directly (b.sigPlan.add(i)), the drip's
// profile-seam pattern. The walk below fells fights through the REAL
// beastDeath (the decision's own code path) and advances with real DPR-3
// taps on the pick cards and the chart's breathing node.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const PORT = 9464, SRV = 8899;
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
  '--user-data-dir=/tmp/cdp-cadence', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const B = `game.scene.getScene('battle')`;
const PICK = `!!window.game && ${B} && ${B}.scene.isActive() && ${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`;
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1');
    localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};
// enter a campaign battle straight from the meadow (the ascent and the map
// sheet are their own suites' business — clock-check's proven door)
const startCampaign = async () => {
  await until(`game.scene.getScene('home') && game.scene.getScene('home').sys.isActive()`, 20000);
  await ev(`(() => { const h = game.scene.getScene('home');
    h.scene.start('battle', { mode: 'campaign', resume: h.campaignCheckpoint(), ascended: false }); return 'ok' })()`);
  return until(PICK, 60000);
};
const plan = async () => (await evj(`JSON.stringify([...${B}.sigPlan].sort((a,b)=>a-b))`));
// fell the standing beast through the REAL death path and wait for what the
// cadence says comes next; returns 'sigil' | 'map' | 'pick' | 'end'.
// Waits for the board in hand first — a fell fired mid-death-anim (dying
// still true from the LAST fight) would kill nothing and read a lie.
const fell = async () => {
  await until(`!!${B} && !${B}.dying && ${B}.state === 'pick'`, 20000, 250);
  const armed = await ev(`(() => { const b = ${B}; if (b.dying) return 'busy';
    b.beast.hpNow = -1; b.dying = true; b.beastDeath(); return 'ok' })()`);
  if (armed !== 'ok') return 'lost';
  const landed = await until(`(${B}.state === 'sigil' && ${B}.overlayC.list.some((o) => o.getData && o.getData('sigilCard') && o.alpha === 1))
    || ${B}.state === 'map' || ${B}.state === 'end' || (${B}.state === 'pick' && !${B}.dying)`, 30000, 250);
  if (!landed) return 'lost';
  return ev(`${B}.state`);
};
// take whichever card is offered — real taps, re-tapped until the pick lands
const takeCard = async () => {
  for (let t = 0; t < 6; t++) {
    await tap(`${B}.overlayC.list.find((o) => o.getData && o.getData('sigilCard'))`);
    await sleep(450);
    if (await ev(`${B}.state !== 'sigil'`)) return true;
  }
  return ev(`${B}.state !== 'sigil'`);
};
// march off the star chart — a real tap on the breathing node's zone
const marchOn = async (nextIdx) => {
  await until(`(() => { const ch = ${B}.overlayC.list.find((o) => o.getData && o.getData('mapZone'));
    return !!(ch && ch.getData('mapZone') && ch.getData('mapZone').active) })()`, 15000, 250);
  for (let t = 0; t < 6; t++) {
    await tap(`${B}.overlayC.list.find((o) => o.getData && o.getData('mapZone')).getData('mapZone')`);
    await sleep(450);
    if (await ev(`${B}.state !== 'map'`)) break;
  }
  return until(`${B}.run.fightIdx === ${nextIdx} && ${B}.state === 'pick'`, 30000, 250);
};

console.log('\nCADENCE-CHECK · sigils every 2-3 fights, in every mode\n');

/* ================= 1. the table and the enum ================= */
console.log('— THE TABLE —');
await boot('quick=1');
ok('quick run at pick', await until(PICK, 60000));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
const rows = await evj(`JSON.stringify(Object.keys(SS_CADENCE))`);
ok('one row per mode + the reserved pair', ['campaign', 'quick', 'daily', 'versus', 'endless', 'hard'].every((k) => rows.includes(k)), rows.join(','));
ok('campaign row: hook 0, gap 2-3, act bosses pay', await ev(`SS_CADENCE.campaign.first === 0 && SS_CADENCE.campaign.gap[0] === 2 && SS_CADENCE.campaign.gap[1] === 3 && SS_CADENCE.campaign.actBoss === true`));
ok('quick and daily ride the same rhythm', await ev(`['quick','daily'].every((m) => SS_CADENCE[m].first === 0 && SS_CADENCE[m].gap.join() === '2,3')`));
ok('versus row keeps the duel\'s every-3rd-cast', await ev(`SS_CADENCE.versus.casts === 3`));
ok('the offer types are sigil + the RESERVED upgrade', await ev(`JSON.stringify(SS_OFFER_TYPES) === '["sigil","upgrade"]'`));
ok('upgrade is never rolled: every live row types sigil', await ev(`['campaign','quick','daily','versus','endless'].every((m) => (SS_CADENCE[m].type || 'sigil') === 'sigil')`));
const vsSrc = readFileSync(new URL('../versus.js', import.meta.url), 'utf8');
const rvSrc = readFileSync(new URL('../rival.js', import.meta.url), 'utf8');
ok('versus.js reads the table\'s row (source)', /myCasts % \(\(SS_CADENCE\.versus/.test(vsSrc));
ok('the rival engine reads the same row (source)', /SS_CADENCE\.versus\.casts/.test(rvSrc) && (rvSrc.match(/% VS_CASTS/g) || []).length === 2);

/* ================= 2. the plan's laws ================= */
console.log('\n— THE PLAN\'S LAWS (300 synthetic seeds) —');
const laws = await evj(`(() => {
  const camp = []; for (let a = 0; a < 4; a++) for (let f = 0; f < 5; f++) camp.push({ actIdx: a });
  const five = []; for (let i = 0; i < 5; i++) five.push({ actIdx: 0 });
  const out = { det: true, hook: true, boss: true, final: true, gaps: true, adj: true, counts: {}, quick: true, qshapes: {} };
  for (let s = 1; s <= 300; s++) {
    const p = [...ssSigilPlan('campaign', camp, s)].sort((a, b) => a - b);
    const p2 = [...ssSigilPlan('campaign', camp, s)].sort((a, b) => a - b);
    if (p.join() !== p2.join()) out.det = false;
    if (p[0] !== 0) out.hook = false;
    if (![4, 9, 14].every((b) => p.includes(b))) out.boss = false;
    if (p.includes(19)) out.final = false;
    for (let k = 1; k < p.length; k++) { const g = p[k] - p[k - 1]; if (g < 2 || g > 4) out.gaps = false; if (g === 1) out.adj = false; }
    out.counts[p.length] = (out.counts[p.length] || 0) + 1;
    const q = [...ssSigilPlan('quick', five, s)].sort((a, b) => a - b);
    if (!(q.length === 2 && q[0] === 0 && (q[1] === 2 || q[1] === 3))) out.quick = false;
    out.qshapes[q.join(',')] = (out.qshapes[q.join(',')] || 0) + 1;
  }
  return JSON.stringify(out);
})()`);
ok('the plan is deterministic per seed', laws.det);
ok('the hook: fight 0 always pays', laws.hook);
ok('the act bosses (4 · 9 · 14) always pay', laws.boss);
ok('the final fight never pays — that win ends the run', laws.final);
ok('gaps run 2-4 (4 only folding into a boss), never adjacent', laws.gaps && laws.adj);
ok('campaign pays 7-9 offers per climb', Object.keys(laws.counts).every((k) => k >= 7 && k <= 9), JSON.stringify(laws.counts));
ok('quick/daily: exactly 2 — the hook + fight 3 or 4', laws.quick, JSON.stringify(laws.qshapes));
ok('a versus row builds no fight plan', await ev(`ssSigilPlan('versus', [{ actIdx: 0 }, { actIdx: 0 }], 7).size === 0`));

/* ================= 3. the scripted 20-fight campaign ================= */
console.log('\n— THE 20-FIGHT CLIMB, FOR REAL —');
await boot('');
ok('fresh campaign stands at fight 0', await startCampaign() && await ev(`${B}.mode === 'campaign' && ${B}.run.fightIdx === 0`));
const cplan = await plan();
ok('the battle carries its plan', cplan.length >= 7 && cplan.length <= 9, cplan.join(' '));
ok('…derived from the pinned roster (recomputed = carried)', await ev(`(() => {
  const b = ${B}; const roster = JSON.parse(localStorage.getItem('beta3.camproster'));
  const again = [...ssSigilPlan('campaign', b.fights, ssStrSeed(roster.join('·')))].sort((x, y) => x - y);
  return again.join() === [...b.sigPlan].sort((x, y) => x - y).join() })()`));
const offered = [], resumeAt = 8;
let walkOk = true, mapBeat = true, resumePlanSame = false, resumeKept = true;
for (let i = 0; i < 20; i++) {
  const paying = cplan.includes(i);
  const st = await fell();
  if (st === 'lost') { walkOk = false; console.log('    · fight ' + i + ' never settled'); break; }
  if (st === 'sigil') offered.push(i);
  if (i === 19) { if (st !== 'end') walkOk = false; break; }
  if (paying && st !== 'sigil') { walkOk = false; console.log('    · fight ' + i + ' owed an offer, got ' + st); }
  if (!paying && st === 'sigil') { walkOk = false; console.log('    · fight ' + i + ' paid unbidden'); }
  if (st === 'sigil') {
    if (!(await takeCard())) { walkOk = false; console.log('    · the pick would not take at ' + i); break; }
    if (!(await until(`${B}.state === 'map'`, 20000, 250))) { walkOk = false; console.log('    · no map after the pick at ' + i); break; }
  }
  // the beat between fights is the star chart, paying or not — never a blank
  if (!(await ev(`${B}.state === 'map'`))) { mapBeat = false; }
  if (!(await marchOn(i + 1))) { walkOk = false; console.log('    · the march to fight ' + (i + 1) + ' never landed'); break; }
  if (i + 1 === resumeAt) {
    // ---- the checkpoint resume keeps the schedule ----
    await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(600);
    await send('Page.navigate', { url: BASE + '?fps=0' }); await sleep(2500);
    await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
    if (!(await startCampaign()) || (await ev(`${B}.run.fightIdx`)) !== resumeAt) { walkOk = false; console.log('    · resume lost the climb'); break; }
    resumePlanSame = (await plan()).join() === cplan.join();
    resumeKept = await ev(`${B}.run.sigils.length === ${offered.length}`);
  }
}
ok('every offer landed exactly where the plan says', walkOk, 'plan ' + cplan.join(' ') + ' · offered ' + offered.join(' '));
ok('offers matched the plan, positions and count', offered.join() === cplan.join(), offered.join(' '));
ok('the bosses\' offers rode with them (4 · 9 · 14)', [4, 9, 14].every((b) => offered.includes(b)));
ok('a reloaded checkpoint recomputes the SAME schedule', resumePlanSame);
ok('…and the resumed run still wears its picks', resumeKept);
ok('the quiet fights kept their beat — the chart, never a blank', mapBeat);
ok('the climb ended at the summit', await ev(`${B}.state === 'end'`));
ok('the run holds one sigil per offer paid', await ev(`${B}.run.sigils.length === ${cplan.length}`), await ev(`${B}.run.sigils.length`) + ' of ' + cplan.length);
ok('no page errors (the climb)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 4. the ramp keys on fights fought ================= */
console.log('\n— THE RARITY RAMP —');
const ramp = await evj(`(() => { const b = ${B};
  b.run.fightIdx = 10; b.run.sigils = []; const bare = b.sigilChances();
  b.run.sigils = ['quill', 'choir', 'runes', 'salve', 'aegis']; const laden = b.sigilChances();
  b.run.fightIdx = 17; const late = b.sigilChances(); b.run.fightIdx = 19; const top = b.sigilChances();
  return JSON.stringify({ bare, laden, late, top }) })()`);
ok('chances key on fights fought, not offers made', JSON.stringify(ramp.bare) === JSON.stringify(ramp.laden), JSON.stringify(ramp.bare));
ok('the last act reaches the legendary band', ramp.late.leg >= 0.12 && ramp.top.leg >= 0.17 && ramp.top.rare >= 0.39,
  'leg@17 ' + ramp.late.leg.toFixed(3) + ' · leg@19 ' + ramp.top.leg.toFixed(3));
const rolls = await evj(`(() => { const b = ${B}; b.run.fightIdx = 19;
  SS.prof.sig = { u: Object.fromEntries(SS_SIGILS.map((s) => [s.id, 1])), c: {}, pend: [], gf: 1 };
  let leg = 0, rare = 0; for (let k = 0; k < 400; k++) { b.run.sigils = [];
    for (const o of b.rollSigilOpts()) { if ((o.rarity | 0) === 2) leg++; if ((o.rarity | 0) === 1) rare++; } }
  return JSON.stringify({ leg, rare }) })()`);
ok('a 400-board roll at the summit surfaces legendaries', rolls.leg >= 20 && rolls.rare >= 60, 'leg ' + rolls.leg + ' · rare ' + rolls.rare);

/* ================= 5. quick play walks its row ================= */
console.log('\n— QUICK PLAY —');
errs.length = 0;
await boot('quick=1');
ok('quick run at pick', await until(PICK, 60000));
const qplan = await plan();
ok('quick\'s plan wears its row', qplan.length === 2 && qplan[0] === 0 && (qplan[1] === 2 || qplan[1] === 3), qplan.join(' '));
const qoffered = [];
let qwalk = true;
for (let i = 0; i < 5; i++) {
  const paying = qplan.includes(i);
  const st = await fell();
  if (st === 'lost') { qwalk = false; console.log('    · fight ' + i + ' never settled'); break; }
  if (st === 'sigil') qoffered.push(i);
  if (i === 4) { if (st !== 'end') qwalk = false; break; }
  if (paying !== (st === 'sigil')) { qwalk = false; console.log('    · fight ' + i + ': plan says ' + paying + ', got ' + st); }
  if (st === 'sigil') {
    if (!(await takeCard())) { qwalk = false; break; }
  }
  // no map in quick — a quiet fight rides the shatter straight into the
  // next constellation, the beat it always had on an exhausted pool
  if (!(await until(`${B}.run.fightIdx === ${i + 1} && ${B}.state === 'pick'`, 30000, 250))) { qwalk = false; console.log('    · fight ' + (i + 1) + ' never dealt'); break; }
}
ok('quick\'s offers landed on its row alone', qwalk && qoffered.join() === qplan.join(), 'plan ' + qplan.join(' ') + ' · offered ' + qoffered.join(' '));
ok('DRACO\'s fall ends the run — no dangling offer', await ev(`${B}.state === 'end'`));
ok('no page errors (quick)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 6. the daily shares one schedule ================= */
console.log('\n— THE DAILY HUNT —');
await boot('daily=1&daykey=20260901');
ok('daily battle at pick', await until(PICK, 60000));
const dplan1 = await plan();
ok('the daily\'s plan wears the row', dplan1.length === 2 && dplan1[0] === 0 && (dplan1[1] === 2 || dplan1[1] === 3), dplan1.join(' '));
await boot('daily=1&daykey=20260901');
ok('a second hunter boots the same day', await until(PICK, 60000));
const dplan2 = await plan();
ok('…and meets the offers at the SAME fights (shared-fair)', dplan1.join() === dplan2.join(), dplan1.join(' ') + ' = ' + dplan2.join(' '));
const dfirst = await fell();
ok('the daily\'s hook pays at fight 0', dfirst === 'sigil');
ok('…with a full pick on the table (3 cards)', await ev(`${B}.overlayC.list.filter((o) => o.getData && o.getData('sigilCard')).length === 3`));
ok('the pick still takes', await takeCard());

/* ================= 7. the upgrade seam rides on ================= */
console.log('\n— THE RESERVED OFFER TYPE —');
ok('fight 1 in hand for the seam', await until(`${B}.run.fightIdx === 1 && ${B}.state === 'pick'`, 30000, 250));
await ev(`SS_CADENCE.daily.type = 'upgrade'; ${B}.sigPlan.add(1); 'ok'`);
const upSt = await fell();
ok('an upgrade row pays no screen that does not exist — rides on', upSt === 'pick' && await ev(`${B}.run.fightIdx === 2`), upSt);
await ev(`SS_CADENCE.daily.type = 'sigil'; 'ok'`);
ok('restored: the row types sigil again', await ev(`SS_CADENCE.daily.type === 'sigil'`));
ok('no page errors (daily + seam)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= the verdict ================= */
console.log('\n' + pass + ' passed · ' + fail + ' failed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
try { ws.close(); } catch (e) { }
process.exit(fail ? 1 : 0);
