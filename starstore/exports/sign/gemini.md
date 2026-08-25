READY TODAY (a sign is stars/edges only — ssZodiacGlyph @3546 draws lines; zero engine change). Fire any time.
# SS-SIGN-gemini — GEMINI · THE TWINS — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
GEMINI · THE TWINS (air) redrawn: 12 stars, 12 lines. id/name/title/el/desc unchanged — the boon stays: Twinned letters: words that use the same letter twice deal +10..
The store's new layers on this sign (hues, parts, named) are not exported — the game draws a sign as lines only.

## WHERE IT LIVES
- SS_ZODIAC (data.js:294-357): replace the stars/edges of the gemini entry in place — id/name/title/el/desc unchanged; no pool changes.
- No 13th sign: the game is hard-wired to twelve (game.js:6774 `cleared >= 12`, the 3x4 picker @5229, the profile strip @7121) — this card replaces one of them, never adds.

## THE DATA
```js
// STARSPELL sky object · GEMINI · THE TWINS · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 25 battle / 25 home
// REPLACE stars/edges of SS_ZODIAC_BY.gemini (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[-28,-58],[30,-52],[-34,-30],[-42,-2],[-48,26],[-36,52],[-64,34],[24,-26],[34,2],[28,28],[44,52],[60,30]],
  edges: [[0,2],[2,3],[3,4],[4,5],[4,6],[1,7],[7,8],[8,9],[9,10],[9,11],[2,7],[3,8]],
```

## REGISTER
1. strings.js: nothing — the zod titles and boons are unchanged.
2. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: clear beta3.campaign, tap NEW CAMPAIGN; the sign sheet draws 12 glyphs in the 3x4 grid with gemini's new stars/edges; pick it; the profile strip @7121 draws the same glyph; zero Runtime.exceptionThrown over 20 s AND the frame counter still advances.
- The other eleven signs unchanged by star/edge counts; the 26 shipped beasts untouched.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
The other eleven signs, the boons (desc), the elements, every beast, no pool, no fight math, no saves, no star chart or zodiac glyph code.