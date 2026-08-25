READY TODAY (a sign is stars/edges only — ssZodiacGlyph @3546 draws lines; zero engine change). Fire any time.
# SS-SIGN-pisces — PISCES · THE TWIN FISH — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
PISCES · THE TWIN FISH (water) redrawn: 14 stars, 15 lines. id/name/title/el/desc unchanged — the boon stays: The deep current: words woven at one cast from the strike deal +30%..
The store's new layers on this sign (hues, parts, named, pulse) are not exported — the game draws a sign as lines only.

## WHERE IT LIVES
- SS_ZODIAC (data.js:294-357): replace the stars/edges of the pisces entry in place — id/name/title/el/desc unchanged; no pool changes.
- No 13th sign: the game is hard-wired to twelve (game.js:6774 `cleared >= 12`, the 3x4 picker @5229, the profile strip @7121) — this card replaces one of them, never adds.

## THE DATA
```js
// STARSPELL sky object · PISCES · THE TWIN FISH · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 28 battle / 28 home
// REPLACE stars/edges of SS_ZODIAC_BY.pisces (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[52,44],[18,34],[-14,26],[-44,22],[-66,14],[-84,20],[-86,36],[-68,42],[-52,34],[46,16],[40,-12],[34,-40],[24,-58],[44,-60]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,3],[0,9],[9,10],[10,11],[11,12],[12,13],[13,11]],
```

## REGISTER
1. strings.js: nothing — the zod titles and boons are unchanged.
2. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: clear beta3.campaign, tap NEW CAMPAIGN; the sign sheet draws 12 glyphs in the 3x4 grid with pisces's new stars/edges; pick it; the profile strip @7121 draws the same glyph; zero Runtime.exceptionThrown over 20 s AND the frame counter still advances.
- The other eleven signs unchanged by star/edge counts; the 26 shipped beasts untouched.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
The other eleven signs, the boons (desc), the elements, every beast, no pool, no fight math, no saves, no star chart or zodiac glyph code.