// DESC-CHECK — the two-line sigil descs (v0.44.0).
// TestFlight v0.43.0: FIRST LIGHT, BLOOD INK, LEYLINE ROOTS (and v0.38's
// MOONWARD) reached Wyatt's phone with NO effect text — every victim a desc
// that wraps to a second line. A Phaser multi-line wrapped-italic bake is
// inkless on iOS WebKit for these strings, and the healer's re-bake fails the
// same way. The fix never bakes a multi-line Text on these surfaces: Phaser's
// own wrap measurement picks the lines, each line is its own single-line Text
// (ssWrapLines / ssTextBlock). This suite pins THE LAW — no desc bakes
// multi-line in a single Text — on the pick card, the YOUR POWERS inspector +
// sleeping gallery, and the forge ceremony, for all 24 sigils in all 10
// languages, on BOTH renderers; proves every line holds ink; proves the breaks
// land exactly where the old wordWrap put them (and that CJK, which the old
// wrap could not break at all, now fits); pixel-compares a two-line card
// against a legacy wordWrap card; walks the real pick with a real tap; and
// drills the hardened healer (a re-bake that stays inkless is reported as
// `unhealable:`, never counted).
// Run from beta3/ with the folder served on :8899 and a headless Chrome on
// :9446 — the three swiftshader flags, because ?rend=gl is walked too:
//
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --no-sandbox --mute-audio --enable-unsafe-swiftshader \
//     --use-gl=angle --use-angle=swiftshader --remote-debugging-port=9446 \
//     --user-data-dir=/tmp/cdp-desc --window-size=390,844 \
//     --force-device-scale-factor=3 about:blank &
//   node tools/desc-check.mjs
//
// ⚠ Every wait POLLS; ?rend=gl under swiftshader can run at 1 fps (see
// tools/README.md), where a tap must be HELD to be seen at all.
import { writeFileSync } from 'node:fs';
const BASE = 'http://localhost:8899/index.html';
const PORT = 9446;
const SHOTS = process.env.SHOTS || '/tmp';
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
    const t = (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 200);
    if (!/WebGL context/.test(t)) errs.push(t);
  }
};
await new Promise(r => ws.onopen = r);
const send = (m, p) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.addScriptToEvaluateOnNewDocument', { source: 'navigator.share = undefined;' });
const ev = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r?.result?.value;
};
const evj = async (e) => JSON.parse(await ev(e));
const nav = async (u, w) => { await send('Page.navigate', { url: u }); await sleep(w); };
const until = async (e, cap = 60000) => {
  for (let i = 0; i < cap / 500; i++) { try { if (await ev(e) === true) return true; } catch (x) { } await sleep(500); }
  return false;
};
const HOME_REST = `!!window.game && game.scene.isActive('home')
  && !game.scene.getScene('home').introPlaying && !!game.scene.getScene('home').lanternB`;
// a real press on a design point; on the 1-fps GL box the press is HELD so a
// frame actually sees the pointer down (a 60 ms tap lands inside one frame)
const tapD = async (dx, dy, hold) => {
  const p = JSON.parse(await ev(`(() => { const s = game.scene.getScenes(true)[0], l = ssLayout(s);
    const b = game.canvas.getBoundingClientRect();
    return JSON.stringify({ x: b.left + l.x(${dx}) / game.canvas.width * b.width,
                            y: b.top + l.y(${dy}) / game.canvas.height * b.height }) })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  if (hold) await sleep(600);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  if (hold) await sleep(2200);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
const tapUntil = async (dx, dy, done, hold, tries = 8) => {
  for (let i = 0; i < tries; i++) { await tapD(dx, dy, hold); await sleep(hold ? 1500 : 450); if (await ev(done) === true) return true; }
  return false;
};
// the frame as the renderer holds it — Page.captureScreenshot hands back a
// stale WebGL frame; renderer.snapshot reads the buffer properly
const snap = async (name) => {
  const data = await ev(`new Promise(res => game.renderer.snapshot(img => res(img.src)))`);
  writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(data.split(',')[1], 'base64'));
};

const LANGS = ['en', 'es', 'fr', 'pt', 'de', 'ja', 'ko', 'zh', 'hi', 'ar'];
const SWAP = (lang) => `(() => { if (!window.__keepEn) window.__keepEn = SS_STR.en;
  SS_STR.en = '${lang}' === 'en' ? window.__keepEn : SS_STR['${lang}']; return SS_LANG })()`;
/* the JS the page runs, shared by every surface: a block reader + the law */
const LIB = `(() => {
  if (window.__dc) return 'lib';
  const inkOf = (t) => { try { return ssHasInk(t); } catch (e) { return false; } };
  const blocks = (root, key) => { const out = []; const w = (ls) => ls.forEach(o => {
    if (o.getData && o.getData('textBlock') && o.getData(key)) out.push(o); if (o.list) w(o.list); }); w(root); return out; };
  // THE LAW: no Text on the surface holds a newline, and none would wrap to
  // more than one line if asked
  const law = (root) => { const bad = []; const w = (ls) => ls.forEach(o => {
    if (o.type === 'Text') {
      const t = o.text || '';
      if (t.includes('\\n')) bad.push('nl:' + t.slice(0, 20));
      else if (o.style.wordWrapWidth && (() => { const w = o.getWrappedText(t); return Array.isArray(w) ? w.length > 1 : String(w).includes('\\n'); })()) bad.push('wrap:' + t.slice(0, 20));
    }
    if (o.list) w(o.list); }); w(root); return bad; };
  const cjk = (s) => /[぀-ヿ㐀-鿿]/.test(s);
  // what the OLD code would have drawn: Phaser's basic wordWrap of the same
  // string, same font, same width
  const legacy = (s, str, b) => { const o = b.blockOpts; const p = s.make.text({ text: str,
    style: { fontFamily: SERIF, fontSize: o.fontSize, fontStyle: o.fontStyle, wordWrap: { width: o.wrapW } } }, false);
    const w = p.getWrappedText(str); const ls = Array.isArray(w) ? w : String(w).split('\\n'); p.destroy(); return ls; };
  const read = (s, b, str) => {
    const lines = b.lines.map(t => t.text);
    const size = parseFloat(b.lines[0] && b.lines[0].style.fontSize), size0 = parseFloat(b.blockOpts.fontSize);
    const leg = legacy(s, str, b);
    const fit = b.lines.every(t => t.width <= b.blockOpts.wrapW + 1.5);
    return { n: lines.length, ink: b.lines.every(inkOf), nl: lines.some(t => t.includes('\\n')),
      match: cjk(str) ? fit : (size < size0 ? fit : lines.join('|') === leg.join('|')),
      shrunk: size < size0, fit, lines, leg };
  };
  window.__dc = { blocks, law, read, inkOf };
  return 'lib';
})()`;

console.log('\nDESC-CHECK · the two-line sigil descs\n');

for (const rend of ['cv', 'gl']) {
  console.log(`\n── ?rend=${rend} ──`);
  await ev(`localStorage.removeItem('beta3.profile'); localStorage.removeItem('beta3.campaign'); 'x'`).catch(() => { });
  await nav(`${BASE}?rend=${rend}&fps=0`, 4000);
  ok('the meadow stands', await until(HOME_REST, 90000));
  const r = await ev(`game.renderer.type === Phaser.WEBGL ? 'gl' : 'cv'`);
  ok(`the renderer really is ${rend}`, r === rend, r);
  await ev(LIB);
  const slow = rend === 'gl';

  /* ---- 1. THE PICK CARD, 24 × 10 — AND EVERY TIER'S DESC (v0.66.0) ------ */
  // tier I rides the full card build; tiers II+ (39 ladder descs) render as
  // bare ssTextBlocks at the card's own geometry — the one-line law lives in
  // the block, not the chrome — asserting ink, wrap, legacy-match and that
  // SS_SIG substituted every %k (no template marker survives to the glass)
  const total = { cards: 0, two: 0, bad: [] };
  for (const lang of LANGS) {
    await ev(SWAP(lang));
    const res = await evj(`(() => { const s = game.scene.getScene('home'), l = ssLayout(s), D = window.__dc; const out = [];
      for (const sg of SS_SIGILS) {
        const c = ssSigilCard(s, l, sg, 336, 146).setPosition(l.x(0), l.y(400)).setDepth(999);
        const b = D.blocks(c.list, 'sigilDesc')[0];
        const r = b ? D.read(s, b, SS_SIG(sg).desc) : { n: 0, ink: false };
        r.id = sg.id; r.law = D.law(c.list); r.pct = /%\\d/.test(SS_SIG(sg).desc);
        out.push(r); c.destroy();
        const tex = ssSigilCardTex(s, sg.rarity | 0, 336, 146);
        const gxx = -168 + tex.mx, lxx = gxx + tex.mr + 14, mw = 168 - lxx - 12;
        for (let t = 2; t <= 1 + ((sg.tl || []).length); t++) {
          const str = SS_SIG(sg, t).desc;
          const b2 = ssTextBlock(s, l.x(0), l.y(400), str, { fontSize: l.u(12.5) + 'px', color: '#c3c6da', fontStyle: 'italic', wrapW: l.u(mw + 4), lineSpacing: l.u(2) });
          const r2 = D.read(s, b2, str); r2.id = sg.id + ':' + t; r2.law = []; r2.pct = /%\\d/.test(str);
          out.push(r2); b2.destroy();
        }
      }
      return JSON.stringify(out) })()`);
    const bad = res.filter(x => !(x.n >= 1 && x.ink && !x.nl && x.match && x.fit && x.law.length === 0 && !x.pct));
    const two = res.filter(x => x.n >= 2).length;
    total.cards += res.length; total.two += two; total.bad.push(...bad.map(b => lang + ':' + b.id + ' ' + JSON.stringify(b).slice(0, 120)));
    ok(`${lang}: all 24 pick descs + 39 tier descs — ink on every line, no newline, no stray %k, breaks where wordWrap put them (${two} multi-line, ${res.filter(x => x.shrunk).length} shrunk)`,
      bad.length === 0 && res.length === 63, bad.length ? bad[0].id + ' ' + JSON.stringify(bad[0]).slice(0, 160) : 'n=' + res.length);
  }
  ok(`${total.cards} descs walked, ${total.two} of them multi-line, and not one bakes a multi-line Text`, total.bad.length === 0);
  await ev(SWAP('en'));
  ok('the English two-liners split as the phone saw them: FIRST LIGHT / BLOOD INK / LEYLINE ROOTS / MOONWARD are 2 lines each',
    await ev(`(() => { const s = game.scene.getScene('home'), l = ssLayout(s), D = window.__dc;
      return ['first','blood','roots','ward'].every(id => { const c = ssSigilCard(s, l, SS_SIG_BY[id], 336, 146);
        const n = D.blocks(c.list, 'sigilDesc')[0].lines.length; c.destroy(); return n === 2 }) })()`) === true);

  /* ---- 1b. THE SIGN DESCS AT THEIR LEVELS, 12 × 10 (v0.69.0) ----------- */
  // each sign's desc rendered at L1 / the today-band (22) / the summit (50)
  // plus every wording-band crossing (z.db) — bare ssTextBlocks at the
  // picker card's own geometry (fontSize 11, wrap 236), asserting ink, the
  // one-line law, wordWrap-equality with SS_ZOD's own return, no stray %k
  for (const lang of LANGS) {
    await ev(SWAP(lang));
    const res = await evj(`(() => { const s = game.scene.getScene('home'), l = ssLayout(s), D = window.__dc; const out = []; const seen = new Set();
      for (const z of SS_ZODIAC) {
        for (const lv of [1, 22, 50].concat(z.db || [])) {
          const str = SS_ZOD(z, lv).desc;
          if (seen.has(z.id + '|' + str)) continue; seen.add(z.id + '|' + str);
          const b = ssTextBlock(s, l.x(0), l.y(400), str, { fontSize: l.u(11) + 'px', color: '#e6dfc8', fontStyle: 'italic', wrapW: l.u(236), align: 'center', ox: 0.5, oy: 0 });
          const r = D.read(s, b, str); r.id = z.id + ':' + lv; r.pct = /%\\d/.test(str);
          out.push(r); b.destroy();
        }
      }
      return JSON.stringify(out) })()`);
    const badZ = res.filter(x => !(x.n >= 1 && x.ink && !x.nl && x.match && x.fit && !x.pct));
    ok(`${lang}: sign descs at L1/22/50 + every wording band — ${res.length} distinct strings, ink on every line, no stray %k`,
      badZ.length === 0 && res.length >= 36, badZ.length ? badZ[0].id + ' ' + JSON.stringify(badZ[0]).slice(0, 140) : 'n=' + res.length);
  }
  await ev(SWAP('en'));

  /* ---- 2. A TWO-LINE CARD AGAINST THE OLD BAKE, PIXEL FOR PIXEL --------- */
  // the new card above, a legacy wordWrap card below (same chrome, the desc
  // re-drawn exactly as v0.43.0 drew it); the two regions must match
  // the same spot for both — a card 200 design units lower sits at a different
  // fractional pixel, and every antialiased edge then differs on its own
  const cmp = await evj(`new Promise(res => { const s = game.scene.getScene('home'), l = ssLayout(s), D = window.__dc;
    const sg = SS_SIG_BY.blood, cam = s.cameras.main;
    const ground = s.add.rectangle(l.x(0), l.y(400), l.u(360), l.u(170), 0x101428, 1).setDepth(998);
    const grab = (cb) => { let n = 0; const tick = () => { if (++n >= 3) game.renderer.snapshot(img => {
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
      cb(cx.getImageData(Math.round(l.x(-168) - cam.scrollX), Math.round(l.y(400 - 73) - cam.scrollY), Math.round(l.u(336)), Math.round(l.u(146))).data);
    }); else game.events.once('postrender', tick); }; game.events.once('postrender', tick); };
    const a = ssSigilCard(s, l, sg, 336, 146).setPosition(l.x(0), l.y(400)).setDepth(999);
    window.__cmpCards = [a, ground];
    grab((A) => {
      a.destroy();
      const b = ssSigilCard(s, l, sg, 336, 146).setPosition(l.x(0), l.y(400)).setDepth(999);
      const blk = D.blocks(b.list, 'sigilDesc')[0], o = blk.blockOpts;
      b.add(s.add.text(blk.x, blk.y, SS_SIG(sg).desc, { fontFamily: SERIF, fontSize: o.fontSize, color: o.color, fontStyle: o.fontStyle,
        wordWrap: { width: o.wrapW }, lineSpacing: o.lineSpacing }).setOrigin(0, 0));
      blk.destroy();
      window.__cmpCards = [b, ground];
      grab((B) => { let d = 0, inkA = 0;
        for (let i = 0; i < A.length; i += 4) { d += Math.abs(A[i] - B[i]) + Math.abs(A[i+1] - B[i+1]) + Math.abs(A[i+2] - B[i+2]); if (A[i] + A[i+1] + A[i+2] > 450) inkA++; }
        res(JSON.stringify({ diff: d / (A.length / 4) / 3, bright: inkA }));
      });
    });
  })`);
  await snap(`desc-${rend}-compare`);
  await ev(`window.__cmpCards.forEach(c => c.destroy()); 'x'`);
  ok('a two-line BLOOD INK card matches a legacy wordWrap card pixel for pixel (avg channel diff < 1.5)',
    cmp.diff < 1.5 && cmp.bright > 200, cmp.diff.toFixed(3) + ' · ' + cmp.bright + ' bright px');

  /* ---- 3. THE INSPECTOR + THE SLEEPING GALLERY, 10 languages ----------- */
  await ev(`SS.prof.sig = { u: {}, c: {}, pend: [], gf: 0 }; SS.save(); 'x'`);
  for (const lang of LANGS) {
    await ev(SWAP(lang));
    const res = await evj(`(() => { const s = game.scene.getScene('home'), D = window.__dc;
      const p = ssSigilPanel(s, { sigils: SS_SIGILS.map(g => g.id), sleeping: true, depth: 900 });
      const descs = D.blocks(p.c.list, 'sigilDesc').map(b => Object.assign(D.read(s, b, b.text), { id: b.getData('sigilDesc') }));
      const hows = D.blocks(p.c.list, 'sigilHow').map(b => Object.assign(D.read(s, b, b.text), { id: b.getData('sigilHow'), oy: b.blockOpts.oy }));
      const law = D.law(p.c.list);
      const kill = (o) => { s.tweens.killTweensOf(o); if (o.list) o.list.forEach(kill); }; kill(p.c); p.c.destroy();
      return JSON.stringify({ descs, hows, law }) })()`);
    const badD = res.descs.filter(x => !(x.n >= 1 && x.ink && !x.nl && x.match && x.fit));
    const badH = res.hows.filter(x => !(x.n >= 1 && x.ink && !x.nl && x.match && x.fit && x.oy === 0.5));
    ok(`${lang}: inspector — 24 held descs + 12 sleeping conditions, every line inked, no multi-line Text (${res.descs.filter(x => x.n >= 2).length}+${res.hows.filter(x => x.n >= 2).length} multi-line)`,
      res.descs.length === 24 && res.hows.length === 12 && badD.length === 0 && badH.length === 0 && res.law.length === 0,
      (badD[0] && JSON.stringify(badD[0]).slice(0, 140)) || (badH[0] && JSON.stringify(badH[0]).slice(0, 140)) || res.law.join(','));
  }

  /* ---- 4. THE FORGE CEREMONY, 10 languages ----------------------------- */
  for (const lang of LANGS) {
    await ev(SWAP(lang));
    const res = await evj(`(() => { const s = game.scene.getScene('home'), D = window.__dc;
      const c = ssSigilRite(s, SS_SIG_BY.blood, () => {});
      const d = D.blocks(c.list, 'sigilDesc')[0], h = D.blocks(c.list, 'sigilHow')[0];
      const rd = D.read(s, d, d.text), rh = D.read(s, h, h.text);
      const sf = [d, h].every(b => b.scrollFactorX === 0 && b.lines.every(t => t.scrollFactorX === 0));
      const ladder = h.y >= d.y + d.height - 0.5;
      const law = D.law(c.list);
      const kill = (o) => { s.tweens.killTweensOf(o); if (o.list) o.list.forEach(kill); }; kill(c); c.destroy(); SS_RITE.busy = false;
      return JSON.stringify({ rd, rh, sf, ladder, law, busy: SS_RITE.busy }) })()`);
    const good = (x) => x.n >= 1 && x.ink && !x.nl && x.match && x.fit;
    ok(`${lang}: rite — effect + condition inked line by line, scrollFactor 0 on every child, the ladder stacks on measured height (${res.rd.n}+${res.rh.n} lines)`,
      good(res.rd) && good(res.rh) && res.sf && res.ladder && res.law.length === 0,
      JSON.stringify({ rd: res.rd.n, rh: res.rh.n, sf: res.sf, ladder: res.ladder, law: res.law }).slice(0, 140));
  }
  await ev(SWAP('en'));

  /* ---- 5. THE HEALER, HARDENED ------------------------------------------ */
  const heal = await evj(`(() => { const s = game.scene.getScene('home'), l = ssLayout(s), D = window.__dc;
    const c = ssSigilCard(s, l, SS_SIG_BY.first, 336, 146).setPosition(l.x(0), l.y(400)).setDepth(999);
    const t = D.blocks(c.list, 'sigilDesc')[0].lines[0];
    const wipe = () => (t.context || t.canvas.getContext('2d')).clearRect(0, 0, t.canvas.width, t.canvas.height);
    const log = []; const keep = window.SSDIAG; window.SSDIAG = (m) => log.push(m);
    wipe(); const healed1 = ssHealBlankTexts(s, 'drill'); const ink1 = D.inkOf(t);
    const up = t.updateText; t.updateText = () => {};
    wipe(); const healed2 = ssHealBlankTexts(s, 'drill'); const ink2 = D.inkOf(t);
    t.updateText = up; window.SSDIAG = keep; c.destroy();
    return JSON.stringify({ healed1, ink1, healed2, ink2, log }) })()`);
  ok('a blanked line is re-baked and COUNTED only once the re-bake shows ink',
    heal.healed1 === 1 && heal.ink1 && heal.log.some(m => /^healed 1 blank/.test(m)), JSON.stringify(heal.log));
  ok('a re-bake that stays inkless is NOT counted — DIAG says `unhealable: <first words>`',
    heal.healed2 === 0 && !heal.ink2 && heal.log.some(m => /^unhealable: Your first word each · drill/.test(m)), JSON.stringify(heal.log));

  /* ---- 6. THE REAL PICK, WITH A REAL TAP -------------------------------- */
  await ev(`(() => { game.scene.getScene('home').scene.start('battle', { mode: 'quick', resume: null }); return 1 })()`);
  ok('the battle stands', await until(`!!game.scene.getScene('battle') && game.scene.isActive('battle') && !!game.scene.getScene('battle').rollSigilOpts`, 90000));
  await sleep(slow ? 6000 : 2500);
  const pick = await evj(`(() => { const b = game.scene.getScene('battle'), D = window.__dc;
    b.rollSigilOpts = () => [SS_SIG_BY.first, SS_SIG_BY.blood, SS_SIG_BY.roots];
    b.showSigilPick();
    const bl = D.blocks(b.overlayC.list, 'sigilDesc');
    return JSON.stringify({ state: b.state, n: bl.length, lines: bl.map(x => x.lines.length), ink: bl.every(x => x.lines.every(D.inkOf)), law: D.law(b.overlayC.list) }) })()`);
  ok('the pick shows three two-line cards, every line inked, and no multi-line Text anywhere on the overlay',
    pick.state === 'sigil' && pick.n === 3 && pick.lines.join() === '2,2,2' && pick.ink && pick.law.length === 0, JSON.stringify(pick));
  await until(`(() => { const b = game.scene.getScene('battle'); let a = 0; b.overlayC.list.forEach(o => { if (o.getData && o.getData('sigilCard') && o.alpha >= 0.99) a++; }); return a === 3 })()`, 60000);
  await snap(`desc-${rend}-pick`);
  ok('a real tap on the middle card (BLOOD INK) takes it',
    await tapUntil(0, 436, `game.scene.getScene('battle').run.sigils.includes('blood')`, slow));
  ok('no page exceptions across the walk', errs.length === 0, errs.slice(0, 2).join(' | '));
}

/* ---- 7. THE REST OF THE FAMILY — a real boot in Arabic and Japanese ---- */
for (const lang of ['ar', 'ja']) {
  await nav(`${BASE}?rend=cv&fps=0&lang=${lang}`, 4000);
  ok(`a real ?lang=${lang} boot stands`, await until(HOME_REST, 90000));
  await ev(LIB);
  const res = await evj(`(() => { const s = game.scene.getScene('home'), l = ssLayout(s), D = window.__dc;
    const out = { lang: SS_LANG, bad: 0, two: 0 };
    for (const sg of SS_SIGILS) { const c = ssSigilCard(s, l, sg, 336, 146);
      const r = D.read(s, D.blocks(c.list, 'sigilDesc')[0], SS_SIG(sg).desc); if (!(r.ink && !r.nl && r.fit && r.match)) out.bad++; if (r.n > 1) out.two++; c.destroy(); }
    // the other wrapped italics: a block that is re-set and re-coloured in place
    const t = ssTextBlock(s, l.x(0), l.y(400), SS_T('abandonBody', 'X', 3), { fontSize: l.u(12) + 'px', color: '#c9c3ae', fontStyle: 'italic', shadow: true, wrapW: l.u(280), align: 'center', ox: 0.5, oy: 0.5 });
    const n1 = t.lines.length; t.setText(SS_T('vsNoFriends')).setColor('#ffffff');
    out.block = { n1, n2: t.lines.length, col: t.lines[0].style.color, law: D.law([t]).length, centred: Math.abs(t.lines[0].x) < 1 || t.lines[0].originX === 0.5 };
    t.destroy();
    return JSON.stringify(out) })()`);
  ok(`${lang} for real: SS_LANG=${res.lang}, all 24 descs inked and fitted (${res.two} multi-line); a block setText/setColor rebuilds in place`,
    res.lang === lang && res.bad === 0 && res.block.n1 >= 1 && res.block.n2 >= 1 && res.block.col === '#ffffff' && res.block.law === 0 && res.block.centred, JSON.stringify(res));
}
await ev(`localStorage.removeItem('beta3.lang'); localStorage.removeItem('beta3.profile'); 'x'`);

console.log(`\n${pass} passed, ${fail} failed${errs.length ? '\npage errors: ' + errs.join('\n') : ''}`);
ws.close();
process.exit(fail ? 1 : 0);
