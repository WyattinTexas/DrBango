NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-iss — THE ISS · THE PASSING LIGHT — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The space station crossing at dusk: a steady cream point that never twinkles, no cross, brighter than any star for the thirty-five seconds it takes to cross, then gone into Earth's shadow before the far side. The short bright streak behind it is the store's way of saying it moves.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [120,240] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · THE ISS · THE PASSING LIGHT · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: steady parts) · objects 8 battle / 8 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
iss: {
  name: 'THE ISS', title: 'THE PASSING LIGHT', seat: [120,240], tint: 0xfff2cc,
  stars: [[0,0]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:6, hue:0xfff2cc, a:0.3 },
          { t:'comet', at:0, len:44, ang:158, bulge:0, w:5, hue:0xfff2cc, a:0.85 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor iss on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.