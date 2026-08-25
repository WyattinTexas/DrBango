NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-milkyway — THE RIVER · THE MILKY WAY — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Our own galaxy seen edge-on from inside, standing up from the south-west on an August dusk: five faint overlapping blobs make the band and forty baked dust stars ride it in four clusters. Nothing moves but the dust's twinkle, and nothing here is brighter than the showcase.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [210,300] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · THE RIVER · THE MILKY WAY · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 15 battle / 15 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
milkyway: {
  name: 'THE RIVER', title: 'THE MILKY WAY', seat: [210,300], tint: 0xcfd8ff,
  stars: [[0,0]], edges: [], eyes: [],
  parts: [{ t:'nebula', at:0, x:-62, y:36, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:-31, y:18, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:0, y:0, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:31, y:-18, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:62, y:-36, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'cluster', at:0, x:-47, y:27, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:-16, y:9, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:16, y:-9, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:47, y:-27, n:10, r:26, hue:0xfff2cc, a:0.5 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor milkyway on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.