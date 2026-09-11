// VSPAGE-CHECK — THE DUELING GROUND (v0.97.0, the 9/9 UNDER ONE SKY review
// built on Skylar's 9/10 go; challenge-first bones v0.73.0/v0.83.0 kept).
// Skylar (9/9): "We also want to redesign how the versus page looks, right
// now it's kind of empty with a odd sword logo at the top middle of the
// screen. Give me a redesign that looks good." The review's winner: the page
// stands on the shipped sky-world in a versus dress (deeper night, no moon,
// colder aurora, six fireflies), wears the VERSUS wordmark in the gold
// letterpress with drawn blades flanking, THE DUELISTS hero (two authored
// mage asterisms, one shared zenith star that flares while a summons
// stands), promotes the duel ledger to seal-plaques (cap pips, a gold ACCEPT
// plate for incoming challenges, the '+%1 more' fold), seats the presence
// strip (friends online first, night-clocked rivals, circle mages that
// glint but are NEVER labeled online), gives a fresh device the first-visit
// funnel and a blocked sky the ghost ledger — and the U+2694 text emoji is
// swept from every game surface, with the grep gate here so none regrow.
// This suite proves the funnel page ×5 IS exactly its texts, the geometry,
// the hero (fly-once-per-session, still after), the sheet + share + add
// flows through the new doors, the correspondence pending story, the
// worldwide theater, the plaque band, the strip, the offline page, and the
// home door's swept word — on real DPR-3 taps against the live sky (every
// row this run writes is deleted and proven gone at the end).
// Self-launching: serves beta3 on :8899 if nothing does, TWO headless
// Chromes on :9471/:9472 (/tmp/cdp-vspa|b, wiped first — the stale-profile
// law).
//
//   perl -e 'alarm 900; exec @ARGV' node tools/vspage-check.mjs   # ~10 min (the theater's real 8–15s roll rides §7)
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

/* ---------- the source audit (no browser needed) ---------- */
console.log('— THE SOURCE AUDIT —');
const vsSrc = readFileSync('versus.js', 'utf8');
const gmSrc = readFileSync('game.js', 'utf8');
const strSrc = readFileSync('strings.js', 'utf8');
// THE GREP GATE (the review's law): zero U+2694 across the whole served set
// — the sweep cannot silently regrow. The strings, the code, the page.
const SERVED = ['index.html', 'compat.js', 'words.js', 'strings.js', 'packs.js', 'data.js', 'seed-names.js', 'net.js', 'audio.js', 'game.js', 'versus.js', 'rival.js', 'lab.js'];
const swordCount = SERVED.map((f) => [f, (readFileSync(f, 'utf8').match(/⚔/g) || []).length]);
ok('THE GREP GATE: zero U+2694 anywhere in the served set (' + SERVED.length + ' files)',
  swordCount.every(([, n]) => n === 0), swordCount.filter(([, n]) => n > 0).map(([f, n]) => f + '×' + n).join(' '));
ok("the home button's word is plain VERSUS in every language (the wordmark localizes it for free)",
  (strSrc.match(/versus: 'VERSUS',/g) || []).length === 5);
ok('the swept keys carry no emoji in any tongue: vsInDuel · vsAgain · vsBotAnswered · vsAnswered · smTitle · vsLang',
  ['vsInDuel', 'vsAgain', 'vsBotAnswered', 'vsAnswered', 'smTitle', 'vsLang']
    .every((k) => [...strSrc.matchAll(new RegExp(k + ": '((?:[^'\\\\]|\\\\.)*)'", 'g'))].length === 5));
ok("the trophy grid's glyph seam: rival-star wears '@blades' in data.js and the grid draws the baked art for it",
  /'rival-star', icon: '@blades'/.test(readFileSync('data.js', 'utf8')) && /icon === '@blades'/.test(gmSrc) && /vsSwordsTex\(this\)/.test(gmSrc));
ok('the home door label wears flanking drawn blades that ride every reflow',
  /lab\.vsGlyphs = \[-1, 1\]\.map/.test(gmSrc) && (gmSrc.match(/lab\.vsGlyphs|m\.lab\.vsGlyphs/g) || []).length >= 3);
// the dueling ground's world dress
ok('the sky-world wears a versus dress: deeper framing, no moon, colder aurora, six fireflies, night veil, procedural crest',
  /opts\.versus \? 150 : 0/.test(gmSrc) && /!opts\.dawn && !opts\.versus/.test(gmSrc)
  && /opts\.versus \? 6 : 12/.test(gmSrc) && /if \(opts\.versus\) scene\.add\.rectangle/.test(gmSrc)
  && /&& !opts\.versus;/.test(gmSrc) && /0x4a6ae0/.test(gmSrc));
ok('the page stands on ssSkyWorld (the flat 90-dot starfield is gone from VsMenu)',
  /ssSkyWorld\(this, \{ versus: true/.test(vsSrc) && !/ssStarfield\(this, 90\)/.test(vsSrc));
ok('THE DUELISTS: the authored 11-star chart, the fly-once beacon, the mirrored pair, the shared zenith star',
  /const VS_MAGE = \{/.test(vsSrc) && (vsSrc.match(/\[-58, -56\]/) != null)
  && /window\.__ssVsHeroSeen/.test(vsSrc) && /this\.heroFly = fly/.test(vsSrc)
  && /cont\.setScale\(-1, 1\)/.test(vsSrc) && /'spark4'/.test(vsSrc));
ok('the wordmark is the swept home string in the gold letterpress bake, blades flanking',
  /ssGoldTex\(this, SS_T\('versus'\), 23\)/.test(vsSrc));
ok('the plaque rim is a pre-baked texture breathed by alpha tween only (never a per-frame stroke)',
  /function vsPlaqRimTex/.test(vsSrc) && /vsPlaqRimTex\(this\)/.test(vsSrc)
  && /targets: rim, alpha: \{ from/.test(vsSrc));
ok('every menu door still seals turns only', /this\.match\('turns'\)/.test(vsSrc)
  && (vsSrc.match(/vsSealRoom\(code, 'turns'/g) || []).length >= 2 && /FR\.challenge\(f\.id, code, 'turns'\)/.test(vsSrc));
ok('the dead beta3.vsmode key is still swept', /removeItem\('beta3\.vsmode'\)/.test(vsSrc));
ok('VS_APP_URL is the TestFlight door and the app invite rides it',
  /VS_APP_URL = 'https:\/\/testflight\.apple\.com\/join\/Hxs8e7fU'/.test(vsSrc)
  && /vsShare\(SS_T\('vsAppText', vsName\(\), vsName\(\)\), VS_APP_URL\)/.test(vsSrc) && !/vsFriendUrl/.test(vsSrc));
ok('the drawn crossed-blades glyph is baked art (vsSwordsTex through ssBake) and dresses rows, plaques, banners, rematch',
  /function vsSwordsTex/.test(vsSrc) && /ssBake\(t, key, D, D/.test(vsSrc) && (vsSrc.match(/vsSwordsTex\(this\)/g) || []).length >= 5);
ok('the floor band stays gone: no vsOrReach, no namePrompt/codePrompt/seekByName',
  !/vsOrReach|namePrompt|codePrompt|seekByName/.test(vsSrc));
ok('the foot anchors by computation (the safe-band law)',
  /safeB = 400 \+ \(l\.H - \(SS_INSET\.top \+ SS_INSET\.bottom\) \* DPR\) \/ \(2 \* l\.s\)/.test(vsSrc));
const NEW_KEYS = ['vsAsync', 'vsChFriend', 'vsChFriendSub', 'vsChWorld', 'vsChWorldSub', 'vsInviteNew', 'vsInviteNewSub', 'vsAppText', 'vsAddSelf', 'vsShareFail',
  'vsSearching', 'vsFound', 'vsWaitDuel', 'vsYourMove', 'vsTheirMove', 'vsPendDone', 'vsBotAnswered', 'vsAnswered', 'vsDuelStands',
  // 9/10 UNDER ONE SKY — the dueling ground's own words
  'vsDuelsHead', 'vsTonight', 'vsSumRow', 'vsDuelTag', 'vsAllMages', 'vsAddFriend', 'vsAddFriendSub', 'vsGhost', 'vsRetry', 'vsVict'];
const OLD_KEYS = ['vsInvite', 'vsInviteSub', 'vsFind', 'vsFindSub', 'vsTurnsSub', 'vsTimedSub', 'vsBgSub', 'vsFriendLink', 'vsFriendText',
  'vsAs', 'vsOrSeal', 'vsOrReach', 'vsByName', 'vsSeal', 'vsNameSelf', 'vsColdSeal', 'lobbyTitle', 'lobbySub'];
ok('all thirty page keys ship exactly five times (one per language)',
  NEW_KEYS.every((k) => (strSrc.match(new RegExp(k + ':', 'g')) || []).length === 5),
  NEW_KEYS.map((k) => k + '×' + (strSrc.match(new RegExp(k + ':', 'g')) || []).length).filter((s) => !/×5$/.test(s)).join(' '));
ok('no retired key survives in any language',
  OLD_KEYS.every((k) => !new RegExp('[^a-zA-Z]' + k + ':').test(strSrc)),
  OLD_KEYS.filter((k) => new RegExp('[^a-zA-Z]' + k + ':').test(strSrc)).join(','));
ok('the searching theater is real: the rolled beat, the found gate, the ticking clock',
  /T_MIN: 8000, T_SPREAD: 7000/.test(vsSrc) && /buildTheater/.test(vsSrc) && /foundBeat/.test(vsSrc) && /searchClockT/.test(vsSrc));
ok('the harness seams stand: ?vsfind pins the roll, ?botpace shrinks the reply rhythm',
  /QS\.get\('vsfind'\)/.test(vsSrc) && /QS\.get\('botpace'\)/.test(readFileSync('rival.js', 'utf8')));
ok('the near sky + the plaque rows are in the served set', /SS_NEAR/.test(vsSrc) && /VS_PEND/.test(vsSrc) && /pendRows/.test(vsSrc));
// 9/3 feedback card 01: the summons copy wears two sparkles (unchanged law —
// the ✨ is share TEXT, Skylar's stamp; the no-emoji law governs game ART)
const ANSWER_TAILS = /to answer|para responder|pour répondre|um zu antworten/;
const grabVals = (re) => [...strSrc.matchAll(re)].map((m) => m[1]);
const shareVals = grabVals(/vsShareText: '((?:[^'\\]|\\.)*)'/g);
const appVals = grabVals(/vsAppText: '((?:[^'\\]|\\.)*)'/g);
ok("en vsShareText is Skylar's stamped wording exactly",
  shareVals[0] === '%1 summons you to a STARSPELL duel ✨ tap ✨', shareVals[0]);
ok('vsShareText ×5: two ✨, no dash, no colon, no "to answer" tail',
  shareVals.length === 5 && shareVals.every((v) => (v.match(/✨/g) || []).length === 2 && !/[—:]/.test(v) && !ANSWER_TAILS.test(v)),
  shareVals.join(' | '));
ok('vsAppText ×5 wears the matching treatment: two ✨, no dash, no colon, the name twice',
  appVals.length === 5 && appVals.every((v) => (v.match(/✨/g) || []).length === 2 && !/[—:]/.test(v) && !ANSWER_TAILS.test(v) && v.includes('%1') && v.includes('%2')),
  appVals.join(' | '));

/* ---------- server + two browsers ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
for (const p of ['/tmp/cdp-vspa', '/tmp/cdp-vspb']) { try { execSync('rm -rf ' + p); } catch (e) { } }
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
  const park = async () => { await send('Page.navigate', { url: 'about:blank' }); await sleep(600); };
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
  const tapUntil = async (expr, cond, cap = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < cap) {
      try { await tap(expr); } catch (e) { }
      if (await until(cond, 2500)) return true;
    }
    return false;
  };
  const type = (text) => send('Input.insertText', { text });
  const key = async (k, code) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: k === 'Escape' ? 27 : 13 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: k === 'Escape' ? 27 : 13 });
  };
  return { ev, seed, nav, park, until, tap, tapUntil, type, key, send, tag };
}
const [A, B] = await Promise.all([client(9471, '/tmp/cdp-vspa', 'A'), client(9472, '/tmp/cdp-vspb', 'B')]);
const toDelete = new Set();
const codes = new Set();
const BOOT = (uid, name) => `navigator.share = undefined; navigator.clipboard = undefined;
  try { sessionStorage.setItem('beta3.skipIntro', '1'); if (localStorage.getItem('vp.seeded') !== '${uid}') { localStorage.clear(); localStorage.setItem('vp.seeded', '${uid}');
    localStorage.setItem('starspellUid', '${uid}'); ${name ? `localStorage.setItem('starspellName', ${JSON.stringify(name)});` : ''} } } catch (e) {}`;
const READY = `SSNET.mode === 'firebase' && !!window.game && game.scene.isActive('home') && !!game.scene.getScene('home').dailyChipB`;
// the world door stands in EVERY online state (the funnel promotes it, the
// full ground keeps it) — it is the page sentinel now
const MENU = `game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').chWorldB`;
const SHEET = `!!game.scene.getScene('vsmenu').socialC && !!game.scene.getScene('vsmenu').recentRows && !!game.scene.getScene('vsmenu').frRows`;
const INPUT = `!!document.getElementById('ss-overlay-input') && document.activeElement === document.getElementById('ss-overlay-input')`;
const toMenu = async (c) => { await c.ev(`game.scene.getScene('home').scene.start('vsmenu'); 1`); const r = await c.until(MENU, 20000); await sleep(600); return r; };
// duels-state sheet door; the funnel reaches the sheet through ADD BY NAME
const openSheet = async (c) => c.tapUntil(`game.scene.getScene('vsmenu').chFriendB`, SHEET, 12000);
const openSheetFunnel = async (c) => {
  if (!await c.tapUntil(`game.scene.getScene('vsmenu').addDoorB`, SHEET + ' && ' + INPUT, 12000)) return false;
  await c.key('Escape', 'Escape');   // Escape adds no one — the sheet stands
  return c.until(SHEET + ` && !document.getElementById('ss-overlay-input')`, 6000);
};
const deepTexts = (c) => c.ev(`JSON.stringify((() => { const out = [];
  const walk = (list) => list.forEach(o => { if (o.text !== undefined && o.text) out.push(o.text); if (o.list) walk(o.list); });
  walk(game.scene.getScene('vsmenu').children.list); return out })())`).then(JSON.parse);
const sheetTexts = (c) => c.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const out = [];
  const walk = (list) => list.forEach(o => { if (o.text !== undefined) out.push(o.text); if (o.list) walk(o.list); });
  walk(s.socialC.list); return out })())`).then(JSON.parse);

/* ---------- 1. the funnel page, in all five languages ---------- */
console.log('— THE FIRST-VISIT FUNNEL ×5 —');
const VPU = 'vp' + rnd();
toDelete.add('players/test_' + VPU); toDelete.add('presence/test_' + VPU); toDelete.add('devices/test_' + VPU);
for (const lang of LANGS) {
  await A.seed(BOOT('x', null));   // mpuid rules the uid; the seed only quiets share/clipboard
  const up = await A.nav(BASE + '?mpuid=' + VPU + '&fps=0&lang=' + lang) && await A.until(READY, 60000) && await toMenu(A);
  if (!up) { ok(lang + ': the page', false, 'boot failed'); continue; }
  const tx = await deepTexts(A);
  const T = await A.ev(`JSON.stringify({ as: SS_T('vsAsync'), nr: SS_T('vsNoRecent'),
    cw: SS_T('vsChWorld'), cws: SS_T('vsChWorldSub'), af: SS_T('vsAddFriend'), afs: SS_T('vsAddFriendSub'),
    inv: SS_T('vsInviteNew'), invs: SS_T('vsInviteNewSub'), chip: '✧ ' + SSNET.myName() })`).then(JSON.parse);
  // the funnel IS exactly these texts — one exact set carries every absence
  // at once: no heading, no doors band, no strip, no whisper, no stray key.
  // ssTextBlock renders the fiction as its body PLUS wrapped lines (the
  // corr-check lesson) — fold every fragment of it out, then compare exact.
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const fic = norm(T.nr);
  const uniq = [...new Set(tx)];
  const sawFic = uniq.some((t) => norm(t).length > 3 && fic.includes(norm(t)));
  const want = JSON.stringify([...new Set(['‹ HOME', T.as, T.cw, T.cws, T.af, T.afs, T.inv, T.invs, T.chip])].sort());
  const got = JSON.stringify(uniq.filter((t) => !fic.includes(norm(t))).sort());
  const good = got === want && sawFic
    && await A.ev(`game.scene.getScene('vsmenu').recentRows === null && game.scene.getScene('vsmenu').socialC === null
      && game.scene.getScene('vsmenu').doorsMode === 'funnel' && !game.scene.getScene('vsmenu').chFriendB`);
  ok(lang + ': the funnel is exactly its texts — fiction high, worldwide promoted, add + invite beneath', good, got.slice(0, 200));
}
for (const lang of LANGS) {
  const r = await A.ev(`JSON.stringify((() => { const t = SS_STR['${lang}'];
    return { miss: ${JSON.stringify(NEW_KEYS)}.filter(k => !t[k]), old: ${JSON.stringify(OLD_KEYS)}.filter(k => t[k]) } })())`).then(JSON.parse);
  ok(lang + ': all thirty page keys present, every retired key gone', r.miss.length === 0 && r.old.length === 0, JSON.stringify(r));
}

/* ---------- 1b. the ground: wordmark · chip · hero · funnel doors ---------- */
console.log('— THE DUELING GROUND (GEOMETRY) —');
ok('en boot back up', await A.nav(BASE + '?mpuid=' + VPU + '&fps=0&lang=en') && await A.until(READY, 60000) && await toMenu(A));
await sleep(1600);   // the hero's first-visit flight settles
const geo = await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const l = ssLayout(s);
  const wm = s.wordmark; if (!wm) return { missing: 1 };
  const blades = s.children.list.filter(o => o.texture && o.texture.key === 'vsswords');
  const cap = s.children.list.find(o => o.text === SS_T('vsAsync'));
  const world = s.chWorldB.getBounds(), add = s.addDoorB.getBounds(), inv = s.invDoorB.getBounds();
  const css = (o) => { const D = game.scale.width / innerWidth;
    return o.input ? Math.min(o.input.hitArea.width * Math.abs(o.scaleX), o.input.hitArea.height * Math.abs(o.scaleY)) / D : 0; };
  const moon = s.children.list.some(o => o.texture && o.texture.key === 'moon');
  const flies = s.children.list.filter(o => o.texture && (o.__ssBaseTex || o.texture.key) === 'dot' && o.tintTopLeft === 0xffdf8f).length;
  return { wmKey: wm.texture.key, wmX: wm.x, wmY: wm.y, cx: l.x(0), y62: l.y(62),
    nB: blades.length, bY: blades.map(b => Math.round(b.y)), bSym: blades.length === 2 ? Math.abs((blades[0].x - l.x(0)) + (blades[1].x - l.x(0))) : 99,
    capY: cap ? cap.y : -1, y94: l.y(94),
    chip: s.idChipT ? s.idChipT.text : null, chipHit: css(s.idChipB), chipRight: s.idChipB ? s.idChipB.getBounds().right : -1, W: s.scale.width,
    worldY: world.centerY, addY: add.centerY, invY: inv.centerY, order: world.centerY < add.centerY && add.centerY < inv.centerY,
    hits: [css(s.chWorldB), css(s.addDoorB), css(s.invDoorB)],
    safeBpx: s.scale.height - SS_INSET.bottom * DPR, noteY: s.noteT.y, moon, flies } })())`).then(JSON.parse);
ok('the wordmark is the gold letterpress of SS_T(versus), centred at the page head',
  !geo.missing && geo.wmKey === 'gold@23@VERSUS' && Math.abs(geo.wmX - geo.cx) < 1 && Math.abs(geo.wmY - geo.y62) < 1, geo.wmKey);
ok('two drawn blades flank it symmetrically at its height',
  !geo.missing && geo.nB === 2 && geo.bSym < 1.5 && geo.bY.every((y) => Math.abs(y - Math.round(geo.wmY)) <= 1));
ok('the caption rides beneath the wordmark', !geo.missing && Math.abs(geo.capY - geo.y94) < 1);
ok("the identity chip wears the first-night dress '✧ name' (no rating yet), right-anchored, 44-pt",
  !geo.missing && /^✧ /.test(geo.chip || '') && !/·/.test(geo.chip || '') && geo.chipRight <= geo.W && geo.chipHit >= 43.5,
  geo.chip + ' hit ' + Math.round(geo.chipHit));
ok('the funnel doors stand in order — WORLDWIDE promoted, ADD, INVITE — all 44-pt',
  !geo.missing && geo.order && geo.hits.every((h) => h >= 43.5), JSON.stringify(geo.hits.map(Math.round)));
ok('the note line holds the foot inside the safe band', !geo.missing && geo.noteY < geo.safeBpx && geo.noteY > geo.invY);
ok('no moon in the versus frame; six fireflies keep the crest', !geo.missing && geo.moon === false && geo.flies === 6, 'flies ' + geo.flies);

/* ---------- 2. THE DUELISTS ---------- */
console.log('— THE DUELISTS —');
const hero = await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu'); const l = ssLayout(s);
  const fig = (c) => { const stars = c.list.filter(o => o.texture); const g = c.list.find(o => !o.texture);
    return { n: c.list.length, stars: stars.length, gAlpha: g ? +g.alpha.toFixed(2) : -1,
      sx: c.scaleX, x: Math.round(c.x), tints: [...new Set(stars.map(o => o.tintTopLeft))],
      at: stars.slice(0, 2).map(o => [Math.round(o.x), Math.round(o.y)]) } };
  const zen = s.zenith;
  return { L: fig(s.heroL), R: fig(s.heroR), fly: s.heroFly, seen: window.__ssVsHeroSeen,
    u15: +(l.u(1.5)).toFixed(3), zx: zen ? Math.round(zen.x) : -1, zy: zen ? Math.round(zen.y) : -1,
    cx: Math.round(l.x(0)), y128: Math.round(l.y(128)), zTex: zen ? (zen.__ssBaseTex || zen.texture.key) : null } })())`).then(JSON.parse);
ok('two figures stand: 11 stars each with halos (22+ sprites), gold left, moon-blue right, the right one mirrored',
  hero.L.stars >= 22 && hero.R.stars >= 22 && hero.L.sx === 1 && hero.R.sx === -1
  && hero.L.tints.includes(0xd7b45c) && hero.R.tints.includes(0x9fb0e8), JSON.stringify([hero.L.tints, hero.R.tints]));
ok('this session\'s first visit FLEW the stars in, and the edges have risen', hero.fly === true && hero.seen === 1 && hero.L.gAlpha === 1 && hero.R.gAlpha === 1,
  'fly ' + hero.fly + ' gA ' + hero.L.gAlpha + '/' + hero.R.gAlpha);
ok('the stars stand on the authored chart (star 0 at −58,−56 × the unit scale)',
  Math.abs(hero.L.at[0][0] - Math.round(-58 * hero.u15)) <= 2 && Math.abs(hero.L.at[0][1] - Math.round(-56 * hero.u15)) <= 2,
  JSON.stringify(hero.L.at) + ' u ' + hero.u15);
ok('one shared zenith star (spark4) burns at the top centre',
  hero.zTex === 'spark4' && Math.abs(hero.zx - hero.cx) <= 1 && Math.abs(hero.zy - hero.y128) <= 1);
ok('a later visit this session stands the figures still (no second flight)', await (async () => {
  await A.ev(`game.scene.getScene('vsmenu').scene.start('home'); 1`);
  await A.until(`game.scene.isActive('home')`, 15000);
  await A.ev(`game.scene.getScene('home').scene.start('vsmenu'); 1`);
  if (!await A.until(MENU, 15000)) return false;
  return A.ev(`game.scene.getScene('vsmenu').heroFly === false && window.__ssVsHeroSeen === 1`);
})());

/* ---------- 3. the sheet through the funnel's ADD door ---------- */
console.log('— THE SHEET —');
ok('ADD A FRIEND BY NAME opens the sheet with the name field; Escape adds no one and the sheet stands', await openSheetFunnel(A));
let stx = await sheetTexts(A);
const ST = await A.ev(`JSON.stringify({ fr: SS_T('vsFriends'), rh: SS_T('vsRecentHead'), nf: SS_T('vsNoFriends'), nr: SS_T('vsNoRecent'),
  inv: SS_T('vsInviteNew'), sub: SS_T('vsInviteNewSub') })`).then(JSON.parse);
ok('the heads, the +, the ✕, both quiet empty lines', stx.includes(ST.fr) && stx.includes('+') && stx.includes('✕')
  && stx.includes(ST.rh) && stx.includes(ST.nf) && stx.includes(ST.nr), stx.join(' | ').slice(0, 200));
ok('the invite row stands at the very bottom, under everything in the roll',
  await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); const invTop = s.invB.getBounds().top;
    let bad = 0; const walk = (list) => list.forEach(o => { if (o.getBounds && o.getBounds().bottom > invTop + 2) bad++; if (o.list) walk(o.list); });
    walk(s.frC.list); return bad === 0 })()`));
ok('invite copy inside the row', stx.includes(ST.inv) && stx.includes(ST.sub));
ok('the +, the ✕ and the invite row all meet the 44-pt law',
  await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); const css = (o) => { const D = game.scale.width / innerWidth;
      return Math.min(o.input.hitArea.width * Math.abs(o.scaleX), o.input.hitArea.height * Math.abs(o.scaleY)) / D; };
    const xb = s.socialC.list.find(o => o.text === '✕');
    return css(s.addB) >= 43.5 && css(xb) >= 43.5 && css(s.invB) >= 43.5 })()`));
ok('✕ closes the sheet', await (async () => {
  await A.tap(`game.scene.getScene('vsmenu').socialC.list.find(o => o.text === '✕')`);
  return A.until(`game.scene.getScene('vsmenu').socialC === null`, 6000);
})());
ok('…and it opens again (the stale-ref law)', await openSheetFunnel(A));
ok('a tap on the veil above the parchment closes it too', await (async () => {
  await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); const v = s.socialC.list[0]; v.emit('pointerdown'); return 1 })()`);
  return A.until(`game.scene.getScene('vsmenu').socialC === null`, 6000);
})());

/* ---------- 4. the share payload: the app, never the site ---------- */
console.log('— THE APP INVITE —');
// the funnel's own ✶ INVITE door first (the promoted surface) — the v0.41
// clipboard lesson: define an OWN property with a capturing writeText
await A.ev(`window.__cap = null;
Object.defineProperty(navigator, 'clipboard', { configurable: true,
  value: { writeText: (t) => { window.__cap = t; return Promise.resolve(); } } });
document.execCommand = function (cmd) {
  if (cmd === 'copy') window.__cap = document.activeElement && document.activeElement.value; return true; }; 1`);
ok('a real tap on the funnel INVITE door copies the summons', await A.tapUntil(`game.scene.getScene('vsmenu').invDoorB`,
  `typeof window.__cap === 'string' && window.__cap.length > 0`, 20000));
const cap = await A.ev(`window.__cap`) || '';
const myName = await A.ev(`SSNET.myName()`);
ok('the payload carries the STARSPELL app link', cap.includes('https://testflight.apple.com/join/Hxs8e7fU'), cap.slice(0, 120));
ok('…and the sender\'s name for the add-by-name bridge', cap.includes(myName), cap.slice(0, 120));
ok('…and NEVER a web page: no drbango.com, no localhost, no join/friend deep link',
  !/drbango\.com|localhost|[?&]join=|[?&]friend=/.test(cap), cap);
const capTxt = cap.slice(0, cap.indexOf('https://'));
ok('…and the live payload wears the sparkles: ✨ ×2, no dash, no colon, no "to answer", ✨ right before the link',
  (capTxt.match(/✨/g) || []).length === 2 && !/[—:]/.test(capTxt) && !ANSWER_TAILS.test(capTxt) && /✨\s*$/.test(capTxt),
  cap.slice(0, 140));
ok('…the payload is exactly vsAppText, the sender named twice, then the app link',
  await A.ev(`window.__cap === SS_T('vsAppText', SSNET.myName(), SSNET.myName()) + ' https://testflight.apple.com/join/Hxs8e7fU'`));
ok('the sheet\'s pinned invite row still shares the same summons', await (async () => {
  await A.ev(`window.__cap = null; 1`);
  if (!await openSheetFunnel(A)) return false;
  if (!await A.tapUntil(`game.scene.getScene('vsmenu').invB`, `typeof window.__cap === 'string' && window.__cap.length > 0`, 15000)) return false;
  const c2 = await A.ev(`window.__cap`);
  const done = await A.until(`(() => { const s = game.scene.getScene('vsmenu'); return s.shNoteT && s.shNoteT.text === SS_T('vsCopied') })()`, 6000);
  await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); if (s.socialC) s.closeSocial(); return 1 })()`);
  return done && c2 === cap;
})());

/* ---------- 5. ADD BY NAME through the funnel door (two real mages) ---------- */
console.log('— ADD BY NAME (THE FUNNEL DOOR, LIVE REGISTRY) —');
const UA = 'u' + rnd() + 'vpa', UB = 'u' + rnd() + 'vpb';
const NA = 'Vega ' + rnd().toUpperCase(), NB = 'Lyra ' + rnd().toUpperCase();
for (const u of [UA, UB]) for (const p of ['players/', 'presence/', 'devices/', 'friends/', 'recent/', 'invites/']) toDelete.add(p + u);
console.log('A=' + UA + ' "' + NA + '"   B=' + UB + ' "' + NB + '"');
await A.seed(BOOT(UA, NA)); await B.seed(BOOT(UB, NB));
ok('both mages reach the sky', await A.nav(BASE + '?fps=0') && await A.until(READY, 60000)
  && await B.nav(BASE + '?fps=0') && await B.until(READY, 60000));
await A.until(`(async () => { await SSNET.ensureName(); return true })()`, 30000);
await B.until(`(async () => { await SSNET.ensureName(); return true })()`, 30000);
toDelete.add('names/' + await A.ev(`SSNET.nameKey(${JSON.stringify(NA)})`));
toDelete.add('names/' + await B.ev(`SSNET.nameKey(${JSON.stringify(NB)})`));
ok('A stands on the funnel (a fresh mage) and the ADD door opens the field', await (async () => {
  if (!await toMenu(A)) return false;
  return A.tapUntil(`game.scene.getScene('vsmenu').addDoorB`, SHEET + ' && ' + INPUT, 12000);
})());
await A.type(NB.toLowerCase()); await A.key('Enter', 'Enter');
ok('the friendship lands on BOTH sides of the sky', await (async () => {
  for (let i = 0; i < 25; i++) {
    const a = await rt('friends/' + UA + '/' + UB), b = await rt('friends/' + UB + '/' + UA);
    if (a && a.name === NB && b && b.name === NA) return true;
    await sleep(400);
  }
  return false;
})());
ok('the roll repaints itself: B\'s row, the drawn glyph, CHALLENGE ready',
  await A.until(`(() => { const s = game.scene.getScene('vsmenu'); if (!s.frRows || !s.frRows.length) return false;
    const r = s.frRows.find(r => r.id === ${JSON.stringify(UB)});
    return !!(r && r.nameT.text === ${JSON.stringify(NB)} && r.glyph.texture.key === 'vsswords' && r.cb.input && r.cb.input.enabled) })()`, 15000));
ok('…and says so', await A.until(`(() => { const s = game.scene.getScene('vsmenu'); return s.shNoteT && s.shNoteT.text === SS_T('frAdded', ${JSON.stringify(NB)}) })()`, 8000));
// with a friend on the roll the page leaves the funnel: rebuild and look
ok('the page steps out of the funnel once a name is known (chFriendB + the strip exist)', await (async () => {
  await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); s.closeSocial(); s.scene.start('home'); return 1 })()`);
  await A.until(`game.scene.isActive('home')`, 15000);
  if (!await toMenu(A)) return false;
  return A.ev(`(() => { const s = game.scene.getScene('vsmenu'); return s.doorsMode === 'duels' && !!s.chFriendB && !!s.chWorldB })()`);
})());
// the honest miss re-offers the typed text (the sheet's + still owns it)
const nobody = 'Nobody ' + rnd().toUpperCase();
ok('the sheet opens on CHALLENGE A FRIEND and + opens the field', await openSheet(A) && await A.tapUntil(`game.scene.getScene('vsmenu').addB`, INPUT, 12000));
await A.type(nobody); await A.key('Enter', 'Enter');
ok('the miss is named honestly', await A.until(`(() => { const s = game.scene.getScene('vsmenu'); return s.shNoteT && s.shNoteT.text === SS_T('vsNameNone', ${JSON.stringify(nobody)}) })()`, 15000));
ok('…and the field comes back holding what was typed', await A.until(INPUT + ` && document.getElementById('ss-overlay-input').value === ${JSON.stringify(nobody)}`, 8000));
ok('+ once more, for your own name', await A.tapUntil(`game.scene.getScene('vsmenu').addB`, INPUT, 12000));
await A.type(NA); await A.key('Enter', 'Enter');
ok('your own name is a gentle no', await A.until(`(() => { const s = game.scene.getScene('vsmenu'); return s.shNoteT && s.shNoteT.text === SS_T('vsAddSelf') })()`, 10000));

/* ---------- 6. a friend row's CHALLENGE — correspondence + the plaque band ---------- */
console.log('— THE ROW CHALLENGE · CORRESPONDENCE · THE PLAQUES —');
ok('a real tap on the row\'s CHALLENGE takes A into the duel AND stands a pending row for B',
  await A.tapUntil(`((game.scene.getScene('vsmenu').frRows || []).find(r => r.id === ${JSON.stringify(UB)}) || {}).cb`,
    `(() => { const s = game.scene.getScene('vsbattle'); return game.scene.isActive('vsbattle') && s.room && s.room.corr
      && !!VS_PEND.list().find(p => p.to.id === ${JSON.stringify(UB)} && !p.away) })()`, 25000));
let rec = JSON.parse(await A.ev(`JSON.stringify(VS_PEND.list().find(p => p.to.id === ${JSON.stringify(UB)}) || null)`) || 'null');
codes.add(rec.code);
const room5 = await rt('mp/rooms/' + rec.code);
ok('the room is ACTIVE from birth — TURNS, correspondence, private, B\'s seat HELD',
  !!room5 && room5.status === 'active' && room5.corr === 1 && room5.mode === 'turns' && room5.private === true
  && room5.invited === UB && room5.players[UB] && room5.players[UB].held === 1, JSON.stringify(room5).slice(0, 160));
ok('B\'s banner rings — and wears the drawn blades, its title emoji-free', await B.until(`(() => { const s = game.scene.getScene('summons');
  if (!(s && s.bannerC && s.shown && s.shown.from === ${JSON.stringify(UA)})) return false;
  const hasGlyph = s.bannerC.list.some(o => o.texture && o.texture.key === 'vsswords');
  const t1 = s.bannerC.list.find(o => o.text && o.text.includes(SS_T('smTitle', '').replace('%1', '').trim() || 'challenges'));
  const texts = s.bannerC.list.filter(o => o.text).map(o => o.text).join(' ');
  return hasGlyph && !/\\u2694/.test(JSON.stringify(texts)) })()`, 20000));
// A steps out — the duel STANDS as a gold-rimmed wait plaque on the page
await A.ev(`(() => { const s = game.scene.getScene('vsbattle'); const b = s.children.list.find(o => o.text === '‹'); if (b) b.emit('pointerdown'); })()`);
ok('A steps out and the plaque wears B\'s name + the waiting fiction + the band head + a lit cap pip', await A.until(`(() => {
  const s = game.scene.getScene('vsmenu');
  if (!s || !s.scene.isActive()) return false; const r = (s.pendRows || []).find(r => r.code === ${JSON.stringify(rec.code)});
  if (!r || r.kind !== 'wait' || r.name !== ${JSON.stringify(NB)}) return false;
  if (r.statusT.text !== SS_T('vsWaitAnswer', ${JSON.stringify(NB)})) return false;
  const texts = s.pendC.list.filter(o => o.text).map(o => o.text);
  if (!texts.includes(SS_T('vsDuelsHead'))) return false;
  const pips = (s.capPips || []);
  return pips.length === 5 && pips.filter(p => p.fillColor === 0xffd77a).length === vsOngoingCount() })()`, 15000));
ok('the wait plaque carries the ✶ share and the ✕ takeback on a dark nine-slice with the drawn glyph', await A.ev(`(() => {
  const s = game.scene.getScene('vsmenu'); const r = (s.pendRows || []).find(r => r.code === ${JSON.stringify(rec.code)});
  if (!r || !r.share || !r.cancel) return false;
  const glyphs = s.pendC.list.filter(o => o.texture && o.texture.key === 'vsswords').length;
  const panels = s.pendC.list.filter(o => o.texture && /^btn/.test(o.texture.key)).length;
  return glyphs >= 1 && panels >= 1 })()`));
ok('a real ACCEPT claims the held seat from B\'s side — B lands in the live duel', await (async () => {
  await sleep(900);
  for (let i = 0; i < 3; i++) {
    await B.tap(`game.scene.getScene('summons').bannerC.list.find(o => o.text === SS_T('smAccept'))`);
    if (await B.until(`game.scene.getScene('summons').accepting || game.scene.isActive('vsbattle')`, 3000)) break;
  }
  return await B.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.room.status === 'active'
    && s.room.players[${JSON.stringify(UB)}] && !s.room.players[${JSON.stringify(UB)}].held })()`, 25000);
})());
ok('the pending row leaves A\'s list once B has claimed', await A.until(`!VS_PEND.list().find(p => p.to.id === ${JSON.stringify(UB)})`, 10000));
// away: the friend keeps the affordance, the tap stands the summons in a row
await B.ev(`firebase.database().goOffline(); 1`).catch(() => { });
await sleep(800);
await B.park();
ok('A back on the meadow', await A.nav(BASE + '?fps=0') && await A.until(READY, 60000));
ok('A sees B leave the sky', await A.until(`!SSNET.FR.isOnline(${JSON.stringify(UB)})`, 40000));
ok('the sheet still gives the away friend the challenge', await toMenu(A) && await openSheet(A)
  && await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); const r = (s.frRows || []).find(r => r.id === ${JSON.stringify(UB)});
    return !!(r && !r.online && r.cb.input && r.cb.input.enabled && r.glyph.texture.key === 'vsswords') })()`));
ok('…and the tap takes A into a duel with an AWAY pending row for the absent B',
  await A.tapUntil(`((game.scene.getScene('vsmenu').frRows || []).find(r => r.id === ${JSON.stringify(UB)}) || {}).cb`,
    `(() => { const s = game.scene.getScene('vsbattle'); return game.scene.isActive('vsbattle') && s.room && s.room.corr
      && !!VS_PEND.list().find(p => p.to.id === ${JSON.stringify(UB)} && p.away) })()`, 25000));
await A.ev(`(() => { const s = game.scene.getScene('vsbattle'); const b = s.children.list.find(o => o.text === '‹'); if (b) b.emit('pointerdown'); })()`);
ok('A steps out and the plaque says the summons waits under their stars', await A.until(`(() => { const s = game.scene.getScene('vsmenu');
  if (!s || !s.scene.isActive()) return false; const p = VS_PEND.list().find(p => p.to.id === ${JSON.stringify(UB)} && p.away); if (!p) return false;
  const r = (s.pendRows || []).find(r => r.code === p.code); if (!r) return false;
  const want = SS_T('vsWaitAway', ${JSON.stringify(NB)}), got = r.statusT.text;
  return got === want || (got.endsWith('…') && want.startsWith(got.slice(0, -1))) })()`, 15000));
rec = JSON.parse(await A.ev(`JSON.stringify(VS_PEND.list().find(p => p.to.id === ${JSON.stringify(UB)}) || null)`) || 'null');
codes.add(rec.code);
ok('the standing invite waits under B\'s stars, a turns room behind it', await (async () => {
  for (let i = 0; i < 15; i++) { const inv = await rt('invites/' + UB + '/' + UA); if (inv && inv.code === rec.code && inv.mode === 'turns') return true; await sleep(400); }
  return false;
})() && (await rt('mp/rooms/' + rec.code + '/mode')) === 'turns');
ok('the plaque\'s ✶ shares the invite link for the waiting summons', await (async () => {
  await A.ev(`window.__cap = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { writeText: (t) => { window.__cap = t; return Promise.resolve(); } } }); 1`);
  await A.tap(`((game.scene.getScene('vsmenu').pendRows || []).find(r => r.code === ${JSON.stringify(rec.code)}) || {}).share`);
  for (let i = 0; i < 20; i++) { const c = await A.ev(`window.__cap`); if (c && c.includes('join=' + rec.code)) return true; await sleep(300); }
  return false;
})());

/* ---------- 7. CHALLENGE WORLDWIDE — the searching theater ---------- */
console.log('— CHALLENGE WORLDWIDE · THE SEARCHING THEATER —');
const stale = (await rt('mp/rooms')) || {};
for (const [k, r] of Object.entries(stale)) {
  if (!r || r.status !== 'waiting' || r.private) continue;
  if (r.createdAt < Date.now() - 120000 || /^test_/.test(r.hostUid || '')) await rtDel('mp/rooms/' + k);
}
ok('A boots with the reply rhythm shrunk', await A.nav(BASE + '?fps=0&botpace=1500,3000') && await A.until(READY, 60000) && await toMenu(A));
await A.tap(`game.scene.getScene('vsmenu').chWorldB`);
ok('the tap raises the searching theater over a queued TURNS room',
  await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room && s.room.seekAt > 0
    && s.room.mode === 'turns' && !s.room.private && !!s.theater && !s.revealed })()`, 25000));
const th = JSON.parse(await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsbattle'); return { code: s.code, t0: s.theater.t0, T: s.theater.T } })())`));
codes.add(th.code);
ok('the beat is rolled inside [8s, 15s]', th.T >= 8000 && th.T <= 15000, (th.T / 1000).toFixed(1) + 's');
ok('no seal, no share, no roster under the theater — the summons-sealed screen never appears on this path',
  await A.ev(`(() => { const s = game.scene.getScene('vsbattle');
    const walk = (list, out) => { for (const o of list) { if (o.text != null) out.push(o.text); if (o.list) walk(o.list, out); } return out; };
    const texts = walk(s.children.list, []);
    return !texts.some(t => t === s.code || t.endsWith(' ' + s.code)) && !texts.some(t => /mages answered/i.test(t)) && !texts.includes(SS_T('vsShareInvite')) && !s.shareB })()`));
ok('SEARCHING stands and the clock ticks the wait up (Skylar 9/8: "some kind of timer")', await (async () => {
  const a = await A.ev(`(() => { const s = game.scene.getScene('vsbattle');
    return s.searchT.text === SS_T('vsSearching') && s.searchClockT ? s.searchClockT.text : null })()`);
  if (!/^\d+:\d\d$/.test(a || '')) return false;
  await sleep(1300);
  const b = await A.ev(`game.scene.getScene('vsbattle').searchClockT.text`);
  return /^\d+:\d\d$/.test(b || '') && b !== a;
})());
const found = await (async () => {
  const cap2 = Math.max(3000, th.t0 + th.T + 5000 - Date.now());
  for (let i = 0; i < cap2 / 250; i++) {
    if (await A.ev(`game.scene.getScene('vsbattle').searchT.text === SS_T('vsFound')`)) return Date.now();
    await sleep(250);
  }
  return 0;
})();
const beat = found ? (found - th.t0) / 1000 : -1;
ok('OPPONENT FOUND lands on the rolled beat — inside the 8–15s window, never early',
  found > 0 && beat >= 7.8 && beat <= 16.5 && found >= th.t0 + th.T - 600, beat.toFixed(1) + 's of ' + (th.T / 1000).toFixed(1) + 's rolled');
ok('…then straight into the turns duel — no waiting screen between', await A.until(`(() => { const s = game.scene.getScene('vsbattle');
  return s.state === 'pick' && s.room.status === 'active' && (!s.waitC.visible || s.waitC.alpha < 0.05) })()`, 20000));
const foe = JSON.parse(await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsbattle');
  const e = Object.entries(s.room.players).find(([id]) => id !== SSNET.uid()); return { id: e[0], name: e[1].name, rating: e[1].rating, near: s.near } })())`));
ok('the rival is of the circle, dressed as a person: minted mage name, device-cut uid, seated on THIS device',
  // the registry keeps names unique — a pool collision mints a numbered
  // sibling ('Astral Raven 1'), still the persona shape
  /^u[a-z0-9]{8,}$/.test(foe.id) && /^[A-Z][a-z]+ [A-Z][a-z]+( \d+)?$/.test(foe.name) && foe.near === true, JSON.stringify(foe));
toDelete.add('players/' + foe.id);
toDelete.add('names/' + await A.ev(`SSNET.nameKey(${JSON.stringify(foe.name)})`));
ok('the live sky no longer holds the room (the local swap)', (await rt('mp/rooms/' + th.code)) === null);
ok('nothing on screen says bot or ai', await A.ev(`!/\\bbot\\b|\\bai\\b|robot|engine|persona/i.test(game.scene.getScene('vsbattle').children.list.filter(o => o.text != null).map(o => o.text).join(' '))`));
await A.ev(`window.__sawAt = 0; window.__setNote = SS_NEAR.setNote;
  SS_NEAR.setNote = (c, patch) => { if (patch && patch.answerAt > 0) window.__sawAt = patch.answerAt; return window.__setNote(c, patch); }; 1`);
const handed = Date.now();
await A.ev(`SS_NEAR.api.ref('mp/rooms/' + ${JSON.stringify(th.code)}).update({ turnUid: ${JSON.stringify(foe.id)}, turnCount: 1, turnCasts: 0 })`);
ok('the reply clock is rolled once and written beside the duel (a closed app keeps the schedule)',
  await A.until(`window.__sawAt > 0`, 15000));
const sawAt = await A.ev(`window.__sawAt`);
ok('…rolled inside the seam\'s window', sawAt - handed >= 1000 && sawAt - handed <= 4500, ((sawAt - handed) / 1000).toFixed(1) + 's out');
ok('the first reply lands, stamped with its appointed minute', await (async () => {
  if (!(await A.until(`(() => { const s = game.scene.getScene('vsbattle');
    return ((s.room.players[${JSON.stringify(foe.id)}] || {}).casts | 0) >= 1 })()`, 25000))) return false;
  return A.ev(`(() => { const casts = SS_NEAR.room(${JSON.stringify(th.code)}).casts || {};
    return Object.values(casts).some(c => c.uid === ${JSON.stringify(foe.id)} && c.at === ${sawAt}) })()`);
})(), ((Date.now() - handed) / 1000).toFixed(1) + 's after the turn was handed');
await A.ev(`SS_NEAR.setNote = window.__setNote; 1`);
ok('the mage answers the whole turn (three casts) and the move returns', await A.until(`(() => { const r = SS_NEAR.room(${JSON.stringify(th.code)});
  return r && r.turnUid === SSNET.uid() && Object.values(r.casts || {}).filter(c => c.uid === ${JSON.stringify(foe.id)}).length === 3 })()`, 60000));
ok('…and the spent clock is wiped', await A.until(`!((Number((SS_NEAR.note(${JSON.stringify(th.code)}) || {}).answerAt) || 0) > 0)`, 8000));
ok('the board replay is deterministic — the same script re-lives the same tiles', await A.ev(`(() => {
  const a = SS_RIVAL.replayBoard(PACK, 12345, [{ c: [0, 1, 2] }, { s: 1 }]);
  const b = SS_RIVAL.replayBoard(PACK, 12345, [{ c: [0, 1, 2] }, { s: 1 }]);
  return a.slots.length === 16 && JSON.stringify(a.slots.map(t => t && t.ch)) === JSON.stringify(b.slots.map(t => t && t.ch)) })()`));
const pocket = await A.ev(`JSON.stringify({ d: localStorage.getItem('starspellDuels'), c: localStorage.getItem('starspellCircle'), p: localStorage.getItem('beta3.profile') })`).then(JSON.parse);
await A.seed(`try { if (!sessionStorage.getItem('vp.pocket')) { sessionStorage.setItem('vp.pocket', '1');
  localStorage.setItem('starspellDuels', ${JSON.stringify(pocket.d)}); localStorage.setItem('starspellCircle', ${JSON.stringify(pocket.c)});
  ${pocket.p ? `localStorage.setItem('beta3.profile', ${JSON.stringify(pocket.p)});` : ''} } } catch (e) {}`);
ok('the app reopens on the duel standing by — a MOVE plaque with the gold rim, the rival re-seated at boot', await (async () => {
  if (!(await A.nav(BASE + '?fps=0&botpace=1500,3000') && await A.until(READY, 60000) && await toMenu(A))) return false;
  return A.until(`(() => { const s = game.scene.getScene('vsmenu');
    const r = (s.pendRows || []).find(r => r.code === ${JSON.stringify(th.code)});
    if (!r || r.kind !== 'move' || r.name !== ${JSON.stringify(foe.name)} || r.statusT.text !== SS_T('vsYourMove')) return false;
    return s.pendC.list.some(o => o.texture && o.texture.key === 'vsplaqrim') })()`, 25000);
})());
ok('a tap on the plaque steps back under those stars — the same duel, the reply still standing, my turn', await (async () => {
  await A.tap(`((game.scene.getScene('vsmenu').pendRows || []).find(r => r.code === ${JSON.stringify(th.code)}) || {}).zone`);
  return A.until(`(() => { const s = game.scene.getScene('vsbattle'); if (!s || !s.scene.isActive() || s.code !== ${JSON.stringify(th.code)}) return false;
    if (s.state !== 'pick' || !s.near) return false;
    const p = s.room.players[${JSON.stringify(foe.id)}] || {}; const tiles = (s.board || []).filter(Boolean).length;
    return (p.casts | 0) >= 1 && (p.lastWord || '') !== '' && tiles === 16 && s.room.turnUid === SSNET.uid() })()`, 35000);
})());
await A.ev(`SS_RIVAL.stopFor(${JSON.stringify(th.code)}); SS_NEAR.purge(${JSON.stringify(th.code)}); 1`);
await A.park();

/* ---------- 7b. the ?frdemo=invite recipe still stands (sealLobby) ---------- */
ok('?frdemo=invite still lands a private turns lobby', await (async () => {
  if (!await A.nav(BASE + '?fps=0&frdemo=invite&mpuid=' + VPU)) return false;
  const up = await A.until(`(() => { const s = game.scene.getScene('vsbattle'); return s && s.scene.isActive() && s.room
    && s.room.status === 'waiting' && s.room.private === true && s.room.mode === 'turns' })()`, 45000);
  if (up) codes.add(await A.ev(`game.scene.getScene('vsbattle').code`));
  await A.park();
  return up;
})());

/* ---------- 8. the summons plate + the strip + the fold (fabricated truths) ---------- */
console.log('— THE SUMMONS PLATE · THE STRIP · THE FOLD —');
ok('A boots back to the ground', await A.seed(BOOT(UA, NA)) !== undefined
  && await A.nav(BASE + '?fps=0') && await A.until(READY, 60000) && await toMenu(A));
// the roaming watcher sweeps roomless fabrications — stand it down for the
// fabricated furniture (the REAL flows above already proved it live)
await A.ev(`game.scene.getScene('summons').scene.pause(); 1`);
const FAB = (games, pend, inv) => `(() => { const now = Date.now();
  localStorage.setItem('starspellGames', JSON.stringify(${games}));
  localStorage.setItem('starspellPending', JSON.stringify(${pend}));
  SSNET.FR.invites = ${inv};
  const s = game.scene.getScene('vsmenu'); s.pendKey = ''; s.refreshPend(); return 1 })()`;
// a) an incoming challenge lands as the gold ACCEPT plate + the star flares
await A.ev(FAB(
  `[{ code: 'MOTH', foe: { id: 'x1', name: 'Quiet Owl' }, at: now, turn: SSNET.uid(), status: 'active', held: 0, seen: 0, settled: 0 }]`,
  `[]`,
  `{ xq1: { code: 'QMRW', mode: 'turns', at: Date.now(), name: 'Umbral Raven' } }`));
await sleep(1400);
const plate = await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu');
  const rows = (s.pendRows || []).map(r => ({ kind: r.kind, name: r.name, accept: !!r.accept }));
  const css = (o) => { const D = game.scale.width / innerWidth;
    return o && o.input ? Math.min(o.input.hitArea.width * Math.abs(o.scaleX), o.input.hitArea.height * Math.abs(o.scaleY)) / D : 0; };
  const sum = (s.pendRows || []).find(r => r.kind === 'sum');
  const rims = s.pendC.list.filter(o => o.texture && o.texture.key === 'vsplaqrim').length;
  const texts = s.pendC.list.filter(o => o.text).map(o => o.text);
  return { rows, rims, sumStatus: sum ? sum.statusT.text : null, acceptHit: css(sum && sum.accept),
    flare: s.zenFlare, zenW: s.zenith ? Math.round(s.zenith.displayWidth / ssLayout(s).u(1)) : 0,
    pipsLit: (s.capPips || []).filter(p => p.fillColor === 0xffd77a).length, texts } })())`).then(JSON.parse);
ok('the plate leads the band: kind sum, the challenger\'s name, ACCEPT at 44-pt, the vsSumRow fiction',
  plate.rows[0] && plate.rows[0].kind === 'sum' && plate.rows[0].name === 'Umbral Raven' && plate.rows[0].accept
  && plate.sumStatus === await A.ev(`SS_T('vsSumRow')`) && plate.acceptHit >= 43.5, JSON.stringify(plate.rows));
ok('the plate AND the move plaque wear the pre-baked gold rim (two rims stand)', plate.rims === 2, 'rims ' + plate.rims);
ok('the zenith star flares while the summons stands', plate.flare === 1 && plate.zenW >= 30, 'w' + plate.zenW);
ok('the cap pips teach honestly — the unclaimed summons holds no slot', plate.pipsLit === 1, 'lit ' + plate.pipsLit);
// e) the plate's ACCEPT is a REAL door: a real challenge from B lands as the
// gold plate (the banner stands down — the summons scene is paused), and one
// real tap claims the held seat exactly as the banner's ACCEPT would
ok('a REAL incoming challenge lands as the plate and its ACCEPT claims the held seat', await (async () => {
  await B.seed(BOOT(UB, NB));
  if (!(await B.nav(BASE + '?fps=0') && await B.until(READY, 60000))) return false;
  const code = await B.ev(`(async () => { const code = vsCode();
    const ok = await vsSealRoom(code, 'turns', { private: true, invited: ${JSON.stringify(UA)}, hold: { id: ${JSON.stringify(UA)}, name: ${JSON.stringify(NA)} } });
    if (!ok) return null;
    await SSNET.FR.challenge(${JSON.stringify(UA)}, code, 'turns');
    return code })()`);
  if (!code) return false;
  codes.add(code);
  const found = await A.until(`(() => { const s = game.scene.getScene('vsmenu');
    const r = (s.pendRows || []).find(r => r.kind === 'sum' && r.code === ${JSON.stringify(code)});
    return !!(r && r.accept && r.name === ${JSON.stringify(NB)}) })()`, 15000);
  if (!found) return false;
  await A.tap(`((game.scene.getScene('vsmenu').pendRows || []).find(r => r.kind === 'sum' && r.code === ${JSON.stringify(code)}) || {}).accept`);
  const claimed = await A.until(`(() => { const s = game.scene.getScene('vsbattle');
    return s && s.scene.isActive() && s.code === ${JSON.stringify(code)} && s.room && s.room.status === 'active'
      && s.room.players[${JSON.stringify(UA)}] && !s.room.players[${JSON.stringify(UA)}].held })()`, 25000);
  if (!claimed) return false;
  // step back out; the fabrication tidy below sweeps the ledgers, the
  // cleanup deletes the room
  await A.ev(`(() => { const s = game.scene.getScene('vsbattle'); const b = s.children.list.find(o => o.text === '‹'); if (b) b.emit('pointerdown'); })()`);
  await A.until(MENU, 15000);
  await B.park();
  return true;
})());
// b) the strip: an online friend leads, the night-clocked rival follows, the
// circle glints and is NEVER labeled online; ALL MAGES opens the sheet
await A.ev(`(() => { const now = Date.now();
  SSNET.FR.friends = { f1: { name: 'Moonlit Hare', at: now } };
  SSNET.FR.presence = Object.assign({}, SSNET.FR.presence, { f1: { name: 'Moonlit Hare', at: now } });
  SSNET.FR.recent = { r1: { name: 'Dawn Scribe', at: now - 86400000 } };
  localStorage.setItem('starspellCircle', JSON.stringify([{ uid: 'c1', name: 'Ember Sage', rating: 1000 }]));
  const s = game.scene.getScene('vsmenu');
  if (s.stripC) { s.stripC.destroy(); s.stripC = null; s.chipRows = null; s.stripHeadT = null; }
  s.pendKey = ''; s.refreshPend(); return 1 })()`);
await sleep(1200);
const strip = await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu');
  const css = (o) => { const D = game.scale.width / innerWidth;
    return o && o.input ? Math.min(o.input.hitArea.width * Math.abs(o.scaleX), o.input.hitArea.height * Math.abs(o.scaleY)) / D : 0; };
  const chips = (s.chipRows || []).map(c => ({ kind: c.kind, name: c.name, sub: c.subT.text, tag: c.tagT.text,
    dot: c.dot.fillColor, hit: Math.round(css(c.pill)) }));
  return { chips, head: s.stripHeadT ? { text: s.stripHeadT.text, vis: s.stripHeadT.visible } : null,
    allHit: Math.round(css(s.allMagesB)) } })())`).then(JSON.parse);
ok('the strip ranks once: the online friend first (green, "online", DUEL), the rival with the night-clock (AGAIN)',
  strip.chips.length === 2 && strip.chips[0].kind === 'friend' && strip.chips[0].sub === 'online' && strip.chips[0].dot === 0x7fe0a0
  && strip.chips[0].tag === await A.ev(`SS_T('vsDuelTag')`)
  && strip.chips[1].kind === 'recent' && strip.chips[1].sub === 'last night' && strip.chips[1].tag === 'AGAIN', JSON.stringify(strip.chips));
ok('the band head speaks and every chip meets the 44-pt law',
  strip.head && strip.head.text === await A.ev(`SS_T('vsTonight')`) && strip.head.vis === true
  && strip.chips.every((c) => c.hit >= 43.5) && strip.allHit >= 43.5, JSON.stringify(strip));
ok('the tick REDRESSES and never reorders: the friend goes dark in place', await (async () => {
  await A.ev(`delete SSNET.FR.presence.f1; 1`);
  return A.until(`(() => { const s = game.scene.getScene('vsmenu'); const c = (s.chipRows || [])[0];
    return c && c.kind === 'friend' && c.dot.fillColor === 0x39406b && c.subT.text === SS_T('vsOffline')
      && (s.chipRows || [])[1].kind === 'recent' })()`, 8000);
})());
ok('a circle mage glints ready and is NEVER labeled online (the quiet-player law)', await (async () => {
  // rebuild the strip with the circle mage in reach (no friend online now)
  await A.ev(`(() => { const s = game.scene.getScene('vsmenu');
    SSNET.FR.friends = {}; SSNET.FR.recent = {};
    if (s.stripC) { s.stripC.destroy(); s.stripC = null; s.chipRows = null; s.stripHeadT = null; }
    s.pendKey = ''; s.refreshPend(); return 1 })()`);
  await sleep(1200);
  return A.ev(`(() => { const s = game.scene.getScene('vsmenu'); const c = (s.chipRows || [])[0];
    if (!c || c.kind !== 'circle' || c.name !== 'Ember Sage') return false;
    if (c.dot.fillColor !== 0xffd77a) return false;               // the glint
    if (c.subT.text !== '') return false;                          // never a status word
    if (c.tagT.text !== SS_T('vsDuelTag')) return false;           // a gold live-duel door
    const texts = [c.nameT.text, c.subT.text, c.tagT.text].join(' ');
    return !/online|en línea|en ligne/i.test(texts) })()`);
})());
ok('› ALL MAGES opens the full social sheet (a real tap)', await A.tapUntil(`game.scene.getScene('vsmenu').allMagesB`, SHEET, 10000));
await A.ev(`(() => { const s = game.scene.getScene('vsmenu'); if (s.socialC) s.closeSocial(); return 1 })()`);
// c) the fold and the '+%1 more' row
ok('four rows fold the strip to chips alone; six rows fold the band to three plaques + "+3 more"', await (async () => {
  const G4 = `[1,2,3].map(i => ({ code: 'FG' + i + 'X', foe: { id: 'g' + i, name: 'Mage ' + i }, at: now - i * 1000, turn: 'g' + i, status: 'active', held: 0, seen: 0, settled: 0 }))`;
  await A.ev(FAB(G4, `[]`, `{ xq1: { code: 'QMRW', mode: 'turns', at: Date.now(), name: 'Umbral Raven' } }`));
  await sleep(1300);
  const f4 = await A.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu');
    return { n: (s.pendRows || []).length, headVis: s.stripHeadT ? s.stripHeadT.visible : null } })())`).then(JSON.parse);
  if (!(f4.n === 4 && f4.headVis === false)) { ok('  (4-row fold)', false, JSON.stringify(f4)); return false; }
  const G6 = `[1,2,3,4,5].map(i => ({ code: 'FG' + i + 'X', foe: { id: 'g' + i, name: 'Mage ' + i }, at: now - i * 1000, turn: 'g' + i, status: 'active', held: 0, seen: 0, settled: 0 }))`;
  await A.ev(FAB(G6, `[]`, `{ xq1: { code: 'QMRW', mode: 'turns', at: Date.now(), name: 'Umbral Raven' } }`));
  await sleep(1300);
  return A.ev(`(() => { const s = game.scene.getScene('vsmenu');
    const texts = s.pendC.list.filter(o => o.text).map(o => o.text);
    const pips = (s.capPips || []).filter(p => p.fillColor === 0xffd77a).length;
    return (s.pendRows || []).length === 3 && texts.includes(SS_T('vsMore', 3)) && pips === 5 })()`);
})());
// d) bots indistinguishable: a NEAR duel's plaque wears exactly the dress a
// live-sky duel's does — same furniture, same fiction, no tell
ok('a near (circle) duel\'s plaque is indistinguishable from a live-sky duel\'s', await (async () => {
  await A.ev(`(() => { const me = SSNET.uid(), now = Date.now();
    SS_NEAR.api.ref('mp/rooms/NRDX').set({ code: 'NRDX', mode: 'turns', corr: 1, hp: 150, status: 'active', turnUid: me,
      createdAt: now, movedAt: now, players: { [me]: { name: SSNET.myName(), seat: 0, hp: 150 }, c1: { name: 'Ember Sage', seat: 1, hp: 150 } } });
    return 1 })()`);
  await A.ev(FAB(
    `[{ code: 'SKYX', foe: { id: 'h1', name: 'True Person' }, at: now, turn: SSNET.uid(), status: 'active', held: 0, seen: 0, settled: 0 }]`,
    `[]`, `{}`));
  await sleep(1300);
  return A.ev(`(() => { const s = game.scene.getScene('vsmenu');
    const near = (s.pendRows || []).find(r => r.code === 'NRDX'), sky = (s.pendRows || []).find(r => r.code === 'SKYX');
    if (!near || !sky) return false;
    const shape = (r) => [r.kind, !!r.zone, !!r.abandon, !!r.share, !!r.cancel, r.statusT.style.color, r.nameT.style.color].join('|');
    if (shape(near) !== shape(sky)) return false;
    if (near.statusT.text !== SS_T('vsYourMove') || sky.statusT.text !== SS_T('vsYourMove')) return false;
    const all = s.pendC.list.filter(o => o.text).map(o => o.text).join(' ');
    return !/\\bbot\\b|\\bai\\b|circle|engine|persona/i.test(all) })()`);
})());
// tidy the fabrications; the watcher stands back up
await A.ev(`(() => { localStorage.removeItem('starspellGames'); localStorage.removeItem('starspellPending');
  localStorage.removeItem('starspellCircle'); try { SS_NEAR.purge('NRDX'); } catch (e) { }
  SSNET.FR.invites = {}; SSNET.FR.friends = {}; SSNET.FR.recent = {};
  const s = game.scene.getScene('vsmenu'); s.pendKey = ''; s.refreshPend();
  game.scene.getScene('summons').scene.resume(); return 1 })()`);

/* ---------- 9. the ghost ledger (a blocked sky is still a place) ---------- */
console.log('— THE GHOST LEDGER (OFFLINE) —');
await B.send('Network.setBlockedURLs', { urls: ['*firebasejs*', '*firebaseio.com*'] });
await B.seed(BOOT('xoff', null));
await B.seed(`try { localStorage.setItem('starspellGames', JSON.stringify([
  { code: 'GH1X', foe: { id: 'x1', name: 'Quiet Owl' }, at: 1, turn: 'x1', status: 'active', held: 0, seen: 0, settled: 0 },
  { code: 'GH2X', foe: { id: 'x2', name: 'Umbral Raven' }, at: 1, turn: 'x2', status: 'active', held: 0, seen: 0, settled: 0 }])); } catch (e) {}`);
ok('a blocked sky boots to the meadow in local mode', await B.nav(BASE + '?fps=0')
  && await B.until(`typeof SSNET !== 'undefined' && SSNET.mode === 'local' && !!window.game && game.scene.isActive('home')`, 60000));
await B.ev(`game.scene.getScene('home').scene.start('vsmenu'); 1`);
ok('the versus page still BUILDS — the sky is local', await B.until(`game.scene.isActive('vsmenu') && !!game.scene.getScene('vsmenu').retryB`, 20000));
await sleep(900);
const off = await B.ev(`JSON.stringify((() => { const s = game.scene.getScene('vsmenu');
  const walk = (list, out) => { list.forEach(o => { if (o.text !== undefined && o.text) out.push(o.text); if (o.list) walk(o.list, out); }); return out; };
  const css = (o) => { const D = game.scale.width / innerWidth;
    return o && o.input ? Math.min(o.input.hitArea.width * Math.abs(o.scaleX), o.input.hitArea.height * Math.abs(o.scaleY)) / D : 0; };
  return { texts: walk(s.children.list, []), chip: !!s.idChipT, heroA: [s.heroL.alpha, s.heroR.alpha],
    zen: s.zenith ? (s.zenith.__ssBaseTex || s.zenith.texture.key) : null, zenTint: s.zenith ? s.zenith.tintTopLeft : 0,
    ghostA: s.ghostT ? +s.ghostT.alpha.toFixed(2) : -1, retryHit: Math.round(css(s.retryB)),
    wm: s.wordmark ? s.wordmark.texture.key : null } })())`).then(JSON.parse);
ok('the shipped couplet stands in its rose ink, the wordmark above it',
  off.texts.includes(await B.ev(`SS_T('vsNoSky')`)) && off.wm === 'gold@23@VERSUS');
ok('the ghost ledger: the standing duels\' names at low alpha + the return line',
  off.texts.includes('Quiet Owl · Umbral Raven') && off.texts.includes(await B.ev(`SS_T('vsGhost')`)) && off.ghostA === 0.55,
  JSON.stringify(off.texts));
ok('TRY THE SKY AGAIN stands at 44-pt; no identity chip on a dead sky', off.texts.includes(await B.ev(`SS_T('vsRetry')`)) && off.retryHit >= 43.5 && off.chip === false);
ok('the Duelists stand dimmed and the shared star is unlit',
  off.heroA[0] === 0.45 && off.heroA[1] === 0.45 && off.zen === 'dot' && off.zenTint === 0x4a5480, JSON.stringify(off.heroA));
await B.send('Network.setBlockedURLs', { urls: [] });
await B.park();

/* ---------- 10. the home door pin ---------- */
console.log('— THE HOME DOOR (THE SWEPT WORD) —');
ok('A stands on the meadow', await A.nav(BASE + '?fps=0') && await A.until(READY, 60000));
const homePin = await A.ev(`JSON.stringify((() => { const h = game.scene.getScene('home');
  const lab = h.rowLabels && h.rowLabels.versus; if (!lab) return { missing: 1 };
  return { text: lab.text, want: SS_T('versus'), n: (lab.vsGlyphs || []).length,
    sym: (lab.vsGlyphs || []).length === 2 ? Math.abs((lab.vsGlyphs[0].x - lab.x) + (lab.vsGlyphs[1].x - lab.x)) : 99,
    onLine: (lab.vsGlyphs || []).every(g => Math.abs(g.y - lab.y) < 1),
    keys: (lab.vsGlyphs || []).map(g => g.texture.key) } })())`).then(JSON.parse);
ok('the home door reads the swept word — VERSUS, no emoji', !homePin.missing && homePin.text === homePin.want && homePin.text === 'VERSUS');
ok('two drawn blades flank the label symmetrically', !homePin.missing && homePin.n === 2 && homePin.sym < 1.5 && homePin.onLine
  && homePin.keys.every((k) => k === 'vsswords'), JSON.stringify(homePin));
ok('the glyphs ride the label when its live sub-line lifts it', await (async () => {
  await A.ev(`game.scene.getScene('home').setRowSub('versus', SS_T('vsFriendsOn', 1), '#ffe9a8', true); 1`);
  await sleep(400);
  const r = JSON.parse(await A.ev(`JSON.stringify((() => { const h = game.scene.getScene('home'); const lab = h.rowLabels.versus;
    return { ok: (lab.vsGlyphs || []).every(g => Math.abs(g.y - lab.y) < 1) } })())`));
  await A.ev(`game.scene.getScene('home').setRowSub('versus', '', null, true); 1`);
  return r.ok;
})());

/* ---------- 11. the es dress ---------- */
console.log('— THE ES DRESS —');
await A.seed(BOOT('x2', null));
ok('es boot lands the funnel', await A.nav(BASE + '?mpuid=' + VPU + '&fps=0&lang=es') && await A.until(READY, 60000) && await toMenu(A)
  && await A.ev(`game.scene.getScene('vsmenu').doorsMode === 'funnel'`));
ok('the es funnel speaks Spanish: the fiction, the promoted door, the add door', await (async () => {
  const tx = await deepTexts(A);
  return tx.includes('aún sin rivales — tu primer duelo escribe aquí el primer nombre')
    && tx.includes(await A.ev(`SS_T('vsChWorld')`))
    && tx.includes('AÑADIR AMIGO POR NOMBRE') && tx.includes('busca un mago entre las estrellas');
})());
ok('the sheet speaks Spanish through the add door', await (async () => {
  if (!await openSheetFunnel(A)) return false;
  stx = await sheetTexts(A);
  return stx.includes('— AMIGOS —') && stx.includes('— RIVALES RECIENTES —') && stx.includes('✶ INVITAR A UN NUEVO AMIGO');
})());

ok('no page exceptions', errs.length === 0, errs.join(' || ').slice(0, 300));

/* ---------- cleanup ---------- */
await Promise.all([A.park(), B.park()]);
for (const c of codes) toDelete.add('mp/rooms/' + c);
for (const p of toDelete) await rtDel(p);
let left = 0; const leftNames = [];
for (const p of toDelete) if ((await rt(p)) !== null) { left++; leftNames.push(p); }
ok('cleanup: everything this run wrote is gone', left === 0, leftNames.join(','));
console.log(pass + '/' + (pass + fail) + ' passed');
for (const k of kids) { try { k.kill(); } catch (e) { } }
process.exit(fail ? 1 : 0);
