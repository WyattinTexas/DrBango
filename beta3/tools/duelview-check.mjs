// DUELVIEW-CHECK — see your rival whole (v0.93.0, Skylar's 9/8 card 03).
// Skylar: "we need to make sure that we show how much health the enemy has …
// Each word that they do in damage needs to come through completely. We also
// need to see the amount of points for each word that the enemy cast against
// you. Plus we also need to be able to see the sigils that the other player
// has." (voice-dictated; "verses" = VERSUS)
//
// What this suite proves, with real CDP taps at DPR 3:
//   §0 the source audit — the six story/power keys speak all five tongues;
//      the hp display engine, the priced last word, the rival chip + the
//      named inspector, the turn story and its drain-gate all stand in the
//      source; NOTHING new rides the wire (seat + cast shapes byte-equal;
//      the arcade float voice kept).
//   §1 the friend exchange (two Chromes, live sky) — the held seat wears a
//      readable 150/150 from birth; every cast A weaves moves B's readout to
//      the EXACT seat value (bar and number); B's claim lands under the turn
//      story: A's three words whole, each with its price, their sum equal to
//      the hp the story sinks away; one tap takes up the duel; B's reply
//      turns the same story back on A, now opened by A's own dim last-turn
//      line; the rival sigil chip lights with the seat's own array and the
//      house inspector opens titled with the rival's name — off a REAL tap
//      on the chip.
//   §2 the worldwide mage (near sky) — the disguised rival's turn tells the
//      SAME story from the same seat fields: three words, three prices, the
//      sum matching the wound, the chip and inspector fed by the sigils its
//      seat truly carries. No blank bot rows, no tell in the telling.
//   §3 the five tongues in the safe band — the story dresses in Spanish
//      under ?inset (fabricated standing room), shot for the eye.
// Every registry row this run writes is deleted at the end.
//
//   perl -e 'alarm 720; exec @ARGV' node tools/duelview-check.mjs   # ~7 min
//
import { spawn, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const RT = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LANGS = ['en', 'es', 'fr', 'pt', 'de'];
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = () => Math.random().toString(36).slice(2, 7);
const rt = async (p) => (await fetch(RT + p + '.json')).json();
const rtPut = (p, v) => fetch(RT + p + '.json', { method: 'PUT', body: JSON.stringify(v) });
const rtDel = (p) => fetch(RT + p + '.json', { method: 'DELETE' });

/* ---------- §0 THE SOURCE AUDIT ---------- */
console.log('— §0 THE SOURCE AUDIT —');
const vsSrc = readFileSync('versus.js', 'utf8');
const rvSrc = readFileSync('rival.js', 'utf8');
const gmSrc = readFileSync('game.js', 'utf8');
const stSrc = readFileSync('strings.js', 'utf8');
const NEWKEYS = ['vsStoryTitle', 'vsStoryYours', 'vsStoryTheirs', 'vsStoryTook', 'vsStoryGo', 'vsTheirSigils'];
{
  const blocks = {};
  for (const lg of LANGS) blocks[lg] = stSrc.indexOf('\n  ' + lg + ': {');
  const order = LANGS.slice().sort((a, b) => blocks[a] - blocks[b]);
  let all = true, why = '';
  for (let i = 0; i < order.length; i++) {
    const from = blocks[order[i]], to = i + 1 < order.length ? blocks[order[i + 1]] : stSrc.length;
    const seg = stSrc.slice(from, to);
    for (const k of NEWKEYS) if (!(new RegExp(k + ':').test(seg))) { all = false; why += order[i] + ':' + k + ' '; }
  }
  ok('the six story/power keys speak all five tongues', all, why.trim());
}
ok('one hp display engine serves every bar (showHp/paintHp/strikeFx)',
  /hpState\(id\)/.test(vsSrc) && /showHp\(id, hp, max\)/.test(vsSrc) && /strikeFx\(id, from, target, max\)/.test(vsSrc));
ok('updatePanels routes BOTH sides through it (mine held back only for the story)',
  /if \(me && !this\.storyC\) this\.showHp\('me', me\.hp, HP\)/.test(vsSrc) && /this\.showHp\(p\.id, p\.hp, HP\)/.test(vsSrc));
ok('the rival panel wears the readable number and the sigil chip',
  /const hpT = ssTxt\(this, l\.u\(bx \+ bw\)/.test(vsSrc) && /chipB\.on\('pointerdown', \(\) => this\.openInspectFoe\(p\.id\)\)/.test(vsSrc));
ok('their last word wears its price, matched by word so a lagging feed cannot mislabel',
  /fl && fl\.word === p\.lastWord \? '  −' \+ fl\.dmg : ''/.test(vsSrc));
ok('the turn story stands in the source (told once, drained first, swept by the doors)',
  /turnStory\(q\)/.test(vsSrc) && /storyPend = this\.time\.delayedCall\(450/.test(vsSrc) &&
  /\(this\.corr && !this\.storyTold\)/.test(vsSrc) &&
  (vsSrc.match(/this\.storyDone\(true\)/g) || []).length >= 3 && (vsSrc.match(/this\.storyWaive\(\)/g) || []).length >= 4);
ok('the story lifts your hp row above its veil and hands it back',
  /storyLift\(true\)/.test(vsSrc) && /storyLift\(false\)/.test(vsSrc) && /this\.hpBarBg, this\.hpBar, this\.hpT/.test(vsSrc));
ok('the rival inspector is the house window, titled with their name',
  /title: 'vsTheirSigils', titleArg: p\.name/.test(vsSrc) && /SS_T\(opts\.title \|\| 'inspTitle', opts\.titleArg\)/.test(gmSrc));
ok('NOTHING new rides the wire — the seat shapes are byte-equal to v0.89',
  vsSrc.includes("name: vsName(), hp: hp || VS_HP, seat, casts: 0, dealt: 0, gone: false, joinedAt: Date.now(),\n  rating: SS.prof.rating, rhide: SS.prof.rhide ? 1 : 0,") &&
  vsSrc.includes("name: name || '…', hp: hp || VS_HP, seat, casts: 0, dealt: 0, gone: false, joinedAt: 0, held: 1,"));
ok('…and the cast push shape too, both skies',
  vsSrc.includes("this.castsRef.push({ uid: vsUid(), name: vsName(), word: word.toUpperCase(), dmg, target: target.id, at: Date.now() })") &&
  rvSrc.includes(".push({ uid: this.uid, name: this.name, word, dmg, target: target.id, at })"));
ok('the bot already carries everything the surfaces read (lastWord · dealt · sigils on its seat)',
  rvSrc.includes("await this.meRef.update({ lastWord: word, casts: myCasts, dealt: ((this.me() || {}).dealt | 0) + dmg })") &&
  rvSrc.includes("await this.meRef.update({ sigils: [...this.board.sigils] })"));
ok('the arcade float voice is kept (live blows still speak)',
  vsSrc.includes("cast.name + ' cast ' + cast.word + '   −' + cast.dmg"));

/* ---------- server + browsers ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
for (const p of ['/tmp/cdp-dva', '/tmp/cdp-dvb']) { try { execSync('rm -rf ' + p); } catch (e) { } }
const errs = [];
async function client(port, dir, tag) {
  kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + port,
    '--user-data-dir=' + dir, '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
  let list = null;
  for (let i = 0; i < 60 && !list; i++) { try { list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json(); } catch (e) { await sleep(500); } }
  if (!list) { console.log('no Chrome on :' + port); process.exit(2); }
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200);
      if (!/WebGL context/.test(t)) errs.push(tag + ': ' + t);
    }
  };
  await new Promise((r) => ws.onopen = r);
  const send = (m, p) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  const ev = async (e) => {
    const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
    return r?.result?.value;
  };
  const seed = (src) => send('Page.addScriptToEvaluateOnNewDocument', { source: src });
  const nav = async (u) => {
    await ev(`window.__navMark = 1; 1`).catch(() => { });
    for (let i = 0; i < 4; i++) {
      await send('Page.navigate', { url: u });
      for (let j = 0; j < 24; j++) {
        await sleep(250);
        const st = await ev(`(window.__navMark ? 'old' : (location.href.includes('index.html') && typeof SSNET !== 'undefined' ? 'new' : 'loading'))`).catch(() => 'loading');
        if (st === 'new') return true;
        if (st === 'loading') j = Math.min(j, 12);
      }
    }
    return false;
  };
  const until = async (e, cap = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < cap) { try { if (await ev(e)) return true; } catch (err) { } await sleep(300); } return false; };
  const tap = async (expr) => {
    const p = JSON.parse(await ev(`(() => { const o = ${expr}; if (!o) return 'null'; const cam = o.scene.cameras.main, b = o.getBounds();
      const D = game.scale.width / innerWidth;
      return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
    if (!p) throw new Error('tap target missing: ' + expr);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  };
  const tapTil = async (expr, cond, cap = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < cap) {
      try { await tap(expr); } catch (e) { }
      if (await until(cond, 2500)) return true;
    }
    return false;
  };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    if (r?.data) { const { writeFileSync } = await import('node:fs'); writeFileSync('/tmp/duelview-' + name + '.png', Buffer.from(r.data, 'base64')); }
  };
  return { ev, seed, nav, until, tap, tapTil, shot, tag };
}
const [A, B] = await Promise.all([client(9475, '/tmp/cdp-dva', 'A'), client(9476, '/tmp/cdp-dvb', 'B')]);
const toDelete = new Set();
const SUF = rnd();
const UA = 'test_da' + SUF, UB = 'test_db' + SUF;
const BOOT = (uid) => `navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); if (localStorage.getItem('dv.seeded') !== '${uid}') { localStorage.clear(); localStorage.setItem('dv.seeded', '${uid}');
    localStorage.setItem('starspellUid', '${uid}'); } } catch (e) {}`;
const READY = `SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').dailyChipB`;
const MENU = `game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').chFriendB`;
const VB = `game.scene.getScene('vsbattle')`;
const INVB = `game.scene.isActive('vsbattle') && ${VB}.state === 'pick'`;
const CENSUS = (root) => `(() => { const out = []; const walk = (o) => { if (!o) return; if (o.list) { for (const k of o.list) walk(k); return; }
  if (o.text !== undefined && o.visible) out.push(String(o.text)); }; walk(${root}); return out.join(' | '); })()`;
for (const u of [UA, UB]) for (const p of ['players/', 'presence/', 'devices/', 'friends/', 'recent/', 'invites/']) toDelete.add(p + u);
// weave the WEAKEST standing word (2-3 letters) so the duel outlives the probe
const WEAK = `(() => { const s = ${VB}; if (s.state !== 'pick' || !s.isMyTurn()) return 'no-turn';
  s.unselectFrom(0);
  const tiles = s.board.map((t, i) => t ? { i, ch: t.ch } : null).filter(Boolean);
  for (let a = 0; a < tiles.length; a++) for (let b = 0; b < tiles.length; b++) {
    if (a === b) continue;
    const w2 = tiles[a].ch + tiles[b].ch;
    if (WORDSET.has(w2)) { s.tapTile(tiles[a].i); s.tapTile(tiles[b].i); s.tryCast(); return w2; }
  }
  for (let a = 0; a < tiles.length; a++) for (let b = 0; b < tiles.length; b++) for (let c3 = 0; c3 < tiles.length; c3++) {
    if (a === b || b === c3 || a === c3) continue;
    const w3 = tiles[a].ch + tiles[b].ch + tiles[c3].ch;
    if (WORDSET.has(w3)) { s.tapTile(tiles[a].i); s.tapTile(tiles[b].i); s.tapTile(tiles[c3].i); s.tryCast(); return w3; }
  }
  return 'none'; })()`;
const castWeak = async (cli) => {
  if (!(await cli.until(`${VB}.isMyTurn() && ${VB}.state === 'pick'`, 25000))) return false;
  const before = await cli.ev(`((${VB}.me() || {}).casts | 0)`);
  const w = await cli.ev(WEAK);
  if (w === 'none') await cli.ev(`${VB}.demoStep(); 1`);
  const moved = await cli.until(`((${VB}.me() || {}).casts | 0) > ${before}`, 25000);
  await cli.until(`${VB}.state === 'pick' || ${VB}.state === 'sigil' || ${VB}.state === 'done'`, 12000);
  await sleep(400);
  if (await cli.ev(`${VB}.state === 'sigil'`)) { await cli.ev(`${VB}.demoStep(); 1`); await cli.until(`${VB}.state !== 'sigil'`, 10000); }
  return moved;
};
const restUntil = async (code, pred, cap = 15000) => { const t0 = Date.now(); let r = null; while (Date.now() - t0 < cap) { r = await rt('mp/rooms/' + code); if (r && pred(r)) return r; await sleep(400); } return r; };

/* ---------- §1 THE FRIEND EXCHANGE ---------- */
console.log('— §1 THE FRIEND EXCHANGE: readouts through a full exchange, the story both ways —');
await A.seed(BOOT(UA));
ok('A boots to the meadow', await A.nav(BASE + '?mpuid=' + UA.slice(5)) && await A.until(READY, 45000));
await B.seed(BOOT(UB));
ok('B boots to the meadow', await B.nav(BASE + '?mpuid=' + UB.slice(5)) && await B.until(READY, 45000));
const NA = await A.ev(`SSNET.myName()`), NB = await B.ev(`SSNET.myName()`);
toDelete.add('names/' + await A.ev(`SSNET.nameKey(${JSON.stringify(NA)})`));
toDelete.add('names/' + await B.ev(`SSNET.nameKey(${JSON.stringify(NB)})`));
await A.ev(`SSNET.FR.add(${JSON.stringify(UB)}, ${JSON.stringify(NB)})`);
await sleep(1200);
ok('A stands under VERSUS', await A.tapTil(`game.scene.getScene('home').rowBtns.versus`, MENU, 20000));
ok("the social sheet opens on B's row", await A.tapTil(`game.scene.getScene('vsmenu').chFriendB`,
  `!!game.scene.getScene('vsmenu').frRows && game.scene.getScene('vsmenu').frRows.some((r) => r.id === ${JSON.stringify(UB)})`, 20000));
ok('the challenge lands A in the duel', await A.tapTil(`game.scene.getScene('vsmenu').frRows.find((r) => r.id === ${JSON.stringify(UB)}).cb`, INVB, 35000));
const CODE1 = await A.ev(`${VB}.code`);
toDelete.add('mp/rooms/' + CODE1);
console.log('  room ' + CODE1);
ok("the HELD seat is readable from birth (name · 150 / 150 · full bar · no chip)", await A.until(`(() => { const s = ${VB};
  const pan = s.oppPanels && s.oppPanels[${JSON.stringify(UB)}]; if (!pan) return false;
  return pan.hpT.text === '150 / 150' && Math.abs(pan.bar.width - pan.w) < 1 && !pan.chipB.visible; })()`, 15000));
// three weak casts; after each, the readout must land on the EXACT seat value
const dealt = [];
for (let i = 0; i < 3; i++) {
  ok('cast ' + (i + 1) + ' lands', await castWeak(A));
  const room = await restUntil(CODE1, (r) => Object.values(r.casts || {}).filter((c) => c.uid === UA).length === i + 1);
  const casts = Object.values(room.casts || {}).filter((c) => c.uid === UA).sort((a, b) => a.at - b.at);
  dealt.push(casts[i]);
  ok("…and B's readout shows the exact seat value (" + room.players[UB].hp + ')', await A.until(`(() => { const s = ${VB};
    const pan = s.oppPanels[${JSON.stringify(UB)}]; const seat = (s.room.players || {})[${JSON.stringify(UB)}]; if (!pan || !seat) return false;
    return seat.hp === ${room.players[UB].hp} && pan.hpT.text === (seat.hp + ' / 150') && Math.abs(pan.bar.width - pan.w * seat.hp / 150) < 1.5; })()`, 12000));
}
// the sub line stays quiet while the rival has not woven (the priced word is
// proven on B's return view and in §2 — it needs a rival who has cast)
{
  const subNow = await A.ev(`(() => { const s = ${VB}; return s.oppPanels[${JSON.stringify(UB)}].sub.text; })()`);
  ok("B's sub line stays quiet (B has not woven)", subNow === '', subNow);
}
const room1 = await rt('mp/rooms/' + CODE1);
const sumA = Object.values(room1.casts || {}).filter((c) => c.uid === UA).reduce((a, c) => a + c.dmg, 0);
ok('the seat arithmetic holds (150 − dealt = hp)', room1.players[UB].hp === 150 - sumA, room1.players[UB].hp + ' vs 150−' + sumA);
ok('A holds one sigil from the third-cast pick', await A.ev(`${VB}.mySigils.length`) === 1);
// step out; B claims through the deep link and the story tells A's turn
ok('A steps out (the duel stands)', await A.tapTil(`(() => { const s = ${VB}; return s.children.list.find((o) => o.text === '‹'); })()`, MENU, 20000));
ok('B answers through ?join', await B.nav(BASE + '?mpuid=' + UB.slice(5) + '&join=' + CODE1 + '&from=' + UA) && await B.until(INVB, 45000));
ok('the turn story rises for B', await B.until(`!!${VB}.storyC`, 8000));
ok("B's bar REWINDS to where the turn found it (150)", await B.ev(`${VB}.hpT.text`) === '150 / 150');
ok('the hp row is lifted above the veil', await B.ev(`${VB}.hpBar.depth === 96 && ${VB}.hpT.depth === 96`));
ok('all three strikes land, staged', await B.until(`(() => { const L = ${VB}.storyLand; return L && L.rows.length === 3 && L.rows.every(r => r.done); })()`, 10000));
await sleep(900);
const truthB = 150 - sumA;
ok('the bar sinks to the seat truth (' + truthB + ')', await B.until(`${VB}.hpT.text === '${truthB} / 150'`, 5000));
const cenB = await B.ev(CENSUS(`${VB}.storyC`));
{
  const words = Object.values(room1.casts || {}).filter((c) => c.uid === UA).sort((a, b) => a.at - b.at);
  ok("every word of A's turn arrives whole with its price", words.every((c) => cenB.includes(c.word) && cenB.includes('−' + c.dmg)), cenB.slice(0, 160));
  ok('the total speaks the exact sum (' + sumA + ')', cenB.includes(await B.ev(`SS_T('vsStoryTook', ${sumA})`)));
  ok('the header names A', cenB.includes(await B.ev(`SS_T('vsStoryTheirs', ${JSON.stringify(NA)})`)));
  ok("no dim opening line (B has no last turn yet)", !cenB.includes(await B.ev(`SS_T('vsStoryYours')`)));
}
ok("A's sigil chip lights on B's view (✦ 1, the seat array)", await B.until(`(() => { const s = ${VB};
  const pan = s.oppPanels[${JSON.stringify(UA)}]; const seat = (s.room.players || {})[${JSON.stringify(UA)}];
  return pan && seat && Array.isArray(seat.sigils) && seat.sigils.length === 1 && pan.chipB.visible && pan.chipT.text === '✦ 1'; })()`, 8000));
await B.shot('friend-story');
ok('one tap on the told tale takes up the duel', await B.tapTil(`${VB}.storyC && ${VB}.storyC.list[0]`, `!${VB}.storyC`, 10000));
ok('…and the lift comes back down', await B.ev(`${VB}.hpBar.depth === 0`));
// a REAL tap on the rival chip opens the named inspector (44-pt law)
ok('a REAL tap on the chip opens the inspector', await B.tapTil(`${VB}.oppPanels[${JSON.stringify(UA)}].chipB`, `!!${VB}.inspectP`, 12000));
ok('…titled with the rival\'s name, showing the seat\'s own powers', await B.ev(`(() => { const s = ${VB}; if (!s.inspectP) return false;
  const seat = (s.room.players || {})[${JSON.stringify(UA)}];
  const want = seat.sigils.map(id => (SS_SIG_BY[id] || {}).icon);
  const found = []; let named = false;
  const walk = (o) => { if (!o) return; if (o.list) { o.list.forEach(walk); return; }
    if (o.text !== undefined) found.push(String(o.text));
    if (o.texture && String(o.texture.key).includes(SS_T('vsTheirSigils', seat.name))) named = true; };
  walk(s.inspectP.c);
  return named && want.every(ic => found.includes(ic)); })()`));
await B.shot('inspector');
await B.ev(`(() => { const s = ${VB}; if (s.inspectP) s.inspectP.close(); return 1; })()`);
// B weaves three; the story turns back on A, opened by A's own dim line
for (let i = 0; i < 3; i++) ok('B cast ' + (i + 1) + ' lands', await castWeak(B));
const room2 = await restUntil(CODE1, (r) => r.turnUid === UA && (r.turnCasts | 0) === 0, 18000);
ok('the turn passes home', !!room2 && room2.turnUid === UA);
ok('B steps out', await B.tapTil(`(() => { const s = ${VB}; return s.children.list.find((o) => o.text === '‹'); })()`, MENU, 20000));
// A returns by the strip row (the ordinary door)
await A.tapTil(`(() => { const s = game.scene.getScene('vsmenu'); return s.children.list.find((o) => o.text === '‹ HOME'); })()`, READY, 20000);
await A.ev(`game.scene.getScene('home').duelKey = ''; game.scene.getScene('home').refreshDuelStrip(); 1`);
ok('the strip calls A (✦ your move)', await A.until(`(() => { const h = game.scene.getScene('home');
  return h.duelRows && h.duelRows.some((r) => r.code === ${JSON.stringify(CODE1)} && r.kind === 'move'); })()`, 20000));
ok('the strip row lands A in the duel', await A.tapTil(`game.scene.getScene('home').duelRows.find((r) => r.code === ${JSON.stringify(CODE1)}).zone`, INVB, 35000));
ok('the story rises for A too', await A.until(`!!${VB}.storyC`, 8000));
ok('all of B\'s strikes land', await A.until(`(() => { const L = ${VB}.storyLand; return L && L.rows.every(r => r.done); })()`, 10000));
await sleep(900);
const roomA = await rt('mp/rooms/' + CODE1);
const sumB = Object.values(roomA.casts || {}).filter((c) => c.uid === UB).reduce((a, c) => a + c.dmg, 0);
const cenA = await A.ev(CENSUS(`${VB}.storyC`));
{
  const wordsB = Object.values(roomA.casts || {}).filter((c) => c.uid === UB).sort((a, b) => a.at - b.at);
  const wordsA = Object.values(roomA.casts || {}).filter((c) => c.uid === UA).sort((a, b) => a.at - b.at);
  ok("every word of B's turn arrives whole with its price", wordsB.every((c) => cenA.includes(c.word) && cenA.includes('−' + c.dmg)), cenA.slice(0, 160));
  ok("A's own last turn opens the tale (dim line, three words + prices)",
    cenA.includes(await A.ev(`SS_T('vsStoryYours')`)) && wordsA.every((c) => cenA.includes(c.word + ' −' + c.dmg)));
  ok('the total speaks B\'s sum (' + sumB + ')', cenA.includes(await A.ev(`SS_T('vsStoryTook', ${sumB})`)));
  ok('the sum IS the hp delta (150 − ' + sumB + ')', roomA.players[UA].hp === 150 - sumB);
}
ok("A's bar sinks to the truth", await A.until(`${VB}.hpT.text === '${150 - sumB} / 150'`, 5000));
ok("B's sub line wears the priced last word on A's panel", await A.ev(`(() => { const s = ${VB};
  const pan = s.oppPanels[${JSON.stringify(UB)}]; const seat = (s.room.players || {})[${JSON.stringify(UB)}]; const fl = s.foeLast[${JSON.stringify(UB)}];
  return !!seat.lastWord && !!fl && fl.word === seat.lastWord && pan.sub.text === ('· ' + seat.lastWord + '  −' + fl.dmg); })()`));
ok("B's chip lights on A's view (their pick rode the seat)", await A.ev(`(() => { const s = ${VB};
  const pan = s.oppPanels[${JSON.stringify(UB)}]; const seat = (s.room.players || {})[${JSON.stringify(UB)}];
  return Array.isArray(seat.sigils) && seat.sigils.length === 1 && pan.chipB.visible && pan.chipT.text === '✦ 1'; })()`));
await A.shot('return-story');
await A.tapTil(`${VB}.storyC && ${VB}.storyC.list[0]`, `!${VB}.storyC`, 10000);
ok('A steps out; both sides seen', await A.tapTil(`(() => { const s = ${VB}; return s.children.list.find((o) => o.text === '‹'); })()`, MENU, 20000));

/* ---------- §2 THE WORLDWIDE MAGE ---------- */
console.log('— §2 THE WORLDWIDE MAGE: the same story from the same seat fields —');
// B hunts worldwide on a pinned theater + a shrunk busy pace: the mage's
// whole turn lands ~8–20s after the handover, sigil write included
ok('B rides home', await B.tapTil(`(() => { const s = game.scene.getScene('vsmenu'); return s.children.list.find((o) => o.text === '‹ HOME'); })()`, READY, 20000));
ok('B re-arms under VERSUS (pinned theater)', await B.nav(BASE + '?mpuid=' + UB.slice(5) + '&vsfind=1500&botpace=8000,11000') && await B.until(READY, 45000));
await B.tapTil(`game.scene.getScene('home').rowBtns.versus`, MENU, 20000);
ok('CHALLENGE WORLDWIDE forms the near duel', await B.tapTil(`game.scene.getScene('vsmenu').chWorldB`, INVB, 45000));
const CODE2 = await B.ev(`${VB}.code`);
ok('…a correspondence duel on this device (corr · 150 hp · no seal header)', await B.ev(`(() => { const s = ${VB};
  return SS_NEAR.has(s.code) && !!s.room.corr && s.room.hp === 150 && s.headT.text === ''; })()`));
const MAGE = await B.ev(`(() => { const s = ${VB}; return Object.keys(s.room.players).find((k) => k !== SSNET.uid()); })()`);
const MAGENAME = await B.ev(`(() => { const s = ${VB}; return s.room.players[${JSON.stringify(MAGE)}].name; })()`);
toDelete.add('players/' + MAGE);
toDelete.add('names/' + await B.ev(`SSNET.nameKey(${JSON.stringify(MAGENAME)})`));
console.log('  near room ' + CODE2 + ' · mage ' + MAGENAME);
ok('the mage seat is readable from birth (150 / 150)', await B.until(`(() => { const s = ${VB};
  const pan = s.oppPanels[${JSON.stringify(MAGE)}]; return pan && pan.hpT.text === '150 / 150'; })()`, 10000));
for (let i = 0; i < 3; i++) ok('B cast ' + (i + 1) + ' lands', await castWeak(B));
ok('the turn hands to the mage', await B.until(`(() => { const r = SS_NEAR.room(${JSON.stringify(CODE2)}); return r && r.turnUid === ${JSON.stringify(MAGE)}; })()`, 15000));
// leave AT ONCE — the reply must land while we are away (pace floor 8s)
ok('B steps out ahead of the reply', await B.tapTil(`(() => { const s = ${VB}; return s.children.list.find((o) => o.text === '‹'); })()`, MENU, 12000));
ok("the mage's WHOLE turn lands while B is away (3 casts + the sigil on its seat)", await B.until(`(() => {
  const r = SS_NEAR.room(${JSON.stringify(CODE2)}); if (!r) return false;
  const casts = Object.values(r.casts || {}).filter((c) => c.uid === ${JSON.stringify(MAGE)});
  const seat = r.players[${JSON.stringify(MAGE)}];
  return r.turnUid === SSNET.uid() && casts.length === 3 && Array.isArray(seat.sigils) && seat.sigils.length >= 1; })()`, 90000));
const nearRoom = JSON.parse(await B.ev(`JSON.stringify(SS_NEAR.room(${JSON.stringify(CODE2)}))`));
const mageCasts = Object.values(nearRoom.casts || {}).filter((c) => c.uid === MAGE).sort((a, b) => a.at - b.at);
const sumM = mageCasts.reduce((a, c) => a + c.dmg, 0);
// return by the home strip row — the ordinary door for a near duel too
ok('B rides home to the strip', await B.tapTil(`(() => { const s = game.scene.getScene('vsmenu'); return s.children.list.find((o) => o.text === '‹ HOME'); })()`, READY, 20000));
await B.ev(`game.scene.getScene('home').duelKey = ''; game.scene.getScene('home').refreshDuelStrip(); 1`);
ok('the strip calls (✦ your move)', await B.until(`(() => { const h = game.scene.getScene('home');
  return h.duelRows && h.duelRows.some((r) => r.code === ${JSON.stringify(CODE2)} && r.kind === 'move'); })()`, 15000));
ok('the row lands B back in the duel', await B.tapTil(`game.scene.getScene('home').duelRows.find((r) => r.code === ${JSON.stringify(CODE2)}).zone`, INVB, 35000));
ok("the mage's turn is TOLD (the same story sheet)", await B.until(`!!${VB}.storyC`, 8000));
ok('all three strikes land', await B.until(`(() => { const L = ${VB}.storyLand; return L && L.rows.every(r => r.done); })()`, 10000));
await sleep(900);
const cenM = await B.ev(CENSUS(`${VB}.storyC`));
ok('every mage word arrives whole with its price', mageCasts.every((c) => cenM.includes(c.word) && cenM.includes('−' + c.dmg)), cenM.slice(0, 160));
ok('the total speaks the exact sum (' + sumM + ')', cenM.includes(await B.ev(`SS_T('vsStoryTook', ${sumM})`)));
ok('the header names the mage', cenM.includes(await B.ev(`SS_T('vsStoryTheirs', ${JSON.stringify(MAGENAME)})`)));
ok('the sum IS the wound (150 − ' + sumM + ')', nearRoom.players[UB].hp === 150 - sumM);
ok("B's bar sinks to the truth", await B.until(`${VB}.hpT.text === '${150 - sumM} / 150'`, 6000));
ok('no tell in the telling (nothing says bot/engine)', !/bot|engine|"ai"/i.test(cenM.replace(/robot|abbot|turbot/gi, '')));
ok("the mage's chip lights from ITS seat", await B.ev(`(() => { const s = ${VB};
  const pan = s.oppPanels[${JSON.stringify(MAGE)}]; const seat = s.room.players[${JSON.stringify(MAGE)}];
  return Array.isArray(seat.sigils) && seat.sigils.length >= 1 && pan.chipB.visible && pan.chipT.text === ('✦ ' + seat.sigils.length); })()`));
await B.shot('bot-story');
ok('a REAL chip tap inspects the mage', (await B.tapTil(`${VB}.storyC && ${VB}.storyC.list[0]`, `!${VB}.storyC`, 10000))
  && await B.tapTil(`${VB}.oppPanels[${JSON.stringify(MAGE)}].chipB`, `!!${VB}.inspectP`, 12000));
ok('…with the exact seat array, titled with its name', await B.ev(`(() => { const s = ${VB}; if (!s.inspectP) return false;
  const seat = s.room.players[${JSON.stringify(MAGE)}];
  const want = seat.sigils.map(id => (SS_SIG_BY[id] || {}).icon);
  const found = []; let named = false;
  const walk = (o) => { if (!o) return; if (o.list) { o.list.forEach(walk); return; }
    if (o.text !== undefined) found.push(String(o.text));
    if (o.texture && String(o.texture.key).includes(SS_T('vsTheirSigils', seat.name))) named = true; };
  walk(s.inspectP.c);
  return named && want.every(ic => found.includes(ic)); })()`));
await B.ev(`(() => { const s = ${VB}; if (s.inspectP) s.inspectP.close(); return 1; })()`);
// the near duel is B's own affair — abandon nothing; purge the device copy
await B.ev(`SS_RIVAL.stopFor(${JSON.stringify(CODE2)}); SS_NEAR.purge(${JSON.stringify(CODE2)}); VS_GAMES.remove(${JSON.stringify(CODE2)}); 1`);

/* ---------- §3 THE FIVE TONGUES IN THE SAFE BAND ---------- */
console.log('— §3 THE STORY IN SPANISH, UNDER ?inset —');
// park B on a blank page first — an idle harness Chrome keeps RAF-rendering
// its last sky at DPR 3 (the v0.86 lesson) and §3 parses the es dictionary
await B.ev(`location.href = 'about:blank'; 1`).catch(() => { });
await sleep(800);
// the seal parser keeps LETTERS only (a seal is four letters) — mint likewise
const UC = 'test_dc' + SUF, FOE3 = 'test_df' + SUF,
  CODE3 = 'DV' + Array.from({ length: 2 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
toDelete.add('mp/rooms/' + CODE3);
toDelete.add('friends/' + UC); toDelete.add('friends/' + FOE3);
toDelete.add('players/' + UC); toDelete.add('presence/' + UC); toDelete.add('devices/' + UC); toDelete.add('recent/' + UC);
{
  const now = Date.now();
  await rtPut('mp/rooms/' + CODE3, {
    mode: 'turns', status: 'active', corr: 1, hp: 150, createdAt: now - 3600000, movedAt: now - 60000,
    startedAt: now - 3600000, hostUid: UC, seed: 24681357, lang: 'en', turnUid: UC, turnCasts: 0, turnCount: 2,
    players: {
      [UC]: { name: 'Wisp DC', hp: 121, seat: 0, casts: 3, dealt: 19, gone: false, joinedAt: now - 3600000, rating: 1000, rhide: 0, lastWord: 'LUNA',
        plays: [{ c: [0, 1] }, { c: [2, 3] }, { c: [4, 5] }] },
      [FOE3]: { name: 'Mira Vell', hp: 131, seat: 1, casts: 3, dealt: 29, gone: false, joinedAt: now - 3500000, rating: 990, rhide: 0, lastWord: 'BRUMA',
        sigils: ['runes'] },
    },
    casts: {
      c1: { uid: UC, name: 'Wisp DC', word: 'SOL', dmg: 5, target: FOE3, at: now - 400000 },
      c2: { uid: UC, name: 'Wisp DC', word: 'MAR', dmg: 6, target: FOE3, at: now - 399000 },
      c3: { uid: UC, name: 'Wisp DC', word: 'LUNA', dmg: 8, target: FOE3, at: now - 398000 },
      c4: { uid: FOE3, name: 'Mira Vell', word: 'ESTRELLA', dmg: 13, target: UC, at: now - 200000 },
      c5: { uid: FOE3, name: 'Mira Vell', word: 'NIEBLA', dmg: 9, target: UC, at: now - 199000 },
      c6: { uid: FOE3, name: 'Mira Vell', word: 'BRUMA', dmg: 7, target: UC, at: now - 198000 },
    },
  });
}
await A.seed(`navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); localStorage.clear(); localStorage.setItem('dv.seeded', '${UC}');
    localStorage.setItem('starspellUid', '${UC}'); localStorage.setItem('beta3.lang', 'es'); } catch (e) {}`);
const URL3 = BASE + '?mpuid=' + UC.slice(5) + '&fps=0&lang=es&inset=50,34&join=' + CODE3 + '&from=' + FOE3;
let landed3 = (await A.nav(URL3)) && (await A.until(INVB, 60000));
if (!landed3) {
  console.log('  first landing missed — scenes: ' + await A.ev(`window.game ? game.scene.scenes.filter(s => s.sys.isActive()).map(s => s.sys.settings.key).join(',') : 'no game'`).catch(() => '?')
    + ' · deeplink: ' + await A.ev(`localStorage.getItem('beta3.deeplink')`).catch(() => '?'));
  landed3 = (await A.nav(URL3)) && (await A.until(INVB, 60000));
}
ok('the duel lands in Spanish under ?inset', landed3);
if (landed3) toDelete.add('names/' + await A.ev(`SSNET.nameKey(SSNET.myName())`).catch(() => 'x'));
ok('the story rises', await A.until(`!!${VB}.storyC`, 8000));
ok('…and lands whole', await A.until(`(() => { const L = ${VB}.storyLand; return L && L.rows.every(r => r.done); })()`, 10000));
await sleep(600);
const cen3 = await A.ev(CENSUS(`${VB}.storyC`));
ok('the tale speaks Spanish (title tex + took + go + own-turn label)',
  cen3.includes('sus palabras te costaron 29 en total') && cen3.includes('toca para retomar el duelo') && cen3.includes('TU ÚLTIMO TURNO'),
  cen3.slice(0, 200));
ok('the words and prices stand', ['ESTRELLA', 'NIEBLA', 'BRUMA', '−13', '−9', '−7', 'SOL −5', 'MAR −6', 'LUNA −8'].every((w) => cen3.includes(w)));
ok('the bar sinks to 121 / 150', await A.until(`${VB}.hpT.text === '121 / 150'`, 5000));
await A.shot('es-inset');
await A.tapTil(`${VB}.storyC && ${VB}.storyC.list[0]`, `!${VB}.storyC`, 10000);
ok('the chip + inspector dress in Spanish too', await A.ev(`(() => { const s = ${VB};
  const pan = s.oppPanels && s.oppPanels['${FOE3}']; if (!pan || !pan.chipB.visible || pan.chipT.text !== '✦ 1') return false;
  s.openInspectFoe('${FOE3}'); if (!s.inspectP) return false;
  let named = false; const walk = (o) => { if (!o) return; if (o.list) { o.list.forEach(walk); return; }
    if (o.texture && String(o.texture.key).includes(SS_T('vsTheirSigils', 'Mira Vell'))) named = true; };
  walk(s.inspectP.c); if (s.inspectP) s.inspectP.close(); return named; })()`));

/* ---------- the sweep ---------- */
console.log('— THE SWEEP —');
let swept = true;
for (const p of toDelete) { try { await rtDel(p); } catch (e) { swept = false; } }
for (const p of toDelete) { const v = await rt(p); if (v !== null) { swept = false; console.log('  still standing: ' + p); } }
ok('every registry row this run wrote is gone', swept);
console.log('page exceptions: ' + (errs.length ? errs.join(' || ') : 'none'));
ok('zero page exceptions on either sky', errs.length === 0);
console.log('RESULT ' + pass + '/' + (pass + fail) + (fail ? ' — RED' : ' — ALL GREEN'));
for (const k of kids) { try { k.kill('SIGKILL'); } catch (e) { } }
process.exit(fail ? 1 : 0);
