NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-perseids — PERSEIDS · THE FALLING NIGHT — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Comet dust from Swift-Tuttle hitting the air a hundred kilometres up every August the twelfth; every streak flies away from one point in Perseus, the radiant. Six streaks caught mid-fall: four cream, one green (magnesium), one orange fireball (sodium). Only the radiant twinkles.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [380,40] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · PERSEIDS · THE FALLING NIGHT · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags parts) · objects 12 battle / 12 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
perseids: {
  name: 'PERSEIDS', title: 'THE FALLING NIGHT', seat: [380,40], tint: 0xfff2cc,
  stars: [[0,0]], edges: [], eyes: [],
  parts: [{ t:'comet', at:0, x:-6, y:52, len:26, ang:-84, bulge:0, w:2.6, hue:0xfff2cc, a:0.45 },
          { t:'comet', at:0, x:-30, y:46, len:22, ang:-57, bulge:0, w:2.4, hue:0xfff2cc, a:0.4 },
          { t:'comet', at:0, x:-48, y:40, len:34, ang:-40, bulge:0, w:3.4, hue:0xffb066, a:0.55 },
          { t:'comet', at:0, x:-40, y:18, len:20, ang:-24, bulge:0, w:2.2, hue:0xa8ffc4, a:0.4 },
          { t:'comet', at:0, x:-62, y:8, len:24, ang:-7, bulge:0, w:2.6, hue:0xfff2cc, a:0.45 },
          { t:'comet', at:0, x:-34, y:-8, len:18, ang:13, bulge:0, w:2.2, hue:0xfff2cc, a:0.35 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor perseids on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.