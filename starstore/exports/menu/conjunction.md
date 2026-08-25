NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-conjunction — THE TRIO · THE EVENING TRIO — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Three wanderers in one line low over the sunset, the way the sky does it a few evenings a year: a two-day-old crescent Moon nearest the Sun with earthshine on its dark face, Venus cream and blazing with the cross, Jupiter gold above and left. None of the three twinkles.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [330,380] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · THE TRIO · THE EVENING TRIO · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts) · objects 10 battle / 10 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
conjunction: {
  name: 'THE TRIO', title: 'THE EVENING TRIO', seat: [330,380], tint: 0xfff2cc,
  stars: [[0,0],[-50,-16]], edges: [], eyes: [],
  named: [[0,'VENUS']],
  steady: [0,1],
  cross: 1.35,
  parts: [{ t:'nebula', at:0, r:24, hue:0xfff2cc, a:0.1 },
          { t:'moon', at:0, x:46, y:16, r:9, phase:0.1, angle:30 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor conjunction on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.