// LANG-CHECK — the cut to five languages is TOTAL (v0.71.0).
// Skylar (9/2): "Cut out all Asian languages from star spell and Arabic as
// well, so leaving just English, Spanish, French, Portuguese, and German."
// The game side: the ja/ko/zh/hi/ar SS_STR blocks and their SS_LANGS rows are
// gone from strings.js (~900 lines), the langSheet derives its rows from
// Object.keys(SS_STR) so the parchment offers exactly five, SS_LANG's cascade
// drops a saved-but-cut language (the dead beta3.lang key is swept) and lands
// on the device locale's best-of-five, else English, and the two removed-lang
// special cases in game.js (the ja/zh half of the CJK wrap test — the
// content-sniffing regex STAYS for player-typed CJK names — and the ar RTL
// wordmark branch) are retired. This suite proves the cut everywhere: the
// served sources carry no removed-language block, native name or SS_LANG
// branch; the booted tables are exactly en/es/fr/pt/de; the sheet renders
// five rows by a real tap and a real row pick saves + reboots into Spanish;
// a stale saved 'ja' (the shape that used to poison desc-check's rig) falls
// through to a clean English boot; a wild ?lang=ja link saves nothing; and a
// de-DE device with a cut saved language lands on German, not bare English.
// Self-launching like seed-check: serves beta3 on :8899 if nothing does,
// headless Chrome on :9470 (/tmp/cdp-lang, --disable-gpu), Firebase blocked
// at the network layer throughout.
//
//   node tools/lang-check.mjs      # ~2 min
//
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
const PORT = 9470, SRV = 8899;
const BASE = 'http://localhost:' + SRV + '/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const KEEP = ['en', 'es', 'fr', 'pt', 'de'], CUT = ['ja', 'ko', 'zh', 'hi', 'ar'];
let pass = 0, fail = 0;
const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- the source audit (no browser needed) ---------- */
console.log('— THE SOURCE AUDIT: NOTHING OF THE CUT SHIPS —');
const served = readdirSync('.').filter((f) => /\.(js|html)$/.test(f) && !/^words/.test(f));
const NATIVE = /日本語|한국어|中文|हिन्दी|العربية/;
const badNative = served.filter((f) => NATIVE.test(readFileSync(f, 'utf8')));
ok('no removed native name (日本語/한국어/中文/हिन्दी/العربية) in any served file', badNative.length === 0, badNative.join(','));
const BRANCH = /SS_LANG\s*===\s*'(ja|ko|zh|hi|ar)'/;
const badBranch = served.filter((f) => BRANCH.test(readFileSync(f, 'utf8')));
ok("no SS_LANG === '<cut>' branch survives in any served file", badBranch.length === 0, badBranch.join(','));
const strSrc = readFileSync('strings.js', 'utf8');
ok('strings.js holds no removed-language block key', !/^  (ja|ko|zh|hi|ar): \{/m.test(strSrc));
ok('strings.js SS_LANGS literal names exactly the five', /const SS_LANGS = \{\n  en: 'English', es: 'Español', fr: 'Français', pt: 'Português', de: 'Deutsch',\n\};/.test(strSrc));
ok('the cascade sweeps a dead saved key (the stale-profile cure)', /localStorage\.removeItem\('beta3\.lang'\)/.test(strSrc));
const gameSrc = readFileSync('game.js', 'utf8');
ok('the wordmark keeps no RTL branch', !/direction = 'rtl'/.test(gameSrc));
ok('the CJK wrap test is content-sniffed only (player-typed names still wrap char-level)',
  /const cjk = \/\[぀-ヿ㐀-鿿\]\/\.test\(s\);/.test(gameSrc));
const seedSrc = readFileSync('seed-names.js', 'utf8');
ok('seed-names LANGS is already exactly the five', /LANGS = \['en', 'es', 'fr', 'pt', 'de'\]/.test(seedSrc));
const dictFiles = readdirSync('.').filter((f) => /^words-/.test(f));
ok('dictionaries on disk are the four non-en packs only', dictFiles.sort().join(',') === 'words-de.js,words-es.js,words-fr.js,words-pt.js', dictFiles.join(','));

/* ---------- server + browser ---------- */
const kids = [];
async function serving() { try { return (await fetch(BASE)).ok; } catch (e) { return false; } }
if (!(await serving())) {
  kids.push(spawn('python3', ['-m', 'http.server', String(SRV)], { cwd: process.cwd(), stdio: 'ignore' }));
  for (let i = 0; i < 40 && !(await serving()); i++) await sleep(250);
}
kids.push(spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--remote-debugging-port=' + PORT,
  '--user-data-dir=/tmp/cdp-lang', '--window-size=390,844', '--force-device-scale-factor=3', 'about:blank'], { stdio: 'ignore' }));
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
await send('Page.addScriptToEvaluateOnNewDocument', { source: `navigator.share = undefined; navigator.clipboard = undefined;` });
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
const tapAt = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(40);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(70);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const tap = async (expr) => {
  const p = JSON.parse(await ev(`(() => { const o = ${expr}; const cam = o.scene.cameras.main, b = o.getBounds();
    const D = game.scale.width / innerWidth;
    return JSON.stringify({ x: (b.centerX - cam.scrollX) / D, y: (b.centerY - cam.scrollY) / D }) })()`));
  await tapAt(p.x, p.y);
};
const tapUntil = async (expr, done, tries = 8) => {
  for (let i = 0; i < tries; i++) { await tap(expr); await sleep(500); if (await ev(done) === true) return true; }
  return false;
};
const HOME_REST = `!!window.game && game.scene.isActive('home')
  && !game.scene.getScene('home').introPlaying && !!game.scene.getScene('home').lanternB`;
const H = `game.scene.getScene('home')`;
const boot = async (q, seed) => {
  await send('Page.navigate', { url: 'http://localhost:' + SRV + '/ascent.html' }); await sleep(500);
  await ev(`localStorage.clear(); sessionStorage.setItem('beta3.skipIntro', '1'); ${seed || ''} 'ok'`);
  await send('Page.navigate', { url: BASE + '?fps=0' + (q ? '&' + q : '') }); await sleep(2500);
  await until(`typeof SS_LANG !== 'undefined' && !!window.game`, 30000);
  errs.length = 0;   // a dropped first navigate can strand a half document — only the landed boot counts
};

/* ================= THE TABLES ================= */
console.log('\n— THE BOOTED TABLES: EXACTLY FIVE, EVERYWHERE —');
await boot();
ok('the meadow stands', await until(HOME_REST, 90000));
const tables = await evj(`JSON.stringify({ str: Object.keys(SS_STR), langs: Object.keys(SS_LANGS), packs: Object.keys(SS_PACKS),
  lang: SS_LANG, gl: ssGameLang(), cut: ${JSON.stringify(CUT)}.filter((k) => SS_STR[k] || SS_LANGS[k] || SS_PACKS[k]) })`);
ok('Object.keys(SS_STR) is exactly en,es,fr,pt,de', tables.str.join(',') === KEEP.join(','), tables.str.join(','));
ok('SS_LANGS carries exactly the same five native names', tables.langs.join(',') === KEEP.join(','), tables.langs.join(','));
ok('SS_PACKS still carries exactly the five gameplay packs', tables.packs.join(',') === KEEP.join(','), tables.packs.join(','));
ok('no cut code resolves anywhere (SS_STR / SS_LANGS / SS_PACKS)', tables.cut.length === 0, tables.cut.join(','));
ok('a bare boot is English on this en-locale box', tables.lang === 'en' && tables.gl === 'en', tables.lang);
const packShape = await evj(`JSON.stringify(${JSON.stringify(KEEP)}.map((k) => { const p = SS_PACKS[k];
  return [k, !!(p && p.bag && p.vals && p.digraph && p.vowels && Object.keys(p.bag).length >= 24)] }))`);
ok('every kept pack keeps its bag, vals, digraph and vowels', packShape.every(([, g]) => g),
  packShape.filter(([, g]) => !g).map(([k]) => k).join(','));

/* ================= THE SHEET ================= */
console.log('\n— THE PARCHMENT SHEET: FIVE ROWS, BY REAL TAPS —');
ok('a real tap on 🌐 opens the language sheet', await tapUntil(`${H}.langB`, `!!${H}.langC`));
const sheet = await evj(`JSON.stringify((() => { const c = ${H}.langC, l = ssLayout(${H});
  const rows = c.list.filter((o) => o.type === 'Text');
  const panel = c.list.find((o) => o.texture && o.texture.key === 'panel');
  return { n: rows.length, labels: rows.map((r) => r.text), ph: panel.displayHeight / l.u(1),
    ys: rows.map((r) => Math.round((r.y - l.y(0)) / l.u(1))), marked: rows.filter((r) => r.text.includes('✦')).length } })())`);
ok('the sheet offers exactly five rows', sheet.n === 5, sheet.labels.join(' · '));
ok('the rows are the five native names in table order',
  sheet.labels.map((t) => t.replace(/[✦ ]/g, '')).join(',') === 'English,Español,Français,Português,Deutsch', sheet.labels.join(','));
ok('the ✦ marker sits on the current language alone', sheet.marked === 1 && sheet.labels[0].includes('English'), sheet.labels[0]);
ok('the parchment sizes to its five rows (5·30 + 34 = 184u)', Math.abs(sheet.ph - 184) < 1.5, String(sheet.ph));
ok('the five rows sit 30 apart from 340 (the height math holds)', sheet.ys.join(',') === '340,370,400,430,460', sheet.ys.join(','));

/* a real pick: Español reboots the page into Spanish and SAVES */
await tap(`${H}.langC.list.filter((o) => o.type === 'Text')[1]`);
ok('a real tap on Español reboots into Spanish', await until(`typeof SS_LANG !== 'undefined' && SS_LANG === 'es' && ${HOME_REST}`, 60000));
const es = await evj(`JSON.stringify({ lang: SS_LANG, saved: localStorage.getItem('beta3.lang'), gl: ssGameLang(),
  dict: SS_DICT.ready('es'), door: SS_T('newCamp') })`);
ok('the pick saved (beta3.lang = es), the es pack + dictionary rode along, the meadow speaks Spanish',
  es.lang === 'es' && es.saved === 'es' && es.gl === 'es' && es.dict && es.door === 'NUEVA PARTIDA', JSON.stringify(es));
ok('reopened, the ✦ marker moved to Español', await tapUntil(`${H}.langB`, `!!${H}.langC`) &&
  await ev(`${H}.langC.list.filter((o) => o.type === 'Text')[1].text.includes('✦')`) === true);

/* ================= THE FALLBACKS ================= */
console.log('\n— A SAVED LANGUAGE THE CUT REMOVED: THE FALLBACK —');
await boot('', `localStorage.setItem('beta3.lang', 'ja');`);
ok('the stale-ja meadow stands', await until(HOME_REST, 90000));
const fb = await evj(`JSON.stringify({ lang: SS_LANG, saved: localStorage.getItem('beta3.lang'), door: SS_T('newCamp') })`);
ok('a saved ja falls through to English and the dead key is swept',
  fb.lang === 'en' && fb.saved === null && fb.door === 'NEW GAME', JSON.stringify(fb));
ok('the fallback boot threw no page exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log('\n— A ?lang=ja LINK IN THE WILD —');
await boot('lang=ja');
ok('the wild-link meadow stands', await until(HOME_REST, 90000));
const wild = await evj(`JSON.stringify({ lang: SS_LANG, saved: localStorage.getItem('beta3.lang') })`);
ok('?lang=ja neither lands nor saves — the boot is plain English', wild.lang === 'en' && wild.saved === null, JSON.stringify(wild));

console.log('\n— THE LOCALE LANDS ITS BEST OF FIVE —');
const stub = await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { Object.defineProperty(Navigator.prototype, 'language', { get: () => 'de-DE', configurable: true }); } catch (e) { }`,
});
await boot('', `localStorage.setItem('beta3.lang', 'ko');`);
ok('the de-locale meadow stands', await until(HOME_REST, 90000));
const loc = await evj(`JSON.stringify({ nav: navigator.language, lang: SS_LANG, saved: localStorage.getItem('beta3.lang'), door: SS_T('newCamp') })`);
ok('a de-DE device whose saved ko was cut lands on GERMAN (locale best-of-five, not bare English)',
  loc.nav === 'de-DE' && loc.lang === 'de' && loc.saved === null && loc.door === 'NEUES SPIEL', JSON.stringify(loc));
if (stub && stub.identifier) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: stub.identifier });

ok('no page exceptions across the whole run', errs.length === 0, errs.slice(0, 3).join(' | '));
await ev(`localStorage.clear(); 'x'`).catch(() => { });

console.log(`\n${pass} passed, ${fail} failed`);
for (const k of kids) try { k.kill(); } catch (e) { }
process.exit(fail ? 1 : 0);
