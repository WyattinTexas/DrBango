NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-wish — THE WISH · THE WISHING STAR — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
One grain of comet dust, white-hot for a third of a second: a class-1 cream head in its own small bloom, a white streak trailing back toward the radiant in the top-right corner with two sparks still burning in it. The head does not twinkle; it falls. The one you are meant to wish on.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [300,120] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · THE WISH · THE WISHING STAR · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues steady parts) · objects 11 battle / 11 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
wish: {
  name: 'THE WISH', title: 'THE WISHING STAR', seat: [300,120], tint: 0xe2ecff,
  stars: [[0,0],[12,-15],[24,-29]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:7, hue:0xfff2cc, a:0.3 },
          { t:'comet', at:0, len:60, ang:-51, bulge:0, w:4.2, hue:0xe2ecff, a:0.8 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor wish on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.