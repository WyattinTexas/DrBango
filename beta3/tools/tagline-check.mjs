// TAGLINE-CHECK — the meadow buttons without their flavour lines (v0.46.0)
// + THE CAMPAIGN DOORS (v0.47.0): the first door reads CONTINUE CAMPAIGN in
// every state — grey (0.45) and DEAD (input off, a real tap does nothing)
// without a checkpoint, alive and resuming the right fight with one; NEW
// CAMPAIGN goes straight to the stars with no checkpoint, and with one opens
// the restart sheet — BACK keeps the climb, NEW wipes it and the door greys.
// A just-won campaign (checkpoint cleared) greys the door on the way home, and
// an older build's checkpoint without an actIdx still opens the door.
//
// Wyatt: "remove the text below CAMPAIGN, NEW CAMPAIGN, QUICK PLAY and
// VERSUS." This pins what replaced them: the four labels sit dead-centre in
// 58-tall buttons with nothing under them; the ONLY sub-lines left are live
// information — versus's "✦ N of your friends online" while friends are on,
// the campaign's "fight N of 5" while a checkpoint stands — and a label
// glides up 9 to make room when one arrives and back down when it goes.
// LEADERBOARD (46 tall, never had one) and the daily chip are untouched,
// all four doors still open on a REAL tap aimed at the label, and the four
// retired string keys are gone from every language.
//
// Run from beta3/ with the folder served on :8899 and a --disable-gpu Chrome
// on :9444 (nothing here forces a renderer). BEFORE=<url of a served HEAD
// copy> adds a before/after meadow snapshot pair; SHOTS=<dir> keeps them.
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
await send('Page.addScriptToEvaluateOnNewDocument', { source: 'navigator.share = undefined;' });
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
const tap = async (expr) => {
  const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
const HOME_REST = `!!window.game && game.scene.isActive('home')
  && !game.scene.getScene('home').introPlaying && !!game.scene.getScene('home').lanternB && !game.scene.getScene('home').busy()`;
const H = `game.scene.getScene('home')`;
// geometry of the five rows, in design units (l.u(1) = one unit)
const ROWS = `(() => { const h = ${H}; const u = h.sky ? (h.lanternB.displayWidth / ${'SS_LANTERN_W'}) : 1;
  const U = h.rowBtns.versus.displayWidth / 300;
  const row = (k) => { const b = h.rowBtns[k], t = h.rowLabels[k], s = h.rowSubs[k];
    return { h: +(b.displayHeight / U).toFixed(1), lift: +((b.y - t.y) / U).toFixed(1), label: t.text,
      sub: s ? (s.visible ? s.text : null) : undefined, subColor: s && s.visible ? s.style.color : null, hit: !!b.input && b.input.enabled,
      alpha: +b.alpha.toFixed(2), labA: +t.alpha.toFixed(2), hand: !!b.input && b.input.cursor === 'pointer' }; };
  const board = h.uiItems.find(o => o.type === 'Image' && Math.abs(o.displayWidth / U - 300) < 0.5 && Math.abs(o.displayHeight / U - 46) < 0.5);
  return JSON.stringify({ campaign: row('campaign'), newcamp: row('newcamp'), quick: row('quick'), versus: row('versus'),
    board: board ? +(board.displayHeight / U).toFixed(1) : null, daily: h.dailyChipT.text,
    flavour: h.children.list.filter(o => o.type === 'Text' && /four acts|long night anew|then the Star Eater|duel beneath/.test(o.text)).length }) })()`;
const snap = async (name) => {
  if (!SHOTS) return;
  const data = await ev(`new Promise(res => game.renderer.snapshot(img => res(img.src)))`);
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(SHOTS + '/' + name + '.png', Buffer.from(data.split(',')[1], 'base64'));
};

// ---------------------------------------------------------------- before
if (BEFORE && SHOTS) {
  await nav(BEFORE + '?fps=0', 12000);
  if (await until(HOME_REST)) { await sleep(800); await snap('meadow-before'); console.log('  · before snapshot taken'); }
}

// ---------------------------------------------------------------- boot, clean
errs.length = 0;   // the BEFORE page's own boot noise is not ours to answer for
await nav(BASE + '?fps=0', 12000);
await ev(`localStorage.removeItem('beta3.campaign'); localStorage.removeItem('beta3.campsign'); 1`);
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands', await until(HOME_REST));
await sleep(800);
let g = JSON.parse(await ev(ROWS));
ok('none of the four flavour lines is anywhere on the meadow', g.flavour === 0, String(g.flavour));
for (const k of ['campaign', 'newcamp', 'quick', 'versus'])
  ok(k + ': 58-tall button, label dead-centre, no sub-line showing', g[k].h === 58 && g[k].lift === 0 && !g[k].sub && (k === 'campaign' || g[k].hit), JSON.stringify(g[k]));
ok('NEW CAMPAIGN and QUICK PLAY have no sub slot at all', g.newcamp.sub === undefined && g.quick.sub === undefined);
ok('LEADERBOARD untouched: still its 46-tall row', g.board === 46, String(g.board));
ok('the daily chip still carries its countdown / tick', !!g.daily && g.daily.length > 1, g.daily);
const CONT = await ev(`SS_T('contCamp')`);
ok('the first door reads CONTINUE CAMPAIGN (its own key, not the in-run "' + await ev(`SS_T('cont')`) + '")', g.campaign.label === CONT && CONT !== await ev(`SS_T('cont')`), g.campaign.label);
ok('no checkpoint → the door wears the disabled dress: button 0.45, label 0.55', g.campaign.alpha === 0.45 && g.campaign.labA === 0.55, JSON.stringify(g.campaign));
ok('…and its input is OFF (taps dead)', !g.campaign.hit);
ok('the other three doors are alive and fully lit', ['newcamp', 'quick', 'versus'].every(k => g[k].hit && g[k].alpha === 1));
await tap(`${H}.rowLabels.campaign`);
await sleep(900);
ok('a REAL tap on the dead CONTINUE door opens nothing (no sign sheet, no map, no ascent)',
  await ev(`!${H}.signC && !${H}.mapC && !${H}.confirmC && !${H}.ascending`) === true);
await snap('meadow-after');

// ---------------------------------------------------------------- the four retired keys
const keys = JSON.parse(await ev(`JSON.stringify(Object.keys(SS_STR).map(L => [L,
  ['campaignSub','newCampSub','quickSub','versusSub'].filter(k => k in SS_STR[L]), 'vsFriendsOn' in SS_STR[L], 'fightN' in SS_STR[L]]))`));
ok('ten languages loaded', keys.length === 10, String(keys.length));
ok('campaignSub / newCampSub / quickSub / versusSub pruned from every language', keys.every(k => k[1].length === 0), JSON.stringify(keys.filter(k => k[1].length)));
ok('vsFriendsOn and fightN kept in every language', keys.every(k => k[2] && k[3]));

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
ok('the other three rows did not move', g.campaign.lift === 0 && g.newcamp.lift === 0 && g.quick.lift === 0);
await snap('versus-friends-on');
ok('three friends: the count follows the presence layer', await ev(FRIENDS(3)) === 3 && (await sleep(100), JSON.parse(await ev(ROWS)).versus.sub === await ev(`SS_T('vsFriendsOn', 3)`)));
ok('the friends log off', await ev(FRIENDS(0)) === 0);
await sleep(400);
g = JSON.parse(await ev(ROWS));
ok('the counter goes and the label re-centres — no orphaned gap', g.versus.sub === null && g.versus.lift === 0, JSON.stringify(g.versus));

// ---------------------------------------------------------------- a checkpoint → the door wakes
const CK = `JSON.stringify({ fightIdx: 2, actIdx: 0, hp: 12, hpMax: 12, sigils: [], words: [], longest: '', totalDmg: 0, scried: 0, featherUsed: 0, letters: 0, bigHit: 0, playMs: 0, overkill: 0 })`;
await ev(`localStorage.setItem('beta3.campaign', ${CK}); 1`);
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands with a checkpoint', await until(HOME_REST));
await sleep(800);
g = JSON.parse(await ev(ROWS));
const fight3 = await ev(`SS_T('fightN', 3)`);
const act1 = await ev(`SS_ACT_N(SS_ACTS[0]).split('·')[0].trim()`);
ok('CONTINUE CAMPAIGN carries "' + act1 + ' · ' + fight3 + '" under it (progress, not flavour) and lifts 9',
  g.campaign.sub === act1 + '  ·  ' + fight3 && g.campaign.lift === 9 && g.campaign.label === CONT, JSON.stringify(g.campaign));
ok('…and is fully alive: lit, input on, hand cursor', g.campaign.hit && g.campaign.hand && g.campaign.alpha === 1 && g.campaign.labA === 1, JSON.stringify(g.campaign));
ok('the other rows stay centred', g.newcamp.lift === 0 && g.quick.lift === 0 && g.versus.lift === 0);
await snap('campaign-checkpoint');
// a REAL tap on CONTINUE → the star chart at fight 3 → the node → the ascent resumes THAT fight
await tap(`${H}.rowLabels.campaign`);
ok('a real tap on CONTINUE CAMPAIGN opens the star chart (no sign sheet — the sign is pinned)', await until(`!!${H}.mapC && !${H}.signC`, 5000));
await sleep(600);
await tap(`${H}.mapC.list.find(o => o.type === 'Container' && o.getData('mapZone')).getData('mapZone')`);
ok('tapping the glowing node resumes the climb', await until(`${H}.ascending === true || game.scene.isActive('battle')`, 8000));
ok('…at the checkpoint\'s own fight (fightIdx 2 = fight 3 of 5)', await until(`(() => { const b = game.scene.getScene('battle');
  return game.scene.isActive('battle') && !!b && !!b.run && b.run.fightIdx === 2 && b.mode === 'campaign' })()`, 30000),
  await ev(`(() => { const b = game.scene.getScene('battle'); return b && b.run ? b.mode + '/' + b.run.fightIdx : 'no run' })()`));

// ---------------------------------------------------------------- NEW CAMPAIGN over a checkpoint → the restart sheet
await ev(`localStorage.setItem('beta3.campaign', ${CK}); 1`);
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands again with the checkpoint', await until(HOME_REST)); await sleep(800);
await tap(`${H}.rowLabels.newcamp`);
ok('a real tap on NEW CAMPAIGN (aimed at the label) opens the restart sheet', await until(`!!${H}.confirmC`, 5000));
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
ok('…with the climb intact: the checkpoint still stands and the door is still alive at fight 3',
  await ev(`JSON.parse(localStorage.getItem('beta3.campaign')).fightIdx === 2`) === true && g.campaign.hit && g.campaign.sub === act1 + '  ·  ' + fight3, JSON.stringify(g.campaign));
await tap(`${H}.rowLabels.newcamp`);
ok('NEW CAMPAIGN again → the sheet again', await until(`!!${H}.confirmC`, 5000));
await sleep(400);
await tap(`${H}.confirmC.list.find(o => o.type === 'Text' && o.text === SS_T('restartNew'))`);
ok('NEW wipes the climb and opens the sign sheet — the normal fresh flow', await until(`!!${H}.signC && !${H}.confirmC`, 5000));
ok('the old checkpoint is GONE', await ev(`localStorage.getItem('beta3.campaign') === null`) === true);
await sleep(400);
g = JSON.parse(await ev(ROWS));
ok('…and the door greys at once: progress line gone, label re-centred, input off, 0.45',
  g.campaign.sub === null && g.campaign.lift === 0 && g.campaign.label === CONT && !g.campaign.hit && g.campaign.alpha === 0.45, JSON.stringify(g.campaign));

// ---------------------------------------------------------------- an older build's checkpoint (no actIdx)
await ev(`localStorage.setItem('beta3.campaign', JSON.stringify({ fightIdx: 7, hp: 9, hpMax: 12, sigils: [], words: [] })); 1`);
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands on an older build\'s checkpoint (no actIdx)', await until(HOME_REST)); await sleep(800);
g = JSON.parse(await ev(ROWS));
const act2 = await ev(`SS_ACT_N(SS_ACTS[1]).split('·')[0].trim()`);
ok('the door is alive and re-derives the act: "' + act2 + ' · ' + await ev(`SS_T('fightN', 3)`) + '"', g.campaign.hit && g.campaign.sub === act2 + '  ·  ' + fight3, JSON.stringify(g.campaign));
ok('a garbage checkpoint reads as none', await ev(`(() => { localStorage.setItem('beta3.campaign', '"x"'); const r = ${H}.campaignCheckpoint() === null;
  localStorage.setItem('beta3.campaign', '{"hp":3}'); return r && ${H}.campaignCheckpoint() === null })()`) === true);

// ---------------------------------------------------------------- a won campaign → the door greys on the way home
await ev(`localStorage.setItem('beta3.campaign', ${CK}); 1`);
await nav(BASE + '?fps=0', 12000);
ok('the meadow stands for the win', await until(HOME_REST)); await sleep(600);
ok('the door is alive before the win', JSON.parse(await ev(ROWS)).campaign.hit);
await ev(`(() => { const h = ${H}; h.bloomBtn = h.rowBtns.campaign; h.startMode('campaign'); return 1 })()`);
ok('the climb resumes', await until(`(() => { const b = game.scene.getScene('battle'); return game.scene.isActive('battle') && !!b && !!b.run })()`, 30000));
await sleep(1500);
// the last fight falls: the run ends won, the checkpoint clears, HOME brings the dawn meadow
await ev(`(() => { const b = game.scene.getScene('battle'); b.run.fightIdx = b.fights.length; ssClearCampaign(); b.endRun(true); return 1 })()`);
ok('the campaign is won: checkpoint cleared', await until(`localStorage.getItem('beta3.campaign') === null`, 5000));
await sleep(3000);
await ev(`(() => { const b = game.scene.getScene('battle'); b.goHome({ from: 'battle', dawn: true }); return 1 })()`);
ok('home again after the win', await until(HOME_REST, 40000)); await sleep(800);
g = JSON.parse(await ev(ROWS));
ok('…and the CONTINUE door is grey and dead: nothing left to continue', !g.campaign.hit && g.campaign.alpha === 0.45 && g.campaign.sub === null && g.campaign.lift === 0, JSON.stringify(g.campaign));

// ---------------------------------------------------------------- all four doors, real taps at the label
await ev(`localStorage.removeItem('beta3.campaign'); localStorage.removeItem('beta3.campsign'); 1`);
await nav(BASE + '?fps=0', 12000);
ok('meadow back for the doors', await until(HOME_REST)); await sleep(600);
await tap(`${H}.rowLabels.newcamp`);
ok('NEW CAMPAIGN (no checkpoint) → straight to the sign sheet, no warning sheet', await until(`!!${H}.signC`, 5000) && await ev(`!${H}.confirmC`) === true);
await nav(BASE + '?fps=0', 12000); ok('meadow back', await until(HOME_REST)); await sleep(600);
await tap(`${H}.rowLabels.versus`);
ok('VERSUS → the versus menu', await until(`game.scene.isActive('vsmenu')`, 8000));
await nav(BASE + '?fps=0', 12000); ok('meadow back', await until(HOME_REST)); await sleep(600);
await tap(`${H}.rowLabels.quick`);
ok('QUICK PLAY → the ascent begins', await until(`${H}.ascending === true || game.scene.isActive('battle')`, 8000));
ok('the whole run threw no page exceptions', errs.length === 0, errs.join(' | ').slice(0, 300));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
