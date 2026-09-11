// REMATCH-CHECK — a rematch refused sets you free (v0.92.0, Skylar's 9/8
// versus-polish card 02). Skylar: "when you rematch someone and they don't
// accept the rematch, my screen is stuck on 'The Duel Is Forming' but the
// other player … can continue playing the game in other ways. There's no
// indication that they refused." Stamp: explicit decline + inferred — the
// invited side gets a real DECLINE beside ANSWER THE REMATCH; leaving the
// end screen / starting anything else / the app closing ALSO declines; the
// waiting side is told they moved on and freed at once, with a belt timeout
// so no waiting screen in versus is ever unescapable.
//
// What this suite proves, with real CDP taps at DPR 3 on the LIVE sky:
//   §1 decline said out loud — A rematches into the "duel is forming…"
//      wait (no share button, LEAVE standing); B's end screen pulses
//      ANSWER THE REMATCH and grows the quieter ✕; B taps ✕ → one honest
//      word (rematchNo, by B) on the old room; A is freed within a breath:
//      the gentle moved-on notice (B named), then the versus page; the
//      fresh room is dissolved like any dead invite; no cap slot leaks.
//   §2 walking away declines — B leaves the end screen by RETURN instead;
//      the shutdown speaks the same word and A is freed the same way.
//   §3 the word outranks the call — B leaves BEFORE A presses: A's end
//      screen fades the rematch door honestly (moved-on line in its
//      place), so a doomed wait is never even entered.
//   §4 B accepts normally → the duel forms exactly as today (room active,
//      both seated, no refusal word, board up on both sides).
//   §5 the LEAVE door works mid-wait (no wait in versus is unescapable).
//   §6 the belt — the rival's client never speaks (phone dead before the
//      end was ever read): ?rmbelt pins the timeout, A is freed by it,
//      the foe's name still dresses the notice (scene-data path).
//   §7 the vanished client — B is KILLED at the end screen; the armed
//      onDisconnect word (app close = decline) or the belt frees A, and
//      the wait resolves either way.
// Self-launching: serves beta3 on :8899 if nothing does, TWO headless
// Chromes on :9477/:9478 (/tmp/cdp-rma|b, wiped first). Every registry row
// this run writes is deleted and proven gone at the end.
//
//   perl -e 'alarm 840; exec @ARGV' node tools/rematch-check.mjs   # ~7 min
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
const rtDel = (p) => fetch(RT + p + '.json', { method: 'DELETE' });
const rtPut = (p, v) => fetch(RT + p + '.json', { method: 'PUT', body: JSON.stringify(v) });
const restUntil = async (code, pred, cap = 12000) => { const t0 = Date.now(); let r = null; while (Date.now() - t0 < cap) { r = await rt('mp/rooms/' + code); if (pred(r)) return r; await sleep(400); } return r; };

/* ---------- §0 the source audit (no browser needed) ---------- */
console.log('— THE SOURCE AUDIT —');
const vsSrc = readFileSync('versus.js', 'utf8');
const stSrc = readFileSync('strings.js', 'utf8');
ok('the belt stands with its harness seam (?rmbelt, default 90s)',
  /VS_RM_BELT_MS = \(\(\) => \{ const p = parseInt\(QS\.get\('rmbelt'\)/.test(vsSrc) && /: 90000; \}\)\(\)/.test(vsSrc));
ok('the ✕ decline writes the one honest word (rematchNo, by/name/at)',
  /declineRematch\(\) \{/.test(vsSrc) && /rematchNo', \{ by: vsUid\(\), name: vsName\(\), at: Date\.now\(\) \}/.test(vsSrc));
ok('leaving the end screen declines too (the shutdown word, presser exempt)',
  /this\.state === 'done' && !this\.rematchBusy && !this\.rmGone\n\s+&& this\.room && this\.room\.status === 'done' && !this\.room\.rematchNo/.test(vsSrc));
ok('the app closing declines (the armed onDisconnect word, cancelled by a press)',
  /this\.rmNoDisc = this\.roomRef\.child\('rematchNo'\)\.onDisconnect\(\)/.test(vsSrc) &&
  (vsSrc.match(/this\.rmNoDisc\.cancel\(\)/g) || []).length >= 3);
ok('the waiting side watches the word and wears the belt',
  /this\.rmNoRef = SSNET\.ref\('mp\/rooms\/' \+ this\.rematchWait\.from \+ '\/rematchNo'\)/.test(vsSrc) &&
  /this\.rmBelt = this\.time\.delayedCall\(VS_RM_BELT_MS/.test(vsSrc));
ok('the refused wait dissolves like a dead invite (detach, then last-one-out txn)',
  /rematchRefused\(v\) \{/.test(vsSrc) && /\/\/ detach before the seat leaves/.test(vsSrc) &&
  /rematchRefused\(v\) \{[\s\S]{0,1400}last one out seals the room behind them/.test(vsSrc));
ok('the moved-on word outranks the rematch call on the end screen',
  /room\.rematchNo && room\.rematchNo\.by !== vsUid\(\)\) this\.showRematchGone/.test(vsSrc) &&
  /this\.room\.rematchNo && this\.room\.rematchNo\.by !== vsUid\(\)\) this\.showRematchGone/.test(vsSrc));
ok('a rematch press refuses a seat that moved on (no doomed wait)',
  /if \(this\.room\.rematchNo && this\.room\.rematchNo\.by !== vsUid\(\)\) \{ this\.showRematchGone\(this\.room\.rematchNo\); return; \}/.test(vsSrc));
ok('the press carries the rival into the wait (rematchWait: from + foe)',
  /rematchWait: \{ from: this\.code, foe: foe0 \? \{ id: foe0\.id, name: foe0\.name \} : null \}/.test(vsSrc));
ok('the duel forming stands the refusal story down (beginBattle)',
  /beginBattle\(\) \{\n\s+\/\/ the duel formed — the rematch-refusal story \(watch \+ belt\) stands down/.test(vsSrc));
ok('a rematch wait shares no invite link', /if \(!ch && !this\.near && !this\.rematchWait\) \{/.test(vsSrc));
ok('the five-game cap still holds the rematch door', /if \(this\.room\.corr && vsCapSheet\(this\)\) return;/.test(vsSrc));
ok('the rematch affair resets every visit (no stale busy/pulse dead-lock)',
  /this\.rematchBusy = false; this\.rematchPulse = null; this\.rematchDead = false;/.test(vsSrc));
{
  const blocks = {};
  for (const lg of LANGS) blocks[lg] = stSrc.indexOf('\n  ' + lg + ': {');
  const order = LANGS.slice().sort((a, b) => blocks[a] - blocks[b]);
  let all = true, why = '';
  for (let i = 0; i < order.length; i++) {
    const from = blocks[order[i]], to = i + 1 < order.length ? blocks[order[i + 1]] : stSrc.length;
    if (!/vsRmMoved: '[^']*%1[^']*'/.test(stSrc.slice(from, to))) { all = false; why += order[i] + ' '; }
  }
  ok('the moved-on notice speaks all five tongues (vsRmMoved, %1 = the name)', all, why.trim());
}

/* ---------- server + two browsers ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
for (const p of ['/tmp/cdp-rma', '/tmp/cdp-rmb']) { try { execSync('rm -rf ' + p); } catch (e) { } }
const errs = [];
async function client(port, dir, tag) {
  const proc = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + port,
    '--user-data-dir=' + dir, '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' });
  kids.push(proc);
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
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    if (r?.data) { const { writeFileSync } = await import('node:fs'); writeFileSync('/tmp/rm-' + name + '.png', Buffer.from(r.data, 'base64')); }
  };
  const tapTil = async (expr, cond, cap = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < cap) {
      try { await tap(expr); } catch (e) { }
      if (await until(cond, 2500)) return true;
    }
    return false;
  };
  return { ev, seed, nav, until, tap, tapTil, shot, tag, proc };
}
const [A, B] = await Promise.all([client(9477, '/tmp/cdp-rma', 'A'), client(9478, '/tmp/cdp-rmb', 'B')]);
const toDelete = new Set();
const codes = new Set();
const SUF = rnd();
const UA = 'test_ra' + SUF, UB = 'test_rb' + SUF;
const BOOT = (uid) => `navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); if (localStorage.getItem('rm.seeded') !== '${uid}') { localStorage.clear(); localStorage.setItem('rm.seeded', '${uid}');
    localStorage.setItem('starspellUid', '${uid}'); } } catch (e) {}`;
const READY = `SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').dailyChipB`;
// the world door stands in every online state (v0.97.0: the funnel promotes
// it, the full ground keeps it) — the page sentinel for these friendless boots
const MENU = `game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').chWorldB`;
const VB = `game.scene.getScene('vsbattle')`;
// deep-walk census incl. wrapped text blocks (container children never
// appear in scene.children.list; a textBlock's lines reconstruct wrapped)
const TEXTS = (scene) => `(() => { const out = []; const walk = (o) => { if (!o) return;
  if (o.getData && o.getData('textBlock') && o.lines) { out.push(o.lines.map((t) => t.text).join(' ')); return; }
  if (o.list) { for (const k of o.list) walk(k); return; } if (o.text !== undefined && o.visible) out.push(String(o.text)); };
  const s = game.scene.getScene('${scene}'); if (!s || !s.children) return '';
  for (const o of s.children.list) walk(o); return out.join(' | '); })()`;
for (const u of [UA, UB]) for (const p of ['players/', 'presence/', 'devices/', 'friends/', 'recent/', 'invites/']) toDelete.add(p + u);

/* a decided correspondence room, fabricated whole (the §2 corr-check
   pattern): both seats real, B the winner so A's loser end screen is
   unlocked at once (only the winner waits out a fanfare) */
let roomN = 0;
async function mintDone(NA, NB) {
  const code = 'RM' + String.fromCharCode(65 + roomN++) + SUF.slice(0, 1).toUpperCase();
  const now = Date.now();
  await rtPut('mp/rooms/' + code, {
    mode: 'turns', status: 'done', corr: 1, hp: 150, createdAt: now - 90000, movedAt: now - 30000, endedAt: now - 15000,
    hostUid: UA, seed: 11, lang: 'en', turnUid: UB, turnCasts: 0, turnCount: 2, winnerUid: UB,
    players: {
      [UA]: { name: NA, hp: 0, seat: 0, casts: 3, dealt: 40, gone: false, joinedAt: now - 90000, rating: 1000, rhide: 0 },
      [UB]: { name: NB, hp: 110, seat: 1, casts: 3, dealt: 150, gone: false, joinedAt: now - 88000, rating: 1000, rhide: 0 },
    },
  });
  codes.add(code); toDelete.add('mp/rooms/' + code);
  return code;
}
// stop whatever stands and land on the room's end screen (the summons
// overlay's own enter pattern); the rmfree beacon is cleared on the way in
const enterEnd = async (cli, code) => {
  await cli.ev(`(() => { localStorage.removeItem('beta3.rmfree'); const sm = game.scene.getScene('summons');
    for (const s of game.scene.getScenes(false)) { if (s !== sm && (s.sys.isActive() || s.sys.isSleeping() || s.sys.isPaused())) s.scene.stop(); }
    sm.scene.launch('vsbattle', { code: ${JSON.stringify(code)} }); sm.scene.bringToTop(); return 1; })()`);
  return cli.until(`game.scene.isActive('vsbattle') && ${VB}.code === ${JSON.stringify(code)} && ${VB}.state === 'done'`, 25000);
};
const RETURN_T = `(() => { let hit = null; const walk = (o) => { if (o.list) { o.list.forEach(walk); return; } if (o.text === 'RETURN') hit = o; };
  ${VB}.children.list.forEach(walk); return hit; })()`;
const freed = async (dest, cap = 15000) => {
  if (!(await A.until(`(JSON.parse(localStorage.getItem('beta3.rmfree') || '{}').code) === ${JSON.stringify(dest)}`, cap))) return null;
  return JSON.parse(await A.ev(`localStorage.getItem('beta3.rmfree')`));
};

/* ---------- §1 DECLINE, SAID OUT LOUD ---------- */
console.log('— §1 THE ✕ BESIDE ANSWER THE REMATCH —');
await A.seed(BOOT(UA));
ok('A boots to the meadow', await A.nav(BASE + '?mpuid=' + UA.slice(5)) && await A.until(READY, 45000));
await B.seed(BOOT(UB));
ok('B boots to the meadow', await B.nav(BASE + '?mpuid=' + UB.slice(5)) && await B.until(READY, 45000));
const NA = await A.ev(`SSNET.myName()`), NB = await B.ev(`SSNET.myName()`);
toDelete.add('names/' + await A.ev(`SSNET.nameKey(${JSON.stringify(NA)})`));
toDelete.add('names/' + await B.ev(`SSNET.nameKey(${JSON.stringify(NB)})`));
const R1 = await mintDone(NA, NB);
ok('both land on the decided duel\'s end screen', (await enterEnd(A, R1)) && (await enterEnd(B, R1)));
ok('A\'s door reads REMATCH (emoji-free since the 9/10 sweep) with the drawn glyph beside it',
  (await A.ev(TEXTS('vsbattle'))).includes('REMATCH')
  && await A.ev(`(() => { const s = game.scene.getScene('vsbattle'); return !!(s.rematchG && s.rematchG.visible && s.rematchG.texture.key === 'vsswords') })()`));
ok('A presses it and waits — "the duel is forming…"',
  await A.tapTil(`${VB}.rematchB`, `game.scene.isActive('vsbattle') && ${VB}.code !== ${JSON.stringify(R1)} && ${VB}.state === 'wait'`, 20000)
  && await A.until(`(${TEXTS('vsbattle')}).includes(SS_T('vsWaitDuel'))`, 8000));
let r1 = await restUntil(R1, (r) => r && r.rematch);
const D1 = r1 && r1.rematch;
codes.add(D1); toDelete.add('mp/rooms/' + D1);
ok('the fresh room is sealed on the old one (rematch → ' + D1 + '), A seated alone',
  !!D1 && !!(await restUntil(D1, (r) => r && r.players && r.players[UA] && r.status === 'waiting')));
ok('the wait offers LEAVE but shares no invite link', await A.ev(`(() => { const t = ${TEXTS('vsbattle')};
  return t.includes('‹ LEAVE') && !t.includes(SS_T('vsShareInvite')); })()`));
ok('no ledger row, no cap slot for a wait nobody answered',
  await A.ev(`!VS_GAMES.get(${JSON.stringify(D1)}) && vsOngoingCount() === 0`));
ok('B\'s door pulses ANSWER THE REMATCH and grows the quieter ✕',
  await B.until(`(${TEXTS('vsbattle')}).includes('ANSWER THE REMATCH') && !!${VB}.rmDeclB`, 20000));
await sleep(400);
await B.shot('decline-door');
await B.tapTil(`${VB}.rmDeclB`, `!${VB}.rmDeclB`, 12000);
r1 = await restUntil(R1, (r) => r && r.rematchNo);
ok('the ✕ writes the one honest word (rematchNo by B, named, stamped)',
  !!r1.rematchNo && r1.rematchNo.by === UB && r1.rematchNo.name === NB && r1.rematchNo.at > 0);
ok('B\'s own doors fade (declined — the affair is closed)', await B.until(`!${VB}.rematchB && ${VB}.state === 'done'`, 6000));
let f = await freed(D1);
ok('A is freed within a breath — the beacon says a spoken word, not the belt', !!f && f.belt === false && f.name === NB, f && JSON.stringify(f));
ok('…with the gentle notice, B named (house voice)',
  await A.ev(`(${TEXTS('vsbattle')}).includes(SS_T('vsRmMoved', ${JSON.stringify(NB)}))`));
await A.shot('freed-notice');
ok('…then back to the versus page, freed', await A.until(MENU, 12000));
ok('the refused room dissolved like a dead invite', (await restUntil(D1, (r) => r === null, 10000)) === null);
ok('still no ledger litter, no cap slot leaked', await A.ev(`!VS_GAMES.get(${JSON.stringify(D1)}) && vsOngoingCount() === 0`));
ok('B\'s RETURN still leaves the end screen quietly', await B.tapTil(RETURN_T, MENU, 15000));

/* ---------- §2 WALKING AWAY DECLINES ---------- */
console.log('— §2 LEAVING THE END SCREEN IS A DECLINE —');
const R2 = await mintDone(NA, NB);
ok('both stand on a fresh end screen', (await enterEnd(A, R2)) && (await enterEnd(B, R2)));
ok('A presses REMATCH and waits',
  await A.tapTil(`${VB}.rematchB`, `game.scene.isActive('vsbattle') && ${VB}.code !== ${JSON.stringify(R2)} && ${VB}.state === 'wait'`, 20000));
const r2 = await restUntil(R2, (r) => r && r.rematch);
const D2 = r2 && r2.rematch;
codes.add(D2); toDelete.add('mp/rooms/' + D2);
ok('B walks away by RETURN — the shutdown speaks the word',
  await B.tapTil(RETURN_T, MENU, 15000) && !!(await restUntil(R2, (r) => r && r.rematchNo && r.rematchNo.by === UB)));
f = await freed(D2);
ok('A is freed the same way (spoken word, B named)', !!f && f.belt === false && f.name === NB, f && JSON.stringify(f));
ok('…and lands the versus page', await A.until(MENU, 12000));
ok('the walked-out rematch room dissolved too', (await restUntil(D2, (r) => r === null, 10000)) === null);

/* ---------- §3 THE WORD OUTRANKS THE CALL ---------- */
console.log('— §3 A RIVAL ALREADY GONE FADES THE DOOR —');
const R3 = await mintDone(NA, NB);
ok('both stand on a fresh end screen', (await enterEnd(A, R3)) && (await enterEnd(B, R3)));
ok('B leaves FIRST (no rematch pressed anywhere)',
  await B.tapTil(RETURN_T, MENU, 15000) && !!(await restUntil(R3, (r) => r && r.rematchNo && r.rematchNo.by === UB)));
ok('A\'s rematch door fades honestly — the moved-on line in its place',
  await A.until(`${VB}.rmGone === true && !${VB}.rematchB && (${TEXTS('vsbattle')}).includes(SS_T('vsRmMoved', ${JSON.stringify(NB)}))`, 15000));
await A.shot('moved-on-endscreen');
ok('…and no doomed wait was ever entered (still the end screen, RETURN alive)',
  (await A.ev(`${VB}.state === 'done' && ${VB}.code === ${JSON.stringify(R3)}`)) && await A.tapTil(RETURN_T, MENU, 15000));

/* ---------- §4 B ACCEPTS — THE DUEL FORMS AS TODAY ---------- */
console.log('— §4 THE ANSWERED REMATCH STILL FORMS —');
const R4 = await mintDone(NA, NB);
ok('both stand on a fresh end screen', (await enterEnd(A, R4)) && (await enterEnd(B, R4)));
ok('A presses REMATCH and waits',
  await A.tapTil(`${VB}.rematchB`, `game.scene.isActive('vsbattle') && ${VB}.code !== ${JSON.stringify(R4)} && ${VB}.state === 'wait'`, 20000));
const r4 = await restUntil(R4, (r) => r && r.rematch);
const D4 = r4 && r4.rematch;
codes.add(D4); toDelete.add('mp/rooms/' + D4);
ok('B answers the call', await B.until(`(${TEXTS('vsbattle')}).includes('ANSWER THE REMATCH')`, 15000)
  && await B.tapTil(`${VB}.rematchB`, `game.scene.isActive('vsbattle') && ${VB}.code === ${JSON.stringify(D4)}`, 20000));
ok('the duel forms — room active, both seated, first turn the presser\'s',
  !!(await restUntil(D4, (r) => r && r.status === 'active' && r.players && r.players[UA] && r.players[UB] && r.turnUid === UA, 20000)));
ok('both boards rise out of the wait', await A.until(`${VB}.state !== 'wait' && ${VB}.state !== 'done'`, 25000)
  && await B.until(`${VB}.state !== 'wait' && ${VB}.state !== 'done'`, 25000));
ok('no refusal word was ever spoken', !((await rt('mp/rooms/' + R4)) || {}).rematchNo);
ok('the formed duel holds ONE cap slot on each side, honestly',
  await A.until(`!!VS_GAMES.get(${JSON.stringify(D4)}) && vsOngoingCount() === 1`, 10000)
  && await B.until(`!!VS_GAMES.get(${JSON.stringify(D4)}) && vsOngoingCount() === 1`, 10000));
// step out (the duel STANDS — corr law), then clear the ledger + room for §5
await A.tapTil(`(() => { const s = ${VB}; return s.children.list.find((o) => o.text === '‹'); })()`, MENU, 20000);
await B.tapTil(`(() => { const s = ${VB}; return s.children.list.find((o) => o.text === '‹'); })()`, MENU, 20000);
await rtDel('mp/rooms/' + D4);
await A.ev(`VS_GAMES.remove(${JSON.stringify(D4)}); 1`);
await B.ev(`VS_GAMES.remove(${JSON.stringify(D4)}); 1`);

/* ---------- §5 THE LEAVE DOOR MID-WAIT ---------- */
console.log('— §5 NO WAIT IS UNESCAPABLE: LEAVE —');
const R5 = await mintDone(NA, NB);
ok('A stands on a fresh end screen', await enterEnd(A, R5));
ok('A presses REMATCH and waits',
  await A.tapTil(`${VB}.rematchB`, `game.scene.isActive('vsbattle') && ${VB}.code !== ${JSON.stringify(R5)} && ${VB}.state === 'wait'`, 20000));
const r5 = await restUntil(R5, (r) => r && r.rematch);
const D5 = r5 && r5.rematch;
codes.add(D5); toDelete.add('mp/rooms/' + D5);
ok('‹ LEAVE frees the wait by hand', await A.tapTil(`(() => { let hit = null; const walk = (o) => { if (o.list) { o.list.forEach(walk); return; }
  if (o.text === '‹ LEAVE') hit = o; }; ${VB}.children.list.forEach(walk); return hit; })()`, MENU, 15000));
ok('…and the abandoned wait dissolved behind it', (await restUntil(D5, (r) => r === null, 10000)) === null);

/* ---------- §6 THE BELT (no word can ever come) ---------- */
console.log('— §6 THE BELT: A RIVAL WHO NEVER READS —');
ok('A re-enters with the belt pinned to 4s', await A.nav(BASE + '?mpuid=' + UA.slice(5) + '&rmbelt=4000') && await A.until(READY, 45000));
const R6 = await mintDone(NA, NB);
ok('A alone lands the end screen (the rival\'s phone is dark)', await enterEnd(A, R6));
const belt0 = Date.now();
ok('A presses REMATCH and waits',
  await A.tapTil(`${VB}.rematchB`, `game.scene.isActive('vsbattle') && ${VB}.code !== ${JSON.stringify(R6)} && ${VB}.state === 'wait'`, 20000));
const r6 = await restUntil(R6, (r) => r && r.rematch);
const D6 = r6 && r6.rematch;
codes.add(D6); toDelete.add('mp/rooms/' + D6);
f = await freed(D6, 20000);
ok('the belt frees A — no word ever came', !!f && f.belt === true, f && JSON.stringify(f));
ok('…within the pinned window (4s belt, freed under 20s of the press)', !!f && f.t - belt0 < 20000, f && Math.round((f.t - belt0) / 100) / 10 + 's');
ok('…and the notice still names the rival (the scene-data path)', !!f && f.name === NB, f && f.name);
ok('back to the versus page, freed', await A.until(MENU, 12000));
ok('the timed-out room dissolved', (await restUntil(D6, (r) => r === null, 10000)) === null);

/* ---------- §7 THE VANISHED CLIENT ---------- */
console.log('— §7 B IS KILLED AT THE END SCREEN —');
const R7 = await mintDone(NA, NB);
ok('both stand on a fresh end screen', (await enterEnd(A, R7)) && (await enterEnd(B, R7)));
ok('A presses REMATCH and waits',
  await A.tapTil(`${VB}.rematchB`, `game.scene.isActive('vsbattle') && ${VB}.code !== ${JSON.stringify(R7)} && ${VB}.state === 'wait'`, 20000));
const r7 = await restUntil(R7, (r) => r && r.rematch);
const D7 = r7 && r7.rematch;
codes.add(D7); toDelete.add('mp/rooms/' + D7);
try { B.proc.kill('SIGKILL'); } catch (e) { }
f = await freed(D7, 30000);
ok('A is freed all the same (the armed word or the belt — either door)', !!f, f && JSON.stringify(f));
ok('…notice named, versus page reached', !!f && f.name === NB && await A.until(MENU, 12000));
ok('the orphaned rematch room dissolved', (await restUntil(D7, (r) => r === null, 10000)) === null);
ok('A holds zero ledger rows and zero cap slots after the whole affair',
  await A.ev(`vsOngoingCount() === 0 && VS_GAMES.list().length === 0`));

/* ---------- CLEANUP ---------- */
console.log('— CLEANUP —');
const rooms = (await rt('mp/rooms')) || {};
for (const [k, r] of Object.entries(rooms)) {
  if (!r) continue;
  if (/^test_r[ab]/.test(r.hostUid || '') || codes.has(k)) await rtDel('mp/rooms/' + k);
}
for (const p of toDelete) await rtDel(p);
let left = 0; const leftNames = [];
for (const p of toDelete) if ((await rt(p)) !== null) { left++; leftNames.push(p); }
ok('every registry row this run wrote is gone', left === 0, leftNames.join(' '));
ok('zero page exceptions across both clients', errs.length === 0, errs.slice(0, 3).join(' · '));

console.log('\nRESULT ' + pass + '/' + (pass + fail) + (fail ? '  ✗ ' + fail + ' FAILED' : '  — all green'));
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
