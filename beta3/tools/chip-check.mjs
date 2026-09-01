// CHIP-CHECK — the tile's printed value is the TRUE value the cast will pay
// (v0.62.0, Skylar 9/1: "it needs to show that in the letters that appear on
// the board"). River Runes (+2 on S/R/E/T) and the Vowel Choir (+2 on vowels)
// now print ON the chip — warmer ink + a small spark — and chip, CAST preview,
// blackout weighing and wordDamage all read ONE data-driven place
// (ssSigilLetterAdd over SS_SIGILS `lb`), in solo, versus and the rival engine.
// Every board here is real spawnTile spawns; every cast is REAL taps at DPR3.
// Self-launching like dew-check: serves beta3 on :8899 if nothing does, opens
// a headless Chrome on :9458 (/tmp/cdp-chip, --disable-gpu) and kills both.
//
//   node tools/chip-check.mjs           # PvE half blocks Firebase at the network layer
//   node tools/chip-check.mjs --novs    # skip the versus duel (it needs the live sky)
//   node tools/chip-check.mjs --onlyvs  # just the duel
//
// ⚠ Every wait POLLS — never sleep-and-shoot (tools/README law).
import { spawn } from 'node:child_process';
const PORT = 9458, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const DB = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/mp/rooms';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const NOVS = process.argv.includes('--novs'), ONLYVS = process.argv.includes('--onlyvs');
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// the inks and the curve, pinned harness-side so the page cannot agree with
// itself by accident (mirror of SS_TILE_VINK / SS_BUFF_VINK / LEN_MULT)
const VINK = ['#655636', '#5f420a', '#215a7c', '#22572a'];
const BUFF = ['#7d4a10', '#6e3c03', '#215a7c', '#22572a'];
const LEN_MULT = [0, 0, 0.6, 1, 1.15, 1.35, 1.6, 1.9, 2.3];
const SRET = 'sret', VOW = 'aeiou';
const addFor = (held, ch) => {
  const c0 = ch[0]; let a = 0;
  if (held.includes('runes') && SRET.includes(c0)) a += 2;
  if (held.includes('choir') && VOW.includes(c0)) a += 2;
  return a;
};
const keyFor = (vals, held, ch, tier) => {
  const base = (vals[ch] ?? vals[ch[0]] ?? 1) + (tier === 1 ? 6 : 0);
  const a = tier === 3 ? 0 : addFor(held, ch);
  if (tier === 3) return 'gv-♥6-' + VINK[3];
  return a > 0 ? 'gv-' + (base + a) + '-' + BUFF[tier] + '-s' : 'gv-' + base + '-' + VINK[tier];
};

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-chip', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
const board = async (S = B) => evj(`JSON.stringify(${S}.board.map((s, i) => s ? { i, ch: s.ch, tier: s.tier, blk: !!s.blk, val: s.val.texture ? s.val.texture.key : null } : null))`);
const settle = async (S = B) => until(`${S}.board.every((s, i) => !s || Math.abs(s.c.y - ${S}.slotPos(i).y) < 0.5)`, 8000, 100);
// real spawnTile spawns into chosen slots — the same path every refill rides
const place = async (arr) => {
  await ev(`(() => { const b = ${B}; b.unselectFrom(0);
    for (const [i, ch, tier] of ${JSON.stringify(arr)}) {
      if (b.board[i]) { b.board[i].c.destroy(); b.board[i] = null; }
      b.spawnTile(i, ch, tier, false);
    } return 'ok' })()`);
  await settle();
};
const hold = async (sigs) => ev(`${B}.run.sigils = ${JSON.stringify(sigs)}; ${B}.repaintChips(); 'ok'`);
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
const selectTiles = async (idx, S = B) => {
  await settle(S);
  for (const i of idx) {
    for (let t = 0; t < 4; t++) {
      await tap(`${S}.board[${i}].c`); await sleep(140);
      if (await ev(`${S}.sel.includes(${i})`)) break;
    }
  }
  return evj(`JSON.stringify(${S}.sel)`);
};
const boot = async (q, block) => {
  await send('Network.setBlockedURLs', { urls: block ? BLOCK : [] });
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); localStorage.setItem('beta3.profile', JSON.stringify({ rating: 1000 })); 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0&' + q }); await sleep(2500);
  await until(`!!window.game && typeof SSNET !== 'undefined'`, 30000);
};

/* ================= PvE: the chip is the cast ================= */
if (!ONLYVS) {
console.log('\n— THE PLAIN BOARD PRINTS THE PLAIN TRUTH —');
await boot('quick=1', true);
ok('quick run at pick', await until(PICK, 60000));
const VALS = await evj(`JSON.stringify(VALS)`);
ok('lb rides the sigil defs', await evj(`JSON.stringify(SS_SIG_BY.runes.lb.letters === 'sret' && SS_SIG_BY.runes.lb.add === 2 && SS_SIG_BY.choir.lb.vowels === true && SS_SIG_BY.choir.lb.add === 2)`));
await ev(`${B}.beast.hpNow = 99999; ${B}.beast.count = 9; 'ok'`);
await hold([]);
const RACK = [[0, 's', 0], [1, 'r', 0], [2, 'e', 0], [3, 't', 0], [4, 'a', 0], [5, 'b', 0], [6, 'k', 0], [7, 'qu', 0]];
await place(RACK);
let bd = await board();
const rackOK = (held, note) => {
  const bad = RACK.filter(([i, ch, tier]) => bd[i].val !== keyFor(VALS, held, ch, tier))
    .map(([i, ch]) => ch + '@' + i + '=' + bd[i].val);
  ok(note, bad.length === 0, bad.join(' '));
};
rackOK([], 'all eight chips plain: letter points, no spark');

console.log('\n— RIVER RUNES RAISES ITS FOUR ON THE BOARD —');
await hold(['runes']);
bd = await board();
rackOK(['runes'], 'S R E T read base+2, warm ink, spark; a b k qu untouched');
ok('spark texture is keyed apart and baked', await ev(`game.textures.exists('gv-3-${BUFF[0]}-s')`));
const inkPx = async (key) => evj(`(() => { const t = game.textures.get('${key}'); const c = t.getSourceImage();
  const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 60) n++; return JSON.stringify(n) })()`);
await ev(`ssGlyphVal(${B}, 3, '${VINK[0]}'); 'ok'`);
ok('the spark carries real ink beside the number', (await inkPx('gv-3-' + BUFF[0] + '-s')) > (await inkPx('gv-3-' + VINK[0])) * 1.1,
  (await inkPx('gv-3-' + BUFF[0] + '-s')) + ' vs ' + (await inkPx('gv-3-' + VINK[0])));

console.log('\n— THE CHOIR RAISES THE VOWELS · BOTH STACK —');
await hold(['choir']);
bd = await board();
rackOK(['choir'], 'vowels read base+2; s r t back to plain');
await hold(['runes', 'choir']);
bd = await board();
rackOK(['runes', 'choir'], 'stacked: e reads base+4, s r t a +2, b k qu plain');
ok('E stacks both (+4)', bd[2].val === 'gv-5-' + BUFF[0] + '-s', bd[2].val);

console.log('\n— THE CAST PAYS EXACTLY WHAT THE CHIPS PRINT —');
let specials = bd.filter((s) => s && (s.tier !== 0 || s.blk)).map((s) => s.i);
let w = await findWord([], specials, 3);
ok('a word on plain tiles', !!w && w.length >= 3, JSON.stringify(w));
let sel = await selectTiles(w);
ok('taps selected the word', sel.length === w.length, JSON.stringify(sel));
bd = await board();
const chipVal = (i) => parseInt(bd[i].val.replace(/^gv-/, ''), 10);
let letters = w.reduce((a, i) => a + bd[i].ch.length, 0);
let expected = Math.round(w.reduce((a, i) => a + chipVal(i), 0) * (LEN_MULT[Math.min(letters, 8)] || 2.3));
ok('CAST preview = sum of printed chips × length curve', await ev(`${B}.castT.text`) === 'CAST ' + expected, await ev(`${B}.castT.text`) + ' vs ' + expected);
ok('previewDamage agrees', await evj(`JSON.stringify(${B}.previewDamage())`) === expected);
const ehp0 = await evj(`JSON.stringify(${B}.beast.hpNow)`);
await tap(`${B}.castB`); await sleep(300);
ok('cast lands and refills', await until(PICK, 25000));
ok('the beast paid the printed sum', (await evj(`JSON.stringify(${B}.beast.hpNow)`)) === ehp0 - expected, ehp0 + ' → ' + await evj(`JSON.stringify(${B}.beast.hpNow)`));
// word-level adds stay word-level: the quill rides on top of the chips
await hold(['runes', 'choir', 'quill']);
bd = await board();
specials = bd.filter((s) => s && (s.tier !== 0 || s.blk)).map((s) => s.i);
w = await findWord([], specials, 3);
sel = await selectTiles(w);
bd = await board();
letters = w.reduce((a, i) => a + bd[i].ch.length, 0);
expected = Math.round(w.reduce((a, i) => a + chipVal(i), 0) * (LEN_MULT[Math.min(letters, 8)] || 2.3) + 4);
ok('quill adds +4 to the word, never to a chip', await ev(`${B}.castT.text`) === 'CAST ' + expected, await ev(`${B}.castT.text`) + ' vs ' + expected);
await ev(`${B}.unselectFrom(0); 'ok'`);

console.log('\n— DATA-DRIVEN: THE DEF IS THE DIAL —');
await hold(['runes']);
await place([[0, 's', 0]]);   // the casts above may have woven the rack's S away
const tuned = await evj(`(() => { const b = ${B}; SS_SIG_BY.runes.lb.add = 5; b.repaintChips();
  const k = b.board[0].val.texture.key, wd = b.wordDamage([{ ch: 's', tier: 0, blk: false }, { ch: 'o', tier: 0, blk: false }]);
  SS_SIG_BY.runes.lb.add = 2; b.repaintChips();
  return JSON.stringify({ k, wd, back: b.board[0].val.texture.key }) })()`);
ok('lb.add=5 → the S chip prints 6 (nothing hard-coded)', tuned.k === 'gv-6-' + BUFF[0] + '-s', tuned.k);
ok('…and wordDamage moved with it', tuned.wd === Math.round((1 + 5 + 1) * 0.6), String(tuned.wd));
ok('restored to +2', tuned.back === 'gv-3-' + BUFF[0] + '-s', tuned.back);

console.log('\n— TIERS, DEW, INK AND THE DRAIN KEEP THE LAW —');
await hold(['runes', 'choir']);
await place([[0, 's', 1], [1, 'e', 2], [2, 'r', 0], [3, 't', 0], [4, 'a', 0]]);
bd = await board();
ok('gilded S prints 1+6+2, warm gold ink, spark', bd[0].val === 'gv-9-' + BUFF[1] + '-s', bd[0].val);
ok('star E keeps blue ink; the spark tells (+4)', bd[1].val === 'gv-5-' + BUFF[2] + '-s', bd[1].val);
ok('inkWorth weighs the true worth', await evj(`JSON.stringify(${B}.inkWorth(${B}.board[2]) === 3 && ${B}.inkWorth(${B}.board[0]) === 9)`));
await ev(`${B}.expireSpecials(); 'ok'`);
await sleep(1100);   // the drain's crossfade + ink swap
bd = await board();
ok('drained S repaints to 1+2, still sparked', bd[0].tier === 0 && bd[0].val === 'gv-3-' + BUFF[0] + '-s', bd[0].val);
ok('drained E repaints to 1+4, still sparked', bd[1].tier === 0 && bd[1].val === 'gv-5-' + BUFF[0] + '-s', bd[1].val);
const dewed = await evj(`JSON.stringify(${B}.dewTile(2))`);
await sleep(700);
bd = await board();
ok('the dew keeps its heart — never a sparked number', dewed === 2 && bd[2].val === 'gv-♥6-' + VINK[3], bd[2].val);
ok('a dewed R still pays letter+2 in the damage math', await evj(`JSON.stringify(${B}.wordDamage([{ ch: 'r', tier: 3, blk: false }, { ch: 'o', tier: 0, blk: false }]) === ${B}.wordDamage([{ ch: 'r', tier: 0, blk: false }, { ch: 'o', tier: 0, blk: false }]))`));
ok('…and its inkWorth carries balm + rune (1+2+6)', await evj(`JSON.stringify(${B}.inkWorth(${B}.board[2]) === 9)`));
await ev(`${B}.blackTile(3); 'ok'`);
await sleep(600);
bd = await board();
ok('an inked T prints the flat 0, no spark', bd[3].blk && bd[3].val === 'gv-0-#9a90c4', bd[3].val);
await ev(`${B}.repaintChips(); 'ok'`);
bd = await board();
ok('repaint leaves the ink alone', bd[3].val === 'gv-0-#9a90c4', bd[3].val);
ok('an inked T pays nothing', await evj(`JSON.stringify(${B}.wordDamage([{ ch: 't', tier: 0, blk: true }, { ch: 'a', tier: 0, blk: false }]) === Math.round(3 * 0.6))`));

console.log('\n— SCRY DEALS TRUE · THE CHIPS STAY SHARP AT DPR 3 —');
await ev(`${B}.beast.count = 9; ${B}.scry(); 'ok'`);
ok('scry redeals to pick', await until(PICK, 15000));
bd = await board();
let wrong = bd.filter((s) => s && s.val !== keyFor(VALS, ['runes', 'choir'], s.ch, s.tier));
ok('every scried chip prints its true worth', wrong.length === 0, wrong.map((s) => s.ch + '@' + s.i + '=' + s.val).join(' '));
ok('at least one raised chip on the scried board', bd.some((s) => s && /-s$/.test(s.val)));
// sharpness: crisp-check's metric on three raised chips — the frame as the
// screen shows it vs the same region through a 1× shrink-stretch. The board
// must have LANDED first: bounds read mid-bounce crop empty glass (a 1.0)
await settle();
await sleep(400);
const rects = await evj(`JSON.stringify(${B}.board.filter((s) => s && s.val.texture && /-s$/.test(s.val.texture.key)).slice(0, 3)
  .map((s) => { const b = s.val.getBounds(), cam = ${B}.cameras.main; return { x: b.x - cam.scrollX - 4, y: b.y - cam.scrollY - 4, w: b.width + 8, h: b.height + 8 }; }))`);
const shot = await send('Page.captureScreenshot', { format: 'png' });
const sharp = await evj(`(() => new Promise((res) => { const img = new Image();
  img.onload = () => { try {
    const k = img.width / game.canvas.width, S = Math.max(1, devicePixelRatio), out = [];
    const lap = (im) => { const { width: w, height: h, data: d } = im; let sum = 0, n = 0;
      const L = new Float32Array(w * h);
      for (let i = 0, p = 0; i < w * h; i++, p += 4) L[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x;
        sum += Math.abs(4 * L[i] - L[i - 1] - L[i + 1] - L[i - w] - L[i + w]); n++; }
      return n ? sum / n : 0; };
    for (const r of ${JSON.stringify(rects)}) {
      const x = Math.max(0, Math.floor(r.x * k)), y = Math.max(0, Math.floor(r.y * k));
      const w = Math.ceil(r.w * k), h = Math.ceil(r.h * k);
      const A = document.createElement('canvas'); A.width = w; A.height = h;
      const a = A.getContext('2d'); a.drawImage(img, x, y, w, h, 0, 0, w, h);
      const e1 = lap(a.getImageData(0, 0, w, h));
      const sw = Math.max(2, Math.round(w / S)), sh = Math.max(2, Math.round(h / S));
      const Bc = document.createElement('canvas'); Bc.width = sw; Bc.height = sh;
      const b = Bc.getContext('2d'); b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high'; b.drawImage(A, 0, 0, sw, sh);
      const C = document.createElement('canvas'); C.width = w; C.height = h;
      const c = C.getContext('2d'); c.imageSmoothingEnabled = true; c.drawImage(Bc, 0, 0, w, h);
      const e0 = lap(c.getImageData(0, 0, w, h));
      out.push(Math.round((e0 ? e1 / e0 : 0) * 100) / 100);
    }
    res(JSON.stringify(out)); } catch (e) { res(JSON.stringify(['ERR ' + e.message])); } };
  img.onerror = () => res(JSON.stringify(['ERR image']));
  img.src = 'data:image/png;base64,${shot.data}'; }))()`);
ok('raised chips are pixel-sharp at dpr 3 (ratio ≥ 1.4 each)', Array.isArray(sharp) && sharp.length >= 1 && sharp.every((r) => typeof r === 'number' && r >= 1.4), JSON.stringify(sharp));
ok('no page errors (chips)', errs.length === 0, errs.join(' | '));

console.log('\n— A REAL PICK BETWEEN FIGHTS SHOWS ON THE NEXT DEAL —');
errs.length = 0;
await boot('quick=1', true);
ok('fresh quick run at pick', await until(PICK, 60000));
// open every sigil, hold all but three — the pick MUST offer the choir
await ev(`SS.prof.sig = { u: Object.fromEntries(SS_SIGILS.map((s) => [s.id, 1])), c: {}, pend: [], gf: 1 }; SS.save();
  ${B}.run.sigils = SS_SIGILS.map((s) => s.id).filter((x) => !['choir', 'quill', 'storm'].includes(x));
  ${B}.repaintChips(); ${B}.beast.hpNow = 1; ${B}.beast.count = 9; 'ok'`);
const held21 = (await evj(`JSON.stringify(${B}.run.sigils)`));
w = await findWord([], (await board()).filter((s) => s && (s.tier !== 0 || s.blk)).map((s) => s.i));
ok('a killing word', !!w);
sel = await selectTiles(w);
await tap(`${B}.castB`);
ok('the fell brings the sigil pick', await until(`${B}.state === 'sigil'`, 40000));
const choirTap = `${B}.overlayC.list.filter((o) => o.getData && o.getData('sigilCard')).find((c) => { let hit = false;
  const walk = (ls) => ls.forEach((o) => { if (o.text && /owels/i.test(o.text)) hit = true; if (o.list) walk(o.list); });
  walk(c.list); return hit; })`;
ok('the choir card is on the table', await until(`!!(${choirTap})`, 8000));
for (let t = 0; t < 5; t++) {
  await tap(choirTap); await sleep(400);
  if (await ev(`${B}.run.sigils.includes('choir')`)) break;
}
ok('the choir is taken', await ev(`${B}.run.sigils.includes('choir')`));
ok('the next fight deals', await until(PICK, 30000));
bd = await board();
const held22 = [...held21, 'choir'];
wrong = bd.filter((s) => s && s.val !== keyFor(VALS, held22, s.ch, s.tier));
ok('every dealt chip prints the true worth under 22 sigils', wrong.length === 0, wrong.map((s) => s.ch + '@' + s.i + '=' + s.val + '≠' + keyFor(VALS, held22, s.ch, s.tier)).join(' '));
ok('the deal raised at least one vowel', bd.some((s) => s && VOW.includes(s.ch[0]) && /-s$/.test(s.val)));
ok('gilded dawn dealt its tier-1 tile true', bd.some((s) => s && s.tier === 1), bd.filter((s) => s && s.tier === 1).map((s) => s.val).join(' '));
ok('no page errors (pick)', errs.length === 0, errs.join(' | '));
}

/* ================= VERSUS: the duel board repaints mid-fight ================= */
if (!NOVS) {
  console.log('\n— THE DUEL BOARD TELLS THE SAME TRUTH —');
  errs.length = 0;
  await boot('mpuid=cp&botduel=1000&vsmode=turns&seed=779045', false);
  const sky = await until(`SSNET.mode === 'firebase' && typeof SS_RIVAL !== 'undefined'`, 60000);
  ok('the live sky answers', sky);
  const VS = `game.scene.getScene('vsbattle')`;
  const up = await until(`!!window.__ssRival && !!${VS} && ${VS}.scene.isActive() && ${VS}.state === 'pick' && ${VS}.board.filter(Boolean).length === 16`, 90000);
  ok('bot duel rose', up);
  if (up) {
    const VALS = await evj(`JSON.stringify(VALS)`);
    let vb = await board(VS);
    let wrong = vb.filter((s) => s && s.val !== keyFor(VALS, [], s.ch, s.tier));
    ok('versus chips ride the baked glyphs, plain and true', wrong.length === 0, wrong.map((s) => s.ch + '=' + s.val).join(' '));
    // the REAL pick path, forced to offer River Runes first, tapped for real —
    // the board persists mid-duel, so THIS is the repaint the law demands.
    // Only the three option draws are pinned: Phaser mints texture UUIDs from
    // Math.random, and a CONSTANT pin collides every generated key (the cards
    // then die inside add.text — found the hard way).
    await ev(`(() => { const v = ${VS}; const mr = Math.random; let n = 0;
      Math.random = () => (n++ < 3 ? 0.34 : mr());
      try { v.state = 'pick'; v.showSigilPick(); } finally { Math.random = mr; } return 'ok' })()`);
    const runesCard = `${VS}.overlayC.list.filter((o) => o.getData && o.getData('sigilCard')).find((c) => { let hit = false;
      const walk = (ls) => ls.forEach((o) => { if (o.text && /S, R, E/i.test(o.text)) hit = true; if (o.list) walk(o.list); });
      walk(c.list); return hit; })`;
    ok('runes card offered', await until(`!!(${runesCard})`, 8000));
    for (let t = 0; t < 5; t++) {
      await tap(runesCard); await sleep(400);
      if (await ev(`${VS}.mySigils.includes('runes')`)) break;
    }
    ok('runes taken by a real tap', await ev(`${VS}.mySigils.includes('runes')`));
    vb = await board(VS);
    wrong = vb.filter((s) => s && s.val !== keyFor(VALS, ['runes'], s.ch, s.tier));
    ok('the STANDING duel board repainted at once', wrong.length === 0, wrong.map((s) => s.ch + '=' + s.val).join(' '));
    ok('a raised chip stands mid-duel', vb.some((s) => s && /-s$/.test(s.val)));
    // preview honesty on my turn: CAST n = sum of printed chips × curve
    const myTurn = await until(`${VS}.state === 'pick' && ${VS}.isMyTurn()`, 45000);
    ok('my turn comes', myTurn);
    if (myTurn) {
      const w3 = await evj(`(() => { const v = ${VS}; const t = v.board.map((s, i) => ({ s, i })).filter((x) => x.s && x.s.ch.length === 1);
        for (const a of t) for (const b of t) for (const c of t) {
          if (a.i === b.i || b.i === c.i || a.i === c.i) continue;
          if (WORDSET.has(a.s.ch + b.s.ch + c.s.ch)) return JSON.stringify([a.i, b.i, c.i]); }
        return 'null' })()`);
      ok('a 3-letter duel word', !!w3, JSON.stringify(w3));
      if (w3) {
        const vsel = await selectTiles(w3, VS);
        ok('duel taps selected', vsel.length === 3, JSON.stringify(vsel));
        vb = await board(VS);
        const sum = w3.reduce((a, i) => a + parseInt(vb[i].val.replace(/^gv-/, ''), 10), 0);
        const exp = Math.round(sum * LEN_MULT[3]);
        ok('duel CAST preview = printed chips × curve', await ev(`${VS}.castT.text`) === 'CAST ' + exp, await ev(`${VS}.castT.text`) + ' vs ' + exp);
      }
    }
    ok('no page errors (versus)', errs.length === 0, errs.join(' | '));
  }
  try {
    const all = (await (await fetch(DB + '.json')).json()) || {};
    for (const [k, r] of Object.entries(all)) {
      if (r && (/^test_cp/.test(r.hostUid || '') || Object.keys(r.players || {}).some((p) => /^test_cp/.test(p)))) await fetch(DB + '/' + k + '.json', { method: 'DELETE' });
    }
  } catch (e) { }
}

console.log(`\n${pass} passed, ${fail} failed`);
ws.close();
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
