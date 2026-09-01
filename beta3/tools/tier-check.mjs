// TIER-CHECK — sigil tiers and the upgrade offer (v0.66.0).
// Skylar (9/1): "you can level up sigils that you have … if it was like a
// common sigil, it will upgrade to a rare and if it is a rare it will
// upgrade into an epic. If it was an epic it can upgrade into a legendary
// … [it] should also apply for the daily hunt. [Comet:] base level one
// free scry, rare two, skip epic, legendary three."
// The game side: every def carries a `tl` ladder (base def = tier I, so
// today's numbers are the first rung), resolved ONLY by ssSigilVal;
// grades name SLOTS (I·II·IV on a 3-step ladder — epic visibly skipped);
// ssOfferTypes pre-rolls each paying fight's kind on the plan seed XOR a
// constant (first offer never an upgrade); payOffer opens showUpgradePick
// or crosses over when the new-sigil pool is dry; run.tiers rides the
// checkpoint; every effect site pays the held tier.
// Self-launching like cadence-check (server on :8899 if nothing serves,
// Chrome on :9465, /tmp/cdp-tier, --disable-gpu), Firebase blocked at the
// network layer throughout.
//
//   node tools/tier-check.mjs           # the laws, ~5 min
//   node tools/tier-check.mjs --demo    # a natural ?demo=1 campaign to the
//                                       # summit through real upgrade offers
//                                       # (~6-9 min — give alarm 700)
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const PORT = 9465, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEMO_PASS = process.argv.includes('--demo');
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
  '--user-data-dir=/tmp/cdp-tier', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const startCampaign = async () => {
  await until(`game.scene.getScene('home') && game.scene.getScene('home').sys.isActive()`, 20000);
  await ev(`(() => { const h = game.scene.getScene('home');
    h.scene.start('battle', { mode: 'campaign', resume: h.campaignCheckpoint(), ascended: false }); return 'ok' })()`);
  return until(PICK, 60000);
};
// fell the standing beast through the REAL death path (the cadence-check
// helper, grown one terminal: the upgrade screen)
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
// the FIRST tagged card, wherever it lives (sigil pick: flat on overlayC;
// upgrade rows: one container down) — real taps, retried until taken
const CARD_EXPR = `(() => { let r = null; const scan = (ls) => ls.forEach((o) => {
  if (!r && o.getData && o.getData('sigilCard')) r = o; if (o.list) scan(o.list); });
  scan(${B}.overlayC.list); return r })()`;
const takeCard = async (fromState) => {
  for (let t = 0; t < 6; t++) {
    await tap(CARD_EXPR);
    await sleep(450);
    if (await ev(`${B}.state !== '${fromState}'`)) return true;
  }
  return ev(`${B}.state !== '${fromState}'`);
};
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
const hold = (sigs, tiers) => ev(`(() => { const b = ${B};
  b.run.sigils = ${JSON.stringify(sigs)}; b.run.tiers = ${JSON.stringify(tiers || {})};
  b.run.firstUsed = true; b.sign = null; b.repaintChips(); return 'ok' })()`);
const settle = async () => until(`${B}.board.every((s, i) => !s || Math.abs(s.c.y - ${B}.slotPos(i).y) < 0.5)`, 8000, 100);
const place = async (arr) => {
  await ev(`(() => { const b = ${B}; b.unselectFrom(0);
    for (const [i, ch, tier] of ${JSON.stringify(arr)}) {
      if (b.board[i]) { b.board[i].c.destroy(); b.board[i] = null; }
      b.spawnTile(i, ch, tier, false);
    } return 'ok' })()`);
  await settle();
};

/* THE LADDER, PINNED (the balance sheet of the card — a def that drifts
   from this table is a finding, not a re-pin) */
const LADDER = {
  quill: ['add', [4, 6, 8, 11]], choir: ['lb.add', [2, 3, 4]], runes: ['lb.add', [2, 3, 4]],
  salve: ['heal', [4, 6, 8]], aegis: ['hp', [20, 30, 45]], first: ['mult', [2, 3]],
  hush: ['delay', [1, 2]], comet: ['charges', [1, 2, 3]], shield: ['blocks', [1, 2]],
  leech: ['heal', [1, 2, 3]], longbow: ['add', [12, 18, 26]], gilded: ['start', [[1], [1, 1], [2, 2]]],
  forge: ['low', [5, 4]], blood: ['mult', [25, 40, 50]], tome: ['tax', [25, 25, 15]],
  storm: ['every', [3, 2]], roots: ['add', [2, 3, 4]], ward: ['cut', [3, 5, 8]],
  echo: ['carry', [1, 1.5, 2]], feather: ['revive', [1, 15]], eclipse: ['div', [2, 3]],
  nova: ['thresh', [7, 6]], verse: ['add', [1, 2]], meteor: ['hpAdd', [0, 3]],
};

if (!DEMO_PASS) {

console.log('\nTIER-CHECK · sigil tiers and the upgrade offer\n');

/* ================= 1. the data laws ================= */
console.log('— THE LADDER TABLE —');
await boot('quick=1');
ok('quick run at pick', await until(PICK, 60000));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
const lad = await evj(`(() => { const pin = ${JSON.stringify(LADDER)}; const bad = [];
  for (const sg of SS_SIGILS) {
    const p = pin[sg.id];
    if (!p) { bad.push(sg.id + ': unpinned'); continue; }
    if (ssSigilMaxT(sg.id) !== p[1].length) { bad.push(sg.id + ': maxT ' + ssSigilMaxT(sg.id) + ' vs ' + p[1].length); continue; }
    for (let t = 1; t <= p[1].length; t++) {
      const v = ssSigilVal(sg.id, p[0], t);
      if (JSON.stringify(v) !== JSON.stringify(p[1][t - 1])) bad.push(sg.id + '@' + t + ': ' + JSON.stringify(v));
    }
  }
  return JSON.stringify(bad) })()`);
ok('all 24 ladders resolve the pinned table through ssSigilVal', lad.length === 0, lad.slice(0, 3).join(' · '));
ok('comet walks 1/2/3 exactly (Skylar-fixed), a bare read is tier I', await ev(
  `ssSigilCharges('comet') === 1 && ssSigilCharges('comet', 2) === 2 && ssSigilCharges('comet', 3) === 3 && ssSigilCharges('quill', 3) === 0`));
const slots = await evj(`JSON.stringify({ q: [1, 2, 3, 4].map((t) => ssGradeSlot('quill', t)),
  c: [1, 2, 3].map((t) => ssGradeSlot('comet', t)), f: [1, 2].map((t) => ssGradeSlot('first', t)) })`);
ok('grade slots: 4-step I·II·III·IV, 3-step I·II·IV (epic skipped), 2-step I·IV',
  slots.q.join() === '1,2,3,4' && slots.c.join() === '1,2,4' && slots.f.join() === '1,4', JSON.stringify(slots));
ok('live rows carry up 0.35; versus none; the enum stands', await ev(
  `['campaign','quick','daily','endless'].every((m) => SS_CADENCE[m].up === 0.35) && SS_CADENCE.versus.up === undefined && JSON.stringify(SS_OFFER_TYPES) === '["sigil","upgrade"]'`));
ok('the ten tongues carry the upgrade dress (upHead · upMax · rarityEpic)', await ev(
  `Object.keys(SS_STR).every((k) => SS_STR[k].upHead && SS_STR[k].upMax && SS_STR[k].rarityEpic)`));

/* ================= 2. every sigil scales ================= */
console.log('\n— EVERY SIGIL SCALES —');
const VALS = await evj(`JSON.stringify(VALS)`);
const LEN = await evj(`JSON.stringify(LEN_MULT)`);
const base = (w) => w.split('').reduce((a, c) => a + (VALS[c] || 1), 0) * (LEN[Math.min(w.length, 8)] || 2.3);
await ev(`${B}.beast.hpNow = 99999; ${B}.beast.count = 9; ${B}.updateBars(); 'ok'`);
// the word-damage family, one probe per rung, expected computed here from
// the pinned ladder — the game's number must MEET the table
const dmg = async (idv, t, w, extra) => evj(`(() => { const b = ${B};
  b.run.sigils = ['${idv}']; b.run.tiers = { ${idv}: ${t} }; b.sign = null;
  b.run.firstUsed = ${extra && extra.first ? 'false' : 'true'}; b.run.words = ${extra && extra.words != null ? extra.words : 0};
  return JSON.stringify(b.wordDamage('${w}'.split('').map((ch) => ({ ch, tier: 0, blk: false })))) })()`);
ok('quill pays +4/+6/+8/+11 (I→IV)', await (async () => {
  for (let t = 1; t <= 4; t++) if (await dmg('quill', t, 'so') !== Math.round(base('so') + LADDER.quill[1][t - 1])) return false;
  return true; })());
ok('longbow pays +12/+18/+26 on 6 letters, nothing on 5', await (async () => {
  for (let t = 1; t <= 3; t++) if (await dmg('longbow', t, 'abcdef') !== Math.round(base('abcdef') + LADDER.longbow[1][t - 1])) return false;
  return (await dmg('longbow', 3, 'abcde')) === Math.round(base('abcde')); })());
ok('roots pays +2/+3/+4 per held sigil', await (async () => {
  for (let t = 1; t <= 3; t++) if (await dmg('roots', t, 'so') !== Math.round(base('so') + LADDER.roots[1][t - 1] * 1)) return false;
  return true; })());
ok('verse pays +1/+2 per woven word (7 woven)', await (async () => {
  for (let t = 1; t <= 2; t++) if (await dmg('verse', t, 'so', { words: 7 }) !== Math.round(base('so') + LADDER.verse[1][t - 1] * 7)) return false;
  return true; })());
ok('blood raises the word +25/+40/+50%', await (async () => {
  for (let t = 1; t <= 3; t++) if (await dmg('blood', t, 'so') !== Math.round(base('so') * (1 + LADDER.blood[1][t - 1] / 100))) return false;
  return true; })());
ok('…and the beast side stays +25% at every tier', await evj(`(() => { const b = ${B};
  b.run.sigils = ['blood']; const f = b.fights[0];
  const a1 = (() => { b.run.tiers = { blood: 1 }; return b.beastFor(f).atk })();
  const a3 = (() => { b.run.tiers = { blood: 3 }; return b.beastFor(f).atk })();
  b.run.sigils = []; const a0 = b.beastFor(f).atk;
  return JSON.stringify(a1 === a3 && a1 === Math.round(a0 * 1.25)) })()`));
ok('nova doubles from 7 letters at I, from 6 at its height', await (async () => {
  const w7 = 'abcdefg', w6 = 'abcdef';
  return (await dmg('nova', 1, w7)) === Math.round(base(w7) * 2) && (await dmg('nova', 1, w6)) === Math.round(base(w6))
    && (await dmg('nova', 2, w6)) === Math.round(base(w6) * 2); })());
ok('storm doubles every 3rd word at I, every 2nd at its height', await (async () => {
  return (await dmg('storm', 1, 'so', { words: 2 })) === Math.round(base('so') * 2)
    && (await dmg('storm', 1, 'so', { words: 3 })) === Math.round(base('so'))
    && (await dmg('storm', 2, 'so', { words: 1 })) === Math.round(base('so') * 2)
    && (await dmg('storm', 2, 'so', { words: 2 })) === Math.round(base('so')); })());
ok('first light doubles at I, triples at its height', await (async () => {
  return (await dmg('first', 1, 'so', { first: true })) === Math.round(base('so') * 2)
    && (await dmg('first', 2, 'so', { first: true })) === Math.round(base('so') * 3); })());
ok('choir/runes raise the letters +2/+3/+4 — cast and chip together', await (async () => {
  const d2 = await dmg('choir', 2, 'ao');   // both vowels: (1+3)+(1+3) = 8 × LEN2
  if (d2 !== Math.round((2 + 6) * (LEN[2] || 0.6))) return false;
  await hold(['runes'], { runes: 3 });
  await place([[0, 's', 0]]);
  return ev(`${B}.board[0].val.texture.key === 'gv-' + (1 + 4) + '-#7d4a10-s'`); })());
// ---- per-battle grants ----
const idx0 = await ev(`${B}.run.fightIdx`);
ok('hush delays the strike +1 at I, +2 at its height', await (async () => {
  await hold([], {}); await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); 'ok'`);
  const t0 = await ev(`${B}.beast.count`);
  await hold(['hush'], { hush: 1 }); await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); 'ok'`);
  const t1 = await ev(`${B}.beast.count`);
  await hold(['hush'], { hush: 2 }); await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); 'ok'`);
  const t2 = await ev(`${B}.beast.count`);
  return t1 === t0 + 1 && t2 === t0 + 2; })());
ok('gilded deals 1 gilded / 2 gilded / 2 STAR tiles at battle start', await (async () => {
  const deal = async (t) => {
    await hold(['gilded'], { gilded: t });
    await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); 'ok'`);
    await settle();
    return evj(`JSON.stringify(${B}.board.filter(Boolean).reduce((a, s) => { a[s.tier] = (a[s.tier] | 0) + 1; return a }, {}))`);
  };
  const d1 = await deal(1), d2 = await deal(2), d3 = await deal(3);
  return (d1['1'] | 0) === 1 && !d1['2'] && (d2['1'] | 0) === 2 && !d2['2'] && (d3['2'] | 0) === 2 && !d3['1']; })());
ok('the tome reveals once at I, twice at its higher tiers — the third asks nothing', await (async () => {
  await hold(['tome'], { tome: 2 });
  await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); 'ok'`);
  if (await ev(`${B}.hintsLeft`) !== 2) return false;
  await ev(`${B}.useHint(); 'ok'`);
  if (await ev(`${B}.hintsLeft`) !== 1 || await ev(`${B}.hintB.alpha`) !== 1) return false;
  await ev(`${B}.clearHintFx(); ${B}.useHint(); 'ok'`);
  if (await ev(`${B}.hintsLeft`) !== 0) return false;
  await ev(`${B}.clearHintFx(); ${B}.useHint(); 'ok'`);   // refused — nothing left
  return (await ev(`${B}.hintsLeft`)) === 0 && (await ev(`!${B}.hintFx`)) === true; })());
ok('comet grants 1/2/3 free scries with matching pips, then the strike ticks', await (async () => {
  await hold(['comet'], { comet: 3 });
  await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); ${B}.beast.hpNow = 99999; ${B}.beast.count = 9; 'ok'`);
  if (await ev(`${B}.cometLeft`) !== 3 || await ev(`${B}.scryPips.length`) !== 3) return false;
  for (let k = 3; k > 0; k--) {
    await ev(`${B}.scry(); 'ok'`);
    if (!(await until(`${B}.state === 'pick'`, 10000, 200))) return false;
    if (await ev(`${B}.beast.count`) !== 9 || await ev(`${B}.cometLeft`) !== k - 1) return false;
  }
  await ev(`${B}.scry(); 'ok'`);
  if (!(await until(`${B}.state === 'pick'`, 10000, 200))) return false;
  if (await ev(`${B}.beast.count`) !== 8) return false;
  await hold(['comet'], { comet: 2 });
  await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); 'ok'`);
  return (await ev(`${B}.cometLeft`)) === 2 && (await ev(`${B}.scryPips.length`)) === 2; })());
// ---- the strike side ----
const strike = async (sigs, tiers, atk, hp) => {
  await hold(sigs, tiers);
  await ev(`(() => { const b = ${B}; b.run.hpMax = 200; b.run.hp = ${hp}; b.beast.atk = ${atk};
    b.beast.hpNow = 99999; b.shieldLeft = 0; b.beast.count = 1; b.tickEnemy(() => {}); return 'ok' })()`);
  await until(`${B}.run.hp !== ${hp}`, 15000, 250);   // the signature attack lands inside ~2.6s (watchdogged)
  return ev(`${B}.run.hp`);
};
ok('the shield at its height blocks TWO strikes, the third lands', await (async () => {
  await hold(['shield'], { shield: 2 });
  await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); ${B}.beast.hpNow = 99999; 'ok'`);
  if (await ev(`${B}.shieldLeft`) !== 2) return false;
  await ev(`${B}.run.hpMax = 200; ${B}.run.hp = 100; ${B}.beast.atk = 10; ${B}.beast.count = 1; ${B}.tickEnemy(() => {}); 'ok'`);
  await until(`(${B}.shieldLeft | 0) === 1`, 12000, 250);
  if (await ev(`${B}.run.hp`) !== 100) return false;
  await ev(`${B}.beast.count = 1; ${B}.tickEnemy(() => {}); 'ok'`);
  await until(`(${B}.shieldLeft | 0) === 0`, 12000, 250);
  if (await ev(`${B}.run.hp`) !== 100) return false;
  await ev(`${B}.beast.count = 1; ${B}.tickEnemy(() => {}); 'ok'`);
  await until(`${B}.run.hp < 100`, 15000, 250);
  return (await ev(`${B}.run.hp`)) === 90; })());
ok('ward cuts 3/5/8 (a 20 strike lands 12 at its height)', await (async () => {
  const hp1 = await strike(['ward'], { ward: 3 }, 20, 100);
  return hp1 === 100 - Math.max(1, 20 - 8); })());
ok('eclipse cuts to a half then a third (20 → 7)', await (async () => {
  const hp1 = await strike(['eclipse'], { eclipse: 2 }, 20, 100);
  return hp1 === 100 - Math.ceil(20 / 3); })());
ok('the feather revives at 1, and at 15 at its height', await (async () => {
  await hold(['feather'], { feather: 1 });
  await ev(`${B}.run.featherUsed = false; 'ok'`);
  const hp1 = await strike(['feather'], { feather: 1 }, 50, 5);
  if (hp1 !== 1) return false;
  await ev(`${B}.run.featherUsed = false; 'ok'`);
  const hp2 = await strike(['feather'], { feather: 2 }, 50, 5);
  return hp2 === 15 && (await ev(`${B}.run.featherUsed`)) === true; })());
// ---- real casts: heals and the forge floor ----
ok('a real 5-letter cast heals salve 8 + leech 3 at their heights', await (async () => {
  await hold(['salve', 'leech'], { salve: 3, leech: 3 });
  await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); ${B}.beast.hpNow = 99999; ${B}.beast.count = 9; 'ok'`);
  await place([[0, 's', 0], [1, 'k', 0], [2, 'a', 0], [3, 't', 0], [4, 'e', 0], [5, 'r', 0]]);
  await ev(`${B}.run.hpMax = 200; ${B}.run.hp = 100; 'ok'`);
  for (const i of [0, 1, 2, 3, 4]) await ev(`${B}.tapTile(${i}); 'ok'`);   // SKATE
  await ev(`${B}.tryCast(); 'ok'`);
  return until(`${B}.run.hp === 111`, 15000, 250); })());
ok('the forge at its height forges off a FOUR-letter cast (tier I does not)', await (async () => {
  const cast4 = async () => {
    await place([[0, 's', 0], [1, 'k', 0], [2, 'a', 0], [3, 't', 0], [4, 'e', 0]]);
    for (const i of [4, 2, 0, 3]) await ev(`${B}.tapTile(${i}); 'ok'`);   // EAST
    await ev(`${B}.tryCast(); 'ok'`);
    await until(`${B}.state === 'pick' && ${B}.board.filter(Boolean).length === 16`, 15000, 250);
    await settle();
    return evj(`JSON.stringify(${B}.board.filter(Boolean).map((s) => s.tier))`);
  };
  await hold(['forge'], { forge: 2 });
  await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); ${B}.beast.hpNow = 99999; ${B}.beast.count = 9; 'ok'`);
  const tiers2 = await cast4();
  if (tiers2.filter((t) => t === 2).length !== 1) return false;
  await hold(['forge'], { forge: 1 });
  await ev(`${B}.run.fightIdx = ${idx0}; ${B}.startFight(); ${B}.beast.hpNow = 99999; ${B}.beast.count = 9; 'ok'`);
  const tiers1 = await cast4();
  return tiers1.every((t) => t === 0); })());
// ---- fells ----
ok('echo at its height carries the surplus TWICE OVER into the next beast', await (async () => {
  await hold(['echo'], { echo: 3 });
  await ev(`${B}.sigPlan.clear(); ${B}.run.overkill = 0; 'ok'`);
  await ev(`${B}.beast.hpNow = -20; ${B}.dying = true; ${B}.beastDeath(); 'ok'`);
  if (!(await until(`${B}.run.overkill === 40 || ${B}.state === 'pick'`, 5000, 100))) return false;
  if (await ev(`${B}.run.overkill`) !== 40) return false;
  await until(`${B}.state === 'pick' && !${B}.dying`, 25000, 250);
  return ev(`${B}.beast.hpNow === ${B}.beast.hp - Math.min(40, ${B}.beast.hp - 1) && ${B}.run.overkill === 0`); })());
ok('the meteor at its height grows the vessel +3 per fell, then fills it', await (async () => {
  await hold(['meteor'], { meteor: 2 });
  await ev(`${B}.run.hpMax = 60; ${B}.run.hp = 20; 'ok'`);
  await ev(`${B}.beast.hpNow = -1; ${B}.dying = true; ${B}.beastDeath(); 'ok'`);
  await until(`${B}.state === 'pick' && !${B}.dying`, 25000, 250);
  return ev(`${B}.run.hpMax === 63 && ${B}.run.hp === 63`); })());
ok('a new AEGIS still grants its tier-I vessel (+20, healed) from the pick', await (async () => {
  await hold([], {});
  await ev(`${B}.run.hpMax = 60; ${B}.run.hp = 30; 'ok'`);
  await ev(`(() => { const b = ${B}; b.rollSigilOpts = () => [SS_SIG_BY.aegis]; b.showSigilPick(); return 'ok' })()`);
  await until(`${B}.overlayC.list.some((o) => o.getData && o.getData('sigilCard') && o.alpha === 1)`, 12000, 250);
  await ev(`(() => { const b = ${B}; let c = null; b.overlayC.list.forEach((o) => { if (o.getData && o.getData('sigilCard')) c = o; }); c.emit('pointerdown'); return 'ok' })()`);
  await until(`${B}.state === 'pick' || ${B}.state === 'map'`, 15000, 250);
  await ev(`delete ${B}.rollSigilOpts; 'ok'`);
  return ev(`${B}.run.hpMax === 80 && ${B}.run.hp === 80 && ${B}.run.sigils.includes('aegis')`); })());
ok('no page errors (the scales)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 3. desc generation ================= */
console.log('\n— THE DESC IS GENERATED FROM THE NUMBERS —');
ok('quill speaks its rung: +4 / +6 / +8 / +11', await ev(
  `[1, 2, 3, 4].every((t) => SS_SIG(SS_SIG_BY.quill, t).desc === 'Every word deals +' + [4, 6, 8, 11][t - 1] + ' damage.')`));
ok('a live dial moves the text with it (tl add 99 → the desc says 99)', await ev(
  `(() => { SS_SIG_BY.quill.tl[0].add = 99; const hit = SS_SIG(SS_SIG_BY.quill, 2).desc.includes('99');
    SS_SIG_BY.quill.tl[0].add = 6; return hit && SS_SIG(SS_SIG_BY.quill, 2).desc.includes('+6') })()`));
ok('a variant ladder speaks its own words per rung (comet, en)', await ev(
  `SS_SIG(SS_SIG_BY.comet, 1).desc.includes('first SCRY') && SS_SIG(SS_SIG_BY.comet, 2).desc.includes('two SCRIES') && SS_SIG(SS_SIG_BY.comet, 3).desc.includes('three SCRIES')`));
ok('the tier clamps: 0 and 9 read the ladder ends, never garbage', await ev(
  `SS_SIG(SS_SIG_BY.quill, 0).desc.includes('+4') && SS_SIG(SS_SIG_BY.quill, 9).desc.includes('+11')`));
ok('a language still carrying the old 2-tuple shows its base desc at any tier', await ev(
  `(() => { const keep = SS_STR.en; SS_STR.en = { sig: { first: ['X', 'BASE ONLY'] } };
    const d = SS_SIG(SS_SIG_BY.first, 2).desc; SS_STR.en = keep; return d === 'BASE ONLY' })()`));

/* ================= 4. the offer, for real ================= */
console.log('\n— THE STRENGTHEN SCREEN —');
errs.length = 0;
await boot('');
ok('fresh campaign stands', await startCampaign());
await hold(['choir', 'first'], { first: 2 });   // choir upgradable, first MAXED
await ev(`${B}.refreshDock(); 'ok'`);
await place([[0, 'a', 0]]);
ok('the vowel chip reads +2 before the rite', await ev(`${B}.board[0].val.texture.key === 'gv-3-#7d4a10-s'`),
  await ev(`${B}.board[0].val.texture.key`));
await ev(`${B}.sigPlan.add(${await ev(`${B}.run.fightIdx`)}); ${B}.sigTypes.set(${await ev(`${B}.run.fightIdx`)}, 'upgrade'); 'ok'`);
const upSt = await fell();
ok('an upgrade intent opens the STRENGTHEN screen', upSt === 'upgrade', upSt);
const screen = await evj(`(() => { const b = ${B};
  const out = { tagged: 0, texts: [], descs: {} };
  const scan = (ls) => ls.forEach((o) => {
    if (o.getData && o.getData('sigilCard')) out.tagged++;
    if (o.getData && o.getData('sigilDesc')) out.descs[o.getData('sigilDesc')] = o.lines.map((t) => t.text).join(' ').replace(/\\s+/g, ' ');
    if (o.type === 'Text') out.texts.push(o.text);
    if (o.list) scan(o.list);
  });
  scan(b.overlayC.list);
  return JSON.stringify(out) })()`);
ok('only the upgradable row is tagged; the maxed row shows AT ITS HEIGHT', screen.tagged === 1 && screen.texts.some((t) => t.includes('AT ITS HEIGHT')), JSON.stringify(screen.texts.filter((t) => t.includes('HEIGHT'))));
ok('the header and the grade pair are on the glass (I → II · RARE)', screen.texts.some((t) => t.includes('STRENGTHEN A SIGIL')) && screen.texts.some((t) => t === 'I → II') && screen.texts.some((t) => t === 'RARE'));
ok('the row speaks the NEXT tier; the maxed row speaks what it does', await (async () => {
  const next = await ev(`SS_SIG(SS_SIG_BY.choir, 2).desc`);
  const curMax = await ev(`SS_SIG(SS_SIG_BY.first, 2).desc`);
  return screen.descs.choir === next && screen.descs.first === curMax; })(), JSON.stringify(screen.descs));
// a REAL tap on the maxed row does nothing — it is not interactive, so the
// veil eats the touch and the screen stands
const before = await ev(`JSON.stringify(${B}.run.tiers)`);
await tap(`(() => { let r = null; const scan = (ls) => ls.forEach((o) => {
  if (o.getData && o.getData('sigilDesc') === 'first') r = o.parentContainer; if (o.list) scan(o.list); });
  scan(${B}.overlayC.list); return r })()`);
await sleep(600);
ok('a tap on the maxed row is dead — the screen stands, tiers untouched',
  await ev(`${B}.state === 'upgrade'`) && before === await ev(`JSON.stringify(${B}.run.tiers)`));
ok('a real tap takes the upgrade', await takeCard('upgrade'));
ok('choir stands at tier 2 and the standing chip reads +3 with its spark',
  await ev(`${B}.run.tiers.choir === 2`) && await ev(`${B}.board[0] && ${B}.board[0].val.texture.key === 'gv-4-#7d4a10-s'`),
  await ev(`${B}.board[0] && ${B}.board[0].val.texture.key`));
// POLL the dock — refreshDock runs in the pick's 360 scene-ms callback,
// and a stretched scene clock can put it after a single wall-clock read
ok('the dock wears the II numeral', await until(`(() => { let f = false; ${B}.dockC.list.forEach((o) => { if (o.text === 'II') f = true; }); return f })()`, 12000, 300));
ok('…and the run rides on to the star chart', await until(`${B}.state === 'map'`, 20000, 250));
const fi1 = await ev(`${B}.run.fightIdx`);
ok('the march lands the next fight', await marchOn(fi1));
// ---- pool dry → the offer crosses over to an upgrade ----
await ev(`${B}.rollSigilOpts = () => []; ${B}.sigPlan.add(${fi1}); ${B}.sigTypes.set(${fi1}, 'sigil'); 'ok'`);
const drySt = await fell();
ok('a dry new-sigil pool crosses a sigil offer over to the upgrade screen', drySt === 'upgrade', drySt);
ok('taking it rides on (choir → III)', await takeCard('upgrade') && await ev(`${B}.run.tiers.choir === 3`) && await until(`${B}.state === 'map'`, 20000, 250));
const fi2 = await ev(`${B}.run.fightIdx`);
ok('the march lands again', await marchOn(fi2));
// ---- both dry → ride on, the graceful skip ----
await hold(['choir', 'first'], { choir: 3, first: 2 });   // everything held is maxed
await ev(`${B}.sigPlan.add(${fi2}); ${B}.sigTypes.set(${fi2}, 'upgrade'); 'ok'`);
const bothSt = await fell();
ok('upgrade intent with nothing upgradable AND a dry pool rides on — no dead screen', bothSt === 'map', bothSt);
const fi3 = await ev(`${B}.run.fightIdx`);
ok('the march lands once more', await marchOn(fi3));
// ---- maxed → the upgrade intent falls to the SIGIL pick ----
await ev(`delete ${B}.rollSigilOpts; ${B}.sigPlan.add(${fi3}); ${B}.sigTypes.set(${fi3}, 'upgrade'); 'ok'`);
const maxSt = await fell();
ok('all held maxed → the upgrade intent falls to the sigil pick', maxSt === 'sigil', maxSt);
ok('the pick takes', await takeCard('sigil'));
// ---- the aegis delta, through the real screen ----
ok('an AEGIS upgrade grants the DELTA, healed (70→80 max; hp 50 +6 fell +10 delta = 66)', await (async () => {
  await until(`${B}.state === 'map'`, 20000, 250);
  const fi4 = await ev(`${B}.run.fightIdx`);
  if (!(await marchOn(fi4))) return false;
  await hold(['aegis'], {});
  await ev(`${B}.run.hpMax = 70; ${B}.run.hp = 50; ${B}.refreshDock(); 'ok'`);
  await ev(`${B}.sigPlan.add(${fi4}); ${B}.sigTypes.set(${fi4}, 'upgrade'); 'ok'`);
  if (await fell() !== 'upgrade') return false;   // the fell itself heals 6 (every win does)
  if (!(await takeCard('upgrade'))) return false;
  return ev(`${B}.run.tiers.aegis === 2 && ${B}.run.hpMax === 80 && ${B}.run.hp === 66`); })());
ok('no page errors (the screen)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 5. share + fairness ================= */
console.log('\n— THE SHARE AND THE SHARED DAY —');
const fair = await evj(`(() => {
  const camp = []; for (let a = 0; a < 4; a++) for (let f = 0; f < 5; f++) camp.push({ actIdx: a });
  const out = { det: true, first: true, ups: 0, eligible: 0 };
  for (let s = 1; s <= 300; s++) {
    const p = ssSigilPlan('campaign', camp, s);
    const t1 = ssOfferTypes('campaign', p, s), t2 = ssOfferTypes('campaign', p, s);
    if (JSON.stringify([...t1]) !== JSON.stringify([...t2])) out.det = false;
    const fights = [...p].sort((a, b) => a - b);
    if (t1.get(fights[0]) !== 'sigil') out.first = false;
    for (let k = 1; k < fights.length; k++) { out.eligible++; if (t1.get(fights[k]) === 'upgrade') out.ups++; }
  }
  out.share = out.ups / out.eligible;
  return JSON.stringify(out) })()`);
ok('the intents are deterministic per seed', fair.det);
ok('the run\'s first paying fight is NEVER an upgrade (300 seeds)', fair.first);
ok('the upgrade share tracks the dial (~0.35)', fair.share > 0.30 && fair.share < 0.40, fair.share.toFixed(3));
await boot('daily=1&daykey=20260901');
ok('daily battle one at pick', await until(PICK, 60000));
const day1 = await ev(`JSON.stringify([...${B}.sigTypes].sort((a, b) => a[0] - b[0]))`);
await boot('daily=1&daykey=20260901');
ok('daily battle two at pick', await until(PICK, 60000));
const day2 = await ev(`JSON.stringify([...${B}.sigTypes].sort((a, b) => a[0] - b[0]))`);
ok('every hunter meets the same offer KINDS that day (shared-fair)', day1 === day2 && day1.length > 2, day1);
ok('…and the daily\'s first offer is a sigil', JSON.parse(day1)[0][1] === 'sigil');
ok('the tome at its height taxes the end score 15% (the daily ledger pays it)', await (async () => {
  const paid = await evj(`(() => { const b = ${B};
    b.run.sigils = ['tome']; b.run.tiers = { tome: 3 };
    b.run.totalDmg = 1000; b.run.longest = 'starlight'; b.run.fightIdx = 2; b.run.words = 9;
    b.endRun(false);
    return JSON.stringify(SS.prof.daily[String(SSNET.dayKey())]) })()`);
  const raw = 1000 + 'starlight'.length * 15 + 2 * 50;
  return paid === Math.round(raw * 0.85); })(), 'expected ' + Math.round((1000 + 135 + 100) * 0.85));

/* ================= 6. the checkpoint carries the tiers ================= */
console.log('\n— THE CHECKPOINT —');
errs.length = 0;
await boot('');
ok('fresh campaign for the round-trip', await startCampaign());
await hold(['quill', 'choir'], { quill: 3, choir: 2 });
await ev(`${B}.run.hpMax = 80; ${B}.run.hp = 77; ${B}.saveCheckpoint(); 'ok'`);
const cp = await evj(`localStorage.getItem('beta3.campaign')`);
ok('saveCheckpoint writes the tiers', cp.tiers && cp.tiers.quill === 3 && cp.tiers.choir === 2, JSON.stringify(cp.tiers));
const planBefore = await ev(`JSON.stringify([[...${B}.sigPlan].sort((a,b)=>a-b), [...${B}.sigTypes].sort((a,b)=>a[0]-b[0])])`);
await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(600);
await send('Page.navigate', { url: BASE + '?fps=0' }); await sleep(2500);
await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
ok('the resumed climb stands', await startCampaign());
ok('the tiers stand (quill III · choir II), hpMax un-regranted', await ev(
  `${B}.run.tiers.quill === 3 && ${B}.run.tiers.choir === 2 && ${B}.run.hpMax === 80`));
ok('damage pays tier III (+8) after the resume', await evj(`(() => { const b = ${B};
  b.run.sigils = ['quill']; b.sign = null; b.run.firstUsed = true;
  return JSON.stringify(b.wordDamage([{ ch: 's', tier: 0, blk: false }, { ch: 'o', tier: 0, blk: false }])) })()`) === Math.round(base('so') + 8));
ok('the schedule AND the intents recompute identically', await ev(`JSON.stringify([[...${B}.sigPlan].sort((a,b)=>a-b), [...${B}.sigTypes].sort((a,b)=>a[0]-b[0])])`) === planBefore);
ok('the prewarm bakes the RAISED chips a resumed choir deals', await until(`game.textures.exists('gv-4-#7d4a10-s')`, 12000, 400));
// a pre-v0.66 checkpoint (no tiers field) resumes at tier I exactly
await evj(`(() => { const c = JSON.parse(localStorage.getItem('beta3.campaign')) || ${JSON.stringify(cp)};
  delete c.tiers; c.sigils = ['quill']; localStorage.setItem('beta3.campaign', JSON.stringify(c)); return '1' })()`);
await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(600);
await send('Page.navigate', { url: BASE + '?fps=0' }); await sleep(2500);
await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
ok('a pre-tier checkpoint still resumes', await startCampaign());
ok('…at tier I: empty tiers, quill pays today\'s +4', await ev(`JSON.stringify(${B}.run.tiers) === '{}'`)
  && await evj(`(() => { const b = ${B}; b.sign = null; b.run.firstUsed = true;
    return JSON.stringify(b.wordDamage([{ ch: 's', tier: 0, blk: false }, { ch: 'o', tier: 0, blk: false }])) })()`) === Math.round(base('so') + 4));
ok('no page errors (the checkpoint)', errs.length === 0, errs.join(' | ').slice(0, 200));

/* ================= 7. the demo picker takes the new screen ================= */
console.log('\n— A NATURAL DEMO QUICK RUN THROUGH AN UPGRADE —');
errs.length = 0;
await boot('demo=1');
ok('the demo run stands', await until(PICK, 90000));
// pin the share to 1 so the run's second offer is certainly an upgrade —
// the demo itself still does every tap (the campaign summit walk is the
// --demo pass's business)
await ev(`SS_CADENCE.quick.up = 1; ${B}.sigTypes = ssOfferTypes('quick', ${B}.sigPlan, 777); ${B}.demoTimer.delay = 700; 'ok'`);
ok('the demo reaches its end unaided', await until(`${B}.state === 'end'`, 300000, 1000));
ok('…and strengthened a sigil on the way (demoStep took the upgrade screen)',
  await ev(`Object.values(${B}.run.tiers || {}).some((t) => t >= 2)`), await ev(`JSON.stringify(${B}.run.tiers)`));
ok('no page errors (the demo)', errs.length === 0, errs.join(' | ').slice(0, 200));

} else {

/* ================= --demo: the campaign summit, naturally ================= */
console.log('\nTIER-CHECK --demo · a natural campaign through real upgrade offers\n');
// (`typeof`, never `window.SS_CADENCE` — a top-level const is not a window
// property; the rival-check lesson)
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(function w(){ if (typeof SS_CADENCE !== 'undefined') SS_CADENCE.campaign.up = 1; else setTimeout(w, 40); })()`,
});
await boot('demo=1&mode=campaign');
ok('the demo campaign stands', await until(PICK, 90000));
await ev(`${B}.demoTimer.delay = 500; 'ok'`);
let sawUp = 0, maxTier = 0;
const t0 = Date.now();
while (Date.now() - t0 < 520000) {
  const st = await ev(`(() => { const b = ${B}; if (!b || !b.run) return 'gone';
    return JSON.stringify({ s: b.state, f: b.run.fightIdx, t: b.run.tiers || {} }) })()`).catch(() => 'gone');
  if (st === 'gone') break;
  const o = JSON.parse(st);
  if (o.s === 'upgrade') sawUp++;
  for (const k in o.t) maxTier = Math.max(maxTier, o.t[k]);
  if (o.s === 'end') break;
  await sleep(2000);
}
ok('the climb reached its end', await ev(`${B}.state === 'end'`), 'fight ' + await ev(`${B}.run.fightIdx`));
ok('the demo met and took real upgrade offers on the way', sawUp >= 1 && maxTier >= 2, 'seen ' + sawUp + ' · top tier ' + maxTier);
ok('the run ended holding tiers', await ev(`Object.values(${B}.run.tiers || {}).some((t) => t >= 2)`), await ev(`JSON.stringify(${B}.run.tiers)`));
ok('no page errors (the summit)', errs.length === 0, errs.join(' | ').slice(0, 200));

}

/* ================= the verdict ================= */
console.log('\n' + pass + ' passed · ' + fail + ' failed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
try { ws.close(); } catch (e) { }
process.exit(fail ? 1 : 0);
