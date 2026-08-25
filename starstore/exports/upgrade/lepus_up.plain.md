READY TODAY (PLAIN COPY — the game can draw this today; the new layers arrive with SS-SKY-01). Fire any time.
# SS-UP-lepus — LEPUS · THE MOONLIT HARE — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The shipped lepus re-authored in the Star Store: 12 stars, 11 lines, 1 eye; idle bob, attack pounce.
Changed against the shipped record: nothing yet — the block below equals the shipped one.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the lepus record in the basics block @34-81 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · LEPUS · THE MOONLIT HARE · opponent (an UPGRADE of the shipped record) (basic lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 23 battle / 23 home
// REPLACE the lepus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
lepus: {
  name: 'LEPUS', title: 'THE MOONLIT HARE', tier: 'basic', lvl: 2, tint: 0xbfe8c9, eye: 0xa8ffc4,
  stars: [[-10,-64],[14,-60],[-2,-38],[8,-30],[26,-26],[0,-4],[8,18],[-28,-18],[-52,-6],[-58,16],[-36,34],[-66,-14]],
  edges: [[0,2],[1,2],[2,3],[3,4],[3,5],[5,6],[5,7],[7,8],[8,9],[9,10],[8,11]], eyes: [[12,-32]],
  fx: { idle:'bob', atk:'pounce', hops:2 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the lepus row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the lepus row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: before load, set localStorage beta3.camproster to a 20-id roster with 'lepus' in slot 0 (and clear beta3.campaign); tap NEW CAMPAIGN through the sign sheet; wait for game.scene.isActive('battle'); assert game.scene.getScene('battle').beast.id === 'lepus'.
- assert beastC.list.length ≤ 40 sampled at N×40+700 ms (N = 12 stars; expected 23, glints excluded) and ≤ 30 in the home showcase (expected 23).
- zero Runtime.exceptionThrown over 20 s AND the frame counter still advances; one strike lands.
- `SS_BEAST_T(SS_BEASTS.lepus)` returns a non-empty string (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) and `Object.keys(SS_LANGS).every(l => l==='en' || (SS_STR[l].beast && SS_STR[l].beast.lepus))` (or boot once per ?lang=xx).
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.