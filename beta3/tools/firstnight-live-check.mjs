// FIRSTNIGHT-LIVE-CHECK — the first night on the LIVE index.html (no shim):
// A a stranger's first open (gate, lure, f5night minted, VULPES + the en
// script, zero exceptions) · B a returning player's quick run is the shipped
// one (f5Night off, no rig/rungs/script, the old refusal, no glint/gate/
// prompt at a 12s stall, no quickck, no f5night) · C every tongue's script
// stands and every lesson line is authored in-tongue and fits the frame.
// Needs playwright-core (PW_DIR) and beta3 served on :8912
// (FNBASE overrides). Shots land in ./fnshots (scratch).
//   PW_DIR=<dir holding node_modules/playwright-core> node tools/firstnight-live-check.mjs
import { createRequire } from 'node:module';
// playwright-core from PW_DIR (a folder holding node_modules/playwright-core) or beside this file
const { chromium } = createRequire(process.env.PW_DIR ? process.env.PW_DIR.replace(/\/?$/, '/') : import.meta.url)('playwright-core');
const CH = '/Users/admin/Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
const BASE = process.env.FNBASE || 'http://localhost:8912/';
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) pass++; else fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d !== undefined ? '  [' + d + ']' : '')); };
const b = await chromium.launch({ executablePath: CH, args: ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const errs = [];
async function fresh(lang, seedProfile) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: false });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { if (!/WebGL context/.test(String(e))) errs.push(String(e).slice(0, 160)); });
  await p.route(/firebase|gstatic/, (r) => r.abort());
  await p.goto(BASE + 'ascent.html'); 
  await p.evaluate((sp) => { localStorage.clear(); sessionStorage.clear(); if (sp) localStorage.setItem('beta3.profile', sp); }, seedProfile || null);
  await p.goto(BASE + 'index.html?fps=0' + (lang ? '&lang=' + lang : ''));
  return { ctx, p };
}
const until = async (p, fn, ms = 40000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await p.evaluate(fn)) return true; } catch (e) { } await p.waitForTimeout(250); } return false; };

console.log('— A. a stranger\'s first open (live index.html, no shim) —');
{
  const { ctx, p } = await fresh();
  ok('the FTUE gate opens on a virgin device', await until(p, '!!window.__ssftue && window.__ssftue.on === true'));
  ok('the lure asks at the standing title (straight into the night)', await until(p, "window.__ssftue.state === 'lure'"), await p.evaluate('window.__ssftue && window.__ssftue.state'));
  ok('…the first-night flag is minted locally (SS.prof.f5night)', await p.evaluate('SS.prof.f5night === 1'));
  await p.waitForTimeout(600);
  await p.screenshot({ path: '/tmp/fnshots-1-title-lure.png' });
  await p.mouse.click(195, 600);
  ok('the tap leans into fight 1 — the guided board', await until(p, "window.__ssftue.state === 'board' || window.__ssftue.state === 'guide'"), await p.evaluate('window.__ssftue.state'));
  const B = "game.scene.getScene('battle')";
  ok('fight one is VULPES, the night\'s run carries f5Night + the en script', await p.evaluate(`${B}.beast && ${B}.fights[0].id === 'vulpes' && ${B}.f5Night === true && !!${B}.f5G && ${B}.f5G.words.map(w=>w.join('')).join(',') === 'star,moons,sky,tonight,halo,dawn'`), await p.evaluate(`${B}.f5G && ${B}.f5G.words.map(w=>w.join('')).join(',')`));
  await p.waitForTimeout(2600);
  await p.screenshot({ path: '/tmp/fnshots-2-guided-hand.png' });
  ok('zero page exceptions through the first open', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('— B. a returning player\'s quick run is the shipped one —');
{
  const { ctx, p } = await fresh(null, JSON.stringify({ rating: 1000, ftue: 1, runs: 12 }));
  ok('the meadow boots with the gate shut', await until(p, "!!window.__ssftue && window.__ssftue.on === false && game.scene.getScene('home').sys.isActive()"));
  await p.goto(BASE + 'index.html?fps=0&quick=1');
  const B = "game.scene.getScene('battle')";
  ok('a quick fight stands', await until(p, `${B} && ${B}.sys.isActive() && ${B}.state === 'pick'`, 60000));
  ok('…f5Night is OFF, no rig, no rungs, no script', await p.evaluate(`${B}.f5Night === false && ${B}.f5Rungs === null && ${B}.f5Queue.length === 0 && !${B}.f5G && ${B}.ftue === false`));
  ok('…fight one is not pinned/tuned for the night (mult ≠ ember 2.8 unless chance)', await p.evaluate(`${B}.fights[0].mult !== SS_F5_EMBER_MULT || ${B}.fights[0].tcut !== -2`));
  // a one-tile refusal: the shipped shake, never the split grammar
  await p.evaluate(`(() => { const b = ${B}; b.tapTile ? b.tapTile(0) : b.board[0].c.emit('pointerdown'); return 1 })()`);
  await p.evaluate(`${B}.tryCast()`);
  await p.waitForTimeout(500);
  ok('a refused cast keeps the shipped grammar (no bounce/dust)', await p.evaluate('window.__f5refusal === undefined'));
  // an honest stall: no glint, no scry gate, no prompt
  await p.evaluate(`(() => { const b = ${B}; b.sel.slice().forEach(()=>{}); return 1 })()`);
  await p.waitForTimeout(12500);
  ok('a 12s stall: no glint, no scry gate, no lesson prompt', await p.evaluate(`!window.__f5glint && !${B}.f5ScryGate && !window.__f5prompt`), await p.evaluate('JSON.stringify({g:window.__f5glint||0,p:window.__f5prompt||null})'));
  ok('…and no quick checkpoint was written', await p.evaluate("localStorage.getItem('beta3.quickck') === null"));
  ok('…the profile never gains the night flag', await p.evaluate('!SS.prof.f5night'));
  ok('zero page exceptions on the veteran run', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('— C. every tongue: the script and the lesson lines fit —');
for (const lang of ['en', 'es', 'fr', 'pt', 'de']) {
  const { ctx, p } = await fresh(lang);
  await until(p, "!!window.__ssftue && window.__ssftue.state === 'lure'");
  await p.mouse.click(195, 600);
  const B = "game.scene.getScene('battle')";
  await until(p, `${B} && !!${B}.f5G`);
  const r = await p.evaluate(`(() => { const b = ${B}, l = b.L, P = SS_F5_PROMPTS[PACK.lang];
    const fill = (s) => s.replace('{x}','6').replace('{d}','16').replace('{p}','10').replace('{m}','1.5').replace('{a}','8').replace('{b}','50').replace('{c}','42').replace('{h}','6');
    const out = []; for (const k of Object.keys(SS_F5_PROMPTS.en)) { const c = ssF5Frame(b, fill((P && P[k]) || SS_F5_PROMPTS.en[k])); out.push([k, Math.round(c.f5W), !!(P && P[k])]); c.destroy(); }
    return { lang: PACK.lang, W: Math.round(l.W), words: b.f5G.words.map(w=>w.join('')).join(' '), out } })()`);
  const over = r.out.filter(([, w]) => w > r.W - 8);
  ok(lang + ': the script stands (' + r.words + '), every lesson line authored in-tongue and inside the frame', r.lang === lang && r.out.every(([, , own]) => own) && over.length === 0, over.map((o) => o.join(':')).join(' ') || ('widest ' + Math.max(...r.out.map((o) => o[1])) + ' / ' + r.W));
  if (lang === 'de') await p.screenshot({ path: '/tmp/fnshots-3-de-guided.png' });
  await ctx.close();
}
ok('zero page exceptions across the tongues', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log('\n' + pass + ' passed · ' + fail + ' failed');
await b.close();
