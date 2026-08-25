READY TODAY (PLAIN COPY — the game can draw this today; the new layers arrive with SS-SKY-01). Fire any time.
# SS-OPP-eclipse — ECLIPSE · THE DARK SUN — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
THE DARK SUN as a boss lvl 2 opponent: 9 stars, 5 lines, 1 eye; idle lumber, attack breath.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[1].bosses @239-265: append 'eclipse' — Wyatt's seat to confirm.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · ECLIPSE · THE DARK SUN · opponent (boss lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 21 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
eclipse: {
  name: 'ECLIPSE', title: 'THE DARK SUN', tier: 'boss', lvl: 2, tint: 0xffdc7a, eye: 0xfff2cc,
  stars: [[27,-27],[6,-30],[14,-27],[26,-15],[30,-4],[30,6],[-78,-50],[70,52],[-62,40]],
  edges: [[1,2],[2,0],[0,3],[3,4],[4,5]], eyes: [[27,-27]],
  fx: { idle:'lumber', atk:'breath' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   eclipse: 'THE DARK SUN',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | eclipse | ECLIPSE (the dark sun) | boss 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `eclipse: 'THE DARK SUN',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: before load, set localStorage beta3.camproster to a 20-id roster with 'eclipse' in slot 0 (and clear beta3.campaign); tap NEW CAMPAIGN through the sign sheet; wait for game.scene.isActive('battle'); assert game.scene.getScene('battle').beast.id === 'eclipse'.
- assert beastC.list.length ≤ 40 sampled at N×40+700 ms (N = 9 stars; expected 21, glints excluded) and ≤ 30 in the home showcase (expected 20).
- zero Runtime.exceptionThrown over 20 s AND the frame counter still advances; one strike lands.
- `SS_BEAST_T(SS_BEASTS.eclipse)` returns a non-empty string (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) and `Object.keys(SS_LANGS).every(l => l==='en' || (SS_STR[l].beast && SS_STR[l].beast.eclipse))` (or boot once per ?lang=xx).
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.