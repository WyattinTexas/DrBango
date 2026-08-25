READY TODAY (PLAIN COPY — the game can draw this today; the waltz and the moon-bolts arrive with SS-SKY-01 (idle orbit→ripple)). Fire any time.
# SS-OPP-earth — EARTH · THE BLUE MARBLE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
THE BLUE MARBLE as a mini lvl 2 opponent: 7 stars, 4 lines, 1 eye; idle ripple, attack slam.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[1].minis @239-265: append 'earth' — Wyatt's seat to confirm.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · EARTH · THE BLUE MARBLE · opponent (mini lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 16 battle / 16 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
earth: {
  name: 'EARTH', title: 'THE BLUE MARBLE', tier: 'mini', lvl: 2, tint: 0x6fa8dc, eye: 0xe2ecff,
  stars: [[0,0],[34,0],[0,-66],[-84,40],[-46,60],[46,60],[84,40]],
  edges: [[0,2],[3,4],[4,5],[5,6]], eyes: [[-8,7]],
  fx: { idle:'ripple', atk:'slam' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   earth: 'THE BLUE MARBLE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | earth | EARTH (the blue marble) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `earth: 'THE BLUE MARBLE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: before load, set localStorage beta3.camproster to a 20-id roster with 'earth' in slot 0 (and clear beta3.campaign); tap NEW CAMPAIGN through the sign sheet; wait for game.scene.isActive('battle'); assert game.scene.getScene('battle').beast.id === 'earth'.
- assert beastC.list.length ≤ 40 sampled at N×40+700 ms (N = 7 stars; expected 16, glints excluded) and ≤ 30 in the home showcase (expected 16).
- zero Runtime.exceptionThrown over 20 s AND the frame counter still advances; one strike lands.
- `SS_BEAST_T(SS_BEASTS.earth)` returns a non-empty string (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) and `Object.keys(SS_LANGS).every(l => l==='en' || (SS_STR[l].beast && SS_STR[l].beast.earth))` (or boot once per ?lang=xx).
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.