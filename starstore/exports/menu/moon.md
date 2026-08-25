NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-moon — THE MOON · THE NIGHT'S LANTERN — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The menu's own moon at its seat, upgraded to tonight's true phase (days since 2000-01-06T18:14Z over 29.530589, mod 1), with the maria, Tycho and its rays, and earthshine on the dark face. On the MENU SKY board dial D13 keeps the shipped crescent until flipped.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [70,425] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · THE MOON · THE NIGHT'S LANTERN · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags steady parts) · objects 7 battle / 7 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
moon: {
  name: 'THE MOON', title: 'THE NIGHT\'S LANTERN', seat: [70,425], tint: 0xf7e8c8,
  stars: [[22,0]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'moon', at:0, x:0, y:0, r:34, phase:'true', angle:24 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor moon on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.