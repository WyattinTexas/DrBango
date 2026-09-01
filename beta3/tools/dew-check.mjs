// DEW-CHECK — the green tile (v0.56.0, task 45).
// The forged family's third member: orange +6, blue ×1.5, GREEN heals. A
// beast's strike leaves dew on ONE plain tile; it heals DEW_HEAL when it
// rides the very next cast (still scoring its letter), drains if skipped,
// is SPARED by the blackout while a plain tile remains (specials last,
// v0.59.0 — though an ink that does land still wins), is never touched by STAR
// FORGE, and never spawns in versus. Every cast here is REAL taps at DPR3 —
// tiles and the CAST button are pressed through Input.dispatchMouseEvent.
// Self-launching, like rival-check: serves beta3 on :8899 if nothing does,
// opens a headless Chrome on :9456 (/tmp/cdp-dew, --disable-gpu is fine —
// nothing here forces WebGL) and kills both at the end.
//
//   node tools/dew-check.mjs           # PvE half blocks Firebase at the network layer
//   node tools/dew-check.mjs --novs    # skip the versus duel (it needs the live sky)
//   node tools/dew-check.mjs --onlyvs  # just the duel
//
// ⚠ Every wait POLLS — the software renderer runs the scene clock anywhere
// from 12 to 60fps and a fixed sleep reads as a bug that isn't there.
import { spawn } from 'node:child_process';
const PORT = 9456, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const DB = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/mp/rooms';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const NOVS = process.argv.includes('--novs'), ONLYVS = process.argv.includes('--onlyvs');
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
  '--user-data-dir=/tmp/cdp-dew', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const BLOCK = ['*firebaseio.com*', '*firebasedatabase.app*', '*firebase*', '*gstatic.com*'];
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
// a REAL press+release on a game object (expr evaluates to it in the page)
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
const board = async () => evj(`JSON.stringify(${B}.board.map((s, i) => s ? { i, ch: s.ch, tier: s.tier, blk: s.blk, img: s.img.texture.key, val: s.val.texture.key, letter: s.letter.texture.key, glow: !!(s.glow && s.glow.active) } : null))`);
const hp = async () => evj(`JSON.stringify([${B}.run.hp, ${B}.run.hpMax])`);
// a legal word on the board that MUST use (or must avoid) given slots —
// the game's own trie, walked here so the test never depends on bestWord's taste
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
// spell a word with real taps and press CAST; resolves when the board is back to 'pick'
const castWord = async (idx) => {
  // tiles must have landed (the refill bounces them in) — a tap on a moving
  // or just-built tile is dropped, so wait for the settle and re-tap if unseen
  await until(`${B}.board.every((s, i) => !s || Math.abs(s.c.y - ${B}.slotPos(i).y) < 0.5)`, 8000, 100);
  for (const i of idx) {
    for (let t = 0; t < 4; t++) {
      await tap(`${B}.board[${i}].c`); await sleep(140);
      if (await ev(`${B}.sel.includes(${i})`)) break;
    }
  }
  const sel = await evj(`JSON.stringify(${B}.sel)`);
  if (sel.length !== idx.length) { console.log('    · taps selected ' + JSON.stringify(sel) + ' of ' + JSON.stringify(idx) + ' state ' + await ev(`${B}.state`)); return false; }
  await tap(`${B}.castB`);
  await sleep(300);
  const back = await until(PICK, 25000);
  if (!back) console.log('    · never back to pick: state ' + await ev(`${B}.state`) + ' tiles ' + await ev(`${B}.board.filter(Boolean).length`) + ' hp ' + await ev(`${B}.run.hp`));
  return back;
};
const boot = async (q, block) => {
  await send('Network.setBlockedURLs', { urls: block ? BLOCK : [] });
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0&' + q }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};

/* ================= PvE: quick run, Firebase blocked ================= */
if (!ONLYVS) {
console.log('\n— THE STRIKE LEAVES IT —');
await boot('quick=1', true);
ok('quick run at pick', await until(PICK, 60000));
ok('sky blocked (local net)', await ev(`SSNET.mode`) === 'local', await ev(`SSNET.mode`));
ok('dials exist', await ev(`typeof DEW_HEAL === 'number' && typeof DEW_CHANCE === 'number' && DEW_HEAL === 6 && DEW_CHANCE === 1`));
ok('tile3 texture baked', await ev(`game.textures.exists('tile3')`));
// the beast cannot die this fight, and strikes on the very next cast
await ev(`${B}.beast.hpNow = 99999; ${B}.beast.count = 1; ${B}.run.sigils = []; 'ok'`);
let [h0] = await hp();
let w = await findWord([], []);
ok('a word to cast', !!w, JSON.stringify(w));
ok('cast → strike → back to pick', await castWord(w));
ok('the strike landed (hp fell)', (await hp())[0] < h0, h0 + ' → ' + (await hp())[0]);
ok('dew beacon set', await until(`!!window.__ssdew`, 5000));
await sleep(700);   // the settle: crossfade + inks
let bd = await board();
let greens = bd.filter((s) => s && s.tier === 3);
ok('exactly one tile turned green', greens.length === 1, greens.map((g) => g.i + ':' + g.ch).join(','));
const g1 = greens[0];
ok('green face (tile3)', g1 && g1.img === 'tile3', g1 && g1.img);
ok('chip reads ♥6, not the points', g1 && g1.val === 'gv-♥6-#22572a', g1 && g1.val);
ok('letter ink is the dew ink', g1 && g1.letter === 'gl-' + g1.ch + '-#1f4d22', g1 && g1.letter);
ok('green glow blooms', g1 && g1.glow);
ok('the dewed slot is the beacon slot', g1 && g1.i === (await evj(`JSON.stringify(window.__ssdew.i)`)));
// an 8-letter cast also forges its own drop — that one orange/blue is the law, not a leak
ok('nothing else greened; at most the cast\'s own forge drop', bd.filter((s) => s && s.tier === 1 || s && s.tier === 2).length <= 1);
// the chip really printed a heart: more ink than the bare digit in the same ink
const inkPx = async (key) => evj(`(() => { const t = game.textures.get('${key}'); const c = t.getSourceImage();
  const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 60) n++; return JSON.stringify(n) })()`);
await ev(`ssGlyphVal(${B}, 6, '#22572a'); 'ok'`);
const heartInk = await inkPx('gv-♥6-#22572a'), digitInk = await inkPx('gv-6-#22572a');
ok('♥ glyph carries ink beside the 6', heartInk > digitInk * 1.3, heartInk + ' vs ' + digitInk);

console.log('\n— THE DEW RIDES THE NEXT CAST —');
await ev(`${B}.beast.count = 9; ${B}.run.hp = ${B}.run.hpMax - 20; ${B}.updateBars(); 'ok'`);
w = await findWord([g1.i], []);
ok('a word through the green', !!w, JSON.stringify(w));
[h0] = await hp();
ok('cast the green', await castWord(w));
let hb = await evj(`JSON.stringify(window.__ssdewHeal || null)`);
ok('heal beacon: one dew, +6', hb && hb.n === 1 && hb.healed === 6, JSON.stringify(hb));
ok('hp rose by exactly 6', (await hp())[0] === h0 + 6, h0 + ' → ' + (await hp())[0]);
bd = await board();
ok('green consumed; none left on the board', bd.filter((s) => s && s.tier === 3).length === 0);

console.log('\n— CAPPED AT hpMax · TWO GREENS SUM —');
await ev(`${B}.beast.count = 9; ${B}.run.hp = ${B}.run.hpMax - 2; ${B}.updateBars(); 'ok'`);
let slot = await evj(`JSON.stringify(${B}.dewTile())`);
ok('dewTile lands on a plain tile', slot >= 0, String(slot));
w = await findWord([slot], []);
ok('a word through it', !!w);
ok('cast', await castWord(w));
hb = await evj(`JSON.stringify(window.__ssdewHeal)`);
ok('heal clamped at hpMax (+2 shown)', hb.healed === 2 && (await hp())[0] === (await hp())[1], JSON.stringify(hb));
// two greens: dew two tiles of a 3+ letter word, then cast it
await ev(`${B}.beast.count = 9; ${B}.run.hp = ${B}.run.hpMax - 30; ${B}.updateBars(); 'ok'`);
// only plain tiles can take dew, so the word must avoid the forged ones
const specials = (await board()).filter((s) => s && (s.tier !== 0 || s.blk)).map((s) => s.i);
w = await findWord([], specials, 3);
ok('a 3+ letter word on plain tiles', !!w && w.length >= 3, JSON.stringify(w));
const d1 = await evj(`JSON.stringify(${B}.dewTile(${w[0]}))`), d2 = await evj(`JSON.stringify(${B}.dewTile(${w[1]}))`);
ok('two tiles dewed by slot', d1 === w[0] && d2 === w[1], d1 + ',' + d2);
ok('a dewed slot refuses a second dew', (await evj(`JSON.stringify(${B}.dewTile(${w[0]}))`)) === -1);
[h0] = await hp();
ok('cast the double', await castWord(w));
hb = await evj(`JSON.stringify(window.__ssdewHeal)`);
ok('two greens = +12', hb.n === 2 && hb.healed === 12 && (await hp())[0] === h0 + 12, JSON.stringify(hb) + ' hp ' + h0 + '→' + (await hp())[0]);
ok('damage still counted the letters', await evj(`JSON.stringify(${B}.wordDamage([{ch:'a',tier:3,blk:false},{ch:'t',tier:3,blk:false}]) === ${B}.wordDamage([{ch:'a',tier:0,blk:false},{ch:'t',tier:0,blk:false}]))`));

console.log('\n— USE IT OR LOSE IT —');
await ev(`${B}.beast.count = 9; 'ok'`);
slot = await evj(`JSON.stringify(${B}.dewTile())`);
const gch = (await board())[slot].ch;
w = await findWord([], [slot]);
ok('a word that skips the green', !!w);
const healT0 = await evj(`JSON.stringify(window.__ssdewHeal.t)`);
ok('cast around it', await castWord(w));
await sleep(900);   // the drain's crossfade + ink swap
bd = await board();
const drained = bd[slot];
ok('shimmer drained: tier 0', drained && drained.tier === 0, drained && String(drained.tier));
ok('letter survives', drained && drained.ch === gch, drained && drained.ch);
ok('plain face + points chip back', drained && drained.img === 'tile0' && /^gv-\d+-#655636$/.test(drained.val), drained && drained.img + ' ' + drained.val);
ok('no glow', drained && !drained.glow);
ok('no heal fired', (await evj(`JSON.stringify(window.__ssdewHeal.t)`)) === healT0);
await ev(`${B}.run.hp = ${B}.run.hpMax - 20; ${B}.updateBars(); ${B}.beast.count = 9; 'ok'`);
w = await findWord([slot], []);
[h0] = await hp();
ok('cast the drained letter', await castWord(w));
ok('…and it heals nothing', (await hp())[0] === h0 && (await evj(`JSON.stringify(window.__ssdewHeal.t)`)) === healT0, h0 + '→' + (await hp())[0]);

console.log('\n— THE BLACKOUT SPARES IT · THE FORGE LEAVES IT —');
await ev(`${B}.beast.count = 9; 'ok'`);
// pick a green whose letter+6 outranks every other tile — the volley must STILL pass it by (specials last, v0.59.0)
const target = await evj(`(() => { const b = ${B}; let best = -1, bw = -1, other = 0;
  b.board.forEach((s, i) => { if (!s) return; const v = b.tileVal(s.ch, s.tier); if (s.tier === 0 && !s.blk && v + 6 > bw) { bw = v + 6; best = i; } });
  b.board.forEach((s, i) => { if (s && i !== best) other = Math.max(other, b.inkWorth(s)); });
  return JSON.stringify(bw > other ? best : -1) })()`);
ok('a green that outranks the board', target >= 0, String(target));
await ev(`${B}.dewTile(${target}); 'ok'`);
ok('inkWorth counts the balm as +6', await evj(`JSON.stringify(${B}.inkWorth(${B}.board[${target}]) === ${B}.tileVal(${B}.board[${target}].ch, 0) + 6)`));
await ev(`${B}.beast.fx = { curse: 'blackout', ink: 1 }; ${B}.state = 'anim'; ${B}.blackoutAttack(() => { ${B}.state = 'pick'; }); 'ok'`);
ok('volley returns the turn', await until(`${B}.state === 'pick'`, 8000));
const ink = await evj(`JSON.stringify(window.__ssink)`);
ok('the volley spares the green (specials last)', ink && ink.tiles.length === 1 && ink.tiles[0] !== target, JSON.stringify(ink && ink.tiles));
const inkIdx = ink.tiles[0];
bd = await board();
ok('…and inked a plain tile instead', bd[inkIdx].blk && bd[target].tier === 3 && !bd[target].blk && !!bd[target].glow, JSON.stringify({ inked: bd[inkIdx], green: bd[target] }));
// when no plain tile remains the volley falls through to the special — blackTile is that landing
await ev(`${B}.blackTile(${target}); 'ok'`);
bd = await board();
ok('blackout wins when it lands: inked, tier 0, no glow', bd[target].blk && bd[target].tier === 0 && !bd[target].glow, JSON.stringify(bd[target]));
await ev(`${B}.beast.fx = null; 'ok'`);
// STAR FORGE: the drop law stays length→power; green is neither upgraded nor forged
await ev(`${B}.run.sigils = ['forge']; ${B}.beast.count = 9; ${B}.run.hp = ${B}.run.hpMax - 20; ${B}.updateBars(); 'ok'`);
// the dewed slot must be PLAIN: earlier long casts leave forged drops on the
// board, and dewTile refuses a special slot (that refusal is its own check
// above) — so the word rides plain tiles only, like the two-greens cast
const sp2 = (await board()).filter((s) => s && (s.tier !== 0 || s.blk)).map((s) => s.i);
w = await findWord([], sp2);
slot = await evj(`JSON.stringify(${B}.dewTile(${w[0]}))`);
ok('green under STAR FORGE stays tier 3', slot === w[0] && (await board())[slot].tier === 3, slot + ' of ' + JSON.stringify(w));
ok('cast it with the forge', await castWord(w));
hb = await evj(`JSON.stringify(window.__ssdewHeal)`);
ok('forge does not upgrade the heal', hb.n === 1 && hb.healed === 6, JSON.stringify(hb));
bd = await board();
ok('the forge minted no green', bd.filter((s) => s && s.tier === 3).length === 0 && bd.every((s) => !s || s.tier !== 3));
ok('the pending queue never says dew', await evj(`JSON.stringify((${B}.pending || []).every((t) => t !== 3))`));
// a word of 5+ forges tier 2 with the sigil — the law, unchanged
w = await findWord([], [target, inkIdx], 5);
if (w) {
  ok('cast a 5+ word', await castWord(w));
  bd = await board();
  ok('the forge dropped a legendary, not a green', bd.some((s) => s && s.tier === 2) && !bd.some((s) => s && s.tier === 3));
} else console.log('  · no 5-letter word on this board — forge drop tier not exercised');
ok('no page errors (PvE)', errs.length === 0, errs.join(' | '));
}

/* ================= VERSUS: the dew never spawns ================= */
if (!NOVS) {
  console.log('\n— NOT IN VERSUS —');
  errs.length = 0;
  await boot('mpuid=dw&botduel=1000&vsdemo=1&vsmode=turns&seed=779045', false);
  const sky = await until(`SSNET.mode === 'firebase' && typeof SS_RIVAL !== 'undefined'`, 60000);
  ok('the live sky answers', sky);
  const VS = `game.scene.getScene('vsbattle')`;
  const up = await until(`!!window.__ssRival && !!${VS} && ${VS}.scene.isActive() && ${VS}.state === 'pick'`, 90000);
  ok('bot duel rose', up);
  if (up) {
    ok('the versus engine has no dew', await ev(`typeof ${VS}.dewTile === 'undefined'`));
    let seen3 = 0, polls = 0, strikes = 0, hpMin = 999;
    const t0 = Date.now();
    while (Date.now() - t0 < 75000) {
      const st = await evj(`JSON.stringify((() => { const v = ${VS}; if (!v || !v.board) return null;
        return { t3: v.board.filter((s) => s && s.tier === 3).length, hp: v.me ? v.me.hp : (v.hp != null ? v.hp : -1), done: window.__ssRival && window.__ssRival.state === 'done', dew: !!window.__ssdew } })())`);
      if (!st) break;
      polls++; if (st.t3) seen3++;
      if (st.hp >= 0 && st.hp < hpMin) { if (hpMin !== 999) strikes++; hpMin = st.hp; }
      if (st.done) break;
      await sleep(500);
    }
    ok('board polled through the duel', polls >= 20, polls + ' polls');
    ok('no green ever on a versus board', seen3 === 0, seen3 + ' sightings');
    ok('no dew beacon in versus', !(await ev(`!!window.__ssdew`)));
    ok('no page errors (versus)', errs.length === 0, errs.join(' | '));
  }
  // tidy the test seat's rooms
  try {
    const all = (await (await fetch(DB + '.json')).json()) || {};
    for (const [k, r] of Object.entries(all)) {
      if (r && (/^test_dw/.test(r.hostUid || '') || Object.keys(r.players || {}).some((p) => /^test_dw/.test(p)))) await fetch(DB + '/' + k + '.json', { method: 'DELETE' });
    }
  } catch (e) { }
}

console.log(`\n${pass} passed, ${fail} failed`);
ws.close();
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
