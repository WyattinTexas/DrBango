READY TODAY (PLAIN COPY — the game can draw this today; the new layers arrive with SS-SKY-01). Fire any time.
# SS-UP-monoceros — MONOCEROS · THE GLASS UNICORN — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The shipped monoceros re-authored in the Star Store: 18 stars, 18 lines, 1 eye; idle prowl, attack charge.
Changed against the shipped record: nothing yet — the block below equals the shipped one.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the monoceros record in the minibosses block @82-149 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · MONOCEROS · THE GLASS UNICORN · opponent (an UPGRADE of the shipped record) (mini lvl 3)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 29 battle / 29 home
// REPLACE the monoceros record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
monoceros: {
  name: 'MONOCEROS', title: 'THE GLASS UNICORN', tier: 'mini', lvl: 3, tint: 0xd8d2f0, eye: 0xbfe8ff,
  stars: [[-70,-58],[-56,-42],[-46,-30],[-58,-18],[-34,-24],[-16,-30],[8,-26],[32,-28],[50,-18],[66,-2],[60,18],[-28,-6],[-34,16],[-30,44],[0,-2],[26,-4],[34,20],[28,46]],
  edges: [[0,1],[1,2],[2,3],[2,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[4,11],[11,12],[12,13],[11,14],[14,15],[15,16],[16,17],[7,15]], eyes: [[-48,-34]],
  fx: { idle:'prowl', atk:'charge' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the monoceros row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the monoceros row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: before load, set localStorage beta3.camproster to a 20-id roster with 'monoceros' in slot 0 (and clear beta3.campaign); tap NEW CAMPAIGN through the sign sheet; wait for game.scene.isActive('battle'); assert game.scene.getScene('battle').beast.id === 'monoceros'.
- assert beastC.list.length ≤ 40 sampled at N×40+700 ms (N = 18 stars; expected 29, glints excluded) and ≤ 30 in the home showcase (expected 29).
- zero Runtime.exceptionThrown over 20 s AND the frame counter still advances; one strike lands.
- `SS_BEAST_T(SS_BEASTS.monoceros)` returns a non-empty string (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) and `Object.keys(SS_LANGS).every(l => l==='en' || (SS_STR[l].beast && SS_STR[l].beast.monoceros))` (or boot once per ?lang=xx).
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.