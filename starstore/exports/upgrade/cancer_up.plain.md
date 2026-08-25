READY TODAY (PLAIN COPY — the game can draw this today; the new layers arrive with SS-SKY-01). Fire any time.
# SS-UP-cancer — CANCER · THE GLOOM CRAB — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The shipped cancer re-authored in the Star Store: 23 stars, 23 lines, 2 eyes; idle pinch, attack snap.
Changed against the shipped record: nothing yet — the block below equals the shipped one.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the cancer record in the minibosses block @82-149 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CANCER · THE GLOOM CRAB · opponent (an UPGRADE of the shipped record) (mini lvl 1)
// READY TODAY (stars/edges/eyes/tint/eye/fx/hp/atk/timer only — zero engine change) · objects 35 battle / 35 home
// REPLACE the cancer record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
cancer: {
  name: 'CANCER', title: 'THE GLOOM CRAB', tier: 'mini', lvl: 1, hp: 62, atk: 12, timer: 3, tint: 0xc79af5, eye: 0xff7ad9,
  stars: [[-20,0],[0,-12],[20,0],[14,16],[-14,16],[-38,-8],[-60,-20],[-76,-8],[-88,-20],[-72,-34],[38,-8],[60,-20],[76,-8],[88,-20],[72,-34],[-26,26],[-34,44],[0,28],[0,46],[26,26],[34,44],[-8,-24],[8,-24]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[5,6],[6,7],[7,8],[7,9],[2,10],[10,11],[11,12],[12,13],[12,14],[4,15],[15,16],[3,17],[17,18],[3,19],[19,20],[1,21],[1,22]], eyes: [[-8,-28],[8,-28]],
  fx: { idle:'pinch', atk:'snap' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the cancer row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the cancer row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: before load, set localStorage beta3.camproster to a 20-id roster with 'cancer' in slot 0 (and clear beta3.campaign); tap NEW CAMPAIGN through the sign sheet; wait for game.scene.isActive('battle'); assert game.scene.getScene('battle').beast.id === 'cancer'.
- assert beastC.list.length ≤ 40 sampled at N×40+700 ms (N = 23 stars; expected 35, glints excluded) and ≤ 30 in the home showcase (expected 35).
- zero Runtime.exceptionThrown over 20 s AND the frame counter still advances; one strike lands.
- `SS_BEAST_T(SS_BEASTS.cancer)` returns a non-empty string (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) and `Object.keys(SS_LANGS).every(l => l==='en' || (SS_STR[l].beast && SS_STR[l].beast.cancer))` (or boot once per ?lang=xx).
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.