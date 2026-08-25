READY TODAY (PLAIN COPY — the game can draw this today; the new layers arrive with SS-SKY-01). Fire any time.
# SS-UP-taurus — TAURUS · THE STORM-EYED BULL — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The shipped taurus re-authored in the Star Store: 23 stars, 17 lines, 1 eye; idle lumber, attack charge.
Changed against the shipped record: nothing yet — the block below equals the shipped one.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the taurus record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · TAURUS · THE STORM-EYED BULL · opponent (an UPGRADE of the shipped record) (boss lvl 1)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 35 battle / 34 home
// REPLACE the taurus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
taurus: {
  name: 'TAURUS', title: 'THE STORM-EYED BULL', tier: 'boss', lvl: 1, tint: 0xc4915e, eye: 0xff7a45,
  stars: [[-16,18],[-28,2],[-38,-14],[-2,2],[8,-12],[-58,-34],[-74,-52],[26,-34],[40,-56],[30,4],[58,-2],[80,10],[66,30],[70,52],[4,36],[0,58],[28,34],[30,56],[48,-24],[54,-28],[58,-22],[52,-18],[58,-30]],
  edges: [[2,1],[1,0],[0,3],[3,4],[2,5],[5,6],[4,7],[7,8],[3,9],[9,10],[10,11],[11,12],[12,13],[0,14],[14,15],[9,16],[16,17]], eyes: [[-38,-14]],
  fx: { idle:'lumber', atk:'charge' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the taurus row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the taurus row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: before load, set localStorage beta3.camproster to a 20-id roster with 'taurus' in slot 0 (and clear beta3.campaign); tap NEW CAMPAIGN through the sign sheet; wait for game.scene.isActive('battle'); assert game.scene.getScene('battle').beast.id === 'taurus'.
- assert beastC.list.length ≤ 40 sampled at N×40+700 ms (N = 23 stars; expected 35, glints excluded) and ≤ 30 in the home showcase (expected 34).
- zero Runtime.exceptionThrown over 20 s AND the frame counter still advances; one strike lands.
- `SS_BEAST_T(SS_BEASTS.taurus)` returns a non-empty string (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) and `Object.keys(SS_LANGS).every(l => l==='en' || (SS_STR[l].beast && SS_STR[l].beast.taurus))` (or boot once per ?lang=xx).
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.