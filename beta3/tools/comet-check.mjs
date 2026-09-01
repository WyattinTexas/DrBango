// COMET-CHECK — Comet Trail is a limited charge, never unlimited (v0.63.0).
// Skylar (9/1): "you should only be able to scry for free one time … It
// should never be that scry no longer hastens the strike." The sigil now
// grants ssSigilCharges('comet') free scries at every startFight (base 1 —
// the def's `charges`, the seam the coming rare/legendary tiers turn to 2/3;
// epic skipped by Skylar's call); once spent, every scry ticks the beast
// exactly as if the sigil weren't held. The SCRY button prints one ☄ pip per
// charge — gold while it waits, a dim cinder once spent, nothing when the
// sigil isn't held. Sagittarius' arrow rides every scry regardless of the
// charge, and a scry whose arrow FELLS the beast spends nothing (the death
// sequence takes over before the comet branch).
// Self-launching like dew-check: serves beta3 on :8899 if nothing does,
// headless Chrome on :9459 (/tmp/cdp-comet, --disable-gpu is fine — nothing
// forces WebGL), Firebase blocked at the network layer throughout. All PvE:
// versus draws from VS_OK, which never held comet (asserted from source).
//
//   node tools/comet-check.mjs      # ~2 min
//
// ⚠ Every wait POLLS — the software renderer runs the scene clock anywhere
// from 12 to 60fps and a fixed sleep reads as a bug that isn't there. A tap
// re-taps until its effect shows (a press the frame an object is born lands
// on nothing), and each scry is confirmed by the drip's own scry counter —
// polling `state === 'pick'` alone would read the PRE-scry pick and pass.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const PORT = 9459, SRV = 8899;
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
  '--user-data-dir=/tmp/cdp-comet', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
// one REAL scry, confirmed by the drip's own counter (state alone would read
// the pre-scry pick), resolved when the board is back in hand
const scryOnce = async () => {
  const n0 = await ev(`SS.prof.sig.c.scry | 0`);
  for (let t = 0; t < 4; t++) {
    await tap(`${B}.scryB`); await sleep(160);
    if (await ev(`(SS.prof.sig.c.scry | 0) > ${n0}`)) break;
  }
  if (!(await ev(`(SS.prof.sig.c.scry | 0) > ${n0}`))) return false;
  return until(PICK, 15000);
};
// spell a word with real taps, press CAST, wait for doneExpr (PICK for an
// ordinary cast; the sigil offer for a felling one)
const castTo = async (idx, doneExpr) => {
  await until(`${B}.board.every((s, i) => !s || Math.abs(s.c.y - ${B}.slotPos(i).y) < 0.5)`, 8000, 100);
  for (const i of idx) {
    for (let t = 0; t < 4; t++) {
      await tap(`${B}.board[${i}].c`); await sleep(140);
      if (await ev(`${B}.sel.includes(${i})`)) break;
    }
  }
  const sel = await evj(`JSON.stringify(${B}.sel)`);
  if (sel.length !== idx.length) { console.log('    · taps selected ' + JSON.stringify(sel) + ' of ' + JSON.stringify(idx)); return false; }
  await tap(`${B}.castB`);
  return until(doneExpr, 30000);
};
const findWord = async (must, avoid, minLen = 2) => evj(`(() => {
  const b = ${B}, must = ${JSON.stringify(must)}, avoid = ${JSON.stringify(avoid)}; b.buildTrie();
  const tiles = b.board.map((s, i) => ({ s, i })).filter((x) => x.s && !avoid.includes(x.i));
  let best = null;
  const used = tiles.map(() => false), pick = [];
  const dive = (node) => {
    const idx = pick.map((k) => tiles[k].i);
    if (node.$ && idx.length >= ${minLen} && must.every((m) => idx.includes(m)) && (!best || idx.length > best.length)) best = idx.slice();
    if (pick.length >= 8) return;
    for (let k = 0; k < tiles.length; k++) {
      if (used[k]) continue;
      let n = node, okk = true;
      for (const ch of tiles[k].s.ch) { n = n[ch]; if (!n) { okk = false; break; } }
      if (!okk) continue;
      used[k] = true; pick.push(k); dive(n); used[k] = false; pick.pop();
    }
  };
  dive(b.trie);
  return JSON.stringify(best);
})()`);
const SIGIL_UP = `${B}.state === 'sigil' && ${B}.overlayC.list.some((o) => o.getData && o.getData('sigilCard') && o.alpha === 1)`;
// take whatever card is offered — the offer must be swept before the next
// fight can start; run.sigils is re-pinned by the phases that care
const pickCard = async () => {
  if (!(await until(SIGIL_UP, 25000, 250))) return false;
  for (let t = 0; t < 6; t++) {
    await tap(`${B}.overlayC.list.find((o) => o.getData && o.getData('sigilCard'))`);
    await sleep(450);
    if (await ev(`${B}.state !== 'sigil'`)) break;
  }
  return until(PICK, 25000);
};
const pips = async () => evj(`JSON.stringify(${B}.scryPips.map((p) => ({ c: p.style.color, a: +p.alpha.toFixed(2) })))`);
const LIT = '#ffd77a', SPENT = '#5a6390';

/* ================= the def and the copy ================= */
console.log('\nCOMET-CHECK · the limited free scry\n');
console.log('— THE DEF IS THE DIAL —');
const vsSrc = readFileSync(new URL('../versus.js', import.meta.url), 'utf8');
const vsOk = vsSrc.match(/VS_OK = \[([^\]]*)\]/);
ok('versus VS_OK never held comet (source)', !!vsOk && !vsOk[1].includes('comet'), vsOk && vsOk[1].replace(/['\s]/g, ''));

await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
await ev(`localStorage.clear(); localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); 'ok'`);
await send('Page.navigate', { url: BASE + '?fps=0&quick=1' }); await sleep(2500);
await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
ok('quick run at pick', await until(PICK, 60000));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
ok('charges live on the def: comet carries 1', await ev(`SS_SIG_BY.comet.charges === 1 && ssSigilCharges('comet') === 1`));
ok('a chargeless sigil reads 0', await ev(`ssSigilCharges('quill') === 0 && ssSigilCharges('nope') === 0`));
ok('en desc says what it does now', await ev(`SS_SIG_BY.comet.desc === 'Your first SCRY each battle does not hasten the strike.'`));
const OLD = ['SCRY ya no acelera el golpe.', 'SCRY ne hâte plus la frappe.', 'SCRY não apressa mais o golpe.',
  'SCRY beschleunigt den Schlag nicht mehr.', 'SCRYで一撃が早まらなくなる。', 'SCRY가 일격을 앞당기지 않는다.',
  'SCRY不再加速攻击。', 'SCRY अब वार तेज़ नहीं करता।', 'لم يعد SCRY يعجّل الضربة.'];
const lm = await evj(`JSON.stringify(Object.keys(SS_STR).filter((k) => SS_STR[k].sig && SS_STR[k].sig.comet).map((k) => [k, SS_STR[k].sig.comet[1]]))`);
ok('all 9 language packs carry the new line', lm.length === 9 && lm.every(([k, d]) => d.includes('SCRY') && !OLD.includes(d)),
  lm.filter(([k, d]) => OLD.includes(d)).map(([k]) => k).join(',') || '9 fresh');

/* ================= without comet, every scry ticks ================= */
console.log('\n— WITHOUT THE TRAIL, EVERY SCRY HASTENS —');
await ev(`${B}.run.sigils = []; ${B}.beast.hpNow = 99999; ${B}.beast.count = 3; ${B}.updateBars(); 'ok'`);
ok('no pips when the sigil is not held', (await pips()).length === 0);
ok('first scry (unheld) — real tap', await scryOnce());
ok('…ticks the beast: 3 → 2', await ev(`${B}.beast.count`) === 2, String(await ev(`${B}.beast.count`)));

/* ================= the charge ================= */
console.log('\n— ONE FREE SCRY, THEN THE PRICE —');
await ev(`${B}.run.sigils = ['comet']; ${B}.startFight(); 'ok'`);
ok('fight restarts holding comet', await until(PICK, 20000));
ok('charge granted at fight start', await ev(`${B}.cometLeft === 1`));
let pp = await pips();
ok('one pip, lit gold', pp.length === 1 && pp[0].c === LIT && pp[0].a > 0.8, JSON.stringify(pp));
await ev(`${B}.beast.hpNow = 99999; ${B}.beast.count = 3; ${B}.updateBars(); 'ok'`);
ok('first scry (held) — real tap', await scryOnce());
ok('…rides free: count stays 3', await ev(`${B}.beast.count`) === 3, String(await ev(`${B}.beast.count`)));
ok('charge spent', await ev(`${B}.cometLeft === 0`));
ok('pip cools to a cinder', await until(`${B}.scryPips[0] && ${B}.scryPips[0].style.color === '${SPENT}'`, 6000, 150), JSON.stringify(await pips()));
ok('second scry — real tap', await scryOnce());
ok('…ticks: 3 → 2 (as if unheld)', await ev(`${B}.beast.count`) === 2, String(await ev(`${B}.beast.count`)));
ok('third scry — real tap', await scryOnce());
ok('…ticks again: 2 → 1', await ev(`${B}.beast.count`) === 1, String(await ev(`${B}.beast.count`)));
const h0 = await ev(`${B}.run.hp`);
ok('scry at the brink — real tap', await scryOnce());
ok('…and the strike honestly LANDS (hp fell)', await ev(`${B}.run.hp`) < h0, h0 + ' → ' + await ev(`${B}.run.hp`));

/* ================= a new fight restores it ================= */
console.log('\n— EVERY BATTLE BURNS FRESH —');
await ev(`${B}.beast.hpNow = 1; ${B}.beast.count = 9; 'ok'`);
let w = await findWord([], []);
ok('a felling word', !!w, JSON.stringify(w));
ok('cast fells the beast → the sigil offer', await castTo(w, SIGIL_UP));
ok('a real pick seats the next fight', await pickCard());
ok('fight 1 stands', await ev(`${B}.run.fightIdx`) === 1, String(await ev(`${B}.run.fightIdx`)));
ok('the charge is back', await ev(`${B}.cometLeft === 1`));
pp = await pips();
ok('pip relit', pp.length === 1 && pp[0].c === LIT, JSON.stringify(pp));
await ev(`${B}.beast.hpNow = 99999; ${B}.beast.count = 3; ${B}.updateBars(); 'ok'`);
ok('new battle\'s first scry rides free again', (await scryOnce()) && (await ev(`${B}.beast.count`)) === 3);

/* ================= sagittarius alongside ================= */
console.log('\n— THE ARCHER STILL LOOSES —');
await ev(`${B}.sign = 'sagittarius'; ${B}.run.sigils = ['comet']; ${B}.startFight(); 'ok'`);
await until(PICK, 20000);
await ev(`${B}.beast.hpNow = 500; ${B}.beast.count = 3; ${B}.updateBars(); 'ok'`);
ok('charged scry — real tap', await scryOnce());
ok('arrow hit for 6, strike unhastened', await ev(`${B}.beast.hpNow`) === 494 && (await ev(`${B}.beast.count`)) === 3,
  'hp ' + await ev(`${B}.beast.hpNow`) + ' count ' + await ev(`${B}.beast.count`));
ok('spent scry — real tap', await scryOnce());
ok('arrow hit AND the tick: 494→488, 3→2', await ev(`${B}.beast.hpNow`) === 488 && (await ev(`${B}.beast.count`)) === 2,
  'hp ' + await ev(`${B}.beast.hpNow`) + ' count ' + await ev(`${B}.beast.count`));
await ev(`${B}.startFight(); 'ok'`);
await until(PICK, 20000);
await ev(`${B}.beast.hpNow = 5; ${B}.beast.count = 3; ${B}.updateBars(); 'ok'`);
ok('a scry whose arrow FELLS — real tap', await (async () => {
  const n0 = await ev(`SS.prof.sig.c.scry | 0`);
  for (let t = 0; t < 4; t++) { await tap(`${B}.scryB`); await sleep(160); if (await ev(`(SS.prof.sig.c.scry | 0) > ${n0}`)) break; }
  return (await ev(`(SS.prof.sig.c.scry | 0) > ${n0}`)) && until(SIGIL_UP, 25000);
})());
ok('…spends no charge (death took over first)', await ev(`${B}.cometLeft === 1`));
ok('the offer clears', await pickCard());

/* ================= the seam: charges is the dial ================= */
console.log('\n— THE COMING TIERS TURN ONE NUMBER —');
await ev(`SS_SIG_BY.comet.charges = 3; ${B}.sign = null; ${B}.run.sigils = ['comet']; ${B}.startFight(); 'ok'`);
await until(PICK, 20000);
ok('charges=3 live → three granted', await ev(`${B}.cometLeft === 3`));
pp = await pips();
ok('three pips, all lit', pp.length === 3 && pp.every((p) => p.c === LIT), JSON.stringify(pp));
await ev(`${B}.beast.hpNow = 99999; ${B}.beast.count = 5; ${B}.updateBars(); 'ok'`);
let free = true;
for (let i = 0; i < 3; i++) free = free && (await scryOnce()) && (await ev(`${B}.beast.count`)) === 5;
ok('three scries ride free', free, 'count ' + await ev(`${B}.beast.count`));
pp = await pips();
ok('all three pips spent', pp.every((p) => p.c === SPENT), JSON.stringify(pp));
ok('the fourth ticks: 5 → 4', (await scryOnce()) && (await ev(`${B}.beast.count`)) === 4, String(await ev(`${B}.beast.count`)));
await ev(`SS_SIG_BY.comet.charges = 1; ${B}.startFight(); 'ok'`);
await until(PICK, 20000);
ok('restored to 1 → one pip again', await ev(`${B}.cometLeft === 1 && ${B}.scryPips.length === 1`));

ok('no page errors', errs.length === 0, errs.join(' | '));
console.log(`\n${pass} passed, ${fail} failed`);
ws.close();
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
