// NAMES-CHECK — unique player names (v0.53.0, task 42).
// Two REAL throwaway uids (not ?mpuid: test_ identities stay out of the
// registry by design) in two headless Chromes race the same standing name at
// connect: exactly one keeps it, the loser is re-minted, told once, and
// every surface (players/<uid>/name, the registry) follows. Then the explicit
// claim race (3 rounds, both transactions fired in the same instant), the
// silent fresh-device path, a rename onto a taken name (held) and a free one
// (old claim released), the test_ exemption, THE CIRCLE claiming over its own
// SSNET.side door, nameKey normalization, and the desc law on the notice in
// all 10 languages (no child Text ever holds a newline, every line fits).
// Everything written is deleted at the end.
//
//   python3 -m http.server 8899 &
//   for p in a:9448 b:9449; do "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --no-sandbox --mute-audio --disable-gpu --remote-debugging-port=${p#*:} \
//     --user-data-dir=/tmp/cdp-names-${p%%:*} --window-size=390,844 --force-device-scale-factor=3 about:blank & done
//   node tools/names-check.mjs
const BASE = 'http://localhost:8899/index.html';
const RT = 'https://testroom-75200-default-rtdb.firebaseio.com/starspell/';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = () => Math.random().toString(36).slice(2, 7);
const rt = async (p) => (await fetch(RT + p + '.json')).json();
const rtDel = (p) => fetch(RT + p + '.json', { method: 'DELETE' });
const errs = [];
async function client(port, tag) {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') { const t = d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text; if (!/WebGL context/.test(t || '')) errs.push(tag + ': ' + t); } };
  await new Promise((r) => ws.onopen = r);
  const send = (m, p) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed'); return r?.result?.value; };
  const seedIds = [];
  const seed = async (src) => { const r = await send('Page.addScriptToEvaluateOnNewDocument', { source: src }); seedIds.push(r.identifier); };
  const unseed = async () => { for (const i of seedIds.splice(0)) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: i }); };
  // navigate, and PROVE the page is ours before waiting on the game (a
  // navigate that lands while about:blank is still settling can be dropped)
  const nav = async (u) => {
    for (let i = 0; i < 4; i++) {
      const r = await send('Page.navigate', { url: u });
      if (r && r.errorText) console.log('  nav ' + tag + ': ' + r.errorText);
      for (let j = 0; j < 20; j++) { await sleep(250); if (await ev(`location.href.includes('index.html') && typeof SSNET !== 'undefined'`).catch(() => false)) return true; }
    }
    return false;
  };
  const until = async (e, cap = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < cap) { try { if (await ev(e)) return true; } catch (err) { } await sleep(300); } return false; };
  return { ev, seed, unseed, nav, until, tag };
}
const [A, B] = await Promise.all([client(9448, 'A'), client(9449, 'B')]);
const UA = 'u' + rnd() + 'nca', UB = 'u' + rnd() + 'ncb', UC = 'u' + rnd() + 'ncc';
const RACE = 'Race ' + rnd().toUpperCase();
const toDelete = new Set(['players/' + UA, 'players/' + UB, 'players/' + UC, 'devices/' + UA, 'devices/' + UB, 'devices/' + UC, 'presence/' + UA, 'presence/' + UB, 'presence/' + UC]);
const BOOT = (uid, name, fresh) => `navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); if (!localStorage.getItem('nc.seeded')) { localStorage.clear(); localStorage.setItem('nc.seeded', '1');
    localStorage.setItem('starspellUid', '${uid}'); localStorage.setItem('starspellName', ${JSON.stringify(name)}); ${fresh ? "localStorage.setItem('starspellNameFresh','1');" : ''} } } catch (e) {}
  window.__ren = []; window.addEventListener('ss-renamed', (e) => window.__ren.push(e.detail));`;
const READY = `SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').lanternB`;
const ensured = (c) => c.until(`(async () => { await SSNET.ensureName(); return true })()`, 30000);

// ---- 1. the standing-name race at connect: two existing players, one name ----
console.log('race: ' + RACE + '  A=' + UA + '  B=' + UB);
await A.seed(BOOT(UA, RACE, false)); await B.seed(BOOT(UB, RACE, false));
await Promise.all([A.nav(BASE + '?diag=1'), B.nav(BASE + '?diag=1')]);
const reach = await Promise.all([A.until(READY, 90000), B.until(READY, 90000)]);
ok('both clients reach the sky', reach.every(Boolean), reach.every(Boolean) ? '' : await (reach[0] ? B : A).ev(`JSON.stringify({ game: typeof window.game, mode: SSNET.mode, diag: (document.getElementById('diagbox')||{}).textContent })`).catch((e) => String(e)));
await Promise.all([ensured(A), ensured(B)]);
const key = await A.ev(`SSNET.nameKey(${JSON.stringify(RACE)})`);
toDelete.add('names/' + key);
const holder = await rt('names/' + key);
ok('registry holds exactly one of the two uids', holder === UA || holder === UB, String(holder));
const W = holder === UA ? A : B, L = holder === UA ? B : A, LU = holder === UA ? UB : UA;
const wName = await W.ev('SSNET.myName()'), lName = await L.ev('SSNET.myName()');
ok('winner keeps the name', wName === RACE, wName);
ok('loser was re-minted, honestly', lName && lName !== RACE && await L.ev(`SSNET.nameKey(SSNET.myName())`) !== key, lName);
const lKey = await L.ev('SSNET.nameKey(SSNET.myName())'); toDelete.add('names/' + lKey);
ok('loser claimed the new name', (await rt('names/' + lKey)) === LU);
await sleep(1500);
ok('players/<uid>/name follows the loser', (await rt('players/' + LU + '/name')) === lName);
ok('players/<uid>/name follows the winner', (await rt('players/' + (holder) + '/name')) === RACE);
ok('loser fired ss-renamed once (taken, from → to)', await L.ev(`window.__ren.length === 1 && window.__ren[0].kind === 'taken' && window.__ren[0].from === ${JSON.stringify(RACE)} && window.__ren[0].to === SSNET.myName()`), await L.ev('JSON.stringify(window.__ren)'));
ok('winner was never told anything', await W.ev('window.__ren.length === 0 && !SSNET.renameNotice()'));
const shown = await L.until(`game.scene.getScene('home').children.list.some(c => c.getData && c.getData('renameNotice'))`, 12000);
ok('loser sees the notice on the meadow', shown);
ok('the notice is consumed (told once)', await L.ev('!SSNET.renameNotice()'));
ok('notice title/body carry the fiction and both names', await L.ev(`(() => { const c = game.scene.getScene('home').children.list.find(c => c.getData && c.getData('renameNotice')); if (!c) return false;
  const txt = []; const walk = (o) => { if (o.text != null) txt.push(o.text); if (o.list) o.list.forEach(walk); }; walk(c); const s = txt.join(' ');
  return s.includes(SS_T('nameTakenTitle')) && s.includes(${JSON.stringify(RACE)}) && s.includes(SSNET.myName()) })()`));

// ---- 2. the explicit race: both transactions fired in the same instant ----
for (let round = 1; round <= 3; round++) {
  const nm = 'Instant ' + rnd().toUpperCase(); const k = await A.ev(`SSNET.nameKey(${JSON.stringify(nm)})`); toDelete.add('names/' + k);
  const [ra, rb] = await Promise.all([A.ev(`SSNET.claimName(${JSON.stringify(nm)}).then(r => r.won)`), B.ev(`SSNET.claimName(${JSON.stringify(nm)}).then(r => r.won)`)]);
  const h = await rt('names/' + k);
  ok('instant race ' + round + ': exactly one winner, registry agrees', (ra !== rb) && (h === (ra ? UA : UB)), 'A ' + ra + ' B ' + rb + ' holder ' + h);
  ok('instant race ' + round + ': re-claim by the holder is idempotent', await (ra ? A : B).ev(`SSNET.claimName(${JSON.stringify(nm)}).then(r => r.won)`) === true);
  ok('instant race ' + round + ': the other side still loses', await (ra ? B : A).ev(`SSNET.claimName(${JSON.stringify(nm)}).then(r => r.won)`) === false);
}

// ---- 3. rename onto a taken name is held; onto a free one releases the old ----
const before = await L.ev('SSNET.myName()');
await L.ev(`SSNET.setName(${JSON.stringify(RACE)})`);
ok('rename applies at once (optimistic)', await L.ev('SSNET.myName()') === RACE);
ok('…then comes back: the name is spoken for', await L.until(`SSNET.myName() === ${JSON.stringify(before)}`, 15000), await L.ev('SSNET.myName()'));
ok('held notice fired with both names', await L.ev(`window.__ren.length === 2 && window.__ren[1].kind === 'held' && window.__ren[1].from === ${JSON.stringify(RACE)} && window.__ren[1].to === ${JSON.stringify(before)}`), await L.ev('JSON.stringify(window.__ren[1])'));
ok('registry untouched by the held rename', (await rt('names/' + key)) === holder && (await rt('names/' + lKey)) === LU);
await sleep(1200);
ok('players row still says the held name', (await rt('players/' + LU + '/name')) === before);
const FREE = 'Free ' + rnd().toUpperCase(); const fKey = await L.ev(`SSNET.nameKey(${JSON.stringify(FREE)})`); toDelete.add('names/' + fKey);
await L.ev(`SSNET.setName(${JSON.stringify(FREE)})`);
ok('rename to a free name claims it', await L.until(`(async () => (await fetch(${JSON.stringify(RT + 'names/' + fKey + '.json')})).json().then(v => v === ${JSON.stringify(LU)}))()`, 15000));
let released = false; for (let i = 0; i < 20 && !released; i++) { released = (await rt('names/' + lKey)) === null; if (!released) await sleep(500); }
ok('the old claim is released', released);
await sleep(1200);
ok('players/<uid>/name follows the free rename', (await rt('players/' + LU + '/name')) === FREE);
ok('no notice for a clean rename', await L.ev('window.__ren.length === 2 && !SSNET.renameNotice()'));

// ---- 4. a fresh device that loses its first mint re-mints silently ----
await B.unseed(); await B.seed(BOOT(UC, RACE, true).replace("if (!localStorage.getItem('nc.seeded'))", 'if (true)'));
await B.nav(BASE + '?diag=1'); ok('fresh device reaches the sky', await B.until(READY)); await ensured(B);
const cName = await B.ev('SSNET.myName()'); const cKey = await B.ev('SSNET.nameKey(SSNET.myName())'); toDelete.add('names/' + cKey);
ok('fresh device minted past the taken name', cName !== RACE && (await rt('names/' + cKey)) === UC, cName);
ok('fresh device was NOT told (it never saw the name it lost)', await B.ev('window.__ren.length === 0 && !SSNET.renameNotice()'));
ok('fresh flag cleared once the claim won', await B.ev("!localStorage.getItem('starspellNameFresh')"));
ok('winner still holds the raced name', (await rt('names/' + key)) === holder);

// ---- 5. test_ identities stay out of the registry ----
await B.unseed(); await B.seed(`navigator.share = undefined; navigator.clipboard = undefined; try { sessionStorage.setItem('beta3.skipIntro', '1'); } catch (e) {} window.__ren = [];`);
const MP = 'nc' + rnd();
await B.nav(BASE + '?diag=1&mpuid=' + MP); ok('test rig reaches the sky', await B.until(READY)); await ensured(B);
await sleep(1500);
const wispKey = await B.ev('SSNET.nameKey(SSNET.myName())');
ok('wisp name never enters the registry', (await rt('names/' + wispKey)) === null, wispKey);
ok('claimName is a no-op win for a test_ uid', await B.ev(`SSNET.claimName('Never Written ${MP}').then(r => r.won)`) === true && (await rt('names/never_written_' + MP)) === null);
toDelete.add('players/test_' + MP); toDelete.add('devices/test_' + MP); toDelete.add('presence/test_' + MP);

// ---- 6. THE CIRCLE claims over its own door ----
const circ = JSON.parse(await W.ev(`(async () => { const p = SS_RIVAL.persona(SS.prof.rating); p.name = ${JSON.stringify(RACE.replace('Race', 'Circle'))}; const db = SSNET.side('rival');
  const n1 = await SS_RIVAL.claimCircleName(db, p); const q = SS_RIVAL.persona(SS.prof.rating === 0 ? 1000 : SS.prof.rating);
  const p2 = SS_RIVAL.circle().find(x => x.uid !== p.uid) || q; p2.name = ${JSON.stringify(RACE)}; const n2 = await SS_RIVAL.claimCircleName(db, p2);
  return JSON.stringify({ u1: p.uid, n1, u2: p2.uid, n2, pool: SS_RIVAL.circle().map(x => [x.uid, x.name]) }) })()`));
const k1 = await W.ev(`SSNET.nameKey(${JSON.stringify(circ.n1)})`), k2 = await W.ev(`SSNET.nameKey(${JSON.stringify(circ.n2)})`);
toDelete.add('names/' + k1); toDelete.add('names/' + k2); toDelete.add('players/' + circ.u1); toDelete.add('players/' + circ.u2);
ok('a mage with a free name claims it as its own uid', circ.n1 === RACE.replace('Race', 'Circle') && (await rt('names/' + k1)) === circ.u1, circ.n1);
ok('a mage on a taken name is re-minted and claims the new one', circ.n2 !== RACE && (await rt('names/' + k2)) === circ.u2, circ.n2);
ok('the circle remembers the new name', circ.pool.some(([u, n]) => u === circ.u2 && n === circ.n2));
ok('the human still holds the raced name', (await rt('names/' + key)) === holder);

// ---- 7. nameKey normalization ----
ok('nameKey: trim · collapse · fold', await W.ev(`SSNET.nameKey('  Astral   FOX ') === 'astral fox' && SSNET.nameKey('astral fox') === SSNET.nameKey('ASTRAL\\tFox')`));
ok('nameKey: RTDB-forbidden chars become _', await W.ev(`SSNET.nameKey('a.b#c$d[e]f/g') === 'a_b_c_d_e_f_g'`));
ok('nameKey: NFKC folds fullwidth', await W.ev(`SSNET.nameKey('Ｆｏｘ') === 'fox'`));

// ---- 8. the desc law on the notice, all 10 languages, both kinds ----
const LANGS = JSON.parse(await W.ev('JSON.stringify(Object.keys(SS_STR))'));
const SWAP = (lang) => `(() => { if (!window.__keepEn) window.__keepEn = SS_STR.en; SS_STR.en = '${lang}' === 'en' ? window.__keepEn : SS_STR['${lang}']; return 1 })()`;
for (const lang of LANGS) {
  await W.ev(SWAP(lang));
  for (const kind of ['taken', 'held']) {
    const r = JSON.parse(await W.ev(`(() => { const s = game.scene.getScene('home'), l = ssLayout(s);
      const c = ssRenameNotice(s, { from: 'Moonlit Lantern', to: 'Winter Serpent 431', kind: '${kind}' });
      const txt = []; const walk = (o) => { if (o.text != null) txt.push([o.text, o.width]); if (o.list) o.list.forEach(walk); }; walk(c);
      const out = { n: txt.length, nl: txt.some(([t]) => t.includes('\\n')), wide: txt.filter(([, w]) => w > l.u(292)).length, empty: txt.filter(([t]) => !t.trim()).length,
        body: txt.slice(1).map(([t]) => t).join(' ') }; c.destroy(); return JSON.stringify(out) })()`));
    ok(lang + ' ' + kind + ': ≥2 single-line Texts, all fit, both names present', r.n >= 2 && !r.nl && r.wide === 0 && r.empty === 0 && r.body.includes('Moonlit Lantern') && r.body.includes('Winter Serpent 431'), JSON.stringify(r).slice(0, 120));
  }
}
await W.ev(SWAP('en'));
ok('no page exceptions', errs.length === 0, errs.join(' | ').slice(0, 300));

// ---- cleanup ----
for (const p of toDelete) await rtDel(p);
let left = 0; for (const p of toDelete) if (p.startsWith('names/') && (await rt(p)) !== null) left++;
ok('cleanup: every claim this run made is gone', left === 0, [...toDelete].filter((p) => p.startsWith('names/')).join(' '));
console.log(pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
