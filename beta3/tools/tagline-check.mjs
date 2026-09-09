// TAGLINE-CHECK — THE HOME MENU (v0.46.0 flavour cull · v0.47.0 campaign
// doors · v0.51.0 THE HOME RESHAPE · v0.52.0 LEADERBOARD INTO THE PROFILE,
// Wyatt 8/25):
//
//   [CONTINUE GAME while a climb stands] · NEW GAME · ENDLESS · VERSUS
//
// - LEADERBOARD's button left the meadow (v0.52.0): the board is a door in
//   the PROFILE now (under the star rating), its back link returning to the
//   profile, and from there to the meadow. The column is play modes only:
//   ENDLESS joined it in v0.68.0 — four rows read 429..615 (62 apart) with
//   a checkpoint, three read 454..590 (68 apart) without.
//
// - CONTINUE GAME (contCamp) exists ONLY while a checkpoint stands. Without
//   one it is NOT RENDERED AT ALL — no grey dress, no dead input, no gap: the
//   column closes ranks, centred on 522. With one it is alive with its
//   progress line, exactly as v0.47.0 built it.
// - The ENDLESS door is ALWAYS rendered and always carries a sub-line — the
//   standing climb's level, the best ever, or the mode's own verb (the one
//   deliberate exception to the live-lines-only law: a brand-new player is
//   told what the door is).
// - QUICK PLAY's button left the meadow. The MODE lives on (daily chip,
//   m:'quick' leaderboard rows, ?quick=1 boots a quick run for harnesses) —
//   only the door is gone, and the column reflows over the hole.
// - The campaign wording became game wording: NEW GAME / CONTINUE GAME and
//   the restart sheet's copy, in all five languages (the v0.71.0 cut).
// - The tagline ('weave words · fell the star-beasts') is GONE (v0.90.0,
//   Skylar 9/8: phones disagreed about the line only because caches
//   disagreed — the honest fix was removing it for real). The v0.51.0 dress
//   measurements left with it; this suite now asserts ABSENCE — no tagline
//   key in any language, no tagline text on either sky, no raw-key leak.
// - The v0.46.0 laws still hold: labels dead-centre, only LIVE sub-lines
//   (campaign progress, friends online), labels glide 9 for them.
//
// Run from beta3/ with the folder served on :8899 and a --disable-gpu Chrome
// on :9444 (nothing here forces a renderer). Firebase is BLOCKED at the
// network layer — the suite plays campaigns to their end and must never
// write a live row. BEFORE=<url of a served HEAD copy> adds a before/after
// meadow snapshot pair; SHOTS=<dir> keeps them.
import { writeFileSync, mkdirSync } from 'node:fs';
const PORT = process.argv[2] || '9444';
const BASE = 'http://localhost:8899/index.html';
const SHOTS = process.env.SHOTS || '', BEFORE = process.env.BEFORE || '';
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') {
    const x = d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text;
    // a fresh profile's boot probes GL once; under --disable-gpu Phaser's
    // "Cannot create WebGL context" is the probe's verdict, not a page error
    if (!/Cannot create WebGL context/.test(x || '')) errs.push(x);
  }
};
await new Promise(r => ws.onopen = r);
const send = (method, params) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
// never let a harness campaign write home: SSNET falls back to local mode
await send('Network.setBlockedURLs', { urls: ['*firebaseio.com*', '*firebasedatabase.app*', '*firebase*', '*gstatic.com*'] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: "navigator.share = undefined; try { sessionStorage.setItem('beta3.skipIntro', '1'); } catch (e) { }" });   // skipIntro: the v0.75.0 first-open flow must never fire under a harness boot
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
const tapXY = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const tap = async (expr) => {
  const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
  await tapXY(p.x, p.y);
};
const HOME_REST = `!!window.game && game.scene.isActive('home')
  && !game.scene.getScene('home').introPlaying && !!game.scene.getScene('home').dailyChipB && !game.scene.getScene('home').busy()`;
const H = `game.scene.getScene('home')`;
// the rows, in design units — rowY is the layout's own truth (layoutMenu
// stamps it), vis carries the v0.51.0 render-or-not law
const ROWS = `(() => { const h = ${H};
  const U = h.rowBtns.versus.displayWidth / 300;
  const row = (k) => { const b = h.rowBtns[k], t = h.rowLabels[k], s = h.rowSubs[k];
    if (!b) return null;
    return { rowY: t.rowY, vis: !!(b.visible && t.visible), h: +(b.displayHeight / U).toFixed(1),
      lift: +((b.y - t.y) / U).toFixed(1), label: t.text,
      sub: s ? (s.visible ? s.text : null) : undefined, subColor: s && s.visible ? s.style.color : null,
      hit: !!b.input && b.input.enabled, alpha: +b.alpha.toFixed(2), labA: +t.alpha.toFixed(2),
      hand: !!b.input && b.input.cursor === 'pointer' }; };
  return JSON.stringify({ campaign: row('campaign'), newcamp: row('newcamp'), endless: row('endless'), board: row('board'), versus: row('versus'),
    quickBtn: 'quick' in h.rowBtns, quickTxt: h.children.list.some(o => o.type === 'Text' && o.text === SS_T('quick')),
    boardBtn: 'board' in h.rowBtns, boardTxt: h.children.list.some(o => o.type === 'Text' && o.text === SS_T('board')),
    daily: h.dailyChipT.text,
    flavour: h.children.list.filter(o => o.type === 'Text' && /four acts|long night anew|then the Star Eater|duel beneath/.test(o.text)).length }) })()`;
// the visible column: rowYs in order, centred on 522, no gap — three rows
// sit 68 apart (454..590), four tighten to 62 (429..615)
const column = (g) => ['campaign', 'newcamp', 'endless', 'board', 'versus'].filter(k => g[k] && g[k].vis).map(k => g[k].rowY);
const COLN = [454, 522, 590], COLC = [429, 491, 553, 615];
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
/* ---- the tagline, gone -----------------------------------------------------
   v0.90.0: the line under the braid retired for real. The five old phrases
   are pinned HERE (they left strings.js with the key) so the assertion can
   never rot into vacuity: no tagline key survives in any language, SS_T
   falls through to the raw key (nothing anywhere still feeds it a string),
   and no meadow Text carries the old copy OR a leaked raw 'tagline'. */
const OLD_TAGLINES = ['weave words · fell the star-beasts', 'teje palabras · derriba a las bestias estelares',
  'tisse des mots · terrasse les bêtes stellaires', 'teça palavras · derrube as feras estelares',
  'webe Worte · fälle die Sternenbestien'];
const noTag = async (sky) => {
  const r = JSON.parse(await ev(`(() => { const h = ${H}; const old = ${JSON.stringify(OLD_TAGLINES)};
    return JSON.stringify({ keyIn: Object.keys(SS_STR).filter(L => 'tagline' in SS_STR[L]), fb: SS_T('tagline'),
      txt: h.children.list.filter(o => o.type === 'Text' && (old.includes(o.text) || o.text === 'tagline')).map(o => o.text) }) })()`));
  ok(`${sky}: the tagline is gone — no key in any language, no line under the braid, no raw-key leak`,
    r.keyIn.length === 0 && r.fb === 'tagline' && r.txt.length === 0, JSON.stringify(r));
};

// ---------------------------------------------------------------- before
if (BEFORE && SHOTS) {
  await nav(BEFORE + '?fps=0', 12000);
  if (await until(HOME_REST)) { await sleep(800); await snap('meadow-before'); console.log('  · before snapshot taken'); }
}
async function snap(name) {
  if (!SHOTS) return;
  const data = await ev(`new Promise(res => game.renderer.snapshot(img => res(img.src)))`);
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(SHOTS + '/' + name + '.png', Buffer.from(data.split(',')[1], 'base64'));
}

// ---------------------------------------------------------------- boot, clean
errs.length = 0;   // the BEFORE page's own boot noise is not ours to answer for
await nav(BASE + '?fps=0', 12000);
// a previous run may have left another language, a checkpoint or a grown
// profile behind — this suite pins exact labels and exact pixels, so start
// from nothing (the ?lang sections at the end re-pin their own)
await ev(`localStorage.removeItem('beta3.campaign'); localStorage.removeItem('beta3.campsign');
  localStorage.removeItem('beta3.profile'); localStorage.removeItem('beta3.lang'); 1`);
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands', await until(HOME_REST));
await sleep(800);
let g = JSON.parse(await ev(ROWS));
ok('none of the four flavour lines is anywhere on the meadow', g.flavour === 0, String(g.flavour));
ok('QUICK PLAY is gone from the meadow: no button, no label', !g.quickBtn && !g.quickTxt, JSON.stringify({ btn: g.quickBtn, txt: g.quickTxt }));
ok('…but the quick MODE keeps its string in every language (Wyatt may bring it back)',
  await ev(`Object.keys(SS_STR).every(L => typeof SS_STR[L].quick === 'string' && SS_STR[L].quick.length > 0)`) === true);
ok('NO CHECKPOINT → CONTINUE GAME is not rendered at all: invisible, input off', g.campaign && !g.campaign.vis && !g.campaign.hit, JSON.stringify(g.campaign));
ok('the column closes ranks — NEW GAME · ENDLESS · VERSUS at 454/522/590, no gap', same(column(g), COLN), JSON.stringify(column(g)));
ok('the ENDLESS door speaks its verb on a virgin meadow (sub live, label lifted 9)',
  g.endless && g.endless.vis && g.endless.sub === await ev(`SS_T('endlessSub')`) && g.endless.lift === 9 && g.endless.hit, JSON.stringify(g.endless));
for (const k of ['newcamp', 'versus'])
  ok(k + ': 58-tall button, label dead-centre, no sub-line showing', g[k].h === 58 && g[k].lift === 0 && !g[k].sub && g[k].hit, JSON.stringify(g[k]));
ok('LEADERBOARD is gone from the meadow (v0.52.0): no row, no label — it lives in the profile', !g.board && !g.boardBtn && !g.boardTxt, JSON.stringify({ btn: g.boardBtn, txt: g.boardTxt }));
ok('NEW GAME wears its new name', g.newcamp.label === await ev(`SS_T('newCamp')`) && g.newcamp.label === 'NEW GAME', g.newcamp.label);
ok('the daily chip still carries its countdown / tick', !!g.daily && g.daily.length > 1, g.daily);
// a REAL tap on the empty sky where the door once stood opens nothing
const empty = JSON.parse(await ev(`(() => { const h = ${H}; const cam = h.cameras.main, b = h.rowBtns.newcamp.getBounds();
  const D = game.scale.width / innerWidth; const U = h.rowBtns.versus.displayWidth / 300;
  return JSON.stringify({ x: b.centerX / D, y: (b.centerY - 68 * U - cam.scrollY) / D }) })()`));
await tapXY(empty.x, empty.y);
await sleep(900);
ok('a REAL tap where CONTINUE GAME once stood opens nothing (no sheet, no map, no ascent)',
  await ev(`!${H}.signC && !${H}.mapC && !${H}.confirmC && !${H}.ascending`) === true);
await noTag('dusk');
await snap('meadow-after');

// ---------------------------------------------------------------- the strings law
const keys = JSON.parse(await ev(`JSON.stringify(Object.keys(SS_STR).map(L => [L,
  ['campaignSub','newCampSub','quickSub','versusSub','tagline'].filter(k => k in SS_STR[L]), 'vsFriendsOn' in SS_STR[L], 'fightN' in SS_STR[L]]))`));
ok('five languages loaded (en/es/fr/pt/de — the v0.71.0 cut)', keys.length === 5, String(keys.length));
ok('campaignSub / newCampSub / quickSub / versusSub / tagline pruned from every language', keys.every(k => k[1].length === 0), JSON.stringify(keys.filter(k => k[1].length)));
ok('vsFriendsOn and fightN kept in every language', keys.every(k => k[2] && k[3]));
// the rename is total: the two doors and the restart sheet never say the old
// campaign word again, in any language
const CAMPWORD = { en: 'CAMPAIGN', es: 'CAMPAÑA', fr: 'CAMPAGNE', pt: 'CAMPANHA', de: 'KAMPAGNE' };
const stale = JSON.parse(await ev(`JSON.stringify((() => { const W = ${JSON.stringify(CAMPWORD)}; const out = [];
  for (const L of Object.keys(SS_STR)) for (const k of ['newCamp', 'contCamp', 'restartTitle', 'restartBody']) {
    const v = SS_STR[L][k]; if (typeof v !== 'string' || !v.length || v.toUpperCase().includes(W[L])) out.push(L + '.' + k);
  } return out })())`));
ok('newCamp / contCamp / restartTitle / restartBody renamed in all five languages (no campaign word survives)', stale.length === 0, stale.join(', '));
ok('the en restart sheet says game, in so many words', await ev(`SS_STR.en.restartBody === 'This will restart your current game in progress.'`) === true);

// ---------------------------------------------------------------- friends online → the counter
const FRIENDS = (n) => `(() => { const FR = SSNET.FR; FR.friends = {}; FR.presence = {};
  for (let i = 0; i < ${n}; i++) { FR.friends['f' + i] = { name: 'F' + i, at: 1 }; FR.presence['f' + i] = { name: 'F' + i, at: Date.now() }; }
  FR._emit(); return FR.onlineCount() })()`;
ok('two friends come online (presence layer)', await ev(FRIENDS(2)) === 2);
await sleep(400);
g = JSON.parse(await ev(ROWS));
const want2 = await ev(`SS_T('vsFriendsOn', 2)`);
ok('versus shows "' + want2 + '" in gold', g.versus.sub === want2 && g.versus.subColor === '#ffe9a8', JSON.stringify(g.versus));
ok('and the VERSUS label lifts 9 to make room', g.versus.lift === 9, String(g.versus.lift));
ok('the other rows did not move', g.newcamp.lift === 0 && same(column(g), COLN));
await snap('versus-friends-on');
ok('the friends log off', await ev(FRIENDS(0)) === 0);
await sleep(400);
g = JSON.parse(await ev(ROWS));
ok('the counter goes and the label re-centres — no orphaned gap', g.versus.sub === null && g.versus.lift === 0, JSON.stringify(g.versus));

// ---------------------------------------------------------------- a checkpoint → the door appears, the column grows
const CK = `JSON.stringify({ fightIdx: 2, actIdx: 0, hp: 12, hpMax: 12, sigils: [], words: [], longest: '', totalDmg: 0, scried: 0, featherUsed: 0, letters: 0, bigHit: 0, playMs: 0, overkill: 0 })`;
await ev(`localStorage.setItem('beta3.campaign', ${CK}); 1`);
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands with a checkpoint', await until(HOME_REST));
await sleep(800);
g = JSON.parse(await ev(ROWS));
const CONT = await ev(`SS_T('contCamp')`);
const fight3 = await ev(`SS_T('fightN', 3)`);
const act1 = await ev(`SS_ACT_N(SS_ACTS[0]).split('·')[0].trim()`);
ok('CONTINUE GAME is rendered at the head of the column — four doors, 429..615, no gap', g.campaign.vis && same(column(g), COLC), JSON.stringify(column(g)));
ok('it reads CONTINUE GAME (contCamp, not the in-run "' + await ev(`SS_T('cont')`) + '")', g.campaign.label === CONT && CONT === 'CONTINUE GAME' && CONT !== await ev(`SS_T('cont')`), g.campaign.label);
ok('…carries "' + act1 + ' · ' + fight3 + '" under it (progress, not flavour) and lifts 9',
  g.campaign.sub === act1 + '  ·  ' + fight3 && g.campaign.lift === 9, JSON.stringify(g.campaign));
ok('…and is fully alive: lit, input on, hand cursor', g.campaign.hit && g.campaign.hand && g.campaign.alpha === 1 && g.campaign.labA === 1, JSON.stringify(g.campaign));
await snap('campaign-checkpoint');
// a REAL tap on CONTINUE → the star chart at fight 3 → the node → the ascent resumes THAT fight
await tap(`${H}.rowLabels.campaign`);
ok('a real tap on CONTINUE GAME opens the star chart (no sign sheet — the sign is pinned)', await until(`!!${H}.mapC && !${H}.signC`, 5000));
// v0.80.0: the entry ride runs first — wait for the camera to land (the
// zone is born at settle), then tap the settled node
await until(`!!(${H}.mapC && ${H}.mapC.list.find(o => o.type === 'Container' && o.getData('mapZone')))`, 15000);
await tap(`${H}.mapC.list.find(o => o.type === 'Container' && o.getData('mapZone')).getData('mapZone')`);
ok('tapping the glowing node resumes the climb', await until(`${H}.ascending === true || game.scene.isActive('battle')`, 8000));
ok('…at the checkpoint\'s own fight (fightIdx 2 = fight 3 of 5)', await until(`(() => { const b = game.scene.getScene('battle');
  return game.scene.isActive('battle') && !!b && !!b.run && b.run.fightIdx === 2 && b.mode === 'campaign' })()`, 30000),
  await ev(`(() => { const b = game.scene.getScene('battle'); return b && b.run ? b.mode + '/' + b.run.fightIdx : 'no run' })()`));

// ---------------------------------------------------------------- NEW GAME over a checkpoint → the restart sheet
await ev(`localStorage.setItem('beta3.campaign', ${CK}); 1`);
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands again with the checkpoint', await until(HOME_REST)); await sleep(800);
await tap(`${H}.rowLabels.newcamp`);
ok('a real tap on NEW GAME (aimed at the label) opens the restart sheet', await until(`!!${H}.confirmC`, 5000));
await sleep(400);
// ssTextBlock renders one Text per line inside a container (v0.44.0) — read the sheet's words recursively, lines joined
const sheet = JSON.parse(await ev(`JSON.stringify((function walk(c) { return c.list.flatMap(o => o.type === 'Text' ? [o.text] : o.list ? [walk(o).join(' ').split(' ').filter(Boolean).join(' ')] : []) })(${H}.confirmC))`));
ok('the sheet says "' + await ev(`SS_T('restartBody')`) + '"', sheet.includes(await ev(`SS_T('restartBody')`)), JSON.stringify(sheet));
ok('…with BACK and NEW', sheet.includes(await ev(`SS_T('restartBack')`)) && sheet.includes(await ev(`SS_T('restartNew')`)));
await snap('restart-sheet');
await tap(`${H}.confirmC.list.find(o => o.type === 'Text' && o.text === SS_T('restartBack'))`);
ok('BACK dismisses to the meadow', await until(`!${H}.confirmC && !${H}.signC && !${H}.mapC`, 5000));
await sleep(400);
g = JSON.parse(await ev(ROWS));
ok('…with the climb intact: the checkpoint still stands and the door still heads the column',
  await ev(`JSON.parse(localStorage.getItem('beta3.campaign')).fightIdx === 2`) === true && g.campaign.vis && g.campaign.hit && same(column(g), COLC), JSON.stringify(g.campaign));
await tap(`${H}.rowLabels.newcamp`);
ok('NEW GAME again → the sheet again', await until(`!!${H}.confirmC`, 5000));
await sleep(400);
await tap(`${H}.confirmC.list.find(o => o.type === 'Text' && o.text === SS_T('restartNew'))`);
ok('NEW wipes the climb and opens the sign sheet — the normal fresh flow', await until(`!!${H}.signC && !${H}.confirmC`, 5000));
ok('the old checkpoint is GONE', await ev(`localStorage.getItem('beta3.campaign') === null`) === true);
await sleep(700);   // the 220ms reflow glide settles behind the sheet
g = JSON.parse(await ev(ROWS));
ok('…and the door VANISHES at once — not rendered, and the column closes to 454/522/590',
  !g.campaign.vis && !g.campaign.hit && same(column(g), COLN), JSON.stringify({ vis: g.campaign.vis, col: column(g) }));

// ---------------------------------------------------------------- an older build's checkpoint (no actIdx)
await ev(`localStorage.setItem('beta3.campaign', JSON.stringify({ fightIdx: 7, hp: 9, hpMax: 12, sigils: [], words: [] })); 1`);
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands on an older build\'s checkpoint (no actIdx)', await until(HOME_REST)); await sleep(800);
g = JSON.parse(await ev(ROWS));
const act2 = await ev(`SS_ACT_N(SS_ACTS[1]).split('·')[0].trim()`);
ok('the door is rendered, alive, and re-derives the act: "' + act2 + ' · ' + await ev(`SS_T('fightN', 3)`) + '"', g.campaign.vis && g.campaign.hit && g.campaign.sub === act2 + '  ·  ' + fight3, JSON.stringify(g.campaign));
ok('a garbage checkpoint reads as none', await ev(`(() => { localStorage.setItem('beta3.campaign', '"x"'); const r = ${H}.campaignCheckpoint() === null;
  localStorage.setItem('beta3.campaign', '{"hp":3}'); return r && ${H}.campaignCheckpoint() === null })()`) === true);

// ---------------------------------------------------------------- a won campaign → the door goes on the way home (dawn)
await ev(`localStorage.setItem('beta3.campaign', ${CK}); 1`);
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands for the win', await until(HOME_REST)); await sleep(600);
// hold every sigil and clear the queues first: a discovery's forge ceremony
// (veil 0.985) arriving a beat after the dawn grass holds Home.busy() — the
// HOME_REST wait below would time out and the dawn snapshot would go black
// (it did, 2026-08-25, back when the tagline was measured here)
await ev(`(() => { if (SS.prof.sig) { SS.prof.sig.pend = []; for (const s of SS_SIGILS) SS.prof.sig.u[s.id] = SS.prof.sig.u[s.id] || 1; }
  if (SS.prof.streak) SS.prof.streak.pend = 0; SS.save && SS.save(); return 1 })()`);
ok('the door heads the column before the win', JSON.parse(await ev(ROWS)).campaign.vis);
await ev(`(() => { const h = ${H}; h.bloomBtn = h.rowBtns.campaign; h.startMode('campaign'); return 1 })()`);
ok('the climb resumes', await until(`(() => { const b = game.scene.getScene('battle'); return game.scene.isActive('battle') && !!b && !!b.run })()`, 30000));
await sleep(1500);
// the last fight falls: the run ends won, the checkpoint clears, HOME brings the dawn meadow
await ev(`(() => { const b = game.scene.getScene('battle'); b.run.fightIdx = b.fights.length; ssClearCampaign(); b.endRun(true); return 1 })()`);
ok('the campaign is won: checkpoint cleared', await until(`localStorage.getItem('beta3.campaign') === null`, 5000));
await sleep(3000);
await ev(`(() => { const b = game.scene.getScene('battle'); b.goHome({ from: 'battle', dawn: true }); return 1 })()`);
ok('home again after the win', await until(HOME_REST, 40000)); await sleep(1200);
g = JSON.parse(await ev(ROWS));
ok('…and CONTINUE GAME is gone, the column closed: nothing left to continue', !g.campaign.vis && !g.campaign.hit && same(column(g), COLN), JSON.stringify(column(g)));
await noTag('dawn');
await snap('dawn-meadow');

// ---------------------------------------------------------------- the doors, real taps at the label
await ev(`localStorage.removeItem('beta3.campaign'); localStorage.removeItem('beta3.campsign'); 1`);
await nav(BASE + '?fps=0', 12000);
ok('meadow back for the doors', await until(HOME_REST)); await sleep(600);
await tap(`${H}.rowLabels.newcamp`);
ok('NEW GAME (no checkpoint) → straight to the sign sheet, no warning sheet', await until(`!!${H}.signC`, 5000) && await ev(`!${H}.confirmC`) === true);
await sleep(400);
// …and all the way in: the classic climb boots a run off a REAL tap chain
// v0.57.0 rebuilt the picker as CARDS: THE OPEN SKY is the first card and
// BEGIN takes the visible one — the old zpSkip line is gone from the sheet
// (this suite slept through that release; endless-check taps the same door)
await tap(`(() => { const h = ${H}; let r = null; const scan = (ls) => ls.forEach((o) => { if (!r && o.text === SS_T('zpBegin')) r = o; if (o.list) scan(o.list); }); scan(h.signC.list); return r })()`);
ok('…BEGIN on THE OPEN SKY → the star chart', await until(`!!${H}.mapC && !${H}.signC`, 5000));
// v0.80.0: the entry ride runs first — wait for the camera to land (the
// zone is born at settle), then tap the settled node
await until(`!!(${H}.mapC && ${H}.mapC.list.find(o => o.type === 'Container' && o.getData('mapZone')))`, 15000);
await tap(`${H}.mapC.list.find(o => o.type === 'Container' && o.getData('mapZone')).getData('mapZone')`);
ok('…the glowing node → NEW GAME boots the climb for real', await until(`(() => { const b = game.scene.getScene('battle');
  return (${H}.ascending === true) || (game.scene.isActive('battle') && !!b && !!b.run && b.mode === 'campaign') })()`, 30000));
await nav(BASE + '?fps=0', 12000); ok('meadow back', await until(HOME_REST)); await sleep(600);
await tap(`${H}.rowLabels.versus`);
ok('VERSUS → the versus menu', await until(`game.scene.isActive('vsmenu')`, 8000));
// the quick-play seam the harnesses keep: ?quick=1 boots straight into a quick run
await nav(BASE + '?fps=0&quick=1', 12000);
ok('?quick=1 boots straight into a quick run (no intro, no meadow tap)', await until(`(() => { const b = game.scene.getScene('battle');
  return game.scene.isActive('battle') && !!b && b.mode === 'quick' && !!b.board && b.board.filter(Boolean).length === 16 })()`, 30000));

// ---------------------------------------------------------------- two more languages, both states
await nav(BASE + '?fps=0&lang=de', 12000);
ok('the German meadow stands', await until(HOME_REST)); await sleep(600);
g = JSON.parse(await ev(ROWS));
ok('de, no checkpoint: NEUES SPIEL heads a three-row column, CONTINUE not rendered',
  !g.campaign.vis && g.newcamp.label === 'NEUES SPIEL' && same(column(g), COLN), JSON.stringify({ label: g.newcamp.label, col: column(g) }));
await noTag('de');
await ev(`localStorage.setItem('beta3.campaign', ${CK}); 1`);
await nav(BASE + '?fps=0&lang=es', 12000);
ok('the Spanish meadow stands', await until(HOME_REST)); await sleep(600);
g = JSON.parse(await ev(ROWS));
ok('es, with checkpoint: CONTINUAR PARTIDA heads the four-row column, alive with its progress line',
  g.campaign.vis && g.campaign.hit && g.campaign.label === 'CONTINUAR PARTIDA' && g.newcamp.label === 'NUEVA PARTIDA' && !!g.campaign.sub && same(column(g), COLC),
  JSON.stringify({ cont: g.campaign.label, neu: g.newcamp.label, col: column(g) }));
await noTag('es');
await ev(`localStorage.removeItem('beta3.campaign'); localStorage.removeItem('beta3.campsign'); localStorage.removeItem('beta3.lang'); 1`);

ok('the whole run threw no page exceptions', errs.length === 0, errs.join(' | ').slice(0, 300));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
